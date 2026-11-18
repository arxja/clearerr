import type { ErrorLocation } from '../shared/types'

const OWN_RUNTIME_FRAMES = [
  '/src/runtime/error.',
  '\\src\\runtime\\error.',
  '/src/runtime/location.',
  '\\src\\runtime\\location.',
]

export function captureLocation(stack?: unknown): ErrorLocation {
  let candidate: unknown = stack
  if (stack === undefined) {
    candidate = new Error('Location capture requires a stack').stack
  }

  if (typeof candidate !== 'string') {
    return { file: 'unknown', line: 0 }
  }

  const lines = candidate.split('\n').slice(1)

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
  let wrapped = false
  if (locationText.endsWith(')')) {
    locationText = locationText.slice(0, -1)
    wrapped = true
  }

  const suffixMatch = locationText.match(/:(\d+):(\d+)$/u)
  if (!suffixMatch) {
    return undefined
  }

  const column = Number(suffixMatch[2])
  const lineNumber = Number(suffixMatch[1])
  let prefix = locationText.slice(0, suffixMatch.index)
  let functionName: string | undefined

  if (wrapped) {
    const outerWrapper = findOuterFrameWrapper(prefix)
    if (outerWrapper !== undefined) {
      functionName = prefix.slice(0, outerWrapper).trim()
      prefix = prefix.slice(outerWrapper + 1).trim()
    }
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

function findOuterFrameWrapper(prefix: string): number | undefined {
  let depth = 0

  for (let index = 0; index < prefix.length; index++) {
    const character = prefix[index]
    if (character === '(') {
      if (depth === 0) {
        const before = prefix[index - 1]
        if (index === 0 || before === ' ' || before === '\t') {
          return index
        }
      }
      depth++
    }
    else if (character === ')' && depth > 0) {
      depth--
    }
  }

  return undefined
}

function normalizeFile(file: string): string {
  let normalized = file
  if (normalized.startsWith('file://')) {
    normalized = normalized.slice('file://'.length)
    if (normalized.startsWith('localhost/')) {
      normalized = `/${normalized.slice('localhost/'.length)}`
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

  if (/(?:^|\/|\\)node_modules(?:\/|\\|$)/u.test(lower) || lower.startsWith('node:')) {
    return true
  }

  const isClearerrPackage = lower.includes('/clearerr/')
    || lower.includes('\\clearerr\\')
    || lower.startsWith('clearerr/')

  if (isClearerrPackage) {
    for (const marker of OWN_RUNTIME_FRAMES) {
      const normalizedMarker = marker.replace(/\\/gu, '/')
      if (normalized.includes(normalizedMarker)) {
        return true
      }
    }

    if (/\/clearerr\/dist\/index\.[^/]+$/u.test(lower)
      || /\\clearerr\\dist\\index\.[^\\]+$/u.test(lower)
      || /\/clearerr\/src\/runtime\/(?:error|location)\.[cm]?[jt]s$/u.test(lower)) {
      return true
    }
  }

  return false
}
