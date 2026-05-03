// ============================================================
// LIVING EAMON — Sprint G2: time-of-day tests
//
// Run via:
//   npx tsx __tests__/world/time-of-day.test.ts
//
// Coverage:
//   1. getTimeOfDayLine returns null for "indoor".
//   2. getTimeOfDayLine returns a non-empty string for day/night/dawn/dusk.
//   3. Pool rotation: different worldTurn values yield different lines.
//   4. Corpse tick: indoor corpse never accumulates sun or moon exposure.
//   5. Corpse tick: day-room corpse gets sunExposed after one tick.
//   6. Corpse tick: night-room corpse gets moonExposed after one tick.
//   7. Corpse tick: dawn-room corpse gets sunExposed.
//   8. Corpse tick: dusk-room corpse gets moonExposed.
//   9. applyPlayerDeath passes timeOfDay to hero corpse.
//  10. Indoor hero corpse starts with both exposure flags false.
// ============================================================

import { getTimeOfDayLine } from "../../lib/world/timeOfDayDescriptions";
import { createInitialWorldState, tickWorldState, applyPlayerDeath } from "../../lib/gameState";
import type { Corpse, WorldState } from "../../lib/gameState";

let failures = 0;
function caseName(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}
function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected)
    throw new Error(`assert ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}

console.log("Sprint G2 — time-of-day tests");

// ── getTimeOfDayLine ─────────────────────────────────────────

caseName("indoor returns null", () => {
  eq(getTimeOfDayLine("indoor", "aquilonian", 0), null, "indoor null");
});

caseName("day returns non-empty string", () => {
  const line = getTimeOfDayLine("day", "aquilonian", 0);
  if (!line || line.length === 0) throw new Error("expected non-empty string for day");
});

caseName("night returns non-empty string", () => {
  const line = getTimeOfDayLine("night", "aquilonian", 0);
  if (!line || line.length === 0) throw new Error("expected non-empty string for night");
});

caseName("dawn returns non-empty string", () => {
  const line = getTimeOfDayLine("dawn", "aquilonian", 0);
  if (!line || line.length === 0) throw new Error("expected non-empty string for dawn");
});

caseName("dusk returns non-empty string", () => {
  const line = getTimeOfDayLine("dusk", "aquilonian", 0);
  if (!line || line.length === 0) throw new Error("expected non-empty string for dusk");
});

caseName("pool rotates with worldTurn", () => {
  const a = getTimeOfDayLine("day", "aquilonian", 0);
  const b = getTimeOfDayLine("day", "aquilonian", 1);
  const c = getTimeOfDayLine("day", "aquilonian", 2);
  // At least two of the three should differ (pool has 3 entries)
  if (a === b && b === c) throw new Error("expected pool rotation, but all three turns returned same line");
});

caseName("unknown sceneTone falls back gracefully", () => {
  const line = getTimeOfDayLine("day", "pastoral", 0);
  if (line === null) throw new Error("pastoral should return a line, not null");
});

// ── Corpse tick ──────────────────────────────────────────────

function stateWithCorpse(timeOfDay: Corpse["timeOfDay"]): WorldState {
  const base = createInitialWorldState("Hero");
  const corpse: Corpse = {
    id: "test-corpse",
    originalNpcId: "goblin",
    name: "the body of a goblin",
    roomId: "main_hall",
    planeId: "thurian",
    timeOfDeath: 1,
    context: "surface",
    sunExposed: false,
    moonExposed: false,
    creatureKind: "human",
    isHeroCorpse: false,
    timeOfDay,
  };
  return { ...base, corpses: { "test-corpse": corpse } };
}

caseName("indoor corpse: no sun or moon exposure after tick", () => {
  let state = stateWithCorpse("indoor");
  state = tickWorldState(state);
  state = tickWorldState(state);
  eq(state.corpses["test-corpse"].sunExposed, false, "sunExposed stays false");
  eq(state.corpses["test-corpse"].moonExposed, false, "moonExposed stays false");
});

caseName("day corpse: sunExposed after one tick", () => {
  let state = stateWithCorpse("day");
  state = tickWorldState(state);
  eq(state.corpses["test-corpse"].sunExposed, true, "sunExposed becomes true");
  eq(state.corpses["test-corpse"].moonExposed, false, "moonExposed stays false");
});

caseName("night corpse: moonExposed after one tick", () => {
  let state = stateWithCorpse("night");
  state = tickWorldState(state);
  eq(state.corpses["test-corpse"].sunExposed, false, "sunExposed stays false");
  eq(state.corpses["test-corpse"].moonExposed, true, "moonExposed becomes true");
});

caseName("dawn corpse: sunExposed after one tick", () => {
  let state = stateWithCorpse("dawn");
  state = tickWorldState(state);
  eq(state.corpses["test-corpse"].sunExposed, true, "dawn gives sun exposure");
});

caseName("dusk corpse: moonExposed after one tick", () => {
  let state = stateWithCorpse("dusk");
  state = tickWorldState(state);
  eq(state.corpses["test-corpse"].moonExposed, true, "dusk gives moon exposure");
});

// ── applyPlayerDeath ─────────────────────────────────────────

caseName("indoor hero corpse: both exposure flags false", () => {
  const base = createInitialWorldState("Corin");
  const { newState } = applyPlayerDeath(base, "the bandit", "indoor");
  const heroCorpse = Object.values(newState.corpses).find(c => c.isHeroCorpse);
  if (!heroCorpse) throw new Error("hero corpse not found");
  eq(heroCorpse.sunExposed, false, "indoor hero corpse sunExposed");
  eq(heroCorpse.moonExposed, false, "indoor hero corpse moonExposed");
  eq(heroCorpse.timeOfDay, "indoor", "timeOfDay stored on corpse");
});

caseName("day hero corpse: sunExposed true", () => {
  const base = createInitialWorldState("Corin");
  const { newState } = applyPlayerDeath(base, "the bandit", "day");
  const heroCorpse = Object.values(newState.corpses).find(c => c.isHeroCorpse);
  truthy(heroCorpse, "hero corpse exists");
  eq(heroCorpse!.sunExposed, true, "day hero corpse sunExposed");
  eq(heroCorpse!.moonExposed, false, "day hero corpse moonExposed");
});

// ── Summary ──────────────────────────────────────────────────
if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All G2 time-of-day tests passed");
}
