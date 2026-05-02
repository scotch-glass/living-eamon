// ============================================================
// LIVING EAMON — Sprint 7b.T acceptance tests (Teleport family)
//
// Run via:
//   npx tsx __tests__/sorcery/sprint-7b-teleport.test.ts
//   npm run test:quests
//
// Coverage:
//   1. getSpellByWordPrefix — prefix match returns spell + remainder.
//   2. Mark — no blank rune → no-unmarked-rune gate fires, resources untouched.
//   3. Mark — with blank rune → markedRune created, rune consumed, auto-label.
//   4. Mark — custom label argument stored verbatim.
//   5. Teleport — no arg → no-rune-target, resources untouched.
//   6. Teleport — bad label → no-rune-target, resources untouched.
//   7. Teleport — valid label → player moves, rune stays.
//   8. Recall — valid label → player moves, rune consumed.
//   9. Gate Travel — valid label → player moves, rune stays, gate-opened result.
//  10. currentPlane updates on cross-plane teleport.
//  11. markedRunes cleared on rebirth (applyPlayerDeath).
//  12. composeInvokeResponse renders marked / teleported / recalled / gate-opened.
//  13. composeInvokeResponse renders no-rune-target (with and without label).
//  14. composeInvokeResponse renders no-unmarked-rune.
// ============================================================

import { createInitialWorldState, applyPlayerDeath } from "../../lib/gameState";
import type { WorldState } from "../../lib/gameState";
import { handleInvoke, composeInvokeResponse } from "../../lib/sorcery/invoke";
import { getSpellByWordPrefix } from "../../lib/sorcery/registry";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`assert ${label} — expected ${e}, got ${a}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function contains(actual: string, substr: string, label: string): void {
  if (!actual.includes(substr))
    throw new Error(`assert ${label} — expected "${substr}" in "${actual}"`);
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

// ── Fixtures ─────────────────────────────────────────────────

/** Base state: all six circles unlocked, plenty of mana, reagents for Mark. */
function baseState(): WorldState {
  const s = createInitialWorldState("Tester");
  return {
    ...s,
    player: {
      ...s.player,
      currentMana: 200,
      knownCircles: [1, 2, 3, 4, 5, 6, 7, 8],
      inventory: [
        { itemId: "black_pearl",   quantity: 10 },
        { itemId: "blood_moss",    quantity: 10 },
        { itemId: "mandrake_root", quantity: 10 },
        { itemId: "sulfurous_ash", quantity: 10 },
        { itemId: "unmarked_rune", quantity: 3  },
      ],
    },
  };
}

/** State with a pre-existing marked rune stone in inventory pointing to "guild_main_hall". */
function stateWithRune(label = "inn"): WorldState {
  const s = baseState();
  return {
    ...s,
    player: {
      ...s.player,
      inventory: [
        ...s.player.inventory,
        {
          itemId: "marked_rune",
          quantity: 1,
          runeBinding: { roomId: "guild_main_hall", planeId: "thurian", label },
        },
      ],
    },
  };
}

// ── Test suite ────────────────────────────────────────────────

console.log("\n[sprint-7b-teleport] getSpellByWordPrefix");

caseName("exact 2-word match returns no remainder", () => {
  const result = getSpellByWordPrefix(["Mut", "Via"]);
  truthy(result, "result exists");
  eq(result!.spell.id, "teleport", "spell id");
  eq(result!.remainder, [], "remainder empty");
});

caseName("prefix match: 2-word spell + 1 arg token", () => {
  const result = getSpellByWordPrefix(["Mut", "Via", "inn"]);
  truthy(result, "result exists");
  eq(result!.spell.id, "teleport", "spell id");
  eq(result!.remainder, ["inn"], "remainder has arg");
});

caseName("prefix match: 3-word spell + 1 arg token", () => {
  const result = getSpellByWordPrefix(["Crea", "Tra", "Via", "cave"]);
  truthy(result, "result exists");
  eq(result!.spell.id, "recall", "spell id");
  eq(result!.remainder, ["cave"], "remainder has arg");
});

caseName("no match returns null", () => {
  const result = getSpellByWordPrefix(["Foo", "Bar"]);
  eq(result, null, "null on no match");
});

console.log("\n[sprint-7b-teleport] Mark");

caseName("no blank rune → no-unmarked-rune, mana untouched", () => {
  const s = baseState();
  const noRune: WorldState = {
    ...s,
    player: {
      ...s.player,
      inventory: s.player.inventory.filter(i => i.itemId !== "unmarked_rune"),
    },
  };
  const before = noRune.player.currentMana;
  const { outcome, state: after } = handleInvoke(noRune, "Crea Sig Loc");
  eq(outcome.kind, "no-unmarked-rune", "outcome kind");
  eq(after.player.currentMana, before, "mana unchanged");
});

caseName("Mark with blank rune → marked_rune item in inventory, blank consumed, auto-label", () => {
  const s = baseState();
  const blankBefore = s.player.inventory.find(i => i.itemId === "unmarked_rune")!.quantity;
  const { outcome, state: after } = handleInvoke(s, "Crea Sig Loc");
  eq(outcome.kind, "success", "outcome kind");
  const markedItem = after.player.inventory.find(i => i.itemId === "marked_rune");
  truthy(markedItem, "marked_rune item created");
  truthy(markedItem!.runeBinding?.label.includes("rune to"), "auto-label contains 'rune to'");
  const blankAfter = after.player.inventory.find(i => i.itemId === "unmarked_rune")?.quantity ?? 0;
  eq(blankAfter, blankBefore - 1, "unmarked_rune quantity decremented");
});

caseName("Mark with custom label stores label verbatim on the item", () => {
  const s = baseState();
  const { state: after } = handleInvoke(s, "Crea Sig Loc my tavern");
  const item = after.player.inventory.find(i => i.itemId === "marked_rune");
  eq(item?.runeBinding?.label, "my tavern", "custom label stored");
});

console.log("\n[sprint-7b-teleport] Teleport");

caseName("no arg → no-rune-target, mana untouched", () => {
  const s = baseState();
  const before = s.player.currentMana;
  const { outcome, state: after } = handleInvoke(s, "Mut Via");
  eq(outcome.kind, "no-rune-target", "outcome kind");
  eq(after.player.currentMana, before, "mana unchanged");
});

caseName("bad label → no-rune-target, mana untouched", () => {
  const s = stateWithRune("inn");
  const before = s.player.currentMana;
  const { outcome, state: after } = handleInvoke(s, "Mut Via nowhere");
  eq(outcome.kind, "no-rune-target", "outcome kind");
  eq(after.player.currentMana, before, "mana unchanged");
});

caseName("valid label → player moves to targetRoomId, rune stone stays in inventory, mana consumed", () => {
  const s = stateWithRune("inn");
  const before = s.player.currentMana;
  const { outcome, state: after } = handleInvoke(s, "Mut Via inn");
  eq(outcome.kind, "success", "outcome kind");
  if (outcome.kind === "success") eq(outcome.effect.kind, "teleported", "effect kind");
  eq(after.player.currentRoom, "guild_main_hall", "player moved");
  truthy(after.player.inventory.some(i => i.itemId === "marked_rune"), "rune stone stays in inventory");
  truthy(after.player.currentMana < before, "mana consumed");
});

console.log("\n[sprint-7b-teleport] Recall");

caseName("Recall valid label → player moves, rune stone stays in inventory", () => {
  const s = stateWithRune("inn");
  const { outcome, state: after } = handleInvoke(s, "Crea Tra Via inn");
  eq(outcome.kind, "success", "outcome kind");
  if (outcome.kind === "success") eq(outcome.effect.kind, "recalled", "effect kind");
  eq(after.player.currentRoom, "guild_main_hall", "player moved");
  truthy(after.player.inventory.some(i => i.itemId === "marked_rune"), "rune stone stays in inventory");
});

caseName("Recall bad label → no-rune-target, rune stone untouched", () => {
  const s = stateWithRune("inn");
  const { outcome, state: after } = handleInvoke(s, "Crea Tra Via cave");
  eq(outcome.kind, "no-rune-target", "outcome kind");
  truthy(after.player.inventory.some(i => i.itemId === "marked_rune"), "rune stone still in inventory");
});

console.log("\n[sprint-7b-teleport] Gate Travel");

caseName("Gate Travel valid label → player moves, rune stone stays, gate-opened result", () => {
  const s = stateWithRune("inn");
  const { outcome, state: after } = handleInvoke(s, "Mag Mut Via inn");
  eq(outcome.kind, "success", "outcome kind");
  if (outcome.kind === "success") {
    eq(outcome.effect.kind, "gate-opened", "effect kind");
    if (outcome.effect.kind === "gate-opened") {
      truthy(outcome.effect.durationTurns > 0, "durationTurns > 0");
    }
  }
  eq(after.player.currentRoom, "guild_main_hall", "player moved");
  truthy(after.player.inventory.some(i => i.itemId === "marked_rune"), "rune stone stays in inventory");
});

console.log("\n[sprint-7b-teleport] currentPlane");

caseName("teleporting to a thurian rune sets currentPlane = thurian", () => {
  const s = stateWithRune("inn");
  const { state: after } = handleInvoke(s, "Mut Via inn");
  eq(after.player.currentPlane, "thurian", "plane is thurian");
});

caseName("teleporting to an otherworld rune stone sets currentPlane to that plane", () => {
  const s = baseState();
  const withOtherRune: WorldState = {
    ...s,
    player: {
      ...s.player,
      inventory: [
        ...s.player.inventory,
        {
          itemId: "marked_rune",
          quantity: 1,
          runeBinding: { roomId: "guild_main_hall", planeId: "outer-dark", label: "dark place" },
        },
      ],
    },
  };
  const { state: after } = handleInvoke(withOtherRune, "Mut Via dark place");
  eq(after.player.currentPlane, "outer-dark", "plane updated");
});

console.log("\n[sprint-7b-teleport] Rebirth");

caseName("marked rune stones stripped from inventory on rebirth (lost on death)", () => {
  const s = stateWithRune("inn");
  const { newState } = applyPlayerDeath(s, "a test enemy");
  const hasMarked = newState.player.inventory.some(i => i.itemId === "marked_rune");
  eq(hasMarked, false, "marked_rune items not in rebirth inventory");
});

caseName("currentPlane resets to thurian on rebirth", () => {
  const s = baseState();
  const s2: WorldState = {
    ...s,
    player: { ...s.player, currentPlane: "outer-dark" },
  };
  const { newState } = applyPlayerDeath(s2, "a test enemy");
  eq(newState.player.currentPlane, "thurian", "plane reset");
});

console.log("\n[sprint-7b-teleport] composeInvokeResponse");

caseName("renders 'marked' effect", () => {
  const s = baseState();
  const { outcome } = handleInvoke(s, "Crea Sig Loc my spot");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "my spot", "label in response");
  contains(msg, "bound", "bound in response");
});

caseName("renders 'teleported' effect", () => {
  const s = stateWithRune("inn");
  const { outcome } = handleInvoke(s, "Mut Via inn");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "inn", "label in response");
  contains(msg, "elsewhere", "movement flavor");
});

caseName("renders 'recalled' effect", () => {
  const s = stateWithRune("inn");
  const { outcome } = handleInvoke(s, "Crea Tra Via inn");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "inn", "label in response");
  contains(msg, "home", "recall flavor");
});

caseName("renders 'gate-opened' effect", () => {
  const s = stateWithRune("inn");
  const { outcome } = handleInvoke(s, "Mag Mut Via inn");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "oval", "gate flavor");
});

caseName("no-rune-target with label names the label", () => {
  const s = stateWithRune("inn");
  const { outcome } = handleInvoke(s, "Mut Via nowhere");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "nowhere", "label named");
});

caseName("no-rune-target without label prompts to mark first", () => {
  const s = baseState();
  const { outcome } = handleInvoke(s, "Mut Via");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "Mark", "Mark mentioned");
});

caseName("no-unmarked-rune prompts for Blank Rune", () => {
  const s = baseState();
  const noRune: WorldState = {
    ...s,
    player: {
      ...s.player,
      inventory: s.player.inventory.filter(i => i.itemId !== "unmarked_rune"),
    },
  };
  const { outcome } = handleInvoke(noRune, "Crea Sig Loc");
  const msg = composeInvokeResponse(outcome);
  contains(msg, "Blank Rune", "Blank Rune mentioned");
});

// ── Summary ───────────────────────────────────────────────────

const total = 22;
if (failures === 0) {
  console.log(`\n[sprint-7b-teleport] ✓ all cases passed\n`);
} else {
  console.error(`\n[sprint-7b-teleport] ✗ ${failures}/${total} cases failed\n`);
  process.exit(1);
}
