# Decisions

## 6.1 Envelope-first error model is the right default

Status: approved
Gate: passed

The Phase 0 spike compared raw stack traces against structured envelope payloads across five real failures under identical model settings. The envelope variant succeeded in 5/5 cases, while the raw variant succeeded in 3/5 cases. It also reduced average total token cost from 2,580 to 1,660 and reduced tool-call usage from 1.6 to 0.8 calls per run.

The largest gains appeared in the cases where the raw stack trace hid the actionable state: DB connection refusal, file-read failures, and missing configuration context. The envelope surfaced the exact code, location, context, and retry guidance without requiring the agent to infer missing facts from a noisy trace.

Decision: continue with an envelope-first runtime and agent contract. Clearerr should emit structured `ClearerrError` payloads with code, message, location, context, fix, severity, and cause metadata; agents should consume that payload before consulting source files.

This gate is complete and the spike supports proceeding into the runtime implementation phase.
