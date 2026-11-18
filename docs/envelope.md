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

## Security model

The envelope is for **agent consumption** in server, CLI, CI, and developer
environments (stderr, logs, tool output). It is **not** for end-user
browser consoles or user-facing error pages.

### Safe for end users
- `code` — internal taxonomy, low sensitivity; the app can map it to user copy
- `message` — you choose it; write user-appropriate text or override at the boundary
- `severity`, `timestamp` — safe

### NOT safe for end users
- `context` — may contain secrets (values, not just keys), internal endpoints,
  topology (pool sizes, timeouts), or PII
- `fix.hint` — reveals internal reasoning about failure modes
- `cause` chain — reveals service topology and internal dependencies
- `location` — already exposed via stack in browsers, but strip for cleanliness

### Redaction is a backstop, not a policy
`CLEARERR_REDACT` (T1.6) catches known-sensitive **key names**. It cannot catch
sensitive **values** (`{ endpoint: "http://10.0.0.5" }`), topology, or PII.
Do not rely on redaction alone to make `context` safe for any audience.

### Format function responsibilities
- `formatForAgent(e)` — single-line JSON, for agents and tooling. Dev / CI /
  server observability only. Never call from browser code.
- `formatForHuman(e)` — multi-line text for **developers** reading terminal
  output or logs. Includes `code`, `message`, `severity`, `timestamp`,
  `context`, `fix`, `cause`, `location`, and stack. NOT user-facing.
- User-facing output is the **application's** responsibility: read `code` and
  `message`, map to user copy, decide what to show. The library does not
  render end-user error UI and does not ship a `formatForUser`.

### Browser guidance
- Do not throw `ClearerrError` from browser production code paths. DevTools
  exposes the raw object regardless of `toJSON` configuration.
- `installAgentHandler` is Node-only (writes to stderr) and MUST not be
  installed in browser bundles.
- `formatForAgent` is for server, CLI, CI, and agent sandboxes.

### Error reporting services (Sentry, DataDog, etc.)
These serialise enumerable properties. If you forward `ClearerrError` to a
third party, `context`, `fix`, and `cause` will be transmitted. Strip or
redact at the transport layer before forwarding if those fields contain
sensitive data.

### "Dev-only" pattern
If you want envelopes only in non-production environments, gate at the
**call site**, not the library:

```ts
const fail = process.env.NODE_ENV === "production"
  ? () => { throw new Error("Internal error") }
  : () => { throw err({ code: "...", ... }) }
```

Note: keeping the envelope in **production server logs** is recommended —
ops and agents still need it. The concern is only browser / end-user surfaces.