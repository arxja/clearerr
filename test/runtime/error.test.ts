import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { describe, expect, it, vi } from 'vitest'
import { ClearerrError, err } from '../../src/runtime/error'
import { isValidErrorCode } from '../../src/shared/registry'
import { formatForAgent } from '../../src'

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

  it('constructs safely when .clearerrrc.json is invalid', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'clearerr-'))
    writeFileSync(join(tempDir, '.clearerrrc.json'), '{ invalid json')

    try {
      vi.spyOn(process, 'cwd').mockReturnValue(tempDir)
      const cause = new Error('root cause')
      const error = err(
        {
          code: 'TEST_INVALID_CONFIG',
          message: 'invalid config',
          context: {
            password: 'secret',
            nested: { token: 'secret-two' },
          },
          location: { file: 'src/manual.ts', line: 42, column: 8 },
          fix: { hint: 'Fix the config', retryable: 'once' },
          severity: 'recoverable',
        },
        { cause },
      )

      expect(error.code).toBe('TEST_INVALID_CONFIG')
      expect(error.message).toBe('invalid config')
      expect(error.cause).toBe(cause)
      expect(error.location).toMatchObject({ file: 'src/manual.ts', line: 42, column: 8 })
      expect(error.severity).toBe('recoverable')
      expect(error.fix).toEqual({ hint: 'Fix the config', retryable: 'once' })
      expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(error.context).toEqual({
        password: '[redacted]',
        nested: { token: '[redacted]' },
      })
      expect(JSON.stringify(error.context)).not.toContain('secret')
    }
    finally {
      vi.restoreAllMocks()
      rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
