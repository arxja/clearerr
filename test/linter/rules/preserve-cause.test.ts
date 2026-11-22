import { describe, expect, it } from 'vitest'
import { preserveCause } from '../../../src/linter'
import { fixtureSites, runRule } from './fixtures'

describe('preserve-cause rule', () => {
  it('accepts throws that pass the caught error as cause', () => {
    expect(runRule(fixtureSites('preserve-cause.good.ts'), preserveCause)).toEqual([])
  })

  it('fires on rethrows that drop the caught error', () => {
    const findings = runRule(fixtureSites('preserve-cause.bad.ts'), preserveCause)

    expect(findings).toHaveLength(4)
    expect(findings.every(finding => finding.ruleId === 'preserve-cause')).toBe(true)
    expect(findings.every(finding => finding.message.includes('"cause"'))).toBe(true)
    expect(findings.every(finding => finding.message.includes('"error"'))).toBe(true)
  })
})
