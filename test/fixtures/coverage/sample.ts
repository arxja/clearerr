import process from 'node:process'
import { AppError, err } from '../rules/fixture-utils'

export function structuredThrow(): never {
  throw err({
    code: 'COVERAGE_ONE',
    message: 'coverage-one',
    context: { id: 1 },
  })
}

export function bareThrow(): never {
  throw new Error('coverage-two')
}

export function literalThrow(): never {
  // eslint-disable-next-line no-throw-literal
  throw 'coverage-three'
}

export function exitWithMessage(): never {
  process.exit('coverage-four')
}

export function customBareThrow(): never {
  throw new AppError('coverage-five')
}

export function customStructuredThrow(): never {
  throw new AppError({
    code: 'COVERAGE_SIX',
    message: 'coverage-six',
    context: { id: 6 },
  })
}

export function makeError(): Error {
  return new Error('coverage-seven')
}

export function specWithoutCode(): never {
  throw err({
    message: 'coverage-eight',
    context: { id: 8 },
  })
}

export function structuredWithoutContext(): never {
  throw err({
    code: 'COVERAGE_NINE',
    message: 'coverage-nine',
  })
}

export function makeTypeError(): TypeError {
  return new TypeError('coverage-ten')
}
