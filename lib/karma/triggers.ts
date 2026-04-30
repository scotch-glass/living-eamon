// ============================================================
// KARMA — Atom trigger matcher + prerequisite checker
// KARMA Sprint 4. Walks the loaded atom library and returns the
// atoms whose triggers match a given `KarmaEvent` AND whose
// prerequisites are satisfied by the current player state.
//
// v1 supports `enter-room` and `talk-to-npc` triggers. The atom
// schema also defines `examine-object`, `turn-count`, and
// `manual` triggers — these are accepted by the loader but never
// emitted by the engine yet (deferred to Sprint 4.5+).
// ============================================================

import type { WorldState } from "../gameState";
import type {
  Encounter,
  PrerequisiteSpec,
  TriggerSpec,
  Virtue,
} from "./atom-types";
import { loadAtoms } from "./loader";

/** Events the atom system reacts to. Engine emits these from existing hooks. */
export type KarmaEvent =
  | { type: "enter-room"; roomId: string }
  | { type: "talk-to-npc"; npcId: string }
  | { type: "examine-object"; objectId: string }
  | { type: "turn-count"; turn: number }
  | { type: "manual"; atomId: string };

/**
 * Find every atom whose trigger matches `event` AND whose prereqs
 * pass against `state`. Caller picks the first one to present.
 *
 * Atoms that have already been "consumed" — i.e. their `flagsSet`
 * are already true on the player — are filtered out so a one-shot
 * encounter doesn't re-fire. Atoms WITHOUT `flagsSet` (rare; only
 * for repeatable atoms) bypass this check.
 */
export function matchTriggers(
  state: WorldState,
  event: KarmaEvent,
  atoms?: Encounter[]
): Encounter[] {
  const library = atoms ?? loadAtoms();
  const matches: Encounter[] = [];
  for (const atom of library) {
    if (alreadyConsumed(state, atom)) continue;
    if (!atom.triggers.some(t => triggerMatches(t, event))) continue;
    if (!checkPrerequisites(state, atom.prerequisites)) continue;
    matches.push(atom);
  }
  return matches;
}

function triggerMatches(trigger: TriggerSpec, event: KarmaEvent): boolean {
  if (trigger.type !== event.type) return false;
  switch (event.type) {
    case "enter-room":
      return trigger.target === event.roomId;
    case "talk-to-npc":
      return trigger.target === event.npcId;
    case "examine-object":
      return trigger.target === event.objectId;
    case "turn-count":
      return Number(trigger.target ?? -1) === event.turn;
    case "manual":
      // Manual triggers are unrelated to events; never auto-match.
      return false;
  }
}

function checkPrerequisites(
  state: WorldState,
  prereqs: PrerequisiteSpec[] | undefined
): boolean {
  if (!prereqs?.length) return true;
  return prereqs.every(p => checkPrerequisite(state, p));
}

function checkPrerequisite(state: WorldState, p: PrerequisiteSpec): boolean {
  const player = state.player;
  switch (p.type) {
    case "hp-min":
      return player.hp >= Number(p.value);
    case "gold-min":
      return player.gold >= Number(p.value);
    case "has-item":
      return playerHasItem(state, String(p.value));
    case "lacks-item":
      return !playerHasItem(state, String(p.value));
    case "karma-min":
      if (!p.virtue) return false;
      return picssiValue(state, p.virtue) >= Number(p.value);
    case "karma-max":
      if (!p.virtue) return false;
      return picssiValue(state, p.virtue) <= Number(p.value);
    case "flag-set":
      return Boolean(
        player.flagsLife?.[String(p.value)] ?? player.flagsLegacy?.[String(p.value)]
      );
    case "flag-unset":
      return !player.flagsLife?.[String(p.value)] && !player.flagsLegacy?.[String(p.value)];
  }
}

/**
 * Special inventory check. The atom JSONs use semi-arbitrary item
 * id strings; here we resolve a few aliases and fall back to a plain
 * inventory scan. Aliases:
 *   "any-weapon" → player has any weapon equipped (i.e., weapon !== "unarmed")
 */
function playerHasItem(state: WorldState, itemId: string): boolean {
  if (itemId === "any-weapon") {
    return state.player.weapon !== "unarmed";
  }
  return (state.player.inventory ?? []).some(e => e.itemId === itemId);
}

/** CapitalCase virtue → lowercase PICSSI key → numeric value. */
function picssiValue(state: WorldState, virtue: Virtue): number {
  const key = virtue.toLowerCase() as keyof typeof state.player.picssi;
  return state.player.picssi[key] ?? 0;
}

/**
 * Treat an atom as "already consumed" if any of the flags it sets
 * (across all its choices) are already true on the player. This is
 * the simplest correct one-shot guard — avoids requiring atom
 * authors to add an explicit "this-fired" flag prerequisite.
 *
 * Atoms with no `flagsSet` anywhere are repeatable.
 */
function alreadyConsumed(state: WorldState, atom: Encounter): boolean {
  for (const choice of atom.choices) {
    for (const flag of choice.flagsSet ?? []) {
      if (state.player.flagsLife?.[flag] || state.player.flagsLegacy?.[flag]) {
        return true;
      }
    }
  }
  return false;
}
