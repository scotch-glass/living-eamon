// Ultima Online–style weapon metadata (art ids, hands, skills, damage bands).

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
  short_sword: { artId: 5049, twoHanded: false, skill: "Swordsmanship", damage: "3-14", layer: 1, weaponSpeed: 3 },
  rusty_shortsword: {
    artId: 5049,
    twoHanded: false,
    skill: "Swordsmanship",
    damage: "1-4",
    layer: 1,
    weaponSpeed: 5,
  },
  long_sword: { artId: 3937, twoHanded: false, skill: "Swordsmanship", damage: "5-17", layer: 1, weaponSpeed: 5 },
  katana: { artId: 5051, twoHanded: false, skill: "Swordsmanship", damage: "4-15", layer: 1, weaponSpeed: 1 },
  kryss: { artId: 5121, twoHanded: false, skill: "Fencing", damage: "2-13", layer: 1, weaponSpeed: 2 },
  dagger: { artId: 5053, twoHanded: false, skill: "Fencing", damage: "2-11", layer: 1, weaponSpeed: 1 },
  war_axe: { artId: 5116, twoHanded: false, skill: "Mace Fighting", damage: "5-15", layer: 1, weaponSpeed: 4 },
  mace: { artId: 5124, twoHanded: false, skill: "Mace Fighting", damage: "4-14", layer: 1, weaponSpeed: 6 },
  scepter: { artId: 5091, twoHanded: false, skill: "Mace Fighting", damage: "4-14", layer: 1, weaponSpeed: 6 },
  scimitar: { artId: 5127, twoHanded: false, skill: "Swordsmanship", damage: "3-14", layer: 1, weaponSpeed: 4 },
  cutlass: { artId: 5118, twoHanded: false, skill: "Swordsmanship", damage: "3-14", layer: 1, weaponSpeed: 3 },
  skinning_knife: { artId: 5128, twoHanded: false, skill: "Fencing", damage: "1-9", layer: 1, weaponSpeed: 4 },
  halberd: { artId: 5119, twoHanded: true, skill: "Mace Fighting", damage: "5-17", layer: 2, weaponSpeed: 7 },
  battle_axe: { artId: 5115, twoHanded: true, skill: "Mace Fighting", damage: "6-18", layer: 2, weaponSpeed: 6 },
  war_hammer: { artId: 5090, twoHanded: true, skill: "Mace Fighting", damage: "7-19", layer: 2, weaponSpeed: 6 },
  maul: { artId: 5125, twoHanded: true, skill: "Mace Fighting", damage: "6-18", layer: 2, weaponSpeed: 6 },
  bardiche: { artId: 5113, twoHanded: true, skill: "Mace Fighting", damage: "5-17", layer: 2, weaponSpeed: 7 },
  executioners_axe: { artId: 5120, twoHanded: true, skill: "Mace Fighting", damage: "7-19", layer: 2, weaponSpeed: 5 },
  large_battle_axe: { artId: 5122, twoHanded: true, skill: "Mace Fighting", damage: "7-21", layer: 2, weaponSpeed: 6 },
  spear: { artId: 5040, twoHanded: true, skill: "Fencing", damage: "5-15", layer: 2, weaponSpeed: 3 },
  war_fork: { artId: 5085, twoHanded: true, skill: "Fencing", damage: "4-15", layer: 2, weaponSpeed: 3 },
  black_staff: { artId: 5086, twoHanded: true, skill: "Mace Fighting", damage: "4-14", layer: 2, weaponSpeed: 5 },
  gnarled_staff: { artId: 5087, twoHanded: true, skill: "Mace Fighting", damage: "4-14", layer: 2, weaponSpeed: 5 },
  quarter_staff: { artId: 5088, twoHanded: true, skill: "Mace Fighting", damage: "4-14", layer: 2, weaponSpeed: 3 },
  pitchfork: { artId: 5126, twoHanded: true, skill: "Fencing", damage: "4-12", layer: 2, weaponSpeed: 3 },
  bow: { artId: 5055, twoHanded: true, skill: "Archery", damage: "6-17", layer: 2, weaponSpeed: 8 },
  crossbow: { artId: 5057, twoHanded: true, skill: "Archery", damage: "5-14", layer: 2, weaponSpeed: 9 },
  repeating_crossbow: { artId: 5142, twoHanded: true, skill: "Archery", damage: "4-12", layer: 2, weaponSpeed: 8 },
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

export function rollWeaponDamage(weaponKey: string): number {
  const data = WEAPON_DATA[weaponKey];
  if (!data) return Math.floor(Math.random() * 5) + 1;
  const [min, max] = data.damage.split("-").map(Number);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
