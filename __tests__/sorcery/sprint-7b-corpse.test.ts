// ============================================================
// LIVING EAMON — Sprint 7b.R acceptance tests (Corpse System + Resurrection)
//
// Run via:
//   npx tsx __tests__/sorcery/sprint-7b-corpse.test.ts
//   npm run test:quests
//
// Coverage:
//   1. applyPlayerDeath creates a hero corpse record in WorldState.corpses.
//   2. Hero corpse: roomId = death room, isHeroCorpse = true.
//   3. tickWorldState advances sunExposed / moonExposed on surface corpses.
//   4. Buried / burnt corpses do NOT update sun/moon flags in tick.
//   5. Resurrection — no corpse in room → rejection "no-corpse".
//   6. Resurrection — hero corpse → rejection "hero-corpse".
//   7. Resurrection — immortal creature → rejection "immortal".
//   8. Resurrection — sun-and-moon exposed → rejection "sun-and-moon".
//   9. Resurrection — valid mortal corpse → resurrected, corpse removed.
//  10. Resurrection — >24 turns elapsed, bad RNG roll → returnedAsUndead true.
//  11. Resurrection — NPC restored to isAlive=true in WorldState.npcs.
//  12. composeInvokeResponse: renders resurrected (normal).
//  13. composeInvokeResponse: renders resurrected (undead).
//  14. composeInvokeResponse: renders resurrection-rejected sun-and-moon.
//  15. composeInvokeResponse: renders resurrection-rejected no-corpse.
// ============================================================

import { createInitialWorldState, applyPlayerDeath, tickWorldState, isDay } from "../../lib/gameState";
import type { WorldState, Corpse, NPCStateEntry } from "../../lib/gameState";
import { handleInvoke, composeInvokeResponse } from "../../lib/sorcery/invoke";
import { _setResurrectionRng } from "../../lib/sorcery/effects";

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
  if (actual) throw new Error(`assert ${label} — expected falsy, got ${actual}`);
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
        { itemId: "blood_moss",    quantity: 10 },
        { itemId: "garlic",        quantity: 10 },
        { itemId: "ginseng",       quantity: 10 },
        { itemId: "mandrake_root", quantity: 10 },
      ],
    },
  };
}

/** State with a mortal NPC corpse on the surface in the player's current room. */
function stateWithCorpse(opts: Partial<Corpse> = {}): WorldState {
  const s = baseState();
  const corpse: Corpse = {
    id: "corpse-test_npc-10",
    originalNpcId: "test_npc",
    name: "the body of Test NPC",
    roomId: s.player.currentRoom,
    planeId: "thurian",
    timeOfDeath: 10,
    context: "surface",
    sunExposed: false,
    moonExposed: false,
    creatureKind: "human",
    isHeroCorpse: false,
    ...opts,
  };
  // Register the NPC so Resurrection can restore it to alive.
  const npcEntry: NPCStateEntry = {
    npcId: "test_npc",
    disposition: "neutral",
    memory: [],
    agenda: null,
    location: s.player.currentRoom,
    isAlive: false,
    combatHp: null,
    customGreeting: null,
  };
  return {
    ...s,
    npcs: { ...s.npcs, test_npc: npcEntry },
    corpses: { [corpse.id]: corpse },
    worldTurn: 15,  // 5 turns after death
  };
}

// ── applyPlayerDeath corpse ───────────────────────────────────

console.log("\n[sprint-7b-corpse] Hero corpse on death");

caseName("applyPlayerDeath creates a hero corpse in WorldState.corpses", () => {
  const s = baseState();
  const { newState } = applyPlayerDeath(s, "a test enemy");
  const corpses = Object.values(newState.corpses ?? {});
  truthy(corpses.length > 0, "at least one corpse");
  truthy(corpses.some(c => c.isHeroCorpse), "isHeroCorpse flag");
});

caseName("hero corpse roomId = death room (not church)", () => {
  const s = baseState();
  const deathRoom = s.player.currentRoom;
  const { newState } = applyPlayerDeath(s, "a test enemy");
  const heroCorpse = Object.values(newState.corpses ?? {}).find(c => c.isHeroCorpse)!;
  eq(heroCorpse.roomId, deathRoom, "corpse roomId matches death room");
});

// ── corpse tick ───────────────────────────────────────────────

console.log("\n[sprint-7b-corpse] Day/night corpse tick");

caseName("surface corpse in day gets sunExposed=true on tick", () => {
  const s = baseState();
  // Force a daytime worldTurn (0-23 in cycle of 48)
  const dayState: WorldState = {
    ...s,
    worldTurn: 5, // isDay(5) = true
    corpses: {
      c1: {
        id: "c1", originalNpcId: "npc1", name: "body", roomId: "main_hall",
        planeId: "thurian", timeOfDeath: 0, context: "surface",
        sunExposed: false, moonExposed: false, creatureKind: "human", isHeroCorpse: false,
      },
    },
  };
  const ticked = tickWorldState(dayState);
  truthy(isDay(5), "sanity: worldTurn 5 is day");
  truthy(ticked.corpses["c1"]?.sunExposed, "sunExposed after day tick");
});

caseName("surface corpse at night gets moonExposed=true on tick", () => {
  const s = baseState();
  const nightState: WorldState = {
    ...s,
    worldTurn: 30, // isDay(30) = false (30 >= 24)
    corpses: {
      c1: {
        id: "c1", originalNpcId: "npc1", name: "body", roomId: "main_hall",
        planeId: "thurian", timeOfDeath: 0, context: "surface",
        sunExposed: false, moonExposed: false, creatureKind: "human", isHeroCorpse: false,
      },
    },
  };
  const ticked = tickWorldState(nightState);
  falsy(isDay(30), "sanity: worldTurn 30 is night");
  truthy(ticked.corpses["c1"]?.moonExposed, "moonExposed after night tick");
});

caseName("buried corpse does NOT update sun/moon flags on tick", () => {
  const s = baseState();
  const state: WorldState = {
    ...s,
    worldTurn: 5,
    corpses: {
      c1: {
        id: "c1", originalNpcId: "npc1", name: "body", roomId: "main_hall",
        planeId: "thurian", timeOfDeath: 0, context: "buried",
        sunExposed: false, moonExposed: false, creatureKind: "human", isHeroCorpse: false,
      },
    },
  };
  const ticked = tickWorldState(state);
  falsy(ticked.corpses["c1"]?.sunExposed, "buried corpse sunExposed stays false");
});

// ── Resurrection gates ────────────────────────────────────────

console.log("\n[sprint-7b-corpse] Resurrection gates");

caseName("no corpse in room → resurrection-rejected 'no-corpse'", () => {
  const s = baseState();
  const { outcome } = handleInvoke(s, "Solv Mort");
  eq(outcome.kind, "success", "outcome kind");
  if (outcome.kind === "success") {
    eq(outcome.effect.kind, "resurrection-rejected", "effect kind");
    if (outcome.effect.kind === "resurrection-rejected")
      eq(outcome.effect.reason, "no-corpse", "reason");
  }
});

caseName("hero corpse → resurrection-rejected 'hero-corpse'", () => {
  const s = stateWithCorpse({ isHeroCorpse: true, originalNpcId: "hero" });
  const { outcome } = handleInvoke(s, "Solv Mort");
  if (outcome.kind === "success" && outcome.effect.kind === "resurrection-rejected")
    eq(outcome.effect.reason, "hero-corpse", "reason");
  else throw new Error("expected resurrection-rejected");
});

caseName("immortal creature → resurrection-rejected 'immortal'", () => {
  const s = stateWithCorpse({ creatureKind: "immortal" });
  const { outcome } = handleInvoke(s, "Solv Mort");
  if (outcome.kind === "success" && outcome.effect.kind === "resurrection-rejected")
    eq(outcome.effect.reason, "immortal", "reason");
  else throw new Error("expected resurrection-rejected");
});

caseName("sun-and-moon exposed → resurrection-rejected 'sun-and-moon'", () => {
  const s = stateWithCorpse({ sunExposed: true, moonExposed: true });
  const { outcome } = handleInvoke(s, "Solv Mort");
  if (outcome.kind === "success" && outcome.effect.kind === "resurrection-rejected")
    eq(outcome.effect.reason, "sun-and-moon", "reason");
  else throw new Error("expected resurrection-rejected");
});

// ── Resurrection success ──────────────────────────────────────

console.log("\n[sprint-7b-corpse] Resurrection success");

caseName("valid mortal corpse → resurrected, corpse removed from WorldState", () => {
  const s = stateWithCorpse();
  const { outcome, state: after } = handleInvoke(s, "Solv Mort");
  eq(outcome.kind, "success", "outcome kind");
  if (outcome.kind === "success") eq(outcome.effect.kind, "resurrected", "effect kind");
  const remaining = Object.values(after.corpses ?? {});
  eq(remaining.length, 0, "corpse removed");
});

caseName(">24 turns elapsed + forced undead roll → returnedAsUndead=true", () => {
  _setResurrectionRng(() => 0.1); // < 0.5 = undead
  try {
    const s = stateWithCorpse({ timeOfDeath: 0 });
    const aged: WorldState = { ...s, worldTurn: 50 }; // 50 turns elapsed
    const { outcome } = handleInvoke(aged, "Solv Mort");
    if (outcome.kind === "success" && outcome.effect.kind === "resurrected")
      eq(outcome.effect.returnedAsUndead, true, "returnedAsUndead");
    else throw new Error("expected resurrected");
  } finally {
    _setResurrectionRng(Math.random);
  }
});

caseName("fresh corpse → returnedAsUndead=false regardless of RNG", () => {
  _setResurrectionRng(() => 0.1);
  try {
    const s = stateWithCorpse({ timeOfDeath: 14 });
    // worldTurn = 15, elapsed = 1 — not > 24
    const { outcome } = handleInvoke(s, "Solv Mort");
    if (outcome.kind === "success" && outcome.effect.kind === "resurrected")
      eq(outcome.effect.returnedAsUndead, false, "not undead when fresh");
    else throw new Error("expected resurrected");
  } finally {
    _setResurrectionRng(Math.random);
  }
});

caseName("NPC restored to isAlive=true in WorldState.npcs", () => {
  const s = stateWithCorpse();
  const { state: after } = handleInvoke(s, "Solv Mort");
  eq(after.npcs["test_npc"]?.isAlive, true, "NPC isAlive after resurrection");
});

// ── composeInvokeResponse ─────────────────────────────────────

console.log("\n[sprint-7b-corpse] composeInvokeResponse");

caseName("renders 'resurrected' (normal return)", () => {
  const s = stateWithCorpse();
  const { outcome } = handleInvoke(s, "Solv Mort");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "lives", "life-restoration flavor");
});

caseName("renders 'resurrected' (undead return)", () => {
  _setResurrectionRng(() => 0.1);
  try {
    const s = stateWithCorpse({ timeOfDeath: 0 });
    const aged: WorldState = { ...s, worldTurn: 50 };
    const { outcome } = handleInvoke(aged, "Solv Mort");
    const msg = composeInvokeResponse(outcome);
    contains(msg, "changed", "undead flavor");
  } finally {
    _setResurrectionRng(Math.random);
  }
});

caseName("renders 'resurrection-rejected' sun-and-moon", () => {
  const s = stateWithCorpse({ sunExposed: true, moonExposed: true });
  const { outcome } = handleInvoke(s, "Solv Mort");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "gone on", "sun-and-moon flavor");
});

caseName("renders 'resurrection-rejected' no-corpse", () => {
  const s = baseState();
  const { outcome } = handleInvoke(s, "Solv Mort");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "no body", "no-corpse flavor");
});

// ── Summary ───────────────────────────────────────────────────

const total = 15;
if (failures === 0) {
  console.log(`\n[sprint-7b-corpse] ✓ all cases passed\n`);
} else {
  console.error(`\n[sprint-7b-corpse] ✗ ${failures}/${total} cases failed\n`);
  process.exit(1);
}
