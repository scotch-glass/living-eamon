// ============================================================
// KARMA — Atom choice resolver
// KARMA Sprint 4. When the player picks a choice from a presented
// atom, this module:
//   - converts the atom's CapitalCase karma to PICSSI lowercase
//   - funnels the karma delta through `applyKarma` (canonical mutation)
//   - clamps NPC affection to 0..100
//   - sets life-scope flags
//   - applies gold / HP / item deltas via existing helpers
//   - clears `pendingAtom`
//   - writes a chronicle line for the deed
// ============================================================

import type { WorldState } from "../gameState";
import type { Choice, Encounter, Virtue } from "./atom-types";
import type { KarmaDelta, PicssiVirtue } from "./types";
import { applyKarma, logKarmaDelta } from "./recompute";

/** Present an atom: set `pendingAtom`, return the player-facing prompt + numbered choices. */
export function presentAtom(
  state: WorldState,
  atom: Encounter
): { state: WorldState; rendered: string } {
  const next: WorldState = {
    ...state,
    player: {
      ...state.player,
      pendingAtom: { atomId: atom.id, presentedAt: state.worldTurn },
    },
  };
  return { state: next, rendered: renderAtom(atom) };
}

/** Player-facing render — atom prompt + numbered choices. */
export function renderAtom(atom: Encounter): string {
  const lines: string[] = [];
  lines.push(atom.prompt);
  lines.push("");
  atom.choices.forEach((c, i) => {
    lines.push(`  ${i + 1}. ${c.label}`);
  });
  lines.push("");
  lines.push("(Type the number of your choice.)");
  return lines.join("\n");
}

/**
 * Resolve a choice. Caller has already validated `choiceIndex` is in
 * range. Returns the new state + a narration string drawn from the
 * choice's `resolutionHint` (the designer-facing one-line outcome).
 */
export function applyChoice(
  state: WorldState,
  atom: Encounter,
  choiceIndex: number
): { state: WorldState; narrative: string } {
  const choice = atom.choices[choiceIndex];
  if (!choice) {
    return {
      state: clearPendingAtom(state),
      narrative: "The moment passes. Nothing more happens here.",
    };
  }

  let next: WorldState = clearPendingAtom(state);

  // 1. PICSSI deltas — translate CapitalCase atom virtues → lowercase
  const picssiDelta = atomKarmaToPicssi(choice.karma);
  if (Object.keys(picssiDelta).length > 0) {
    next = { ...next, player: applyKarma(next.player, picssiDelta) };
    next = {
      ...next,
      player: logKarmaDelta(next.player, picssiDelta, `atom: ${atom.id} → ${choice.id}`),
    };
  }

  // 2. NPC affection — clamp 0..100 per npcId
  if (choice.npcAffection) {
    const updated: Record<string, number> = { ...(next.player.npcAffection ?? {}) };
    for (const [npcId, delta] of Object.entries(choice.npcAffection)) {
      const cur = updated[npcId] ?? 0;
      updated[npcId] = Math.max(0, Math.min(100, cur + delta));
    }
    next = { ...next, player: { ...next.player, npcAffection: updated } };
  }

  // 3. Flags — default scope is `life`. Atoms can prefix a flag with
  //    "legacy:" to set into flagsLegacy instead.
  if (choice.flagsSet?.length) {
    const flagsLife = { ...(next.player.flagsLife ?? {}) };
    const flagsLegacy = { ...(next.player.flagsLegacy ?? {}) };
    for (const flag of choice.flagsSet) {
      if (flag.startsWith("legacy:")) {
        flagsLegacy[flag.slice("legacy:".length)] = true;
      } else {
        flagsLife[flag] = true;
      }
    }
    next = { ...next, player: { ...next.player, flagsLife, flagsLegacy } };
  }

  // 4. Gold + HP deltas
  if (choice.goldDelta) {
    next = {
      ...next,
      player: { ...next.player, gold: Math.max(0, next.player.gold + choice.goldDelta) },
    };
  }
  if (choice.hpDelta) {
    next = {
      ...next,
      player: {
        ...next.player,
        hp: Math.max(0, Math.min(next.player.maxHp, next.player.hp + choice.hpDelta)),
      },
    };
  }

  // 5. Item gain / loss
  if (choice.itemsGained?.length) {
    next = { ...next, player: { ...next.player, inventory: addItems(next.player.inventory, choice.itemsGained) } };
  }
  if (choice.itemsLost?.length) {
    next = { ...next, player: { ...next.player, inventory: removeItems(next.player.inventory, choice.itemsLost) } };
  }

  return {
    state: next,
    narrative: choice.resolutionHint,
  };
}

export function clearPendingAtom(state: WorldState): WorldState {
  if (!state.player.pendingAtom) return state;
  return { ...state, player: { ...state.player, pendingAtom: null } };
}

// ── Helpers ───────────────────────────────────────────────────

/** "Passion" → "passion", etc. PICSSI uses lowercase keys. */
function atomKarmaToPicssi(karma: Partial<Record<Virtue, number>>): KarmaDelta {
  const out: KarmaDelta = {};
  for (const [virtue, delta] of Object.entries(karma) as Array<[Virtue, number | undefined]>) {
    if (!delta) continue;
    const key = virtue.toLowerCase() as PicssiVirtue;
    out[key] = (out[key] ?? 0) + delta;
  }
  return out;
}

function addItems(
  inventory: { itemId: string; quantity: number }[],
  itemIds: string[]
): { itemId: string; quantity: number }[] {
  const next = inventory.map(e => ({ ...e }));
  for (const id of itemIds) {
    const existing = next.find(e => e.itemId === id);
    if (existing) existing.quantity += 1;
    else next.push({ itemId: id, quantity: 1 });
  }
  return next;
}

function removeItems(
  inventory: { itemId: string; quantity: number }[],
  itemIds: string[]
): { itemId: string; quantity: number }[] {
  const next = inventory.map(e => ({ ...e }));
  for (const id of itemIds) {
    const existing = next.find(e => e.itemId === id);
    if (!existing) continue;
    existing.quantity -= 1;
  }
  return next.filter(e => e.quantity > 0);
}
