import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { getSourceFiles, loadProject, resolveTsconfigPath } from '../../src/linter'

const fixtureDir = fileURLToPath(new URL('../fixtures/rules', import.meta.url))

function relativeSourcePaths(paths: string[]): string[] {
  return paths
    .map(path => relative(fixtureDir, path).replaceAll('\\', '/'))
    .sort()
}

describe('linter loader', () => {
  it('loads only the source files selected by tsconfig include/exclude', { timeout: 20_000 }, () => {
    const sourceFiles = getSourceFiles({ cwd: fixtureDir })
    const paths = relativeSourcePaths(sourceFiles.map(file => file.getFilePath()))

    expect(paths.filter(path => path.startsWith('included/'))).toEqual([
      'included/alpha.ts',
      'included/beta.ts',
    ])
    expect(paths).not.toContain('included/generated/ignored.ts')
    expect(paths).not.toContain('outside/excluded.ts')
  })

  it('creates a ts-morph project with the same source files', { timeout: 20_000 }, () => {
    const project = loadProject({ cwd: fixtureDir })
    const paths = relativeSourcePaths(project.getSourceFiles().map(file => file.getFilePath()))

    expect(paths.filter(path => path.startsWith('included/'))).toHaveLength(2)
  })

  it('resolves an explicit tsconfig path from the working directory', () => {
    expect(resolveTsconfigPath({
      cwd: fixtureDir,
      tsconfigFilePath: 'tsconfig.json',
    })).toBe(fileURLToPath(new URL('../fixtures/rules/tsconfig.json', import.meta.url)))
  })
})
