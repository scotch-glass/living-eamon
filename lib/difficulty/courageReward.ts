// ============================================================
// Courage reward function (CF-1).
//
// User-specified design: lower P(success) → higher Courage payoff
// on win OR on honourable death. Quadratic (1−P)² shape so reward
// steepens at low P. Heroic death gets 1.5× bonus. Flee penalty is
// mild on hopeless modules (^0.5 dampens), harsh on easy ones.
//
// All outputs round to KARMA magnitude bands {0, ±1, ±3, ±5, ±10}
// per KARMA_SYSTEM.md convention. Never emit raw fractions.
//
// Plan §8.
// ============================================================

import {
  COURAGE_BASE_COMPLETE,
  COURAGE_BASE_DEATH,
  COURAGE_BASE_FLEE_PENALTY,
} from "./constants";

const KARMA_BANDS = [0, 1, 3, 5, 10] as const;

/**
 * Round to the nearest KARMA magnitude band, preserving sign.
 *  0.20 → 0,  0.80 → 1,  2.00 → 1,  2.50 → 3, 4.00 → 3,
 *  4.50 → 5,  7.00 → 5,  8.00 → 10,  12 → 10 (capped).
 */
export function roundToKarmaBand(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  let nearest = 0;
  let nearestDist = Infinity;
  for (const band of KARMA_BANDS) {
    const d = Math.abs(abs - band);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = band;
    }
  }
  return sign * nearest;
}

/**
 * Courage awarded when the party completes the module.
 * P ∈ [0,1]. Returns a value in KARMA bands {0, ±1, ±3, ±5, ±10}.
 */
export function courageOnComplete(pSuccess: number): number {
  const raw = COURAGE_BASE_COMPLETE * Math.pow(1 - pSuccess, 2);
  return roundToKarmaBand(raw);
}

/**
 * Courage awarded for an honourable death (hero falls but the
 * party stood and fought — not fled). 1.5× multiplier so dying
 * to a hopeless fight is more story than dying easily.
 */
export function courageOnHonourableDeath(pSuccess: number): number {
  const raw = COURAGE_BASE_DEATH * Math.pow(1 - pSuccess, 2) * 1.5;
  return roundToKarmaBand(raw);
}

/**
 * Courage penalty for fleeing. ^0.5 dampens the curve at low P:
 * fleeing a 10% fight is forgivable; fleeing a 95% fight is shameful.
 * Returns a NEGATIVE value (loss).
 */
export function courageOnFlee(pSuccess: number): number {
  const raw = -COURAGE_BASE_FLEE_PENALTY * Math.pow(1 - pSuccess, 0.5);
  return roundToKarmaBand(raw);
}

export interface CourageReward {
  onComplete: number;
  onHonourableDeath: number;
  onFlee: number;
}

export function courageRewardsFor(pSuccess: number): CourageReward {
  return {
    onComplete: courageOnComplete(pSuccess),
    onHonourableDeath: courageOnHonourableDeath(pSuccess),
    onFlee: courageOnFlee(pSuccess),
  };
}
