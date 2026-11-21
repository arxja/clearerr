# Clearerr

Clearerr is a library that standardizes runtime failure information into a compact, AI-consumable envelope so an agent can diagnose and retry without guessing from raw stack traces.

>[!WARNING]
>This project is under **development** and not suitable for any usage
>**Status**: Development 

## Install

```sh
pnpm add clearerr
```

## Basic runtime usage

Install the uncaught-error handler once at application startup:

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

## Browser warning

Do not install `installAgentHandler` or throw `ClearerrError` in browser production code. It is Node-only and writes process output. Envelopes include context and cause data that are intended for server logs, developer terminals, CLI output, and CI tooling, not end-user pages. Browser DevTools and third-party reporting services may expose the raw object or its fields.


