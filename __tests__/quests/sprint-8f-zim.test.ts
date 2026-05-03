// ============================================================
// LIVING EAMON — Sprint 8f acceptance tests
//
// Run via:
//   npx tsx __tests__/quests/sprint-8f-zim.test.ts
//
// Coverage:
//   1. zim_the_wizard is registered in quest dialogue
//   2. Branch 1 fires at onStep:"scroll-2", grants greater-heal,
//      sets scratch zim-scroll-1
//   3. Re-talk at scroll-2: lines repeat, no double-award
//   4. Extension pattern: resolveQuestDialogue(fresh, "zim_the_wizard")
//      returns null (no fallback defined)
//   5. Branch 15 fires when questCompleted: true
//   6. Circle unlock wiring: odd scrolls have correct unlockCircle
//   7. Even scrolls have reward.unlockCircle === undefined
//   8. All 15 fireOnceKey values are distinct
// ============================================================

import "../../lib/quests/load";
import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState, PlayerState } from "../../lib/gameState";
import { newQuestState } from "../../lib/quests/types";
import { resolveQuestDialogue, getQuestDialogue } from "../../lib/quests/dialogue";
import { getQuest } from "../../lib/quests/engine";

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
    throw new Error(
      `assert ${label} — expected to contain ${JSON.stringify(needle)}; got ${JSON.stringify(haystack.slice(0, 200))}…`
    );
  }
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

function stateOnStep(
  step: string,
  scratch: Record<string, string | number | boolean> = {}
): WorldState {
  const base = createInitialWorldState("Tester");
  const qs = newQuestState("scroll-1", "legacy");
  qs.currentStep = step;
  qs.scratch = { ...scratch };
  const player: PlayerState = {
    ...base.player,
    quests: { ...(base.player.quests ?? {}), "way-of-thoth": qs },
  };
  return { ...base, player };
}

function stateCompleted(): WorldState {
  const base = createInitialWorldState("Tester");
  const qs = newQuestState("scroll-1", "legacy");
  qs.currentStep = null;
  qs.status = "completed";
  qs.completedSteps = Array.from({ length: 15 }, (_, i) => `scroll-${i + 1}`);
  const player: PlayerState = {
    ...base.player,
    quests: { ...(base.player.quests ?? {}), "way-of-thoth": qs },
  };
  return { ...base, player };
}

// ── 1. Registry ───────────────────────────────────────────────

console.log("[sprint-8f] Zim dialogue registry");

caseName("zim_the_wizard is registered in quest dialogue", () => {
  truthy(getQuestDialogue("zim_the_wizard"), "zim_the_wizard registered");
});

// ── 2. Branch 1 — greater-heal + scratch ──────────────────────

console.log("[sprint-8f] Branch 1 — scroll-2 turn-in");

caseName("branch 1 fires at onStep:scroll-2, grants greater-heal, sets zim-scroll-1", () => {
  const s0 = stateOnStep("scroll-2");
  const r = resolveQuestDialogue(s0, "zim_the_wizard");
  truthy(r, "resolver returned non-null");
  contains(r!.lines.join("\n"), "Greater Heal", "spell named in lines");
  truthy(
    r!.state.player.knownSpells?.includes("greater-heal"),
    "greater-heal in knownSpells"
  );
  truthy(
    r!.state.player.quests!["way-of-thoth"].scratch["zim-scroll-1"],
    "scratch zim-scroll-1 set"
  );
});

// ── 3. Re-talk — no double-award ──────────────────────────────

caseName("re-talk at scroll-2: lines repeat, no double-award", () => {
  const s0 = stateOnStep("scroll-2");
  const r1 = resolveQuestDialogue(s0, "zim_the_wizard");
  const r2 = resolveQuestDialogue(r1!.state, "zim_the_wizard");
  truthy(r2, "second resolve non-null");
  eq(r2!.lines, r1!.lines, "same lines");
  eq(
    r2!.state.player.knownSpells?.filter((s: string) => s === "greater-heal").length,
    1,
    "greater-heal appears exactly once (no duplicate)"
  );
});

// ── 4. Extension pattern — null pre-quest ─────────────────────

console.log("[sprint-8f] Extension pattern (no fallback)");

caseName("pre-quest resolveQuestDialogue returns null (no fallback defined)", () => {
  const fresh = createInitialWorldState("Tester");
  const r = resolveQuestDialogue(fresh, "zim_the_wizard");
  falsy(r, "returns null when quest not accepted");
});

// ── 5. Branch 15 — questCompleted ─────────────────────────────

console.log("[sprint-8f] Branch 15 — threshold");

caseName("branch 15 fires when questCompleted: true", () => {
  const s = stateCompleted();
  const r = resolveQuestDialogue(s, "zim_the_wizard");
  truthy(r, "non-null");
  contains(r!.lines.join("\n"), "You have all fifteen", "threshold opening line");
  contains(r!.lines.join("\n"), "binding rite", "binding rite mentioned");
});

// ── 6. Circle unlock wiring ───────────────────────────────────

console.log("[sprint-8f] Circle unlock wiring");

const CIRCLE_BY_SCROLL: Record<number, 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8> = {
  1: 1, 3: 2, 5: 3, 7: 4, 9: 5, 11: 6, 13: 7, 15: 8,
};

caseName("odd scrolls have correct unlockCircle on reward", () => {
  const quest = getQuest("way-of-thoth");
  truthy(quest, "way-of-thoth registered");
  for (const [scrollStr, circle] of Object.entries(CIRCLE_BY_SCROLL)) {
    const n = Number(scrollStr);
    const step = quest!.steps[`scroll-${n}`];
    truthy(step, `scroll-${n} step exists`);
    eq(
      step.reward?.unlockCircle,
      circle,
      `scroll-${n} unlockCircle === ${circle}`
    );
  }
});

// ── 7. Even scrolls — no unlockCircle ────────────────────────

caseName("even scrolls have reward.unlockCircle === undefined", () => {
  const quest = getQuest("way-of-thoth");
  truthy(quest, "way-of-thoth registered");
  for (const n of [2, 4, 6, 8, 10, 12, 14]) {
    const step = quest!.steps[`scroll-${n}`];
    truthy(step, `scroll-${n} step exists`);
    eq(
      step.reward?.unlockCircle,
      undefined,
      `scroll-${n} unlockCircle undefined`
    );
  }
});

// ── 8. fireOnceKey uniqueness ─────────────────────────────────

console.log("[sprint-8f] fireOnceKey uniqueness");

caseName("all 15 fireOnceKey values are distinct", () => {
  const d = getQuestDialogue("zim_the_wizard");
  truthy(d, "zim_the_wizard registered");
  const keys = d!.branches.map(b => b.fireOnceKey ?? b.id);
  eq(keys.length, 15, "15 branches total");
  const unique = new Set(keys);
  eq(unique.size, 15, "all 15 fireOnceKey values are distinct");
});

// ── Tally ─────────────────────────────────────────────────────

console.log();
if (failures === 0) {
  console.log(`[sprint-8f] ✓ all cases passed`);
  process.exit(0);
} else {
  console.error(`[sprint-8f] ✗ ${failures} case(s) failed`);
  process.exit(1);
}
