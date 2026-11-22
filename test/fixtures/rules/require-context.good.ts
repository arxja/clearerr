import { AppError, err } from './fixture-utils'

export function objectContext(): never {
  throw err({
    code: 'OBJECT_CONTEXT',
    message: 'object context',
    context: { id: 1 },
  })
}

export function spreadContext(base: Record<string, unknown>): never {
  throw err({
    code: 'SPREAD_CONTEXT',
    message: 'spread context',
    context: { ...base },
  })
}

export function constructorContext(): never {
  throw new AppError({
    code: 'CONSTRUCTOR_CONTEXT',
    message: 'constructor context',
    context: { id: 2 },
  })
}

export function dynamicContext(context: Record<string, unknown>): never {
  throw err({
    code: 'DYNAMIC_CONTEXT',
    message: 'dynamic context',
    context,
  })
}
