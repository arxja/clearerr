import type { Finding, FindingSeverity } from '../../linter/findings'
import type { ScanReport } from './types'

/** One finding in the JSON report. Mirrors the linter finding shape. */
export interface JsonFinding {
  ruleId: string
  severity: FindingSeverity
  message: string
  file: string
  line: number
  column: number
}

export interface JsonReport {
  schemaVersion: 1
  tool: 'clearerr'
  root: string
  findings: JsonFinding[]
  coverage: {
    scored: number
    unscorable: number
    ratio: number
    percent: number
  }
  summary: {
    errors: number
    warnings: number
  }
}

function toJsonFinding(finding: Finding): JsonFinding {
  return {
    ruleId: finding.ruleId,
    severity: finding.severity,
    message: finding.message,
    file: finding.file,
    line: finding.line,
    column: finding.column,
  }
}

/** Builds the machine-readable report object for one scan. */
export function createJsonReport(report: ScanReport): JsonReport {
  const errors = report.findings.filter(finding => finding.severity === 'error').length

  return {
    schemaVersion: 1,
    tool: 'clearerr',
    root: report.root,
    findings: report.findings.map(toJsonFinding),
    coverage: {
      scored: report.coverage.scored,
      unscorable: report.coverage.unscorable,
      ratio: report.coverage.ratio,
      percent: report.coverage.ratio * 100,
    },
    summary: {
      errors,
      warnings: report.findings.length - errors,
    },
  }
}

/** Renders a scan as a single-line JSON object suitable for piping. */
export function formatJson(report: ScanReport): string {
  return JSON.stringify(createJsonReport(report))
}
