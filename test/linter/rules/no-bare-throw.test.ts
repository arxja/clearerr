import { describe, expect, it } from 'vitest'
import { noBareThrow } from '../../../src/linter'
import { fixtureSites, runRule } from './fixtures'

describe('no-bare-throw rule', () => {
  it('fires on bare error throws', () => {
    const findings = runRule(fixtureSites('no-bare-throw.bad.ts'), noBareThrow)

    expect(findings).toHaveLength(4)
    expect(findings.map(finding => finding.ruleId)).toEqual([
      'no-bare-throw',
      'no-bare-throw',
      'no-bare-throw',
      'no-bare-throw',
    ])
    expect(findings.every(finding => finding.severity === 'error')).toBe(true)
    expect(findings.every(finding => finding.message.includes('structured Clearerr error'))).toBe(true)
  })

  it('does not fire on structured throws or unthrown errors', () => {
    expect(runRule(fixtureSites('no-bare-throw.good.ts'), noBareThrow)).toEqual([])
  })

  it('ignores test files', () => {
    expect(runRule(fixtureSites('ignored.test.ts'), noBareThrow)).toEqual([])
  })
})
