// ============================================================
// LIVING EAMON — Combat barrier tests (Pre-work B)
//
// Run via:
//   npx tsx __tests__/combat/barriers.test.ts
//   npm run test:quests
//
// Coverage:
//   1. isCrossingBarrier — empty barriers → never blocks.
//   2. isCrossingBarrier — boundary 0 blocks H↔E1 (both directions).
//   3. isCrossingBarrier — self-target never crosses.
//   4. isCrossingBarrier — boundary 1 isolates enemy slot 1 from slots 2-3.
//   5. tickBarriers — decrements duration; expires entries at 0.
//   6. tickBarriers — empty input is a no-op (same reference).
//   7. resolveCombatRound integration — no barriers → existing behavior.
//   8. resolveCombatRound integration — wall blocks BOTH player and enemy strike.
//   9. resolveCombatRound integration — barrier ticks down on each round.
// ============================================================

import {
  isCrossingBarrier,
  tickBarriers,
} from "../../lib/combat/barriers";
import type {
  ActiveCombatSession,
  Barrier,
  CombatantState,
  ActiveStatusEffect,
} from "../../lib/combatTypes";
import { createEmptyBodyArmorMap } from "../../lib/combatTypes";
import { resolveCombatRound } from "../../lib/combatEngine";

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

// ── Fixtures ────────────────────────────────────────────────

function makeCombatant(
  name: string,
  side: "ally" | "enemy",
  position: 1 | 2 | 3,
  hp: number = 50,
  effects: ActiveStatusEffect[] = []
): CombatantState {
  return {
    id: name.toLowerCase(),
    name,
    hp,
    maxHp: hp,
    zones: createEmptyBodyArmorMap(),
    activeEffects: effects,
    shieldItemId: null,
    shieldBlockChance: 0,
    shieldDurability: 0,
    shieldMaxDurability: 0,
    weaponId: "fists",
    droppedWeaponId: null,
    weaponSkillValue: 50,
    dexterity: 50,
    strength: 50,
    agility: 50,
    side,
    position,
  };
}

function makeSession(barriers: Barrier[]): ActiveCombatSession {
  return {
    enemyNpcId: "test_orc",
    enemyName: "test orc",
    roundNumber: 1,
    playerCombatant: makeCombatant("Tester", "ally", 1),
    enemyCombatant: makeCombatant("test orc", "enemy", 1),
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers,
  };
}

const STONE_AT_0: Barrier = {
  id: "wall-0",
  atBoundary: 0,
  kind: "stone-wall",
  durationRemaining: 5,
};

const STONE_AT_1: Barrier = {
  id: "wall-1",
  atBoundary: 1,
  kind: "stone-wall",
  durationRemaining: 5,
};

// ── 1. Empty barriers ───────────────────────────────────────

console.log("[barriers] isCrossingBarrier with no barriers");
caseName("empty barriers — H attacks E1 → not crossing", () => {
  falsy(isCrossingBarrier("ally", 1, "enemy", 1, []), "no-barriers H→E1");
});

// ── 2. Boundary 0 blocks H↔E1 both ways ─────────────────────

console.log("[barriers] Boundary 0 blocks the centerline");
caseName("wall@0 — H → E1 is blocked", () => {
  truthy(isCrossingBarrier("ally", 1, "enemy", 1, [STONE_AT_0]), "H→E1");
});
caseName("wall@0 — E1 → H is blocked (symmetry)", () => {
  truthy(isCrossingBarrier("enemy", 1, "ally", 1, [STONE_AT_0]), "E1→H");
});

// ── 3. Self-target never crosses ────────────────────────────

console.log("[barriers] Self-targeted actions ignore barriers");
caseName("self-target H → H — even with wall@0 — is not crossing", () => {
  falsy(isCrossingBarrier("ally", 1, "ally", 1, [STONE_AT_0]), "self H");
});
caseName("self-target E1 → E1 — even with wall@0 — is not crossing", () => {
  falsy(isCrossingBarrier("enemy", 1, "enemy", 1, [STONE_AT_0]), "self E1");
});

// ── 4. Inner enemy boundary isolates enemy slots ────────────

console.log("[barriers] Boundary 1 isolates enemy slot 1 from deeper slots");
caseName("wall@1 — H → E1 (in front of wall) — not crossing", () => {
  falsy(isCrossingBarrier("ally", 1, "enemy", 1, [STONE_AT_1]), "H→E1 wall@1");
});
caseName("wall@1 — H → E2 (behind wall) — crosses both 0 and 1", () => {
  truthy(isCrossingBarrier("ally", 1, "enemy", 2, [STONE_AT_1]), "H→E2 wall@1");
});
caseName("wall@1 — E2 → E1 (same side, distinct slots) — crosses 1", () => {
  truthy(isCrossingBarrier("enemy", 2, "enemy", 1, [STONE_AT_1]), "E2→E1 wall@1");
});

// ── 5. tickBarriers decrements + expires ────────────────────

console.log("[barriers] tickBarriers decrement / expiry");
caseName("tick — durationRemaining 5 becomes 4", () => {
  const s = makeSession([{ ...STONE_AT_0, durationRemaining: 5 }]);
  const t = tickBarriers(s);
  eq(t.barriers.length, 1, "barrier count after tick");
  eq(t.barriers[0]!.durationRemaining, 4, "duration after one tick");
});
caseName("tick — durationRemaining 1 expires (filtered)", () => {
  const s = makeSession([{ ...STONE_AT_0, durationRemaining: 1 }]);
  const t = tickBarriers(s);
  eq(t.barriers.length, 0, "barrier removed at 0");
});
caseName("tick — empty barriers returns same session reference", () => {
  const s = makeSession([]);
  const t = tickBarriers(s);
  truthy(s === t, "same reference for no-op");
});

// ── 6. resolveCombatRound — no barriers → existing behavior ─

console.log("[barriers] Round integration — no barriers");
caseName("no barriers — both player and enemy strikes resolve normally", () => {
  // Run many rounds against a HP-padded enemy; with no barriers, neither
  // strike's narrative should ever be the wall-blocked line.
  let blockedSeen = false;
  for (let i = 0; i < 30; i++) {
    const s = makeSession([]);
    const result = resolveCombatRound(s, "torso");
    const narratives = [
      result.playerStrike?.narrative ?? "",
      result.enemyStrike?.narrative ?? "",
    ];
    if (narratives.some((n) => /wall of stone/i.test(n))) {
      blockedSeen = true;
      break;
    }
  }
  falsy(blockedSeen, "no wall narrative without a barrier");
});

// ── 7. resolveCombatRound — wall blocks both directions ─────

console.log("[barriers] Round integration — wall blocks both directions");
caseName("wall@0 — player strike narrative cites the wall", () => {
  const s = makeSession([STONE_AT_0]);
  const result = resolveCombatRound(s, "torso");
  truthy(
    /wall of stone/i.test(result.playerStrike?.narrative ?? ""),
    "player strike → wall narrative"
  );
});
caseName("wall@0 — enemy strike narrative cites the wall", () => {
  const s = makeSession([STONE_AT_0]);
  const result = resolveCombatRound(s, "torso");
  truthy(
    /wall of stone/i.test(result.enemyStrike?.narrative ?? ""),
    "enemy strike → wall narrative"
  );
});
caseName("wall@0 — neither side takes damage in a blocked round", () => {
  const s = makeSession([STONE_AT_0]);
  const result = resolveCombatRound(s, "torso");
  eq(result.playerStrike?.damageDealt ?? -1, 0, "player damage 0");
  eq(result.enemyStrike?.damageDealt ?? -1, 0, "enemy damage 0");
});

// ── 8. Round tick decrements barriers ───────────────────────

console.log("[barriers] Round integration — barrier ticks per round");
caseName("wall@0 with duration 5 — round result reports duration 4", () => {
  const s = makeSession([{ ...STONE_AT_0, durationRemaining: 5 }]);
  const result = resolveCombatRound(s, "torso");
  eq(result.updatedBarriers.length, 1, "still active");
  eq(result.updatedBarriers[0]!.durationRemaining, 4, "ticked down to 4");
});
caseName("wall@0 with duration 1 — round result drops the barrier", () => {
  const s = makeSession([{ ...STONE_AT_0, durationRemaining: 1 }]);
  const result = resolveCombatRound(s, "torso");
  eq(result.updatedBarriers.length, 0, "barrier expired this round");
});

// ── Summary ─────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n[barriers] ${failures} failure(s)`);
  process.exit(1);
}
