// ============================================================
// LIVING EAMON — Vivian Arc quest line (KARMA Sprint 8d)
//
// Proof of the **atom-triggers-quest** pattern. Vivian's first
// meeting at the Notice Board lives as a karma atom
// (`scripts/balance/library/vivian-notice-board-meet.json`); the
// atom sets `flagsLife.vivian_first_met`. This quest's
// `acceptanceTrigger` watches any subsequent `command` event and
// auto-accepts when that flag is set.
//
// The quest then completes when the player triggers the Vivian
// rescue-bond atom (which sets `flagsLife.vivian_cave_bond`).
// Both transitions are flag-driven; the quest never inspects atom
// internals — proving the boundary between the karma-atom system
// (lib/karma/) and the quest engine (lib/quests/).
//
// Stub rewards are chronicle-only. Sprint 8f tightens the rewards
// once Vivian's full arc is wired.
// ============================================================

import { registerQuest } from "../engine";
import type { Quest } from "../types";

const VIVIAN_ARC: Quest = {
  id: "vivian-arc",
  title: "Vivian's Threads",
  blurb:
    "A young thief crossed your path at the Notice Board. There was something there. " +
    "You'll see her again — the world is small enough.",
  scope: "life",

  // Auto-accepts on the first command event after the player has met
  // Vivian (i.e., the notice-board atom resolved with `vivian_first_met`).
  // Any verb the player types post-atom will land here.
  acceptanceTrigger: {
    event: "command",
    guard: (s) => Boolean(s.player.flagsLife?.["vivian_first_met"]),
  },

  acceptReward: {
    chronicle:
      "You met a thief named Vivian at the Notice Board. The conversation lasted " +
      "less than a minute and you have not stopped thinking about it.",
  },

  startStep: "step-bond",
  steps: {
    "step-bond": {
      id: "step-bond",
      hint: "Cross paths with Vivian again — the kind of crossing that leaves a mark.",
      // Completes on any command event after the rescue-bond atom has
      // resolved (which sets `flagsLife.vivian_cave_bond`).
      trigger: {
        event: "command",
        guard: (s) => Boolean(s.player.flagsLife?.["vivian_cave_bond"]),
      },
      reward: {
        chronicle:
          "You and Vivian survived something together. There is now a person in the " +
          "world who would split bread with you in the dark and call it good.",
      },
      nextStep: null,
    },
  },

  completionChronicle:
    "Vivian is a thread you carry now. Wherever she goes, a piece of this life goes with her.",
};

registerQuest(VIVIAN_ARC);

export default VIVIAN_ARC;
