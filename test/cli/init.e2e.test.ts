import type { CliProject } from '../helpers/cli'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createCliProject, runCli } from '../helpers/cli'

let project: CliProject | undefined

afterEach(() => {
  project?.cleanup()
  project = undefined
})

function createEmptyProject(): CliProject {
  project = createCliProject()
  return project
}

describe('clearerr init', () => {
  it('scaffolds config and an empty registry, then is idempotent', () => {
    const fixture = createEmptyProject()
    const first = runCli(['init'], fixture.dir)

    expect(first.status).toBe(0)
    expect(first.stdout).toContain('created .clearerrrc.json')
    expect(first.stdout).toContain('created clearerr.codes.json')

    const configPath = join(fixture.dir, '.clearerrrc.json')
    const codesPath = join(fixture.dir, 'clearerr.codes.json')
    const config = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>
    const codes = JSON.parse(readFileSync(codesPath, 'utf8')) as Record<string, unknown>

    expect(config).toMatchObject({
      boundaries: [],
      failOn: 'error',
      format: 'terminal',
      redact: [],
      tsconfig: 'tsconfig.json',
    })
    expect(codes).toEqual({})

    const before = statSync(configPath).mtimeMs
    const second = runCli(['init'], fixture.dir)

    expect(second.status).toBe(0)
    expect(second.stdout).toContain('skip .clearerrrc.json')
    expect(statSync(configPath).mtimeMs).toBe(before)
    expect(readFileSync(configPath, 'utf8')).toBe(`${JSON.stringify(config, null, 2)}\n`)
  }, 60_000)

  it('keeps existing files unless --force is passed', () => {
    const fixture = createEmptyProject()
    fixture.write('.clearerrrc.json', JSON.stringify({ failOn: 'none' }))

    expect(runCli(['init'], fixture.dir).status).toBe(0)
    expect(JSON.parse(readFileSync(join(fixture.dir, '.clearerrrc.json'), 'utf8')))
      .toEqual({ failOn: 'none' })

    expect(runCli(['init', '--force'], fixture.dir).status).toBe(0)
    expect(JSON.parse(readFileSync(join(fixture.dir, '.clearerrrc.json'), 'utf8')))
      .toMatchObject({ failOn: 'error', format: 'terminal' })
  }, 60_000)
})
