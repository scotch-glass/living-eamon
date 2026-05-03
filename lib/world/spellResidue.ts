// ============================================================
// Sprint G4 — Per-spell environmental side-effect catalog
//
// For every implemented spell (and combat event), declares what
// residue it leaves on the room when cast/triggered.
//
// This is a PURE CATALOG — no wiring to the engine yet.
// G5 applies residue to rooms; G6 wires NPC repair.
//
// Usage in G5:
//   import { SPELL_RESIDUE, COMBAT_RESIDUE } from "./spellResidue";
//   const entry = SPELL_RESIDUE["fireball"];
//   if (entry) pushResidue(room, entry, spell.circle);
//
// Decay model (applied in G5 tickRealTime):
//   actualDecayMs = decayHours * (repairCircleMult ? spellCircle : 1) * 3600000
//   if repairRequired: never clears without an NPC repair tick
//   (rubble clears only with matching NPC repair skill + time)
//
// Residue types:
//   blood      — combat and impact damage; 24h
//   scorch     — fire/lightning/energy; 48h base
//   frost      — cold magic (future); 24h base
//   rubble     — wall/stone construction or collapse; 72h base + repair
//   stain      — poison, portals, arcane taint; 12–48h
//   structural — high-circle catastrophic damage; 168h base + repair
// ============================================================

export type ResidueType = "blood" | "scorch" | "frost" | "rubble" | "stain" | "structural";

export interface SpellResidue {
  /** The physical mark left on the room. */
  residueType: ResidueType;
  /**
   * Base decay time in hours. Actual decay = decayHours × (repairCircleMult ? circle : 1).
   * G5 converts to ms before comparison against realTimeMs.
   */
  decayHours: number;
  /**
   * True = the residue can only be cleared by NPC repair (mason/scribe/etc.)
   * + elapsed time. Without a competent NPC, it persists indefinitely.
   */
  repairRequired: boolean;
  /**
   * When true, actualDecayHours = decayHours × spellCircle.
   * Use for high-circle spells whose damage scales with power.
   */
  repairCircleMult?: boolean;
  /**
   * Howard-canon sentence appended to room description while active.
   * Present-tense; describes what the room looks like NOW.
   */
  description: string;
}

// ── Spell residue catalog ─────────────────────────────────────
// Keyed by spell id (stable kebab-case, matches SPELL_REGISTRY).
// null = spell leaves no room residue.

export const SPELL_RESIDUE: Record<string, SpellResidue | null> = {

  // ── Circle 1 ──────────────────────────────────────────────

  clumsy:         null,
  "create-food":  null,
  feeblemind:     null,
  heal:           null,

  "magic-arrow": {
    residueType: "blood",
    decayHours: 24,
    repairRequired: false,
    description:
      "A thin blood mark on the stone — pale fire found its target here.",
  },

  "night-sight":    null,
  "reactive-armor": null,
  weaken:           null,

  // ── Circle 2 ──────────────────────────────────────────────

  agility:        null,
  cunning:        null,
  cure:           null,

  harm: {
    residueType: "blood",
    decayHours: 24,
    repairRequired: false,
    description:
      "Blood on the stone — Harm's cold hand touched here and let go.",
  },

  "magic-trap":   null,
  "remove-trap":  null,
  protection:     null,
  strength:       null,

  // ── Circle 3 ──────────────────────────────────────────────

  bless:          null,

  fireball: {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    description:
      "Scorched stone and the smell of char mark where the Fireball came to rest.",
  },

  "magic-lock":   null,

  poison: {
    residueType: "stain",
    decayHours: 24,
    repairRequired: false,
    description:
      "A greenish residue clings to the stone where the venom was set loose. The smell lingers.",
  },

  telekinesis: null,

  teleport: {
    residueType: "stain",
    decayHours: 6,
    repairRequired: false,
    description:
      "A brief shimmer clings to the air where something was here, then wasn't.",
  },

  unlock: null,

  "wall-of-stone": {
    residueType: "rubble",
    decayHours: 72,
    repairRequired: true,
    repairCircleMult: true,
    description:
      "Blocks of summoned stone litter the floor where the Wall was raised and fell. A mason's work lies ahead of it.",
  },

  // ── Circle 4 ──────────────────────────────────────────────

  "arch-cure":        null,
  "arch-protection":  null,
  curse:              null,

  "fire-field": {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    description:
      "Char patterns run along the floor where the Fire Field held its line.",
  },

  "greater-heal": null,

  lightning: {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    description:
      "A black burn scar runs across the stone where the lightning struck and grounded.",
  },

  "mana-drain": null,
  recall:       null,

  // ── Circle 5 ──────────────────────────────────────────────

  "blade-spirits": {
    residueType: "blood",
    decayHours: 24,
    repairRequired: false,
    description:
      "Blood marks the floor in patterns no single wound explains — the Blade Spirits worked here.",
  },

  "dispel-field":    null,
  "magic-reflection": null,
  "mind-blast":      null,
  paralyze:          null,

  "poison-field": {
    residueType: "stain",
    decayHours: 24,
    repairRequired: false,
    description:
      "The floor carries a faint toxic taint where the Poison Field hung. Don't breathe deep.",
  },

  "summon-creature": null,

  // ── Circle 6 ──────────────────────────────────────────────

  dispel:      null,

  "energy-bolt": {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    description:
      "A pale burn scar runs through the stone — the Energy Bolt's pass is still readable in the rock.",
  },

  explosion: {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    description:
      "Blast scorch radiates outward from the epicenter; the ceiling above is still blackened.",
  },

  invisibility:  null,
  mark:          null,
  "mass-curse":  null,
  "paralyze-field": null,
  reveal:        null,

  // ── Circle 7 ──────────────────────────────────────────────

  "chain-lightning": {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    description:
      "Char marks run across the floor in an insane branching geometry — the lightning found what it could reach.",
  },

  "energy-field": null,

  flamestrike: {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    description:
      "The floor where the Flamestrike descended is scorched black; the stone has a glazed, almost molten look.",
  },

  "gate-travel": {
    residueType: "stain",
    decayHours: 12,
    repairRequired: false,
    description:
      "A faint shimmer clings to the air where the Gate tore open. The boundary of the place remembers.",
  },

  "mana-vampire":  null,
  "mass-dispel":   null,

  "meteor-swarm": {
    residueType: "structural",
    decayHours: 168,
    repairRequired: true,
    repairCircleMult: true,
    description:
      "Impact craters pock the floor; sections of the ceiling have come down and the debris has not been cleared.",
  },

  polymorph: null,

  // ── Circle 8 ──────────────────────────────────────────────

  earthquake: {
    residueType: "structural",
    decayHours: 168,
    repairRequired: true,
    repairCircleMult: true,
    description:
      "The floor is cracked in long running lines; sections have risen unevenly. The ceiling is not safe to walk under.",
  },

  "energy-vortex": {
    residueType: "stain",
    decayHours: 24,
    repairRequired: false,
    description:
      "Stone pitted and air with a bitter taste — the Vortex left its mark. A faint crackle persists.",
  },

  resurrection: null,

  "summon-air-elemental": null,

  "summon-daemon": {
    residueType: "stain",
    decayHours: 48,
    repairRequired: false,
    description:
      "Something sulfurous has soaked into the stone here. It may fade in time. It may not.",
  },

  "summon-earth-elemental": {
    residueType: "rubble",
    decayHours: 24,
    repairRequired: false,
    description:
      "Clods of earth and loose stone mark where something large stood, did what it was asked, and came apart.",
  },

  "summon-fire-elemental": {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    description:
      "Scorch marks surround the place where the Fire Elemental was bound; it preferred things warm.",
  },

  "summon-water-elemental": {
    residueType: "stain",
    decayHours: 12,
    repairRequired: false,
    description:
      "Water has pooled and soaked into the stone where the Elemental stood and dispersed.",
  },
};

// ── Combat event residue catalog ─────────────────────────────
// Keyed by event kind. Applied when the event triggers in G5.

export type CombatEventKind = "critical_hit" | "bleed_proc" | "poison_hit";

export const COMBAT_RESIDUE: Record<CombatEventKind, SpellResidue> = {
  critical_hit: {
    residueType: "blood",
    decayHours: 24,
    repairRequired: false,
    description: "Blood on the floor speaks plainly of what was done here.",
  },
  bleed_proc: {
    residueType: "blood",
    decayHours: 24,
    repairRequired: false,
    description: "A trail of blood marks where the bleeding wound was not tended to.",
  },
  poison_hit: {
    residueType: "stain",
    decayHours: 24,
    repairRequired: false,
    description: "A slick residue on the stone marks where the venom touched the ground.",
  },
};
