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
    fakeCombatant("wolf", 1),   // class A — front rank
    fakeCombatant("hero", 1),   // class C — front rank
    fakeCombatant("knight", 2), // class C — middle rank
  ];
  const cls: Record<string, SizeClass> = { wolf: "A", hero: "C", knight: "C" };
  const placed = layoutLane(combatants, { widthPx: 1000 }, (c) => cls[c.id] ?? "C");
  // Position-anchored mapping: pos 1 → space 2 (front, closest to
  // centerline), pos 2 → space 1, pos 3 → space 0. Each class gets its
  // own copy of the 3-space ring; the wolf at position 1 lands on the
  // class-A space 2 just like the hero lands on the class-C space 2.
  const wolfPlace = placed.find((p) => p.combatant.id === "wolf")!;
  approx(wolfPlace.centerXPx, 802.5, "wolf (pos 1) on space 2 (front)");
  eq(wolfPlace.zIndex, SIZE_CLASSES.A.spriteZ, "wolf at class-A Z");
  const knightPlace = placed.find((p) => p.combatant.id === "knight")!;
  approx(knightPlace.centerXPx, 500, "knight (pos 2) on space 1 (middle)");
  eq(knightPlace.zIndex, SIZE_CLASSES.C.spriteZ, "knight at class-C Z");
  const heroPlace = placed.find((p) => p.combatant.id === "hero")!;
  approx(heroPlace.centerXPx, 802.5, "hero (pos 1) on space 2 (front)");
  eq(heroPlace.zIndex, SIZE_CLASSES.C.spriteZ, "hero at class-C Z");
});

caseName("survivors keep their spaces when a teammate dies (no backward retreat)", () => {
  // Regression for 2026-05-08: when Brand (pos 3) died, the old layout
  // re-packed Vivian (pos 2) to space 0, visually pulling her toward
  // the back of the lane. New behavior: every survivor stays at the
  // space their position dictates regardless of who else is on the
  // lane.
  const fullLane = [fakeCombatant("g", 1), fakeCombatant("v", 2), fakeCombatant("b", 3)];
  const fullPlaced = layoutLane(fullLane, { widthPx: 1000 }, () => "C");
  const gFull = fullPlaced.find((p) => p.combatant.id === "g")!;
  const vFull = fullPlaced.find((p) => p.combatant.id === "v")!;

  // After Brand dies: Vivian and Gaius keep their positions (1 and 2).
  // The promote-on-death engine logic decides who moves; the layout
  // just maps position → space.
  const survivors = [fakeCombatant("g", 1), fakeCombatant("v", 2)];
  const aliveOnly = layoutLane(survivors, { widthPx: 1000 }, () => "C");
  const gAlive = aliveOnly.find((p) => p.combatant.id === "g")!;
  const vAlive = aliveOnly.find((p) => p.combatant.id === "v")!;

  approx(gAlive.centerXPx, gFull.centerXPx, "Gaius (pos 1) stays on space 2");
  approx(vAlive.centerXPx, vFull.centerXPx, "Vivian (pos 2) stays on space 1");
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
