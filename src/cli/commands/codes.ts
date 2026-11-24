import type { ErrorCodeMetadata } from '../../shared/registry'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { defineCommand } from 'citty'
import { CODE_REGISTRY_FILENAME, parseCodeRegistry } from '../../shared/registry'
import { writeCliError } from '../errors'

function readJsonString(
  text: string,
  start: number,
): { value: string, next: number } | undefined {
  let index = start + 1

  while (index < text.length) {
    const char = text[index]

    if (char === '\\') {
      if (index + 1 >= text.length)
        return undefined

      index += 2
      continue
    }

    if (char === '"') {
      try {
        const value = JSON.parse(text.slice(start, index + 1))

        if (typeof value === 'string')
          return { value, next: index + 1 }
      }
      catch {
        return undefined
      }

      return undefined
    }

    index += 1
  }

  return undefined
}

type SimpleTokenType = 'open' | 'close' | 'comma' | 'colon'

type JsonToken = { type: 'string', value: string } | { type: SimpleTokenType }

const SIMPLE_TOKENS: Readonly<Record<string, SimpleTokenType>> = {
  '{': 'open',
  '}': 'close',
  ',': 'comma',
  ':': 'colon',
}

function* tokenizeJson(text: string): Generator<JsonToken> {
  let index = 0

  while (index < text.length) {
    const char = text[index]

    if (char === '"') {
      const parsed = readJsonString(text, index)

      if (parsed === undefined)
        return

      yield { type: 'string', value: parsed.value }
      index = parsed.next
      continue
    }

    const type = SIMPLE_TOKENS[char]

    if (type !== undefined)
      yield { type }

    index += 1
  }
}

function recordKey(value: string, seen: Set<string>, duplicates: string[]): void {
  if (!seen.has(value)) {
    seen.add(value)
    return
  }

  if (!duplicates.includes(value))
    duplicates.push(value)
}

/**
 * Finds duplicate keys in the top-level object of a JSON document. JSON.parse
 * silently keeps the last value, so duplicate error codes would otherwise slip
 * through validation.
 */
export function findDuplicateKeys(text: string): string[] {
  const seen = new Set<string>()
  const duplicates: string[] = []
  let depth = 0
  let expectingKey = false

  for (const token of tokenizeJson(text)) {
    if (token.type === 'open') {
      depth += 1
      expectingKey = depth === 1
      continue
    }

    if (token.type === 'close') {
      depth -= 1
      continue
    }

    if (depth !== 1)
      continue

    if (token.type === 'comma') {
      expectingKey = true
      continue
    }

    if (token.type === 'colon') {
      expectingKey = false
      continue
    }

    if (token.type === 'string' && expectingKey) {
      recordKey(token.value, seen, duplicates)
      expectingKey = false
    }
  }

  return duplicates
}

function metadataLines(metadata: ErrorCodeMetadata): string[] {
  const lines: string[] = []
  const fields: Array<[string, string | undefined]> = [
    ['severity', metadata.severity],
    ['retryable', metadata.retryable],
    ['description', metadata.description],
    ['docs', metadata.docs],
  ]

  for (const [name, value] of fields) {
    if (value !== undefined)
      lines.push(`  ${name}: ${value}`)
  }

  return lines
}

export interface CodesCommandOptions {
  cwd?: string
}

export interface CodesCommandResult {
  exitCode: 0 | 1
  output: string
}

/**
 * Loads and validates `clearerr.codes.json`, then lists every code. Duplicate
 * keys, invalid codes, and malformed metadata are reported as errors.
 */
export function runCodesCommand(options: CodesCommandOptions = {}): CodesCommandResult {
  const cwd = options.cwd ?? process.cwd()
  const path = join(cwd, CODE_REGISTRY_FILENAME)

  if (!existsSync(path)) {
    return {
      exitCode: 0,
      output: `No ${CODE_REGISTRY_FILENAME} found in ${cwd}. Run "clearerr init" to create one.`,
    }
  }

  const text = readFileSync(path, 'utf8')
  const duplicates = findDuplicateKeys(text)

  if (duplicates.length > 0) {
    throw new TypeError(
      `Duplicate error code${duplicates.length === 1
        ? ''
        : 's'} in ${path}: ${duplicates.join(', ')}. Remove the duplicates.`,
    )
  }

  let value: unknown

  try {
    value = JSON.parse(text)
  }
  catch (error) {
    if (error instanceof SyntaxError)
      throw new TypeError(`Invalid JSON in ${path}: ${error.message}`)

    throw error
  }

  const registry = parseCodeRegistry(value)
  const codes = [
    ...registry.keys(),
  ].sort()
  const lines = [
    `clearerr codes: ${codes.length} code${codes.length === 1
      ? ''
      : 's'} (${path})`,
  ]

  for (const code of codes) {
    lines.push('', code, ...metadataLines(registry.get(code) ?? {}))
  }

  return {
    exitCode: 0,
    output: lines.join('\n'),
  }
}

export const codesCommand = defineCommand({
  meta: {
    name: 'codes',
    description: 'List and validate the codes in clearerr.codes.json.',
  },
  args: {},
  run() {
    try {
      const result = runCodesCommand()

      process.stdout.write(`${result.output}\n`)
      process.exitCode = result.exitCode
    }
    catch (error) {
      writeCliError(error)
      process.exitCode = 1
    }
  },
})
