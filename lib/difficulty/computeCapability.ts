// ============================================================
// Party capability computation (CF-1).
//
// Computes a 4-axis capability snapshot for a party. The combat
// axis is calibrated so the canonical Fresh Hero Party scores
// exactly 1.0 — the same as a Tier-1 Grunt's combat load.
//
// Plan §3, §4, §5.
// ============================================================

import { HENCHMAN_DISCOUNTS } from "./constants";
import { getTier } from "./enemyTiers";
import type { HeroStats, PartyCapability, PartySnapshot } from "./types";

// ── Effective attributes (mirrors lib/karma/recompute.ts) ─────

function strEff(h: HeroStats): number {
  return h.strBase + Math.min(10, Math.floor(h.picssi.passion / 10));
}

function dexEff(h: HeroStats): number {
  return h.dexBase + Math.min(10, Math.floor(h.picssi.courage / 10));
}

function strMod(strEffective: number): number {
  // mirrors lib/combat/engine.ts calculateStrengthMod
  return 1 + Math.max(-0.2, Math.min(0.3, (strEffective - 10) / 40));
}

function maxHP(h: HeroStats): number {
  return 50 + 2 * h.picssi.integrity;
}

function maxStamina(h: HeroStats): number {
  return 35 + 2 * strEff(h);
}

function weaponDamageAvg(weaponId: string): number {
  switch (weaponId) {
    case "great_sword":
      return 13; // 2d8+4
    case "long_sword":
      return 10.5; // 1d12+4
    case "short_sword":
      return 8.5; // 1d12+2
    case "unarmed":
    default:
      return 2.5; // 1d4
  }
}

function weaponStaminaCost(weaponId: string): number {
  switch (weaponId) {
    case "great_sword":
      return 18;
    case "long_sword":
      return 13;
    case "short_sword":
      return 10;
    case "unarmed":
    default:
      return 6;
  }
}

// ── Hero combat capability (5 multiplicative factors) ─────────

// These mirror lib/difficulty/enemyTiers.ts Tier-1 stats. If the
// calibration script tunes Tier-1, update these in lockstep so the
// dpr_factor remains anchored to "ratio vs Tier-1 grunt's combat output."
const TIER1_GRUNT_EXPECTED_DPR = 8.5;
const TIER1_GRUNT_AVG_ARMOR_REDUCTION = 0;
const FRESH_HERO_SWINGS_BASELINE = 5.5;

function heroCombatCapability(h: HeroStats): number {
  const str = strEff(h);
  const dex = dexEff(h);
  const sMod = strMod(str);

  // hp_factor — survival linear in maxHP
  const hp_factor = maxHP(h) / 50;

  // dpr_factor — ratio of expected DPR vs Tier-1 grunt baseline.
  // We approximate: raw weapon damage × strMod × torso (1.0) × hitRate (95% baseline)
  // minus grunt's armor reduction (~2 per hit).
  const rawDmg = weaponDamageAvg(h.weaponId) * sMod;
  const netDmg = Math.max(1, rawDmg - TIER1_GRUNT_AVG_ARMOR_REDUCTION);
  const dpr_factor = netDmg / TIER1_GRUNT_EXPECTED_DPR;

  // evasion_factor — fresh hero has DEX 10 → ~96% hit-by-grunt rate.
  // Each +DEX point grows evasion by ~0.8. Normalize against fresh-hero ratio.
  // Simplification: linear in DEX delta from 10.
  const evasion_factor = 1 + 0.025 * (dex - 10);

  // stamina_factor — sustainable swings before fatigue tier 1.
  // 5.5 swings = fresh hero baseline.
  const swings = maxStamina(h) / weaponStaminaCost(h.weaponId);
  const stamina_factor = swings / FRESH_HERO_SWINGS_BASELINE;

  // gear_factor — armor + shield.
  const gear_factor = 1 + 0.05 * h.armorTotal + (h.hasShield ? 0.1 : 0);

  // Heal-known bonus — adds to dpr_factor analogue (effective HP recovery).
  // Spirituality already amplifies HEAL via the engine (1 + 0.005 · spirituality);
  // we approximate the in-fight value as a +heal_factor on the multiplicative chain.
  const heal_factor = h.knownSpells.includes("HEAL")
    ? 1 + 0.005 * h.picssi.spirituality + 0.10
    : 1;

  return hp_factor * dpr_factor * evasion_factor * stamina_factor * gear_factor * heal_factor;
}

// ── Moral / gear / exploration capability ─────────────────────

function heroMoralCapability(h: HeroStats): number {
  const lightBoost = Math.max(0, h.picssi.illumination / 4);
  return (
    (h.picssi.integrity + h.picssi.courage) / 2 +
    lightBoost +
    h.picssi.standing / 8
  );
}

function heroGearCapability(h: HeroStats): number {
  return h.inventoryScore;
}

function heroExplorationCapability(h: HeroStats, henchmenCount: number): number {
  const actionBudget = 25;
  return (
    (actionBudget / 25) * 10 +
    h.picssi.passion / 4 +
    henchmenCount * 3
  );
}

// ── Party rollup ──────────────────────────────────────────────

export function computePartyCapability(party: PartySnapshot): PartyCapability {
  const heroCombat = heroCombatCapability(party.hero);
  const heroMoral = heroMoralCapability(party.hero);
  const heroGear = heroGearCapability(party.hero);
  const heroExploration = heroExplorationCapability(party.hero, party.henchmen.length);

  let combat = heroCombat;
  for (let i = 0; i < party.henchmen.length; i++) {
    const disc = HENCHMAN_DISCOUNTS[i] ?? 0.5;
    combat += disc * heroCombatCapability(party.henchmen[i]);
  }

  // Moral / gear / exploration are hero-centred (henchmen contribute only
  // via action economy, which exploration already captures).
  return {
    combat: round2(combat),
    moral: round2(Math.min(100, heroMoral)),
    gear: round2(heroGear),
    exploration: round2(heroExploration),
  };
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

// Export inner helpers for unit tests + the simulator that needs
// the same per-hero numbers without going through the party rollup.
export const __internals__ = {
  heroCombatCapability,
  heroMoralCapability,
  heroGearCapability,
  heroExplorationCapability,
  strEff,
  dexEff,
  strMod,
  maxHP,
  maxStamina,
  weaponDamageAvg,
  weaponStaminaCost,
  getTier,
};
