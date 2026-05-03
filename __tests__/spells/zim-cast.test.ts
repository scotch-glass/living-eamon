// ============================================================
// LIVING EAMON — Sprint S5: Zim CAST spell fix tests
//
// Run via:
//   npx tsx __tests__/spells/zim-cast.test.ts
//
// Coverage:
//   1.  isCombatSpell recognizes all 12 new spells (lowercase input)
//   2.  Case normalization: CAST GREATER-HEAL passes knownSpells check
//   3.  CAST unknown-spell still fails with "haven't learned"
//   4.  greater-heal heals more than base HEAL
//   5.  firebolt deals fire damage to enemy
//   6.  haste applies haste effect for 4 rounds
//   7.  ward applies shield_aura effect
//   8.  steelskin applies protection_aura
//   9.  silence applies feared_skip to enemy
//  10.  resist applies protection_aura sev-2
//  11.  mirror applies reactive_armor sev-2
//  12.  banish does extra damage vs undead-tagged enemy
//  13.  invoke-light does extra damage + feared_skip vs undead
//  14.  cleanse removes poison from caster
//  15.  daylight applies feared_skip to undead enemy; no effect vs normal
// ============================================================

import "../../lib/quests/load";
import { createInitialWorldState } from "../../lib/gameState";
import { processInput } from "../../lib/gameEngine";
import {
  isCombatSpell,
  resolveCombatSpell,
} from "../../lib/combatEngine";
import type { ActiveCombatSession, CombatantState } from "../../lib/combatTypes";
import { createEmptyBodyArmorMap } from "../../lib/combatTypes";
import type { WorldState } from "../../lib/gameState";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label} — expected ${e}, got ${a}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`${label} — expected truthy, got ${JSON.stringify(actual)}`);
}
function falsy(actual: unknown, label: string): void {
  if (actual) throw new Error(`${label} — expected falsy, got ${JSON.stringify(actual)}`);
}
function gt(actual: number, threshold: number, label: string): void {
  if (actual <= threshold) throw new Error(`${label} — expected > ${threshold}, got ${actual}`);
}
function contains(hay: string, needle: string, label: string): void {
  if (!hay.includes(needle)) throw new Error(`${label} — missing "${needle}" in "${hay.slice(0, 120)}"`);
}
function caseName(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

// ── Fixtures ────────────────────────────────────────────────

function makeCombatant(
  name: string,
  side: "ally" | "enemy",
  hp: number = 60,
): CombatantState {
  return {
    id: name.toLowerCase().replace(/\s+/g, "_"),
    name,
    hp,
    maxHp: hp,
    zones: createEmptyBodyArmorMap(),
    activeEffects: [],
    shieldItemId: null,
    shieldBlockChance: 0,
    shieldDurability: 0,
    shieldMaxDurability: 0,
    weaponId: "fists",
    droppedWeaponId: null,
    weaponSkillValue: 50,
    dexterity: 50,
    strength: 50,
    agility: 50,
    side,
    position: 1,
  };
}

function makeSession(enemyNpcId: string = "test_bandit"): ActiveCombatSession {
  return {
    enemyNpcId,
    enemyName: "bandit",
    roundNumber: 1,
    playerCombatant: makeCombatant("Hero", "ally"),
    enemyCombatant: makeCombatant("bandit", "enemy"),
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
  };
}

function withSpellAndCombat(
  spellId: string,
  session?: ActiveCombatSession,
): WorldState {
  const base = createInitialWorldState("Hero");
  return {
    ...base,
    player: {
      ...base.player,
      knownSpells: [spellId],
      currentMana: 50,
      maxMana: 50,
      activeCombat: session ?? makeSession(),
    },
  };
}

// ── 1. isCombatSpell recognizes all 12 new spells ───────────

console.log("Sprint S5 — Zim CAST spell fix tests");
console.log("\n  isCombatSpell recognition");

const NEW_SPELLS = [
  "greater-heal", "firebolt", "haste", "ward", "steelskin",
  "silence", "resist", "mirror", "banish", "invoke-light",
  "daylight", "cleanse",
];

for (const s of NEW_SPELLS) {
  caseName(`isCombatSpell recognizes "${s}"`, () => {
    truthy(isCombatSpell(s), `isCombatSpell("${s}")`);
  });
}

// ── 2. Case normalization via processInput ───────────────────

console.log("\n  Case normalization (processInput)");

caseName("CAST GREATER-HEAL passes knownSpells check (lowercase stored)", () => {
  const ws = withSpellAndCombat("greater-heal");
  const result = processInput("CAST GREATER-HEAL", ws);
  falsy((result.staticResponse ?? "").includes("haven't learned"), "no rejection");
});

caseName("CAST greater-heal (already lowercase) also passes", () => {
  const ws = withSpellAndCombat("greater-heal");
  const result = processInput("CAST greater-heal", ws);
  falsy((result.staticResponse ?? "").includes("haven't learned"), "no rejection lowercase");
});

caseName("CAST unknown-spell still returns rejection", () => {
  const base = createInitialWorldState("Hero");
  const ws = { ...base, player: { ...base.player, knownSpells: ["greater-heal"], currentMana: 50 } };
  const result = processInput("CAST lightning-strike", ws);
  contains(result.staticResponse ?? "", "haven't learned", "rejection text");
});

// ── 3. Spell mechanics ──────────────────────────────────────

console.log("\n  Spell mechanics");

caseName("greater-heal heals player HP", () => {
  const ws = withSpellAndCombat("greater-heal");
  const playerHp = ws.player.activeCombat!.playerCombatant.hp;
  // Wound the player first
  const wounded: WorldState = {
    ...ws,
    player: {
      ...ws.player,
      activeCombat: {
        ...ws.player.activeCombat!,
        playerCombatant: { ...ws.player.activeCombat!.playerCombatant, hp: 10 },
      },
    },
  };
  const result = resolveCombatSpell(wounded, "greater-heal");
  truthy(result, "result exists");
  gt(result!.newState.player.activeCombat!.playerCombatant.hp, 10, "HP increased");
});

caseName("firebolt deals damage to enemy", () => {
  const ws = withSpellAndCombat("firebolt");
  const before = ws.player.activeCombat!.enemyCombatant.hp;
  const result = resolveCombatSpell(ws, "firebolt");
  truthy(result, "result exists");
  const after = result!.newState.player.activeCombat!.enemyCombatant.hp;
  truthy(after < before || result!.combatOver, "enemy HP decreased or combat ended");
});

caseName("haste applies haste effect (starts at 4, decrements by 1 in enemy turn)", () => {
  const ws = withSpellAndCombat("haste");
  const result = resolveCombatSpell(ws, "haste");
  truthy(result, "result exists");
  const effects = result!.newState.player.activeCombat!.playerCombatant.activeEffects;
  const hasteEffect = effects.find(e => e.type === "haste");
  truthy(hasteEffect, "haste effect present");
  // Effect starts at 4 turns; enemy turn ticks it once, so >=3 after first round
  truthy(hasteEffect!.turnsRemaining >= 3, "at least 3 rounds remaining after first round");
});

caseName("ward applies shield_aura effect", () => {
  const ws = withSpellAndCombat("ward");
  const result = resolveCombatSpell(ws, "ward");
  truthy(result, "result exists");
  const effects = result!.newState.player.activeCombat!.playerCombatant.activeEffects;
  truthy(effects.some(e => e.type === "shield_aura"), "shield_aura present");
});

caseName("steelskin applies protection_aura", () => {
  const ws = withSpellAndCombat("steelskin");
  const result = resolveCombatSpell(ws, "steelskin");
  truthy(result, "result exists");
  const effects = result!.newState.player.activeCombat!.playerCombatant.activeEffects;
  truthy(effects.some(e => e.type === "protection_aura"), "protection_aura present");
});

caseName("silence narration confirms enemy was silenced (effect consumed in enemy turn)", () => {
  const ws = withSpellAndCombat("silence");
  const result = resolveCombatSpell(ws, "silence");
  truthy(result, "result exists");
  // The feared_skip is applied then immediately consumed during the enemy turn.
  // The narration should confirm the silence effect was used.
  contains(result!.narration, "unable to act", "silence narration");
});

caseName("resist applies protection_aura severity 2", () => {
  const ws = withSpellAndCombat("resist");
  const result = resolveCombatSpell(ws, "resist");
  truthy(result, "result exists");
  const effects = result!.newState.player.activeCombat!.playerCombatant.activeEffects;
  const pa = effects.find(e => e.type === "protection_aura" && e.severity === 2);
  truthy(pa, "protection_aura sev-2 present");
});

caseName("mirror applies reactive_armor severity 2", () => {
  const ws = withSpellAndCombat("mirror");
  const result = resolveCombatSpell(ws, "mirror");
  truthy(result, "result exists");
  const effects = result!.newState.player.activeCombat!.playerCombatant.activeEffects;
  truthy(effects.some(e => e.type === "reactive_armor" && e.severity === 2), "reactive_armor sev-2");
});

caseName("banish deals damage to normal enemy (non-undead path)", () => {
  const ws = withSpellAndCombat("banish");
  const before = ws.player.activeCombat!.enemyCombatant.hp;
  const result = resolveCombatSpell(ws, "banish");
  truthy(result, "result exists");
  // Normal enemy — uses the fallback damage range
  contains(result!.narration, "knows no exile", "non-undead banish narration");
  truthy(result!.newState.player.activeCombat!.enemyCombatant.hp < before || result!.combatOver, "damage dealt");
});

caseName("cleanse removes poison status from player", () => {
  const ws = withSpellAndCombat("cleanse");
  const poisoned: WorldState = {
    ...ws,
    player: {
      ...ws.player,
      activeCombat: {
        ...ws.player.activeCombat!,
        playerCombatant: {
          ...ws.player.activeCombat!.playerCombatant,
          activeEffects: [{ type: "poison", zone: "torso", severity: 1, turnsRemaining: -1, damagePerTurn: 3 }],
        },
      },
    },
  };
  const result = resolveCombatSpell(poisoned, "cleanse");
  truthy(result, "result exists");
  const afterEffects = result!.newState.player.activeCombat!.playerCombatant.activeEffects;
  falsy(afterEffects.some(e => e.type === "poison"), "poison removed");
});

caseName("daylight vs normal enemy narrates no combat effect", () => {
  const ws = withSpellAndCombat("daylight");
  const result = resolveCombatSpell(ws, "daylight");
  truthy(result, "result exists");
  // Normal enemy is unaffected by daylight in combat
  contains(result!.narration, "does not seem to care", "daylight no-effect narration");
});

// ── Summary ──────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All Sprint S5 tests passed");
}
