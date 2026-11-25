# clearerr

**Structured error envelopes for AI coding agents.**

Your agent can't fix what it can't parse. `clearerr` replaces ad-hoc
`throw new Error()` with a typed envelope carrying the error code, source
location, structured context, fix hint, and cause chain — then enforces it at
lint time and emits one-line JSON to stderr for agent consumption.

Validated in a paired study (5 real failures, temp 0, mid-tier model):
**+40pp one-shot diagnosis success · −36% total tokens · −50% tool calls**
vs raw stack traces.

For the complete walkthrough - install, first envelope, registry, scanning,
coverage, CI, runtime handler, agent consumption, and migration - start at
[docs/usage/start-here.md](docs/usage/start-here.md).

>[!WARNING]
>This project is under **development** and not suitable for any usage 
>**Status**: Development 

## Install

```sh
pnpm add clearerr
```

Install the runtime handler once at application startup:

```ts
import { err, installAgentHandler } from 'clearerr'

installAgentHandler()

throw err({
  code: 'CONFIG_INVALID_PORT',
  message: 'Invalid port 99999',
  context: { port: 99999, expected: '1-65535' },
  fix: { hint: 'Set PORT to 1-65535', retryable: 'no' },
  severity: 'fatal',
  phase: 'validate',
})
```

By default, uncaught `ClearerrError` instances are written as one-line JSON to stderr. Set `CLEARERR_FORMAT=json` for the JSON environment default; `CLEARERR_FORMAT=human` writes the developer-facing text format. You can also select a format explicitly:

```ts
installAgentHandler({ stream: 'stdout', format: 'agent' })
installAgentHandler({ format: 'human' })
```

Agent formatting and human formatting are runnable with:

```ts
import { err, formatForAgent, formatForHuman } from 'clearerr'

const error = err({
  code: 'CONFIG_INVALID_PORT',
  message: 'Invalid port 99999',
})

const formatted = formatForAgent(error)
const developerText = formatForHuman(error)
```

## Adopt

1. Add `clearerr.codes.json` and `.clearerrrc.json` at the project root:

   ```sh
   npx clearerr init
   ```

2. Register the error codes the project already uses. `clearerr codes` lists
   and validates the registry:

   ```sh
   npx clearerr codes
   ```

3. Replace bare throws with structured errors as you touch each call site:

   ```ts
   // before
   throw new Error('Invalid port')

   // after
   throw err({
     code: 'CONFIG_INVALID_PORT',
     message: 'Invalid port 99999',
     context: { port: 99999, expected: '1-65535' },
     fix: { hint: 'Set PORT to 1-65535', retryable: 'no' },
   })
   ```

4. Scan the project. `scan` groups findings by file, prints colored severity,
   and ends with the structured-error coverage footer:

   ```sh
   npx clearerr scan ./src
   ```

   Use `--format json` for one machine-readable object on stdout:

   ```sh
   npx clearerr scan ./src --format json
   ```

`clearerr init` writes `.clearerrrc.json` and an empty `clearerr.codes.json`.
Re-running it is safe: existing files are skipped unless you pass `--force`.

## CI

Add a CI step that fails on new findings:

```sh
npx clearerr scan --ci
```

`--ci` exits `1` when a finding reaches the configured severity. The default is
`error`; override it with `--fail-on warning` or `--fail-on none`.

`.clearerrrc.json` controls the defaults:

```json
{
  "redact": [],
  "boundaries": [],
  "tsconfig": "tsconfig.json",
  "format": "terminal",
  "failOn": "error",
  "coverageThreshold": 0.8
}
```

- `boundaries` lists files where errors need a `fix.hint`.
- `failOn` is the severity threshold used by `--ci`.
- `coverageThreshold` fails CI when structured-error coverage drops below the
  ratio. See [docs/rubric.md](docs/rubric.md) for exactly what counts as
  covered.

## Before / after

**Before**: a raw stack trace with no stable code, context, or recovery hint:

```ts
throw new Error('Request failed')
```

```text
Error: Request failed
    at loadConfig (src/config.ts:42:11)
    at main (src/index.ts:8:3)
```

**After**: a structured envelope an agent can act on without re-reading source:

```ts
throw err({
  code: 'CONFIG_INVALID_PORT',
  message: 'Invalid port 99999',
  context: { port: 99999, expected: '1-65535' },
  fix: { hint: 'Set PORT to 1-65535', retryable: 'no' },
  severity: 'fatal',
})
```

```json
{ "schemaVersion": 1, "code": "CONFIG_INVALID_PORT", "message": "Invalid port 99999", "location": { "file": "src/config.ts", "line": 42 }, "context": { "port": 99999, "expected": "1-65535" }, "fix": { "hint": "Set PORT to 1-65535", "retryable": "no" }, "severity": "fatal", "timestamp": "2026-11-15T..." }
```

## Browser warning

Do not install `installAgentHandler` or throw `ClearerrError` in browser production code. It is Node-only and writes process output. Envelopes include context and cause data that are intended for server logs, developer terminals, CLI output, and CI tooling, not end-user pages. Browser DevTools and third-party reporting services may expose the raw object or its fields.
