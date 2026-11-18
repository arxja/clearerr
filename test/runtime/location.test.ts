import { describe, expect, it } from 'vitest'
import { err } from '../../src/runtime/error'
import { captureLocation } from '../../src/runtime/location'

function createRealThrow() {
  return err({ code: 'TEST_REAL_THROW', message: 'real throw' })
}

describe('location capture', () => {
  it('captures the first real throw frame with file and line', () => {
    const error = createRealThrow()

    expect(error.location.file).toContain('location.test.ts')
    expect(error.location.line).toBeGreaterThan(0)
  })

  it('skips node_modules and own-package frames', () => {
    const stack = [
      'Error: test',
      '    at new ClearerrError (E:\\project\\clearerr\\src\\runtime\\error.ts:20:9)',
      '    at err (E:\\project\\clearerr\\src\\runtime\\error.ts:58:10)',
      '    at packageCall (E:\\project\\node_modules\\clearerr\\dist\\index.mjs:10:2)',
      '    at run (E:\\project\\src\\app.ts:31:7)',
    ].join('\n')

    expect(captureLocation(stack)).toEqual({
      file: 'E:/project/src/app.ts',
      line: 31,
      column: 7,
      function: 'run',
    })
  })

  it('preserves an explicitly supplied location', () => {
    const error = err({
      code: 'TEST_EXPLICIT_LOCATION',
      message: 'explicit',
      location: { file: 'src/manual.ts', line: 42, column: 8, function: 'manual' },
    })

    expect(error.location).toEqual({
      file: 'src/manual.ts',
      line: 42,
      column: 8,
      function: 'manual',
    })
  })
})
