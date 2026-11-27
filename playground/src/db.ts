import { err } from "clearerr";

async function connect(url: string, timeoutMs: number): Promise<{ ok: true }> {
  await new Promise((r) => setTimeout(r, Math.min(timeoutMs, 10)));
  if (url.includes("timeout")) {
    throw new Error("ETIMEDOUT");
  }
  return { ok: true };
}

export async function withDb<T>(
  url: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    await connect(url, 5000);
    return await fn();
  } catch (e) {
    if (e instanceof Error && e.message === "ETIMEDOUT") {
      throw err(
        {
          code: "DB_POOL_TIMEOUT",
          message: "DB connection pool timed out after 5000ms",
          context: { poolSize: 10, timeoutMs: 5000 },
          fix: { hint: "Increase pool size or timeout; check for slow queries", retryable: "backoff" },
          severity: "recoverable",
          phase: "connect",
        },
        { cause: e },
      );
    }
    // INTENTIONALLY RAW — rethrow without cause; linter should flag
    throw e;
  }
}