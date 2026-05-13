// ============================================================
// Module load computation per axis (CF-1).
//
// Walks a list of SkeletonRoom and produces ModuleLoads:
//   combat       — Σ encounter_load · attrition_multiplier
//   moral        — Σ |atom_picssi_target| · severity_weight
//   gear         — Σ gate_difficulty
//   exploration  — 0.5·rooms + 0.3·atoms + 1.0·branches
//
// Plan §2, §4.
// ============================================================

import {
  ATTRITION_MAX_MULTIPLIER,
  ATTRITION_STEP_PER_ROOM,
  SEVERITY_WEIGHT,
} from "./constants";
import { getPattern } from "./encounterPatterns";
import type { ModuleLoads, SkeletonRoom } from "./types";

export interface ModuleLoadInput {
  rooms: SkeletonRoom[];
  questBranches: number;
}

export function computeModuleLoads(input: ModuleLoadInput): ModuleLoads {
  return {
    combat: computeCombatLoad(input.rooms),
    moral: computeMoralLoad(input.rooms),
    gear: computeGearLoad(input.rooms),
    exploration: computeExplorationLoad(input.rooms, input.questBranches),
  };
}

/**
 * Combat load with attrition. The multiplier grows 0.15 per
 * consecutive combat room without REST, capped at ×1.6.
 * A REST room resets the counter.
 */
export function computeCombatLoad(rooms: SkeletonRoom[]): number {
  let total = 0;
  let consecutiveCombat = 0;
  for (const room of rooms) {
    const pattern = getPattern(room.encounterPattern);
    if (pattern.load === 0) {
      if (room.restAvailable) {
        consecutiveCombat = 0;
      }
      continue;
    }
    const attrition = Math.min(
      ATTRITION_MAX_MULTIPLIER,
      1 + ATTRITION_STEP_PER_ROOM * consecutiveCombat,
    );
    total += pattern.load * attrition;
    consecutiveCombat += 1;
    if (room.restAvailable) consecutiveCombat = 0;
  }
  return Number(total.toFixed(2));
}

export function computeMoralLoad(rooms: SkeletonRoom[]): number {
  let total = 0;
  for (const room of rooms) {
    for (const atom of room.atoms) {
      total += SEVERITY_WEIGHT[atom.severity];
    }
  }
  return Number(total.toFixed(2));
}

export function computeGearLoad(rooms: SkeletonRoom[]): number {
  let total = 0;
  for (const room of rooms) {
    if (room.gearGate) total += room.gearGate.difficulty;
  }
  return total;
}

export function computeExplorationLoad(
  rooms: SkeletonRoom[],
  questBranches: number,
): number {
  const atomCount = rooms.reduce((n, r) => n + r.atoms.length, 0);
  const raw = 0.5 * rooms.length + 0.3 * atomCount + 1.0 * questBranches;
  return Number(raw.toFixed(2));
}
