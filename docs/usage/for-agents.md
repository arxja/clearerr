# Consuming envelopes

The runtime handler emits one line of JSON to stderr. This page shows how an
agent or tool should read it and decide what to do next.

Back to [start here](start-here.md). Related: [Errors and the envelope](errors.md),
[Runtime handler](runtime.md).

## Parse the envelope

1. Find the last JSON line on stderr.
2. Parse it as `ClearerrErrorJSON`.
3. Use `code`, `message`, `location`, `context`, and `fix.hint` to act.
4. Use `fix.retryable` to decide whether to retry.
5. Read `cause` before re-reading source.

```ts
type Retryable = 'no' | 'once' | 'backoff'

interface Envelope {
  schemaVersion: 1
  code: string
  message: string
  location: { file: string, line: number, column?: number, phase?: string }
  context: Record<string, unknown>
  fix?: { hint: string, retryable: Retryable, docs?: string }
  severity: 'fatal' | 'recoverable' | 'warning'
  cause?: unknown
  timestamp: string
}

function parseEnvelope(stderr: string): Envelope | undefined {
  for (const line of stderr.trim().split('\n').reverse()) {
    try {
      const value = JSON.parse(line)
      if (value?.schemaVersion === 1 && typeof value.code === 'string')
        return value as Envelope
    }
    catch {
      // Not an envelope line.
    }
  }
  return undefined
}
```

## Scan reports

`clearerr scan --format json` writes a different object to stdout. It is not an
envelope: read `findings` for rule violations and `coverage` for the
structured-error score. See
[Scanning and coverage](scanning.md#json-output).

## Retry policy

- `no` - do not retry; change configuration or input.
- `once` - retry once, then surface the failure.
- `backoff` - retry with exponential backoff and a cap.
- Missing `fix` - treat as `no` unless you have domain knowledge.

Clearerr does not enforce these values. They are guidance for the consumer.

## Prompting an agent

Give the agent the envelope and a rule like:

```text
You are diagnosing a failed command. The last stderr line is a Clearerr
envelope. Do not re-read source files unless the envelope is missing a fact you
need. Use:
- code and context to identify the failure state
- fix.hint for the next action
- fix.retryable to decide whether to retry
- cause to understand the underlying error
If retryable is "no", report the blocking input or configuration instead of
retrying.
```

## Why this matters

Agents should not need to open the source file when `context` and `fix` are
good. That is the goal of the envelope, and it is the Phase 4 done-when
criterion ("one real failure diagnosed by an agent from the envelope alone").

See [Migration and adoption](migration.md) for the measurement checklist.

---

Previous: [Redaction and security](security.md) | Next: [Migration and adoption](migration.md)
