// ============================================================
// LIVING EAMON — Sprint A persistence round-trip tests
//
// Run via:
//   npx tsx __tests__/persistence/round-trip.test.ts
//
// Coverage:
//   1. Every "persist" field surfaced by the Sprint A audit
//      (2026-05-03) appears in the worldStateToPlayerRecord output.
//   2. Sprint 7b additions (knownCircles, tempModifiers, currentPlane,
//      worldTurn, corpses) round-trip through the serializer.
//   3. Defaults applied for nullable / optional fields.
// ============================================================

import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState, Corpse, TempModifier } from "../../lib/gameState";
import { worldStateToPlayerRecord } from "../../lib/persistence/playerRecord";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`assert ${label} — expected ${e}, got ${a}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function caseName(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}

console.log("Sprint A — persistence round-trip tests");

// ── Fixtures ─────────────────────────────────────────────────

function fixtureWorldState(): WorldState {
  const base = createInitialWorldState("Test Hero");
  const corpse: Corpse = {
    id: "corpse-1",
    originalNpcId: "goblin-1",
    name: "the body of a goblin",
    roomId: "main_hall",
    planeId: "thurian",
    timeOfDeath: 5,
    context: "surface",
    sunExposed: false,
    moonExposed: false,
    creatureKind: "human",
    isHeroCorpse: false,
  };
  const tempMod: TempModifier = {
    stat: "spell_strength",
    delta: 33,
    turnsRemaining: 5,
    source: "cunning",
  };

  return {
    ...base,
    worldTurn: 42,
    corpses: { "corpse-1": corpse },
    vendorTempStock: { sam: [{ itemId: "long_sword", expiresAtTime: "2026-05-03T12:00:00Z" }] },
    activeEvents: [
      { id: "fire-1", description: "tavern fire", affectedRooms: ["tavern"], turnsRemaining: 10, resolvedBy: null },
    ],
    player: {
      ...base.player,
      knownCircles: [1, 2, 3],
      tempModifiers: [tempMod],
      currentPlane: "thurian",
      previousRoom: "main_hall",
      prisonTurnsRemaining: 7,
      lastAction: "INVOKE Mag Aug",
    },
  };
}

// ── Tests ────────────────────────────────────────────────────

caseName("known_circles round-trips", () => {
  const ws = fixtureWorldState();
  const rec = worldStateToPlayerRecord(ws);
  eq(rec.knownCircles, [1, 2, 3], "knownCircles");
});

caseName("temp_modifiers round-trip", () => {
  const ws = fixtureWorldState();
  const rec = worldStateToPlayerRecord(ws);
  const mods = rec.tempModifiers as TempModifier[];
  eq(mods.length, 1, "tempModifiers length");
  eq(mods[0].source, "cunning", "tempModifiers source");
  eq(mods[0].delta, 33, "tempModifiers delta");
});

caseName("current_plane round-trips", () => {
  const rec = worldStateToPlayerRecord(fixtureWorldState());
  eq(rec.currentPlane, "thurian", "currentPlane");
});

caseName("previous_room round-trips", () => {
  const rec = worldStateToPlayerRecord(fixtureWorldState());
  eq(rec.previousRoom, "main_hall", "previousRoom");
});

caseName("prison_turns_remaining round-trips", () => {
  const rec = worldStateToPlayerRecord(fixtureWorldState());
  eq(rec.prisonTurnsRemaining, 7, "prisonTurnsRemaining");
});

caseName("last_action round-trips", () => {
  const rec = worldStateToPlayerRecord(fixtureWorldState());
  eq(rec.lastAction, "INVOKE Mag Aug", "lastAction");
});

caseName("world_turn round-trips", () => {
  const rec = worldStateToPlayerRecord(fixtureWorldState());
  eq(rec.worldTurn, 42, "worldTurn");
});

caseName("corpses round-trip", () => {
  const rec = worldStateToPlayerRecord(fixtureWorldState());
  const corpses = rec.corpses as Record<string, Corpse>;
  truthy(corpses["corpse-1"], "corpse exists");
  eq(corpses["corpse-1"].originalNpcId, "goblin-1", "corpse originalNpcId");
  eq(corpses["corpse-1"].context, "surface", "corpse context");
});

caseName("vendor_temp_stock round-trips", () => {
  const rec = worldStateToPlayerRecord(fixtureWorldState());
  const stock = rec.vendorTempStock as Record<string, Array<{ itemId: string }>>;
  eq(stock.sam[0].itemId, "long_sword", "vendor stock item");
});

caseName("active_events round-trip", () => {
  const rec = worldStateToPlayerRecord(fixtureWorldState());
  const events = rec.activeEvents as Array<{ id: string; description: string }>;
  eq(events.length, 1, "activeEvents length");
  eq(events[0].id, "fire-1", "activeEvents[0].id");
});

caseName("defaults: empty world serializes without nulls in new fields", () => {
  const ws = createInitialWorldState("Fresh");
  const rec = worldStateToPlayerRecord(ws);
  eq(rec.knownCircles, [], "knownCircles default empty");
  eq(rec.tempModifiers, [], "tempModifiers default empty");
  eq(rec.currentPlane, "thurian", "currentPlane default");
  eq(rec.prisonTurnsRemaining, 0, "prisonTurnsRemaining default");
  eq(rec.activeEvents, [], "activeEvents default empty");
});

caseName("legacy fields still present", () => {
  const rec = worldStateToPlayerRecord(fixtureWorldState());
  truthy("hp" in rec, "hp present");
  truthy("inventory" in rec, "inventory present");
  truthy("picssi_passion" in rec, "picssi_passion present");
  truthy("quests" in rec, "quests present");
  truthy("karma_log" in rec, "karma_log present");
});

// ── Summary ──────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All persistence round-trip tests passed");
}
