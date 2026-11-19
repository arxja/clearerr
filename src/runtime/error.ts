import type {
  ClearerrErrorJSON,
  ClearerrErrorSpec,
  ErrorFactoryOptions,
  ErrorFix,
  ErrorLocation,
  FormatForAgentOptions,
  SerializedError,
  Severity,
} from '../shared/types'
import { validateErrorCode } from '../shared/registry'
import { captureLocation } from './location'
import { redactContext } from './redact'
import { serializeClearerrError } from './serialize'

export class ClearerrError extends Error {
  readonly code: string
  readonly context: Record<string, unknown>
  readonly fix?: ErrorFix
  readonly severity: Severity
  readonly location: ErrorLocation
  readonly traceId?: string
  readonly timestamp: string
  cause?: Error | ClearerrError

  constructor(spec: ClearerrErrorSpec, opts?: ErrorFactoryOptions) {
    validateErrorCode(spec.code)
    super(spec.message)

    this.name = 'ClearerrError'
    this.code = spec.code
    this.context = redactContext(spec.context ?? {})
    this.fix = spec.fix
    this.severity = spec.severity ?? 'fatal'
    this.location = {
      file: spec.location?.file ?? 'unknown',
      line: spec.location?.line ?? 0,
    }

    const capturedLocation = captureLocation(this.stack)
    this.location = {
      file: spec.location?.file ?? capturedLocation.file,
      line: spec.location?.line ?? capturedLocation.line,
    }

    const capturedFrameMatches = capturedLocation.file === this.location.file
      && capturedLocation.line === this.location.line

    if (spec.location?.column !== undefined) {
      this.location.column = spec.location.column
    }
    else if (capturedFrameMatches && capturedLocation.column !== undefined) {
      this.location.column = capturedLocation.column
    }

    if (spec.location?.function !== undefined) {
      this.location.function = spec.location.function
    }
    else if (capturedFrameMatches && capturedLocation.function !== undefined) {
      this.location.function = capturedLocation.function
    }

    if (spec.location?.phase !== undefined) {
      this.location.phase = spec.location.phase
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
    return serializeClearerrError(this)
  }
}

export function err(spec: ClearerrErrorSpec, opts?: ErrorFactoryOptions): ClearerrError {
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

function normalizeForAgent(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth <= 0) {
    return '[truncated]'
  }

  if (
    value === null
    || value === undefined
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (value instanceof Error) {
    if (value instanceof ClearerrError) {
      return value.toJSON()
    }

    const serialized: SerializedError = {
      name: value.name,
      message: value.message,
    }

    if (value.stack) {
      serialized.stack = value.stack
    }

    return serialized
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
