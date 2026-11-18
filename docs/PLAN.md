# Clearerr Plan

Dev-time plan. At release, replace with user-facing docs.

Status: Phase 1 — Runtime core (in progress)
- Envelope spec: docs/envelope.md
- Phase archive: docs/phases/phase_00.md
- Current phase: docs/phases/phase_01.md

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

## Active phase — 1 Runtime core

Goal: Envelope + formatter shipped and tested.
Gate: Flow B passes (`installAgentHandler` emits one-line JSON to stderr on
uncaught ClearerrError).

| ID | Task | Acceptance |
|---|---|---|
| T1.1 | Scaffold | **CANCELLED** — covered by ts starter template (tsdown + vitest + eslint + knip + CI) |
| T1.2 | Port spike + split into src/shared/types.ts + src/runtime/error.ts + src/index.ts; add validateCodeFormat to src/shared/registry.ts | `pnpm run ci` green; constructor defaults test; immutability test; invalid-code throw test; 6+ tests in `<test-root>/runtime/error.test.ts`; old spike file deleted |
| T1.3 | `err()` factory | **Folded into T1.2** — spike already exposes `err()`; verified by T1.2 tests |
| T1.4 | `toJSON()` with cause chain (depth ≤10, cycle detection); split into src/runtime/serialize.ts | `pnpm run ci` green; nested-cause test; cycle test (`{name:"CycleDetected"}`); depth>10 test (`{name:"Truncated"}`) |
| T1.5 | Location auto-capture (skip own frames + node_modules); split into src/runtime/location.ts | `pnpm run ci` green; real-throw test asserts `file`/`line`; node_modules and own-package frames skipped |
| T1.6 | Context redaction via `CLEARERR_REDACT` env + `.clearerrrc.json` `redact` array; src/runtime/redact.ts + src/shared/config.ts | `pnpm run ci` green; env redaction test; config redaction test; redacted key → `"[redacted]"` |
| T1.7 | `formatForAgent` with `maxBytes` truncation (default 8192); split into src/runtime/format.ts | `pnpm run ci` green; >8KB payload truncated to valid JSON; context+stack truncated before top-level fields; custom maxBytes honored |
| T1.8 | `formatForHuman` — **developer-facing** (terminal/logs) per security model; includes code, message, severity, timestamp, context, fix, cause, location, stack | `pnpm run ci` green; snapshot test; field-presence test for every field |
| T1.9 | `installAgentHandler` + `CLEARERR_FORMAT` env; throws if `process.stderr` unavailable; src/runtime/handler.ts | `pnpm run ci` green; E2E spawn asserts stderr shape; throws in non-Node env; `CLEARERR_FORMAT=json` overrides default |
| T1.10 | README runtime usage | `pnpm run ci` green; install + basic usage + browser-warning section present; samples runnable |

When this phase closes: move this table verbatim to `phases/phase-1.md`,
clear this slot, mark the roadmap row done, activate Phase 2.
