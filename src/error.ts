export type Retryable = 'no' | 'once' | 'backoff'
export type Severity = 'fatal' | 'recoverable' | 'warning'

export interface ErrorLocation {
  file: string
  line: number
  column?: number
  function?: string
  phase?: string
}

export interface ErrorFix {
  hint: string
  docs?: string
  retryable: Retryable
}

export interface ClearerrErrorJSON {
  schemaVersion: 1
  code: string
  message: string
  location: ErrorLocation
  context: Record<string, unknown>
  cause?: ClearerrErrorJSON | SerializedError
  fix?: ErrorFix
  severity: Severity
  traceId?: string
  timestamp: string
}

export interface SerializedError {
  name: string
  message: string
  stack?: string
}

export interface ClearerrErrorSpec {
  code: string
  message: string
  context?: Record<string, unknown>
  fix?: ErrorFix
  severity?: Severity
  phase?: string
  location?: Partial<ErrorLocation>
}

export interface FormatForAgentOptions {
  maxDepth?: number
  maxBytes?: number
}

export class ClearerrError extends Error {
  readonly code: string
  readonly context: Record<string, unknown>
  readonly fix?: ErrorFix
  readonly severity: Severity
  readonly location: ErrorLocation
  readonly traceId?: string
  readonly timestamp: string
  cause?: Error | ClearerrError

  constructor(spec: ClearerrErrorSpec, opts?: { cause?: unknown }) {
    super(spec.message)
    this.name = 'ClearerrError'
    this.code = spec.code
    this.context = spec.context ?? {}
    this.fix = spec.fix
    this.severity = spec.severity ?? 'fatal'
    this.location = {
      file: spec.location?.file ?? 'unknown',
      line: spec.location?.line ?? 0,
      ...(spec.location?.column !== undefined
        ? { column: spec.location.column }
        : {}),
      ...(spec.location?.function !== undefined
        ? { function: spec.location.function }
        : {}),
      ...(spec.location?.phase !== undefined
        ? { phase: spec.location.phase }
        : {}),
    }
    if (spec.phase !== undefined) {
      this.location.phase = spec.phase
    }
    this.traceId = undefined
    this.timestamp = new Date().toISOString()

    if (opts?.cause !== undefined) {
      if (opts.cause instanceof Error || opts.cause instanceof ClearerrError) {
        this.cause = opts.cause
      }
      else {
        this.cause = new Error(String(opts.cause))
      }
    }

    Object.setPrototypeOf(this, new.target.prototype)
  }

  toJSON(): ClearerrErrorJSON {
    return {
      schemaVersion: 1,
      code: this.code,
      message: this.message,
      location: { ...this.location },
      context: { ...this.context },
      ...(this.cause
        ? {
            cause: serializeCause(this.cause),
          }
        : {}),
      ...(this.fix
        ? {
            fix: { ...this.fix },
          }
        : {}),
      severity: this.severity,
      ...(this.traceId
        ? { traceId: this.traceId }
        : {}),
      timestamp: this.timestamp,
    }
  }
}

export function err(spec: ClearerrErrorSpec, opts?: { cause?: unknown }): ClearerrError {
  return new ClearerrError(spec, opts)
}

export function formatForAgent(e: unknown, opts?: FormatForAgentOptions): string {
  const maxBytes = opts?.maxBytes ?? 8192
  const value = normalizeForAgent(e, opts?.maxDepth ?? 5, new WeakSet<object>())
  const json = JSON.stringify(value)
  if (json === undefined) {
    return 'null'
  }
  if (json.length <= maxBytes) {
    return json
  }
  return `${json.slice(0, Math.max(0, maxBytes - 3))}...`
}

export function formatForHuman(e: unknown): string {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`
  }
  return JSON.stringify(e)
}

export function installAgentHandler(_opts?: {
  stream?: 'stderr' | 'stdout'
  format?: 'agent' | 'json' | 'human'
}): void {
  // Minimal no-op implementation for T0.2.
}

function serializeCause(value: unknown): ClearerrErrorJSON | SerializedError {
  if (value instanceof ClearerrError) {
    return value.toJSON()
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(value.stack
        ? { stack: value.stack }
        : {}),
    }
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value)) as SerializedError
  }
  return {
    name: 'Error',
    message: String(value),
  }
}

function normalizeForAgent(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth <= 0) {
    return '[truncated]'
  }

  if (value === null || value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (value instanceof Error) {
    if (value instanceof ClearerrError) {
      return value.toJSON()
    }
    return {
      name: value.name,
      message: value.message,
      ...(value.stack
        ? { stack: value.stack }
        : {}),
    }
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeForAgent(item, depth - 1, seen))
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      return '[Circular]'
    }
    seen.add(value as object)

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeForAgent(item, depth - 1, seen),
      ]),
    )
  }

  return String(value)
}
