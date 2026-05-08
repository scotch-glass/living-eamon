// ============================================================
// LIVING EAMON — Stage H: laneLayout tests
//
// Run via:
//   npx tsx __tests__/art/lane-layout.test.ts
// ============================================================

import { layoutLane, SPACE_OFFSETS } from "../../lib/combat/laneLayout";
import { SIZE_CLASSES, type SizeClass } from "../../lib/art/sizeClasses";
import type { CombatantState } from "../../lib/combat/types";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    failures++;
    console.error(`  ✗ ${label} — expected ${String(expected)}, got ${String(actual)}`);
  }
}

function approx(actual: number, expected: number, label: string, tol = 0.01): void {
  if (Math.abs(actual - expected) > tol) {
    failures++;
    console.error(`  ✗ ${label} — expected ~${expected}, got ${actual}`);
  }
}

function caseName(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures++;
    console.error(`  ✗ ${name} — ${(err as Error).message}`);
  }
}

function fakeCombatant(id: string, position: 1 | 2 | 3): CombatantState {
  return {
    id,
    name: id,
    npcId: id,
    team: "ally",
    controlledBy: "ai",
    position,
    hp: 50,
    maxHp: 50,
    mana: 0,
    maxMana: 0,
    armor: 0,
    bodyArmor: {},
    bleed: 0,
    statusEffects: [],
    knownSpells: [],
    combatHotbar: [],
    inventory: [],
    weaponId: null,
    speed: 5,
    initiative: 5,
    picssi: { courage: 0, spirituality: 0 },
  } as unknown as CombatantState;
}

console.log("[lane-layout] equidistant spacing within a class");

caseName("3 same-class allies → back→mid→front from outer to inner edge of lane", () => {
  // Sort is DESCENDING by position so the FRONT rank (position 1) lands
  // on the rightmost lane space, closest to the centerline. The ally
  // lane lives on the left of the screen, so its rightmost space is
  // closest to the centerline. The enemy lane mirrors at the call site.
  const combatants = [fakeCombatant("a", 3), fakeCombatant("b", 2), fakeCombatant("c", 1)];
  const placed = layoutLane(combatants, { widthPx: 1000 }, () => "C");
  eq(placed.length, 3, "3 placements");
  // [back (pos 3), middle (pos 2), front (pos 1)] occupies spaces [0,1,2]
  approx(placed[0]!.centerXPx, 197.5, "back rank at space 0 (outer)");
  approx(placed[1]!.centerXPx, 500, "middle rank at space 1");
  approx(placed[2]!.centerXPx, 802.5, "front rank at space 2 (inner / centerline-side)");
  eq(placed[0]!.combatant.position, 3, "first placement = position 3 (back)");
  eq(placed[2]!.combatant.position, 1, "last placement = position 1 (front)");
});

caseName("offsets are 0.1975 / 0.5 / 0.8025", () => {
  eq(SPACE_OFFSETS[0], 0.1975, "space 0");
  eq(SPACE_OFFSETS[1], 0.5, "space 1");
  eq(SPACE_OFFSETS[2], 0.8025, "space 2");
});

console.log("[lane-layout] mixed-class independence");

caseName("class A and class C lay out in their own rows (independent spacing)", () => {
  const combatants = [
    fakeCombatant("wolf", 1),  // class A — only one of this class
    fakeCombatant("hero", 1),  // class C — front rank
    fakeCombatant("knight", 2), // class C — back rank (relative to hero)
  ];
  const cls: Record<string, SizeClass> = { wolf: "A", hero: "C", knight: "C" };
  const placed = layoutLane(combatants, { widthPx: 1000 }, (c) => cls[c.id] ?? "C");
  // Class A wolf → only one of its class → space 0
  const wolfPlace = placed.find((p) => p.combatant.id === "wolf")!;
  approx(wolfPlace.centerXPx, 197.5, "wolf on space 0");
  eq(wolfPlace.zIndex, SIZE_CLASSES.A.spriteZ, "wolf at class-A Z");
  // Class C: descending sort puts knight (pos 2) at space 0, hero (pos 1)
  // at space 1 — front rank closer to the centerline (rightmost in lane).
  const knightPlace = placed.find((p) => p.combatant.id === "knight")!;
  approx(knightPlace.centerXPx, 197.5, "knight (back rank) on space 0");
  eq(knightPlace.zIndex, SIZE_CLASSES.C.spriteZ, "knight at class-C Z");
  const heroPlace = placed.find((p) => p.combatant.id === "hero")!;
  approx(heroPlace.centerXPx, 500, "hero (front rank) on space 1");
  eq(heroPlace.zIndex, SIZE_CLASSES.C.spriteZ, "hero at class-C Z");
});

console.log("[lane-layout] same-class same-space tiebreak");

caseName("two same-class combatants on same space → tiebreak +0.01 z", () => {
  // Two class-C combatants both at position 1 — they collide on space 0.
  const combatants = [fakeCombatant("a", 1), fakeCombatant("b", 1)];
  const placed = layoutLane(combatants, { widthPx: 1000 }, () => "C");
  eq(placed[0]!.zIndex, SIZE_CLASSES.C.spriteZ, "first arrival = base z");
  approx(placed[1]!.zIndex, SIZE_CLASSES.C.spriteZ + 0.01, "second arrival = base z + 0.01");
});

console.log("[lane-layout] Z order: smaller class higher than larger");

caseName("class A z > class C z > class E z", () => {
  const combatants = [fakeCombatant("dragon", 1), fakeCombatant("knight", 1), fakeCombatant("wolf", 1)];
  const cls: Record<string, SizeClass> = { dragon: "E", knight: "C", wolf: "A" };
  const placed = layoutLane(combatants, { widthPx: 1000 }, (c) => cls[c.id] ?? "C");
  const dragon = placed.find((p) => p.combatant.id === "dragon")!;
  const knight = placed.find((p) => p.combatant.id === "knight")!;
  const wolf = placed.find((p) => p.combatant.id === "wolf")!;
  if (!(wolf.zIndex > knight.zIndex && knight.zIndex > dragon.zIndex)) {
    failures++;
    console.error(`  ✗ Z order broken — wolf ${wolf.zIndex}, knight ${knight.zIndex}, dragon ${dragon.zIndex}`);
  }
});

if (failures > 0) {
  console.error(`\n[lane-layout] ${failures} failures`);
  process.exit(1);
} else {
  console.log("\n[lane-layout] ✓ all cases passed");
}
