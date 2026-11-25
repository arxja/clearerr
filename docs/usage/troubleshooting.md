# Troubleshooting

Back to [start here](start-here.md). Related: [Configuration](configuration.md),
[Limits and non-goals](limits.md), [Redaction and security](security.md).

## `Cannot find tsconfig "tsconfig.json"`

The path resolves from the project root (the CLI working directory). Fix
`tsconfig` in `.clearerrrc.json` or pass `--tsconfig`. Run the CLI from the
project root, not from a subdirectory, unless the config lives there.

## `No clearerr.codes.json found`

`scan` still works; `stable-codes` is inert. `clearerr codes` exits `0` with a
hint. Run `clearerr init` to create the file.

## `Unknown error code "X"`

Add the code to `clearerr.codes.json` in the same change that introduces it. The
registry is case-sensitive.

## Config is rejected even though the JSON looks fine

The schema is strict: unknown fields, wrong types, and out-of-range values fail.
The error names the JSON path. Remove typos such as `failon` or
`coverage_threshold`.

## Coverage is `0%` or `n/a`

- `n/a` means the scan target produced no message sites.
- `0%` means sites exist but none carry a structured spec with `code`.
- Check that the tsconfig includes the files and that the scan target is not
  outside the include set.
- Test files count if they are included.

## `npx clearerr` fails with `'node\r'` or `pnpm pack` fails with CRLF

On Windows, a CRLF checkout of `bin/clearerr.mjs` breaks Unix shebang execution
and `pnpm pack`. The committed file should be LF. Add a `.gitattributes` such as:

```gitattributes
* text=auto eol=lf
*.mjs text eol=lf
```

then re-checkout the file (or run `git add --renormalize .`). Do not publish a
tarball built from a CRLF working copy.

## Scan is slow the first time

ts-morph loads and type-checks the project. Subsequent runs in the same process
are faster; the CLI is a one-shot process, so expect a few seconds on larger
projects.

## The handler does not catch a rejected promise

`installAgentHandler` registers `uncaughtException` only. Add a
`process.on('unhandledRejection', ...)` listener that formats and exits. See
[Runtime handler](runtime.md#unhandled-rejections).

## `require('clearerr')` fails

The package is ESM-only. Use `import`, or dynamic `import()` from CommonJS.

## Browser build breaks

Do not import the runtime in browser code. See
[Redaction and security](security.md).

## A rule is firing on code I consider fine

That is a false positive. Open a
[bug report](../../.github/ISSUE_TEMPLATE/bug_report.md) with the rule ID, the
code snippet, the scan output, and why the finding is wrong. If you are
dogfooding Clearerr, also record it in `docs/dogfood.md` with a suggested
change.

---

Previous: [Programmatic API](api.md) | Next: [Limits and non-goals](limits.md)
