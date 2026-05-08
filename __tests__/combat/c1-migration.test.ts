// ============================================================
// LIVING EAMON — Sprint C1 migration / shape tests
//
// Run via:
//   npx tsx __tests__/combat/c1-migration.test.ts
//
// These tests verify:
//   - Pre-C1 session blobs (no `combatants` / `team` / `mana` etc.) are
//     migrated into a fully-typed ActiveCombatSession on read.
//   - Post-C1 sessions pass through migrateActiveCombatSession unchanged.
//   - syncCombatantArray keeps the array mirrored against the legacy
//     playerCombatant / enemyCombatant fields.
//   - buildCombatantFromPlayer populates the new fields from PlayerState.
// ============================================================

import {
  migrateActiveCombatSession,
  syncCombatantArray,
  fillCombatantDefaults,
  makeMultiCombatantFields,
  createEmptyBodyArmorMap,
} from "../../lib/combat/types";
import type { CombatantState, ActiveCombatSession } from "../../lib/combat/types";
import { buildCombatantFromPlayer } from "../../lib/combat/engine";
import { createInitialWorldState } from "../../lib/gameState";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`assert ${label} — expected ${e}, got ${a}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
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

console.log("[c1-migration] migrateActiveCombatSession — pre-C1 blobs");

caseName("null returns null", () => {
  eq(migrateActiveCombatSession(null), null, "null in → null out");
});

caseName("missing combatants returns null (not a session)", () => {
  eq(migrateActiveCombatSession({ foo: "bar" }), null, "non-session in → null out");
});

caseName("pre-C1 session blob fills team / mana / picssi defaults", () => {
  // Simulate a blob persisted before Sprint C1 — only the legacy fields.
  const rawBlob = {
    enemyNpcId: "training_dummy",
    enemyName: "Dufus",
    roundNumber: 1,
    playerCombatant: {
      id: "hero1",
      name: "Tester",
      hp: 50,
      maxHp: 50,
      zones: createEmptyBodyArmorMap(),
      activeEffects: [],
      shieldItemId: null,
      shieldBlockChance: 0,
      shieldDurability: 0,
      shieldMaxDurability: 0,
      weaponId: "long_sword",
      droppedWeaponId: null,
      weaponSkillValue: 50,
      dexterity: 10,
      strength: 12,
      agility: 10,
      side: "ally",
      position: 1,
    },
    enemyCombatant: {
      id: "training_dummy",
      name: "Dufus",
      hp: 150,
      maxHp: 150,
      zones: createEmptyBodyArmorMap(),
      activeEffects: [],
      shieldItemId: null,
      shieldBlockChance: 0,
      shieldDurability: 0,
      shieldMaxDurability: 0,
      weaponId: "unarmed",
      droppedWeaponId: null,
      weaponSkillValue: 0,
      dexterity: 10,
      strength: 12,
      agility: 0,
      side: "enemy",
      position: 1,
    },
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
  };

  const migrated = migrateActiveCombatSession(rawBlob);
  truthy(migrated, "migration succeeded");
  eq(migrated!.combatants.length, 2, "combatants array has both combatants");
  eq(migrated!.combatants[0]!.team, "ally", "player got team=ally");
  eq(migrated!.combatants[0]!.controlledBy, "player", "ally side → controlledBy=player");
  eq(migrated!.combatants[1]!.team, "enemy", "enemy got team=enemy");
  eq(migrated!.combatants[1]!.controlledBy, "ai", "enemy side → controlledBy=ai");
  eq(migrated!.combatants[0]!.mana, 0, "missing mana defaults to 0");
  eq(migrated!.combatants[0]!.knownSpells.length, 0, "missing knownSpells defaults to []");
  eq(migrated!.combatants[0]!.combatHotbar.length, 0, "missing combatHotbar defaults to []");
  eq(migrated!.combatants[0]!.inventory.length, 0, "missing inventory defaults to []");
  eq(migrated!.combatants[0]!.picssi.courage, 0, "missing picssi.courage defaults to 0");
  eq(migrated!.turnOrder.length, 2, "turnOrder synthesized from the pair");
  eq(migrated!.currentTurnIdx, 0, "currentTurnIdx defaults to 0");
});

console.log("[c1-migration] migrateActiveCombatSession — idempotent");

caseName("post-C1 session passes through unchanged", () => {
  const player = fillCombatantDefaults({
    id: "hero1",
    name: "Tester",
    side: "ally",
  });
  const enemy = fillCombatantDefaults({
    id: "bandit",
    name: "Bandit",
    side: "enemy",
  });
  const session: ActiveCombatSession = {
    enemyNpcId: "bandit",
    enemyName: "Bandit",
    roundNumber: 1,
    playerCombatant: player,
    enemyCombatant: enemy,
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
    ...makeMultiCombatantFields(player, enemy),
  };

  const migrated = migrateActiveCombatSession(session);
  truthy(migrated, "migration succeeded");
  eq(migrated!.combatants.length, 2, "combatants count unchanged");
  eq(migrated!.combatants[0]!.id, player.id, "first combatant preserved");
  eq(migrated!.turnOrder.length, 2, "turnOrder preserved");
});

console.log("[c1-migration] syncCombatantArray");

caseName("syncCombatantArray rewrites combatants from legacy fields", () => {
  const player = fillCombatantDefaults({
    id: "hero1",
    name: "Tester",
    side: "ally",
    hp: 30,
  });
  const enemy = fillCombatantDefaults({
    id: "bandit",
    name: "Bandit",
    side: "enemy",
    hp: 80,
  });
  const session: ActiveCombatSession = {
    enemyNpcId: "bandit",
    enemyName: "Bandit",
    roundNumber: 1,
    playerCombatant: player,
    enemyCombatant: enemy,
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
    combatants: [], // intentionally stale
    turnOrder: [],
    currentTurnIdx: 0,
  };

  const synced = syncCombatantArray(session);
  eq(synced.combatants.length, 2, "combatants populated from legacy fields");
  eq(synced.combatants[0]!.id, player.id, "first slot is player");
  eq(synced.combatants[0]!.hp, 30, "player HP preserved");
  eq(synced.combatants[1]!.id, enemy.id, "second slot is enemy");
  eq(synced.combatants[1]!.hp, 80, "enemy HP preserved");
  eq(synced.turnOrder.length, 2, "turnOrder synthesized when empty");
});

console.log("[c1-migration] buildCombatantFromPlayer");

caseName("buildCombatantFromPlayer populates new C1 fields", () => {
  const ws = createInitialWorldState("Tester");
  const combatant = buildCombatantFromPlayer(ws);
  eq(combatant.team, "ally", "team=ally");
  eq(combatant.controlledBy, "player", "controlledBy=player");
  eq(combatant.npcId, null, "npcId=null for hero");
  truthy(typeof combatant.mana === "number", "mana is a number");
  truthy(Array.isArray(combatant.knownSpells), "knownSpells is an array");
  truthy(Array.isArray(combatant.combatHotbar), "combatHotbar is an array");
  truthy(Array.isArray(combatant.inventory), "inventory is an array");
  truthy(typeof combatant.picssi.courage === "number", "picssi.courage is a number");
  truthy(typeof combatant.picssi.spirituality === "number", "picssi.spirituality is a number");
});

if (failures > 0) {
  console.error(`\n[c1-migration] ${failures} failures`);
  process.exit(1);
} else {
  console.log("\n[c1-migration] ✓ all cases passed");
}
