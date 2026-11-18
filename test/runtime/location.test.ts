import { describe, expect, it } from 'vitest'
import { err } from '../../src/runtime/error'
import { captureLocation } from '../../src/runtime/location'

function createRealThrow() {
  return err({ code: 'TEST_REAL_THROW', message: 'real throw' })
}

function unsafeCast<T>(value: unknown): T {
  return value as T
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

  it('returns unknown for a non-string stack', () => {
    expect(captureLocation(unsafeCast<string>({}))).toEqual({ file: 'unknown', line: 0 })
  })

  it('normalizes localhost file URLs with the leading path separator', () => {
    const localhost = captureLocation([
      'Error: test',
      '    at run (file://localhost/work/app.ts:12:4)',
    ].join('\n'))
    const absolute = captureLocation([
      'Error: test',
      '    at run (file:///work/app.ts:12:4)',
    ].join('\n'))

    expect(localhost).toEqual(absolute)
  })

  it('preserves parentheses in path-only frames', () => {
    expect(captureLocation([
      'Error: test',
      '    at C:\\project (copy)\\app.ts:22:5',
    ].join('\n'))).toEqual({
      file: 'C:/project (copy)/app.ts',
      line: 22,
      column: 5,
    })
  })

  it('parses named frames and does not treat function parens as paths', () => {
    expect(captureLocation([
      'Error: test',
      '    at foo(bar) (/work/app (copy).ts:33:6)',
    ].join('\n'))).toEqual({
      file: '/work/app (copy).ts',
      line: 33,
      column: 6,
      function: 'foo(bar)',
    })
  })

  it('skips node_modules only on component boundaries', () => {
    expect(captureLocation([
      'Error: test',
      '    at run (/project/my_node_modules_app/src/app.ts:44:8)',
    ].join('\n'))).toEqual({
      file: '/project/my_node_modules_app/src/app.ts',
      line: 44,
      column: 8,
      function: 'run',
    })

    expect(captureLocation([
      'Error: test',
      '    at run (/project/node_modules/pkg/index.js:44:8)',
    ].join('\n'))).toEqual({ file: 'unknown', line: 0 })
  })

  it('preserves an application dist/index frame with the same basename', () => {
    expect(captureLocation([
      'Error: test',
      '    at ClearerrError (/project/clearerr/dist/index.mjs:10:2)',
      '    at run (/project/app/dist/index.js:55:9)',
    ].join('\n'))).toEqual({
      file: '/project/app/dist/index.js',
      line: 55,
      column: 9,
      function: 'run',
    })
  })

  it('preserves an explicitly supplied location', () => {
    const error = err({
      code: 'TEST_EXPLICIT_LOCATION',
      message: 'explicit',
      location: {
        file: 'src/manual.ts',
        line: 42,
        column: 8,
        function: 'manual',
      },
    })

    expect(error.location).toEqual({
      file: 'src/manual.ts',
      line: 42,
      column: 8,
      function: 'manual',
    })
  })
})
