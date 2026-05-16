// ============================================================
// LIVING EAMON — Combat lane layout (Stage H)
//
// Per-Z-layer independent layout. Each side has THREE FIXED SPACES.
// Each combatant is centered on its assigned space. Combatants of
// different size classes render in their own front-to-back layers
// (smaller class → higher Z, per `lib/art/sizeClasses.ts`).
//
// 100% overlap is allowed across Z-classes — the smaller-sprite-floats-
// in-front rule from Z-layers handles legibility. Within a Z-class,
// combatants share their three spaces (one per space). If two
// combatants of the same class land on the same space (e.g. summons),
// later arrivals get a +0.01 zIndex tiebreak so they render in front.
//
// "Army waiting in line" / 5+ combatants on a side / rank-depth within
// a class is OUT OF SCOPE for this version (Decision: deferred).
// ============================================================

import { SIZE_CLASSES, type SizeClass } from "../art/sizeClasses";
import type { CombatantState } from "./types";

/** Three fixed proportional offsets within the lane band.
 *  Spread history (each step = ~10% more distance from center):
 *    initial:  0.25  / 0.5 / 0.75   (distance from center 0.25)
 *    +10%:     0.225 / 0.5 / 0.775  (distance from center 0.275)
 *    +10%:     0.198 / 0.5 / 0.803  (distance from center 0.3025) ← current
 *  The midpoint stays at 0.5; side spaces move outward symmetrically. */
export const SPACE_OFFSETS = [0.1975, 0.5, 0.8025] as const;

export interface PlacedSlot {
  combatant: CombatantState;
  /** Center-X in pixels relative to the lane's left edge. */
  centerXPx: number;
  /** Per-class Z plus a tiebreak fraction when same-class combatants
   *  land on the same space. */
  zIndex: number;
  /** 0..2 — which of the three fixed spaces this combatant landed on. */
  spaceIdx: number;
}

interface LaneBounds {
  /** Pixel width of the lane region (e.g. ~50% of viewport). */
  widthPx: number;
}

/** Compute placements for one side of the arena.
 *
 *  `combatants` are filtered to one team and may include any size classes.
 *  The function lays each Z-class out independently — one ring of three
 *  spaces per class — and returns flat placements with absolute centerX
 *  coordinates and z-indices.
 */
export function layoutLane(
  combatants: CombatantState[],
  laneBounds: LaneBounds,
  resolveSizeClass: (c: CombatantState) => SizeClass,
): PlacedSlot[] {
  // Drop the dead-sentinel (position -1, set by `promoteSurvivorsAfterDeath`
  // in the engine when a combatant's hp transitions to 0). Layout returns
  // only living combatants in their possibly-promoted positions; the
  // arena renders dying sprites separately at their cached centerX so
  // the fade+shrink animation still plays in-place.
  const living = combatants.filter(c => c.position >= 1);

  // Group by size class.
  const byClass = new Map<SizeClass, CombatantState[]>();
  for (const c of living) {
    const cls = resolveSizeClass(c);
    const arr = byClass.get(cls) ?? [];
    arr.push(c);
    byClass.set(cls, arr);
  }

  const out: PlacedSlot[] = [];
  for (const [cls, list] of byClass) {
    // SPACE INDEX IS DERIVED FROM `position`, NOT from sort order. The
    // FRONT rank (position 1) always lands on space N-1 (rightmost,
    // closest to centerline for ally lane). Position 2 → space N-2,
    // position 3 → space N-3 = 0 (leftmost, back of the lane).
    //
    // CRITICAL (2026-05-08, Scotch): "Characters only advance on death.
    // They never retreat." A naive re-pack from sort-index reassigns
    // surviving combatants to lower spaceIdx values when someone dies,
    // which visually pulls them BACKWARD toward the screen edge — the
    // opposite of what should happen. Anchoring by position keeps every
    // survivor on their original space; the only visual movement is the
    // post-death promote that pulls them FORWARD into a vacated slot.
    //
    // The enemy lane is mirrored at the call site so the same mapping
    // puts the enemy front rank closest to the centerline.

    // Track how many combatants land on each space; later arrivals get
    // a tiebreak +0.01 zIndex so they sit in front.
    const spaceOccupants: number[] = SPACE_OFFSETS.map(() => 0);

    for (const c of list) {
      // position 1 → spaceIdx N-1 (front, near centerline)
      // position N → spaceIdx 0    (back, near screen edge)
      // Out-of-range positions (extra combatants beyond the supported
      // 3) wrap to space 0 — the "deferred" case for 4+ same-class
      // combatants on a side.
      const rawIdx = SPACE_OFFSETS.length - c.position;
      const spaceIdx = rawIdx >= 0 && rawIdx < SPACE_OFFSETS.length ? rawIdx : 0;
      const offset = SPACE_OFFSETS[spaceIdx]!;
      const centerXPx = offset * laneBounds.widthPx;
      const tiebreak = spaceOccupants[spaceIdx]! * 0.01;
      spaceOccupants[spaceIdx]!++;
      const zIndex = SIZE_CLASSES[cls].spriteZ + tiebreak;
      out.push({ combatant: c, centerXPx, zIndex, spaceIdx });
    }
  }

  return out;
}
