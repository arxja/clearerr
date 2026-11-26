// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  pnpm: true,
  antislop: true,
  ignores: [
    'docs/*',
    'AGENTS.md',
    '.github/ISSUE_TEMPLATE/*',
    'playground/*',
  ],
})
