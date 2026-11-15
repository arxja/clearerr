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
