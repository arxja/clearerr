import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { installAgentHandler } from '../../src/runtime/handler'

interface MockNodeProcess {
  env: Record<string, string | undefined>
  stderr: { write: ReturnType<typeof vi.fn> }
  stdout: { write: ReturnType<typeof vi.fn> }
  on: ReturnType<typeof vi.fn>
  exitCode?: string | number | null
}

describe('installAgentHandler', () => {
  it('throws outside Node.js', () => {
    vi.stubGlobal('process', undefined)
    try {
      expect(() => installAgentHandler()).toThrow('requires Node.js')
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  it('throws when process.stderr is unavailable', () => {
    vi.stubGlobal('process', {
      env: {},
      on: vi.fn(),
    })
    try {
      expect(() => installAgentHandler()).toThrow('process.stderr is unavailable')
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  it('uses CLEARERR_FORMAT=json as an environment override', () => {
    const listener = vi.fn()
    const write = vi.fn()
    const stdoutWrite = vi.fn()
    const mock: MockNodeProcess = {
      env: { CLEARERR_FORMAT: 'json' },

      stderr: { write },

      stdout: { write: stdoutWrite },

      on: vi.fn(),
    }

    mock.on.mockImplementation((_event: string, handler: (error: unknown) => void) => {
      listener.mockImplementation(handler)
    })
    vi.stubGlobal('process', mock)

    try {
      installAgentHandler()
      expect(mock.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function))

      listener({ name: 'Error', message: 'native failure' })
      expect(write).toHaveBeenCalledTimes(1)
      const line = String(write.mock.calls[0]?.[0]).trim()
      expect(JSON.parse(line)).toMatchObject({
        name: 'Error',
        message: 'native failure',
      })
      expect(mock.exitCode).toBe(1)
    }
    finally {
      vi.unstubAllGlobals()
    }
  })

  it('emits a one-line envelope to stderr in a spawned process', () => {
    const entry = pathToFileURL(join(process.cwd(), 'src/index.ts')).href
    const script = `import('${entry}').then((m) => { m.installAgentHandler(); setImmediate(() => { throw m.err({ code: 'TEST_HANDLER_SPAWN', message: 'spawn failure', context: { source: 'e2e' } }) }) })`
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--eval', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, CLEARERR_FORMAT: 'json' },
    })

    const lines = result.stderr.trim().split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThanOrEqual(1)

    const envelope = JSON.parse(lines[0]!)
    expect(envelope).toMatchObject({
      schemaVersion: 1,
      code: 'TEST_HANDLER_SPAWN',
      message: 'spawn failure',
      context: { source: 'e2e' },
      severity: 'fatal',
    })
  }, 15_000)

  it('terminates with status 1 on an uncaught error despite an active handle', () => {
    const entry = pathToFileURL(join(process.cwd(), 'src/index.ts')).href
    const script = `import('${entry}').then((m) => { m.installAgentHandler(); setInterval(() => {}, 1000); setImmediate(() => { throw m.err({ code: 'TEST_HANDLER_ACTIVE_HANDLE', message: 'active handle failure' }) }) })`
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--eval', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, CLEARERR_FORMAT: 'json' },
      timeout: 5_000,
    })

    expect(result.status).toBe(1)
    const lines = result.stderr.trim().split('\n').filter(Boolean)
    expect(JSON.parse(lines[0]!)).toMatchObject({
      code: 'TEST_HANDLER_ACTIVE_HANDLE',
      message: 'active handle failure',
    })
  }, 15_000)
})
