# Configuration

`.clearerrrc.json` at the project root controls the CLI and runtime redaction.
`clearerr init` writes a starter file; every field is optional.

Back to [start here](start-here.md). Related: [Error codes](codes.md),
[Scanning and coverage](scanning.md), [CI enforcement](ci.md),
[Redaction and security](security.md).

## Full example

```json
{
  "redact": ["password", "token", "authorization"],
  "boundaries": ["src/http/**", "src/jobs/**", "src/cli/*.ts"],
  "tsconfig": "tsconfig.json",
  "format": "terminal",
  "failOn": "error",
  "coverageThreshold": 0.8
}
```

| Field | Default | Used by | Notes |
|---|---|---|---|
| `redact` | `[]` | Runtime | Exact context key names to replace with `[redacted]`. Case-sensitive. |
| `boundaries` | `[]` | `scan` | Globs for files where `require-fix-hint` applies. |
| `tsconfig` | `"tsconfig.json"` | `scan` | Path relative to the project root. |
| `format` | `"terminal"` | `scan` | `terminal` or `json`. |
| `failOn` | `"error"` | `scan --ci` | `error`, `warning`, or `none`. |
| `coverageThreshold` | unset | `scan --ci` / `--coverage` | Ratio from `0` to `1`. |

The CLI validates the file strictly: unknown keys and wrong types fail with a
message that includes the JSON path. Missing fields take their defaults.

The runtime is more permissive. It reads only `redact` and ignores unknown keys,
so a misspelled `redact` key leaves runtime redaction empty without an error.
Validate the file with the CLI (for example, `clearerr scan`) before relying on
redaction.

## Boundaries

Boundary globs mark files that sit at an application edge: HTTP handlers, job
consumers, CLI entry points, startup code. `require-fix-hint` applies only to
structured errors in those files, so an agent reaching the edge always gets a
recovery hint.

The glob syntax is a small subset, matched against paths relative to the project
root with forward slashes:

- `*` - any characters except `/`
- `**` - any characters, including `/`; `**/` matches zero or more directories
- `?` - one character except `/`
- `{a,b}` - alternatives

Examples:

```json
{
  "boundaries": [
    "src/http/**",
    "src/jobs/*.ts",
    "src/cli/{scan,init}.ts"
  ]
}
```

## TSConfig

`scan` loads the project through ts-morph using `tsconfig`. The tsconfig
`include` / `exclude` / `files` rules decide what the scanner sees. Use a
separate build tsconfig when your app config includes tests or generated code
that should not count:

```json
{
  "tsconfig": "tsconfig.build.json"
}
```

You can also override it per run:

```sh
pnpm exec clearerr scan --tsconfig tsconfig.build.json
```

## Redaction

Redaction keys can live here or in `CLEARERR_REDACT`. The two sources are
merged and deduplicated. The runtime reads `.clearerrrc.json` from
`process.cwd()` when an error is constructed. See
[Redaction and security](security.md).

## Init behavior

`clearerr init` writes `.clearerrrc.json` and an empty `clearerr.codes.json`.
Re-running it skips files that already exist; `--force` overwrites them. The
starter config omits `coverageThreshold`, so coverage is not enforced until you
add it or pass `--coverage`.

---

Previous: [Error codes](codes.md) | Next: [Scanning and coverage](scanning.md)
