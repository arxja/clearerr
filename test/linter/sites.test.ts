import type { MessageSite, MessageSiteKind } from '../../src/linter'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'
import { extractMessageSites } from '../../src/linter'

const fixtureDir = fileURLToPath(new URL('../fixtures/rules', import.meta.url))

let sites: MessageSite[]

function messagesOfKind(kind: MessageSiteKind): (string | undefined)[] {
  return sites
    .filter(site => site.kind === kind)
    .map(site => site.messageLiteral)
}

beforeAll(() => {
  sites = extractMessageSites({ cwd: fixtureDir })
    .filter(site => site.file.replaceAll('\\', '/').endsWith('/sites/sample.ts'))
}, 20_000)

describe('message site extractor', () => {
  it('extracts throw statements', () => {
    expect(messagesOfKind('throw')).toEqual([
      'throw-bare',
      'throw-structured',
      'throw-with-cause',
      'throw-custom',
      'throw-aggregate',
      'throw-parenthesized',
      'throw-asserted',
    ])
  })

  it('extracts custom error constructors', () => {
    expect(messagesOfKind('error-constructor')).toEqual([
      'constructor-custom',
      'constructor-type',
      'constructor-aggregate',
    ])

    const constructorNames = sites
      .filter(site => site.kind === 'error-constructor')
      .map(site => site.constructorName)

    expect(constructorNames).toEqual(['AppError', 'TypeError', 'AggregateError'])
  })

  it('extracts process.exit only when it carries a message', () => {
    expect(messagesOfKind('process-exit')).toEqual(['exit-message'])
  })

  it('captures constructor names on thrown new expressions', () => {
    const byMessage = new Map(sites.map(site => [site.messageLiteral, site]))

    expect(byMessage.get('throw-bare')?.constructorName).toBe('Error')
    expect(byMessage.get('throw-custom')?.constructorName).toBe('AppError')
    expect(byMessage.get('throw-aggregate')?.constructorName).toBe('AggregateError')
    expect(byMessage.get('throw-parenthesized')?.constructorName).toBe('Error')
    expect(byMessage.get('throw-asserted')?.constructorName).toBe('Error')
    expect(byMessage.get('throw-structured')?.constructorName).toBeUndefined()
  })

  it('captures the spec and options of an err() call', () => {
    const site = sites.find(candidate => candidate.messageLiteral === 'throw-with-cause')

    expect(site?.spec?.getProperty('code')).toBeDefined()
    expect(site?.spec?.getProperty('context')).toBeDefined()
    expect(site?.options?.getProperty('cause')).toBeDefined()
  })

  it('records absolute file paths and positive positions', () => {
    for (const site of sites) {
      expect(site.file.replaceAll('\\', '/')).toMatch(/\/sites\/sample\.ts$/)
      expect(site.line).toBeGreaterThan(0)
      expect(site.column).toBeGreaterThan(0)
    }
  })

  it('does not duplicate a directly thrown constructor as a constructor site', () => {
    const thrownConstructors = sites.filter(site => site.kind === 'throw' && site.constructorName !== undefined)

    expect(thrownConstructors.map(site => site.messageLiteral)).toEqual([
      'throw-bare',
      'throw-custom',
      'throw-aggregate',
      'throw-parenthesized',
      'throw-asserted',
    ])
  })
})
