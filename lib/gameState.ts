// ============================================================
// LIVING EAMON — GAME STATE
// This is the live, mutable state of the world.
// Everything here can change during play.
// Static definitions live in gameData.ts.
// The engine in gameEngine.ts reads and writes this state.
// ============================================================

import { RoomState } from "./gameData";
import type { ActiveCombatSession, ActiveStatusEffect } from "./combatTypes";
import type { PicssiState } from "./karma/types";

/** Serializable blood splatter record for persistence.
 *  The full SVG path is reconstructed client-side from pathIndex. */
export interface BloodSplatterState {
  id: string;
  pathIndex: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
  isCrit: boolean;
}

// ============================================================
// PASSIVE REGEN CONSTANTS
// Per-turn recovery rates applied by tickWorldState. Will be
// gated by hunger/thirst once Phase 2 lands.
// ============================================================
export const HP_REGEN_PER_TURN = 1;
export const MANA_REGEN_PER_TURN = 1;
/** −1 Honor every N turns the player still has the gray church robe. */
export const GRAY_ROBE_HONOR_DECAY_INTERVAL = 10;

// ============================================================
// STAMINA + FATIGUE + ACTION BUDGET CONSTANTS
// body-zone-derived per KARMA_SYSTEM.md §2.3 / §4a.
// Sprint 1 — stamina/fatigue bedrock; PICSSI-driven STR_eff lands in Sprint 2.
// ============================================================
/** maxStamina = STAMINA_BASE + STAMINA_PER_STR · STR. Default STR 10 → 55. */
export const STAMINA_BASE = 35;
export const STAMINA_PER_STR = 2;
/** Default per-adventure budget (moderate tier). Sprint 3 scales 20/25/30. */
export const ACTION_BUDGET_DEFAULT = 25;
/** Per-tier hit-chance bonus the enemy gets against a fatigued player.
 *  the source combat model — +15% per tier; tier 4 caps at 60%. */
export const FATIGUE_TIER_EVASION_PENALTY = 15;

// ============================================================
// TYPES
// ============================================================

export type Disposition =
  | "friendly"    // Actively helpful
  | "neutral"     // Default, polite but guarded
  | "cold"        // Unhelpful, won't engage
  | "hostile"     // Will attack or call guards
  | "afraid"      // Will flee or comply out of fear
  | "furious";    // Angry, demands restitution before anything else

export type AgendaType =
  | "seek_restitution"   // NPC wants something fixed or paid for
  | "hunt_player"        // NPC or their agents are looking for the player
  | "spread_rumor"       // NPC is telling others what the player did
  | "seek_help"          // NPC needs the player's help
  | "reward_player"      // NPC wants to reward the player
  | "ignore_player";     // NPC is deliberately avoiding the player

export type RecoveryType =
  | "time"          // Recovers automatically after N player actions
  | "payment"       // Requires gold payment
  | "labor"         // Requires completing a task or adventure
  | "punishment"    // Requires serving punishment (prison, fine)
  | "permanent"     // Never recovers — world is changed forever
  | "combined";     // Requires multiple recovery types

export type ReputationLevel =
  | "legendary"    // +50 and above
  | "honored"      // +20 to +49
  | "respected"    // +5 to +19
  | "neutral"      // -4 to +4
  | "suspect"      // -5 to -19
  | "wanted"       // -20 to -49
  | "infamous";    // -50 and below

// ============================================================
// ROOM STATE ENTRY
// Tracks the current state of a room and how it got there
// ============================================================

export interface RoomStateEntry {
  roomId: string;
  currentState: RoomState;
  previousState: RoomState;
  causedBy: string | null;       // Player id or NPC id that caused the change
  causeDescription: string | null; // Human-readable cause e.g. "cast fireball"
  turnsInState: number;          // How many player actions since state changed
  recovery: {
    type: RecoveryType;
    description: string;         // Shown to player as hint e.g. "The hall needs repairs"
    goldRequired?: number;       // For payment recovery
    adventureRequired?: string;  // Adventure id for labor recovery
    turnsRequired?: number;      // For time recovery
    complete: boolean;
  } | null;
  /**
   * Items revealed in this room through container examination.
   * Each entry: { itemId, containerId }
   * Shown in the situation block 👁 line.
   * Removed when the player takes the item.
   */
  revealedItems: { itemId: string; containerId: string }[];
}

// ============================================================
// NPC STATE ENTRY
// Tracks disposition, memory, and active agenda for each NPC
// ============================================================

export interface NPCMemoryEntry {
  action: string;              // What the player did e.g. "burnt the main hall"
  turn: number;                // When it happened
  severity: "minor" | "moderate" | "severe" | "unforgivable";
  forgiven: boolean;           // Has the player made restitution
}

export interface NPCAgenda {
  type: AgendaType;
  description: string;         // What the NPC is actively doing about it
  targetPlayerId: string;
  resolvedBy: string | null;   // What action resolves this agenda
  active: boolean;
}

export interface NPCStateEntry {
  npcId: string;
  disposition: Disposition;
  memory: NPCMemoryEntry[];
  agenda: NPCAgenda | null;
  location: string;            // Current room id
  isAlive: boolean;
  /** Current HP in an active fight. null = not in combat / full HP. */
  combatHp: number | null;
  customGreeting: string | null; // Override default greeting based on state
}

// ============================================================
// PLAYER STATE
// The persistent adventurer
// ============================================================

export interface PlayerInventoryItem {
  itemId: string;
  quantity: number;
  /**
   * Sprint 7b.T — per-instance binding for marked_rune items.
   * Each marked rune stone is quantity 1 with its own binding.
   * Lost on death (inventory is stripped at rebirth).
   */
  runeBinding?: { roomId: string; planeId: string; label: string };
}

// ── Temp Modifier Layer (Pre-work D, Sprint 7b.B) ────────────
// Additive overlays that modify effective stat values for the
// duration of a buff without writing through to the PICSSI ledger
// or base attributes. Expires by turn count. Recompute reads these
// so derived caps stay in sync while the buff is active.
export type TempModifierStat = "illumination" | "charisma";

export interface TempModifier {
  stat: TempModifierStat;
  delta: number;
  turnsRemaining: number;   // counts down per player turn; expires at 0
  source: string;           // "bless", "pray-mithras", etc.
}


export interface WeaponSkills {
  swordsmanship: number;
  armor_expertise: number;
  shield_expertise: number;
  stealth: number;
  lockpicking: number;
  magery: number;
}

export const SKILL_CAP = 700;

export const SKILL_NAMES: Record<keyof WeaponSkills, string> = {
  swordsmanship: "Swordsmanship",
  armor_expertise: "Armor Expertise",
  shield_expertise: "Shield Expertise",
  stealth: "Stealth",
  lockpicking: "Lockpicking",
  magery: "Magery",
};

export const DEFAULT_WEAPON_SKILLS: WeaponSkills = {
  swordsmanship: 0,
  armor_expertise: 0,
  shield_expertise: 0,
  stealth: 0,
  lockpicking: 0,
  magery: 0,
};

export function normalizeWeaponSkills(
  ws: Partial<WeaponSkills> | null | undefined
): WeaponSkills {
  return { ...DEFAULT_WEAPON_SKILLS, ...ws };
}

export interface PlayerState {
  id: string;
  name: string;
  currentRoom: string;
  previousRoom: string | null;
  /** Rooms the player has physically entered — controls fog-of-war on exit labels. */
  visitedRooms: string[];

  // Core stats
  hp: number;
  maxHp: number;
  /**
   * Current mana points. Max = maxMana.
   * Spent by INVOKE / CAST (when mana costs land); regenerates over time
   * via tickWorldState. Floor 0, cap = maxMana.
   */
  currentMana: number;
  /** Maximum mana pool. Grows +1 on each combat victory. */
  maxMana: number;
  /** STR base — pre-PICSSI value. PICSSI Passion adds up to +10 on top. */
  strength: number;
  dexterity: number;
  charisma: number;
  /**
   * PICSSI-augmented effective stats. Recomputed every load via
   * recomputeDerivedStats (lib/karma/recompute.ts). KARMA Sprint 2.
   *   STR_eff = STR + min(10, floor(passion/10))
   *   DEX_eff = DEX + min(10, floor(courage/10))
   *   CHA_eff = CHA + min(10, floor(standing/10))
   * Persisted for fast reads but always re-derived on load — never
   * mutate directly.
   */
  strengthEffective: number;
  dexterityEffective: number;
  charismaEffective: number;
  /**
   * Cumulative combat-victory counter. Drives maxMana via
   * KARMA_SYSTEM.md §2.2: maxMana = 10 + |illumination|/2 + combatVictories.
   * Replaces the old "maxMana++ per kill" mutation pattern.
   */
  combatVictories: number;

  /**
   * body-zone-style dual-pool stamina (KARMA Sprint 1, KARMA_SYSTEM.md §2.3).
   *   stamina      — current pool, drains per swing in combat,
   *                  resets to maxStamina at fight-end.
   *   maxStamina   — STAMINA_BASE + STAMINA_PER_STR · STR. Recomputed via
   *                  recomputeDerivedStats(); persisted for fast reads.
   *   fatiguePool  — persistent accumulator. Negative; tiers at
   *                  −maxStamina × {1,2,3,4}. Tier 4 blocks player turn.
   */
  stamina: number;
  maxStamina: number;
  fatiguePool: number;

  /**
   * Per-adventure activity budget (KARMA_SYSTEM.md §4c). Sprint 3's
   * activity dispatcher (PRAY/DRINK/etc.) decrements this; tier scaling
   * 20 (novice) / 25 (moderate) / 30 (deadly). Reset at hub return + on
   * rebirth at the Church. Sprint 1 sets the field; consumption lands
   * in Sprint 3.
   */
  actionBudget: number;

  /** Per-category skill values. Total capped at SKILL_CAP. */
  weaponSkills: WeaponSkills;

  // Economy
  gold: number;                // Gold currently carried (lost on death)
  bankedGold: number;          // Gold in the Guild Bank (never lost)

  // Equipment
  weapon: string;              // Item id of equipped weapon
  armor: string | null;        // LEGACY — mapped to bodyArmor on load
  shield: string | null;       // Item id of equipped shield (off-hand)
  // Per-zone armor slots (body-zone-style)
  helmet: string | null;       // Head protection
  gorget: string | null;       // Neck protection
  bodyArmor: string | null;    // Torso protection
  limbArmor: string | null;    // Limb protection
  boots: string | null;        // Feet protection
  ringLeft: string | null;     // Ring (left hand)
  ringRight: string | null;    // Ring (right hand)
  cuffLeft: string | null;     // Cuff (left arm)
  cuffRight: string | null;    // Cuff (right arm)
  necklace: string | null;     // Necklace or medallion
  inventory: PlayerInventoryItem[];

  /**
   * PICSSI — the canonical six-dimensional character scoring system.
   * GAME_DESIGN.md §11 + KARMA_SYSTEM.md §2. Replaced the legacy
   * 10-virtue ledger in KARMA Sprint 2 (2026-04-30 / migration
   * 20260501100000_picssi_bedrock_and_legacy_drop.sql).
   *
   * Five virtues run 0..100; Illumination runs −100..+100 (bipolar —
   * both saintly and demonic ends grow maxMana). Mutate via
   * applyKarma() in lib/karma/recompute.ts; never write directly.
   */
  picssi: PicssiState;

  // Reputation
  reputationScore: number;     // Numeric score
  reputationLevel: ReputationLevel;
  knownAs: string | null;      // Title earned e.g. "the Merciful" or "the Burned"

  // Adventure tracking
  currentAdventure: string | null;  // Adventure id if in an adventure
  completedAdventures: string[];

  /**
   * KARMA Sprint 8a — Quest Engine state. Per-quest runtime info
   * (status, currentStep, completedSteps, scratch). Authoring lives
   * in `lib/quests/lines/<id>.ts`; this map is the player-side
   * runtime state. Replaces the inert `activeQuests: string[]`.
   *
   * Scope-filtered on rebirth: life-scope quests wipe; legacy-scope
   * quests survive death. See lib/quests/engine.ts:filterQuestsByScope.
   */
  quests: Record<string, import("./quests/types").QuestState>;

  // Consequences
  bounty: number;              // Gold bounty on player's head (0 = none)
  isWanted: boolean;
  prisonTurnsRemaining: number; // 0 = not in prison

  // Session
  turnCount: number;           // Total actions taken this session
  lastAction: string | null;

  /** Official guild magic — autocomplete for CAST */
  knownSpells: string[];
  /**
   * Occult Circles the player has unlocked (1..8). Empty by default.
   * Set by quest rewards via `applyReward` when `unlockCircle` is
   * granted. Persists across rebirth (legacy knowledge — once a soul
   * has glimpsed a Circle, it does not unsee it). Sorcery INVOKE
   * gates on this set: spells of unknown circles are rejected.
   * See SORCERY.md §6 + lib/sorcery/registry.ts.
   */
  knownCircles: number[];
  /** Divine names learned in play — autocomplete for PRAY */
  knownDeities: string[];

  /** Accumulated blood splatters on the hero sprite — persists until washed.
   *  Serialized positions; purely visual, no gameplay effect. */
  goreSplatters: BloodSplatterState[];

  /** After first Sam shop purchase, Sam gives a plain outfit and removes the gray robe; reset on death. */
  receivedSamStarterOutfit: boolean;

  /** Hokas's one-time pity gift (unarmed in Main Hall); reset on death. */
  receivedHokasUnarmedGift: boolean;

  /** Which barmaid the player chose when Aldric offered a drink. null = not yet chosen. */
  barmaidPreference: string | null;

  /**
   * Sprint 7b.B — active temp-stat modifiers (Bless, future buffs).
   * Each entry modifies one effective stat for a turn-counted duration
   * without writing through to the PICSSI ledger or base attributes.
   * Ticked by tickWorldState; recompute reads them for derived caps.
   */
  tempModifiers: TempModifier[];

  /**
   * Sprint 7b.T — current world/plane id. Default "thurian".
   * Changes when Gate Travel crosses planes. Per-life.
   */
  currentPlane: string;

  /** Active combat session — non-null when in combat. */
  activeCombat: ActiveCombatSession | null;

  /**
   * Status effects carried out of combat (bleed, poison, broken_leg, etc.).
   * Ticked once per player turn by tickWorldState (when not in combat).
   * On combat start: copied into playerCombatant.activeEffects.
   * On combat end: playerCombatant.activeEffects copied back here.
   */
  activeEffects: ActiveStatusEffect[];

  /** Remaining poison charges on the equipped weapon. 0 = no coating. */
  weaponPoisonCharges: number;
  /** Severity (1-3) of the poison currently coating the weapon. */
  weaponPoisonSeverity: number;

  /** Whether the player is currently mounted. Affects armor dex penalties. */
  mounted: boolean;

  /** False until an NPC first says the hero's name. Triggers name-revelation moment. */
  remembersOwnName: boolean;

  /** False until first visit to Pots & Bobbles. Zim's intro fires once. */
  metZim: boolean;

  // ── KARMA Sprint 3 — activity / brothel / scrolls state ──────────
  /**
   * Active venereal disease flag (KARMA_SYSTEM.md §2.13a / GAME_DESIGN.md §12).
   * Set by BROTHEL side effect (~7.5% per visit). Cured by HEAL spell,
   * the fertility temple (high chance, Spirituality-scaled), or a
   * generic temple PRAY (lower chance). While active, recompute
   * subtracts 2 from STR_eff (floor 6) per KARMA_SYSTEM.md.
   */
  vdActive: boolean;

  /**
   * Scrolls of Thoth read-tracking. Keyed by scroll id ("thoth-1"..).
   * `riddlesPassed` is the list of riddle answers the player has
   * verified — Illumination is awarded on FIRST riddle pass per scroll.
   * Per-life: cleared on rebirth at the Church.
   */
  scrollsRead: Record<string, { firstReadAt: string; riddlesPassed: string[] }>;

  /**
   * Open riddle gate. Set when the player reads a scroll; their next
   * command is taken as the answer. null = no pending riddle.
   * Persisted so a page refresh doesn't lose the prompt.
   */
  pendingRiddle: { scrollId: string; riddleIdx: number; prompt: string } | null;

  // ── KARMA Sprint 4 — encounter atom world state ───────────────
  /**
   * Hidden 0..100 affection meter per recurring NPC. Drives gift-
   * giving, recurring encounter unlocks, eros progression, and grief
   * reach on NPC death. Atoms write deltas; engine clamps to 0..100.
   * Per-life: cleared on rebirth at the Church.
   */
  npcAffection: Record<string, number>;

  /**
   * Per-life narrative flags consumed by atom prerequisites and
   * future quest steps. Strings are arbitrary; atoms set them via
   * `flagsSet` in their Choice schema. Wiped on rebirth.
   */
  flagsLife: Record<string, boolean>;

  /**
   * Legacy flags that survive death — used for "you've done this
   * before" gates in future-life encounters. Authored explicitly per
   * atom; default behavior is to set into flagsLife.
   */
  flagsLegacy: Record<string, boolean>;

  /**
   * Open atom gate. Set when an encounter atom has been presented to
   * the player and is awaiting a numbered choice. The next non-bypass
   * command is taken as the choice index (1, 2, 3...). null = no
   * pending atom. Persisted across refresh.
   */
  pendingAtom: { atomId: string; presentedAt: number } | null;

  /**
   * KARMA Sprint 6 — tail-buffer of recent PICSSI deltas. Each entry
   * carries a timestamp, the delta applied, and a one-line source
   * tag ("combat: defeated goblin", "atom: vivian-meet", etc.).
   * Trimmed to the last KARMA_LOG_MAX entries on every write.
   * Surfaced in the STATS panel's karma history view.
   */
  karmaLog: Array<{
    at: string;          // ISO 8601
    delta: Partial<Record<"passion" | "integrity" | "courage" | "standing" | "spirituality" | "illumination", number>>;
    source: string;
  }>;
}

/** KARMA Sprint 6 — cap the size of the per-player karma log. */
export const KARMA_LOG_MAX = 50;

// ============================================================
// WORLD STATE
// The complete state of the living world
// ============================================================

export interface ActiveEvent {
  id: string;
  description: string;         // What's happening in the world
  affectedRooms: string[];
  turnsRemaining: number | null; // null = permanent until resolved
  resolvedBy: string | null;
}

export interface WorldState {
  // Room states
  rooms: Record<string, RoomStateEntry>;

  // NPC states
  npcs: Record<string, NPCStateEntry>;

  // Player
  player: PlayerState;

  // Active world events (Sheriff hunting, fires spreading, rumors)
  activeEvents: ActiveEvent[];

  // Chronicle — log of significant events for the daily newspaper
  chronicleLog: {
    turn: number;
    event: string;
    isPublic: boolean;         // false = Jane only, true = Chronicle-worthy
  }[];

  // Turn counter (global)
  worldTurn: number;

  /**
   * Stock of finite charity barrels in the Main Hall. Decrements per item
   * taken. When 0, the barrel is empty until a future restocking event.
   * Default: 20 gowns, 10 mixed clothing pieces.
   */
  barrelStock: {
    gowns: number;
    charityClothes: number;
  };

  /**
   * Vendor temporary inventory. Keyed by vendor NPC id.
   * Items sold to vendors stay for 72 hours, then expire.
   * Player can buy back at double the sale price.
   */
  vendorTempStock: Record<string, Array<{
    itemId: string;
    expiresAtTime: string; // ISO 8601 timestamp
  }>>;
}

// ============================================================
// INITIAL STATE FACTORY
// Creates a fresh world state for a new player
// ============================================================

export function createInitialWorldState(playerName: string = "Adventurer"): WorldState {
  return {
    rooms: {
      main_hall: {
        roomId: "main_hall",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
        revealedItems: [],
      },
      armory: {
        roomId: "armory",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
        revealedItems: [],
      },
      notice_board: {
        roomId: "notice_board",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
        revealedItems: [],
      },
      guild_vault: {
        roomId: "guild_vault",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
        revealedItems: [],
      },
      guild_courtyard: {
        roomId: "guild_courtyard",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
        revealedItems: [],
      },
      church_of_perpetual_life: {
        roomId: "church_of_perpetual_life",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
        revealedItems: [],
      },
      mage_school: {
        roomId: "mage_school",
        currentState: "normal",
        previousState: "normal",
        causedBy: null,
        causeDescription: null,
        turnsInState: 0,
        recovery: null,
        revealedItems: [],
      },
    },

    npcs: {
      hokas_tokas: {
        npcId: "hokas_tokas",
        disposition: "friendly",
        memory: [],
        agenda: null,
        location: "main_hall",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      sam_slicker: {
        npcId: "sam_slicker",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "sams_sharps",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      old_mercenary: {
        npcId: "old_mercenary",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "main_hall",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      lira: {
        npcId: "lira",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "main_hall",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      mavia: {
        npcId: "mavia",
        disposition: "friendly",
        memory: [],
        agenda: null,
        location: "main_hall",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      seraine: {
        npcId: "seraine",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "main_hall",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      brunt_the_banker: {
        npcId: "brunt_the_banker",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "guild_vault",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      armory_attendant: {
        npcId: "armory_attendant",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "armory",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      priest_of_perpetual_life: {
        npcId: "priest_of_perpetual_life",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "church_of_perpetual_life",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      training_dummy: {
        npcId: "training_dummy",
        disposition: "neutral",
        memory: [],
        agenda: null,
        location: "guild_courtyard",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
      zim_the_wizard: {
        npcId: "zim_the_wizard",
        disposition: "friendly",
        memory: [],
        agenda: null,
        location: "mage_school",
        isAlive: true,
        combatHp: null,
        customGreeting: null,
      },
    },

    player: {
      id: "player_1",
      name: playerName,
      currentRoom: "church_of_perpetual_life",
      previousRoom: null,
      visitedRooms: ["church_of_perpetual_life"],

      // KARMA_SYSTEM.md §2.1: maxHP = 50 + 2·integrity → 50 at midline.
      // Sprint 2 raised the base from the legacy 20; existing rows get
      // recomputed up on next load.
      hp: 50,
      maxHp: 50,
      strength: 12,
      dexterity: 10,
      charisma: 10,
      strengthEffective: 12,   // recomputeDerivedStats reconfirms on load
      dexterityEffective: 10,
      charismaEffective: 10,
      combatVictories: 0,
      maxMana: 10,
      currentMana: 10,
      // Stamina derived from STR via STAMINA_BASE + 2·STR (Sprint 1).
      // STR 12 → 35 + 24 = 59. recomputeDerivedStats() will reconfirm at load.
      stamina: STAMINA_BASE + STAMINA_PER_STR * 12,
      maxStamina: STAMINA_BASE + STAMINA_PER_STR * 12,
      fatiguePool: 0,
      actionBudget: ACTION_BUDGET_DEFAULT,

      weaponSkills: { ...DEFAULT_WEAPON_SKILLS },

      gold: 0,
      bankedGold: 0,

      weapon: "unarmed",
      armor: null,
      shield: null,
      helmet: null,
      gorget: null,
      bodyArmor: null,
      limbArmor: null,
      boots: null,
      ringLeft: null,
      ringRight: null,
      cuffLeft: null,
      cuffRight: null,
      necklace: null,
      inventory: [{ itemId: "gray_robe", quantity: 1 }],

      picssi: {
        passion: 0,
        integrity: 0,
        courage: 0,
        standing: 0,
        spirituality: 0,
        illumination: 0,
      },

      reputationScore: 0,
      reputationLevel: "neutral",
      knownAs: null,

      currentAdventure: null,
      completedAdventures: [],
      quests: {},

      bounty: 0,
      isWanted: false,
      prisonTurnsRemaining: 0,

      turnCount: 0,
      lastAction: null,

      knownSpells: [],
      knownCircles: [],
      knownDeities: [],
      goreSplatters: [],

      receivedSamStarterOutfit: false,
      receivedHokasUnarmedGift: false,
      barmaidPreference: null,
      weaponPoisonCharges: 0,
      weaponPoisonSeverity: 0,
      activeCombat: null,
      activeEffects: [],
      tempModifiers: [],
      currentPlane: "thurian",
      mounted: false,
      remembersOwnName: false,
      metZim: false,
      vdActive: false,
      scrollsRead: {},
      pendingRiddle: null,
      npcAffection: {},
      flagsLife: {},
      flagsLegacy: {},
      pendingAtom: null,
      karmaLog: [],
    },

    activeEvents: [],

    chronicleLog: [],

    worldTurn: 0,

    barrelStock: {
      gowns: 20,
      charityClothes: 10,
    },

    vendorTempStock: {},
  };
}

// ============================================================
// STATE MUTATION HELPERS
// Pure functions that return new state — never mutate directly
// ============================================================

export function changeRoomState(
  state: WorldState,
  roomId: string,
  newRoomState: RoomState,
  causedBy: string,
  causeDescription: string,
  recovery: RoomStateEntry["recovery"]
): WorldState {
  const prev = state.rooms[roomId];
  return {
    ...state,
    rooms: {
      ...state.rooms,
      [roomId]: {
        ...prev,
        roomId,
        currentState: newRoomState,
        previousState: prev?.currentState ?? "normal",
        causedBy,
        causeDescription,
        turnsInState: 0,
        recovery,
        revealedItems: prev?.revealedItems ?? [],
      },
    },
  };
}

export function changeNPCDisposition(
  state: WorldState,
  npcId: string,
  newDisposition: Disposition,
  memory?: NPCMemoryEntry,
  newAgenda?: NPCAgenda,
  customGreeting?: string
): WorldState {
  const existing = state.npcs[npcId];
  if (!existing) return state;
  return {
    ...state,
    npcs: {
      ...state.npcs,
      [npcId]: {
        ...existing,
        disposition: newDisposition,
        memory: memory ? [...existing.memory, memory] : existing.memory,
        agenda: newAgenda ?? existing.agenda,
        customGreeting: customGreeting ?? existing.customGreeting,
      },
    },
  };
}

export function updatePlayerGold(
  state: WorldState,
  delta: number
): WorldState {
  return {
    ...state,
    player: {
      ...state.player,
      gold: Math.max(0, state.player.gold + delta),
    },
  };
}

export function updatePlayerHP(
  state: WorldState,
  delta: number
): WorldState {
  const newHp = Math.max(0, Math.min(state.player.maxHp, state.player.hp + delta));
  return {
    ...state,
    player: {
      ...state.player,
      hp: newHp,
    },
  };
}

/**
 * Bump PICSSI Standing by `delta`, clamped to 0..100. Replaces all
 * legacy Honor mutations as of 2026-04-29 per Scotch's deprecation
 * directive. Standing is unipolar: a fresh hero (Standing 0) cannot
 * go negative; loss-events at Standing 0 clamp silently.
 *
 * See KARMA_SYSTEM.md §2.8 (Standing) for canonical growth/loss
 * sources and tier scaling.
 */
export function bumpStanding(state: WorldState, delta: number): WorldState {
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

export function movePlayer(
  state: WorldState,
  newRoomId: string
): WorldState {
  const alreadyVisited = state.player.visitedRooms.includes(newRoomId);
  return {
    ...state,
    player: {
      ...state.player,
      previousRoom: state.player.currentRoom,
      currentRoom: newRoomId,
      visitedRooms: alreadyVisited
        ? state.player.visitedRooms
        : [...state.player.visitedRooms, newRoomId],
      turnCount: state.player.turnCount + 1,
    },
    worldTurn: state.worldTurn + 1,
  };
}

export function addToChronicle(
  state: WorldState,
  event: string,
  isPublic: boolean
): WorldState {
  return {
    ...state,
    chronicleLog: [
      ...state.chronicleLog,
      { turn: state.worldTurn, event, isPublic },
    ],
  };
}

export function updatePlayerReputation(
  state: WorldState,
  delta: number
): WorldState {
  const newScore = state.player.reputationScore + delta;
  let level: ReputationLevel = "neutral";
  if (newScore >= 50) level = "legendary";
  else if (newScore >= 20) level = "honored";
  else if (newScore >= 5) level = "respected";
  else if (newScore >= -4) level = "neutral";
  else if (newScore >= -19) level = "suspect";
  else if (newScore >= -49) level = "wanted";
  else level = "infamous";

  return {
    ...state,
    player: {
      ...state.player,
      reputationScore: newScore,
      reputationLevel: level,
    },
  };
}

export function addBounty(
  state: WorldState,
  amount: number
): WorldState {
  return {
    ...state,
    player: {
      ...state.player,
      bounty: state.player.bounty + amount,
      isWanted: state.player.bounty + amount > 0,
    },
  };
}

export function addToVendorTempStock(
  state: WorldState,
  vendorId: string,
  itemId: string
): WorldState {
  const existingStock = state.vendorTempStock[vendorId] ?? [];
  const now = new Date();
  const expiresAtTime = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();

  return {
    ...state,
    vendorTempStock: {
      ...state.vendorTempStock,
      [vendorId]: [...existingStock, { itemId, expiresAtTime }],
    },
  };
}

export function setNPCCombatHp(
  state: WorldState,
  npcId: string,
  hp: number | null
): WorldState {
  const existing = state.npcs[npcId];
  if (!existing) return state;
  return {
    ...state,
    npcs: {
      ...state.npcs,
      [npcId]: { ...existing, combatHp: hp },
    },
  };
}

/**
 * Increases a skill by delta, enforcing the 700-point
 * total cap. When cap is hit, the least-recently-used
 * skill (lowest value, excluding the skill being raised)
 * degrades by 1 to make room (repeated until total ≤ cap).
 * Returns { newState, degradedSkill } where degradedSkill
 * is the last key that degraded, or null if no degradation.
 */
export function updateWeaponSkill(
  state: WorldState,
  skill: keyof WeaponSkills,
  delta: number
): { newState: WorldState; degradedSkill: keyof WeaponSkills | null } {
  const current = normalizeWeaponSkills(state.player.weaponSkills);
  const newValue = Math.max(0, (current[skill] ?? 0) + delta);
  let updatedSkills: WeaponSkills = { ...current, [skill]: newValue };
  let degradedSkill: keyof WeaponSkills | null = null;

  for (;;) {
    const newTotal = (Object.keys(updatedSkills) as (keyof WeaponSkills)[]).reduce(
      (a, k) => a + (updatedSkills[k] ?? 0),
      0
    );
    if (newTotal <= SKILL_CAP) break;

    const candidates = (Object.entries(updatedSkills) as [keyof WeaponSkills, number][])
      .filter(([k, v]) => k !== skill && (v ?? 0) > 0)
      .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0));

    if (candidates.length === 0) break;

    const [keyToDegrade] = candidates[0]!;
    degradedSkill = keyToDegrade;
    updatedSkills = {
      ...updatedSkills,
      [keyToDegrade]: Math.max(0, (updatedSkills[keyToDegrade] ?? 0) - 1),
    };
  }

  return {
    newState: {
      ...state,
      player: {
        ...state.player,
        weaponSkills: updatedSkills,
      },
    },
    degradedSkill,
  };
}

/**
 * Reveals items in a room's situation block.
 * Replaces any existing revealed items for the same
 * containerId (re-examining a barrel resets what's shown).
 */
export function revealItemsInRoom(
  state: WorldState,
  roomId: string,
  containerId: string,
  itemIds: string[]
): WorldState {
  const existing = state.rooms[roomId];
  if (!existing) return state;

  const filtered = (existing.revealedItems ?? []).filter(
    r => r.containerId !== containerId
  );
  const newRevealed = itemIds.map(itemId => ({
    itemId,
    containerId,
  }));

  return {
    ...state,
    rooms: {
      ...state.rooms,
      [roomId]: {
        ...existing,
        revealedItems: [...filtered, ...newRevealed],
      },
    },
  };
}

/**
 * Removes a single revealed item from a room
 * (called when the player takes the item).
 */
export function removeRevealedItem(
  state: WorldState,
  roomId: string,
  itemId: string
): WorldState {
  const existing = state.rooms[roomId];
  if (!existing) return state;
  return {
    ...state,
    rooms: {
      ...state.rooms,
      [roomId]: {
        ...existing,
        revealedItems: (existing.revealedItems ?? []).filter(
          r => r.itemId !== itemId
        ),
      },
    },
  };
}

export function applyPlayerDeath(
  state: WorldState,
  enemyName: string
): { newState: WorldState; lostGold: number } {
  const lostGold = state.player.gold;

  let newState: WorldState = {
    ...state,
    player: {
      ...state.player,
      hp: state.player.maxHp,
      currentMana: state.player.maxMana,
      gold: 0,
      weapon: "unarmed",
      armor: null,
      shield: null,
      helmet: null,
      gorget: null,
      bodyArmor: null,
      limbArmor: null,
      boots: null,
      ringLeft: null,
      ringRight: null,
      cuffLeft: null,
      cuffRight: null,
      necklace: null,
      activeCombat: null,
      activeEffects: [],
      tempModifiers: [],
      currentPlane: "thurian",
      goreSplatters: [],
      weaponPoisonCharges: 0,
      weaponPoisonSeverity: 0,
      mounted: false,
      remembersOwnName: false,
      metZim: false,
      inventory: [{ itemId: "gray_robe", quantity: 1 }],
      receivedSamStarterOutfit: false,
      receivedHokasUnarmedGift: false,
      currentRoom: "church_of_perpetual_life",
      previousRoom: state.player.currentRoom,
      // Rebirth wipes fatigue + refills stamina + resets the activity budget.
      stamina: state.player.maxStamina,
      fatiguePool: 0,
      actionBudget: ACTION_BUDGET_DEFAULT,
      // PICSSI is per-life (KARMA_SYSTEM.md §11 / GAME_DESIGN.md §11) —
      // every death resets virtues to midline. The Perpetual Hero
      // re-enters the world morally fresh.
      picssi: {
        passion: 0,
        integrity: 0,
        courage: 0,
        standing: 0,
        spirituality: 0,
        illumination: 0,
      },
      // Combat-victory mana growth is also per-life. Recompute will
      // collapse maxMana back to the 10-base on first post-rebirth load.
      combatVictories: 0,
      // Per-life: VD heals, scroll-knowledge fades, dangling riddles drop.
      vdActive: false,
      scrollsRead: {},
      pendingRiddle: null,
      // Per-life: affection + life-flags wipe; legacy flags carry forward.
      npcAffection: {},
      flagsLife: {},
      // flagsLegacy: preserved (intentionally not reset)
      pendingAtom: null,
      // Per-life: karma history begins fresh on rebirth.
      karmaLog: [],
      // Sprint 8a: scope-filter quests — life-scope wipe, legacy survive.
      // Inlined to avoid circular import with lib/quests/engine.ts.
      // Engine's `filterQuestsByScope` is the canonical version; this
      // mirrors its data-only semantics (reads QuestState.scope which
      // is denormalized at acceptance time).
      quests: Object.fromEntries(
        Object.entries(state.player.quests ?? {}).filter(
          ([, qs]) => qs.scope === "legacy"
        )
      ),
    },
  };

  newState = addToChronicle(
    newState,
    `${state.player.name} was slain by ${enemyName} and reborn in the Church of Perpetual Life.`,
    true
  );

  return { newState, lostGold };
}

// ============================================================
// STATE RECOVERY TICK
// Call this every player turn to advance time-based recovery
// ============================================================

export function tickWorldState(state: WorldState): WorldState {
  let newState = { ...state, worldTurn: state.worldTurn + 1 };

  // ── Out-of-combat status effect tick + passive regen ──────
  // Combat-mode skip: in-combat ticks happen via tickStatusEffects()
  // inside resolveCombatRound — don't double-tick.
  if (!newState.player.activeCombat) {
    let p = newState.player;

    // Tick status effects (bleed, poison, etc.) — apply damage, expire
    if (p.activeEffects?.length) {
      let dmg = 0;
      const remaining: ActiveStatusEffect[] = [];
      for (const effect of p.activeEffects) {
        if (effect.bleedPerTurn) dmg += effect.bleedPerTurn;
        const newTurns =
          effect.turnsRemaining === -1 ? -1 : effect.turnsRemaining - 1;
        if (newTurns !== 0) {
          remaining.push({ ...effect, turnsRemaining: newTurns });
        }
      }
      p = {
        ...p,
        hp: Math.max(0, p.hp - dmg),
        activeEffects: remaining,
      };
    }

    // Tick temp modifiers (Bless, future buffs) — decrement turn counters;
    // expired entries are dropped. Derived stats (CHA_eff, maxMana) catch
    // up on the next applyKarma call or page-load recompute — no circular
    // import needed here.
    if (p.tempModifiers?.length) {
      const nextMods = p.tempModifiers
        .map(m => ({ ...m, turnsRemaining: m.turnsRemaining - 1 }))
        .filter(m => m.turnsRemaining > 0);
      p = { ...p, tempModifiers: nextMods };
    }

    // Passive regen — HP + mana (gated by activeCombat above + stamina>0).
    // KARMA_SYSTEM.md §2.3: a body whose stamina pool is empty stops
    // healing — it has nothing left to spend on repair. Eat, drink,
    // sleep, or pray to recover. Sprint 1 wires the gate; Sprint 3's
    // activity dispatcher will provide the rest paths.
    const regenActive = p.stamina > 0;
    const nextHp = regenActive ? Math.min(p.maxHp, p.hp + HP_REGEN_PER_TURN) : p.hp;
    const maxMana = p.maxMana ?? 0;
    const nextMana = regenActive
      ? Math.min(maxMana, (p.currentMana ?? maxMana) + MANA_REGEN_PER_TURN)
      : (p.currentMana ?? maxMana);
    if (nextHp !== p.hp || nextMana !== p.currentMana || p !== newState.player) {
      newState = {
        ...newState,
        player: { ...p, hp: nextHp, currentMana: nextMana },
      };
    }

    // Gray-robe Standing decay — wearing the church's robe is shameful for
    // anyone past the moment of rebirth. −1 Standing every 10 turns it stays
    // in inventory. Stops as soon as the robe is removed (e.g., after Sam's
    // outfit purchase or the charity-barrel dressing ceremony).
    // (Was Honor pre-2026-04-29; deprecated to PICSSI Standing.)
    const wearingRobe = newState.player.inventory.some(e => e.itemId === "gray_robe");
    if (
      wearingRobe &&
      newState.worldTurn > 0 &&
      newState.worldTurn % GRAY_ROBE_HONOR_DECAY_INTERVAL === 0
    ) {
      newState = bumpStanding(newState, -1);
      newState = addToChronicle(
        newState,
        "Wore the gray church robe for another ten turns.",
        false
      );
    }
  }

  // Advance room state recovery timers
  for (const [roomId, roomState] of Object.entries(newState.rooms)) {
    if (roomState.currentState === "normal") continue;
    if (!roomState.recovery) continue;

    const updatedTurns = roomState.turnsInState + 1;

    // Time-based recovery
    if (
      roomState.recovery.type === "time" &&
      roomState.recovery.turnsRequired &&
      updatedTurns >= roomState.recovery.turnsRequired
    ) {
      newState = changeRoomState(
        newState, roomId, "normal", "time", "Natural recovery", null
      );
      continue;
    }

    newState = {
      ...newState,
      rooms: {
        ...newState.rooms,
        [roomId]: {
          ...newState.rooms[roomId],
          turnsInState: updatedTurns,
        },
      },
    };
  }

  // Expire vendor temp stock items after 72 hours
  const now = new Date().toISOString();
  const updatedVendorStock: Record<string, Array<{ itemId: string; expiresAtTime: string }>> = {};
  for (const [vendorId, items] of Object.entries(newState.vendorTempStock)) {
    updatedVendorStock[vendorId] = items.filter(
      (item) => item.expiresAtTime > now
    );
  }
  newState = { ...newState, vendorTempStock: updatedVendorStock };

  return newState;
}

// ============================================================
// CONSEQUENCE ENGINE
// When a major event happens, this determines the world's
// reaction — NPC agenda changes, bounties, active events
// ============================================================

export function applyFireballConsequences(
  state: WorldState,
  roomId: string,
  playerId: string
): WorldState {
  let newState = state;

  // Burn the room
  newState = changeRoomState(
    newState,
    roomId,
    "burnt",
    playerId,
    "cast fireball",
    {
      type: "combined",
      description: "The hall needs repairs. Pay 50 gold, work off the debt, or face the Sheriff.",
      goldRequired: 50,
      adventureRequired: "timber_run",
      complete: false,
    }
  );

  // Hokas goes furious
  newState = changeNPCDisposition(
    newState,
    "hokas_tokas",
    "furious",
    {
      action: "burnt the Main Hall",
      turn: state.worldTurn,
      severity: "severe",
      forgiven: false,
    },
    {
      type: "seek_restitution",
      description: "Hokas has sent word to the Sheriff and is demanding 50 gold in repairs.",
      targetPlayerId: playerId,
      resolvedBy: "pay_50_gold_or_complete_timber_run",
      active: true,
    },
    `Hokas slams a scorched mug on the bar. "Thou hast some nerve showing thy face in here. Fifty gold for the damages — NOW — or I call the Sheriff this instant."`
  );

  // Add bounty
  newState = addBounty(newState, 50);

  // Add active event — Sheriff is alerted
  newState = {
    ...newState,
    activeEvents: [
      ...newState.activeEvents,
      {
        id: "sheriff_alerted",
        description: "The Sheriff has been notified of the Main Hall fire. Guards are asking questions.",
        affectedRooms: ["main_hall", "guild_courtyard", "notice_board"],
        turnsRemaining: null,
        resolvedBy: "pay_fine_or_serve_prison",
      },
    ],
  };

  // Chronicle it
  newState = addToChronicle(
    newState,
    `${state.player.name} set fire to the Main Hall of the Guild of Free Adventurers.`,
    true
  );

  // Hit reputation hard
  newState = updatePlayerReputation(newState, -15);

  return newState;
}