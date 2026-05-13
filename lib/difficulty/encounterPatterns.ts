// ============================================================
// Encounter pattern catalogue (CF-1).
//
// Vocabulary the wizard exposes per room. Each pattern is a
// fixed composition of enemy tiers with a synergy multiplier
// (more enemies = more action economy = harder fight).
//
// Synergy multipliers borrowed from Pathfinder 2e encounter math
// (1=×1.0, 2=×1.1, 3=×1.25, 4=×1.5, 5+=×1.7). Plan §1.
//
// Patterns are sorted by load so UI dropdowns present a clean
// progression from easiest to hardest.
// ============================================================

import { getTier } from "./enemyTiers";
import type {
  EncounterPattern,
  EncounterPatternId,
  EnemyTierId,
} from "./types";

const SYNERGY_BY_COUNT: Record<number, number> = {
  0: 1.0,
  1: 1.0,
  2: 1.1,
  3: 1.25,
  4: 1.5,
  5: 1.7,
};

export function synergyForEnemyCount(n: number): number {
  if (n <= 0) return 1.0;
  if (n >= 5) return 1.7;
  return SYNERGY_BY_COUNT[n] ?? 1.7;
}

function buildPattern(
  id: EncounterPatternId,
  composition: Array<{ tier: EnemyTierId; count: number }>,
): EncounterPattern {
  const rawSum = composition.reduce(
    (sum, c) => sum + c.count * getTier(c.tier).unitValue,
    0,
  );
  const totalEnemies = composition.reduce((n, c) => n + c.count, 0);
  const synergyMultiplier = synergyForEnemyCount(totalEnemies);
  return {
    id,
    composition,
    rawSum,
    synergyMultiplier,
    load: Number((rawSum * synergyMultiplier).toFixed(2)),
  };
}

export const ENCOUNTER_PATTERNS: Record<EncounterPatternId, EncounterPattern> = {
  "none": {
    id: "none",
    composition: [],
    rawSum: 0,
    synergyMultiplier: 1.0,
    load: 0,
  },
  "single-grunt": buildPattern("single-grunt", [{ tier: 1, count: 1 }]),
  "pair-grunts": buildPattern("pair-grunts", [{ tier: 1, count: 2 }]),
  "patrol-grunts": buildPattern("patrol-grunts", [{ tier: 1, count: 3 }]),
  "pack-grunts": buildPattern("pack-grunts", [{ tier: 1, count: 4 }]),
  "vet-solo": buildPattern("vet-solo", [{ tier: 2, count: 1 }]),
  "vet-and-grunt": buildPattern("vet-and-grunt", [
    { tier: 2, count: 1 },
    { tier: 1, count: 1 },
  ]),
  "vet-and-pair": buildPattern("vet-and-pair", [
    { tier: 2, count: 1 },
    { tier: 1, count: 2 },
  ]),
  "vet-pair": buildPattern("vet-pair", [{ tier: 2, count: 2 }]),
  "elite-solo": buildPattern("elite-solo", [{ tier: 3, count: 1 }]),
  "elite-and-vet": buildPattern("elite-and-vet", [
    { tier: 3, count: 1 },
    { tier: 2, count: 1 },
  ]),
  "elite-and-grunts": buildPattern("elite-and-grunts", [
    { tier: 3, count: 1 },
    { tier: 1, count: 3 },
  ]),
  "boss-solo": buildPattern("boss-solo", [{ tier: 4, count: 1 }]),
  "boss-and-entourage": buildPattern("boss-and-entourage", [
    { tier: 4, count: 1 },
    { tier: 2, count: 2 },
  ]),
};

export function getPattern(id: EncounterPatternId): EncounterPattern {
  return ENCOUNTER_PATTERNS[id];
}

/** Sorted ascending by load, for UI dropdowns. */
export const PATTERN_OPTIONS_SORTED: EncounterPattern[] = Object.values(
  ENCOUNTER_PATTERNS,
).sort((a, b) => a.load - b.load);
