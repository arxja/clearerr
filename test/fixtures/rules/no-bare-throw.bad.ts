import { AppError } from './fixture-utils'

export function bareError(): never {
  throw new Error('bare error')
}

export function bareTypeError(): never {
  throw new TypeError('bare type error')
}

export function bareCustom(): never {
  throw new AppError('bare custom')
}

export function bareLiteral(): never {
  // eslint-disable-next-line no-throw-literal
  throw 'bare literal'
}
