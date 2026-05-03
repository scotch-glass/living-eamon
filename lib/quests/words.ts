// ============================================================
// LIVING EAMON — The Word System (Sprint S3)
//
// Every quest acceptance is an act of giving the Word. Words are
// tracked in PlayerState.givenWords and persist across rebirth
// (per Scotch 2026-05-02 — the hero must return to honor his Word).
//
// Mechanics:
//   - createWord: built when acceptQuest fires; bakes the break-
//     penalty multiplier into the Word at swear-time so future
//     break-resolution doesn't depend on room state at break-time.
//   - Mithras-temple swears: ×2 break penalty (god of contracts).
//   - Integrity-tagged room swears: ×1.5 (S2 multiplier stacks).
//   - Fulfillment (quest completes): mark Word "fulfilled" — the
//     quest's completionReward is the integrity gain; this layer
//     just records the oath's outcome.
//   - Breaking: applyBreakWord applies the negative-integrity
//     penalty + marks the Word "broken" + fails the quest.
//
// See ~/.claude/plans/i-accidentally-submitted-the-misty-map.md §S3.
// ============================================================

import type { WorldState, PlayerState } from "../gameState";
import type { Room } from "../roomTypes";
import { applyKarma, logKarmaDelta, PICSSI_LOCATION_MULTIPLIER } from "../karma/recompute";
import type { Quest } from "./types";

export interface Word {
  /** Unique id — `${questId}@${swornAtTurn}`. */
  id: string;
  questId: string;
  questTitle: string;
  swornAtRoom: string;
  swornAtTurn: number;
  swornAt: string;
  /** Sworn before Mithras (room.deity === "mithras"). */
  mithraic: boolean;
  /** Final break-penalty multiplier baked at swear-time. */
  breakPenaltyMultiplier: number;
  status: "active" | "fulfilled" | "broken";
}

/** Base Integrity penalty for breaking a Word. Multiplied by Word.breakPenaltyMultiplier. */
export const WORD_BREAK_PENALTY_INTEGRITY = -10;
export const MITHRAIC_BREAK_MULTIPLIER = 2;

/** Compute the break-penalty multiplier for a Word at swear-time. */
export function computeBreakPenaltyMultiplier(
  room: Room | undefined
): { multiplier: number; mithraic: boolean } {
  let multiplier = 1;
  let mithraic = false;
  if (!room) return { multiplier, mithraic };
  if (room.deity === "mithras") {
    multiplier *= MITHRAIC_BREAK_MULTIPLIER;
    mithraic = true;
  }
  if (room.picssiContacts?.includes("integrity")) {
    multiplier *= PICSSI_LOCATION_MULTIPLIER;
  }
  return { multiplier, mithraic };
}

/** Build a fresh Word. Pure — does not mutate state. */
export function createWord(
  quest: Quest,
  swornAtRoom: string,
  swornAtTurn: number,
  room: Room | undefined
): Word {
  const { multiplier, mithraic } = computeBreakPenaltyMultiplier(room);
  return {
    id: `${quest.id}@${swornAtTurn}`,
    questId: quest.id,
    questTitle: quest.title,
    swornAtRoom,
    swornAtTurn,
    swornAt: new Date().toISOString(),
    mithraic,
    breakPenaltyMultiplier: multiplier,
    status: "active",
  };
}

/** Find the most recent active Word for a quest, if any. */
export function findActiveWord(
  p: PlayerState,
  questId: string
): Word | undefined {
  const words = p.givenWords ?? [];
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (w.questId === questId && w.status === "active") return w;
  }
  return undefined;
}

/** Mark the active Word for a quest as fulfilled. No-op if none. */
export function fulfillWord(state: WorldState, questId: string): WorldState {
  const word = findActiveWord(state.player, questId);
  if (!word) return state;
  const givenWords = (state.player.givenWords ?? []).map(w =>
    w.id === word.id ? { ...w, status: "fulfilled" as const } : w
  );
  return { ...state, player: { ...state.player, givenWords } };
}

/**
 * Break the active Word for a quest: apply Integrity penalty scaled by
 * the Word's baked multiplier, mark Word "broken", fail the quest.
 */
export function breakWord(state: WorldState, questId: string): WorldState {
  const word = findActiveWord(state.player, questId);
  if (!word) return state;
  const delta = {
    integrity: Math.round(WORD_BREAK_PENALTY_INTEGRITY * word.breakPenaltyMultiplier),
  };
  let p: PlayerState = applyKarma(state.player, delta);
  p = logKarmaDelta(p, delta, `word:${questId}:broken`);
  const givenWords = (p.givenWords ?? []).map(w =>
    w.id === word.id ? { ...w, status: "broken" as const } : w
  );
  const quests = { ...(p.quests ?? {}) };
  if (quests[questId]) {
    quests[questId] = { ...quests[questId], status: "failed", currentStep: null };
  }
  return { ...state, player: { ...p, givenWords, quests } };
}
