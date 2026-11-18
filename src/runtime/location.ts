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
  const lines = (stack ?? new Error().stack ?? '').split('\n').slice(1)

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
  const match = trimmed.match(/^at\s+(?:(.+?)\s+\()?([^()]+):(\d+):(\d+)\)?$/)

  if (!match) {
    return undefined
  }

  let file = normalizeFile(match[2])
  const lineNumber = Number(match[3])
  const column = Number(match[4])

  if (!file || !Number.isInteger(lineNumber) || !Number.isInteger(column)) {
    return undefined
  }

  const functionName = match[1]?.trim()
  const frame: ParsedFrame = { file, line: lineNumber, column }

  if (functionName && functionName !== 'new <anonymous>') {
    frame.function = functionName
  }

  return frame
}

function normalizeFile(file: string): string {
  if (file.startsWith('file://')) {
    file = file.slice('file://'.length)
    if (file.startsWith('localhost/')) {
      file = file.slice('localhost/'.length)
    }
    try {
      file = decodeURIComponent(file)
    }
    catch {
      // Keep the original value if it is not valid percent encoding.
    }
    if (/^\/[A-Z]:\//u.test(file)) {
      file = file.slice(1)
    }
  }

  return file.trim().replace(/\\/gu, '/')
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

  if (/\/(src|dist)\/runtime\/location\.[cm]?[jt]s$/u.test(normalized)
    || /\/(src|dist)\/runtime\/error\.[cm]?[jt]s$/u.test(normalized)
    || /\/clearerr\/dist\/.*\.mjs$/u.test(lower)
    || /\\clearerr\\dist\\.*\.mjs$/u.test(lower)) {
    return true
  }

  return false
}
