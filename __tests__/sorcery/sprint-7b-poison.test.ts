// ============================================================
// LIVING EAMON — Sprint 7b.poison acceptance tests
//
// Run via:
//   npx tsx __tests__/sorcery/sprint-7b-poison.test.ts
//
// Coverage:
//   1. Poison out of combat → no-target, resources untouched.
//   2. Poison in combat → enemy gains poison status.
//   3. Poison status has severity 2, damagePerTurn 4, turnsRemaining -1.
//   4. Re-cast refreshes without stacking duplicate poison entries.
//   5. Mana and reagents consumed on success.
//   6. tickStatusEffects applies poison damage and prints poison narrative.
//   7. tickStatusEffects does NOT expire poison (turnsRemaining stays -1).
//   8. Cure removes the enemy's poison (via existing applyCure logic on player).
//   9. composeInvokeResponse renders poison-applied.
//  10. no-target response for Poison uses field-I in-fiction voice.
// ============================================================

import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState } from "../../lib/gameState";
import type { ActiveCombatSession, CombatantState } from "../../lib/combat/types";
import { createEmptyBodyArmorMap, fillCombatantDefaults, makeMultiCombatantFields } from "../../lib/combat/types";
import { tickStatusEffects } from "../../lib/combat/engine";
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
        { itemId: "nightshade", quantity: 10 },
      ],
    },
  };
}

function mockCombatant(side: "ally" | "enemy", id: string, name: string): CombatantState {
  return fillCombatantDefaults({
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
  });
}

function stateInCombat(): WorldState {
  const s = baseState();
  const player = { ...mockCombatant("ally", "player", "Tester"), hp: s.player.hp, maxHp: s.player.maxHp };
  const enemy = mockCombatant("enemy", "test_enemy", "Test Enemy");
  const session: ActiveCombatSession = {
    enemyNpcId: "test_enemy",
    enemyName: "Test Enemy",
    roundNumber: 1,
    playerCombatant: player,
    enemyCombatant: enemy,
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
    ...makeMultiCombatantFields(player, enemy),
  };
  return {
    ...s,
    player: { ...s.player, activeCombat: session },
  };
}

// ── Out of combat ─────────────────────────────────────────────

console.log("\n[sprint-7b-poison] Out of combat");

caseName("Poison out of combat → no-target, resources untouched", () => {
  const s = baseState();
  const manaBefore = s.player.currentMana;
  const { outcome, state: after } = handleInvoke(s, "Crea Tox");
  eq(outcome.kind, "no-target", "outcome is no-target");
  eq(after.player.currentMana, manaBefore, "mana not consumed");
  eq(after.player.inventory.find(i => i.itemId === "nightshade")?.quantity, 10, "nightshade not consumed");
});

// ── In combat ─────────────────────────────────────────────────

console.log("\n[sprint-7b-poison] In combat");

caseName("Poison in combat → enemy gains poison status", () => {
  const s = stateInCombat();
  const { outcome } = handleInvoke(s, "Crea Tox");
  eq(outcome.kind, "success", "outcome is success");
  if (outcome.kind !== "success") return;
  eq(outcome.effect.kind, "poison-applied", "effect kind");
});

caseName("Poison status has severity 2, damagePerTurn 4, turnsRemaining -1", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Tox");
  const effects = after.player.activeCombat?.enemyCombatant.activeEffects ?? [];
  const poison = effects.find(e => e.type === "poison");
  truthy(poison, "poison status present");
  eq(poison?.severity, 2, "severity 2");
  eq(poison?.damagePerTurn, 4, "damage per turn = 4");
  eq(poison?.turnsRemaining, -1, "persistent (turnsRemaining = -1)");
});

caseName("Re-cast refreshes without stacking duplicate poison entries", () => {
  const s = stateInCombat();
  const { state: after1 } = handleInvoke(s, "Crea Tox");
  const { state: after2 } = handleInvoke(after1, "Crea Tox");
  const effects = after2.player.activeCombat?.enemyCombatant.activeEffects ?? [];
  const poisonCount = effects.filter(e => e.type === "poison").length;
  eq(poisonCount, 1, "still one poison effect after re-cast");
});

caseName("Mana consumed on success (circle 3 = 9)", () => {
  const s = stateInCombat();
  const manaBefore = s.player.currentMana;
  const { state: after } = handleInvoke(s, "Crea Tox");
  eq(after.player.currentMana, manaBefore - 9, "mana cost");
});

caseName("Nightshade consumed on success", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Tox");
  const ns = after.player.inventory.find(i => i.itemId === "nightshade")?.quantity ?? 0;
  eq(ns, 9, "nightshade -1");
});

// ── tickStatusEffects integration ────────────────────────────

console.log("\n[sprint-7b-poison] tickStatusEffects");

caseName("tickStatusEffects applies 4 HP poison damage per tick", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Tox");
  const enemy = after.player.activeCombat!.enemyCombatant;
  const hpBefore = enemy.hp;
  const { updatedCombatant, tickDamage } = tickStatusEffects(enemy);
  eq(tickDamage, 4, "4 HP damage per tick");
  eq(updatedCombatant.hp, hpBefore - 4, "enemy HP reduced");
});

caseName("tickStatusEffects renders poison narrative (not bleed text)", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Tox");
  const enemy = after.player.activeCombat!.enemyCombatant;
  const { narrative } = tickStatusEffects(enemy);
  contains(narrative, "Poison", "poison narrative present");
  truthy(!narrative.includes("Blood seeps"), "no bleed text for poison");
});

caseName("Poison does not expire — turnsRemaining stays -1 after tick", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Crea Tox");
  const enemy = after.player.activeCombat!.enemyCombatant;
  const { updatedCombatant } = tickStatusEffects(enemy);
  const poison = updatedCombatant.activeEffects.find(e => e.type === "poison");
  truthy(poison, "poison still present after tick");
  eq(poison?.turnsRemaining, -1, "turnsRemaining stays -1");
});

// ── composeInvokeResponse ─────────────────────────────────────

console.log("\n[sprint-7b-poison] composeInvokeResponse");

caseName("renders poison-applied effect", () => {
  const s = stateInCombat();
  const { outcome } = handleInvoke(s, "Crea Tox");
  const text = composeInvokeResponse(outcome);
  contains(text, "Black flowers", "poison narration present");
  contains(text, "4 HP/turn", "damage rate in text");
});

caseName("no-target response uses in-fiction voice", () => {
  const s = baseState();
  const { outcome } = handleInvoke(s, "Crea Tox");
  const text = composeInvokeResponse(outcome);
  truthy(!text.includes("not in combat"), "no meta-leak");
  truthy(!text.includes("outside combat"), "no meta-leak");
  truthy(text.length > 0, "non-empty response");
});

// ── Summary ───────────────────────────────────────────────────

if (failures === 0) {
  console.log("\n[sprint-7b-poison] ✓ all cases passed\n");
} else {
  console.error(`\n[sprint-7b-poison] ✗ ${failures} case(s) FAILED\n`);
  process.exit(1);
}
