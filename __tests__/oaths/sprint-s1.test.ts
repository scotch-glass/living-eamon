// ============================================================
// LIVING EAMON — Sprint S1 (Tenets display) tests
//
// Run via:
//   npx tsx __tests__/oaths/sprint-s1.test.ts
//
// Coverage:
//   1. formatOathsLitany lists all 42 oaths with the closing line
//   2. OATHS_OF_MAAT length is exactly 42 and numbering is 1..42
//   3. processInput READ OATHS in shrine_of_maat returns the litany
//   4. First READ OATHS grants +1 Spirituality and sets the flag
//   5. Second READ OATHS does NOT re-grant Spirituality
//   6. READ OATHS in a non-consecrated room returns refusal text
//   7. LOOK in shrine_of_maat mentions the carved Oaths hint
//   8. LOOK in non-Ma'at room does not mention the hint
// ============================================================

import "../../lib/quests/load";
import {
  createInitialWorldState,
  type WorldState,
} from "../../lib/gameState";
import { processInput } from "../../lib/gameEngine";
import {
  OATHS_OF_MAAT,
  formatOathsLitany,
  READ_OATHS_FIRST_FLAG,
} from "../../lib/oaths";

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
function contains(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`assert ${label} — missing ${JSON.stringify(needle)} in ${JSON.stringify(haystack.slice(0, 200))}…`);
  }
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

console.log("Sprint S1 — Tenets display tests");

// ── Pure data sanity ─────────────────────────────────────────

caseName("OATHS_OF_MAAT has 42 entries", () => {
  eq(OATHS_OF_MAAT.length, 42, "length");
});

caseName("OATHS numbering is 1..42 in order", () => {
  for (let i = 0; i < 42; i++) {
    eq(OATHS_OF_MAAT[i].n, i + 1, `entry ${i}.n`);
  }
});

caseName("formatOathsLitany lists all 42 + closing line", () => {
  const text = formatOathsLitany();
  for (const o of OATHS_OF_MAAT) {
    contains(text, o.text, `oath ${o.n}`);
  }
  contains(text, "What I am, I am.", "closing line");
});

// ── Helper: place hero in a room ─────────────────────────────

function inRoom(roomId: string): WorldState {
  const ws = createInitialWorldState("Hero");
  return { ...ws, player: { ...ws.player, currentRoom: roomId } };
}

// ── READ OATHS path ──────────────────────────────────────────

caseName("READ OATHS in shrine_of_maat returns the litany", () => {
  const ws = inRoom("shrine_of_maat");
  const result = processInput("READ OATHS", ws);
  truthy(result.staticResponse, "static response");
  contains(result.staticResponse ?? "", "I walk the way of Ma'at.", "first oath");
  contains(result.staticResponse ?? "", "What I am, I am.", "closing");
});

caseName("first READ OATHS grants +1 Spirituality and sets flag", () => {
  const ws = inRoom("shrine_of_maat");
  // shrine_of_maat is tagged ["spirituality","integrity"] (S2),
  // so +1 spirituality scales to round(1 * 1.5) = 2.
  const before = ws.player.picssi.spirituality;
  const result = processInput("READ OATHS", ws);
  const after = result.newState.player.picssi.spirituality;
  eq(after - before, 2, "spirituality +2 (1 base * 1.5 S2 mult)");
  eq(result.newState.player.flagsLife?.[READ_OATHS_FIRST_FLAG], true, "flag set");
});

caseName("second READ OATHS does NOT re-grant Spirituality", () => {
  let ws = inRoom("shrine_of_maat");
  let result = processInput("READ OATHS", ws);
  ws = result.newState;
  const after1 = ws.player.picssi.spirituality;
  result = processInput("READ OATHS", ws);
  const after2 = result.newState.player.picssi.spirituality;
  eq(after2, after1, "no further gain");
  contains(result.staticResponse ?? "", "always stand", "subsequent-read flavor");
});

caseName("READ OATHS in non-consecrated room is refused", () => {
  const ws = inRoom("main_hall");
  const result = processInput("READ OATHS", ws);
  contains(
    result.staticResponse ?? "",
    "no Oaths inscribed",
    "refusal copy"
  );
  // No flag set
  falsy(result.newState.player.flagsLife?.[READ_OATHS_FIRST_FLAG], "no flag");
});

// ── LOOK branch ──────────────────────────────────────────────

caseName("LOOK in shrine_of_maat mentions READ OATHS hint", () => {
  const ws = inRoom("shrine_of_maat");
  const result = processInput("LOOK", ws);
  contains(result.staticResponse ?? "", "Forty-Two Oaths", "mentions oaths");
  contains(result.staticResponse ?? "", "READ OATHS", "hints verb");
});

caseName("LOOK in non-Ma'at room does NOT mention the hint", () => {
  const ws = inRoom("main_hall");
  const result = processInput("LOOK", ws);
  falsy((result.staticResponse ?? "").includes("READ OATHS to recite"), "no hint");
});

// ── Summary ──────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All Sprint S1 tests passed");
}
