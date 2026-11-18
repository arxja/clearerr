# Phase 2 — Linter

Goal: 6 rules + registry + coverage score.
Gate: Precision ≥90% on fixtures + own code.

## T2.1 — ts-morph loader (tsconfig + include/exclude)
Status: todo
Acceptance: getSourceFiles() matches fixture

## T2.2 — MessageSite extractor: throws, custom error ctors, process.exit w/ message
Status: todo
Acceptance: 3 kinds extracted

## T2.3 — Rule engine: Rule = (site, ctx) => Finding[]
Status: todo
Acceptance: Dummy rule test

## T2.4 — Rule no-bare-throw
Status: todo
Acceptance: Fires on throw new Error; ignores tests

## T2.5 — Rule require-code
Status: todo
Acceptance: Fires on missing/dynamic code

## T2.6 — Rule require-context
Status: todo
Acceptance: Fires on empty/absent context

## T2.7 — Rule preserve-cause
Status: todo
Acceptance: Fires on rethrow without cause

## T2.8 — Rule require-fix-hint at boundaries
Status: todo
Acceptance: Only files matching boundaries glob

## T2.9 — Registry loader + stable-codes rule
Status: todo
Acceptance: Fires on unknown code literal

## T2.10 — Coverage score + unscorable count
Status: todo
Acceptance: 10 fixture sites test

## T2.11 — Fixture suite: ≥3 good + ≥3 bad per rule
Status: todo
Acceptance: pnpm test covers all rules

## T2.12 — Golden set: 30 labels in test/golden/messages.jsonl; precision script
Status: todo
Acceptance: Precision table; all rules ≥0.90

Goal: 6 rules + registry + coverage score.
Gate: Precision ≥90% on fixtures + own code.

Scope guardrails: no CLI code, no ts-morph in runtime deps (separate entry
via src/linter/index.ts), no auto-fix.

| ID | Task | Acceptance |
|---|---|---|
| T2.1 | ts-morph loader (src/linter/loader.ts + src/linter/index.ts as public entry); reads tsconfig, respects include/exclude | `pnpm run ci` green; `getSourceFiles()` count matches fixture expectation |
| T2.2 | MessageSite extractor (src/linter/sites.ts): throws, custom error ctors, process.exit with message | `pnpm run ci` green; each of the 3 site kinds extracted from fixture; tests per kind |
| T2.3 | Rule engine (src/linter/engine.ts): `type Rule = (site, ctx) => Finding[]`; `src/linter/findings.ts`; rules registry in src/linter/rules/index.ts | `pnpm run ci` green; dummy rule test; engine iterates registry |
| T2.4 | Rule `no-bare-throw` | `pnpm run ci` green; fires on `throw new Error(...)`; does NOT fire on `throw err({...})`; ignores `*.test.ts` |
| T2.5 | Rule `require-code` | `pnpm run ci` green; fires on missing `code`; fires on non-literal code; does not fire on valid literal |
| T2.6 | Rule `require-context` | `pnpm run ci` green; fires on empty/absent `context`; does not fire on non-empty context |
| T2.7 | Rule `preserve-cause` | `pnpm run ci` green; fires on rethrow without `cause` when an error is in scope; does not fire when `cause` provided |
| T2.8 | Rule `require-fix-hint` at boundaries | `pnpm run ci` green; fires only on files matching `boundaries` glob; does not fire elsewhere; fires when `fix.hint` absent in boundary file |
| T2.9a | `docs/registry.md` — spec for clearerr.codes.json format (map: code → metadata; stable-codes consumes it) | Spec file committed; format locked (referenced from T2.9 and T3.7) |
| T2.9 | Registry loader (src/shared/registry.ts extended) + rule `stable-codes` | `pnpm run ci` green; fires on unknown code literal; accepts known codes; dynamic code produces warning-level finding not error |
| T2.10 | Coverage score + unscorable count (src/linter/coverage.ts) | `pnpm run ci` green; `{ scored, unscorable, ratio }` returned; 10-site fixture test |
| T2.11 | Fixture suite: ≥3 good + ≥3 bad per rule in `test/fixtures/rules/` with own tsconfig + an `ignored.test.ts` for the "ignores tests" assertion | `pnpm run ci` green; all 6 rules covered by fixture files |
| T2.12 | Golden set: 30 labeled messages in `test/golden/messages.jsonl`; `scripts/precision.ts` prints per-rule precision | `pnpm run ci` green; precision table committed in PR body; all 6 rules precision ≥0.90 |

When this phase closes: move this table to `phases/phase-2.md` as archive,
clear active slot, activate Phase 3.