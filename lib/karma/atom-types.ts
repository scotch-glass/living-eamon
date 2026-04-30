// ============================================================
// LIVING EAMON — Encounter atom types (canonical source)
//
// The encounter atom is the building block of the karma /
// affect / pacing system. Each atom is authored once as a JSON
// file in `scripts/balance/library/<id>.json`, validated against
// these types, and consumed at:
//   - design-time by `scripts/balance/simulator.ts` (coverage audit)
//   - runtime by `lib/karma/loader.ts` + `triggers.ts` + `resolve.ts`
//     (KARMA Sprint 4 — atoms fire on game events, present choices,
//     apply karma deltas)
//
// CANONICAL SOURCE: this file. `scripts/balance/types.ts` is a thin
// re-export for backward compatibility with the simulator's import
// path.
//
// Atom virtues use CapitalCase ("Passion", "Integrity") matching the
// authored JSON. Runtime PICSSI uses lowercase. The translation
// happens at the resolve layer (`lib/karma/resolve.ts:applyChoice`),
// so neither the atoms nor the runtime karma code ever sees the
// other's casing.
// ============================================================

// ── KARMA ───────────────────────────────────────────────────
//
// The six PICSSI virtues, atom-side (CapitalCase). Each delta is
// the magnitude of the karmic shift applied when a player chooses
// this branch. Convention: small choices ±1, medium ±3, life-
// defining ±5+. Zero / undefined = no movement on that virtue.
//
// `AtomKarmaDelta` is named to avoid collision with the lowercase
// `KarmaDelta` exported from `lib/karma/types.ts` (PICSSI runtime).

export type Virtue =
  | "Passion"
  | "Integrity"
  | "Courage"
  | "Standing"        // formerly "Strength" — renamed 2026-04-28 to disambiguate from physical STR
  | "Spirituality"
  | "Illumination";

export type AtomKarmaDelta = Partial<Record<Virtue, number>>;

// ── AFFECT ──────────────────────────────────────────────────
//
// The player's experiential / emotional response to the
// encounter, scored 0–1 per axis. Used by the simulator to
// produce an affective curve across an adventure and by the
// generator to enforce textural variety (no all-fear runs,
// no monotone-eros runs, etc.).
//
// fear        — visceral threat-response (combat, monsters)
// excitement  — heightened arousal of any kind (chases, finds)
// eros        — sexual frisson (R-rated tone)
// dread       — slow-burn unease (cosmic, occult, decay)
// awe         — overwhelming scale / beauty (palaces, vistas)
// wonder      — curiosity-pleasure (mysteries, marvels)
// melancholy  — bittersweet weight (loss, ruin, regret)

export type AffectAxis =
  | "fear"
  | "excitement"
  | "eros"
  | "dread"
  | "awe"
  | "wonder"
  | "melancholy";

export type AffectVector = Partial<Record<AffectAxis, number>>;

// ── PROVENANCE / IP ─────────────────────────────────────────
//
// Tag every atom with its public-domain source so the generator
// can guarantee Safe Harbor compliance — see Public_Domain_Rules.md.
// `original-living-eamon` = wholly original game content (no
// PD source); always pdSafe: true.

export type PDSource =
  | "hyborian-age-essay"        // Howard, 1936 — confirmed PD
  | "kull-thurian-stories"      // 3 Thurian-Age stories, 1929-1930
  | "phantagraph-poems"          // 2 poems, 1936/1940
  | "the-stag-company"           // LE-original mercenary arc set
  | "original-living-eamon";     // wholly original content

// ── PATTERN TYPES ───────────────────────────────────────────
//
// Each encounter fits one of these structural patterns. The
// generator uses pattern type to balance variety across an
// adventure (don't fill every slot with moral-forks).

export type PatternType =
  | "moral-fork"          // binary, two paths, opposing karma
  | "graduated-test"      // three escalating offers, scaling stakes
  | "witness-moment"      // observe-only; karma shifts by bearing
  | "artifact-dilemma"    // found object with karmic strings attached
  | "slow-pressure"       // repeated small choices over many turns
  | "sacred-vs-profane";  // forced opposition between two virtues

// ── PACING ──────────────────────────────────────────────────

export type Duration = "instant" | "short" | "medium" | "long";
// instant = 0 turns, short ≈ 2, medium ≈ 5, long ≈ 10+

// ── TRIGGERS & PREREQUISITES ────────────────────────────────

export interface TriggerSpec {
  type: "enter-room" | "talk-to-npc" | "examine-object" | "turn-count" | "manual";
  target?: string;                 // room id, npc id, object id, or turn number
}

export interface PrerequisiteSpec {
  type: "hp-min" | "gold-min" | "has-item" | "lacks-item" | "karma-min" | "karma-max" | "flag-set" | "flag-unset";
  value: number | string;
  virtue?: Virtue;                 // only used with karma-min / karma-max
}

// ── CHOICE ──────────────────────────────────────────────────
//
// A single branch the player can take in this encounter.
// The karma + affect deltas ARE the design surface — the
// simulator reads these to compute coverage and curves.

export interface Choice {
  id: string;                      // stable id within the encounter
  label: string;                   // designer-facing description (not player text)
  command?: string;                // game-engine command this maps to (e.g., "BUY DRINK")

  karma: AtomKarmaDelta;               // PICSSI shifts
  affect: AffectVector;            // affective delta from encounter baseline

  /** Per-NPC affection deltas. Recurring allies (Vivian first, others later)
   *  carry a hidden 0-100 affection meter that drives gift-giving, recurring
   *  encounter unlocks, eros progression, and grief reach when they die.
   *  Map: npcId → delta. Affection is independent of karma — a high-Integrity
   *  hero may have low Vivian-affection if he keeps refusing her company. */
  npcAffection?: Record<string, number>;

  // Mechanical effects (optional — for cross-validation against game state)
  goldDelta?: number;
  hpDelta?: number;
  itemsGained?: string[];
  itemsLost?: string[];
  flagsSet?: string[];             // chronicle / quest flags this sets

  resolutionHint: string;          // one-line designer note describing the outcome
}

// ── ENCOUNTER ───────────────────────────────────────────────

export interface Encounter {
  id: string;                      // stable kebab-case id
  title: string;                   // designer-facing name (never shown to player)

  pdSource: PDSource;
  pdSafe: boolean;                 // explicit Safe Harbor tag

  patternType: PatternType;
  tags: string[];                  // freeform: "tavern", "mountain", "spirit-encounter"

  triggers: TriggerSpec[];
  prerequisites?: PrerequisiteSpec[];

  // Designer prose anchor — Howard-voice draft of the situation.
  // The polish phase replaces this with finished prose; the generator
  // uses it as a starting point.
  prompt: string;

  // Baseline affective tone of the encounter BEFORE a choice is made.
  // The choice's affect delta modulates this baseline.
  pacing: {
    duration: Duration;
    affect: AffectVector;          // baseline mood
  };

  choices: Choice[];               // 1+ branches
}

// ── LIBRARY-LEVEL HELPERS ───────────────────────────────────

/** Aggregate karma reachable from this encounter — max gain & max loss
 *  per virtue across all choices. Used by the coverage matrix. */
export function encounterKarmaReach(enc: Encounter): {
  maxGain: AtomKarmaDelta;
  maxLoss: AtomKarmaDelta;
} {
  const maxGain: AtomKarmaDelta = {};
  const maxLoss: AtomKarmaDelta = {};
  for (const c of enc.choices) {
    for (const [virtue, delta] of Object.entries(c.karma) as [Virtue, number][]) {
      if (delta > 0) {
        maxGain[virtue] = Math.max(maxGain[virtue] ?? 0, delta);
      } else if (delta < 0) {
        maxLoss[virtue] = Math.min(maxLoss[virtue] ?? 0, delta);
      }
    }
  }
  return { maxGain, maxLoss };
}

/** Aggregate affective range — max value reachable on each axis when
 *  baseline + best/worst choice delta are combined. */
export function encounterAffectReach(enc: Encounter): {
  max: AffectVector;
  min: AffectVector;
} {
  const max: AffectVector = { ...enc.pacing.affect };
  const min: AffectVector = { ...enc.pacing.affect };
  for (const c of enc.choices) {
    for (const [axis, delta] of Object.entries(c.affect) as [AffectAxis, number][]) {
      const baseline = enc.pacing.affect[axis] ?? 0;
      const total = Math.max(0, Math.min(1, baseline + delta));
      max[axis] = Math.max(max[axis] ?? 0, total);
      min[axis] = Math.min(min[axis] ?? 1, total);
    }
  }
  return { max, min };
}

// ── ADVENTURE TEMPLATE (skeleton — fully designed in Phase 2) ──
//
// Templates declare the SHAPE of an adventure: how many slots,
// what coverage targets, what affective curve. The generator
// fills slots from the encounter library.

export interface AdventureTemplate {
  id: string;
  title: string;
  description: string;
  pdSource: PDSource;
  slotCount: number;               // how many encounters this adventure contains

  // Coverage targets — generator tries to hit these.
  karmaCoverageTarget: {
    requiredPositive: Virtue[];    // virtues that MUST be reachable upward
    requiredNegative: Virtue[];    // virtues that MUST be reachable downward
  };

  // Affective curve target — array of length slotCount, each value 0-1.
  // Generator picks encounters whose affect baseline matches these targets.
  affectCurveTarget: AffectVector[];

  // Optional: pattern variety constraint (no two consecutive moral-forks, etc.)
  patternConstraints?: {
    maxConsecutiveSamePattern?: number;
    requiredPatterns?: PatternType[];
  };
}
