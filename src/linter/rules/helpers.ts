import type { CallExpression, Node, ObjectLiteralExpression } from 'ts-morph'
import type { MessageSite } from '../sites'
import { Node as TsNode } from 'ts-morph'

function getWrappedExpression(node: Node): Node | undefined {
  if (
    TsNode.isParenthesizedExpression(node)
    || TsNode.isAsExpression(node)
    || TsNode.isNonNullExpression(node)
    || TsNode.isTypeAssertion(node)
    || TsNode.isSatisfiesExpression(node)
  ) {
    return node.getExpression()
  }

  return undefined
}

/** Strips parentheses, assertions, and other expression wrappers. */
function unwrapExpression(node: Node): Node {
  let current = node
  let inner = getWrappedExpression(current)

  while (inner !== undefined) {
    current = inner
    inner = getWrappedExpression(current)
  }

  return current
}

/** Reads a property initializer from an object literal. */
export function getPropertyValue(object: ObjectLiteralExpression, name: string): Node | undefined {
  const property = object.getProperty(name)

  if (property === undefined)
    return undefined

  if (TsNode.isPropertyAssignment(property))
    return property.getInitializer()

  if (TsNode.isShorthandPropertyAssignment(property))
    return property.getNameNode()

  return undefined
}

/** Returns the thrown expression of a throw site, without wrappers. */
export function getThrownExpression(site: MessageSite): Node | undefined {
  if (!TsNode.isThrowStatement(site.node))
    return undefined

  return unwrapExpression(site.node.getExpression())
}

/** Returns true for values that are statically null or undefined. */
function isStaticallyAbsent(node: Node): boolean {
  const value = unwrapExpression(node)

  if (TsNode.isNullLiteral(value))
    return true

  return TsNode.isIdentifier(value) && value.getText() === 'undefined'
}

/** Returns true for literal primitives that cannot be a context object. */
function isLiteralContextValue(node: Node): boolean {
  return TsNode.isNumericLiteral(node)
    || TsNode.isBigIntLiteral(node)
    || TsNode.isStringLiteral(node)
    || TsNode.isNoSubstitutionTemplateLiteral(node)
    || TsNode.isTrueLiteral(node)
    || TsNode.isFalseLiteral(node)
}

/** Returns true when an object literal carries a cause that is not statically absent. */
function hasCauseValue(object: ObjectLiteralExpression): boolean {
  const cause = getPropertyValue(object, 'cause')

  return cause !== undefined && !isStaticallyAbsent(cause)
}

/** Returns true for a direct `err(...)` call. */
export function isErrCall(node: Node): node is CallExpression {
  if (!TsNode.isCallExpression(node))
    return false

  const expression = node.getExpression()
  return TsNode.isIdentifier(expression) && expression.getText() === 'err'
}

/**
 * Returns true when the site already passes a caught error through `cause`.
 * Unknown option values are treated as provided so the rule stays precise.
 */
export function hasCauseOption(site: MessageSite): boolean {
  const thrown = getThrownExpression(site)

  if (thrown !== undefined && TsNode.isNewExpression(thrown)) {
    const argumentIndex = site.constructorName === 'AggregateError' ? 2 : 1
    const options = thrown.getArguments()[argumentIndex]

    if (options === undefined)
      return false

    if (!TsNode.isObjectLiteralExpression(options))
      return true

    return hasCauseValue(options)
  }

  if (thrown !== undefined && isErrCall(thrown)) {
    const options = thrown.getArguments()[1]

    if (options === undefined)
      return false

    if (!TsNode.isObjectLiteralExpression(options))
      return true

    return hasCauseValue(options)
  }

  if (site.options !== undefined)
    return hasCauseValue(site.options)

  return false
}

/** Returns true when `context` is present and is not an empty object literal. */
export function hasNonEmptyContext(site: MessageSite): boolean {
  const context = site.spec === undefined
    ? undefined
    : getPropertyValue(site.spec, 'context')

  if (context === undefined)
    return false

  const value = unwrapExpression(context)

  if (TsNode.isObjectLiteralExpression(value))
    return value.getProperties().length > 0

  if (isStaticallyAbsent(value) || isLiteralContextValue(value))
    return false

  // Dynamic values cannot be inspected; assume the author supplied context.
  return true
}

/** Returns true when `fix.hint` is present and non-empty. */
export function hasFixHint(site: MessageSite): boolean {
  const fix = site.spec === undefined
    ? undefined
    : getPropertyValue(site.spec, 'fix')

  if (fix === undefined)
    return false

  const value = unwrapExpression(fix)

  if (isStaticallyAbsent(value))
    return false

  if (!TsNode.isObjectLiteralExpression(value))
    return true

  const hint = getPropertyValue(value, 'hint')

  if (hint === undefined)
    return false

  const hintValue = unwrapExpression(hint)

  if (isStaticallyAbsent(hintValue))
    return false

  if (TsNode.isStringLiteral(hintValue) || TsNode.isNoSubstitutionTemplateLiteral(hintValue))
    return hintValue.getLiteralValue().trim().length > 0

  return true
}

/** Returns the value of a string literal without substitutions. */
export function getStringLiteralValue(node: Node | undefined): string | undefined {
  if (node === undefined)
    return undefined

  const value = unwrapExpression(node)

  if (TsNode.isStringLiteral(value) || TsNode.isNoSubstitutionTemplateLiteral(value))
    return value.getLiteralValue()

  return undefined
}

/** Returns true when the node is a string literal without substitutions. */
export function isStringLiteralNode(node: Node | undefined): boolean {
  return getStringLiteralValue(node) !== undefined
}
