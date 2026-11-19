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
  return redactRecordValue(value, new Set(redactKeys), new WeakMap<object, unknown>())
}

export function redactContext<T>(context: T, keys?: readonly string[]): T {
  return redactValue(context, keys) as T
}

export function redactContextSafely<T>(context: T): T {
  return redactAllValues(context, new WeakMap<object, unknown>()) as T
}

function isRecord(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function redactRecordValue(
  value: unknown,
  keys: Set<string>,
  replacements: WeakMap<object, unknown>,
): unknown {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  const existing = replacements.get(value)
  if (existing !== undefined) {
    return existing
  }

  if (Array.isArray(value)) {
    const redacted: unknown[] = []
    replacements.set(value, redacted)
    redacted.push(...value.map(item => redactRecordValue(item, keys, replacements)))
    return redacted
  }

  if (!isRecord(value)) {
    replacements.set(value, value)
    return value
  }

  const redacted: Record<string, unknown> = {}
  replacements.set(value, redacted)
  for (const [key, item] of Object.entries(value)) {
    redacted[key] = keys.has(key)
      ? REDACTED_VALUE
      : redactRecordValue(item, keys, replacements)
  }
  return redacted
}

function redactAllValues(value: unknown, replacements: WeakMap<object, unknown>): unknown {
  if (typeof value !== 'object' || value === null) {
    return REDACTED_VALUE
  }

  const existing = replacements.get(value)
  if (existing !== undefined) {
    return existing
  }

  if (Array.isArray(value)) {
    const redacted: unknown[] = []
    replacements.set(value, redacted)
    redacted.push(...value.map(item => redactAllValues(item, replacements)))
    return redacted
  }

  if (!isRecord(value)) {
    replacements.set(value, REDACTED_VALUE)
    return REDACTED_VALUE
  }

  const redacted: Record<string, unknown> = {}
  replacements.set(value, redacted)
  for (const [key, item] of Object.entries(value)) {
    redacted[key] = redactAllValues(item, replacements)
  }
  return redacted
}
