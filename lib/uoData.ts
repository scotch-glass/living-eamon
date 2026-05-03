// Ultima Online–style weapon metadata (art ids, hands, skills, damage bands).

import type { WeaponSkills } from "./gameState";

// weaponSpeed: AD&D 2e initiative factor (1=fastest, 10=slowest)
// Derived from T2A UO swing speed using inverted scale conversion:
// AD&D factor = round(10 - ((UOspeed - 10) / 48) * 9)
// Lower factor = acts earlier in initiative roll
// Higher UO speed = lower AD&D factor = acts first
// Source: wiki.uosecondage.com/Weapons

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
  short_sword:       { artId: 5049, twoHanded: false, skill: "Swordsmanship", damage: "1d12+2", layer: 1, weaponSpeed: 3 },
  long_sword:        { artId: 3937, twoHanded: false, skill: "Swordsmanship", damage: "1d12+4", layer: 1, weaponSpeed: 5 },
  great_sword:       { artId: 5119, twoHanded: true,  skill: "Swordsmanship", damage: "2d8+4",  layer: 2, weaponSpeed: 7 },
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
