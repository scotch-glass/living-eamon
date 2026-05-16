// ============================================================
// LIVING EAMON — Sprint C3d/g multi-combatant action grammar
//
// Run via:
//   npx tsx __tests__/combat/c3-actions.test.ts
//
// Verifies the C3d/e/g engine surface:
//   1. resolveAction("cast", HEAL) — one-shot, mana deducted, target healed.
//   2. resolveAction("cast", FIREBOLT-mocked-Circle-4) — mana deducted on
//      turn 1; channelingState set; spell fires on the caster's next turn
//      via resolveChannelStep.
//   3. Channel break on critical hit (interruptedSinceLastTurn) — channel
//      shatters, mana stays gone.
//   4. resolveAction("swap_hotbar") consumes a turn; effectiveCombatSpeed
//      reflects the new hotbar.
//   5. advanceTurn wraps around the full party, increments roundNumber,
//      and re-rolls initiative with the same 6 ids.
//   6. resolveAction("strike") deducts target HP; combatOver flips to true
//      when the last enemy drops below 0 HP.
//   7. applyStrike sets interruptedSinceLastTurn on isCritical.
//   8. resolveAction returns invalid when called against a non-current actor.
// ============================================================

import {
  fillCombatantDefaults,
  createEmptyBodyArmorMap,
  type ActiveCombatSession,
  type CombatantState,
  type InterruptReason,
} from "../../lib/combat/types";
import {
  resolveAction,
  resolveChannelStep,
  advanceTurn,
  effectiveCombatSpeed,
  rollInitiativeOrder,
  applyStrike,
  type CombatAction,
} from "../../lib/combat/engine";
import { SPELL_DATA } from "../../lib/combat/spellData";

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
  } catch (err) {
    failures++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
  }
}

function makeFighter(
  id: string,
  weaponId: string,
  hotbar: string[] = [],
  opts: Partial<CombatantState> = {},
): CombatantState {
  return fillCombatantDefaults({
    id,
    name: id,
    side: "ally",
    hp: 50,
    maxHp: 50,
    zones: createEmptyBodyArmorMap(),
    activeEffects: [],
    shieldItemId: null,
    shieldBlockChance: 0,
    shieldDurability: 0,
    shieldMaxDurability: 0,
    weaponId,
    droppedWeaponId: null,
    weaponSkillValue: 50,
    dexterity: 10,
    strength: 10,
    position: 1,
    combatHotbar: hotbar,
    mana: 20,
    maxMana: 20,
    ...opts,
  });
}

function makeSession(
  combatants: CombatantState[],
  turnOrder?: string[],
  currentTurnIdx = 0,
): ActiveCombatSession {
  const order = turnOrder ?? combatants.map(c => c.id);
  const ally = combatants.find(c => c.team === "ally") ?? combatants[0];
  const enemy = combatants.find(c => c.team === "enemy") ?? combatants[1] ?? combatants[0];
  return {
    enemyNpcId: enemy.id,
    enemyName: enemy.name,
    roundNumber: 0,
    playerCombatant: ally,
    enemyCombatant: enemy,
    combatLog: [],
    finished: false,
    playerWon: null,
    barriers: [],
    combatants,
    turnOrder: order,
    currentTurnIdx,
  };
}

console.log("[c3-actions] resolveAction — cast (one-shot, Circle 1)");

caseName("HEAL self → mana deducted, target HP rises, turn advances", () => {
  const vivian = makeFighter("vivian", "short_sword", ["HEAL", "BLAST"], {
    hp: 20, maxHp: 50, mana: 12, maxMana: 12, picssi: { courage: 0, spirituality: 0 },
  });
  const enemy = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai", hp: 40, maxHp: 40, position: 1,
  });
  const session = makeSession([vivian, enemy]);
  const result = resolveAction(session, {
    kind: "cast",
    sourceId: "vivian",
    targetId: "vivian",
    spellName: "HEAL",
  });
  truthy(!result.invalid, `expected valid action, got invalid="${result.invalid}"`);
  const updated = result.session.combatants.find(c => c.id === "vivian")!;
  eq(updated.mana, 8, "mana deducted by HEAL cost (4)");
  truthy(updated.hp > 20, `Vivian HP rose from 20 (now ${updated.hp})`);
  eq(updated.channelingState, null, "no channel — one-shot fired");
  eq(result.session.currentTurnIdx, 1, "turn advanced to enemy");
});

caseName("BLAST enemy → enemy HP drops, mana deducted, turn advances", () => {
  const v = makeFighter("vivian", "short_sword", ["HEAL", "BLAST"], { mana: 12, maxMana: 12 });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai", hp: 40, maxHp: 40,
  });
  const session = makeSession([v, e]);
  const result = resolveAction(session, {
    kind: "cast", sourceId: "vivian", targetId: "rurik", spellName: "BLAST",
  });
  truthy(!result.invalid, `expected valid: ${result.invalid}`);
  const updatedVivian = result.session.combatants.find(c => c.id === "vivian")!;
  const updatedRurik = result.session.combatants.find(c => c.id === "rurik")!;
  eq(updatedVivian.mana, 6, "BLAST cost 6 mana");
  truthy(updatedRurik.hp < 40, `enemy HP dropped (now ${updatedRurik.hp})`);
});

caseName("Mana below cost → action invalid, session unchanged", () => {
  const v = makeFighter("vivian", "short_sword", ["BLAST"], { mana: 2 });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const result = resolveAction(session, {
    kind: "cast", sourceId: "vivian", targetId: "rurik", spellName: "BLAST",
  });
  truthy(result.invalid?.includes("not enough mana"), `expected mana-error, got "${result.invalid}"`);
  eq(result.session.combatants[0].mana, 2, "mana untouched");
  eq(result.session.currentTurnIdx, 0, "turn pointer untouched");
});

console.log("[c3-actions] resolveAction — cast (multi-turn channel)");

caseName("Multi-turn cast (mocked castTurns=2) → mana spent, channelingState set", () => {
  // Mock FIREBOLT's castTurns to 2 for this test (FIREBOLT is a Circle-2
  // one-shot in production; we elevate it to a 2-turn channel here).
  const orig = SPELL_DATA.FIREBOLT.castTurns;
  SPELL_DATA.FIREBOLT.castTurns = 2;
  try {
    const v = makeFighter("brand", "long_sword", ["FIREBOLT"], {
      mana: 12, maxMana: 12, knownSpells: ["FIREBOLT"],
    });
    const e = makeFighter("rurik", "long_sword", [], {
      side: "enemy", team: "enemy", controlledBy: "ai",
    });
    const session = makeSession([v, e]);
    const result = resolveAction(session, {
      kind: "cast", sourceId: "brand", targetId: "rurik", spellName: "FIREBOLT",
    });
    truthy(!result.invalid, `expected valid: ${result.invalid}`);
    const updated = result.session.combatants.find(c => c.id === "brand")!;
    eq(updated.mana, 6, "FIREBOLT cost 6 mana committed up front");
    truthy(updated.channelingState !== null, "channelingState set");
    eq(updated.channelingState!.spellName, "FIREBOLT", "channeling FIREBOLT");
    eq(updated.channelingState!.turnsRemaining, 1, "one more turn until release");
  } finally {
    SPELL_DATA.FIREBOLT.castTurns = orig;
  }
});

caseName("Channel completes → resolveChannelStep fires spell on final turn", () => {
  const orig = SPELL_DATA.HEAL.castTurns;
  SPELL_DATA.HEAL.castTurns = 2;
  try {
    const v = makeFighter("brand", "long_sword", ["HEAL"], {
      hp: 20, maxHp: 50, mana: 12, maxMana: 12,
    });
    const e = makeFighter("rurik", "long_sword", [], {
      side: "enemy", team: "enemy", controlledBy: "ai",
    });
    let session = makeSession([v, e]);
    // Turn 1: Brand starts the channel.
    const r1 = resolveAction(session, {
      kind: "cast", sourceId: "brand", targetId: "brand", spellName: "HEAL",
    });
    truthy(!r1.invalid, `cast invalid: ${r1.invalid}`);
    session = r1.session;
    eq(session.currentTurnIdx, 1, "turn moved to enemy");
    // Walk past the enemy turn deterministically. Stub Math.random so the
    // post-wrap initiative re-roll lands brand first via the alpha tiebreak.
    const orig = Math.random;
    Math.random = () => 0.5;
    try {
      session = advanceTurn(session).session;
    } finally {
      Math.random = orig;
    }
    eq(session.turnOrder[session.currentTurnIdx], "brand", "channel actor is current");
    // Channel step — final turn fires the spell.
    const r2 = resolveChannelStep(session);
    truthy(!r2.invalid, `channel step invalid: ${r2.invalid}`);
    const after = r2.session.combatants.find(c => c.id === "brand")!;
    eq(after.channelingState, null, "channel cleared on release");
    truthy(after.hp > 20, `HEAL fired (HP now ${after.hp})`);
  } finally {
    SPELL_DATA.HEAL.castTurns = orig;
  }
});

caseName("Channel break — interruptedSinceLastTurn → spell shatters, mana stays gone", () => {
  const orig = SPELL_DATA.HEAL.castTurns;
  SPELL_DATA.HEAL.castTurns = 2;
  try {
    const v = makeFighter("brand", "long_sword", ["HEAL"], {
      mana: 12, maxMana: 12, hp: 30,
    });
    const e = makeFighter("rurik", "long_sword", [], {
      side: "enemy", team: "enemy", controlledBy: "ai",
    });
    let session = makeSession([v, e]);
    // Turn 1: start channel.
    session = resolveAction(session, {
      kind: "cast", sourceId: "brand", targetId: "brand", spellName: "HEAL",
    }).session;
    // Mid-channel: simulate a critical hit on Brand by setting the
    // interrupt reason directly (applyStrike's setter is exercised
    // separately below). Use a critical-hit reason since that's the
    // most common interrupt path in combat.
    const crit: InterruptReason = { kind: "critical_hit", zone: "torso" };
    session = {
      ...session,
      combatants: session.combatants.map(c =>
        c.id === "brand" ? { ...c, interruptedSinceLastTurn: crit } : c,
      ),
      playerCombatant: { ...session.playerCombatant, interruptedSinceLastTurn: crit },
    };
    // Enemy "acts" — fast-forward. Stub Math.random so the post-wrap
    // re-roll lands brand first via the alpha tiebreak.
    const origRand = Math.random;
    Math.random = () => 0.5;
    try {
      session = advanceTurn(session).session;
    } finally {
      Math.random = origRand;
    }
    eq(session.turnOrder[session.currentTurnIdx], "brand", "channel actor is current after wrap");
    // Brand's turn — channel resolution should break.
    const r2 = resolveChannelStep(session);
    truthy(r2.narrative.includes("shatters"), `expected shatter narrative, got "${r2.narrative}"`);
    const after = r2.session.combatants.find(c => c.id === "brand")!;
    eq(after.channelingState, null, "channel cleared on break");
    eq(after.mana, 8, "mana stayed gone (12 - 4 = 8)");
  } finally {
    SPELL_DATA.HEAL.castTurns = orig;
  }
});

console.log("[c3-actions] resolveAction — swap_hotbar");

caseName("swap_hotbar swaps slot, consumes a turn, updates effectiveCombatSpeed", () => {
  // Mock FIREBOLT castSpeed to 6 so the swap demonstrably raises tempo.
  const orig = SPELL_DATA.FIREBOLT.castSpeed;
  SPELL_DATA.FIREBOLT.castSpeed = 6;
  try {
    const v = makeFighter("vivian", "short_sword", ["HEAL"], { knownSpells: ["HEAL", "FIREBOLT"] });
    const e = makeFighter("rurik", "long_sword", [], {
      side: "enemy", team: "enemy", controlledBy: "ai",
    });
    const session = makeSession([v, e]);
    eq(effectiveCombatSpeed(session.combatants[0]), 2, "before swap: short_sword tempo");
    const result = resolveAction(session, {
      kind: "swap_hotbar", sourceId: "vivian", slotIdx: 1, spellName: "FIREBOLT",
    });
    truthy(!result.invalid, `swap invalid: ${result.invalid}`);
    const after = result.session.combatants.find(c => c.id === "vivian")!;
    eq(after.combatHotbar, ["HEAL", "FIREBOLT"], "FIREBOLT slotted at idx 1");
    eq(effectiveCombatSpeed(after), 6, "tempo now dictated by FIREBOLT castSpeed");
    eq(result.session.currentTurnIdx, 1, "turn consumed");
  } finally {
    SPELL_DATA.FIREBOLT.castSpeed = orig;
  }
});

console.log("[c3-actions] advanceTurn — round wrap re-rolls initiative");

caseName("advanceTurn skips dead combatants — pointer never lands on hp=0", () => {
  // Bug repro: a combatant killed before their slot in the turn order.
  // advanceTurn must walk past the corpse so the next live actor is the
  // current actor (otherwise the AI loop stalls).
  const a = makeFighter("alpha", "short_sword", [], { side: "ally", team: "ally", controlledBy: "player" });
  const b = makeFighter("bravo", "short_sword", [], { side: "ally", team: "ally", controlledBy: "player" });
  const c = makeFighter("charlie", "short_sword", [], { side: "enemy", team: "enemy", controlledBy: "ai", hp: 0 });
  const d = makeFighter("delta", "short_sword", [], { side: "enemy", team: "enemy", controlledBy: "ai" });
  // Turn order: alpha (idx 0) → bravo → charlie (DEAD) → delta.
  const session = makeSession([a, b, c, d], ["alpha", "bravo", "charlie", "delta"], 0);
  // Advance past alpha → bravo (alive).
  let s = advanceTurn(session).session;
  eq(s.turnOrder[s.currentTurnIdx], "bravo", "alpha → bravo");
  // Advance past bravo → should SKIP charlie (dead) and land on delta.
  s = advanceTurn(s).session;
  eq(s.turnOrder[s.currentTurnIdx], "delta", "bravo → delta (charlie skipped)");
  eq(s.finished, false, "fight continues");
});

caseName("advanceTurn ends combat when one side is wiped (dead-skip path)", () => {
  // Both enemies dead — no live opponent. advanceTurn should mark combat
  // over rather than spin forever skipping corpses.
  const a = makeFighter("alpha", "short_sword", [], { side: "ally", team: "ally", controlledBy: "player" });
  const c = makeFighter("charlie", "short_sword", [], { side: "enemy", team: "enemy", controlledBy: "ai", hp: 0 });
  const d = makeFighter("delta", "short_sword", [], { side: "enemy", team: "enemy", controlledBy: "ai", hp: 0 });
  const session = makeSession([a, c, d], ["alpha", "charlie", "delta"], 0);
  const s = advanceTurn(session).session;
  eq(s.finished, true, "combat marked finished — no live enemy remains");
  eq(s.playerWon, true, "ally team won (alpha still alive)");
});

caseName("advanceTurn wraps round, increments roundNumber, rebuilds turnOrder over 6 combatants", () => {
  const c = (id: string, side: "ally" | "enemy") =>
    makeFighter(id, "short_sword", [], {
      side, team: side, controlledBy: side === "ally" ? "player" : "ai",
    });
  const all = [
    c("hero", "ally"), c("vivian", "ally"), c("brand", "ally"),
    c("korm", "enemy"), c("rurik", "enemy"), c("sela", "enemy"),
  ];
  let session = makeSession(all);
  eq(session.turnOrder.length, 6, "6-id turn order");
  // Walk all 6 turns.
  for (let i = 0; i < 5; i++) session = advanceTurn(session).session;
  eq(session.currentTurnIdx, 5, "pointer at last actor before wrap");
  eq(session.roundNumber, 0, "still round 0");
  session = advanceTurn(session).session;
  eq(session.roundNumber, 1, "round wrapped");
  eq(session.currentTurnIdx, 0, "pointer back at top");
  eq(session.turnOrder.length, 6, "still 6 ids after re-roll");
  const ids = new Set(session.turnOrder);
  eq(ids.size, 6, "all 6 ids preserved across re-roll");
});

console.log("[c3-actions] applyStrike interruption hook");

caseName("applyStrike sets interruptedSinceLastTurn with critical_hit reason", () => {
  const target = makeFighter("brand", "long_sword");
  const updated = applyStrike(target, {
    targetZone: "torso", evaded: false, blocked: false, armorStopped: false,
    armorDamaged: 0, armorBroken: false, damageDealt: 5, reflectedDamage: 0,
    injuryInflicted: null, injurySeverity: 0, isCritical: true,
    isCriticalFail: false, weaponDropped: false, narrative: "",
  });
  eq(updated.interruptedSinceLastTurn, { kind: "critical_hit", zone: "torso" },
    "crit set reason {critical_hit, torso}");
});

caseName("applyStrike sets the flag with severed_artery reason", () => {
  const target = makeFighter("brand", "long_sword");
  const updated = applyStrike(target, {
    targetZone: "neck", evaded: false, blocked: false, armorStopped: false,
    armorDamaged: 0, armorBroken: false, damageDealt: 8, reflectedDamage: 0,
    injuryInflicted: "severed_artery", injurySeverity: 3, isCritical: false,
    isCriticalFail: false, weaponDropped: false, narrative: "",
  });
  eq(updated.interruptedSinceLastTurn, { kind: "severed_artery" },
    "severed_artery reason set");
});

caseName("applyStrike does NOT set the flag on a normal hit", () => {
  const target = makeFighter("brand", "long_sword");
  const updated = applyStrike(target, {
    targetZone: "limbs", evaded: false, blocked: false, armorStopped: false,
    armorDamaged: 0, armorBroken: false, damageDealt: 4, reflectedDamage: 0,
    injuryInflicted: null, injurySeverity: 0, isCritical: false,
    isCriticalFail: false, weaponDropped: false, narrative: "",
  });
  eq(updated.interruptedSinceLastTurn, null, "normal hit leaves the flag null");
});

caseName("Cast attempt on interrupted-turn fails open — no mana spent, reason in narrative", () => {
  const reason: InterruptReason = { kind: "severed_artery" };
  const v = makeFighter("brand", "long_sword", ["HEAL"], {
    mana: 12, interruptedSinceLastTurn: reason,
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const result = resolveAction(session, {
    kind: "cast", sourceId: "brand", targetId: "brand", spellName: "HEAL",
  });
  truthy(!result.invalid, `expected valid (fail-open), got "${result.invalid}"`);
  // "due to the gash at the throat" should appear since reason was severed_artery.
  truthy(
    /due to the gash at the throat/.test(result.narrative),
    `expected reason clause in narrative, got "${result.narrative}"`,
  );
  truthy(/dies on (his|her) lips/.test(result.narrative), `expected fizzle ending, got "${result.narrative}"`);
  const after = result.session.combatants.find(c => c.id === "brand")!;
  eq(after.mana, 12, "mana untouched on interrupted-turn cast");
  eq(after.interruptedSinceLastTurn, null, "flag cleared at end of brand's turn");
});

console.log("[c3-actions] resolveAction — strike");

caseName("strike deducts target HP, advances turn", () => {
  const v = makeFighter("vivian", "short_sword", [], {
    weaponSkillValue: 200, // master skill — high crit, no fumbles
  });
  const e = makeFighter("rurik", "unarmed", [], {
    side: "enemy", team: "enemy", controlledBy: "ai", dexterity: 0, hp: 40, maxHp: 40,
  });
  const session = makeSession([v, e]);
  // Loop until at least one strike lands (deterministic-ish over many calls
  // is more robust than asserting a single random outcome).
  let landed = false;
  let lastSession = session;
  for (let i = 0; i < 30 && !landed; i++) {
    // Reset turn pointer to vivian for each retry attempt.
    lastSession = { ...session, currentTurnIdx: 0 };
    const r = resolveAction(lastSession, {
      kind: "strike", sourceId: "vivian", targetId: "rurik", zone: "torso",
    });
    if (!r.invalid) {
      const updRurik = r.session.combatants.find(c => c.id === "rurik")!;
      if (updRurik.hp < 40) { landed = true; lastSession = r.session; break; }
    }
  }
  truthy(landed, "at least one strike landed within 30 attempts");
  eq(lastSession.currentTurnIdx, 1, "turn advanced");
});

console.log("[c3-actions] resolveAction — guard rails");

caseName("Action by non-current actor returns invalid", () => {
  const v = makeFighter("vivian", "short_sword", ["HEAL"]);
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]); // turnOrder = [vivian, rurik], idx 0
  const result = resolveAction(session, {
    kind: "cast", sourceId: "rurik", targetId: "rurik", spellName: "HEAL",
  });
  truthy(result.invalid?.includes("not rurik's turn"), `expected wrong-actor error, got "${result.invalid}"`);
});

caseName("Strike against a same-team combatant is refused — Howard rule", () => {
  const v = makeFighter("vivian", "short_sword", []);
  const ally = makeFighter("brand", "long_sword", [], { side: "ally", team: "ally", controlledBy: "player" });
  const enemy = makeFighter("rurik", "long_sword", [], { side: "enemy", team: "enemy", controlledBy: "ai" });
  const session = makeSession([v, ally, enemy], ["vivian", "brand", "rurik"]);
  const result = resolveAction(session, {
    kind: "strike", sourceId: "vivian", targetId: "brand", zone: "torso",
  });
  truthy(
    result.invalid?.includes("same side"),
    `expected same-side refusal, got "${result.invalid}"`,
  );
  // Brand's HP must be untouched, and the turn pointer must not advance —
  // a refused action does not consume Vivian's turn.
  const brandAfter = result.session.combatants.find((c) => c.id === "brand")!;
  eq(brandAfter.hp, ally.hp, "ally HP untouched on refused strike");
  eq(result.session.currentTurnIdx, 0, "turn pointer untouched");
});

caseName("BLAST against a same-team combatant is refused — mana not spent", () => {
  const v = makeFighter("sela", "short_sword", ["BLAST"], {
    side: "enemy", team: "enemy", controlledBy: "ai",
    mana: 12, maxMana: 12,
  });
  const enemyAlly = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const hero = makeFighter("hero", "long_sword");
  const session = makeSession([hero, v, enemyAlly], ["sela", "rurik", "hero"]);
  const result = resolveAction(session, {
    kind: "cast", sourceId: "sela", targetId: "rurik", spellName: "BLAST",
  });
  truthy(
    result.invalid?.includes("same side"),
    `expected same-side refusal, got "${result.invalid}"`,
  );
  const selaAfter = result.session.combatants.find((c) => c.id === "sela")!;
  eq(selaAfter.mana, 12, "mana not spent on refused offensive cast");
});

caseName("HEAL on a same-team combatant is allowed", () => {
  const healer = makeFighter("vivian", "short_sword", ["HEAL"], { mana: 12, maxMana: 12 });
  const woundedAlly = makeFighter("brand", "long_sword", [], {
    side: "ally", team: "ally", controlledBy: "player",
    hp: 10, maxHp: 50,
  });
  const enemy = makeFighter("rurik", "long_sword", [], { side: "enemy", team: "enemy", controlledBy: "ai" });
  const session = makeSession([healer, woundedAlly, enemy], ["vivian", "brand", "rurik"]);
  const result = resolveAction(session, {
    kind: "cast", sourceId: "vivian", targetId: "brand", spellName: "HEAL",
  });
  truthy(!result.invalid, `HEAL on ally must be allowed, got "${result.invalid}"`);
  const brandAfter = result.session.combatants.find((c) => c.id === "brand")!;
  truthy(brandAfter.hp > 10, `Brand healed (hp now ${brandAfter.hp})`);
});

caseName("Cast while channeling returns invalid (caller routes through resolveChannelStep)", () => {
  const v = makeFighter("brand", "long_sword", ["HEAL"], {
    mana: 12,
    channelingState: { spellName: "HEAL", targetId: "brand", turnsRemaining: 1 },
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const result = resolveAction(session, {
    kind: "strike", sourceId: "brand", targetId: "rurik", zone: "torso",
  });
  truthy(result.invalid?.includes("channeling"), `expected channeling error, got "${result.invalid}"`);
});

console.log("[c3-actions] resolveAction — flee + use");

caseName("flee ends combat, marks loss", () => {
  const v = makeFighter("vivian", "short_sword");
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const result = resolveAction(session, { kind: "flee", sourceId: "vivian" });
  eq(result.combatOver, true, "combat ended");
  eq(result.session.finished, true, "session marked finished");
  eq(result.session.playerWon, false, "flee = non-victory");
});

caseName("use healing_potion restores HP, decrements inventory", () => {
  const v = makeFighter("vivian", "short_sword", [], {
    hp: 10, maxHp: 50,
    inventory: [{ itemId: "healing_potion", quantity: 2 }],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const result = resolveAction(session, {
    kind: "use", sourceId: "vivian", targetId: "vivian", itemId: "healing_potion",
  });
  truthy(!result.invalid, `expected valid: ${result.invalid}`);
  const after = result.session.combatants.find(c => c.id === "vivian")!;
  truthy(after.hp > 10, `HP rose (now ${after.hp})`);
  eq(after.inventory[0].quantity, 1, "potion count decremented");
});

caseName("greater_healing_potion on ally heals 35-55 HP and emits Howard prose", () => {
  // Regression for 2026-05-08 — greater_healing_potion fell through to
  // the engine's default `(uses ${itemId})` stub: no HP change, no
  // narrative beyond the bare item id.
  const gaius = makeFighter("gaius", "great_sword", [], {
    hp: 50, maxHp: 50,
    inventory: [{ itemId: "greater_healing_potion", quantity: 1 }],
  });
  const vivian = makeFighter("vivian", "short_sword", [], {
    hp: 10, maxHp: 50,
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([gaius, vivian, e]);
  const result = resolveAction(session, {
    kind: "use", sourceId: "gaius", targetId: "vivian", itemId: "greater_healing_potion",
  });
  truthy(!result.invalid, `expected valid: ${result.invalid}`);
  const after = result.session.combatants.find(c => c.id === "vivian")!;
  const healed = after.hp - 10;
  truthy(healed >= 35 && healed <= 55, `heal in 35..55 (got ${healed})`);
  // Narrative should NOT match the bare-stub form.
  truthy(
    !result.narrative.includes("uses greater_healing_potion"),
    `narrative is not the bare stub (got: ${result.narrative})`,
  );
  truthy(
    /silver-bright brew/.test(result.narrative),
    `narrative reads as Howard prose (got: ${result.narrative})`,
  );
  // Caster's potion stack decrements (and is filtered out at qty 0).
  const casterAfter = result.session.combatants.find(c => c.id === "gaius")!;
  eq(casterAfter.inventory.length, 0, "potion entry dropped (was qty 1)");
});

caseName("greater_healing_potion self-cast respects maxHp cap", () => {
  const gaius = makeFighter("gaius", "great_sword", [], {
    hp: 48, maxHp: 50,
    inventory: [{ itemId: "greater_healing_potion", quantity: 1 }],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([gaius, e]);
  const result = resolveAction(session, {
    kind: "use", sourceId: "gaius", targetId: "gaius", itemId: "greater_healing_potion",
  });
  truthy(!result.invalid, `expected valid: ${result.invalid}`);
  const after = result.session.combatants.find(c => c.id === "gaius")!;
  eq(after.hp, 50, "capped at maxHp (was 48, +35..55 → 50)");
});

console.log("[c3-actions] resolveAction — buffs / antidotes / wound-stoppers");

caseName("stamina_brew adds haste severity 1 for 3 rounds", () => {
  const v = makeFighter("vivian", "short_sword", [], {
    inventory: [{ itemId: "stamina_brew", quantity: 1 }],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "use", sourceId: "vivian", targetId: "vivian", itemId: "stamina_brew",
  });
  truthy(!r.invalid, `valid: ${r.invalid}`);
  const after = r.session.combatants.find(c => c.id === "vivian")!;
  const haste = after.activeEffects.find(e => e.type === "haste");
  truthy(haste, "haste effect present");
  eq(haste!.severity, 1, "severity 1");
  eq(haste!.turnsRemaining, 3, "3 rounds");
  truthy(/bitter brown brew/.test(r.narrative), `Howard prose: ${r.narrative}`);
});

caseName("fatigue_brew adds haste severity 2 for 4 rounds (stronger than stamina)", () => {
  const v = makeFighter("vivian", "short_sword", [], {
    inventory: [{ itemId: "fatigue_brew", quantity: 1 }],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "use", sourceId: "vivian", targetId: "vivian", itemId: "fatigue_brew",
  });
  truthy(!r.invalid, `valid: ${r.invalid}`);
  const after = r.session.combatants.find(c => c.id === "vivian")!;
  const haste = after.activeEffects.find(e => e.type === "haste");
  truthy(haste, "haste effect present");
  eq(haste!.severity, 2, "severity 2");
  eq(haste!.turnsRemaining, 4, "4 rounds");
  truthy(/thick green draught/.test(r.narrative), `Howard prose: ${r.narrative}`);
});

caseName("antidote strips poison severity ≤ 1 only", () => {
  const v = makeFighter("vivian", "short_sword", [], {
    activeEffects: [{ type: "poison", zone: "torso", severity: 1, turnsRemaining: 3 }],
    inventory: [{ itemId: "antidote", quantity: 1 }],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "use", sourceId: "vivian", targetId: "vivian", itemId: "antidote",
  });
  truthy(!r.invalid, `valid: ${r.invalid}`);
  const after = r.session.combatants.find(c => c.id === "vivian")!;
  eq(after.activeEffects.filter(e => e.type === "poison").length, 0, "poison stripped");
});

caseName("antidote does NOT cure severity-2 poison (need strong_antidote)", () => {
  const v = makeFighter("vivian", "short_sword", [], {
    activeEffects: [{ type: "poison", zone: "torso", severity: 2, turnsRemaining: 5 }],
    inventory: [{ itemId: "antidote", quantity: 1 }],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "use", sourceId: "vivian", targetId: "vivian", itemId: "antidote",
  });
  truthy(!r.invalid, `valid: ${r.invalid}`);
  const after = r.session.combatants.find(c => c.id === "vivian")!;
  eq(after.activeEffects.filter(e => e.type === "poison").length, 1, "severity-2 poison remains");
});

caseName("strong_antidote strips poison of any severity", () => {
  const v = makeFighter("vivian", "short_sword", [], {
    activeEffects: [{ type: "poison", zone: "torso", severity: 3, turnsRemaining: 5 }],
    inventory: [{ itemId: "strong_antidote", quantity: 1 }],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "use", sourceId: "vivian", targetId: "vivian", itemId: "strong_antidote",
  });
  truthy(!r.invalid, `valid: ${r.invalid}`);
  const after = r.session.combatants.find(c => c.id === "vivian")!;
  eq(after.activeEffects.filter(e => e.type === "poison").length, 0, "all poison stripped");
});

caseName("bandage strips bleed but NOT severed_artery (refactor 2026-05-08)", () => {
  const v = makeFighter("vivian", "short_sword", [], {
    activeEffects: [
      { type: "bleed", zone: "limbs", severity: 1, turnsRemaining: 3 },
      { type: "severed_artery", zone: "neck", severity: 1, turnsRemaining: 3 },
    ],
    inventory: [{ itemId: "bandage", quantity: 1 }],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "use", sourceId: "vivian", targetId: "vivian", itemId: "bandage",
  });
  truthy(!r.invalid, `valid: ${r.invalid}`);
  const after = r.session.combatants.find(c => c.id === "vivian")!;
  eq(after.activeEffects.filter(e => e.type === "bleed").length, 0, "bleed stripped");
  eq(after.activeEffects.filter(e => e.type === "severed_artery").length, 1, "severed_artery survives bandage");
});

caseName("Successful 1-turn cast sets firedSpell on ActionResult", () => {
  const v = makeFighter("vivian", "short_sword", ["BLAST"], {
    mana: 10, maxMana: 20, knownSpells: ["BLAST"],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai", hp: 50,
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "cast", sourceId: "vivian", targetId: "rurik", spellName: "BLAST",
  });
  truthy(!r.invalid, `expected valid: ${r.invalid}`);
  truthy(r.firedSpell, "firedSpell present on success");
  eq(r.firedSpell?.sourceId, "vivian", "firedSpell.sourceId");
  eq(r.firedSpell?.targetId, "rurik", "firedSpell.targetId");
  eq(r.firedSpell?.spellName, "BLAST", "firedSpell.spellName");
});

caseName("Interrupted cast leaves firedSpell undefined (FX must NOT fire)", () => {
  // Regression for 2026-05-08: Gaius was critically hit mid-firebolt,
  // engine emitted the interrupt-fizzle narrative + advanced the turn,
  // but the dev page still triggered the streak FX because it gated on
  // the ACTION (cast firebolt) rather than on actual resolution.
  const v = makeFighter("vivian", "short_sword", ["FIREBOLT"], {
    mana: 10, maxMana: 20, knownSpells: ["FIREBOLT"],
    interruptedSinceLastTurn: { kind: "critical_hit", zone: "head" },
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "cast", sourceId: "vivian", targetId: "rurik", spellName: "FIREBOLT",
  });
  truthy(!r.invalid, `expected valid: ${r.invalid}`);
  // The engine processes the interrupt and advances the turn — no
  // mechanical effect, no firedSpell flag. Narrative explains the
  // fizzle.
  truthy(!r.firedSpell, `firedSpell should be undefined, got ${JSON.stringify(r.firedSpell)}`);
  truthy(/voice|crack|silence|critical/i.test(r.narrative), `interrupt narrative: ${r.narrative}`);
});

caseName("tourniquet strips severed_artery AND bleed", () => {
  const v = makeFighter("vivian", "short_sword", [], {
    activeEffects: [
      { type: "bleed", zone: "limbs", severity: 1, turnsRemaining: 3 },
      { type: "severed_artery", zone: "neck", severity: 1, turnsRemaining: 3 },
    ],
    inventory: [{ itemId: "tourniquet", quantity: 1 }],
  });
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "use", sourceId: "vivian", targetId: "vivian", itemId: "tourniquet",
  });
  truthy(!r.invalid, `valid: ${r.invalid}`);
  const after = r.session.combatants.find(c => c.id === "vivian")!;
  eq(after.activeEffects.filter(e => e.type === "bleed").length, 0, "bleed stripped");
  eq(after.activeEffects.filter(e => e.type === "severed_artery").length, 0, "severed_artery stripped");
  truthy(/leather strap/.test(r.narrative), `Howard prose: ${r.narrative}`);
});

// ── firedStrike discriminator (added 2026-05-09 with strike-FX sprint)
console.log("[c3-actions] firedStrike — structured strike outcome");

const VALID_STRIKE_OUTCOMES = new Set([
  "hit", "crit", "evaded", "blocked", "armorStopped", "criticalFail",
]);

caseName("Resolved strike sets firedStrike with sourceId/targetId/zone + valid outcome", () => {
  const v = makeFighter("vivian", "short_sword");
  const e = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai", hp: 40, maxHp: 40,
  });
  const session = makeSession([v, e]);
  const r = resolveAction(session, {
    kind: "strike", sourceId: "vivian", targetId: "rurik", zone: "torso",
  });
  truthy(!r.invalid, `valid: ${r.invalid}`);
  truthy(r.firedStrike, "firedStrike must be populated on a resolved strike");
  eq(r.firedStrike!.sourceId, "vivian", "firedStrike.sourceId");
  eq(r.firedStrike!.targetId, "rurik",  "firedStrike.targetId");
  eq(r.firedStrike!.zone,     "torso",  "firedStrike.zone");
  truthy(
    VALID_STRIKE_OUTCOMES.has(r.firedStrike!.outcome),
    `firedStrike.outcome must be a known discriminator, got "${r.firedStrike!.outcome}"`,
  );
});

caseName("Refused strike (same-team) does NOT set firedStrike", () => {
  const v = makeFighter("vivian", "short_sword");
  const ally = makeFighter("brand", "long_sword", [], {
    side: "ally", team: "ally", controlledBy: "player",
  });
  const enemy = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([v, ally, enemy], ["vivian", "brand", "rurik"]);
  const r = resolveAction(session, {
    kind: "strike", sourceId: "vivian", targetId: "brand", zone: "torso",
  });
  truthy(r.invalid, "same-team strike must be refused");
  truthy(
    !r.firedStrike,
    `firedStrike must stay undefined on a refused strike, got ${JSON.stringify(r.firedStrike)}`,
  );
});

caseName("Non-strike actions leave firedStrike undefined", () => {
  const healer = makeFighter("vivian", "short_sword", ["HEAL"], {
    mana: 12, maxMana: 12,
  });
  const ally = makeFighter("brand", "long_sword", [], {
    side: "ally", team: "ally", controlledBy: "player", hp: 10, maxHp: 50,
  });
  const enemy = makeFighter("rurik", "long_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai",
  });
  const session = makeSession([healer, ally, enemy], ["vivian", "brand", "rurik"]);
  const r = resolveAction(session, {
    kind: "cast", sourceId: "vivian", targetId: "brand", spellName: "HEAL",
  });
  truthy(!r.invalid, `HEAL valid: ${r.invalid}`);
  truthy(
    !r.firedStrike,
    `firedStrike must stay undefined on a cast action, got ${JSON.stringify(r.firedStrike)}`,
  );
});

if (failures > 0) {
  console.error(`\n[c3-actions] ${failures} failures`);
  process.exit(1);
} else {
  console.log("\n[c3-actions] ✓ all cases passed");
}
