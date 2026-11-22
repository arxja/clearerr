import { describe, expect, it } from 'vitest'
import { requireContext } from '../../../src/linter'
import { fixtureSites, runRule } from './fixtures'

describe('require-context rule', () => {
  it('accepts non-empty and dynamic context', () => {
    expect(runRule(fixtureSites('require-context.good.ts'), requireContext)).toEqual([])
  })

  it('fires on absent, empty, null, and undefined context', () => {
    const findings = runRule(fixtureSites('require-context.bad.ts'), requireContext)

    expect(findings).toHaveLength(5)
    expect(findings.map(finding => finding.message)).toEqual([
      'Missing "context" in the error spec.',
      '"context" must be a non-empty object.',
      '"context" must be a non-empty object.',
      '"context" must be a non-empty object.',
      'Missing "context" in the error spec.',
    ])
  })
})
