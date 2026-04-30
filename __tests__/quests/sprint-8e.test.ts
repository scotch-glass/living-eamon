// ============================================================
// LIVING EAMON — Sprint 8e acceptance tests
//
// Run via:
//   npx tsx __tests__/quests/sprint-8e.test.ts
//
// Coverage:
//   1. All 11 new-NPC fragment dialogues are registered.
//   2. Talking to old_bram at scroll-2 fires SH 2.1 with +1 Illumination
//      + chronicle + scratch[fireKey] = true.
//   3. Re-talking re-shows lines but does NOT re-award Illumination.
//   4. Talking at the wrong step returns the fallback.
//   5. Talking before quest acceptance returns the fallback.
//   6. Brother Inan at scroll-14 delivers SH 3.3 + Logos Teleios.
//   7. Mother Khe-Anun at scroll-15 delivers SH 27.1.
//   8. Legacy-scope scratch survives applyPlayerDeath (so the
//      once-per-legacy-lifetime guarantee holds across rebirth).
//   9. All 14 SH fragment files exist on disk.
//  10. Logos Teleios files exist at the expected paths.
// ============================================================

import { existsSync } from "fs";
import { join } from "path";
import "../../lib/quests/load"; // register quest lines + dialogues
import { createInitialWorldState, applyPlayerDeath } from "../../lib/gameState";
import type { WorldState, PlayerState } from "../../lib/gameState";
import { newQuestState } from "../../lib/quests/types";
import { resolveQuestDialogue, getQuestDialogue } from "../../lib/quests/dialogue";

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

// ── 1. Registry coverage ─────────────────────────────────────

console.log("[sprint-8e] Fragment dialogue registry");

const NEW_NPC_IDS = [
  "old_bram",
  "sister_hela",
  "maelis_the_seer",
  "cassian_the_gravewright",
  "tavren_of_the_long_road",
  "goodwife_yssa",
  "master_orin_quill",
  "rhonen_the_merchant",
  "tava_the_lash",
  "brother_inan",
  "mother_khe_anun",
];

caseName("all 11 new-NPC fragment dialogues are registered", () => {
  for (const id of NEW_NPC_IDS) {
    truthy(getQuestDialogue(id), `${id} registered`);
  }
});

caseName("Sprint-8f extension NPCs are registered with fallback omitted (extension-style)", () => {
  // Sprint 8f wired Aldric/Hokas/Vivian as extension-style dialogues:
  // they are registered, but `fallback` is undefined so the resolver
  // falls through to the legacy NPCScript matcher on non-matching turns.
  for (const id of ["old_mercenary", "hokas_tokas", "vivian"]) {
    const d = getQuestDialogue(id);
    truthy(d, `${id} registered`);
    eq(d!.fallback, undefined, `${id} fallback omitted (extension-style)`);
  }
});

// ── 2-3. Old Bram fire-once + repeat behavior ────────────────

console.log("[sprint-8e] Old Bram (SH 2.1) — fire-once semantics");

caseName("old_bram at scroll-2: fires SH 2.1 + +1 Illumination + chronicle", () => {
  const s0 = stateOnStep("scroll-2");
  eq(s0.player.picssi.illumination, 0, "illumination starts 0");

  const r = resolveQuestDialogue(s0, "old_bram");
  truthy(r, "resolver returned non-null");
  contains(r!.lines.join("\n"), "first virtue is to know what you owe", "kernel line present");
  contains(r!.lines.join("\n"), "SH 2.1", "fragment ID footer");

  eq(r!.state.player.picssi.illumination, 1, "+1 illumination");
  truthy(
    r!.state.player.quests!["way-of-thoth"].scratch["sh-2-1-delivered"],
    "scratch fire-once flag set"
  );
  truthy(
    r!.state.chronicleLog.length > s0.chronicleLog.length,
    "chronicle line added"
  );
});

caseName("old_bram re-talked at scroll-2: lines repeat, NO re-award", () => {
  const s0 = stateOnStep("scroll-2");
  const r1 = resolveQuestDialogue(s0, "old_bram");
  const r2 = resolveQuestDialogue(r1!.state, "old_bram");

  truthy(r2, "second resolve returned non-null");
  eq(r2!.lines, r1!.lines, "same lines");
  eq(r2!.state.player.picssi.illumination, 1, "still 1 (no double-award)");
  eq(
    r2!.state.chronicleLog.length,
    r1!.state.chronicleLog.length,
    "no extra chronicle entry"
  );
});

// ── 4. Wrong-step fallback ───────────────────────────────────

console.log("[sprint-8e] Wrong-step fallback");

caseName("old_bram at scroll-3: returns fallback (not yet, or no longer)", () => {
  const s = stateOnStep("scroll-3");
  const r = resolveQuestDialogue(s, "old_bram");
  truthy(r, "non-null");
  contains(r!.lines.join("\n"), "alms-corner", "fallback present");
  // No SH 2.1 kernel
  falsy(
    r!.lines.join("\n").includes("first virtue is to know what you owe"),
    "kernel NOT in fallback"
  );
});

// ── 5. Pre-acceptance fallback ───────────────────────────────

caseName("old_bram before quest accepted: returns fallback", () => {
  const fresh = createInitialWorldState("Tester");
  const r = resolveQuestDialogue(fresh, "old_bram");
  truthy(r, "non-null");
  contains(r!.lines.join("\n"), "alms-corner", "fallback present");
});

// ── 6. Brother Inan + Logos Teleios ──────────────────────────

console.log("[sprint-8e] Brother Inan (SH 3.3 + Logos Teleios) — scroll-14");

caseName("brother_inan at scroll-14: delivers SH 3.3 + Logos Teleios Lament", () => {
  const s = stateOnStep("scroll-14");
  const r = resolveQuestDialogue(s, "brother_inan");
  truthy(r, "non-null");

  const text = r!.lines.join("\n");
  contains(text, "strange-season", "SH 3.3 kernel");
  contains(text, "Logos Teleios", "codex named");
  contains(text, "Lament", "Lament titled");
  contains(text, "calling-home", "Lament closing motion");
  contains(text, "SH 3.3", "fragment ID footer");

  eq(r!.state.player.picssi.illumination, 1, "+1 illumination (SH 3.3)");
  truthy(
    r!.state.player.quests!["way-of-thoth"].scratch["sh-3-3-delivered"],
    "scratch fire-once flag set"
  );
});

// ── 7. Mother Khe-Anun ───────────────────────────────────────

console.log("[sprint-8e] Mother Khe-Anun (SH 27.1) — scroll-15");

caseName("mother_khe_anun at scroll-15: delivers SH 27.1", () => {
  const s = stateOnStep("scroll-15");
  const r = resolveQuestDialogue(s, "mother_khe_anun");
  truthy(r, "non-null");
  contains(r!.lines.join("\n"), "all that is bound shall be loosed", "kernel line");
  contains(r!.lines.join("\n"), "SH 27.1", "fragment ID footer");
  eq(r!.state.player.picssi.illumination, 1, "+1 illumination");
});

// ── 8. Cross-rebirth scratch survival ────────────────────────

console.log("[sprint-8e] Legacy-scope scratch survives rebirth");

caseName("once-per-legacy-lifetime: scratch survives applyPlayerDeath", () => {
  // Talk to Old Bram → scratch[sh-2-1-delivered] = true
  const s0 = stateOnStep("scroll-2");
  const r1 = resolveQuestDialogue(s0, "old_bram");
  truthy(
    r1!.state.player.quests!["way-of-thoth"].scratch["sh-2-1-delivered"],
    "fire-once flag set pre-rebirth"
  );
  eq(r1!.state.player.picssi.illumination, 1, "+1 illumination pre-rebirth");

  // Die. Legacy quest survives.
  const { newState: reborn } = applyPlayerDeath(r1!.state, "test enemy");
  eq(reborn.player.picssi.illumination, 0, "illumination reset to 0 on rebirth");
  truthy(reborn.player.quests?.["way-of-thoth"], "legacy quest survives rebirth");
  truthy(
    reborn.player.quests!["way-of-thoth"].scratch["sh-2-1-delivered"],
    "fire-once flag survives rebirth"
  );

  // Walk back to scroll-2 step on the reborn hero. Re-talk to Bram.
  const reborn2: WorldState = {
    ...reborn,
    player: {
      ...reborn.player,
      quests: {
        ...(reborn.player.quests ?? {}),
        "way-of-thoth": {
          ...reborn.player.quests!["way-of-thoth"],
          currentStep: "scroll-2",
        },
      },
    },
  };
  const r2 = resolveQuestDialogue(reborn2, "old_bram");
  truthy(r2, "second-life resolve non-null");
  eq(
    r2!.state.player.picssi.illumination,
    0,
    "no second-life Illumination award (fire-once held across rebirth)"
  );
});

// ── 9-10. File existence ─────────────────────────────────────

console.log("[sprint-8e] Lore file existence");

const FRAGMENT_FILES = [
  "SH-1.1.md",
  "SH-2.1.md",
  "SH-3.3.md",
  "SH-7.4.md",
  "SH-11.2.md",
  "SH-11.4.md",
  "SH-18.3.md",
  "SH-19.7.md",
  "SH-21.6.md",
  "SH-23.5.md",
  "SH-24.2.md",
  "SH-25.8.md",
  "SH-26.5.md",
  "SH-27.1.md",
];

caseName("all 14 SH fragment files exist", () => {
  for (const f of FRAGMENT_FILES) {
    const p = join(process.cwd(), "lore/stobaean-fragments", f);
    truthy(existsSync(p), `${f} exists`);
  }
});

caseName("Stobaean fragments INDEX.md exists", () => {
  const p = join(process.cwd(), "lore/stobaean-fragments/INDEX.md");
  truthy(existsSync(p), "INDEX.md exists");
});

caseName("Logos Teleios files exist", () => {
  truthy(
    existsSync(join(process.cwd(), "lore/logos-teleios/INDEX.md")),
    "logos-teleios INDEX.md exists"
  );
  truthy(
    existsSync(join(process.cwd(), "lore/logos-teleios/the-lament.md")),
    "the-lament.md exists"
  );
});

// ── Tally ────────────────────────────────────────────────────

console.log();
if (failures === 0) {
  console.log(`[sprint-8e] ✓ all cases passed`);
  process.exit(0);
} else {
  console.error(`[sprint-8e] ✗ ${failures} case(s) failed`);
  process.exit(1);
}
