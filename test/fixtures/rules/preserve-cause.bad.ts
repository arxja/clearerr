import { AppError, err } from './fixture-utils'

export function errWithoutCause(): never {
  try {
    throw new Error('original')
  }
  catch (error) {
    throw err({
      code: 'ERR_WITHOUT_CAUSE',
      message: String(error),
      context: { error },
    })
  }
}

export function constructorWithoutCause(): never {
  try {
    throw new Error('original')
  }
  catch (error) {
    throw new Error(String(error))
  }
}

export function customWithoutCause(): never {
  try {
    throw new Error('original')
  }
  catch (error) {
    throw new AppError({
      message: String(error),
    })
  }
}

export function emptyOptions(): never {
  try {
    throw new Error('original')
  }
  catch (error) {
    throw err(
      {
        code: 'EMPTY_OPTIONS',
        message: String(error),
        context: { error },
      },
      {},
    )
  }
}
