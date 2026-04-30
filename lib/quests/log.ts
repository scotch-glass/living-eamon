// ============================================================
// LIVING EAMON — Quest Log renderers (KARMA Sprint 8b)
//
// Pure-string renderers for the QUESTS / QUESTS LOG static
// commands. No Jane (LLM) call; no state mutation. The dispatcher
// in lib/gameEngine.ts:processInput consults these and returns
// the result as a `static` EngineResult.
//
//   QUESTS         — active quests with current-step hint
//   QUESTS LOG     — completed deeds (legacy chronicle of finished
//                    quest lines, persists across rebirth for
//                    legacy-scope quests)
// ============================================================

import type { WorldState } from "../gameState";
import { allQuests, getQuest } from "./engine";

const HEADER_LINE = "═══════════════════════════════════════════";

/**
 * Render the active-quests view: every quest where `status === "active"`,
 * with a 1-line hint pulled from the current step.
 */
export function renderActiveQuests(state: WorldState): string {
  const quests = state.player.quests ?? {};
  const active = Object.entries(quests)
    .filter(([, qs]) => qs.status === "active")
    .map(([id, qs]) => {
      const def = getQuest(id);
      if (!def) return null;
      const stepId = qs.currentStep;
      const step = stepId ? def.steps[stepId] : null;
      const hint = step?.hint ?? "(awaiting fate)";
      const completed = qs.completedSteps.length;
      const total = Object.keys(def.steps).length;
      return [
        def.title,
        `  ${hint}`,
        `  Progress: ${completed}/${total}`,
      ].join("\n");
    })
    .filter((s): s is string => s !== null);

  if (active.length === 0) {
    return [
      HEADER_LINE,
      "  ACTIVE QUESTS",
      HEADER_LINE,
      "",
      "  No quests yet. The world is full of doors —",
      "  walk through one and a thread will catch.",
      "",
      "  (Type QUESTS LOG to see completed deeds.)",
    ].join("\n");
  }

  return [
    HEADER_LINE,
    "  ACTIVE QUESTS",
    HEADER_LINE,
    "",
    ...active.map(line => line + "\n"),
    "(Type QUESTS LOG to see completed deeds.)",
  ].join("\n");
}

/**
 * Render the completed-quests view: every quest where
 * `status === "completed"`, with the quest blurb as a permanent
 * mark. Legacy-scope quests survive rebirth; life-scope quests
 * appear here within the current life only.
 */
export function renderQuestLog(state: WorldState): string {
  const quests = state.player.quests ?? {};
  const completed = Object.entries(quests)
    .filter(([, qs]) => qs.status === "completed")
    .map(([id]) => {
      const def = getQuest(id);
      if (!def) return null;
      return [
        def.title,
        `  ${def.blurb}`,
      ].join("\n");
    })
    .filter((s): s is string => s !== null);

  if (completed.length === 0) {
    return [
      HEADER_LINE,
      "  QUEST LOG",
      HEADER_LINE,
      "",
      "  No completed quests yet.",
      "  Deeds done are deeds remembered.",
    ].join("\n");
  }

  return [
    HEADER_LINE,
    "  QUEST LOG",
    HEADER_LINE,
    "",
    ...completed.map(line => line + "\n"),
  ].join("\n");
}

/**
 * Optional: list every quest in the registry (admin / debug view).
 * Not wired to a player command in Sprint 8b; kept here for
 * Sprint 8h codex tooling.
 */
export function renderQuestRegistry(): string {
  const all = allQuests();
  if (all.length === 0) return "(no quests registered)";
  return all
    .map(q => `${q.id} — ${q.title} (${q.scope}, ${Object.keys(q.steps).length} steps)`)
    .join("\n");
}
