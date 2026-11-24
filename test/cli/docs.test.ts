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

  it('defines the coverage score in docs/rubric.md', () => {
    const rubric = readFileSync(join(root, 'docs', 'rubric.md'), 'utf8')

    expect(rubric).toContain('coverage = scored / (scored + unscorable)')
    expect(rubric).toContain('## Covered (scored) sites')
    expect(rubric).toContain('## Unscorable sites')
  })
})
