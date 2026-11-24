import type { CliProject } from '../helpers/cli'
import { afterEach, describe, expect, it } from 'vitest'
import { createCliProject, runCli } from '../helpers/cli'

let project: CliProject | undefined

afterEach(() => {
  project?.cleanup()
  project = undefined
})

function createRegistryProject(registry: string): CliProject {
  project = createCliProject({ 'clearerr.codes.json': registry })
  return project
}

describe('clearerr codes', () => {
  it('lists valid codes with their metadata', () => {
    const fixture = createRegistryProject(JSON.stringify({
      APP_FAILED: {
        description: 'The app failed.',
        retryable: 'backoff',
        severity: 'fatal',
      },
      APP_OK: {},
    }, null, 2))
    const result = runCli(['codes'], fixture.dir)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('clearerr codes: 2 codes')
    expect(result.stdout).toContain('APP_FAILED')
    expect(result.stdout).toContain('severity: fatal')
    expect(result.stdout).toContain('retryable: backoff')
    expect(result.stdout).toContain('APP_OK')
  }, 60_000)

  it('reports duplicate codes instead of silently keeping the last one', () => {
    const fixture = createRegistryProject(`{
  "APP_FAILED": { "severity": "fatal" },
  "APP_FAILED": { "severity": "warning" }
}
`)
    const result = runCli(['codes'], fixture.dir)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Duplicate error code')
    expect(result.stderr).toContain('APP_FAILED')
  }, 60_000)

  it('detects duplicates after decoding escaped keys', () => {
    const fixture = createRegistryProject(`{
  "APP\\u005fFAILED": { "severity": "fatal" },
  "APP_FAILED": { "severity": "warning" }
}
`)
    const result = runCli(['codes'], fixture.dir)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Duplicate error code')
    expect(result.stderr).toContain('APP_FAILED')
  }, 60_000)

  it('lists escaped keys by their decoded value', () => {
    const fixture = createRegistryProject(`{
  "APP\\u005fOK": {}
}
`)
    const result = runCli(['codes'], fixture.dir)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('clearerr codes: 1 code')
    expect(result.stdout).toContain('APP_OK')
  }, 60_000)

  it('flags codes that do not match the registry format', () => {
    const fixture = createRegistryProject(JSON.stringify({ app_failed: {} }))
    const result = runCli(['codes'], fixture.dir)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('not a valid error code')
  }, 60_000)

  it('explains how to create a missing registry', () => {
    const fixture = createCliProject()
    const result = runCli(['codes'], fixture.dir)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('No clearerr.codes.json found')
    expect(result.stdout).toContain('clearerr init')
  }, 60_000)
})
