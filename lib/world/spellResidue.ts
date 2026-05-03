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
   * Howard-canon sentences appended to room description while active.
   * Present-tense; describes what the room looks like NOW.
   * 3 entries preferred — pushResidue picks one at push time.
   */
  descriptions: string[];
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
    descriptions: [
      "A thin blood mark on the stone — pale fire found its mark here.",
      "Something fell here and bled briefly before the matter ended.",
      "The stone carries a dark stain where the Magic Arrow struck home.",
    ],
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
    descriptions: [
      "Blood on the stone — Harm's cold hand touched here and let go.",
      "A dark smear marks where Harm drew what it needed and withdrew.",
      "The stone is stained where Harm reached through and took its portion.",
    ],
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
    descriptions: [
      "Scorched stone and the lingering smell of char mark where the Fireball came to rest.",
      "The floor is blackened in a rough circle; the stone around the epicenter is still warm.",
      "A Fireball touched down here — the scorch pattern fans outward from one point like a dark flower.",
    ],
  },

  "magic-lock":   null,

  poison: {
    residueType: "stain",
    decayHours: 24,
    repairRequired: false,
    descriptions: [
      "A greenish residue clings to the stone where the venom was set loose. The smell lingers.",
      "The air here carries a faint bitter edge; poison has been at work on the stone.",
      "Something toxic touched this floor and left its signature — a faint slick, greenish at the edges.",
    ],
  },

  telekinesis: null,

  teleport: {
    residueType: "stain",
    decayHours: 6,
    repairRequired: false,
    descriptions: [
      "A brief shimmer clings to the air where something was here, then wasn't.",
      "The space here feels recently vacated in a way that has nothing to do with footsteps.",
      "A Teleport was used here — the air carries the particular flatness of a recently closed absence.",
    ],
  },

  unlock: null,

  "wall-of-stone": {
    residueType: "rubble",
    decayHours: 72,
    repairRequired: true,
    repairCircleMult: true,
    descriptions: [
      "Blocks of summoned stone litter the floor where the Wall was raised and fell. A mason's work lies ahead.",
      "The Wall-of-Stone has come down; rough-edged blocks cover the floor and the dust has not yet settled.",
      "Summoned stone fills the passage in loose tumbled blocks — it came up fast, came down faster.",
    ],
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
    descriptions: [
      "Char patterns run along the floor where the Fire Field held its line.",
      "The floor carries a long streak of scorch where the Fire Field stood and burned.",
      "A band of blackened stone marks where the Fire Field ran — anything that crossed that line paid for it.",
    ],
  },

  "greater-heal": null,

  lightning: {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    descriptions: [
      "A black burn scar runs across the stone where the lightning struck and grounded.",
      "The stone is split along a single jagged line where the bolt found its path to earth.",
      "Lightning touched down here — the scorch is clean and direct, nothing like fire's sprawl.",
    ],
  },

  "mana-drain": null,
  recall:       null,

  // ── Circle 5 ──────────────────────────────────────────────

  "blade-spirits": {
    residueType: "blood",
    decayHours: 24,
    repairRequired: false,
    descriptions: [
      "Blood marks the floor in patterns no single wound explains — the Blade Spirits were here.",
      "Several small dark stains are spread across the floor; the Blade Spirits do not waste motion.",
      "The stone is spattered in the particular pattern of blades working at speed — many cuts, many directions.",
    ],
  },

  "dispel-field":    null,
  "magic-reflection": null,
  "mind-blast":      null,
  paralyze:          null,

  "poison-field": {
    residueType: "stain",
    decayHours: 24,
    repairRequired: false,
    descriptions: [
      "The floor carries a faint toxic taint where the Poison Field hung. Don't breathe deep.",
      "A Poison Field stood here long enough to soak into the stone; the discoloration will last a day.",
      "The air near the floor tastes wrong — bitter, chemical. A Poison Field left its mark on the stone.",
    ],
  },

  "summon-creature": null,

  // ── Circle 6 ──────────────────────────────────────────────

  dispel:      null,

  "energy-bolt": {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    descriptions: [
      "A pale burn scar runs through the stone — the Energy Bolt's path is still readable in the rock.",
      "The bolt carved a line through the stone and left a white scar where the energy bled out.",
      "Stone pitted and pale where the Energy Bolt passed; it moved fast but left its mark.",
    ],
  },

  explosion: {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    descriptions: [
      "Blast scorch radiates outward from the epicenter; the ceiling directly above is still blackened.",
      "An Explosion went off here — the scorch pattern fans in all directions from one point on the floor.",
      "Everything in arm's reach of the center is charred; the blast scorch thins as it fans outward.",
    ],
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
    descriptions: [
      "Char marks branch across the floor in forking geometry — the Chain Lightning found everything it could reach.",
      "The scorch traces a branching pattern, jumping from point to point in the way only Chain Lightning does.",
      "Multiple burn tracks cross the floor, each one the chain's next leap; the pattern has the look of something alive.",
    ],
  },

  "energy-field": null,

  flamestrike: {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    descriptions: [
      "The floor where the Flamestrike descended is scorched black; the stone has a glazed, almost molten look.",
      "A column of fire came straight down here — the scorch is deep and circular, stone glazed at the center.",
      "The Flamestrike left the stone dark and vitrified at the point of impact; the heat was immense.",
    ],
  },

  "gate-travel": {
    residueType: "stain",
    decayHours: 12,
    repairRequired: false,
    descriptions: [
      "A faint shimmer clings to the air where the Gate tore open. The boundary of this place remembers.",
      "A Gate opened here and closed again — the air is slightly wrong, as if the room has not fully re-sealed.",
      "Something about the light here is not quite right; the Gate left a thin residue where it tore through.",
    ],
  },

  "mana-vampire":  null,
  "mass-dispel":   null,

  "meteor-swarm": {
    residueType: "structural",
    decayHours: 168,
    repairRequired: true,
    repairCircleMult: true,
    descriptions: [
      "Impact craters pock the floor; sections of the ceiling have come down and the debris has not been cleared.",
      "The Meteor Swarm left the floor cratered and the ceiling opened to the sky in places; the rubble will require weeks.",
      "Stone lies in irregular heaps where the meteors hit; the walls have held but they will not hold another.",
    ],
  },

  polymorph: null,

  // ── Circle 8 ──────────────────────────────────────────────

  earthquake: {
    residueType: "structural",
    decayHours: 168,
    repairRequired: true,
    repairCircleMult: true,
    descriptions: [
      "The floor is cracked in long running lines; sections have risen unevenly. The ceiling is not safe.",
      "The Earthquake split the floor along fault lines that were not there before; the place is structurally uncertain.",
      "Cracks run from wall to wall and the floor has heaved; stone dust still drifts from the ceiling in the draft.",
    ],
  },

  "energy-vortex": {
    residueType: "stain",
    decayHours: 24,
    repairRequired: false,
    descriptions: [
      "Stone pitted and air with a bitter taste — the Vortex left its mark. A faint crackle persists.",
      "The Energy Vortex ate at the stone while it spun; the pitting is still visible, the air still sharp.",
      "Something turned here at high speed and fed on what it found — the stone is cratered where it worked.",
    ],
  },

  resurrection: null,

  "summon-air-elemental": null,

  "summon-daemon": {
    residueType: "stain",
    decayHours: 48,
    repairRequired: false,
    descriptions: [
      "Something sulfurous has soaked into the stone here. It may fade in time. It may not.",
      "The daemon stood here — the stone beneath its feet is changed in ways that don't have simple names.",
      "A persistent smell hangs over the spot where the daemon was bound; not fire, not rot — something underneath both.",
    ],
  },

  "summon-earth-elemental": {
    residueType: "rubble",
    decayHours: 24,
    repairRequired: false,
    descriptions: [
      "Clods of earth and loose stone mark where something large stood, did what it was asked, and came apart.",
      "The Earth Elemental left the floor covered in loose rubble when it dissolved — it returns to earth as it came from it.",
      "A scatter of stone and soil marks where the Elemental was standing when its time ran out.",
    ],
  },

  "summon-fire-elemental": {
    residueType: "scorch",
    decayHours: 48,
    repairRequired: false,
    repairCircleMult: true,
    descriptions: [
      "Scorch marks surround the point where the Fire Elemental was bound — it preferred things warm.",
      "The floor around the binding point is blackened; a Fire Elemental cannot help what it does to a room.",
      "Everything in reach of where the Fire Elemental stood has been scorched; its presence is its own hazard.",
    ],
  },

  "summon-water-elemental": {
    residueType: "stain",
    decayHours: 12,
    repairRequired: false,
    descriptions: [
      "Water has pooled and soaked into the stone where the Elemental stood and dispersed.",
      "A dark wet stain marks where the Water Elemental was dismissed; the stone is soaked through.",
      "The floor is wet here — not from rain or a leak, but from a Water Elemental that came apart rather than withdrew.",
    ],
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
    descriptions: [
      "Blood splattered on the floor speaks plainly of what was done here.",
      "A bloody fight occured here — the stone carries the evidence.",
      "The floor is dark with gore where the fight reached its worst moment.",
    ],
  },
  bleed_proc: {
    residueType: "blood",
    decayHours: 24,
    repairRequired: false,
    descriptions: [
      "A trail of blood marks where a bleeding wound left it's mess.",
      "Blood has dripped across the floor in the pattern of someone still moving, still fighting.",
      "Here, a wound bled long enough to make randomly artistic patterns on the stone; the trail gives the fight's geography away.",
    ],
  },
  poison_hit: {
    residueType: "stain",
    decayHours: 24,
    repairRequired: false,
    descriptions: [
      "A slick residue on the stone marks where some kind of venom touched the ground.",
      "Venom hit the floor here — the discoloration is already setting into the stone.",
      "Where the poison fell, the stone has changed color; the process is slow and it stills smells.",
    ],
  },
};
