# Clearerr usage guide

Start here. The full guide is split into short pages so you can read only what
you need. If you want the one-screen version, read the
[root README](../../README.md).

> **Status:** Clearerr is pre-v1 (`0.0.0`). The API and envelope schema are
> locked for v1, but the package is not published yet and adoption is still
> being dogfooded. Pin an exact version when the first release lands.

## What Clearerr is

A raw stack trace answers "where did it break?" but not "what was the state,
what should I do, and is retrying safe?". Clearerr adds that information and
keeps it machine-readable.

| Part | Entry point | What it does |
|---|---|---|
| Runtime | `import { err, installAgentHandler } from 'clearerr'` | Builds a `ClearerrError`, captures location, serializes the cause chain, emits one-line JSON on an uncaught error. |
| Linter | `clearerr scan` / `clearerr/linter` | Finds throw sites and error constructors, enforces six rules, scores structured-error coverage. |
| CLI | `clearerr init` / `scan` / `codes` | Scaffolds config, runs the linter, lists and validates the code registry, controls CI exit codes. |

They share one unit: the **envelope**, a small JSON object with a stable
`schemaVersion` that an agent can parse without reading source.

Clearerr is **not** an error-reporting service, a logger, a user-facing error
page, or a browser library. It produces structured data for servers, CLIs, CI,
logs, and agents.

## Choose a path

| If you want to... | Read |
|---|---|
| Install and get one structured error working | [Getting started](getting-started.md) |
| Understand the JSON an agent will consume | [Errors and the envelope](errors.md) |
| Set up the error-code registry | [Error codes](codes.md) |
| Configure scanning and boundaries | [Configuration](configuration.md) |
| Learn the rules, output formats, and coverage score | [Scanning and coverage](scanning.md) |
| Add a CI gate | [CI enforcement](ci.md) |
| Install the runtime handler and format errors | [Runtime handler](runtime.md) |
| Understand redaction and browser safety | [Redaction and security](security.md) |
| Parse envelopes and decide about retries | [Consuming envelopes](for-agents.md) |
| Migrate an existing codebase | [Migration and adoption](migration.md) |
| Use the library programmatically | [Programmatic API](api.md) |
| Fix a problem | [Troubleshooting](troubleshooting.md) |
| Check what v1 does not do | [Limits and non-goals](limits.md) |

## The five-minute path

1. [Install Clearerr](getting-started.md#install) and run `clearerr init`.
2. [Register one error code](codes.md).
3. [Replace one throw](errors.md#writing-a-good-error-spec) with
   `throw err({...})`.
4. [Install the handler](runtime.md) once at process startup.
5. [Scan the project](scanning.md) and read the coverage footer.
6. [Gate the scan in CI](ci.md).

## Reference material

These documents define contracts rather than teach usage:

- [Envelope spec](../envelope.md) - locked wire shape and security model.
- [Coverage rubric](../rubric.md) - exactly what counts as covered.
- [Code registry spec](../registry.md) - registry format and stability rules.
- [Decisions](../decisions.md) - accepted design decisions and phase gates.
- [Plan](../PLAN.md) - scope, flows, and current focus.

## Getting help

- Found a defect or a false positive? Open a
  [bug report](../../.github/ISSUE_TEMPLATE/bug_report.md).
- Want new behavior? Open a
  [feature request](../../.github/ISSUE_TEMPLATE/feature_request.md). Phase 4
  scope requires dogfood evidence for new features, so include it if you have
  it.
- Do not report security issues publicly; see
  [Redaction and security](security.md).

---

Next: [Getting started](getting-started.md)
