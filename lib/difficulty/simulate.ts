// ============================================================
// Module survivability simulator (CF-1).
//
// simulateModule(party, module, opts) runs N Monte Carlo trials
// over the module's rooms (combat → atoms → gear gates → REST),
// tracks per-axis outcomes, and reports the empirical P(complete)
// with a bootstrap CI.
//
// Plan §6.
// ============================================================

import { resolveAtom } from "./atomSim";
import {
  applyRest,
  buildEnemies,
  buildParty,
  resolveEncounter,
  type SimCombatant,
} from "./combatSim";
import { computeModuleLoads } from "./computeLoads";
import {
  BOOTSTRAP_SAMPLES,
  DEFAULT_TRIALS,
} from "./constants";
import { computePartyCapability } from "./computeCapability";
import { axisProbabilities, overallP } from "./probability";
import { hashString, makeRng, mixSeed, type Rng } from "./rng";
import type {
  EncounterPatternId,
  FailureMode,
  ModuleLoads,
  PartySnapshot,
  PerRoomStat,
  SimulationResult,
  SkeletonRoom,
} from "./types";

export interface SimulateInput {
  rooms: SkeletonRoom[];
  questBranches: number;
  /** Stable identifier so cache + seed mixing work. */
  moduleId: string;
}

export interface SimulateOptions {
  trials?: number;
  seed?: number;
}

/**
 * Walk the module N times and return aggregate outcomes.
 *
 * Per trial:
 *   1. Build a fresh party from the snapshot.
 *   2. For each room: gear gate → encounter → atoms → REST.
 *   3. Trial succeeds if any party member is alive at the end
 *      AND action budget hasn't gone negative AND every gate passed.
 *
 * Performance: 1k trials of an 8-room module ≈ 30–50 ms in Node 22.
 */
export function simulateModule(
  party: PartySnapshot,
  module: SimulateInput,
  opts: SimulateOptions = {},
): SimulationResult {
  const trials = opts.trials ?? DEFAULT_TRIALS;
  const baseSeed = opts.seed ?? hashString(`${module.moduleId}|${Date.now()}`);

  const wins: number[] = new Array(trials);
  const perRoom: PerRoomStat[] = module.rooms.map((_, idx) => ({
    roomIdx: idx,
    avgHpLost: 0,
    avgRoundsTaken: 0,
    failureRate: 0,
  }));
  const perRoomHp: number[] = new Array(module.rooms.length).fill(0);
  const perRoomRounds: number[] = new Array(module.rooms.length).fill(0);
  const perRoomFails: number[] = new Array(module.rooms.length).fill(0);
  const perRoomEntries: number[] = new Array(module.rooms.length).fill(0);

  const failureCounts: Record<FailureMode, number> = {
    combat: 0,
    atom: 0,
    gate: 0,
    budget: 0,
    complete: 0,
  };
  let totalHpRemaining = 0;
  let totalStaminaUsedFrac = 0;
  let totalActionBudgetSpent = 0;

  for (let t = 0; t < trials; t++) {
    const rng = makeRng(mixSeed(baseSeed, t));
    const trialResult = runTrial(party, module.rooms, rng);

    wins[t] = trialResult.completed ? 1 : 0;
    failureCounts[trialResult.failureMode] += 1;
    totalHpRemaining += trialResult.hpRemaining;
    totalStaminaUsedFrac += trialResult.staminaUsedFraction;
    totalActionBudgetSpent += trialResult.actionBudgetSpent;

    for (let i = 0; i < module.rooms.length; i++) {
      const r = trialResult.perRoom[i];
      if (!r) continue;
      perRoomEntries[i] += 1;
      perRoomHp[i] += r.hpLost;
      perRoomRounds[i] += r.rounds;
      if (r.failed) perRoomFails[i] += 1;
    }
  }

  const pComplete = wins.reduce((s, n) => s + n, 0) / trials;
  const ci95 = bootstrapCI(wins, BOOTSTRAP_SAMPLES);

  // Per-axis P comes from the deterministic capability vs load math
  // (the simulator validates the overall logistic via the empirical
  // pComplete). Surface both so the wizard can show "combat: 89%
  // simulated → bottleneck axis is moral at 42%."
  const loads = computeModuleLoads({
    rooms: module.rooms,
    questBranches: module.questBranches,
  });
  const capability = computePartyCapability(party);
  const analyticAxisP = axisProbabilities(capability, loads);

  for (let i = 0; i < module.rooms.length; i++) {
    const entries = Math.max(1, perRoomEntries[i]);
    perRoom[i] = {
      roomIdx: i,
      avgHpLost: round2(perRoomHp[i] / entries),
      avgRoundsTaken: round2(perRoomRounds[i] / entries),
      failureRate: round2(perRoomFails[i] / trials),
    };
  }

  return {
    trials,
    pComplete: round4(pComplete),
    pPerAxis: {
      combat: round4(analyticAxisP.combat),
      moral: round4(analyticAxisP.moral),
      gear: round4(analyticAxisP.gear),
      exploration: round4(analyticAxisP.exploration),
    },
    ci95: [round4(ci95[0]), round4(ci95[1])],
    avgHpRemaining: round2(totalHpRemaining / trials),
    avgStaminaUsedFraction: round2(totalStaminaUsedFrac / trials),
    avgActionBudgetSpent: round2(totalActionBudgetSpent / trials),
    failureModeCounts: failureCounts,
    perRoom,
  };
}

interface TrialPerRoom {
  hpLost: number;
  rounds: number;
  failed: boolean;
}

interface TrialResult {
  completed: boolean;
  failureMode: FailureMode;
  hpRemaining: number;
  staminaUsedFraction: number;
  actionBudgetSpent: number;
  perRoom: Array<TrialPerRoom | null>;
}

const ACTION_BUDGET_DEFAULT = 25;

function runTrial(party: PartySnapshot, rooms: SkeletonRoom[], rng: Rng): TrialResult {
  const combatants = buildParty(party);
  const initialPartyHp = combatants.reduce((n, c) => n + c.hp, 0);
  const initialStamina = combatants.reduce((n, c) => n + c.maxStamina, 0);
  let actionBudget = ACTION_BUDGET_DEFAULT;
  const perRoom: Array<TrialPerRoom | null> = rooms.map(() => null);

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const stat: TrialPerRoom = { hpLost: 0, rounds: 0, failed: false };
    perRoom[i] = stat;

    // Gear gate
    if (room.gearGate) {
      const has = hasGate(party, room.gearGate.itemTag);
      if (!has) {
        stat.failed = true;
        return finish(false, "gate", combatants, initialStamina, actionBudget, perRoom);
      }
    }

    // Combat
    if (room.encounterPattern !== "none") {
      const enemies = buildEnemies(room.encounterPattern as EncounterPatternId);
      const outcome = resolveEncounter(combatants, enemies, rng);
      stat.hpLost = outcome.totalAllyHpLost;
      stat.rounds = outcome.rounds;
      actionBudget -= 2; // combat costs more than exploration
      if (outcome.winner === "enemy") {
        stat.failed = true;
        return finish(false, "combat", combatants, initialStamina, actionBudget, perRoom);
      }
    } else {
      actionBudget -= 1;
    }

    // Atoms
    for (const atom of room.atoms) {
      const heroVirtue = party.hero.picssi[atom.virtue];
      const result = resolveAtom(atom, heroVirtue, rng);
      if (!result.passed) {
        // Apply hp loss spread across the party (proxy for narrative cost)
        const losers = combatants.filter((c) => c.hp > 0);
        const share = losers.length > 0 ? Math.ceil(result.hpLoss / losers.length) : 0;
        for (const c of losers) c.hp = Math.max(0, c.hp - share);

        // Optional spawned encounter (a single Tier-1 grunt by default)
        if (result.spawnedEncounter) {
          const spawn = buildEnemies(result.spawnedEncounter as EncounterPatternId);
          const out = resolveEncounter(combatants, spawn, rng);
          stat.hpLost += out.totalAllyHpLost;
          stat.rounds += out.rounds;
          actionBudget -= 1;
          if (out.winner === "enemy") {
            stat.failed = true;
            return finish(false, "atom", combatants, initialStamina, actionBudget, perRoom);
          }
        }

        if (combatants.every((c) => c.hp <= 0)) {
          stat.failed = true;
          return finish(false, "atom", combatants, initialStamina, actionBudget, perRoom);
        }
      }
    }

    // REST
    if (room.restAvailable) {
      applyRest(combatants);
      actionBudget -= 1;
    }

    if (actionBudget < 0) {
      stat.failed = true;
      return finish(false, "budget", combatants, initialStamina, actionBudget, perRoom);
    }
  }

  return finish(true, "complete", combatants, initialStamina, actionBudget, perRoom);

  function finish(
    completed: boolean,
    mode: FailureMode,
    finalCombatants: SimCombatant[],
    startingStamina: number,
    finalBudget: number,
    perRoomLog: Array<TrialPerRoom | null>,
  ): TrialResult {
    const remainingHp = finalCombatants.reduce((n, c) => n + Math.max(0, c.hp), 0);
    const remainingStamina = finalCombatants.reduce(
      (n, c) => n + Math.max(0, c.stamina),
      0,
    );
    const staminaUsedFrac =
      startingStamina === 0 ? 0 : 1 - remainingStamina / startingStamina;
    return {
      completed,
      failureMode: mode,
      hpRemaining: remainingHp,
      staminaUsedFraction: staminaUsedFrac,
      actionBudgetSpent: ACTION_BUDGET_DEFAULT - finalBudget,
      perRoom: perRoomLog,
    };
  }
}

function hasGate(party: PartySnapshot, tag: string): boolean {
  if (party.hero.inventoryTags.includes(tag)) return true;
  for (const h of party.henchmen) {
    if (h.inventoryTags.includes(tag)) return true;
  }
  return false;
}

/**
 * Bootstrap 95% CI on the mean of a 0/1 array (win/loss).
 * Resample N times with replacement, take the [2.5%, 97.5%] of resampled means.
 */
function bootstrapCI(samples: number[], resamples: number): [number, number] {
  const n = samples.length;
  if (n === 0) return [0, 0];
  const means: number[] = new Array(resamples);
  // Use a fixed seed so the CI is deterministic given the simulation seed
  const rng = makeRng(0xdeadbeef);
  for (let r = 0; r < resamples; r++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += samples[rng.int(0, n - 1)];
    }
    means[r] = sum / n;
  }
  means.sort((a, b) => a - b);
  const loIdx = Math.floor(0.025 * resamples);
  const hiIdx = Math.floor(0.975 * resamples);
  return [means[loIdx], means[hiIdx]];
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

function round4(n: number): number {
  return Number(n.toFixed(4));
}

// Re-export so consumers have a single import surface
export type { ModuleLoads, SimulationResult, PartySnapshot, SkeletonRoom };
