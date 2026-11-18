# Phase 4 — Dogfood

Goal: Use in ≥1 real project for 30 days.
Gate: §1 done-when met.

## T4.1 — Adopt in ≥1 real project; migrate incrementally
Status: todo
Acceptance: Coverage ≥80%

## T4.2 — Log friction (false positives, API, missing fields)
Status: todo
Acceptance: docs/dogfood.md

## T4.3 — Iterate based on dogfood
Status: todo
Acceptance: Each change: doc + test

Goal: Use in ≥1 real project for 30 days.
Gate: §1 done-when met.

Scope guardrails: no new features unless driven by dogfood friction; every
change is a doc update + a test.

| ID | Task | Acceptance |
|---|---|---|
| T4.1 | Adopt in ≥1 real project; migrate incrementally | `clearerr scan --ci` runs on real project in CI; coverage ≥80% |
| T4.2 | Log friction in `docs/dogfood.md`: false positives, API ergonomics, missing fields | Doc committed; each friction item: rule/file context + suggested change |
| T4.3 | Iterate based on dogfood | Each change: doc update + test; PR references the friction item from T4.2 |

When this phase closes: mark §1 done-when met, archive this file, project is
ready for v1 release.