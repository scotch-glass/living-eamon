// ============================================================
// LIVING EAMON — Sprint G1: real-time clock tests
//
// Run via:
//   npx tsx __tests__/world/real-time-tick.test.ts
//
// Coverage:
//   1. createInitialWorldState populates realTimeMs and lastTickAt.
//   2. tickRealTime advances realTimeMs by exactly deltaMs.
//   3. tickRealTime updates lastTickAt to approximately now.
//   4. tickRealTime with deltaMs <= 0 returns state unchanged.
//   5. Sequential ticks accumulate correctly.
// ============================================================

import { createInitialWorldState, tickRealTime } from "../../lib/gameState";

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
function approxNow(actual: number, label: string): void {
  const diff = Math.abs(actual - Date.now());
  if (diff > 2000)
    throw new Error(`assert ${label} — expected value near Date.now(), got diff ${diff}ms`);
}

console.log("Sprint G1 — real-time clock tests");

const HOUR_MS = 60 * 60 * 1000;
const KNOWN_TIME = 1_700_000_000_000; // fixed past timestamp (Nov 2023)

function stateWithTime(realTimeMs: number, lastTickAt: number) {
  const base = createInitialWorldState("Tick Hero");
  return { ...base, realTimeMs, lastTickAt };
}

caseName("initial state has numeric realTimeMs", () => {
  const s = createInitialWorldState("Hero");
  if (typeof s.realTimeMs !== "number") throw new Error("realTimeMs must be a number");
  if (s.realTimeMs <= 0) throw new Error("realTimeMs must be > 0");
});

caseName("initial state has numeric lastTickAt", () => {
  const s = createInitialWorldState("Hero");
  if (typeof s.lastTickAt !== "number") throw new Error("lastTickAt must be a number");
  if (s.lastTickAt <= 0) throw new Error("lastTickAt must be > 0");
});

caseName("tickRealTime advances realTimeMs by deltaMs", () => {
  const delta = 25 * HOUR_MS;
  const state = stateWithTime(KNOWN_TIME, KNOWN_TIME);
  const next = tickRealTime(state, delta);
  eq(next.realTimeMs, KNOWN_TIME + delta, "realTimeMs after 25h tick");
});

caseName("tickRealTime updates lastTickAt to approx now", () => {
  const state = stateWithTime(KNOWN_TIME, KNOWN_TIME);
  const next = tickRealTime(state, HOUR_MS);
  approxNow(next.lastTickAt, "lastTickAt after tick");
});

caseName("tickRealTime with zero delta returns same state", () => {
  const state = stateWithTime(KNOWN_TIME, KNOWN_TIME);
  const next = tickRealTime(state, 0);
  if (next !== state) throw new Error("expected same reference for delta=0");
});

caseName("tickRealTime with negative delta returns same state", () => {
  const state = stateWithTime(KNOWN_TIME, KNOWN_TIME);
  const next = tickRealTime(state, -5000);
  if (next !== state) throw new Error("expected same reference for negative delta");
});

caseName("sequential ticks accumulate correctly", () => {
  let state = stateWithTime(KNOWN_TIME, KNOWN_TIME);
  state = tickRealTime(state, 10 * HOUR_MS);
  state = tickRealTime(state, 15 * HOUR_MS);
  eq(state.realTimeMs, KNOWN_TIME + 25 * HOUR_MS, "accumulated 25h across two ticks");
});

caseName("tickRealTime does not mutate input state", () => {
  const orig = stateWithTime(KNOWN_TIME, KNOWN_TIME);
  const origMs = orig.realTimeMs;
  tickRealTime(orig, 10 * HOUR_MS);
  eq(orig.realTimeMs, origMs, "input realTimeMs unchanged");
});

caseName("tickRealTime preserves other world state fields", () => {
  const state = stateWithTime(KNOWN_TIME, KNOWN_TIME);
  const modifiedState = { ...state, worldTurn: 99 };
  const next = tickRealTime(modifiedState, HOUR_MS);
  eq(next.worldTurn, 99, "worldTurn preserved");
});

// ── Summary ──────────────────────────────────────────────────
if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All G1 real-time clock tests passed");
}
