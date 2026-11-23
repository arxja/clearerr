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

export function nullFix(): never {
  throw err({
    code: 'BOUNDARY_NULL_FIX',
    message: 'null fix',
    context: { id: 7 },
    fix: null,
  })
}

export function undefinedFix(): never {
  throw err({
    code: 'BOUNDARY_UNDEFINED_FIX',
    message: 'undefined fix',
    context: { id: 8 },
    fix: undefined,
  })
}

export function nullHint(): never {
  throw err({
    code: 'BOUNDARY_NULL_HINT',
    message: 'null hint',
    context: { id: 9 },
    fix: { hint: null, retryable: 'no' },
  })
}

export function undefinedHint(): never {
  throw err({
    code: 'BOUNDARY_UNDEFINED_HINT',
    message: 'undefined hint',
    context: { id: 10 },
    fix: { hint: undefined, retryable: 'no' },
  })
}
