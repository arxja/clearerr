import type { CliConfig, OutputFormat } from '../config'
import type { FailOn } from '../exit'
import type { ScanReport } from '../reporters/types'
import { existsSync } from 'node:fs'
import { isAbsolute, relative, resolve } from 'node:path'
import process from 'node:process'
import { defineCommand } from 'citty'
import { computeCoverage, extractMessageSites, loadCodeRegistry, runRules } from '../../linter'
import { isFailOn, isOutputFormat, loadCliConfig } from '../config'
import { writeCliError } from '../errors'
import { evaluateExit, resolveFailOn } from '../exit'
import { formatJson } from '../reporters/json'
import { formatTerminal } from '../reporters/terminal'

export interface ScanProjectOptions {
  cwd?: string
  /** Directory or file to scan, relative to `cwd`. Defaults to all of `cwd`. */
  target?: string
  /** Resolved config. Loaded from `cwd` when omitted. */
  config?: CliConfig
}

function isWithinTarget(target: string, file: string): boolean {
  if (file === target)
    return true

  const value = relative(target, file)

  return value.length > 0 && !value.startsWith('..') && !isAbsolute(value)
}

function resolveTsconfig(cwd: string, tsconfig: string): string {
  const path = resolve(cwd, tsconfig)

  if (!existsSync(path)) {
    throw new TypeError(
      `Cannot find tsconfig "${tsconfig}" (resolved to ${path}). Create the file or set "tsconfig" in .clearerrrc.json.`,
    )
  }

  return path
}

/** Loads the project, runs every rule, and scores structured-error coverage. */
export function scanProject(options: ScanProjectOptions = {}): ScanReport {
  const cwd = options.cwd ?? process.cwd()
  const config = options.config ?? loadCliConfig(cwd)
  const tsconfigPath = resolveTsconfig(cwd, config.tsconfig)
  const codeRegistry = loadCodeRegistry(cwd)
  const target = options.target === undefined || options.target === '.'
    ? cwd
    : resolve(cwd, options.target)
  const sites = extractMessageSites({ cwd, tsconfigFilePath: tsconfigPath })
    .filter(site => isWithinTarget(target, site.file))
  const findings = runRules(sites, {
    cwd,
    boundaries: config.boundaries,
    ...(codeRegistry === undefined
      ? {}
      : { codeRegistry }),
  })

  return {
    root: cwd,
    findings,
    coverage: computeCoverage(sites),
  }
}

export interface ScanCommandOptions {
  cwd?: string
  target?: string
  format?: OutputFormat
  ci?: boolean
  failOn?: FailOn
  tsconfig?: string
  coverageThreshold?: number
  color?: boolean
}

export interface ScanCommandResult {
  exitCode: 0 | 1
  /** Why the run failed, empty when it passed. */
  reasons: string[]
  report: ScanReport
  /** Rendered terminal or JSON output, without a trailing newline. */
  output: string
}

function parseFormat(value: string | undefined): OutputFormat | undefined {
  if (value === undefined)
    return undefined

  if (!isOutputFormat(value))
    throw new TypeError(`Invalid --format "${value}". Use "terminal" or "json".`)

  return value
}

function parseFailOn(value: string | undefined): FailOn | undefined {
  if (value === undefined)
    return undefined

  if (!isFailOn(value))
    throw new TypeError(`Invalid --fail-on "${value}". Use "error", "warning", or "none".`)

  return value
}

/** Parses `--coverage` as a ratio between 0 and 1. */
export function parseCoverageThreshold(value: string | undefined): number | undefined {
  if (value === undefined)
    return undefined

  const threshold = Number(value)

  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new TypeError(
      `Invalid --coverage "${value}". Use a ratio between 0 and 1, for example 0.8.`,
    )
  }

  return threshold
}

/**
 * Runs a scan without touching the process output or exit code, so the same
 * logic is used by the command and by tests.
 */
export function runScanCommand(options: ScanCommandOptions = {}): ScanCommandResult {
  const cwd = options.cwd ?? process.cwd()
  const config = loadCliConfig(cwd)
  const report = scanProject({
    cwd,
    ...(options.target === undefined
      ? {}
      : { target: options.target }),
    config: {
      ...config,
      ...(options.tsconfig === undefined
        ? {}
        : { tsconfig: options.tsconfig }),
    },
  })
  const format = options.format ?? config.format
  const ci = options.ci ?? false
  const failOn = resolveFailOn(options.failOn, ci, config.failOn)
  const threshold = options.coverageThreshold ?? config.coverageThreshold
  const checkCoverage = ci || options.coverageThreshold !== undefined
  const evaluation = evaluateExit({
    findings: report.findings,
    coverage: report.coverage,
    failOn,
    ...(checkCoverage && threshold !== undefined
      ? { coverageThreshold: threshold }
      : {}),
  })

  return {
    exitCode: evaluation.code,
    reasons: evaluation.reasons,
    report,
    output: format === 'json'
      ? formatJson(report)
      : formatTerminal(report, options.color === undefined
          ? {}
          : { color: options.color }),
  }
}

export const scanCommand = defineCommand({
  meta: {
    name: 'scan',
    description: 'Lint structured error sites and report structured-error coverage.',
  },
  args: {
    'path': {
      type: 'positional',
      description: 'Directory or file to scan (default: current directory).',
      required: false,
    },
    'format': {
      type: 'string',
      description: 'Output format: terminal or json.',
    },
    'ci': {
      type: 'boolean',
      description: 'Fail on findings at the configured severity threshold.',
      default: false,
    },
    'fail-on': {
      type: 'string',
      description: 'Severity that fails the run: error, warning, or none.',
    },
    'tsconfig': {
      type: 'string',
      description: 'tsconfig used to load sources, relative to the project root.',
    },
    'coverage': {
      type: 'string',
      description: 'Minimum structured-error coverage ratio between 0 and 1.',
    },
  },
  run({ args }) {
    try {
      const result = runScanCommand({
        ...(args.path === undefined
          ? {}
          : { target: args.path }),
        format: parseFormat(args.format),
        ci: args.ci,
        failOn: parseFailOn(args['fail-on']),
        ...(args.tsconfig === undefined
          ? {}
          : { tsconfig: args.tsconfig }),
        ...(args.coverage === undefined
          ? {}
          : {
              coverageThreshold: parseCoverageThreshold(args.coverage),
            }),
      })

      process.stdout.write(`${result.output}\n`)

      for (const reason of result.reasons)
        process.stderr.write(`clearerr: ${reason}\n`)

      process.exitCode = result.exitCode
    }
    catch (error) {
      writeCliError(error)
      process.exitCode = 1
    }
  },
})
