import type { ErrorLocation } from '../shared/types'

const OWN_RUNTIME_FRAMES = [
  '/src/runtime/error.',
  '\\src\\runtime\\error.',
  '/src/runtime/location.',
  '\\src\\runtime\\location.',
  '/dist/index.',
  '\\dist\\index.',
]

export function captureLocation(stack?: string): ErrorLocation {
  const lines = (stack ?? new Error('Location capture requires a stack').stack ?? '').split('\n').slice(1)

  for (const line of lines) {
    const frame = parseStackFrame(line)
    if (!frame || isIgnoredFrame(frame.file)) {
      continue
    }

    return frame
  }

  return { file: 'unknown', line: 0 }
}

interface ParsedFrame extends ErrorLocation {
  file: string
  line: number
}

function parseStackFrame(line: string): ParsedFrame | undefined {
  const trimmed = line.trim()
  if (!trimmed.startsWith('at ')) {
    return undefined
  }

  let locationText = trimmed.slice(3).trim()
  if (locationText.endsWith(')')) {
    locationText = locationText.slice(0, -1)
  }

  const suffixMatch = locationText.match(/:(\d+):(\d+)$/u)
  if (!suffixMatch) {
    return undefined
  }

  const column = Number(suffixMatch[2])
  const lineNumber = Number(suffixMatch[1])
  let prefix = locationText.slice(0, suffixMatch.index)
  let functionName: string | undefined

  const openParenthesis = prefix.lastIndexOf(' (')
  if (openParenthesis >= 0) {
    functionName = prefix.slice(0, openParenthesis).trim()
    prefix = prefix.slice(openParenthesis + 2).trim()
  }

  const file = normalizeFile(prefix)

  if (!file || !Number.isInteger(lineNumber) || !Number.isInteger(column)) {
    return undefined
  }

  const frame: ParsedFrame = { file, line: lineNumber, column }

  if (functionName && functionName !== 'new <anonymous>') {
    frame.function = functionName
  }

  return frame
}

function normalizeFile(file: string): string {
  let normalized = file
  if (normalized.startsWith('file://')) {
    normalized = normalized.slice('file://'.length)
    if (normalized.startsWith('localhost/')) {
      normalized = normalized.slice('localhost/'.length)
    }
    try {
      normalized = decodeURIComponent(normalized)
    }
    catch {
      // Keep the original value if it is not valid percent encoding.
    }
    if (/^\/[A-Z]:\//u.test(normalized)) {
      normalized = normalized.slice(1)
    }
  }

  return normalized.trim().replace(/\\/gu, '/')
}

function isIgnoredFrame(file: string): boolean {
  const normalized = file.replace(/\\/gu, '/')
  const lower = normalized.toLowerCase()

  if (lower.includes('node_modules/') || lower.startsWith('node:')) {
    return true
  }

  for (const marker of OWN_RUNTIME_FRAMES) {
    const normalizedMarker = marker.replace(/\\/gu, '/')
    if (normalized.includes(normalizedMarker)) {
      return true
    }
  }

  if (/\/(?:src|dist)\/runtime\/location\.[cm]?[jt]s$/u.test(normalized)
    || /\/(?:src|dist)\/runtime\/error\.[cm]?[jt]s$/u.test(normalized)
    || /\/clearerr\/dist\/.*\.mjs$/u.test(lower)
    || /\\clearerr\\dist\\.*\.mjs$/u.test(lower)) {
    return true
  }

  return false
}
