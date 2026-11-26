# CI enforcement

Use `clearerr scan --ci` as a pull-request gate: it fails on all findings at or
above the configured `failOn` severity, including findings that already exist in
the branch. Once the baseline is healthy, also fail when coverage drops.

Back to [start here](start-here.md). Related: [Scanning and coverage](scanning.md),
[Configuration](configuration.md).

## GitHub Actions example

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm exec clearerr scan --ci
```

Set `coverageThreshold` in `.clearerrrc.json` to enforce coverage too:

```json
{
  "failOn": "error",
  "coverageThreshold": 0.8
}
```

## Exit-code behavior

| Command | Fails when |
|---|---|
| `clearerr scan` | Never on findings. Only on a CLI error (bad config, missing tsconfig/target). |
| `clearerr scan --fail-on error` | A finding at or above `error` exists. |
| `clearerr scan --fail-on warning` | Any finding exists. |
| `clearerr scan --fail-on none` | Never on findings. |
| `clearerr scan --ci` | Findings reach `failOn` from config (default `error`). Also enforces `coverageThreshold` **if configured**. |
| `clearerr scan --ci --coverage 0.8` | Findings reach `failOn`, or coverage is below `0.8`. |
| `clearerr scan --coverage 0.8` | Coverage is below `0.8`, even without `--ci`. |

Notes:

- An explicit `--fail-on` overrides `--ci`. `--ci --fail-on none` disables the
  finding gate but still applies a configured coverage threshold.
- `--ci` alone does **not** enforce coverage; set `coverageThreshold` in
  `.clearerrrc.json` or pass `--coverage`.
- Coverage is skipped when the project has no message sites.
- Failure reasons go to stderr as `clearerr: ...` lines; the report stays on
  stdout.

## Recommended rollout

1. Start with `clearerr scan` and record the baseline coverage and findings.
2. Convert code. Do not set a threshold you cannot meet yet.
3. Before enabling the finding gate, resolve existing findings at the target
   severity, or set `failOn` to a level that matches the current state (for
   example `"none"` while you clean up). The gate has no baseline: it evaluates
   every finding in the scan, not only new ones.
4. Set `coverageThreshold` slightly below current coverage, then ratchet it up.
5. Add `--ci` to the pipeline.
6. Add `failOn: "warning"` only after the warning surface is clean.

## Why not fail on every run immediately?

An existing codebase usually starts near 0% coverage. If you enable a threshold
at 80% on day one, every PR fails and the team disables the gate. Treat coverage
like a ratchet: record where you are, prevent regressions, and raise the target
as you migrate. See [Migration and adoption](migration.md).

---

Previous: [Scanning and coverage](scanning.md) | Next: [Runtime handler](runtime.md)
