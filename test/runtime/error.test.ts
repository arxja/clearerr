import { describe, expect, it } from 'vitest'
import { ClearerrError, err, formatForAgent } from '../../src/runtime/error'
import { isValidErrorCode } from '../../src/shared/registry'

describe('clearerrError', () => {
  it('validates code format and emits valid JSON for agent formatting', () => {
    expect(isValidErrorCode('CONFIG_INVALID_PORT')).toBe(true)
    expect(isValidErrorCode('config_invalid_port')).toBe(false)

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

  it('does not combine mismatched captured metadata with supplied coordinates', () => {
    const error = err({
      code: 'TEST_LOCATION_MATCH',
      message: 'location match',
      location: { file: 'src/manual.ts', line: 42 },
    })

    expect(error.location.file).toBe('src/manual.ts')
    expect(error.location.line).toBe(42)
    expect(error.location).not.toHaveProperty('column')
    expect(error.location).not.toHaveProperty('function')
  })

  it('preserves caller-supplied column and function', () => {
    const error = err({
      code: 'TEST_LOCATION_FIELDS',
      message: 'location fields',
      location: { column: 8, function: 'manual' },
    })

    expect(error.location.column).toBe(8)
    expect(error.location.function).toBe('manual')
  })
})
