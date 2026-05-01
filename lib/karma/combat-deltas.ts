// ============================================================
// KARMA — Combat-PICSSI delta generator
// KARMA Sprint 5. Combat events emit PICSSI deltas per
// KARMA_SYSTEM.md §4c. The engine builds a CombatDeltaContext
// at fight-end (victory / flee / death) and feeds it through
// `computeCombatDeltas`, which returns one or more KarmaDelta
// objects to apply via `applyKarma`.
//
// Current 1v1 reality (Living Eamon ships 1v1 combat today):
//   - alliesAtStart, alliesFledFirst, alliesAbandoned, defendedAlly
//     all ride at 0/false. The branches that read them are wired
//     so future ally-combat (Sprint 8+) drops in cleanly.
//   - activeIntegrityContract / contractCompleted are wired for
//     the future Quest Engine. v1 leaves them false.
//   - "great odds" thresholds (enemyCount >= 2 / >= 4) are dormant
//     until adventures bring multi-enemy encounters.
// ============================================================

import type { KarmaDelta } from "./types";

/** Inputs the engine knows when a combat ends. Most fields are
 *  optional with sensible defaults so the v1 1v1 site can supply
 *  only what it has. */
export interface CombatDeltaContext {
  victory: boolean;
  enemiesKilled: number;
  /** Count of enemies at fight start. 1v1 = 1; future multi-enemy = N. */
  enemyCount: number;
  fled: boolean;
  /** Did the player stand and lose (no flee, hp hit zero)? */
  playerLost: boolean;

  // ── Enemy-kind flags (from NPC.tags) ──────────────────────
  killedDarkBeing?: boolean;   // dark / undead / daemon / sorceror / serpent
  killedInnocent?: boolean;    // innocent civilian / unarmed
  killedFriendly?: boolean;    // Way ally / hub NPC — catastrophic

  // ── Ally-system fields (Sprint 8+) ───────────────────────
  alliesAtStart?: number;
  alliesFledFirst?: boolean;   // ordered retreat — player flees AFTER all allies
  alliesAbandoned?: number;    // allies still in fight when player flees
  defendedAlly?: boolean;      // killed an enemy that was attacking an ally

  // ── Quest-engine fields (Sprint 8) ───────────────────────
  activeIntegrityContract?: boolean;
  contractCompleted?: boolean;
}

/**
 * Compute the PICSSI deltas a combat outcome implies. Returns an
 * array of KarmaDelta objects so the caller can apply each in
 * sequence (each `applyKarma` call individually clamps + recomputes
 * derived stats — the array form preserves visibility into which
 * effect fired).
 *
 * KARMA_SYSTEM.md §4c rules in priority order:
 *
 *   1. Routine kill: +1 Passion per enemy killed
 *   2. Outnumbered (≥2 enemies): +3 Standing
 *   3. Great odds (≥4 enemies): +5 Standing, +5 Courage
 *   4. Killed dark being: +3 Illumination toward Light
 *   5. Killed innocent: −5 Illumination, −5 Standing
 *   6. Killed friendly: −10 Integrity, −10 Illumination, −10 Standing
 *   7. Defended ally: +1 Courage, +1 Standing
 *   8. Integrity-contract completed: +3 Integrity
 *   9. Solo flee (no allies): −1 Courage, −1 Standing
 *   10. Ally-abandoned flee: −10 Courage, −10 Standing, −5 Integrity (TRIPLE PENALTY)
 *   11. Ordered-retreat flee: −1 Courage only (Standing/Integrity spared)
 *   12. Great-odds flee: −3 Courage, −3 Standing
 *   13. Stand-and-lose: +5 Courage, −3 Standing  (or +10 Courage at great odds)
 */
export function computeCombatDeltas(ctx: CombatDeltaContext): KarmaDelta[] {
  const out: KarmaDelta[] = [];

  // 1. Routine kills — +Passion per kill
  if (ctx.victory && ctx.enemiesKilled > 0) {
    out.push({ passion: ctx.enemiesKilled });

    // 2 + 3. Odds-scaled Standing/Courage
    if (ctx.enemyCount >= 4) {
      out.push({ standing: 5, courage: 5 });
    } else if (ctx.enemyCount >= 2) {
      out.push({ standing: 3 });
    }
  }

  // 4 / 5 / 6. Enemy-kind Illumination shifts
  if (ctx.killedDarkBeing) out.push({ illumination: 3 });
  if (ctx.killedInnocent) out.push({ illumination: -5, standing: -5 });
  if (ctx.killedFriendly) {
    out.push({ integrity: -10, illumination: -10, standing: -10 });
  }

  // 7. Defended ally
  if (ctx.defendedAlly) out.push({ courage: 1, standing: 1 });

  // 8. Integrity-contract completion
  if (ctx.victory && ctx.activeIntegrityContract && ctx.contractCompleted) {
    out.push({ integrity: 3 });
  }

  // 9–12. Flee paths — mutually exclusive ordering
  if (ctx.fled) {
    const abandoned = ctx.alliesAbandoned ?? 0;
    const allFled = ctx.alliesFledFirst === true;
    const alliesAtStart = ctx.alliesAtStart ?? 0;

    if (abandoned > 0) {
      // 10. Triple penalty for ally abandonment
      out.push({ courage: -10, standing: -10, integrity: -5 });
    } else if (alliesAtStart > 0 && allFled) {
      // 11. Ordered retreat — Standing/Integrity spared
      out.push({ courage: -1 });
    } else if (ctx.enemyCount >= 4) {
      // 12. Great-odds flee (no allies, or no allies left to abandon)
      out.push({ courage: -3, standing: -3 });
    } else {
      // 9. Solo / standard flee
      out.push({ courage: -1, standing: -1 });
    }
  }

  // 13. Stand-and-lose — credit Courage even on defeat
  if (ctx.playerLost && !ctx.fled) {
    if (ctx.enemyCount >= 4) {
      out.push({ courage: 10, standing: -3 });
    } else {
      out.push({ courage: 5, standing: -3 });
    }
  }

  return out;
}

/** Sum an array of KarmaDelta into a single delta — convenience for
 *  call-sites that prefer one applyKarma call over N. Useful for
 *  chronicle line generation where one summary line beats N. */
export function sumDeltas(deltas: KarmaDelta[]): KarmaDelta {
  const out: KarmaDelta = {};
  for (const d of deltas) {
    for (const [k, v] of Object.entries(d) as Array<[keyof KarmaDelta, number]>) {
      out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}
