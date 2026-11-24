import type { Finding, FindingSeverity } from '../../linter/findings'
import type { ScanReport } from './types'
import { relative } from 'node:path'
import { createColors } from 'picocolors'

type Colors = ReturnType<typeof createColors>

export interface TerminalReportOptions {
  /** Force ANSI colors on or off. Defaults to picocolors detection. */
  color?: boolean
}

function displayPath(root: string, file: string): string {
  const value = relative(root, file).replaceAll('\\', '/')

  return value.length === 0 || value.startsWith('..')
    ? file.replaceAll('\\', '/')
    : value
}

function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}

function plural(count: number, singular: string): string {
  return count === 1
    ? singular
    : `${singular}s`
}

function severityText(severity: FindingSeverity): string {
  return severity.padEnd(7)
}

function summaryLine(findings: readonly Finding[]): string {
  const errors = findings.filter(finding => finding.severity === 'error').length
  const warnings = findings.length - errors

  return `Summary: ${errors} ${plural(errors, 'error')}, ${warnings} ${plural(warnings, 'warning')}`
}

function coverageLine(report: ScanReport): string {
  const total = report.coverage.scored + report.coverage.unscorable

  if (total === 0)
    return 'Coverage: n/a (no message sites)'

  return `Coverage: ${formatPercent(report.coverage.ratio)} (${report.coverage.scored}/${total} structured sites)`
}

function groupByFile(findings: readonly Finding[]): Map<string, Finding[]> {
  const groups = new Map<string, Finding[]>()

  for (const finding of findings) {
    const group = groups.get(finding.file)

    if (group === undefined)
      groups.set(finding.file, [finding])
    else
      group.push(finding)
  }

  return groups
}

function renderFinding(finding: Finding, colors: Colors): string {
  const service = finding.severity === 'error'
    ? colors.red
    : colors.yellow
  const severity = service(severityText(finding.severity))
  const rule = colors.dim(finding.ruleId)

  return `  ${String(finding.line).padStart(4)}:${String(finding.column).padEnd(4)} ${severity} ${rule}  ${finding.message}`
}

function renderFile(
  root: string,
  file: string,
  findings: readonly Finding[],
  colors: Colors,
): string[] {
  return [
    '',
    colors.bold(displayPath(root, file)),
    ...findings.map(finding => renderFinding(finding, colors)),
  ]
}

/**
 * Renders a scan for a developer terminal: findings grouped by file, colored
 * severity labels, a summary, and a structured-error coverage footer.
 */
export function formatTerminal(
  report: ScanReport,
  options: TerminalReportOptions = {},
): string {
  const colors = options.color === undefined
    ? createColors()
    : createColors(options.color)
  const groups = [
    ...groupByFile(report.findings).entries(),
  ]
    .sort(([a], [b]) => a.localeCompare(b))
  const fileCount = groups.length
  const lines = [
    colors.bold(
      `clearerr scan: ${report.findings.length} ${plural(report.findings.length, 'finding')} in ${fileCount} ${plural(fileCount, 'file')}`,
    ),
  ]

  if (groups.length === 0) {
    lines.push('No findings.')
  }

  for (const [file, findings] of groups)
    lines.push(...renderFile(report.root, file, findings, colors))

  lines.push('', coverageLine(report))

  if (report.findings.length > 0)
    lines.push(summaryLine(report.findings))

  return lines.join('\n')
}
