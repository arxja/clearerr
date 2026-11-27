import { err } from "clearerr";

export interface Config {
  port: number;
  dbUrl: string;
  apiKey: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const rawPort = env.PORT ?? "3000";
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw err({
      code: "CONFIG_INVALID_PORT",
      message: `Invalid port ${rawPort}`,
      context: { port: rawPort, expected: "1-65535" },
      fix: { hint: "Set PORT to an integer in 1-65535", retryable: "no" },
      severity: "fatal",
      phase: "validate",
    });
  }

  if (!env.DB_URL) {
    throw err({
      code: "CONFIG_MISSING_ENV",
      message: "DB_URL is required",
      context: { missing: ["DB_URL"] },
      fix: { hint: "Set DB_URL in the environment", retryable: "no" },
      severity: "fatal",
      phase: "validate",
    });
  }

  if (!env.API_KEY) {
    // INTENTIONALLY RAW — linter should flag this
    throw new Error("API_KEY missing");
  }

  return { port, dbUrl: env.DB_URL, apiKey: env.API_KEY };
}