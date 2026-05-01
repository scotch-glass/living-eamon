// ============================================================
// LIVING EAMON — Sprint 7a acceptance tests (Sorcery bedrock)
//
// Run via:
//   npx tsx __tests__/sorcery/sprint-7a.test.ts
//   npm run test:quests   (auto-discovered now that runner walks
//                         __tests__/ recursively)
//
// Coverage:
//   1. Registry has 64 spells across the Eight Circles.
//   2. getSpellByWords matches case-insensitively + by exact token order.
//   3. handleInvoke gates: circle-locked, insufficient-mana, missing-reagents.
//   4. handleInvoke success: deducts mana + reagents, fires chronicle.
//   5. Circles 4+ drain Illumination per SORCERY.md §7.
//   6. Circles 2+3 fire the narrative warning string on success.
//   7. Unrecognized invocations return `unrecognized` so caller falls through.
//   8. unlockCircle quest reward populates player.knownCircles via applyReward.
//   9. unlockCircle is idempotent + maintains sorted order.
// ============================================================

import { createInitialWorldState } from "../../lib/gameState";
import type { WorldState } from "../../lib/gameState";
import { applyReward } from "../../lib/quests/engine";
import {
  SPELL_REGISTRY,
  getSpellByWords,
  getSpellById,
  getSpellsByCircle,
  spellCount,
} from "../../lib/sorcery/registry";
import { handleInvoke } from "../../lib/sorcery/invoke";
import type { Circle } from "../../lib/sorcery/types";

let failures = 0;

function eq<T>(actual: T, expected: T, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`assert ${label} — expected ${e}, got ${a}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}
function isNull(actual: unknown, label: string): void {
  if (actual !== null) throw new Error(`assert ${label} — expected null, got ${JSON.stringify(actual)}`);
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

interface StateOpts {
  knownCircles?: number[];
  mana?: number;
  reagents?: { itemId: string; quantity: number }[];
}

function fixtureState(opts: StateOpts = {}): WorldState {
  const base = createInitialWorldState("Tester");
  return {
    ...base,
    player: {
      ...base.player,
      knownCircles: opts.knownCircles ?? [],
      currentMana: opts.mana ?? 100,
      inventory: opts.reagents ?? [],
    },
  };
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

// ── 1. Registry shape ────────────────────────────────────────

console.log("[sprint-7a] Spell registry");

caseName("registry has 64 spells (8 per Circle × 8 Circles)", () => {
  eq(spellCount(), 64, "total spell count");
  for (let c = 1 as Circle; c <= 8; c = (c + 1) as Circle) {
    eq(getSpellsByCircle(c).length, 8, `Circle ${c} count`);
  }
});

caseName("spell IDs are unique", () => {
  const ids = SPELL_REGISTRY.map(s => s.id);
  eq(new Set(ids).size, ids.length, "no duplicate ids");
});

caseName("spell Words sequences are unique across the registry", () => {
  const seen = new Set<string>();
  for (const spell of SPELL_REGISTRY) {
    const key = spell.words.map(w => w.toLowerCase()).join(" ");
    if (seen.has(key)) {
      throw new Error(`duplicate Words sequence: ${key} (spell ${spell.id})`);
    }
    seen.add(key);
  }
});

caseName("Illumination drain matches SORCERY.md §7 magnitudes", () => {
  for (const spell of SPELL_REGISTRY) {
    const expected =
      spell.circle <= 3 ? 0
      : spell.circle === 4 ? -2
      : spell.circle === 5 ? -4
      : spell.circle === 6 ? -8
      : spell.circle === 7 ? -15
      : -30;
    eq(spell.illuminationDrain, expected, `${spell.id} (Circle ${spell.circle}) drain`);
  }
});

// ── 2. Words lookup ──────────────────────────────────────────

console.log("[sprint-7a] getSpellByWords");

caseName("exact match (case-sensitive) finds a Circle 1 spell", () => {
  const spell = getSpellByWords(["Aug", "Vit"]);
  truthy(spell, "Aug Vit resolves");
  eq(spell!.id, "heal", "id is heal");
  eq(spell!.circle, 1, "circle 1");
});

caseName("case-insensitive: lowercase + uppercase variants resolve", () => {
  eq(getSpellByWords(["aug", "vit"])?.id, "heal", "all lowercase");
  eq(getSpellByWords(["AUG", "VIT"])?.id, "heal", "all uppercase");
  eq(getSpellByWords(["Aug", "VIT"])?.id, "heal", "mixed");
});

caseName("token order matters (compositional grammar)", () => {
  // Aug Vit = Heal; Vit Aug is not a spell.
  isNull(getSpellByWords(["Vit", "Aug"]), "reversed order");
});

caseName("unknown words return null", () => {
  isNull(getSpellByWords(["Foo", "Bar"]), "unknown words");
  isNull(getSpellByWords([]), "empty words");
});

caseName("longer phrases resolve to higher-circle spells", () => {
  // Mag Aug Vit = Greater Heal (Circle 4)
  const greaterHeal = getSpellByWords(["Mag", "Aug", "Vit"]);
  truthy(greaterHeal, "Mag Aug Vit resolves");
  eq(greaterHeal!.id, "greater-heal", "id is greater-heal");
  eq(greaterHeal!.circle, 4, "circle 4");
});

// ── 3. handleInvoke gates ────────────────────────────────────

console.log("[sprint-7a] handleInvoke gates");

caseName("circle-locked: spell exists but Circle not in knownCircles", () => {
  const s = fixtureState({ knownCircles: [], reagents: ALL_REAGENTS });
  const r = handleInvoke(s, "Aug Vit");
  eq(r.outcome.kind, "circle-locked", "kind");
  if (r.outcome.kind === "circle-locked") eq(r.outcome.spell.id, "heal", "spell.id");
});

caseName("insufficient-mana: knownCircles ok but mana < cost", () => {
  const s = fixtureState({
    knownCircles: [1],
    mana: 2,
    reagents: ALL_REAGENTS,
  });
  const r = handleInvoke(s, "Aug Vit");
  eq(r.outcome.kind, "insufficient-mana", "kind");
  if (r.outcome.kind === "insufficient-mana") {
    eq(r.outcome.need, 4, "need");
    eq(r.outcome.have, 2, "have");
  }
});

caseName("missing-reagents: knownCircles + mana ok but reagents missing", () => {
  const s = fixtureState({
    knownCircles: [1],
    mana: 100,
    reagents: [],
  });
  const r = handleInvoke(s, "Aug Vit");
  eq(r.outcome.kind, "missing-reagents", "kind");
  if (r.outcome.kind === "missing-reagents") {
    eq(r.outcome.missing.sort().join(","), "garlic,ginseng,spider_silk", "all 3 missing");
  }
});

caseName("unrecognized: unknown words return unrecognized for legacy fall-through", () => {
  const s = fixtureState({ knownCircles: [1], reagents: ALL_REAGENTS });
  const r = handleInvoke(s, "Xyz Qqq");
  eq(r.outcome.kind, "unrecognized", "kind");
});

caseName("empty INVOKE returns fizzle-no-reagents", () => {
  const s = fixtureState({ knownCircles: [1] });
  const r = handleInvoke(s, "");
  eq(r.outcome.kind, "fizzle-no-reagents", "kind");
});

// ── 4. handleInvoke success path ─────────────────────────────

console.log("[sprint-7a] handleInvoke success");

caseName("Circle 1 success: deducts mana + reagents, no Illumination drain, no warning", () => {
  const s0 = fixtureState({
    knownCircles: [1],
    mana: 50,
    reagents: ALL_REAGENTS,
  });
  const r = handleInvoke(s0, "Aug Vit"); // Heal: 4 mana, garlic+ginseng+spider_silk
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind === "success") {
    eq(r.outcome.illuminationDrained, 0, "no drain at Circle 1");
    eq(r.outcome.warning, null, "no warning at Circle 1");
  }
  eq(r.state.player.currentMana, 46, "mana deducted (50 - 4 = 46)");
  eq(r.state.player.picssi.illumination, 0, "Illumination unchanged");
  // 3 reagents consumed (1 each of garlic, ginseng, spider_silk)
  const garlic = r.state.player.inventory.find(i => i.itemId === "garlic");
  eq(garlic?.quantity, 9, "garlic 10→9");
  const ginseng = r.state.player.inventory.find(i => i.itemId === "ginseng");
  eq(ginseng?.quantity, 9, "ginseng 10→9");
  const spider = r.state.player.inventory.find(i => i.itemId === "spider_silk");
  eq(spider?.quantity, 9, "spider_silk 10→9");
  // Untouched reagents stay at 10
  const blackPearl = r.state.player.inventory.find(i => i.itemId === "black_pearl");
  eq(blackPearl?.quantity, 10, "black_pearl untouched");
});

caseName("Circle 2 success: warning string fires (no Illumination drain)", () => {
  const s0 = fixtureState({
    knownCircles: [2],
    mana: 50,
    reagents: ALL_REAGENTS,
  });
  const r = handleInvoke(s0, "Aug Dex"); // Agility (Circle 2)
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind === "success") {
    eq(r.outcome.illuminationDrained, 0, "no drain at Circle 2");
    truthy(r.outcome.warning, "warning fires at Circle 2");
  }
  eq(r.state.player.picssi.illumination, 0, "Illumination unchanged");
});

caseName("Circle 3 success: warning string fires (no Illumination drain)", () => {
  const s0 = fixtureState({
    knownCircles: [3],
    mana: 50,
    reagents: ALL_REAGENTS,
  });
  // Bless (Mag Aug) — Circle 3 buff; works out of combat (Sprint 7b
  // returns no-effect-yet, which is still a success outcome). The
  // earlier test used Fireball, which Sprint 7b now correctly gates
  // behind active-combat (returns no-target instead of success).
  const r = handleInvoke(s0, "Mag Aug");
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind === "success") {
    eq(r.outcome.illuminationDrained, 0, "no drain at Circle 3");
    truthy(r.outcome.warning, "warning fires at Circle 3");
  }
});

caseName("Circle 4 success: drains Illumination by -2", () => {
  const s0 = fixtureState({
    knownCircles: [4],
    mana: 50,
    reagents: ALL_REAGENTS,
  });
  // Greater Heal (Mag Aug Vit) — Circle 4 heal; works out of combat.
  // The earlier test used Lightning, which Sprint 7b now correctly
  // gates behind active-combat (returns no-target).
  const r = handleInvoke(s0, "Mag Aug Vit");
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind === "success") {
    eq(r.outcome.illuminationDrained, -2, "drain -2 at Circle 4");
    isNull(r.outcome.warning, "no narrative warning at Circle 4 (drain replaces it)");
  }
  eq(r.state.player.picssi.illumination, -2, "Illumination 0 → -2");
});

caseName("Circle 8 success: drains Illumination by -30 (Defining-tier)", () => {
  const s0 = fixtureState({
    knownCircles: [8],
    mana: 100,
    reagents: ALL_REAGENTS,
  });
  const r = handleInvoke(s0, "Solv Mort"); // Resurrection (Circle 8)
  eq(r.outcome.kind, "success", "kind");
  if (r.outcome.kind === "success") {
    eq(r.outcome.illuminationDrained, -30, "drain -30 at Circle 8");
  }
  eq(r.state.player.picssi.illumination, -30, "Illumination 0 → -30");
});

// ── 5. unlockCircle quest reward ─────────────────────────────

console.log("[sprint-7a] unlockCircle quest reward (applyReward wiring)");

caseName("unlockCircle adds the circle to player.knownCircles", () => {
  const s0 = fixtureState({ knownCircles: [] });
  const next = applyReward(s0, { unlockCircle: 1 }, "test:unlock-circle-1");
  eq(next.player.knownCircles, [1], "knownCircles updated");
});

caseName("unlockCircle is idempotent (granting same circle twice = no-op)", () => {
  const s0 = fixtureState({ knownCircles: [3] });
  const next = applyReward(s0, { unlockCircle: 3 }, "test:unlock-circle-3-again");
  eq(next.player.knownCircles, [3], "knownCircles unchanged");
});

caseName("unlockCircle maintains sorted order across multiple unlocks", () => {
  const s0 = fixtureState({ knownCircles: [] });
  let s = applyReward(s0, { unlockCircle: 5 }, "t1");
  s = applyReward(s, { unlockCircle: 2 }, "t2");
  s = applyReward(s, { unlockCircle: 7 }, "t3");
  s = applyReward(s, { unlockCircle: 1 }, "t4");
  eq(s.player.knownCircles, [1, 2, 5, 7], "sorted ascending");
});

caseName("end-to-end: unlock Circle 1 via reward, then INVOKE Heal succeeds", () => {
  const s0 = fixtureState({
    knownCircles: [],
    mana: 50,
    reagents: ALL_REAGENTS,
  });
  const unlocked = applyReward(s0, { unlockCircle: 1 }, "test:e2e");
  const r = handleInvoke(unlocked, "Aug Vit");
  eq(r.outcome.kind, "success", "Heal succeeds after Circle 1 unlock");
});

// ── Tally ────────────────────────────────────────────────────

console.log();
if (failures === 0) {
  console.log(`[sprint-7a] ✓ all cases passed`);
  process.exit(0);
} else {
  console.error(`[sprint-7a] ✗ ${failures} case(s) failed`);
  process.exit(1);
}

// Help unused-import lint pass
void getSpellById;
