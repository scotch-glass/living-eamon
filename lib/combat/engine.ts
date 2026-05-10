// ============================================================
// LIVING EAMON — Body-Zone Combat Engine
// Pure functions. No side effects. No state mutation.
// Three-roll resolution: Evasion → Shield Block → Armor Pen.
// ============================================================

import type {
  BodyZone,
  CombatantState,
  CombatantPosition,
  StrikeResolution,
  CombatRoundResult,
  ActiveStatusEffect,
  StatusEffectType,
  ZoneArmor,
  BodyArmorMap,
  ActiveCombatSession,
  NPCCombatProfile,
  Barrier,
  InterruptReason,
} from "./types";
import {
  BODY_ZONES,
  ZONE_DAMAGE_MULTIPLIER,
  ZONE_EVASION_PENALTY,
  ZONE_INJURY_TABLE,
  createEmptyBodyArmorMap,
  makeMultiCombatantFields,
  pronounsFor,
} from "./types";
import { rollWeaponDamage, getDexReactionBonus, getWeaponSkillKey, WEAPON_DATA } from "../uoData";
import { getWeaponCategory, type WeaponCategory, type WoundTier } from "./narrationPools";
import { buildZoneStrikeNarrative, buildMultiStrikeNarrative, pickAllyDeathReaction, enemyDeathLine, formatInterruptFizzle } from "./zoneNarration";
import type { WorldState } from "../gameState";
import { FATIGUE_TIER_EVASION_PENALTY } from "../gameState";
import { isCrossingBarrier, tickBarriers } from "./barriers";
import { NPCS, ITEMS, getEnemyDeathPool } from "../gameData";
import { fatigueLevel, weaponStaminaCost } from "../karma/recompute";
import { pickAction, DEFAULT_BANDIT_POLICY } from "../npcAi";

// ── Helpers ─────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── Evasion (Roll 1) ────────────────────────────────────────
// Defender dexterity increases evasion (0.8x).
// Attacker dexterity reduces evasion (0.4x) — dexterous fighters hit more often.
// Both are already reduced by armor dex penalties via buildCombatantFrom*.

// Effective dexterity = base DEX + dynamic buffs that should boost
// the DEX-derived feel without permanently mutating the stat. Today
// only HASTE's `haste_extra_action` lifts it (+3 per severity, locked
// 2026-05-09). Add other DEX-flavored buffs here as they ship.
//
// 2026-05-09: agility was merged into dexterity. The encumbrance
// penalty that used to live on `c.agility` is now baked into
// `c.dexterity` at combatant build time.
function effectiveCombatantDex(c: CombatantState): number {
  let dex = c.dexterity;
  for (const e of c.activeEffects) {
    if (e.type === "haste_extra_action") dex += 3 * e.severity;
  }
  return dex;
}

function calculateEvasionChance(
  defender: CombatantState,
  attacker: CombatantState
): number {
  // Invisible defenders auto-evade — short-circuit. Effect is consumed at the
  // end of the round by tickStatusEffects (turnsRemaining = 1).
  if (defender.activeEffects.some(e => e.type === "invisible")) {
    return 95;
  }

  // Defender's effective dexterity drives evasion (haste_extra_action
  // adds +3 per severity).
  let base = effectiveCombatantDex(defender) * 0.8;

  // Attacker's effective dexterity makes them harder to evade.
  base -= effectiveCombatantDex(attacker) * 0.4;

  // Sprint C3h (locked 2026-05-06): party-rank position evasion bonus.
  // STRIKE actions only (this function is only called from the strike
  // path; spell-vs-target hit math elsewhere doesn't call calculateEvasionChance).
  // Front (1) = +0, Middle (2) = +10, Back (3) = +20. The slow-caster
  // tactical defense — putting your caster in the back makes them
  // markedly harder to reach with a blade. Spells ignore position
  // because a Word of Power names its target by name, distance is
  // metaphysical, not physical.
  base += (defender.position - 1) * 10;

  // Spell buffs / debuffs ── on the defender
  for (const e of defender.activeEffects) {
    if (e.type === "haste") base += 10 * e.severity;
    if (e.type === "hiccups") base -= 3 * e.severity;
    if (e.type === "marked_by_set") base -= 15 * e.severity; // easier to hit
  }

  // Injuries reduce evasion
  for (const e of defender.activeEffects) {
    if (e.type === "broken_leg") base -= 15 * e.severity;
    if (e.type === "concussion") base -= 5 * e.severity;
  }

  // Attacker injuries give defender bonus evasion
  for (const e of attacker.activeEffects) {
    if (e.type === "damaged_eye") base += 5 * e.severity;
    // Numb hand: attacker can't hit anything — bump defender evasion sky-high.
    if (e.type === "numb_hand") base += 95;
    // Sprint 7b.buffs: spell debuffs on attacker reduce accuracy
    if (e.type === "clumsied") base += 15 * e.severity;
    if (e.type === "cursed")   base += 10 * e.severity;
  }

  return clamp(base, 0, 95);
}

// ── Shield Block (Roll 2) ───────────────────────────────────

function calculateShieldBlockChance(defender: CombatantState): number {
  if (!defender.shieldItemId || defender.shieldDurability <= 0) return 0;

  const durabilityRatio = defender.shieldDurability / Math.max(1, defender.shieldMaxDurability);
  let chance = defender.shieldBlockChance * durabilityRatio;

  for (const e of defender.activeEffects) {
    if (e.type === "broken_arm") chance -= 10 * e.severity;
  }

  return clamp(chance, 0, 95);
}

function calculateShieldDurabilityLoss(attacker: CombatantState): number {
  const baseDmg = rollWeaponDamage(attacker.weaponId);
  return Math.max(1, Math.floor(baseDmg * 0.2));
}

// ── Armor Penetration (Roll 3) ──────────────────────────────

function calculateArmorStopChance(zone: ZoneArmor): number {
  const durabilityRatio = zone.durability / Math.max(1, zone.maxDurability);
  return clamp(zone.cover * durabilityRatio, 0, 95);
}

function calculateArmorDurabilityLoss(damage: number): number {
  return Math.max(1, Math.floor(damage * 0.3));
}

// ── Damage Calculation ──────────────────────────────────────

function calculateStrengthMod(strength: number): number {
  return 1 + clamp((strength - 10) / 40, -0.2, 0.3);
}

function getCritChance(weaponSkillValue: number): number {
  return 0.05 + weaponSkillValue * 0.001; // 5% base, +0.1% per skill point
}

/**
 * Critical fail chance — exponential decay so veterans almost never fumble.
 * Masters (200+ skill) NEVER fumble (hard floor). Checked when a strike is evaded.
 *
 * Formula: 5% × e^(-skill/30), clamped to 0 at skill 200+.
 *
 * Skill   0 → 5.00%  (1 in 20 evaded strikes)
 * Skill  50 → 0.94%  (1 in 106)
 * Skill 100 → 0.18%  (1 in 556)
 * Skill 150 → 0.03%  (1 in 3,333)
 * Skill 200 → 0%     (never)
 */
function getCritFailChance(weaponSkillValue: number): number {
  if (weaponSkillValue >= 200) return 0;
  return 0.05 * Math.exp(-weaponSkillValue / 30);
}

/** Whether a critical fail causes a weapon drop (50% of crit fails). */
function rollWeaponDrop(): boolean {
  return Math.random() < 0.5;
}

// ── Injury Roll ─────────────────────────────────────────────

function rollInjury(
  zone: BodyZone,
  damage: number,
  defenderMaxHp: number,
  weaponCategory: WeaponCategory
): { type: StatusEffectType; severity: number } | null {
  const damagePct = damage / Math.max(1, defenderMaxHp);

  // Low damage rarely causes injury
  if (damagePct < 0.1) return null;
  if (damagePct < 0.2 && Math.random() > 0.2) return null;
  if (damagePct < 0.35 && Math.random() > 0.5) return null;
  // High damage almost always causes injury

  const injuries = ZONE_INJURY_TABLE[zone];

  // Weapon category influences which injuries are possible
  let candidates = [...injuries];
  if (weaponCategory === "blunt") {
    // Blunt favors concussion, broken bones over bleeding
    candidates = candidates.filter(t => t !== "severed_artery");
  }
  if (weaponCategory === "pierce") {
    // Pierce favors bleeding, puncture wounds
    candidates = candidates.filter(t => t !== "concussion" && t !== "broken_arm" && t !== "broken_leg");
  }
  if (candidates.length === 0) candidates = injuries;

  const type = candidates[randInt(0, candidates.length - 1)];
  const severity = damagePct > 0.4 ? 3 : damagePct > 0.2 ? 2 : 1;

  return { type, severity };
}

// ── Build Injury Effect ─────────────────────────────────────

function buildStatusEffect(
  injury: { type: StatusEffectType; severity: number },
  zone: BodyZone
): ActiveStatusEffect {
  const base: ActiveStatusEffect = {
    type: injury.type,
    zone,
    severity: injury.severity,
    turnsRemaining: -1, // Until healed by default
  };

  // Bleed-type effects have per-turn damage and expire
  if (injury.type === "bleed") {
    base.damagePerTurn = injury.severity;
    base.turnsRemaining = randInt(2, 4) + injury.severity;
  }
  if (injury.type === "severed_artery") {
    base.damagePerTurn = injury.severity * 2;
    base.turnsRemaining = randInt(3, 6);
  }

  return base;
}

// ── Strike Resolution (one attack) ─────────────────────────

export function resolveStrike(
  attacker: CombatantState,
  defender: CombatantState,
  targetZone: BodyZone,
  weaponCategory: WeaponCategory
): StrikeResolution {
  const baseMiss: StrikeResolution = {
    targetZone,
    evaded: false,
    blocked: false,
    armorStopped: false,
    armorDamaged: 0,
    armorBroken: false,
    damageDealt: 0,
    reflectedDamage: 0,
    injuryInflicted: null,
    injurySeverity: 0,
    isCritical: false,
    isCriticalFail: false,
    weaponDropped: false,
    narrative: "",
  };

  // ── Roll 1: Evasion (+ zone accuracy penalty + fatigue penalty) ──
  // Fatigue makes the defender easier to hit. the source combat model
  // adds +15% enemy hit chance per tier — modeled here as a flat
  // reduction in the defender's evasion roll (mathematically equivalent).
  // Player carries fatigueTier; enemies leave it undefined (no penalty).
  const baseEvasion = calculateEvasionChance(defender, attacker);
  const fatiguePenalty =
    (defender.fatigueTier ?? 0) * FATIGUE_TIER_EVASION_PENALTY;
  const evasionChance = clamp(
    baseEvasion + ZONE_EVASION_PENALTY[targetZone] - fatiguePenalty,
    0,
    95
  );
  if (Math.random() * 100 < evasionChance) {
    // ── Critical Fail check (only on evaded strikes) ──
    // Masters (200+ skill) never fumble. Untrained fighters fumble ~5%.
    const failChance = getCritFailChance(attacker.weaponSkillValue);
    const isCritFail = failChance > 0 && Math.random() < failChance;
    const dropped = isCritFail && attacker.weaponId !== "unarmed" && rollWeaponDrop();

    const failNarrative = dropped
      ? ` FUMBLE! ${attacker.name}'s weapon slips from their grip and clatters to the ground!`
      : isCritFail
        ? ` ${attacker.name} stumbles badly — a clumsy swing that leaves them off-balance.`
        : "";

    return {
      ...baseMiss,
      evaded: true,
      isCriticalFail: isCritFail,
      weaponDropped: dropped,
      narrative: `${defender.name} dodges the strike aimed at their ${targetZone}.${failNarrative}`,
    };
  }

  // ── Roll 2: Shield Block ──
  const blockChance = calculateShieldBlockChance(defender);
  if (blockChance > 0 && Math.random() * 100 < blockChance) {
    const shieldDmg = calculateShieldDurabilityLoss(attacker);
    const newDur = Math.max(0, defender.shieldDurability - shieldDmg);
    return {
      ...baseMiss,
      blocked: true,
      armorDamaged: shieldDmg,
      armorBroken: newDur <= 0,
      narrative: newDur <= 0
        ? `${defender.name}'s shield catches the blow — and shatters!`
        : `${defender.name}'s shield deflects the strike at their ${targetZone}.`,
    };
  }

  // ── Roll 3: Armor Penetration ──
  // shield_aura adds a flat +20 cover to whatever zone is hit (works even
  // on zones with no armor — the silver glow itself catches the blade).
  const zoneState = defender.zones[targetZone];
  const shieldAuraSev = defender.activeEffects
    .filter(e => e.type === "shield_aura")
    .reduce((acc, e) => acc + e.severity, 0);
  const auraCover = shieldAuraSev * 20;

  if (zoneState.armor && zoneState.armor.durability > 0) {
    const baseStop = calculateArmorStopChance(zoneState.armor);
    const stopChance = clamp(baseStop + auraCover, 0, 95);
    if (Math.random() * 100 < stopChance) {
      // Armor stops the hit but takes durability damage
      const baseDmg = rollWeaponDamage(attacker.weaponId);
      const armorDmg = calculateArmorDurabilityLoss(baseDmg);
      const newDur = Math.max(0, zoneState.armor.durability - armorDmg);
      return {
        ...baseMiss,
        armorStopped: true,
        armorDamaged: armorDmg,
        armorBroken: newDur <= 0,
        narrative: newDur <= 0
          ? `The ${targetZone} armor absorbs the blow — but cracks apart!`
          : `${attacker.name}'s strike glances off ${defender.name}'s ${targetZone} armor.`,
      };
    }
  } else if (auraCover > 0) {
    // No armor on this zone but the silver aura is up — give it a chance to
    // catch the blow on its own. Aura takes no durability damage.
    if (Math.random() * 100 < auraCover) {
      return {
        ...baseMiss,
        armorStopped: true,
        armorDamaged: 0,
        armorBroken: false,
        narrative: `A silver glow flares as the strike at ${defender.name}'s ${targetZone} skitters away.`,
      };
    }
  }

  // ── Hit Lands ──
  const baseDmg = rollWeaponDamage(attacker.weaponId);
  const strengthMod = calculateStrengthMod(attacker.strength);
  const zoneMult = ZONE_DAMAGE_MULTIPLIER[targetZone];
  const isCrit = Math.random() < getCritChance(attacker.weaponSkillValue);
  let finalDmg = Math.max(1, Math.floor(baseDmg * strengthMod * zoneMult * (isCrit ? 2 : 1)));

  // Sprint 7b.buffs — attacker/defender spell-effect modifiers on damage
  const weakenedSev = attacker.activeEffects.reduce((s, e) => e.type === "weakened" ? s + e.severity : s, 0);
  if (weakenedSev > 0) finalDmg = Math.max(1, Math.floor(finalDmg * (1 - 0.2 * weakenedSev)));
  const protAuraSev = defender.activeEffects.reduce((s, e) => e.type === "protection_aura" ? s + e.severity : s, 0);
  if (protAuraSev > 0) finalDmg = Math.max(1, Math.floor(finalDmg * (1 - 0.25 * protAuraSev)));
  // Torso-injury attacker penalties (2026-05-09): pierced_lung is a
  // major chest wound — −25% outgoing damage per severity. Cracked_ribs
  // is the milder torso pain — −10% per severity. Stack multiplicatively
  // with weakened. Both read on the ATTACKER, not the defender.
  const piercedLungSev = attacker.activeEffects.reduce((s, e) => e.type === "pierced_lung" ? s + e.severity : s, 0);
  if (piercedLungSev > 0) finalDmg = Math.max(1, Math.floor(finalDmg * (1 - 0.25 * piercedLungSev)));
  const crackedRibsSev = attacker.activeEffects.reduce((s, e) => e.type === "cracked_ribs" ? s + e.severity : s, 0);
  if (crackedRibsSev > 0) finalDmg = Math.max(1, Math.floor(finalDmg * (1 - 0.10 * crackedRibsSev)));
  // STEELSKIN — passive 4-turn buff that halves all incoming physical
  // damage. Severity stacks are not multiplicative (a halve is a halve);
  // any positive severity triggers the 50% cut.
  const steelskinSev = defender.activeEffects.reduce((s, e) => e.type === "steelskin" ? s + e.severity : s, 0);
  if (steelskinSev > 0) finalDmg = Math.max(1, Math.floor(finalDmg * 0.5));
  // WARD — flat 8-damage absorbed per severity (matches the spell's
  // narrative claim of "+8 armor"). Subtracted AFTER multipliers so it
  // reads as physical absorption, not a percentage modifier.
  const wardSev = defender.activeEffects.reduce((s, e) => e.type === "ward" ? s + e.severity : s, 0);
  if (wardSev > 0) finalDmg = Math.max(1, finalDmg - 8 * wardSev);
  const reactArmSev = defender.activeEffects.reduce((s, e) => e.type === "reactive_armor" ? s + e.severity : s, 0);
  const reflectedDamage = reactArmSev > 0 && finalDmg > 0
    ? Math.max(1, Math.floor(finalDmg * 0.2 * reactArmSev))
    : 0;

  // Armor still takes durability loss on penetrating hits
  let armorDmg = 0;
  let armorBroken = false;
  if (zoneState.armor && zoneState.armor.durability > 0) {
    armorDmg = calculateArmorDurabilityLoss(finalDmg);
    const newDur = Math.max(0, zoneState.armor.durability - armorDmg);
    armorBroken = newDur <= 0;
  }

  // Injury roll
  const injury = rollInjury(targetZone, finalDmg, defender.maxHp, weaponCategory);
  const injuryInflicted = injury?.type ?? null;
  const injurySeverity = injury?.severity ?? 0;

  const critTag = isCrit ? "__CRITICAL__ " : "";
  const injuryTag = injuryInflicted ? ` ${injuryInflicted.replace(/_/g, " ").toUpperCase()}!` : "";
  const narrative = `${critTag}${attacker.name} strikes ${defender.name}'s ${targetZone} for ${finalDmg} damage.${injuryTag}`;

  return {
    targetZone,
    evaded: false,
    blocked: false,
    armorStopped: false,
    armorDamaged: armorDmg,
    armorBroken,
    damageDealt: finalDmg,
    reflectedDamage,
    injuryInflicted,
    injurySeverity,
    isCritical: isCrit,
    isCriticalFail: false,
    weaponDropped: false,
    narrative,
  };
}

/**
 * Pre-work B — barrier-aware wrapper around `resolveStrike`. If the line
 * of effect from attacker to defender crosses an active barrier (e.g., a
 * Wall of Stone), short-circuits with a null-damage resolution describing
 * the wall in the way. No spell yet populates `barriers`, so this is a
 * no-op until Sprint 7b.wall-of-stone wires the spell. Used by
 * `resolveCombatRound`, `runEnemyTurn`, and the `POWER_OUTCOMES`
 * "Bonus Strike" path so every in-combat strike is barrier-aware from a
 * single point.
 */
function tryStrikeWithBarriers(
  attacker: CombatantState,
  defender: CombatantState,
  zone: BodyZone,
  cat: WeaponCategory,
  barriers: Barrier[]
): StrikeResolution {
  if (
    isCrossingBarrier(
      attacker.side,
      attacker.position,
      defender.side,
      defender.position,
      barriers
    )
  ) {
    return {
      targetZone: zone,
      evaded: false,
      blocked: false,
      armorStopped: false,
      armorDamaged: 0,
      armorBroken: false,
      damageDealt: 0,
      reflectedDamage: 0,
      injuryInflicted: null,
      injurySeverity: 0,
      isCritical: false,
      isCriticalFail: false,
      weaponDropped: false,
      narrative: `${attacker.name} cannot reach across the wall of stone.`,
    };
  }
  return resolveStrike(attacker, defender, zone, cat);
}

// ── Apply Strike to Combatant ───────────────────────────────

export function applyStrike(
  defender: CombatantState,
  strike: StrikeResolution
): CombatantState {
  let updated = { ...defender, zones: { ...defender.zones } };

  // Apply HP damage
  updated.hp = Math.max(0, updated.hp - strike.damageDealt);

  // Apply armor durability loss
  if (strike.armorDamaged > 0) {
    if (strike.blocked) {
      // Shield damage
      updated.shieldDurability = Math.max(0, updated.shieldDurability - strike.armorDamaged);
      if (updated.shieldDurability <= 0) {
        updated.shieldItemId = null;
        updated.shieldBlockChance = 0;
      }
    } else {
      // Zone armor damage
      const zone = strike.targetZone;
      const zoneState = { ...updated.zones[zone] };
      if (zoneState.armor) {
        const newDur = Math.max(0, zoneState.armor.durability - strike.armorDamaged);
        if (newDur <= 0) {
          zoneState.armor = null;
        } else {
          zoneState.armor = { ...zoneState.armor, durability: newDur };
        }
        updated.zones[zone] = zoneState;
      }
    }
  }

  // Apply injury — Bless resistance: skip bleed + poison effects while blessed.
  if (strike.injuryInflicted) {
    const effect = buildStatusEffect(
      { type: strike.injuryInflicted, severity: strike.injurySeverity },
      strike.targetZone
    );
    const isBlessed   = updated.activeEffects.some(e => e.type === "blessed");
    const isResisted  = isBlessed && (
      effect.type === "bleed" ||
      effect.type === "severed_artery" ||
      effect.type === "poison"
    );
    if (!isResisted) {
      updated = {
        ...updated,
        activeEffects: [...updated.activeEffects, effect],
      };
    }
  }

  // Accumulate wound level on zone
  if (strike.damageDealt > 0) {
    const zone = strike.targetZone;
    const zoneState = { ...updated.zones[zone] };
    zoneState.woundLevel += strike.damageDealt;
    updated.zones[zone] = zoneState;
  }

  // Sprint C3e — cast-interrupt hook. A critical hit, a cut artery, or a
  // crushed windpipe all break a caster's concentration: any in-flight
  // channel will fail on the next turn, and a fresh cast attempt that turn
  // also fails. Mana stays gone (committed on turn 1, never refunded).
  // The flag is cleared at the end of that combatant's next turn in
  // advanceTurn, so a single interrupt blocks exactly one cast. We
  // capture the SPECIFIC cause so the fizzle / shatter narration can
  // surface it ("voice cracks due to the gash at the throat") — a bare
  // "voice cracks" without context reads as engine output, not prose.
  // Severed-artery / crushed-windpipe take precedence over the generic
  // critical-hit reason since they're the more specific cause.
  let interruptReason: InterruptReason | null = null;
  if (strike.injuryInflicted === "severed_artery") {
    interruptReason = { kind: "severed_artery" };
  } else if (strike.injuryInflicted === "crushed_windpipe") {
    interruptReason = { kind: "crushed_windpipe" };
  } else if (strike.isCritical) {
    interruptReason = { kind: "critical_hit", zone: strike.targetZone };
  }
  if (interruptReason) {
    updated = { ...updated, interruptedSinceLastTurn: interruptReason };
  }

  return updated;
}

// ── Status Effect Tick ──────────────────────────────────────

export function tickStatusEffects(combatant: CombatantState): {
  updatedCombatant: CombatantState;
  tickDamage: number;
  narrative: string;
} {
  let totalDamage = 0;
  const parts: string[] = [];
  const remaining: ActiveStatusEffect[] = [];

  for (const effect of combatant.activeEffects) {
    if (effect.damagePerTurn) {
      totalDamage += effect.damagePerTurn;
      const tickMsg = effect.type === "poison"
        ? `Poison burns through the veins. (${effect.damagePerTurn} poison damage)`
        : `Blood seeps from the ${effect.zone} wound. (${effect.damagePerTurn} bleed damage)`;
      parts.push(tickMsg);
    }
    const newTurns =
      effect.turnsRemaining === -1 ? -1 : effect.turnsRemaining - 1;
    if (newTurns !== 0) {
      remaining.push({ ...effect, turnsRemaining: newTurns });
    } else {
      parts.push(`The ${effect.type.replace(/_/g, " ")} on ${effect.zone} fades.`);
    }
  }

  return {
    updatedCombatant: {
      ...combatant,
      hp: Math.max(0, combatant.hp - totalDamage),
      activeEffects: remaining,
    },
    tickDamage: totalDamage,
    narrative: parts.join("\n"),
  };
}

// ── Enemy AI Targeting ──────────────────────────────────────

export function chooseEnemyTargetZone(
  enemy: CombatantState,
  player: CombatantState
): BodyZone {
  const skillFactor = enemy.weaponSkillValue / 100; // 0-1 scale

  // Low skill: weighted random favoring torso
  if (Math.random() > skillFactor) {
    const roll = Math.random() * 100;
    if (roll < 50) return "torso";
    if (roll < 75) return "limbs";
    if (roll < 90) return "head";
    return "neck";
  }

  // High skill: target most vulnerable zone
  const zoneScores = BODY_ZONES.map((z) => {
    const armor = player.zones[z].armor;
    const protection = armor && armor.durability > 0 ? armor.cover : 0;
    const value = ZONE_DAMAGE_MULTIPLIER[z]; // Prioritize lethal zones
    return { zone: z, score: value / (protection + 1) }; // Higher = more attractive
  });
  zoneScores.sort((a, b) => b.score - a.score);
  return zoneScores[0].zone;
}

// ── Build Combatants from Game State ────────────────────────

export function buildCombatantFromPlayer(state: WorldState): CombatantState {
  const p = state.player;
  const zones = createEmptyBodyArmorMap();

  // Populate zone armor from equipment and sum dex penalties
  const isMounted = p.mounted ?? false;
  let totalDexPenalty = 0;
  const slotMap: { slot: keyof typeof p; zone: BodyZone }[] = [
    { slot: "helmet", zone: "head" },
    { slot: "gorget", zone: "neck" },
    { slot: "bodyArmor", zone: "torso" },
    { slot: "limbArmor", zone: "limbs" },
  ];
  for (const { slot, zone } of slotMap) {
    const itemId = p[slot] as string | null;
    if (itemId) {
      const item = ITEMS[itemId];
      if (item?.stats?.zoneCover != null && item.stats.zoneDurability != null) {
        zones[zone].armor = {
          itemId,
          cover: item.stats.zoneCover,
          durability: item.stats.zoneDurability,
          maxDurability: item.stats.zoneDurability,
        };
      }
      // Use mountedDexPenalty when on horseback, full dexPenalty on foot
      const penalty = isMounted && item?.stats?.mountedDexPenalty != null
        ? item.stats.mountedDexPenalty
        : item?.stats?.dexPenalty ?? 0;
      totalDexPenalty += penalty;
    }
  }

  // Shield
  const shieldItem = p.shield ? ITEMS[p.shield] : null;
  totalDexPenalty += shieldItem?.stats?.dexPenalty ?? 0;

  const skillKey = getWeaponSkillKey(p.weapon);
  const effectiveAgility = Math.max(0, p.dexterity - totalDexPenalty);

  // Sprint C1: pull combat consumables (potions, bandages) from the
  // player's inventory so the engine can mutate them via USE actions
  // without reaching back into PlayerState mid-fight.
  const consumableInventory: { itemId: string; quantity: number }[] = (p.inventory ?? [])
    .map(entry => {
      const item = ITEMS[entry.itemId];
      if (!item || item.type !== "consumable") return null;
      return { itemId: entry.itemId, quantity: entry.quantity };
    })
    .filter((x): x is { itemId: string; quantity: number } => x != null);

  // Sprint C1/C2: copy the spells we know plus the persisted combat
  // hotbar. When the player hasn't set a hotbar yet, default to the
  // first 6 known spells so the UI stays populated. The hotbar is the
  // input the AI consults; it never reaches outside this set.
  const knownSpells = (p.knownSpells ?? []).map(s => s.toUpperCase());
  const persistedHotbar = (p.combatHotbar ?? []).map(s => s.toUpperCase());
  const combatHotbar = persistedHotbar.length > 0
    ? persistedHotbar.slice(0, 6)
    : knownSpells.slice(0, 6);

  return {
    id: p.id,
    name: p.name,
    hp: p.hp,
    maxHp: p.maxHp,
    zones,
    // Carry persistent out-of-combat effects (bleed, poison) into the fight
    activeEffects: (p.activeEffects ?? []).map(e => ({ ...e })),
    droppedWeaponId: null,
    shieldItemId: p.shield,
    shieldBlockChance: shieldItem?.stats?.shieldBlockChance ?? 0,
    shieldDurability: shieldItem?.stats?.shieldDurability ?? 0,
    shieldMaxDurability: shieldItem?.stats?.shieldDurability ?? 0,
    weaponId: p.weapon,
    weaponSkillValue: p.weaponSkills[skillKey] ?? 0,
    // 2026-05-09: agility merged into dexterity. CombatantState.dexterity
    // is the effective (post-encumbrance) value; PlayerState.dexterity
    // remains the raw stat. Initiative + evasion both read c.dexterity.
    dexterity: effectiveAgility, // p.dexterity − cumulative armor / shield penalties
    strength: p.strength,
    fatigueTier: fatigueLevel(p),
    side: "ally",
    position: 1,
    // ── Sprint C1 multi-combatant fields ────────────────────────────
    team: "ally",
    controlledBy: "player",
    npcId: null,
    mana: p.currentMana ?? 0,
    maxMana: p.maxMana ?? 0,
    knownSpells,
    combatHotbar,
    inventory: consumableInventory,
    picssi: {
      courage: p.picssi?.courage ?? 0,
      spirituality: p.picssi?.spirituality ?? 0,
    },
    // ── Sprint C3: channeling + interruption ────────────────────────
    channelingState: null,
    interruptedSinceLastTurn: null,
    // PlayerState.gender drives pronoun selection. Required field on
    // PlayerState as of the pronoun-system pass; canonical heroes are all
    // male per the Howard-canon palette.
    gender: p.gender,
  };
}

/** Auto-derive per-zone armor from flat AC value for NPCs without combatProfile. */
export function deriveZonesFromFlatArmor(
  armorValue: number
): Record<BodyZone, { cover: number; durability: number }> {
  return {
    head: { cover: clamp(armorValue * 8, 0, 90), durability: armorValue * 3 },
    neck: { cover: clamp(armorValue * 5, 0, 60), durability: armorValue * 2 },
    torso: { cover: clamp(armorValue * 10, 0, 95), durability: armorValue * 5 },
    limbs: { cover: clamp(armorValue * 7, 0, 80), durability: armorValue * 4 },
  };
}

/**
 * Sprint C1: optional NPC fields that feed multi-combatant combat. All are
 * read off the NPC registry entry (Sprint C2 adds them to the `NPC` type
 * proper). The builder defaults each to a safe value when missing so old
 * NPC entries (Dufus, repair workers) keep working without changes.
 */
export interface NPCCombatKit {
  weaponId?: string;
  mana?: number;
  maxMana?: number;
  knownSpells?: string[];
  combatHotbar?: string[];
  inventory?: { itemId: string; quantity: number }[];
  picssi?: { courage?: number; spirituality?: number };
  gender?: "male" | "female";
}

export function buildCombatantFromNPC(
  npcId: string,
  npcData: {
    name: string;
    stats: { hp: number; armor: number; damage: string };
    combatProfile?: NPCCombatProfile;
  } & NPCCombatKit,
  currentHp: number,
  options: { team?: "ally" | "enemy"; controlledBy?: "player" | "ai"; position?: 1 | 2 | 3 } = {},
): CombatantState {
  const profile = npcData.combatProfile;
  const zoneData = profile?.zones ?? deriveZonesFromFlatArmor(npcData.stats.armor);
  const zones = createEmptyBodyArmorMap();

  for (const z of BODY_ZONES) {
    const zd = zoneData[z];
    if (zd.durability > 0) {
      zones[z].armor = {
        itemId: `${npcId}_${z}_armor`,
        cover: zd.cover,
        durability: zd.durability,
        maxDurability: zd.durability,
      };
    }
  }

  const team = options.team ?? "enemy";
  const controlledBy = options.controlledBy ?? "ai";
  const position = options.position ?? 1;
  const knownSpells = (npcData.knownSpells ?? []).map(s => s.toUpperCase());
  const combatHotbar = (npcData.combatHotbar ?? knownSpells).slice(0, 6).map(s => s.toUpperCase());

  return {
    id: npcId,
    name: npcData.name,
    hp: currentHp,
    maxHp: npcData.stats.hp,
    zones,
    activeEffects: [],
    shieldItemId: null,
    shieldBlockChance: profile?.shieldBlockChance ?? 0,
    shieldDurability: profile?.shieldDurability ?? 0,
    shieldMaxDurability: profile?.shieldDurability ?? 0,
    weaponId: npcData.weaponId ?? "unarmed", // back-compat: most NPCs abstract weapon via damage dice
    droppedWeaponId: null,
    weaponSkillValue: profile?.weaponSkill ?? 30,
    // 2026-05-09: agility merged into dexterity. NPCCombatProfile now
    // declares a single `dexterity` stat that maps directly here.
    dexterity: profile?.dexterity ?? 20,
    strength: 12,
    side: team, // CombatantSide and team are unified for now
    position,
    // ── Sprint C1 multi-combatant fields ────────────────────────────
    team,
    controlledBy,
    npcId,
    mana: npcData.mana ?? 0,
    maxMana: npcData.maxMana ?? 0,
    knownSpells,
    combatHotbar,
    inventory: (npcData.inventory ?? []).map(e => ({ ...e })),
    picssi: {
      courage: npcData.picssi?.courage ?? 30,        // bandit baseline
      spirituality: npcData.picssi?.spirituality ?? 0,
    },
    // ── Sprint C3: channeling + interruption ────────────────────────
    channelingState: null,
    interruptedSinceLastTurn: null,
    // NPC registry declares gender per entry; default male for legacy
    // NPC entries that haven't been backfilled yet.
    gender: npcData.gender ?? "male",
  };
}

// ── Sprint C3: effective combat speed + initiative order ────

/**
 * Sprint C3 (Scotch 2026-05-06): combine the combatant's weapon
 * tempo and the slowest spell on their hotbar — whichever is slower
 * dictates how fast they act in initiative. NEVER summed; the slowest
 * single thing on the combatant sets tempo.
 *
 * - Weak spells (Circle 1, castSpeed 2) effectively never gate initiative
 *   because every weapon ties or beats them.
 * - Carrying a Circle 4+ spell on the hotbar slows you down even if you
 *   never cast it — the price of holding heavy magic is the drag on
 *   your reflexes.
 * - DEX subtraction happens in `rollInitiativeOrder`, not here.
 */
export function effectiveCombatSpeed(c: CombatantState): number {
  const weaponSpeed = WEAPON_DATA[c.weaponId]?.weaponSpeed ?? 5;
  let slowestSpell = 0;
  for (const name of c.combatHotbar) {
    const s = _getSpellData(name)?.castSpeed ?? 0;
    if (s > slowestSpell) slowestSpell = s;
  }
  return weaponSpeed > slowestSpell ? weaponSpeed : slowestSpell;
}

/**
 * Sprint C3: roll a fresh initiative order for every combatant in the
 * session. Lower total = acts first. Re-rolled at the start of every
 * round per the canonical design.
 *
 * Formula (per combatant): `1d10 + effectiveCombatSpeed - getDexReactionBonus(dex)`
 *
 * Stable tiebreaker: when two combatants tie on the rolled total, the
 * one with the lower (alphabetic) `id` acts first. This keeps tests
 * deterministic when seeded.
 */
export function rollInitiativeOrder(combatants: CombatantState[]): string[] {
  const rolls = combatants.map(c => {
    // HASTE's +3 DEX boost lowers the initiative roll (faster), via the
    // same effectiveCombatantDex helper used by evasion. The helper
    // reads c.activeEffects so the buff is dynamic.
    return {
      id: c.id,
      total: randInt(1, 10) + effectiveCombatSpeed(c) - getDexReactionBonus(effectiveCombatantDex(c)),
    };
  });
  rolls.sort((a, b) => {
    if (a.total !== b.total) return a.total - b.total;
    return a.id < b.id ? -1 : 1;
  });
  return rolls.map(r => r.id);
}

// ════════════════════════════════════════════════════════════
// Sprint C3d/g — Multi-combatant action grammar + turn engine
// ════════════════════════════════════════════════════════════
// `resolveAction` is the single entry point for any combatant's voluntary
// action on their turn. The 1v1 `resolveCombatRound` path stays in place
// for back-compat; new code (gameEngine ACT/AI_TURN handlers, UI) calls
// `resolveAction` instead.
//
// Cast resolution implements the locked C3 mechanics:
//  - Mana committed up-front; never refunded if the channel breaks.
//  - One-shot (castTurns=1) spells fire immediately.
//  - Multi-turn (castTurns>1) spells set `channelingState` and resolve on
//    a later turn via `resolveChannelStep`.
//  - `interruptedSinceLastTurn` (set by applyStrike on critical /
//    severed_artery / crushed_windpipe) blocks exactly one cast attempt
//    OR breaks an in-flight channel. The flag is consumed at the end of
//    the affected combatant's next turn in advanceTurn.

export type CombatAction =
  | { kind: "strike";      sourceId: string; targetId: string; zone: BodyZone }
  | { kind: "cast";        sourceId: string; targetId: string; spellName: string }
  | { kind: "use";         sourceId: string; targetId: string; itemId: string }
  | { kind: "swap_hotbar"; sourceId: string; slotIdx: number; spellName: string | null }
  | { kind: "flee";        sourceId: string };

export interface ActionResult {
  session: ActiveCombatSession;
  narrative: string;
  combatOver: boolean;
  /** Set when the action couldn't proceed (not actor's turn, not enough
   *  mana, mid-channel, etc). Caller surfaces to the user; session is
   *  returned unchanged in that case. */
  invalid?: string;
  /**
   * Set when a CAST or channel-step actually fired the spell's
   * mechanical effect (i.e., `applyCombatSpellEffect` ran). UI uses
   * this to gate spell-FX overlays so an interrupt-fizzle or a
   * multi-turn channel START doesn't trigger the streak/explosion.
   * Undefined for non-cast actions (strike, use, flee).
   */
  firedSpell?: { sourceId: string; targetId: string; spellName: string };
  /**
   * Set when a strike action resolves (always populated for kind:"strike",
   * even on miss). Surfaces the StrikeResolution flags as a single
   * structured outcome so the UI can drive lunge / dodge / hit-flash /
   * gore FX without parsing the narrative string. Priority order on
   * `outcome`: criticalFail > evaded > blocked > armorStopped > crit > hit.
   * `damage` is the final damage applied to the target (0 on miss/block/
   * armor-stop), used to drive the floating damage popup.
   */
  firedStrike?: {
    sourceId: string;
    targetId: string;
    zone: BodyZone;
    outcome: "hit" | "crit" | "evaded" | "blocked" | "armorStopped" | "criticalFail";
    damage: number;
  };
}

function findCombatant(session: ActiveCombatSession, id: string): CombatantState | undefined {
  return session.combatants.find(c => c.id === id);
}

function replaceCombatant(session: ActiveCombatSession, updated: CombatantState): ActiveCombatSession {
  const next: ActiveCombatSession = {
    ...session,
    combatants: session.combatants.map(c => c.id === updated.id ? updated : c),
  };
  if (next.playerCombatant.id === updated.id) next.playerCombatant = updated;
  if (next.enemyCombatant.id === updated.id) next.enemyCombatant = updated;
  return next;
}

/** Returns the id of the combatant whose turn it currently is, or null
 *  when the session has no live turn order. */
export function currentActorId(session: ActiveCombatSession): string | null {
  return session.turnOrder[session.currentTurnIdx] ?? null;
}

/**
 * Format the round banner block — used both at fight-start (in the dev
 * harness / UI initial log) and at every round-wrap inside `advanceTurn`.
 * Always uses the player-facing combatant `name` field, never the
 * underlying npcId — programmatic ids like `henchman_brand` must never
 * leak into the user log.
 *
 * Output (3 newline-separated lines, no trailing newline):
 *   ── ROUND 2 ──
 *   Round 2 Initiative: Brand → Rurik the Blade → Gaius → …
 *   Round 2 begins. Brand acts first.
 */
export function formatRoundBanner(session: ActiveCombatSession): string {
  const round = session.roundNumber + 1;
  const nameOf = (id: string): string =>
    session.combatants.find(c => c.id === id)?.name ?? id;
  const orderNames = session.turnOrder.map(nameOf).join(" → ");
  const firstId = session.turnOrder[session.currentTurnIdx] ?? session.turnOrder[0] ?? "";
  const firstName = nameOf(firstId);
  return [
    `── ROUND ${round} ──`,
    `Round ${round} Initiative: ${orderNames}`,
    `Round ${round} begins. ${firstName} acts first.`,
  ].join("\n");
}

/**
 * Detect combatants that just died (hp went from > 0 to <= 0 between
 * two session snapshots) and return the appropriate death narration —
 * an emotional 20-line reaction pool for allies, a terse fall-line pool
 * for enemies. Caller concatenates onto the action's narrative.
 *
 * Returns "" when nobody died this transition. Pure; no side effects.
 */
function deathLines(prev: ActiveCombatSession, next: ActiveCombatSession): string {
  const lines: string[] = [];
  for (const after of next.combatants) {
    const before = prev.combatants.find(p => p.id === after.id);
    if (!before) continue;
    if (before.hp > 0 && after.hp <= 0) {
      if (after.team === "ally") {
        lines.push(pickAllyDeathReaction(after));
      } else {
        lines.push(enemyDeathLine(after));
      }
    }
  }
  return lines.join("\n");
}

/**
 * Phase-1 of Combat Arena v2: when one or more combatants died between
 * `prev` and `next`, stamp them with the `-1` sentinel position (so the
 * renderer can fade+shrink them out of the lane) and re-pack the
 * surviving teammates' positions into a contiguous 1..N. The promotion
 * is real combat state — `calculateEvasionChance` reads `position`, so
 * the new front-rank inherits the front-rank evasion penalty automatically.
 *
 * Pure; idempotent given a stable input pair. Cross-team isolation: a
 * death on one team never re-packs the other.
 */
export function promoteSurvivorsAfterDeath(
  prev: ActiveCombatSession,
  next: ActiveCombatSession,
): ActiveCombatSession {
  const newlyDeadIds = new Set<string>();
  const teamsWithDeaths = new Set<"ally" | "enemy">();
  for (const after of next.combatants) {
    const before = prev.combatants.find(p => p.id === after.id);
    if (!before) continue;
    // Position guard skips combatants already stamped with the sentinel
    // by an earlier call (idempotence).
    if (before.hp > 0 && after.hp <= 0 && after.position >= 1) {
      newlyDeadIds.add(after.id);
      teamsWithDeaths.add(after.team);
    }
  }
  if (newlyDeadIds.size === 0) return next;

  // Stamp the dead with the sentinel.
  let combatants = next.combatants.map(c =>
    newlyDeadIds.has(c.id) ? { ...c, position: -1 as CombatantPosition } : c,
  );

  // Re-pack survivors per team that lost a combatant. Ascending position
  // is preserved so the survivor closest to the front stays front; the
  // back-rank contracts forward to fill any gap.
  for (const team of teamsWithDeaths) {
    const survivors = combatants
      .filter(c => c.team === team && c.position >= 1)
      .sort((a, b) => a.position - b.position);
    const repacked = new Map<string, CombatantPosition>();
    survivors.forEach((c, i) => repacked.set(c.id, (i + 1) as CombatantPosition));
    combatants = combatants.map(c =>
      repacked.has(c.id) ? { ...c, position: repacked.get(c.id)! } : c,
    );
  }

  return {
    ...next,
    combatants,
    playerCombatant:
      combatants.find(c => c.id === next.playerCombatant.id) ?? next.playerCombatant,
    enemyCombatant:
      combatants.find(c => c.id === next.enemyCombatant.id) ?? next.enemyCombatant,
  };
}

/** True while at least one ally and one enemy are still alive. */
function combatStillLive(session: ActiveCombatSession): boolean {
  const allies = session.combatants.filter(c => c.team === "ally" && c.hp > 0);
  const enemies = session.combatants.filter(c => c.team === "enemy" && c.hp > 0);
  return allies.length > 0 && enemies.length > 0;
}

/** Apply the effect of a Circle 1 spell from `source` onto `target`,
 *  returning updated combatants and a player-facing narrative line. The
 *  multi-combatant path intentionally covers HEAL + BLAST only for now
 *  (the locked C3 verification scenarios); the full Circle 2/3 effect
 *  catalogue lives in the legacy `resolveCombatSpell` until a follow-up
 *  sprint ports it. */
// ⚠️  LORE SYNC REMINDER  ⚠️
// When you add, remove, or change a spell's mechanic in this switch,
// you MUST also update its description + effect string in BOTH:
//   - components/combat/sharedWidgets.tsx (COMBAT_SPELLS list)
//   - components/CombatScreen.tsx (parallel COMBAT_SPELLS list, v1 UI)
// The Spellbook UI reads these for player-facing lore. Drift produces
// "spell description claims X, mechanic does Y" complaints.
function applyCombatSpellEffect(
  source: CombatantState,
  target: CombatantState,
  spellName: string,
): { source: CombatantState; target: CombatantState; narrative: string } {
  const upper = spellName.toUpperCase();
  switch (upper) {
    case "HEAL": {
      const baseHeal = randInt(18, 32);
      const spiritMult = 1 + 0.005 * (source.picssi?.spirituality ?? 0);
      const heal = Math.round(baseHeal * spiritMult);
      const before = target.hp;
      const newTarget = { ...target, hp: Math.min(target.maxHp, target.hp + heal) };
      const gained = newTarget.hp - before;
      const sp = pronounsFor(source.gender);
      return {
        source,
        target: newTarget,
        narrative:
          source.id === target.id
            ? `${source.name} weaves the Word of Heal, mending ${sp.possessive} own wounds. (+${gained} HP)`
            : `${source.name} weaves the Word of Heal over ${target.name}. (+${gained} HP)`,
      };
    }
    case "BLAST": {
      let dmg = randInt(2, 16) + 4; // 6..20 — matches legacy resolveCombatSpell
      // RESIST — halves incoming elemental damage. BLAST's stormlight
      // counts as elemental for resistance purposes.
      const resistSev = target.activeEffects.reduce((s, e) => e.type === "resist_elemental" ? s + e.severity : s, 0);
      if (resistSev > 0) dmg = Math.max(1, Math.floor(dmg * 0.5));
      const before = target.hp;
      const newTarget = { ...target, hp: Math.max(0, target.hp - dmg) };
      const dealt = before - newTarget.hp;
      return {
        source,
        target: newTarget,
        narrative: `${source.name}'s Word of Blast strikes ${target.name}. (${dealt} damage)`,
      };
    }

    // ── Sprint C6.1 Stage B — Circle 1 ─────────────────────────────

    case "SPEED": {
      // Buff lands on the TARGET, not the caster — supports both
      // self-cast (target === source) and ally-cast (Vivian → Gaius).
      const tp = pronounsFor(target.gender);
      const newTarget = addStatusEffect(target, {
        type: "haste", zone: "torso", severity: 1, turnsRemaining: 3,
      });
      const isSelf = source.id === target.id;
      return {
        source: isSelf ? newTarget : source,
        target: newTarget,
        narrative: isSelf
          ? `${source.name} weaves the Word of Speed; ${tp.possessive} body remembers wings. (+10 DEX, 3 rounds)`
          : `${source.name} weaves the Word of Speed over ${target.name}; ${tp.possessive} body remembers wings. (+10 DEX, 3 rounds)`,
      };
    }

    // ── Sprint C6.1 Stage B — Circle 2 ─────────────────────────────

    case "GREATER-HEAL": {
      const baseHeal = randInt(35, 55);
      const spiritMult = 1 + 0.005 * (source.picssi?.spirituality ?? 0);
      const heal = Math.round(baseHeal * spiritMult);
      const before = target.hp;
      const newTarget = { ...target, hp: Math.min(target.maxHp, target.hp + heal) };
      const gained = newTarget.hp - before;
      const sp = pronounsFor(source.gender);
      return {
        source,
        target: newTarget,
        narrative:
          source.id === target.id
            ? `${source.name} weaves the deeper binding of the Word of Greater Heal, mending ${sp.possessive} own wounds. (+${gained} HP)`
            : `${source.name} weaves the deeper binding of the Word of Greater Heal over ${target.name}. (+${gained} HP)`,
      };
    }

    case "FIREBOLT": {
      let dmg = randInt(3, 18) + 4; // 3d6+4 ≈ 7..22
      // RESIST — halves incoming elemental damage. Fire is the textbook
      // case for elemental resistance.
      const resistSev = target.activeEffects.reduce((s, e) => e.type === "resist_elemental" ? s + e.severity : s, 0);
      if (resistSev > 0) dmg = Math.max(1, Math.floor(dmg * 0.5));
      const before = target.hp;
      const newTarget = { ...target, hp: Math.max(0, target.hp - dmg) };
      const dealt = before - newTarget.hp;
      return {
        source,
        target: newTarget,
        narrative: `${source.name}'s Word of Firebolt scorches ${target.name}. (${dealt} damage)`,
      };
    }

    case "HASTE": {
      // Per Scotch 2026-05-09: HASTE grants +1 extra action per round
      // for the next 2 rounds AND +3 DEX for the duration. Both effects
      // are bundled into a single `haste_extra_action` status:
      //   - turn-flow expansion in advanceTurn's round-wrap (extra slot)
      //   - +3 effective DEX read in calculateEvasionChance and
      //     getDexReactionBonus (via effectiveCombatantAgility helper)
      //
      // The legacy `haste` effect (+10 evasion, "Feet like wings") is
      // SPEED's payload + the haste-brew flavor; HASTE deliberately does
      // NOT also stack `haste` so the popup stays clean — one spell,
      // one effect entry.
      //
      // turnsRemaining=3 covers 2 round-wraps post-cast: end-of-round-1
      // tick → 2 (round 2 gets extra slot), end-of-round-2 tick → 1
      // (round 3 gets extra slot), end-of-round-3 tick → 0 → removed.
      const newTarget = addStatusEffect(target, {
        type: "haste_extra_action", zone: "torso", severity: 1, turnsRemaining: 3,
      });
      const isSelf = source.id === target.id;
      return {
        source: isSelf ? newTarget : source,
        target: newTarget,
        narrative: isSelf
          ? `${source.name} accelerates between heartbeats. (+1 action/round, +3 DEX, 2 rounds)`
          : `${source.name} weaves the Word of Haste over ${target.name}, who accelerates between heartbeats. (+1 action/round, +3 DEX, 2 rounds)`,
      };
    }

    case "WARD": {
      // Buff lands on the TARGET. Supports ally-cast.
      const newTarget = addStatusEffect(target, {
        type: "ward", zone: "torso", severity: 1, turnsRemaining: 3,
      });
      const isSelf = source.id === target.id;
      return {
        source: isSelf ? newTarget : source,
        target: newTarget,
        narrative: isSelf
          ? `A barrier of woven Words rises around ${source.name}. (+8 armor, 3 rounds)`
          : `${source.name} weaves a barrier around ${target.name}. (+8 armor, 3 rounds)`,
      };
    }

    case "STEELSKIN": {
      // Buff lands on the TARGET. Supports ally-cast. Per Scotch
      // 2026-05-09: 4-turn duration, halves all incoming physical damage
      // while active (passive — not consumed on first hit). Read in
      // resolveStrike() at the post-armor damage step.
      const newTarget = addStatusEffect(target, {
        type: "steelskin", zone: "torso", severity: 1, turnsRemaining: 4,
      });
      const isSelf = source.id === target.id;
      return {
        source: isSelf ? newTarget : source,
        target: newTarget,
        narrative: isSelf
          ? `${source.name}'s skin remembers iron. (physical damage halved, 4 rounds)`
          : `${target.name}'s skin remembers iron at ${source.name}'s Word. (physical damage halved, 4 rounds)`,
      };
    }

    case "SILENCE": {
      // Break any in-flight channel and mark interrupted-this-turn.
      let newTarget: CombatantState = {
        ...target,
        interruptedSinceLastTurn: { kind: "silenced" },
        channelingState: null,
      };
      newTarget = addStatusEffect(newTarget, {
        type: "silenced", zone: "torso", severity: 1, turnsRemaining: 1,
      });
      return {
        source,
        target: newTarget,
        narrative: `${source.name} chokes the Words from ${target.name}'s throat.`,
      };
    }

    case "RESIST": {
      // Buff lands on the TARGET. Supports ally-cast.
      const newTarget = addStatusEffect(target, {
        type: "resist_elemental", zone: "torso", severity: 1, turnsRemaining: 3,
      });
      const isSelf = source.id === target.id;
      return {
        source: isSelf ? newTarget : source,
        target: newTarget,
        narrative: isSelf
          ? `${source.name} braces against fire and ice.`
          : `${source.name} braces ${target.name} against fire and ice.`,
      };
    }

    case "CLEANSE": {
      // Strip the FIRST recognised debuff from target.activeEffects.
      const DEBUFFS: ReadonlySet<string> = new Set([
        "bleed",
        "poison",
        "concussion",
        "damaged_eye",
        "severed_artery",
        "crushed_windpipe",
        "pierced_lung",
        "cracked_ribs",
        "broken_arm",
        "broken_leg",
        "feared_skip",
        "numb_hand",
        "hiccups",
        "tongue_tied",
        "marked_by_set",
        "feeblemind",
        "weakened",
        "clumsied",
        "cursed",
        "paralyzed",
        "silenced",
      ]);
      const debuffIdx = target.activeEffects.findIndex(e => DEBUFFS.has(e.type));
      if (debuffIdx === -1) {
        return {
          source,
          target,
          narrative: `${source.name} weaves a cleansing Word, but ${target.name} bears no curse.`,
        };
      }
      const newEffects = [
        ...target.activeEffects.slice(0, debuffIdx),
        ...target.activeEffects.slice(debuffIdx + 1),
      ];
      const newTarget = { ...target, activeEffects: newEffects };
      return {
        source,
        target: newTarget,
        narrative: `${source.name} strips the curse from ${target.name}.`,
      };
    }

    default: {
      // Stub — full effects ported in a follow-up sprint. Narrate only.
      return {
        source,
        target,
        narrative: `${source.name} releases the Word of ${upper}. (effect deferred)`,
      };
    }
  }
}

// Cast-interrupt narrative is unified across CAST + INVOKE in
// `formatInterruptFizzle` (lib/combat/zoneNarration.ts). The engine
// imports it directly — no local copy.

/**
 * Sprint C3d — single entry point for any combatant's voluntary action.
 * Validates the action belongs to the current actor, dispatches by kind,
 * mutates session state, and advances the turn pointer. Returns the new
 * session + a narrative line + a combat-over flag.
 */
export function resolveAction(session: ActiveCombatSession, action: CombatAction): ActionResult {
  const actorId = currentActorId(session);
  if (!actorId || actorId !== action.sourceId) {
    return {
      session,
      narrative: "",
      combatOver: false,
      invalid: `not ${action.sourceId}'s turn (current actor: ${actorId ?? "none"})`,
    };
  }
  const source = findCombatant(session, action.sourceId);
  if (!source) {
    return { session, narrative: "", combatOver: false, invalid: `unknown combatant ${action.sourceId}` };
  }
  if (source.channelingState !== null) {
    // The caller should have routed this turn through resolveChannelStep.
    return {
      session,
      narrative: "",
      combatOver: false,
      invalid: `${source.name} is channeling — call resolveChannelStep instead`,
    };
  }

  switch (action.kind) {
    case "swap_hotbar": {
      if (action.slotIdx < 0 || action.slotIdx > 5) {
        return { session, narrative: "", combatOver: false, invalid: "slotIdx out of range (0..5)" };
      }
      const newHotbar = [...source.combatHotbar];
      // Pad to slotIdx so the assignment lands at the requested slot.
      while (newHotbar.length <= action.slotIdx) newHotbar.push("");
      newHotbar[action.slotIdx] = action.spellName?.toUpperCase() ?? "";
      const filtered = newHotbar.filter(s => s.length > 0);
      const updated: CombatantState = { ...source, combatHotbar: filtered };
      let next = replaceCombatant(session, updated);
      next = advanceTurn(next).session;
      const swapPron = pronounsFor(source.gender);
      return {
        session: next,
        narrative: action.spellName
          ? `${source.name} re-orders the spellbook in ${swapPron.possessive} head, slotting ${action.spellName.toUpperCase()} into hotbar slot ${action.slotIdx + 1}.`
          : `${source.name} clears hotbar slot ${action.slotIdx + 1}.`,
        combatOver: false,
      };
    }

    case "cast": {
      const upper = action.spellName.toUpperCase();
      const meta = _getSpellData(upper);
      if (!meta) {
        return { session, narrative: "", combatOver: false, invalid: `unknown combat spell ${upper}` };
      }
      // Interrupted this turn — the spell dies on the lips. No mana spent.
      // Flag is consumed in advanceTurn at end of this turn. The reason
      // (critical / severed_artery / crushed_windpipe / silenced) was
      // captured at strike-time and renders as a "due to X" clause so the
      // narrative explains WHY the cast failed, not just that it did.
      if (source.interruptedSinceLastTurn) {
        const next = advanceTurn(session).session;
        return {
          session: next,
          narrative: formatInterruptFizzle({
            casterName: source.name,
            casterGender: source.gender,
            spellLabel: upper,
            reason: source.interruptedSinceLastTurn,
            perspective: "third",
            mode: "fizzle",
          }),
          combatOver: false,
        };
      }
      if (source.mana < meta.manaCost) {
        return {
          session,
          narrative: "",
          combatOver: false,
          invalid: `not enough mana (need ${meta.manaCost}, have ${source.mana})`,
        };
      }
      // Hard refusal: an offensive spell cannot be aimed at a same-team
      // combatant. Self-cast on an offensive spell is also disallowed
      // (BLAST yourself = nonsense). Healing/buff spells skip this check
      // and may freely target self or allies. Refusal happens BEFORE
      // mana commit so misclicks don't cost mana.
      const targetForOffenseCheck = findCombatant(session, action.targetId);
      if (
        _isOffensiveSpell(upper) &&
        targetForOffenseCheck &&
        targetForOffenseCheck.team === source.team
      ) {
        return {
          session,
          narrative: "",
          combatOver: false,
          invalid: `${source.name} cannot cast ${upper} on ${targetForOffenseCheck.name} — they are on the same side.`,
        };
      }
      // Commit mana now — never refundable, even if the channel breaks.
      const afterMana: CombatantState = { ...source, mana: source.mana - meta.manaCost };

      if (meta.castTurns === 1) {
        // Self-cast: target inherits afterMana so the decrement + HP bump
        // land in one combatant. Other-target: write source + target both.
        const isSelf = action.targetId === source.id;
        const target = isSelf ? afterMana : findCombatant(session, action.targetId);
        if (!target) {
          return { session, narrative: "", combatOver: false, invalid: `unknown target ${action.targetId}` };
        }
        // Reject dead targets up-front — same defense as the strike branch.
        // Self-cast bypass: a combatant on 0 HP can't be the actor, so
        // this only blocks casts at OTHER dead combatants.
        if (!isSelf && target.hp <= 0) {
          return { session, narrative: "", combatOver: false, invalid: `${target.name} is already dead — pick a live target` };
        }
        const fx = applyCombatSpellEffect(afterMana, target, upper);
        let next: ActiveCombatSession = isSelf
          ? replaceCombatant(session, fx.target)
          : replaceCombatant(replaceCombatant(session, fx.source), fx.target);
        next = promoteSurvivorsAfterDeath(session, next);
        const deaths = deathLines(session, next);
        let combatOver = !combatStillLive(next);
        if (combatOver) {
          next = {
            ...next,
            finished: true,
            playerWon: next.combatants.some(c => c.team === "ally" && c.hp > 0),
          };
        }
        next = advanceTurn(next).session;
        const narrative = [fx.narrative, deaths].filter(Boolean).join("\n");
        return {
          session: next,
          narrative,
          combatOver,
          firedSpell: { sourceId: source.id, targetId: target.id, spellName: upper },
        };
      }

      // Multi-turn channel — set channelingState; spell fires on the
      // combatant's Nth turn from now. Caster is locked into the channel
      // (no other actions allowed) until it resolves or breaks.
      const channeling: CombatantState = {
        ...afterMana,
        channelingState: {
          spellName: upper,
          targetId: action.targetId,
          turnsRemaining: meta.castTurns - 1,
        },
      };
      let next = replaceCombatant(session, channeling);
      next = advanceTurn(next).session;
      return {
        session: next,
        narrative: `${source.name} begins to weave the Word of ${upper}…`,
        combatOver: false,
      };
    }

    case "strike": {
      const target = findCombatant(session, action.targetId);
      if (!target) {
        return { session, narrative: "", combatOver: false, invalid: `unknown target ${action.targetId}` };
      }
      // Cannot strike a corpse. Defends against UI state-drift (a stale
      // targetId left over from a previous turn) and any future automation
      // path that might pick a dead combatant. AI's pickAction already
      // filters to live opponents, so this branch only fires for misclicks.
      if (target.hp <= 0) {
        return { session, narrative: "", combatOver: false, invalid: `${target.name} is already dead — pick a live target` };
      }
      // Hard refusal: cannot strike a same-team combatant. Howard's prose
      // never has a hero swinging on his own — it's a categorical wrong,
      // not a "are you sure?" prompt. Self-target is also disallowed
      // (a strike on yourself isn't a meaningful action). Source.id ===
      // target.id is unreachable with the live-target filter the UI
      // applies anyway; included for completeness.
      if (target.team === source.team) {
        return {
          session,
          narrative: "",
          combatOver: false,
          invalid: `${source.name} cannot strike ${target.name} — they are on the same side.`,
        };
      }
      const weaponCat = getWeaponCategory(source.weaponId);
      const strike = resolveStrike(source, target, action.zone, weaponCat);
      let updatedSource: CombatantState = source;
      const updatedTarget = applyStrike(target, strike);
      if (strike.reflectedDamage > 0) {
        updatedSource = { ...updatedSource, hp: Math.max(0, updatedSource.hp - strike.reflectedDamage) };
      }
      if (strike.weaponDropped && updatedSource.weaponId !== "unarmed") {
        updatedSource = { ...updatedSource, droppedWeaponId: updatedSource.weaponId, weaponId: "unarmed" };
      }
      const weaponName = ITEMS[source.weaponId]?.name ?? "weapon";
      // Sprint C8 — multi-combatant fight uses third-person prose with
      // an explicit attack-description preamble. The legacy second-person
      // `buildZoneStrikeNarrative` reads oddly when the attacker isn't
      // "you" (e.g. Vivian striking Korm), so the multi-combatant path
      // gets its own builder.
      const narrative = buildMultiStrikeNarrative(
        strike,
        source.name,
        target.name,
        weaponName,
        weaponCat,
        target.maxHp,
      );
      let next = replaceCombatant(session, updatedSource);
      next = replaceCombatant(next, updatedTarget);
      next = promoteSurvivorsAfterDeath(session, next);
      const deaths = deathLines(session, next);
      let combatOver = !combatStillLive(next);
      if (combatOver) {
        next = {
          ...next,
          finished: true,
          playerWon: next.combatants.some(c => c.team === "ally" && c.hp > 0),
        };
      }
      next = advanceTurn(next).session;
      const fullNarrative = [narrative, deaths].filter(Boolean).join("\n");
      // Outcome priority: criticalFail > evaded > blocked > armorStopped > crit > hit.
      // criticalFail can co-occur with evaded (set on fumbled misses); it wins.
      const strikeOutcome: NonNullable<ActionResult["firedStrike"]>["outcome"] =
        strike.isCriticalFail ? "criticalFail"
        : strike.evaded ? "evaded"
        : strike.blocked ? "blocked"
        : strike.armorStopped ? "armorStopped"
        : strike.isCritical ? "crit"
        : "hit";
      return {
        session: next,
        narrative: fullNarrative,
        combatOver,
        firedStrike: {
          sourceId: source.id,
          targetId: target.id,
          zone: action.zone,
          outcome: strikeOutcome,
          damage: strike.damageDealt,
        },
      };
    }

    case "use": {
      const idx = source.inventory.findIndex(e => e.itemId === action.itemId);
      if (idx < 0 || source.inventory[idx].quantity <= 0) {
        return { session, narrative: "", combatOver: false, invalid: `${source.name} has no ${action.itemId}` };
      }
      const target = findCombatant(session, action.targetId);
      if (!target) {
        return { session, narrative: "", combatOver: false, invalid: `unknown target ${action.targetId}` };
      }
      const updatedInventory = source.inventory
        .map((e, i) => i === idx ? { ...e, quantity: e.quantity - 1 } : e)
        .filter(e => e.quantity > 0);
      let updatedSource: CombatantState = { ...source, inventory: updatedInventory };
      let updatedTarget: CombatantState = target;
      // If source and target are the same, fold both updates onto one
      // combatant so the inventory decrement isn't lost.
      const selfTarget = source.id === target.id;
      let useNarrative = "";

      // ⚠️  LORE SYNC REMINDER  ⚠️
      // When you add, remove, or change a consumable's mechanic below,
      // you MUST also update its lore in lib/items.ts (or wherever the
      // ITEM registry stores its `description` / `flavor` text). The
      // item-icon hover, the inventory tooltip, and the apothecary's
      // shop blurbs all read those descriptions. Mechanic-vs-lore drift
      // here produces "the bottle promised X, the brew did Y" bug
      // reports — exactly the class of issue this comment exists to
      // prevent. Confirm the description matches the heal range,
      // duration, severity, and effect-strip before merging.
      switch (action.itemId) {
        case "healing_potion": {
          const heal = randInt(15, 25);
          const before = updatedTarget.hp;
          const healed: CombatantState = { ...updatedTarget, hp: Math.min(updatedTarget.maxHp, updatedTarget.hp + heal) };
          const gained = healed.hp - before;
          useNarrative = selfTarget
            ? `${source.name} drinks a healing potion. (+${gained} HP)`
            : `${source.name} pours a healing potion down ${target.name}'s throat. (+${gained} HP)`;
          if (selfTarget) {
            updatedSource = { ...updatedSource, hp: healed.hp };
            updatedTarget = updatedSource;
          } else {
            updatedTarget = healed;
          }
          break;
        }
        case "greater_healing_potion": {
          // Mathematically equivalent to the GREATER-HEAL spell's base
          // heal range — randInt(35, 55) — minus the spell's
          // spirituality multiplier, since potions are alchemical, not
          // divinely amplified.
          const heal = randInt(35, 55);
          const before = updatedTarget.hp;
          const healed: CombatantState = {
            ...updatedTarget,
            hp: Math.min(updatedTarget.maxHp, updatedTarget.hp + heal),
          };
          const gained = healed.hp - before;
          const tp = pronounsFor(target.gender);
          useNarrative = selfTarget
            ? `${source.name} drains the silver-bright brew. The pain ebbs out of ${tp.possessive} bones. (+${gained} HP)`
            : `${source.name} tilts the silver-bright brew between ${target.name}'s lips. The pain ebbs out of ${tp.possessive} bones. (+${gained} HP)`;
          if (selfTarget) {
            updatedSource = { ...updatedSource, hp: healed.hp };
            updatedTarget = updatedSource;
          } else {
            updatedTarget = healed;
          }
          break;
        }
        case "mana_potion": {
          const restored = randInt(8, 15);
          const before = updatedTarget.mana;
          const restoredTarget: CombatantState = { ...updatedTarget, mana: Math.min(updatedTarget.maxMana, updatedTarget.mana + restored) };
          const gained = restoredTarget.mana - before;
          useNarrative = selfTarget
            ? `${source.name} drinks a mana potion. (+${gained} mana)`
            : `${source.name} hands ${target.name} a mana potion. (+${gained} mana)`;
          if (selfTarget) {
            updatedSource = { ...updatedSource, mana: restoredTarget.mana };
            updatedTarget = updatedSource;
          } else {
            updatedTarget = restoredTarget;
          }
          break;
        }
        case "bandage": {
          // Strips light bleeding only — severed-artery wounds need a
          // tourniquet. (Refactor 2026-05-08: was previously stripping
          // both, which left tourniquet pointless. Now bandage =
          // lighter tool, tourniquet = stronger tool, choice is
          // meaningful per the item descriptions in lib/gameData.ts.)
          const hadBleed = updatedTarget.activeEffects.some(e => e.type === "bleed");
          const cleared = updatedTarget.activeEffects.filter(e => e.type !== "bleed");
          const bandaged: CombatantState = { ...updatedTarget, activeEffects: cleared };
          const sp = pronounsFor(source.gender);
          useNarrative = selfTarget
            ? hadBleed
              ? `${source.name} binds ${sp.possessive} wound with clean linen. The blood remembers to stay within.`
              : `${source.name} winds the linen around ${sp.possessive} arm — a steadying gesture, no wound to close.`
            : hadBleed
              ? `${source.name} binds ${target.name}'s wound with clean linen. The blood remembers to stay within.`
              : `${source.name} winds the linen around ${target.name}'s arm — steadying, no fresh wound to close.`;
          if (selfTarget) {
            updatedSource = { ...updatedSource, activeEffects: cleared };
            updatedTarget = updatedSource;
          } else {
            updatedTarget = bandaged;
          }
          break;
        }
        case "tourniquet": {
          // Stops severe bleeding (severed_artery). Strips light bleed
          // too, since a cinched tourniquet above the wound stops both
          // — the description in lib/gameData.ts notes the windlass
          // tightens "until the blood remembers to stay within."
          const hadSevere = updatedTarget.activeEffects.some(e => e.type === "severed_artery");
          const hadBleed = updatedTarget.activeEffects.some(e => e.type === "bleed");
          const cleared = updatedTarget.activeEffects.filter(
            e => e.type !== "severed_artery" && e.type !== "bleed",
          );
          const tied: CombatantState = { ...updatedTarget, activeEffects: cleared };
          const sp = pronounsFor(source.gender);
          const tp = pronounsFor(target.gender);
          useNarrative = selfTarget
            ? hadSevere || hadBleed
              ? `${source.name} cinches the leather strap above ${sp.possessive} bleeding wound and turns the windlass. The blood remembers to stay within.`
              : `${source.name} lifts the leather strap, but ${sp.possessive} bleeding has already settled.`
            : hadSevere || hadBleed
              ? `${source.name} cinches the leather strap above ${target.name}'s bleeding wound and turns the windlass. The blood remembers to stay within ${tp.possessive} body.`
              : `${source.name} lifts the leather strap, but ${target.name}'s bleeding has already settled.`;
          if (selfTarget) {
            updatedSource = { ...updatedSource, activeEffects: cleared };
            updatedTarget = updatedSource;
          } else {
            updatedTarget = tied;
          }
          break;
        }
        case "stamina_brew": {
          // "Nimble Toes" — alchemical analog of the SPEED Word. Adds
          // the same `haste` effect (severity 1, 3 rounds) so it
          // boosts evasion the same way.
          const sp = pronounsFor(source.gender);
          const tp = pronounsFor(target.gender);
          const buffed = addStatusEffect(updatedTarget, {
            type: "haste", zone: "torso", severity: 1, turnsRemaining: 3,
          });
          useNarrative = selfTarget
            ? `${source.name} drinks down the bitter brown brew. The weariness slides off ${sp.possessive} shoulders like a wet cloak.`
            : `${source.name} presses the bitter brown cup to ${target.name}'s lips. The weariness slides off ${tp.possessive} shoulders like a wet cloak.`;
          if (selfTarget) {
            updatedSource = { ...updatedSource, activeEffects: buffed.activeEffects };
            updatedTarget = updatedSource;
          } else {
            updatedTarget = buffed;
          }
          break;
        }
        case "fatigue_brew": {
          // "Silent Shadow" — stronger draught, severity 2, 4 rounds.
          // The body forgets it is tired, twice over.
          const sp = pronounsFor(source.gender);
          const tp = pronounsFor(target.gender);
          const buffed = addStatusEffect(updatedTarget, {
            type: "haste", zone: "torso", severity: 2, turnsRemaining: 4,
          });
          useNarrative = selfTarget
            ? `${source.name} drains the thick green draught. ${sp.subject} moves now between heartbeats — feet soundless, hand unerring.`
            : `${source.name} hands ${target.name} the thick green draught. ${tp.subject} moves now between heartbeats — feet soundless, hand unerring.`;
          if (selfTarget) {
            updatedSource = { ...updatedSource, activeEffects: buffed.activeEffects };
            updatedTarget = updatedSource;
          } else {
            updatedTarget = buffed;
          }
          break;
        }
        case "antidote": {
          // Cures mild poisoning (severity 1). Stronger venoms shrug
          // off the white-spider remedy and need the saffron brew.
          const idx2 = updatedTarget.activeEffects.findIndex(
            e => e.type === "poison" && e.severity <= 1,
          );
          const cleared = idx2 < 0
            ? updatedTarget.activeEffects
            : [...updatedTarget.activeEffects.slice(0, idx2), ...updatedTarget.activeEffects.slice(idx2 + 1)];
          const cured: CombatantState = { ...updatedTarget, activeEffects: cleared };
          const tp = pronounsFor(target.gender);
          useNarrative = selfTarget
            ? idx2 >= 0
              ? `${source.name} swallows the chalky white suspension. The poison is reasoned with, then escorted out of ${tp.possessive} blood.`
              : `${source.name} would drink the chalky white suspension, but no venom rides ${tp.possessive} blood.`
            : idx2 >= 0
              ? `${source.name} pours the chalky white suspension between ${target.name}'s lips. The poison is reasoned with, then escorted out.`
              : `${source.name} lifts the chalky white vial, but ${target.name} bears no venom in ${tp.possessive} blood.`;
          if (selfTarget) {
            updatedSource = { ...updatedSource, activeEffects: cleared };
            updatedTarget = updatedSource;
          } else {
            updatedTarget = cured;
          }
          break;
        }
        case "strong_antidote": {
          // Cures any severity of poisoning. Strips ALL poison entries.
          const hadPoison = updatedTarget.activeEffects.some(e => e.type === "poison");
          const cleared = updatedTarget.activeEffects.filter(e => e.type !== "poison");
          const cured: CombatantState = { ...updatedTarget, activeEffects: cleared };
          const tp = pronounsFor(target.gender);
          useNarrative = selfTarget
            ? hadPoison
              ? `${source.name} downs the vivid yellow potion. It burns. The deeper venom remembers it does not belong here.`
              : `${source.name} corks the yellow vial again — no venom in ${tp.possessive} blood to answer for.`
            : hadPoison
              ? `${source.name} forces the vivid yellow potion past ${target.name}'s teeth. It burns. The deeper venom remembers it does not belong here.`
              : `${source.name} hesitates over ${target.name} — no venom in ${tp.possessive} blood to answer for.`;
          if (selfTarget) {
            updatedSource = { ...updatedSource, activeEffects: cleared };
            updatedTarget = updatedSource;
          } else {
            updatedTarget = cured;
          }
          break;
        }
        default:
          useNarrative = `${source.name} uses ${action.itemId}.`;
      }

      let next = replaceCombatant(session, updatedSource);
      if (!selfTarget) next = replaceCombatant(next, updatedTarget);
      next = advanceTurn(next).session;
      return { session: next, narrative: useNarrative, combatOver: false };
    }

    case "flee": {
      // v1: single-actor flee ends the fight as a non-victory. Party-flee
      // is handled in the gameEngine FLEE handler.
      const next: ActiveCombatSession = { ...session, finished: true, playerWon: false };
      return {
        session: next,
        narrative: `${source.name} breaks off and flees.`,
        combatOver: true,
      };
    }
  }
}

/**
 * Sprint C3 — resolve the channel step for the current actor when they
 * are mid-channel. Caller invokes this when the current actor's
 * `channelingState !== null` (UI greys action buttons in that state; AI
 * skips action selection).
 *
 * Three outcomes:
 *  1. Interrupted: clear channelingState, mana stays gone, advance turn.
 *  2. More turns to weave: decrement turnsRemaining, advance turn.
 *  3. Final turn: fire spell at the locked target, clear channelingState.
 */
export function resolveChannelStep(session: ActiveCombatSession): ActionResult {
  const actorId = currentActorId(session);
  if (!actorId) return { session, narrative: "", combatOver: false, invalid: "no current actor" };
  const source = findCombatant(session, actorId);
  if (!source || !source.channelingState) {
    return { session, narrative: "", combatOver: false, invalid: `${actorId} is not channeling` };
  }

  if (source.interruptedSinceLastTurn) {
    const reason = source.interruptedSinceLastTurn;
    const updated: CombatantState = { ...source, channelingState: null };
    let next = replaceCombatant(session, updated);
    next = advanceTurn(next).session;
    return {
      session: next,
      narrative: formatInterruptFizzle({
        casterName: source.name,
        casterGender: source.gender,
        spellLabel: source.channelingState?.spellName ?? "the Word",
        reason,
        perspective: "third",
        mode: "channel-shatter",
      }),
      combatOver: false,
    };
  }

  const ch = source.channelingState;
  if (ch.turnsRemaining > 1) {
    const updated: CombatantState = {
      ...source,
      channelingState: { ...ch, turnsRemaining: ch.turnsRemaining - 1 },
    };
    let next = replaceCombatant(session, updated);
    next = advanceTurn(next).session;
    return {
      session: next,
      narrative: `${source.name} continues to weave the Word of ${ch.spellName}…`,
      combatOver: false,
    };
  }

  // Final turn — fire spell at the locked target.
  const isSelf = ch.targetId === source.id;
  const cleared: CombatantState = { ...source, channelingState: null };
  const target = isSelf ? cleared : findCombatant(session, ch.targetId);
  if (!target || target.hp <= 0) {
    let next = replaceCombatant(session, cleared);
    next = advanceTurn(next).session;
    return {
      session: next,
      narrative: `${source.name}'s ${ch.spellName} finds nothing to land on.`,
      combatOver: false,
    };
  }
  const fx = applyCombatSpellEffect(cleared, target, ch.spellName);
  let next: ActiveCombatSession = isSelf
    ? replaceCombatant(session, fx.target)
    : replaceCombatant(replaceCombatant(session, fx.source), fx.target);
  next = promoteSurvivorsAfterDeath(session, next);
  const deaths = deathLines(session, next);
  let combatOver = !combatStillLive(next);
  if (combatOver) {
    next = {
      ...next,
      finished: true,
      playerWon: next.combatants.some(c => c.team === "ally" && c.hp > 0),
    };
  }
  next = advanceTurn(next).session;
  const fullNarrative = [fx.narrative, deaths].filter(Boolean).join("\n");
  return {
    session: next,
    narrative: fullNarrative,
    combatOver,
    firedSpell: { sourceId: source.id, targetId: target.id, spellName: ch.spellName },
  };
}

/**
 * Sprint C3g — bump the turn pointer; on round wrap, tick all status
 * effects + tick barriers + re-roll initiative. Always clears the
 * `interruptedSinceLastTurn` flag for the actor whose turn just ended,
 * so a single interrupt blocks exactly one of that combatant's turns.
 */
export function advanceTurn(session: ActiveCombatSession): { session: ActiveCombatSession; narrative: string } {
  const finishedActorId = session.turnOrder[session.currentTurnIdx];
  const cleared = session.combatants.map(c =>
    c.id === finishedActorId && c.interruptedSinceLastTurn
      ? { ...c, interruptedSinceLastTurn: null }
      : c,
  );
  let next: ActiveCombatSession = {
    ...session,
    combatants: cleared,
    playerCombatant: cleared.find(c => c.id === session.playerCombatant.id) ?? session.playerCombatant,
    enemyCombatant: cleared.find(c => c.id === session.enemyCombatant.id) ?? session.enemyCombatant,
  };

  const tickParts: string[] = [];

  // Walk the pointer forward until it lands on a live combatant or
  // combat ends. A combatant who died earlier this round (e.g., killed
  // by another actor before their slot came up) is silently skipped.
  // Each pass through the end of `turnOrder` rolls a fresh initiative
  // on the surviving combatants.
  //
  // Step cap defends against any pathological state where every entry
  // in `turnOrder` is dead — should never happen because `combatStillLive`
  // would have ended combat earlier, but we belt-and-suspender it.
  const maxSteps = next.turnOrder.length * 2 + 4;
  for (let step = 0; step < maxSteps; step++) {
    // End combat the moment one side is wiped, regardless of who killed
    // the last enemy (a bleed tick on round-wrap, a chained death from
    // reflected damage, etc.).
    if (!combatStillLive(next)) {
      next = {
        ...next,
        finished: true,
        playerWon: next.combatants.some(c => c.team === "ally" && c.hp > 0),
      };
      return { session: next, narrative: tickParts.join("\n") };
    }

    const newIdx = next.currentTurnIdx + 1;
    if (newIdx >= next.turnOrder.length) {
      // Round wrap — tick all combatants, tick barriers, re-roll
      // initiative on the survivors only.
      const preTick = next;
      const ticked: CombatantState[] = next.combatants.map(c => {
        const t = tickStatusEffects(c);
        if (t.narrative) tickParts.push(t.narrative);
        return t.updatedCombatant;
      });
      // Build the round's turn order, then expand it: any combatant
      // with `haste_extra_action` still active (turnsRemaining > 0
      // post-tick) gets a SECOND slot inserted right after their first.
      // That's the +1 action/round HASTE grants. With turnsRemaining=3
      // at cast, this fires for the next 2 round-wraps before tickStatus
      // expires the effect.
      const baseOrder = rollInitiativeOrder(ticked.filter(c => c.hp > 0));
      const expandedOrder: string[] = [];
      for (const id of baseOrder) {
        expandedOrder.push(id);
        const combatant = ticked.find(c => c.id === id);
        if (
          combatant?.activeEffects.some(
            e => e.type === "haste_extra_action" && e.turnsRemaining > 0,
          )
        ) {
          expandedOrder.push(id);
        }
      }
      next = {
        ...next,
        combatants: ticked,
        playerCombatant: ticked.find(c => c.id === next.playerCombatant.id) ?? next.playerCombatant,
        enemyCombatant: ticked.find(c => c.id === next.enemyCombatant.id) ?? next.enemyCombatant,
        roundNumber: next.roundNumber + 1,
        turnOrder: expandedOrder,
        currentTurnIdx: 0,
      };
      next = tickBarriers(next);
      // Bleed/poison ticks can drop a combatant on round-wrap. Promote
      // survivors BEFORE the death narration so any "front-rank"
      // narrative built later reads from the post-promotion lane.
      next = promoteSurvivorsAfterDeath(preTick, next);
      const tickDeaths = deathLines(preTick, next);
      if (tickDeaths) tickParts.push(tickDeaths);
      // Emit the round banner block so the UI can render a separator +
      // fresh initiative print. Skipped if the wrap also wiped a side —
      // `combatStillLive` will catch that on the next loop iteration and
      // mark combat finished without a stray "Round N begins" line.
      if (combatStillLive(next)) {
        tickParts.push(formatRoundBanner(next));
      }
    } else {
      next = { ...next, currentTurnIdx: newIdx };
    }

    // Stop walking once the head of the queue is alive.
    const headId = next.turnOrder[next.currentTurnIdx];
    const head = next.combatants.find(c => c.id === headId);
    if (head && head.hp > 0) {
      return { session: next, narrative: tickParts.join("\n") };
    }
    // Otherwise keep walking — the combatant at this slot is dead.
  }

  // Defensive bail-out — should be unreachable in well-formed state.
  next = { ...next, finished: true, playerWon: false };
  return { session: next, narrative: tickParts.join("\n") };
}

/**
 * Sprint C3g — drive the AI loop forward until the turn pointer lands on
 * a player-controlled combatant whose channel is clear (or combat ends).
 * For each AI/channeling actor in turn:
 *  - Channeling actor → resolveChannelStep (auto-resolves the channel).
 *  - AI actor → pickAction (using the NPC registry's aiPolicy if any,
 *    falling back to DEFAULT_BANDIT_POLICY) → resolveAction.
 *
 * The loop has a hard step cap to defend against pathological cycles —
 * e.g., an AI that picks a no-op repeatedly. Capped at 6 × turnOrder
 * length, which covers a full round of channel resolutions plus normal
 * actions across the canonical 6-combatant fight.
 */
export function runAiTurns(session: ActiveCombatSession): {
  session: ActiveCombatSession;
  narrative: string;
  combatOver: boolean;
} {
  let current = session;
  const lines: string[] = [];
  let steps = 0;
  const maxSteps = Math.max(36, current.turnOrder.length * 6);

  while (!current.finished && steps < maxSteps) {
    const actorId = currentActorId(current);
    if (!actorId) break;
    const actor = current.combatants.find((c) => c.id === actorId);
    if (!actor || actor.hp <= 0) break;

    // Stop when control returns to a player-controlled, non-channeling actor.
    if (actor.controlledBy === "player" && actor.channelingState === null) break;

    if (actor.channelingState !== null) {
      const r = resolveChannelStep(current);
      current = r.session;
      if (r.narrative) lines.push(r.narrative);
      if (r.combatOver) break;
    } else {
      // AI actor — pick + resolve.
      const policy = (actor.npcId && NPCS[actor.npcId]?.aiPolicy) || DEFAULT_BANDIT_POLICY;
      const action = pickAction(actor, current, policy);
      const r = resolveAction(current, action);
      if (r.invalid) {
        // Defensive: if AI picked an invalid action (shouldn't happen),
        // skip the turn to avoid an infinite loop.
        current = advanceTurn(current).session;
      } else {
        current = r.session;
        if (r.narrative) lines.push(r.narrative);
        if (r.combatOver) break;
      }
    }
    steps++;
  }

  return {
    session: current,
    narrative: lines.join("\n\n"),
    combatOver: current.finished === true,
  };
}

/** Sprint C3g — multi-combatant session init. Builds combatants from a
 *  party spec (allies + enemies, each with optional position), rolls
 *  initiative, sets currentTurnIdx = 0. The hero is included by passing
 *  `npcId: "hero"`; everyone else resolves through `NPCS[npcId]`.
 *
 *  Falls back to null when the spec yields zero allies or zero enemies.
 *  The legacy 1v1 `initCombatSession(state, enemyNpcId)` overload stays
 *  in place for back-compat with existing room-based encounters. */
export interface CombatPartySpec {
  allies: Array<{ npcId: string | "hero"; position?: 1 | 2 | 3; controlledBy?: "player" | "ai" }>;
  enemies: Array<{ npcId: string; position?: 1 | 2 | 3 }>;
}

export function initMultiCombatSession(
  state: WorldState,
  spec: CombatPartySpec,
  opts?: { backgroundUrl?: string },
): ActiveCombatSession | null {
  const allies: CombatantState[] = [];
  for (const a of spec.allies) {
    if (a.npcId === "hero") {
      const hero = buildCombatantFromPlayer(state);
      allies.push({
        ...hero,
        position: a.position ?? 1,
        controlledBy: a.controlledBy ?? "player",
      });
    } else {
      const npc = NPCS[a.npcId];
      if (!npc) continue;
      const npcState = state.npcs[a.npcId];
      const hp = npcState?.combatHp ?? npc.stats.hp;
      const c = buildCombatantFromNPC(a.npcId, npc, hp, {
        team: "ally",
        controlledBy: a.controlledBy ?? "player",
        position: a.position ?? 1,
      });
      allies.push(c);
    }
  }

  const enemies: CombatantState[] = [];
  for (const e of spec.enemies) {
    const npc = NPCS[e.npcId];
    if (!npc) continue;
    const npcState = state.npcs[e.npcId];
    const hp = npcState?.combatHp ?? npc.stats.hp;
    const c = buildCombatantFromNPC(e.npcId, npc, hp, {
      team: "enemy",
      controlledBy: "ai",
      position: e.position ?? 1,
    });
    enemies.push(c);
  }

  if (allies.length === 0 || enemies.length === 0) return null;

  const all = [...allies, ...enemies];
  const turnOrder = rollInitiativeOrder(all);
  const heroOrFirstAlly = allies[0];
  const firstEnemy = enemies[0];

  return {
    enemyNpcId: firstEnemy.npcId ?? firstEnemy.id,
    enemyName: firstEnemy.name,
    roundNumber: 0,
    playerCombatant: heroOrFirstAlly,
    enemyCombatant: firstEnemy,
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
    combatants: all,
    turnOrder,
    currentTurnIdx: 0,
    backgroundUrl: opts?.backgroundUrl,
  };
}

// ── Full Round Resolution ───────────────────────────────────

export function resolveCombatRound(
  session: ActiveCombatSession,
  playerTargetZone: BodyZone,
  opts?: { enemyIsTrainingDummy?: boolean }
): CombatRoundResult {
  const enemyIsTrainingDummy = opts?.enemyIsTrainingDummy === true;
  let player = { ...session.playerCombatant };
  let enemy = { ...session.enemyCombatant };
  const roundNumber = session.roundNumber + 1;

  // 1. Tick status effects
  const playerTick = tickStatusEffects(player);
  player = playerTick.updatedCombatant;
  const enemyTick = tickStatusEffects(enemy);
  enemy = enemyTick.updatedCombatant;
  const statusTickNarrative = [playerTick.narrative, enemyTick.narrative]
    .filter(Boolean)
    .join("\n");

  // Pre-work B: compute the ticked barriers once. Returned in
  // `updatedBarriers` on every return path; caller writes back to session.
  const updatedBarriers = tickBarriers(session).barriers;

  // 2. Check for deaths from status ticks
  if (player.hp <= 0) {
    return {
      playerStrike: null,
      enemyStrike: null,
      playerGoesFirst: false,
      initiativeNarrative: "",
      roundNumber,
      combatOver: true,
      playerWon: false,
      playerDied: true,
      updatedPlayer: player,
      updatedEnemy: enemy,
      statusTickNarrative,
      updatedBarriers,
    };
  }
  if (enemy.hp <= 0) {
    return {
      playerStrike: null,
      enemyStrike: null,
      playerGoesFirst: false,
      initiativeNarrative: "",
      roundNumber,
      combatOver: true,
      playerWon: true,
      playerDied: false,
      updatedPlayer: player,
      updatedEnemy: enemy,
      statusTickNarrative,
      updatedBarriers,
    };
  }

  // 2b. Auto-retrieve dropped weapons from last round
  if (player.droppedWeaponId) {
    player = { ...player, weaponId: player.droppedWeaponId, droppedWeaponId: null };
  }
  if (enemy.droppedWeaponId) {
    enemy = { ...enemy, weaponId: enemy.droppedWeaponId, droppedWeaponId: null };
  }

  // 2c. Sprint 1 — Tier 4 exhaustion blocks player action
  // Per KARMA_SYSTEM.md §2.3, fatiguePool ≤ −4·maxStamina = tier 4 (exhausted).
  // Player cannot raise their arms; turn is forfeit. (No strike, no spell, nothing.)
  if ((player.fatigueTier ?? 0) === 4) {
    return {
      playerStrike: null,
      enemyStrike: null,
      playerGoesFirst: false,
      initiativeNarrative: "",
      roundNumber,
      combatOver: false,
      playerWon: false,
      playerDied: false,
      updatedPlayer: player,
      updatedEnemy: enemy,
      statusTickNarrative: statusTickNarrative + "\n🔥 **You are utterly exhausted. You cannot raise your arms.** Rest to recover stamina.",
      updatedBarriers,
    };
  }

  // 3. Initiative
  const playerSpeed = WEAPON_DATA[player.weaponId]?.weaponSpeed ?? 5;
  const playerInit = randInt(1, 10) + playerSpeed - getDexReactionBonus(player.dexterity);
  const enemyInit = randInt(1, 10) + 5;
  const playerGoesFirst = enemyIsTrainingDummy ? true : playerInit <= enemyInit;
  const initiativeNarrative = enemyIsTrainingDummy
    ? ""
    : `⚡ Initiative — You: ${playerInit} · ${enemy.name}: ${enemyInit}\n${playerGoesFirst ? "You" : enemy.name} acts first.`;

  // 4. Resolve strikes
  const playerWeaponCat = getWeaponCategory(player.weaponId);
  const enemyWeaponCat: WeaponCategory = "slash"; // NPCs default to slash
  const enemyTargetZone = chooseEnemyTargetZone(enemy, player);

  let playerStrike: StrikeResolution | null = null;
  let enemyStrike: StrikeResolution | null = null;
  let combatOver = false;
  let playerWon = false;
  let playerDied = false;

  // Helper: apply weapon-drop to the attacker after their strike resolves
  const applyWeaponDrop = (combatant: CombatantState, strike: StrikeResolution): CombatantState => {
    if (strike.weaponDropped && combatant.weaponId !== "unarmed") {
      return { ...combatant, droppedWeaponId: combatant.weaponId, weaponId: "unarmed" };
    }
    return combatant;
  };

  // Helper: build a "skipped strike" resolution for combatants whose action
  // is consumed by feared_skip. Looks like a missed swing in the narrative
  // but deals no damage.
  const skipStrike = (zone: BodyZone, attackerName: string): StrikeResolution => ({
    targetZone: zone,
    evaded: true,
    blocked: false,
    armorStopped: false,
    armorDamaged: 0,
    armorBroken: false,
    damageDealt: 0,
    reflectedDamage: 0,
    injuryInflicted: null,
    injurySeverity: 0,
    isCritical: false,
    isCriticalFail: false,
    weaponDropped: false,
    narrative: `${attackerName} hesitates — something behind them caught their eye — and the moment is lost.`,
  });
  const enemyIsFeared = enemy.activeEffects.some(e => e.type === "feared_skip" || e.type === "paralyzed");

  // Training dummies never strike back — they are inanimate wooden posts.
  // The player always acts "first" since there's nothing to contest initiative.
  if (enemyIsTrainingDummy) {
    playerStrike = tryStrikeWithBarriers(player, enemy, playerTargetZone, playerWeaponCat, session.barriers);
    enemy = applyStrike(enemy, playerStrike);
    player = applyWeaponDrop(player, playerStrike);
    if (enemy.hp <= 0) {
      combatOver = true;
      playerWon = true;
    }
    // enemyStrike stays null — nothing swings at the hero.
  } else if (playerGoesFirst) {
    // Player strikes first
    playerStrike = tryStrikeWithBarriers(player, enemy, playerTargetZone, playerWeaponCat, session.barriers);
    enemy = applyStrike(enemy, playerStrike);
    player = applyWeaponDrop(player, playerStrike);

    if (enemy.hp <= 0) {
      combatOver = true;
      playerWon = true;
    } else if (enemyIsFeared) {
      enemyStrike = skipStrike(enemyTargetZone, enemy.name);
    } else {
      // Enemy strikes back
      enemyStrike = tryStrikeWithBarriers(enemy, player, enemyTargetZone, enemyWeaponCat, session.barriers);
      player = applyStrike(player, enemyStrike);
      enemy = applyWeaponDrop(enemy, enemyStrike);
      if (enemyStrike.reflectedDamage > 0) {
        enemy = { ...enemy, hp: Math.max(0, enemy.hp - enemyStrike.reflectedDamage) };
      }
      if (player.hp <= 0) {
        combatOver = true;
        playerDied = true;
      }
    }
  } else if (enemyIsFeared) {
    // Enemy was meant to strike first but is feared/paralyzed — skip directly to player.
    enemyStrike = skipStrike(enemyTargetZone, enemy.name);
    playerStrike = tryStrikeWithBarriers(player, enemy, playerTargetZone, playerWeaponCat, session.barriers);
    enemy = applyStrike(enemy, playerStrike);
    player = applyWeaponDrop(player, playerStrike);
    if (enemy.hp <= 0) {
      combatOver = true;
      playerWon = true;
    }
  } else {
    // Enemy strikes first
    enemyStrike = tryStrikeWithBarriers(enemy, player, enemyTargetZone, enemyWeaponCat, session.barriers);
    player = applyStrike(player, enemyStrike);
    enemy = applyWeaponDrop(enemy, enemyStrike);
    if (enemyStrike.reflectedDamage > 0) {
      enemy = { ...enemy, hp: Math.max(0, enemy.hp - enemyStrike.reflectedDamage) };
    }

    if (player.hp <= 0) {
      combatOver = true;
      playerDied = true;
    } else {
      // Player strikes back
      playerStrike = tryStrikeWithBarriers(player, enemy, playerTargetZone, playerWeaponCat, session.barriers);
      enemy = applyStrike(enemy, playerStrike);
      player = applyWeaponDrop(player, playerStrike);
      if (enemy.hp <= 0) {
        combatOver = true;
        playerWon = true;
      }
    }
  }

  return {
    playerStrike,
    enemyStrike,
    playerGoesFirst,
    initiativeNarrative,
    roundNumber,
    combatOver,
    playerWon,
    playerDied,
    updatedPlayer: player,
    updatedEnemy: enemy,
    statusTickNarrative,
    updatedBarriers,
  };
}

// ── Initialize Combat Session ───────────────────────────────

export function initCombatSession(
  state: WorldState,
  enemyNpcId: string
): ActiveCombatSession | null {
  const npcData = NPCS[enemyNpcId];
  if (!npcData) return null;

  const npcState = state.npcs[enemyNpcId];
  const currentHp = npcState?.combatHp ?? npcData.stats.hp;

  const playerCombatant = buildCombatantFromPlayer(state);
  const enemyCombatant = buildCombatantFromNPC(enemyNpcId, npcData, currentHp);
  const multi = makeMultiCombatantFields(playerCombatant, enemyCombatant);

  return {
    enemyNpcId,
    enemyName: npcData.name,
    roundNumber: 0,
    playerCombatant,
    enemyCombatant,
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
    ...multi,
  };
}

// ── Build Narrative from Round Result ───────────────────────

export function buildRoundNarrative(result: CombatRoundResult): string {
  const parts: string[] = [];
  const playerName = result.updatedPlayer.name;
  const enemyName = result.updatedEnemy.name;

  if (result.statusTickNarrative) {
    parts.push(result.statusTickNarrative);
  }

  // Initiative only for real fights (training dummies have no initiative line)
  if (result.initiativeNarrative) {
    parts.push(result.initiativeNarrative);
  }

  const playerWeaponName = ITEMS[result.updatedPlayer.weaponId]?.name ?? "weapon";
  const playerWeaponCat = getWeaponCategory(result.updatedPlayer.weaponId);
  const enemyWeaponCat: WeaponCategory = "slash";

  function strikeNarrative(strike: StrikeResolution, isPlayerAttacking: boolean): string {
    const attName = isPlayerAttacking ? playerName : enemyName;
    const defName = isPlayerAttacking ? enemyName : playerName;
    const defMaxHp = isPlayerAttacking ? result.updatedEnemy.maxHp : result.updatedPlayer.maxHp;
    const wCat = isPlayerAttacking ? playerWeaponCat : enemyWeaponCat;
    const wName = isPlayerAttacking ? playerWeaponName : "weapon";
    return buildZoneStrikeNarrative(strike, attName, defName, wName, wCat, defMaxHp, isPlayerAttacking);
  }

  if (result.playerGoesFirst) {
    if (result.playerStrike) parts.push(strikeNarrative(result.playerStrike, true));
    if (result.enemyStrike) parts.push(strikeNarrative(result.enemyStrike, false));
  } else {
    if (result.enemyStrike) parts.push(strikeNarrative(result.enemyStrike, false));
    if (result.playerStrike) parts.push(strikeNarrative(result.playerStrike, true));
  }

  if (result.combatOver) {
    if (result.playerWon) {
      // Death narration is added in gameEngine.ts after buildRoundNarrative,
      // using the full getEnemyDeathPool. Keep a brief placeholder here so the
      // narrative doesn't end abruptly on the last strike line.
      parts.push("");
    } else if (result.playerDied) {
      parts.push("Everything goes dark.");
    }
  }
  // HP line removed — HP bars in the UI already show it.

  return parts.filter(Boolean).join("\n");
}

// ════════════════════════════════════════════════════════════
// COMBAT SPELLS
// ════════════════════════════════════════════════════════════
// Casting a spell consumes the player's action this round. After the spell
// resolves, the enemy gets their strike (and status ticks fire normally),
// just as if the player had used STRIKE. Mana is debited up-front and is
// NEVER refunded on a fizzled spell — that is the gamble.
//
// Out-of-combat CAST still routes through Jane (gameEngine.ts).
// ════════════════════════════════════════════════════════════

// Sprint C3: spell metadata moved to lib/combat/spellData.ts. This
// module re-exports the public API for back-compat with code that
// imports `isCombatSpell` / `getSpellManaCost` directly from the engine.
// New code should import from `./spellData` instead.
export { isCombatSpell, getSpellManaCost, getSpellCastSpeed, getSpellCastTurns, getSpellData, isOffensiveSpell } from "./spellData";
import { getSpellData as _getSpellData, isOffensiveSpell as _isOffensiveSpell } from "./spellData";

/** Result of resolving a single combat spell action (mirror of round result). */
export interface CombatSpellResult {
  /** Player-facing narration. Includes outcome name on the first line. */
  narration: string;
  /** Updated WorldState (player.activeCombat, currentMana, hp, virtues). */
  newState: WorldState;
  /** True iff the spell ended the fight (enemy died or player died). */
  combatOver: boolean;
  playerWon: boolean;
  playerDied: boolean;
}

interface SpellContext {
  state: WorldState;
  session: ActiveCombatSession;
  caster: CombatantState; // mutable working copy
  enemy: CombatantState;  // mutable working copy
  cost: number;
  /** Lines accumulated by the spell logic; combined into final narration. */
  log: string[];
}

// POWER spell + outcome table removed 2026-05-09. Replace below if a
// boon system is reintroduced; until then, the spell is unregistered.

// ── Helpers shared by spell paths ──

function addStatusEffect(c: CombatantState, effect: ActiveStatusEffect): CombatantState {
  return { ...c, activeEffects: [...c.activeEffects, effect] };
}

/** Tiny inline Standing-update — keeps the spell engine free of a gameState
 *  import cycle. Mirrors the canonical `bumpStanding` shape with 0..100 clamping.
 *  (Replaced `updateVirtueLite` 2026-04-29 per Honor → Standing deprecation.) */
function bumpStandingLite(state: WorldState, delta: number): WorldState {
  const current = state.player.picssi.standing;
  const next = Math.max(0, Math.min(100, current + delta));
  if (next === current) return state;
  return {
    ...state,
    player: {
      ...state.player,
      picssi: {
        ...state.player.picssi,
        standing: next,
      },
    },
  };
}

// ── Main entry point ──

export function resolveCombatSpell(
  state: WorldState,
  spellName: string,
): CombatSpellResult | null {
  const session = state.player.activeCombat;
  if (!session) return null;

  const upper = spellName.toUpperCase();
  const meta = _getSpellData(upper);
  if (!meta) return null;

  const cost = meta.manaCost;
  const currentMana = state.player.currentMana ?? 0;

  // ── Mana check ──
  if (currentMana < cost) {
    return {
      narration: `Not enough mana to cast ${upper}. (Need ${cost}, have ${currentMana}.)`,
      newState: state,
      combatOver: false,
      playerWon: false,
      playerDied: false,
    };
  }

  // ── Tongue-tied check (POWER side effect) ──
  const isTongueTied = session.playerCombatant.activeEffects.some(e => e.type === "tongue_tied");
  if (isTongueTied) {
    // Mana still burns — the words tried, the spell didn't.
    let workingState: WorldState = {
      ...state,
      player: { ...state.player, currentMana: currentMana - cost },
    };
    const sessionAfter = runEnemyTurn(workingState, session, false);
    workingState = {
      ...workingState,
      player: { ...workingState.player, activeCombat: sessionAfter.session },
    };
    return {
      narration:
        `▸ Spell fizzled · Tongue-Tied\nThe Words of Power scramble on your tongue. ` +
        `${upper} dies in your throat. (−${cost} mana)\n\n${sessionAfter.narrative}`,
      newState: workingState,
      combatOver: sessionAfter.combatOver,
      playerWon: sessionAfter.playerWon,
      playerDied: sessionAfter.playerDied,
    };
  }

  // ── Build mutable spell context ──
  const ctx: SpellContext = {
    state: {
      ...state,
      player: { ...state.player, currentMana: currentMana - cost },
    },
    session,
    caster: { ...session.playerCombatant },
    enemy: { ...session.enemyCombatant },
    cost,
    log: [],
  };

  let outcomeLabel = upper;

  // ── Per-spell logic ──
  switch (upper) {
    case "HEAL": {
      // Spirituality scales the heal per KARMA_SYSTEM.md §2.1:
      // +0.5% per Spirituality point. Saint at Spirit 100 → 1.5× base.
      const baseHeal = randInt(18, 32);
      const spiritMult = 1 + 0.005 * state.player.picssi.spirituality;
      const heal = Math.round(baseHeal * spiritMult);
      const before = ctx.caster.hp;
      ctx.caster = { ...ctx.caster, hp: Math.min(ctx.caster.maxHp, ctx.caster.hp + heal) };
      const gained = ctx.caster.hp - before;
      // KARMA Sprint 3: HEAL also cures VD. The light burns the disease out.
      const wasVd = ctx.state.player.vdActive;
      if (wasVd) {
        ctx.state = {
          ...ctx.state,
          player: { ...ctx.state.player, vdActive: false },
        };
      }
      outcomeLabel = "Heal";
      ctx.log.push(
        `A warmth spreads through your wounds. The flesh remembers what it was. (+${gained} HP)` +
          (wasVd ? "\nThe disease in you burns away with the light." : "")
      );
      break;
    }
    case "BLAST": {
      const dmg = randInt(2, 16) + 4; // 2d8+4 approx (inclusive uniform)
      // Route through resolveStrike so armor/evasion still apply, but force
      // the damage to our rolled value by short-circuiting weapon dice.
      // Simpler: apply directly. Lightning ignores shield/armor.
      const before = ctx.enemy.hp;
      ctx.enemy = { ...ctx.enemy, hp: Math.max(0, ctx.enemy.hp - dmg) };
      const dealt = before - ctx.enemy.hp;
      outcomeLabel = "Blast";
      ctx.log.push(
        `A short, ugly spear of stormlight leaps from your open hand and strikes ${ctx.enemy.name}. ` +
        `(${dealt} lightning damage)`
      );
      break;
    }
    case "SPEED": {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "haste", zone: "torso", severity: 1, turnsRemaining: 3,
      });
      outcomeLabel = "Speed";
      ctx.log.push("The body remembers wings it never had. (+10 dexterity for 3 rounds.)");
      break;
    }
    // ── Zim's advanced guild spells ──

    case "GREATER-HEAL": {
      const baseHeal = randInt(30, 55);
      const spiritMult = 1 + 0.005 * ctx.state.player.picssi.spirituality;
      const heal = Math.round(baseHeal * spiritMult);
      const before = ctx.caster.hp;
      ctx.caster = { ...ctx.caster, hp: Math.min(ctx.caster.maxHp, ctx.caster.hp + heal) };
      const gained = ctx.caster.hp - before;
      const wasVd = ctx.state.player.vdActive;
      const wasPoison = ctx.caster.activeEffects.some(e => e.type === "poison");
      if (wasVd) ctx.state = { ...ctx.state, player: { ...ctx.state.player, vdActive: false } };
      if (wasPoison) ctx.caster = { ...ctx.caster, activeEffects: ctx.caster.activeEffects.filter(e => e.type !== "poison") };
      outcomeLabel = "Greater Heal";
      ctx.log.push(
        `Light pours through you like water through a crack. The worst of it closes. (+${gained} HP)` +
        (wasVd || wasPoison ? "\nThe corruption burns away with the light." : "")
      );
      break;
    }

    case "FIREBOLT": {
      const dmg = randInt(10, 24);
      ctx.enemy = { ...ctx.enemy, hp: Math.max(0, ctx.enemy.hp - dmg) };
      outcomeLabel = "Firebolt";
      ctx.log.push(`A bolt of orange fire leaps from your outstretched hand and strikes ${ctx.enemy.name}. (${dmg} fire damage)`);
      break;
    }

    case "HASTE": {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "haste", zone: "torso", severity: 1, turnsRemaining: 4,
      });
      outcomeLabel = "Haste";
      ctx.log.push("The world slows around you. Your hands move before your mind commands them. (+10 dexterity for 4 rounds)");
      break;
    }

    case "WARD": {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "shield_aura", zone: "torso", severity: 1, turnsRemaining: 3,
      });
      outcomeLabel = "Ward";
      ctx.log.push("A faint shimmer settles over you — blows that should land seem to find air instead. (+20 cover for 3 rounds)");
      break;
    }

    case "STEELSKIN": {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "protection_aura", zone: "torso", severity: 1, turnsRemaining: 3,
      });
      outcomeLabel = "Steelskin";
      ctx.log.push("Your skin hardens. You can feel it — a density that was not there before. (−25% damage taken for 3 rounds)");
      break;
    }

    case "SILENCE": {
      ctx.enemy = addStatusEffect(ctx.enemy, {
        type: "feared_skip", zone: "torso", severity: 1, turnsRemaining: 1,
      });
      outcomeLabel = "Silence";
      ctx.log.push(`${ctx.enemy.name} seizes up, unable to act. The silence is total. (enemy loses next action)`);
      break;
    }

    case "RESIST": {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "protection_aura", zone: "torso", severity: 2, turnsRemaining: 2,
      });
      outcomeLabel = "Resist";
      ctx.log.push("You feel the world's edge, blunted. For now, it cannot cut as deep. (−50% damage taken for 2 rounds)");
      break;
    }


    case "CLEANSE": {
      const hadPoison = ctx.caster.activeEffects.some(e => e.type === "poison");
      const hadBleed = ctx.caster.activeEffects.some(e => e.type === "bleed");
      ctx.caster = {
        ...ctx.caster,
        activeEffects: ctx.caster.activeEffects.filter(e => e.type !== "poison" && e.type !== "bleed"),
      };
      outcomeLabel = "Cleanse";
      if (hadPoison || hadBleed) {
        ctx.log.push(
          "The taint leaves your blood" +
          (hadPoison && hadBleed ? " — the poison and the bleed both wash clear." : hadPoison ? " — the poison washes clear." : " — the bleeding staunches.")
        );
      } else {
        ctx.log.push("You are already clean. The spell finds nothing to cure.");
      }
      break;
    }
  }

  // ── Resolve enemy turn (status ticks + enemy strike) ──
  // Persist the spell's caster/enemy mutations into the session before the
  // enemy turn runs, so feared_skip / shield_aura / invisible all apply.
  const updatedSession: ActiveCombatSession = {
    ...ctx.session,
    playerCombatant: ctx.caster,
    enemyCombatant: ctx.enemy,
    roundNumber: ctx.session.roundNumber + 1,
  };

  // Check if spell already finished combat (Blast / Bonus Strike kills)
  if (ctx.enemy.hp <= 0) {
    const finishedSession: ActiveCombatSession = {
      ...updatedSession,
      finished: true,
      playerWon: true,
      combatLog: [...updatedSession.combatLog, ctx.log.join("\n")].slice(-20),
    };
    return {
      narration: (() => {
        const npcDef = NPCS[ctx.session.enemyNpcId];
        const pool = getEnemyDeathPool(npcDef?.bodyType);
        const deathLine = pool[Math.floor(Math.random() * pool.length)]!
          .replace(/\{enemy\}/g, ctx.enemy.name)
          .replace(/\{weapon\}/g, ITEMS[ctx.caster.weaponId]?.name ?? "weapon");
        return `▸ ${outcomeLabel}\n${ctx.log.join("\n")}\n\n${deathLine}`;
      })(),
      newState: {
        ...ctx.state,
        player: { ...ctx.state.player, activeCombat: finishedSession },
      },
      combatOver: true,
      playerWon: true,
      playerDied: false,
    };
  }
  if (ctx.caster.hp <= 0) {
    return {
      narration: `▸ ${outcomeLabel}\n${ctx.log.join("\n")}\n\nEverything goes dark.`,
      newState: {
        ...ctx.state,
        player: { ...ctx.state.player, activeCombat: { ...updatedSession, finished: true, playerWon: false } },
      },
      combatOver: true,
      playerWon: false,
      playerDied: true,
    };
  }

  // ── Enemy turn ──
  const enemyTurn = runEnemyTurn(ctx.state, updatedSession, true);
  const finalState: WorldState = {
    ...ctx.state,
    player: { ...ctx.state.player, activeCombat: enemyTurn.session },
  };

  return {
    narration: `▸ ${outcomeLabel}\n${ctx.log.join("\n")}${enemyTurn.narrative ? `\n\n${enemyTurn.narrative}` : ""}`,
    newState: finalState,
    combatOver: enemyTurn.combatOver,
    playerWon: enemyTurn.playerWon,
    playerDied: enemyTurn.playerDied,
  };
}

// ── Enemy-only turn runner ──
// Used by spell resolution: after a spell resolves, the enemy still gets
// their swing (and status ticks fire). Reuses the same primitives as
// resolveCombatRound so behavior matches strikes.

function runEnemyTurn(
  state: WorldState,
  session: ActiveCombatSession,
  /** When false, the player half of status-tick narration is suppressed
   *  (used by tongue_tied where the spell never resolved). */
  alreadyTickedPlayer: boolean,
): {
  session: ActiveCombatSession;
  narrative: string;
  combatOver: boolean;
  playerWon: boolean;
  playerDied: boolean;
} {
  let player = { ...session.playerCombatant };
  let enemy = { ...session.enemyCombatant };

  // Status ticks (bleed / poison / temp-effect expiry).
  // We've already mutated player from the spell, so tick on that.
  const playerTick = tickStatusEffects(player);
  player = playerTick.updatedCombatant;
  const enemyTick = tickStatusEffects(enemy);
  enemy = enemyTick.updatedCombatant;
  const tickNarrative = [
    alreadyTickedPlayer ? playerTick.narrative : "",
    enemyTick.narrative,
  ].filter(Boolean).join("\n");

  // Pre-work B: tick barriers once for this turn; reuse on every return.
  const tickedBarriers = tickBarriers(session).barriers;

  // Death from ticks
  if (player.hp <= 0) {
    return {
      session: { ...session, playerCombatant: player, enemyCombatant: enemy, barriers: tickedBarriers, finished: true, playerWon: false },
      narrative: tickNarrative + (tickNarrative ? "\n\n" : "") + "Everything goes dark.",
      combatOver: true, playerWon: false, playerDied: true,
    };
  }
  if (enemy.hp <= 0) {
    return {
      session: { ...session, playerCombatant: player, enemyCombatant: enemy, barriers: tickedBarriers, finished: true, playerWon: true },
      narrative: (() => {
        const npcDef = NPCS[session.enemyNpcId];
        const pool = getEnemyDeathPool(npcDef?.bodyType);
        const line = pool[Math.floor(Math.random() * pool.length)]!
          .replace(/\{enemy\}/g, enemy.name)
          .replace(/\{weapon\}/g, "wound");
        return tickNarrative + (tickNarrative ? "\n\n" : "") + line;
      })(),
      combatOver: true, playerWon: true, playerDied: false,
    };
  }

  // Training dummies don't strike.
  const isDummy = NPCS[session.enemyNpcId]?.isTrainingDummy === true;
  if (isDummy) {
    return {
      session: { ...session, playerCombatant: player, enemyCombatant: enemy, barriers: tickedBarriers },
      narrative: tickNarrative,
      combatOver: false, playerWon: false, playerDied: false,
    };
  }

  // Feared_skip / paralyzed: enemy cannot act this round.
  if (enemy.activeEffects.some(e => e.type === "feared_skip" || e.type === "paralyzed")) {
    return {
      session: { ...session, playerCombatant: player, enemyCombatant: enemy, barriers: tickedBarriers },
      narrative: tickNarrative + (tickNarrative ? "\n\n" : "") +
        `${enemy.name} cannot act — the sorcery holds them fast.`,
      combatOver: false, playerWon: false, playerDied: false,
    };
  }

  // Enemy strike (single round).
  const enemyTargetZone = chooseEnemyTargetZone(enemy, player);
  const enemyStrike = tryStrikeWithBarriers(enemy, player, enemyTargetZone, "slash", session.barriers);
  player = applyStrike(player, enemyStrike);
  // Reactive armor: reflected damage hits the enemy back.
  if (enemyStrike.reflectedDamage > 0) {
    enemy = { ...enemy, hp: Math.max(0, enemy.hp - enemyStrike.reflectedDamage) };
  }
  if (enemyStrike.weaponDropped && enemy.weaponId !== "unarmed") {
    enemy = { ...enemy, droppedWeaponId: enemy.weaponId, weaponId: "unarmed" };
  }

  const playerWeaponName = ITEMS[player.weaponId]?.name ?? "weapon";
  const strikeText = buildZoneStrikeNarrative(
    enemyStrike, enemy.name, player.name, playerWeaponName, "slash", player.maxHp, false,
  );

  const playerDied = player.hp <= 0;

  return {
    session: {
      ...session,
      playerCombatant: player,
      enemyCombatant: enemy,
      barriers: tickedBarriers,
      finished: playerDied,
      playerWon: playerDied ? false : null,
    },
    narrative: [tickNarrative, strikeText, playerDied ? "Everything goes dark." : ""]
      .filter(Boolean).join("\n\n"),
    combatOver: playerDied,
    playerWon: false,
    playerDied,
  };
}
