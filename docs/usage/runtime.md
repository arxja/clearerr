# Runtime handler

`installAgentHandler` turns an uncaught error into one machine-readable line.
Install it once, at the top of the process, before application code runs.

Back to [start here](start-here.md). Related: [Errors and the envelope](errors.md),
[Consuming envelopes](for-agents.md), [Redaction and security](security.md).

## Install

```ts
import { installAgentHandler } from 'clearerr'

installAgentHandler()
```

Options:

```ts
installAgentHandler({ stream: 'stdout', format: 'agent' })
installAgentHandler({ format: 'human' })
```

| Option | Default | Values |
|---|---|---|
| `stream` | `stderr` | `stderr`, `stdout` |
| `format` | from `CLEARERR_FORMAT`, else `agent` | `agent`, `json`, `human` |

- `agent` and `json` produce the same single-line JSON envelope.
- `human` produces the multi-line developer-facing format.
- `CLEARERR_FORMAT=human` changes the default; `CLEARERR_FORMAT=json` is also
  accepted.
- On an uncaught error the handler sets `exitCode = 1`, writes the envelope, and
  exits after the stream flushes (with a 1s safety timeout).
- It handles `uncaughtException` only. `unhandledRejection` is not registered in
  v1; add your own listener if you need it.
- Non-`ClearerrError` values are still formatted: native errors become
  `{ name, message, stack }`.

## Format explicitly

If you do not install the handler, format errors where you catch them:

```ts
import { err, formatForAgent, formatForHuman } from 'clearerr'

const error = err({
  code: 'CONFIG_INVALID_PORT',
  message: 'Invalid port 99999',
  context: { port: 99999 },
})

console.error(formatForAgent(error))
console.error(formatForHuman(error))
```

`formatForAgent` defaults: `maxDepth: 5`, `maxBytes: 8192`. When the envelope
exceeds the byte budget it drops `context`, `cause`, and stacks first, then
shortens user-controlled text, then falls back to a minimal envelope that keeps
`schemaVersion`, `code`, `message`, `severity`, `timestamp`, `location`, and
`context`. `formatForHuman` is developer-facing, not user-facing.

## Unhandled rejections

Add this next to `installAgentHandler()` if you want promise rejections to use
the same output:

```ts
import { formatForAgent } from 'clearerr'

process.on('unhandledRejection', (reason) => {
  console.error(formatForAgent(reason))
  process.exitCode = 1
})
```

## Stream choice

Keep the default `stderr` for agent and CI consumption. Use `stdout` only when
your host routes stderr somewhere else or when stdout is the machine channel and
you have no other stdout output. Mixing envelopes into stdout can break a CLI's
normal output contract.

---

Previous: [CI enforcement](ci.md) | Next: [Redaction and security](security.md)
