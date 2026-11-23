import type { Finding } from './findings'
import type { MessageSite } from './sites'
import { relative } from 'node:path'
import process from 'node:process'
import { rules as builtinRules } from './rules'

/** Information a rule needs beyond the site itself. */
export interface RuleContext {
  /** Absolute path of the project root. */
  root: string
  /** Absolute path of the file that contains the site. */
  file: string
  /** File path relative to `root`, using forward slashes. */
  relativeFile: string
  /** True when the file is a test file (`*.test.*` or `*.spec.*`). */
  isTestFile: boolean
  /**
   * Globs for files that sit at an application boundary, relative to `root`.
   * Boundary-specific rules are inert when this is missing or empty.
   */
  boundaries?: readonly string[]
}

/** A rule inspects one message site and returns zero or more findings. */
export type Rule = (site: MessageSite, ctx: RuleContext) => Finding[]

export interface RunRulesOptions {
  /** Rules to run. Defaults to the built-in registry. */
  rules?: readonly Rule[]
  /** Project root used to build relative paths. Defaults to the process cwd. */
  cwd?: string
  /** Globs for boundary files, relative to `cwd`. */
  boundaries?: readonly string[]
}

const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/

/** Returns true for test and spec source files, which rules usually ignore. */
export function isTestFile(file: string): boolean {
  return TEST_FILE_PATTERN.test(file)
}

/** Builds the context passed to every rule for one site. */
export function createRuleContext(
  site: MessageSite,
  cwd = process.cwd(),
  boundaries?: readonly string[],
): RuleContext {
  const ctx: RuleContext = {
    root: cwd,
    file: site.file,
    relativeFile: relative(cwd, site.file).replaceAll('\\', '/'),
    isTestFile: isTestFile(site.file),
  }

  if (boundaries !== undefined)
    ctx.boundaries = boundaries

  return ctx
}

function compareFindings(a: Finding, b: Finding): number {
  return a.file.localeCompare(b.file)
    || a.line - b.line
    || a.column - b.column
    || a.ruleId.localeCompare(b.ruleId)
    || a.message.localeCompare(b.message)
}

/**
 * Runs every rule against every site. Output is sorted by file, position,
 * rule ID, and message so scan reports are deterministic.
 */
export function runRules(
  sites: readonly MessageSite[],
  options: RunRulesOptions = {},
): Finding[] {
  const rules = options.rules ?? builtinRules
  const cwd = options.cwd ?? process.cwd()
  const findings: Finding[] = []

  for (const site of sites) {
    const ctx = createRuleContext(site, cwd, options.boundaries)

    for (const rule of rules) {
      findings.push(...rule(site, ctx))
    }
  }

  return findings.sort(compareFindings)
}
