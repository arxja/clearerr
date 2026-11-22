import type { Node } from 'ts-morph'
import type { Rule } from '../engine'
import { Node as TsNode } from 'ts-morph'
import { createFinding } from '../findings'
import { getThrownExpression, hasCauseOption, isErrCall } from './helpers'

/** Finds the nearest catch clause that binds a caught value. */
function findCatchVariable(node: Node): string | undefined {
  let current = node.getParent()

  while (current !== undefined) {
    if (TsNode.isCatchClause(current)) {
      const variable = current.getVariableDeclaration()

      if (variable !== undefined)
        return variable.getName()
    }

    current = current.getParent()
  }

  return undefined
}

/**
 * Requires a throw inside a catch block to forward the caught error as
 * `cause`. Plain rethrows of the caught value are allowed because they already
 * preserve the original error.
 */
export const preserveCause: Rule = (site) => {
  // Rule tests and third-party callers may pass synthetic sites without an AST.
  if (site.kind !== 'throw' || typeof site.node.getParent !== 'function')
    return []

  const caught = findCatchVariable(site.node)

  if (caught === undefined)
    return []

  const thrown = getThrownExpression(site)

  if (thrown === undefined)
    return []

  if (TsNode.isIdentifier(thrown) && thrown.getText() === caught)
    return []

  if (hasCauseOption(site))
    return []

  const isStructuredThrow = site.spec !== undefined
    || TsNode.isNewExpression(thrown)
    || isErrCall(thrown)

  if (!isStructuredThrow)
    return []

  return [
    createFinding(
      'preserve-cause',
      site,
      `Pass the caught error "${caught}" as "cause" so the chain is preserved.`,
    ),
  ]
}
