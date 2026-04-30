// ============================================================
// KARMA — Activity dispatcher
// KARMA Sprint 3. The "rest economy" lives here: PRAY / DRINK /
// BROTHEL / BATHE / DONATE / MORTIFY / REST. Each command consumes
// `actionBudget`, restores stamina, applies PICSSI deltas, and may
// trigger a side effect (VD contract/cure, HP cost, etc.).
//
// Every value referenced here comes from KARMA_SYSTEM.md §2.3 / §2.13
// (recovery table) and §4c (per-activity karma deltas).
// ============================================================

import type { WorldState, PlayerState } from "../gameState";
import { addToChronicle } from "../gameState";
import type { KarmaDelta } from "./types";
import { applyKarma, logKarmaDelta, recomputeDerivedStats } from "./recompute";
import {
  maybeContractVD,
  maybeFertilityCureVD,
  maybeGenericTempleCureVD,
} from "./brothel";

// ── Room-id helpers ───────────────────────────────────────────────
// The hub doesn't yet have a brothel / fertility-temple / bathhouse —
// these are placeholder predicates so future room data plugs in
// without touching activity definitions. The Church of Perpetual Life
// + the mage school's small chapel area count as "temple" for PRAY.

const TEMPLE_ROOMS = new Set<string>([
  "church_of_perpetual_life",
  // Sprint 3+ adventures may add more — match by id prefix below.
]);

function isTemple(roomId: string): boolean {
  if (TEMPLE_ROOMS.has(roomId)) return true;
  return /^(temple|chapel|shrine)/.test(roomId);
}

function isFertilityTemple(roomId: string): boolean {
  return roomId === "fertility_temple";
}

function isBrothel(roomId: string): boolean {
  return roomId === "brothel" || isFertilityTemple(roomId);
}

function isBathhouse(roomId: string): boolean {
  return roomId === "bathhouse";
}

function isTavern(roomId: string): boolean {
  return roomId === "main_hall";
}

// ── Activity types ────────────────────────────────────────────────

export interface ActivityResult {
  state: WorldState;
  narrative: string;
  /** Set when the activity rejected (out of gold, wrong room, etc.) */
  rejected?: boolean;
}

export type ActivityId =
  | "rest"
  | "pray"
  | "pray-fertility"
  | "drink"
  | "brothel"
  | "bathe"
  | "donate"
  | "mortify";

interface Activity {
  id: ActivityId;
  /** Action-budget cost. 1 for everything except bathhouse (2). */
  actionCost: number;
  /** Gold cost (subtracted from carried). 0 = free. */
  goldCost: number;
  /** Required room predicate. Undefined = anywhere. */
  requireRoom?: (roomId: string) => boolean;
  /** PICSSI deltas applied (positive). */
  picssiGain: KarmaDelta;
  /** PICSSI losses (positive numbers; converted to negative deltas). */
  picssiLoss?: KarmaDelta;
  /** Stamina restoration: "full" = max; "none" = no change. */
  staminaResult: "full" | "none";
  /** fatiguePool recovery formula (positive value added; clamped to 0). */
  fatiguePoolDelta: (p: PlayerState) => number;
  /** Custom side effect (VD roll, HP cost, etc.). */
  sideEffect?: (p: PlayerState) => PlayerState;
  /** Player-facing narrative on success. */
  narrative: (p: PlayerState) => string;
}

// ── Activity registry ─────────────────────────────────────────────
// Keyed for fast lookup. KARMA_SYSTEM.md §2.3 / §4c values inline.

const ACTIVITIES: Record<ActivityId, Activity> = {
  rest: {
    id: "rest",
    actionCost: 1,
    goldCost: 0,
    picssiGain: {},
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 0.5),
    narrative: () =>
      "You sit, breathe, let the ache leave your shoulders. The world does not stop, but it slows.",
  },
  pray: {
    id: "pray",
    actionCost: 1,
    goldCost: 0,
    requireRoom: isTemple,
    picssiGain: { spirituality: 1 },
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 0.29),
    sideEffect: p => maybeGenericTempleCureVD(p),
    narrative: () =>
      "You kneel. The stone is cold under your knees. Whatever listens, listens — or does not. You feel a little lighter for the asking.",
  },
  "pray-fertility": {
    id: "pray-fertility",
    actionCost: 1,
    goldCost: 0,
    requireRoom: isFertilityTemple,
    picssiGain: { spirituality: 1 },
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 0.29),
    sideEffect: p => maybeFertilityCureVD(p),
    narrative: () =>
      "The priestesses know what they look at. They burn herbs. They say words your grandmother might have known. You leave cleaner than you came.",
  },
  drink: {
    id: "drink",
    actionCost: 1,
    goldCost: 0,
    requireRoom: isTavern,
    picssiGain: { passion: 1 },
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 2.0),
    narrative: () =>
      "The ale is warm and the hall is louder than it should be. By the second cup the day is behind you.",
  },
  brothel: {
    id: "brothel",
    actionCost: 1,
    goldCost: 45,
    requireRoom: isBrothel,
    picssiGain: { passion: 3, courage: 1 },
    picssiLoss: { spirituality: 3 },
    staminaResult: "full",
    fatiguePoolDelta: () => 0, // KARMA_SYSTEM.md: full stamina reset, no surplus
    sideEffect: p => maybeContractVD(p),
    narrative: () =>
      "You leave with the smell of cheap perfume and your purse forty-five lighter. The walk home feels longer than the walk in.",
  },
  bathe: {
    id: "bathe",
    actionCost: 2,
    goldCost: 55,
    requireRoom: isBathhouse,
    picssiGain: { standing: 2 },
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 2.0),
    narrative: () =>
      "Hot water. Oils. A boy with a strigil. You step out feeling like a man people will notice when you walk past.",
  },
  donate: {
    id: "donate",
    actionCost: 1,
    goldCost: 50,
    requireRoom: isTemple,
    // Canonical irony (KARMA_SYSTEM.md §2.8): temple donations grow Standing,
    // not Spirituality. The gods see through the gesture; the city does not.
    picssiGain: { standing: 2 },
    staminaResult: "none",
    fatiguePoolDelta: () => 0,
    narrative: () =>
      "You drop fifty gold in the alms basin and let the priest see you do it. By morning, the right people will have heard.",
  },
  mortify: {
    id: "mortify",
    actionCost: 1,
    goldCost: 0,
    picssiGain: { spirituality: 3 },
    staminaResult: "full",
    fatiguePoolDelta: p => p.maxStamina,
    sideEffect: p => ({ ...p, hp: Math.max(1, p.hp - 5) }),
    narrative: () =>
      "You scourge the body so the soul will hear you. Blood comes. Spirit comes after.",
  },
};

// ── Public API ────────────────────────────────────────────────────

/**
 * Match a free-text command to an activity id. Returns null if the
 * command isn't an activity (caller should fall through to other
 * handlers). Brothel + fertility-temple share the room predicate;
 * `pray` resolves to `pray-fertility` automatically inside the
 * fertility temple.
 */
export function matchActivity(command: string, roomId: string): ActivityId | null {
  const verb = command.trim().split(/\s+/)[0]?.toUpperCase();
  switch (verb) {
    case "REST":     return "rest";
    case "PRAY":     return isFertilityTemple(roomId) ? "pray-fertility" : "pray";
    case "DRINK":    return isTavern(roomId) ? "drink" : null;
    case "BROTHEL":  return "brothel";
    case "BATHE":    return "bathe";
    case "DONATE":   return "donate";
    case "MORTIFY":  return "mortify";
    default:         return null;
  }
}

export function applyActivity(
  state: WorldState,
  activityId: ActivityId
): ActivityResult {
  const act = ACTIVITIES[activityId];
  const p = state.player;

  if (act.requireRoom && !act.requireRoom(p.currentRoom)) {
    return {
      state,
      narrative: rejectionFor(activityId),
      rejected: true,
    };
  }
  if (p.actionBudget < act.actionCost) {
    return {
      state,
      narrative:
        "You are out of strength for this kind of thing. Return to the hub and the next dawn will return your appetite.",
      rejected: true,
    };
  }
  if (act.goldCost > 0 && p.gold < act.goldCost) {
    return {
      state,
      narrative: `You need ${act.goldCost} gold for that, and you don't have it.`,
      rejected: true,
    };
  }

  let next: PlayerState = { ...p };
  next.actionBudget -= act.actionCost;
  if (act.goldCost > 0) next.gold = Math.max(0, next.gold - act.goldCost);
  if (act.staminaResult === "full") next.stamina = next.maxStamina;
  next.fatiguePool = Math.min(0, next.fatiguePool + act.fatiguePoolDelta(next));

  // PICSSI gains + losses, summed for a single karma-history entry
  next = applyKarma(next, act.picssiGain);
  const netDelta: KarmaDelta = { ...act.picssiGain };
  if (act.picssiLoss) {
    const lossDelta: KarmaDelta = {};
    for (const [k, v] of Object.entries(act.picssiLoss)) {
      const key = k as keyof KarmaDelta;
      lossDelta[key] = -(v as number);
      netDelta[key] = (netDelta[key] ?? 0) - (v as number);
    }
    next = applyKarma(next, lossDelta);
  }
  next = logKarmaDelta(next, netDelta, `activity: ${act.id}`);

  // Side effect (VD roll, HP cost, fertility cure, etc.)
  if (act.sideEffect) {
    next = act.sideEffect(next);
    // Side effects can flip vdActive, so re-recompute (STR_eff cares).
    next = recomputeDerivedStats(next);
  }

  let newState: WorldState = { ...state, player: next };

  // Chronicle the activity for the Eamon log.
  newState = addToChronicle(
    newState,
    chronicleLineFor(activityId, p, next),
    false
  );

  return {
    state: newState,
    narrative: act.narrative(next),
  };
}

function rejectionFor(id: ActivityId): string {
  switch (id) {
    case "pray":            return "There is no holy ground here to kneel on.";
    case "pray-fertility":  return "You are not at the fertility temple.";
    case "drink":           return "There is no one here to pour for you.";
    case "brothel":         return "There is no brothel here, and you should be glad of it.";
    case "bathe":           return "There is no bathhouse in this place.";
    case "donate":          return "There is no alms basin here for your generosity.";
    default:                return "Not here, not now.";
  }
}

function chronicleLineFor(id: ActivityId, before: PlayerState, after: PlayerState): string {
  const name = before.name;
  switch (id) {
    case "rest":            return `${name} rested.`;
    case "pray":            return `${name} prayed${after.vdActive === false && before.vdActive ? " and was cleansed of disease" : ""}.`;
    case "pray-fertility":  return `${name} prayed at the fertility temple${after.vdActive === false && before.vdActive ? " and was cured" : ""}.`;
    case "drink":           return `${name} drank in the hall.`;
    case "brothel":         return `${name} visited a brothel${after.vdActive && !before.vdActive ? " and contracted a disease" : ""}.`;
    case "bathe":           return `${name} bathed.`;
    case "donate":          return `${name} donated 50 gold to the temple.`;
    case "mortify":         return `${name} mortified the flesh in penance.`;
  }
}
