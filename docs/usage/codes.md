# Error codes

Codes are the stable keys agents use to recognize a failure and choose a
recovery path. They are project-owned and live in `clearerr.codes.json`.

Back to [start here](start-here.md). Related: [Errors and the envelope](errors.md),
[Scanning and coverage](scanning.md).

## Why a registry

The registry is the project-level allowlist for error codes. It lets CI reject
unknown codes and lets tooling list the failure taxonomy without parsing source
files. It also gives each code one place for its default severity, retry
guidance, description, and docs link.

## Location and format

`clearerr.codes.json` sits at the project root (the directory passed to the
linter as its working directory).

```json
{
  "CONFIG_INVALID_PORT": {
    "description": "The configured port is outside 1-65535.",
    "severity": "fatal",
    "retryable": "no",
    "docs": "https://example.com/docs/errors#config-invalid-port"
  },
  "DB_CONNECTION_REFUSED": {
    "severity": "recoverable",
    "retryable": "backoff"
  }
}
```

Rules:

- Keys must match `^[A-Z][A-Z0-9_]*$` and are compared case-sensitively.
- Every value must be a JSON object. `{}` is valid.
- Only `description`, `severity`, `retryable`, and `docs` are allowed. Unknown
  fields are rejected so typos cannot hide metadata.
- Comments and trailing commas are not valid JSON.
- Duplicate keys are rejected by `clearerr codes`; `JSON.parse` alone would
  silently keep the last one.

## Metadata

| Field | Type | Meaning |
|---|---|---|
| `description` | string | One-line human description of the failure. |
| `severity` | `fatal` \| `recoverable` \| `warning` | Default severity for the code. |
| `retryable` | `no` \| `once` \| `backoff` | Default retry guidance for the code. |
| `docs` | string | Link to the code's documentation. |

Metadata is descriptive. The runtime does not apply it automatically; read it
in your own error-handling or documentation layer.

## What enforces the registry

- `clearerr codes` lists the registry and validates format, metadata, and
  duplicates. Exit code `1` on invalid content. A missing registry is not an
  error; the command prints a hint and exits `0`.
- `clearerr scan` loads the registry and runs `stable-codes`. A literal code
  that is not registered is an **error**; a dynamic code is a **warning**
  because it cannot be validated ahead of time.
- Absent registry: `stable-codes` is inert. `require-code` still requires a
  literal code.
- The runtime validates the **format** of the code only. Registry membership is
  a lint/CI invariant, not a runtime check.

```sh
pnpm exec clearerr codes
```

## Stability rules

- A code is an API. Renaming or removing a code is a breaking change and should
  be treated as a major-version change for the project.
- New codes should be added to the registry in the same change that uses them.
- Codes are compared case-sensitively.

The full contract is in [docs/registry.md](../registry.md).

---

Previous: [Errors and the envelope](errors.md) | Next: [Configuration](configuration.md)
