import { describe, it, expect } from "vitest";
import { tickWorldState } from "./gameState";
import type { WorldState } from "./gameState";

const makeWorldState = (overrides: Partial<WorldState> = {}): WorldState => {
  const basePlayer: import("./gameState").PlayerState = {
    id: "hero-1",
    name: "Test Hero",
    gender: "male",
    currentRoom: "main_hall",
    previousRoom: null,
    visitedRooms: [],
    hp: 50,
    maxHp: 100,
    currentMana: 5,
    maxMana: 20,
    strength: 10,
    dexterity: 10,
    charisma: 10,
    strengthEffective: 10,
    dexterityEffective: 10,
    charismaEffective: 10,
    combatVictories: 0,
    stamina: 55,
    maxStamina: 55,
    fatiguePool: -110, // tier 2
    actionBudget: 25,
    weaponSkills: {},
    gold: 100,
    bankedGold: 0,
    weapon: "short_sword",
    armor: null,
    shield: null,
    helmet: null,
    gorget: null,
    bodyArmor: null,
    limbArmor: null,
    boots: null,
    ringLeft: null,
    ringRight: null,
    cuffLeft: null,
    cuffRight: null,
    necklace: null,
    inventory: [],
    picssi: {
      passion: 0,
      integrity: 0,
      courage: 0,
      standing: 0,
      spirituality: 0,
      illumination: 0,
    },
    activeCombat: null,
    activeEffects: [],
  };

  const state: WorldState = {
    player: overrides?.player ? { ...basePlayer, ...overrides.player } : basePlayer,
    rooms: overrides?.rooms ?? {},
    npcs: overrides?.npcs ?? {},
    activeEvents: overrides?.activeEvents ?? [],
    chronicleLog: overrides?.chronicleLog ?? [],
    corpses: overrides?.corpses ?? {},
    worldTurn: overrides?.worldTurn ?? 0,
    barrelStock: overrides?.barrelStock ?? { gowns: 20, charityClothes: 10 },
    vendorTempStock: overrides?.vendorTempStock ?? {},
    realTimeMs: overrides?.realTimeMs ?? 0,
    lastTickAt: overrides?.lastTickAt ?? 0,
  };

  return state;
};

describe("Sprint 1 — stamina recovery in tickWorldState", () => {
  it("recovers fatiguePool per turn when stamina > 0", () => {
    const state = makeWorldState({
      player: {
        stamina: 55,
        maxStamina: 55,
        fatiguePool: -110, // tier 2
      },
    });
    const next = tickWorldState(state);
    // Recovery = ceil(55 * 0.1) = ceil(5.5) = 6
    const expectedFatigue = Math.min(0, -110 + 6); // -104
    expect(next.player.fatiguePool).toBe(expectedFatigue);
  });

  it("does not recover fatiguePool when stamina = 0", () => {
    const state = makeWorldState({
      player: {
        stamina: 0,
        maxStamina: 55,
        fatiguePool: -110,
      },
    });
    const next = tickWorldState(state);
    expect(next.player.fatiguePool).toBe(-110); // unchanged
  });

  it("clamps fatiguePool recovery at 0", () => {
    const state = makeWorldState({
      player: {
        stamina: 55,
        maxStamina: 55,
        fatiguePool: -3, // almost at 0
      },
    });
    const next = tickWorldState(state);
    // Recovery = 6, but -3 + 6 = 3 > 0, so clamp at 0
    expect(next.player.fatiguePool).toBe(0);
  });

  it("gates HP regen on stamina > 0", () => {
    const state = makeWorldState({
      player: {
        stamina: 0,
        hp: 50,
        maxHp: 100,
      },
    });
    const next = tickWorldState(state);
    expect(next.player.hp).toBe(50); // no regen
  });

  it("regens HP and mana when stamina > 0", () => {
    const state = makeWorldState({
      player: {
        stamina: 55,
        maxStamina: 55,
        hp: 50,
        maxHp: 100,
        currentMana: 5,
        maxMana: 20,
      },
    });
    const next = tickWorldState(state);
    expect(next.player.hp).toBe(51); // +1 from HP_REGEN_PER_TURN
    expect(next.player.currentMana).toBe(6); // +1 from MANA_REGEN_PER_TURN
  });

  it("increments worldTurn", () => {
    const state = makeWorldState({ worldTurn: 100 });
    const next = tickWorldState(state);
    expect(next.worldTurn).toBe(101);
  });

});
