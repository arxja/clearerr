import type {
  ClearerrErrorJSON,
  ClearerrErrorSpec,
  SerializedError,
} from '../shared/types'

const MAX_CAUSE_DEPTH = 10

interface SerializableClearerrError extends ClearerrErrorSpec {
  readonly name: string
  readonly code: string
  readonly context: Record<string, unknown>
  readonly location: ClearerrErrorJSON['location']
  readonly severity: ClearerrErrorJSON['severity']
  readonly timestamp: string
  readonly traceId?: string
  readonly message: string
  readonly cause?: Error | SerializableClearerrError
}

export function serializeClearerrError(error: SerializableClearerrError): ClearerrErrorJSON {
  const seen = new WeakSet<object>()
  seen.add(error as object)
  return serializeClearerrErrorAtDepth(error, seen, 0)
}

function serializeClearerrErrorAtDepth(
  error: SerializableClearerrError,
  seen: WeakSet<object>,
  depth: number,
): ClearerrErrorJSON {
  const json: ClearerrErrorJSON = {
    schemaVersion: 1,
    code: error.code,
    message: error.message,
    location: { ...error.location },
    context: { ...error.context },
    severity: error.severity,
    timestamp: error.timestamp,
  }

  if (error.fix) {
    json.fix = { ...error.fix }
  }

  if (error.traceId) {
    json.traceId = error.traceId
  }

  if (error.cause) {
    json.cause = serializeCause(error.cause, seen, depth + 1)
  }

  return json
}

function serializeCause(
  value: unknown,
  seen: WeakSet<object> = new WeakSet<object>(),
  depth = 0,
): ClearerrErrorJSON | SerializedError {
  if (depth >= MAX_CAUSE_DEPTH) {
    return truncatedCause()
  }

  if (typeof value !== 'object' || value === null) {
    return {
      name: 'Error',
      message: String(value),
    }
  }

  if (seen.has(value)) {
    return {
      name: 'CycleDetected',
      message: 'Cause chain contains a cycle',
    }
  }

  seen.add(value)

  if (isClearerrError(value)) {
    const serialized = serializeClearerrErrorAtDepth(value, seen, depth)
    seen.delete(value)
    return serialized
  }

  if (value instanceof Error) {
    const serialized = serializeNativeError(value)
    seen.delete(value)
    return serialized
  }

  seen.delete(value)
  return serializeRecordCause(value)
}

function truncatedCause(): SerializedError {
  return {
    name: 'Truncated',
    message: 'Cause chain exceeds maximum depth of 10',
  }
}

function serializeNativeError(value: Error): SerializedError {
  const serialized: SerializedError = {
    name: value.name,
    message: value.message,
  }

  if (value.stack) {
    serialized.stack = value.stack
  }

  return serialized
}

function serializeRecordCause(value: object): SerializedError {
  if (!('name' in value) && !('message' in value)) {
    return {
      name: 'Error',
      message: JSON.stringify(value) ?? String(value),
    }
  }

  const record = value as Record<string, unknown>
  const serialized: SerializedError = {
    name: typeof record.name === 'string'
      ? record.name
      : 'Error',
    message: typeof record.message === 'string'
      ? record.message
      : String(record.message ?? ''),
  }

  if (typeof record.stack === 'string') {
    serialized.stack = record.stack
  }

  return serialized
}

function isClearerrError(value: object): value is SerializableClearerrError {
  if (!('name' in value)
    || !('code' in value)
    || !('message' in value)
    || !('timestamp' in value)
    || !('location' in value)
    || !('context' in value)
    || !('severity' in value)) {
    return false
  }

  return value.name === 'ClearerrError'
    && typeof value.code === 'string'
    && typeof value.message === 'string'
    && typeof value.timestamp === 'string'
    && typeof value.location === 'object'
    && typeof value.context === 'object'
    && typeof value.severity === 'string'
}
