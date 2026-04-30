// ============================================================
// LIVING EAMON — Quest dialogue resolver (KARMA Sprint 8c)
//
// Multi-stage NPC dialogue that reads the player's quest state
// and returns the appropriate branch's lines. The legacy
// `NPCScript` model in lib/roomTypes.ts fires once per condition
// and can't read quest state; this module fills that gap.
//
// Lifecycle:
//   - `registerQuestDialogue(d)` is called at module-load time
//     by quest line modules in lib/quests/lines/<id>.ts.
//   - `resolveQuestDialogue(state, npcId)` is called by the TALK
//     handler in lib/gameEngine.ts BEFORE the legacy NPCScript
//     matcher / Jane fall-through. Pre-existing NPCs that have
//     no QuestNPCDialogue registered (Aldric, Hokas) keep their
//     legacy path; quest-bound NPCs route through the resolver.
//
// Branching: declaration order; first match wins.
// `fireOnceReward`: applied at most once per QuestState.scratch
// keyed by `fireOnceKey ?? branch.id`. Re-talking still shows
// the lines but does NOT re-apply the reward.
//
// See ~/.claude/plans/zim-can-be-the-encapsulated-sunset.md §8c.
// ============================================================

import type { WorldState } from "../gameState";
import type { QuestPrerequisite, QuestReward, QuestState } from "./types";
import { applyReward, checkPrerequisites } from "./engine";

export interface QuestDialogueBranchWhen {
  questId: string;
  /** The quest's currentStep must equal this id (and status === "active"). */
  onStep?: string;
  /** The quest's completedSteps must include this id. */
  afterStepCompleted?: string;
  /** The quest must be in "completed" status. */
  questCompleted?: boolean;
  /** The quest must NOT yet be in the player's quest map. */
  questNotAccepted?: boolean;
  /** Additional prereqs reusing the QuestPrerequisite vocabulary. */
  extra?: QuestPrerequisite[];
}

export interface QuestDialogueBranch {
  id: string;
  when: QuestDialogueBranchWhen;
  lines: string[];
  /**
   * Optional reward applied the first time this branch is selected
   * for this quest. Keyed by `fireOnceKey ?? id` in QuestState.scratch.
   */
  fireOnceReward?: QuestReward;
  fireOnceKey?: string;
}

export interface QuestNPCDialogue {
  npcId: string;
  /** Declaration order; first match wins. */
  branches: QuestDialogueBranch[];
  /** Shown when no branch matches. */
  fallback: string[];
}

const REGISTRY: Record<string, QuestNPCDialogue> = {};

export function registerQuestDialogue(d: QuestNPCDialogue): void {
  if (REGISTRY[d.npcId]) {
    throw new Error(`[quest-dialogue] duplicate npcId: ${d.npcId}`);
  }
  REGISTRY[d.npcId] = d;
}

export function getQuestDialogue(npcId: string): QuestNPCDialogue | null {
  return REGISTRY[npcId] ?? null;
}

/** Test-only: clear the registry between cases. */
export function _resetQuestDialogueRegistry(): void {
  for (const k of Object.keys(REGISTRY)) delete REGISTRY[k];
}

/**
 * Resolve quest dialogue for the given NPC. Walks branches in
 * declaration order; the first match wins.
 *
 * Returns:
 *   - `null` when no QuestNPCDialogue is registered for `npcId`.
 *     Caller falls through to the legacy NPCScript path / Jane.
 *   - `{ lines, state }` when registered. `lines` is the matched
 *     branch's lines, or `fallback` when no branch matches.
 *     `state` is updated with any fire-once reward effects.
 */
export function resolveQuestDialogue(
  state: WorldState,
  npcId: string
): { lines: string[]; state: WorldState } | null {
  const dialogue = REGISTRY[npcId];
  if (!dialogue) return null;

  for (const branch of dialogue.branches) {
    if (!branchMatches(state, branch)) continue;
    const fireKey = branch.fireOnceKey ?? branch.id;
    const qs = state.player.quests?.[branch.when.questId];
    let nextState = state;
    if (branch.fireOnceReward && qs && !qs.scratch[fireKey]) {
      nextState = applyReward(
        nextState,
        branch.fireOnceReward,
        `dialogue:${npcId}:${branch.id}`
      );
      const updatedQs = nextState.player.quests?.[branch.when.questId];
      if (updatedQs) {
        const withScratch: QuestState = {
          ...updatedQs,
          scratch: { ...updatedQs.scratch, [fireKey]: true },
        };
        nextState = {
          ...nextState,
          player: {
            ...nextState.player,
            quests: {
              ...(nextState.player.quests ?? {}),
              [branch.when.questId]: withScratch,
            },
          },
        };
      }
    }
    return { lines: branch.lines, state: nextState };
  }

  return { lines: dialogue.fallback, state };
}

function branchMatches(state: WorldState, branch: QuestDialogueBranch): boolean {
  const w = branch.when;
  const qs = state.player.quests?.[w.questId];

  if (w.questNotAccepted) {
    if (qs) return false;
  } else if (w.onStep || w.afterStepCompleted || w.questCompleted) {
    // Any positive quest-state check requires the quest to be accepted.
    if (!qs) return false;
  }

  if (w.questCompleted && qs?.status !== "completed") return false;
  if (w.onStep) {
    if (!qs || qs.currentStep !== w.onStep || qs.status !== "active") return false;
  }
  if (w.afterStepCompleted) {
    if (!qs || !qs.completedSteps.includes(w.afterStepCompleted)) return false;
  }
  if (w.extra?.length && !checkPrerequisites(state, w.extra)) return false;
  return true;
}
