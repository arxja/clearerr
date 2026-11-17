## Rules that apply everywhere

- **MUST**, **MUST NOT**, **SHOULD** and **MAY** use RFC 2119 meanings. They mark
  real invariants - layer boundaries, wire contracts, output shapes - not house style.
- Before a PR, all gates MUST pass:
  `pnpm ci`.
  Commits follow Conventional Commits.

## Read order
1. This file.
2. PLAN.md — scope, flows, roadmap, current focus.
3. The phase task file linked from PLAN.md for the task in progress.
4. docs/envelope.md — only when the task touches runtime/envelope behavior.

Do not read all phase files. Read only the task being implemented.

## Source of truth
- Envelope spec: docs/envelope.md
- Roadmap + scope + flows: PLAN.md
- Tasks + acceptance: docs/plan/phase-*.md
- Decisions + phase gate: docs/decisions.md

## Commands
```sh
pnpm test
pnpm build
pnpm lint
```

## Rules
- One task per PR.
- Acceptance test copied verbatim from the task file.
- Update task status in the same PR that completes the task.
- Do not change the envelope schema without updating docs/envelope.md and schemaVersion.
- Do not do out-of-scope work. Stop and report if blocked.
- Prefer adding tests over editing acceptance criteria.
- Do not read phases/. That folder is a closed archive. unless the user asks