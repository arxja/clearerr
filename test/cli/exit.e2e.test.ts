import type { CliProject } from '../helpers/cli'
import { afterEach, describe, expect, it } from 'vitest'
import { evaluateExit } from '../../src/cli/exit'
import { createCliProject, runCli } from '../helpers/cli'

const STRUCTURED = `throw err({
  code: 'APP_FAILED',
  message: 'The app failed',
  context: { id: 1 },
  fix: { hint: 'Retry the request', retryable: 'once' },
})
`

let project: CliProject | undefined

afterEach(() => {
  project?.cleanup()
  project = undefined
})

function createProject(withBareThrow: boolean): CliProject {
  project = createCliProject({
    ...(withBareThrow
      ? { 'src/bad.ts': 'throw new Error(\'boom\')\n' }
      : {}),
    'src/clean.ts': STRUCTURED,
    'clearerr.codes.json': JSON.stringify({ APP_FAILED: {} }, null, 2),
  })

  return project
}

describe('clearerr scan exit codes', () => {
  it('never fails without --ci or an explicit threshold', () => {
    const fixture = createProject(true)

    expect(runCli(['scan'], fixture.dir).status).toBe(0)
  }, 60_000)

  it('fails on error findings with --ci and respects --fail-on none', () => {
    const fixture = createProject(true)

    expect(runCli(['scan', '--ci'], fixture.dir).status).toBe(1)
    expect(runCli(['scan', '--ci', '--fail-on', 'none'], fixture.dir).status).toBe(0)
  }, 60_000)

  it('honors failOn from .clearerrrc.json', () => {
    const fixture = createProject(true)

    fixture.write('.clearerrrc.json', JSON.stringify({ failOn: 'none' }))
    expect(runCli(['scan', '--ci'], fixture.dir).status).toBe(0)

    fixture.write('.clearerrrc.json', JSON.stringify({ failOn: 'error' }))
    expect(runCli(['scan', '--ci'], fixture.dir).status).toBe(1)
  }, 60_000)

  it('enforces the coverage threshold in CI', () => {
    const mixed = createProject(true)

    expect(runCli([
      'scan',
      '--ci',
      '--fail-on',
      'none',
      '--coverage',
      '0.8',
    ], mixed.dir).status).toBe(1)
    expect(runCli([
      'scan',
      '--ci',
      '--fail-on',
      'none',
      '--coverage',
      '0.4',
    ], mixed.dir).status).toBe(0)

    mixed.cleanup()
    project = createProject(false)

    expect(runCli(['scan', '--ci', '--coverage', '1'], project.dir).status).toBe(0)
  }, 60_000)

  it('treats warning severity as a threshold between error and none', () => {
    const warning = {
      ruleId: 'stable-codes',
      severity: 'warning' as const,
      message: 'dynamic',
      file: 'src/a.ts',
      line: 1,
      column: 1,
    }
    const coverage = { scored: 1, unscorable: 0, ratio: 1 }

    expect(evaluateExit({
      findings: [warning],
      coverage,
      failOn: 'error',
    }).code).toBe(0)
    expect(evaluateExit({
      findings: [warning],
      coverage,
      failOn: 'warning',
    }).code).toBe(1)
    expect(evaluateExit({
      findings: [warning],
      coverage,
      failOn: 'none',
    }).code).toBe(0)
  })
})
