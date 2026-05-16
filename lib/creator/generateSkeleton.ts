// ============================================================
// generateSkeleton — pure deterministic generator (CF-1).
//
// Inputs:
//   - 18 WizardAnswers
//   - moduleId (slug), name (display)
// Output:
//   - ModuleSkeleton with computed loads + per-archetype P(complete)
//
// Same inputs → byte-identical output. No RNG.
//
// Plan §9.
// ============================================================

import type { AffectAxis, AffectVector } from "../karma/atom-types";
import type { PicssiVirtue } from "../karma/types";
import { courageRewardsFor } from "../difficulty/courageReward";
import { REFERENCE_PARTIES } from "../difficulty/constants";
import { computeModuleLoads } from "../difficulty/computeLoads";
import { simulateModule } from "../difficulty/simulate";
import type {
  AtomDescriptor,
  AtomSeverity,
  EncounterPatternId,
  GearGate,
  SkeletonRoom,
} from "../difficulty/types";
import { getOptionContribution } from "./questionnaire";
import type {
  ModuleSkeleton,
  WeightContribution,
  WizardAnswer,
} from "./skeletonTypes";

const AFFECT_AXES: AffectAxis[] = [
  "fear",
  "excitement",
  "eros",
  "dread",
  "awe",
  "wonder",
  "melancholy",
];

const PICSSI_VIRTUES: PicssiVirtue[] = [
  "passion",
  "integrity",
  "courage",
  "standing",
  "spirituality",
  "illumination",
];

const SEVERITY_LIST: AtomSeverity[] = ["trivial", "notable", "major", "defining"];

// ── Accumulator ───────────────────────────────────────────────

interface Accumulator {
  affect: Record<AffectAxis, number>;
  picssi: Record<PicssiVirtue, number>;
  illuminationTilt: number;
  illuminationTiltCount: number;
  rooms: number;
  questSteps: number;
  questBranches: number;
  henchmanSlots: number;
  scrollSeeds: { thoth: number; stobaean: number };
  atomsPerRoom: number;
  atomsPerRoomCount: number;
  combatDensity: number;
  combatDensityCount: number;
  enemyTierBias: number;
  enemyTierBiasCount: number;
  gearGatesCount: number;
  atomSeverity: Record<AtomSeverity, number>;
  pdAnchor: string | null;
  locationId: string;
  zones: Set<string>;
}

function emptyAccumulator(): Accumulator {
  return {
    affect: { fear: 0, excitement: 0, eros: 0, dread: 0, awe: 0, wonder: 0, melancholy: 0 },
    picssi: { passion: 0, integrity: 0, courage: 0, standing: 0, spirituality: 0, illumination: 0 },
    illuminationTilt: 0,
    illuminationTiltCount: 0,
    rooms: 0,
    questSteps: 0,
    questBranches: 0,
    henchmanSlots: 0,
    scrollSeeds: { thoth: 0, stobaean: 0 },
    atomsPerRoom: 0,
    atomsPerRoomCount: 0,
    combatDensity: 0,
    combatDensityCount: 0,
    enemyTierBias: 0,
    enemyTierBiasCount: 0,
    gearGatesCount: 0,
    atomSeverity: { trivial: 0, notable: 0, major: 0, defining: 0 },
    pdAnchor: null,
    locationId: "valus",
    zones: new Set<string>(),
  };
}

function applyContribution(acc: Accumulator, c: WeightContribution): void {
  if (c.affect) {
    for (const axis of AFFECT_AXES) {
      const v = c.affect[axis];
      if (typeof v === "number") acc.affect[axis] += v;
    }
  }
  if (c.picssi) {
    for (const v of PICSSI_VIRTUES) {
      const x = c.picssi[v];
      if (typeof x === "number") acc.picssi[v] += x;
    }
  }
  if (typeof c.illuminationTilt === "number") {
    acc.illuminationTilt += c.illuminationTilt;
    acc.illuminationTiltCount += 1;
  }
  if (typeof c.rooms === "number") acc.rooms += c.rooms;
  if (typeof c.questSteps === "number") acc.questSteps += c.questSteps;
  if (typeof c.questBranches === "number") acc.questBranches += c.questBranches;
  if (typeof c.henchmanSlots === "number") acc.henchmanSlots += c.henchmanSlots;
  if (c.scrollSeeds) {
    acc.scrollSeeds.thoth += c.scrollSeeds.thoth ?? 0;
    acc.scrollSeeds.stobaean += c.scrollSeeds.stobaean ?? 0;
  }
  if (typeof c.atomsPerRoom === "number") {
    acc.atomsPerRoom += c.atomsPerRoom;
    acc.atomsPerRoomCount += 1;
  }
  if (typeof c.combatDensity === "number") {
    acc.combatDensity += c.combatDensity;
    acc.combatDensityCount += 1;
  }
  if (typeof c.enemyTierBias === "number") {
    acc.enemyTierBias += c.enemyTierBias;
    acc.enemyTierBiasCount += 1;
  }
  if (typeof c.gearGatesCount === "number") acc.gearGatesCount += c.gearGatesCount;
  if (c.atomSeverity) {
    for (const s of SEVERITY_LIST) {
      const v = c.atomSeverity[s];
      if (typeof v === "number") acc.atomSeverity[s] += v;
    }
  }
  if (c.pdAnchor !== undefined) acc.pdAnchor = c.pdAnchor;
  if (typeof c.locationId === "string") acc.locationId = c.locationId;
  if (c.zones) {
    for (const z of c.zones) acc.zones.add(z);
  }
}

// ── Resolver ──────────────────────────────────────────────────

function resolveRoomCount(acc: Accumulator): number {
  // Length question contributes 3/6/11. Fallback: 5.
  const raw = acc.rooms > 0 ? acc.rooms : 5;
  return clamp(raw, 3, 14);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function averagedAtomsPerRoom(acc: Accumulator): number {
  if (acc.atomsPerRoomCount === 0) return 1;
  return acc.atomsPerRoom / acc.atomsPerRoomCount;
}

function averagedCombatDensity(acc: Accumulator): number {
  if (acc.combatDensityCount === 0) return 0.4;
  return acc.combatDensity / acc.combatDensityCount;
}

function averagedEnemyTier(acc: Accumulator): number {
  if (acc.enemyTierBiasCount === 0) return 1;
  return acc.enemyTierBias / acc.enemyTierBiasCount;
}

function dominantSeverity(acc: Accumulator): AtomSeverity {
  let best: AtomSeverity = "notable";
  let max = -Infinity;
  for (const s of SEVERITY_LIST) {
    if (acc.atomSeverity[s] > max) {
      max = acc.atomSeverity[s];
      best = s;
    }
  }
  return best;
}

function dominantVirtue(acc: Accumulator): PicssiVirtue {
  let best: PicssiVirtue = "courage";
  let max = -Infinity;
  for (const v of PICSSI_VIRTUES) {
    const m = Math.abs(acc.picssi[v]);
    if (m > max) {
      max = m;
      best = v;
    }
  }
  return best;
}

function intentionallySkewedVirtues(acc: Accumulator): PicssiVirtue[] {
  const ranked = [...PICSSI_VIRTUES].sort(
    (a, b) => Math.abs(acc.picssi[b]) - Math.abs(acc.picssi[a]),
  );
  return ranked.slice(0, 2);
}

function pickEncounterPattern(
  tierBias: number,
  rng_index: number,
): EncounterPatternId {
  // Deterministic mapping from tier-bias to a pattern, with a tiny
  // index-based variation so consecutive combat rooms aren't identical.
  // (Not RNG — purely a function of (tierBias, rng_index).)
  const slot = rng_index % 3;
  if (tierBias < 0.8) return "single-grunt";
  if (tierBias < 1.5) {
    return ["single-grunt", "pair-grunts", "patrol-grunts"][slot] as EncounterPatternId;
  }
  if (tierBias < 2.5) {
    return ["vet-solo", "vet-and-grunt", "vet-and-pair"][slot] as EncounterPatternId;
  }
  if (tierBias < 3.5) {
    return ["elite-solo", "elite-and-vet", "elite-and-grunts"][slot] as EncounterPatternId;
  }
  return ["boss-solo", "boss-and-entourage", "elite-and-vet"][slot] as EncounterPatternId;
}

function generateRoom(
  index: number,
  total: number,
  acc: Accumulator,
): SkeletonRoom {
  const tierBias = averagedEnemyTier(acc);
  const combatDensity = averagedCombatDensity(acc);
  const atomsAvg = averagedAtomsPerRoom(acc);
  const dominantVirtueValue = dominantVirtue(acc);
  const dominantSev = dominantSeverity(acc);

  // Climax bias: the LAST combat room gets the toughest pattern + extra atoms.
  const isClimax = index === total - 1;

  // Combat present if (index / total) falls into the combat-density window.
  // Combat is concentrated in the middle + end. Setup rooms (first 30%) are quieter.
  const setupCutoff = Math.floor(total * 0.3);
  const hasCombat =
    index >= setupCutoff && (combatDensity * total >= index - setupCutoff + 1);

  const encounterPattern: EncounterPatternId = hasCombat
    ? isClimax
      ? pickEncounterPattern(Math.max(tierBias, tierBias + 0.5), index)
      : pickEncounterPattern(tierBias, index)
    : "none";

  // Atom count per room — round to int, climax gets +1
  const atomCount = Math.round(atomsAvg) + (isClimax ? 1 : 0);
  const atoms: AtomDescriptor[] = [];
  for (let i = 0; i < atomCount; i++) {
    atoms.push({
      severity: dominantSev,
      virtue: dominantVirtueValue,
    });
  }

  // Gear gate distribution: place one per `gearGatesCount` rooms, evenly
  let gearGate: GearGate | undefined;
  if (acc.gearGatesCount > 0) {
    const stride = Math.max(1, Math.floor(total / acc.gearGatesCount));
    if (index > 0 && index % stride === 0) {
      gearGate = { difficulty: 10, itemTag: "torch" };
    }
  }

  // REST available in roughly every 3rd room without combat (between fights)
  const restAvailable = !hasCombat && index > 0 && index < total - 1;

  return {
    id: `room-${index + 1}`,
    encounterPattern,
    atoms,
    gearGate,
    restAvailable,
  };
}

function buildAffectCurve(
  acc: Accumulator,
  roomCount: number,
): AffectVector[] {
  const result: AffectVector[] = [];
  for (let i = 0; i < roomCount; i++) {
    const v: AffectVector = {};
    for (const axis of AFFECT_AXES) {
      const base = acc.affect[axis];
      if (base === 0) continue;
      // Sawtooth: climax (last 25% rooms) gets +0.2 fear/dread/excitement
      const climaxBoost =
        i / roomCount > 0.75 &&
        (axis === "fear" || axis === "dread" || axis === "excitement")
          ? 0.15
          : 0;
      const val = clamp(base + climaxBoost, 0, 1);
      v[axis] = Number(val.toFixed(2));
    }
    result.push(v);
  }
  return result;
}

// ── Public API ────────────────────────────────────────────────

export interface GenerateSkeletonInput {
  moduleId: string;
  name: string;
  answers: WizardAnswer[];
  /**
   * Whether to run the Monte Carlo simulator (1k trials) for each
   * reference party. Defaults to true. Tests pass false for speed.
   */
  runSimulation?: boolean;
  /** Stable seed for the simulator (defaults to hash of moduleId). */
  simSeed?: number;
}

export function generateSkeleton(input: GenerateSkeletonInput): ModuleSkeleton {
  // 1. Accumulate weights from all answers
  const acc = emptyAccumulator();
  for (const ans of input.answers) {
    const c = getOptionContribution(ans.questionId, ans.optionId);
    if (c) applyContribution(acc, c);
  }

  // 2. Resolve structural shape
  const roomCount = resolveRoomCount(acc);
  const rooms: SkeletonRoom[] = [];
  for (let i = 0; i < roomCount; i++) {
    rooms.push(generateRoom(i, roomCount, acc));
  }

  // 3. Build affect curve
  const affectCurveTarget = buildAffectCurve(acc, roomCount);

  // 4. PICSSI targets — magnitude only (we care which virtues this
  //    module exercises, not their signed deltas)
  const picssiTargets: Partial<Record<PicssiVirtue, number>> = {};
  for (const v of PICSSI_VIRTUES) {
    const m = Math.abs(acc.picssi[v]);
    if (m > 0) picssiTargets[v] = Math.round(m);
  }

  // 5. Compute loads + (optionally) run simulation
  const loads = computeModuleLoads({ rooms, questBranches: acc.questBranches });
  const runSim = input.runSimulation !== false;
  const simInput = { rooms, questBranches: acc.questBranches, moduleId: input.moduleId };

  let pCompletePerArchetype = { fresh: 0, mid: 0, endgame: 0 };
  if (runSim) {
    const f = simulateModule(REFERENCE_PARTIES.fresh, simInput, { trials: 1000, seed: input.simSeed });
    const m = simulateModule(REFERENCE_PARTIES.mid, simInput, { trials: 1000, seed: input.simSeed });
    const e = simulateModule(REFERENCE_PARTIES.endgame, simInput, { trials: 1000, seed: input.simSeed });
    pCompletePerArchetype = {
      fresh: f.pComplete,
      mid: m.pComplete,
      endgame: e.pComplete,
    };
  }

  // 6. Courage baseline keyed off the mid-hero archetype (the design
  //    intent is that the typical player ships at mid-tier capability)
  const courageBaseline = courageRewardsFor(pCompletePerArchetype.mid);

  return {
    moduleId: input.moduleId,
    name: input.name,
    pdAnchor: acc.pdAnchor,
    locationId: acc.locationId,
    travelZones: Array.from(acc.zones),
    affectCurveTarget,
    picssiTargets,
    intentionallySkewed: intentionallySkewedVirtues(acc),
    rooms,
    questOutline: {
      steps: Math.max(1, acc.questSteps),
      branches: acc.questBranches,
    },
    scrollSeeds: acc.scrollSeeds,
    henchmanSlots: acc.henchmanSlots,
    loads,
    pCompletePerArchetype,
    courageBaseline,
    wizardAnswers: input.answers,
    createdAt: "1970-01-01T00:00:00.000Z", // set by the API at save time
    contractVersion: "cf-1-v1",
  };
}
