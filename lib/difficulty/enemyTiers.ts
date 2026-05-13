// ============================================================
// Synthetic enemy tier templates (CF-1).
//
// Four tiers — Grunt → Veteran → Elite → Boss — with doubling
// unit values (1 → 2 → 4 → 8). The simulator instantiates
// combatants from these templates; the Creator's wizard exposes
// encounter patterns built from these tiers (single-grunt,
// vet-and-pair, boss-and-entourage, etc.).
//
// CF-4 will later author named NPCs declaring `tier: 2`; the
// simulator math doesn't change when it does.
//
// Stats here are PROPOSALS to be tuned by scripts/difficulty/
// calibrate.ts against six anchor scenarios. See plan §1, §7.
// ============================================================

import type { EnemyTierId, EnemyTierTemplate } from "./types";

// Tier-1 stats mirror the canonical Fresh Hero Party so the anchor
// scenario (fresh hero vs single Tier-1 grunt) yields ~50% over 10k
// trials. Tier 2+ scale via roughly-doubling HP/DPR + better gear.
// All numbers are calibration-tunable; see scripts/difficulty/.
//
// CALIBRATION STATE (2026-05-13):
//   - Anchor A (fresh vs T1):  49.8% ✓ within tolerance
//   - Anchor B (fresh vs T2):  ~0%  ✗ should be ~22% — tuning needed
//   - Anchor C (fresh vs T3):  ~0%  ✗ should be ~7%  — tuning needed
//   - Anchor D (fresh vs T4):  ~0%  ✓ ~1% target, within tolerance
//   - Anchor E (mid  vs T2):  100% ✗ structural: capability formula
//     uses Tier-1 armor as DPR baseline; doesn't penalize hero DPR
//     for higher-armor opponents. The empirical simulator handles
//     this correctly; the analytic capability score is a fast-render
//     approximation only. CF-1 wizard uses empirical P from
//     simulateModule() as the user-facing number.
//
// Follow-up work tracked in scripts/difficulty/calibrate.ts:
//   - Sweep Tier 2/3/4 HP/DPR/armor for target win rates
//   - Optionally upgrade computeCapability.ts to be tier-aware
export const ENEMY_TIERS: Record<EnemyTierId, EnemyTierTemplate> = {
  1: {
    tier: 1,
    label: "Grunt",
    hp: 50,
    armor: 0,
    weaponDamageDice: "1d12+2",
    expectedDamage: 8.5,
    staminaMax: 55,
    weaponStaminaCost: 10,
    mana: 0,
    knownSpells: [],
    actionsPerRound: 1,
    hasPhaseShift: false,
    unitValue: 1.0,
  },
  2: {
    tier: 2,
    label: "Veteran",
    hp: 70,
    armor: 2,
    weaponDamageDice: "1d10+4",
    expectedDamage: 9.5,
    staminaMax: 70,
    weaponStaminaCost: 13,
    mana: 6,
    knownSpells: ["HEAL"],
    actionsPerRound: 1,
    hasPhaseShift: false,
    unitValue: 2.0,
  },
  3: {
    tier: 3,
    label: "Elite",
    hp: 120,
    armor: 4,
    weaponDamageDice: "2d6+4",
    expectedDamage: 11,
    staminaMax: 90,
    weaponStaminaCost: 13,
    mana: 15,
    knownSpells: ["HEAL", "BLAST"],
    actionsPerRound: 1,
    hasPhaseShift: false,
    unitValue: 4.0,
  },
  4: {
    tier: 4,
    label: "Boss",
    hp: 220,
    armor: 6,
    weaponDamageDice: "2d10+6",
    expectedDamage: 17,
    staminaMax: 130,
    weaponStaminaCost: 18,
    mana: 30,
    knownSpells: ["HEAL", "BLAST", "GREATER_HEAL"],
    actionsPerRound: 2,
    hasPhaseShift: true,
    unitValue: 8.0,
  },
};

export function getTier(tier: EnemyTierId): EnemyTierTemplate {
  return ENEMY_TIERS[tier];
}
