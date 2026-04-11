// ============================================================
// LIVING EAMON — Combat System Types
// HWRR-style body-part targeting with 3-roll resolution.
// All combat-specific types live here to keep gameState and
// gameData clean.
// ============================================================

// ── Body Zones ──────────────────────────────────────────────

export type BodyZone = "head" | "neck" | "torso" | "limbs";

export const BODY_ZONES: BodyZone[] = ["head", "neck", "torso", "limbs"];

/** Damage multiplier per zone. Neck is lethal, limbs are safer. */
export const ZONE_DAMAGE_MULTIPLIER: Record<BodyZone, number> = {
  head: 1.5,
  neck: 2.0,
  torso: 1.0,
  limbs: 0.8,
};

// ── Status Effects ──────────────────────────────────────────

export type StatusEffectType =
  | "bleed"             // Ongoing HP loss per round
  | "concussion"        // Head — reduced hit chance
  | "damaged_eye"       // Head — significant accuracy penalty
  | "severed_artery"    // Neck — heavy bleed
  | "crushed_windpipe"  // Neck — potentially fatal
  | "pierced_lung"      // Torso — reduced effectiveness
  | "cracked_ribs"      // Torso — pain on exertion
  | "broken_arm"        // Limbs — weapon skill penalty
  | "broken_leg";       // Limbs — cannot flee

export interface ActiveStatusEffect {
  type: StatusEffectType;
  zone: BodyZone;
  severity: number;         // 1-3, affects magnitude
  turnsRemaining: number;   // -1 = until healed
  bleedPerTurn?: number;    // For bleed-type effects
}

/** Which injuries can occur per zone. */
export const ZONE_INJURY_TABLE: Record<BodyZone, StatusEffectType[]> = {
  head: ["concussion", "damaged_eye", "bleed"],
  neck: ["severed_artery", "crushed_windpipe", "bleed"],
  torso: ["pierced_lung", "cracked_ribs", "bleed"],
  limbs: ["broken_arm", "broken_leg", "bleed"],
};

// ── Per-Zone Armor ──────────────────────────────────────────

export interface ZoneArmor {
  itemId: string;
  cover: number;            // 0-100, % chance to block the hit
  durability: number;       // Current durability
  maxDurability: number;    // Starting durability
}

export interface ZoneState {
  armor: ZoneArmor | null;
  woundLevel: number;       // 0 = uninjured, accumulates
}

export type BodyArmorMap = Record<BodyZone, ZoneState>;

export function createEmptyBodyArmorMap(): BodyArmorMap {
  return {
    head: { armor: null, woundLevel: 0 },
    neck: { armor: null, woundLevel: 0 },
    torso: { armor: null, woundLevel: 0 },
    limbs: { armor: null, woundLevel: 0 },
  };
}

// ── Combatant (unified player / NPC in combat) ──────────────

export interface CombatantState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  zones: BodyArmorMap;
  activeEffects: ActiveStatusEffect[];
  // Shield
  shieldItemId: string | null;
  shieldBlockChance: number;    // 0-100
  shieldDurability: number;
  shieldMaxDurability: number;
  // Offense
  weaponId: string;
  weaponSkillValue: number;
  // Stats
  dexterity: number;
  strength: number;
  agility: number;              // Evasion stat
}

// ── Strike Resolution ───────────────────────────────────────

export interface StrikeResolution {
  targetZone: BodyZone;
  evaded: boolean;
  blocked: boolean;              // Shield block
  armorStopped: boolean;         // Zone armor stopped it
  armorDamaged: number;          // Durability lost on armor
  armorBroken: boolean;          // Armor piece destroyed
  damageDealt: number;           // Final HP damage
  injuryInflicted: StatusEffectType | null;
  injurySeverity: number;        // 0 if no injury, 1-3
  isCritical: boolean;
  narrative: string;
}

// ── Combat Round Result ─────────────────────────────────────

export interface CombatRoundResult {
  playerStrike: StrikeResolution | null;
  enemyStrike: StrikeResolution | null;
  playerGoesFirst: boolean;
  initiativeNarrative: string;
  roundNumber: number;
  combatOver: boolean;
  playerWon: boolean;
  playerDied: boolean;
  updatedPlayer: CombatantState;
  updatedEnemy: CombatantState;
  statusTickNarrative: string;   // Bleed damage, etc.
}

// ── Active Combat Session (lives in WorldState) ─────────────

export interface ActiveCombatSession {
  enemyNpcId: string;
  enemyName: string;
  roundNumber: number;
  playerCombatant: CombatantState;
  enemyCombatant: CombatantState;
  combatLog: string[];           // Running narration (last 20)
  finished: boolean;
  playerWon: boolean | null;
}

// ── NPC Combat Profile (optional on NPC definition) ─────────

export interface NPCCombatProfile {
  agility: number;               // 0-100, evasion
  weaponSkill: number;           // 0-100, AI targeting intelligence
  zones: Record<BodyZone, { cover: number; durability: number }>;
  shieldBlockChance: number;     // 0-100, 0 if no shield
  shieldDurability: number;
}
