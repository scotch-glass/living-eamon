// ============================================================
// LIVING EAMON — The Way of Thoth (KARMA Sprint 8d scaffold)
//
// 15-step legacy quest covering the fifteen Scrolls of Thoth.
// SPRINT 8d ships **stub rewards only** — chronicle lines, no
// Circle unlocks, no Stobaean Fragments, no NPC introductions.
// Sprint 8e adds Stobaean Fragments + Logos Teleios. Sprint 8f
// wires the 14 new NPCs, Zim's evolving turn-in dialogue, and the
// `unlockCircle` rewards on the appropriate stages.
//
// Acceptance: reading scroll thoth-1 auto-accepts the quest AND
// completes its first step in the same event (engine Phase 1
// auto-accept + Phase 2 step walk on the same emitQuestEvent
// invocation — see lib/quests/engine.ts).
//
// Step-id convention: `scroll-N` for N in 1..15. Each step's
// trigger is a `scroll-read` event with `target: "thoth-N"`.
// ============================================================

import { registerQuest } from "../engine";
import type { Quest, QuestStep } from "../types";

const SCROLL_TITLES: Record<number, string> = {
  1:  "The Way of Thoth",
  2:  "The Seven Principles of Thoth",
  3:  "Mental Transmutation",
  4:  "The All",
  5:  "The Mental Universe",
  6:  "The Divine Paradox",
  7:  '"The All" in All',
  8:  "Planes of Correspondence",
  9:  "Vibration",
  10: "Polarity",
  11: "Rhythm",
  12: "Causation",
  13: "Gender",
  14: "Mental Gender",
  15: "Thothian Axioms",
};

function buildStep(n: number): QuestStep {
  const next = n < 15 ? `scroll-${n + 1}` : null;
  return {
    id: `scroll-${n}`,
    hint:
      n === 1
        ? "A scroll has fallen into your hands. Read it; comprehend it."
        : `The next scroll waits — Scroll ${roman(n)}: ${SCROLL_TITLES[n]}.`,
    trigger: {
      event: "scroll-read",
      target: `thoth-${n}`,
      // First-pass only: rewards land once per scroll, even on re-reads.
      guard: (_s, e) => e.type === "scroll-read" && e.firstPass === true,
    },
    reward: {
      chronicle: `You read Scroll ${roman(n)} — ${SCROLL_TITLES[n]} — and felt a thread of the Way tighten.`,
    },
    nextStep: next,
  };
}

function roman(n: number): string {
  const map: Record<number, string> = {
    1: "I",  2: "II",  3: "III", 4: "IV", 5: "V",
    6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X",
    11: "XI", 12: "XII", 13: "XIII", 14: "XIV", 15: "XV",
  };
  return map[n] ?? String(n);
}

const steps: Record<string, QuestStep> = {};
for (let n = 1; n <= 15; n++) steps[`scroll-${n}`] = buildStep(n);

const WAY_OF_THOTH: Quest = {
  id: "way-of-thoth",
  title: "The Way of Thoth",
  blurb:
    "Fifteen scrolls. Fifteen hands. The Book of Thoth was sundered so that no " +
    "single soul could bear the weight of the whole. Walk the Way and the scrolls " +
    "will find you.",
  scope: "legacy",

  // Reading thoth-1 (firstPass) accepts the quest and completes step 1
  // on the same event. Subsequent scrolls advance one step each.
  acceptanceTrigger: {
    event: "scroll-read",
    target: "thoth-1",
    guard: (_s, e) => e.type === "scroll-read" && e.firstPass === true,
  },

  acceptReward: {
    legacyChronicle:
      "The Way found you. Whatever happens next, the threads of the world are " +
      "different now — and so is what you can carry across death.",
  },

  startStep: "scroll-1",
  steps,

  completionChronicle:
    "You have read all fifteen Scrolls of Thoth. The Word lives in you. The choice — " +
    "to bind, to keep, or to burn — waits at the threshold.",
};

registerQuest(WAY_OF_THOTH);

export default WAY_OF_THOTH;
