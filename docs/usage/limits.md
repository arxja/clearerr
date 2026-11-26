# Limits and non-goals

Know what Clearerr v1 does not do before you design around it.

Back to [start here](start-here.md). Related: [Troubleshooting](troubleshooting.md),
[Envelope spec](../envelope.md), [Plan](../PLAN.md).

## Not in v1

- browser runtime or user-facing rendering
- a `formatForUser` function
- automatic retries or auto-fix
- SARIF output, GitHub Action, badges, hosted scorecards
- LLM judging or a separate human-clarity score
- support for languages other than TypeScript/JavaScript
- ignore comments or inline rule suppression

## Other limits

- `traceId` exists in the type but cannot be set from a spec in v1.
- The runtime checks code **format**, not registry membership.
- Coverage measures structure, not message quality.
- Rules are syntactic; dynamic values are assumed to be valid where they cannot
  be inspected. `stable-codes` still reports a warning for a dynamic `code` when
  a registry is configured, so scans configured to fail on warnings can fail as
  a result.
- `preserve-cause` only recognizes `err(...)`, `new ...Error(...)`, and direct
  rethrows inside a lexical `catch`.
- No ratchet automation; use `coverageThreshold` manually.
- The package is ESM-only and Node-only.

## Scope changes

The v1 scope is defined in [PLAN.md](../PLAN.md). Adding a feature requires a
scope decision and, during Phase 4, evidence from dogfood friction. Changes to
the envelope wire shape also require updating
[docs/envelope.md](../envelope.md) and bumping `schemaVersion`.

Have a concrete need? Open a
[feature request](../../.github/ISSUE_TEMPLATE/feature_request.md) and describe
the real failure or workflow it unblocks.

---

Previous: [Troubleshooting](troubleshooting.md) | Back to [start here](start-here.md)
