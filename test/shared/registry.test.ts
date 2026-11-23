import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadCodeRegistry, parseCodeRegistry } from '../../src/shared/registry'

const registryDir = fileURLToPath(new URL('../fixtures/registry', import.meta.url))
const rulesDir = fileURLToPath(new URL('../fixtures/rules', import.meta.url))

describe('code registry', () => {
  it('parses codes and their metadata', () => {
    const registry = parseCodeRegistry({
      APP_FAILED: {
        description: 'The app failed.',
        docs: 'https://example.com/APP_FAILED',
        retryable: 'backoff',
        severity: 'fatal',
      },
      APP_OK: {},
    })

    expect([
      ...registry.keys(),
    ]).toEqual(['APP_FAILED', 'APP_OK'])
    expect(registry.get('APP_FAILED')).toEqual({
      description: 'The app failed.',
      docs: 'https://example.com/APP_FAILED',
      retryable: 'backoff',
      severity: 'fatal',
    })
    expect(registry.get('APP_OK')).toEqual({})
  })

  it('rejects non-object registries', () => {
    expect(() => parseCodeRegistry([])).toThrow('expected a JSON object')
    expect(() => parseCodeRegistry(null)).toThrow('expected a JSON object')
    expect(() => parseCodeRegistry('APP_FAILED')).toThrow('expected a JSON object')
  })

  it('rejects invalid codes', () => {
    expect(() => parseCodeRegistry({ app_failed: {} })).toThrow('is not a valid error code')
  })

  it('rejects invalid metadata', () => {
    expect(() => parseCodeRegistry({ APP_FAILED: 'fatal' })).toThrow('must be an object')
    expect(() => parseCodeRegistry({
      APP_FAILED: { severity: 'loud' },
    })).toThrow('"severity"')
    expect(() => parseCodeRegistry({
      APP_FAILED: { retryable: 'maybe' },
    })).toThrow('"retryable"')
    expect(() => parseCodeRegistry({
      APP_FAILED: { description: 1 },
    })).toThrow('"description"')
    expect(() => parseCodeRegistry({
      APP_FAILED: { docs: false },
    })).toThrow('"docs"')
    expect(() => parseCodeRegistry({
      APP_FAILED: { note: 'typo' },
    })).toThrow('unknown field "note"')
  })

  it('loads a registry from disk and returns undefined when absent', () => {
    const registry = loadCodeRegistry(registryDir)

    expect(registry?.size).toBe(3)
    expect(registry?.get('ASSERTED_KNOWN')).toEqual({ description: 'Known asserted code.' })
    expect(loadCodeRegistry(rulesDir)).toBeUndefined()
  })
})
