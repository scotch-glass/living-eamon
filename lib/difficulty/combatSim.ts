// ============================================================
// Pure-function combat resolution for the difficulty simulator
// (CF-1). Ported subset of lib/combat/engine.ts mechanics:
//   - Evasion: base = 0.8·DEX_def − 0.4·DEX_atk, clamp 0..95
//   - Strength damage modifier: 1 + clamp((STR−10)/40, −0.2, 0.3)
//   - Crit chance: 0.05 + 0.001·weaponSkill (skill = 0 baseline)
//   - Weapon stamina cost: short_sword 10, long_sword 13, etc.
//   - Fatigue tiers at −maxStamina × {1,2,3,4}, tier 4 blocks acting
//   - Per-zone damage: torso 1.0 (default in sim), head 1.5, neck 2.0
//
// The live engine keeps its own implementation (and richer effect
// model — bleed, debuffs, body-zone injuries, shield blocks, etc.).
// Here we keep just enough to predict module survivability within
// calibration tolerance. Deviations are documented inline.
//
// All randomness via the Rng abstraction so tests pin a seed.
// ============================================================

import {
  ENEMY_TIERS,
} from "./enemyTiers";
import { __internals__ as cap } from "./computeCapability";
import { getPattern } from "./encounterPatterns";
import type {
  EnemyTierId,
  EnemyTierTemplate,
  EncounterPatternId,
  HeroStats,
  PartySnapshot,
} from "./types";
import type { Rng } from "./rng";

// ── Combatant state (lighter than the live engine's CombatantState) ──

export type CombatantSide = "ally" | "enemy";

export interface SimCombatant {
  side: CombatantSide;
  /** Display label (used for failure-mode attribution). */
  label: string;
  hp: number;
  maxHp: number;
  armor: number;
  /** Effective DEX (post-PICSSI). */
  dex: number;
  /** Effective STR (post-PICSSI). */
  str: number;
  weaponDamageDice: string;
  weaponStaminaCost: number;
  stamina: number;
  maxStamina: number;
  fatiguePool: number;
  hasShield: boolean;
  knownSpells: string[];
  spirituality: number;
  mana: number;
  actionsPerRound: number;
  hasPhaseShift: boolean;
  /** Caches Tier-1 grunts grouping for AI policy purposes. */
  tier?: EnemyTierId;
}

// ── Combatant factories ───────────────────────────────────────

function heroToCombatant(h: HeroStats, label: string): SimCombatant {
  const str = cap.strEff(h);
  const dex = cap.dexEff(h);
  const maxHp = cap.maxHP(h);
  const maxStamina = cap.maxStamina(h);
  // Damage dice from weapon
  let dice = "1d4";
  let stamCost = 6;
  switch (h.weaponId) {
    case "great_sword":
      dice = "2d8+4";
      stamCost = 18;
      break;
    case "long_sword":
      dice = "1d12+4";
      stamCost = 13;
      break;
    case "short_sword":
      dice = "1d12+2";
      stamCost = 10;
      break;
  }
  return {
    side: "ally",
    label,
    hp: maxHp,
    maxHp,
    armor: h.armorTotal,
    dex,
    str,
    weaponDamageDice: dice,
    weaponStaminaCost: stamCost,
    stamina: maxStamina,
    maxStamina,
    fatiguePool: 0,
    hasShield: h.hasShield,
    knownSpells: h.knownSpells,
    spirituality: h.picssi.spirituality,
    mana: 10 + Math.floor(Math.abs(h.picssi.illumination) / 2),
    actionsPerRound: 1,
    hasPhaseShift: false,
  };
}

function tierToCombatant(
  t: EnemyTierTemplate,
  index: number,
): SimCombatant {
  return {
    side: "enemy",
    label: `${t.label} #${index}`,
    hp: t.hp,
    maxHp: t.hp,
    armor: t.armor,
    dex: 10, // synthetic; tier already encodes survivability via HP/armor
    str: 10,
    weaponDamageDice: t.weaponDamageDice,
    weaponStaminaCost: t.weaponStaminaCost,
    stamina: t.staminaMax,
    maxStamina: t.staminaMax,
    fatiguePool: 0,
    hasShield: false,
    knownSpells: t.knownSpells,
    spirituality: 0,
    mana: t.mana,
    actionsPerRound: t.actionsPerRound,
    hasPhaseShift: t.hasPhaseShift,
    tier: t.tier,
  };
}

export function buildParty(party: PartySnapshot): SimCombatant[] {
  const out: SimCombatant[] = [heroToCombatant(party.hero, "Hero")];
  for (let i = 0; i < party.henchmen.length; i++) {
    out.push(heroToCombatant(party.henchmen[i], `Henchman ${i + 1}`));
  }
  return out;
}

export function buildEnemies(patternId: EncounterPatternId): SimCombatant[] {
  const pattern = getPattern(patternId);
  const out: SimCombatant[] = [];
  let idx = 1;
  for (const part of pattern.composition) {
    const t = ENEMY_TIERS[part.tier];
    for (let i = 0; i < part.count; i++) {
      out.push(tierToCombatant(t, idx++));
    }
  }
  return out;
}

// ── Combat math (pure functions) ──────────────────────────────

function fatigueTier(c: SimCombatant): number {
  if (c.fatiguePool <= -c.maxStamina * 4) return 4;
  if (c.fatiguePool <= -c.maxStamina * 3) return 3;
  if (c.fatiguePool <= -c.maxStamina * 2) return 2;
  if (c.fatiguePool <= -c.maxStamina * 1) return 1;
  return 0;
}

export function evasionChance(defender: SimCombatant, attacker: SimCombatant): number {
  const tier = fatigueTier(defender);
  let base = 0.8 * defender.dex - 0.4 * attacker.dex;
  base -= tier * 15;
  return clamp(base, 0, 95);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function strMod(str: number): number {
  return 1 + clamp((str - 10) / 40, -0.2, 0.3);
}

function critChance(): number {
  return 0.05; // weaponSkill = 0 baseline; calibration will tune
}

/**
 * Resolve one swing. Returns the damage dealt (0 if missed / blocked /
 * fully absorbed), and applies stamina drain to the attacker.
 */
export function resolveSwing(
  attacker: SimCombatant,
  defender: SimCombatant,
  rng: Rng,
): number {
  // Stamina drain regardless of outcome
  attacker.stamina -= attacker.weaponStaminaCost;
  if (attacker.stamina < 0) {
    attacker.fatiguePool += attacker.stamina;
    attacker.stamina = 0;
  }

  // Tier 4 (exhausted) blocks the strike entirely
  if (fatigueTier(attacker) >= 4) return 0;

  // Evasion roll
  const evade = evasionChance(defender, attacker);
  if (rng.next() * 100 < evade) return 0;

  // Damage roll
  let dmg = rng.rollDice(attacker.weaponDamageDice);
  dmg = Math.floor(dmg * strMod(attacker.str));
  // Body zone — simplified to torso (×1.0) for the sim; real engine
  // distributes by AI policy. Calibration will check whether this
  // skews load estimates more than ±5%.
  if (rng.next() < critChance()) dmg *= 2;

  // Armor reduction — simplified to flat subtract (engine uses
  // per-zone stop chance). Equivalent in expectation when armor < 10.
  dmg = Math.max(1, dmg - defender.armor);

  return dmg;
}

export function applyDamage(c: SimCombatant, dmg: number): void {
  c.hp = Math.max(0, c.hp - dmg);
}

// ── Round-level helpers ───────────────────────────────────────

function aliveOf(side: CombatantSide) {
  return (c: SimCombatant) => c.side === side && c.hp > 0;
}

export interface RoundLog {
  damageDealtByAllies: number;
  damageTakenByAllies: number;
  staminaSpentByAllies: number;
  selfHealsByAllies: number;
}

/**
 * Resolve one full round of combat. Order:
 *   1. Initiative by DEX (higher acts first; stable on ties).
 *   2. Each combatant takes actionsPerRound actions.
 *   3. AI policy: enemies pick a random ally target; allies pick the
 *      lowest-HP enemy. HEAL fires if hp/maxHp < threshold.
 *
 * Returns aggregate metrics for the round (used by simulate.ts to
 * tally averages).
 */
export function resolveRound(party: SimCombatant[], enemies: SimCombatant[], rng: Rng): RoundLog {
  const all = [...party, ...enemies].filter((c) => c.hp > 0);
  // Initiative: higher dex first; ties broken randomly per round.
  // Random tie-break is important for anchor calibration — a
  // side-deterministic tiebreaker biases win rates by ~8% when
  // both sides have identical DEX.
  for (const c of all) {
    (c as SimCombatant & { __init?: number }).__init = c.dex * 100 + rng.int(0, 99);
  }
  all.sort((a, b) => {
    const ai = (a as SimCombatant & { __init?: number }).__init ?? a.dex * 100;
    const bi = (b as SimCombatant & { __init?: number }).__init ?? b.dex * 100;
    return bi - ai;
  });

  const log: RoundLog = {
    damageDealtByAllies: 0,
    damageTakenByAllies: 0,
    staminaSpentByAllies: 0,
    selfHealsByAllies: 0,
  };

  for (const actor of all) {
    if (actor.hp <= 0) continue;
    const actions = actor.actionsPerRound;

    for (let act = 0; act < actions; act++) {
      if (actor.hp <= 0) break;
      const enemySide: CombatantSide = actor.side === "ally" ? "enemy" : "ally";
      const targets = (actor.side === "ally" ? enemies : party).filter(aliveOf(enemySide));
      if (targets.length === 0) return log;

      // HEAL on self if low HP + has the spell + mana
      const wantsHeal =
        actor.knownSpells.includes("HEAL") &&
        actor.mana >= 4 &&
        actor.hp < actor.maxHp * 0.45;
      if (wantsHeal) {
        const baseHeal = rng.int(18, 32);
        const spiritMult = 1 + 0.005 * actor.spirituality;
        const heal = Math.round(baseHeal * spiritMult);
        actor.hp = Math.min(actor.maxHp, actor.hp + heal);
        actor.mana -= 4;
        if (actor.side === "ally") log.selfHealsByAllies += heal;
        continue;
      }

      // Default action: weapon swing
      const target = pickTarget(actor, targets, rng);
      const stamBefore = actor.stamina;
      const dmg = resolveSwing(actor, target, rng);
      applyDamage(target, dmg);

      if (actor.side === "ally") {
        log.damageDealtByAllies += dmg;
        log.staminaSpentByAllies += Math.max(0, stamBefore - actor.stamina);
      } else {
        log.damageTakenByAllies += dmg;
      }
    }
  }

  return log;
}

function pickTarget(
  attacker: SimCombatant,
  targets: SimCombatant[],
  rng: Rng,
): SimCombatant {
  if (attacker.side === "ally") {
    // Focus the lowest-HP enemy for fast kills (action-economy advantage)
    let best = targets[0];
    for (const t of targets) {
      if (t.hp < best.hp) best = t;
    }
    return best;
  }
  // Enemies pick randomly to mimic average-case spread
  return rng.pick(targets);
}

/**
 * Phase-shift: boss-tier enemies at <50% HP get a one-time +25% HP
 * refund and a +1 actionsPerRound burst for 2 rounds. We approximate
 * this by spreading the refund: each phase-shift adds 0.5 × maxHp to
 * effective combat duration. Implementation here triggers on detection.
 */
export function maybeTriggerPhaseShift(c: SimCombatant): boolean {
  if (!c.hasPhaseShift) return false;
  if (c.hp >= c.maxHp * 0.5) return false;
  // One-time check: clear the flag so it doesn't re-trigger
  c.hasPhaseShift = false;
  c.hp = Math.round(c.hp + c.maxHp * 0.25);
  c.actionsPerRound += 1;
  return true;
}

/**
 * Resolve a full combat encounter to completion. Returns:
 *   - winner: "ally" | "enemy"
 *   - rounds taken
 *   - hp lost by allies (summed)
 *   - stamina spent by allies (summed)
 */
export interface EncounterOutcome {
  winner: "ally" | "enemy";
  rounds: number;
  totalAllyHpLost: number;
  totalAllyStaminaSpent: number;
  totalAllyHealing: number;
}

export function resolveEncounter(
  party: SimCombatant[],
  enemies: SimCombatant[],
  rng: Rng,
  maxRounds = 50,
): EncounterOutcome {
  let rounds = 0;
  let hpLost = 0;
  let stamSpent = 0;
  let healing = 0;
  const initialHp = party.reduce((n, c) => n + c.hp, 0);

  while (rounds < maxRounds) {
    rounds += 1;
    const log = resolveRound(party, enemies, rng);
    hpLost += log.damageTakenByAllies;
    stamSpent += log.staminaSpentByAllies;
    healing += log.selfHealsByAllies;

    // Phase-shift check after each round
    for (const e of enemies) {
      if (e.hp > 0) maybeTriggerPhaseShift(e);
    }

    const partyAlive = party.some((c) => c.hp > 0);
    const enemiesAlive = enemies.some((c) => c.hp > 0);
    if (!partyAlive) {
      return {
        winner: "enemy",
        rounds,
        totalAllyHpLost: initialHp,
        totalAllyStaminaSpent: stamSpent,
        totalAllyHealing: healing,
      };
    }
    if (!enemiesAlive) {
      const finalHp = party.reduce((n, c) => n + c.hp, 0);
      return {
        winner: "ally",
        rounds,
        totalAllyHpLost: Math.max(0, initialHp - finalHp),
        totalAllyStaminaSpent: stamSpent,
        totalAllyHealing: healing,
      };
    }
  }

  // Timeout: treat as enemy win (party couldn't finish in time)
  return {
    winner: "enemy",
    rounds,
    totalAllyHpLost: initialHp,
    totalAllyStaminaSpent: stamSpent,
    totalAllyHealing: healing,
  };
}

/** Between-room REST: full stamina, fatigue pool halved toward zero. */
export function applyRest(party: SimCombatant[]): void {
  for (const c of party) {
    c.stamina = c.maxStamina;
    c.fatiguePool = Math.floor(c.fatiguePool / 2);
    // Mana ticks back partially
    c.mana = Math.min(30, c.mana + 4);
  }
}
