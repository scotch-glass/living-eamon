// ============================================================
// Probability of success per axis + overall aggregation (CF-1).
//
// P(axis_success) = 1 / (1 + exp(-k · (capability − load)))
//
// Overall P = min(axis P's) — the bottleneck rule. A party with
// 95% combat but 20% gear can't get past a locked door; honest
// surfacing of the weakest axis is better than averaging.
//
// Plan §4.
// ============================================================

import { LOGISTIC_SLOPE_K } from "./constants";
import type {
  AxisProbabilities,
  ModuleLoads,
  PartyCapability,
} from "./types";

/**
 * Logistic curve. capability − load = 0 → 50%; +1 → ~82%; +2 → ~95%.
 * Returns a value in (0, 1).
 */
export function pSuccess(capability: number, load: number): number {
  const delta = capability - load;
  return 1 / (1 + Math.exp(-LOGISTIC_SLOPE_K * delta));
}

export function axisProbabilities(
  capability: PartyCapability,
  loads: ModuleLoads,
): AxisProbabilities {
  return {
    combat: pSuccess(capability.combat, loads.combat),
    moral: pSuccess(capability.moral, loads.moral),
    gear: pSuccess(capability.gear, loads.gear),
    exploration: pSuccess(capability.exploration, loads.exploration),
  };
}

/**
 * Overall P(complete) = min across axes.
 * The bottleneck axis determines module survivability.
 */
export function overallP(p: AxisProbabilities): number {
  return Math.min(p.combat, p.moral, p.gear, p.exploration);
}

/**
 * Returns which axis is the bottleneck (min P). Used by the
 * wizard preview to label "this module is bottlenecked by gear"
 * as design feedback.
 */
export function bottleneckAxis(p: AxisProbabilities): keyof AxisProbabilities {
  let key: keyof AxisProbabilities = "combat";
  let min = p.combat;
  if (p.moral < min) {
    min = p.moral;
    key = "moral";
  }
  if (p.gear < min) {
    min = p.gear;
    key = "gear";
  }
  if (p.exploration < min) {
    min = p.exploration;
    key = "exploration";
  }
  return key;
}
