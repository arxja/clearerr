import type { CliProject } from '../helpers/cli'
import { afterEach, describe, expect, it } from 'vitest'
import { runScanCommand } from '../../src/cli/commands/scan'
import { createCliProject, runCli } from '../helpers/cli'

const STRUCTURED = `throw err({
  code: 'APP_FAILED',
  message: 'The app failed',
  context: { id: 1 },
  fix: { hint: 'Retry the request', retryable: 'once' },
})
`

const BARE = `throw new Error('boom')
`

let project: CliProject | undefined

afterEach(() => {
  project?.cleanup()
  project = undefined
})

function createScanProject(): CliProject {
  project = createCliProject({
    'src/bad.ts': BARE,
    'src/clean.ts': STRUCTURED,
    'clearerr.codes.json': JSON.stringify({ APP_FAILED: {} }, null, 2),
  })

  return project
}

describe('clearerr scan', () => {
  it('dispatches --help for the root and every subcommand', () => {
    const fixture = createScanProject()
    const root = runCli(['--help'], fixture.dir)

    expect(root.status).toBe(0)
    for (const command of ['scan', 'init', 'codes'])
      expect(root.stdout).toContain(command)

    for (const command of ['scan', 'init', 'codes']) {
      const result = runCli([command, '--help'], fixture.dir)

      expect(result.status, command).toBe(0)
      expect(result.stdout, command).toContain(`clearerr ${command}`)
    }
  }, 60_000)

  it('prints one JSON object matching the finding shape', () => {
    const fixture = createScanProject()
    const result = runCli(['scan', '--format', 'json'], fixture.dir)

    expect(result.status).toBe(0)

    const report = JSON.parse(result.stdout) as {
      findings: Array<Record<string, unknown>>
      coverage: Record<string, unknown>
    }

    expect(report.coverage).toMatchObject({
      scored: 1,
      unscorable: 1,
      ratio: 0.5,
    })

    const bare = report.findings.find(finding => finding.ruleId === 'no-bare-throw')

    expect(bare).toBeDefined()
    expect(Object.keys(bare ?? {}).sort()).toEqual([
      'column',
      'file',
      'line',
      'message',
      'ruleId',
      'severity',
    ])
    expect(bare).toMatchObject({
      ruleId: 'no-bare-throw',
      severity: 'error',
      line: 1,
      column: 1,
    })
  }, 60_000)

  it('renders a stable terminal report grouped by file', () => {
    const fixture = createScanProject()
    const result = runScanCommand({
      cwd: fixture.dir,
      color: false,
    })

    expect(result.output).toMatchInlineSnapshot(`
      "clearerr scan: 1 finding in 1 file

      src/bad.ts
           1:1    error   no-bare-throw  Throw a structured Clearerr error instead of a bare error.

      Coverage: 50.0% (1/2 structured sites)
      Summary: 1 error, 0 warnings"
    `)
    expect(result.exitCode).toBe(0)
  }, 60_000)

  it('fails when the scan target does not exist', () => {
    const fixture = createScanProject()
    const result = runCli(['scan', 'missing'], fixture.dir)

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Cannot find scan target')
  }, 60_000)

  it('succeeds for an existing empty directory target', () => {
    const fixture = createScanProject()
    fixture.write('empty/.keep', '')

    const result = runScanCommand({
      cwd: fixture.dir,
      target: 'empty',
      color: false,
    })

    expect(result.exitCode).toBe(0)
    expect(result.report.coverage).toEqual({ scored: 0, unscorable: 0, ratio: 0 })
    expect(result.output).toContain('Coverage: n/a')
  }, 60_000)

  it('scans files whose names start with two dots inside the target', () => {
    project = createCliProject({
      'src/..legacy.ts': BARE,
      'tsconfig.json': JSON.stringify({
        compilerOptions: { module: 'Preserve', target: 'ESNext' },
        include: ['src/..legacy.ts'],
      }, null, 2),
    })

    const result = runScanCommand({
      cwd: project.dir,
      target: 'src',
      color: false,
    })

    expect(result.report.coverage).toEqual({ scored: 0, unscorable: 1, ratio: 0 })
    expect(result.report.findings).toHaveLength(1)
  }, 60_000)

  it('loads a valid config and rejects an invalid one with an actionable message', () => {
    const fixture = createScanProject()
    fixture.write('.clearerrrc.json', JSON.stringify({ format: 'json' }))

    const valid = runCli(['scan'], fixture.dir)

    expect(valid.status).toBe(0)
    expect(() => JSON.parse(valid.stdout)).not.toThrow()

    fixture.write('.clearerrrc.json', JSON.stringify({ format: 'xml' }))

    const invalid = runCli(['scan'], fixture.dir)

    expect(invalid.status).toBe(1)
    expect(invalid.stderr).toContain('Invalid .clearerrrc.json')
    expect(invalid.stderr).toContain('format')
  }, 60_000)
})
