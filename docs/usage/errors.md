# Errors and the envelope

Everything Clearerr does is built on one JSON object. This page defines that
object and explains how to write a spec an agent can act on.

Back to [start here](start-here.md). Related: [Error codes](codes.md),
[Runtime handler](runtime.md), [Consuming envelopes](for-agents.md).

## The envelope

Every `ClearerrError` serializes to this shape (`schemaVersion: 1`, locked):

```json
{
  "schemaVersion": 1,
  "code": "CONFIG_INVALID_PORT",
  "message": "Invalid port 99999",
  "location": { "file": "src/config.ts", "line": 42, "column": 11, "phase": "validate" },
  "context": { "port": 99999, "expected": "1-65535" },
  "cause": { "name": "Error", "message": "connect ECONNREFUSED" },
  "fix": { "hint": "Set PORT to 1-65535", "retryable": "no" },
  "severity": "fatal",
  "timestamp": "2026-11-15T10:00:00.000Z"
}
```

| Field | Required | Meaning |
|---|---|---|
| `schemaVersion` | yes | Always `1` in v1. A change to the wire shape bumps it. |
| `code` | yes | Stable taxonomy key, `^[A-Z][A-Z0-9_]*$`. |
| `message` | yes | Human/agent-readable description. You control it. |
| `location` | yes | Captured from the stack, or supplied in the spec. `file` is normalized to forward slashes and is usually absolute. Falls back to `{ "file": "unknown", "line": 0 }`. |
| `context` | yes | Structured facts needed to diagnose. Serialized as an object; `{}` when omitted. |
| `cause` | no | `ClearerrErrorJSON` for nested Clearerr errors, otherwise `{ name, message, stack? }`. Depth is capped at 10 with cycle detection. |
| `fix` | no | `{ hint, retryable, docs? }`. `hint` and `retryable` are required when `fix` is present. |
| `severity` | yes | `fatal` (default), `recoverable`, or `warning`. |
| `traceId` | no | Reserved. There is no v1 spec field that sets it; it is currently always absent. |
| `timestamp` | yes | ISO-8601 string captured at construction. |

The long-form spec lives in [docs/envelope.md](../envelope.md).

### Retry vocabulary

`fix.retryable` uses three values:

- `no` - do not retry; the input or configuration must change.
- `once` - one immediate retry is reasonable.
- `backoff` - retry with exponential backoff.

These are guidance, not enforcement. Clearerr does not retry for you.

### Location capture

Location capture skips Clearerr's own frames and `node_modules`, then takes the
first user frame. You can override any part of it with `location`, or set
`phase` (a shortcut for `location.phase`) to name the lifecycle stage.

## Writing a good error spec

```ts
import { err } from 'clearerr'

try {
  await connect()
}
catch (error) {
  throw err(
    {
      code: 'DB_CONNECTION_REFUSED',
      message: 'Could not connect to the primary database',
      context: {
        host: 'db.internal',
        port: 5432,
        attempt: 3,
        timeoutMs: 5000,
      },
      fix: {
        hint: 'Verify the database is running and DATABASE_URL is correct',
        retryable: 'backoff',
        docs: 'https://example.com/docs/errors#db-connection-refused',
      },
      severity: 'recoverable',
      phase: 'connect',
    },
    { cause: error },
  )
}
```

Guidelines:

1. **One code per failure mode.** Do not reuse `APP_FAILED` for everything.
   `PAYMENT_DECLINED` and `PAYMENT_INSUFFICIENT_FUNDS` are different recovery
   paths.
2. **Message is for humans, context is for diagnosis.** Put the specific values
   in `context`; keep the message stable enough to search for.
3. **Context must be non-empty** when the linter is watching. Include the
   identifiers and state that a responder would otherwise need to reproduce the
   failure: IDs, host, port, counts, limits, attempt number.
4. **Fix when recovery matters.** Boundary errors (HTTP handlers, job entry
   points, CLI entry points) should carry `fix.hint`. Add those files to
   `boundaries`.
5. **Preserve the cause.** Inside `catch`, pass the caught value as the second
   argument: `err(spec, { cause: error })`. The `preserve-cause` rule checks
   this.
6. **Severity describes handling, not importance.** A `warning` might be
   logged and ignored; `recoverable` means the caller can continue;
   `fatal` means stop.
7. **Codes are an API.** Renaming or removing a code is a breaking change for
   anything that maps codes to behavior or docs.

You can also construct the class directly:

```ts
import { ClearerrError } from 'clearerr'

throw new ClearerrError({ code: 'CACHE_MISS', message: 'Key not cached' })
```

## Spec fields at a glance

```ts
interface ClearerrErrorSpec {
  code: string
  message: string
  context?: Record<string, unknown>
  fix?: { hint: string, docs?: string, retryable: 'no' | 'once' | 'backoff' }
  severity?: 'fatal' | 'recoverable' | 'warning'
  phase?: string
  location?: Partial<{ file: string, line: number, column: number, function: string, phase: string }>
}
```

`err(spec, { cause })` and `new ClearerrError(spec, { cause })` both accept a
cause option. The runtime validates the code format; registry membership is
enforced by the linter (see [Error codes](codes.md)).

---

Previous: [Getting started](getting-started.md) | Next: [Error codes](codes.md)
