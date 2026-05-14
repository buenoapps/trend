/**
 * Generates a short, collision-resistant id for a `Person`. Not a UUID — the
 * app stores at most a handful of family members on one device, so a
 * timestamp + random suffix is plenty unique and stays human-skimmable.
 */
export function newId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
