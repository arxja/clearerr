import type { Finding, MessageSite, Rule } from '../../../src/linter'
import { fileURLToPath } from 'node:url'
import { extractMessageSites, runRules } from '../../../src/linter'

export const fixtureDir = fileURLToPath(new URL('../../fixtures/rules', import.meta.url))

const allSites = extractMessageSites({ cwd: fixtureDir })

/** Returns the message sites extracted from one fixture file. */
export function fixtureSites(fileName: string): MessageSite[] {
  const suffix = `/${fileName}`

  return allSites.filter(site => site.file.replaceAll('\\', '/').endsWith(suffix))
}

/** Runs one rule against sites loaded from the rule fixture project. */
export function runRule(
  sites: readonly MessageSite[],
  rule: Rule,
  boundaries?: readonly string[],
): Finding[] {
  return runRules(sites, {
    cwd: fixtureDir,
    rules: [rule],
    boundaries,
  })
}
