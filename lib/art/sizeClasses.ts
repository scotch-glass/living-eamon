// ============================================================
// LIVING EAMON — Sprite size classes + Z-layer registry
//
// Five size classes (A–E) describe every renderable character.
// The Z-layer math is: smaller class → higher Z, so a small wolf
// renders in front of a giant when they overlap. Gore Z is
// always sprite Z + 1 (one layer above the character that owns
// the wound).
//
// Width is NOT class-controlled. Sprite width scales naturally
// from the figure's generated aspect ratio. Class only governs
// figure-height (eye-anchored at render time via
// `figureScaleByEye` in lib/combat/useFigureHeight.ts).
//
// Stacking-context contract: every consumer of this registry
// MUST render combatants inside a single shared stacking context
// (one parent with `position: relative; isolation: isolate;`).
// Any `transform`, `opacity` < 1, or `filter` on an ancestor
// between the parent and a combatant creates a child stacking
// context and silently breaks Z order.
// ============================================================

export type SizeClass = "A" | "B" | "C" | "D" | "E";

export interface SizeClassDef {
  id: SizeClass;
  label: string;
  examples: string[];
  /** Multiplier vs. baseline humanoid (class C = 1.0). */
  heightFactor: number;
  /** Stack order for the live sprite. Smaller class → higher Z. */
  spriteZ: number;
  /** Stack order for gore overlay tagged to this class.
   *  Always spriteZ + 1. */
  goreZ: number;
}

export const SIZE_CLASSES: Record<SizeClass, SizeClassDef> = {
  A: {
    id: "A",
    label: "Small Animals",
    examples: ["wolf", "dog", "snake"],
    heightFactor: 1 / 3,
    spriteZ: 8,
    goreZ: 9,
  },
  B: {
    id: "B",
    label: "Small Humanoid",
    examples: ["dwarf", "pixie", "gnome", "child"],
    heightFactor: 1 / 2,
    spriteZ: 6,
    goreZ: 7,
  },
  C: {
    id: "C",
    label: "Normal Humanoid",
    examples: ["human", "elf", "humanoid monster"],
    heightFactor: 1.0,
    spriteZ: 4,
    goreZ: 5,
  },
  D: {
    id: "D",
    label: "Large Humanoid",
    examples: ["giant", "troll"],
    heightFactor: 1.5,
    spriteZ: 2,
    goreZ: 3,
  },
  E: {
    id: "E",
    label: "Extra Large Monster",
    examples: ["dragon", "gryphon", "demon lord"],
    heightFactor: 2.0,
    spriteZ: 0,
    goreZ: 1,
  },
};

/** Class-C reference figure height in CSS pixels. Every other class
 *  scales from this baseline by `heightFactor`. */
export const BASELINE_FIGURE_HEIGHT_PX = 460;

export function targetFigureHeightPx(cls: SizeClass): number {
  return BASELINE_FIGURE_HEIGHT_PX * SIZE_CLASSES[cls].heightFactor;
}

/** All defined size classes in registry order. */
export const ALL_SIZE_CLASSES: SizeClass[] = ["A", "B", "C", "D", "E"];

// ── Stature modifiers (locked 2026-05-08) ────────────────────────
//
// Two compounding multipliers applied on TOP of the size-class
// `heightFactor`:
//
//   - female: 0.9× (10% smaller in stature than males of the same race)
//   - hero:   1.1× (10% larger than a normal humanoid male)
//
// Female hero compounds: 0.9 × 1.1 = 0.99×. Source of truth lives in
// the user's `game_rules.md` memory (`Stature Modifiers`). See
// CLAUDE.md if the canon source ever changes.

export const FEMALE_STATURE_MULTIPLIER = 0.9;
export const HERO_STATURE_MULTIPLIER = 1.1;

export function statureMultiplier(opts: {
  gender: "male" | "female";
  isHero: boolean;
}): number {
  let m = 1;
  if (opts.gender === "female") m *= FEMALE_STATURE_MULTIPLIER;
  if (opts.isHero) m *= HERO_STATURE_MULTIPLIER;
  return m;
}
