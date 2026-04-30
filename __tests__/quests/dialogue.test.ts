// ============================================================
// LIVING EAMON — Quest dialogue resolver tests (Sprint 8c)
//
// No project-wide test runner is configured. Run via:
//   npx tsx __tests__/quests/dialogue.test.ts
//
// Each `case(name, fn)` runs in isolation with a fresh registry.
// Assertions throw on failure; the script exits non-zero if any
// case fails.
// ============================================================

import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState, PlayerState } from "../../lib/gameState";
import { newQuestState } from "../../lib/quests/types";
import {
  registerQuestDialogue,
  resolveQuestDialogue,
  _resetQuestDialogueRegistry,
  type QuestNPCDialogue,
} from "../../lib/quests/dialogue";

// ── Tiny test harness ─────────────────────────────────────────

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`assert ${label} — expected ${e}, got ${a}`);
  }
}

function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}

function isNull(actual: unknown, label: string): void {
  if (actual !== null) throw new Error(`assert ${label} — expected null, got ${JSON.stringify(actual)}`);
}

function caseName(name: string, fn: () => void): void {
  _resetQuestDialogueRegistry();
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

function fixtureState(opts: {
  questId?: string;
  step?: string;
  completedSteps?: string[];
  scratch?: Record<string, string | number | boolean>;
  status?: "active" | "completed" | "failed";
} = {}): WorldState {
  const base = createInitialWorldState("Tester");
  if (!opts.questId) return base;
  const qs = newQuestState(opts.step ?? "step-0", "legacy");
  if (opts.step) qs.currentStep = opts.step;
  if (opts.completedSteps) qs.completedSteps = opts.completedSteps;
  if (opts.scratch) qs.scratch = { ...opts.scratch };
  if (opts.status) qs.status = opts.status;
  if (opts.status === "completed") qs.currentStep = null;
  const player: PlayerState = {
    ...base.player,
    quests: { ...(base.player.quests ?? {}), [opts.questId]: qs },
  };
  return { ...base, player };
}

function dialogue3Stage(): QuestNPCDialogue {
  return {
    npcId: "zim",
    branches: [
      {
        id: "stage-1-greeting",
        when: { questId: "way-of-thoth", onStep: "step-1" },
        lines: ["Stage 1: the first scroll glints in your hand."],
      },
      {
        id: "stage-2-greeting",
        when: { questId: "way-of-thoth", onStep: "step-2" },
        lines: ["Stage 2: you walk further into the Way."],
      },
      {
        id: "post-completion",
        when: { questId: "way-of-thoth", questCompleted: true },
        lines: ["The fifteen are read. There is little left to say."],
      },
    ],
    fallback: ["Zim looks up from his ledger. \"You'll know when there's something to say.\""],
  };
}

// ── Cases ─────────────────────────────────────────────────────

console.log("[quest-dialogue] resolveQuestDialogue");

caseName("returns null when NPC is not registered", () => {
  const state = fixtureState();
  isNull(resolveQuestDialogue(state, "unregistered_npc"), "unregistered NPC");
});

caseName("returns fallback when NPC is registered but no branch matches", () => {
  registerQuestDialogue(dialogue3Stage());
  const state = fixtureState(); // no quest accepted
  const result = resolveQuestDialogue(state, "zim");
  truthy(result, "result is non-null");
  eq(result!.lines, dialogue3Stage().fallback, "fallback lines");
});

caseName("stage-aware: matches step-1 branch when currentStep === step-1", () => {
  registerQuestDialogue(dialogue3Stage());
  const state = fixtureState({ questId: "way-of-thoth", step: "step-1" });
  const result = resolveQuestDialogue(state, "zim");
  truthy(result, "result is non-null");
  eq(result!.lines[0], "Stage 1: the first scroll glints in your hand.", "step-1 lines");
});

caseName("stage-aware: matches step-2 branch when currentStep advances", () => {
  registerQuestDialogue(dialogue3Stage());
  const state = fixtureState({ questId: "way-of-thoth", step: "step-2" });
  const result = resolveQuestDialogue(state, "zim");
  truthy(result, "result is non-null");
  eq(result!.lines[0], "Stage 2: you walk further into the Way.", "step-2 lines");
});

caseName("stage-aware: matches questCompleted branch", () => {
  registerQuestDialogue(dialogue3Stage());
  const state = fixtureState({
    questId: "way-of-thoth",
    status: "completed",
    completedSteps: ["step-1", "step-2"],
  });
  const result = resolveQuestDialogue(state, "zim");
  truthy(result, "result is non-null");
  eq(result!.lines[0], "The fifteen are read. There is little left to say.", "completion lines");
});

caseName("declaration order: first match wins when multiple could match", () => {
  registerQuestDialogue({
    npcId: "zim",
    branches: [
      {
        id: "early",
        when: { questId: "q", onStep: "s" },
        lines: ["EARLY"],
      },
      {
        id: "late",
        when: { questId: "q", onStep: "s" },
        lines: ["LATE"],
      },
    ],
    fallback: ["nope"],
  });
  const state = fixtureState({ questId: "q", step: "s" });
  const result = resolveQuestDialogue(state, "zim");
  eq(result!.lines, ["EARLY"], "first declared branch wins");
});

caseName("fire-once gating: reward fires once, lines repeat", () => {
  registerQuestDialogue({
    npcId: "zim",
    branches: [
      {
        id: "stage-bonus",
        when: { questId: "q", onStep: "s" },
        lines: ["bonus given"],
        fireOnceReward: { gold: 50 },
      },
    ],
    fallback: ["nope"],
  });
  const state = fixtureState({ questId: "q", step: "s" });
  const startGold = state.player.gold;

  const r1 = resolveQuestDialogue(state, "zim");
  truthy(r1, "r1 non-null");
  eq(r1!.lines, ["bonus given"], "r1 lines");
  eq(r1!.state.player.gold, startGold + 50, "gold awarded once");
  truthy(r1!.state.player.quests!["q"]!.scratch["stage-bonus"], "scratch flag set");

  const r2 = resolveQuestDialogue(r1!.state, "zim");
  truthy(r2, "r2 non-null");
  eq(r2!.lines, ["bonus given"], "r2 lines repeat");
  eq(r2!.state.player.gold, startGold + 50, "gold NOT awarded twice");
});

caseName("fire-once with custom fireOnceKey", () => {
  registerQuestDialogue({
    npcId: "zim",
    branches: [
      {
        id: "branch-id-A",
        when: { questId: "q", onStep: "s" },
        lines: ["once"],
        fireOnceReward: { gold: 10 },
        fireOnceKey: "shared-key",
      },
    ],
    fallback: ["nope"],
  });
  const state = fixtureState({ questId: "q", step: "s", scratch: { "shared-key": true } });
  const startGold = state.player.gold;
  const result = resolveQuestDialogue(state, "zim");
  truthy(result, "result non-null");
  eq(result!.lines, ["once"], "lines still show");
  eq(result!.state.player.gold, startGold, "no reward — custom key already fired");
});

caseName("questNotAccepted: matches when player has no QuestState for this quest", () => {
  registerQuestDialogue({
    npcId: "zim",
    branches: [
      {
        id: "first-meeting",
        when: { questId: "q", questNotAccepted: true },
        lines: ["have we met?"],
      },
    ],
    fallback: ["fallback"],
  });
  const state = fixtureState();
  const result = resolveQuestDialogue(state, "zim");
  eq(result!.lines, ["have we met?"], "questNotAccepted matched");
});

caseName("questNotAccepted: does NOT match once quest is accepted", () => {
  registerQuestDialogue({
    npcId: "zim",
    branches: [
      {
        id: "first-meeting",
        when: { questId: "q", questNotAccepted: true },
        lines: ["have we met?"],
      },
    ],
    fallback: ["already known"],
  });
  const state = fixtureState({ questId: "q", step: "s" });
  const result = resolveQuestDialogue(state, "zim");
  eq(result!.lines, ["already known"], "fallback after acceptance");
});

caseName("afterStepCompleted: matches once a step is in completedSteps", () => {
  registerQuestDialogue({
    npcId: "zim",
    branches: [
      {
        id: "post-step",
        when: { questId: "q", afterStepCompleted: "s1" },
        lines: ["s1 done"],
      },
    ],
    fallback: ["fallback"],
  });
  const before = fixtureState({ questId: "q", step: "s2", completedSteps: [] });
  eq(resolveQuestDialogue(before, "zim")!.lines, ["fallback"], "no match before completion");

  const after = fixtureState({ questId: "q", step: "s2", completedSteps: ["s1"] });
  eq(resolveQuestDialogue(after, "zim")!.lines, ["s1 done"], "matches after completion");
});

caseName("onStep does NOT match when quest status is completed", () => {
  registerQuestDialogue(dialogue3Stage());
  const state = fixtureState({
    questId: "way-of-thoth",
    step: "step-1",
    status: "completed",
  });
  // status === "completed" forces currentStep = null in fixtureState; the
  // step-1 branch should not fire even though we asked for step "step-1".
  const result = resolveQuestDialogue(state, "zim");
  eq(result!.lines[0], "The fifteen are read. There is little left to say.", "completion wins over step");
});

caseName("registerQuestDialogue throws on duplicate npcId", () => {
  registerQuestDialogue({ npcId: "zim", branches: [], fallback: ["a"] });
  let threw = false;
  try {
    registerQuestDialogue({ npcId: "zim", branches: [], fallback: ["b"] });
  } catch {
    threw = true;
  }
  truthy(threw, "duplicate registration throws");
});

// ── Exit ──────────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n${failures} case(s) failed.`);
  process.exit(1);
} else {
  console.log("\nAll cases passed.");
}
