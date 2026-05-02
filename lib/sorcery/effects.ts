// ============================================================
// LIVING EAMON — Sorcery effect dispatcher (KARMA Sprint 7b)
//
// Translates a successful INVOKE from "chronicle entry only" (Sprint
// 7a) into actual numeric effects: damage to combat enemies, HP
// restored to the caster, poison stacks removed, etc.
//
// Scope (Phase 1):
//   • damage  — rolls Spell.damageRoll, deducts from
//               state.player.activeCombat.enemyCombatant.hp.
//               Out of combat → returns { kind: "no-target" }.
//   • heal    — rolls Spell.healRoll, restores caster HP. Works in
//               or out of combat. Resurrection is special-cased.
//   • cure    — id-based subset of heal effectKind (Cure, Arch
//               Cure). Removes poison status from the caster.
//
// Out of scope (Phase 2 — buff / debuff / summon / field / movement /
// conceal / reveal / transform / utility): returns
// { kind: "dev-not-implemented", reason } — a development-only
// marker that the response composer renders as a visible `[DEV]`
// flag. No in-fiction prose covers these gaps: per Living Eamon's
// design principle, fictional camouflage over unbuilt features is
// a hallucination. The features will be built before release; until
// then the marker shouts. Each Phase-2 kind needs supporting
// infrastructure that doesn't exist yet — temporary stat buffs
// need new ActiveStatusEffect types, summons need an ally combat
// model (dormant), fields need persistent zone state, runebook
// movement needs the rune item model.
//
// Combat-round advancement on cast: the current MVP applies the
// effect WITHOUT consuming a combat round (no enemy retaliation
// triggered). This is over-powered relative to classic CRPG balance
// where casting eats a turn — flagged here for a Phase-2 decision.
// ============================================================

import type { WorldState, TempModifier, MarkedRune } from "../gameState";
import { addToChronicle, movePlayer } from "../gameState";
import type {
  ActiveStatusEffect,
  CombatantState,
  ActiveCombatSession,
} from "../combatTypes";
import { getRoom } from "../adventures/registry";
import type { EffectResult, NumericRange, Spell } from "./types";

/**
 * Discriminated return type. `applied` carries the new state and
 * what physically happened; the other variants signal the caller to
 * abort BEFORE consuming mana / reagents / Illumination.
 */
export type EffectDispatchResult =
  | { kind: "applied"; state: WorldState; effect: EffectResult }
  | { kind: "no-target" }
  | { kind: "no-rune-target"; runeLabel: string | null }
  | { kind: "no-unmarked-rune" };

/**
 * Apply a spell's numeric effect. Caller must already have passed
 * Circle / mana / reagent gates (see lib/sorcery/invoke.ts).
 * `arg` carries any trailing argument the player appended (e.g. a
 * rune label for Teleport / Recall / Gate Travel).
 */
export function applyEffect(
  state: WorldState,
  spell: Spell,
  arg?: string
): EffectDispatchResult {
  switch (spell.effectKind) {
    case "damage":
      return applyDamage(state, spell);

    case "heal":
      return applyHealOrCure(state, spell);

    case "buff":
      if (spell.id === "bless") return applyBless(state, spell);
      return {
        kind: "applied",
        state,
        effect: { kind: "dev-not-implemented", reason: `${spell.id} buff dispatcher` },
      };

    case "movement":
      return applyMovement(state, spell, arg ?? null);

    case "utility":
      if (spell.id === "mark") return applyMark(state, arg ?? null);
      return {
        kind: "applied",
        state,
        effect: { kind: "dev-not-implemented", reason: `${spell.id} utility dispatcher` },
      };

    case "debuff":
    case "summon":
    case "field":
    case "reveal":
    case "conceal":
    case "transform":
      return {
        kind: "applied",
        state,
        effect: {
          kind: "dev-not-implemented",
          reason: `${spell.effectKind} dispatcher`,
        },
      };
  }
}

// ── Damage ───────────────────────────────────────────────────

function applyDamage(state: WorldState, spell: Spell): EffectDispatchResult {
  const session = state.player.activeCombat;
  if (!session) {
    // No active combat — damage spells fizzle harmlessly with no
    // valid target. Resources are NOT consumed (caller checks for
    // `no-target` and returns it before consumeMana/Reagents).
    return { kind: "no-target" };
  }
  if (!spell.damageRoll) {
    // Registry data error — damage spell with no damageRoll. Surface
    // as a dev marker rather than crashing; tests catch it.
    return {
      kind: "applied",
      state,
      effect: {
        kind: "dev-not-implemented",
        reason: `damage spell '${spell.id}' missing damageRoll in registry`,
      },
    };
  }

  const amount = rollRange(spell.damageRoll);
  const enemy = session.enemyCombatant;
  const newHp = Math.max(0, enemy.hp - amount);
  const updatedEnemy: CombatantState = { ...enemy, hp: newHp };
  const updatedSession: ActiveCombatSession = {
    ...session,
    enemyCombatant: updatedEnemy,
  };
  const next: WorldState = {
    ...state,
    player: { ...state.player, activeCombat: updatedSession },
  };

  return {
    kind: "applied",
    state: next,
    effect: {
      kind: "damage-dealt",
      targetName: enemy.name,
      amount,
      targetHpAfter: newHp,
    },
  };
}

// ── Heal / Cure ──────────────────────────────────────────────

function applyHealOrCure(state: WorldState, spell: Spell): EffectDispatchResult {
  // Resurrection — corpse model not yet implemented. Returns a dev
  // marker until the feature lands; no in-fiction prose for an
  // unbuilt feature.
  if (spell.id === "resurrection") {
    return {
      kind: "applied",
      state,
      effect: {
        kind: "dev-not-implemented",
        reason: "Resurrection corpse model",
      },
    };
  }

  // Cure variants: remove poison status from caster (and combat
  // playerCombatant if active). No HP restored.
  if (spell.id === "cure" || spell.id === "arch-cure") {
    return applyCure(state);
  }

  if (!spell.healRoll) {
    // Registry data error — heal spell with no healRoll (and not
    // Cure / Arch Cure / Resurrection).
    return {
      kind: "applied",
      state,
      effect: {
        kind: "dev-not-implemented",
        reason: `heal spell '${spell.id}' missing healRoll in registry`,
      },
    };
  }

  const amount = rollRange(spell.healRoll);
  return applyHpRestore(state, amount);
}

function applyHpRestore(
  state: WorldState,
  amount: number
): EffectDispatchResult {
  const before = state.player.hp;
  const after = Math.min(state.player.maxHp, before + amount);
  const realGain = after - before;

  // Sync into the combat session if active — playerCombatant
  // mirrors player.hp during a fight.
  let next: WorldState = {
    ...state,
    player: { ...state.player, hp: after },
  };
  if (next.player.activeCombat) {
    const session = next.player.activeCombat;
    next = {
      ...next,
      player: {
        ...next.player,
        activeCombat: {
          ...session,
          playerCombatant: { ...session.playerCombatant, hp: after },
        },
      },
    };
  }

  next = addToChronicle(
    next,
    `Sorcery restored ${realGain} HP (${before} → ${after}).`,
    false
  );

  return {
    kind: "applied",
    state: next,
    effect: { kind: "healed", amount: realGain, hpAfter: after, hpBefore: before },
  };
}

function applyCure(state: WorldState): EffectDispatchResult {
  const session = state.player.activeCombat;
  let cured = 0;
  let next: WorldState = state;

  // Out of combat: poison effects don't currently persist on the
  // player record (they live on the combat playerCombatant).
  // Sprint 7b treats out-of-combat Cure as a no-op success — the
  // player has nothing to cure. The chronicle still records the
  // cast (handled in invoke.ts).
  if (!session) {
    return {
      kind: "applied",
      state,
      effect: { kind: "cure-applied", cured: 0 },
    };
  }

  const remaining: ActiveStatusEffect[] = [];
  for (const effect of session.playerCombatant.activeEffects) {
    if (effect.type === "poison") {
      cured += 1;
    } else {
      remaining.push(effect);
    }
  }
  if (cured === 0) {
    return {
      kind: "applied",
      state,
      effect: { kind: "cure-applied", cured: 0 },
    };
  }

  next = {
    ...state,
    player: {
      ...state.player,
      activeCombat: {
        ...session,
        playerCombatant: {
          ...session.playerCombatant,
          activeEffects: remaining,
        },
      },
    },
  };
  next = addToChronicle(next, `Sorcery cured ${cured} poison effect(s).`, false);

  return {
    kind: "applied",
    state: next,
    effect: { kind: "cure-applied", cured },
  };
}

// ── Bless ────────────────────────────────────────────────────
// SORCERY.md §9.2 — Circle 3 Force-I buff. Four effects:
//   1. "blessed" status → poison + bleed resistance (checked in combat engine)
//   2. Temp Illumination +10 (temp modifier overlay, not PICSSI ledger)
//   3. Temp Charisma +5 (temp modifier overlay, not base stat)
//   4. Temple mod: consecrated room → duration 15 turns (normal: 10)
//
// Reagent waiver in temples is handled upstream in invoke.ts before
// consumeReagents runs — effects.ts only applies the physical changes.

const BLESS_DURATION_NORMAL    = 10;
const BLESS_DURATION_TEMPLE    = 15;
const BLESS_ILLUMINATION_BONUS = 10;
const BLESS_CHARISMA_BONUS     =  5;

function applyBless(state: WorldState, spell: Spell): EffectDispatchResult {
  const room      = getRoom(state.player.currentRoom);
  const inTemple  = room?.consecrated === true;
  const duration  = inTemple ? BLESS_DURATION_TEMPLE : BLESS_DURATION_NORMAL;

  const blessedEffect: ActiveStatusEffect = {
    type: "blessed",
    zone: "torso",       // zone is structural — "torso" is the canonical body-wide zone
    severity: 1,
    turnsRemaining: duration,
  };

  const newTempMods: TempModifier[] = [
    { stat: "illumination", delta: BLESS_ILLUMINATION_BONUS, turnsRemaining: duration, source: "bless" },
    { stat: "charisma",     delta: BLESS_CHARISMA_BONUS,     turnsRemaining: duration, source: "bless" },
  ];

  // Remove any pre-existing Bless effects before applying (re-casting refreshes).
  const filteredEffects = state.player.activeEffects.filter(e => e.type !== "blessed");
  const filteredMods    = (state.player.tempModifiers ?? []).filter(m => m.source !== "bless");

  let next: WorldState = {
    ...state,
    player: {
      ...state.player,
      activeEffects: [...filteredEffects, blessedEffect],
      tempModifiers: [...filteredMods, ...newTempMods],
    },
  };

  // Sync blessed effect into active combat session if in combat.
  if (next.player.activeCombat) {
    const session = next.player.activeCombat;
    const combatEffects = session.playerCombatant.activeEffects.filter(e => e.type !== "blessed");
    next = {
      ...next,
      player: {
        ...next.player,
        activeCombat: {
          ...session,
          playerCombatant: {
            ...session.playerCombatant,
            activeEffects: [...combatEffects, blessedEffect],
          },
        },
      },
    };
  }

  next = addToChronicle(
    next,
    `Bless applied: ${duration} turns, +${BLESS_ILLUMINATION_BONUS} Illumination (temp), +${BLESS_CHARISMA_BONUS} Charisma (temp)${inTemple ? " [temple — reagents waived]" : ""}.`,
    false
  );

  return {
    kind: "applied",
    state: next,
    effect: { kind: "blessed", turnsGranted: duration, inTemple },
  };
}

// ── Rune Travel (Sprint 7b.T) ─────────────────────────────────
// SORCERY.md §9.1 — Mark / Teleport / Recall / Gate Travel.
//
// Mark (C6 utility):   consumes 1 unmarked_rune item, writes a
//   MarkedRune entry onto player.markedRunes. Auto-generates label
//   from room name; player can supply a custom label as `arg`.
//
// Teleport (C3 movement): resolves the rune label, calls movePlayer.
//   Rune stays intact (cheap, reusable).
//
// Recall (C4 movement): same as Teleport but removes the rune entry
//   (one-shot retreat).
//
// Gate Travel (C7 movement): first pass — acts like Teleport; rune
//   stays. The two-way moongate entity (other beings traversing) is
//   deferred to the moongate-gameplay sprint.

const GATE_DURATION_TURNS = 5;

function applyMark(
  state: WorldState,
  arg: string | null
): EffectDispatchResult {
  // Gate: must have an unmarked_rune in inventory.
  const hasRune = state.player.inventory.some(
    i => i.itemId === "unmarked_rune" && i.quantity > 0
  );
  if (!hasRune) return { kind: "no-unmarked-rune" };

  const room = getRoom(state.player.currentRoom);
  const roomName = room?.name ?? state.player.currentRoom;
  const planeId  = room?.planeId ?? state.player.currentPlane ?? "thurian";
  const rawLabel = arg?.trim() ?? "";
  const label    = rawLabel.length > 0 ? rawLabel : `rune to ${roomName}`;

  const newRune: MarkedRune = {
    id: `rune-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    targetRoomId:  state.player.currentRoom,
    targetPlaneId: planeId,
    label,
  };

  // Consume 1 unmarked_rune from inventory.
  const inventory = state.player.inventory.map(i => ({ ...i }));
  for (let i = 0; i < inventory.length; i++) {
    if (inventory[i].itemId === "unmarked_rune" && inventory[i].quantity > 0) {
      inventory[i].quantity -= 1;
      break;
    }
  }

  let next: WorldState = {
    ...state,
    player: {
      ...state.player,
      inventory: inventory.filter(i => i.quantity > 0),
      markedRunes: [...(state.player.markedRunes ?? []), newRune],
    },
  };
  next = addToChronicle(next, `Mark bound: "${label}" → ${roomName}.`, false);

  return {
    kind: "applied",
    state: next,
    effect: { kind: "marked", label, roomName },
  };
}

function applyMovement(
  state: WorldState,
  spell: Spell,
  arg: string | null
): EffectDispatchResult {
  switch (spell.id) {
    case "teleport":
      return applyTeleport(state, arg, "teleport");
    case "recall":
      return applyTeleport(state, arg, "recall");
    case "gate-travel":
      return applyGateTravel(state, arg);
    default:
      return {
        kind: "applied",
        state,
        effect: { kind: "dev-not-implemented", reason: `${spell.id} movement dispatcher` },
      };
  }
}

function applyTeleport(
  state: WorldState,
  arg: string | null,
  spellId: "teleport" | "recall"
): EffectDispatchResult {
  const label = arg?.trim().toLowerCase() ?? null;
  const rune  = findRune(state, label);
  if (!rune) return { kind: "no-rune-target", runeLabel: label };

  const room        = getRoom(rune.targetRoomId);
  const destination = room?.name ?? rune.targetRoomId;

  // Runes are permanent magical devices — never consumed on use.
  let next = movePlayer(state, rune.targetRoomId);
  next = { ...next, player: { ...next.player, currentPlane: rune.targetPlaneId } };
  next = addToChronicle(
    next,
    `${spellId === "recall" ? "Recall" : "Teleport"}: arrived at ${destination}.`,
    false
  );

  return {
    kind: "applied",
    state: next,
    effect: spellId === "recall"
      ? { kind: "recalled",   runeLabel: rune.label, destination }
      : { kind: "teleported", runeLabel: rune.label, destination },
  };
}

function applyGateTravel(
  state: WorldState,
  arg: string | null
): EffectDispatchResult {
  const label = arg?.trim().toLowerCase() ?? null;
  const rune  = findRune(state, label);
  if (!rune) return { kind: "no-rune-target", runeLabel: label };

  const room = getRoom(rune.targetRoomId);
  const destination = room?.name ?? rune.targetRoomId;

  // First pass: player is immediately transported (moongate entity +
  // two-way traversal deferred to the moongate-gameplay sprint).
  let next = movePlayer(state, rune.targetRoomId);
  next = { ...next, player: { ...next.player, currentPlane: rune.targetPlaneId } };
  next = addToChronicle(
    next,
    `Gate Travel: moongate to ${destination} opened (${GATE_DURATION_TURNS} turns; two-way traversal pending).`,
    false
  );

  return {
    kind: "applied",
    state: next,
    effect: {
      kind: "gate-opened",
      runeLabel: rune.label,
      destination,
      durationTurns: GATE_DURATION_TURNS,
    },
  };
}

/** Case-insensitive label lookup on player.markedRunes. */
function findRune(state: WorldState, label: string | null): MarkedRune | null {
  if (!label) return null;
  const runes = state.player.markedRunes ?? [];
  return runes.find(r => r.label.toLowerCase() === label) ?? null;
}

// ── Helpers ──────────────────────────────────────────────────

function rollRange(range: NumericRange): number {
  const lo = Math.min(range.min, range.max);
  const hi = Math.max(range.min, range.max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
