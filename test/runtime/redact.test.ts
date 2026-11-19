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
