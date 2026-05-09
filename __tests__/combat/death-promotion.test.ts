// ============================================================
// LIVING EAMON — Combat Arena v2, Phase 1
//
// Run via:
//   npx tsx __tests__/combat/death-promotion.test.ts
//
// Verifies promoteSurvivorsAfterDeath() — when a combatant's hp
// transitions to <= 0 between two session snapshots, the helper:
//   - stamps the dead with sentinel position -1
//   - re-packs surviving teammates into 1..N (closest-to-front stays
//     closest, gaps contract forward)
//   - leaves the opposing team's positions untouched
//   - handles multi-death in a single transition
// ============================================================

import {
  fillCombatantDefaults,
  createEmptyBodyArmorMap,
  type ActiveCombatSession,
  type CombatantState,
  type CombatantPosition,
} from "../../lib/combat/types";
import { promoteSurvivorsAfterDeath } from "../../lib/combat/engine";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`assert ${label} — expected ${e}, got ${a}`);
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

function makeAlly(id: string, position: CombatantPosition, hp = 50): CombatantState {
  return fillCombatantDefaults({
    id,
    name: id,
    side: "ally",
    team: "ally",
    controlledBy: "ai",
    hp,
    maxHp: 50,
    zones: createEmptyBodyArmorMap(),
    weaponId: "unarmed",
    weaponSkillValue: 50,
    position,
  });
}

function makeEnemy(id: string, position: CombatantPosition, hp = 50): CombatantState {
  return fillCombatantDefaults({
    id,
    name: id,
    side: "enemy",
    team: "enemy",
    controlledBy: "ai",
    hp,
    maxHp: 50,
    zones: createEmptyBodyArmorMap(),
    weaponId: "unarmed",
    weaponSkillValue: 50,
    position,
  });
}

function makeSession(combatants: CombatantState[]): ActiveCombatSession {
  const player = combatants.find(c => c.team === "ally") ?? combatants[0]!;
  const enemy = combatants.find(c => c.team === "enemy") ?? combatants[combatants.length - 1]!;
  return {
    enemyNpcId: enemy.id,
    enemyName: enemy.name,
    roundNumber: 0,
    playerCombatant: player,
    enemyCombatant: enemy,
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
    combatants,
    turnOrder: combatants.map(c => c.id),
    currentTurnIdx: 0,
  };
}

function positionOf(session: ActiveCombatSession, id: string): CombatantPosition {
  return session.combatants.find(c => c.id === id)!.position;
}

console.log("[death-promotion] front-rank death promotes back ranks forward");

caseName("3-ally lane, position-1 dies → 2→1, 3→2, dead = -1", () => {
  const a1 = makeAlly("a1", 1);
  const a2 = makeAlly("a2", 2);
  const a3 = makeAlly("a3", 3);
  const e = makeEnemy("e", 1);
  const prev = makeSession([a1, a2, a3, e]);
  const nextRaw = makeSession([{ ...a1, hp: 0 }, a2, a3, e]);

  const next = promoteSurvivorsAfterDeath(prev, nextRaw);

  eq(positionOf(next, "a1"), -1, "a1 sentinel");
  eq(positionOf(next, "a2"), 1, "a2 promoted to front");
  eq(positionOf(next, "a3"), 2, "a3 promoted to middle");
  eq(positionOf(next, "e"), 1, "enemy untouched");
});

caseName("3-ally lane, position-2 dies → 1 unchanged, 3→2, dead = -1", () => {
  const a1 = makeAlly("a1", 1);
  const a2 = makeAlly("a2", 2);
  const a3 = makeAlly("a3", 3);
  const prev = makeSession([a1, a2, a3, makeEnemy("e", 1)]);
  const nextRaw = makeSession([a1, { ...a2, hp: 0 }, a3, makeEnemy("e", 1)]);

  const next = promoteSurvivorsAfterDeath(prev, nextRaw);

  eq(positionOf(next, "a1"), 1, "a1 stays at front");
  eq(positionOf(next, "a2"), -1, "a2 sentinel");
  eq(positionOf(next, "a3"), 2, "a3 promoted to middle");
});

caseName("3-ally lane, position-3 dies → 1 + 2 unchanged, dead = -1", () => {
  const a1 = makeAlly("a1", 1);
  const a2 = makeAlly("a2", 2);
  const a3 = makeAlly("a3", 3);
  const prev = makeSession([a1, a2, a3, makeEnemy("e", 1)]);
  const nextRaw = makeSession([a1, a2, { ...a3, hp: 0 }, makeEnemy("e", 1)]);

  const next = promoteSurvivorsAfterDeath(prev, nextRaw);

  eq(positionOf(next, "a1"), 1, "a1 unchanged");
  eq(positionOf(next, "a2"), 2, "a2 unchanged");
  eq(positionOf(next, "a3"), -1, "a3 sentinel");
});

caseName("Cross-team isolation: enemy death does NOT promote allies", () => {
  const a1 = makeAlly("a1", 1);
  const a2 = makeAlly("a2", 2);
  const e1 = makeEnemy("e1", 1);
  const e2 = makeEnemy("e2", 2);
  const prev = makeSession([a1, a2, e1, e2]);
  const nextRaw = makeSession([a1, a2, { ...e1, hp: 0 }, e2]);

  const next = promoteSurvivorsAfterDeath(prev, nextRaw);

  eq(positionOf(next, "a1"), 1, "ally a1 untouched");
  eq(positionOf(next, "a2"), 2, "ally a2 untouched");
  eq(positionOf(next, "e1"), -1, "enemy e1 sentinel");
  eq(positionOf(next, "e2"), 1, "enemy e2 promoted");
});

console.log("[death-promotion] multi-death + idempotence");

caseName("Two same-team deaths in one transition stack correctly", () => {
  const a1 = makeAlly("a1", 1);
  const a2 = makeAlly("a2", 2);
  const a3 = makeAlly("a3", 3);
  const prev = makeSession([a1, a2, a3, makeEnemy("e", 1)]);
  const nextRaw = makeSession([
    { ...a1, hp: 0 },
    a2,
    { ...a3, hp: 0 },
    makeEnemy("e", 1),
  ]);

  const next = promoteSurvivorsAfterDeath(prev, nextRaw);

  eq(positionOf(next, "a1"), -1, "a1 sentinel");
  eq(positionOf(next, "a2"), 1, "a2 the lone survivor → front");
  eq(positionOf(next, "a3"), -1, "a3 sentinel");
});

caseName("Idempotent: re-running on a session with already-stamped sentinels is a no-op", () => {
  const a1 = makeAlly("a1", 1);
  const a2 = makeAlly("a2", 2);
  const a3 = makeAlly("a3", 3);
  const prev = makeSession([a1, a2, a3, makeEnemy("e", 1)]);
  const nextRaw = makeSession([{ ...a1, hp: 0 }, a2, a3, makeEnemy("e", 1)]);

  const once = promoteSurvivorsAfterDeath(prev, nextRaw);
  const twice = promoteSurvivorsAfterDeath(once, once);

  eq(positionOf(twice, "a1"), -1, "a1 still sentinel");
  eq(positionOf(twice, "a2"), 1, "a2 still front");
  eq(positionOf(twice, "a3"), 2, "a3 still middle");
});

caseName("No deaths → identity (returns next unchanged)", () => {
  const a1 = makeAlly("a1", 1);
  const a2 = makeAlly("a2", 2);
  const prev = makeSession([a1, a2, makeEnemy("e", 1)]);
  const nextRaw = makeSession([{ ...a1, hp: 30 }, a2, makeEnemy("e", 1)]);

  const next = promoteSurvivorsAfterDeath(prev, nextRaw);

  eq(positionOf(next, "a1"), 1, "a1 untouched");
  eq(positionOf(next, "a2"), 2, "a2 untouched");
  eq(positionOf(next, "e"), 1, "enemy untouched");
});

console.log("[death-promotion] playerCombatant / enemyCombatant references stay synchronized");

caseName("Promoted survivor's reference is updated on playerCombatant", () => {
  const hero = makeAlly("hero", 1);
  const a2 = makeAlly("a2", 2);
  const a3 = makeAlly("a3", 3);
  const e = makeEnemy("e", 1);

  // Set up so the playerCombatant points at a2 (a non-hero ally for the test).
  const prev = makeSession([hero, a2, a3, e]);
  const prevWithA2 = { ...prev, playerCombatant: a2 };
  const nextRaw = { ...prevWithA2, combatants: [{ ...hero, hp: 0 }, a2, a3, e] };

  const next = promoteSurvivorsAfterDeath(prevWithA2, nextRaw);

  eq(next.playerCombatant.position, 1, "playerCombatant ref reflects promoted position");
  eq(next.playerCombatant.id, "a2", "playerCombatant id unchanged");
});

if (failures > 0) {
  console.error(`\n[death-promotion] ${failures} failure(s)`);
  process.exit(1);
} else {
  console.log("\n[death-promotion] all green");
}
