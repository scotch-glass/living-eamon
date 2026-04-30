// ============================================================
// LIVING EAMON — Sorcery types (KARMA Sprint 7)
//
// The Occult / INVOKE system. See SORCERY.md (canonical) for the
// design narrative + the Eight Circles + per-circle Illumination
// cost mapping.
//
// Living Eamon's runic vocabulary is its own — Latin-rooted,
// compositional ("intensifier + element"). The mana costs, reagent
// combinations, and 8-Circle structure follow classic-RPG
// conventions; the specific Words of Power are original Living
// Eamon authoring per the directive on 2026-04-30.
// ============================================================

/** The Eight Circles of Occult Magic, mana cost ordered. */
export type Circle = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Reagent item IDs. Match existing inventory items in lib/gameData.ts:
 * mandrake_root, black_pearl, nightshade, ginseng, blood_moss,
 * spider_silk, garlic, sulfurous_ash.
 */
export type ReagentId =
  | "black_pearl"
  | "blood_moss"
  | "garlic"
  | "ginseng"
  | "mandrake_root"
  | "nightshade"
  | "spider_silk"
  | "sulfurous_ash";

/**
 * High-level effect classification. Sprint 7a uses this for
 * narrative dispatch only (chronicle entry describing the effect).
 * Sprint 7b will implement actual numeric effects per kind.
 */
export type SpellEffectKind =
  | "damage"
  | "heal"
  | "buff"
  | "debuff"
  | "summon"
  | "movement"
  | "field"
  | "reveal"
  | "conceal"
  | "transform"
  | "utility";

export interface Spell {
  /** Stable internal ID, kebab-case. Use for code references + tests. */
  id: string;
  /** Player-facing name, English. */
  name: string;
  /** Eight Circles. Determines mana cost + Illumination drain magnitude. */
  circle: Circle;
  /**
   * Words of Power as a token sequence. Player invokes by typing
   * `INVOKE <word1> <word2> ...`. Tokens are matched case-insensitively
   * but order matters (the runic grammar is compositional).
   */
  words: string[];
  /** Mana cost. Follows classic mana-cost progression per circle. */
  manaCost: number;
  /** Reagents consumed on successful cast (and on resource-burning fizzle). */
  reagents: ReagentId[];
  /**
   * Direct Illumination delta on cast. Negative for soul-darkening
   * spells (Circles 4+). 0 for Circles 1-3 (which deliver narrative
   * warnings instead — see SORCERY.md §7).
   */
  illuminationDrain: number;
  /** Effect classification (for narrative dispatch in Sprint 7a). */
  effectKind: SpellEffectKind;
  /** One-line description; used in chronicle entries on cast. */
  description: string;
}

/**
 * Per-circle Illumination drain magnitudes. Source: SORCERY.md §7.
 * Circles 1-3 = 0 (narrative warnings only); Circle 4+ darkens
 * the soul logarithmically.
 */
export const CIRCLE_ILLUMINATION_DRAIN: Record<Circle, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: -2,
  5: -4,
  6: -8,
  7: -15,
  8: -30,
};

/**
 * Per-circle base mana cost. Source: SORCERY.md §6.
 */
export const CIRCLE_MANA_COST: Record<Circle, number> = {
  1: 4,
  2: 6,
  3: 9,
  4: 11,
  5: 14,
  6: 20,
  7: 40,
  8: 50,
};

/**
 * Narrative warning lines for Circles 1-3 — fire on cast even
 * though Illumination doesn't move directly. Per SORCERY.md §7.
 */
export const CIRCLE_NARRATIVE_WARNING: Partial<Record<Circle, string>> = {
  2: "A draft moves through the room that no door admits. This feels dark in subtle ways.",
  3: "The hairs on the back of your neck lift. A dark presence is near, watching.",
};

/**
 * Outcome of an INVOKE attempt — engine returns one of these so
 * the gameEngine.ts handler can compose the static response.
 */
export type InvokeOutcome =
  | { kind: "unrecognized" }                      // not a known spell — falls through to Jane
  | { kind: "circle-locked"; spell: Spell }       // spell known, circle not yet revealed
  | { kind: "insufficient-mana"; spell: Spell; need: number; have: number }
  | { kind: "missing-reagents"; spell: Spell; missing: ReagentId[] }
  | { kind: "fizzle-no-reagents"; words: string[] } // attempted unknown invocation without any reagents
  | { kind: "success"; spell: Spell; illuminationDrained: number; warning: string | null };
