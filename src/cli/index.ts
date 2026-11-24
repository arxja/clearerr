#!/usr/bin/env node
import process from 'node:process'
import { runMain } from 'citty'
import { describeError } from './errors'
import { mainCommand } from './main'

runMain(mainCommand).catch((error: unknown) => {
  process.stderr.write(`clearerr: ${describeError(error)}\n`)
  process.exitCode = 1
})
