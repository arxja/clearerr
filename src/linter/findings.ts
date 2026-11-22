/** How badly a lint finding affects the scan result. */
export type FindingSeverity = 'error' | 'warning'

/** The source position a finding points at. */
export interface FindingLocation {
  /** Absolute path of the file that contains the finding. */
  file: string
  /** 1-based line number. */
  line: number
  /** 1-based column number. */
  column: number
}

export interface Finding extends FindingLocation {
  /** ID of the rule that produced the finding. */
  ruleId: string
  severity: FindingSeverity
  message: string
}

/**
 * Creates a finding at a message site. Rules pass the site as the location
 * because it already carries the absolute file path and 1-based position.
 */
export function createFinding(
  ruleId: string,
  location: FindingLocation,
  message: string,
  severity: FindingSeverity = 'error',
): Finding {
  return {
    ruleId,
    severity,
    message,
    file: location.file,
    line: location.line,
    column: location.column,
  }
}
