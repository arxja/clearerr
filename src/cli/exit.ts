import type { CoverageReport } from '../linter/coverage'
import type { Finding } from '../linter/findings'

/** The severity threshold that makes `clearerr scan` fail. */
export type FailOn = 'error' | 'warning' | 'none'

export interface ExitOptions {
  findings: readonly Finding[]
  coverage: CoverageReport
  /** Severity threshold. Defaults to `error`. */
  failOn?: FailOn
  /**
   * Minimum structured-error coverage, between 0 and 1. Checked only when
   * provided. A project without any message sites is not failed by coverage.
   */
  coverageThreshold?: number
}

export interface ExitResult {
  code: 0 | 1
  /** Why the run failed, empty when it passed. */
  reasons: string[]
}

/** Resolves the effective threshold from a CLI flag, `--ci`, and config. */
export function resolveFailOn(
  explicit: FailOn | undefined,
  ci: boolean,
  configured: FailOn,
): FailOn {
  if (explicit !== undefined)
    return explicit

  return ci ? configured : 'none'
}

function failsThreshold(finding: Finding, failOn: FailOn): boolean {
  if (failOn === 'none')
    return false

  if (failOn === 'error')
    return finding.severity === 'error'

  return true
}

/**
 * Decides the process exit code for a scan.
 *
 * `failOn` controls which findings block the run. The coverage threshold is
 * independent: it fails a run whose structured-error coverage is below the
 * configured ratio, unless the project has no message sites at all.
 */
export function evaluateExit(options: ExitOptions): ExitResult {
  const failOn = options.failOn ?? 'error'
  const reasons: string[] = []
  const failing = options.findings.filter(finding => failsThreshold(finding, failOn))

  if (failing.length > 0) {
    reasons.push(
      `${failing.length} finding${failing.length === 1
        ? ''
        : 's'} at or above "${failOn}" severity`,
    )
  }

  const threshold = options.coverageThreshold
  const totalSites = options.coverage.scored + options.coverage.unscorable

  if (threshold !== undefined && totalSites > 0 && options.coverage.ratio < threshold) {
    reasons.push(
      `coverage ${(options.coverage.ratio * 100).toFixed(1)}% is below the ${(threshold * 100).toFixed(1)}% threshold`,
    )
  }

  return {
    code: reasons.length === 0
      ? 0
      : 1,
    reasons,
  }
}
