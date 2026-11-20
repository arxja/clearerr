import { describe, expect, it } from 'vitest'
import { err } from '../../src/runtime/error'
import { formatForAgent, formatForHuman } from '../../src/runtime/format'

describe('formatForAgent', () => {
  it('truncates payloads larger than 8KB to valid JSON', () => {
    const error = err({
      code: 'TEST_LARGE_FORMAT',
      message: 'large payload',
      context: {
        payload: 'x'.repeat(16_000),
      },
    })

    const json = formatForAgent(error)
    const parsed = JSON.parse(json)

    expect(new TextEncoder().encode(json).byteLength).toBeLessThanOrEqual(8192)
    expect(parsed.code).toBe('TEST_LARGE_FORMAT')
    expect(parsed.message).toBe('large payload')
  })

  it('truncates context and cause/stack before top-level fields', () => {
    const cause = new Error('sensitive cause')
    cause.stack = `Error: sensitive cause\n${'at node_modules/package  '.repeat(500)}`
    const error = err({
      code: 'TEST_TRUNCATION_PRIORITY',
      message: 'keep top-level message',
      context: {
        payload: 'y'.repeat(20_000),
      },
    }, { cause })

    const json = formatForAgent(error, { maxBytes: 1200 })
    const parsed = JSON.parse(json)

    expect(parsed.code).toBe('TEST_TRUNCATION_PRIORITY')
    expect(parsed.message).toBe('keep top-level message')
    expect(parsed.context).toEqual({})
    expect(parsed).not.toHaveProperty('cause')
  })

  it('honors a custom maxBytes value', () => {
    const error = err({
      code: 'TEST_CUSTOM_LIMIT',
      message: 'custom',
      context: {
        payload: 'z'.repeat(4000),
      },
    })

    const json = formatForAgent(error, { maxBytes: 512 })

    expect(() => JSON.parse(json)).not.toThrow()
    expect(new TextEncoder().encode(json).byteLength).toBeLessThanOrEqual(512)
  })
})

describe('formatForHuman', () => {
  it('formats error for human readability', () => {
    const error = err({
      code: 'TEST_HUMAN_FORMAT',
      message: 'This is a human-readable error message',
      context: {
        detail: 'Some detailed context about the error',
      },
    })

    const formatted = formatForHuman(error)
    expect(formatted).toContain('TEST_HUMAN_FORMAT')
    expect(formatted).toContain('This is a human-readable error message')
    expect(formatted).toContain('Some detailed context about the error')
  })

  it('renders a complete developer-facing snapshot', () => {
    const cause = new Error('connection refused')
    cause.stack = 'Error: connection refused\n    at connect (src/db.ts:12:5)'
    const error = err({
      code: 'TEST_DB_CONNECTION',
      message: 'Database connection failed',
      context: { host: 'db.internal', port: 5432 },
      fix: { hint: 'Check the database service', retryable: 'once' },
      severity: 'recoverable',
      location: {
        file: 'src/db.ts',
        line: 12,
        column: 5,
        function: 'connect',
        phase: 'connect',
      },
    }, { cause })

    const human = formatForHuman(error)

    expect(human).toContain('ClearerrError: TEST_DB_CONNECTION')
    expect(human).toContain('Message: Database connection failed')
    expect(human).toContain('Severity: recoverable')
    expect(human).toContain('Timestamp:')
    expect(human).toContain('Location: src/db.ts:12:5 (connect) [connect]')
    expect(human).toContain('Context:')
    expect(human).toContain('"host": "db.internal"')
    expect(human).toContain('Fix:')
    expect(human).toContain('"hint": "Check the database service"')
    expect(human).toContain('Cause:')
    expect(human).toContain('"name": "Error"')
    expect(human).toContain('Stack:')

  })

  it('includes every envelope field when present', () => {
    const error = err({
      code: 'TEST_FIELD_PRESENCE',
      message: 'field presence',
      context: { key: 'value' },
      fix: { hint: 'Apply the fix', docs: 'https://example.test/docs', retryable: 'backoff' },
      severity: 'warning',
      location: {
        file: 'src/example.ts',
        line: 7,
        column: 3,
        function: 'run',
        phase: 'execute',
      },
    })

    const human = formatForHuman(error)

    expect(human).toMatch(/ClearerrError: TEST_FIELD_PRESENCE/)
    expect(human).toMatch(/Message: field presence/)
    expect(human).toMatch(/Severity: warning/)
    expect(human).toMatch(/Timestamp: \d{4}-/)
    expect(human).toMatch(/Context:/)
    expect(human).toMatch(/"key": "value"/)
    expect(human).toMatch(/Fix:/)
    expect(human).toMatch(/Apply the fix/)
    expect(human).toMatch(/Location: src\/example\.ts:7:3 \(run\) \[execute\]/)
    expect(human).toMatch(/Stack:/)
  })

  it('renders native errors', () => {
    const human = formatForHuman(new Error('native failure'))

    expect(human).toContain('Error: native failure')
    expect(human).toContain('at ')
  })
})
