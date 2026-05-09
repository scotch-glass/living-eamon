// ============================================================
// LIVING EAMON — NPC AI policy (Sprint C2 schema; C4 wires logic)
//
// Sprint C2 introduces the policy *type* that NPC entries reference
// via `NPC.aiPolicy`. The actual decision tree (`pickAction`) and
// affordability helpers ship in Sprint C4. Splitting the type out of
// gameData.ts keeps the import graph clean — gameData → npcAi (type
// only); npcAi → combat/engine (helpers). No circular dependency.
// ============================================================

import type { CombatantState, ActiveCombatSession, ActiveStatusEffect, BodyZone } from "./combat/types";
import type { CombatAction } from "./combat/engine";
import { getSpellManaCost } from "./combat/spellData";

/**
 * Per-NPC decision-tree configuration. Higher-order behavior (which
 * spell, which target) is data; the AI driver in `pickAction` reads
 * these knobs but contains no NPC-specific code.
 *
 * Defaults fit a generic bandit (attempts to self-heal at 40%, helps
 * allies at 30%, slight bias toward weakest enemy). Override per-NPC
 * for tougher policies (e.g., fanatics never self-heal; healers
 * prefer ally support; brutes ignore everyone but the closest).
 */
export interface NpcAiPolicy {
  /** HP ratio (0–1) below which the NPC tries to heal itself before
   *  acting offensively. Default 0.4. */
  healSelfThreshold: number;
  /** HP ratio (0–1) below which the NPC tries to heal a damaged ally
   *  before acting offensively. Default 0.3. */
  healAllyThreshold: number;
  /** Bias when choosing offensive actions:
   *   "offense"  — prefers BLAST / damaging spells when affordable.
   *   "defense"  — prefers buffs (PROTECTION_AURA, SHIELD_AURA) before damage.
   *   "balanced" — alternates / situational.
   */
  spellPreference: "offense" | "defense" | "balanced";
  /** 0–10 jitter on target selection. 0 = always picks the lowest-HP
   *  opposing combatant. 10 = picks at random among the opposing team. */
  aggression: number;
}

/**
 * Sensible default for a generic bandit. Most enemy NPC entries can
 * just drop {@link DEFAULT_BANDIT_POLICY} into their `aiPolicy` field
 * unless they want to differ.
 */
export const DEFAULT_BANDIT_POLICY: NpcAiPolicy = {
  healSelfThreshold: 0.4,
  healAllyThreshold: 0.3,
  spellPreference: "balanced",
  aggression: 3,
};

// ────────────────────────────────────────────────────────────────────────
// Sprint C4 — `pickAction` decision tree
// ────────────────────────────────────────────────────────────────────────
// Priority order, top-down (first match wins):
//   1. Self-care: bleeding + has bandage → `use bandage self`
//   2. Self-heal: hp ratio below healSelfThreshold, in priority order:
//        a) `cast HEAL self` if hotbar has HEAL + mana
//        b) `use healing_potion self` if inventory has one
//   3. Ally support: any ally below healAllyThreshold + I can heal them
//        a) `cast HEAL <ally>` if hotbar has HEAL + mana + I'm not the target
//        b) `use healing_potion <ally>` if inventory has one
//   4. Offense: pick a target on the opposing team
//        a) `cast <offensive spell> <target>` if hotbar has one + mana
//        b) `strike <target>` with the equipped weapon
//
// Target selection picks the lowest-HP opposing combatant, with `aggression`
// jitter (0 = always weakest; 10 = uniform random).
//
// Spells "offensive" by default: BLAST, FIREBOLT. Spells "healing":
// HEAL, GREATER-HEAL. Buff spells (HASTE, WARD, STEELSKIN, RESIST,
// CLEANSE, SILENCE, SPEED) are not chosen by the C4 AI yet — they get
// cycled in by C5 polish.

const HEAL_SPELLS = new Set(["HEAL", "GREATER-HEAL"]);
const OFFENSIVE_SPELLS = new Set(["BLAST", "FIREBOLT"]);

function hpRatio(c: CombatantState): number {
  return c.maxHp > 0 ? c.hp / c.maxHp : 0;
}

function hasInventoryItem(c: CombatantState, itemId: string): boolean {
  return c.inventory.some((e) => e.itemId === itemId && e.quantity > 0);
}

function bestHealSpell(c: CombatantState): string | null {
  for (const slot of c.combatHotbar) {
    if (!HEAL_SPELLS.has(slot)) continue;
    const cost = getSpellManaCost(slot);
    if (cost != null && c.mana >= cost) return slot;
  }
  return null;
}

function bestOffensiveSpell(c: CombatantState): string | null {
  for (const slot of c.combatHotbar) {
    if (!OFFENSIVE_SPELLS.has(slot)) continue;
    const cost = getSpellManaCost(slot);
    if (cost != null && c.mana >= cost) return slot;
  }
  return null;
}

function pickOffensiveTarget(
  attacker: CombatantState,
  session: ActiveCombatSession,
  aggression: number,
): CombatantState | null {
  const opposingTeam = attacker.team === "ally" ? "enemy" : "ally";
  const opponents = session.combatants.filter(
    (c) => c.team === opposingTeam && c.hp > 0,
  );
  if (opponents.length === 0) return null;
  // Aggression jitter: 0 = always weakest; 10 = uniform random.
  const jitterChance = Math.min(1, aggression / 10);
  if (Math.random() < jitterChance) {
    return opponents[Math.floor(Math.random() * opponents.length)];
  }
  // Sort by lowest hp ascending, tiebreak by id for determinism.
  return [...opponents].sort((a, b) => {
    if (a.hp !== b.hp) return a.hp - b.hp;
    return a.id < b.id ? -1 : 1;
  })[0];
}

function pickWoundedAlly(
  source: CombatantState,
  session: ActiveCombatSession,
  threshold: number,
): CombatantState | null {
  const allies = session.combatants.filter(
    (c) => c.team === source.team && c.hp > 0 && c.id !== source.id,
  );
  const wounded = allies.filter((c) => hpRatio(c) < threshold);
  if (wounded.length === 0) return null;
  return [...wounded].sort((a, b) => hpRatio(a) - hpRatio(b))[0];
}

/**
 * Probability the AI "forgets" they were just interrupted and picks a
 * cast anyway — an unforced tactical error matching what a real
 * caster would occasionally do under pressure. The cast will fizzle
 * in resolveAction and the player will see the "voice cracks due to
 * X" narrative. The remaining 90% of the time the AI plays smart and
 * skips cast picks while interrupted.
 *
 * Tuned to 10% — high enough that a long fight will surface at least
 * one of these mistakes, low enough that it doesn't read as broken.
 */
export const FORGET_INTERRUPT_CHANCE = 0.10;

/**
 * Sprint C4 — pick the next action for an AI-controlled combatant. Pure
 * function except for the random roll on the forgetful-interrupt branch.
 * Caller (the AI_TURN loop in gameEngine) passes the result to
 * `resolveAction`.
 *
 * Throws if called on a channeling combatant — channels resolve via
 * `resolveChannelStep`, not through pickAction. The AI_TURN loop must
 * route channeling actors there.
 */
export function pickAction(
  combatant: CombatantState,
  session: ActiveCombatSession,
  policy: NpcAiPolicy = DEFAULT_BANDIT_POLICY,
): CombatAction {
  if (combatant.channelingState !== null) {
    throw new Error(
      `pickAction called on channeling combatant ${combatant.id} — caller must route through resolveChannelStep`,
    );
  }

  // When interrupted (just took a critical / severed_artery /
  // crushed_windpipe / silenced), the cast WILL fizzle. The AI plays
  // smart and skips spell options — UNLESS the forgetful-error roll
  // fires, in which case they pick a cast anyway and eat the fizzle.
  // Bandages and potions remain available either way.
  const interrupted = combatant.interruptedSinceLastTurn !== null;
  const skipCasts = interrupted && Math.random() >= FORGET_INTERRUPT_CHANCE;

  // 1. Self-care: stop the bleed if you can. (Bandages are not casts;
  // not gated by skipCasts.)
  if (isBleeding(combatant) && hasInventoryItem(combatant, "bandage")) {
    return { kind: "use", sourceId: combatant.id, targetId: combatant.id, itemId: "bandage" };
  }

  // 2. Self-heal: HP ratio below threshold.
  if (hpRatio(combatant) < policy.healSelfThreshold) {
    const heal = skipCasts ? null : bestHealSpell(combatant);
    if (heal) {
      return { kind: "cast", sourceId: combatant.id, targetId: combatant.id, spellName: heal };
    }
    if (hasInventoryItem(combatant, "healing_potion")) {
      return { kind: "use", sourceId: combatant.id, targetId: combatant.id, itemId: "healing_potion" };
    }
  }

  // 3. Ally support: heal a wounded ally if we can.
  const woundedAlly = pickWoundedAlly(combatant, session, policy.healAllyThreshold);
  if (woundedAlly) {
    const heal = skipCasts ? null : bestHealSpell(combatant);
    if (heal) {
      return { kind: "cast", sourceId: combatant.id, targetId: woundedAlly.id, spellName: heal };
    }
    // Pouring a potion down an ally's throat is also a valid C4 move.
    if (hasInventoryItem(combatant, "healing_potion")) {
      return {
        kind: "use",
        sourceId: combatant.id,
        targetId: woundedAlly.id,
        itemId: "healing_potion",
      };
    }
  }

  // 4. Offense.
  const target = pickOffensiveTarget(combatant, session, policy.aggression);
  if (!target) {
    // No live opponents — combat should be ending; flee as a fallback.
    return { kind: "flee", sourceId: combatant.id };
  }
  if (!skipCasts && policy.spellPreference !== "defense") {
    const offensive = bestOffensiveSpell(combatant);
    if (offensive) {
      return { kind: "cast", sourceId: combatant.id, targetId: target.id, spellName: offensive };
    }
  }
  // Strike with weapon. Default zone = torso (the biggest target). Skilled
  // NPCs (weaponSkillValue >= 80) occasionally pick head/neck for the crit
  // chance; we keep it simple at C4 and let zone variety land in C5 polish.
  const zone: BodyZone = "torso";
  return { kind: "strike", sourceId: combatant.id, targetId: target.id, zone };
}

/**
 * Filter a combatant's `combatHotbar` to spells they can actually
 * afford to cast right now. Pure function, no side effects.
 *
 * Sprint C2 ships the helper because Sprint C2's NPC entries declare
 * hotbars and we want a typed surface for inspection. Sprint C4
 * consumes this from inside the decision tree.
 */
export function affordableHotbarSpells(
  combatant: CombatantState,
  spellManaCost: (spellName: string) => number | null,
): string[] {
  return combatant.combatHotbar.filter((spellName) => {
    const cost = spellManaCost(spellName);
    return cost != null && combatant.mana >= cost;
  });
}

/**
 * True when the combatant carries an active bleed effect. Used by the
 * Sprint C4 priority tree (bleed + bandage → bandage).
 */
export function isBleeding(combatant: CombatantState): boolean {
  return combatant.activeEffects.some((e: ActiveStatusEffect) => e.type === "bleed" || e.type === "severed_artery");
}
