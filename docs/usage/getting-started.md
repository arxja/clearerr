# Getting started

From an empty project to a working scan. This page covers requirements,
installation, and the five-minute setup. Each step links to the page that
explains the details.

Back to [start here](start-here.md).

## Requirements

- Node.js with ESM support. The project CI runs Node 22; use Node 20 or newer
  unless your environment already runs something newer.
- An ESM project (`"type": "module"` or `.mjs`) for the runtime import.
- A `tsconfig.json` for `clearerr scan`. The scanner loads the project through
  ts-morph and follows the tsconfig `include` / `exclude` / `files` rules.
  JavaScript is only scanned when the tsconfig includes it (for example with
  `allowJs`).
- TypeScript source is expected for the linter entry point. The runtime package
  itself is plain ESM and works from JavaScript too.

The CLI is a development tool. The runtime is not browser-safe; see
[Redaction and security](security.md).

## Install

```sh
pnpm add clearerr
```

or `npm install clearerr`, `yarn add clearerr`, `bun add clearerr`.

Choose the dependency type based on what you import:

```sh
# You throw err()/ClearerrError in shipped server code:
pnpm add clearerr

# You only use the CLI/linter:
pnpm add -D clearerr
```

### Before the first npm release

The package is not published yet. From a checkout of this repository you can
run the CLI directly without packing:

```sh
pnpm install
pnpm build
node path/to/clearerr/bin/clearerr.mjs scan ./src
```

To use it from another local project, build a tarball from the checkout and
install that:

```sh
pnpm install
pnpm build
pnpm pack
```

```sh
# in your project
pnpm add /path/to/clearerr-<version>.tgz
```

Then run `pnpm exec clearerr --help`. `pnpm pack` resolves Clearerr's `catalog:`
dependencies to concrete versions, so the consuming project does not need to
copy the catalog definitions. Packing requires LF line endings on
`bin/clearerr.mjs` (see [Troubleshooting](troubleshooting.md)).

## Five-minute quick start

Assume a project with `src/` and a `tsconfig.json`.

### Step 1 - scaffold

```sh
pnpm exec clearerr init
```

This writes two files at the current working directory:

```json
// .clearerrrc.json
{
  "redact": [],
  "boundaries": [],
  "tsconfig": "tsconfig.json",
  "format": "terminal",
  "failOn": "error"
}
```

```json
// clearerr.codes.json
{}
```

Re-running `init` skips existing files. `--force` overwrites them.

### Step 2 - register your first code

Edit `clearerr.codes.json`:

```json
{
  "CONFIG_INVALID_PORT": {
    "description": "The configured port is outside 1-65535.",
    "severity": "fatal",
    "retryable": "no"
  }
}
```

Codes are uppercase, start with a letter, and contain only `A-Z`, `0-9`, and
`_`: `^[A-Z][A-Z0-9_]*$`. See [Error codes](codes.md).

### Step 3 - replace one throw

```ts
// before
throw new Error('Invalid port 99999')

// after
import { err } from 'clearerr'

throw err({
  code: 'CONFIG_INVALID_PORT',
  message: 'Invalid port 99999',
  context: { port: 99999, expected: '1-65535' },
  fix: { hint: 'Set PORT to 1-65535', retryable: 'no' },
  severity: 'fatal',
  phase: 'validate',
})
```

See [Errors and the envelope](errors.md) for every field and the guidelines for
writing a good spec.

### Step 4 - install the runtime handler once

```ts
// src/index.ts, before application code runs
import { installAgentHandler } from 'clearerr'

installAgentHandler()
```

An uncaught `ClearerrError`, or any uncaught error, is written as one line of
JSON to stderr. The process exits with code `1`. See
[Runtime handler](runtime.md).

### Step 5 - scan

```sh
pnpm exec clearerr scan ./src
```

```text
clearerr scan: 0 findings in 0 files
Coverage: 50.0% (1/2 structured sites)
```

`scan` is read-only and does not change files. Without `--ci`, `--fail-on`, or
`--coverage`, findings do not change the exit code. See
[Scanning and coverage](scanning.md).

### Step 6 - gate it in CI

```yaml
# .github/workflows/ci.yml (excerpt)
- run: pnpm install --frozen-lockfile
- run: pnpm exec clearerr scan --ci
```

Add a `coverageThreshold` to `.clearerrrc.json` when you are ready to enforce
coverage as well. See [CI enforcement](ci.md).

---

Previous: [start here](start-here.md) | Next: [Errors and the envelope](errors.md)
