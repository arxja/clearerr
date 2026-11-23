import { AppError, err } from './fixture-utils'

const dynamicCode = 'DYNAMIC_CODE'
const suffix = 'SUFFIX'

export function unknownCode(): never {
  throw err({
    code: 'UNKNOWN_CODE',
    message: 'unknown code',
    context: { id: 1 },
  })
}

export function unknownConstructorCode(): never {
  throw new AppError({
    code: 'UNKNOWN_CONSTRUCTOR_CODE',
    message: 'unknown constructor code',
    context: { id: 2 },
  })
}

export function identifierCode(): never {
  throw err({
    code: dynamicCode,
    message: 'identifier code',
    context: { id: 3 },
  })
}

export function templateCode(): never {
  throw err({
    code: `PREFIX_${suffix}`,
    message: 'template code',
    context: { id: 4 },
  })
}

export function missingCode(): never {
  throw err({
    message: 'missing code',
    context: { id: 5 },
  })
}

export function emptyCode(): never {
  throw err({
    code: '',
    message: 'empty code',
    context: { id: 6 },
  })
}
