import { describe, it, expect } from "vitest";
import {
  recomputeDerivedStats,
  fatigueLevel,
  fatigueTierLabel,
  weaponStaminaCost,
  clampPicssi,
  applyKarma,
} from "./recompute";
import type { PlayerState } from "../gameState";

const makePlayer = (overrides: Partial<PlayerState> = {}): PlayerState => ({
  id: "hero-1",
  name: "Test Hero",
  gender: "male",
  currentRoom: "main_hall",
  previousRoom: null,
  visitedRooms: [],
  hp: 50,
  maxHp: 50,
  currentMana: 10,
  maxMana: 10,
  strength: 10,
  dexterity: 10,
  charisma: 10,
  strengthEffective: 10,
  dexterityEffective: 10,
  charismaEffective: 10,
  combatVictories: 0,
  stamina: 55,
  maxStamina: 55,
  fatiguePool: 0,
  actionBudget: 25,
  weaponSkills: {},
  gold: 0,
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
  ...overrides,
});

describe("Sprint 1 — Stamina Bedrock", () => {
  describe("recomputeDerivedStats", () => {
    it("computes maxStamina = STAMINA_BASE + STAMINA_PER_STR * STR", () => {
      const p = makePlayer({ strength: 6 });
      const recomputed = recomputeDerivedStats(p);
      expect(recomputed.maxStamina).toBe(35 + 2 * 6); // 47
    });

    it("computes maxStamina for STR 10", () => {
      const p = makePlayer({ strength: 10 });
      const recomputed = recomputeDerivedStats(p);
      expect(recomputed.maxStamina).toBe(35 + 2 * 10); // 55
    });

    it("computes maxStamina for STR 15", () => {
      const p = makePlayer({ strength: 15 });
      const recomputed = recomputeDerivedStats(p);
      expect(recomputed.maxStamina).toBe(35 + 2 * 15); // 65
    });

    it("clamps current stamina when maxStamina raises", () => {
      const p = makePlayer({ strength: 10, stamina: 55, maxStamina: 55 });
      // Artificially set strength to 15; recompute raises cap
      const p2 = { ...p, strength: 15 };
      const recomputed = recomputeDerivedStats(p2);
      expect(recomputed.maxStamina).toBe(65);
      expect(recomputed.stamina).toBe(55); // stays flat, doesn't auto-heal
    });

    it("clamps current stamina when maxStamina lowers", () => {
      const p = makePlayer({ strength: 20, stamina: 75, maxStamina: 75 });
      const p2 = { ...p, strength: 10 };
      const recomputed = recomputeDerivedStats(p2);
      expect(recomputed.maxStamina).toBe(55);
      expect(recomputed.stamina).toBe(55); // clamped to new max
    });
  });

  describe("fatigueLevel", () => {
    it("returns tier 0 when fatiguePool > -maxStamina", () => {
      const p = makePlayer({ maxStamina: 55, fatiguePool: -40 });
      expect(fatigueLevel(p)).toBe(0);
    });

    it("returns tier 1 when -maxStamina >= fatiguePool > -2*maxStamina", () => {
      const p = makePlayer({ maxStamina: 55, fatiguePool: -55 });
      expect(fatigueLevel(p)).toBe(1);
    });

    it("returns tier 2 when -2*maxStamina >= fatiguePool > -3*maxStamina", () => {
      const p = makePlayer({ maxStamina: 55, fatiguePool: -110 });
      expect(fatigueLevel(p)).toBe(2);
    });

    it("returns tier 3 when -3*maxStamina >= fatiguePool > -4*maxStamina", () => {
      const p = makePlayer({ maxStamina: 55, fatiguePool: -165 });
      expect(fatigueLevel(p)).toBe(3);
    });

    it("returns tier 4 when fatiguePool <= -4*maxStamina", () => {
      const p = makePlayer({ maxStamina: 55, fatiguePool: -220 });
      expect(fatigueLevel(p)).toBe(4);
    });

    it("handles boundary: exactly at -maxStamina is tier 1", () => {
      const p = makePlayer({ maxStamina: 55, fatiguePool: -55 });
      expect(fatigueLevel(p)).toBe(1);
    });
  });

  describe("fatigueTierLabel", () => {
    it("labels tier 0 as Fresh", () => {
      expect(fatigueTierLabel(0)).toBe("Fresh");
    });

    it("labels tier 1 as Winded", () => {
      expect(fatigueTierLabel(1)).toBe("Winded");
    });

    it("labels tier 2 as Tired", () => {
      expect(fatigueTierLabel(2)).toBe("Tired");
    });

    it("labels tier 3 as Flagging", () => {
      expect(fatigueTierLabel(3)).toBe("Flagging");
    });

    it("labels tier 4 as Exhausted", () => {
      expect(fatigueTierLabel(4)).toBe("Exhausted");
    });
  });

  describe("weaponStaminaCost", () => {
    it("returns 10 for short_sword", () => {
      expect(weaponStaminaCost("short_sword")).toBe(10);
    });

    it("returns 13 for long_sword", () => {
      expect(weaponStaminaCost("long_sword")).toBe(13);
    });

    it("returns 18 for great_sword", () => {
      expect(weaponStaminaCost("great_sword")).toBe(18);
    });

    it("returns 6 for unarmed", () => {
      expect(weaponStaminaCost("unarmed")).toBe(6);
    });

    it("returns 10 as default for unknown weapons", () => {
      expect(weaponStaminaCost("unknown_weapon")).toBe(10);
    });
  });

  describe("clampPicssi", () => {
    it("clamps unipolar virtues to 0..100", () => {
      expect(clampPicssi("passion", -10)).toBe(0);
      expect(clampPicssi("passion", 50)).toBe(50);
      expect(clampPicssi("passion", 150)).toBe(100);
    });

    it("clamps illumination to -100..+100", () => {
      expect(clampPicssi("illumination", -150)).toBe(-100);
      expect(clampPicssi("illumination", 0)).toBe(0);
      expect(clampPicssi("illumination", 150)).toBe(100);
    });
  });

  describe("applyKarma", () => {
    it("applies a positive karma delta", () => {
      const p = makePlayer({ picssi: { passion: 30, integrity: 50, courage: 0, standing: 0, spirituality: 0, illumination: 0 } });
      const next = applyKarma(p, { passion: 10 });
      expect(next.picssi.passion).toBe(40);
      expect(next.picssi.integrity).toBe(50);
    });

    it("clamps at 100", () => {
      const p = makePlayer({ picssi: { passion: 95, integrity: 0, courage: 0, standing: 0, spirituality: 0, illumination: 0 } });
      const next = applyKarma(p, { passion: 20 });
      expect(next.picssi.passion).toBe(100);
    });

    it("clamps at 0", () => {
      const p = makePlayer({ picssi: { passion: 10, integrity: 0, courage: 0, standing: 0, spirituality: 0, illumination: 0 } });
      const next = applyKarma(p, { passion: -20 });
      expect(next.picssi.passion).toBe(0);
    });

    it("applies negative illumination", () => {
      const p = makePlayer({ picssi: { passion: 0, integrity: 0, courage: 0, standing: 0, spirituality: 0, illumination: 0 } });
      const next = applyKarma(p, { illumination: -50 });
      expect(next.picssi.illumination).toBe(-50);
    });

    it("ignores zero deltas", () => {
      const p = makePlayer({ picssi: { passion: 50, integrity: 0, courage: 0, standing: 0, spirituality: 0, illumination: 0 } });
      const next = applyKarma(p, { passion: 0 });
      expect(next).toBe(p); // returns unchanged
    });

    it("triggers recomputeDerivedStats on any change", () => {
      const p = makePlayer({ strength: 10, picssi: { passion: 0, integrity: 0, courage: 0, standing: 0, spirituality: 0, illumination: 0 } });
      // Adding passion DOES change STR_eff (Sprint 2's multiplier is already wired)
      // STR_eff = STR_base + min(10, floor(passion/10)) = 10 + floor(10/10) = 11
      const next = applyKarma(p, { passion: 10 });
      expect(next.strengthEffective).toBe(11);
    });
  });
});
