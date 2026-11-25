# Scanning and coverage

`clearerr scan` finds failure sites, runs six rules, and reports structured-error
coverage. It is read-only.

Back to [start here](start-here.md). Related: [Configuration](configuration.md),
[CI enforcement](ci.md), [Coverage rubric](../rubric.md).

## Commands

```sh
# Scan everything included by the tsconfig
pnpm exec clearerr scan

# Scan one directory or file
pnpm exec clearerr scan ./src
pnpm exec clearerr scan src/server/handler.ts

# Machine-readable output
pnpm exec clearerr scan ./src --format json

# CI gate
pnpm exec clearerr scan --ci

# CI gate with an explicit coverage threshold
pnpm exec clearerr scan --ci --coverage 0.8

# Treat warnings as failures
pnpm exec clearerr scan --ci --fail-on warning

# Use a different tsconfig
pnpm exec clearerr scan --tsconfig tsconfig.build.json
```

| Flag | Meaning |
|---|---|
| positional path | File or directory to scan. Defaults to the current directory. It must exist. |
| `--format <terminal\|json>` | Reporter. Overrides `format` in config. |
| `--ci` | Use `failOn` from config (default `error`) and enforce `coverageThreshold` if configured. |
| `--fail-on <error\|warning\|none>` | Explicit finding threshold. Overrides `--ci`. |
| `--tsconfig <path>` | Project file used to load sources. |
| `--coverage <0..1>` | Minimum coverage ratio. Enables the coverage gate even without `--ci`. |

## What counts as a site

The scanner extracts **message sites** from the files included by the tsconfig:

- a `throw` statement
- an error constructor such as `new Error("...")` that is not directly thrown
- `process.exit("...")` with a string message

Sites with no message are ignored, for example `process.exit(1)`.

A site is **covered** when it carries a structured spec with a `code`:

```ts
throw err({ code: 'APP_FAILED', message: '...', context: { ... } })
throw new AppError({ code: 'APP_FAILED', message: '...' })
```

The scanner does not require the code to be a literal for coverage; the
`require-code` and `stable-codes` rules decide whether the code itself is
acceptable.

## The six rules

| Rule | Severity | Fires when | Skipped for tests |
|---|---|---|---|
| `no-bare-throw` | error | A throw uses a native/custom error constructor without a spec, or throws a string. | Yes (`*.test.*`, `*.spec.*`) |
| `require-code` | error | A spec has no `code`, an empty code, or a non-literal code. | No |
| `require-context` | error | A spec has no `context`, an empty literal `{}`, or a statically absent/literal value. | No |
| `preserve-cause` | error | A throw inside a `catch` creates a new structured error without forwarding the caught error as `cause`. Rethrowing the caught variable is allowed. | No |
| `require-fix-hint` | error | A spec in a file matching `boundaries` has no non-empty `fix.hint`. | No |
| `stable-codes` | error / warning | A literal code is not in `clearerr.codes.json` (error), or a code is dynamic (warning). Inert without a registry. | No |

Sites in test files still count toward coverage if the tsconfig includes them.
If tests should not count, exclude them in `tsconfig.json` or scan only `src`.

## Terminal output

```text
clearerr scan: 26 findings in 5 files

src/cli/commands/scan.ts
    39:5    error    no-bare-throw  Throw a structured Clearerr error instead of a bare error.
    58:5    error    no-bare-throw  Throw a structured Clearerr error instead of a bare error.

Coverage: 0.0% (0/30 structured sites)
Summary: 26 errors, 0 warnings
```

Paths are relative to the project root. Findings are grouped by file and sorted
by line, column, rule, then message. The coverage footer prints
`n/a (no message sites)` when the scan finds nothing to score.

## JSON output

`--format json` writes exactly one JSON object to stdout, so it can be piped
into `jq` or an agent:

```json
{
  "schemaVersion": 1,
  "tool": "clearerr",
  "root": "/absolute/path/to/project",
  "findings": [
    {
      "ruleId": "no-bare-throw",
      "severity": "error",
      "message": "Throw a structured Clearerr error instead of a bare error.",
      "file": "/absolute/path/to/project/src/app.ts",
      "line": 39,
      "column": 5
    }
  ],
  "coverage": {
    "scored": 0,
    "unscorable": 30,
    "ratio": 0,
    "percent": 0
  },
  "summary": {
    "errors": 1,
    "warnings": 0
  }
}
```

`file` is absolute and uses forward slashes. Relativize against `root` for
display. Failure reasons are written to stderr, so stdout stays parseable.

## Scope

Coverage follows the tsconfig `include` / `exclude` rules **and** the scan
target. `clearerr scan src` counts only sites inside `src`; included files
outside the target are excluded from the denominator.

## Coverage score

```text
coverage = scored / (scored + unscorable)
```

- **Scored**: a site with a structured spec containing a `code` property.
- **Unscorable**: everything else - bare throws, string throws,
  `process.exit("...")`, and specs without `code`.
- **No sites**: ratio is `0`, the terminal footer prints `n/a`, and coverage
  never fails a run.
- **Target**: 80% (`0.8`) is the recommended project target.

The score measures **structure**, not correctness. It answers "how much of my
failure surface is machine-readable?", not "are these errors well designed?".

Raising coverage:

1. Replace `throw new Error(...)` with `throw err({ code, message, context })`.
2. Add the code to `clearerr.codes.json`.
3. Add non-empty `context`.
4. Replace `process.exit("message")` with a structured throw or an application
   exit path that logs an envelope first.

The full scoring contract lives in [docs/rubric.md](../rubric.md).

---

Previous: [Configuration](configuration.md) | Next: [CI enforcement](ci.md)
