import { err, fail } from './utils'

export function missingFix(): never {
  throw err({
    code: 'GOLDEN_BOUNDARY_MISSING_FIX',
    message: 'golden-20-boundary-missing-fix',
    context: { id: 20 },
  })
}

export function missingHint(): never {
  throw err({
    code: 'GOLDEN_BOUNDARY_MISSING_HINT',
    message: 'golden-21-boundary-missing-hint',
    context: { id: 21 },
    fix: { retryable: 'no' },
  })
}

export function emptyHint(): never {
  throw err({
    code: 'GOLDEN_BOUNDARY_EMPTY_HINT',
    message: 'golden-22-boundary-empty-hint',
    context: { id: 22 },
    fix: { hint: '', retryable: 'no' },
  })
}

export function validHint(): never {
  throw err({
    code: 'GOLDEN_BOUNDARY_OK',
    message: 'golden-23-boundary-ok',
    context: { id: 23 },
    fix: { hint: 'Retry after the upstream service recovers.', retryable: 'backoff' },
  })
}

export function dynamicFix(fix: { hint: string, retryable: 'no' }): never {
  throw err({
    code: 'GOLDEN_BOUNDARY_DYNAMIC_FIX',
    message: 'golden-24-boundary-dynamic-fix',
    context: { id: 24 },
    fix,
  })
}

export function dynamicHint(hint: string): never {
  throw err({
    code: 'GOLDEN_BOUNDARY_DYNAMIC_HINT',
    message: 'golden-25-boundary-dynamic-hint',
    context: { id: 25 },
    fix: { hint, retryable: 'no' },
  })
}

export function missingContext(): never {
  throw err({
    code: 'GOLDEN_BOUNDARY_MISSING_CONTEXT',
    message: 'golden-26-boundary-missing-context',
    fix: { hint: 'Check the request payload.', retryable: 'no' },
  })
}

export function unknownCode(): never {
  throw err({
    code: 'GOLDEN_BOUNDARY_UNKNOWN',
    message: 'golden-27-boundary-unknown-code',
    context: { id: 27 },
    fix: { hint: 'Add the code to the registry.', retryable: 'no' },
  })
}

export function causeMissing(): never {
  try {
    fail('golden original boundary cause')
  }
  catch (error) {
    throw err({
      code: 'GOLDEN_BOUNDARY_CAUSE_MISSING',
      message: 'golden-28-boundary-cause-missing',
      context: { error },
      fix: { hint: 'Retry after the upstream service recovers.', retryable: 'backoff' },
    })
  }
}

export function bareError(): never {
  throw new Error('golden-29-boundary-bare')
}

export function dynamicCode(): never {
  throw err({
    code: `GOLDEN_BOUNDARY_${'DYNAMIC'}`,
    message: 'golden-30-boundary-dynamic-code',
    context: { id: 30 },
    fix: { hint: 'Replace the dynamic code with a literal.', retryable: 'no' },
  })
}
