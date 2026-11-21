import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

export default defineConfig({
  entry: ['src/index.ts', 'src/linter/index.ts'],
  dts: true,
  exports: {
    customExports(exports) {
      exports['./linter'] = {
        types: './dist/linter/index.d.mts',
        import: './dist/linter/index.mjs',
      }
      return exports
    },
  },
  publint: true,
  plugins: [
    StaleGuardRecorder(),
  ],
})
