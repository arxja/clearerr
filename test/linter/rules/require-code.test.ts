import { describe, expect, it } from 'vitest'
import { requireCode } from '../../../src/linter'
import { fixtureSites, runRule } from './fixtures'

describe('require-code rule', () => {
  it('accepts literal codes', () => {
    expect(runRule(fixtureSites('require-code.good.ts'), requireCode)).toEqual([])
  })

  it('fires on missing and dynamic codes', () => {
    const findings = runRule(fixtureSites('require-code.bad.ts'), requireCode)

    expect(findings).toHaveLength(4)
    expect(findings.map(finding => finding.message)).toEqual([
      'Missing "code" in the error spec.',
      '"code" must be a string literal so the error taxonomy stays stable.',
      '"code" must be a string literal so the error taxonomy stays stable.',
      'Missing "code" in the error spec.',
    ])
  })

  it('ignores throws that carry no clearerr spec', () => {
    const findings = runRule(fixtureSites('require-code.bad.ts'), requireCode)

    expect(findings).toHaveLength(4)
  })
})
