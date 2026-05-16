// ============================================================
// LIVING EAMON — Stature modifier (locked 2026-05-08)
//
// Run via:
//   npx tsx __tests__/art/stature.test.ts
//
// Verifies:
//   - statureMultiplier(): 0.9× female, 1.1× hero, compounds for
//     female hero (0.99×), 1.0× for normal humanoid male.
//   - figureScaleByEye() applies the stature multiplier on top of
//     the size-class baseline. Default arg = 1 → existing math
//     unchanged for non-migrated callers.
// ============================================================

import { statureMultiplier } from "../../lib/art/sizeClasses";
import { figureScaleByEye } from "../../lib/combat/useFigureHeight";
import type { FigureMetrics } from "../../lib/combat/useFigureHeight";

let failures = 0;

function approx(actual: number, expected: number, label: string, tol = 0.001): void {
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

console.log("[stature] statureMultiplier — gender + hero rules");

caseName("normal humanoid male = 1.0×", () => {
  approx(statureMultiplier({ gender: "male", isHero: false }), 1.0, "male non-hero");
});

caseName("female = 0.9×", () => {
  approx(statureMultiplier({ gender: "female", isHero: false }), 0.9, "female non-hero");
});

caseName("male hero = 1.1×", () => {
  approx(statureMultiplier({ gender: "male", isHero: true }), 1.1, "male hero");
});

caseName("female hero compounds = 0.99×", () => {
  approx(statureMultiplier({ gender: "female", isHero: true }), 0.99, "female hero");
});

console.log("[stature] figureScaleByEye applies multiplier on top of class");

const metrics: FigureMetrics = {
  intrinsicWidthPx: 800,
  intrinsicHeightPx: 1024,
  figureTopPx: 200,
  figureHeightPx: 700,
  figureLeftPx: 50,
  figureWidthPx: 700,
  ready: true,
};
const EYE_Y = 291; // canonical anatomical eye-line for the test fixture

caseName("default staturePct (omitted) = 1.0× — old math unchanged", () => {
  const a = figureScaleByEye(metrics, EYE_Y, "C");
  const b = figureScaleByEye(metrics, EYE_Y, "C", 1);
  approx(b.imgHeightPx, a.imgHeightPx, "default vs explicit 1.0", 0.001);
});

caseName("hero (1.1×) renders 10% taller than baseline", () => {
  const baseline = figureScaleByEye(metrics, EYE_Y, "C", 1.0);
  const hero = figureScaleByEye(metrics, EYE_Y, "C", 1.1);
  approx(hero.imgHeightPx / baseline.imgHeightPx, 1.1, "hero:baseline = 1.1");
});

caseName("female (0.9×) renders 10% smaller than baseline", () => {
  const baseline = figureScaleByEye(metrics, EYE_Y, "C", 1.0);
  const female = figureScaleByEye(metrics, EYE_Y, "C", 0.9);
  approx(female.imgHeightPx / baseline.imgHeightPx, 0.9, "female:baseline = 0.9");
});

caseName("female hero (0.99×) compounds correctly", () => {
  const baseline = figureScaleByEye(metrics, EYE_Y, "C", 1.0);
  const femaleHero = figureScaleByEye(metrics, EYE_Y, "C", 0.99);
  approx(femaleHero.imgHeightPx / baseline.imgHeightPx, 0.99, "femaleHero:baseline = 0.99");
});

caseName("hero/female ratio = 1.1/0.9 ≈ 1.222", () => {
  const female = figureScaleByEye(metrics, EYE_Y, "C", 0.9);
  const hero = figureScaleByEye(metrics, EYE_Y, "C", 1.1);
  approx(hero.imgHeightPx / female.imgHeightPx, 1.1 / 0.9, "hero:female ≈ 1.222");
});

console.log("[stature] integration with size class");

caseName("class A male hero scales 1.1× over its A baseline", () => {
  const baselineA = figureScaleByEye(metrics, EYE_Y, "A", 1.0);
  const heroA = figureScaleByEye(metrics, EYE_Y, "A", 1.1);
  approx(heroA.imgHeightPx / baselineA.imgHeightPx, 1.1, "A hero ratio");
});

caseName("class D female keeps 0.9× over its D baseline", () => {
  const baselineD = figureScaleByEye(metrics, EYE_Y, "D", 1.0);
  const femD = figureScaleByEye(metrics, EYE_Y, "D", 0.9);
  approx(femD.imgHeightPx / baselineD.imgHeightPx, 0.9, "D female ratio");
});

if (failures > 0) {
  console.error(`\n[stature] ${failures} failures`);
  process.exit(1);
} else {
  console.log("\n[stature] ✓ all cases passed");
}
