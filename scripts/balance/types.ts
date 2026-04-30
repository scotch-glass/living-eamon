// ============================================================
// LIVING EAMON — Balance system types (re-export shim)
//
// The canonical source for these types moved to
// `lib/karma/atom-types.ts` in KARMA Sprint 4 so the runtime
// engine and the design-time simulator share one source of
// truth. This file is a thin re-export so existing simulator
// imports keep working.
//
// New code should import from `lib/karma/atom-types` directly.
// ============================================================

export {
  encounterAffectReach,
  encounterKarmaReach,
} from "../../lib/karma/atom-types";

export type {
  AffectAxis,
  AffectVector,
  AdventureTemplate,
  AtomKarmaDelta,
  Choice,
  Duration,
  Encounter,
  PatternType,
  PDSource,
  PrerequisiteSpec,
  TriggerSpec,
  Virtue,
} from "../../lib/karma/atom-types";

// Backward-compat alias for any external script that still imports `KarmaDelta`
// from this module. Prefer `AtomKarmaDelta` going forward.
export type { AtomKarmaDelta as KarmaDelta } from "../../lib/karma/atom-types";
