import type { Rule } from '../engine'
import { createFinding } from '../findings'
import { getPropertyValue, hasNonEmptyContext } from './helpers'

/**
 * Requires structured errors to carry non-empty context so an agent can
 * diagnose the failure without re-reading source or reproducing the run.
 */
export const requireContext: Rule = (site) => {
  if (site.spec === undefined)
    return []

  if (hasNonEmptyContext(site))
    return []

  const hasContextProperty = getPropertyValue(site.spec, 'context') !== undefined

  return [
    createFinding(
      'require-context',
      site,
      hasContextProperty
        ? '"context" must be a non-empty object.'
        : 'Missing "context" in the error spec.',
    ),
  ]
}
