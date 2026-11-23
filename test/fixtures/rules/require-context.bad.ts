import { AppError, err } from './fixture-utils'

export function missingContext(): never {
  throw err({
    code: 'MISSING_CONTEXT',
    message: 'missing context',
  })
}

export function emptyContext(): never {
  throw err({
    code: 'EMPTY_CONTEXT',
    message: 'empty context',
    context: {},
  })
}

export function nullContext(): never {
  throw err({
    code: 'NULL_CONTEXT',
    message: 'null context',
    context: null,
  })
}

export function undefinedContext(): never {
  throw err({
    code: 'UNDEFINED_CONTEXT',
    message: 'undefined context',
    context: undefined,
  })
}

export function missingConstructorContext(): never {
  throw new AppError({
    code: 'MISSING_CONSTRUCTOR_CONTEXT',
    message: 'missing constructor context',
  })
}

export function numericContext(): never {
  throw err({
    code: 'NUMERIC_CONTEXT',
    message: 'numeric context',
    context: 1,
  })
}

export function stringContext(): never {
  throw err({
    code: 'STRING_CONTEXT',
    message: 'string context',
    context: 'id',
  })
}

export function booleanContext(): never {
  throw err({
    code: 'BOOLEAN_CONTEXT',
    message: 'boolean context',
    context: true,
  })
}
