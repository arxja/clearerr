import { err } from "clearerr";

export async function readRequired(path: string): Promise<string> {
  try {
    const { readFile } = await import("node:fs/promises");
    return await readFile(path, "utf8");
  } catch (e) {
    throw err(
      {
        code: "FILE_NOT_FOUND",
        message: `Required file missing: ${path}`,
        // INTENTIONALLY empty context — linter's require-context should flag
        context: {},
        fix: { hint: `Ensure ${path} is bundled / present`, retryable: "no" },
        severity: "fatal",
        phase: "load",
      },
      { cause: e },
    );
  }
}