// ============================================================
// ModuleSkeleton — the output of the CF-1 wizard.
//
// Stored as module.json in Supabase Storage (creator-modules
// bucket). Future sprints fill in prose (CF-2), maps (CF-3),
// NPCs (CF-4), art (CF-5), Ink scaffolding (CF-6).
// ============================================================

import type {
  AffectAxis,
  AffectVector,
} from "../karma/atom-types";
import type { PicssiVirtue } from "../karma/types";
import type {
  ModuleLoads,
  SkeletonRoom,
} from "../difficulty/types";

export interface WizardAnswer {
  questionId: string;
  optionId: string;
  /**
   * Free text the Creator typed (or the AI pre-filled). Only meaningful
   * when optionId === "other". Stored on the skeleton and surfaced to
   * CF-2 prose generation as flavor seeds; load math ignores it.
   */
  customText?: string;
}

export type SeverityDistribution = Partial<
  Record<"trivial" | "notable" | "major" | "defining", number>
>;

/**
 * The full output of the wizard. Saved to module.json.
 */
export interface ModuleSkeleton {
  // Identity
  moduleId: string;
  name: string;
  pdAnchor: string | null;          // pdAnchors id, or null for original

  // Travel + world placement
  locationId: string;
  travelZones: string[];

  // Designer intent (drives GPE validation in CF-8)
  affectCurveTarget: AffectVector[]; // length = rooms.length
  picssiTargets: Partial<Record<PicssiVirtue, number>>;
  intentionallySkewed: PicssiVirtue[]; // top 2 by picssiTargets magnitude

  // Structural skeleton
  rooms: SkeletonRoom[];
  questOutline: { steps: number; branches: number };
  scrollSeeds: { thoth: number; stobaean: number };
  henchmanSlots: number;             // total across module

  // Difficulty (computed by the engine; cached here)
  loads: ModuleLoads;
  pCompletePerArchetype: {
    fresh: number;
    mid: number;
    endgame: number;
  };
  courageBaseline: {
    onComplete: number;
    onHonourableDeath: number;
    onFlee: number;
  };

  // Audit trail
  wizardAnswers: WizardAnswer[];
  createdAt: string;
  contractVersion: "cf-1-v1";
}

/**
 * What each option contributes when added to the skeleton sum.
 * Designed to be straightforward to compose — all numeric fields
 * sum, structural fields concatenate. The generator resolves a
 * final ModuleSkeleton from the summed WeightContribution.
 */
export interface WeightContribution {
  // AffectVector axes (clamped 0..1 after sum)
  affect?: Partial<Record<AffectAxis, number>>;

  // PICSSI virtue targets (magnitude; absolute value matters)
  picssi?: Partial<Record<PicssiVirtue, number>>;

  // Illumination tilt sign: -1, 0, +1 (averaged across answers)
  illuminationTilt?: number;

  // Structural counts (all sum)
  rooms?: number;
  questSteps?: number;
  questBranches?: number;
  henchmanSlots?: number;
  scrollSeeds?: { thoth?: number; stobaean?: number };

  // Per-room shape preferences (averaged)
  atomsPerRoom?: number;
  combatDensity?: number;     // 0..1 fraction of rooms with combat
  enemyTierBias?: number;     // 1..4 weighted average tier
  gearGatesCount?: number;
  atomSeverity?: SeverityDistribution;

  // Atomic identifiers (last one wins; used by setting questions)
  pdAnchor?: string | null;
  locationId?: string;
  zones?: string[];
}

/**
 * Wizard question schema. Each question has 2–4 options.
 * Options are pure data — the generator resolves them.
 */
export interface WizardQuestion {
  id: string;
  section: "setting" | "conflict" | "mechanics" | "shape";
  prompt: string;
  helper?: string;
  options: WizardOption[];
}

export interface WizardOption {
  id: string;
  label: string;
  description?: string;
  contribution: WeightContribution;
  /**
   * Marks this option as the "Other (custom)" free-text option.
   * The UI renders a textarea when this option is selected, and the
   * Creator's text is stored in WizardAnswer.customText.
   *
   * Load math: the contribution is preserved as-is, but customizable
   * options conventionally use an empty or minimum-bias contribution
   * so the textual flavor doesn't double-count against the math.
   */
  customizable?: boolean;
}
