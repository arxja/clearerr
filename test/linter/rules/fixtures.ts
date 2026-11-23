import type { CodeRegistry, Finding, MessageSite, Rule, RunRulesOptions } from '../../../src/linter'
import { fileURLToPath } from 'node:url'
import { extractMessageSites, runRules } from '../../../src/linter'

export const fixtureDir = fileURLToPath(new URL('../../fixtures/rules', import.meta.url))

const allSites = extractMessageSites({ cwd: fixtureDir })

/** Returns the message sites extracted from one fixture file. */
export function fixtureSites(fileName: string): MessageSite[] {
  const suffix = `/${fileName}`

  return allSites.filter(site => site.file.replaceAll('\\', '/').endsWith(suffix))
}

export interface RunRuleOptions {
  boundaries?: readonly string[]
  codeRegistry?: CodeRegistry
}

/** Runs one rule against sites loaded from the rule fixture project. */
export function runRule(
  sites: readonly MessageSite[],
  rule: Rule,
  options: RunRuleOptions = {},
): Finding[] {
  const runOptions: RunRulesOptions = {
    cwd: fixtureDir,
    rules: [rule],
  }

  if (options.boundaries !== undefined)
    runOptions.boundaries = options.boundaries
  if (options.codeRegistry !== undefined)
    runOptions.codeRegistry = options.codeRegistry

  return runRules(sites, runOptions)
}
