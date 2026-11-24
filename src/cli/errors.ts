import process from 'node:process'

/** Turns an unknown thrown value into a message suitable for a terminal. */
export function describeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error)
}

/** Writes a CLI error to stderr in a consistent, actionable form. */
export function writeCliError(error: unknown): void {
  process.stderr.write(`clearerr: ${describeError(error)}\n`)
}
