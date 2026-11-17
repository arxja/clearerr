# Clearerr Plan

Dev-time plan. At release, replace with user-facing docs.

Status: Phase 1 — Runtime core (in progress)
Envelope spec: docs/envelope.md
Phase archive: docs/phases/phase_00.md
Current phase: docs/phases/phase_01.md

## Scope (v1)

Runtime: ClearerrError, err(), cause-chain serialization, location capture, context redaction, formatForAgent / formatForHuman, installAgentHandler.
Static: 6 ts-morph rules, code registry validation, coverage score.
CLI: init, scan, codes; terminal + JSON output; config; exit codes.
Tests: unit + fixtures + e2e CLI.

Out of scope: LLM judge · SARIF · GitHub Action · badge · measurement harness · separate human-clarity score · auto-fix · other languages · hosted anything · public scorecard.

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

Phase 0 is archived in docs/phases/phase_00.md. The active runtime work continues in docs/phases/phase_01.md.
