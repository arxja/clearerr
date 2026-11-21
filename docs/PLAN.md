# Clearerr Plan

Dev-time plan. At release, replace with user-facing docs.

Status: Phase 2 — Linter (in progress)
- Envelope spec: docs/envelope.md
- Phase archive: docs/phases/phase_00.md
- Current phase: docs/phases/phase_02.md

## Scope (v1)

Runtime: ClearerrError, err(), cause-chain serialization, location capture, context redaction, formatForAgent / formatForHuman, installAgentHandler.
Static: 6 ts-morph rules, code registry validation, coverage score.
CLI: init, scan, codes; terminal + JSON output; config; exit codes.
Tests: unit + fixtures + e2e CLI.

Out of scope: LLM judge · SARIF · GitHub Action · badge · measurement harness · separate human-clarity score · auto-fix · other languages · hosted anything · public scorecard ·  **browser runtime (user-visible errors)**.

Done when:
- ClearerrError used in ≥1 real project for ≥30 days
- That project: ≥80% structured throw sites
- Per-rule false-positive rate <10% on own code
- One real failure diagnosed by an agent from the envelope alone

## Flows

A — Adoption: pnpm i clearerr → npx clearerr init → replace throw new Error with throw err({...}) → npx clearerr scan ./src → add --ci to scripts.
B — Runtime emission: call installAgentHandler() once at top level → uncaught ClearerrError → one-line JSON to stderr.
C — Agent consumption: parse stderr JSON → read code, location, context, fix.hint, fix.retryable → act on retryable → no source re-read.
D — Enforcement (CI): npx clearerr scan --ci → exit 1 on error severity or coverage < threshold → PR blocked.

## Active phase — 2 Linter

Goal: 6 rules + registry + coverage score.
Gate: Precision ≥90% on fixtures + own code.

Scope guardrails: no CLI code, no ts-morph imports from the runtime entry
(ts-morph is used only by the separate linter entry via src/linter/index.ts),
no auto-fix.

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

When this phase closes: move this table to `docs/phases/phase_02.md` as archive,
clear active slot, activate Phase 3.