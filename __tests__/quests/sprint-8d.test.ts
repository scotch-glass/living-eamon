// ============================================================
// LIVING EAMON — Sprint 8d acceptance tests
//
// Run via:
//   npx tsx __tests__/quests/sprint-8d.test.ts
//
// Coverage:
//   1. Quest.acceptanceTrigger auto-accept phase fires when its
//      trigger matches an event AND prereqs pass.
//   2. Vivian-arc accepts after `flagsLife.vivian_first_met` is
//      set (atom-triggers-quest proof) and completes after
//      `flagsLife.vivian_cave_bond`.
//   3. Way-of-Thoth accepts on scroll-read=thoth-1 AND completes
//      step 1 in the same event (Phase 1 + Phase 2).
//   4. Way-of-Thoth runs end-to-end through all 15 stubs.
// ============================================================

import "../../lib/quests/load"; // register quest lines
import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState } from "../../lib/gameState";
import { emitQuestEvent } from "../../lib/quests/engine";

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

function freshState(): WorldState {
  return createInitialWorldState("Tester");
}

function setFlagLife(state: WorldState, key: string): WorldState {
  return {
    ...state,
    player: {
      ...state.player,
      flagsLife: { ...(state.player.flagsLife ?? {}), [key]: true },
    },
  };
}

// ── Vivian-arc ────────────────────────────────────────────────

console.log("[sprint-8d] Vivian-arc — atom-triggers-quest proof");

caseName("does NOT auto-accept before vivian_first_met flag is set", () => {
  const s0 = freshState();
  const s1 = emitQuestEvent(s0, { type: "command", verb: "LOOK", args: [] });
  falsy(s1.player.quests?.["vivian-arc"], "quest not present yet");
});

caseName("auto-accepts on next command after vivian_first_met is set", () => {
  const s0 = setFlagLife(freshState(), "vivian_first_met");
  const s1 = emitQuestEvent(s0, { type: "command", verb: "LOOK", args: [] });
  truthy(s1.player.quests?.["vivian-arc"], "quest present");
  eq(s1.player.quests!["vivian-arc"]!.status, "active", "active");
  eq(s1.player.quests!["vivian-arc"]!.currentStep, "step-bond", "on step-bond");
});

caseName("does NOT re-accept once already in quest map", () => {
  const s0 = setFlagLife(freshState(), "vivian_first_met");
  const s1 = emitQuestEvent(s0, { type: "command", verb: "LOOK", args: [] });
  const acceptedAt1 = s1.player.quests!["vivian-arc"]!.acceptedAt;
  const s2 = emitQuestEvent(s1, { type: "command", verb: "STATS", args: [] });
  eq(s2.player.quests!["vivian-arc"]!.acceptedAt, acceptedAt1, "acceptedAt unchanged");
});

caseName("completes after vivian_cave_bond flag is set", () => {
  let s = setFlagLife(freshState(), "vivian_first_met");
  s = emitQuestEvent(s, { type: "command", verb: "LOOK", args: [] });
  eq(s.player.quests!["vivian-arc"]!.currentStep, "step-bond", "armed at step-bond");
  s = setFlagLife(s, "vivian_cave_bond");
  s = emitQuestEvent(s, { type: "command", verb: "LOOK", args: [] });
  eq(s.player.quests!["vivian-arc"]!.status, "completed", "completed");
  eq(s.player.quests!["vivian-arc"]!.currentStep, null, "no current step");
});

// ── Way-of-Thoth ──────────────────────────────────────────────

console.log("[sprint-8d] Way-of-Thoth — 15-step legacy stub");

caseName("auto-accepts on scroll-read thoth-1 AND completes step 1 in one event", () => {
  const s0 = freshState();
  const s1 = emitQuestEvent(s0, { type: "scroll-read", scrollId: "thoth-1", firstPass: true });
  const qs = s1.player.quests?.["way-of-thoth"];
  truthy(qs, "quest present");
  eq(qs!.status, "active", "active");
  eq(qs!.currentStep, "scroll-2", "advanced to step 2");
  eq(qs!.completedSteps, ["scroll-1"], "step 1 completed");
});

caseName("does NOT accept on non-firstPass thoth-1 read", () => {
  const s0 = freshState();
  const s1 = emitQuestEvent(s0, { type: "scroll-read", scrollId: "thoth-1", firstPass: false });
  falsy(s1.player.quests?.["way-of-thoth"], "no acceptance on re-read");
});

caseName("walks all 15 scrolls end-to-end with stub rewards", () => {
  let s = freshState();
  for (let n = 1; n <= 15; n++) {
    s = emitQuestEvent(s, { type: "scroll-read", scrollId: `thoth-${n}`, firstPass: true });
  }
  const qs = s.player.quests!["way-of-thoth"]!;
  eq(qs.status, "completed", "quest completed");
  eq(qs.currentStep, null, "no current step");
  eq(qs.completedSteps.length, 15, "all 15 steps done");
  // Stub rewards land as chronicle entries — at minimum we should have:
  //   1 acceptReward (legacyChronicle), 15 step rewards (chronicle),
  //   1 completionChronicle. Total >= 17 chronicle entries.
  const chronicleCount = s.chronicleLog?.length ?? 0;
  truthy(chronicleCount >= 17, `chronicle count ${chronicleCount} >= 17`);
});

caseName("scope is legacy: scroll progress survives applyPlayerDeath filter", () => {
  // The engine filterQuestsByScope helper is what applyPlayerDeath uses;
  // we don't simulate full death here, just assert scope is denormalized
  // correctly so the filter would preserve the quest.
  let s = freshState();
  s = emitQuestEvent(s, { type: "scroll-read", scrollId: "thoth-1", firstPass: true });
  eq(s.player.quests!["way-of-thoth"]!.scope, "legacy", "scope=legacy");
});

// ── Auto-accept respects acceptancePrerequisites ──────────────

console.log("[sprint-8d] auto-accept gating");

caseName("acceptanceTrigger ALONE does not accept if guard fails", () => {
  // Vivian-arc's guard requires vivian_first_met flag; without it, even
  // a matching command event must not accept the quest.
  const s0 = freshState();
  const s1 = emitQuestEvent(s0, { type: "command", verb: "STATS", args: [] });
  falsy(s1.player.quests?.["vivian-arc"], "no acceptance without flag");
});

if (failures > 0) {
  console.error(`\n${failures} case(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll cases passed.");
}
