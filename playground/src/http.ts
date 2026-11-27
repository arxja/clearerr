import { err } from "clearerr";

export async function fetchUser(id: string): Promise<{ id: string }> {
  const status = id === "expired" ? 401 : id === "flood" ? 429 : 200;

  if (status === 401) {
    throw err({
      code: "HTTP_AUTH_EXPIRED",
      message: "Upstream rejected token",
      context: { endpoint: "/api/user", status, userId: id },
      fix: { hint: "Refresh OAuth token and retry once", retryable: "once" },
      severity: "recoverable",
      phase: "request",
    });
  }

  if (status === 429) {
    // INTENTIONALLY MISSING fix.hint — this is a boundary file (see .clearerrrc.json)
    // linter's require-fix-hint should flag it
    throw err({
      code: "HTTP_RATE_LIMITED",
      message: "Rate limited by upstream",
      context: { endpoint: "/api/user", retryAfterMs: 3000 },
      severity: "recoverable",
      phase: "request",
    });
  }

  return { id };
}