/** Shared stand-ins so rule fixtures stay small and type-check cleanly. */

export class AppError extends Error {
  constructor(spec: Record<string, unknown> | string) {
    super(typeof spec === 'string'
      ? spec
      : String(spec.message))
  }
}

export function err(spec: Record<string, unknown>, options?: { cause?: unknown }): Error {
  return new Error(String(spec.message), options)
}
