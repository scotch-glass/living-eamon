// ============================================================
// LIVING EAMON — Combat spell metadata (Sprint C3, locked 2026-05-06)
//
// Single canonical source for combat-relevant spell numbers:
//   - manaCost   — what `resolveCombatSpell` deducts up front
//   - castSpeed  — fed into `effectiveCombatSpeed` for initiative
//   - castTurns  — 1 = one-shot, 2-3 = multi-turn channel
//   - circle     — sorcery circle (1..8); also drives Illumination delta
//
// Replaces the inline `SPELL_MANA_COST` table that used to live in
// engine.ts. The engine + npcAi + UI all consult this module via the
// public helpers below.
//
// Speed scale is the same 1..10 used by WEAPON_DATA.weaponSpeed in
// `lib/uoData.ts` (1 = fastest, 10 = slowest). Lower wins initiative.
//
// Per-circle locked values (Scotch 2026-05-06):
//   Circle 1 → castSpeed 2,  castTurns 1   (matches short sword — fastest)
//   Circle 2 → castSpeed 3,  castTurns 1   (matches long sword)
//   Circle 3 → castSpeed 4,  castTurns 1
//   Circle 4 → castSpeed 6,  castTurns 2   (commit; turn-2 release at short-sword tempo)
//   Circle 5 → castSpeed 7,  castTurns 2
//   Circle 6 → castSpeed 8,  castTurns 2   (matches great sword)
//   Circle 7 → castSpeed 9,  castTurns 3
//   Circle 8 → castSpeed 10, castTurns 3   (slowest, devastating)
// ============================================================

export type SpellCircle = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type CastTurns   = 1 | 2 | 3;

export interface SpellCombatMetadata {
  manaCost: number;
  castSpeed: number;   // 1..10, fed into effectiveCombatSpeed
  castTurns: CastTurns;
  circle: SpellCircle;
}

// Initial population — every spell currently wired into the combat
// engine. All Circle 1..3 (one-shot), keeping the existing speed bands.
// Circle 4..8 entries land here as their corresponding sorcery spells
// arrive in `lib/sorcery/registry.ts`.
//
// Keys are canonical UPPERCASE spell names matching `combatHotbar`
// entries on combatants and the existing `resolveCombatSpell` switch.
export const SPELL_DATA: Record<string, SpellCombatMetadata> = {
  // ── Circle 1 ──
  HEAL:           { manaCost: 4, castSpeed: 2, castTurns: 1, circle: 1 },
  BLAST:          { manaCost: 6, castSpeed: 2, castTurns: 1, circle: 1 },
  SPEED:          { manaCost: 3, castSpeed: 2, castTurns: 1, circle: 1 },
  // ── Circle 2 ──
  "GREATER-HEAL": { manaCost: 8, castSpeed: 3, castTurns: 1, circle: 2 },
  FIREBOLT:       { manaCost: 6, castSpeed: 3, castTurns: 1, circle: 2 },
  HASTE:          { manaCost: 4, castSpeed: 3, castTurns: 1, circle: 2 },
  WARD:           { manaCost: 5, castSpeed: 3, castTurns: 1, circle: 2 },
  STEELSKIN:      { manaCost: 5, castSpeed: 3, castTurns: 1, circle: 2 },
  SILENCE:        { manaCost: 4, castSpeed: 3, castTurns: 1, circle: 2 },
  RESIST:         { manaCost: 4, castSpeed: 3, castTurns: 1, circle: 2 },
  CLEANSE:        { manaCost: 4, castSpeed: 3, castTurns: 1, circle: 2 },
  // POWER, DAYLIGHT, MIRROR, BANISH, INVOKE-LIGHT removed 2026-05-09 —
  // each had a blocker (no functional read of their effect type).
};

/** Resolve a spell name (any case) to its combat metadata, or null when
 *  the spell isn't combat-registered. AI / UI / engine all use this
 *  one lookup so behavior stays consistent. */
export function getSpellData(spellName: string): SpellCombatMetadata | null {
  return SPELL_DATA[spellName.toUpperCase()] ?? null;
}

/** Mana cost or null when the spell isn't combat-registered. Out-of-
 *  combat-only spells (LIGHT, scrying, etc.) aren't in the table. */
export function getSpellManaCost(spellName: string): number | null {
  return getSpellData(spellName)?.manaCost ?? null;
}

/** Cast speed (1..10). Returns 0 when the spell isn't registered so
 *  empty hotbars contribute zero to `effectiveCombatSpeed`. */
export function getSpellCastSpeed(spellName: string): number {
  return getSpellData(spellName)?.castSpeed ?? 0;
}

/** Cast turns (1..3). Defaults to 1 when unregistered (fail open —
 *  unknown spells don't accidentally start a multi-turn channel). */
export function getSpellCastTurns(spellName: string): CastTurns {
  return getSpellData(spellName)?.castTurns ?? 1;
}

/** Sorcery Circle (1..8) the spell belongs to, or null when unregistered. */
export function getSpellCircle(spellName: string): SpellCircle | null {
  return getSpellData(spellName)?.circle ?? null;
}

/** Set of all canonically-registered combat spell names (uppercase).
 *  Used by `isCombatSpell()` in engine.ts. */
export const SUPPORTED_COMBAT_SPELLS: ReadonlySet<string> = new Set(Object.keys(SPELL_DATA));

/** True when `spellName` is a registered combat spell (case-insensitive). */
export function isCombatSpell(spellName: string): boolean {
  return SUPPORTED_COMBAT_SPELLS.has(spellName.toUpperCase());
}

/**
 * Spells that have a real `case` branch in `applyCombatSpellEffect`
 * (lib/combat/engine.ts:1041–1226). Casting a spell NOT in this set
 * burns mana and emits a "(effect deferred)" placeholder narrative
 * with no mechanical effect — so the Spellbook UI surfaces it as
 * "not yet" rather than "ready".
 *
 * KEEP IN SYNC with the case list in `applyCombatSpellEffect`. The
 * `combat-ready.test.ts` suite asserts cardinality + that every member
 * is also in `SUPPORTED_COMBAT_SPELLS` so drift is caught early.
 */
export const COMBAT_HANDLER_SPELLS: ReadonlySet<string> = new Set([
  "HEAL",
  "BLAST",
  "SPEED",
  "GREATER-HEAL",
  "FIREBOLT",
  "HASTE",
  "WARD",
  "STEELSKIN",
  "SILENCE",
  "RESIST",
  "CLEANSE",
]);

/** True when the spell has a real engine handler (will land mechanical
 *  effects on cast). The Spellbook's READY badge keys off this. */
export function hasCombatHandler(spellName: string): boolean {
  return COMBAT_HANDLER_SPELLS.has(spellName.toUpperCase());
}

/**
 * Spells that cause damage or otherwise harm the target. Used by both
 * the engine (to refuse ally→ally hostile actions) and the dev page (to
 * filter the target dropdown to opposing-team only when the chosen
 * spell is offensive).
 *
 * Keep this list aligned with `lib/npcAi.ts`'s OFFENSIVE_SPELLS — both
 * are downstream of the same locked design table.
 */
export const OFFENSIVE_SPELLS: ReadonlySet<string> = new Set([
  "BLAST",
  "FIREBOLT",
]);

/** True when `spellName` is registered AND its target receives damage /
 *  hostile effect. Case-insensitive. */
export function isOffensiveSpell(spellName: string): boolean {
  return OFFENSIVE_SPELLS.has(spellName.toUpperCase());
}
