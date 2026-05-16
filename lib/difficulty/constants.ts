// ============================================================
// Difficulty engine constants (CF-1).
//
// Provenance: initial values are PROPOSALS from docs/plans/
// cf-1-module-survivability-and-wizard.md §1, §3, §4, §5.
// scripts/difficulty/calibrate.ts tunes these against anchor
// scenarios A–F and overwrites this file with provenance header.
// ============================================================

import type { AtomSeverity, HeroStats, PartySnapshot } from "./types";

/** Logistic slope. Plan §4. */
export const LOGISTIC_SLOPE_K = 1.5;

/** Henchman capability discounts. Plan §3. */
export const HENCHMAN_DISCOUNTS = [0.6, 0.5] as const;

/**
 * Attrition multiplier growth per consecutive combat room without REST.
 * Plan §2.
 */
export const ATTRITION_STEP_PER_ROOM = 0.15;
export const ATTRITION_MAX_MULTIPLIER = 1.6;

/** Per-encounter PICSSI/courage atom severity weight. Plan §4. */
export const SEVERITY_WEIGHT: Record<AtomSeverity, number> = {
  trivial: 0.5,
  notable: 1.0,
  major: 2.0,
  defining: 4.0,
};

/** Per-atom threshold for d100 + virtue check. Plan §5. */
export const SEVERITY_THRESHOLD: Record<AtomSeverity, number> = {
  trivial: 20,
  notable: 50,
  major: 80,
  defining: 110,
};

/**
 * Default on-failure consequences if an atom doesn't define its own.
 * Plan §6.
 */
export const SEVERITY_DEFAULT_FAILURE: Record<
  AtomSeverity,
  { hpLoss: number; virtueLoss: number }
> = {
  trivial: { hpLoss: 0, virtueLoss: 1 },
  notable: { hpLoss: 2, virtueLoss: 2 },
  major: { hpLoss: 5, virtueLoss: 3 },
  defining: { hpLoss: 10, virtueLoss: 5 },
};

/** Gear-gate difficulty bands. Plan §4. */
export const GEAR_GATE_DIFFICULTY = {
  common: 5,
  uncommon: 10,
  rare: 15,
  legendary: 25,
} as const;

/** Courage reward bases. Plan §8. Rounded to KARMA magnitude bands. */
export const COURAGE_BASE_COMPLETE = 5;
export const COURAGE_BASE_DEATH = 10;
export const COURAGE_BASE_FLEE_PENALTY = 3;

/** Bootstrap CI samples for Monte Carlo. */
export const BOOTSTRAP_SAMPLES = 200;

/** Default trial counts. */
export const DEFAULT_TRIALS = 1000;
export const CALIBRATION_TRIALS = 10000;

// ── Reference parties for wizard preview (Plan §9) ────────────

/**
 * The canonical Fresh Hero Party. PICSSI all 0, base 10/10/10,
 * short_sword, no armor, no inventory. This is the calibration
 * anchor — it must yield P(win) = 50% ± 3% vs a single Tier-1
 * Grunt over 10k trials (Anchor A).
 */
function freshHero(): HeroStats {
  return {
    picssi: {
      passion: 0,
      integrity: 0,
      courage: 0,
      standing: 0,
      spirituality: 0,
      illumination: 0,
    },
    strBase: 10,
    dexBase: 10,
    chaBase: 10,
    weaponId: "short_sword",
    armorTotal: 0,
    hasShield: false,
    knownSpells: [],
    inventoryTags: [],
    inventoryScore: 0,
  };
}

function midHero(): HeroStats {
  return {
    picssi: {
      passion: 30,
      integrity: 30,
      courage: 30,
      standing: 30,
      spirituality: 30,
      illumination: 0,
    },
    strBase: 10,
    dexBase: 10,
    chaBase: 10,
    weaponId: "long_sword",
    armorTotal: 3,
    hasShield: false,
    knownSpells: [],
    inventoryTags: ["torch", "bandage"],
    inventoryScore: 25,
  };
}

function endgameHero(): HeroStats {
  return {
    picssi: {
      passion: 75,
      integrity: 75,
      courage: 75,
      standing: 75,
      spirituality: 75,
      illumination: 50,
    },
    strBase: 10,
    dexBase: 10,
    chaBase: 10,
    weaponId: "long_sword",
    armorTotal: 6,
    hasShield: true,
    knownSpells: ["HEAL"],
    inventoryTags: ["torch", "bandage", "silver-weapon", "holy-symbol", "rope"],
    inventoryScore: 70,
  };
}

export const REFERENCE_PARTIES = {
  fresh: { hero: freshHero(), henchmen: [] } satisfies PartySnapshot,
  mid: { hero: midHero(), henchmen: [midHero()] } satisfies PartySnapshot,
  endgame: {
    hero: endgameHero(),
    henchmen: [midHero(), midHero()],
  } satisfies PartySnapshot,
} as const;

export type ReferencePartyKey = keyof typeof REFERENCE_PARTIES;
