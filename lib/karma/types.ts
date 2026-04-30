// ============================================================
// KARMA — Shared types
// Sprint 2 — PICSSI virtue stocks + delta shape.
// ============================================================

/**
 * Five PICSSI virtues that run 0..100. Each maps to a physical or
 * mechanical effect per KARMA_SYSTEM.md §2 / GAME_DESIGN.md §11:
 *   passion        → STR_eff bonus
 *   integrity      → maxHP
 *   courage        → DEX_eff bonus
 *   standing       → CHA_eff bonus + loot luck + shop deals
 *   spirituality   → mana regen rate + HEAL spell multiplier
 */
export type PicssiUnipolarVirtue =
  | "passion"
  | "integrity"
  | "courage"
  | "standing"
  | "spirituality";

/** All six PICSSI virtues. Illumination is bipolar (−100..+100). */
export type PicssiVirtue = PicssiUnipolarVirtue | "illumination";

export interface PicssiState {
  passion: number;       // 0..100
  integrity: number;     // 0..100
  courage: number;       // 0..100
  standing: number;      // 0..100
  spirituality: number;  // 0..100
  /**
   * Illumination — Light↔Darkness. Bipolar; saintly AND demonic ends
   * both grow maxMana via |Illumination|/2 (KARMA_SYSTEM.md §2.2),
   * and both attract NPCs at the extremes per §11. Midline is dead.
   */
  illumination: number;  // -100..+100
}

/** A delta to apply to PICSSI virtues. Missing keys = no change. */
export type KarmaDelta = Partial<Record<PicssiVirtue, number>>;

/** Default fresh-hero PICSSI state — all virtues at midline / 0. */
export const PICSSI_ZERO: PicssiState = {
  passion: 0,
  integrity: 0,
  courage: 0,
  standing: 0,
  spirituality: 0,
  illumination: 0,
};
