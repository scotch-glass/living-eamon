// ============================================================
// LIVING EAMON — Quest Engine types (KARMA Sprint 8a)
//
// The Quest Engine is a generic runtime system that any quest
// line plugs into. The first major client is "The Way of Thoth"
// (Sprint 8d–f); other quests (Vivian's arc, future Stag Company)
// reuse the same engine.
//
// Authoring shape: a Quest is a TS module in `lib/quests/lines/<id>.ts`
// that default-exports a `Quest`. The registry in `lib/quests/engine.ts`
// imports each line module statically — no filesystem walking, so
// authoring errors crash the compile, not the player session.
//
// ARCHITECTURE
//   - Quest scope: "life" wipes on rebirth; "legacy" survives death.
//   - Steps: linear (one trigger → one reward → next step) OR
//     branching (first matching branch wins).
//   - Triggers: event-driven. The engine is CALLED from existing
//     hook sites in gameEngine.ts / movePlayer / scrolls / combat;
//     never polled.
//   - Rewards funnel through `applyReward` which calls `applyKarma`
//     for PICSSI shifts — no quest code ever writes p.picssi.* directly.
//   - Multi-stage NPC dialogue: the optional `lib/quests/dialogue.ts`
//     resolver runs BEFORE the legacy NPCScript matcher; quests opt
//     in by exporting QuestNPCDialogue records.
//
// See ~/.claude/plans/zim-can-be-the-encapsulated-sunset.md for the
// full plan and the eight sub-sprints (8a–8h).
// ============================================================

import type { WorldState, PlayerState } from "../gameState";
import type { KarmaDelta, PicssiVirtue } from "../karma/types";

/**
 * Quest scope determines lifetime against rebirth at the Church of
 * Perpetual Life:
 *   - "life"   → cleared on death (per-life narrative beats)
 *   - "legacy" → survives death (multi-life pursuits like the
 *                fifteen Scrolls of Thoth)
 */
export type QuestScope = "life" | "legacy";

/**
 * Events the Quest Engine reacts to. The engine is called from
 * existing hook sites in the game (room moves, NPC talks, scroll
 * reads, combat ends, item acquisitions, raw player commands)
 * which emit one of these via `emitQuestEvent(state, event)`.
 *
 * `quest-step-done` is a synthetic re-emission to support chained
 * quests; depth-capped at 8 to prevent cycles.
 */
export type QuestEvent =
  | { type: "enter-room";       roomId: string }
  | { type: "talk-to-npc";      npcId: string }
  | { type: "item-acquired";    itemId: string }
  | { type: "scroll-read";      scrollId: string; firstPass: boolean }
  | { type: "combat-end";       victory: boolean; enemyTag?: string; enemyNpcId?: string }
  | { type: "command";          verb: string; args: string[] }
  | { type: "quest-step-done";  questId: string; stepId: string };

/**
 * Pre-conditions that must hold for a step to be visible / for a
 * quest to be acceptable. Mirrors the karma-atom prerequisite
 * vocabulary so authors think in one schema across both systems.
 */
export type QuestPrerequisite =
  | { type: "picssi-min";       virtue: PicssiVirtue; value: number }
  | { type: "picssi-max";       virtue: PicssiVirtue; value: number }
  | { type: "has-item";         itemId: string }
  | { type: "lacks-item";       itemId: string }
  | { type: "completed-quest";  questId: string }
  | { type: "completed-step";   questId: string; stepId: string }
  | { type: "flag";             key: string; scope: QuestScope; value: boolean }
  | { type: "predicate";        check: (s: WorldState) => boolean };

/**
 * Trigger spec: when a step is "armed" and waiting on this event,
 * the engine fires the step's reward as soon as a matching event
 * arrives.
 *
 *   event   — required event family (must equal QuestEvent.type)
 *   target  — optional concrete match (roomId, npcId, itemId, etc.)
 *             undefined = wildcard within the event family
 *   guard   — optional final predicate run only when type+target match
 */
export interface QuestTriggerHook {
  event: QuestEvent["type"];
  target?: string;
  guard?: (s: WorldState, e: QuestEvent) => boolean;
}

/**
 * The set of effects a step (or a quest's accept/completion hook)
 * applies. Every PICSSI shift goes through the `picssi` field which
 * funnels into `applyKarma` — never write p.picssi.* directly.
 *
 *   chronicle / legacyChronicle — public Chronicle entries are the
 *     canonical "permanent legacy mark". Reserve for big beats:
 *     quest completion, Circle unlocks, prophecy fulfillment.
 *   unlockCircle — drives the Sorcery Circle gate. Sprint 7 (Sorcery)
 *     reads this; Sprint 8 stubs the field but doesn't enforce it.
 */
export interface QuestReward {
  picssi?: KarmaDelta;
  gold?: number;
  itemsGained?: string[];
  itemsLost?: string[];
  knownSpells?: string[];
  flagsLife?: string[];
  flagsLegacy?: string[];
  npcAffection?: Record<string, number>;
  introduceNpc?: { npcId: string; intoRoom?: string; chronicle?: string };
  chronicle?: string;          // private (isPublic: false)
  legacyChronicle?: string;    // public (isPublic: true) — permanent
  unlockCircle?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
}

/**
 * Branching variant of a step. The engine evaluates each branch
 * in declaration order; first matching trigger wins. Each branch
 * has its own reward and `nextStep`.
 */
export interface QuestStepBranch {
  id: string;
  label: string;
  trigger: QuestTriggerHook;
  reward: QuestReward;
  nextStep: string | null;
}

/**
 * A single step in a quest. EXACTLY ONE of:
 *   - linear:    `trigger` + `reward` + `nextStep`
 *   - branching: `branches[]`
 *
 * `prerequisites` are pre-checks: a step is invisible/inactive
 * until they all hold.
 */
export interface QuestStep {
  id: string;
  hint: string;                      // 1-line player-facing hint
  trigger?: QuestTriggerHook;
  reward?: QuestReward;
  nextStep?: string | null;
  branches?: QuestStepBranch[];
  prerequisites?: QuestPrerequisite[];
}

/**
 * The full quest definition. Authors export this from a
 * `lib/quests/lines/<id>.ts` module; the engine registers it via
 * a static import in `lib/quests/engine.ts`.
 *
 * `codexRenderer` is the per-quest log opt-in (Sprint 8h). Quests
 * that want a custom log view ("THE WAY", "TEACHINGS") provide
 * one; default is the generic `QUESTS LOG`.
 */
export interface Quest {
  id: string;
  title: string;
  blurb: string;                     // 1–2 sentence synopsis for QUESTS log
  scope: QuestScope;
  steps: Record<string, QuestStep>;
  startStep: string;
  acceptancePrerequisites?: QuestPrerequisite[];
  acceptReward?: QuestReward;
  completionReward?: QuestReward;
  completionChronicle?: string;
  /** Optional: per-quest codex view (Sprint 8h). */
  codexRenderer?: (state: WorldState) => string;
  /** Optional: command aliases that trigger the codex view (e.g. ["WAY","TEACHINGS"]). */
  codexCommands?: string[];
}

/** Per-player runtime state for a single quest. Persisted in JSONB. */
export interface QuestState {
  acceptedAt: string;                // ISO 8601
  status: "active" | "completed" | "failed";
  currentStep: string | null;
  completedSteps: string[];
  /**
   * Denormalized from Quest.scope at acceptance time. Lets the
   * rebirth filter in `applyPlayerDeath` (lib/gameState.ts) decide
   * what survives without importing the quest registry — gameState
   * cannot import lib/quests/engine.ts (circular dep) and the
   * registry is the only place Quest.scope lives at runtime.
   */
  scope: QuestScope;
  /** Free-form quest-private state. Use sparingly; prefer flagsLife/Legacy. */
  scratch: Record<string, string | number | boolean>;
}

/** Convenience: fresh QuestState for `acceptQuest`. */
export function newQuestState(startStep: string, scope: QuestScope): QuestState {
  return {
    acceptedAt: new Date().toISOString(),
    status: "active",
    currentStep: startStep,
    completedSteps: [],
    scope,
    scratch: {},
  };
}

/** Re-export for the engine — handy when importing from a single file. */
export type { PlayerState, WorldState, KarmaDelta };
