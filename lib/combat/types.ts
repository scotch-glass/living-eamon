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
  | "marked_by_set"     // Next enemy strike +15 accuracy (POWER:Smelled By Set → on self)
  // ── Sprint 7b.B — Bless ──
  | "blessed"           // Poison + bleed resistance; temp Illumination/CHA buff active
  // ── Sprint 7b.cunning — Cunning / Feeblemind ──
  | "cunning"           // Caster's spells +33% strength and +33% success chance
  | "feeblemind"        // Target's spells -33% strength and -33% success chance
  // ── Sprint 7b.buffs ──
  | "protection_aura"   // Defender takes 25% less damage per severity
  | "reactive_armor"    // Defender reflects 20% of incoming damage per severity
  | "night_sight"       // Player can see in dark rooms; no combat effect
  | "weakened"          // Attacker deals 20% less damage per severity
  | "clumsied"          // Attacker is easier to evade (+15 evasion on defender per severity)
  | "cursed"            // Attacker accuracy reduced (-10 evasion chance vs defender per severity)
  | "paralyzed"         // Combatant skips all actions while active
  // ── Sprint C6.1 Stage B (combat spell handlers) ──
  | "power_boon"        // POWER (Augury) — randomized boon flavour buff
  | "haste_extra_action"// HASTE (Circle 2) — explicit free-action boon (distinct from "haste" +DEX buff)
  | "ward"              // WARD — woven barrier; +8 effective armor for the duration
  | "steelskin"         // STEELSKIN — first physical hit halved; consumed on first strike
  | "silenced"          // SILENCE — target's casting interrupted; next turn cast fizzles
  | "resist_elemental"; // RESIST — half elemental damage for the duration

export interface ActiveStatusEffect {
  type: StatusEffectType;
  zone: BodyZone;
  severity: number;         // 1-3, affects magnitude
  turnsRemaining: number;   // -1 = until healed
  damagePerTurn?: number;    // For bleed/poison-type effects (HP per tick)
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

/**
 * Gender — used by the narrative pipeline to pick correct pronouns
 * ("he/his/himself" vs "she/her/herself"). In Robert E. Howard's canon
 * (the locked Living Eamon corpus), characters are male or female: no
 * "they/them" generics, no neuter pronouns. Every combatant declares one.
 *
 * Default at the type-fill layer is "male" (matches the Howard-canon
 * hero baseline + the bulk of NPC entries); per-NPC overrides go on the
 * NPC registry (see lib/gameData.ts). The hero pulls gender from
 * PlayerState.gender.
 */
export type Gender = "male" | "female";

/**
 * Resolved pronoun set for narrative templates. Read off `c.gender` via
 * `pronounsFor(gender)`.
 *
 *  - `subject`   — "He" / "She"   (sentence start, capitalized)
 *  - `subjectLc` — "he" / "she"   (mid-sentence)
 *  - `object`    — "him" / "her"
 *  - `possessive`— "his" / "her"  (adjective: "his sword")
 *  - `possessivePronoun` — "his" / "hers" (standalone: "the sword is his")
 *  - `reflexive` — "himself" / "herself"
 */
export interface Pronouns {
  subject: "He" | "She";
  subjectLc: "he" | "she";
  object: "him" | "her";
  possessive: "his" | "her";
  possessivePronoun: "his" | "hers";
  reflexive: "himself" | "herself";
}

/** Returns the pronoun set for a gender. Pure; no allocation per-call
 *  beyond the literal record. */
export function pronounsFor(gender: Gender): Pronouns {
  if (gender === "female") {
    return {
      subject: "She",
      subjectLc: "she",
      object: "her",
      possessive: "her",
      possessivePronoun: "hers",
      reflexive: "herself",
    };
  }
  return {
    subject: "He",
    subjectLc: "he",
    object: "him",
    possessive: "his",
    possessivePronoun: "his",
    reflexive: "himself",
  };
}

/**
 * One-line PICSSI subset that combat actually consults. The full PICSSI
 * profile lives on PlayerState; we copy only the two dimensions combat
 * cares about onto each combatant so the engine doesn't reach back into
 * world state mid-fight.
 *
 * - `courage`  — used by C5 flee checks (deferred). Carried for forward-compat.
 * - `spirituality` — scales HEAL output per KARMA_SYSTEM.md §2.1.
 *
 * NPC combatants get policy defaults (courage 30, spirituality 0) unless
 * the NPC entry overrides.
 */
export interface CombatantPicssi {
  courage: number;
  spirituality: number;
}

/** A consumable an NPC combatant can {@link CombatAction.use} during their
 *  turn (potions, bandages). The hero pulls equivalents from PlayerState.
 *  Mirrored on the player combatant for symmetry so AI / engine code can
 *  treat all combatants the same. */
export interface CombatantInventoryEntry {
  itemId: string;
  quantity: number;
}

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
  // ── Sprint C1: multi-combatant fields ───────────────────────────────
  /**
   * Team affiliation. Symmetric with `side` today (ally = "ally" team,
   * enemy = "enemy" team) but kept as a separate field so future "third
   * faction" scenarios (mercenary, neutral) don't have to overload `side`.
   */
  team: "ally" | "enemy";
  /** "player" = the human at the keyboard picks this combatant's actions
   *  (hero + recruited allies). "ai" = engine picks via npcAi. */
  controlledBy: "player" | "ai";
  /** NPC registry id, or null for the player's hero. */
  npcId: string | null;
  /** Current and max mana. Hero pulls from PlayerState; NPCs from their
   *  registry entry. Combatants without spells run mana = maxMana = 0. */
  mana: number;
  maxMana: number;
  /** Spells the combatant has learned (uppercase canonical names — "HEAL",
   *  "BLAST", etc). Used together with `combatHotbar` to gate AI choices
   *  and surface spell icons in the UI. */
  knownSpells: string[];
  /** Up to 6 spell ids selected for combat quick-access. Both AI and UI
   *  pick from this set rather than the full `knownSpells` so combat
   *  remains snappy with a large spellbook. */
  combatHotbar: string[];
  /** Consumable inventory available mid-fight. Each USE action decrements
   *  `quantity`; entries at 0 are filtered. */
  inventory: CombatantInventoryEntry[];
  /** Subset of PICSSI virtues consulted during combat. See {@link CombatantPicssi}. */
  picssi: CombatantPicssi;
  /** Gender — drives pronoun selection in narrative templates. Required.
   *  Howard-canon corpus is binary: every combatant is "male" or "female". */
  gender: Gender;
  // ── Sprint C3: channeling + interruption ─────────────────────────────
  /**
   * Set when this combatant is mid-cast on a multi-turn (Circle 4+) spell.
   * Each time `currentTurnIdx` lands on this combatant, `turnsRemaining`
   * decrements; when it hits 0 the spell fires and this clears to null.
   * `null` for one-shot casts and idle combatants. Mana was already
   * deducted at channel start — never refunded on interrupt.
   */
  channelingState: {
    /** Canonical UPPERCASE spell name (matches SPELL_DATA keys). */
    spellName: string;
    /** Combatant id that gets the spell when it fires. */
    targetId: string;
    /** Turns left BEFORE the spell fires. 1 = fires this combatant's
     *  next turn; on a 3-turn cast this starts at 2 after the channel
     *  begins on turn 1. */
    turnsRemaining: number;
  } | null;
  /**
   * Set for exactly one of this combatant's turns after they take a
   * cast-interrupting hit. When set:
   *   - Any in-flight `channelingState` breaks at the start of their
   *     turn (mana stays gone, narrative emits "spell shatters").
   *   - Any new CAST attempt that turn fails before mana is deducted.
   * Cleared at the END of the affected combatant's turn.
   *
   * Carries the *cause* (not just a boolean) so the fizzle / shatter
   * narration can surface the reason — "voice cracks due to the gash
   * at the throat" rather than the unexplained "voice cracks." `null`
   * when the combatant has not just been interrupted.
   */
  interruptedSinceLastTurn: InterruptReason | null;
}

/**
 * Reason a combatant's cast-this-turn / in-flight channel was broken.
 * Set in `applyStrike` (or `addStatusEffect` for `silenced`) and
 * consumed by `resolveAction` (cast fizzle) and `resolveChannelStep`
 * (channel shatter) to render reason-aware narration.
 */
export type InterruptReason =
  /** A critical hit landed on this combatant; the shock broke concentration.
   *  `zone` is the body zone that took the crit, used to render
   *  "the wound to the head / neck / body / limb" in narration. */
  | { kind: "critical_hit"; zone: BodyZone }
  /** Throat artery cut — the caster cannot draw breath to shape a Word. */
  | { kind: "severed_artery" }
  /** Windpipe crushed — same effect, different injury. */
  | { kind: "crushed_windpipe" }
  /** Silencing magic laid on the caster (future-proofed; no spell currently
   *  emits this). When the first silencing spell ships, `addStatusEffect`
   *  sets this kind on apply. */
  | { kind: "silenced" };

// ── Strike Resolution ───────────────────────────────────────

export interface StrikeResolution {
  targetZone: BodyZone;
  evaded: boolean;
  blocked: boolean;              // Shield block
  armorStopped: boolean;         // Zone armor stopped it
  armorDamaged: number;          // Durability lost on armor
  armorBroken: boolean;          // Armor piece destroyed
  damageDealt: number;           // Final HP damage
  reflectedDamage: number;       // HP reflected back to attacker (reactive_armor); 0 if none
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
  /**
   * Hero's combatant. Sprint C1 keeps this as a top-level reference for
   * back-compat with ~180 callsites that read `session.playerCombatant`
   * directly. Sprint C3 replaces these with `combatants.find(c => c.controlledBy === "player")`
   * and deletes this field. Until then, `combatants` and `playerCombatant` /
   * `enemyCombatant` are kept in sync at every mutation boundary.
   */
  playerCombatant: CombatantState;
  /** Main enemy combatant (back-compat — see {@link playerCombatant}). */
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
  // ── Sprint C1: multi-combatant fields ─────────────────────────────────
  /**
   * Canonical combatant array — every combatant in the fight, in arbitrary
   * order. Today: always `[playerCombatant, enemyCombatant]` for 1v1 fights.
   * Sprint C3 lights up multi-combatant fights using this array.
   */
  combatants: CombatantState[];
  /**
   * Initiative order — combatant ids in turn order for the current round.
   * Re-rolled at the start of every round (Sprint C3 wires the re-roll;
   * Sprint C1 leaves it as a single ordering fixed at session init).
   */
  turnOrder: string[];
  /** Index into `turnOrder` of the actor whose turn it currently is. */
  currentTurnIdx: number;
  /**
   * Optional scene-art URL rendered behind the combat lanes. Used by the
   * production CombatScreen to show the encounter's environment (e.g. the
   * ancient-ruin background for the canonical Sprint C8 ambush). `undefined`
   * for the legacy 1v1 path — the UI falls back to a CSS gradient.
   */
  backgroundUrl?: string;
}

/** Build a fresh `combatants` / `turnOrder` triple from a 1v1
 *  player-vs-enemy pair. Used by `initCombatSession` and by the migration
 *  to repopulate Sprint C1 fields from older 1v1 session blobs. */
export function makeMultiCombatantFields(
  player: CombatantState,
  enemy: CombatantState,
): Pick<ActiveCombatSession, "combatants" | "turnOrder" | "currentTurnIdx"> {
  return {
    combatants: [player, enemy],
    turnOrder: [player.id, enemy.id], // initiative re-rolled in Sprint C3
    currentTurnIdx: 0,
  };
}

/** Mirror the top-level `playerCombatant` / `enemyCombatant` fields into
 *  the `combatants` array. Call this before serializing or returning a
 *  session that mutated either field directly. Sprint C1 back-compat
 *  helper; deleted in Sprint C3 when the array becomes the source of
 *  truth. */
export function syncCombatantArray(session: ActiveCombatSession): ActiveCombatSession {
  return {
    ...session,
    combatants: [session.playerCombatant, session.enemyCombatant],
    turnOrder: session.turnOrder && session.turnOrder.length > 0
      ? session.turnOrder
      : [session.playerCombatant.id, session.enemyCombatant.id],
  };
}

/** Fill Sprint C1 fields on a CombatantState that's missing them — either
 *  serialized before C1 shipped (DB migration) or built as a test literal.
 *  Idempotent: passing in a fully-populated combatant returns it
 *  unchanged. Exported so tests can keep using minimal CombatantState
 *  literals: `fillCombatantDefaults({ id, name, side: "ally", ... })`. */
export function fillCombatantDefaults(c: Partial<CombatantState> & Pick<CombatantState, "id" | "name" | "side">): CombatantState {
  // Treat ally side as player-controlled hero by default; enemy as AI.
  const team: "ally" | "enemy" = c.team ?? c.side ?? "ally";
  const controlledBy: "player" | "ai" = c.controlledBy ?? (team === "ally" ? "player" : "ai");
  return {
    id: c.id,
    name: c.name,
    hp: c.hp ?? 0,
    maxHp: c.maxHp ?? 0,
    zones: c.zones ?? createEmptyBodyArmorMap(),
    activeEffects: c.activeEffects ?? [],
    shieldItemId: c.shieldItemId ?? null,
    shieldBlockChance: c.shieldBlockChance ?? 0,
    shieldDurability: c.shieldDurability ?? 0,
    shieldMaxDurability: c.shieldMaxDurability ?? 0,
    weaponId: c.weaponId ?? "unarmed",
    droppedWeaponId: c.droppedWeaponId ?? null,
    weaponSkillValue: c.weaponSkillValue ?? 0,
    dexterity: c.dexterity ?? 10,
    strength: c.strength ?? 10,
    agility: c.agility ?? 10,
    fatigueTier: c.fatigueTier,
    side: c.side,
    position: c.position ?? 1,
    team,
    controlledBy,
    npcId: c.npcId ?? (team === "enemy" ? c.id : null),
    mana: c.mana ?? 0,
    maxMana: c.maxMana ?? 0,
    knownSpells: c.knownSpells ?? [],
    combatHotbar: c.combatHotbar ?? (c.knownSpells ?? []).slice(0, 6),
    inventory: c.inventory ?? [],
    picssi: c.picssi ?? { courage: 0, spirituality: 0 },
    // Sprint C3: default to no in-flight cast and no recent interrupt.
    channelingState: c.channelingState ?? null,
    interruptedSinceLastTurn: c.interruptedSinceLastTurn ?? null,
    // Howard-canon default: male. Per-NPC overrides (Vivian, bandit_witch,
    // any future female combatant) come from the NPC registry through
    // buildCombatantFromNPC. Hero pulls from PlayerState.gender.
    gender: c.gender ?? "male",
  };
}

/**
 * Migrate a raw `active_combat` JSONB blob from the database into a fully-
 * typed `ActiveCombatSession`. Idempotent — sessions written after Sprint
 * C1 already carry every field and pass through unchanged. Sessions
 * persisted before C1 are missing the multi-combatant fields; this helper
 * synthesizes them from `playerCombatant` / `enemyCombatant`.
 *
 * Returns null if the input doesn't look like a session at all (so callers
 * can keep their existing null-checks).
 */
export function migrateActiveCombatSession(raw: unknown): ActiveCombatSession | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<ActiveCombatSession> & { playerCombatant?: Partial<CombatantState>; enemyCombatant?: Partial<CombatantState> };
  if (!r.playerCombatant || !r.enemyCombatant) return null;

  const player = fillCombatantDefaults(r.playerCombatant as Partial<CombatantState> & Pick<CombatantState, "id" | "name" | "side">);
  const enemy = fillCombatantDefaults(r.enemyCombatant as Partial<CombatantState> & Pick<CombatantState, "id" | "name" | "side">);

  // If `combatants` / `turnOrder` are present, map their ids to the freshly
  // migrated combatants so any spread-by-reference inside the array also
  // benefits from the fill-in. Otherwise synthesize from the pair.
  const synthesized = makeMultiCombatantFields(player, enemy);

  return {
    enemyNpcId: r.enemyNpcId ?? "",
    enemyName: r.enemyName ?? enemy.name,
    roundNumber: r.roundNumber ?? 0,
    playerCombatant: player,
    enemyCombatant: enemy,
    combatLog: r.combatLog ?? [],
    finished: Boolean(r.finished),
    playerWon: r.playerWon ?? null,
    barriers: r.barriers ?? [],
    combatants: synthesized.combatants,
    turnOrder: r.turnOrder && r.turnOrder.length > 0 ? r.turnOrder : synthesized.turnOrder,
    currentTurnIdx: r.currentTurnIdx ?? synthesized.currentTurnIdx,
  };
}

// ── NPC Combat Profile (optional on NPC definition) ─────────

export interface NPCCombatProfile {
  agility: number;               // 0-100, evasion
  weaponSkill: number;           // 0-100, AI targeting intelligence
  zones: Record<BodyZone, { cover: number; durability: number }>;
  shieldBlockChance: number;     // 0-100, 0 if no shield
  shieldDurability: number;
}
