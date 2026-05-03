// ============================================================
// LIVING EAMON — Sprint G6: NPC repair tests
//
// Run via:
//   npx tsx __tests__/world/repair.test.ts
//
// Coverage:
//   1. pushResidue(repairRequired) sets repairNpcId and repairTargetHours.
//   2. pushResidue(not repairRequired) leaves repairNpcId undefined.
//   3. repairTargetHours = decayHours * circleMult (circle 3 example).
//   4. repairTargetHours = decayHours when no repairCircleMult.
//   5. tickRealTime advances repairProgress over time.
//   6. tickRealTime removes residue when repairProgress >= 1.0.
//   7. tickRealTime does not advance residue without repairNpcId.
//   8. Non-repairRequired residues unaffected by repair pass.
//   9. NPCS pool has ≥5 mason NPCs.
//  10. NPCS pool has ≥5 carpenter NPCs.
//  11. NPCS pool has ≥5 smith NPCs.
//  12. NPCS pool has ≥5 cleaner NPCs.
//  13. repairNpcId for wall-of-stone resolves to a real NPCS entry.
// ============================================================

import {
  createInitialWorldState,
  pushResidue,
  tickRealTime,
} from "../../lib/gameState";
import { NPCS } from "../../lib/gameData";
import { SPELL_RESIDUE } from "../../lib/world/spellResidue";

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
function gte(actual: number, floor: number, label: string): void {
  if (actual < floor)
    throw new Error(`assert ${label} — expected >= ${floor}, got ${actual}`);
}

console.log("Sprint G6 — NPC repair tests");

const wallTemplate = SPELL_RESIDUE["wall-of-stone"]!;
const fireballTemplate = SPELL_RESIDUE["fireball"]!;

// ── pushResidue + repairNpcId ─────────────────────────────────

caseName("pushResidue(repairRequired) sets repairNpcId", () => {
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "main_hall", wallTemplate, "wall-of-stone", 3);
  const r = next.rooms["main_hall"].activeResidue![0];
  truthy(r.repairNpcId, "repairNpcId is set");
});

caseName("pushResidue(repairRequired) sets repairTargetHours", () => {
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "main_hall", wallTemplate, "wall-of-stone", 3);
  const r = next.rooms["main_hall"].activeResidue![0];
  // wall-of-stone: 72h * circle 3 = 216h
  eq(r.repairTargetHours, 216, "repairTargetHours = 72 * 3");
});

caseName("pushResidue(not repairRequired) leaves repairNpcId undefined", () => {
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "main_hall", fireballTemplate, "fireball", 3);
  const r = next.rooms["main_hall"].activeResidue![0];
  falsy(r.repairNpcId, "repairNpcId absent for non-repair entry");
});

caseName("pushResidue(not repairRequired) leaves repairTargetHours undefined", () => {
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "main_hall", fireballTemplate, "fireball", 3);
  const r = next.rooms["main_hall"].activeResidue![0];
  falsy(r.repairTargetHours, "repairTargetHours absent for non-repair entry");
});

caseName("repairTargetHours = decayHours when no repairCircleMult", () => {
  // Create a synthetic template with repairRequired but no repairCircleMult
  const template = { ...wallTemplate, repairCircleMult: false as const };
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "main_hall", template, "wall-of-stone", 5);
  const r = next.rooms["main_hall"].activeResidue![0];
  // circleMult = 1 when repairCircleMult is false
  eq(r.repairTargetHours, wallTemplate.decayHours, "repairTargetHours = decayHours");
});

// ── tickRealTime repair advancement ──────────────────────────

caseName("tickRealTime advances repairProgress", () => {
  let state = createInitialWorldState("Tester");
  state = pushResidue(state, "main_hall", wallTemplate, "wall-of-stone", 1);
  const r0 = state.rooms["main_hall"].activeResidue![0];
  truthy(r0.repairNpcId, "has repair NPC");
  // Advance by 1 hour
  state = tickRealTime(state, 3_600_000);
  const r1 = state.rooms["main_hall"].activeResidue![0];
  truthy(r1.repairProgress > 0, "repairProgress increased");
});

caseName("tickRealTime removes residue when repairProgress reaches 1.0", () => {
  let state = createInitialWorldState("Tester");
  // Use circle=1 so repairTargetHours = wallTemplate.decayHours (72)
  state = pushResidue(state, "main_hall", wallTemplate, "wall-of-stone", 1);
  const targetHours = state.rooms["main_hall"].activeResidue![0].repairTargetHours!;
  // Advance by exactly repairTargetHours + 1 to guarantee >= 1.0
  state = tickRealTime(state, (targetHours + 1) * 3_600_000);
  const residues = state.rooms["main_hall"]?.activeResidue ?? [];
  eq(residues.length, 0, "fully repaired residue removed");
});

caseName("tickRealTime does not advance residue without repairNpcId", () => {
  // Force repairNpcId to undefined by using a residue type with no matching NPCs
  // We'll do this by manually crafting a state with a repairRequired entry but no npcId
  let state = createInitialWorldState("Tester");
  state = pushResidue(state, "main_hall", wallTemplate, "wall-of-stone", 1);
  // Manually strip the repairNpcId to simulate "no NPC available"
  const room = state.rooms["main_hall"];
  const stripped = { ...room, activeResidue: [{ ...room.activeResidue![0], repairNpcId: undefined }] };
  state = { ...state, rooms: { ...state.rooms, main_hall: stripped } };
  state = tickRealTime(state, 72 * 3_600_000);
  const r = state.rooms["main_hall"].activeResidue![0];
  eq(r.repairProgress, 0, "repairProgress stays at 0 without NPC");
  eq(r.repairRequired, true, "residue not removed without NPC");
});

caseName("non-repairRequired residues unaffected by repair pass", () => {
  let state = createInitialWorldState("Tester");
  // Push a long-lived non-repair residue (48h circle 1 = 48h)
  state = pushResidue(state, "main_hall", fireballTemplate, "fireball", 1);
  const before = state.rooms["main_hall"].activeResidue![0].repairProgress;
  // Advance 10 hours
  state = tickRealTime(state, 10 * 3_600_000);
  const after = state.rooms["main_hall"].activeResidue;
  // Residue should still be there (48h not yet elapsed) and repairProgress = 0
  truthy(after?.length, "residue still present");
  eq(after![0].repairProgress, before, "repairProgress unchanged for non-repair residue");
});

// ── NPCS pool sanity ──────────────────────────────────────────

caseName("NPCS has ≥5 mason NPCs", () => {
  const count = Object.values(NPCS).filter(n => n.repairSkills?.includes("mason")).length;
  gte(count, 5, "mason count");
});

caseName("NPCS has ≥5 carpenter NPCs", () => {
  const count = Object.values(NPCS).filter(n => n.repairSkills?.includes("carpenter")).length;
  gte(count, 5, "carpenter count");
});

caseName("NPCS has ≥5 smith NPCs", () => {
  const count = Object.values(NPCS).filter(n => n.repairSkills?.includes("smith")).length;
  gte(count, 5, "smith count");
});

caseName("NPCS has ≥5 cleaner NPCs", () => {
  const count = Object.values(NPCS).filter(n => n.repairSkills?.includes("cleaner")).length;
  gte(count, 5, "cleaner count");
});

caseName("repairNpcId for wall-of-stone resolves to real NPCS entry", () => {
  const base = createInitialWorldState("Tester");
  const next = pushResidue(base, "main_hall", wallTemplate, "wall-of-stone", 1);
  const r = next.rooms["main_hall"].activeResidue![0];
  truthy(r.repairNpcId, "repairNpcId set");
  truthy(NPCS[r.repairNpcId!], "resolves to a real NPC");
  truthy(NPCS[r.repairNpcId!].repairSkills?.includes("mason"), "NPC is a mason");
});

// ── Summary ──────────────────────────────────────────────────
if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All G6 repair tests passed");
}
