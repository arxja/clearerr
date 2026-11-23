import { describe, expect, it } from 'vitest'
import { requireFixHint } from '../../../src/linter'
import { fixtureSites, runRule } from './fixtures'

describe('require-fix-hint rule', () => {
  it('fires only on boundary errors without fix.hint', () => {
    const findings = runRule(
      fixtureSites('require-fix-hint.boundary.ts'),
      requireFixHint,
      {
        boundaries: ['*.boundary.ts'],
      },
    )

    expect(findings).toHaveLength(7)
    expect(findings.every(finding => finding.ruleId === 'require-fix-hint')).toBe(true)
    expect(findings.every(finding => finding.message.includes('"fix.hint"'))).toBe(true)
  })

  it('does not fire outside the boundary globs', () => {
    const boundarySites = fixtureSites('require-fix-hint.boundary.ts')
    const internalSites = fixtureSites('require-fix-hint.internal.ts')

    expect(runRule(boundarySites, requireFixHint, {
      boundaries: ['src/**'],
    })).toEqual([])
    expect(runRule(internalSites, requireFixHint, {
      boundaries: ['*.boundary.ts'],
    })).toEqual([])
  })

  it('does nothing when boundaries are not configured', () => {
    expect(runRule(fixtureSites('require-fix-hint.boundary.ts'), requireFixHint)).toEqual([])
  })

  it('supports recursive globs', () => {
    const findings = runRule(
      fixtureSites('require-fix-hint.boundary.ts'),
      requireFixHint,
      {
        boundaries: ['**/*.boundary.ts'],
      },
    )

    expect(findings).toHaveLength(7)
  })
})
