import { AppError, err } from './fixture-utils'

export function structuredErr(): never {
  throw err({
    code: 'STRUCTURED_ERR',
    message: 'structured err',
    context: { id: 1 },
  })
}

export function structuredConstructor(): never {
  throw new AppError({
    code: 'STRUCTURED_CONSTRUCTOR',
    message: 'structured constructor',
    context: { id: 2 },
  })
}

export function structuredAsserted(): never {
  // eslint-disable-next-line no-throw-literal
  throw err({
    code: 'STRUCTURED_ASSERTED',
    message: 'structured asserted',
    context: { id: 3 },
  }) as Error
}

export function createdButNotThrown(): Error {
  return new Error('not thrown')
}
