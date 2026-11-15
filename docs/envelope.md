# Envelope spec (locked v1)

Bump schemaVersion to change.

```ts
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
  code: string // ^[A-Z][A-Z0-9_]*$
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
```

```ts
export class ClearerrError extends Error {
  readonly code: string
  readonly context: Record<string, unknown>
  readonly fix?: ErrorFix
  readonly severity: Severity
  readonly location: ErrorLocation
  readonly traceId?: string
  readonly timestamp: string
  cause?: Error | ClearerrError
  constructor(spec: ClearerrErrorSpec, opts?: { cause?: unknown })
  toJSON(): ClearerrErrorJSON
}

export function err(spec: ClearerrErrorSpec, opts?: { cause?: unknown }): ClearerrError
export function formatForAgent(e: unknown, opts?: { maxDepth?: number, maxBytes?: number }): string
export function formatForHuman(e: unknown): string
export function installAgentHandler(opts?: {
  stream?: 'stderr' | 'stdout'
  format?: 'agent' | 'json' | 'human'
}): void
```

## Fixed decisions

- code must exist in clearerr.codes.json
- Location: parse err.stack, skip own frames + node_modules, take first user frame
- Cause chain: depth ≤10, cycle detection via WeakSet
- formatForAgent: single-line JSON, truncated at maxBytes (default 8192), context + stack truncated first
- Redaction: CLEARERR_REDACT env (comma keys) or redact in .clearerrrc.json
- installAgentHandler default from CLEARERR_FORMAT env, else agent

## Example envelope (Flow B)

```json
{ "schemaVersion": 1, "code": "CONFIG_INVALID_PORT", "message": "Invalid port 99999", "location": { "file": "src/config.ts", "line": 42, "phase": "validate" }, "context": { "port": 99999, "expected": "1-65535" }, "fix": { "hint": "Set PORT to 1-65535", "retryable": "no" }, "severity": "fatal", "timestamp": "2026-11-15T..." }
```
