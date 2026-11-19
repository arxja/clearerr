import type {
  FormatForAgentOptions,
  SerializedError,
} from '../shared/types'

const DEFAULT_MAX_BYTES = 8192

export function formatForAgent(e: unknown, opts?: FormatForAgentOptions): string {
  const maxBytes = normalizeMaxBytes(opts?.maxBytes)
  const envelope = normalizeEnvelope(e, opts?.maxDepth ?? 5, new WeakSet<object>())

  if (maxBytes === 0) {
    return '{}'
  }

  const full = JSON.stringify(envelope)
  if (full !== undefined && byteLength(full) <= maxBytes) {
    return full
  }

  if (typeof envelope === 'object' && envelope !== null) {
    const truncated = truncateEnvelope(envelope as Record<string, unknown>, maxBytes)
    const result = JSON.stringify(truncated)
    if (result !== undefined && byteLength(result) <= maxBytes) {
      return result
    }
  }

  return '{}'
}

function normalizeEnvelope(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (depth <= 0) {
    return '[truncated]'
  }
  if (value === null || value === undefined) {
    return value
  }
  if (
    typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value
  }
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (typeof value !== 'object') {
    return String(value)
  }

  if (seen.has(value)) {
    return '[Circular]'
  }
  seen.add(value)

  if (value instanceof Error) {
    const clearerr = value as Error & { toJSON?: unknown }
    if (typeof clearerr.toJSON === 'function') {
      const serialized = clearerr.toJSON()
      seen.delete(value)
      return normalizeEnvelope(serialized, depth - 1, seen)
    }

    const serialized: SerializedError = {
      name: value.name,
      message: value.message,
    }
    if (value.stack) {
      serialized.stack = value.stack
    }
    seen.delete(value)
    return serialized
  }

  if (Array.isArray(value)) {
    const result = value.map(item => normalizeEnvelope(item, depth - 1, seen))
    seen.delete(value)
    return result
  }

  const result = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      normalizeEnvelope(item, depth - 1, seen),
    ]),
  )
  seen.delete(value)
  return result
}

function truncateEnvelope(
  envelope: Record<string, unknown>,
  maxBytes: number,
): Record<string, unknown> {
  const truncated: Record<string, unknown> = { ...envelope }

  // Context and cause/stack content are the first data to drop.
  truncated.context = {}
  delete truncated.cause
  truncateStacks(truncated)

  let result = JSON.stringify(truncated)
  if (result !== undefined && byteLength(result) <= maxBytes) {
    return truncated
  }

  // Preserve envelope identity fields, then shorten user-controlled text.
  if (typeof truncated.message === 'string') {
    truncated.message = '[truncated]'
  }
  const fix = truncated.fix
  if (typeof fix === 'object' && fix !== null) {
    truncated.fix = { ...(fix as Record<string, unknown>), hint: '[truncated]' }
  }
  delete truncated.traceId

  result = JSON.stringify(truncated)
  if (result !== undefined && byteLength(result) <= maxBytes) {
    return truncated
  }

  // Last-resort envelope that remains valid JSON and prioritizes code fields.
  const minimal: Record<string, unknown> = {}
  for (const key of [
    'schemaVersion',
    'code',
    'message',
    'severity',
    'timestamp',
  ]) {
    if (key in truncated) {
      minimal[key] = truncated[key]
    }
  }
  minimal.location = { file: 'unknown', line: 0 }
  minimal.context = {}

  const minimalJson = JSON.stringify(minimal)
  if (minimalJson !== undefined && byteLength(minimalJson) <= maxBytes) {
    return minimal
  }

  return {}
}

function truncateStacks(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      truncateStacks(item)
    }
    return
  }

  const record = value as Record<string, unknown>
  delete record.stack
  for (const item of Object.values(record)) {
    truncateStacks(item)
  }
}

function normalizeMaxBytes(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_MAX_BYTES
  }
  return Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : DEFAULT_MAX_BYTES
}

function byteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).byteLength
  }
  return value.length
}
