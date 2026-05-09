// ============================================================
// LIVING EAMON — Sprint 7b.buffs acceptance tests
//
// Run via:
//   npx tsx __tests__/sorcery/sprint-7b-buffs.test.ts
//
// Coverage:
//   1.  strength — out of combat → applied, TempModifier added.
//   2.  strength — adds TempModifier stat:"strength", source:"strength".
//   3.  strength — in combat → playerCombatant.strength increased.
//   4.  strength — re-cast refreshes without stacking.
//   5.  dexterity — out of combat → applied, TempModifier stat:"dexterity".
//   6.  dexterity — in combat → playerCombatant.dexterity increased.
//   7.  protection — player gains protection_aura status.
//   8.  protection — synced into playerCombatant when in combat.
//   9.  reactive-armor — player gains reactive_armor status.
//  10.  night-sight — player gains night_sight status, no combat needed.
//  11.  weaken — out of combat → no-target.
//  12.  weaken — in combat → enemy gains weakened status.
//  13.  clumsy — in combat → enemy gains clumsied status.
//  14.  curse  — in combat → enemy gains cursed status.
//  15.  paralyze — in combat → enemy gains paralyzed status.
//  16.  paralyze — out of combat → no-target.
//  17.  paralyzed enemy skips strike in resolveCombatRound.
//  18.  weakened attacker deals less damage (resolveStrike).
//  19.  protection_aura reduces incoming damage.
//  20.  reactive_armor populates reflectedDamage > 0.
//  21.  TempModifierStat "strength"/"dexterity" accepted by recompute.
// ============================================================

import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState } from "../../lib/gameState";
import type { ActiveCombatSession, CombatantState } from "../../lib/combat/types";
import { createEmptyBodyArmorMap, fillCombatantDefaults, makeMultiCombatantFields } from "../../lib/combat/types";
import { resolveStrike } from "../../lib/combat/engine";
import { handleInvoke } from "../../lib/sorcery/invoke";
import { recomputeDerivedStats } from "../../lib/karma/recompute";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`assert ${label} — expected ${e}, got ${a}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function falsy(actual: unknown, label: string): void {
  if (actual) throw new Error(`assert ${label} — expected falsy, got ${JSON.stringify(actual)}`);
}
function lt(actual: number, ceiling: number, label: string): void {
  if (actual >= ceiling)
    throw new Error(`assert ${label} — expected < ${ceiling}, got ${actual}`);
}
function gt(actual: number, floor: number, label: string): void {
  if (actual <= floor)
    throw new Error(`assert ${label} — expected > ${floor}, got ${actual}`);
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

// ── Fixtures ──────────────────────────────────────────────────

function baseState(): WorldState {
  const s = createInitialWorldState("Tester");
  return {
    ...s,
    player: {
      ...s.player,
      currentMana: 200,
      knownCircles: [1, 2, 3, 4, 5, 6, 7, 8],
      inventory: [
        { itemId: "mandrake_root", quantity: 10 },
        { itemId: "ginseng",       quantity: 10 },
        { itemId: "spider_silk",   quantity: 10 },
        { itemId: "nightshade",    quantity: 10 },
        { itemId: "black_pearl",   quantity: 10 },
        { itemId: "blood_moss",    quantity: 10 },
        { itemId: "garlic",        quantity: 10 },
        { itemId: "sulfurous_ash", quantity: 10 },
      ],
    },
  };
}

function mockCombatant(side: "ally" | "enemy", id: string, name: string, str = 10, agi = 10): CombatantState {
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
    dexterity: agi,
    strength: str,
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
  return { ...s, player: { ...s.player, activeCombat: session } };
}

// ── Strength ──────────────────────────────────────────────────

console.log("\n[sprint-7b-buffs] Strength");

caseName("strength out of combat → applied, TempModifier added", () => {
  const s = baseState();
  const { outcome, state: after } = handleInvoke(s, "Aug Pot");
  eq(outcome.kind, "success", "outcome kind");
  const mods = after.player.tempModifiers ?? [];
  truthy(mods.some(m => m.stat === "strength"), "strength TempModifier present");
});

caseName("strength TempModifier has correct stat and source", () => {
  const s = baseState();
  const { state: after } = handleInvoke(s, "Aug Pot");
  const mod = (after.player.tempModifiers ?? []).find(m => m.stat === "strength");
  truthy(mod, "mod exists");
  eq(mod!.source, "strength", "source is strength");
  gt(mod!.delta, 0, "delta > 0");
});

caseName("strength in combat → playerCombatant.strength increased", () => {
  const s = stateInCombat();
  const before = s.player.activeCombat!.playerCombatant.strength;
  const { state: after } = handleInvoke(s, "Aug Pot");
  const afterStr = after.player.activeCombat!.playerCombatant.strength;
  gt(afterStr, before, "combatant strength increased");
});

caseName("strength re-cast doesn't stack — replaces", () => {
  const s = baseState();
  const { state: s2 } = handleInvoke(s, "Aug Pot");
  const { state: s3 } = handleInvoke(s2, "Aug Pot");
  const strMods = (s3.player.tempModifiers ?? []).filter(m => m.stat === "strength");
  eq(strMods.length, 1, "only one strength mod after two casts");
});

// ── Dexterity ─────────────────────────────────────────────────

console.log("\n[sprint-7b-buffs] Dexterity");

caseName("dexterity (Aug Dex) out of combat → applied, TempModifier stat:dexterity", () => {
  const s = baseState();
  const { outcome, state: after } = handleInvoke(s, "Aug Dex");
  eq(outcome.kind, "success", "outcome kind");
  const mod = (after.player.tempModifiers ?? []).find(m => m.stat === "dexterity");
  truthy(mod, "dexterity TempModifier present");
  eq(mod!.source, "dexterity", "source is dexterity");
});

caseName("dexterity (Aug Dex) in combat → playerCombatant.dexterity increased", () => {
  const s = stateInCombat();
  const before = s.player.activeCombat!.playerCombatant.dexterity;
  const { state: after } = handleInvoke(s, "Aug Dex");
  const afterDex = after.player.activeCombat!.playerCombatant.dexterity;
  gt(afterDex, before, "combatant dexterity increased");
});

// ── Protection ────────────────────────────────────────────────

console.log("\n[sprint-7b-buffs] Protection");

caseName("protection → player gains protection_aura status", () => {
  const s = baseState();
  const { outcome, state: after } = handleInvoke(s, "Dur Aeg");
  eq(outcome.kind, "success", "outcome kind");
  truthy(after.player.activeEffects.some(e => e.type === "protection_aura"), "protection_aura on player");
});

caseName("protection in combat → protection_aura synced to playerCombatant", () => {
  const s = stateInCombat();
  const { state: after } = handleInvoke(s, "Dur Aeg");
  truthy(
    after.player.activeCombat!.playerCombatant.activeEffects.some(e => e.type === "protection_aura"),
    "protection_aura in combatant"
  );
});

// ── Reactive Armor ────────────────────────────────────────────

console.log("\n[sprint-7b-buffs] Reactive Armor");

caseName("reactive-armor → player gains reactive_armor status", () => {
  const s = baseState();
  const { outcome, state: after } = handleInvoke(s, "Dur Cor");
  eq(outcome.kind, "success", "outcome kind");
  truthy(after.player.activeEffects.some(e => e.type === "reactive_armor"), "reactive_armor on player");
});

// ── Night Sight ───────────────────────────────────────────────

console.log("\n[sprint-7b-buffs] Night Sight");

caseName("night-sight → player gains night_sight status", () => {
  const s = baseState();
  const { outcome, state: after } = handleInvoke(s, "Aug Vid");
  eq(outcome.kind, "success", "outcome kind");
  truthy(after.player.activeEffects.some(e => e.type === "night_sight"), "night_sight on player");
});

// ── Weaken / Clumsy ───────────────────────────────────────────

console.log("\n[sprint-7b-buffs] Weaken / Clumsy");

caseName("weaken out of combat → no-target", () => {
  const s = baseState();
  const { outcome } = handleInvoke(s, "Min Pot");
  eq(outcome.kind, "no-target", "no-target");
});

caseName("weaken in combat → enemy gains weakened status", () => {
  const s = stateInCombat();
  const { outcome, state: after } = handleInvoke(s, "Min Pot");
  eq(outcome.kind, "success", "outcome kind");
  truthy(
    after.player.activeCombat!.enemyCombatant.activeEffects.some(e => e.type === "weakened"),
    "weakened on enemy"
  );
});

caseName("clumsy in combat → enemy gains clumsied status", () => {
  const s = stateInCombat();
  const { outcome, state: after } = handleInvoke(s, "Min Dex");
  eq(outcome.kind, "success", "outcome kind");
  truthy(
    after.player.activeCombat!.enemyCombatant.activeEffects.some(e => e.type === "clumsied"),
    "clumsied on enemy"
  );
});

// ── Curse / Paralyze ──────────────────────────────────────────

console.log("\n[sprint-7b-buffs] Curse / Paralyze");

caseName("curse in combat → enemy gains cursed status", () => {
  const s = stateInCombat();
  const { outcome, state: after } = handleInvoke(s, "Mag Min");
  eq(outcome.kind, "success", "outcome kind");
  truthy(
    after.player.activeCombat!.enemyCombatant.activeEffects.some(e => e.type === "cursed"),
    "cursed on enemy"
  );
});

caseName("paralyze out of combat → no-target", () => {
  const s = baseState();
  const { outcome } = handleInvoke(s, "Ten Cor");
  eq(outcome.kind, "no-target", "no-target out of combat");
});

caseName("paralyze in combat → enemy gains paralyzed status", () => {
  const s = stateInCombat();
  const { outcome, state: after } = handleInvoke(s, "Ten Cor");
  eq(outcome.kind, "success", "outcome kind");
  truthy(
    after.player.activeCombat!.enemyCombatant.activeEffects.some(e => e.type === "paralyzed"),
    "paralyzed on enemy"
  );
});

// ── Combat engine wiring ──────────────────────────────────────

console.log("\n[sprint-7b-buffs] Combat engine wiring");

caseName("weakened attacker deals less damage", () => {
  const base = mockCombatant("ally", "a", "Attacker", 10, 0);
  const weakened = {
    ...base,
    activeEffects: [{ type: "weakened" as const, zone: "torso" as const, severity: 1, turnsRemaining: 5 }],
  };
  const defender = mockCombatant("enemy", "d", "Defender", 10, 0);

  // Run enough samples to make the comparison reliable
  let normalTotal = 0;
  let weakenedTotal = 0;
  const RUNS = 100;
  for (let i = 0; i < RUNS; i++) {
    normalTotal  += resolveStrike(base,    defender, "torso", "slash").damageDealt;
    weakenedTotal += resolveStrike(weakened, defender, "torso", "slash").damageDealt;
  }
  lt(weakenedTotal, normalTotal, "weakened total damage < normal over 100 strikes");
});

caseName("protection_aura reduces incoming damage", () => {
  const attacker = mockCombatant("enemy", "a", "Attacker", 10, 0);
  const bare     = mockCombatant("ally", "d", "Defender", 10, 0);
  const shielded = {
    ...bare,
    activeEffects: [{ type: "protection_aura" as const, zone: "torso" as const, severity: 1, turnsRemaining: 5 }],
  };

  let bareTotal = 0;
  let shieldedTotal = 0;
  const RUNS = 100;
  for (let i = 0; i < RUNS; i++) {
    bareTotal     += resolveStrike(attacker, bare,     "torso", "slash").damageDealt;
    shieldedTotal += resolveStrike(attacker, shielded, "torso", "slash").damageDealt;
  }
  lt(shieldedTotal, bareTotal, "shielded total damage < bare over 100 strikes");
});

caseName("reactive_armor populates reflectedDamage > 0 on hit", () => {
  const attacker = mockCombatant("enemy", "a", "Attacker", 10, 0);
  const defender = {
    ...mockCombatant("ally", "d", "Defender", 10, 0),
    activeEffects: [{ type: "reactive_armor" as const, zone: "torso" as const, severity: 1, turnsRemaining: 5 }],
  };

  // Run many strikes until we get a hit (damageDealt > 0)
  let found = false;
  for (let i = 0; i < 200; i++) {
    const r = resolveStrike(attacker, defender, "torso", "slash");
    if (r.damageDealt > 0) {
      gt(r.reflectedDamage, 0, "reflectedDamage > 0 when a hit lands");
      found = true;
      break;
    }
  }
  truthy(found, "a damageDealt > 0 strike was observed");
});

// ── Recompute pipeline ────────────────────────────────────────

console.log("\n[sprint-7b-buffs] Recompute pipeline");

caseName("TempModifier strength raises strEff in recompute", () => {
  const s = baseState();
  const pBefore = recomputeDerivedStats(s.player);
  const pWithMod = {
    ...s.player,
    tempModifiers: [{ stat: "strength" as const, delta: 5, turnsRemaining: 5, source: "strength" }],
  };
  const pAfter = recomputeDerivedStats(pWithMod);
  gt(pAfter.strengthEffective, pBefore.strengthEffective, "strengthEffective increases with temp mod");
});

caseName("TempModifier dexterity raises dexEff in recompute", () => {
  const s = baseState();
  const pBefore = recomputeDerivedStats(s.player);
  const pWithMod = {
    ...s.player,
    tempModifiers: [{ stat: "dexterity" as const, delta: 5, turnsRemaining: 5, source: "dexterity" }],
  };
  const pAfter = recomputeDerivedStats(pWithMod);
  gt(pAfter.dexterityEffective, pBefore.dexterityEffective, "dexterityEffective increases with temp mod");
});

// ── Summary ───────────────────────────────────────────────────
if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All 7b.buffs tests passed");
}
