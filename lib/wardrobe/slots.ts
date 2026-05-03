// ============================================================
// LIVING EAMON — Wardrobe Engine · slots registry
//
// Single source of truth for:
//   - the 19-slot UO-style paperdoll schema
//   - draw order (z-index) during runtime sharp composite
//   - canvas dimensions for every anchor + piece PNG
//   - hit-region rectangles for the drag-and-drop popup
//   - mutually-exclusive slot groups
//
// Changing any constant here requires a wardrobe_version bump
// (see CANONICAL_BODY_PROMPT_CHECKSUM below). Every wardrobe
// PNG in storage is versioned so a mismatched pair aborts the
// composite instead of blending an old anchor with new pieces.
// ============================================================

/**
 * The 19 wardrobe slots. Names mirror Ultima Online's paperdoll
 * conventions with `anchor_body` added as the base layer. All
 * slot names MUST match the `slot` column in `wardrobe_pieces`.
 */
export const SLOTS = [
  "anchor_body",
  "back_cloak",
  "skirt",
  "legging",
  "footwear",
  "shirt",
  "chest",
  "robe",
  "sleeves",
  "sash",
  "gloves",
  "bracelet",
  "ring",
  "neck",
  "earrings",
  "weapon_sheathed",
  "talisman",
  "head",
  "front_cloak",
  "right_hand",
  "left_hand",
] as const;

export type Slot = (typeof SLOTS)[number];

/**
 * The postures the pilot supports. `combat` is scaffolded here
 * but out-of-scope for Day 1-7 — casual only ships in the pilot.
 */
export type Posture = "casual" | "combat";

/**
 * Draw order for the runtime sharp composite: anchor first, each
 * subsequent piece stacked on top in ascending z. Gaps reserved
 * for future slots (e.g. a long-beard layer at z=75 between head
 * and front_cloak if we ever lift the short-beard restriction).
 */
export const SLOT_Z_INDEX: Record<Slot, number> = {
  anchor_body: 0,
  back_cloak: 5,
  skirt: 10,
  legging: 11,
  footwear: 20,
  shirt: 25,
  chest: 30,
  robe: 31,
  sleeves: 32,
  sash: 35,
  gloves: 40,
  bracelet: 45,
  ring: 48,
  neck: 50,
  earrings: 52,
  weapon_sheathed: 55,
  talisman: 65,
  head: 70,
  front_cloak: 80,
  right_hand: 90,
  left_hand: 95,
};

/**
 * Slots that cannot be worn together. If both are present in an
 * Outfit, the higher-priority one wins (see composite.ts).
 *
 * - skirt / legging: loincloth vs trousers — pick one, or neither.
 * - robe  / chest:   full robe vs armored cuirass — pick one.
 * - weapon_sheathed / {right_hand, left_hand}: posture decides.
 *     * casual posture allows weapon_sheathed, forbids hand slots
 *     * combat posture forbids weapon_sheathed, allows hand slots
 */
export const MUTUALLY_EXCLUSIVE: Array<readonly Slot[]> = [
  ["skirt", "legging"],
  ["robe", "chest"],
];

/**
 * Canonical canvas dimensions. Every anchor + piece PNG is authored
 * on this exact grid so the composite needs no per-piece offset
 * math — every layer is `sharp(anchor).composite([{ input: piece }])`
 * with no `top`/`left`.
 *
 * Grok Imagine Pro with `aspect_ratio: "3:4"` + `resolution: "2k"`
 * returns 1776×2528 — measured empirically 2026-04-24 on the first
 * Gaius 2k anchor. Aspect ratio 1776/2528 ≈ 0.702 matches the same
 * ratio Grok uses at 1k (896/1280), just 4× the pixel count. Don't
 * change these without regenerating every anchor + piece.
 */
export const CANVAS_WIDTH = 1776;
export const CANVAS_HEIGHT = 2528;

/**
 * Drag-and-drop hit-region rectangles, in canonical canvas pixels.
 * The popup scales these down 1:2.56 to the render canvas
 * (1024×1365 → 400×~534 px). Pilot populates `chest` from the real
 * anchor image in Day 4; the other rectangles are reasonable
 * starting points that will be tuned in the lab when each slot
 * comes online. The shape: { x, y, w, h }, top-left origin.
 *
 * Some small-target slots (ring, earrings) deliberately overlap
 * larger neighbors; the drag-and-drop logic resolves overlaps by
 * picking the smallest-area slot whose item-type matches first.
 */
export interface HitRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const SLOT_HIT_REGIONS: Record<Slot, HitRegion> = {
  anchor_body: { x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT }, // whole-canvas fallback
  // Regions are the 1k rectangles scaled ×2 to the 2k canvas. Day 4
  // calibrates chest precisely against the actual anchor image; the
  // rest get tuned as each slot comes online.
  head: { x: 666, y: 240, w: 456, h: 412 },
  earrings: { x: 648, y: 412, w: 140, h: 112 },
  neck: { x: 736, y: 640, w: 316, h: 112 },
  shirt: { x: 596, y: 750, w: 596, h: 412 },
  chest: { x: 560, y: 788, w: 666, h: 488 },
  robe: { x: 526, y: 750, w: 736, h: 976 },
  sleeves: { x: 386, y: 788, w: 1016, h: 412 },
  sash: { x: 596, y: 1276, w: 596, h: 150 },
  talisman: { x: 806, y: 976, w: 176, h: 150 },
  gloves: { x: 350, y: 1462, w: 1086, h: 226 },
  bracelet: { x: 350, y: 1350, w: 210, h: 150 },
  ring: { x: 386, y: 1538, w: 140, h: 112 },
  skirt: { x: 596, y: 1426, w: 596, h: 412 },
  legging: { x: 630, y: 1462, w: 526, h: 788 },
  footwear: { x: 630, y: 2250, w: 526, h: 262 },
  back_cloak: { x: 490, y: 562, w: 806, h: 1500 },
  front_cloak: { x: 490, y: 562, w: 806, h: 1688 },
  weapon_sheathed: { x: 456, y: 1200, w: 246, h: 788 },
  right_hand: { x: 1086, y: 1200, w: 350, h: 488 },
  left_hand: { x: 350, y: 1200, w: 350, h: 488 },
};

/**
 * Hash over every constant that would invalidate an existing
 * anchor/piece if changed. Bump manually when any of these shift
 * incompatibly; the runtime composite aborts when a stored PNG's
 * `wardrobe_version` doesn't match, forcing regeneration rather
 * than silent drift.
 *
 * Keep this incrementing by 1 — never reuse an old value.
 *
 * v2 (2026-04-24): ANCHOR_POSE_LOCK's gaze clause stopped pinning
 * "eyes straight ahead" (conflicted with the 3/4 turn), and
 * spriteFraming.framingForSide() swapped anatomical left/right for
 * viewer-frame landmark language to fix screen-facing inversion.
 * Also switched to resolution="2k" — canvas constants updated
 * after the first 2k anchor measured.
 *
 * v3 (2026-04-24): tried "over-shoulder eye contact" phrasing for
 * the gaze — Grok mis-interpreted and kept the eyes off-camera.
 *
 * v4 (2026-04-24): reverted to the proven-working v1 gaze wording
 * ("eyes focused STRAIGHT AHEAD AT THE VIEWER, not turned aside")
 * in both ANCHOR_POSE_LOCK and spriteFraming.framingForSide().
 * This is the exact phrasing every existing library hero was
 * generated with — all 20 masters make direct eye contact. Keeps
 * the v2 body-turn fix intact; restores eye contact on top.
 */
export const CANONICAL_BODY_PROMPT_CHECKSUM = 4;

/**
 * An outfit as seen by the composite path. Each slot maps to
 * a piece id (FK into wardrobe_pieces.id) or is absent.
 */
export type Outfit = Partial<Record<Exclude<Slot, "anchor_body">, string>>;
