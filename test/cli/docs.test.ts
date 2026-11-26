import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))

describe('project documentation', () => {
  it('covers install, adopt, CI, and before/after in the README', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8')

    for (const heading of [
      '## Install',
      '## Adopt',
      '## CI',
      '## Before / after',
    ])
      expect(readme).toContain(heading)
  })

  it('links every usage guide page from the README and start-here', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8')
    const usageDir = join(root, 'docs', 'usage')
    const startHere = readFileSync(join(usageDir, 'start-here.md'), 'utf8')

    expect(readme).toContain('docs/usage/start-here.md')
    expect(startHere).toContain('# Clearerr usage guide')
    expect(startHere).toContain('## The five-minute path')

    for (const page of [
      'getting-started.md',
      'errors.md',
      'codes.md',
      'configuration.md',
      'scanning.md',
      'ci.md',
      'runtime.md',
      'security.md',
      'for-agents.md',
      'migration.md',
      'api.md',
      'troubleshooting.md',
      'limits.md',
    ]) {
      expect(startHere).toContain(`(${page})`)
      expect(readFileSync(join(usageDir, page), 'utf8').length).toBeGreaterThan(0)
    }
  })

  it('defines the coverage score in docs/rubric.md', () => {
    const rubric = readFileSync(join(root, 'docs', 'rubric.md'), 'utf8')

    expect(rubric).toContain('coverage = scored / (scored + unscorable)')
    expect(rubric).toContain('## Covered (scored) sites')
    expect(rubric).toContain('## Unscorable sites')
  })
})
