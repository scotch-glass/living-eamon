// Ultima Online–style weapon metadata (art ids, hands, skills, damage bands).

export const WEAPON_DATA: Record<
  string,
  {
    artId: number;
    twoHanded: boolean;
    skill: string;
    damage: string;
    layer: number;
  }
> = {
  short_sword: { artId: 5049, twoHanded: false, skill: "Swordsmanship", damage: "3-14", layer: 1 },
  long_sword: { artId: 3937, twoHanded: false, skill: "Swordsmanship", damage: "5-17", layer: 1 },
  katana: { artId: 5051, twoHanded: false, skill: "Swordsmanship", damage: "4-15", layer: 1 },
  kryss: { artId: 5121, twoHanded: false, skill: "Fencing", damage: "2-13", layer: 1 },
  dagger: { artId: 5053, twoHanded: false, skill: "Fencing", damage: "2-11", layer: 1 },
  war_axe: { artId: 5116, twoHanded: false, skill: "Mace Fighting", damage: "5-15", layer: 1 },
  mace: { artId: 5124, twoHanded: false, skill: "Mace Fighting", damage: "4-14", layer: 1 },
  scepter: { artId: 5091, twoHanded: false, skill: "Mace Fighting", damage: "4-14", layer: 1 },
  scimitar: { artId: 5127, twoHanded: false, skill: "Swordsmanship", damage: "3-14", layer: 1 },
  cutlass: { artId: 5118, twoHanded: false, skill: "Swordsmanship", damage: "3-14", layer: 1 },
  skinning_knife: { artId: 5128, twoHanded: false, skill: "Fencing", damage: "1-9", layer: 1 },
  halberd: { artId: 5119, twoHanded: true, skill: "Mace Fighting", damage: "5-17", layer: 2 },
  battle_axe: { artId: 5115, twoHanded: true, skill: "Mace Fighting", damage: "6-18", layer: 2 },
  war_hammer: { artId: 5090, twoHanded: true, skill: "Mace Fighting", damage: "7-19", layer: 2 },
  maul: { artId: 5125, twoHanded: true, skill: "Mace Fighting", damage: "6-18", layer: 2 },
  bardiche: { artId: 5113, twoHanded: true, skill: "Mace Fighting", damage: "5-17", layer: 2 },
  executioners_axe: { artId: 5120, twoHanded: true, skill: "Mace Fighting", damage: "7-19", layer: 2 },
  large_battle_axe: { artId: 5122, twoHanded: true, skill: "Mace Fighting", damage: "7-21", layer: 2 },
  spear: { artId: 5040, twoHanded: true, skill: "Fencing", damage: "5-15", layer: 2 },
  war_fork: { artId: 5085, twoHanded: true, skill: "Fencing", damage: "4-15", layer: 2 },
  black_staff: { artId: 5086, twoHanded: true, skill: "Mace Fighting", damage: "4-14", layer: 2 },
  gnarled_staff: { artId: 5087, twoHanded: true, skill: "Mace Fighting", damage: "4-14", layer: 2 },
  quarter_staff: { artId: 5088, twoHanded: true, skill: "Mace Fighting", damage: "4-14", layer: 2 },
  pitchfork: { artId: 5126, twoHanded: true, skill: "Fencing", damage: "4-12", layer: 2 },
  bow: { artId: 5055, twoHanded: true, skill: "Archery", damage: "6-17", layer: 2 },
  crossbow: { artId: 5057, twoHanded: true, skill: "Archery", damage: "5-14", layer: 2 },
  repeating_crossbow: { artId: 5142, twoHanded: true, skill: "Archery", damage: "4-12", layer: 2 },
};

export function isTwoHanded(weaponKey: string): boolean {
  return WEAPON_DATA[weaponKey]?.twoHanded ?? false;
}

export function rollWeaponDamage(weaponKey: string): number {
  const data = WEAPON_DATA[weaponKey];
  if (!data) return Math.floor(Math.random() * 5) + 1;
  const [min, max] = data.damage.split("-").map(Number);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
