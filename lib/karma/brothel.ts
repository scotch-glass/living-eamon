// ============================================================
// KARMA — Brothel + Venereal-Disease helpers
// KARMA Sprint 3. KARMA_SYSTEM.md §2.13a / GAME_DESIGN.md §12 + §13.
//
// The fertility-temple paradox is canonical: the same building hosts
// the most popular brothel AND the most effective VD cure (the temple
// works because the priestesses know what they're treating). A
// generic temple PRAY can also cure but the chance is much lower and
// scales harder on Spirituality.
// ============================================================

import type { PlayerState } from "../gameState";

/** 7.5% chance per brothel encounter — tunable per playtest. */
const VD_CONTRACT_CHANCE = 0.075;

export function maybeContractVD(p: PlayerState): PlayerState {
  if (p.vdActive) return p;
  if (Math.random() < VD_CONTRACT_CHANCE) return { ...p, vdActive: true };
  return p;
}

/**
 * Fertility-temple cure. Base 70%, +0.3% per Spirituality point
 * (caps at 100% near Spirit 100).
 */
export function maybeFertilityCureVD(p: PlayerState): PlayerState {
  if (!p.vdActive) return p;
  const cureChance = 0.7 + 0.003 * p.picssi.spirituality;
  if (Math.random() < cureChance) return { ...p, vdActive: false };
  return p;
}

/**
 * Generic temple cure. Base 15%, +0.5% per Spirituality point — a
 * Spirit-100 saint reaches 65%; the indifferent get little help.
 */
export function maybeGenericTempleCureVD(p: PlayerState): PlayerState {
  if (!p.vdActive) return p;
  const cureChance = 0.15 + 0.005 * p.picssi.spirituality;
  if (Math.random() < cureChance) return { ...p, vdActive: false };
  return p;
}

/** HEAL spell (Guild Magic) always cures VD on cast. */
export function cureVDOnHeal(p: PlayerState): PlayerState {
  if (!p.vdActive) return p;
  return { ...p, vdActive: false };
}
