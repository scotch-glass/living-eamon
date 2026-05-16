// ============================================================
// LIVING EAMON — Ally-targeted buff cast (regression for 2026-05-08)
//
// Run via:
//   npx tsx __tests__/combat/ally-buff.test.ts
//
// Bug: HASTE / SPEED / WARD / STEELSKIN / RESIST applied the buff to
// the SOURCE, not the TARGET. Vivian casting HASTE on Gaius landed
// the buff on Vivian. Fix: every self-buff handler now applies to
// `target`, with self-cast collapsing source/target.
// ============================================================

import {
  fillCombatantDefaults,
  createEmptyBodyArmorMap,
  type ActiveCombatSession,
  type CombatantState,
} from "../../lib/combat/types";
import { resolveAction } from "../../lib/combat/engine";

let failures = 0;

function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function falsy(actual: unknown, label: string): void {
  if (actual) throw new Error(`assert ${label} — expected falsy, got ${actual}`);
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

function makeAlly(id: string, hp = 50, mana = 40): CombatantState {
  return fillCombatantDefaults({
    id,
    name: id,
    side: "ally",
    team: "ally",
    controlledBy: "player",
    hp,
    maxHp: 50,
    mana,
    maxMana: 40,
    zones: createEmptyBodyArmorMap(),
    weaponId: "unarmed",
    weaponSkillValue: 50,
    knownSpells: ["HEAL", "SPEED", "HASTE", "WARD", "STEELSKIN", "RESIST"],
    combatHotbar: ["HEAL", "SPEED", "HASTE", "WARD", "STEELSKIN", "RESIST"],
    position: 1,
  });
}

function makeEnemy(id: string): CombatantState {
  return fillCombatantDefaults({
    id,
    name: id,
    side: "enemy",
    team: "enemy",
    controlledBy: "ai",
    hp: 50,
    maxHp: 50,
    zones: createEmptyBodyArmorMap(),
    weaponId: "unarmed",
    weaponSkillValue: 50,
    position: 1,
  });
}

function makeSession(combatants: CombatantState[]): ActiveCombatSession {
  const player = combatants.find((c) => c.team === "ally")!;
  const enemy = combatants.find((c) => c.team === "enemy")!;
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
    turnOrder: [combatants[0]!.id, ...combatants.slice(1).map((c) => c.id)],
    currentTurnIdx: 0,
  };
}

function hasEffect(c: CombatantState | undefined, type: string): boolean {
  return !!c && c.activeEffects.some((e) => e.type === type);
}

console.log("[ally-buff] caster casts HASTE / SPEED / WARD / STEELSKIN / RESIST on an ally");

const BUFFS: { spell: string; effect: string }[] = [
  { spell: "HASTE", effect: "haste_extra_action" },
  { spell: "SPEED", effect: "haste" },
  { spell: "WARD", effect: "ward" },
  { spell: "STEELSKIN", effect: "steelskin" },
  { spell: "RESIST", effect: "resist_elemental" },
];

for (const { spell, effect } of BUFFS) {
  caseName(`${spell} on ally → ally gets ${effect}, caster does NOT`, () => {
    const vivian = makeAlly("vivian");
    const gaius = makeAlly("gaius");
    const enemy = makeEnemy("bandit");
    const session = makeSession([vivian, gaius, enemy]);

    const r = resolveAction(session, {
      kind: "cast",
      sourceId: "vivian",
      targetId: "gaius",
      spellName: spell,
    });

    falsy(r.invalid, `cast ${spell} on ally rejected: ${r.invalid ?? ""}`);

    const newGaius = r.session.combatants.find((c) => c.id === "gaius");
    const newVivian = r.session.combatants.find((c) => c.id === "vivian");
    truthy(hasEffect(newGaius, effect), `Gaius has ${effect}`);
    falsy(hasEffect(newVivian, effect), `Vivian does NOT have ${effect}`);
  });
}

console.log("[ally-buff] caster casts on self → caster gets the buff");

for (const { spell, effect } of BUFFS) {
  caseName(`${spell} on self → caster gets ${effect}`, () => {
    const vivian = makeAlly("vivian");
    const enemy = makeEnemy("bandit");
    const session = makeSession([vivian, enemy]);

    const r = resolveAction(session, {
      kind: "cast",
      sourceId: "vivian",
      targetId: "vivian",
      spellName: spell,
    });

    falsy(r.invalid, `self-cast ${spell} rejected: ${r.invalid ?? ""}`);

    const newVivian = r.session.combatants.find((c) => c.id === "vivian");
    truthy(hasEffect(newVivian, effect), `Vivian has ${effect}`);
  });
}

console.log("[ally-buff] narrative reflects the recipient");

caseName("HASTE on Gaius produces a 'Vivian → Gaius' narrative", () => {
  const vivian = makeAlly("vivian");
  const gaius = makeAlly("gaius");
  const enemy = makeEnemy("bandit");
  const session = makeSession([vivian, gaius, enemy]);

  const r = resolveAction(session, {
    kind: "cast",
    sourceId: "vivian",
    targetId: "gaius",
    spellName: "HASTE",
  });

  // Narrative should mention BOTH names in some order — not a self-cast line.
  truthy(r.narrative.includes("vivian"), "narrative names Vivian");
  truthy(r.narrative.includes("gaius"), "narrative names Gaius");
});

if (failures > 0) {
  console.error(`\n[ally-buff] ${failures} failure(s)`);
  process.exit(1);
} else {
  console.log("\n[ally-buff] all green");
}
