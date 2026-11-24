import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const cliEntry = join(repoRoot, 'src', 'cli', 'index.ts')
const tsxCli = join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')

export const DEFAULT_TSCONFIG = JSON.stringify({
  compilerOptions: {
    module: 'Preserve',
    target: 'ESNext',
  },
  include: ['src'],
}, null, 2)

export interface CliProject {
  dir: string
  write: (relativePath: string, content: string) => void
  cleanup: () => void
}

/** Creates a throwaway project with a tsconfig and optional extra files. */
export function createCliProject(files: Record<string, string> = {}): CliProject {
  const dir = mkdtempSync(join(tmpdir(), 'clearerr-cli-'))

  function write(relativePath: string, content: string): void {
    const path = join(dir, relativePath)

    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
  }

  write('tsconfig.json', DEFAULT_TSCONFIG)

  for (const [relativePath, content] of Object.entries(files))
    write(relativePath, content)

  return {
    dir,
    write,
    cleanup: () => rmSync(dir, { force: true, recursive: true }),
  }
}

export interface CliResult {
  status: number | null
  stdout: string
  stderr: string
}

/** Runs the CLI in `cwd` through tsx so tests do not need a build first. */
export function runCli(args: readonly string[], cwd: string): CliResult {
  const result = spawnSync(process.execPath, [tsxCli, cliEntry, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      NO_COLOR: '1',
    },
  })

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}
