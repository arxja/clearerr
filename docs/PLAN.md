# Clearerr Plan

Dev-time plan. At release, replace with user-facing docs.

Status: Phase 3 — CLI + CI
- Envelope spec: docs/envelope.md
- Phase archive: docs/phases/phase_02.md
- Current phase: docs/phases/phase_03.md

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
| T3.1 | Bin (citty + picocolors): commands `scan`, `init`, `codes`; `bin/clearerr.mjs` shim | `pnpm run ci` green; `npx clearerr --help` works; each subcommand dispatchable |
| T3.2 | Config loader `.clearerrrc.json` with zod (src/cli/config.ts); exports parseFull for CLI | `pnpm run ci` green; valid config loads; invalid config fails with actionable message |
| T3.3 | Terminal reporter (src/cli/reporters/terminal.ts): grouped by file, colored severity, coverage footer | `pnpm run ci` green; snapshot test |
| T3.4 | JSON reporter (src/cli/reporters/json.ts) via `--format json` | `pnpm run ci` green; output matches §2 finding shape; pipeable (single JSON object) |
| T3.5 | `clearerr init` scaffolds `.clearerrrc.json` + empty `clearerr.codes.json` from `src/cli/templates/` | `pnpm run ci` green; idempotent (re-run does nothing); `--force` overwrites |
| T3.6 | `--ci` exit 1 on error severity; `--fail-on <severity>` threshold (src/cli/exit.ts) | `pnpm run ci` green; E2E asserts exit codes 0/1 per config |
| T3.7 | `clearerr codes` lists + validates (dupes, format) using `docs/registry.md` spec | `pnpm run ci` green; E2E: dupes detected with message; invalid format flagged; valid codes listed |
| T3.8 | README: install / adopt / CI / before-after sections; `docs/rubric.md` defines what counts as "covered" | `pnpm run ci` green; all four README sections present; rubric defines scoring |

When this phase closes: move to `phases/phase-3.md` archive, activate Phase 4.