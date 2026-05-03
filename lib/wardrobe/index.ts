// ============================================================
// LIVING EAMON — Wardrobe Engine · public barrel
//
// Everything outside lib/wardrobe/ is allowed to import from here
// and nowhere else — the ESLint boundary rule forbids reaching
// into internal modules. Internal mechanics (generate, api,
// extract, paintCrop, prompts/*) stay private.
//
// The wardrobe-v2 design publishes:
//   - Types:     Equipment, WeaponCarry, Stance, Posture, Slot, Outfit
//   - Prompts:   EQUIPMENT_FRAMING, WEAPON_CARRY_FRAMING,
//                STANCE_FRAMING, FRESH_REBIRTH_FRAMING
//                  (shared with legacy hero-equipment-sprite until cutover)
//   - Matrix:    PILOT_EQUIPMENT, PILOT_WEAPONS, PILOT_STANCES
//                  (the 35-combo pilot scope)
//
// getPlayerSprite + PaperdollPopup land in Sprint 3 and Sprint 4
// respectively — they'll be re-exported here when shipped.
// ============================================================

// Paperdoll slot scaffolding — retained for future drag-and-drop UX.
export type { Outfit, Posture, Slot } from "./slots";

// Body-combo prompt framings (single source of truth).
export {
  EQUIPMENT_FRAMING,
  WEAPON_CARRY_FRAMING,
  STANCE_FRAMING,
  FRESH_REBIRTH_FRAMING,
  PILOT_EQUIPMENT,
  PILOT_WEAPONS,
  PILOT_STANCES,
} from "./prompts/body";
export type { Equipment, WeaponCarry, Stance } from "./prompts/body";
