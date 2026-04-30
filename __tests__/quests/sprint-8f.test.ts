// ============================================================
// LIVING EAMON — Sprint 8f acceptance tests (Wave 1.5)
//
// Run via:
//   npx tsx __tests__/quests/sprint-8f.test.ts
//
// Coverage:
//   1. QuestNPCDialogue.fallback is now optional. Omitting it makes
//      the resolver return null on non-matching turns (extension
//      pattern), so the caller falls through to legacy NPCScript.
//   2. SH 1.1 (Aldric / old_mercenary, scroll-5) fires correctly.
//   3. SH 18.3 (Vivian / vivian, scroll-4) fires correctly.
//   4. SH 19.7 (Hokas / hokas_tokas, scroll-6) fires correctly.
//   5. Each extension NPC at the WRONG step returns null (fall-through).
//   6. Each extension NPC's fire-once gating works (no double-award).
//   7. Quest engine `validateRegistry()` still ok with 14 fragments.
// ============================================================

import "../../lib/quests/load"; // register quest lines + dialogues
import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState, PlayerState } from "../../lib/gameState";
import { newQuestState } from "../../lib/quests/types";
import { resolveQuestDialogue, getQuestDialogue } from "../../lib/quests/dialogue";
import { validateRegistry } from "../../lib/quests/engine";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`assert ${label} — expected ${e}, got ${a}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function isNull(actual: unknown, label: string): void {
  if (actual !== null) throw new Error(`assert ${label} — expected null, got ${JSON.stringify(actual)}`);
}
function contains(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`assert ${label} — expected to contain ${JSON.stringify(needle)}; got ${JSON.stringify(haystack.slice(0, 200))}…`);
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

function stateOnStep(step: string, scratch: Record<string, string | number | boolean> = {}): WorldState {
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

// ── 1. Extension semantics ───────────────────────────────────

console.log("[sprint-8f] Extension dialogue semantics");

caseName("registered NPC with fallback omitted returns null on non-matching turn", () => {
  // old_mercenary's branch fires only at scroll-5; on scroll-2 it
  // should return null (legacy fall-through), not a fallback array.
  const s = stateOnStep("scroll-2");
  const r = resolveQuestDialogue(s, "old_mercenary");
  isNull(r, "extension fallthrough returns null");
});

caseName("registered NPC with fallback omitted returns null when quest not accepted", () => {
  const fresh = createInitialWorldState("Tester");
  for (const id of ["old_mercenary", "hokas_tokas", "vivian"]) {
    const r = resolveQuestDialogue(fresh, id);
    isNull(r, `${id} pre-acceptance fall-through`);
  }
});

caseName("registered NPC with fallback PROVIDED still returns fallback (8c/8e behavior preserved)", () => {
  // old_bram (Sprint 8e) has a fallback array; verify nothing broke.
  const s = stateOnStep("scroll-3"); // wrong step
  const r = resolveQuestDialogue(s, "old_bram");
  truthy(r, "non-null");
  truthy(r!.lines.some(l => l.includes("alms-corner")), "fallback present");
});

// ── 2-4. Three extension fragments fire ──────────────────────

console.log("[sprint-8f] SH 1.1 (Aldric) — scroll-5");

caseName("old_mercenary at scroll-5: fires SH 1.1 + +1 Illumination + chronicle", () => {
  const s0 = stateOnStep("scroll-5");
  eq(s0.player.picssi.illumination, 0, "illumination starts 0");
  const r = resolveQuestDialogue(s0, "old_mercenary");
  truthy(r, "non-null");
  contains(r!.lines.join("\n"), "first virtue is to remain", "kernel line");
  contains(r!.lines.join("\n"), "SH 1.1", "fragment ID footer");
  eq(r!.state.player.picssi.illumination, 1, "+1 illumination");
  truthy(
    r!.state.player.quests!["way-of-thoth"].scratch["sh-1-1-delivered"],
    "scratch fire-once flag set"
  );
});

console.log("[sprint-8f] SH 18.3 (Vivian) — scroll-4");

caseName("vivian at scroll-4: fires SH 18.3 + +1 Illumination + chronicle", () => {
  const s0 = stateOnStep("scroll-4");
  const r = resolveQuestDialogue(s0, "vivian");
  truthy(r, "non-null");
  contains(r!.lines.join("\n"), "more doors than a thief has fingers", "kernel line");
  contains(r!.lines.join("\n"), "SH 18.3", "fragment ID footer");
  eq(r!.state.player.picssi.illumination, 1, "+1 illumination");
  truthy(
    r!.state.player.quests!["way-of-thoth"].scratch["sh-18-3-delivered"],
    "scratch fire-once flag set"
  );
});

console.log("[sprint-8f] SH 19.7 (Hokas) — scroll-6");

caseName("hokas_tokas at scroll-6: fires SH 19.7 + +1 Illumination + chronicle", () => {
  const s0 = stateOnStep("scroll-6");
  const r = resolveQuestDialogue(s0, "hokas_tokas");
  truthy(r, "non-null");
  contains(r!.lines.join("\n"), "river called Forget", "kernel line");
  contains(r!.lines.join("\n"), "SH 19.7", "fragment ID footer");
  eq(r!.state.player.picssi.illumination, 1, "+1 illumination");
  truthy(
    r!.state.player.quests!["way-of-thoth"].scratch["sh-19-7-delivered"],
    "scratch fire-once flag set"
  );
});

// ── 5. Wrong-step fall-through for each extension NPC ────────

console.log("[sprint-8f] Wrong-step fall-through (extension pattern)");

caseName("old_mercenary at scroll-7 (advanced past scroll-5): falls through to legacy", () => {
  const s = stateOnStep("scroll-7");
  isNull(resolveQuestDialogue(s, "old_mercenary"), "fall-through");
});

caseName("vivian at scroll-2 (before scroll-4): falls through to legacy", () => {
  const s = stateOnStep("scroll-2");
  isNull(resolveQuestDialogue(s, "vivian"), "fall-through");
});

caseName("hokas_tokas at scroll-15 (long past scroll-6): falls through to legacy", () => {
  const s = stateOnStep("scroll-15");
  isNull(resolveQuestDialogue(s, "hokas_tokas"), "fall-through");
});

// ── 6. Fire-once gating on extension fragments ───────────────

console.log("[sprint-8f] Fire-once gating on extension fragments");

caseName("old_mercenary re-talked at scroll-5: lines repeat, NO re-award", () => {
  const s0 = stateOnStep("scroll-5");
  const r1 = resolveQuestDialogue(s0, "old_mercenary");
  const r2 = resolveQuestDialogue(r1!.state, "old_mercenary");
  truthy(r2, "non-null");
  eq(r2!.lines, r1!.lines, "same lines");
  eq(r2!.state.player.picssi.illumination, 1, "still 1 (no double-award)");
});

// ── 7. Validator still clean ─────────────────────────────────

console.log("[sprint-8f] Registry validator");

caseName("validateRegistry() returns ok with 14 fragments wired", () => {
  const v = validateRegistry();
  if (!v.ok) {
    throw new Error(`validateRegistry returned errors: ${v.errors.join(", ")}`);
  }
});

// ── Tally ────────────────────────────────────────────────────

console.log();
if (failures === 0) {
  console.log(`[sprint-8f] ✓ all cases passed`);
  process.exit(0);
} else {
  console.error(`[sprint-8f] ✗ ${failures} case(s) failed`);
  process.exit(1);
}
