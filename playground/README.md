# clearerr playground

A fake app to find API/linter/formatter issues.

## Setup
```bash
  pnpm install
```

## Use
```bash
  pnpm run scan         # scan src/, terminal output
  pnpm run scan:ci      # exit 1 if findings
  pnpm run scan:json    # machine output
  pnpm run codes        # list registry
  pnpm run run          # run CLI → handler fires on stderr (agent format)
  pnpm run run:human    # same, human format
  pnpm run run:json     # same, JSON format
```

## What's in here (and why)

- `src/config.ts`   — validation errors; one intentionally raw throw
- `src/db.ts`       — retry + cause chain; one intentionally raw rethrow
- `src/http.ts`     — external API; boundary file; one throw missing fix.hint
- `src/files.ts`    — file ops; one throw with empty context
- `src/retry.ts`    — full retry loop with cause chain
- `src/legacy.ts`   — unmitigated old code; every rule should fire
- `cli/run.ts`      — exercises installAgentHandler end-to-end

The "intentionally broken" lines are marked with a comment. They are the
**test cases for the linter**.

## Expected scan output

Run `pnpm run scan` and compare against this expectation:

- `no-bare-throw`    → flags `config.ts:API_KEY missing`, `legacy.ts:all`, `db.ts:raw rethrow`
- `require-code`     → no findings (all enveloped throws have literal codes)
- `require-context`  → flags `files.ts:context: {}`
- `preserve-cause`   → flags `db.ts:raw rethrow` (rethrow without cause)
- `require-fix-hint` → flags `http.ts:HTTP_RATE_LIMITED` (boundary file)
- `stable-codes`     → no findings (all codes in registry)

Coverage should be around 50–65% (real was 58.3%) (most throws enveloped, some raw).
