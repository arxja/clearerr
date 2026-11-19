import { afterEach, describe, expect, it, vi } from 'vitest'
import { err } from '../../src/runtime/error'
import { redactContext } from '../../src/runtime/redact'

const originalEnv = process.env.CLEARERR_REDACT

afterEach(() => {
  vi.restoreAllMocks()
  if (originalEnv === undefined) {
    delete process.env.CLEARERR_REDACT
  }
  else {
    process.env.CLEARERR_REDACT = originalEnv
  }
})

describe('context redaction', () => {
  it('redacts keys from CLEARERR_REDACT', () => {
    process.env.CLEARERR_REDACT = 'password, token'

    const error = err({
      code: 'TEST_ENV_REDACTION',
      message: 'env redaction',
      context: { password: 'secret', token: 'abc', safe: true },
    })

    expect(error.context).toEqual({
      password: '[redacted]',
      token: '[redacted]',
      safe: true,
    })
  })

  it('redacts nested keys and supports config keys', () => {
    process.env.CLEARERR_REDACT = ''

    const context = redactContext({
      credentials: {
        apiKey: 'nested-secret',
        label: 'keep',
      },
    }, ['apiKey'])

    expect(context).toEqual({
      credentials: {
        apiKey: '[redacted]',
        label: 'keep',
      },
    })
  })

  it('preserves Date instances after redaction', () => {
    const date = new Date('2026-11-19T12:34:56.000Z')

    const context = redactContext({ date }, ['password'])

    expect(context.date).toBeInstanceOf(Date)
    expect(context.date.toISOString()).toBe('2026-11-19T12:34:56.000Z')
  })

  it('preserves shared references with sanitized replacements', () => {
    const shared = { password: 'secret', safe: true }
    const context = redactContext({ first: shared, second: shared }, ['password'])

    expect(context.first).toBe(context.second)
    expect(context.first).toEqual({ password: '[redacted]', safe: true })
  })

  it('preserves cycles with sanitized replacements', () => {
    const cyclic: Record<string, unknown> = { password: 'secret' }
    cyclic.self = cyclic

    const context = redactContext({ cyclic }, ['password'])
    const sanitized = context.cyclic as Record<string, unknown>

    expect(sanitized.password).toBe('[redacted]')
    expect(sanitized.self).toBe(sanitized)
  })

  it('loads exact redact keys from a config object', () => {
    const context = redactContext({
      password: 'secret',
      Password: 'keep',
      nested: { password: 'secret-two' },
    }, ['password'])

    expect(context).toEqual({
      password: '[redacted]',
      Password: 'keep',
      nested: { password: '[redacted]' },
    })
  })
})
