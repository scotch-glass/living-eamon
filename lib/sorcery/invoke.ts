// ============================================================
// LIVING EAMON — INVOKE parser/dispatcher (KARMA Sprint 7a)
//
// Wires the player's `INVOKE <words>` command to the spell registry.
// Gate checks: known Circle, mana, reagents. On success, deducts
// resources, drains Illumination per circle (Circles 4+), fires the
// narrative warning for Circles 1-3, and returns a structured
// outcome the gameEngine.ts handler can render.
//
// Effects (the actual numeric damage/heal/buff/debuff outcomes) are
// stubbed at chronicle level for Sprint 7a. Sprint 7b will dispatch
// per `effectKind`.
//
// Unrecognized invocations return `{ kind: "unrecognized" }` and the
// caller falls through to Jane (per SORCERY.md §3 — Words of Power
// must be discovered in-game; there's no in-game HELP for Occult).
// ============================================================

import type { WorldState, PlayerState } from "../gameState";
import { addToChronicle } from "../gameState";
import { applyKarma, logKarmaDelta } from "../karma/recompute";
import { getSpellByWords } from "./registry";
import { applyEffect } from "./effects";
import type { InvokeOutcome, ReagentId, Spell } from "./types";
import { CIRCLE_NARRATIVE_WARNING } from "./types";

export interface InvokeResult {
  outcome: InvokeOutcome;
  state: WorldState;
}

/**
 * Parse + dispatch an INVOKE command.
 *
 * @param state  current WorldState
 * @param args   the player's text after the INVOKE keyword
 *               (e.g., "Mit Tela" → tokens ["Mit","Tela"])
 */
export function handleInvoke(state: WorldState, args: string): InvokeResult {
  const tokens = args.trim().split(/\s+/).filter(t => t.length > 0);

  if (tokens.length === 0) {
    return { outcome: { kind: "fizzle-no-reagents", words: [] }, state };
  }

  const spell = getSpellByWords(tokens);
  if (!spell) {
    return { outcome: { kind: "unrecognized" }, state };
  }

  // 1. Circle gate
  const known = state.player.knownCircles ?? [];
  if (!known.includes(spell.circle)) {
    return { outcome: { kind: "circle-locked", spell }, state };
  }

  // 2. Mana gate
  if (state.player.currentMana < spell.manaCost) {
    return {
      outcome: {
        kind: "insufficient-mana",
        spell,
        need: spell.manaCost,
        have: state.player.currentMana,
      },
      state,
    };
  }

  // 3. Reagent gate
  const missing = findMissingReagents(state.player, spell.reagents);
  if (missing.length > 0) {
    return { outcome: { kind: "missing-reagents", spell, missing }, state };
  }

  // 4. Effect dispatch (Sprint 7b). Resolves BEFORE consuming mana
  //    + reagents so a damage-spell-with-no-target returns no-target
  //    without burning the player's resources. Phase-2 effect kinds
  //    (buff/debuff/summon/field/etc.) return `no-effect-yet` —
  //    resources still get consumed in that case (the cast happened;
  //    only the physical magnitude is unimplemented).
  const dispatch = applyEffect(state, spell);
  if (dispatch.kind === "no-target") {
    return { outcome: { kind: "no-target", spell }, state };
  }

  // 5. Consume mana + reagents, apply Illumination drain, chronicle
  let next: WorldState = dispatch.state;
  next = consumeReagents(next, spell.reagents);
  next = consumeMana(next, spell.manaCost);

  if (spell.illuminationDrain !== 0) {
    const drained = applyKarma(next.player, {
      illumination: spell.illuminationDrain,
    });
    const logged = logKarmaDelta(
      drained,
      { illumination: spell.illuminationDrain },
      `sorcery:invoke:${spell.id}`
    );
    next = { ...next, player: logged };
  }

  const warning = CIRCLE_NARRATIVE_WARNING[spell.circle] ?? null;

  next = addToChronicle(
    next,
    `Invoked ${spell.name}: ${spell.description}`,
    false  // private — Order detection is Phase 2
  );

  return {
    outcome: {
      kind: "success",
      spell,
      illuminationDrained: spell.illuminationDrain,
      warning,
      effect: dispatch.effect,
    },
    state: next,
  };
}

// ── Helpers ──────────────────────────────────────────────────

function findMissingReagents(
  player: PlayerState,
  required: ReagentId[]
): ReagentId[] {
  const have = new Map<string, number>();
  for (const item of player.inventory) {
    have.set(item.itemId, (have.get(item.itemId) ?? 0) + item.quantity);
  }
  const need = new Map<string, number>();
  for (const r of required) {
    need.set(r, (need.get(r) ?? 0) + 1);
  }
  const missing: ReagentId[] = [];
  for (const [reagent, count] of need) {
    if ((have.get(reagent) ?? 0) < count) {
      missing.push(reagent as ReagentId);
    }
  }
  return missing;
}

function consumeReagents(state: WorldState, reagents: ReagentId[]): WorldState {
  const inventory = state.player.inventory.map(i => ({ ...i }));
  const counts = new Map<string, number>();
  for (const r of reagents) counts.set(r, (counts.get(r) ?? 0) + 1);

  for (const [reagentId, count] of counts) {
    let remaining = count;
    for (let i = 0; i < inventory.length && remaining > 0; i++) {
      if (inventory[i].itemId === reagentId) {
        const take = Math.min(inventory[i].quantity, remaining);
        inventory[i].quantity -= take;
        remaining -= take;
      }
    }
  }

  return {
    ...state,
    player: {
      ...state.player,
      inventory: inventory.filter(i => i.quantity > 0),
    },
  };
}

function consumeMana(state: WorldState, cost: number): WorldState {
  return {
    ...state,
    player: {
      ...state.player,
      currentMana: Math.max(0, state.player.currentMana - cost),
    },
  };
}

// ── Static response composer ─────────────────────────────────

/**
 * Compose a player-facing message from an InvokeOutcome. The
 * gameEngine.ts handler calls this to build its `staticResponse`.
 */
export function composeInvokeResponse(outcome: InvokeOutcome): string {
  switch (outcome.kind) {
    case "fizzle-no-reagents":
    case "unrecognized":
      return ""; // caller routes to Jane fallback

    case "circle-locked": {
      const spell = outcome.spell;
      const words = spell.words.join(" ");
      return `You speak the Words — *${words}* — and the syllables sit easy on your tongue, as if you had spoken them in some life before this one. But the Circle they belong to has not yet opened its door to you. The invocation finds no road to travel; a breath of sulfur clings to the room, and the Art waits, patient as the dead.`;
    }

    case "insufficient-mana": {
      const { spell, need, have } = outcome;
      return `The Words leave your tongue and find no answer. ${spell.name} would drink ${need} from the wells of you; ${have} is all that remains in them. The intent gathers, falters, and is sealed back inside you — a breath that wanted to be a fire.`;
    }

    case "missing-reagents": {
      const { spell, missing } = outcome;
      const labels = missing.map(reagentLabel).join(", ");
      return `The Words shape themselves on the air, but the Art will have more than syllables. ${spell.name} hungers for ${labels}, and your hand finds no such things to feed it. Sulfur clings briefly to the room; the gathered intent dissipates, unblooded.`;
    }

    case "no-target": {
      const { spell } = outcome;
      return `You speak the Words and the Art rises to meet them — gathers, coils, seeks the transmuted fear and malice required to destroy life from which ${spell.name} is made — and finds no such energy nor foe before you to take it. After a heartbeat the intent unwinds and slips back into the silences from which it came. Your reagents stay in your pouch unbroken; the mana stays in your blood unspilt.`;
    }

    case "success": {
      const { spell, illuminationDrained, warning, effect } = outcome;
      const lines: string[] = [];
      lines.push(`*The Words leave your tongue. ${spell.name} answers.*`);
      lines.push("");
      lines.push(spell.description);

      // Sprint 7b — physical effect line
      const effectLine = composeEffectLine(effect);
      if (effectLine) {
        lines.push("");
        lines.push(effectLine);
      }

      if (warning) {
        lines.push("");
        lines.push(`*${warning}*`);
      }
      if (illuminationDrained < 0) {
        lines.push("");
        lines.push(
          `*Something in your soul registers the cost: Illumination ${illuminationDrained}.*`
        );
      }
      return lines.join("\n");
    }
  }
}

function composeEffectLine(effect: import("./types").EffectResult): string | null {
  switch (effect.kind) {
    case "damage-dealt":
      if (effect.targetHpAfter === 0) {
        return `**${effect.targetName} falls — silenced by the Art.** (${effect.amount} damage)`;
      }
      return `**${effect.targetName} reels under the strike; the breath rakes out of them.** (${effect.amount} damage; ${effect.targetHpAfter} HP remaining)`;
    case "healed":
      if (effect.amount === 0) {
        return `*The Art rises in you, finds no wound to mend, and settles back into your blood.*`;
      }
      return `**Warmth gathers under your skin where the Art has answered.** (${effect.amount} HP; ${effect.hpBefore} → ${effect.hpAfter})`;
    case "cure-applied":
      if (effect.cured === 0) {
        return `*The Art reaches for the poisoned places in you and finds none. It settles, unspent.*`;
      }
      return `**Black flowers wither in your veins; the poison forgets its purpose.** (${effect.cured} cured)`;
    case "dev-not-implemented":
      // Development-only marker. By design principle (no in-fiction
      // prose for unbuilt features), this surfaces as a visible
      // [DEV] flag any reader can grep for. Must be dead code by
      // release — when every effect dispatcher and supporting model
      // is wired, this branch is unreachable and gets removed.
      return `[DEV] ${effect.reason} not yet implemented`;
  }
}

function reagentLabel(r: ReagentId): string {
  switch (r) {
    case "black_pearl":    return "Black Pearl";
    case "blood_moss":     return "Blood Moss";
    case "garlic":         return "Garlic";
    case "ginseng":        return "Ginseng";
    case "mandrake_root":  return "Mandrake Root";
    case "nightshade":     return "Nightshade";
    case "spider_silk":    return "Spider Silk";
    case "sulfurous_ash":  return "Sulfurous Ash";
  }
}
