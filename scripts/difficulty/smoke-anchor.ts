// Anchor suite (CF-1 calibration). Runs scenarios A–F from the plan
// and reports which ones are within tolerance.
//
// Run: npx tsx scripts/difficulty/smoke-anchor.ts

import { REFERENCE_PARTIES } from "../../lib/difficulty/constants";
import { simulateModule } from "../../lib/difficulty/simulate";
import { computePartyCapability } from "../../lib/difficulty/computeCapability";
import { computeModuleLoads } from "../../lib/difficulty/computeLoads";
import type {
  EncounterPatternId,
  PartySnapshot,
  SkeletonRoom,
} from "../../lib/difficulty/types";

function singleEncounterModule(
  pattern: EncounterPatternId,
  id: string,
): { rooms: SkeletonRoom[]; questBranches: number; moduleId: string } {
  return {
    moduleId: id,
    questBranches: 0,
    rooms: [{ id: "r", encounterPattern: pattern, atoms: [], restAvailable: false }],
  };
}

const ANCHORS: Array<{
  name: string;
  party: PartySnapshot;
  module: { rooms: SkeletonRoom[]; questBranches: number; moduleId: string };
  targetP: number;
  tolerance: number;
}> = [
  {
    name: "A: Fresh hero vs single Tier-1 Grunt",
    party: REFERENCE_PARTIES.fresh,
    module: singleEncounterModule("single-grunt", "anchor-A"),
    targetP: 0.50,
    tolerance: 0.03,
  },
  {
    name: "B: Fresh hero vs vet-solo (Tier 2)",
    party: REFERENCE_PARTIES.fresh,
    module: singleEncounterModule("vet-solo", "anchor-B"),
    targetP: 0.22,
    tolerance: 0.05,
  },
  {
    name: "C: Fresh hero vs elite-solo (Tier 3)",
    party: REFERENCE_PARTIES.fresh,
    module: singleEncounterModule("elite-solo", "anchor-C"),
    targetP: 0.07,
    tolerance: 0.03,
  },
  {
    name: "D: Fresh hero vs boss-solo (Tier 4)",
    party: REFERENCE_PARTIES.fresh,
    module: singleEncounterModule("boss-solo", "anchor-D"),
    targetP: 0.01,
    tolerance: 0.02,
  },
  {
    name: "E: Mid hero (PICSSI 30) vs vet-solo (Tier 2)",
    party: REFERENCE_PARTIES.mid,
    module: singleEncounterModule("vet-solo", "anchor-E"),
    targetP: 0.50,
    tolerance: 0.10,
  },
];

function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

console.log("=== CF-1 anchor suite ===\n");
let passing = 0;
let total = 0;

for (const a of ANCHORS) {
  total += 1;
  const cap = computePartyCapability(a.party);
  const loads = computeModuleLoads({
    rooms: a.module.rooms,
    questBranches: a.module.questBranches,
  });
  const result = simulateModule(a.party, a.module, { trials: 10000, seed: 0xa11ce });
  const lo = a.targetP - a.tolerance;
  const hi = a.targetP + a.tolerance;
  const ok = result.pComplete >= lo && result.pComplete <= hi;
  if (ok) passing += 1;

  console.log(a.name);
  console.log(
    `  capability=${cap.combat.toFixed(2)}  load=${loads.combat.toFixed(2)}  ` +
      `target=${fmtPct(a.targetP)} ±${fmtPct(a.tolerance)}  ` +
      `empirical=${fmtPct(result.pComplete)} ${ok ? "✓" : "✗"}`,
  );
}

console.log(`\n${passing}/${total} anchors passing.`);
