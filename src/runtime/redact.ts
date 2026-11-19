import type { ClearerrConfig } from '../shared/types'
import process from 'node:process'
import { loadClearerrConfig } from '../shared/config'

export const REDACTED_VALUE = '[redacted]'

export function getRedactKeys(
  envRedact = process.env.CLEARERR_REDACT,
  config?: ClearerrConfig,
): string[] {
  const envKeys = typeof envRedact === 'string'
    ? envRedact.split(',').map(key => key.trim()).filter(Boolean)
    : []
  const configKeys = config?.redact ?? loadClearerrConfig().redact

  const allKeys = [
    ...envKeys,
    ...configKeys,
  ]

  const uniqueKeys = new Set(allKeys)

  return [...uniqueKeys]
}

export function redactValue(value: unknown, keys?: readonly string[]): unknown {
  const redactKeys = keys ?? getRedactKeys()
  return redactRecordValue(value, new Set(redactKeys), new WeakSet<object>())
}

export function redactContext<T>(context: T, keys?: readonly string[]): T {
  return redactValue(context, keys) as T
}

function redactRecordValue(value: unknown, keys: Set<string>, seen: WeakSet<object>): unknown {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  if (seen.has(value)) {
    return value
  }
  seen.add(value)

  if (Array.isArray(value)) {
    return value.map(item => redactRecordValue(item, keys, seen))
  }

  const redacted: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    redacted[key] = keys.has(key)
      ? REDACTED_VALUE
      : redactRecordValue(item, keys, seen)
  }
  return redacted
}
