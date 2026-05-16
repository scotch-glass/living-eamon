// ============================================================
// LIVING EAMON — Stage F: figureScaleByEye math tests
//
// Run via:
//   npx tsx __tests__/art/figure-scale-by-eye.test.ts
// ============================================================

import { figureScaleByEye, EYE_FROM_TOP_RATIO } from "../../lib/combat/useFigureHeight";
import type { FigureMetrics } from "../../lib/combat/useFigureHeight";
import { targetFigureHeightPx } from "../../lib/art/sizeClasses";

let failures = 0;

function approx(actual: number, expected: number, label: string, tol = 0.5): void {
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

// Helper: build a FigureMetrics for a sprite where:
//   canvas: 800×1024
//   figure: 700px tall, top at y=200, so feet at y=900
//   eye: 0.13 below the figure top (anatomical default)
function metricsNoWeapon(): FigureMetrics {
  return {
    intrinsicWidthPx: 800,
    intrinsicHeightPx: 1024,
    figureTopPx: 200,
    figureHeightPx: 700,
    figureLeftPx: 50,
    figureWidthPx: 700,
    ready: true,
  };
}

// Same person + raised weapon: bbox now spans from y=50 (sword tip) to
// y=900 (feet). Figure-height inflated to 850; figureTop moved up to 50.
// CRITICAL: eye is at the SAME image-Y as the no-weapon case
// (figureTopPx + 0.13 * figureHeightPx in the *no-weapon* case = 200 + 91 = 291).
function metricsWithWeapon(): FigureMetrics {
  return {
    intrinsicWidthPx: 800,
    intrinsicHeightPx: 1024,
    figureTopPx: 50,
    figureHeightPx: 850,
    figureLeftPx: 50,
    figureWidthPx: 700,
    ready: true,
  };
}

const NO_WEAPON_EYE_Y = 291; // 200 + 0.13 * 700 (eye sits at the canonical fraction below the head)

console.log("[figure-scale-by-eye] anchor by eye, ignore weapon position");

caseName("class C: scale picks 460px target height", () => {
  const m = metricsNoWeapon();
  const r = figureScaleByEye(m, NO_WEAPON_EYE_Y, "C");
  // imageEyeToBottom = 900 - 291 = 609
  // targetEyeToBottom = 460 * (1 - 0.13) = 400.2
  // scale = 400.2 / 609 = 0.6571
  // imgHeightPx = 1024 * 0.6571 = 672.86
  approx(r.imgHeightPx, 1024 * (targetFigureHeightPx("C") * (1 - EYE_FROM_TOP_RATIO) / 609), "C imgHeightPx");
});

caseName("raised weapon does NOT shrink the figure", () => {
  // Same person with a raised greatsword: bbox is taller, but eye-Y is
  // unchanged. Result: identical scale to no-weapon case.
  const noWeapon = figureScaleByEye(metricsNoWeapon(), NO_WEAPON_EYE_Y, "C");
  const withWeapon = figureScaleByEye(metricsWithWeapon(), NO_WEAPON_EYE_Y, "C");
  approx(withWeapon.imgHeightPx, noWeapon.imgHeightPx, "weapon-vs-no-weapon imgHeightPx", 1);
  approx(withWeapon.imgWidthPx, noWeapon.imgWidthPx, "weapon-vs-no-weapon imgWidthPx", 1);
});

caseName("class A renders ~1/3 the height of class C", () => {
  const m = metricsNoWeapon();
  const c = figureScaleByEye(m, NO_WEAPON_EYE_Y, "C");
  const a = figureScaleByEye(m, NO_WEAPON_EYE_Y, "A");
  approx(a.imgHeightPx / c.imgHeightPx, 1 / 3, "A:C ratio = 1/3", 0.001);
});

caseName("class D renders 1.5x class C", () => {
  const m = metricsNoWeapon();
  const c = figureScaleByEye(m, NO_WEAPON_EYE_Y, "C");
  const d = figureScaleByEye(m, NO_WEAPON_EYE_Y, "D");
  approx(d.imgHeightPx / c.imgHeightPx, 1.5, "D:C ratio = 1.5", 0.001);
});

caseName("missing eyeYPx throws", () => {
  let threw = false;
  try {
    figureScaleByEye(metricsNoWeapon(), undefined, "C");
  } catch {
    threw = true;
  }
  if (!threw) {
    failures++;
    console.error("  ✗ undefined eyeYPx did not throw");
  }
});

caseName("eye below figure bottom throws", () => {
  let threw = false;
  try {
    figureScaleByEye(metricsNoWeapon(), 950, "C");
  } catch {
    threw = true;
  }
  if (!threw) {
    failures++;
    console.error("  ✗ eye-below-figure did not throw");
  }
});

if (failures > 0) {
  console.error(`\n[figure-scale-by-eye] ${failures} failures`);
  process.exit(1);
} else {
  console.log("\n[figure-scale-by-eye] ✓ all cases passed");
}
