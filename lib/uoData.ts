// Ultima Online–style weapon metadata (art ids, hands, skills, damage bands).

import type { WeaponSkills } from "./gameState";

// ── weaponSpeed (AD&D 2e initiative factor; 1 = fastest, 10 = slowest) ──
// Initiative is rolled as: `1d10 + weaponSpeed - getDexReactionBonus(dex)`.
// LOWER total = acts earlier. Therefore: lower weaponSpeed = acts first.
//
// Canonical design (decided 2026-05-06):
//   - Short sword / dagger → FASTEST  → LOWEST damage band
//   - Long sword          → MEDIUM   → MEDIUM damage band
//   - Great sword         → SLOWEST  → HIGHEST damage band
//
// Damage is INVERSE to speed: the faster the swing, the less the weight
// behind it. This makes the three swords meaningfully distinct picks
// rather than a strict upgrade ladder. Pick by build:
//   - DEX-fighter / acrobat-thief (Vivian) → short sword (act first, hit often)
//   - Balanced fighter           → long sword
//   - Heavy fighter / brute      → great sword (one big swing, late in round)
//
// Spread chosen so short vs great differ by ~6 initiative on average — a
// short-sword wielder typically gets a free strike or two before a maul
// drops, but a maul that connects ends the conversation.
//
// (Original speeds 3/5/7 were derived from T2A UO via the formula
//  `10 - ((UOspeed - 10) / 48) * 9` — kept for reference, replaced by the
//  hand-tuned 2/5/8 spread above. unarmed stays at 2: fists are quick.)

export const WEAPON_DATA: Record<
  string,
  {
    artId: number;
    twoHanded: boolean;
    skill: string;
    damage: string;
    layer: number;
    weaponSpeed: number;
  }
> = {
  unarmed:           { artId: 0,    twoHanded: false, skill: "Swordsmanship", damage: "1d4",    layer: 1, weaponSpeed: 2 },
  // Short sword / dagger class — fastest weapon, lowest damage band.
  short_sword:       { artId: 5049, twoHanded: false, skill: "Swordsmanship", damage: "1d12+2", layer: 1, weaponSpeed: 2 },
  // Long sword — balanced one-handed weapon, medium speed and damage.
  long_sword:        { artId: 3937, twoHanded: false, skill: "Swordsmanship", damage: "1d12+4", layer: 1, weaponSpeed: 5 },
  // Great sword / two-handed maul class — slowest weapon, highest damage band.
  great_sword:       { artId: 5119, twoHanded: true,  skill: "Swordsmanship", damage: "2d8+4",  layer: 2, weaponSpeed: 8 },
};

// DEX reaction bonus table — AD&D 2e PHB Table 2
// Applied as: initiative = 1d10 + weaponSpeed - getDexReactionBonus(dex)
// Starting player DEX is 10, giving bonus of 0 (no modifier)
// DEX 18 gives -4 to initiative roll (acts earlier)
// DEX 3 gives +4 to initiative roll (acts later)

/**
 * AD&D 2e DEX reaction adjustment for initiative.
 * Subtract this value from the initiative roll.
 * Higher DEX = higher bonus = lower initiative total = acts first.
 */
export function getDexReactionBonus(dex: number): number {
  if (dex <= 3) return -4; // Very slow — adds to roll
  if (dex <= 5) return -3;
  if (dex <= 8) return -1;
  if (dex <= 12) return 0; // Average — no modifier
  if (dex <= 15) return 1;
  if (dex === 16) return 2;
  if (dex === 17) return 3;
  return 4; // DEX 18+ — fastest reaction
}

export function isTwoHanded(weaponKey: string): boolean {
  return WEAPON_DATA[weaponKey]?.twoHanded ?? false;
}

/** Roll dice notation: "2d6+3", "1d8", "1d4+1", or legacy "3-14" range. */
export function rollDice(notation: string): number {
  // Dice format: NdS+M
  const diceMatch = notation.match(/^(\d+)d(\d+)(?:\+(\d+))?$/);
  if (diceMatch) {
    const count = parseInt(diceMatch[1]!);
    const sides = parseInt(diceMatch[2]!);
    const mod = parseInt(diceMatch[3] ?? "0");
    let total = mod;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
  }
  // Legacy range format: min-max
  const [min, max] = notation.split("-").map(Number);
  if (!isNaN(min!) && !isNaN(max!)) {
    return Math.floor(Math.random() * (max! - min! + 1)) + min!;
  }
  return Math.floor(Math.random() * 5) + 1;
}

export function rollWeaponDamage(weaponKey: string): number {
  const data = WEAPON_DATA[weaponKey];
  if (!data) return Math.floor(Math.random() * 5) + 1;
  return rollDice(data.damage);
}

export function getWeaponSkillKey(_weaponKey: string): keyof WeaponSkills {
  return "swordsmanship";
}
