// ============================================================
// LIVING EAMON — Sprint 7b.wall-of-stone acceptance tests
//
// Run via:
//   npx tsx __tests__/sorcery/sprint-7b-wall.test.ts
//
// Coverage:
//   1. Wall of Stone out of combat → dev-not-implemented (room-exit blocking pending).
//   2. Wall of Stone in combat → barrier added at boundary 0.
//   3. Barrier has correct kind, boundary, and durationRemaining.
//   4. Re-cast refreshes duration without stacking duplicate barriers.
//   5. Mana and reagents consumed on success.
//   6. Mana / reagents NOT consumed on no-target (out of combat — passes as dev-not-implemented, resources consumed).
//   7. Wall blocks isCrossingBarrier from ally→enemy.
//   8. tickBarriers decrements the wall's durationRemaining.
//   9. tickBarriers removes expired wall.
//  10. composeInvokeResponse renders wall-erected.
// ============================================================

import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState } from "../../lib/gameState";
import type { ActiveCombatSession, CombatantState } from "../../lib/combatTypes";
import { createEmptyBodyArmorMap } from "../../lib/combatTypes";
import { isCrossingBarrier, tickBarriers } from "../../lib/combat/barriers";
import { handleInvoke, composeInvokeResponse } from "../../lib/sorcery/invoke";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`assert ${label} — expected ${e}, got ${a}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function contains(actual: string, substr: string, label: string): void {
  if (!actual.includes(substr))
    throw new Error(`assert ${label} — expected "${substr}" in "${actual}"`);
}
function caseName(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
  }
}

// ── Fixtures ─────────────────────────────────────────────────

function baseState(): WorldState {
  const s = createInitialWorldState("Tester");
  return {
    ...s,
    player: {
      ...s.player,
      currentMana: 200,
      knownCircles: [1, 2, 3, 4, 5, 6, 7, 8],
      inventory: [
        { itemId: "blood_moss", quantity: 10 },
        { itemId: "garlic",     quantity: 10 },
      ],
    },
  };
}

function mockCombatant(side: "ally" | "enemy", id: string, name: string): CombatantState {
  return {
    id,
    name,
    hp: 100,
    maxHp: 100,
    zones: createEmptyBodyArmorMap(),
    activeEffects: [],
    shieldItemId: null,
    shieldBlockChance: 0,
    shieldDurability: 0,
    shieldMaxDurability: 0,
    weaponId: "fists",
    droppedWeaponId: null,
    weaponSkillValue: 30,
    dexterity: 10,
    strength: 10,
    agility: 10,
    side,
    position: 1,
  };
}

function stateInCombat(): WorldState {
  const s = baseState();
  const session: ActiveCombatSession = {
    enemyNpcId: "test_enemy",
    enemyName: "Test Enemy",
    roundNumber: 1,
    playerCombatant: { ...mockCombatant("ally", "player", "Tester"), hp: s.player.hp, maxHp: s.player.maxHp },
    enemyCombatant: mockCombatant("enemy", "test_enemy", "Test Enemy"),
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
  };
  return {
    ...s,
    player: { ...s.player, activeCombat: session },
  };
}

// ── Wall of Stone — out of combat ─────────────────────────────

console.log("\n[sprint-7b-wall] Out of combat");

caseName("Wall of Stone out of combat → no-target, resources untouched", () => {
  const s = baseState();
  const manaBefore = s.player.currentMana;
  const { outcome, state: after } = handleInvoke(s, "Crea Mur");
  eq(outcome.kind, "no-target", "outcome is no-target");
  eq(after.player.currentMana, manaBefore, "mana not consumed");
});

// ── Wall of Stone — in combat ─────────────────────────────────

console.log("\n[sprint-7b-wall] In combat");

caseName("Wall of Stone in combat → barrier added at boundary 0", () => {
  const s = stateInCombat();
  const { outcome, state: after } = handleInvoke(s, "Crea Mur");
  eq(outcome.kind, "success", "outcome is success");
  if (outcome.kind !== "success") return;
  eq(outcome.effect.kind, "wall-erected", "effect kind");
  const barriers = after.player.activeCombat?.barriers ?? [];
  eq(barriers.length, 1, "one barrier");
  eq(barriers[0].kind, "stone-wall", "barrier kind");
  eq(barriers[0].atBoundary, 0, "barrier boundary");
});

caseName("Wall of Stone → barrier has durationRemaining=10", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Mur");
  const barrier = after.player.activeCombat?.barriers[0];
  eq(barrier?.durationRemaining, 10, "duration");
});

caseName("Re-cast refreshes duration without stacking", () => {
  const s = stateInCombat();
  const { state: after1 } = handleInvoke(s, "Crea Mur");
  // Manually lower the barrier duration to simulate time passing.
  const session1 = after1.player.activeCombat!;
  const degraded: WorldState = {
    ...after1,
    player: {
      ...after1.player,
      activeCombat: {
        ...session1,
        barriers: [{ ...session1.barriers[0], durationRemaining: 3 }],
      },
    },
  };
  const { state: after2 } = handleInvoke(degraded, "Crea Mur");
  const barriers = after2.player.activeCombat?.barriers ?? [];
  eq(barriers.length, 1, "still one barrier after re-cast");
  eq(barriers[0].durationRemaining, 10, "duration refreshed to 10");
});

caseName("Mana consumed on success", () => {
  const s = stateInCombat();
  const manaBefore = s.player.currentMana;
  const { state: after } = handleInvoke(s, "Crea Mur");
  truthy(after.player.currentMana < manaBefore, "mana decreased");
  eq(after.player.currentMana, manaBefore - 9, "correct mana cost (circle 3 = 9)");
});

caseName("Reagents consumed on success (blood_moss + garlic)", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Mur");
  const bm = after.player.inventory.find(i => i.itemId === "blood_moss")?.quantity ?? 0;
  const gar = after.player.inventory.find(i => i.itemId === "garlic")?.quantity ?? 0;
  eq(bm,  9, "blood_moss -1");
  eq(gar, 9, "garlic -1");
});

// ── Barrier blocking via isCrossingBarrier ─────────────────────

console.log("\n[sprint-7b-wall] isCrossingBarrier integration");

caseName("Wall blocks ally→enemy strike across boundary 0", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Mur");
  const barriers = after.player.activeCombat!.barriers;
  const blocked = isCrossingBarrier("ally", 1, "enemy", 1, barriers);
  eq(blocked, true, "ally→enemy blocked");
});

caseName("Wall does not block ally self-targeting", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Mur");
  const barriers = after.player.activeCombat!.barriers;
  const blocked = isCrossingBarrier("ally", 1, "ally", 1, barriers);
  eq(blocked, false, "self-target not blocked");
});

// ── tickBarriers ──────────────────────────────────────────────

console.log("\n[sprint-7b-wall] tickBarriers");

caseName("tickBarriers decrements durationRemaining by 1", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Mur");
  const session = after.player.activeCombat!;
  const ticked = tickBarriers(session);
  eq(ticked.barriers[0].durationRemaining, 9, "decremented to 9");
});

caseName("tickBarriers removes barrier when durationRemaining reaches 0", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Mur");
  const session = after.player.activeCombat!;
  const expiring: ActiveCombatSession = {
    ...session,
    barriers: [{ ...session.barriers[0], durationRemaining: 1 }],
  };
  const ticked = tickBarriers(expiring);
  eq(ticked.barriers.length, 0, "barrier removed on expiry");
});

// ── composeInvokeResponse ─────────────────────────────────────

console.log("\n[sprint-7b-wall] composeInvokeResponse");

caseName("renders wall-erected effect", () => {
  const s = stateInCombat();
  const { outcome } = handleInvoke(s, "Crea Mur");
  const text = composeInvokeResponse(outcome);
  contains(text, "Stone answers", "wall narration present");
  contains(text, "10 turns", "duration in text");
});

// ── Summary ───────────────────────────────────────────────────

if (failures === 0) {
  console.log("\n[sprint-7b-wall] ✓ all cases passed\n");
} else {
  console.error(`\n[sprint-7b-wall] ✗ ${failures} case(s) FAILED\n`);
  process.exit(1);
}
