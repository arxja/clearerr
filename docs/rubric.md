# Coverage rubric

This rubric defines what "covered" means for `clearerr scan` and how the
coverage score is calculated. It is the contract behind the coverage footer,
the JSON `coverage` object, and the `--ci` coverage threshold.

## Counting sites

The scanner extracts every **message site** from the files included by the
project tsconfig. A site is one of:

- a `throw` statement
- an error constructor such as `new Error("...")` that is not directly thrown
- a `process.exit("...")` call that carries a string message

## Covered (scored) sites

A site is **covered** when it carries a structured clearerr spec with a `code`
property. That means either:

```ts
throw err({ code: 'APP_FAILED', message: '...', context: { ... } })
throw new AppError({ code: 'APP_FAILED', message: '...' })
```

The code must be present in the spec. The scanner does not require the code to
be a literal for coverage; the `require-code` and `stable-codes` rules decide
whether the code itself is acceptable.

## Unscorable sites

Everything else counts against coverage:

- `throw new Error("...")` and other bare constructors
- `throw "..."` or `throw \`...\``
- `process.exit("...")`
- a clearerr spec without a `code` property

Sites with no message text are not counted at all, for example
`process.exit(1)`.

## Formula

```text
coverage = scored / (scored + unscorable)
```

- The ratio is `0` when the project has no sites.
- The terminal reporter prints `n/a` when there are no sites.
- The JSON reporter always includes the raw counts and the ratio.

## Targets

- Recommended project target: **80%** (`0.8`) of all message sites covered.
- `coverageThreshold` in `.clearerrrc.json`, or `--coverage <ratio>`, enables a
  CI gate. The run fails when the ratio is below the threshold.
- A project with no message sites is never failed by coverage.

## Scope

Coverage follows the tsconfig `include` / `exclude` rules and the scan target.
`clearerr scan <path>` counts only sites within that file or directory, so
included files outside the target are excluded from the denominator. Exclude
test files and generated code in `tsconfig.json` if they should not count. Test
files are skipped by most rules but still count as sites when they are part of
the project.

## Raising the score

1. Replace `throw new Error(...)` with `throw err({ code, message, context })`.
2. Add the code to `clearerr.codes.json`.
3. Add non-empty `context` so the envelope is diagnosable without a re-run.
4. Prefer structured `process.exit` paths over passing a message to
   `process.exit`.

The coverage score measures structure, not correctness. The per-rule precision
gate in `test/golden` measures whether the rules fire for the right reasons.
