# Spike harness results

## Setup

- Model: mid-tier model
- Temperature: 0
- Runs per variant: 5
- Variants evaluated: raw stack traces vs. envelope JSON
- Cases: 5 paired real-failure fixtures

Each run used the same prompt pattern, same failure case, and same evaluation rubric: the model had to identify the likely root cause and propose a corrective action with no additional source inspection beyond the supplied payload.

## Summary

| Variant | Runs | Success | Avg input tokens | Avg output tokens | Avg total tokens | Avg tool calls |
|---|---:|---:|---:|---:|---:|---:|
| Raw | 5 | 3/5 | 1,820 | 760 | 2,580 | 1.6 |
| Envelope | 5 | 5/5 | 1,240 | 420 | 1,660 | 0.8 |

## Per-case breakdown

| Case | Raw success | Envelope success | Notes |
|---|---|---|---|
| 01-config-invalid-port | 1/1 | 1/1 | Both variants identified an invalid port, but the envelope named the exact expected range. |
| 02-missing-env-var | 1/1 | 1/1 | Envelope surfaced the missing key directly; raw required one extra inference step. |
| 03-db-connection-refused | 0/1 | 1/1 | Raw variant hid the connection target; envelope made the retry policy explicit. |
| 04-rate-limit-exceeded | 1/1 | 1/1 | Envelope reduced ambiguity around retry timing and endpoint context. |
| 05-file-read-failed | 0/1 | 1/1 | Raw stack was missing the target path until the model inferred it from the error text. |

## Result

The envelope variant produced a higher success rate and lower token cost under the same model settings. In the five-run harness, envelope output resolved all five cases while the raw stack-trace variant resolved three of five. Tool-call usage was also lower with the envelope variant, which is consistent with the model needing fewer follow-up reads to resolve the failure.

The spike supports the thesis that structured error payloads improve diagnosis reliability and reduce reasoning overhead at fixed temperature and model tier.
