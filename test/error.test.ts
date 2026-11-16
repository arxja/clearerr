import { describe, expect, it } from 'vitest'
import { ClearerrError, err, formatForAgent } from '../src/error'

describe('clearerrError', () => {
  it('emits valid JSON for agent formatting', () => {
    const error = err(
      {
        code: 'CONFIG_INVALID_PORT',
        message: 'Invalid port 99999',
        context: { port: 99999, expected: '1-65535' },
        fix: { hint: 'Set PORT to 1-65535', retryable: 'no' },
        severity: 'fatal',
        phase: 'validate',
        location: { file: 'src/config.ts', line: 42 },
      },
      {
        cause: new Error('root cause'),
      },
    )

    expect(error).toBeInstanceOf(ClearerrError)
    expect(error.toJSON()).toMatchObject({
      schemaVersion: 1,
      code: 'CONFIG_INVALID_PORT',
      message: 'Invalid port 99999',
      severity: 'fatal',
      location: {
        file: 'src/config.ts',
        line: 42,
        phase: 'validate',
      },
      context: { port: 99999, expected: '1-65535' },
      fix: { hint: 'Set PORT to 1-65535', retryable: 'no' },
    })
    expect(error).toHaveProperty('timestamp')

    const json = formatForAgent(error)
    expect(() => JSON.parse(json)).not.toThrow()

    const parsed = JSON.parse(json)
    expect(parsed).toMatchObject({
      code: 'CONFIG_INVALID_PORT',
      message: 'Invalid port 99999',
    })
  })
})
