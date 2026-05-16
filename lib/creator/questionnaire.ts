// ============================================================
// The 18-question wizard registry.
//
// Sections: Setting (4) · Conflict (4) · Mechanics (6) · Shape (4)
// Each option declares a WeightContribution; the generator
// (generateSkeleton.ts) sums them into a ModuleSkeleton.
//
// Plan §9.
// ============================================================

import { PD_ANCHORS } from "./pdAnchors";
import type { WizardOption, WizardQuestion } from "./skeletonTypes";

// PD anchor options derived from the registry
const PD_ANCHOR_OPTIONS: WizardOption[] = PD_ANCHORS.map((a) => ({
  id: a.id,
  label: a.title,
  description: a.blurb,
  contribution: {
    pdAnchor: a.id === "original" ? null : a.id,
    affect: a.affectBias,
  },
}));

// The "Other (custom)" option appended to every question except
// `pd-anchor` (its options are the anchor list), `location-anchor`
// (must map to a known travel node), and `length` (drives room
// count math — must be one of short/medium/long).
const OTHER_OPTION: WizardOption = {
  id: "other",
  label: "Other (custom)",
  description: "Free-text answer. Pre-filled with story-specific text when a PD anchor is chosen; edit freely.",
  customizable: true,
  contribution: {}, // no load contribution — flavor only
};

const QUESTIONS_WITHOUT_OTHER = new Set(["pd-anchor", "location-anchor", "length"]);

const RAW_QUESTIONNAIRE: WizardQuestion[] = [
  // ── SECTION A — SETTING ───────────────────────────────────
  {
    id: "pd-anchor",
    section: "setting",
    prompt: "Which Howard story is the inspiration?",
    helper: "Pre-fills naming defaults + AffectVector biases. Pick 'Original' to start fresh.",
    options: PD_ANCHOR_OPTIONS,
  },
  {
    id: "biome",
    section: "setting",
    prompt: "Where does the module take place?",
    options: [
      {
        id: "civilization",
        label: "Civilization (city, fortress, court)",
        contribution: { zones: ["civilization"], affect: { excitement: 0.1 } },
      },
      {
        id: "wilderness-temperate",
        label: "Temperate wilderness (forest, plains, river)",
        contribution: { zones: ["forest_valley", "plains"], affect: { wonder: 0.2 } },
      },
      {
        id: "mountain-or-desert",
        label: "Mountain or desert",
        contribution: { zones: ["mountain", "desert"], affect: { melancholy: 0.2, dread: 0.1 } },
      },
      {
        id: "jungle-or-lost",
        label: "Jungle, coast, or lost-lands",
        contribution: { zones: ["jungle_fringe", "lost_lands", "coastal_sea"], affect: { dread: 0.2, wonder: 0.2 } },
      },
    ],
  },
  {
    id: "civilization-status",
    section: "setting",
    prompt: "What's the state of the place?",
    options: [
      {
        id: "bustling",
        label: "Bustling, alive, populated",
        contribution: { affect: { excitement: 0.2 }, picssi: { standing: 1 } },
      },
      {
        id: "settled-quiet",
        label: "Settled but quiet",
        contribution: { affect: { melancholy: 0.1 } },
      },
      {
        id: "decaying",
        label: "Decaying, depopulating",
        contribution: { affect: { melancholy: 0.3, dread: 0.1 } },
      },
      {
        id: "abandoned",
        label: "Abandoned or ruined (formerly inhabited)",
        contribution: { affect: { wonder: 0.2, dread: 0.3 } },
      },
      {
        id: "wild-primordial",
        label: "Wild or primordial (never settled — animist, haunted)",
        contribution: {
          affect: { wonder: 0.3, dread: 0.3, melancholy: 0.1 },
          picssi: { spirituality: 1 },
        },
      },
    ],
  },
  {
    id: "location-anchor",
    section: "setting",
    prompt: "Which travel-node does the module anchor to?",
    helper: "Picks the locationId on the world map. Players reach the module from here.",
    options: [
      { id: "valus", label: "Valus (the hub city)", contribution: { locationId: "valus" } },
      { id: "city-vanara", label: "City of Vanara", contribution: { locationId: "city_vanara" } },
      { id: "city-kamula", label: "City of Kamula", contribution: { locationId: "city_kamula" } },
      { id: "city-stagus", label: "Stagus (River Styx)", contribution: { locationId: "city_stagus" } },
      { id: "poi-skull-of-silence", label: "Skull of Silence", contribution: { locationId: "poi_skull_of_silence" } },
      { id: "geo-lost-lands", label: "The Lost Lands", contribution: { locationId: "geo_lost_lands" } },
      { id: "geo-tiger-valley", label: "Tiger Valley (Atlantis)", contribution: { locationId: "geo_tiger_valley" } },
    ],
  },

  // ── SECTION B — CONFLICT SHAPE ────────────────────────────
  {
    id: "conflict-pattern",
    section: "conflict",
    prompt: "What is the shape of the conflict?",
    options: [
      {
        id: "heist",
        label: "Heist or infiltration",
        contribution: { picssi: { courage: 3, standing: 2 }, atomsPerRoom: 1.5 },
      },
      {
        id: "mystery",
        label: "Mystery to unravel",
        contribution: { picssi: { spirituality: 2, illumination: 2 }, questBranches: 2 },
      },
      {
        id: "rescue",
        label: "Rescue or escort",
        contribution: { picssi: { integrity: 3, courage: 2 }, combatDensity: 0.4 },
      },
      {
        id: "war",
        label: "Open conflict / war footing",
        contribution: { picssi: { courage: 4, passion: 2 }, combatDensity: 0.7, enemyTierBias: 0.5 },
      },
    ],
  },
  {
    id: "moral-palette",
    section: "conflict",
    prompt: "What's the moral palette?",
    options: [
      {
        id: "heroic",
        label: "Heroic — clear right and wrong",
        contribution: { atomSeverity: { notable: 1 } },
      },
      {
        id: "morally-gray",
        label: "Morally gray — costs on every side",
        contribution: { atomSeverity: { major: 1 }, affect: { melancholy: 0.2 } },
      },
      {
        id: "damned-by-design",
        label: "Damned by design — every choice corrupts",
        contribution: {
          atomSeverity: { defining: 1 },
          illuminationTilt: -1,
          affect: { dread: 0.4 },
        },
      },
    ],
  },
  {
    id: "illumination-tilt",
    section: "conflict",
    prompt: "Which way does the module tilt the soul?",
    options: [
      {
        id: "toward-light",
        label: "Toward Light (Ma'at, the Order)",
        contribution: { illuminationTilt: 1, picssi: { illumination: 3, spirituality: 2 } },
      },
      {
        id: "neutral",
        label: "Neutral — choices left to the player",
        contribution: { illuminationTilt: 0 },
      },
      {
        id: "toward-dark",
        label: "Toward Outer Dark",
        contribution: { illuminationTilt: -1, picssi: { illumination: -3 }, affect: { dread: 0.3 } },
      },
    ],
  },
  {
    id: "faction-count",
    section: "conflict",
    prompt: "How many factions are in play?",
    options: [
      { id: "solitary", label: "None — solitary opposition", contribution: {} },
      { id: "one", label: "One coherent faction", contribution: { questSteps: 1 } },
      {
        id: "two-clashing",
        label: "Two clashing factions",
        contribution: { questSteps: 2, questBranches: 1, picssi: { standing: 2 } },
      },
      {
        id: "many",
        label: "Many-sided — shifting alliances",
        contribution: { questSteps: 3, questBranches: 2, picssi: { standing: 3 } },
      },
    ],
  },

  // ── SECTION C — MECHANICS ─────────────────────────────────
  {
    id: "enemy-composition",
    section: "mechanics",
    prompt: "What is the dominant enemy type?",
    options: [
      {
        id: "no-combat",
        label: "No combat — pure narrative",
        contribution: { combatDensity: 0, enemyTierBias: 0 },
      },
      {
        id: "grunts",
        label: "Lots of low-tier grunts",
        contribution: { combatDensity: 0.6, enemyTierBias: 1.0 },
      },
      {
        id: "veterans",
        label: "Disciplined veterans, fewer in number",
        contribution: { combatDensity: 0.5, enemyTierBias: 2.0 },
      },
      {
        id: "elite-or-boss",
        label: "Elite or boss-tier antagonist",
        contribution: { combatDensity: 0.3, enemyTierBias: 3.5, henchmanSlots: 1 },
      },
    ],
  },
  {
    id: "combat-density",
    section: "mechanics",
    prompt: "How often does combat happen?",
    options: [
      { id: "rare", label: "Rare — combat is flavor only", contribution: { combatDensity: 0.2 } },
      { id: "occasional", label: "Occasional — 1-2 encounters", contribution: { combatDensity: 0.4 } },
      { id: "steady", label: "Steady — combat in most rooms", contribution: { combatDensity: 0.7 } },
      {
        id: "climactic-only",
        label: "One climactic encounter at the end",
        contribution: { combatDensity: 0.2, enemyTierBias: 1.5 },
      },
    ],
  },
  {
    id: "henchman-availability",
    section: "mechanics",
    prompt: "Can the player recruit help?",
    options: [
      { id: "none", label: "None offered", contribution: { henchmanSlots: 0 } },
      { id: "one-hireable", label: "One hireable contact", contribution: { henchmanSlots: 1 } },
      { id: "rotating", label: "Rotating cast (different allies per stage)", contribution: { henchmanSlots: 2 } },
      { id: "always-with-party", label: "Always-with-party companion", contribution: { henchmanSlots: 2 } },
    ],
  },
  {
    id: "gear-gates",
    section: "mechanics",
    prompt: "Are there gear/item gates?",
    options: [
      { id: "open", label: "Open — any kit works", contribution: { gearGatesCount: 0 } },
      {
        id: "one-common",
        label: "One common gate (torch, rope)",
        contribution: { gearGatesCount: 1 },
      },
      {
        id: "one-uncommon",
        label: "One uncommon gate (silver weapon, holy symbol)",
        contribution: { gearGatesCount: 1, affect: { dread: 0.1 } },
      },
      {
        id: "multiple",
        label: "Multiple gates — gear-puzzle module",
        contribution: { gearGatesCount: 2 },
      },
    ],
  },
  {
    id: "atom-severity",
    section: "mechanics",
    prompt: "How heavy are the moral choices?",
    options: [
      {
        id: "light",
        label: "Light — flavor choices, small deltas",
        contribution: { atomsPerRoom: 1, atomSeverity: { trivial: 2, notable: 1 } },
      },
      {
        id: "standard",
        label: "Standard — notable forks",
        contribution: { atomsPerRoom: 1.5, atomSeverity: { notable: 3 } },
      },
      {
        id: "heavy",
        label: "Heavy — major moral weight",
        contribution: { atomsPerRoom: 2, atomSeverity: { major: 2, notable: 1 } },
      },
      {
        id: "defining",
        label: "Defining choices that mark the soul",
        contribution: { atomsPerRoom: 2, atomSeverity: { defining: 2, major: 1 } },
      },
    ],
  },
  {
    id: "scroll-seeding",
    section: "mechanics",
    prompt: "Does the module seed scrolls or fragments?",
    helper: "Scrolls of Thoth grant Illumination. Stobaean fragments grow Spirituality.",
    options: [
      { id: "none", label: "None", contribution: { scrollSeeds: { thoth: 0, stobaean: 0 } } },
      {
        id: "one-thoth",
        label: "One Scroll of Thoth",
        contribution: { scrollSeeds: { thoth: 1 }, picssi: { illumination: 2 } },
      },
      {
        id: "one-stobaean",
        label: "One Stobaean fragment",
        contribution: { scrollSeeds: { stobaean: 1 }, picssi: { spirituality: 2 } },
      },
      {
        id: "both",
        label: "Both — Thoth + Stobaean",
        contribution: { scrollSeeds: { thoth: 1, stobaean: 1 }, picssi: { spirituality: 2, illumination: 2 } },
      },
    ],
  },

  // ── SECTION D — SHAPE ─────────────────────────────────────
  {
    id: "length",
    section: "shape",
    prompt: "How long is the module?",
    options: [
      { id: "short", label: "Short (3-4 rooms, single arc)", contribution: { rooms: 3, questSteps: 1 } },
      { id: "medium", label: "Medium (5-8 rooms)", contribution: { rooms: 6, questSteps: 2 } },
      {
        id: "long",
        label: "Long branching (9-14 rooms)",
        contribution: { rooms: 11, questSteps: 3, questBranches: 1 },
      },
    ],
  },
  {
    id: "quest-branching",
    section: "shape",
    prompt: "How branched is the quest line?",
    options: [
      { id: "single", label: "Single path", contribution: { questBranches: 0 } },
      { id: "one-branch", label: "One major fork", contribution: { questBranches: 1 } },
      {
        id: "multi-branch",
        label: "Multi-branch — multiple endings",
        contribution: { questBranches: 3, questSteps: 1 },
      },
    ],
  },
  {
    id: "pace",
    section: "shape",
    prompt: "What's the pacing?",
    options: [
      {
        id: "slow-explore",
        label: "Slow exploration — atmosphere first",
        contribution: { affect: { wonder: 0.2, melancholy: 0.2 } },
      },
      {
        id: "steady",
        label: "Steady — even tension throughout",
        contribution: { affect: { excitement: 0.2 } },
      },
      {
        id: "sawtooth",
        label: "Sawtooth — calm then crescendo",
        contribution: { affect: { excitement: 0.3, dread: 0.2 } },
      },
    ],
  },
  {
    id: "reward-shape",
    section: "shape",
    prompt: "What kind of reward is at the end?",
    options: [
      { id: "loot-heavy", label: "Loot-heavy (gold, magic items)", contribution: { picssi: { standing: 2 } } },
      { id: "virtue-heavy", label: "Virtue growth (PICSSI bonuses)", contribution: { picssi: { courage: 2, integrity: 2 } } },
      { id: "lore-heavy", label: "Lore (scroll/fragment/codex entry)", contribution: { picssi: { illumination: 3 }, scrollSeeds: { thoth: 1 } } },
    ],
  },
];

// Append the "Other (custom)" option to every question except those
// in QUESTIONS_WITHOUT_OTHER. Done programmatically so we don't have
// to maintain the option list per question.
export const QUESTIONNAIRE: WizardQuestion[] = RAW_QUESTIONNAIRE.map((q) =>
  QUESTIONS_WITHOUT_OTHER.has(q.id)
    ? q
    : { ...q, options: [...q.options, OTHER_OPTION] },
);

/** Get a question by ID. */
export function getQuestion(id: string): WizardQuestion | undefined {
  return QUESTIONNAIRE.find((q) => q.id === id);
}

/** Find an option contribution by question + option id. */
export function getOptionContribution(
  questionId: string,
  optionId: string,
): WizardOption["contribution"] | undefined {
  const q = getQuestion(questionId);
  if (!q) return undefined;
  return q.options.find((o) => o.id === optionId)?.contribution;
}
