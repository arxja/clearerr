import type { SourceFile } from 'ts-morph'
import { resolve } from 'node:path'
import process from 'node:process'
import { Project } from 'ts-morph'

export interface LoaderOptions {
  /** Path to the tsconfig file. Relative paths resolve from `cwd`. */
  tsconfigFilePath?: string
  /** Working directory used to resolve a relative `tsconfigFilePath`. */
  cwd?: string
}

export function resolveTsconfigPath(options: LoaderOptions = {}): string {
  const cwd = options.cwd ?? process.cwd()
  return resolve(cwd, options.tsconfigFilePath ?? 'tsconfig.json')
}

/**
 * Creates a ts-morph project from a tsconfig file.
 *
 * ts-morph applies the tsconfig `include`/`exclude`/`files` globs when it
 * populates the project, so `getSourceFiles()` only returns files selected by
 * the project configuration.
 */
export function loadProject(options: LoaderOptions = {}): Project {
  return new Project({
    tsConfigFilePath: resolveTsconfigPath(options),
  })
}

export function getSourceFiles(options: LoaderOptions = {}): SourceFile[] {
  return loadProject(options).getSourceFiles()
}
