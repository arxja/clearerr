import type { FormatForAgentOptions } from '../shared/types'
import { formatForAgent, formatForHuman } from './format'

export type AgentHandlerFormat = 'agent' | 'json' | 'human'

export interface AgentHandlerOptions {
  stream?: 'stderr' | 'stdout'
  format?: AgentHandlerFormat
}

interface NodeProcess {
  env?: Record<string, string | undefined>
  stderr?: { write: (value: string) => unknown }
  stdout?: { write: (value: string) => unknown }
  on: (event: 'uncaughtException', listener: (error: unknown) => void) => unknown
  exitCode?: string | number | null
}

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

    stream.write(`${formatted}\n`)
    nodeProcess.exitCode = 1
  })
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
