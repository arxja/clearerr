import type { ClearerrConfig } from './types'
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'

export const DEFAULT_CLEARERR_CONFIG: ClearerrConfig = { redact: [] }

export function parseClearerrConfig(value: unknown): ClearerrConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Invalid .clearerrrc.json: expected a JSON object')
  }

  const record = value as Record<string, unknown>
  if (record.redact === undefined) {
    return { ...DEFAULT_CLEARERR_CONFIG }
  }

  if (!Array.isArray(record.redact) || record.redact.some(key => typeof key !== 'string')) {
    throw new TypeError('Invalid .clearerrrc.json: "redact" must be an array of strings')
  }

  return { redact: record.redact as string[] }
}

export function loadClearerrConfig(cwd = process.cwd()): ClearerrConfig {
  const path = `${cwd.replace(/[\\/]$/, '')}/.clearerrrc.json`
  if (!existsSync(path)) {
    return { ...DEFAULT_CLEARERR_CONFIG }
  }

  try {
    return parseClearerrConfig(JSON.parse(readFileSync(path, 'utf8')))
  }
  catch (error) {
    if (error instanceof SyntaxError) {
      throw new TypeError(`Invalid JSON in ${path}: ${error.message}`)
    }
    throw error
  }
}
