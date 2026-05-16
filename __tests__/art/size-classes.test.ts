// ============================================================
// LIVING EAMON — Stage A: size-class registry tests
//
// Run via:
//   npx tsx __tests__/art/size-classes.test.ts
// ============================================================

import {
  ALL_SIZE_CLASSES,
  BASELINE_FIGURE_HEIGHT_PX,
  SIZE_CLASSES,
  targetFigureHeightPx,
} from "../../lib/art/sizeClasses";
import { spriteSizeToSizeClass } from "../../lib/spriteFraming";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    failures++;
    console.error(`  ✗ ${label} — expected ${String(expected)}, got ${String(actual)}`);
  }
}

function approx(actual: number, expected: number, label: string): void {
  if (Math.abs(actual - expected) > 1e-6) {
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

console.log("[size-classes] registry shape");

caseName("five classes A..E", () => {
  eq(ALL_SIZE_CLASSES.length, 5, "five classes");
  eq(ALL_SIZE_CLASSES.join(","), "A,B,C,D,E", "ordering A..E");
});

caseName("Z-layer math: smaller class = higher Z", () => {
  eq(SIZE_CLASSES.A.spriteZ, 8, "A spriteZ=8");
  eq(SIZE_CLASSES.B.spriteZ, 6, "B spriteZ=6");
  eq(SIZE_CLASSES.C.spriteZ, 4, "C spriteZ=4");
  eq(SIZE_CLASSES.D.spriteZ, 2, "D spriteZ=2");
  eq(SIZE_CLASSES.E.spriteZ, 0, "E spriteZ=0");
});

caseName("gore Z is always sprite Z + 1", () => {
  for (const cls of ALL_SIZE_CLASSES) {
    eq(SIZE_CLASSES[cls].goreZ, SIZE_CLASSES[cls].spriteZ + 1, `${cls} gore = sprite+1`);
  }
});

caseName("class C is the baseline (heightFactor 1.0)", () => {
  eq(SIZE_CLASSES.C.heightFactor, 1.0, "C heightFactor=1");
  eq(targetFigureHeightPx("C"), BASELINE_FIGURE_HEIGHT_PX, "C target = baseline");
});

caseName("class A is 1/3 of baseline", () => {
  approx(targetFigureHeightPx("A"), BASELINE_FIGURE_HEIGHT_PX / 3, "A = baseline/3");
});

caseName("class B is 1/2 of baseline", () => {
  approx(targetFigureHeightPx("B"), BASELINE_FIGURE_HEIGHT_PX / 2, "B = baseline/2");
});

caseName("class D is 1.5x baseline", () => {
  approx(targetFigureHeightPx("D"), BASELINE_FIGURE_HEIGHT_PX * 1.5, "D = 1.5x baseline");
});

console.log("[size-classes] SpriteSize adapter");

caseName("small → B (small humanoid)", () => {
  eq(spriteSizeToSizeClass("small"), "B", "small→B");
});

caseName("medium → C (normal humanoid)", () => {
  eq(spriteSizeToSizeClass("medium"), "C", "medium→C");
});

caseName("large → D (large humanoid)", () => {
  eq(spriteSizeToSizeClass("large"), "D", "large→D");
});

if (failures > 0) {
  console.error(`\n[size-classes] ${failures} failures`);
  process.exit(1);
} else {
  console.log("\n[size-classes] ✓ all cases passed");
}
