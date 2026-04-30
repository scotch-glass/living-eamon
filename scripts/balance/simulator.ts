// ============================================================
// LIVING EAMON — Balance simulator (v1)
//
// Loads every encounter JSON in ./library/, validates against
// the Encounter schema, and produces three reports:
//
//   1. Library summary  — count by pattern, by PD source, by tag
//   2. Karma coverage   — 6 virtues × 2 directions, which encounters
//                         can drive each cell, max magnitude reachable
//   3. Affect coverage  — 7 affect axes, max value reachable across
//                         the library
//
// Run with:  npx tsx scripts/balance/simulator.ts
//
// This is the v1 audit pass. v2 will add adventure-template
// simulation (walk a player path, accumulate vectors, verify
// coverage targets are hit). v3 will add the generator.
// ============================================================

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  Encounter,
  Virtue,
  AffectAxis,
  PatternType,
  PDSource,
  encounterKarmaReach,
  encounterAffectReach,
} from "./types";

const LIBRARY_DIR = join(__dirname, "library");

const VIRTUES: Virtue[] = [
  "Passion",
  "Integrity",
  "Courage",
  "Standing",
  "Spirituality",
  "Illumination",
];

const AFFECT_AXES: AffectAxis[] = [
  "fear",
  "excitement",
  "eros",
  "dread",
  "awe",
  "wonder",
  "melancholy",
];

function loadLibrary(): Encounter[] {
  const files = readdirSync(LIBRARY_DIR).filter((f) => f.endsWith(".json"));
  const out: Encounter[] = [];
  for (const file of files) {
    const raw = readFileSync(join(LIBRARY_DIR, file), "utf8");
    try {
      const enc = JSON.parse(raw) as Encounter;
      validate(enc, file);
      out.push(enc);
    } catch (e) {
      console.error(`✗ Failed to parse ${file}: ${(e as Error).message}`);
      process.exit(1);
    }
  }
  return out;
}

function validate(enc: Encounter, file: string): void {
  if (!enc.id) throw new Error(`${file}: missing id`);
  if (!enc.title) throw new Error(`${file}: missing title`);
  if (!enc.pdSource) throw new Error(`${file}: missing pdSource`);
  if (typeof enc.pdSafe !== "boolean") throw new Error(`${file}: missing pdSafe`);
  if (!enc.patternType) throw new Error(`${file}: missing patternType`);
  if (!enc.choices || enc.choices.length === 0) {
    throw new Error(`${file}: must have at least 1 choice`);
  }
  for (const c of enc.choices) {
    if (!c.id) throw new Error(`${file}: choice missing id`);
    if (!c.karma) throw new Error(`${file}: choice ${c.id} missing karma`);
    if (!c.affect) throw new Error(`${file}: choice ${c.id} missing affect`);
    if (!c.resolutionHint) throw new Error(`${file}: choice ${c.id} missing resolutionHint`);
  }
}

// ── REPORT 1: LIBRARY SUMMARY ────────────────────────────────

function reportLibrarySummary(library: Encounter[]): void {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  LIBRARY SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Total encounters:  ${library.length}`);
  console.log(`Total choices:     ${library.reduce((a, e) => a + e.choices.length, 0)}`);

  const byPattern = new Map<PatternType, number>();
  for (const e of library) byPattern.set(e.patternType, (byPattern.get(e.patternType) ?? 0) + 1);
  console.log("\nBy pattern:");
  for (const [p, n] of [...byPattern.entries()].sort()) {
    console.log(`  ${p.padEnd(20)} ${n}`);
  }

  const bySource = new Map<PDSource, number>();
  for (const e of library) bySource.set(e.pdSource, (bySource.get(e.pdSource) ?? 0) + 1);
  console.log("\nBy PD source:");
  for (const [s, n] of [...bySource.entries()].sort()) {
    console.log(`  ${s.padEnd(28)} ${n}`);
  }

  const pdUnsafe = library.filter((e) => !e.pdSafe);
  if (pdUnsafe.length > 0) {
    console.log(`\n⚠ ${pdUnsafe.length} encounter(s) flagged pdSafe=false:`);
    for (const e of pdUnsafe) console.log(`  - ${e.id}`);
  }
}

// ── REPORT 2: KARMA COVERAGE MATRIX ──────────────────────────

function reportKarmaCoverage(library: Encounter[]): void {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  KARMA COVERAGE MATRIX");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Per virtue: how many encounters can drive it +/-,");
  console.log("  and the max single-choice magnitude available.\n");

  console.log("  Virtue          +Count  +MaxMag    -Count  -MaxMag");
  console.log("  " + "─".repeat(54));

  for (const v of VIRTUES) {
    let posCount = 0;
    let posMax = 0;
    let negCount = 0;
    let negMin = 0;
    for (const e of library) {
      const reach = encounterKarmaReach(e);
      if (reach.maxGain[v] !== undefined && reach.maxGain[v]! > 0) {
        posCount++;
        posMax = Math.max(posMax, reach.maxGain[v]!);
      }
      if (reach.maxLoss[v] !== undefined && reach.maxLoss[v]! < 0) {
        negCount++;
        negMin = Math.min(negMin, reach.maxLoss[v]!);
      }
    }
    const row = `  ${v.padEnd(15)} ${String(posCount).padStart(5)}   ${("+" + posMax).padStart(6)}   ${String(negCount).padStart(5)}   ${String(negMin).padStart(6)}`;
    const flag = posCount === 0 || negCount === 0 ? "  ⚠ DEAD ZONE" : "";
    console.log(row + flag);
  }
}

// ── REPORT 3: AFFECT COVERAGE ────────────────────────────────

function reportAffectCoverage(library: Encounter[]): void {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  AFFECT COVERAGE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Max value reachable on each affective axis across");
  console.log("  the library (after applying the strongest choice).\n");

  console.log("  Axis          MaxReach  Encounters-touching");
  console.log("  " + "─".repeat(45));

  for (const axis of AFFECT_AXES) {
    let maxReach = 0;
    let touching = 0;
    for (const e of library) {
      const reach = encounterAffectReach(e);
      if (reach.max[axis] !== undefined && reach.max[axis]! > 0) {
        touching++;
        maxReach = Math.max(maxReach, reach.max[axis]!);
      }
    }
    const flag = touching === 0 ? "  ⚠ ABSENT" : "";
    console.log(`  ${axis.padEnd(13)} ${maxReach.toFixed(2).padStart(7)}    ${String(touching).padStart(4)}` + flag);
  }
}

// ── MAIN ────────────────────────────────────────────────────

function main(): void {
  const library = loadLibrary();
  reportLibrarySummary(library);
  reportKarmaCoverage(library);
  reportAffectCoverage(library);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ✓ Library validated, reports complete.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main();
