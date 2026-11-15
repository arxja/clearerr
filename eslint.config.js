// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  pnpm: true,
  antislop: true,
  ignores: ['docs/phases/*', 'docs/PLAN.md', 'AGENTS.md'],
})
