# Migration and adoption

Incremental migration is expected. You do not need to convert every throw at
once, and you should not enforce a coverage threshold you cannot meet yet.

Back to [start here](start-here.md). Related: [Scanning and coverage](scanning.md),
[CI enforcement](ci.md), [Error codes](codes.md).

## Migrate an existing project

1. **Scaffold.** `clearerr init`. Commit both files.
2. **Seed the registry.** Add codes you already know you will need. Do not
   invent one code per file; start with the failures that have distinct
   recovery paths.
3. **Install the handler.** Add `installAgentHandler()` at the process entry
   point. This is safe before any migration: native errors still format.
4. **Convert the hot path.** Start at boundaries: HTTP handlers, queue/job
   consumers, CLI entry points, startup/configuration. These are where an agent
   or operator actually needs recovery data.
5. **Add boundaries.** Put those globs in `.clearerrrc.json` so
   `require-fix-hint` enforces `fix.hint` there.
6. **Preserve causes.** In every `catch`, use
   `err(spec, { cause: error })`.
7. **Scan and record.** Run `clearerr scan ./src`. Save the coverage number.
8. **Ratchet.** Set `coverageThreshold` just below the current score, add
   `--ci`, and raise the threshold as coverage improves.
9. **Exclude noise.** If tests or generated code should not count, exclude them
   in `tsconfig.json`, not with ad-hoc ignores (there is no ignore comment in
   v1).
10. **Register as you go.** Add every new literal code to
    `clearerr.codes.json` in the same change.

## What the linter will complain about first

- `no-bare-throw` on every untouched `throw new Error(...)`. This is your
  migration backlog.
- `require-context` on specs that only have a message.
- `stable-codes` if a code is missing from the registry.
- `preserve-cause` in catch blocks.
- `require-fix-hint` only in boundary files.

## Verify adoption (dogfood)

Phase 4 is about using Clearerr on real code. A useful local check, including
on this repository itself:

```sh
pnpm install
pnpm build
node bin/clearerr.mjs init
node bin/clearerr.mjs scan ./src
node bin/clearerr.mjs scan ./src --format json
node bin/clearerr.mjs scan ./src --ci
```

What to look for:

- Does `init` produce files you would actually commit?
- Does the scan surface your real throw sites, or noise?
- Are any findings false positives? Record rule + file + line + suggested
  change in `docs/dogfood.md`.
- Did you need a field the envelope does not have?
- Could an agent diagnose a real failure from the envelope alone?

## Playground vs real project

A playground or fixture project can validate the mechanics, but it does **not**
satisfy the Phase 4 gate ("≥1 real project for ≥30 days"). Keep the playground
as a regression fixture; dogfood the 30-day requirement on a real application.

When a friction item leads to a change, update the relevant doc **and** add a
test. Phase 4 scope guardrail: no new features unless dogfood friction drives
them.

---

Previous: [Consuming envelopes](for-agents.md) | Next: [Programmatic API](api.md)
