import type { Rule } from '../engine'
import { createFinding } from '../findings'
import { getPropertyValue, getStringLiteralValue } from './helpers'

/**
 * Validates literal error codes against `clearerr.codes.json`.
 *
 * Literal codes that are not registered are errors because the taxonomy must
 * stay stable for agents. A dynamic code cannot be checked ahead of time, so
 * it produces a warning instead of an error. Sites without a registry, or
 * without a `code`, are handled by `require-code` and are left alone here.
 */
export const stableCodes: Rule = (site, ctx) => {
  if (site.spec === undefined || ctx.codeRegistry === undefined)
    return []

  const code = getPropertyValue(site.spec, 'code')

  if (code === undefined)
    return []

  const literal = getStringLiteralValue(code)

  if (literal === undefined) {
    return [
      createFinding(
        'stable-codes',
        site,
        'Cannot validate a dynamic "code" against clearerr.codes.json.',
        'warning',
      ),
    ]
  }

  // Empty codes are reported by `require-code`; do not duplicate the finding.
  if (literal.length === 0 || ctx.codeRegistry.has(literal))
    return []

  return [
    createFinding(
      'stable-codes',
      site,
      `Unknown error code "${literal}". Add it to clearerr.codes.json.`,
    ),
  ]
}
