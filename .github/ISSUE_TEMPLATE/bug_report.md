---
name: Bug report
about: Report a crash, false positive, bad output, or other incorrect behavior
title: "[Bug]: "
labels: bug
assignees: ""
---

## Before you start

- Search existing issues to avoid duplicates.
- This template is for public bugs. Do **not** report security issues here; see
  [the security guidance](../docs/usage/security.md).
- Clearerr is pre-v1. Include the exact version or commit you tested.

## What happened?

A clear description of the incorrect behavior.

## Reproduction

Steps to reproduce, ideally with a minimal repository or a small code snippet.

```sh
# commands you ran
```

```ts
// smallest code that triggers the problem
```

## Expected behavior

What you expected Clearerr to do.

## Actual behavior

What happened instead. Include the relevant output.

```text
# terminal output (remove secrets)
```

If the problem is a scan finding, include the JSON report:

```sh
clearerr scan --format json
```

```json
// paste the report, or the relevant finding
```

If the problem is runtime behavior, include the envelope (redact secrets):

```json
// paste the envelope emitted on stderr
```

## Is this a false positive?

If a rule fired on code you believe is correct, fill this in:

- Rule ID:
- File and line:
- Code snippet:
- Why the finding is wrong:

## Environment

| Item | Value |
|---|---|
| Clearerr version or commit | |
| Install method (`pnpm add`, workspace, local checkout) | |
| Node.js version (`node --version`) | |
| Package manager and version | |
| TypeScript version | |
| Operating system | |
| Terminal or CI environment | |

## Configuration

Paste the relevant parts of `.clearerrrc.json` and `clearerr.codes.json`
(remove secrets):

```json
// .clearerrrc.json
```

```json
// clearerr.codes.json
```

## Additional context

Anything else that helps: screenshots, logs, related issues, whether the problem
is intermittent, and whether it started after a specific change.
