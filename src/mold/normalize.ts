/** Clamp mold input to 0–100. */
export function normalizeMold(value: number): number {
  return Math.max(0, Math.min(100, value));
}
