import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadCodeRegistry, stableCodes } from '../../../src/linter'
import { fixtureSites, runRule } from './fixtures'

const registryDir = fileURLToPath(new URL('../../fixtures/registry', import.meta.url))
const registry = loadCodeRegistry(registryDir)

describe('stable-codes rule', () => {
  it('accepts registered literal codes', () => {
    expect(runRule(
      fixtureSites('stable-codes.good.ts'),
      stableCodes,
      { codeRegistry: registry },
    )).toEqual([])
  })

  it('fires on unknown literal codes and warns on dynamic codes', () => {
    const findings = runRule(
      fixtureSites('stable-codes.bad.ts'),
      stableCodes,
      { codeRegistry: registry },
    )

    expect(findings.map(finding => finding.message)).toEqual([
      'Unknown error code "UNKNOWN_CODE". Add it to clearerr.codes.json.',
      'Unknown error code "UNKNOWN_CONSTRUCTOR_CODE". Add it to clearerr.codes.json.',
      'Cannot validate a dynamic "code" against clearerr.codes.json.',
      'Cannot validate a dynamic "code" against clearerr.codes.json.',
    ])
    expect(findings.map(finding => finding.severity)).toEqual([
      'error',
      'error',
      'warning',
      'warning',
    ])
  })

  it('does nothing when no registry is configured', () => {
    expect(runRule(fixtureSites('stable-codes.bad.ts'), stableCodes)).toEqual([])
  })

  it('requires a registry file to opt in', () => {
    expect(registry?.size).toBe(3)
    expect([
      ...(registry?.keys() ?? []),
    ]).toEqual([
      'KNOWN_CODE',
      'ASSERTED_KNOWN',
      'CONSTRUCTOR_KNOWN',
    ])
    expect(loadCodeRegistry(fileURLToPath(new URL('../../fixtures/rules', import.meta.url)))).toBeUndefined()
  })
})
