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
  cause?: ClearerrErrorJSON | SerializedError
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

export interface ErrorFactoryOptions {
  cause?: unknown
}
