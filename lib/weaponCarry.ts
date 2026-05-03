// ============================================================
// LIVING EAMON — Weapon carry categories for sprite rendering
//
// Maps every weapon item id to one of three "carry" styles that drive
// the hero sprite's composition when a weapon is equipped but not
// drawn. Used by /api/hero-equipment-sprite and HeroScenePortrait.
//
// Categories (4):
//   - unarmed         — no weapon equipped; no weapon in sprite
//   - hip_short_blade — short blade sheathed in a leather scabbard at
//                       the left hip on a sword-belt
//   - hip_long_blade  — longer blade at left hip, longer scabbard
//   - back_two_hander — huge two-handed sword strapped diagonally across
//                       the back, haft over right shoulder
// ============================================================

export type WeaponCarry =
  | "unarmed"
  | "hip_short_blade"
  | "hip_long_blade"
  | "back_two_hander";

const WEAPON_CARRY_MAP: Record<string, WeaponCarry> = {
  short_sword: "hip_short_blade",
  long_sword: "hip_long_blade",
  great_sword: "back_two_hander",
};

/** Resolve a carry category for the equipped weapon. The engine uses
 *  the sentinel string "unarmed" (not null) to mean "no weapon
 *  equipped" — handle that explicitly. Unknown weapon ids fall back
 *  to hip_short_blade (the most common silhouette). */
export function getWeaponCarry(
  weaponId: string | null | undefined
): WeaponCarry {
  if (!weaponId || weaponId === "unarmed") return "unarmed";
  return WEAPON_CARRY_MAP[weaponId] ?? "hip_short_blade";
}
