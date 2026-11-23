import { err } from './fixture-utils'

export function internalMissingFix(): never {
  throw err({
    code: 'INTERNAL_MISSING_FIX',
    message: 'internal missing fix',
    context: { id: 1 },
  })
}
