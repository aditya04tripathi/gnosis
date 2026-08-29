export function isDevUnlimited(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function getEffectiveSearchLimit(baseLimit: number): number {
  return isDevUnlimited() ? Number.POSITIVE_INFINITY : baseLimit;
}
