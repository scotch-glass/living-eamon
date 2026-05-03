// ============================================================
// LIVING EAMON — Wardrobe V2 · anchor pose lock
//
// ANCHOR_POSE_LOCK is the rigid joint specification appended to
// every full-body wardrobe generation in scripts/wardrobe/forge-body.ts.
// It nails down pose, gaze, lighting, hand placement, hip stance,
// foot angle, and shoulder rotation so the same hero comes out
// pose-aligned across every (equipment × weapon × stance) combo.
//
// (V1's pair-diff pipeline used this same lock to make Call A naked
// and Call B dressed pixel-register; pair-diff was retired. The lock
// still earns its keep in V2 by holding pose constant across the 40
// body combos so the resulting sprites read as the same character.)
//
// Changing this string invalidates every existing wardrobe sprite.
// When tuning, bump CANONICAL_BODY_PROMPT_CHECKSUM in slots.ts and
// regenerate the affected combos via forge-body.ts.
// ============================================================

/**
 * Rigid joint + lighting lock appended AFTER the identity block and
 * BEFORE `canonicalFraming("left", "medium")`. Pose detail is
 * deliberately exhaustive — under-specified pose lets Grok drift a
 * few degrees per regen and that drift breaks the visual contract
 * that "this is the same hero, just dressed differently."
 */
export const ANCHOR_POSE_LOCK = [
  // ── Global anchor posture ─────────────────────────────────
  "Rigid anchor pose, identical between generations:",
  "the figure stands in a still neutral three-quarter stance,",
  "body weight evenly distributed across both feet, heels on a",
  "flat imaginary floor with the feet shoulder-width apart and",
  "toes pointed straight toward the viewer, no contrapposto,",
  "no hip tilt — the pelvis is level and square.",

  // ── Spine + head ──────────────────────────────────────────
  "Spine vertical and relaxed, shoulders level and at rest,",
  "head held upright with the crown of the skull at the top",
  "of the figure region, chin slightly tucked, mouth closed,",
  "jaw unclenched, expression calm and neutral — neither",
  "smiling nor scowling.",

  // ── Arms + hands ──────────────────────────────────────────
  // Default both-hands-empty resting position. Weapon-carry
  // clauses (WEAPON_CARRY_FRAMING in prompts/body.ts) override
  // this for the specific hand that grips a weapon — Grok
  // reliably reconciles "right hand grips bow" against the
  // generic "hands at sides" because the carry clause is more
  // specific.
  "Both arms hang STRAIGHT DOWN at the sides along the torso,",
  "elbows slightly relaxed but not bent, forearms angled a few",
  "degrees outward so the hands clear the thighs by roughly a",
  "palm's width. Fingers relaxed and slightly curled in a",
  "natural resting position, thumbs forward, palms facing the",
  "thighs.",

  // ── Hips + legs ──────────────────────────────────────────
  "Legs vertical and parallel, knees soft but not bent, feet",
  "planted flat with toes forward, no cross-legged stance, no",
  "one foot behind the other, no lifted heel.",

  // ── Gaze — direct eye contact with the viewer ────────────
  // This is the proven-working language from the pre-wardrobe
  // library generator (spriteFraming.ts original wording) — every
  // hero master generated with this phrasing made direct eye
  // contact. Earlier wardrobe revisions that softened or embroidered
  // this ("over the shoulder", "pupils return to camera") LOST eye
  // contact because Grok reinterpreted them. Keep this verbatim.
  "Gaze level and direct, eyes focused STRAIGHT AHEAD AT THE",
  "VIEWER, not turned aside, not downcast, not upward. The eyes",
  "make direct eye contact with the camera.",

  // ── Lighting lock ────────────────────────────────────────
  "Lighting: even soft studio key light from the camera's",
  "upper-front-left, a subtle fill from the upper-front-right,",
  "and no rim light. No cast shadows on the backdrop. No",
  "colored gels. Flat diffuse shading on skin and garments",
  "with gentle falloff — no hard specular highlights.",

  // ── Framing + backdrop lock (rembg-friendly) ─────────────
  "Background: pure flat white (#FFFFFF) with no environmental",
  "detail, no gradient, no texture, no floor line, no horizon,",
  "no shadow beneath the figure. The figure is cleanly isolated",
  "so automatic background removal produces a clean alpha edge.",
].join(" ");
