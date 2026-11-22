import type { Rule } from '../engine'
import { createFinding } from '../findings'
import { hasFixHint } from './helpers'

const REGEXP_SPECIAL = /[.*+?^${}()|[\]\\]/

function escapeGlobCharacter(char: string): string {
  if (REGEXP_SPECIAL.test(char))
    return `\\${char}`

  return char
}

function escapeGlob(value: string): string {
  return [...value].map(escapeGlobCharacter).join('')
}

function matchStar(glob: string, index: number): { pattern: string, next: number } {
  if (glob[index + 1] !== '*')
    return { pattern: '[^/]*', next: index + 1 }

  if (glob[index + 2] === '/')
    return { pattern: '(?:[^/]+/)*', next: index + 3 }

  return { pattern: '.*', next: index + 2 }
}

function matchBrace(glob: string, index: number): { pattern: string, next: number } {
  const end = glob.indexOf('}', index)

  if (end === -1)
    return { pattern: '\\{', next: index + 1 }

  const alternatives = glob.slice(index + 1, end).split(',').map(escapeGlob)
  return { pattern: `(?:${alternatives.join('|')})`, next: end + 1 }
}

/**
 * Converts the small glob subset used by `boundaries` into a regular
 * expression. Supports `*`, `**`, `?`, and `{a,b}` alternatives.
 */
function globToRegExp(glob: string): RegExp {
  let pattern = ''
  let index = 0

  while (index < glob.length) {
    const char = glob[index]

    if (char === '*') {
      const star = matchStar(glob, index)
      pattern += star.pattern
      index = star.next
      continue
    }

    if (char === '?') {
      pattern += '[^/]'
      index += 1
      continue
    }

    if (char === '{') {
      const brace = matchBrace(glob, index)
      pattern += brace.pattern
      index = brace.next
      continue
    }

    pattern += escapeGlobCharacter(char)
    index += 1
  }

  return new RegExp(`^${pattern}$`)
}

function normalizePath(value: string): string {
  return value.replaceAll('\\', '/').replace(/^\.?\//, '')
}

function matchesBoundary(file: string, boundaries: readonly string[]): boolean {
  const normalizedFile = normalizePath(file)

  return boundaries.some(boundary =>
    globToRegExp(normalizePath(boundary)).test(normalizedFile),
  )
}

/**
 * Requires a `fix.hint` on structured errors raised in boundary files.
 * Files outside the configured `boundaries` globs are ignored.
 */
export const requireFixHint: Rule = (site, ctx) => {
  const boundaries = ctx.boundaries

  if (site.spec === undefined || boundaries === undefined || boundaries.length === 0)
    return []

  if (!matchesBoundary(ctx.relativeFile, boundaries))
    return []

  if (hasFixHint(site))
    return []

  return [
    createFinding(
      'require-fix-hint',
      site,
      'Boundary errors must include "fix.hint" so agents know how to recover.',
    ),
  ]
}
