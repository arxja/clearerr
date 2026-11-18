# Phase 1 — Runtime core

Goal: Envelope + formatter shipped and tested.
Gate: Flow B passes.

## T1.1 — Scaffold: TS, tsup, Vitest, ESLint, Prettier, Changesets, GH Actions
Status: canceled
Acceptance: pnpm test, pnpm run build green

## T1.2 — ClearerrError per §2, code format validation
Status: done
Acceptance: Constructor / defaults / immutability tests

## T1.3 — err() factory
Status: done
Acceptance: Returns ClearerrError with same shape

## T1.4 — toJSON() with cause chain (depth ≤10, cycle detection)
Status: done
Acceptance: Nested + cycle tests

## T1.5 — Location auto-capture (skip own frames + node_modules)
Status: done
Acceptance: Real throw: file/line correct

## T1.6 — Context redaction (env + config)
Status: todo
Acceptance: Redacted keys → "[redacted]"

## T1.7 — formatForAgent with maxBytes truncation
Status: todo
Acceptance: >8KB truncates safely, valid JSON

## T1.8 — formatForHuman
Status: todo
Acceptance: Snapshot

## T1.9 — installAgentHandler + CLEARERR_FORMAT
Status: todo
Acceptance: E2E spawn: stderr shape

## T1.10 — README: runtime usage
Status: todo
Acceptance: Samples run
