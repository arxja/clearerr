import type { MessageSite } from '../../src/linter'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { computeCoverage, extractMessageSites, isScorableSite } from '../../src/linter'

const fixtureDir = fileURLToPath(new URL('../fixtures/coverage', import.meta.url))

let sites: MessageSite[]

beforeAll(() => {
  sites = extractMessageSites({ cwd: fixtureDir })
}, 20_000)

describe('coverage score', () => {
  it('scores structured specs with a code and counts the rest as unscorable', () => {
    expect(sites).toHaveLength(10)
    expect(computeCoverage(sites)).toEqual({
      scored: 3,
      unscorable: 7,
      ratio: 0.3,
    })
  })

  it('treats a spec without a code as unscorable', () => {
    const site = sites.find(candidate => candidate.messageLiteral === 'coverage-eight')

    expect(site).toBeDefined()
    expect(site !== undefined && isScorableSite(site)).toBe(false)
  })

  it('returns a zero ratio for an empty project', () => {
    expect(computeCoverage([])).toEqual({
      scored: 0,
      unscorable: 0,
      ratio: 0,
    })
  })

  it('reaches ratio 1 when every site is structured', () => {
    expect(computeCoverage(sites.filter(isScorableSite))).toEqual({
      scored: 3,
      unscorable: 0,
      ratio: 1,
    })
  })
})
