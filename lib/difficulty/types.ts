// ============================================================
// Sprint CF-1 — Module survivability difficulty engine.
//
// Shared types for the synthetic enemy tier system, encounter
// patterns, party capability snapshot, and Monte Carlo result.
//
// See docs/plans/cf-1-module-survivability-and-wizard.md for
// the full algorithm + calibration plan.
// ============================================================

import type { PicssiState, PicssiVirtue } from "../karma/types";

// ── Enemy tiers (synthetic, owned by CF-1) ────────────────────

export type EnemyTierId = 1 | 2 | 3 | 4;

export interface EnemyTierTemplate {
  tier: EnemyTierId;
  label: string;
  hp: number;
  armor: number;            // per-zone armor stop in 0..100 (averaged across zones)
  weaponDamageDice: string; // e.g., "1d6+1"
  expectedDamage: number;   // pre-computed average for fast simulation
  staminaMax: number;
  weaponStaminaCost: number;
  mana: number;
  knownSpells: string[];    // engine spell IDs ("HEAL", "BLAST", "DEBUFF", etc.)
  actionsPerRound: number;
  hasPhaseShift: boolean;   // bosses can phase at <50% HP
  unitValue: number;        // baseline = 1.0 Grunt-units
}

// ── Encounter patterns (vocabulary the wizard exposes) ─────────

export type EncounterPatternId =
  | "none"
  | "single-grunt"
  | "pair-grunts"
  | "patrol-grunts"
  | "pack-grunts"
  | "vet-solo"
  | "vet-and-grunt"
  | "vet-and-pair"
  | "vet-pair"
  | "elite-solo"
  | "elite-and-vet"
  | "elite-and-grunts"
  | "boss-solo"
  | "boss-and-entourage";

export interface EncounterPattern {
  id: EncounterPatternId;
  composition: Array<{ tier: EnemyTierId; count: number }>;
  rawSum: number;          // sum of tier unitValues before synergy
  synergyMultiplier: number; // ×1.0 .. ×1.7
  load: number;            // rawSum × synergyMultiplier
}

// ── Atom + gear gate primitives ───────────────────────────────

export type AtomSeverity = "trivial" | "notable" | "major" | "defining";

export interface AtomDescriptor {
  severity: AtomSeverity;
  /**
   * Which virtue this atom checks. The simulator rolls
   *   virtue_value + d100 >= threshold
   * to determine success.
   */
  virtue: PicssiVirtue;
  /**
   * On failure, the simulator applies these consequences before
   * moving to the next room.
   */
  onFailure?: {
    hpLoss?: number;
    virtueLoss?: number;
    spawnEncounter?: EncounterPatternId; // typically "single-grunt" for major+
  };
}

export interface GearGate {
  difficulty: number;       // 5 (common), 10 (uncommon), 15 (rare), 25 (legendary)
  itemTag: string;          // e.g., "silver-weapon", "torch", "holy-symbol"
}

// ── Skeleton room (what the wizard outputs per room) ──────────

export interface SkeletonRoom {
  id: string;
  encounterPattern: EncounterPatternId;
  atoms: AtomDescriptor[];
  gearGate?: GearGate;
  restAvailable: boolean;
}

// ── Module-level loads (what the difficulty engine emits) ─────

export interface ModuleLoads {
  combat: number;
  moral: number;
  gear: number;
  exploration: number;
}

// ── Party snapshot (input to capability + simulation) ─────────

export interface HeroStats {
  picssi: PicssiState;
  strBase: number;
  dexBase: number;
  chaBase: number;
  weaponId: string;          // "short_sword" | "long_sword" | "great_sword" | "unarmed"
  /**
   * Total armor stop chance summed across all four zones (0..100×4 max).
   * Use 0 for a no-armor hero. CF-4 will compute this from real inventory.
   */
  armorTotal: number;
  hasShield: boolean;
  knownSpells: string[];     // ["HEAL", ...] — affects capability bump
  /** Items carried, tag-keyed (used for gear gates). */
  inventoryTags: string[];
  /**
   * Pre-aggregated inventory score for gear capability. Real implementation
   * (CF-4+) sums tagged values from the items table; for now this is a
   * 0..100 surface that the wizard preview supplies for archetypes.
   */
  inventoryScore: number;
}

export interface PartySnapshot {
  hero: HeroStats;
  henchmen: HeroStats[];     // 0..2
}

export interface PartyCapability {
  combat: number;
  moral: number;
  gear: number;
  exploration: number;
}

// ── Simulation result ─────────────────────────────────────────

export interface AxisProbabilities {
  combat: number;
  moral: number;
  gear: number;
  exploration: number;
}

export type FailureMode = "combat" | "atom" | "gate" | "budget" | "complete";

export interface PerRoomStat {
  roomIdx: number;
  avgHpLost: number;
  avgRoundsTaken: number;
  /** Fraction of trials that failed in this room. */
  failureRate: number;
}

export interface SimulationResult {
  trials: number;
  pComplete: number;          // overall — min across axes after simulation
  pPerAxis: AxisProbabilities;
  ci95: [number, number];     // bootstrap CI on pComplete
  avgHpRemaining: number;
  avgStaminaUsedFraction: number;
  avgActionBudgetSpent: number;
  failureModeCounts: Record<FailureMode, number>;
  perRoom: PerRoomStat[];
}
