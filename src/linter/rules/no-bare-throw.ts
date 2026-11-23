import type { Rule } from '../engine'
import { createFinding } from '../findings'
import { isStringLiteralNode } from './helpers'

/**
 * Rejects throws that carry no structured envelope: native or custom error
 * constructors without a clearerr spec, and thrown string literals.
 *
 * `throw err({ ... })` and `throw new AppError({ ... })` are accepted because
 * the site extractor records their object literal as a spec.
 */
export const noBareThrow: Rule = (site, ctx) => {
  if (ctx.isTestFile || site.kind !== 'throw' || site.spec !== undefined)
    return []

  const isBareConstructor = site.constructorName !== undefined
  const isBareLiteral = isStringLiteralNode(site.messageNode)

  if (!isBareConstructor && !isBareLiteral)
    return []

  return [
    createFinding(
      'no-bare-throw',
      site,
      'Throw a structured Clearerr error instead of a bare error.',
    ),
  ]
}
