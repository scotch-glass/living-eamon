// ============================================================
// LIVING EAMON — Sprint 7b.B acceptance tests (Bless)
//
// Run via:
//   npx tsx __tests__/sorcery/sprint-7b-bless.test.ts
//   npm run test:quests
//
// Coverage:
//   1. Bless out of combat — "blessed" status + temp modifiers; reagents consumed.
//   2. Bless in temple (shrine_of_maat) — duration 15 instead of 10; reagents waived.
//   3. Bless in combat — playerCombatant.activeEffects gets "blessed".
//   4. Temp modifiers: illumination +10, charisma +5; both added.
//   5. Re-casting Bless refreshes (replaces, not stacks).
//   6. Tick: temp modifiers decrement; expired entries drop.
//   7. composeInvokeResponse renders "blessed" outcome correctly.
//   8. consecrated/deity fields present on shrine_of_maat room definition.
// ============================================================

import { createInitialWorldState, tickWorldState } from "../../lib/gameState";
import type { WorldState } from "../../lib/gameState";
import type { ActiveCombatSession, CombatantState, BodyZone } from "../../lib/combatTypes";
import { createEmptyBodyArmorMap } from "../../lib/combatTypes";
import { handleInvoke, composeInvokeResponse } from "../../lib/sorcery/invoke";
import { getRoom } from "../../lib/adventures/registry";

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

const BLESS_REAGENTS = [
  { itemId: "garlic",        quantity: 5 },
  { itemId: "mandrake_root", quantity: 5 },
];

interface FixOpts {
  inTemple?: boolean;
  withCombat?: boolean;
}

function fixtureState(opts: FixOpts = {}): WorldState {
  const base = createInitialWorldState("Tester");
  let state: WorldState = {
    ...base,
    player: {
      ...base.player,
      knownCircles: [3],
      currentMana: 50,
      inventory: [...BLESS_REAGENTS],
      currentRoom: opts.inTemple ? "shrine_of_maat" : "main_hall",
    },
  };

  if (opts.withCombat) {
    const comb = makeCombatSession();
    state = { ...state, player: { ...state.player, activeCombat: comb } };
  }

  return state;
}

function makeCombatant(name: string): CombatantState {
  return {
    id: name.toLowerCase(),
    name,
    hp: 50,
    maxHp: 50,
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
    side: "ally",
    position: 1,
  };
}

function makeCombatSession(): ActiveCombatSession {
  return {
    enemyNpcId: "orc",
    enemyName: "orc",
    roundNumber: 1,
    playerCombatant: makeCombatant("Tester"),
    enemyCombatant: { ...makeCombatant("orc"), side: "enemy" },
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
  };
}

// ── 1. Room tags ─────────────────────────────────────────────

console.log("[sprint-7b-bless] Room tags");

caseName("shrine_of_maat is in the room registry", () => {
  const room = getRoom("shrine_of_maat");
  truthy(room, "shrine_of_maat found");
  eq(room!.consecrated, true, "consecrated: true");
  eq(room!.deity, "maat", "deity: maat");
});

caseName("main_hall is not consecrated", () => {
  const room = getRoom("main_hall");
  eq(room!.consecrated, undefined, "main_hall not consecrated");
});

// ── 2. Bless out of combat (normal room) ─────────────────────

console.log("[sprint-7b-bless] Bless — normal room");

caseName("'blessed' status added to player.activeEffects with 10-turn duration", () => {
  const s0 = fixtureState();
  const r  = handleInvoke(s0, "Mag Aug"); // Bless
  eq(r.outcome.kind, "success", "kind");
  const blessed = r.state.player.activeEffects.find(e => e.type === "blessed");
  truthy(blessed, "blessed effect present");
  eq(blessed!.turnsRemaining, 10, "10 turns normal room");
});

caseName("reagents consumed (garlic + mandrake_root) in normal room", () => {
  const s0     = fixtureState();
  const r      = handleInvoke(s0, "Mag Aug");
  const garlic = r.state.player.inventory.find(i => i.itemId === "garlic");
  const mand   = r.state.player.inventory.find(i => i.itemId === "mandrake_root");
  eq(garlic?.quantity,  4, "garlic 5→4");
  eq(mand?.quantity,    4, "mandrake_root 5→4");
});

caseName("mana consumed (9 mana for Circle 3)", () => {
  const s0 = fixtureState();
  const r  = handleInvoke(s0, "Mag Aug");
  eq(r.state.player.currentMana, 41, "50 − 9 = 41");
});

caseName("no Illumination drain at Circle 3", () => {
  const s0 = fixtureState();
  const r  = handleInvoke(s0, "Mag Aug");
  eq(r.state.player.picssi.illumination, 0, "Illumination unchanged");
});

// ── 3. Temp modifiers ────────────────────────────────────────

console.log("[sprint-7b-bless] Temp modifiers");

caseName("temp illumination +10 modifier added", () => {
  const s0 = fixtureState();
  const r  = handleInvoke(s0, "Mag Aug");
  const illMod = r.state.player.tempModifiers.find(
    m => m.stat === "illumination" && m.source === "bless"
  );
  truthy(illMod, "illumination temp modifier present");
  eq(illMod!.delta,          10, "delta +10");
  eq(illMod!.turnsRemaining, 10, "10 turns");
});

caseName("temp charisma +5 modifier added", () => {
  const s0 = fixtureState();
  const r  = handleInvoke(s0, "Mag Aug");
  const chaMod = r.state.player.tempModifiers.find(
    m => m.stat === "charisma" && m.source === "bless"
  );
  truthy(chaMod, "charisma temp modifier present");
  eq(chaMod!.delta,          5, "delta +5");
  eq(chaMod!.turnsRemaining, 10, "10 turns");
});

// ── 4. Temple modification ───────────────────────────────────

console.log("[sprint-7b-bless] Temple modification (shrine_of_maat)");

caseName("duration 15 turns in consecrated room", () => {
  const s0      = fixtureState({ inTemple: true });
  const r       = handleInvoke(s0, "Mag Aug");
  const blessed = r.state.player.activeEffects.find(e => e.type === "blessed");
  eq(blessed!.turnsRemaining, 15, "15 turns in temple");
  const illMod = r.state.player.tempModifiers.find(m => m.stat === "illumination");
  eq(illMod!.turnsRemaining,  15, "temp mod also 15 turns");
});

caseName("reagents NOT consumed in consecrated room", () => {
  const s0     = fixtureState({ inTemple: true });
  const r      = handleInvoke(s0, "Mag Aug");
  const garlic = r.state.player.inventory.find(i => i.itemId === "garlic");
  const mand   = r.state.player.inventory.find(i => i.itemId === "mandrake_root");
  eq(garlic?.quantity, 5, "garlic unchanged (waived)");
  eq(mand?.quantity,   5, "mandrake_root unchanged (waived)");
});

caseName("mana still consumed in temple (only reagents are waived)", () => {
  const s0 = fixtureState({ inTemple: true });
  const r  = handleInvoke(s0, "Mag Aug");
  eq(r.state.player.currentMana, 41, "50 − 9 = 41");
});

// ── 5. Bless in combat ───────────────────────────────────────

console.log("[sprint-7b-bless] Bless in combat");

caseName("'blessed' synced into playerCombatant.activeEffects", () => {
  const s0 = fixtureState({ withCombat: true });
  const r  = handleInvoke(s0, "Mag Aug");
  eq(r.outcome.kind, "success", "kind");
  const combatBlessed = r.state.player.activeCombat?.playerCombatant.activeEffects
    .find(e => e.type === "blessed");
  truthy(combatBlessed, "blessed in playerCombatant");
  eq(combatBlessed!.turnsRemaining, 10, "10 turns");
});

// ── 6. Refresh (re-cast replaces, not stacks) ────────────────

console.log("[sprint-7b-bless] Bless refresh");

caseName("re-casting Bless replaces existing blessed effect", () => {
  const s0 = fixtureState({ inTemple: false });
  // Add extra reagents for two casts
  const s0extra = {
    ...s0,
    player: {
      ...s0.player,
      currentMana: 50,
      inventory: [
        { itemId: "garlic",        quantity: 10 },
        { itemId: "mandrake_root", quantity: 10 },
      ],
    },
  };
  const r1 = handleInvoke(s0extra, "Mag Aug"); // first cast
  const r2 = handleInvoke(r1.state, "Mag Aug"); // re-cast
  const effects = r2.state.player.activeEffects.filter(e => e.type === "blessed");
  eq(effects.length, 1, "only one blessed effect after re-cast");
});

caseName("re-casting Bless replaces temp modifiers (no stacking)", () => {
  const s0extra = {
    ...fixtureState(),
    player: {
      ...fixtureState().player,
      currentMana: 50,
      inventory: [
        { itemId: "garlic",        quantity: 10 },
        { itemId: "mandrake_root", quantity: 10 },
      ],
    },
  };
  const r1 = handleInvoke(s0extra, "Mag Aug");
  const r2 = handleInvoke(r1.state, "Mag Aug");
  const illMods = r2.state.player.tempModifiers.filter(
    m => m.stat === "illumination" && m.source === "bless"
  );
  eq(illMods.length, 1, "only one illumination mod after re-cast");
});

// ── 7. Tick ──────────────────────────────────────────────────

console.log("[sprint-7b-bless] Temp modifier tick");

caseName("tickWorldState decrements tempModifiers turnsRemaining", () => {
  const s0 = fixtureState();
  const r  = handleInvoke(s0, "Mag Aug");
  const ticked = tickWorldState(r.state);
  const illMod = ticked.player.tempModifiers.find(m => m.stat === "illumination");
  eq(illMod!.turnsRemaining, 9, "10 → 9 after one tick");
});

caseName("tempModifiers expire and are removed at 0 turns", () => {
  const s0 = fixtureState();
  const r  = handleInvoke(s0, "Mag Aug");
  // Manually set all modifiers to 1 turn remaining
  let state: WorldState = {
    ...r.state,
    player: {
      ...r.state.player,
      tempModifiers: r.state.player.tempModifiers.map(m => ({ ...m, turnsRemaining: 1 })),
    },
  };
  state = tickWorldState(state);
  eq(state.player.tempModifiers.length, 0, "all modifiers expired");
});

// ── 8. Response composer ─────────────────────────────────────

console.log("[sprint-7b-bless] composeInvokeResponse");

caseName("success response mentions turns and blunted effects (normal room)", () => {
  const s0 = fixtureState();
  const r  = handleInvoke(s0, "Mag Aug");
  const text = composeInvokeResponse(r.outcome);
  truthy(text.includes("10 turns"), "10 turns in response");
  truthy(text.includes("blunted") || text.includes("bleed"), "resistance mentioned");
});

caseName("success response mentions temple + reagents waived (temple)", () => {
  const s0 = fixtureState({ inTemple: true });
  const r  = handleInvoke(s0, "Mag Aug");
  const text = composeInvokeResponse(r.outcome);
  truthy(text.includes("15 turns"), "15 turns in response");
  truthy(text.includes("sacred") || text.includes("temple") || text.includes("unspent"), "temple note in response");
});

// ── Tally ─────────────────────────────────────────────────────

console.log();
if (failures === 0) {
  console.log("[sprint-7b-bless] ✓ all cases passed");
  process.exit(0);
} else {
  console.error(`[sprint-7b-bless] ✗ ${failures} case(s) failed`);
  process.exit(1);
}
