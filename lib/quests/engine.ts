// ============================================================
// LIVING EAMON — Quest Engine (KARMA Sprint 8a)
//
// Lifecycle helpers + central registry. The Quest Engine is
// event-driven: existing hook sites in the codebase call
// `emitQuestEvent(state, event)` after their primary action
// settles, and this module walks active quests + fires any
// matching steps.
//
// Reward fan-out (`applyReward`) routes through:
//   - applyKarma           → PICSSI deltas (lib/karma/recompute.ts)
//   - logKarmaDelta        → karma history log (Sprint 6)
//   - bumpAffection        → npcAffection (Sprint 4)
//   - addToChronicle       → narrative log
//   - inventory helpers    → items gained/lost
//   - direct PlayerState   → gold, knownSpells, flags, scratch
//
// NEVER mutate p.picssi.* directly here — go through applyKarma.
// ============================================================

import type { WorldState, PlayerState } from "../gameState";
import { addToChronicle } from "../gameState";
import { applyKarma, logKarmaDelta } from "../karma/recompute";
import { NPCS } from "../gameData";
import type {
  Quest,
  QuestEvent,
  QuestPrerequisite,
  QuestReward,
  QuestState,
  QuestStep,
  QuestStepBranch,
  QuestTriggerHook,
} from "./types";
import { newQuestState } from "./types";

// ── Registry ──────────────────────────────────────────────────
//
// Quests are registered via static imports below. Authoring a new
// quest = create a TS module in lib/quests/lines/<id>.ts that
// default-exports a Quest, then add an import line here.
//
// Sprint 8a ships the registry empty; Sprint 8d–f populates it
// with `vivian-arc` and `way-of-thoth`.

const QUEST_REGISTRY: Record<string, Quest> = {};

/** Register a quest at module-load time. Authoring lines call this. */
export function registerQuest(quest: Quest): void {
  if (QUEST_REGISTRY[quest.id]) {
    throw new Error(`[quest-engine] duplicate quest id: ${quest.id}`);
  }
  QUEST_REGISTRY[quest.id] = quest;
}

/** Look up a quest definition. */
export function getQuest(questId: string): Quest | null {
  return QUEST_REGISTRY[questId] ?? null;
}

/** All registered quests — for QUESTS LOG and validation. */
export function allQuests(): Quest[] {
  return Object.values(QUEST_REGISTRY);
}

// ── Validator ─────────────────────────────────────────────────
//
// Walk every step + reward in the registry; assert that
// referenced npcIds, itemIds, scrollIds, and questIds exist.
// Hard-fail in dev (so bad authoring crashes test/CI) and
// soft-skip in production (so a live player never crashes on
// stale content). Sprint 8a ships the dev-fail mode.

export function validateRegistry(): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  for (const quest of allQuests()) {
    if (!quest.steps[quest.startStep]) {
      errors.push(`quest "${quest.id}": startStep "${quest.startStep}" missing from steps`);
    }
    for (const step of Object.values(quest.steps)) {
      if (step.trigger && step.branches?.length) {
        errors.push(`quest "${quest.id}" step "${step.id}": cannot have both linear trigger and branches`);
      }
      const branches = step.branches ?? [];
      const linearNext = step.nextStep;
      const allNexts = [...branches.map(b => b.nextStep), linearNext].filter(Boolean) as string[];
      for (const next of allNexts) {
        if (!quest.steps[next]) {
          errors.push(`quest "${quest.id}" step "${step.id}": nextStep "${next}" missing`);
        }
      }
      const rewards = [
        step.reward,
        ...branches.map(b => b.reward),
      ].filter(Boolean) as QuestReward[];
      for (const r of rewards) {
        if (r.introduceNpc && !NPCS[r.introduceNpc.npcId]) {
          errors.push(`quest "${quest.id}" step "${step.id}": introduceNpc "${r.introduceNpc.npcId}" missing from NPCS`);
        }
      }
    }
  }
  if (errors.length === 0) return { ok: true };
  return { ok: false, errors };
}

// ── Acceptance ────────────────────────────────────────────────

/**
 * Accept a quest if it's not already in the player's quest map and
 * its acceptance prerequisites pass. Silent fail = unchanged state
 * (quests are accepted by deed, not menu — silent is correct).
 */
export function acceptQuest(state: WorldState, questId: string): WorldState {
  const quest = getQuest(questId);
  if (!quest) return state;
  if (state.player.quests?.[questId]) return state;
  if (!checkPrerequisites(state, quest.acceptancePrerequisites)) return state;

  let next: WorldState = {
    ...state,
    player: {
      ...state.player,
      quests: {
        ...(state.player.quests ?? {}),
        [questId]: newQuestState(quest.startStep, quest.scope),
      },
    },
  };
  if (quest.acceptReward) {
    next = applyReward(next, quest.acceptReward, `quest:${questId}:accept`);
  }
  return next;
}

// ── Step progression ──────────────────────────────────────────

/**
 * Walk every active quest, find any step whose trigger matches the
 * event, and fire `completeStep`. Iteration order: by quest id, by
 * branch declaration order; first matching branch wins per step.
 *
 * Phase 1 (auto-accept): for any registered quest the player hasn't
 * accepted yet, if `acceptanceTrigger` matches the event and
 * `acceptancePrerequisites` pass, accept the quest. The newly-active
 * quest then participates in Phase 2 on the same event — so a single
 * event can both accept a quest AND complete its first step (e.g.
 * reading thoth-1 both accepts Way-of-Thoth and completes step 1).
 *
 * Phase 2 walks active quests on the post-Phase-1 state.
 *
 * Depth-capped at 8 to prevent quest-step-done re-emission cycles.
 */
export function emitQuestEvent(
  state: WorldState,
  event: QuestEvent,
  depth = 0
): WorldState {
  if (depth >= 8) return state; // cycle guard
  let next = state;

  // Phase 1: auto-accept any registered quest whose acceptanceTrigger matches.
  for (const quest of allQuests()) {
    if (next.player.quests?.[quest.id]) continue;
    if (!quest.acceptanceTrigger) continue;
    if (!triggerMatches(quest.acceptanceTrigger, event, next)) continue;
    if (!checkPrerequisites(next, quest.acceptancePrerequisites)) continue;
    next = acceptQuest(next, quest.id);
  }

  // Phase 2: walk now-active quests for step triggers.
  const quests = next.player.quests ?? {};
  for (const [questId, qs] of Object.entries(quests)) {
    if (qs.status !== "active") continue;
    if (!qs.currentStep) continue;
    const quest = getQuest(questId);
    if (!quest) continue;
    const step = quest.steps[qs.currentStep];
    if (!step) continue;
    if (!checkPrerequisites(next, step.prerequisites)) continue;

    // Linear path
    if (step.trigger && triggerMatches(step.trigger, event, next)) {
      next = completeStep(next, questId, step.id, undefined, depth);
      continue;
    }
    // Branching path — first match wins
    if (step.branches?.length) {
      for (const branch of step.branches) {
        if (triggerMatches(branch.trigger, event, next)) {
          next = completeStep(next, questId, step.id, branch.id, depth);
          break;
        }
      }
    }
  }
  return next;
}

/**
 * Mark a step complete: apply its reward, advance currentStep to
 * `nextStep`. If `nextStep === null`, finalize the quest with
 * completionReward + completionChronicle.
 */
export function completeStep(
  state: WorldState,
  questId: string,
  stepId: string,
  branchId?: string,
  depth = 0
): WorldState {
  const quest = getQuest(questId);
  const qs = state.player.quests?.[questId];
  if (!quest || !qs) return state;
  const step = quest.steps[stepId];
  if (!step) return state;

  // Resolve reward + nextStep based on branch or linear path
  let reward: QuestReward | undefined;
  let nextStepId: string | null = null;
  if (branchId) {
    const branch = step.branches?.find(b => b.id === branchId);
    if (!branch) return state;
    reward = branch.reward;
    nextStepId = branch.nextStep;
  } else {
    reward = step.reward;
    nextStepId = step.nextStep ?? null;
  }

  // Apply reward
  let next = state;
  if (reward) {
    next = applyReward(next, reward, `quest:${questId}:${stepId}`);
  }

  // Advance quest state
  const updatedQs: QuestState = {
    ...qs,
    currentStep: nextStepId,
    completedSteps: [...qs.completedSteps, stepId],
    status: nextStepId ? "active" : "completed",
  };
  next = {
    ...next,
    player: {
      ...next.player,
      quests: {
        ...(next.player.quests ?? {}),
        [questId]: updatedQs,
      },
    },
  };

  // Quest finalized — apply completion reward + chronicle line
  if (!nextStepId) {
    if (quest.completionReward) {
      next = applyReward(next, quest.completionReward, `quest:${questId}:complete`);
    }
    if (quest.completionChronicle) {
      next = addToChronicle(next, quest.completionChronicle, true);
    }
  }

  // Re-emit synthetic event so chained quests can react
  next = emitQuestEvent(next, { type: "quest-step-done", questId, stepId }, depth + 1);

  return next;
}

// ── Reward fan-out ────────────────────────────────────────────

/**
 * Apply every effect a QuestReward declares. Funnels through
 * `applyKarma` for PICSSI shifts and `addToChronicle` for the
 * narrative log; never writes p.picssi.* directly.
 */
export function applyReward(
  state: WorldState,
  reward: QuestReward,
  source: string
): WorldState {
  let next = state;
  let p: PlayerState = next.player;

  // 1. PICSSI deltas — funnel through applyKarma + log
  if (reward.picssi && Object.keys(reward.picssi).length > 0) {
    p = applyKarma(p, reward.picssi);
    p = logKarmaDelta(p, reward.picssi, source);
    next = { ...next, player: p };
  }

  // 2. Gold delta
  if (typeof reward.gold === "number" && reward.gold !== 0) {
    p = { ...p, gold: Math.max(0, p.gold + reward.gold) };
    next = { ...next, player: p };
  }

  // 3. Items gained
  if (reward.itemsGained?.length) {
    const inventory = p.inventory.map(e => ({ ...e }));
    for (const id of reward.itemsGained) {
      const existing = inventory.find(e => e.itemId === id);
      if (existing) existing.quantity += 1;
      else inventory.push({ itemId: id, quantity: 1 });
    }
    p = { ...p, inventory };
    next = { ...next, player: p };
  }

  // 4. Items lost
  if (reward.itemsLost?.length) {
    let inventory = p.inventory.map(e => ({ ...e }));
    for (const id of reward.itemsLost) {
      const existing = inventory.find(e => e.itemId === id);
      if (existing) existing.quantity -= 1;
    }
    inventory = inventory.filter(e => e.quantity > 0);
    p = { ...p, inventory };
    next = { ...next, player: p };
  }

  // 5. Known spells (additive, dedup)
  if (reward.knownSpells?.length) {
    const set = new Set<string>(p.knownSpells ?? []);
    for (const s of reward.knownSpells) set.add(s);
    p = { ...p, knownSpells: Array.from(set) };
    next = { ...next, player: p };
  }

  // 6. Flags — life and legacy scopes
  if (reward.flagsLife?.length) {
    const flagsLife = { ...(p.flagsLife ?? {}) };
    for (const k of reward.flagsLife) flagsLife[k] = true;
    p = { ...p, flagsLife };
    next = { ...next, player: p };
  }
  if (reward.flagsLegacy?.length) {
    const flagsLegacy = { ...(p.flagsLegacy ?? {}) };
    for (const k of reward.flagsLegacy) flagsLegacy[k] = true;
    p = { ...p, flagsLegacy };
    next = { ...next, player: p };
  }

  // 7. NPC affection deltas (clamp 0..100)
  if (reward.npcAffection) {
    const npcAffection = { ...(p.npcAffection ?? {}) };
    for (const [npcId, delta] of Object.entries(reward.npcAffection)) {
      const cur = npcAffection[npcId] ?? 0;
      npcAffection[npcId] = Math.max(0, Math.min(100, cur + delta));
    }
    p = { ...p, npcAffection };
    next = { ...next, player: p };
  }

  // 8. introduceNpc — write a chronicle line if the author supplied one;
  //    actual NPC placement (room move) is deferred until we have an
  //    NPC-relocation primitive. For now, the chronicle is the signal.
  if (reward.introduceNpc?.chronicle) {
    next = addToChronicle(next, reward.introduceNpc.chronicle, false);
  }

  // 9. Chronicle entries
  if (reward.chronicle) {
    next = addToChronicle(next, reward.chronicle, false);
  }
  if (reward.legacyChronicle) {
    next = addToChronicle(next, reward.legacyChronicle, true);
  }

  // 10. unlockCircle — Sprint 7: set knownCircles + log to chronicle.
  //     Idempotent (re-granting the same circle is a no-op).
  if (reward.unlockCircle) {
    const circle = reward.unlockCircle;
    const known = next.player.knownCircles ?? [];
    if (!known.includes(circle)) {
      next = {
        ...next,
        player: {
          ...next.player,
          knownCircles: [...known, circle].sort((a, b) => a - b),
        },
      };
      next = addToChronicle(
        next,
        `Circle ${circle} of Sorcery has been revealed.`,
        true
      );
    }
  }

  return next;
}

// ── Rebirth scope filter ──────────────────────────────────────

/**
 * Strip life-scope quests from the player's quest map. Reads
 * `qs.scope` (denormalized at acceptance time) so this function
 * stays import-free of the registry — `applyPlayerDeath` in
 * `lib/gameState.ts` calls it directly without a circular dep.
 */
export function filterQuestsByScope(
  quests: Record<string, QuestState> | undefined,
  preserveScope: "legacy"
): Record<string, QuestState> {
  if (!quests) return {};
  const out: Record<string, QuestState> = {};
  for (const [id, qs] of Object.entries(quests)) {
    if (qs.scope === preserveScope) out[id] = qs;
  }
  return out;
}

// ── Internals ─────────────────────────────────────────────────

export function checkPrerequisites(
  state: WorldState,
  prereqs: QuestPrerequisite[] | undefined
): boolean {
  if (!prereqs?.length) return true;
  return prereqs.every(p => checkPrerequisite(state, p));
}

function checkPrerequisite(state: WorldState, p: QuestPrerequisite): boolean {
  const player = state.player;
  switch (p.type) {
    case "picssi-min":      return (player.picssi?.[p.virtue] ?? 0) >= p.value;
    case "picssi-max":      return (player.picssi?.[p.virtue] ?? 0) <= p.value;
    case "has-item":        return (player.inventory ?? []).some(e => e.itemId === p.itemId);
    case "lacks-item":      return !(player.inventory ?? []).some(e => e.itemId === p.itemId);
    case "completed-quest": return player.quests?.[p.questId]?.status === "completed";
    case "completed-step":  return player.quests?.[p.questId]?.completedSteps?.includes(p.stepId) ?? false;
    case "flag":            return Boolean(
      (p.scope === "legacy" ? player.flagsLegacy : player.flagsLife)?.[p.key]
    ) === p.value;
    case "predicate":       return p.check(state);
  }
}

function triggerMatches(
  trigger: QuestTriggerHook,
  event: QuestEvent,
  state: WorldState
): boolean {
  if (trigger.event !== event.type) return false;
  // Concrete-target match
  switch (event.type) {
    case "enter-room":
      if (trigger.target && trigger.target !== event.roomId) return false;
      break;
    case "talk-to-npc":
      if (trigger.target && trigger.target !== event.npcId) return false;
      break;
    case "item-acquired":
      if (trigger.target && trigger.target !== event.itemId) return false;
      break;
    case "scroll-read":
      if (trigger.target && trigger.target !== event.scrollId) return false;
      break;
    case "combat-end":
      // No `target` semantics by default; use guard for victory + tag.
      break;
    case "command":
      if (trigger.target && trigger.target.toUpperCase() !== event.verb.toUpperCase()) return false;
      break;
    case "quest-step-done":
      if (trigger.target && trigger.target !== `${event.questId}:${event.stepId}`) return false;
      break;
  }
  // Final guard
  return trigger.guard ? trigger.guard(state, event) : true;
}

// Re-export QuestStep / QuestStepBranch for authors who only import from engine
export type { QuestStep, QuestStepBranch };
