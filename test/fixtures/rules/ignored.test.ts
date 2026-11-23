/** Proves that rules which skip tests leave test files alone. */
export function bareErrorInTest(): never {
  throw new Error('ignored test file')
}
