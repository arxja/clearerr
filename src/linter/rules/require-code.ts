import type { Rule } from '../engine'
import { createFinding } from '../findings'
import { getPropertyValue, getStringLiteralValue } from './helpers'

/**
 * Requires every structured error spec to carry a literal `code`.
 *
 * Literal codes keep the taxonomy stable for agents and for the registry
 * check. Dynamic codes are rejected because they cannot be validated ahead
 * of time.
 */
export const requireCode: Rule = (site) => {
  if (site.spec === undefined)
    return []

  const code = getPropertyValue(site.spec, 'code')

  if (code === undefined) {
    return [
      createFinding(
        'require-code',
        site,
        'Missing "code" in the error spec.',
      ),
    ]
  }

  const literal = getStringLiteralValue(code)

  if (literal === undefined) {
    return [
      createFinding(
        'require-code',
        site,
        '"code" must be a string literal so the error taxonomy stays stable.',
      ),
    ]
  }

  if (literal.length === 0) {
    return [
      createFinding(
        'require-code',
        site,
        '"code" must not be empty.',
      ),
    ]
  }

  return []
}
