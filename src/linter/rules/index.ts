import type { Rule } from '../engine'
import { noBareThrow } from './no-bare-throw'
import { preserveCause } from './preserve-cause'
import { requireCode } from './require-code'
import { requireContext } from './require-context'
import { requireFixHint } from './require-fix-hint'
import { stableCodes } from './stable-codes'

export { noBareThrow } from './no-bare-throw'
export { preserveCause } from './preserve-cause'
export { requireCode } from './require-code'
export { requireContext } from './require-context'
export { requireFixHint } from './require-fix-hint'
export { stableCodes } from './stable-codes'

/** Built-in rules in execution order. */
export const rules: readonly Rule[] = [
  noBareThrow,
  requireCode,
  requireContext,
  preserveCause,
  requireFixHint,
  stableCodes,
]
