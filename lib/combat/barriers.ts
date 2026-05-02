// ============================================================
// LIVING EAMON — Combat Barrier helpers (Pre-work B)
//
// Field barriers (Wall of Stone, etc.) block actions across an
// inter-slot boundary. This file owns the cross-boundary check
// and the per-round tick. No spell currently emits a barrier;
// Sprint 7b.wall-of-stone is the first spell that will populate
// `session.barriers`.
//
// See `lib/combatTypes.ts:Barrier` for boundary index semantics.
// ============================================================

import type {
  ActiveCombatSession,
  Barrier,
  CombatantPosition,
  CombatantSide,
} from "../combatTypes";

/**
 * Test whether a strike or spell from (attackerSide, attackerPos) toward
 * (defenderSide, defenderPos) crosses any active barrier.
 *
 * Boundary 0 sits between ally slot 1 (hero) and enemy slot 1 (the line
 * between the two sides). Boundary 1 sits between enemy slots 1 and 2;
 * boundary 2 between enemy slots 2 and 3. Boundary 3 is reserved for
 * ally-side symmetry once ally combat lights up.
 *
 * Algorithm: enumerate the boundaries the action's line of effect must
 * cross, then check whether any active barrier sits on one of those.
 */
export function isCrossingBarrier(
  attackerSide: CombatantSide,
  attackerPos: CombatantPosition,
  defenderSide: CombatantSide,
  defenderPos: CombatantPosition,
  barriers: Barrier[]
): boolean {
  if (barriers.length === 0) return false;
  const crossed = boundariesCrossed(
    attackerSide,
    attackerPos,
    defenderSide,
    defenderPos
  );
  if (crossed.length === 0) return false;
  return barriers.some((b) => crossed.includes(b.atBoundary));
}

/**
 * Enumerate the boundary indices a line of effect from attacker to defender
 * must cross. Self-targeted actions cross nothing. Same-side actions cross
 * any boundaries between the two slots on that side.
 */
function boundariesCrossed(
  attackerSide: CombatantSide,
  attackerPos: CombatantPosition,
  defenderSide: CombatantSide,
  defenderPos: CombatantPosition
): Array<0 | 1 | 2 | 3> {
  // Self-target — never crosses anything.
  if (attackerSide === defenderSide && attackerPos === defenderPos) return [];

  // Cross-side: any line of effect must traverse the centerline (boundary 0).
  // If the defender is in enemy slot ≥ 2, the line additionally crosses
  // boundary 1 (and boundary 2 if defender is in slot 3). Same logic mirrors
  // for an ally attacker striking deeper enemy slots.
  if (attackerSide !== defenderSide) {
    const out: Array<0 | 1 | 2 | 3> = [0];
    // Determine the deeper slot on the *enemy* side for the defender's path.
    // If the defender is on the enemy side, walk slots 1 → defenderPos.
    // If the attacker is on the enemy side striking an ally at slot ≥ 2, walk
    // ally slots 1 → defenderPos using boundary 3 as the ally centerline-1.
    if (defenderSide === "enemy") {
      if (defenderPos >= 2) out.push(1);
      if (defenderPos >= 3) out.push(2);
    } else {
      // attacker is enemy, defender is ally at slot >= 2
      if (defenderPos >= 2) out.push(3);
    }
    // Symmetrically: if attacker is at enemy slot ≥ 2, the strike must also
    // emerge through the inner enemy boundaries.
    if (attackerSide === "enemy") {
      if (attackerPos >= 2) out.push(1);
      if (attackerPos >= 3) out.push(2);
    } else {
      if (attackerPos >= 2) out.push(3);
    }
    return Array.from(new Set(out)) as Array<0 | 1 | 2 | 3>;
  }

  // Same-side action between two distinct slots. Use the per-side inner
  // boundary indices: enemy side uses {1, 2}; ally side uses {3}.
  const out: Array<0 | 1 | 2 | 3> = [];
  const lo = Math.min(attackerPos, defenderPos);
  const hi = Math.max(attackerPos, defenderPos);
  if (attackerSide === "enemy") {
    // Boundary 1 sits between enemy slots 1 and 2; boundary 2 between 2 and 3.
    if (lo <= 1 && hi >= 2) out.push(1);
    if (lo <= 2 && hi >= 3) out.push(2);
  } else {
    // Ally side: only boundary 3 is defined for ally-side splits in this
    // pass. A richer model can split ally inner boundaries when ally combat
    // lights up; for now any same-side ally crossing reads boundary 3.
    if (lo !== hi) out.push(3);
  }
  return out;
}

/**
 * Decrement every barrier's duration by 1 and drop expired entries.
 * Returns a new session object (no mutation). Empty barrier array = no-op.
 */
export function tickBarriers(session: ActiveCombatSession): ActiveCombatSession {
  if (session.barriers.length === 0) return session;
  const next = session.barriers
    .map((b) => ({ ...b, durationRemaining: b.durationRemaining - 1 }))
    .filter((b) => b.durationRemaining > 0);
  return { ...session, barriers: next };
}
