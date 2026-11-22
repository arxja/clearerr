import { err } from './fixture-utils'

export function missingFix(): never {
  throw err({
    code: 'BOUNDARY_MISSING_FIX',
    message: 'missing fix',
    context: { id: 1 },
  })
}

export function missingHint(): never {
  throw err({
    code: 'BOUNDARY_MISSING_HINT',
    message: 'missing hint',
    context: { id: 2 },
    fix: { retryable: 'no' },
  })
}

export function emptyHint(): never {
  throw err({
    code: 'BOUNDARY_EMPTY_HINT',
    message: 'empty hint',
    context: { id: 3 },
    fix: { hint: '', retryable: 'no' },
  })
}

export function validHint(): never {
  throw err({
    code: 'BOUNDARY_VALID_HINT',
    message: 'valid hint',
    context: { id: 4 },
    fix: { hint: 'Retry after the upstream service recovers.', retryable: 'backoff' },
  })
}

export function dynamicFix(fix: { hint: string, retryable: 'no' }): never {
  throw err({
    code: 'BOUNDARY_DYNAMIC_FIX',
    message: 'dynamic fix',
    context: { id: 5 },
    fix,
  })
}

export function dynamicHint(hint: string): never {
  throw err({
    code: 'BOUNDARY_DYNAMIC_HINT',
    message: 'dynamic hint',
    context: { id: 6 },
    fix: { hint, retryable: 'no' },
  })
}
