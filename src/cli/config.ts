import type { FailOn } from './exit'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { z } from 'zod'

/** File that holds CLI and runtime configuration. */
export const CONFIG_FILENAME = '.clearerrrc.json'

export const OUTPUT_FORMATS = ['terminal', 'json'] as const
export type OutputFormat = typeof OUTPUT_FORMATS[number]

export const FAIL_ON_VALUES = ['error', 'warning', 'none'] as const

/** Fully resolved `.clearerrrc.json`. Every field has a default. */
export interface CliConfig {
  /** Context keys to redact at runtime. */
  redact: string[]
  /** Globs for application boundary files, relative to the project root. */
  boundaries: string[]
  /** Path to the tsconfig used to load sources, relative to the project root. */
  tsconfig: string
  /** Default reporter for `clearerr scan`. */
  format: OutputFormat
  /** Default severity threshold used by `clearerr scan --ci`. */
  failOn: FailOn
  /** Minimum structured-error coverage enforced by `--ci`, between 0 and 1. */
  coverageThreshold?: number
}

const configSchema = z.strictObject({
  redact: z.array(z.string()).default([]),
  boundaries: z.array(z.string()).default([]),
  tsconfig: z.string().min(1).default('tsconfig.json'),
  format: z.enum(OUTPUT_FORMATS).default('terminal'),
  failOn: z.enum(FAIL_ON_VALUES).default('error'),
  coverageThreshold: z.number().min(0).max(1).optional(),
})

function formatIssues(error: z.ZodError, source: string): string {
  const details = error.issues.map((issue) => {
    const path = issue.path.length === 0
      ? '<root>'
      : issue.path.join('.')
    return `  - ${path}: ${issue.message}`
  })

  return `Invalid ${CONFIG_FILENAME} (${source}):\n${details.join('\n')}`
}

function parseWithSchema(value: unknown, source: string): CliConfig {
  const result = configSchema.safeParse(value)

  if (!result.success)
    throw new TypeError(formatIssues(result.error, source))

  return result.data
}

/** The config produced by an empty `.clearerrrc.json`. */
export function defaultCliConfig(): CliConfig {
  return parseWithSchema({}, CONFIG_FILENAME)
}

/** Parses and validates a full `.clearerrrc.json` document. */
export function parseFull(value: unknown, source = CONFIG_FILENAME): CliConfig {
  return parseWithSchema(value, source)
}

/** Loads `.clearerrrc.json` from `cwd`, falling back to defaults. */
export function loadCliConfig(cwd = process.cwd()): CliConfig {
  const path = join(cwd, CONFIG_FILENAME)

  if (!existsSync(path))
    return defaultCliConfig()

  let value: unknown

  try {
    value = JSON.parse(readFileSync(path, 'utf8'))
  }
  catch (error) {
    if (error instanceof SyntaxError)
      throw new TypeError(`Invalid JSON in ${path}: ${error.message}`)

    throw error
  }

  return parseFull(value, path)
}

export function isOutputFormat(value: string): value is OutputFormat {
  return (OUTPUT_FORMATS as readonly string[]).includes(value)
}

export function isFailOn(value: string): value is FailOn {
  return (FAIL_ON_VALUES as readonly string[]).includes(value)
}
