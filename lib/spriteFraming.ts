// ============================================================
// LIVING EAMON — Canonical sprite framing
//
// Every character sprite (hero, NPC, future monsters) is generated
// with a shared composition spec so every figure fills the frame
// consistently. This removes the "eyeball vh caps" hack: because
// every sprite has its figure placed by canonical rules at sprite-
// generation time, ONE CSS rule (SPRITE_RENDER_MAX_HEIGHT) sizes
// them all at render time.
//
// Scale is driven by SpriteSize (small / medium / large):
//   - small  — dwarf, gnome, halfling, child. Figure fills ~55-60%
//              of the frame. Obvious empty sky above the head reads
//              as "short" when composited next to a human.
//   - medium — human, elf, orc, most bipedal humanoids (default).
//              Figure fills ~83-87% of the frame.
//   - large  — troll, giant, ogre, minotaur. Figure fills ~94-97%
//              of the frame, nearly touching the top edge — reads
//              as "looms over the humans".
//
// Orientation is driven by SpriteSide. PCs live screen-left and
// face screen-right. NPCs live screen-right and face screen-left.
// Two characters then read as an over-the-shoulder two-shot in
// dialogue.
//
// Changing any of these strings invalidates existing sprites —
// future generations will frame differently from cached ones.
// Regenerate when adjusting.
// ============================================================

import type { SizeClass } from "./art/sizeClasses";

export type SpriteSide = "left" | "right";

export type SpriteSize = "small" | "medium" | "large";

/** Shared composition preamble — applies to every sprite regardless
 *  of size or side. */
const BASE_COMPOSITION = [
  "Composition: 3:4 portrait aspect ratio, pure white studio backdrop,",
  "cleanly isolated from any environment, no background elements.",
  "Full-body shot, head to soles of feet in frame. The soles of the",
  "feet touch the bottom edge of the frame with at most 2% margin",
  "below. The figure is horizontally centered in the frame. Even, soft",
  "studio lighting with no harsh shadows.",
].join(" ");

/** Per-size composition overlay — tells Grok how much of the frame
 *  the figure should occupy. A dwarf painted with obvious empty sky
 *  above their head reads as "short" when rendered alongside a human
 *  sprite that nearly fills the same-size frame. */
function sizeComposition(size: SpriteSize): string {
  switch (size) {
    case "small":
      return [
        "Scale: this is a SHORT humanoid — a dwarf, gnome, halfling, or",
        "child. The figure occupies approximately 55-60% of the vertical",
        "frame height. Approximately 38-42% of empty white background",
        "appears above the top of the head. Stocky body proportions:",
        "thicker torso and limbs relative to a human's, shorter legs.",
      ].join(" ");
    case "medium":
      return [
        "Scale: this is a HUMAN-SIZED humanoid. The figure occupies",
        "approximately 83-87% of the vertical frame height.",
        "Approximately 10-12% of empty white background appears above",
        "the top of the head.",
      ].join(" ");
    case "large":
      return [
        "Scale: this is a LARGE creature — a troll, giant, ogre, or",
        "similarly oversized humanoid. The figure occupies approximately",
        "94-97% of the vertical frame height. Approximately 1-3% of",
        "empty white background appears above the top of the head. The",
        "creature's massive build fills the frame — broad shoulders,",
        "heavy limbs, a head that nearly touches the top edge.",
      ].join(" ");
  }
}

/** Orientation clause — PC on screen-left faces screen-right, NPC on
 *  screen-right faces screen-left. Both use a three-quarter body
 *  angle so the viewer sees the face and most of the torso.
 *
 *  IMPORTANT: this clause avoids anatomical left/right entirely and
 *  uses only viewer-frame landmark language ("the LEFT side of the
 *  image", "the RIGHT EDGE of the frame"). Earlier wording that said
 *  things like "left shoulder forward" was ambiguous — Grok Imagine
 *  kept picking the character-anatomical interpretation and inverting
 *  the intended facing direction across every hero and NPC in the
 *  library (2026-04-24 audit showed every master face screen-LEFT
 *  even when called with side="left" which asks for screen-RIGHT
 *  facing). Re-word only by preserving viewer-frame landmarks, never
 *  by saying "left/right shoulder" alone. */
export function framingForSide(side: SpriteSide): string {
  if (side === "left") {
    return [
      "Orientation: the character stands at the LEFT side of the image",
      "(viewer's left, screen-left). The body and face are rotated",
      "toward the RIGHT side of the image in a three-quarter view —",
      "the nose and chin point toward the RIGHT EDGE of the frame.",
      "Three-quarter body rotation: the shoulder that APPEARS on the",
      "LEFT side of the image (viewer's left) is angled FORWARD toward",
      "the camera; the shoulder that APPEARS on the RIGHT side of the",
      "image (viewer's right) is angled BACK away from the camera.",
      "Gaze level and direct, eyes focused STRAIGHT AHEAD AT THE",
      "VIEWER, not turned aside, not downcast, not upward. The eyes",
      "make direct eye contact with the camera regardless of the body",
      "turn.",
    ].join(" ");
  }
  return [
    "Orientation: the character stands at the RIGHT side of the image",
    "(viewer's right, screen-right). The body and face are rotated",
    "toward the LEFT side of the image in a three-quarter view — the",
    "nose and chin point toward the LEFT EDGE of the frame.",
    "Three-quarter body rotation: the shoulder that APPEARS on the",
    "RIGHT side of the image (viewer's right) is angled FORWARD toward",
    "the camera; the shoulder that APPEARS on the LEFT side of the",
    "image (viewer's left) is angled BACK away from the camera.",
    "Gaze level and direct, eyes focused STRAIGHT AHEAD AT THE",
    "VIEWER, not turned aside, not downcast, not upward. The eyes",
    "make direct eye contact with the camera regardless of the body",
    "turn.",
  ].join(" ");
}

/** Convenience: the full framing block (base composition + size scale
 *  + side orientation). Append this to any character-description
 *  prompt before sending to Grok Imagine. Size defaults to medium
 *  when omitted. */
export function canonicalFraming(
  side: SpriteSide,
  size: SpriteSize = "medium"
): string {
  return [BASE_COMPOSITION, sizeComposition(size), framingForSide(side)].join(
    " "
  );
}

/** Shared CSS max-height for every sprite container. With the
 *  figure-fill percentages above, visible figures render at:
 *    - small:  0.58 × 70 = 40.6vh (dwarf)
 *    - medium: 0.85 × 70 = 59.5vh (human)
 *    - large:  0.95 × 70 = 66.5vh (troll)
 *  A troll is ~1.6× a dwarf's height on screen. Change once,
 *  everywhere. */
export const SPRITE_RENDER_MAX_HEIGHT = "70vh";

/** Adapter from the legacy 3-tier `SpriteSize` to the canonical
 *  5-class `SizeClass` registry in `lib/art/sizeClasses.ts`.
 *  Used during migration so existing NPC.spriteSize values keep
 *  working until each NPC is reviewed and assigned an explicit
 *  sizeClass. */
export function spriteSizeToSizeClass(size: SpriteSize): SizeClass {
  switch (size) {
    case "small":
      return "B";
    case "medium":
      return "C";
    case "large":
      return "D";
  }
}
