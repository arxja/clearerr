import type { Finding } from '../../linter/findings'

/** Coverage numbers included in every scan report. */
export interface ScanCoverage {
  scored: number
  unscorable: number
  ratio: number
}

/** Everything a reporter needs to render one scan. */
export interface ScanReport {
  /** Absolute path of the project root. */
  root: string
  findings: readonly Finding[]
  coverage: ScanCoverage
}
