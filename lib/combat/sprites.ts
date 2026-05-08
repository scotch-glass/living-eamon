// Shared sprite + party lookups for combat rendering.
//
// SPRITES maps a combatant's `npcId` (or `"hero"` for the player) to its
// rendered art. `flip` mirrors the sprite horizontally at render time —
// every C7 forge prompt asked Grok for ally-facing-right / enemy-facing-
// left, but Grok occasionally ignores the directive, so individual
// sprites can opt into a horizontal flip.
//
// As of 2026-05-08 (sprite-normalization sprint), the per-sprite `flip`
// in this table is a FALLBACK only. The canonical source for `flip` and
// for new fields (`sizeClass`, `eyeYPx`) is `_sprite-metadata.json`
// loaded via `lib/art/useSpriteMeta.ts`. Hardcoded entries here remain
// so legacy CombatScreen.tsx keeps working unchanged.
//
// PARTY_SPEC is the canonical 3v3 party used by the production
// CombatScreen test arena (`/dev/combat-test`) and by any future scripted
// ambush in the live game.

import type { CombatantState } from "./types";
import type { CombatPartySpec } from "./engine";

export const SPRITES: Record<string, { src: string; flip?: boolean }> = {
  hero:            { src: "/art/heroes/gaius/combat/great_sword/v3.png" },
  vivian:          { src: "/art/npcs/vivian/combat/short_sword/v1.png" },
  henchman_brand:  { src: "/art/npcs/henchman_brand/master/v1.png" },
  bandit_blade:    { src: "/art/npcs/bandit_blade/master/v1.png", flip: true },
  bandit_witch:    { src: "/art/npcs/bandit_witch/master/v1.png" },
  bandit_brute:    { src: "/art/npcs/bandit_brute/master/v12.png" },
};

export function spriteFor(c: CombatantState): { src: string | null; flip: boolean } {
  const key = c.npcId ?? "hero";
  const entry = SPRITES[key];
  return { src: entry?.src ?? null, flip: entry?.flip ?? false };
}

/** Resolve a combatant's combat sprite path (null if no entry). */
export function spritePathFor(c: CombatantState): string | null {
  const key = c.npcId ?? "hero";
  return SPRITES[key]?.src ?? null;
}

// Canonical 3v3 party. Positions: 1 = Front (closest to centerline),
// 2 = Middle, 3 = Back. STRIKE evasion bonus applies +0/+10/+20 by
// position; spells ignore position. Mirrored on each side.
export const CANONICAL_PARTY_SPEC: CombatPartySpec = {
  allies: [
    { npcId: "hero",            position: 1 },
    { npcId: "vivian",          position: 2 },
    { npcId: "henchman_brand",  position: 3 },
  ],
  enemies: [
    { npcId: "bandit_brute",    position: 1 },
    { npcId: "bandit_blade",    position: 2 },
    { npcId: "bandit_witch",    position: 3 },
  ],
};

// Background art for the canonical ambush. Used by the test arena and any
// future scripted ambush in the same location.
export const ANCIENT_RUIN_BACKGROUND = "/art/scenes/combat/ancient-ruin-woods/v1.jpg";
