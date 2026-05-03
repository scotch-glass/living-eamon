// ============================================================
// LIVING EAMON — Quest codex dispatcher (Sprint 8h)
//
// Maps player-facing codex commands (THE WAY, WAY, TEACHINGS…)
// to per-quest codexRenderer functions. Generic: future quests
// opt in by declaring Quest.codexCommands + Quest.codexRenderer.
//
// Called from lib/gameEngine.ts:processInput with the full
// normalized command string before the QUESTS handler.
// ============================================================

import { allQuests } from "./engine";
import type { WorldState } from "../gameState";

/**
 * If `command` matches any registered quest's codexCommands list,
 * call that quest's codexRenderer and return the string.
 * Returns null if no quest claims the command.
 *
 * `command` should be upper-cased and have normalized whitespace
 * (single space between tokens) before being passed here.
 */
export function resolveCodexCommand(state: WorldState, command: string): string | null {
  for (const quest of allQuests()) {
    if (quest.codexCommands?.includes(command) && quest.codexRenderer) {
      return quest.codexRenderer(state);
    }
  }
  return null;
}
