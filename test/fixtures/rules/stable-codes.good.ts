import { AppError, err } from './fixture-utils'

export function knownCode(): never {
  throw err({
    code: 'KNOWN_CODE',
    message: 'known code',
    context: { id: 1 },
  })
}

export function assertedKnownCode(): never {
  throw err({
    code: 'ASSERTED_KNOWN' as const,
    message: 'asserted known code',
    context: { id: 2 },
  })
}

export function constructorKnownCode(): never {
  throw new AppError({
    code: 'CONSTRUCTOR_KNOWN',
    message: 'constructor known code',
    context: { id: 3 },
  })
}

export function notASpec(): never {
  throw new Error('not a structured error')
}
