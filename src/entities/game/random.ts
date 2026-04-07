export function drawRandom<T>(items: readonly T[], rng = Math.random): { item: T; rest: T[] } {
  if (items.length === 0) {
    throw new Error('drawRandom: empty array')
  }
  const idx = Math.floor(rng() * items.length)
  const item = items[idx]!
  const rest = items.filter((_, i) => i !== idx)
  return { item, rest }
}

