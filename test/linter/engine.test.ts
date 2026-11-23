import type { MessageSite, Rule, RuleContext } from '../../src/linter'
import { join } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { createFinding, createRuleContext, isTestFile, rules, runRules } from '../../src/linter'

const root = process.cwd()

function makeSite(overrides: Partial<MessageSite> = {}): MessageSite {
  return {
    kind: 'throw',
    file: join(root, 'src', 'app.ts'),
    line: 10,
    column: 5,
    node: {} as MessageSite['node'],
    message: '\'boom\'',
    messageLiteral: 'boom',
    ...overrides,
  }
}

describe('rule engine', () => {
  it('runs a dummy rule for every site and returns its findings', () => {
    const seen: Array<{ site: MessageSite, ctx: RuleContext }> = []
    const dummy: Rule = (site, ctx) => {
      seen.push({ site, ctx })
      return [
        createFinding('dummy-rule', site, `saw ${site.messageLiteral}`, 'warning'),
      ]
    }

    const first = makeSite()
    const second = makeSite({
      file: join(root, 'src', 'other.ts'),
      line: 2,
      column: 1,
      messageLiteral: 'other',
    })

    const findings = runRules([first, second], {
      rules: [dummy],
    })

    expect(seen.map(entry => entry.site)).toEqual([first, second])
    expect(seen.map(entry => entry.ctx.relativeFile)).toEqual(['src/app.ts', 'src/other.ts'])
    expect(findings).toEqual([
      createFinding('dummy-rule', first, 'saw boom', 'warning'),
      createFinding('dummy-rule', second, 'saw other', 'warning'),
    ])
  })

  it('iterates every rule for every site in registry order', () => {
    const calls: string[] = []

    const first: Rule = (site, ctx) => {
      calls.push(`first:${ctx.relativeFile}:${site.line}`)
      return []
    }
    const second: Rule = (site) => {
      calls.push(`second:${site.line}`)
      return [
        createFinding('second', site, 'second rule fired'),
      ]
    }

    const findings = runRules([
      makeSite(),
      makeSite({ line: 20 }),
    ], {
      rules: [first, second],
    })

    expect(calls).toEqual([
      'first:src/app.ts:10',
      'second:10',
      'first:src/app.ts:20',
      'second:20',
    ])
    expect(findings.map(finding => finding.ruleId)).toEqual(['second', 'second'])
  })

  it('defaults to the built-in rules registry', () => {
    const findings = runRules([
      makeSite(),
    ])

    expect(findings).toEqual(runRules([
      makeSite(),
    ], { rules }))
  })

  it('builds a context with a posix relative path and test detection', () => {
    const file = join(root, 'src', 'feature.test.ts')
    const ctx = createRuleContext(makeSite({ file }))

    expect(ctx).toEqual({
      root,
      file,
      relativeFile: 'src/feature.test.ts',
      isTestFile: true,
    })
  })

  it('detects test and spec files but not ordinary sources', () => {
    expect(isTestFile('src/ignored.test.ts')).toBe(true)
    expect(isTestFile('src/ignored.spec.tsx')).toBe(true)
    expect(isTestFile('src/ignored.test.mts')).toBe(true)
    expect(isTestFile('src/ignored.ts')).toBe(false)
    expect(isTestFile('src/test.ts')).toBe(false)
  })

  it('sorts findings by file, position, rule ID, and message', () => {
    const site = makeSite({ line: 10, column: 5 })
    const unsorted: Rule = () => [
      createFinding('b-rule', site, 'second'),
      createFinding('a-rule', site, 'third'),
      createFinding('a-rule', site, 'first'),
      createFinding('a-rule', { ...site, line: 2 }, 'earlier line'),
    ]

    const findings = runRules([site], {
      rules: [unsorted],
    })

    expect(findings.map(finding => `${finding.line}:${finding.ruleId}:${finding.message}`)).toEqual([
      '2:a-rule:earlier line',
      '10:a-rule:first',
      '10:a-rule:third',
      '10:b-rule:second',
    ])
  })
})
