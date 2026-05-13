// ============================================================
// Howard public-domain anchor registry for the Creator Forge
// wizard. Each anchor preloads naming defaults + AffectVector
// biases so a Creator can pick "Mirrors of Tuzun Thune" and have
// the wizard suggest mood + setting flavor accordingly.
//
// Sourced from Public_Domain_Rules.md Always-Safe Corpus and
// ADVENTURE_MODULES_PLAN.md 18-module roadmap. Trademark-
// radioactive terms (Hyborian, Cimmerian, Conan, Tarantia, etc.)
// are NEVER referenced.
// ============================================================

import type { AffectAxis } from "../karma/atom-types";

export interface PdAnchor {
  id: string;
  title: string;
  /** Inspirational, not literal — Creator names their own thing. */
  era: "thurian" | "early-hyborian" | "late-hyborian" | "post-cataclysm";
  /** AffectVector bias hints applied at wizard time. */
  affectBias: Partial<Record<AffectAxis, number>>;
  /** Short tagline used in the wizard dropdown UI. */
  blurb: string;
}

export const PD_ANCHORS: PdAnchor[] = [
  {
    id: "mirrors-of-tuzun-thune",
    title: "Mirrors of Tuzun Thune",
    era: "thurian",
    blurb: "Twelve-thousand-year-old mirror-maze; reflections that lie.",
    affectBias: { wonder: 0.4, dread: 0.3, melancholy: 0.2 },
  },
  {
    id: "the-shadow-kingdom",
    title: "The Shadow Kingdom",
    era: "thurian",
    blurb: "Serpent-folk hidden in noble court; trust dissolved.",
    affectBias: { dread: 0.5, fear: 0.3, excitement: 0.2 },
  },
  {
    id: "kings-of-the-night",
    title: "Kings of the Night",
    era: "thurian",
    blurb: "Pictish tomb-opening; spirits called back to fight.",
    affectBias: { awe: 0.4, dread: 0.3, excitement: 0.3 },
  },
  {
    id: "the-cat-and-the-skull",
    title: "The Cat and the Skull",
    era: "thurian",
    blurb: "Conspiracy within the king's own keep.",
    affectBias: { fear: 0.3, excitement: 0.4, dread: 0.2 },
  },
  {
    id: "the-altar-and-the-scorpion",
    title: "The Altar and the Scorpion",
    era: "thurian",
    blurb: "Sacrifice in the desert; the wrong god answers.",
    affectBias: { dread: 0.4, awe: 0.2, fear: 0.3 },
  },
  {
    id: "beyond-the-black-river",
    title: "Beyond the Black River",
    era: "early-hyborian",
    blurb: "Frontier war against forest-dwelling savages.",
    affectBias: { fear: 0.3, excitement: 0.4, melancholy: 0.2 },
  },
  {
    id: "the-pool-of-the-black-one",
    title: "The Pool of the Black One",
    era: "early-hyborian",
    blurb: "Island, pirate crew, otherworldly pool that takes them one by one.",
    affectBias: { dread: 0.5, wonder: 0.2, fear: 0.3 },
  },
  {
    id: "queen-of-the-black-coast",
    title: "Queen of the Black Coast",
    era: "early-hyborian",
    blurb: "Pirate love, ancient ape-god, jungle ruin.",
    affectBias: { eros: 0.3, dread: 0.3, melancholy: 0.4 },
  },
  {
    id: "original",
    title: "Original / no specific anchor",
    era: "thurian",
    blurb: "No PD inspiration. Pure Creator authorship.",
    affectBias: {},
  },
];

export function getPdAnchor(id: string | null): PdAnchor | null {
  if (!id) return null;
  return PD_ANCHORS.find((a) => a.id === id) ?? null;
}
