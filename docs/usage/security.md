# Redaction and security

Envelopes are built for servers, CLIs, CI, logs, terminals, and agents. They are
not built for end-user browser surfaces. This page covers what is safe, what is
not, and how redaction behaves.

Back to [start here](start-here.md). Related: [Runtime handler](runtime.md),
[Errors and the envelope](errors.md).

## Redaction is a backstop, not a policy

Context may contain secrets. Configure exact key names to replace with
`[redacted]`:

```sh
CLEARERR_REDACT=password,token,authorization pnpm start
```

```json
// .clearerrrc.json
{ "redact": ["password", "token", "authorization"] }
```

The two sources are merged and deduplicated. Matching is case-sensitive, exact,
and recursive through plain objects and arrays. It only redacts **keys**; it
cannot detect a secret stored under an innocuous key:

```ts
context: { endpoint: 'http://10.0.0.5' } // not redacted
```

The runtime reads `.clearerrrc.json` from `process.cwd()` when an error is
constructed. If your process starts elsewhere, pass keys programmatically with
`redactValue(value, keys)` or set the working directory appropriately.

## Safe vs unsafe for end users

- Safe: `code`, `message` (you choose it), `severity`, `timestamp`.
- Not safe by default: `context`, `fix.hint`, `cause`, `location`.

`context` can contain secret values, internal endpoints, topology, or PII.
`fix.hint` reveals internal reasoning about failure modes. The `cause` chain
reveals service topology. `location` is already exposed by browser stacks, but
strip it for cleanliness.

## Browser guidance

Do **not** install `installAgentHandler` or throw `ClearerrError` from browser
production code:

- DevTools exposes the raw object regardless of `toJSON`.
- Third-party reporting services serialize enumerable properties, including
  `context`, `fix`, and `cause`.
- `installAgentHandler` is Node-only and writes process output.

Clearerr has no browser runtime and no `formatForUser` in v1.

## Reporting services

If you forward a `ClearerrError` to Sentry, DataDog, or another service, strip or
redact `context`, `fix`, and `cause` at the transport layer before sending. The
library cannot know which fields are sensitive in your application.

## Dev-only envelopes

If you want envelopes only outside production, gate at the **call site**, not in
the library:

```ts
const fail = process.env.NODE_ENV === 'production'
  ? () => { throw new Error('Internal error') }
  : () => { throw err({ code: 'DEV_ONLY_FAILURE', message: '...' }) }
```

Keeping envelopes in production **server logs** is recommended. The concern is
browser and end-user surfaces.

## User-facing errors

User-facing copy is the application's job: read `code` and `message`, map them to
your own text, and decide what to render. Do not render `context`, `fix`, or
`cause` to users.

The full security model is in [docs/envelope.md](../envelope.md).

---

Previous: [Runtime handler](runtime.md) | Next: [Consuming envelopes](agents.md)
