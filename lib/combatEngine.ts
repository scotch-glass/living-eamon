// ============================================================
// LIVING EAMON — HWRR-Style Combat Engine
// Pure functions. No side effects. No state mutation.
// Three-roll resolution: Evasion → Shield Block → Armor Pen.
// ============================================================

import type {
  BodyZone,
  CombatantState,
  StrikeResolution,
  CombatRoundResult,
  ActiveStatusEffect,
  StatusEffectType,
  ZoneArmor,
  BodyArmorMap,
  ActiveCombatSession,
  NPCCombatProfile,
} from "./combatTypes";
import {
  BODY_ZONES,
  ZONE_DAMAGE_MULTIPLIER,
  ZONE_EVASION_PENALTY,
  ZONE_INJURY_TABLE,
  createEmptyBodyArmorMap,
} from "./combatTypes";
import { rollWeaponDamage, getDexReactionBonus, getWeaponSkillKey, WEAPON_DATA } from "./uoData";
import { getWeaponCategory, type WeaponCategory, type WoundTier } from "./combatNarrationPools";
import { buildZoneStrikeNarrative } from "./combatZoneNarration";
import type { WorldState } from "./gameState";
import { NPCS, ITEMS, getEnemyDeathPool } from "./gameData";

// ── Helpers ─────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── Evasion (Roll 1) ────────────────────────────────────────
// Defender agility increases evasion (0.8x).
// Attacker agility reduces evasion (0.4x) — dexterous fighters hit more often.
// Both are already reduced by armor dex penalties via buildCombatantFrom*.

function calculateEvasionChance(
  defender: CombatantState,
  attacker: CombatantState
): number {
  // Invisible defenders auto-evade — short-circuit. Effect is consumed at the
  // end of the round by tickStatusEffects (turnsRemaining = 1).
  if (defender.activeEffects.some(e => e.type === "invisible")) {
    return 95;
  }

  // Defender's effective agility drives evasion
  let base = defender.agility * 0.8;

  // Attacker's agility makes them harder to evade
  base -= attacker.agility * 0.4;

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
    base.bleedPerTurn = injury.severity;
    base.turnsRemaining = randInt(2, 4) + injury.severity;
  }
  if (injury.type === "severed_artery") {
    base.bleedPerTurn = injury.severity * 2;
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
    injuryInflicted: null,
    injurySeverity: 0,
    isCritical: false,
    isCriticalFail: false,
    weaponDropped: false,
    narrative: "",
  };

  // ── Roll 1: Evasion (+ zone accuracy penalty) ──
  const baseEvasion = calculateEvasionChance(defender, attacker);
  const evasionChance = clamp(baseEvasion + ZONE_EVASION_PENALTY[targetZone], 0, 95);
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
  const finalDmg = Math.max(1, Math.floor(baseDmg * strengthMod * zoneMult * (isCrit ? 2 : 1)));

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

  const critTag = isCrit ? "CRITICAL! " : "";
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
    injuryInflicted,
    injurySeverity,
    isCritical: isCrit,
    isCriticalFail: false,
    weaponDropped: false,
    narrative,
  };
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

  // Apply injury
  if (strike.injuryInflicted) {
    const effect = buildStatusEffect(
      { type: strike.injuryInflicted, severity: strike.injurySeverity },
      strike.targetZone
    );
    updated = {
      ...updated,
      activeEffects: [...updated.activeEffects, effect],
    };
  }

  // Accumulate wound level on zone
  if (strike.damageDealt > 0) {
    const zone = strike.targetZone;
    const zoneState = { ...updated.zones[zone] };
    zoneState.woundLevel += strike.damageDealt;
    updated.zones[zone] = zoneState;
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
    if (effect.bleedPerTurn) {
      totalDamage += effect.bleedPerTurn;
      parts.push(
        `Blood seeps from the ${effect.zone} wound. (${effect.bleedPerTurn} bleed damage)`
      );
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
    dexterity: p.dexterity,
    strength: p.strength,
    agility: effectiveAgility, // Dexterity minus cumulative armor penalties
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

export function buildCombatantFromNPC(
  npcId: string,
  npcData: { name: string; stats: { hp: number; armor: number; damage: string }; combatProfile?: NPCCombatProfile },
  currentHp: number
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
    weaponId: "unarmed", // NPC weapon is abstracted via damage dice
    droppedWeaponId: null,
    weaponSkillValue: profile?.weaponSkill ?? 30,
    dexterity: 10,
    strength: 12,
    agility: profile?.agility ?? 20,
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
    };
  }

  // 2b. Auto-retrieve dropped weapons from last round
  if (player.droppedWeaponId) {
    player = { ...player, weaponId: player.droppedWeaponId, droppedWeaponId: null };
  }
  if (enemy.droppedWeaponId) {
    enemy = { ...enemy, weaponId: enemy.droppedWeaponId, droppedWeaponId: null };
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
    injuryInflicted: null,
    injurySeverity: 0,
    isCritical: false,
    isCriticalFail: false,
    weaponDropped: false,
    narrative: `${attackerName} hesitates — something behind them caught their eye — and the moment is lost.`,
  });
  const enemyIsFeared = enemy.activeEffects.some(e => e.type === "feared_skip");

  // Training dummies never strike back — they are inanimate wooden posts.
  // The player always acts "first" since there's nothing to contest initiative.
  if (enemyIsTrainingDummy) {
    playerStrike = resolveStrike(player, enemy, playerTargetZone, playerWeaponCat);
    enemy = applyStrike(enemy, playerStrike);
    player = applyWeaponDrop(player, playerStrike);
    if (enemy.hp <= 0) {
      combatOver = true;
      playerWon = true;
    }
    // enemyStrike stays null — nothing swings at the hero.
  } else if (playerGoesFirst) {
    // Player strikes first
    playerStrike = resolveStrike(player, enemy, playerTargetZone, playerWeaponCat);
    enemy = applyStrike(enemy, playerStrike);
    player = applyWeaponDrop(player, playerStrike);

    if (enemy.hp <= 0) {
      combatOver = true;
      playerWon = true;
    } else if (enemyIsFeared) {
      enemyStrike = skipStrike(enemyTargetZone, enemy.name);
    } else {
      // Enemy strikes back
      enemyStrike = resolveStrike(enemy, player, enemyTargetZone, enemyWeaponCat);
      player = applyStrike(player, enemyStrike);
      enemy = applyWeaponDrop(enemy, enemyStrike);
      if (player.hp <= 0) {
        combatOver = true;
        playerDied = true;
      }
    }
  } else if (enemyIsFeared) {
    // Enemy was meant to strike first but is feared — skip directly to player.
    enemyStrike = skipStrike(enemyTargetZone, enemy.name);
    playerStrike = resolveStrike(player, enemy, playerTargetZone, playerWeaponCat);
    enemy = applyStrike(enemy, playerStrike);
    player = applyWeaponDrop(player, playerStrike);
    if (enemy.hp <= 0) {
      combatOver = true;
      playerWon = true;
    }
  } else {
    // Enemy strikes first
    enemyStrike = resolveStrike(enemy, player, enemyTargetZone, enemyWeaponCat);
    player = applyStrike(player, enemyStrike);
    enemy = applyWeaponDrop(enemy, enemyStrike);

    if (player.hp <= 0) {
      combatOver = true;
      playerDied = true;
    } else {
      // Player strikes back
      playerStrike = resolveStrike(player, enemy, playerTargetZone, playerWeaponCat);
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

  return {
    enemyNpcId,
    enemyName: npcData.name,
    roundNumber: 0,
    playerCombatant: buildCombatantFromPlayer(state),
    enemyCombatant: buildCombatantFromNPC(enemyNpcId, npcData, currentHp),
    combatLog: [],
    finished: false,
    playerWon: null,
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

const SPELL_MANA_COST: Record<string, number> = {
  HEAL: 4,
  BLAST: 6,
  SPEED: 3,
  POWER: 5,
};

const SUPPORTED_COMBAT_SPELLS = new Set(Object.keys(SPELL_MANA_COST));

export function isCombatSpell(spellName: string): boolean {
  return SUPPORTED_COMBAT_SPELLS.has(spellName.toUpperCase());
}

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

// ── POWER outcome table ──
// Weights sum to 100 (read as %). 80% positive, 4% neutral, 16% bad.
// Each `apply` mutates ctx in place and pushes narration lines.

interface PowerOutcome {
  weight: number;
  name: string;
  tier: "good" | "neutral" | "bad";
  apply: (ctx: SpellContext) => void;
}

const POWER_OUTCOMES: PowerOutcome[] = [
  // ── Good (80%) ──
  {
    weight: 16, name: "Bonus Strike", tier: "good",
    apply: ctx => {
      const cat = getWeaponCategory(ctx.caster.weaponId);
      const strike = resolveStrike(ctx.caster, ctx.enemy, "torso", cat);
      ctx.enemy = applyStrike(ctx.enemy, strike);
      ctx.log.push("An unseen hand guides your blade — you strike again before the spell even fades.");
      ctx.log.push(strike.narrative);
    },
  },
  {
    weight: 16, name: "Mana Surge", tier: "good",
    apply: ctx => {
      const refund = 10;
      const newMana = Math.min(ctx.state.player.maxMana, ctx.state.player.currentMana + refund);
      const gained = newMana - ctx.state.player.currentMana;
      ctx.state = { ...ctx.state, player: { ...ctx.state.player, currentMana: newMana } };
      ctx.log.push(`The current returns to you, doubled. (+${gained} mana)`);
    },
  },
  {
    weight: 16, name: "Lesser Healing", tier: "good",
    apply: ctx => {
      const heal = randInt(6, 10);
      ctx.caster = { ...ctx.caster, hp: Math.min(ctx.caster.maxHp, ctx.caster.hp + heal) };
      ctx.log.push(`A small warmth, gratefully received. (+${heal} HP)`);
    },
  },
  {
    weight: 10, name: "Quickening", tier: "good",
    apply: ctx => {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "haste", zone: "torso", severity: 1, turnsRemaining: 2,
      });
      ctx.log.push("Your feet remember wings. (+10 agility for 2 rounds)");
    },
  },
  {
    weight: 10, name: "Silver Aura", tier: "good",
    apply: ctx => {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "shield_aura", zone: "torso", severity: 1, turnsRemaining: 2,
      });
      ctx.log.push("A faint silver glow settles on your skin. (+20 cover for 2 rounds)");
    },
  },
  {
    weight: 6, name: "Untouchable", tier: "good",
    apply: ctx => {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "invisible", zone: "torso", severity: 1, turnsRemaining: 1,
      });
      ctx.log.push("You are not where they look. The next blow will find no one.");
    },
  },
  {
    weight: 6, name: "Dread", tier: "good",
    apply: ctx => {
      ctx.enemy = addStatusEffect(ctx.enemy, {
        type: "feared_skip", zone: "torso", severity: 1, turnsRemaining: 1,
      });
      ctx.log.push(`Something behind ${ctx.enemy.name} screams. They will not strike this round.`);
    },
  },

  // ── Bad (16%) — imaginative ──
  {
    weight: 3, name: "An Unwanted Vision", tier: "bad",
    apply: ctx => {
      // Shows the enemy as a child. -1 Honor — empathy is heavy.
      ctx.state = updateVirtueLite(ctx.state, "Honor", -1);
      ctx.log.push(
        "You see your foe as they were as a child — small, frightened of nothing in particular. " +
        "Your hands shake. (−1 Honor)"
      );
    },
  },
  {
    weight: 3, name: "Hiccups", tier: "bad",
    apply: ctx => {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "hiccups", zone: "torso", severity: 1, turnsRemaining: 2,
      });
      ctx.log.push(
        "*hic* Something in the spell catches in your throat. *hic* You cannot stop. " +
        "(−3 agility for 2 rounds. *hic*)"
      );
    },
  },
  {
    weight: 2, name: "Glimpse the Void", tier: "bad",
    apply: ctx => {
      const dmg = 5;
      ctx.caster = { ...ctx.caster, hp: Math.max(0, ctx.caster.hp - dmg) };
      ctx.log.push(
        `For a heartbeat you see what is on the other side of everything, and it sees you back. ` +
        `(${dmg} psychic damage)`
      );
    },
  },
  {
    weight: 2, name: "Tongue-Tied", tier: "bad",
    apply: ctx => {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "tongue_tied", zone: "torso", severity: 1, turnsRemaining: 2,
      });
      ctx.log.push(
        "The Words of Power scramble on your tongue. (No CAST will work for 2 rounds.)"
      );
    },
  },
  {
    weight: 2, name: "Numb Hand", tier: "bad",
    apply: ctx => {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "numb_hand", zone: "limbs", severity: 1, turnsRemaining: 1,
      });
      ctx.log.push(
        "Your weapon hand goes numb to the elbow. (Next strike will miss.)"
      );
    },
  },
  {
    weight: 2, name: "Smelled by Set", tier: "bad",
    apply: ctx => {
      ctx.caster = addStatusEffect(ctx.caster, {
        type: "marked_by_set", zone: "torso", severity: 1, turnsRemaining: 1,
      });
      ctx.log.push(
        "A coiled serpent in your peripheral vision. Something tasted you on the air. " +
        `(${ctx.enemy.name} sees you clearly — next blow at +15 to hit.)`
      );
    },
  },
  {
    weight: 2, name: "Phantom Pain", tier: "bad",
    apply: ctx => {
      const dmg = randInt(1, 6);
      ctx.caster = { ...ctx.caster, hp: Math.max(0, ctx.caster.hp - dmg) };
      ctx.log.push(
        `An old wound you do not remember reopens, then closes. (${dmg} HP, no source you can name.)`
      );
    },
  },

  // ── Neutral (4%) ──
  {
    weight: 4, name: "Nothing", tier: "neutral",
    apply: ctx => {
      ctx.log.push(
        "Nothing answers. The mana drains from you and goes nowhere. The gamble lost."
      );
    },
  },
];

const POWER_TOTAL_WEIGHT = POWER_OUTCOMES.reduce((acc, o) => acc + o.weight, 0);

function rollPowerOutcome(): PowerOutcome {
  let roll = Math.random() * POWER_TOTAL_WEIGHT;
  for (const o of POWER_OUTCOMES) {
    roll -= o.weight;
    if (roll <= 0) return o;
  }
  return POWER_OUTCOMES[POWER_OUTCOMES.length - 1]!;
}

// ── Helpers shared by spell paths ──

function addStatusEffect(c: CombatantState, effect: ActiveStatusEffect): CombatantState {
  return { ...c, activeEffects: [...c.activeEffects, effect] };
}

/** Tiny inline virtue-update — keeps the spell engine free of a gameState
 *  import cycle. Mirrors the canonical `updateVirtue` shape. */
function updateVirtueLite(state: WorldState, virtue: string, delta: number): WorldState {
  const current = (state.player.virtues as Record<string, number>)[virtue] ?? 0;
  return {
    ...state,
    player: {
      ...state.player,
      virtues: {
        ...state.player.virtues,
        [virtue]: current + delta,
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
  if (!SUPPORTED_COMBAT_SPELLS.has(upper)) return null;

  const cost = SPELL_MANA_COST[upper]!;
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
      const heal = randInt(18, 32);
      const before = ctx.caster.hp;
      ctx.caster = { ...ctx.caster, hp: Math.min(ctx.caster.maxHp, ctx.caster.hp + heal) };
      const gained = ctx.caster.hp - before;
      outcomeLabel = "Heal";
      ctx.log.push(`A warmth spreads through your wounds. The flesh remembers what it was. (+${gained} HP)`);
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
      ctx.log.push("The body remembers wings it never had. (+10 agility for 3 rounds.)");
      break;
    }
    case "POWER": {
      const outcome = rollPowerOutcome();
      outcomeLabel = `Power · ${outcome.name}`;
      outcome.apply(ctx);
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

  // Death from ticks
  if (player.hp <= 0) {
    return {
      session: { ...session, playerCombatant: player, enemyCombatant: enemy, finished: true, playerWon: false },
      narrative: tickNarrative + (tickNarrative ? "\n\n" : "") + "Everything goes dark.",
      combatOver: true, playerWon: false, playerDied: true,
    };
  }
  if (enemy.hp <= 0) {
    return {
      session: { ...session, playerCombatant: player, enemyCombatant: enemy, finished: true, playerWon: true },
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
      session: { ...session, playerCombatant: player, enemyCombatant: enemy },
      narrative: tickNarrative,
      combatOver: false, playerWon: false, playerDied: false,
    };
  }

  // Feared_skip: enemy hesitates instead of striking.
  if (enemy.activeEffects.some(e => e.type === "feared_skip")) {
    return {
      session: { ...session, playerCombatant: player, enemyCombatant: enemy },
      narrative: tickNarrative + (tickNarrative ? "\n\n" : "") +
        `${enemy.name} hesitates — something behind them caught their eye — and the moment is lost.`,
      combatOver: false, playerWon: false, playerDied: false,
    };
  }

  // Enemy strike (single round).
  const enemyTargetZone = chooseEnemyTargetZone(enemy, player);
  const enemyStrike = resolveStrike(enemy, player, enemyTargetZone, "slash");
  player = applyStrike(player, enemyStrike);
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
