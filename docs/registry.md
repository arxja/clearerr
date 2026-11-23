# clearerr.codes.json

The code registry is the project-level allowlist for structured error codes.
It lets CI reject unknown or dynamic codes and lets tooling list the failure
taxonomy without parsing source files.

## Location

`clearerr.codes.json` sits at the project root (the directory passed to the
linter as its working directory). When the file is absent, registry-backed
checks are inert: no error is raised and `stable-codes` produces no findings.

## Format

The file is a UTF-8 JSON object that maps each error code to a metadata
object. Comments and trailing commas are not allowed.

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

Every key MUST match `^[A-Z][A-Z0-9_]*$`. Every value MUST be a JSON object;
an empty object (`{}`) is valid when no metadata is needed.

### Metadata fields

All fields are optional. Unknown fields are rejected so typos do not silently
hide metadata.

| Field | Type | Meaning |
|---|---|---|
| `description` | string | One-line human description of the failure. |
| `severity` | `"fatal"` \| `"recoverable"` \| `"warning"` | Default severity for the code. |
| `retryable` | `"no"` \| `"once"` \| `"backoff"` | Default retry guidance for the code. |
| `docs` | string | Link to the code's documentation. |

## Stability rules

- A code is an API. Renaming or removing a code is a breaking change and MUST
  be treated as a major-version change for the project.
- New codes MUST be added to the registry in the same change that uses them.
- Codes are compared case-sensitively.

## Consumers

- `stable-codes` (linter): a literal code that is not in the registry is an
  error; a dynamic code is a warning because it cannot be validated.
- `clearerr codes` (CLI): lists the registry contents.
- `clearerr scan` (CI): loads the registry so `stable-codes` can validate
  every literal code in the scanned project.
