// ============================================================
// LIVING EAMON — Combat-ready spell predicate
//
// Run via:
//   npx tsx __tests__/combat/combat-ready.test.ts
//
// Verifies COMBAT_HANDLER_SPELLS + hasCombatHandler from
// lib/combat/spellData.ts: every member must also be in
// SUPPORTED_COMBAT_SPELLS, the cardinality matches the engine's
// case list (13 as of 2026-05-08), and case-insensitivity holds.
// Drift catcher — if applyCombatSpellEffect grows a new case branch
// the developer must also extend COMBAT_HANDLER_SPELLS or this
// test fails.
// ============================================================

import {
  COMBAT_HANDLER_SPELLS,
  SUPPORTED_COMBAT_SPELLS,
  hasCombatHandler,
  isCombatSpell,
} from "../../lib/combat/spellData";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`assert ${label} — expected ${e}, got ${a}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function falsy(actual: unknown, label: string): void {
  if (actual) throw new Error(`assert ${label} — expected falsy, got ${actual}`);
}
function caseName(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
  }
}

console.log("[combat-ready] handler set ⊆ supported set");

caseName("Every COMBAT_HANDLER_SPELLS entry is also in SUPPORTED_COMBAT_SPELLS", () => {
  for (const name of COMBAT_HANDLER_SPELLS) {
    truthy(SUPPORTED_COMBAT_SPELLS.has(name), `${name} in SUPPORTED_COMBAT_SPELLS`);
  }
});

caseName("Cardinality is 11 (matches applyCombatSpellEffect case list 2026-05-09)", () => {
  // 2026-05-09: POWER + DAYLIGHT were removed (blockers — set effects
  // had no functional read). MIRROR / BANISH / INVOKE-LIGHT were also
  // removed entirely (no handler at all). The remaining 11: HEAL,
  // BLAST, SPEED, GREATER-HEAL, FIREBOLT, HASTE, WARD, STEELSKIN,
  // SILENCE, RESIST, CLEANSE.
  eq(COMBAT_HANDLER_SPELLS.size, 11, "handler set size");
});

console.log("[combat-ready] specific spells are READY");

const READY_SAMPLE = ["HEAL", "BLAST", "GREATER-HEAL", "FIREBOLT", "WARD", "STEELSKIN", "CLEANSE"];
for (const name of READY_SAMPLE) {
  caseName(`${name} is combat-ready`, () => {
    truthy(hasCombatHandler(name), `hasCombatHandler(${name})`);
  });
}

console.log("[combat-ready] removed spells are not registered");

// 2026-05-09 removal — these spells used to be in SPELL_DATA but their
// effects had blockers (set effect type with no functional read), so
// they were removed entirely. Both `isCombatSpell` and `hasCombatHandler`
// must return false.
const REMOVED_SAMPLE = ["POWER", "DAYLIGHT", "MIRROR", "BANISH", "INVOKE-LIGHT"];
for (const name of REMOVED_SAMPLE) {
  caseName(`${name} is no longer registered`, () => {
    falsy(isCombatSpell(name), `isCombatSpell(${name})`);
    falsy(hasCombatHandler(name), `hasCombatHandler(${name})`);
  });
}

console.log("[combat-ready] case-insensitivity");

caseName("hasCombatHandler is case-insensitive", () => {
  truthy(hasCombatHandler("heal"), "lower");
  truthy(hasCombatHandler("Heal"), "title");
  truthy(hasCombatHandler("HEAL"), "upper");
  truthy(hasCombatHandler("greater-heal"), "lowercase hyphen");
});

caseName("Unknown spells are NOT combat-ready", () => {
  falsy(hasCombatHandler("DRAGONBREATH"), "fictional");
  falsy(hasCombatHandler(""), "empty");
});

if (failures > 0) {
  console.error(`\n[combat-ready] ${failures} failure(s)`);
  process.exit(1);
} else {
  console.log("\n[combat-ready] all green");
}
