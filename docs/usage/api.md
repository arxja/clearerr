# Programmatic API

Use the runtime entry for application code and the linter entry for dev/CI
tooling.

Back to [start here](start-here.md). Related: [Errors and the envelope](errors.md),
[Scanning and coverage](scanning.md).

## Runtime entry

```ts
import {
  ClearerrError,
  err,
  formatForAgent,
  formatForHuman,
  installAgentHandler,
  captureLocation,
  redactValue,
  redactContext,
  getRedactKeys,
  loadClearerrConfig,
  parseClearerrConfig,
  loadCodeRegistry,
  parseCodeRegistry,
  isValidErrorCode,
  validateErrorCode,
} from 'clearerr'

import type {
  ClearerrErrorJSON,
  ClearerrErrorSpec,
  ErrorFix,
  ErrorLocation,
  Retryable,
  Severity,
} from 'clearerr'
```

`clearerr` imports Node built-ins (`node:fs`, `node:process`) and is Node-only.

## Linter entry

For building your own tools:

```ts
import {
  computeCoverage,
  extractMessageSites,
  runRules,
  rules,
  loadCodeRegistry,
  loadProject,
  getSourceFiles,
  createRuleContext,
  isTestFile,
} from 'clearerr/linter'

const sites = extractMessageSites({
  cwd: process.cwd(),
  tsconfigFilePath: 'tsconfig.json',
})
const findings = runRules(sites, {
  cwd: process.cwd(),
  boundaries: ['src/http/**'],
  codeRegistry: loadCodeRegistry(process.cwd()),
})
const coverage = computeCoverage(sites)
```

`clearerr/linter` depends on `ts-morph` and is intended for dev/CI tooling. Do
not import it from production runtime code if bundle size matters.

## Useful building blocks

- `extractMessageSites` - find throw sites and error constructors.
- `runRules` - run the built-in rules, or pass a custom `rules` array.
- `computeCoverage` - raw scored/unscorable counts and ratio.
- `loadProject` / `getSourceFiles` - ts-morph project loading.
- `isValidErrorCode` / `validateErrorCode` - code format checks.
- `redactValue` - redact context keys without constructing an error.
- `captureLocation` - parse a stack into an `ErrorLocation`.

The source of truth for exported types is
[docs/envelope.md](../envelope.md) and
[docs/registry.md](../registry.md).

---

Previous: [Migration and adoption](migration.md) | Next: [Troubleshooting](troubleshooting.md)
