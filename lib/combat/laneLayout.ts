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
  // Group by size class.
  const byClass = new Map<SizeClass, CombatantState[]>();
  for (const c of combatants) {
    const cls = resolveSizeClass(c);
    const arr = byClass.get(cls) ?? [];
    arr.push(c);
    byClass.set(cls, arr);
  }

  const out: PlacedSlot[] = [];
  for (const [cls, list] of byClass) {
    // Each class gets the SAME three fixed spaces. Sort DESCENDING by
    // `position` so the FRONT rank (position 1, closest to centerline)
    // lands on the RIGHTMOST space of its lane (space 2). The back rank
    // (position 3) lands on space 0 (leftmost). For the ally lane this
    // puts the front rank near the centerline visually; the enemy lane
    // is mirrored at the call site, so the same logic puts the enemy
    // front rank near the centerline too. Both parties face each other.
    const sorted = [...list].sort((a, b) => b.position - a.position);

    // Track how many combatants land on each space; later arrivals get
    // a tiebreak +0.01 zIndex so they sit in front.
    const spaceOccupants: number[] = [0, 0, 0];

    for (let i = 0; i < sorted.length; i++) {
      const c = sorted[i]!;
      // Map first three to spaces by descending position; if more than 3
      // same-class combatants exist (rare), wrap. This is the "deferred"
      // case.
      const spaceIdx = i % 3;
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
