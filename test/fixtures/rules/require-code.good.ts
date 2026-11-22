import { AppError, err } from './fixture-utils'

export function literalCode(): never {
  throw err({
    code: 'LITERAL_CODE',
    message: 'literal code',
    context: { id: 1 },
  })
}

export function assertedLiteralCode(): never {
  throw err({
    code: 'ASSERTED_CODE' as const,
    message: 'asserted literal code',
    context: { id: 2 },
  })
}

export function constructorLiteralCode(): never {
  throw new AppError({
    code: 'CONSTRUCTOR_CODE',
    message: 'constructor literal code',
    context: { id: 3 },
  })
}

export function nativeError(): Error {
  return new Error('native error')
}
