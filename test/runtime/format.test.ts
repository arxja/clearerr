import { describe, expect, it } from 'vitest'
import { err } from '../../src/runtime/error'
import { formatForAgent } from '../../src/runtime/format'

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
