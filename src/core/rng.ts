/** mulberry32 — deterministic 0..1 float RNG from a 32-bit seed */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: () => number, min: number, maxInclusive: number): number {
  return min + Math.floor(rng() * (maxInclusive - min + 1));
}

export function pickWeighted<T>(rng: () => number, items: T[], weights: number[]): T {
  let sum = 0;
  for (const w of weights) sum += w;
  let r = rng() * sum;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r < 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

export function pickUniform<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function dateSeed(yyyyMmDd: string): number {
  let h = 2166136261;
  for (let i = 0; i < yyyyMmDd.length; i++) {
    h ^= yyyyMmDd.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
