import type {
  ClearerrErrorJSON,
  ClearerrErrorSpec,
  ErrorFactoryOptions,
  ErrorFix,
  ErrorLocation,
  Severity,
} from '../shared/types'
import { validateErrorCode } from '../shared/registry'
import { captureLocation } from './location'
import { redactContext, redactContextSafely } from './redact'
import { serializeClearerrError } from './serialize'

export { formatForAgent, formatForHuman } from './format'

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
    try {
      this.context = redactContext(spec.context ?? {})
    }
    catch {
      this.context = redactContextSafely(spec.context ?? {})
    }
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

export function installAgentHandler(_opts?: {
  stream?: 'stderr' | 'stdout'
  format?: 'agent' | 'json' | 'human'
}): void {
  // Minimal no-op implementation for T0.2.
}
