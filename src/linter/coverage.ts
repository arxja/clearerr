import type { MessageSite } from './sites'

/**
 * Coverage of structured error sites.
 *
 * `scored` counts sites that carry a clearerr spec with a `code`; `unscorable`
 * counts everything else, including bare throws and message sites that cannot
 * hold an envelope such as `process.exit(message)`.
 */
export interface CoverageReport {
  /** Sites that carry a structured spec with a `code`. */
  scored: number
  /** Sites that cannot be scored. */
  unscorable: number
  /** `scored / (scored + unscorable)`, or `0` when there are no sites. */
  ratio: number
}

/** Returns true when a site carries a structured spec with a `code`. */
export function isScorableSite(site: MessageSite): boolean {
  return site.spec !== undefined && site.spec.getProperty('code') !== undefined
}

/** Computes the structured-error coverage of a set of message sites. */
export function computeCoverage(sites: readonly MessageSite[]): CoverageReport {
  const scored = sites.filter(isScorableSite).length
  const unscorable = sites.length - scored
  const total = scored + unscorable

  return {
    scored,
    unscorable,
    ratio: total === 0
      ? 0
      : scored / total,
  }
}
