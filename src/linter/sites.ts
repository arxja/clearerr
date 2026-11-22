import type {
  CallExpression,
  NewExpression,
  Node,
  ObjectLiteralExpression,
  SourceFile,
  ThrowStatement,
} from 'ts-morph'
import type { LoaderOptions } from './loader'
import { Node as TsNode } from 'ts-morph'
import { getSourceFiles } from './loader'

/** The syntactic form that supplies a human-readable error message. */
export type MessageSiteKind = 'throw' | 'error-constructor' | 'process-exit'

export interface MessageSite {
  kind: MessageSiteKind
  /** Absolute path of the file that contains the site. */
  file: string
  /** 1-based line number of the site. */
  line: number
  /** 1-based column number of the site. */
  column: number
  /** The AST node that produced the site: a throw, `new` expression, or call. */
  node: Node
  /** Source text of the message expression, including quotes for literals. */
  message?: string
  /** Unquoted value when the message is a static string literal. */
  messageLiteral?: string
  /** The expression that supplies the message, when the site has one. */
  messageNode?: Node
  /** Constructor name for `error-constructor` sites and thrown `new` expressions. */
  constructorName?: string
  /** Object literal passed to `err(...)` or an error constructor. */
  spec?: ObjectLiteralExpression
  /** Options object passed as the second argument to `err(...)`. */
  options?: ObjectLiteralExpression
}

const BUILTIN_ERROR_CONSTRUCTORS = new Set([
  'AggregateError',
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
])

function isErrorConstructorName(name: string): boolean {
  return BUILTIN_ERROR_CONSTRUCTORS.has(name) || name.endsWith('Error')
}

function getCalleeName(node: Node): string | undefined {
  if (TsNode.isIdentifier(node))
    return node.getText()

  if (TsNode.isPropertyAccessExpression(node))
    return node.getName()

  return undefined
}

function asObjectLiteral(node: Node | undefined): ObjectLiteralExpression | undefined {
  if (node === undefined || !TsNode.isObjectLiteralExpression(node))
    return undefined

  return node
}

function getPropertyValue(object: ObjectLiteralExpression, name: string): Node | undefined {
  const property = object.getProperty(name)

  if (property === undefined)
    return undefined

  if (TsNode.isPropertyAssignment(property))
    return property.getInitializer()

  if (TsNode.isShorthandPropertyAssignment(property))
    return property.getNameNode()

  return undefined
}

function getStringLiteralValue(node: Node | undefined): string | undefined {
  if (node === undefined)
    return undefined

  if (TsNode.isStringLiteral(node) || TsNode.isNoSubstitutionTemplateLiteral(node))
    return node.getLiteralValue()

  return undefined
}

function isStringMessageExpression(node: Node): boolean {
  return TsNode.isStringLiteral(node)
    || TsNode.isNoSubstitutionTemplateLiteral(node)
    || TsNode.isTemplateExpression(node)
}

function messageFields(messageNode: Node | undefined): Pick<MessageSite, 'message' | 'messageLiteral' | 'messageNode'> {
  if (messageNode === undefined)
    return {}

  return {
    messageNode,
    message: messageNode.getText(),
    messageLiteral: getStringLiteralValue(messageNode),
  }
}

function createSite(
  node: Node,
  kind: MessageSiteKind,
  details: Omit<MessageSite, 'kind' | 'file' | 'line' | 'column' | 'node'>,
): MessageSite {
  const sourceFile = node.getSourceFile()
  const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart())

  return {
    kind,
    file: sourceFile.getFilePath(),
    line,
    column,
    node,
    ...details,
  }
}

/**
 * Reads an object literal argument as a clearerr spec. Object literals that
 * carry neither `message` nor `code` are treated as ordinary arguments so a
 * custom constructor that takes an options bag is not mistaken for a spec.
 */
function readSpecArgument(node: Node | undefined): {
  spec?: ObjectLiteralExpression
  messageNode?: Node
} {
  const spec = asObjectLiteral(node)

  if (spec === undefined)
    return { messageNode: node }

  const messageNode = getPropertyValue(spec, 'message')
  const codeNode = getPropertyValue(spec, 'code')

  if (messageNode === undefined && codeNode === undefined)
    return { messageNode: node }

  return { spec, messageNode }
}

/**
 * Returns the message argument of an error constructor. `AggregateError`
 * takes its errors first, so its message is the second argument.
 */
function getMessageArgument(node: NewExpression, constructorName: string | undefined): Node | undefined {
  const index = constructorName === 'AggregateError'
    ? 1
    : 0

  return node.getArguments()[index]
}

function isWrappedExpression(node: Node): boolean {
  return TsNode.isParenthesizedExpression(node)
    || TsNode.isAsExpression(node)
    || TsNode.isNonNullExpression(node)
    || TsNode.isTypeAssertion(node)
    || TsNode.isSatisfiesExpression(node)
}

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

function unwrapExpression(node: Node): Node {
  let current = node
  let inner = getWrappedExpression(current)

  while (inner !== undefined) {
    current = inner
    inner = getWrappedExpression(current)
  }

  return current
}

function extractThrowSite(statement: ThrowStatement): MessageSite {
  const thrown = unwrapExpression(statement.getExpression())
  const details: Omit<MessageSite, 'kind' | 'file' | 'line' | 'column' | 'node'> = {}

  if (TsNode.isNewExpression(thrown)) {
    details.constructorName = getCalleeName(thrown.getExpression())

    const specArgument = readSpecArgument(getMessageArgument(thrown, details.constructorName))
    details.spec = specArgument.spec
    Object.assign(details, messageFields(specArgument.messageNode))
  }
  else if (TsNode.isCallExpression(thrown) && getCalleeName(thrown.getExpression()) === 'err') {
    details.spec = asObjectLiteral(thrown.getArguments()[0])
    details.options = asObjectLiteral(thrown.getArguments()[1])
    Object.assign(details, messageFields(details.spec && getPropertyValue(details.spec, 'message')))
  }
  else if (isStringMessageExpression(thrown)) {
    Object.assign(details, messageFields(thrown))
  }

  return createSite(statement, 'throw', details)
}

function isDirectlyThrown(node: NewExpression): boolean {
  let current: Node = node
  let parent = current.getParent()

  while (parent !== undefined && isWrappedExpression(parent)) {
    current = parent
    parent = parent.getParent()
  }

  return parent !== undefined
    && TsNode.isThrowStatement(parent)
    && parent.getExpression() === current
}

function extractErrorConstructorSite(node: NewExpression): MessageSite | undefined {
  const constructorName = getCalleeName(node.getExpression())

  if (constructorName === undefined || !isErrorConstructorName(constructorName))
    return undefined

  const specArgument = readSpecArgument(getMessageArgument(node, constructorName))

  return createSite(node, 'error-constructor', {
    constructorName,
    spec: specArgument.spec,
    ...messageFields(specArgument.messageNode),
  })
}

function isProcessExitCall(node: CallExpression): boolean {
  const expression = node.getExpression()

  return TsNode.isPropertyAccessExpression(expression)
    && expression.getName() === 'exit'
    && TsNode.isIdentifier(expression.getExpression())
    && expression.getExpression().getText() === 'process'
}

function extractProcessExitSite(node: CallExpression): MessageSite | undefined {
  if (!isProcessExitCall(node))
    return undefined

  const argument = node.getArguments()[0]

  // `process.exit(1)` carries no message. Only string-like arguments describe
  // a failure, so numeric codes and variables are ignored.
  if (argument === undefined || !isStringMessageExpression(argument))
    return undefined

  return createSite(node, 'process-exit', messageFields(argument))
}

/** Extracts message sites from one source file, ordered by position. */
export function extractMessageSitesFromSourceFile(sourceFile: SourceFile): MessageSite[] {
  const sites: MessageSite[] = []

  sourceFile.forEachDescendant((node) => {
    if (TsNode.isThrowStatement(node)) {
      sites.push(extractThrowSite(node))
    }
    else if (TsNode.isNewExpression(node) && !isDirectlyThrown(node)) {
      const site = extractErrorConstructorSite(node)

      if (site !== undefined)
        sites.push(site)
    }
    else if (TsNode.isCallExpression(node)) {
      const site = extractProcessExitSite(node)

      if (site !== undefined)
        sites.push(site)
    }
  })

  return sites
}

/** Extracts message sites from many source files, ordered by file and position. */
export function extractMessageSitesFromSourceFiles(sourceFiles: readonly SourceFile[]): MessageSite[] {
  return sourceFiles
    .flatMap(extractMessageSitesFromSourceFile)
    .sort((a, b) => a.file.localeCompare(b.file) || a.node.getStart() - b.node.getStart())
}

/** Loads the project described by `options` and extracts every message site. */
export function extractMessageSites(options: LoaderOptions = {}): MessageSite[] {
  return extractMessageSitesFromSourceFiles(getSourceFiles(options))
}
