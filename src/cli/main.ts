import { defineCommand } from 'citty'
import { codesCommand } from './commands/codes'
import { initCommand } from './commands/init'
import { scanCommand } from './commands/scan'

/** Root command and subcommand table for the `clearerr` binary. */
export const mainCommand = defineCommand({
  meta: {
    name: 'clearerr',
    description: 'Lint structured error sites and manage the clearerr code registry.',
  },
  subCommands: {
    codes: codesCommand,
    init: initCommand,
    scan: scanCommand,
  },
})
