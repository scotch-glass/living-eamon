// ============================================================
// LIVING EAMON — Sprint S3 Word system tests
//
// Run via:
//   npx tsx __tests__/quests/words.test.ts
//
// Coverage:
//   1. computeBreakPenaltyMultiplier: bare room → 1
//   2. Mithras-deity room → 2
//   3. Integrity-tagged room → 1.5
//   4. Mithras + Integrity → 3 (×2 × ×1.5)
//   5. createWord builds correct shape
//   6. acceptQuest pushes a Word to givenWords
//   7. Duplicate acceptQuest does NOT push another Word
//   8. completeStep finalize → matching Word marked fulfilled
//   9. breakWord applies negative-integrity scaled by multiplier
//  10. breakWord on Mithraic Word doubles the penalty
//  11. givenWords survives applyPlayerDeath (per-life flagsLife wipes)
//  12. givenWords round-trips through worldStateToPlayerRecord
// ============================================================

import { createInitialWorldState, applyPlayerDeath } from "../../lib/gameState";
import { worldStateToPlayerRecord } from "../../lib/persistence/playerRecord";
import {
  acceptQuest,
  completeStep,
  registerQuest,
  getQuest,
} from "../../lib/quests/engine";
import {
  computeBreakPenaltyMultiplier,
  createWord,
  breakWord,
  WORD_BREAK_PENALTY_INTEGRITY,
} from "../../lib/quests/words";
import type { Quest } from "../../lib/quests/types";
import type { Room } from "../../lib/roomTypes";

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
  } catch (e) {
    failures++;
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

console.log("Sprint S3 — Word system tests");

// ── Test fixtures ────────────────────────────────────────────

function bareRoom(over: Partial<Room> = {}): Room {
  return {
    id: "test-room",
    name: "Test Room",
    description: "",
    exits: {},
    stateModifiers: {},
    npcs: [],
    items: [],
    ...over,
  };
}

// Register a minimal test quest — ids unique to this file to avoid collisions
const TEST_QUEST_ID = "_s3_test_quest";
const testQuest: Quest = {
  id: TEST_QUEST_ID,
  title: "Test Quest",
  blurb: "A test quest for the Word system.",
  scope: "life",
  startStep: "step1",
  steps: {
    step1: {
      id: "step1",
      hint: "do the thing",
      reward: { picssi: { courage: 1 } },
      nextStep: null,
    },
  },
  completionReward: { picssi: { integrity: 5 } },
};
if (!getQuest(TEST_QUEST_ID)) registerQuest(testQuest);

const TEST_LEGACY_QUEST_ID = "_s3_test_legacy_quest";
const testLegacyQuest: Quest = {
  id: TEST_LEGACY_QUEST_ID,
  title: "Test Legacy Quest",
  blurb: "Legacy-scope test.",
  scope: "legacy",
  startStep: "s",
  steps: { s: { id: "s", hint: "h", nextStep: null } },
};
if (!getQuest(TEST_LEGACY_QUEST_ID)) registerQuest(testLegacyQuest);

// ── 1–4: Multiplier computation ──────────────────────────────

caseName("bare room → multiplier 1, mithraic false", () => {
  const r = bareRoom();
  const { multiplier, mithraic } = computeBreakPenaltyMultiplier(r);
  eq(multiplier, 1, "multiplier");
  eq(mithraic, false, "mithraic");
});

caseName("Mithras-deity room → multiplier 2, mithraic true", () => {
  const r = bareRoom({ deity: "mithras" });
  const { multiplier, mithraic } = computeBreakPenaltyMultiplier(r);
  eq(multiplier, 2, "multiplier");
  eq(mithraic, true, "mithraic");
});

caseName("Integrity-tagged room → multiplier 1.5", () => {
  const r = bareRoom({ picssiContacts: ["integrity"] });
  const { multiplier, mithraic } = computeBreakPenaltyMultiplier(r);
  eq(multiplier, 1.5, "multiplier");
  eq(mithraic, false, "mithraic");
});

caseName("Mithras + Integrity → multiplier 3", () => {
  const r = bareRoom({ deity: "mithras", picssiContacts: ["integrity"] });
  const { multiplier } = computeBreakPenaltyMultiplier(r);
  eq(multiplier, 3, "multiplier");
});

// ── 5: createWord shape ──────────────────────────────────────

caseName("createWord builds correct shape", () => {
  const r = bareRoom({ id: "shrine_of_maat", picssiContacts: ["integrity"] });
  const word = createWord(testQuest, "shrine_of_maat", 42, r);
  eq(word.questId, TEST_QUEST_ID, "questId");
  eq(word.questTitle, "Test Quest", "questTitle");
  eq(word.swornAtRoom, "shrine_of_maat", "swornAtRoom");
  eq(word.swornAtTurn, 42, "swornAtTurn");
  eq(word.status, "active", "status");
  eq(word.breakPenaltyMultiplier, 1.5, "multiplier");
  eq(word.mithraic, false, "mithraic");
  truthy(word.id.startsWith(TEST_QUEST_ID), "id prefix");
});

// ── 6: acceptQuest pushes Word ───────────────────────────────

caseName("acceptQuest pushes a Word to givenWords", () => {
  const ws = createInitialWorldState("Hero");
  const next = acceptQuest(ws, TEST_QUEST_ID);
  eq(next.player.givenWords.length, 1, "givenWords length");
  eq(next.player.givenWords[0].questId, TEST_QUEST_ID, "word questId");
  eq(next.player.givenWords[0].status, "active", "word status");
  truthy(next.player.quests[TEST_QUEST_ID], "quest registered");
});

// ── 7: Duplicate accept ──────────────────────────────────────

caseName("duplicate acceptQuest does NOT push another Word", () => {
  let ws = createInitialWorldState("Hero");
  ws = acceptQuest(ws, TEST_QUEST_ID);
  ws = acceptQuest(ws, TEST_QUEST_ID);
  eq(ws.player.givenWords.length, 1, "still one Word after second accept");
});

// ── 8: completeStep finalize → fulfill ───────────────────────

caseName("completeStep finalize marks the Word fulfilled", () => {
  let ws = createInitialWorldState("Hero");
  ws = acceptQuest(ws, TEST_QUEST_ID);
  ws = completeStep(ws, TEST_QUEST_ID, "step1");
  eq(ws.player.givenWords[0].status, "fulfilled", "fulfilled");
  eq(ws.player.quests[TEST_QUEST_ID].status, "completed", "quest completed");
});

// ── 9: breakWord penalty ─────────────────────────────────────

caseName("breakWord applies WORD_BREAK_PENALTY_INTEGRITY × multiplier", () => {
  let ws = createInitialWorldState("Hero");
  // Bump integrity up so penalty has room to register against the 0..100 clamp
  ws = { ...ws, player: { ...ws.player, picssi: { ...ws.player.picssi, integrity: 50 } } };
  ws = acceptQuest(ws, TEST_QUEST_ID);
  // Word built in default room (no integrity tag in createInitialWorldState).
  // Hand-set multiplier=1 to make this assertion deterministic.
  ws = {
    ...ws,
    player: {
      ...ws.player,
      givenWords: ws.player.givenWords.map(w => ({ ...w, breakPenaltyMultiplier: 1 })),
    },
  };
  const before = ws.player.picssi.integrity;
  ws = breakWord(ws, TEST_QUEST_ID);
  const after = ws.player.picssi.integrity;
  eq(after - before, WORD_BREAK_PENALTY_INTEGRITY, "−10 integrity");
  eq(ws.player.givenWords[0].status, "broken", "broken");
  eq(ws.player.quests[TEST_QUEST_ID].status, "failed", "quest failed");
});

// ── 10: Mithraic doubles penalty ─────────────────────────────

caseName("breakWord on Mithraic Word doubles penalty", () => {
  let ws = createInitialWorldState("Hero");
  ws = { ...ws, player: { ...ws.player, picssi: { ...ws.player.picssi, integrity: 50 } } };
  ws = acceptQuest(ws, TEST_QUEST_ID);
  ws = {
    ...ws,
    player: {
      ...ws.player,
      givenWords: ws.player.givenWords.map(w => ({
        ...w,
        breakPenaltyMultiplier: 2,
        mithraic: true,
      })),
    },
  };
  const before = ws.player.picssi.integrity;
  ws = breakWord(ws, TEST_QUEST_ID);
  eq(ws.player.picssi.integrity - before, -20, "−20 integrity");
});

// ── 11: givenWords survives death ────────────────────────────

caseName("givenWords survives applyPlayerDeath", () => {
  let ws = createInitialWorldState("Hero");
  ws = acceptQuest(ws, TEST_LEGACY_QUEST_ID);
  ws = acceptQuest(ws, TEST_QUEST_ID);
  eq(ws.player.givenWords.length, 2, "two Words before death");
  const { newState } = applyPlayerDeath(ws, "ogre", "indoor");
  // Both words persist; flagsLife should be wiped (sanity check)
  eq(newState.player.givenWords.length, 2, "two Words after death");
  eq(Object.keys(newState.player.flagsLife).length, 0, "flagsLife wiped");
});

// ── 12: Persistence round-trip ───────────────────────────────

caseName("givenWords round-trips through worldStateToPlayerRecord", () => {
  let ws = createInitialWorldState("Hero");
  ws = acceptQuest(ws, TEST_QUEST_ID);
  const rec = worldStateToPlayerRecord(ws);
  const words = rec.givenWords as unknown[];
  eq(Array.isArray(words), true, "array");
  eq(words.length, 1, "one Word");
});

// ── Summary ──────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All Word-system tests passed");
}
