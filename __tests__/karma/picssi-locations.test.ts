// ============================================================
// LIVING EAMON — S2: PICSSI-location taxonomy tests
//
// Run via:
//   npx tsx __tests__/karma/picssi-locations.test.ts
//
// Coverage:
//   1. scaleDeltaForRoom: no contacts → delta unchanged
//   2. scaleDeltaForRoom: matching virtue scaled 1.5x
//   3. scaleDeltaForRoom: non-matching virtue not scaled
//   4. scaleDeltaForRoom: multi-tag room scales all matching
//   5. scaleDeltaForRoom: negative delta scaled symmetrically
//   6. Integration: applyKarma in tagged room yields higher result
//   7. No-tag room preserves baseline karma delta
//   8. guild-hall shrine_of_maat has spirituality + integrity tags
//   9. guild-hall notice_board has integrity tag
//  10. guild-hall main_hall has passion + standing tags
// ============================================================

import { createInitialWorldState } from "../../lib/gameState";
import {
  scaleDeltaForRoom,
  applyKarma,
  PICSSI_LOCATION_MULTIPLIER,
} from "../../lib/karma/recompute";
import { getRoom } from "../../lib/adventures/registry";
import type { KarmaDelta } from "../../lib/karma/types";

let failures = 0;

function eq(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `assert ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function includes<T>(arr: T[], item: T, label: string): void {
  if (!arr.includes(item)) {
    throw new Error(`assert ${label} — expected ${JSON.stringify(arr)} to include ${JSON.stringify(item)}`);
  }
}
function caseName(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
    failures++;
  }
}

// ── Unit tests for scaleDeltaForRoom ─────────────────────────

caseName("no contacts → delta object returned unchanged", () => {
  const delta: KarmaDelta = { spirituality: 4, integrity: 2 };
  const result = scaleDeltaForRoom(delta, undefined);
  eq(result, delta, "same object reference");
});

caseName("empty contacts array → delta unchanged", () => {
  const delta: KarmaDelta = { courage: 3 };
  const result = scaleDeltaForRoom(delta, []);
  eq(result, delta, "same object reference");
});

caseName("matching virtue scaled by PICSSI_LOCATION_MULTIPLIER", () => {
  const delta: KarmaDelta = { spirituality: 4 };
  const result = scaleDeltaForRoom(delta, ["spirituality"]);
  eq(result.spirituality, Math.round(4 * PICSSI_LOCATION_MULTIPLIER), "scaled spirituality");
});

caseName("non-matching virtue not scaled", () => {
  const delta: KarmaDelta = { courage: 3, integrity: 2 };
  const result = scaleDeltaForRoom(delta, ["spirituality"]);
  eq(result.courage, 3, "courage unchanged");
  eq(result.integrity, 2, "integrity unchanged");
});

caseName("multi-tag contacts scale all matching virtues", () => {
  const delta: KarmaDelta = { spirituality: 4, integrity: 2, courage: 1 };
  const result = scaleDeltaForRoom(delta, ["spirituality", "integrity"]);
  eq(result.spirituality, Math.round(4 * PICSSI_LOCATION_MULTIPLIER), "spirituality scaled");
  eq(result.integrity, Math.round(2 * PICSSI_LOCATION_MULTIPLIER), "integrity scaled");
  eq(result.courage, 1, "courage unchanged");
});

caseName("negative delta scaled symmetrically (loss in tagged room is larger loss)", () => {
  const delta: KarmaDelta = { integrity: -5 };
  const result = scaleDeltaForRoom(delta, ["integrity"]);
  eq(result.integrity, Math.round(-5 * PICSSI_LOCATION_MULTIPLIER), "negative scaled");
});

caseName("zero delta virtue not touched", () => {
  const delta: KarmaDelta = { spirituality: 0, courage: 3 };
  const result = scaleDeltaForRoom(delta, ["spirituality"]);
  eq(result.spirituality, 0, "zero stays zero");
  eq(result.courage, 3, "untagged unchanged");
});

// ── Integration: applyKarma with room scaling ─────────────────

caseName("applyKarma in tagged room produces larger gain than baseline", () => {
  const state = createInitialWorldState();
  const player = state.player;

  const delta: KarmaDelta = { spirituality: 4 };
  const baseResult = applyKarma(player, delta);
  const scaledDelta = scaleDeltaForRoom(delta, ["spirituality"]);
  const taggedResult = applyKarma(player, scaledDelta);

  truthy(taggedResult.picssi.spirituality > baseResult.picssi.spirituality,
    "tagged room yields more spirituality");
});

caseName("no-tag room gives same result as bare applyKarma", () => {
  const state = createInitialWorldState();
  const player = state.player;

  const delta: KarmaDelta = { courage: 5 };
  const bare = applyKarma(player, delta);
  const scaled = applyKarma(player, scaleDeltaForRoom(delta, []));

  eq(scaled.picssi.courage, bare.picssi.courage, "untagged = baseline");
});

// ── Guild-hall room tag verification ─────────────────────────

caseName("shrine_of_maat has spirituality and integrity contacts", () => {
  const room = getRoom("shrine_of_maat");
  truthy(room?.picssiContacts, "picssiContacts defined");
  includes(room!.picssiContacts!, "spirituality", "spirituality tag");
  includes(room!.picssiContacts!, "integrity", "integrity tag");
});

caseName("notice_board has integrity contact", () => {
  const room = getRoom("notice_board");
  truthy(room?.picssiContacts, "picssiContacts defined");
  includes(room!.picssiContacts!, "integrity", "integrity tag");
});

caseName("main_hall has passion and standing contacts", () => {
  const room = getRoom("main_hall");
  truthy(room?.picssiContacts, "picssiContacts defined");
  includes(room!.picssiContacts!, "passion", "passion tag");
  includes(room!.picssiContacts!, "standing", "standing tag");
});

caseName("church_of_perpetual_life has spirituality contact", () => {
  const room = getRoom("church_of_perpetual_life");
  truthy(room?.picssiContacts, "picssiContacts defined");
  includes(room!.picssiContacts!, "spirituality", "spirituality tag");
});

caseName("mage_school has illumination contact", () => {
  const room = getRoom("mage_school");
  truthy(room?.picssiContacts, "picssiContacts defined");
  includes(room!.picssiContacts!, "illumination", "illumination tag");
});

// ── Summary ───────────────────────────────────────────────────

if (failures === 0) {
  console.log(`\n✅ All picssi-locations tests passed.`);
} else {
  console.error(`\n❌ ${failures} test(s) failed.`);
  process.exit(1);
}
