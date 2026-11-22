import { AppError, err } from './fixture-utils'

const dynamicCode = 'DYNAMIC_CODE'
const suffix = 'SUFFIX'

export function missingCode(): never {
  throw err({
    message: 'missing code',
    context: { id: 1 },
  })
}

export function identifierCode(): never {
  throw err({
    code: dynamicCode,
    message: 'identifier code',
    context: { id: 2 },
  })
}

export function templateCode(): never {
  throw err({
    code: `PREFIX_${suffix}`,
    message: 'template code',
    context: { id: 3 },
  })
}

export function missingConstructorCode(): never {
  throw new AppError({
    message: 'missing constructor code',
    context: { id: 4 },
  })
}

export function bareThrow(): never {
  throw new Error('not a clearerr spec')
}
