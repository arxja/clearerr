import type { FormatForAgentOptions } from '../shared/types'
import { formatForAgent, formatForHuman } from './format'

export type AgentHandlerFormat = 'agent' | 'json' | 'human'

export interface AgentHandlerOptions {
  stream?: 'stderr' | 'stdout'
  format?: AgentHandlerFormat
}

interface NodeStream {
  write: (value: string, callback?: () => void) => unknown
}

interface NodeProcess {
  env?: Record<string, string | undefined>
  stderr?: NodeStream
  stdout?: NodeStream
  on: (event: 'uncaughtException', listener: (error: unknown) => void) => unknown
  exitCode?: string | number | null
  exit?: (code?: number) => never
}

const SHUTDOWN_TIMEOUT_MS = 1000

export function installAgentHandler(opts?: AgentHandlerOptions): void {
  const nodeProcess = Reflect.get(globalThis, 'process') as NodeProcess | undefined

  if (!nodeProcess || typeof nodeProcess.on !== 'function') {
    throw new TypeError('installAgentHandler requires Node.js')
  }

  const streamName = opts?.stream ?? 'stderr'
  const stream = streamName === 'stdout'
    ? nodeProcess.stdout
    : nodeProcess.stderr
  if (!stream || typeof stream.write !== 'function') {
    throw new TypeError(`process.${streamName} is unavailable`)
  }

  const envFormat = nodeProcess.env?.CLEARERR_FORMAT
  const format = opts?.format ?? normalizeFormat(envFormat)

  nodeProcess.on('uncaughtException', (error: unknown) => {
    const formatted = format === 'human'
      ? formatForHuman(error)
      : formatForAgent(error)

    nodeProcess.exitCode = 1
    shutdown(stream, `${formatted}\n`, nodeProcess)
  })
}

function shutdown(stream: NodeStream, output: string, nodeProcess: NodeProcess): void {
  const exit = nodeProcess.exit
  if (typeof exit !== 'function') {
    stream.write(output)
    return
  }

  let finished = false
  const finish = (): void => {
    if (finished) {
      return
    }
    finished = true
    exit.call(nodeProcess, 1)
  }

  stream.write(output, finish)
  const timer = setTimeout(finish, SHUTDOWN_TIMEOUT_MS)
  timer.unref()
}

function normalizeFormat(value: string | undefined): AgentHandlerFormat {
  if (value === 'json') {
    return 'json'
  }
  if (value === 'human') {
    return 'human'
  }
  return 'agent'
}

export type { FormatForAgentOptions }
