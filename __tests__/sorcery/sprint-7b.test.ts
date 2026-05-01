// ============================================================
// LIVING EAMON — Sorcery effect dispatch tests (Sprint 7b)
//
// Run via:
//   npx tsx __tests__/sorcery/sprint-7b.test.ts
//   npm run test:quests
//
// Coverage:
//   1. Damage spells out of combat → no-target outcome, no resources spent.
//   2. Damage spells in combat → enemyCombatant.hp drops by spell damageRoll range.
//   3. Damage spells in combat consume mana + reagents + Illumination.
//   4. Heal spells restore caster HP up to maxHp; surplus is clamped.
//   5. Heal spells in combat sync into playerCombatant.hp.
//   6. Cure (Solv Tox) removes poison status from playerCombatant during combat.
//   7. Cure out of combat is a successful no-op (cured: 0).
//   8. Resurrection returns resurrection-no-corpse (no-corpse-model yet).
//   9. Phase-2 effect kinds (buff/debuff/summon/field/movement/conceal/transform/utility/reveal)
//      return no-effect-yet but still consume resources.
//  10. composeInvokeResponse renders every new outcome variant.
// ============================================================

import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState } from "../../lib/gameState";
import type {
  ActiveCombatSession,
  CombatantState,
  ActiveStatusEffect,
  BodyZone,
} from "../../lib/combatTypes";
import { createEmptyBodyArmorMap } from "../../lib/combatTypes";
import { handleInvoke, composeInvokeResponse } from "../../lib/sorcery/invoke";
import { getSpellById } from "../../lib/sorcery/registry";

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

const ALL_REAGENTS = [
  { itemId: "black_pearl",    quantity: 10 },
  { itemId: "blood_moss",     quantity: 10 },
  { itemId: "garlic",         quantity: 10 },
  { itemId: "ginseng",        quantity: 10 },
  { itemId: "mandrake_root",  quantity: 10 },
  { itemId: "nightshade",     quantity: 10 },
  { itemId: "spider_silk",    quantity: 10 },
  { itemId: "sulfurous_ash",  quantity: 10 },
];

interface FixOpts {
  knownCircles?: number[];
  mana?: number;
  hp?: number;
  maxHp?: number;
  withCombat?: boolean;
  enemyHp?: number;
  enemyEffects?: ActiveStatusEffect[];
}

function fixtureState(opts: FixOpts = {}): WorldState {
  const base = createInitialWorldState("Tester");
  let state: WorldState = {
    ...base,
    player: {
      ...base.player,
      knownCircles: opts.knownCircles ?? [1, 2, 3, 4, 5, 6, 7, 8],
      currentMana: opts.mana ?? 100,
      hp: opts.hp ?? 50,
      maxHp: opts.maxHp ?? 100,
      inventory: ALL_REAGENTS,
    },
  };
  if (opts.withCombat) {
    const session = makeCombatSession(opts.enemyHp ?? 100, opts.enemyEffects ?? []);
    state = {
      ...state,
      player: { ...state.player, activeCombat: session },
    };
  }
  return state;
}

function makeCombatant(name: string, hp: number, effects: ActiveStatusEffect[]): CombatantState {
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
  };
}

function makeCombatSession(
  enemyHp: number,
  enemyEffects: ActiveStatusEffect[]
): ActiveCombatSession {
  return {
    enemyNpcId: "test_orc",
    enemyName: "test orc",
    roundNumber: 1,
    playerCombatant: makeCombatant("Tester", 50, []),
    enemyCombatant: makeCombatant("test orc", enemyHp, enemyEffects),
    combatLog: [],
    finished: false,
    playerWon: null,
  };
}

// ── 1. Damage out of combat → no-target ─────────────────────

console.log("[sprint-7b] Damage out of combat");

caseName("damage spell with no active combat returns no-target, no resources spent", () => {
  const s0 = fixtureState({ withCombat: false });
  const manaBefore = s0.player.currentMana;
  const ashBefore = s0.player.inventory.find(i => i.itemId === "sulfurous_ash")?.quantity ?? 0;
  const illumBefore = s0.player.picssi.illumination;

  const r = handleInvoke(s0, "Crea Sag"); // Magic Arrow
  eq(r.outcome.kind, "no-target", "kind");
  // Resources unchanged
  eq(r.state.player.currentMana, manaBefore, "mana untouched");
  const ashAfter = r.state.player.inventory.find(i => i.itemId === "sulfurous_ash")?.quantity ?? 0;
  eq(ashAfter, ashBefore, "reagent untouched");
  eq(r.state.player.picssi.illumination, illumBefore, "illumination untouched");
});

// ── 2. Damage in combat → enemyCombatant.hp drops, in range ──

console.log("[sprint-7b] Damage in combat");

caseName("Magic Arrow in combat drops enemy HP by 14–18 (one roll)", () => {
  const s0 = fixtureState({ withCombat: true, enemyHp: 100 });
  const r = handleInvoke(s0, "Crea Sag");
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind !== "success") return;
  eq(r.outcome.effect.kind, "damage-dealt", "effect kind");
  if (r.outcome.effect.kind !== "damage-dealt") return;

  const dmg = r.outcome.effect.amount;
  if (dmg < 14 || dmg > 18) {
    throw new Error(`damage ${dmg} outside expected range [14,18]`);
  }
  const enemyHpAfter = r.state.player.activeCombat!.enemyCombatant.hp;
  eq(enemyHpAfter, 100 - dmg, "enemy HP reduced exactly by rolled damage");
  eq(r.outcome.effect.targetHpAfter, enemyHpAfter, "effect.targetHpAfter matches state");
});

caseName("damage spell in combat consumes mana + reagents + Illumination", () => {
  // Cast Lightning (C4, mana 11, illum −2). Note: applyKarma recomputes
  // maxMana from |illumination| per KARMA_SYSTEM §2.2 and currentMana
  // clamps to the new maxMana, so we can't simply assert
  // "mana_after === mana_before − 11". Instead assert mana decreased,
  // illumination shifted, and reagent was consumed — those are the
  // properties Sprint 7b's effect dispatcher is responsible for.
  const s0 = fixtureState({ withCombat: true, enemyHp: 200, mana: 50 });
  const manaBefore = s0.player.currentMana;
  const ashBefore = s0.player.inventory.find(i => i.itemId === "mandrake_root")?.quantity ?? 0;

  const r = handleInvoke(s0, "Crea Ful"); // Lightning, C4
  eq(r.outcome.kind, "success", "kind");
  if (r.state.player.currentMana >= manaBefore) {
    throw new Error(`mana did not decrease: ${manaBefore} → ${r.state.player.currentMana}`);
  }
  eq(r.state.player.picssi.illumination, -2, "illumination 0 → -2");
  const ashAfter = r.state.player.inventory.find(i => i.itemId === "mandrake_root")?.quantity ?? 0;
  eq(ashAfter, ashBefore - 1, "mandrake_root consumed");
});

caseName("damage spell can drop enemy HP to 0 but not below", () => {
  const s0 = fixtureState({ withCombat: true, enemyHp: 5 });
  const r = handleInvoke(s0, "Crea Sag"); // Magic Arrow does 14-18
  eq(r.outcome.kind, "success", "kind");
  const enemyHpAfter = r.state.player.activeCombat!.enemyCombatant.hp;
  eq(enemyHpAfter, 0, "enemy HP clamped to 0");
});

// ── 3. Heal ──────────────────────────────────────────────────

console.log("[sprint-7b] Heal");

caseName("Heal restores HP within 6–12 range; capped at maxHp", () => {
  const s0 = fixtureState({ hp: 50, maxHp: 100 });
  const r = handleInvoke(s0, "Aug Vit"); // Heal C1
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind !== "success") return;
  eq(r.outcome.effect.kind, "healed", "effect kind");
  if (r.outcome.effect.kind !== "healed") return;

  const gain = r.outcome.effect.amount;
  if (gain < 6 || gain > 12) {
    throw new Error(`heal ${gain} outside expected range [6,12]`);
  }
  eq(r.state.player.hp, 50 + gain, "player.hp increased by rolled amount");
});

caseName("Heal at full HP returns 0 gain (clamped)", () => {
  const s0 = fixtureState({ hp: 100, maxHp: 100 });
  const r = handleInvoke(s0, "Aug Vit");
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind !== "success") return;
  if (r.outcome.effect.kind !== "healed") throw new Error("expected healed");
  eq(r.outcome.effect.amount, 0, "no gain at full HP");
  eq(r.state.player.hp, 100, "still at maxHp");
});

caseName("Heal during combat syncs into playerCombatant.hp", () => {
  const s0 = fixtureState({ hp: 30, maxHp: 100, withCombat: true });
  const r = handleInvoke(s0, "Aug Vit");
  eq(r.outcome.kind, "success", "kind");
  // Both player.hp and playerCombatant.hp moved together
  const newPlayerHp = r.state.player.hp;
  const newCombatantHp = r.state.player.activeCombat!.playerCombatant.hp;
  eq(newCombatantHp, newPlayerHp, "playerCombatant.hp matches player.hp after heal");
  if (newPlayerHp <= 30) throw new Error("expected HP to rise");
});

caseName("Greater Heal restores HP within 25–40 range", () => {
  const s0 = fixtureState({ hp: 10, maxHp: 100 });
  const r = handleInvoke(s0, "Mag Aug Vit"); // Greater Heal C4
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind !== "success" || r.outcome.effect.kind !== "healed") return;
  const gain = r.outcome.effect.amount;
  if (gain < 25 || gain > 40) {
    throw new Error(`Greater Heal ${gain} outside [25,40]`);
  }
});

// ── 4. Cure ──────────────────────────────────────────────────

console.log("[sprint-7b] Cure");

caseName("Cure removes poison from playerCombatant during combat", () => {
  const poison: ActiveStatusEffect = {
    type: "poison",
    zone: "torso" as BodyZone,
    severity: 2,
    turnsRemaining: -1,
    bleedPerTurn: 2,
  };
  const s0 = fixtureState({ withCombat: true });
  const session = s0.player.activeCombat!;
  s0.player.activeCombat = {
    ...session,
    playerCombatant: {
      ...session.playerCombatant,
      activeEffects: [poison],
    },
  };
  const r = handleInvoke(s0, "Solv Tox"); // Cure C2
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind !== "success" || r.outcome.effect.kind !== "cure-applied") {
    throw new Error("expected cure-applied");
  }
  eq(r.outcome.effect.cured, 1, "1 poison cured");
  const remaining = r.state.player.activeCombat!.playerCombatant.activeEffects.filter(
    e => e.type === "poison"
  );
  eq(remaining.length, 0, "no poison effects remain");
});

caseName("Cure with no poison present is a successful no-op (cured: 0)", () => {
  const s0 = fixtureState({ withCombat: true });
  const r = handleInvoke(s0, "Solv Tox");
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind !== "success" || r.outcome.effect.kind !== "cure-applied") {
    throw new Error("expected cure-applied");
  }
  eq(r.outcome.effect.cured, 0, "nothing to cure");
});

caseName("Cure out of combat is a successful no-op", () => {
  const s0 = fixtureState({ withCombat: false });
  const r = handleInvoke(s0, "Solv Tox");
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind !== "success" || r.outcome.effect.kind !== "cure-applied") {
    throw new Error("expected cure-applied");
  }
  eq(r.outcome.effect.cured, 0, "no combat means nothing to cure");
});

// ── 5. Dev-state markers (Phase-2 dispatchers + Resurrection) ───
//
// Per design principle, unbuilt features surface as a `dev-not-
// implemented` EffectResult — visible `[DEV]` flag, never in-
// fiction prose. These tests assert the marker is present and
// resources still consume normally; when each Phase-2 dispatcher
// lands, the corresponding test case gets removed (or rewritten to
// exercise the real effect).

console.log("[sprint-7b] dev-not-implemented markers");

caseName("Resurrection returns dev-not-implemented (corpse model unbuilt)", () => {
  const s0 = fixtureState();
  const manaBefore = s0.player.currentMana;
  const r = handleInvoke(s0, "Solv Mort");
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind !== "success") return;
  eq(r.outcome.effect.kind, "dev-not-implemented", "effect kind");
  if (r.outcome.effect.kind === "dev-not-implemented") {
    truthy(r.outcome.effect.reason.toLowerCase().includes("corpse"), "reason mentions corpse model");
  }
  // Resources still consumed (Resurrection is C8, mana 50, illum -30).
  // applyKarma recomputes maxMana from |illumination| (KARMA §2.2) and
  // currentMana clamps — we just assert directional behavior.
  if (r.state.player.currentMana >= manaBefore) {
    throw new Error(`mana did not decrease: ${manaBefore} → ${r.state.player.currentMana}`);
  }
  eq(r.state.player.picssi.illumination, -30, "illumination 0 → -30");
});

caseName("Bless (buff) returns dev-not-implemented but consumes resources", () => {
  const s0 = fixtureState();
  const r = handleInvoke(s0, "Mag Aug"); // Bless C3
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind !== "success") return;
  eq(r.outcome.effect.kind, "dev-not-implemented", "effect kind");
  if (r.outcome.effect.kind === "dev-not-implemented") {
    truthy(r.outcome.effect.reason.includes("buff"), "reason names the missing dispatcher");
  }
  eq(r.state.player.currentMana, 100 - 9, "mana consumed");
});

caseName("Wall of Stone (field) returns dev-not-implemented", () => {
  const s0 = fixtureState();
  const r = handleInvoke(s0, "Crea Mur"); // Wall of Stone C3
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind === "success" && r.outcome.effect.kind === "dev-not-implemented") {
    truthy(r.outcome.effect.reason.includes("field"), "reason names the missing dispatcher");
  } else {
    throw new Error("expected dev-not-implemented for field");
  }
});

caseName("Teleport (movement) returns dev-not-implemented", () => {
  const s0 = fixtureState();
  const r = handleInvoke(s0, "Mut Via"); // Teleport C3
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind === "success" && r.outcome.effect.kind === "dev-not-implemented") {
    truthy(r.outcome.effect.reason.includes("movement"), "reason names the missing dispatcher");
  } else {
    throw new Error("expected dev-not-implemented for movement");
  }
});

// ── 7. Response composer ─────────────────────────────────────

console.log("[sprint-7b] composeInvokeResponse");

caseName("renders damage-dealt (wounded) with target name + amount + remaining HP", () => {
  const spell = getSpellById("fireball")!;
  const text = composeInvokeResponse({
    kind: "success",
    spell,
    illuminationDrained: 0,
    warning: null,
    effect: {
      kind: "damage-dealt",
      targetName: "test orc",
      amount: 28,
      targetHpAfter: 72,
    },
  });
  truthy(text.includes("test orc"), "target name");
  truthy(text.includes("28"), "damage amount");
  truthy(text.includes("72"), "remaining HP");
});

caseName("renders damage-dealt (killed) with falls-silenced line, no remaining-HP tail", () => {
  const spell = getSpellById("fireball")!;
  const text = composeInvokeResponse({
    kind: "success",
    spell,
    illuminationDrained: 0,
    warning: null,
    effect: {
      kind: "damage-dealt",
      targetName: "test orc",
      amount: 28,
      targetHpAfter: 0,
    },
  });
  truthy(text.includes("test orc"), "target name");
  truthy(text.includes("28"), "damage amount");
  truthy(text.toLowerCase().includes("falls") || text.toLowerCase().includes("silenced"), "killed-flavor present");
  // Killed variant should NOT include the "HP remaining" suffix.
  if (text.includes("HP remaining")) {
    throw new Error(`killed variant should not include 'HP remaining', got: ${text}`);
  }
});

caseName("renders healed with before/after HP", () => {
  const spell = getSpellById("heal")!;
  const text = composeInvokeResponse({
    kind: "success",
    spell,
    illuminationDrained: 0,
    warning: null,
    effect: { kind: "healed", amount: 8, hpBefore: 50, hpAfter: 58 },
  });
  truthy(text.includes("8 HP"), "amount");
  truthy(text.includes("50") && text.includes("58"), "before/after");
});

caseName("dev-not-implemented renders a visible [DEV] marker, never in-fiction prose", () => {
  const spell = getSpellById("bless")!;
  // Reasons that should show up in dev markers across the registry.
  const REASONS = [
    "buff dispatcher",
    "debuff dispatcher",
    "summon dispatcher",
    "field dispatcher",
    "movement dispatcher",
    "conceal dispatcher",
    "reveal dispatcher",
    "transform dispatcher",
    "utility dispatcher",
    "Resurrection corpse model",
  ];
  for (const reason of REASONS) {
    const text = composeInvokeResponse({
      kind: "success",
      spell,
      illuminationDrained: 0,
      warning: null,
      effect: { kind: "dev-not-implemented", reason },
    });
    truthy(text.length > 0, `${reason} non-empty`);
    // Marker must be visibly developer-flagged — no in-fiction camouflage.
    truthy(text.includes("[DEV]"), `${reason} carries the [DEV] marker`);
    truthy(text.includes(reason), `${reason} text includes the reason`);
    truthy(text.toLowerCase().includes("not yet implemented"), `${reason} is flagged not yet implemented`);
  }
});

caseName("no-target response uses in-fiction voice (no 'not in combat' meta-leak)", () => {
  const spell = getSpellById("magic-arrow")!;
  const text = composeInvokeResponse({ kind: "no-target", spell });
  truthy(text.length > 0, "non-empty");
  // Must not say "you are not in combat" or similar meta-language.
  if (text.toLowerCase().includes("not in combat") || text.toLowerCase().includes("combat mode")) {
    throw new Error(`no-target response leaks combat-state meta-language: ${text}`);
  }
  // Must convey resources are preserved without using bookkeeping word "spared".
  truthy(
    text.toLowerCase().includes("reagents") || text.toLowerCase().includes("mana") || text.toLowerCase().includes("pouch"),
    "mentions resources are preserved in-fiction"
  );
});

// ── Tally ────────────────────────────────────────────────────

console.log();
if (failures === 0) {
  console.log(`[sprint-7b] ✓ all cases passed`);
  process.exit(0);
} else {
  console.error(`[sprint-7b] ✗ ${failures} case(s) failed`);
  process.exit(1);
}
