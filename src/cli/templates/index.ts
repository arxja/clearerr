import { DEFAULT_CLEARERR_CONFIG } from '../../shared/config'

/** Starter `.clearerrrc.json` written by `clearerr init`. */
export const CONFIG_TEMPLATE = `${JSON.stringify(
  {
    ...DEFAULT_CLEARERR_CONFIG,
    boundaries: [],
    tsconfig: 'tsconfig.json',
    format: 'terminal',
    failOn: 'error',
  },
  null,
  2,
)}\n`

/** Empty registry written by `clearerr init`. */
export const CODES_TEMPLATE = `${JSON.stringify({}, null, 2)}\n`
