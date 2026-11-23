import type { PrecisionReport } from '../../scripts/precision'
import { beforeAll, describe, expect, it } from 'vitest'
import { measurePrecision } from '../../scripts/precision'

let report: PrecisionReport

beforeAll(() => {
  report = measurePrecision()
}, 30_000)

describe('golden precision set', () => {
  it('labels exactly 30 messages and every site', () => {
    expect(report.labels).toBe(30)
    expect(report.sites).toBe(30)
    expect(report.unlabeled).toEqual([])
    expect(report.missing).toEqual([])
    expect(report.duplicated).toEqual([])
  })

  it('reaches at least 0.90 precision for every rule', () => {
    for (const row of report.rows) {
      expect(row.precision, row.ruleId).toBeGreaterThanOrEqual(0.9)
    }
  })

  it('exercises every rule at least once', () => {
    for (const row of report.rows) {
      expect(row.truePositives, row.ruleId).toBeGreaterThan(0)
    }
  })
})
