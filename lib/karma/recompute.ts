// ============================================================
// KARMA — DERIVED STAT RECOMPUTE
// Sprint 1 wired stamina; Sprint 2 layers the full PICSSI →
// derived-stat pipeline per KARMA_SYSTEM.md §2 / §4a.
//
//   STR_eff      = STR_base + min(10, floor(passion / 10))
//   DEX_eff      = DEX_base + min(10, floor(courage / 10))
//   CHA_eff      = CHA_base + min(10, floor(standing / 10))
//   maxHP        = 50 + 2·integrity
//   maxMana      = 10 + floor(|illumination|/2) + combatVictories
//   maxStamina   = 35 + 2·STR_eff
//
// Caps raise / lower; current values stay flat (clamp only). NEVER
// mutate p.picssi.* directly — use applyKarma(state, delta) so the
// recompute fires.
// ============================================================

import type { PlayerState } from "../gameState";
import {
  ACTION_BUDGET_DEFAULT,
  STAMINA_BASE,
  STAMINA_PER_STR,
} from "../gameState";
import type { KarmaDelta, PicssiState, PicssiVirtue } from "./types";

export type FatigueTier = 0 | 1 | 2 | 3 | 4;

/** PICSSI virtue domain — Illumination is bipolar; the rest are 0..100. */
export function clampPicssi(virtue: PicssiVirtue, value: number): number {
  if (virtue === "illumination") return Math.max(-100, Math.min(100, value));
  return Math.max(0, Math.min(100, value));
}

/**
 * Apply a karma delta to a PlayerState. Clamps each virtue to its
 * legal range and re-runs recomputeDerivedStats so HP / mana / stamina
 * caps catch up immediately. Pure: returns a new PlayerState.
 *
 * Always go through this helper; never write to p.picssi.* directly.
 */
export function applyKarma(p: PlayerState, delta: KarmaDelta): PlayerState {
  const next: PicssiState = { ...p.picssi };
  let mutated = false;
  for (const [virtue, d] of Object.entries(delta) as Array<[PicssiVirtue, number | undefined]>) {
    if (!d) continue;
    const clamped = clampPicssi(virtue, next[virtue] + d);
    if (clamped === next[virtue]) continue;
    next[virtue] = clamped;
    mutated = true;
  }
  if (!mutated) return p;
  return recomputeDerivedStats({ ...p, picssi: next });
}

/**
 * Recompute every derived stat off STR_base + PICSSI + combatVictories.
 *
 * Semantics: caps raise (or lower); CURRENT values clamp but do NOT
 * auto-fill — gaining +20 maxHp from Integrity does not heal you, you
 * still have to recover. Lower-clamp keeps current ≤ new max.
 *
 * Sprint 1 invariant preserved: stamina is part of the same pipeline,
 * just now reads STR_eff instead of STR_base.
 */
export function recomputeDerivedStats(p: PlayerState): PlayerState {
  const { passion, courage, standing, integrity, illumination } = p.picssi;

  // VD penalty per KARMA_SYSTEM.md §2.13a — −2 STR while infected,
  // floored at 6 so the hero stays playable. STR_eff is the only stat
  // VD touches; mana, courage, and the rest are unaffected.
  const vdPenalty = p.vdActive ? 2 : 0;
  const strEff = Math.max(
    6,
    p.strength + Math.min(10, Math.floor(passion / 10)) - vdPenalty
  );
  const dexEff = p.dexterity + Math.min(10, Math.floor(courage / 10));

  // Temp modifier bonuses (Sprint 7b.B — Bless + future buffs).
  // Sum all active charisma and illumination deltas without touching
  // the underlying ledger.
  const tempChaBonus = (p.tempModifiers ?? []).reduce(
    (s, m) => s + (m.stat === "charisma" ? m.delta : 0), 0
  );
  const tempIllBonus = (p.tempModifiers ?? []).reduce(
    (s, m) => s + (m.stat === "illumination" ? m.delta : 0), 0
  );
  const chaEff = p.charisma + Math.min(10, Math.floor(standing / 10)) + tempChaBonus;

  const newMaxHp = 50 + 2 * integrity;
  // Effective illumination for maxMana includes the temp buff overlay.
  const effIllumination = Math.max(-100, Math.min(100, illumination + tempIllBonus));
  const newMaxMana = 10 + Math.floor(Math.abs(effIllumination) / 2) + (p.combatVictories ?? 0);
  const newMaxStamina = STAMINA_BASE + STAMINA_PER_STR * strEff;

  const clampedHp = Math.min(p.hp, newMaxHp);
  const clampedMana = Math.min(p.currentMana ?? newMaxMana, newMaxMana);
  const clampedStamina = Math.min(p.stamina ?? newMaxStamina, newMaxStamina);

  return {
    ...p,
    strengthEffective: strEff,
    dexterityEffective: dexEff,
    charismaEffective: chaEff,
    maxHp: newMaxHp,
    maxMana: newMaxMana,
    maxStamina: newMaxStamina,
    hp: clampedHp,
    currentMana: clampedMana,
    stamina: clampedStamina,
  };
}

/**
 * Compute the current fatigue tier per the source combat model.
 * Tiers are gated by `fatiguePool` ≤ −maxStamina × {1,2,3,4}.
 *   tier 0 — fresh
 *   tier 1 — winded
 *   tier 2 — tired
 *   tier 3 — flagging
 *   tier 4 — exhausted (cannot act)
 */
export function fatigueLevel(p: PlayerState): FatigueTier {
  const m = p.maxStamina;
  const pool = p.fatiguePool;
  if (pool <= -m * 4) return 4;
  if (pool <= -m * 3) return 3;
  if (pool <= -m * 2) return 2;
  if (pool <= -m * 1) return 1;
  return 0;
}

/** Human label for the fatigue tier — shown in the STATS panel + tooltips. */
export function fatigueTierLabel(tier: FatigueTier): string {
  switch (tier) {
    case 0: return "Fresh";
    case 1: return "Winded";
    case 2: return "Tired";
    case 3: return "Flagging";
    case 4: return "Exhausted";
  }
}

/**
 * Reset the per-adventure activity budget. Sprint 1 always sets the
 * default; Sprint 3 will pick novice/moderate/deadly based on the
 * adventure tier the player is leaving.
 */
export function resetActionBudget(p: PlayerState): PlayerState {
  if (p.actionBudget === ACTION_BUDGET_DEFAULT) return p;
  return { ...p, actionBudget: ACTION_BUDGET_DEFAULT };
}

/**
 * KARMA Sprint 6 — append a karma delta to the player's history log
 * with a source tag. The log is a tail-buffer trimmed to KARMA_LOG_MAX
 * entries on every write. No-op for empty deltas (no zero-net entries
 * pollute the log). Returns a new PlayerState; does NOT mutate.
 *
 * Callers funnel through this AFTER applyKarma — the history records
 * the *intent* (the delta supplied), not the *outcome* (post-clamp).
 * That's deliberate: a virtue at 100 receiving +5 still logs the +5
 * so the deed shows up even though the stat didn't move.
 */
export function logKarmaDelta(
  p: PlayerState,
  delta: KarmaDelta,
  source: string
): PlayerState {
  if (Object.keys(delta).filter(k => delta[k as PicssiVirtue]).length === 0) return p;
  const entry = {
    at: new Date().toISOString(),
    delta: { ...delta } as Record<string, number>,
    source,
  };
  const KARMA_LOG_MAX = 50;
  const next = [...(p.karmaLog ?? []), entry].slice(-KARMA_LOG_MAX);
  return { ...p, karmaLog: next };
}

/**
 * Stamina cost per swing, by weapon id. Interpolated from the source combat model's
 * per-weapon table (see KARMA_SYSTEM.md §2.3). Tunable; values
 * deliberately scale with weapon weight.
 */
export function weaponStaminaCost(weaponId: string): number {
  switch (weaponId) {
    case "great_sword": return 18;
    case "long_sword":  return 13;
    case "short_sword": return 10;
    case "unarmed":     return 6;
    default:            return 10;
  }
}
