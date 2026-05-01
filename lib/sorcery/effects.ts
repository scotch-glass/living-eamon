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
// { kind: "no-effect-yet" } so the caller still consumes mana +
// reagents + Illumination (the cast happened) but the physical
// outcome is deferred. Each Phase-2 kind needs design that doesn't
// exist yet — temporary stat buffs need new ActiveStatusEffect
// types, summons need an ally combat model (dormant), fields need
// persistent zone state, runebook movement needs the rune item model.
//
// Combat-round advancement on cast: the current MVP applies the
// effect WITHOUT consuming a combat round (no enemy retaliation
// triggered). This is over-powered relative to classic CRPG balance
// where casting eats a turn — flagged here for a Phase-2 decision.
// ============================================================

import type { WorldState } from "../gameState";
import { addToChronicle } from "../gameState";
import type {
  ActiveStatusEffect,
  CombatantState,
  ActiveCombatSession,
} from "../combatTypes";
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

    // Phase-2 kinds — cast goes through, physical effect deferred.
    case "buff":
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
        effect: { kind: "no-effect-yet", effectKind: spell.effectKind },
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
    // Damage spell missing a damage roll — registry data error. Treat
    // as no-effect-yet rather than crashing; tests will catch it.
    return {
      kind: "applied",
      state,
      effect: { kind: "no-effect-yet", effectKind: spell.effectKind },
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
  // Resurrection is a heal-effectKind spell with no healRoll —
  // currently a no-op until corpse model lands.
  if (spell.id === "resurrection") {
    return {
      kind: "applied",
      state,
      effect: { kind: "resurrection-no-corpse" },
    };
  }

  // Cure variants: remove poison status from caster (and combat
  // playerCombatant if active). No HP restored.
  if (spell.id === "cure" || spell.id === "arch-cure") {
    return applyCure(state);
  }

  if (!spell.healRoll) {
    return {
      kind: "applied",
      state,
      effect: { kind: "no-effect-yet", effectKind: spell.effectKind },
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

// ── Helpers ──────────────────────────────────────────────────

function rollRange(range: NumericRange): number {
  const lo = Math.min(range.min, range.max);
  const hi = Math.max(range.min, range.max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
