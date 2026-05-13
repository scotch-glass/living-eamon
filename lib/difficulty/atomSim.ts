// ============================================================
// Atom resolution mechanic for the difficulty simulator (CF-1).
//
//   success_if (virtue + d100 >= threshold)
//
// Thresholds per severity (plan §5):
//   trivial   = 20
//   notable   = 50
//   major     = 80
//   defining  = 110  (requires virtue >= 10 to have any chance)
//
// Failure consequences default per severity (plan constants),
// but each atom may override with its own onFailure hook.
// ============================================================

import { SEVERITY_DEFAULT_FAILURE, SEVERITY_THRESHOLD } from "./constants";
import type { AtomDescriptor } from "./types";
import type { Rng } from "./rng";

export interface AtomConsequence {
  passed: boolean;
  hpLoss: number;
  virtueLoss: number;
  /** If set, the trial should resolve this encounter before continuing. */
  spawnedEncounter?: string;
}

/**
 * Resolve one atom against a party's virtue value. Returns the
 * outcome + per-trial consequences the simulator applies.
 */
export function resolveAtom(
  atom: AtomDescriptor,
  virtueValue: number,
  rng: Rng,
): AtomConsequence {
  const threshold = SEVERITY_THRESHOLD[atom.severity];
  const roll = rng.int(1, 100);
  const passed = virtueValue + roll >= threshold;

  if (passed) {
    return { passed: true, hpLoss: 0, virtueLoss: 0 };
  }

  const defaults = SEVERITY_DEFAULT_FAILURE[atom.severity];
  const override = atom.onFailure;
  return {
    passed: false,
    hpLoss: override?.hpLoss ?? defaults.hpLoss,
    virtueLoss: override?.virtueLoss ?? defaults.virtueLoss,
    spawnedEncounter: override?.spawnEncounter,
  };
}
