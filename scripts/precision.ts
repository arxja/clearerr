import type { MessageSite, RunRulesOptions } from '../src/linter'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { extractMessageSites, loadCodeRegistry, runRules } from '../src/linter'

const RULE_IDS = [
  'no-bare-throw',
  'require-code',
  'require-context',
  'preserve-cause',
  'require-fix-hint',
  'stable-codes',
] as const

type PrecisionRuleId = typeof RULE_IDS[number]

const MESSAGES_FILE = 'messages.jsonl'
const CONFIG_FILE = 'golden.config.json'

export const defaultGoldenDir = fileURLToPath(new URL('../test/golden', import.meta.url))

interface GoldenLabel {
  message: string
  expected: readonly PrecisionRuleId[]
}

interface GoldenConfig {
  boundaries?: readonly string[]
}

export interface RulePrecision {
  ruleId: string
  truePositives: number
  falsePositives: number
  precision: number
}

export interface PrecisionReport {
  labels: number
  sites: number
  findings: number
  /** Sites that no label covers. */
  unlabeled: readonly string[]
  /** Labels that no site matches. */
  missing: readonly string[]
  /** Message literals that appear on more than one site. */
  duplicated: readonly string[]
  rows: readonly RulePrecision[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseLabel(value: unknown, line: number, path: string): GoldenLabel {
  if (!isRecord(value))
    throw new TypeError(`${path}:${line}: expected a JSON object`)

  const { message, expected } = value

  if (typeof message !== 'string' || message.length === 0)
    throw new TypeError(`${path}:${line}: "message" must be a non-empty string`)

  const isRuleId = (rule: unknown): rule is PrecisionRuleId =>
    typeof rule === 'string' && (RULE_IDS as readonly string[]).includes(rule)

  if (!Array.isArray(expected) || expected.some(rule => !isRuleId(rule))) {
    throw new TypeError(`${path}:${line}: "expected" must be an array of known rule IDs`)
  }

  return {
    message,
    expected,
  }
}

function parseLabels(text: string, path: string): GoldenLabel[] {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({
      line: line.trim(),
      number: index + 1,
    }))
    .filter(entry => entry.line.length > 0)
    .map(entry => parseLabel(JSON.parse(entry.line), entry.number, path))
}

function loadConfig(goldenDir: string): GoldenConfig | undefined {
  const path = join(goldenDir, CONFIG_FILE)

  if (!existsSync(path))
    return undefined

  const value: unknown = JSON.parse(readFileSync(path, 'utf8'))

  if (!isRecord(value))
    throw new TypeError(`${path}: expected a JSON object`)

  const { boundaries } = value

  if (boundaries === undefined)
    return {}

  if (!Array.isArray(boundaries) || boundaries.some(boundary => typeof boundary !== 'string'))
    throw new TypeError(`${path}: "boundaries" must be an array of strings`)

  return { boundaries: boundaries as string[] }
}

function locationKey(site: Pick<MessageSite, 'file' | 'line' | 'column'>): string {
  return `${site.file}\0${site.line}\0${site.column}`
}

function describeSite(site: MessageSite): string {
  return site.messageLiteral ?? `${site.file}:${site.line}:${site.column}`
}

function collectSites(sites: readonly MessageSite[]): {
  sitesByMessage: Map<string, MessageSite>
  sitesByLocation: Map<string, MessageSite>
  unlabeled: string[]
  duplicated: string[]
} {
  const sitesByMessage = new Map<string, MessageSite>()
  const sitesByLocation = new Map<string, MessageSite>()
  const unlabeled: string[] = []
  const duplicated: string[] = []

  for (const site of sites) {
    sitesByLocation.set(locationKey(site), site)

    if (site.messageLiteral === undefined) {
      unlabeled.push(describeSite(site))
      continue
    }

    if (sitesByMessage.has(site.messageLiteral)) {
      duplicated.push(site.messageLiteral)
      continue
    }

    sitesByMessage.set(site.messageLiteral, site)
  }

  return {
    sitesByMessage,
    sitesByLocation,
    unlabeled,
    duplicated,
  }
}

function createRows(): Map<string, RulePrecision> {
  return new Map(RULE_IDS.map(ruleId => [
    ruleId,
    {
      ruleId,
      truePositives: 0,
      falsePositives: 0,
      precision: 1,
    },
  ]))
}

function precisionOf(row: RulePrecision): number {
  const predicted = row.truePositives + row.falsePositives

  return predicted === 0
    ? 1
    : row.truePositives / predicted
}

/** Measures per-rule precision against the labeled golden messages. */
export function measurePrecision(goldenDir = defaultGoldenDir): PrecisionReport {
  const labelsPath = join(goldenDir, MESSAGES_FILE)
  const labels = parseLabels(readFileSync(labelsPath, 'utf8'), labelsPath)
  const labelsByMessage = new Map(labels.map(label => [label.message, label]))
  const config = loadConfig(goldenDir)
  const codeRegistry = loadCodeRegistry(goldenDir)
  const sites = extractMessageSites({ cwd: goldenDir })
  const { sitesByMessage, sitesByLocation, unlabeled, duplicated } = collectSites(sites)

  const missing = labels
    .filter(label => !sitesByMessage.has(label.message))
    .map(label => label.message)

  const runOptions: RunRulesOptions = { cwd: goldenDir }

  if (config?.boundaries !== undefined)
    runOptions.boundaries = config.boundaries
  if (codeRegistry !== undefined)
    runOptions.codeRegistry = codeRegistry

  const findings = runRules(sites, runOptions)
  const rows = createRows()

  for (const finding of findings) {
    const row = rows.get(finding.ruleId)

    if (row === undefined)
      continue

    const site = sitesByLocation.get(locationKey(finding))
    const label = site?.messageLiteral === undefined
      ? undefined
      : labelsByMessage.get(site.messageLiteral)

    if (label?.expected.includes(finding.ruleId as PrecisionRuleId))
      row.truePositives += 1
    else
      row.falsePositives += 1
  }

  const rowsWithPrecision = [
    ...rows.values(),
  ]
    .map(row => ({
      ...row,
      precision: precisionOf(row),
    }))

  return {
    labels: labels.length,
    sites: sites.length,
    findings: findings.length,
    unlabeled,
    missing,
    duplicated,
    rows: rowsWithPrecision,
  }
}

/** Renders the precision table printed by `pnpm precision`. */
export function formatPrecisionReport(report: PrecisionReport): string {
  const lines = [
    `Golden precision: ${report.labels} labels, ${report.sites} sites, ${report.findings} findings`,
    `${'rule'.padEnd(20)}${'TP'.padStart(4)}${'FP'.padStart(4)}${'precision'.padStart(12)}`,
  ]

  if (report.unlabeled.length > 0)
    lines.push(`Unlabeled sites: ${report.unlabeled.join(', ')}`)
  if (report.missing.length > 0)
    lines.push(`Missing sites for labels: ${report.missing.join(', ')}`)
  if (report.duplicated.length > 0)
    lines.push(`Duplicated messages: ${report.duplicated.join(', ')}`)

  for (const row of report.rows) {
    lines.push(
      `${row.ruleId.padEnd(20)}${String(row.truePositives).padStart(4)}${String(row.falsePositives).padStart(4)}${row.precision.toFixed(3).padStart(12)}`,
    )
  }

  return lines.join('\n')
}

const entry = process.argv[1]
const invokedDirectly = entry !== undefined
  && resolve(entry).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()

if (invokedDirectly) {
  const goldenDir = process.argv[2] === undefined
    ? defaultGoldenDir
    : resolve(process.argv[2])

  process.stdout.write(`${formatPrecisionReport(measurePrecision(goldenDir))}\n`)
}
