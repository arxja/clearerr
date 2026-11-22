import process from 'node:process'
import { err } from '../../../../src/runtime/error'

class AppError extends Error {
  readonly retryable = false
}

export function throwBare(): never {
  throw new Error('throw-bare')
}

export function throwStructured(): never {
  throw err({
    code: 'APP_FAILED',
    message: 'throw-structured',
    context: { id: 1 },
  })
}

export function throwStructuredWithCause(cause: unknown): never {
  throw err(
    {
      code: 'APP_WRAPPED',
      message: 'throw-with-cause',
      context: { cause },
    },
    { cause },
  )
}

export function throwCustom(): never {
  throw new AppError('throw-custom')
}

export function createCustom(): AppError {
  return new AppError('constructor-custom')
}

export function createTypeError(): TypeError {
  return new TypeError('constructor-type')
}

export function exitWithMessage(): never {
  process.exit('exit-message')
}

export function exitWithCode(): never {
  process.exit(1)
}
