// ============================================================
// LIVING EAMON — Sprint C4 enemy AI policy
//
// Run via:
//   npx tsx __tests__/combat/c4-ai.test.ts
//
// Verifies the C4 decision tree:
//   1. Bleeding + has bandage → use bandage on self.
//   2. HP < healSelfThreshold + heal-spell affordable → cast HEAL self.
//   3. HP < healSelfThreshold + no heal but has healing_potion → use potion.
//   4. HP < healSelfThreshold + nothing usable → falls through to offense.
//   5. Wounded ally + heal-spell affordable → cast HEAL on ally.
//   6. Healthy + offensive spell affordable → cast at lowest-hp opponent.
//   7. Healthy + no offensive spell → strike lowest-hp opponent.
//   8. AI never picks an unaffordable spell.
//   9. pickAction throws on a channeling combatant.
//  10. Aggression=0 always picks weakest target; aggression=10 randomises.
// ============================================================

import {
  fillCombatantDefaults,
  createEmptyBodyArmorMap,
  type ActiveCombatSession,
  type CombatantState,
} from "../../lib/combat/types";
import { pickAction, DEFAULT_BANDIT_POLICY, FORGET_INTERRUPT_CHANCE } from "../../lib/npcAi";
import type { InterruptReason } from "../../lib/combat/types";

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

function makeFighter(
  id: string,
  team: "ally" | "enemy",
  opts: Partial<CombatantState> = {},
): CombatantState {
  return fillCombatantDefaults({
    id,
    name: id,
    side: team,
    team,
    controlledBy: team === "ally" ? "player" : "ai",
    hp: 50, maxHp: 50,
    zones: createEmptyBodyArmorMap(),
    weaponId: "long_sword",
    weaponSkillValue: 50,
    dexterity: 10, strength: 10,
    position: 1,
    mana: 12, maxMana: 12,
    ...opts,
  });
}

function makeSession(combatants: CombatantState[]): ActiveCombatSession {
  const ally = combatants.find(c => c.team === "ally") ?? combatants[0];
  const enemy = combatants.find(c => c.team === "enemy") ?? combatants[1];
  return {
    enemyNpcId: enemy.id, enemyName: enemy.name,
    roundNumber: 0,
    playerCombatant: ally, enemyCombatant: enemy,
    combatLog: [], finished: false, playerWon: null, barriers: [],
    combatants,
    turnOrder: combatants.map(c => c.id),
    currentTurnIdx: 0,
  };
}

console.log("[c4-ai] self-care priorities");

caseName("Bleeding + has bandage → use bandage on self", () => {
  const bandit = makeFighter("rurik", "enemy", {
    activeEffects: [{ type: "bleed", zone: "torso", severity: 1, damagePerTurn: 2, turnsRemaining: 3 }],
    inventory: [{ itemId: "bandage", quantity: 2 }],
  });
  const hero = makeFighter("hero", "ally");
  const action = pickAction(bandit, makeSession([hero, bandit]));
  eq(action.kind, "use", "kind=use");
  eq((action as any).itemId, "bandage", "bandage chosen");
  eq((action as any).targetId, "rurik", "self-target");
});

caseName("Bleeding without bandage → falls through to offense", () => {
  const bandit = makeFighter("rurik", "enemy", {
    activeEffects: [{ type: "bleed", zone: "torso", severity: 1, damagePerTurn: 2, turnsRemaining: 3 }],
    inventory: [],
  });
  const hero = makeFighter("hero", "ally");
  const action = pickAction(bandit, makeSession([hero, bandit]));
  truthy(action.kind === "strike" || action.kind === "cast",
    `expected offense, got ${action.kind}`);
});

caseName("HP at 30% with HEAL in hotbar + mana → cast HEAL on self", () => {
  const bandit = makeFighter("rurik", "enemy", {
    hp: 15, maxHp: 50,
    combatHotbar: ["HEAL", "BLAST"],
    mana: 10,
  });
  const hero = makeFighter("hero", "ally");
  const action = pickAction(bandit, makeSession([hero, bandit]));
  eq(action.kind, "cast", "kind=cast");
  eq((action as any).spellName, "HEAL", "HEAL chosen");
  eq((action as any).targetId, "rurik", "self-target");
});

caseName("HP at 30% with no HEAL but healing_potion → use potion on self", () => {
  const bandit = makeFighter("rurik", "enemy", {
    hp: 15, maxHp: 50,
    combatHotbar: ["BLAST"],
    inventory: [{ itemId: "healing_potion", quantity: 1 }],
  });
  const hero = makeFighter("hero", "ally");
  const action = pickAction(bandit, makeSession([hero, bandit]));
  eq(action.kind, "use", "use");
  eq((action as any).itemId, "healing_potion", "potion");
  eq((action as any).targetId, "rurik", "self-target");
});

caseName("HP at 30% with neither HEAL nor potion → falls through to offense", () => {
  const bandit = makeFighter("rurik", "enemy", {
    hp: 15, maxHp: 50,
    combatHotbar: ["BLAST"],
    inventory: [],
    mana: 0, // can't even afford BLAST
  });
  const hero = makeFighter("hero", "ally");
  const action = pickAction(bandit, makeSession([hero, bandit]));
  eq(action.kind, "strike", "fell through to weapon strike");
});

caseName("HP at 30% with HEAL but insufficient mana → falls to potion if available", () => {
  const bandit = makeFighter("rurik", "enemy", {
    hp: 15, maxHp: 50,
    combatHotbar: ["HEAL", "BLAST"],
    mana: 2, // can't afford HEAL (cost 4)
    inventory: [{ itemId: "healing_potion", quantity: 1 }],
  });
  const hero = makeFighter("hero", "ally");
  const action = pickAction(bandit, makeSession([hero, bandit]));
  eq(action.kind, "use", "fell to potion");
  eq((action as any).itemId, "healing_potion", "potion");
});

console.log("[c4-ai] ally support");

caseName("Wounded ally + HEAL spell → cast HEAL on ally", () => {
  const healer = makeFighter("healer", "enemy", {
    combatHotbar: ["HEAL", "BLAST"],
    mana: 12,
  });
  const woundedAlly = makeFighter("brute", "enemy", { hp: 12, maxHp: 50 });
  const hero = makeFighter("hero", "ally");
  const action = pickAction(healer, makeSession([hero, healer, woundedAlly]));
  eq(action.kind, "cast", "cast");
  eq((action as any).spellName, "HEAL", "HEAL");
  eq((action as any).targetId, "brute", "wounded ally targeted");
});

caseName("Wounded ally + no HEAL spell + healing_potion → pour potion on ally", () => {
  const helper = makeFighter("helper", "enemy", {
    combatHotbar: ["BLAST"],
    inventory: [{ itemId: "healing_potion", quantity: 1 }],
  });
  const woundedAlly = makeFighter("brute", "enemy", { hp: 12, maxHp: 50 });
  const hero = makeFighter("hero", "ally");
  const action = pickAction(helper, makeSession([hero, helper, woundedAlly]));
  eq(action.kind, "use", "use");
  eq((action as any).itemId, "healing_potion", "potion");
  eq((action as any).targetId, "brute", "ally targeted");
});

console.log("[c4-ai] offense");

caseName("Healthy bandit + BLAST affordable → cast BLAST at lowest-HP opponent", () => {
  const witch = makeFighter("sela", "enemy", {
    combatHotbar: ["BLAST"],
    mana: 12,
  });
  const hero = makeFighter("hero", "ally", { hp: 15, maxHp: 50 });
  const ally = makeFighter("vivian", "ally", { hp: 50, maxHp: 50 });
  const action = pickAction(witch, makeSession([hero, ally, witch]), {
    ...DEFAULT_BANDIT_POLICY, aggression: 0, // always picks weakest
  });
  eq(action.kind, "cast", "cast");
  eq((action as any).spellName, "BLAST", "BLAST");
  eq((action as any).targetId, "hero", "weakest opponent (hero) targeted");
});

caseName("Healthy bandit + no offensive spell → strike weakest opponent", () => {
  const brute = makeFighter("korm", "enemy", {
    weaponId: "great_sword",
    combatHotbar: [],
    mana: 0,
  });
  const hero = makeFighter("hero", "ally", { hp: 50 });
  const ally = makeFighter("brand", "ally", { hp: 20, maxHp: 50 });
  const action = pickAction(brute, makeSession([hero, ally, brute]), {
    ...DEFAULT_BANDIT_POLICY, aggression: 0,
  });
  eq(action.kind, "strike", "strike");
  eq((action as any).targetId, "brand", "weakest (brand) targeted");
  eq((action as any).zone, "torso", "default zone is torso");
});

caseName("AI never picks an unaffordable spell — empty mana with offensive hotbar → strike", () => {
  const witch = makeFighter("sela", "enemy", {
    combatHotbar: ["BLAST", "FIREBOLT"],
    mana: 0,
  });
  const hero = makeFighter("hero", "ally");
  const action = pickAction(witch, makeSession([hero, witch]));
  eq(action.kind, "strike", "kind=strike (mana too low for any cast)");
});

console.log("[c4-ai] interruption-aware AI");

caseName("Interrupted caster mostly skips spells but occasionally tries anyway (~10%)", () => {
  // Witch has BLAST + mana to spare and is interrupted (severed_artery).
  // Tactically she should STRIKE most of the time, but ~10% of the time
  // she "forgets" and tries to cast — the expected unforced error.
  const reason: InterruptReason = { kind: "severed_artery" };
  const witch = makeFighter("sela", "enemy", {
    combatHotbar: ["BLAST"],
    mana: 12,
    interruptedSinceLastTurn: reason,
  });
  const hero = makeFighter("hero", "ally");
  const session = makeSession([hero, witch]);
  let castCount = 0;
  let strikeCount = 0;
  const trials = 1000;
  for (let i = 0; i < trials; i++) {
    const a = pickAction(witch, session, { ...DEFAULT_BANDIT_POLICY, aggression: 0 });
    if (a.kind === "cast") castCount++;
    if (a.kind === "strike") strikeCount++;
  }
  // FORGET_INTERRUPT_CHANCE = 0.10. Allow a generous band so the test
  // isn't flaky: 5%–15% of trials should be casts.
  const castRate = castCount / trials;
  truthy(
    castRate >= 0.05 && castRate <= 0.15,
    `interrupted-cast rate should sit ~${FORGET_INTERRUPT_CHANCE * 100}% (got ${(castRate * 100).toFixed(1)}% over ${trials} trials)`,
  );
  truthy(strikeCount + castCount === trials, "every action either struck or cast");
});

caseName("Non-interrupted caster picks cast at the normal (high) rate", () => {
  // Same fighter, same setup, but no interrupt. Without skipCasts the
  // AI defaults to BLAST every time given offensive spell + mana.
  const witch = makeFighter("sela", "enemy", {
    combatHotbar: ["BLAST"],
    mana: 12,
    // interruptedSinceLastTurn defaults to null
  });
  const hero = makeFighter("hero", "ally");
  const session = makeSession([hero, witch]);
  let castCount = 0;
  for (let i = 0; i < 100; i++) {
    const a = pickAction(witch, session, { ...DEFAULT_BANDIT_POLICY, aggression: 0 });
    if (a.kind === "cast") castCount++;
  }
  eq(castCount, 100, "non-interrupted caster always picks BLAST");
});

caseName("Interrupted + bleeding + has bandage → still bandages (non-cast not gated)", () => {
  // Bandage / potion picks are NOT casts, so the interrupt-skip logic
  // shouldn't suppress them. Self-care priority (#1) should still win.
  const reason: InterruptReason = { kind: "critical_hit", zone: "torso" };
  const bandit = makeFighter("rurik", "enemy", {
    activeEffects: [{ type: "bleed", zone: "torso", severity: 1, damagePerTurn: 2, turnsRemaining: 3 }],
    inventory: [{ itemId: "bandage", quantity: 2 }],
    interruptedSinceLastTurn: reason,
  });
  const hero = makeFighter("hero", "ally");
  // Run 50 trials — bandage should always win regardless of the
  // forgetful-roll outcome.
  for (let i = 0; i < 50; i++) {
    const a = pickAction(bandit, makeSession([hero, bandit]));
    eq(a.kind, "use", "always picks bandage when bleeding + has bandage, even interrupted");
  }
});

console.log("[c4-ai] guard rails");

caseName("pickAction throws on a channeling combatant", () => {
  const witch = makeFighter("sela", "enemy", {
    combatHotbar: ["BLAST"],
    channelingState: { spellName: "BLAST", targetId: "hero", turnsRemaining: 1 },
  });
  const hero = makeFighter("hero", "ally");
  let threw = false;
  try {
    pickAction(witch, makeSession([hero, witch]));
  } catch (err) {
    threw = (err as Error).message.includes("channeling");
  }
  truthy(threw, "expected throw on channeling combatant");
});

caseName("Aggression=10 randomises target — over 200 picks, both opponents are chosen", () => {
  const witch = makeFighter("sela", "enemy", {
    combatHotbar: [],
    weaponId: "long_sword",
    mana: 0,
  });
  const heroA = makeFighter("hero_a", "ally", { hp: 50, maxHp: 50 });
  const heroB = makeFighter("hero_b", "ally", { hp: 50, maxHp: 50 });
  const session = makeSession([heroA, heroB, witch]);
  const targets = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const a = pickAction(witch, session, { ...DEFAULT_BANDIT_POLICY, aggression: 10 });
    targets.add((a as any).targetId);
  }
  eq(targets.size, 2, `expected both opponents picked at least once across 200 rolls (got ${targets.size})`);
});

if (failures > 0) {
  console.error(`\n[c4-ai] ${failures} failures`);
  process.exit(1);
} else {
  console.log("\n[c4-ai] ✓ all cases passed");
}
