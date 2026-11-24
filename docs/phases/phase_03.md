# Phase 3 — CLI + CI

Goal: init, scan, codes, config, exit codes.
Gate: Flows A and D work end-to-end.

## T3.1 — Bin (citty + picocolors): scan, init, codes
Status: done
Acceptance: npx clearerr --help works

## T3.2 — Config loader .clearerrrc.json with zod
Status: done
Acceptance: Invalid config fails clearly

## T3.3 — Terminal reporter (grouped, colored, coverage footer)
Status: done
Acceptance: Snapshot

## T3.4 — JSON reporter (--format json)
Status: done
Acceptance: Matches §2 finding shape

## T3.5 — clearerr init scaffolds config + empty registry
Status: done
Acceptance: Idempotent; --force to overwrite

## T3.6 — --ci exit 1 on error severity; --fail-on threshold
Status: done
Acceptance: E2E exit codes

## T3.7 — clearerr codes lists + validates (dupes, format)
Status: done
Acceptance: E2E

## T3.8 — README: install / adopt / CI / before-after; docs/rubric.md
Status: done
Acceptance: Docs complete

Goal: init, scan, codes, config, exit codes.
Gate: Flows A and D work end-to-end.

Scope guardrails: no changes to linter rules or runtime; CLI only orchestrates.

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