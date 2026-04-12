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
import { NPCS, ITEMS } from "./gameData";

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
  // Defender's effective agility drives evasion
  let base = defender.agility * 0.8;

  // Attacker's agility makes them harder to evade
  base -= attacker.agility * 0.4;

  // Injuries reduce evasion
  for (const e of defender.activeEffects) {
    if (e.type === "broken_leg") base -= 15 * e.severity;
    if (e.type === "concussion") base -= 5 * e.severity;
  }

  // Attacker injuries give defender bonus evasion
  for (const e of attacker.activeEffects) {
    if (e.type === "damaged_eye") base += 5 * e.severity;
  }

  return clamp(base, 0, 80); // Cap at 80% max evasion
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
    narrative: "",
  };

  // ── Roll 1: Evasion (+ zone accuracy penalty) ──
  const baseEvasion = calculateEvasionChance(defender, attacker);
  const evasionChance = clamp(baseEvasion + ZONE_EVASION_PENALTY[targetZone], 0, 95);
  if (Math.random() * 100 < evasionChance) {
    return {
      ...baseMiss,
      evaded: true,
      narrative: `${defender.name} dodges the strike aimed at their ${targetZone}.`,
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
  const zoneState = defender.zones[targetZone];
  if (zoneState.armor && zoneState.armor.durability > 0) {
    const stopChance = calculateArmorStopChance(zoneState.armor);
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
    activeEffects: [],
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
    weaponSkillValue: profile?.weaponSkill ?? 30,
    dexterity: 10,
    strength: 12,
    agility: profile?.agility ?? 20,
  };
}

// ── Full Round Resolution ───────────────────────────────────

export function resolveCombatRound(
  session: ActiveCombatSession,
  playerTargetZone: BodyZone
): CombatRoundResult {
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

  // 3. Initiative
  const playerSpeed = WEAPON_DATA[player.weaponId]?.weaponSpeed ?? 5;
  const playerInit = randInt(1, 10) + playerSpeed - getDexReactionBonus(player.dexterity);
  const enemyInit = randInt(1, 10) + 5;
  const playerGoesFirst = playerInit <= enemyInit;
  const initiativeNarrative = `⚡ Initiative — You: ${playerInit} · ${enemy.name}: ${enemyInit}\n${playerGoesFirst ? "You" : enemy.name} acts first.`;

  // 4. Resolve strikes
  const playerWeaponCat = getWeaponCategory(player.weaponId);
  const enemyWeaponCat: WeaponCategory = "slash"; // NPCs default to slash
  const enemyTargetZone = chooseEnemyTargetZone(enemy, player);

  let playerStrike: StrikeResolution | null = null;
  let enemyStrike: StrikeResolution | null = null;
  let combatOver = false;
  let playerWon = false;
  let playerDied = false;

  if (playerGoesFirst) {
    // Player strikes first
    playerStrike = resolveStrike(player, enemy, playerTargetZone, playerWeaponCat);
    enemy = applyStrike(enemy, playerStrike);

    if (enemy.hp <= 0) {
      combatOver = true;
      playerWon = true;
    } else {
      // Enemy strikes back
      enemyStrike = resolveStrike(enemy, player, enemyTargetZone, enemyWeaponCat);
      player = applyStrike(player, enemyStrike);
      if (player.hp <= 0) {
        combatOver = true;
        playerDied = true;
      }
    }
  } else {
    // Enemy strikes first
    enemyStrike = resolveStrike(enemy, player, enemyTargetZone, enemyWeaponCat);
    player = applyStrike(player, enemyStrike);

    if (player.hp <= 0) {
      combatOver = true;
      playerDied = true;
    } else {
      // Player strikes back
      playerStrike = resolveStrike(player, enemy, playerTargetZone, playerWeaponCat);
      enemy = applyStrike(enemy, playerStrike);
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

  parts.push(result.initiativeNarrative);

  // Build zone-aware narrative for each strike
  const playerWeaponName = ITEMS[result.updatedPlayer.weaponId]?.name ?? "weapon";
  const playerWeaponCat = getWeaponCategory(result.updatedPlayer.weaponId);
  const enemyWeaponCat: WeaponCategory = "slash"; // NPCs default to slash

  function strikeNarrative(strike: StrikeResolution, isPlayerAttacking: boolean): string {
    const attName = isPlayerAttacking ? playerName : enemyName;
    const defName = isPlayerAttacking ? enemyName : playerName;
    const defMaxHp = isPlayerAttacking ? result.updatedEnemy.maxHp : result.updatedPlayer.maxHp;
    const wCat = isPlayerAttacking ? playerWeaponCat : enemyWeaponCat;
    const wName = isPlayerAttacking ? playerWeaponName : "weapon";
    return buildZoneStrikeNarrative(strike, attName, defName, wName, wCat, defMaxHp, isPlayerAttacking);
  }

  if (result.playerGoesFirst) {
    if (result.playerStrike) parts.push("", strikeNarrative(result.playerStrike, true));
    if (result.enemyStrike) parts.push("", strikeNarrative(result.enemyStrike, false));
  } else {
    if (result.enemyStrike) parts.push("", strikeNarrative(result.enemyStrike, false));
    if (result.playerStrike) parts.push("", strikeNarrative(result.playerStrike, true));
  }

  if (result.combatOver) {
    if (result.playerWon) {
      parts.push("", `${enemyName} falls.`);
    } else if (result.playerDied) {
      parts.push("", "Everything goes dark.");
    }
  } else {
    // Show HP status
    parts.push(
      "",
      `You: ${result.updatedPlayer.hp}/${result.updatedPlayer.maxHp} HP · ${enemyName}: ${result.updatedEnemy.hp}/${result.updatedEnemy.maxHp} HP`
    );
  }

  return parts.join("\n");
}
