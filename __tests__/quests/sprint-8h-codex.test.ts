// ============================================================
// LIVING EAMON — Sprint 8h acceptance tests: THE WAY codex
//
// Run via:
//   npx tsx __tests__/quests/sprint-8h-codex.test.ts
//
// Coverage:
//   1. renderTheWayCodex: no-quest state shows blank journal
//   2. After scroll-1: faction creed visible
//   3. Scroll list shows READ/FOUND/SEALED correctly
//   4. Stobaean Fragments hidden if none delivered, shown if delivered
//   5. Logos Teleios only after scroll-14
//   6. Network only shows met allies
//   7. Circle Reveals show opened/sealed correctly
//   8. Black Vellum stub appears after 10+ scrolls
//   9. Prophecy only after scroll-15
//  10. Title section only after quest completed
//  11. resolveCodexCommand dispatches THE WAY, WAY, TEACHINGS
//  12. resolveCodexCommand returns null for unknown commands
// ============================================================

import "../../lib/quests/load";
import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState } from "../../lib/gameState";
import { newQuestState } from "../../lib/quests/types";
import { renderTheWayCodex } from "../../lib/quests/lines/way-of-thoth-codex";
import { resolveCodexCommand } from "../../lib/quests/codex";

let failures = 0;

function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function falsy(actual: unknown, label: string): void {
  if (actual) throw new Error(`assert ${label} — expected falsy, got ${actual}`);
}
function contains(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(
      `assert ${label} — expected to contain ${JSON.stringify(needle)}; ` +
      `first 200 chars: ${JSON.stringify(haystack.slice(0, 200))}`
    );
  }
}
function notContains(haystack: string, needle: string, label: string): void {
  if (haystack.includes(needle)) {
    throw new Error(`assert ${label} — expected NOT to contain ${JSON.stringify(needle)}`);
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

function makeState(overrides: {
  completedSteps?: string[];
  scratch?: Record<string, string | number | boolean>;
  status?: "active" | "completed" | "failed";
  scrollsRead?: Record<string, { firstReadAt: string; riddlesPassed: string[] }>;
  knownCircles?: number[];
}): WorldState {
  const base = createInitialWorldState();
  const qs = overrides.status !== undefined || (overrides.completedSteps?.length ?? 0) > 0
    ? newQuestState("scroll-1", "legacy")
    : undefined;

  if (qs) {
    if (overrides.completedSteps) qs.completedSteps = overrides.completedSteps;
    if (overrides.scratch) qs.scratch = overrides.scratch;
    if (overrides.status) qs.status = overrides.status;
  }

  return {
    ...base,
    player: {
      ...base.player,
      quests: qs ? { "way-of-thoth": qs } : {},
      scrollsRead: overrides.scrollsRead ?? {},
      knownCircles: overrides.knownCircles ?? [],
    },
  };
}

// ── 1. No quest: blank journal ────────────────────────────────
console.log("\n[sprint-8h] No quest state — blank journal");
caseName("blank journal when quest not accepted", () => {
  const state = makeState({});
  const out = renderTheWayCodex(state);
  contains(out, "THE WAY OF THOTH", "banner present");
  contains(out, "blank", "blank journal message");
  notContains(out, "THE DOCTRINE", "no creed yet");
});

// ── 2. Scroll-1 done: creed visible ──────────────────────────
console.log("\n[sprint-8h] After scroll-1 — faction creed");
caseName("faction creed visible after scroll-1 comprehended", () => {
  const state = makeState({ completedSteps: ["scroll-1"] });
  const out = renderTheWayCodex(state);
  contains(out, "THE DOCTRINE", "creed section header");
  contains(out, "keepers, not the wielders", "creed body");
});

// ── 3. Scroll list status badges ─────────────────────────────
console.log("\n[sprint-8h] Scroll list badges");
caseName("completed scroll shows [READ]", () => {
  const state = makeState({ completedSteps: ["scroll-1", "scroll-2"] });
  const out = renderTheWayCodex(state);
  contains(out, "[READ]", "READ badge");
  contains(out, "[ — ]", "SEALED badge for unread scrolls");
});
caseName("scroll in scrollsRead but not completed shows [FOUND]", () => {
  const state = makeState({
    completedSteps: ["scroll-1"],
    scrollsRead: { "thoth-5": { firstReadAt: "2026-01-01", riddlesPassed: [] } },
  });
  const out = renderTheWayCodex(state);
  contains(out, "[FOUND]", "FOUND badge for read-but-not-stepped scroll");
});

// ── 4. Stobaean Fragments ─────────────────────────────────────
console.log("\n[sprint-8h] Stobaean Fragments");
caseName("fragments section hidden when none delivered", () => {
  const state = makeState({ completedSteps: ["scroll-1"] });
  const out = renderTheWayCodex(state);
  notContains(out, "STOBAEAN FRAGMENTS", "no fragment section with empty scratch");
});
caseName("fragments section shown when one delivered", () => {
  const state = makeState({
    completedSteps: ["scroll-1", "scroll-2"],
    scratch: { "sh-2-1-delivered": true },
  });
  const out = renderTheWayCodex(state);
  contains(out, "STOBAEAN FRAGMENTS", "fragment section header");
  contains(out, "On Virtue", "fragment title");
  contains(out, "Old Bram", "fragment NPC");
});

// ── 5. Logos Teleios ─────────────────────────────────────────
console.log("\n[sprint-8h] Logos Teleios");
caseName("Logos Teleios hidden before scroll-14", () => {
  const state = makeState({ completedSteps: ["scroll-1"] });
  const out = renderTheWayCodex(state);
  notContains(out, "LOGOS TELEIOS", "no Logos before scroll-14");
});
caseName("Logos Teleios visible after scroll-14 comprehended", () => {
  const steps = Array.from({ length: 14 }, (_, i) => `scroll-${i + 1}`);
  const state = makeState({ completedSteps: steps });
  const out = renderTheWayCodex(state);
  contains(out, "THE LOGOS TELEIOS", "Logos section header");
  contains(out, "strange-season", "Logos body text");
});

// ── 6. Network ───────────────────────────────────────────────
console.log("\n[sprint-8h] The Network");
caseName("network hidden when no fragments delivered", () => {
  const state = makeState({ completedSteps: ["scroll-1"] });
  const out = renderTheWayCodex(state);
  notContains(out, "THE NETWORK", "no network section yet");
});
caseName("network shows ally when fragment delivered", () => {
  const state = makeState({
    completedSteps: ["scroll-1", "scroll-2"],
    scratch: { "sh-2-1-delivered": true },
  });
  const out = renderTheWayCodex(state);
  contains(out, "THE NETWORK", "network section present");
  contains(out, "Old Bram", "ally name present");
});

// ── 7. Circle Reveals ────────────────────────────────────────
console.log("\n[sprint-8h] Circle Reveals");
caseName("circle shows SEALED when not in knownCircles", () => {
  const state = makeState({ completedSteps: ["scroll-1"] });
  const out = renderTheWayCodex(state);
  contains(out, "[SEALED]", "sealed circle present");
});
caseName("circle shows OPENED when in knownCircles", () => {
  const state = makeState({
    completedSteps: ["scroll-1"],
    knownCircles: [1],
  });
  const out = renderTheWayCodex(state);
  contains(out, "[OPENED via Scroll I]", "opened circle with scroll reference");
  contains(out, "quietly and without price", "circle warning text");
});

// ── 8. Black Vellum stub ─────────────────────────────────────
console.log("\n[sprint-8h] Black Vellum stub");
caseName("Black Vellum hidden before 10 scrolls", () => {
  const state = makeState({ completedSteps: ["scroll-1"] });
  const out = renderTheWayCodex(state);
  notContains(out, "THE BLACK VELLUM", "no Vellum section early");
});
caseName("Black Vellum appears after 10 scrolls", () => {
  const steps = Array.from({ length: 10 }, (_, i) => `scroll-${i + 1}`);
  const state = makeState({ completedSteps: steps });
  const out = renderTheWayCodex(state);
  contains(out, "THE BLACK VELLUM", "Vellum section appears");
});

// ── 9. Prophecy ──────────────────────────────────────────────
console.log("\n[sprint-8h] The Prophecy");
caseName("prophecy hidden before scroll-15", () => {
  const state = makeState({ completedSteps: ["scroll-1"] });
  const out = renderTheWayCodex(state);
  notContains(out, "PROPHECY", "no prophecy early");
});
caseName("prophecy visible after scroll-15", () => {
  const steps = Array.from({ length: 15 }, (_, i) => `scroll-${i + 1}`);
  const state = makeState({ completedSteps: steps });
  const out = renderTheWayCodex(state);
  contains(out, "PROPHECY OF THE CATACLYSM", "prophecy header");
  contains(out, "by whose hand", "prophecy body");
});

// ── 10. Title after completion ────────────────────────────────
console.log("\n[sprint-8h] Earned Title");
caseName("no title section while quest active", () => {
  const state = makeState({ completedSteps: ["scroll-1"], status: "active" });
  const out = renderTheWayCodex(state);
  notContains(out, "EARNED TITLE", "no title while active");
});
caseName("default title Keeper of the Fifteenth Word on completion", () => {
  const steps = Array.from({ length: 15 }, (_, i) => `scroll-${i + 1}`);
  const state = makeState({ completedSteps: steps, status: "completed" });
  const out = renderTheWayCodex(state);
  contains(out, "EARNED TITLE", "title section present");
  contains(out, "Keeper of the Fifteenth Word", "default title");
});
caseName("bind capstone shows Herald title", () => {
  const steps = Array.from({ length: 15 }, (_, i) => `scroll-${i + 1}`);
  const state = makeState({
    completedSteps: steps,
    status: "completed",
    scratch: { "capstone-choice": "bind" },
  });
  const out = renderTheWayCodex(state);
  contains(out, "Herald of the Bound Book", "bind capstone title");
});

// ── 11. resolveCodexCommand dispatches correctly ──────────────
console.log("\n[sprint-8h] resolveCodexCommand dispatch");
caseName("resolves THE WAY", () => {
  const state = makeState({});
  const out = resolveCodexCommand(state, "THE WAY");
  truthy(out !== null, "resolves THE WAY");
  contains(out!, "THE WAY OF THOTH", "correct codex rendered");
});
caseName("resolves WAY", () => {
  const state = makeState({});
  const out = resolveCodexCommand(state, "WAY");
  truthy(out !== null, "resolves WAY");
});
caseName("resolves TEACHINGS", () => {
  const state = makeState({});
  const out = resolveCodexCommand(state, "TEACHINGS");
  truthy(out !== null, "resolves TEACHINGS");
});

// ── 12. Unknown command returns null ─────────────────────────
console.log("\n[sprint-8h] resolveCodexCommand unknown");
caseName("unknown command returns null", () => {
  const state = makeState({});
  const out = resolveCodexCommand(state, "STAG");
  falsy(out, "null for unknown");
});

// ── Summary ───────────────────────────────────────────────────
if (failures > 0) {
  console.error(`\n[sprint-8h] ✗ ${failures} case(s) failed`);
  process.exit(1);
} else {
  console.log("\n[sprint-8h] ✓ all cases passed");
}
