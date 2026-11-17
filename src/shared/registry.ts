export const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/

export function isValidErrorCode(code: string): boolean {
  return typeof code === 'string' && ERROR_CODE_PATTERN.test(code)
}

export function validateErrorCode(code: string): string {
  if (!isValidErrorCode(code)) {
    throw new TypeError(`Invalid Clearerr error code: "${String(code)}". Use ^[A-Z][A-Z0-9_]*$`)
  }

  return code
}
