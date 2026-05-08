// ============================================================
// LIVING EAMON — Sprint C2 NPC combat-kit tests
//
// Run via:
//   npx tsx __tests__/combat/c2-npc-kit.test.ts
//
// Verifies:
//   - The 5 new NPCs (Vivian, Brand, 3 bandits) exist in NPCS with
//     full combat kit (mana/knownSpells/combatHotbar/inventory/picssi).
//   - buildCombatantFromNPC populates Sprint C1 fields from those NPC
//     entries — mana, spells, hotbar, inventory, picssi all flow through.
//   - getSpellManaCost returns the registered cost for known spells and
//     null for unknown / out-of-combat spells.
//   - affordableHotbarSpells filters by current mana correctly.
// ============================================================

import { NPCS } from "../../lib/gameData";
import { buildCombatantFromNPC, getSpellManaCost } from "../../lib/combat/engine";
import { affordableHotbarSpells, isBleeding, DEFAULT_BANDIT_POLICY } from "../../lib/npcAi";
import type { CombatantState } from "../../lib/combat/types";

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

console.log("[c2-npc-kit] NPC registry entries");

caseName("Vivian exists, hireable, dual-class thief-mage", () => {
  const v = NPCS.vivian;
  truthy(v, "vivian in NPCS");
  eq(v!.hireable, true, "hireable: true");
  // Canonical art shows her with a short sword + black-leather thief kit
  // (see public/art/npcs/vivian/master/_prompt.txt).
  eq(v!.weaponId, "short_sword", "weaponId: short_sword (canon-locked)");
  eq(v!.maxMana, 12, "maxMana: 12");
  eq(v!.knownSpells, ["HEAL", "BLAST"], "knownSpells");
  eq(v!.combatHotbar, ["HEAL", "BLAST"], "combatHotbar");
  eq(v!.combatRole, "fighter", "combatRole: fighter");
});

caseName("Brand the henchman exists, hireable, caster", () => {
  const b = NPCS.henchman_brand;
  truthy(b, "henchman_brand in NPCS");
  eq(b!.hireable, true, "hireable: true");
  eq(b!.weaponId, "long_sword", "weaponId: long_sword");
  eq(b!.knownSpells, ["HEAL", "BLAST"], "knownSpells");
  eq(b!.combatRole, "caster", "combatRole: caster");
});

caseName("3 bandits exist, all hostile", () => {
  truthy(NPCS.bandit_blade, "bandit_blade in NPCS");
  truthy(NPCS.bandit_witch, "bandit_witch in NPCS");
  truthy(NPCS.bandit_brute, "bandit_brute in NPCS");
  eq(NPCS.bandit_blade!.isHostile, true, "blade hostile");
  eq(NPCS.bandit_witch!.isHostile, true, "witch hostile");
  eq(NPCS.bandit_brute!.isHostile, true, "brute hostile");
});

caseName("bandit_witch carries spells + ample mana", () => {
  const w = NPCS.bandit_witch;
  eq(w!.maxMana, 18, "maxMana: 18");
  eq(w!.knownSpells, ["BLAST", "HEAL"], "knownSpells: BLAST + HEAL");
  truthy(w!.inventory!.find(i => i.itemId === "mana_potion"), "carries mana_potion");
});

caseName("bandit_brute is mana-less; carries bandages", () => {
  const b = NPCS.bandit_brute;
  eq(b!.maxMana, 0, "maxMana: 0");
  eq(b!.knownSpells, [], "no spells");
  truthy(b!.inventory!.find(i => i.itemId === "bandage" && i.quantity >= 3), "carries 3+ bandages");
});

caseName("every new NPC declares an aiPolicy or is player-controlled", () => {
  const ids = ["bandit_blade", "bandit_witch", "bandit_brute"];
  for (const id of ids) {
    truthy(NPCS[id]!.aiPolicy, `${id} has aiPolicy`);
  }
});

console.log("[c2-npc-kit] buildCombatantFromNPC threads C2 fields");

caseName("Vivian → ally, player-controlled, mana 12, hotbar populated", () => {
  const v = NPCS.vivian!;
  const c = buildCombatantFromNPC(v.id, v, v.stats.hp, { team: "ally", controlledBy: "player" });
  eq(c.team, "ally", "team: ally");
  eq(c.controlledBy, "player", "controlledBy: player");
  // npcData.mana / maxMana flow through buildCombatantFromNPC.
  eq(c.mana, 12, "mana adopted from NPC entry");
  eq(c.maxMana, 12, "maxMana adopted from NPC entry");
  eq(c.knownSpells, ["HEAL", "BLAST"], "knownSpells adopted");
  eq(c.combatHotbar, ["HEAL", "BLAST"], "combatHotbar adopted");
  eq(c.inventory.length, 3, "inventory has 3 items");
});

caseName("bandit_blade → enemy, AI-controlled, picssi defaults applied", () => {
  const b = NPCS.bandit_blade!;
  const c = buildCombatantFromNPC(b.id, b, b.stats.hp);
  eq(c.team, "enemy", "default team: enemy");
  eq(c.controlledBy, "ai", "default controlledBy: ai");
  eq(c.picssi.courage, 35, "courage from NPC entry");
  truthy(c.npcId === b.id, "npcId tracks back to registry");
});

console.log("[c2-npc-kit] getSpellManaCost");

caseName("HEAL and BLAST return their cost", () => {
  eq(getSpellManaCost("HEAL"), 4, "HEAL: 4");
  eq(getSpellManaCost("BLAST"), 6, "BLAST: 6");
  eq(getSpellManaCost("heal"), 4, "case-insensitive");
});

caseName("unknown spells return null", () => {
  eq(getSpellManaCost("DRAGONBREATH"), null, "fictional spell → null");
  eq(getSpellManaCost(""), null, "empty string → null");
});

console.log("[c2-npc-kit] npcAi helpers");

caseName("affordableHotbarSpells filters by mana", () => {
  const v = NPCS.vivian!;
  const c = buildCombatantFromNPC(v.id, v, v.stats.hp, { team: "ally", controlledBy: "player" });
  // Vivian starts with 12/12 mana and a hotbar of [HEAL(4), BLAST(6)].
  // Both affordable initially.
  const initial = affordableHotbarSpells(c, getSpellManaCost);
  eq(initial.sort(), ["BLAST", "HEAL"], "both spells affordable at full mana");

  // Drain to 5 — only HEAL (4) remains affordable.
  const drained: CombatantState = { ...c, mana: 5 };
  eq(affordableHotbarSpells(drained, getSpellManaCost), ["HEAL"], "low mana → only HEAL");

  // Drain to 0 — none affordable.
  const empty: CombatantState = { ...c, mana: 0 };
  eq(affordableHotbarSpells(empty, getSpellManaCost), [], "no mana → nothing affordable");
});

caseName("isBleeding detects bleed effects", () => {
  const v = NPCS.vivian!;
  const c = buildCombatantFromNPC(v.id, v, v.stats.hp, { team: "ally", controlledBy: "player" });
  eq(isBleeding(c), false, "no effects → not bleeding");
  const wounded: CombatantState = {
    ...c,
    activeEffects: [{ type: "bleed", zone: "torso", severity: 1, turnsRemaining: 3, damagePerTurn: 2 }],
  };
  eq(isBleeding(wounded), true, "bleed effect → bleeding");
});

caseName("DEFAULT_BANDIT_POLICY exposes sane defaults", () => {
  eq(DEFAULT_BANDIT_POLICY.healSelfThreshold, 0.4, "default healSelfThreshold: 0.4");
  eq(DEFAULT_BANDIT_POLICY.healAllyThreshold, 0.3, "default healAllyThreshold: 0.3");
  eq(DEFAULT_BANDIT_POLICY.spellPreference, "balanced", "default spellPreference: balanced");
});

if (failures > 0) {
  console.error(`\n[c2-npc-kit] ${failures} failures`);
  process.exit(1);
} else {
  console.log("\n[c2-npc-kit] ✓ all cases passed");
}
