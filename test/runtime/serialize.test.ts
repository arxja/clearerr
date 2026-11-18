import type { ClearerrError } from '../../src/runtime/error'
import { describe, expect, it } from 'vitest'
import { err } from '../../src/runtime/error'

describe('cause-chain serialization', () => {
  it('serializes nested ClearerrError causes', () => {
    const root = err({ code: 'ROOT_CAUSE_TEST', message: 'root' })
    const middle = err({ code: 'MIDDLE_CAUSE_TEST', message: 'middle' }, { cause: root })
    const outer = err({ code: 'OUTER_CAUSE_TEST', message: 'outer' }, { cause: middle })

    expect(outer.toJSON().cause).toMatchObject({
      code: 'MIDDLE_CAUSE_TEST',
      cause: { code: 'ROOT_CAUSE_TEST' },
    })
  })

  it('serializes nested native Error causes recursively', () => {
    const inner = new Error('inner')
    const middle = new Error('middle', { cause: inner })
    const outer = new Error('outer', { cause: middle })

    const root = err({ code: 'NATIVE_CAUSE_TEST', message: 'root' }, { cause: outer })

    expect(root.toJSON().cause).toMatchObject({
      name: 'Error',
      message: 'outer',
      cause: {
        name: 'Error',
        message: 'middle',
        cause: {
          name: 'Error',
          message: 'inner',
        },
      },
    })
  })

  it('does not identify native Clearerr-shaped mimics as genuine Clearerr errors', () => {
    const mimic = new Error('native mimic') as Error & Record<string, unknown>
    mimic.name = 'ClearerrError'
    mimic.code = 'MIMIC_CAUSE_TEST'
    mimic.timestamp = '2026-01-01T00:00:00.000Z'
    mimic.location = { file: 'fake.ts', line: 1 }
    mimic.context = {}
    mimic.severity = 'fatal'

    const root = err({ code: 'ROOT_MIMIC_TEST', message: 'root' }, { cause: mimic })

    expect(root.toJSON().cause).toMatchObject({
      name: 'ClearerrError',
      message: 'native mimic',
    })
    expect(root.toJSON().cause).not.toHaveProperty('code')
  })

  it('detects a direct cause cycle', () => {
    const cyclic = err({ code: 'CYCLIC_CAUSE_TEST', message: 'cyclic' })
    cyclic.cause = cyclic

    expect(cyclic.toJSON().cause).toMatchObject({
      name: 'CycleDetected',
    })
  })

  it('truncates cause chains deeper than ten levels', () => {
    let deep: ClearerrError | undefined
    for (let index = 0; index < 12; index++) {
      const opts = deep
        ? { cause: deep }
        : undefined

      deep = err(
        { code: `DEEP_CAUSE_TEST_${index}`, message: `level ${index}` },
        opts,
      )
    }

    let cause: unknown = deep?.toJSON().cause
    while (
      typeof cause === 'object'
      && cause !== null
      && 'cause' in cause
      && typeof cause.cause === 'object'
      && cause.cause !== null
    ) {
      cause = cause.cause
    }

    expect(cause).toMatchObject({ name: 'Truncated' })
  })
})
