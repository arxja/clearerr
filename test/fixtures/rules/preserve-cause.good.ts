import { err } from './fixture-utils'

export function causeInOptions(): never {
  try {
    throw new Error('original')
  }
  catch (error) {
    throw err(
      {
        code: 'CAUSE_OPTIONS',
        message: String(error),
        context: { error },
      },
      { cause: error },
    )
  }
}

export function causeInConstructor(): never {
  try {
    throw new Error('original')
  }
  catch (error) {
    throw new Error(String(error), { cause: error })
  }
}

export function causeInDynamicConstructorOptions(options: { cause?: unknown }): never {
  try {
    throw new Error('original')
  }
  catch (error) {
    throw new Error(String(error), options)
  }
}

export function plainRethrow(): never {
  // eslint-disable-next-line no-useless-catch
  try {
    throw new Error('original')
  }
  catch (error) {
    throw error
  }
}

export function optionalCatch(): never {
  try {
    throw new Error('original')
  }
  catch {
    throw err({
      code: 'OPTIONAL_CATCH',
      message: 'no catch binding',
      context: { id: 1 },
    })
  }
}

export function outsideCatch(): never {
  throw err({
    code: 'OUTSIDE_CATCH',
    message: 'outside catch',
    context: { id: 2 },
  })
}
