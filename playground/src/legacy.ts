// Deliberately old-school code — linter should flag everything here.

export function oldValidate(x: unknown) {
  if (!x) throw new Error("x is required");
  if (typeof x !== "object") throw new Error("x must be object");
  return x;
}

export function oldExit() {
  process.exit(1);
}