import { err } from "clearerr";

export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
    }
  }
  throw err(
    {
      code: "RETRY_EXHAUSTED",
      message: `All ${attempts} retry attempts failed`,
      context: { attempts, lastErrorName: (last as Error)?.name },
      fix: { hint: "Check upstream health; retryable pattern is already applied", retryable: "no" },
      severity: "fatal",
      phase: "retry",
    },
    { cause: last },
  );
}