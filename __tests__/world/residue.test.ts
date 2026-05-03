// ============================================================
// LIVING EAMON — Sprint G5: room residue tests
//
// Run via:
//   npx tsx __tests__/world/residue.test.ts
//
// Coverage:
//   1. pushResidue adds a ResidueEntry to the target room.
//   2. ResidueEntry has correct type, fromSpellId, spellCircle.
//   3. decayAt = realTimeMs + decayHours * circle * 3600000 (repairCircleMult).
//   4. decayAt = realTimeMs + decayHours * 1 * 3600000 (no repairCircleMult).
//   5. repairRequired entries: decayAt = MAX_SAFE_INTEGER.
//   6. tickRealTime removes expired non-repair residues.
//   7. tickRealTime keeps non-expired residues.
//   8. tickRealTime never removes repairRequired residues.
//   9. Multiple residues in one room: only expired ones removed.
//  10. pushResidue on a room not yet in state.rooms creates the entry.
//  11. SPELL_RESIDUE["fireball"] is not null (catalog sanity).
//  12. SPELL_RESIDUE["heal"] is null (no room residue).
//  13. COMBAT_RESIDUE.critical_hit exists with type "blood".
// ============================================================

import {
  createInitialWorldState,
  pushResidue,
  tickRealTime,
} from "../../lib/gameState";
import { SPELL_RESIDUE, COMBAT_RESIDUE } from "../../lib/world/spellResidue";
import type { WorldState } from "../../lib/gameState";

let failures = 0;
function caseName(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}
function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected)
    throw new Error(`assert ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function falsy(actual: unknown, label: string): void {
  if (actual) throw new Error(`assert ${label} — expected falsy, got ${actual}`);
}

console.log("Sprint G5 — room residue tests");

const fireballTemplate = SPELL_RESIDUE["fireball"]!;
const wallTemplate = SPELL_RESIDUE["wall-of-stone"]!;
const healTemplate = SPELL_RESIDUE["heal"];

// ── pushResidue ───────────────────────────────────────────────

caseName("pushResidue adds entry to target room", () => {
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "main_hall", fireballTemplate, "fireball", 3);
  const residues = next.rooms["main_hall"]?.activeResidue ?? [];
  eq(residues.length, 1, "one residue added");
  eq(residues[0].fromSpellId, "fireball", "fromSpellId");
  eq(residues[0].type, "scorch", "type");
  eq(residues[0].spellCircle, 3, "spellCircle");
});

caseName("ResidueEntry has correct type and description", () => {
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "main_hall", fireballTemplate, "fireball", 3);
  const r = next.rooms["main_hall"].activeResidue![0];
  truthy(r.description.length > 0, "description non-empty");
  eq(r.repairRequired, false, "fireball not repairRequired");
});

caseName("decayAt uses repairCircleMult when flag is set", () => {
  const base = createInitialWorldState("Tester");
  // fireball: 48h * circle 3 * 3600000
  const next = pushResidue(base, "main_hall", fireballTemplate, "fireball", 3);
  const r = next.rooms["main_hall"].activeResidue![0];
  const expectedDecay = base.realTimeMs + (48 * 3 * 3600 * 1000);
  eq(r.decayAt, expectedDecay, "decayAt with circleMult");
});

caseName("decayAt ignores circle when repairCircleMult is absent", () => {
  const base = createInitialWorldState("Tester");
  // critical_hit: 24h (no repairCircleMult)
  const next = pushResidue(base, "main_hall", COMBAT_RESIDUE.critical_hit, "critical_hit", 0);
  const r = next.rooms["main_hall"].activeResidue![0];
  const expectedDecay = base.realTimeMs + (24 * 1 * 3600 * 1000);
  eq(r.decayAt, expectedDecay, "decayAt without circleMult");
});

caseName("wall-of-stone: repairRequired → decayAt = MAX_SAFE_INTEGER", () => {
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "main_hall", wallTemplate, "wall-of-stone", 3);
  const r = next.rooms["main_hall"].activeResidue![0];
  eq(r.decayAt, Number.MAX_SAFE_INTEGER, "decayAt is MAX_SAFE_INTEGER");
  eq(r.repairRequired, true, "repairRequired");
});

caseName("pushResidue creates room entry for unknown room", () => {
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "some_adventure_room", fireballTemplate, "fireball", 3);
  const residues = next.rooms["some_adventure_room"]?.activeResidue ?? [];
  eq(residues.length, 1, "residue created in new room");
});

// ── tickRealTime decay ────────────────────────────────────────

caseName("tickRealTime removes expired non-repair residue", () => {
  let state = createInitialWorldState("Tester");
  // Push a residue with 1h decay
  const shortTemplate = { ...COMBAT_RESIDUE.critical_hit, decayHours: 1 };
  state = pushResidue(state, "main_hall", shortTemplate, "critical_hit", 0);
  // Advance by 2 hours = 7,200,000 ms
  state = tickRealTime(state, 2 * 3600 * 1000);
  const residues = state.rooms["main_hall"]?.activeResidue ?? [];
  eq(residues.length, 0, "expired residue removed");
});

caseName("tickRealTime keeps non-expired residue", () => {
  let state = createInitialWorldState("Tester");
  state = pushResidue(state, "main_hall", fireballTemplate, "fireball", 3);
  // Advance by 1 hour (fireball circle-3 decays at 144h)
  state = tickRealTime(state, 1 * 3600 * 1000);
  const residues = state.rooms["main_hall"]?.activeResidue ?? [];
  eq(residues.length, 1, "unexpired residue kept");
});

caseName("tickRealTime never removes repairRequired residue", () => {
  let state = createInitialWorldState("Tester");
  state = pushResidue(state, "main_hall", wallTemplate, "wall-of-stone", 3);
  // Advance by 1000 hours — should NOT clear
  state = tickRealTime(state, 1000 * 3600 * 1000);
  const residues = state.rooms["main_hall"]?.activeResidue ?? [];
  eq(residues.length, 1, "repairRequired residue survives 1000h tick");
});

caseName("tickRealTime: only expired entries removed, others kept", () => {
  let state = createInitialWorldState("Tester");
  const shortTemplate = { ...COMBAT_RESIDUE.critical_hit, decayHours: 1 };
  state = pushResidue(state, "main_hall", shortTemplate, "critical_hit", 0);
  state = pushResidue(state, "main_hall", fireballTemplate, "fireball", 3); // 144h decay
  // Advance 2 hours — short expires, fireball stays
  state = tickRealTime(state, 2 * 3600 * 1000);
  const residues = state.rooms["main_hall"]?.activeResidue ?? [];
  eq(residues.length, 1, "only one remains");
  eq(residues[0].fromSpellId, "fireball", "fireball stays");
});

// ── SPELL_RESIDUE catalog sanity ──────────────────────────────

caseName("SPELL_RESIDUE fireball: not null, type scorch", () => {
  truthy(fireballTemplate !== null, "fireball has residue");
  eq(fireballTemplate!.residueType, "scorch", "fireball is scorch");
  eq(fireballTemplate!.repairCircleMult, true, "fireball has repairCircleMult");
});

caseName("SPELL_RESIDUE heal: null (no residue)", () => {
  falsy(healTemplate, "heal has no residue");
});

caseName("COMBAT_RESIDUE critical_hit: type blood, 24h", () => {
  eq(COMBAT_RESIDUE.critical_hit.residueType, "blood", "crit type");
  eq(COMBAT_RESIDUE.critical_hit.decayHours, 24, "crit decay hours");
  eq(COMBAT_RESIDUE.critical_hit.repairRequired, false, "crit not repairRequired");
});

// ── Summary ──────────────────────────────────────────────────
if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All G5 residue tests passed");
}
