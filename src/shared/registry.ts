import type { Retryable, Severity } from './types'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

export const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/

/** File that holds the project error-code registry. */
export const CODE_REGISTRY_FILENAME = 'clearerr.codes.json'

/** Optional documentation attached to one registered error code. */
export interface ErrorCodeMetadata {
  description?: string
  severity?: Severity
  retryable?: Retryable
  docs?: string
}

/**
 * Known error codes mapped to their metadata. An empty map is a valid
 * registry; a missing registry is represented by `undefined`.
 */
export type CodeRegistry = ReadonlyMap<string, ErrorCodeMetadata>

const METADATA_KEYS: ReadonlySet<string> = new Set([
  'description',
  'docs',
  'retryable',
  'severity',
])

const SEVERITY_VALUES: ReadonlySet<string> = new Set([
  'fatal',
  'recoverable',
  'warning',
])

const RETRYABLE_VALUES: ReadonlySet<string> = new Set([
  'no',
  'once',
  'backoff',
])

export function isValidErrorCode(code: string): boolean {
  return typeof code === 'string' && ERROR_CODE_PATTERN.test(code)
}

export function validateErrorCode(code: string): string {
  if (!isValidErrorCode(code)) {
    throw new TypeError(`Invalid Clearerr error code: "${String(code)}". Use ^[A-Z][A-Z0-9_]*$`)
  }

  return code
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
  code: string,
): string | undefined {
  const value = record[key]

  if (value === undefined)
    return undefined

  if (typeof value !== 'string')
    throw new TypeError(`Invalid clearerr.codes.json: "${key}" for code "${code}" must be a string`)

  return value
}

function readOptionalEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  code: string,
  allowed: ReadonlySet<string>,
): T | undefined {
  const value = record[key]

  if (value === undefined)
    return undefined

  if (typeof value !== 'string' || !allowed.has(value)) {
    throw new TypeError(
      `Invalid clearerr.codes.json: "${key}" for code "${code}" must be one of ${[...allowed].join(', ')}`,
    )
  }

  return value as T
}

function parseCodeMetadata(code: string, value: unknown): ErrorCodeMetadata {
  if (!isRecord(value))
    throw new TypeError(`Invalid clearerr.codes.json: metadata for code "${code}" must be an object`)

  for (const key of Object.keys(value)) {
    if (!METADATA_KEYS.has(key))
      throw new TypeError(`Invalid clearerr.codes.json: unknown field "${key}" for code "${code}"`)
  }

  const metadata: ErrorCodeMetadata = {}
  const description = readOptionalString(value, 'description', code)
  const docs = readOptionalString(value, 'docs', code)
  const retryable = readOptionalEnum<Retryable>(value, 'retryable', code, RETRYABLE_VALUES)
  const severity = readOptionalEnum<Severity>(value, 'severity', code, SEVERITY_VALUES)

  if (description !== undefined)
    metadata.description = description
  if (docs !== undefined)
    metadata.docs = docs
  if (retryable !== undefined)
    metadata.retryable = retryable
  if (severity !== undefined)
    metadata.severity = severity

  return metadata
}

/**
 * Parses a `clearerr.codes.json` document: a JSON object that maps every
 * error code to an optional metadata object. See `docs/registry.md`.
 */
export function parseCodeRegistry(value: unknown): CodeRegistry {
  if (!isRecord(value)) {
    throw new TypeError(
      'Invalid clearerr.codes.json: expected a JSON object mapping codes to metadata',
    )
  }

  const registry = new Map<string, ErrorCodeMetadata>()

  for (const [code, metadata] of Object.entries(value)) {
    if (!isValidErrorCode(code)) {
      throw new TypeError(
        `Invalid clearerr.codes.json: "${code}" is not a valid error code (use ^[A-Z][A-Z0-9_]*$)`,
      )
    }

    registry.set(code, parseCodeMetadata(code, metadata))
  }

  return registry
}

/**
 * Loads `clearerr.codes.json` from `cwd`. Returns `undefined` when the file
 * does not exist so registry-backed checks stay inert until opted in.
 */
export function loadCodeRegistry(cwd = process.cwd()): CodeRegistry | undefined {
  const path = join(cwd, CODE_REGISTRY_FILENAME)

  if (!existsSync(path))
    return undefined

  try {
    return parseCodeRegistry(JSON.parse(readFileSync(path, 'utf8')))
  }
  catch (error) {
    if (error instanceof SyntaxError)
      throw new TypeError(`Invalid JSON in ${path}: ${error.message}`)

    throw error
  }
}
