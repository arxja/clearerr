# Changelog

## 0.1.0 — 2026-11-28

First public pre-release. API is functional but not frozen yet, minor versions
may include breaking changes until 1.0.0.

### Added
- Envelope v1: `ClearerrError`, `err()`, `toJSON()` with cause chain
- `formatForAgent` (single-line JSON, maxBytes truncation)
- `formatForHuman` (developer-facing)
- `installAgentHandler` (Node stderr)
- Location auto-capture, context redaction
- Linter: 6 rules (`no-bare-throw`, `require-code`, `require-context`,
  `preserve-cause`, `require-fix-hint`, `stable-codes`)
- CLI: `init`, `scan`, `codes`; terminal + JSON output; exit codes
- Coverage scoring with `--fail-on` threshold

### Validated
According to study: **+40pp diagnosis success · −36% tokens · −50% tool calls**
vs raw stack traces (5 fixtures, temp 0, mid-tier model). Full methodology in
`docs/decisions.md`.