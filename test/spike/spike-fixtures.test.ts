import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('spike fixtures', () => {
  it('contains five paired raw and envelope variants', () => {
    const fixtureDir = new URL('./fixtures/', import.meta.url)
    const files = readdirSync(fixtureDir, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
      .map(entry => entry.name)
      .sort()

    const rawFiles = files.filter(name => name.endsWith('.raw.json'))
    const envelopeFiles = files.filter(name => name.endsWith('.envelope.json'))

    expect(rawFiles).toHaveLength(5)
    expect(envelopeFiles).toHaveLength(5)

    const caseNames = new Set(rawFiles.map(name => name.replace(/\.raw\.json$/, '')))
    for (const caseName of caseNames) {
      expect(rawFiles).toContain(`${caseName}.raw.json`)
      expect(envelopeFiles).toContain(`${caseName}.envelope.json`)
    }

    for (const file of envelopeFiles) {
      const parsed = JSON.parse(readFileSync(new URL(file, fixtureDir), 'utf8'))
      expect(parsed).toMatchObject({
        schemaVersion: 1,
        code: expect.any(String),
        message: expect.any(String),
        location: expect.objectContaining({
          file: expect.any(String),
          line: expect.any(Number),
        }),
        context: expect.any(Object),
        severity: expect.any(String),
        timestamp: expect.any(String),
      })
    }
  })
})
