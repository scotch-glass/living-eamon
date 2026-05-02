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

import type { WorldState, TempModifier } from "../gameState";
import { addToChronicle } from "../gameState";
import type {
  ActiveStatusEffect,
  CombatantState,
  ActiveCombatSession,
} from "../combatTypes";
import { getRoom } from "../adventures/registry";
import type { EffectResult, NumericRange, Spell } from "./types";

/**
 * Discriminated return type. `applied` carries the new state and
 * what physically happened; `no-target` signals the caller to
 * abort BEFORE consuming mana / reagents / Illumination.
 */
export type EffectDispatchResult =
  | { kind: "applied"; state: WorldState; effect: EffectResult }
  | { kind: "no-target" };

/**
 * Apply a spell's numeric effect. Caller must already have passed
 * Circle / mana / reagent gates (see lib/sorcery/invoke.ts).
 */
export function applyEffect(
  state: WorldState,
  spell: Spell
): EffectDispatchResult {
  switch (spell.effectKind) {
    case "damage":
      return applyDamage(state, spell);

    case "heal":
      return applyHealOrCure(state, spell);

    // Phase-2 kinds — cast goes through, physical effect not yet
    // implemented. Returns a dev-only marker that the composer
    // renders as `[DEV] <effectKind> dispatcher not yet implemented`.
    // No in-fiction camouflage: when the dispatcher lands the marker
    // disappears, and until then it's flagged for any session that
    // hits it.
    case "buff":
      if (spell.id === "bless") return applyBless(state, spell);
      return {
        kind: "applied",
        state,
        effect: { kind: "dev-not-implemented", reason: `${spell.id} buff dispatcher` },
      };

    case "debuff":
    case "summon":
    case "movement":
    case "field":
    case "reveal":
    case "conceal":
    case "transform":
    case "utility":
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

// ── Helpers ──────────────────────────────────────────────────

function rollRange(range: NumericRange): number {
  const lo = Math.min(range.min, range.max);
  const hi = Math.max(range.min, range.max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
