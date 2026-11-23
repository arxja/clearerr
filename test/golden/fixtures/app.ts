import process from 'node:process'
import { err, fail, GoldenError } from './utils'

const dynamicCode = 'GOLDEN_DYNAMIC'

export function bareError(): never {
  throw new Error('golden-01-bare-error')
}

export function bareLiteral(): never {
  // eslint-disable-next-line no-throw-literal
  throw 'golden-02-bare-literal'
}

export function bareCustom(): never {
  throw new GoldenError('golden-03-bare-custom')
}

export function validError(): never {
  throw err({
    code: 'GOLDEN_VALID',
    message: 'golden-04-valid',
    context: { id: 4 },
  })
}

export function missingCode(): never {
  throw err({
    message: 'golden-05-missing-code',
    context: { id: 5 },
  })
}

export function dynamicCodeSite(): never {
  throw err({
    code: dynamicCode,
    message: 'golden-06-dynamic-code',
    context: { id: 6 },
  })
}

export function unknownCode(): never {
  throw err({
    code: 'GOLDEN_UNKNOWN',
    message: 'golden-07-unknown-code',
    context: { id: 7 },
  })
}

export function emptyCode(): never {
  throw err({
    code: '',
    message: 'golden-08-empty-code',
    context: { id: 8 },
  })
}

export function missingContext(): never {
  throw err({
    code: 'GOLDEN_MISSING_CONTEXT',
    message: 'golden-09-missing-context',
  })
}

export function emptyContext(): never {
  throw err({
    code: 'GOLDEN_EMPTY_CONTEXT',
    message: 'golden-10-empty-context',
    context: {},
  })
}

export function dynamicContext(context: Record<string, unknown>): never {
  throw err({
    code: 'GOLDEN_DYNAMIC_CONTEXT',
    message: 'golden-11-dynamic-context',
    context,
  })
}

export function causeMissing(): never {
  try {
    fail('golden original cause')
  }
  catch (error) {
    throw err({
      code: 'GOLDEN_CAUSE_MISSING',
      message: 'golden-12-cause-missing',
      context: { error },
    })
  }
}

export function causePreserved(): never {
  try {
    fail('golden original cause ok')
  }
  catch (error) {
    throw err(
      {
        code: 'GOLDEN_CAUSE_OK',
        message: 'golden-13-cause-ok',
        context: { error },
      },
      { cause: error },
    )
  }
}

export function optionalCatch(): never {
  try {
    fail('golden original optional catch')
  }
  catch {
    throw err({
      code: 'GOLDEN_OPTIONAL_CATCH',
      message: 'golden-14-optional-catch',
      context: { id: 14 },
    })
  }
}

export function customStructured(): never {
  throw new GoldenError({
    code: 'GOLDEN_CUSTOM_STRUCTURED',
    message: 'golden-15-custom-structured',
    context: { id: 15 },
  })
}

export function noFixOutsideBoundary(): never {
  throw err({
    code: 'GOLDEN_NO_FIX_OUTSIDE',
    message: 'golden-16-no-fix-outside',
    context: { id: 16 },
  })
}

export function spreadContext(base: Record<string, unknown>): never {
  throw err({
    code: 'GOLDEN_SPREAD_CONTEXT',
    message: 'golden-17-spread-context',
    context: { ...base },
  })
}

export function exitWithMessage(): never {
  process.exit('golden-18-process-exit')
}

export const constructed = new GoldenError({
  code: 'GOLDEN_CONSTRUCTED',
  message: 'golden-19-constructed',
  context: { id: 19 },
})
