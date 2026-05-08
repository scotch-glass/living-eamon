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

import type { WorldState, TempModifier, PlayerInventoryItem, Corpse } from "../gameState";
import { addToChronicle, movePlayer, pushResidue } from "../gameState";
import { SPELL_RESIDUE } from "../world/spellResidue";
import type {
  ActiveStatusEffect,
  Barrier,
  CombatantState,
  ActiveCombatSession,
} from "../combat/types";
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
  let result: EffectDispatchResult;

  switch (spell.effectKind) {
    case "damage":
      result = applyDamage(state, spell);
      break;

    case "heal":
      result = applyHealOrCure(state, spell, arg);
      break;

    case "buff":
      if (spell.id === "bless")          { result = applyBless(state, spell); break; }
      if (spell.id === "cunning")        { result = applyCunning(state); break; }
      if (spell.id === "strength")       { result = applyStrengthBuff(state); break; }
      if (spell.id === "agility")        { result = applyAgilityBuff(state); break; }
      if (spell.id === "protection")     { result = applyProtection(state); break; }
      if (spell.id === "reactive-armor") { result = applyReactiveArmor(state); break; }
      if (spell.id === "night-sight")    { result = applyNightSight(state); break; }
      result = {
        kind: "applied",
        state,
        effect: { kind: "dev-not-implemented", reason: `${spell.id} buff dispatcher` },
      };
      break;

    case "movement":
      result = applyMovement(state, spell, arg ?? null);
      break;

    case "utility":
      if (spell.id === "mark") { result = applyMark(state, arg ?? null); break; }
      result = {
        kind: "applied",
        state,
        effect: { kind: "dev-not-implemented", reason: `${spell.id} utility dispatcher` },
      };
      break;

    case "debuff":
      if (spell.id === "feeblemind") { result = applyFeeblemind(state); break; }
      if (spell.id === "poison")     { result = applyPoison(state); break; }
      if (spell.id === "weaken")     { result = applyWeaken(state); break; }
      if (spell.id === "clumsy")     { result = applyClumsy(state); break; }
      if (spell.id === "curse")      { result = applyCurse(state); break; }
      if (spell.id === "paralyze")   { result = applyParalyze(state); break; }
      result = {
        kind: "applied",
        state,
        effect: { kind: "dev-not-implemented", reason: `${spell.id} debuff dispatcher` },
      };
      break;

    case "field":
      if (spell.id === "wall-of-stone") { result = applyWallOfStone(state); break; }
      result = {
        kind: "applied",
        state,
        effect: { kind: "dev-not-implemented", reason: `${spell.id} field dispatcher` },
      };
      break;

    case "summon":
    case "reveal":
    case "conceal":
    case "transform":
      result = {
        kind: "applied",
        state,
        effect: {
          kind: "dev-not-implemented",
          reason: `${spell.effectKind} dispatcher`,
        },
      };
      break;
  }

  // Sprint G5 — push room residue if this spell leaves one
  if (result.kind === "applied") {
    const template = SPELL_RESIDUE[spell.id];
    if (template) {
      result = {
        ...result,
        state: pushResidue(
          result.state,
          result.state.player.currentRoom,
          template,
          spell.id,
          spell.circle
        ),
      };
    }
  }

  return result;
}

// ── Spell-strength multiplier ─────────────────────────────────
// Reads the caster's tempModifiers for spell_strength delta and
// returns a multiplier (e.g. 1.33 with Cunning, 0.67 with Feeblemind).
// Only the player casts spells in the current engine; NPC dispatchers
// will call an equivalent helper when NPC spellcasting lands.

function spellStrengthMult(state: WorldState): number {
  const mods = state.player.tempModifiers ?? [];
  const delta = mods
    .filter(m => m.stat === "spell_strength")
    .reduce((sum, m) => sum + m.delta, 0);
  return Math.max(0, 1 + delta / 100);
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

  const amount = Math.round(rollRange(spell.damageRoll) * spellStrengthMult(state));
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

function applyHealOrCure(state: WorldState, spell: Spell, arg?: string): EffectDispatchResult {
  if (spell.id === "resurrection") {
    return applyResurrection(state, arg ?? null);
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

  const amount = Math.round(rollRange(spell.healRoll) * spellStrengthMult(state));
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

// ── Resurrection (Sprint 7b.R) ───────────────────────────────
// SORCERY.md §9.3 — Circle 8 heal (Solv Mort + arg = corpse target).
//
// Validates: mortal corpse in current room, neither sun nor moon
// has yet exposed it (both = soul gone on). Restores the NPC to
// alive. Undead-risk: >24 turns since death = 50% chance of
// returning as undead (status applied to the NPC state).
// Hero corpses and immortal creatures always reject.

// Random 0..1 for undead roll — seeded only in tests.
let _randFn: () => number = Math.random;
/** Test-only: replace the RNG. Reset to Math.random after your test. */
export function _setResurrectionRng(fn: () => number): void { _randFn = fn; }

function applyResurrection(state: WorldState, arg: string | null): EffectDispatchResult {
  const roomId  = state.player.currentRoom;

  // Resolve corpse by matching arg against corpses in the current room.
  const candidates = Object.values(state.corpses ?? {}).filter(
    c => c.roomId === roomId && c.context === "surface"
  );

  let corpse: Corpse | null = null;
  if (arg) {
    const needle = arg.toLowerCase();
    corpse = candidates.find(c =>
      c.name.toLowerCase().includes(needle) ||
      c.originalNpcId.toLowerCase().includes(needle)
    ) ?? null;
  } else if (candidates.length === 1) {
    corpse = candidates[0]!;
  }

  if (!corpse) {
    const targetName = arg ?? null;
    // Distinguish "no corpse at all" from "named one not found".
    const reason = candidates.length === 0 ? "no-corpse" : "not-in-room";
    return {
      kind: "applied",
      state,
      effect: { kind: "resurrection-rejected", reason, targetName },
    };
  }

  if (corpse.isHeroCorpse) {
    return {
      kind: "applied",
      state,
      effect: { kind: "resurrection-rejected", reason: "hero-corpse", targetName: corpse.name },
    };
  }

  if (corpse.creatureKind === "immortal") {
    return {
      kind: "applied",
      state,
      effect: { kind: "resurrection-rejected", reason: "immortal", targetName: corpse.name },
    };
  }

  if (corpse.sunExposed && corpse.moonExposed) {
    return {
      kind: "applied",
      state,
      effect: { kind: "resurrection-rejected", reason: "sun-and-moon", targetName: corpse.name },
    };
  }

  // Valid target. Remove the corpse and restore the NPC.
  const turnsElapsed = state.worldTurn - corpse.timeOfDeath;
  const returnedAsUndead = turnsElapsed > 24 && _randFn() < 0.5;

  // Remove corpse from world.
  const { [corpse.id]: _removed, ...remainingCorpses } = (state.corpses ?? {});

  // Restore NPC state entry to alive.
  const npcId = corpse.originalNpcId;
  const existingNpcState = state.npcs[npcId];
  let next: WorldState = {
    ...state,
    corpses: remainingCorpses,
  };
  if (existingNpcState) {
    next = {
      ...next,
      npcs: {
        ...next.npcs,
        [npcId]: { ...existingNpcState, isAlive: true },
      },
    };
  }

  next = addToChronicle(
    next,
    `Resurrection: ${corpse.name} returned${returnedAsUndead ? " as undead" : ""}.`,
    false
  );

  return {
    kind: "applied",
    state: next,
    effect: { kind: "resurrected", targetName: corpse.name, returnedAsUndead },
  };
}

// ── Cunning / Feeblemind (Sprint 7b.cunning) ─────────────────
// SORCERY.md §9.6 — ±33% spell strength AND spell success chance.
//
// Cunning (Circle 2 buff, Aug Mens): self-buff on the caster.
//   Adds +33 to spell_strength and spell_success TempModifiers.
//   spellStrengthMult() reads these when damage/heal rolls are made.
//
// Feeblemind (Circle 1 debuff, Min Mens): applied to the active enemy.
//   Adds "feeblemind" status to enemyCombatant.activeEffects.
//   NPC spell dispatchers will read this when NPC spellcasting lands.
//   Out of combat → no-target.

const CUNNING_FEEBLEMIND_DURATION = 10;
const CUNNING_FEEBLEMIND_DELTA    = 33; // percentage points

function applyCunning(state: WorldState): EffectDispatchResult {
  const duration = CUNNING_FEEBLEMIND_DURATION;
  const delta    = CUNNING_FEEBLEMIND_DELTA;

  const statusEffect: ActiveStatusEffect = {
    type: "cunning",
    zone: "torso",
    severity: 1,
    turnsRemaining: duration,
  };

  const newMods: TempModifier[] = [
    { stat: "spell_strength", delta,  turnsRemaining: duration, source: "cunning" },
    { stat: "spell_success",  delta,  turnsRemaining: duration, source: "cunning" },
  ];

  const filteredEffects = state.player.activeEffects.filter(e => e.type !== "cunning");
  const filteredMods    = (state.player.tempModifiers ?? []).filter(m => m.source !== "cunning");

  let next: WorldState = {
    ...state,
    player: {
      ...state.player,
      activeEffects: [...filteredEffects, statusEffect],
      tempModifiers: [...filteredMods, ...newMods],
    },
  };

  if (next.player.activeCombat) {
    const session = next.player.activeCombat;
    const combatEffects = session.playerCombatant.activeEffects.filter(e => e.type !== "cunning");
    next = {
      ...next,
      player: {
        ...next.player,
        activeCombat: {
          ...session,
          playerCombatant: {
            ...session.playerCombatant,
            activeEffects: [...combatEffects, statusEffect],
          },
        },
      },
    };
  }

  return {
    kind: "applied",
    state: next,
    effect: { kind: "cunning-applied", turnsGranted: duration },
  };
}

function applyFeeblemind(state: WorldState): EffectDispatchResult {
  const session = state.player.activeCombat;
  if (!session) return { kind: "no-target" };

  const duration = CUNNING_FEEBLEMIND_DURATION;

  const statusEffect: ActiveStatusEffect = {
    type: "feeblemind",
    zone: "torso",
    severity: 1,
    turnsRemaining: duration,
  };

  const enemyEffects = session.enemyCombatant.activeEffects.filter(e => e.type !== "feeblemind");
  const updatedEnemy: CombatantState = {
    ...session.enemyCombatant,
    activeEffects: [...enemyEffects, statusEffect],
  };

  const next: WorldState = {
    ...state,
    player: {
      ...state.player,
      activeCombat: { ...session, enemyCombatant: updatedEnemy },
    },
  };

  return {
    kind: "applied",
    state: next,
    effect: { kind: "feeblemind-applied", turnsGranted: duration },
  };
}

// ── Poison (Sprint 7b.poison) ────────────────────────────────
// SORCERY.md — Circle 3 debuff (Crea Tox). Applies a persistent
// poison status to the active enemy. Uses the existing damagePerTurn
// mechanism in tickStatusEffects (combatEngine.ts:489) — the field is
// shared for both bleed and poison; the narrative now differentiates
// by effect.type.
//
// Severity 2 at Circle 3 → 4 HP/turn. SORCERY.md defines 4 severity
// tiers: 1=2/t, 2=4/t, 3=6/t, 4=8/t. Higher-tier variants (Poison
// Field, Arch Poison) will use severity 3/4 when implemented.
// Persistent: turnsRemaining = -1 (expires only via Cure / Arch Cure).
// Out of combat → no-target (Force 0 analog: poison needs a foe).

const POISON_SEVERITY = 2;
const POISON_DAMAGE_PER_TURN = POISON_SEVERITY * 2; // 4 HP/turn

function applyPoison(state: WorldState): EffectDispatchResult {
  const session = state.player.activeCombat;
  if (!session) return { kind: "no-target" };

  const poisonEffect: ActiveStatusEffect = {
    type: "poison",
    zone: "torso",
    severity: POISON_SEVERITY,
    turnsRemaining: -1,         // persistent until cured
    damagePerTurn: POISON_DAMAGE_PER_TURN,
  };

  // Remove any existing poison on the enemy before applying (re-cast
  // refreshes severity but doesn't stack multiple poison instances).
  const enemyEffects = session.enemyCombatant.activeEffects.filter(
    e => e.type !== "poison"
  );
  const updatedEnemy: CombatantState = {
    ...session.enemyCombatant,
    activeEffects: [...enemyEffects, poisonEffect],
  };

  const next: WorldState = {
    ...state,
    player: {
      ...state.player,
      activeCombat: { ...session, enemyCombatant: updatedEnemy },
    },
  };

  return {
    kind: "applied",
    state: next,
    effect: {
      kind: "poison-applied",
      targetName: session.enemyCombatant.name,
      severity: POISON_SEVERITY,
      damagePerTurn: POISON_DAMAGE_PER_TURN,
    },
  };
}

// ── Wall of Stone (Sprint 7b.wall-of-stone) ──────────────────
// SORCERY.md §9.x — Circle 3 field spell (Crea Mur).
//
// In combat: places a stone-wall Barrier at boundary 0 (between hero
//   and enemy slot 1), blocking strikes and spells that cross it for
//   WALL_DURATION turns. Re-casting refreshes the duration.
//   tickBarriers() in combatEngine.ts decrements it each round.
//   isCrossingBarrier() in lib/combat/barriers.ts rejects strikes.
//
// Out of combat: room-exit blocking is not yet built; dev-not-implemented.

const WALL_DURATION = 10;
const WALL_BOUNDARY = 0 as const; // hero-side vs enemy-side centerline

function applyWallOfStone(state: WorldState): EffectDispatchResult {
  const session = state.player.activeCombat;

  if (!session) {
    return { kind: "no-target" };
  }

  const newBarrier: Barrier = {
    id: `wall-${state.worldTurn}`,
    atBoundary: WALL_BOUNDARY,
    kind: "stone-wall",
    durationRemaining: WALL_DURATION,
  };

  // Replace any existing stone-wall at the same boundary (re-cast refreshes).
  const filtered = session.barriers.filter(
    b => !(b.kind === "stone-wall" && b.atBoundary === WALL_BOUNDARY)
  );

  const next: WorldState = {
    ...state,
    player: {
      ...state.player,
      activeCombat: {
        ...session,
        barriers: [...filtered, newBarrier],
      },
    },
  };

  return {
    kind: "applied",
    state: next,
    effect: { kind: "wall-erected", boundary: WALL_BOUNDARY, durationTurns: WALL_DURATION },
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

// Rune binding extracted from an inventory item (marked_rune).
type RuneBinding = { roomId: string; planeId: string; label: string };

function applyMark(
  state: WorldState,
  arg: string | null
): EffectDispatchResult {
  // Must have a blank rune stone in inventory.
  const hasBlank = state.player.inventory.some(
    i => i.itemId === "unmarked_rune" && i.quantity > 0
  );
  if (!hasBlank) return { kind: "no-unmarked-rune" };

  const room    = getRoom(state.player.currentRoom);
  const roomName = room?.name ?? state.player.currentRoom;
  const planeId  = room?.planeId ?? state.player.currentPlane ?? "thurian";
  const rawLabel = arg?.trim() ?? "";
  const label    = rawLabel.length > 0 ? rawLabel : `rune to ${roomName}`;

  // Consume 1 unmarked_rune.
  const inventory: PlayerInventoryItem[] = state.player.inventory.map(i => ({ ...i }));
  for (let i = 0; i < inventory.length; i++) {
    if (inventory[i].itemId === "unmarked_rune" && inventory[i].quantity > 0) {
      inventory[i].quantity -= 1;
      break;
    }
  }

  // Add a marked_rune item with the binding embedded per-instance.
  const markedItem: PlayerInventoryItem = {
    itemId: "marked_rune",
    quantity: 1,
    runeBinding: { roomId: state.player.currentRoom, planeId, label },
  };

  let next: WorldState = {
    ...state,
    player: {
      ...state.player,
      inventory: [...inventory.filter(i => i.quantity > 0), markedItem],
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
  const rune  = findRuneInInventory(state, label);
  if (!rune) return { kind: "no-rune-target", runeLabel: label };

  const room        = getRoom(rune.roomId);
  const destination = room?.name ?? rune.roomId;

  // Rune stones stay in inventory — lost only if the hero dies carrying them.
  let next = movePlayer(state, rune.roomId);
  next = { ...next, player: { ...next.player, currentPlane: rune.planeId } };
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
  const rune  = findRuneInInventory(state, label);
  if (!rune) return { kind: "no-rune-target", runeLabel: label };

  const room        = getRoom(rune.roomId);
  const destination = room?.name ?? rune.roomId;

  // First pass: player is immediately transported; rune stone stays in inventory.
  // Two-way moongate entity deferred to the moongate-gameplay sprint.
  let next = movePlayer(state, rune.roomId);
  next = { ...next, player: { ...next.player, currentPlane: rune.planeId } };
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

/** Case-insensitive label lookup across marked_rune items in inventory. */
function findRuneInInventory(
  state: WorldState,
  label: string | null
): RuneBinding | null {
  if (!label) return null;
  for (const item of state.player.inventory) {
    if (item.itemId === "marked_rune" && item.runeBinding) {
      if (item.runeBinding.label.toLowerCase() === label) {
        return item.runeBinding;
      }
    }
  }
  return null;
}

// ── Sprint 7b.buffs — Strength / Agility ─────────────────────
// Self-buffs. Add TempModifier for recompute pipeline; also sync
// directly into playerCombatant if a combat session is active so
// the delta takes effect on the CURRENT fight (not just the next).

const STRENGTH_AGILITY_DURATION = 10;
const STRENGTH_AGILITY_DELTA    = 5;

function applyStrengthBuff(state: WorldState): EffectDispatchResult {
  const duration = STRENGTH_AGILITY_DURATION;
  const delta    = STRENGTH_AGILITY_DELTA;

  const filteredMods = (state.player.tempModifiers ?? []).filter(m => m.source !== "strength");
  const newMod: TempModifier = { stat: "strength", delta, turnsRemaining: duration, source: "strength" };

  let next: WorldState = {
    ...state,
    player: { ...state.player, tempModifiers: [...filteredMods, newMod] },
  };

  if (next.player.activeCombat) {
    const session = next.player.activeCombat;
    next = {
      ...next,
      player: {
        ...next.player,
        activeCombat: {
          ...session,
          playerCombatant: {
            ...session.playerCombatant,
            strength: session.playerCombatant.strength + delta,
          },
        },
      },
    };
  }

  return {
    kind: "applied",
    state: next,
    effect: { kind: "strength-applied", turnsGranted: duration, delta },
  };
}

function applyAgilityBuff(state: WorldState): EffectDispatchResult {
  const duration = STRENGTH_AGILITY_DURATION;
  const delta    = STRENGTH_AGILITY_DELTA;

  const filteredMods = (state.player.tempModifiers ?? []).filter(m => m.source !== "agility");
  const newMod: TempModifier = { stat: "dexterity", delta, turnsRemaining: duration, source: "agility" };

  let next: WorldState = {
    ...state,
    player: { ...state.player, tempModifiers: [...filteredMods, newMod] },
  };

  if (next.player.activeCombat) {
    const session = next.player.activeCombat;
    next = {
      ...next,
      player: {
        ...next.player,
        activeCombat: {
          ...session,
          playerCombatant: {
            ...session.playerCombatant,
            agility: session.playerCombatant.agility + delta,
          },
        },
      },
    };
  }

  return {
    kind: "applied",
    state: next,
    effect: { kind: "agility-applied", turnsGranted: duration, delta },
  };
}

// ── Sprint 7b.buffs — Protection / Reactive Armor / Night Sight ──
// Self-buffs applied as status effects. Combat engine reads
// protection_aura and reactive_armor from playerCombatant.activeEffects.

const PROTECTION_DURATION     = 10;
const REACTIVE_ARMOR_DURATION =  8;
const NIGHT_SIGHT_DURATION    = 15;

function applyProtection(state: WorldState): EffectDispatchResult {
  const duration = PROTECTION_DURATION;
  const effect: ActiveStatusEffect = {
    type: "protection_aura",
    zone: "torso",
    severity: 1,
    turnsRemaining: duration,
  };

  const filteredEffects = state.player.activeEffects.filter(e => e.type !== "protection_aura");
  let next: WorldState = {
    ...state,
    player: { ...state.player, activeEffects: [...filteredEffects, effect] },
  };

  if (next.player.activeCombat) {
    const session = next.player.activeCombat;
    const combatEffects = session.playerCombatant.activeEffects.filter(e => e.type !== "protection_aura");
    next = {
      ...next,
      player: {
        ...next.player,
        activeCombat: {
          ...session,
          playerCombatant: { ...session.playerCombatant, activeEffects: [...combatEffects, effect] },
        },
      },
    };
  }

  return {
    kind: "applied",
    state: next,
    effect: { kind: "protection-applied", turnsGranted: duration },
  };
}

function applyReactiveArmor(state: WorldState): EffectDispatchResult {
  const duration = REACTIVE_ARMOR_DURATION;
  const effect: ActiveStatusEffect = {
    type: "reactive_armor",
    zone: "torso",
    severity: 1,
    turnsRemaining: duration,
  };

  const filteredEffects = state.player.activeEffects.filter(e => e.type !== "reactive_armor");
  let next: WorldState = {
    ...state,
    player: { ...state.player, activeEffects: [...filteredEffects, effect] },
  };

  if (next.player.activeCombat) {
    const session = next.player.activeCombat;
    const combatEffects = session.playerCombatant.activeEffects.filter(e => e.type !== "reactive_armor");
    next = {
      ...next,
      player: {
        ...next.player,
        activeCombat: {
          ...session,
          playerCombatant: { ...session.playerCombatant, activeEffects: [...combatEffects, effect] },
        },
      },
    };
  }

  return {
    kind: "applied",
    state: next,
    effect: { kind: "reactive-armor-applied", turnsGranted: duration },
  };
}

function applyNightSight(state: WorldState): EffectDispatchResult {
  const duration = NIGHT_SIGHT_DURATION;
  const effect: ActiveStatusEffect = {
    type: "night_sight",
    zone: "torso",
    severity: 1,
    turnsRemaining: duration,
  };

  const filteredEffects = state.player.activeEffects.filter(e => e.type !== "night_sight");
  const next: WorldState = {
    ...state,
    player: { ...state.player, activeEffects: [...filteredEffects, effect] },
  };

  return {
    kind: "applied",
    state: next,
    effect: { kind: "night-sight-applied", turnsGranted: duration },
  };
}

// ── Sprint 7b.buffs — Weaken / Clumsy / Curse / Paralyze ─────
// Debuffs applied to the active enemy. All require combat; return
// no-target out of combat.

const WEAKEN_DURATION   =  8;
const CLUMSY_DURATION   =  8;
const CURSE_DURATION    = 10;
const PARALYZE_DURATION =  3;

function applyWeaken(state: WorldState): EffectDispatchResult {
  const session = state.player.activeCombat;
  if (!session) return { kind: "no-target" };

  const effect: ActiveStatusEffect = {
    type: "weakened",
    zone: "torso",
    severity: 1,
    turnsRemaining: WEAKEN_DURATION,
  };
  const enemyEffects = session.enemyCombatant.activeEffects.filter(e => e.type !== "weakened");
  const updatedEnemy: CombatantState = {
    ...session.enemyCombatant,
    activeEffects: [...enemyEffects, effect],
  };
  const next: WorldState = {
    ...state,
    player: { ...state.player, activeCombat: { ...session, enemyCombatant: updatedEnemy } },
  };
  return {
    kind: "applied",
    state: next,
    effect: { kind: "weaken-applied", targetName: session.enemyCombatant.name, turnsGranted: WEAKEN_DURATION },
  };
}

function applyClumsy(state: WorldState): EffectDispatchResult {
  const session = state.player.activeCombat;
  if (!session) return { kind: "no-target" };

  const effect: ActiveStatusEffect = {
    type: "clumsied",
    zone: "torso",
    severity: 1,
    turnsRemaining: CLUMSY_DURATION,
  };
  const enemyEffects = session.enemyCombatant.activeEffects.filter(e => e.type !== "clumsied");
  const updatedEnemy: CombatantState = {
    ...session.enemyCombatant,
    activeEffects: [...enemyEffects, effect],
  };
  const next: WorldState = {
    ...state,
    player: { ...state.player, activeCombat: { ...session, enemyCombatant: updatedEnemy } },
  };
  return {
    kind: "applied",
    state: next,
    effect: { kind: "clumsy-applied", targetName: session.enemyCombatant.name, turnsGranted: CLUMSY_DURATION },
  };
}

function applyCurse(state: WorldState): EffectDispatchResult {
  const session = state.player.activeCombat;
  if (!session) return { kind: "no-target" };

  const effect: ActiveStatusEffect = {
    type: "cursed",
    zone: "torso",
    severity: 1,
    turnsRemaining: CURSE_DURATION,
  };
  const enemyEffects = session.enemyCombatant.activeEffects.filter(e => e.type !== "cursed");
  const updatedEnemy: CombatantState = {
    ...session.enemyCombatant,
    activeEffects: [...enemyEffects, effect],
  };
  const next: WorldState = {
    ...state,
    player: { ...state.player, activeCombat: { ...session, enemyCombatant: updatedEnemy } },
  };
  return {
    kind: "applied",
    state: next,
    effect: { kind: "curse-applied", targetName: session.enemyCombatant.name, turnsGranted: CURSE_DURATION },
  };
}

function applyParalyze(state: WorldState): EffectDispatchResult {
  const session = state.player.activeCombat;
  if (!session) return { kind: "no-target" };

  const effect: ActiveStatusEffect = {
    type: "paralyzed",
    zone: "torso",
    severity: 1,
    turnsRemaining: PARALYZE_DURATION,
  };
  const enemyEffects = session.enemyCombatant.activeEffects.filter(e => e.type !== "paralyzed");
  const updatedEnemy: CombatantState = {
    ...session.enemyCombatant,
    activeEffects: [...enemyEffects, effect],
  };
  const next: WorldState = {
    ...state,
    player: { ...state.player, activeCombat: { ...session, enemyCombatant: updatedEnemy } },
  };
  return {
    kind: "applied",
    state: next,
    effect: { kind: "paralyze-applied", targetName: session.enemyCombatant.name, turnsGranted: PARALYZE_DURATION },
  };
}

// ── Helpers ──────────────────────────────────────────────────

function rollRange(range: NumericRange): number {
  const lo = Math.min(range.min, range.max);
  const hi = Math.max(range.min, range.max);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
