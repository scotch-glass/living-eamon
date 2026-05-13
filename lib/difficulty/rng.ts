// ============================================================
// Seeded RNG + dice helpers for the difficulty simulator (CF-1).
//
// mulberry32 — 32-bit period, fast, deterministic. Sufficient for
// Monte Carlo at 10k trials per call.
//
// All simulator code routes randomness through this so tests can
// pin a seed and assert byte-reproducible results.
// ============================================================

export interface Rng {
  /** Uniform [0, 1). */
  next(): number;
  /** Inclusive integer [min, max]. */
  int(min: number, max: number): number;
  /** Roll an NdM dice expression like "2d8+3" → number. */
  rollDice(expr: string): number;
  /** Pick a random element. */
  pick<T>(arr: readonly T[]): T;
}

export function makeRng(seed: number): Rng {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9; // avoid 0-seed collapse

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(min: number, max: number): number {
    if (min > max) [min, max] = [max, min];
    return min + Math.floor(next() * (max - min + 1));
  }

  function rollDice(expr: string): number {
    // Parse "NdM+K" / "NdM-K" / "NdM"
    const m = expr.replace(/\s/g, "").match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!m) {
      throw new Error(`Invalid dice expression: ${expr}`);
    }
    const n = parseInt(m[1], 10);
    const sides = parseInt(m[2], 10);
    const mod = m[3] ? parseInt(m[3], 10) : 0;
    let total = mod;
    for (let i = 0; i < n; i++) {
      total += int(1, sides);
    }
    return total;
  }

  function pick<T>(arr: readonly T[]): T {
    return arr[int(0, arr.length - 1)];
  }

  return { next, int, rollDice, pick };
}

/**
 * Mix several integers into a single 32-bit seed. Useful when the
 * simulator wants a seed derived from (trial_index, module_id_hash).
 */
export function mixSeed(...parts: number[]): number {
  let h = 0x811c9dc5;
  for (const p of parts) {
    h = Math.imul(h ^ p, 0x01000193);
  }
  return h >>> 0;
}

/** Cheap string hash to feed mixSeed. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}
