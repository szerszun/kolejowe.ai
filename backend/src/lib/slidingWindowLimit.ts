/**
 * Allows at most `max` hits in any `windowMs` span, counted in this process's memory.
 * Returns a function that records a hit and says whether it was allowed. In memory is
 * enough for one Render instance: a restart forgets the count, but an instance being
 * kept busy by a flood is exactly one that doesn't restart.
 */
export function slidingWindowLimit(max: number, windowMs: number, now: () => number = Date.now) {
  const hits: number[] = []
  return function tryHit(): boolean {
    const t = now()
    while (hits.length && hits[0] <= t - windowMs) hits.shift()
    if (hits.length >= max) return false
    hits.push(t)
    return true
  }
}
