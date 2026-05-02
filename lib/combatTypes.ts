// ============================================================
// LIVING EAMON — Combat System Types
// Body-part targeting with 3-roll resolution.
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

/** Evasion penalty per zone (body-zone-style). Smaller zones are harder to hit. */
export const ZONE_EVASION_PENALTY: Record<BodyZone, number> = {
  torso: 0,
  limbs: 10,
  head: 30,
  neck: 50,
};

// ── Status Effects ──────────────────────────────────────────

export type StatusEffectType =
  | "bleed"             // Ongoing HP loss per round/turn
  | "poison"            // Ongoing HP loss per round/turn until cured (turnsRemaining = -1)
  | "concussion"        // Head — reduced hit chance
  | "damaged_eye"       // Head — significant accuracy penalty
  | "severed_artery"    // Neck — heavy bleed
  | "crushed_windpipe"  // Neck — potentially fatal
  | "pierced_lung"      // Torso — reduced effectiveness
  | "cracked_ribs"      // Torso — pain on exertion
  | "broken_arm"        // Limbs — weapon skill penalty
  | "broken_leg"        // Limbs — cannot flee
  // ── Spell-driven buffs / debuffs (combat-only) ──
  | "haste"             // +10 effective agility (SPEED, POWER:Quickening)
  | "shield_aura"       // +20 cover on every body zone (POWER:Silver Aura)
  | "invisible"         // Defender auto-evades for one round (POWER:Untouchable)
  | "feared_skip"       // Combatant skips next strike (POWER:Dread → on enemy)
  | "numb_hand"         // Attacker auto-misses next strike (POWER:Numb Hand → on self)
  | "hiccups"           // -3 effective agility, comic (POWER:Hiccups → on self)
  | "tongue_tied"       // Next CAST fizzles (POWER:Tongue-Tied → on self)
  | "marked_by_set";    // Next enemy strike +15 accuracy (POWER:Smelled By Set → on self)

export interface ActiveStatusEffect {
  type: StatusEffectType;
  zone: BodyZone;
  severity: number;         // 1-3, affects magnitude
  turnsRemaining: number;   // -1 = until healed
  bleedPerTurn?: number;    // For bleed/poison-type effects (HP per tick)
}

/** Which injuries can occur per zone. Poison is NOT included — it only
 *  comes from poisoned weapons (weaponPoisonCharges) or NPC poisonOnHit,
 *  never randomly from a clean blade. */
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

/**
 * Which side of the field a combatant stands on. The hero is always on the
 * "ally" side (in slot 1); future allies fill ally slots 2 and 3. Enemies
 * always carry "enemy". Pre-work B introduces the field; ally/multi-enemy
 * combat lights up in later sprints. See `lib/combat/barriers.ts`.
 */
export type CombatantSide = "ally" | "enemy";

/**
 * Slot position on a side. 1 = closest to the opposing line; 3 = rear.
 * Hero = ally slot 1; current single enemy = enemy slot 1. Slots 2 and 3
 * stay vacant until ally combat / multi-enemy combat is wired.
 */
export type CombatantPosition = 1 | 2 | 3;

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
  /** If non-null, the combatant dropped this weapon via critical fail and
   *  will auto-retrieve it at the start of the next round. */
  droppedWeaponId: string | null;
  weaponSkillValue: number;
  // Stats
  dexterity: number;
  strength: number;
  agility: number;              // Evasion stat
  /**
   * body-zone fatigue tier (0–4) per KARMA_SYSTEM.md §2.3 / §4a. Set on the
   * player's combatant by buildCombatantFromPlayer; enemies leave it
   * undefined. resolveStrike adds tier × FATIGUE_TIER_EVASION_PENALTY
   * to the attacker's hit chance when this defender carries it.
   * Refreshed before each round in gameEngine.ts so mid-fight drain
   * reflects on the next swing. (Sprint 1.)
   */
  fatigueTier?: number;
  /**
   * Which side of the field this combatant stands on. Hero = "ally";
   * current single enemy = "enemy". Pre-work B; consumed by barrier
   * cross-check in `lib/combat/barriers.ts`.
   */
  side: CombatantSide;
  /**
   * Slot position on `side`. 1 = closest to the opposing line. Hero and
   * the current single enemy both default to slot 1; slots 2 and 3 stay
   * vacant until ally / multi-enemy combat is wired (Pre-work B).
   */
  position: CombatantPosition;
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
  /** Critical fail — attacker fumbled. True when the attacker's strike
   *  was evaded AND the crit-fail roll fired. */
  isCriticalFail: boolean;
  /** True if the critical fail caused the attacker to drop their weapon. */
  weaponDropped: boolean;
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
  /**
   * Active barriers after the round's tick. Caller writes this back onto
   * the session. Empty array unless a spell put a wall in play. (Pre-work B.)
   */
  updatedBarriers: Barrier[];
}

// ── Active Combat Session (lives in WorldState) ─────────────

/**
 * A field barrier (e.g., a Wall of Stone) that blocks physical and magical
 * actions across an inter-slot boundary. Boundary indices:
 *   0 = between hero (ally slot 1) and enemy slot 1
 *   1 = between enemy slot 1 and enemy slot 2
 *   2 = between enemy slot 2 and enemy slot 3
 *   3 = reserved for ally-side symmetry (between ally slots when ally combat lights up)
 *
 * Pre-work B introduces the structure with no spell that emits one; Sprint
 * 7b.wall-of-stone wires the spell that populates it.
 */
export interface Barrier {
  id: string;
  atBoundary: 0 | 1 | 2 | 3;
  kind: "stone-wall";
  durationRemaining: number;
}

export interface ActiveCombatSession {
  enemyNpcId: string;
  enemyName: string;
  roundNumber: number;
  playerCombatant: CombatantState;
  enemyCombatant: CombatantState;
  combatLog: string[];           // Running narration (last 20)
  finished: boolean;
  playerWon: boolean | null;
  /**
   * Active field barriers. Default `[]`. Read by `isCrossingBarrier` in
   * `lib/combat/barriers.ts` to reject cross-boundary strikes; ticked down
   * in `tickBarriers`. (Pre-work B.)
   */
  barriers: Barrier[];
}

// ── NPC Combat Profile (optional on NPC definition) ─────────

export interface NPCCombatProfile {
  agility: number;               // 0-100, evasion
  weaponSkill: number;           // 0-100, AI targeting intelligence
  zones: Record<BodyZone, { cover: number; durability: number }>;
  shieldBlockChance: number;     // 0-100, 0 if no shield
  shieldDurability: number;
}
