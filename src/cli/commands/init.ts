import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { defineCommand } from 'citty'
import { CODE_REGISTRY_FILENAME } from '../../shared/registry'
import { CONFIG_FILENAME } from '../config'
import { writeCliError } from '../errors'
import { CODES_TEMPLATE, CONFIG_TEMPLATE } from '../templates'

export interface InitCommandOptions {
  cwd?: string
  /** Overwrite files that already exist. */
  force?: boolean
}

export interface InitCommandResult {
  exitCode: 0
  output: string
}

interface ScaffoldFile {
  name: string
  content: string
}

const SCAFFOLD_FILES: readonly ScaffoldFile[] = [
  { name: CONFIG_FILENAME, content: CONFIG_TEMPLATE },
  { name: CODE_REGISTRY_FILENAME, content: CODES_TEMPLATE },
]

function isEexistError(error: unknown): boolean {
  return error instanceof Error && (error as NodeJS.ErrnoException).code === 'EEXIST'
}

/**
 * Writes the starter config and an empty code registry. Existing files are
 * left untouched unless `force` is set, which makes the command idempotent.
 */
export function runInitCommand(options: InitCommandOptions = {}): InitCommandResult {
  const cwd = options.cwd ?? process.cwd()
  const force = options.force ?? false
  const lines: string[] = []

  for (const file of SCAFFOLD_FILES) {
    const path = join(cwd, file.name)
    const existed = existsSync(path)

    const flag = force ? 'w' : 'wx'

    try {
      writeFileSync(
        path,
        file.content,
        { flag },
      )
    }
    catch (error) {
      if (!force && isEexistError(error)) {
        lines.push(`skip ${file.name} (already exists, use --force to overwrite)`)
        continue
      }

      throw error
    }

    lines.push(`${existed ? 'overwrote' : 'created'} ${file.name}`)
  }

  if (lines.every(line => line.startsWith('skip')))
    lines.push('Nothing changed.')

  return {
    exitCode: 0,
    output: lines.join('\n'),
  }
}

export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Create .clearerrrc.json and an empty clearerr.codes.json.',
  },
  args: {
    force: {
      type: 'boolean',
      description: 'Overwrite files that already exist.',
      default: false,
    },
  },
  run({ args }) {
    try {
      const result = runInitCommand({ force: args.force })

      process.stdout.write(`${result.output}\n`)
      process.exitCode = result.exitCode
    }
    catch (error) {
      writeCliError(error)
      process.exitCode = 1
    }
  },
})
