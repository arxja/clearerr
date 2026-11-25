---
name: Feature request
about: Propose a new capability or a change to existing behavior
title: "[Feature]: "
labels: enhancement
assignees: ""
---

## Before you start

- Search existing issues and read [PLAN.md](../docs/PLAN.md) for the v1 scope.
- Clearerr is in Phase 4 (dogfood). New features are expected to come from real
  adoption friction, not speculation. If you have dogfood evidence, include it.
- Changes to the envelope wire shape require updating `docs/envelope.md` and
  bumping `schemaVersion`. Explain why the existing fields are insufficient.
- Do not use this template for security issues.

## Problem

What are you trying to do, and what blocks you today? Describe the real
workflow or failure, not only the proposed API.

```ts
// current workaround, if any
```

## Proposed solution

What should Clearerr do? Include the API or CLI shape you have in mind.

```ts
// proposed usage
```

```sh
# proposed command, if applicable
```

## Alternatives considered

Other approaches, workarounds, or tools you tried, and why they are not enough.

## Dogfood evidence

Help us judge priority:

- Are you using Clearerr in a real project? For how long?
- Is this friction recorded in `docs/dogfood.md`? Paste the item.
- What happens if this is not implemented? (blocked migration, noisy findings,
  missing diagnosis, etc.)

## Scope check

Check anything that applies:

- [ ] This fits the v1 scope in `PLAN.md`.
- [ ] This is driven by dogfood friction.
- [ ] This changes the envelope schema (requires a spec update and
      `schemaVersion` bump).
- [ ] This changes an existing rule's behavior.
- [ ] This adds a new rule.
- [ ] This is CLI/configuration only.
- [ ] This is a documentation change.
- [ ] This may be out of scope for v1.

## Additional context

Examples from other tools, links, screenshots, related issues, and any
constraints we should know about.
