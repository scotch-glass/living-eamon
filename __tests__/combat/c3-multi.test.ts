// ============================================================
// LIVING EAMON — Sprint C3 multi-combatant + spell speed + position
//
// Run via:
//   npx tsx __tests__/combat/c3-multi.test.ts
//
// Verifies the C3 mechanics that landed in this pass:
//   1. Spell metadata lookups (SPELL_DATA + helpers).
//   2. effectiveCombatSpeed: max(weaponSpeed, slowest hotbar spell).
//   3. rollInitiativeOrder: lower total acts first; deterministic tiebreak.
//   4. Position-based evasion in calculateEvasionChance (via resolveStrike).
//   5. fillCombatantDefaults populates channelingState + interruptedSinceLastTurn.
//
// Sprints C3d/e/g (resolveAction, channel/interrupt logic, ACT handlers)
// land in a follow-up test file once the engine surface is in.
// ============================================================

import {
  fillCombatantDefaults,
  createEmptyBodyArmorMap,
  type CombatantState,
} from "../../lib/combat/types";
import {
  effectiveCombatSpeed,
  rollInitiativeOrder,
  resolveStrike,
  buildCombatantFromNPC,
} from "../../lib/combat/engine";
import {
  getSpellCastSpeed,
  getSpellCastTurns,
  getSpellManaCost,
  getSpellCircle,
  isCombatSpell,
} from "../../lib/combat/spellData";
import { NPCS } from "../../lib/gameData";

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

function makeFighter(id: string, weaponId: string, hotbar: string[] = [], opts: Partial<CombatantState> = {}): CombatantState {
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
    ...opts,
  });
}

console.log("[c3-multi] spellData lookups");

caseName("HEAL is a Circle 1, castSpeed 2, castTurns 1, mana 4", () => {
  eq(getSpellManaCost("HEAL"), 4, "HEAL mana cost");
  eq(getSpellCastSpeed("HEAL"), 2, "HEAL castSpeed");
  eq(getSpellCastTurns("HEAL"), 1, "HEAL castTurns");
  eq(getSpellCircle("HEAL"), 1, "HEAL circle");
  eq(isCombatSpell("HEAL"), true, "HEAL is a combat spell");
  eq(isCombatSpell("heal"), true, "case-insensitive");
});

caseName("FIREBOLT is a Circle 2, castSpeed 3 (matches long sword tempo)", () => {
  eq(getSpellCastSpeed("FIREBOLT"), 3, "FIREBOLT castSpeed");
  eq(getSpellCircle("FIREBOLT"), 2, "FIREBOLT circle");
});

caseName("Unregistered spell returns 0/null defaults", () => {
  eq(getSpellManaCost("DRAGONBREATH"), null, "unknown mana → null");
  eq(getSpellCastSpeed("DRAGONBREATH"), 0, "unknown castSpeed → 0 (won't gate initiative)");
  eq(getSpellCastTurns("DRAGONBREATH"), 1, "unknown castTurns → 1 (fail open)");
  eq(isCombatSpell("DRAGONBREATH"), false, "unknown not a combat spell");
});

console.log("[c3-multi] effectiveCombatSpeed — max(weapon, slowest hotbar spell)");

caseName("short_sword + [HEAL, BLAST] → 2 (weapon dominates a Circle 1 hotbar)", () => {
  const c = makeFighter("vivian", "short_sword", ["HEAL", "BLAST"]);
  eq(effectiveCombatSpeed(c), 2, "max(2, max(2, 2)) = 2");
});

caseName("long_sword + [HEAL, BLAST] → 5 (weapon dominates)", () => {
  const c = makeFighter("brand", "long_sword", ["HEAL", "BLAST"]);
  eq(effectiveCombatSpeed(c), 5, "max(5, max(2, 2)) = 5");
});

caseName("great_sword + no spells → 8 (weapon alone, empty hotbar contributes 0)", () => {
  const c = makeFighter("korm", "great_sword", []);
  eq(effectiveCombatSpeed(c), 8, "max(8, 0) = 8");
});

caseName("short_sword + Circle 2 spell (FIREBOLT castSpeed 3) → 3 (spell rises to mid tier)", () => {
  // FIREBOLT is castSpeed 3 — the heaviest currently-registered spell
  // tempo, used here to exercise the spell-dominates branch.
  const c = makeFighter("acrobat", "short_sword", ["HEAL", "FIREBOLT"]);
  eq(effectiveCombatSpeed(c), 3, "max(2, max(2, 3)) = 3");
});

caseName("unarmed + Circle 1 hotbar → 2 (fast, but spell ties unarmed)", () => {
  const c = makeFighter("monk", "unarmed", ["HEAL"]);
  eq(effectiveCombatSpeed(c), 2, "max(2, 2) = 2 — Word and fists are equally fast");
});

console.log("[c3-multi] rollInitiativeOrder — lower total acts first");

caseName("3 combatants — lower expected speed lands earlier on average", () => {
  // Force a deterministic-ish run by averaging many rolls. Vivian
  // (short_sword) should land first more often than Korm (great_sword).
  const vivian = makeFighter("vivian", "short_sword", ["HEAL", "BLAST"], { dexterity: 16 }); // dex bonus -2
  const brand  = makeFighter("brand",  "long_sword",  ["HEAL", "BLAST"]);
  const korm   = makeFighter("korm",   "great_sword");
  let vivianFirstCount = 0;
  let kormFirstCount = 0;
  for (let i = 0; i < 200; i++) {
    const order = rollInitiativeOrder([korm, brand, vivian]);
    if (order[0] === "vivian") vivianFirstCount++;
    if (order[0] === "korm") kormFirstCount++;
  }
  truthy(vivianFirstCount > kormFirstCount * 5,
    `Vivian-first (${vivianFirstCount}) should be ≫ Korm-first (${kormFirstCount}) over 200 rolls`);
});

caseName("Stable tiebreak by id — same speed and dex, lower id wins", () => {
  // Both combatants have identical weapon + hotbar + dex so the only
  // difference is the random roll. Force a tie scenario by stubbing
  // Math.random temporarily.
  const orig = Math.random;
  let counter = 0;
  Math.random = () => {
    // Returns 0.5 → both roll the same number on a 1d10 → tied. Stable tiebreak picks by id.
    counter++;
    return 0.5;
  };
  try {
    const a = makeFighter("alpha", "short_sword");
    const b = makeFighter("beta", "short_sword");
    const order = rollInitiativeOrder([b, a]);
    eq(order, ["alpha", "beta"], "alpha (lower id) acts first on tie");
  } finally {
    Math.random = orig;
  }
});

console.log("[c3-multi] position evasion — back rank harder to hit with STRIKE");

caseName("front-rank vs back-rank — back gets noticeably more evasions over 1000 strikes", () => {
  // Same defender stats except position. Run many strikes against each
  // and confirm the back-rank target evades more often.
  const attacker = makeFighter("attacker", "long_sword");
  const frontTarget = makeFighter("front", "short_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai", position: 1,
  });
  const backTarget = makeFighter("back", "short_sword", [], {
    side: "enemy", team: "enemy", controlledBy: "ai", position: 3,
  });
  let frontEvades = 0;
  let backEvades = 0;
  for (let i = 0; i < 1000; i++) {
    const sFront = resolveStrike(attacker, frontTarget, "torso", "slash");
    if (sFront.evaded) frontEvades++;
    const sBack = resolveStrike(attacker, backTarget, "torso", "slash");
    if (sBack.evaded) backEvades++;
  }
  truthy(backEvades > frontEvades + 100,
    `back-rank evades (${backEvades}) should exceed front-rank evades (${frontEvades}) by a clear margin (≥+100/1000)`);
});

caseName("middle-rank evasion sits between front and back", () => {
  const attacker = makeFighter("attacker", "long_sword");
  const front = makeFighter("front", "short_sword", [], { side: "enemy", team: "enemy", controlledBy: "ai", position: 1 });
  const middle = makeFighter("middle", "short_sword", [], { side: "enemy", team: "enemy", controlledBy: "ai", position: 2 });
  const back = makeFighter("back", "short_sword", [], { side: "enemy", team: "enemy", controlledBy: "ai", position: 3 });
  let f = 0, m = 0, b = 0;
  for (let i = 0; i < 1000; i++) {
    if (resolveStrike(attacker, front,  "torso", "slash").evaded) f++;
    if (resolveStrike(attacker, middle, "torso", "slash").evaded) m++;
    if (resolveStrike(attacker, back,   "torso", "slash").evaded) b++;
  }
  truthy(m > f, `middle (${m}) > front (${f})`);
  truthy(b > m, `back (${b}) > middle (${m})`);
});

console.log("[c3-multi] CombatantState defaults");

caseName("fillCombatantDefaults populates channelingState=null and interruptedSinceLastTurn=null", () => {
  const c = fillCombatantDefaults({ id: "x", name: "X", side: "ally" });
  eq(c.channelingState, null, "channelingState defaults to null");
  eq(c.interruptedSinceLastTurn, null, "interruptedSinceLastTurn defaults to null");
});

caseName("buildCombatantFromNPC populates Sprint C3 fields too", () => {
  const v = NPCS.vivian!;
  const c = buildCombatantFromNPC(v.id, v, v.stats.hp, { team: "ally", controlledBy: "player" });
  eq(c.channelingState, null, "fresh combatant not channeling");
  eq(c.interruptedSinceLastTurn, null, "fresh combatant not interrupted");
});

if (failures > 0) {
  console.error(`\n[c3-multi] ${failures} failures`);
  process.exit(1);
} else {
  console.log("\n[c3-multi] ✓ all cases passed");
}
