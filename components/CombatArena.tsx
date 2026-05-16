// CombatArena — v2 multi-combatant combat UI built from scratch.
//
// Architectural rules (per Sprint C7 plan):
// - Sprites are scaled by FIGURE bounding box (via useFigureHeight)
//   so every combatant renders at the same on-screen height regardless
//   of source PNG composition.
// - Status columns are hidden by default; reveal on hover, fade 3 sec
//   after mouseleave, auto-pop on HP/mana/inventory delta. (Stage 2)
// - AI turns paced via useArenaTurnPacing: hotbar-reveal, jump anim,
//   narrate, advance. (Stage 4)
// - Player-controlled hotbar capped at 4 slots; rest of knownSpells
//   live in the Spellbook modal. (Stage 5)
//
// This component does NOT touch app/dev/combat-test or CombatScreen.tsx.
// Both are preserved as v1 reference.
"use client";

import { useMemo, useRef, useEffect, useLayoutEffect, useState, useCallback } from "react";
import type { ActiveCombatSession, CombatantState, BodyZone } from "../lib/combat/types";
import { spriteFor, spritePathFor } from "../lib/combat/sprites";
import { currentActorId } from "../lib/combat/engine";
import {
  useFigureHeight,
  figureScaleByEye,
  EYE_FROM_TOP_RATIO,
} from "../lib/combat/useFigureHeight";
import {
  BASELINE_FIGURE_HEIGHT_PX,
  SIZE_CLASSES,
  statureMultiplier,
  targetFigureHeightPx,
  type SizeClass,
} from "../lib/art/sizeClasses";
import { useSpriteMeta } from "../lib/art/useSpriteMeta";
import { layoutLane, type PlacedSlot } from "../lib/combat/laneLayout";
import { useColumnVisibility } from "../lib/combat/useColumnVisibility";
import {
  findSpell,
  SpellIcon,
  SpellActionMenu,
  SpellDetailPopup,
  TargetPicker,
  type SpellDef,
} from "./combat/sharedWidgets";
import CombatantInfoPopup from "./combat/CombatantInfoPopup";
import ItemActionPopup from "./combat/ItemActionPopup";
import Spellbook from "./combat/Spellbook";
import StrikeZonePicker from "./combat/StrikeZonePicker";
import EffectMarkerIcon from "./EffectMarkerIcon";
import ItemIcon from "./ItemIcon";
import { ITEMS, type Item } from "../lib/gameData";

// Items the player can fire from the in-combat status column. Anything
// not in this set is rendered in the column read-only (or omitted).
const COMBAT_USABLE_ITEM_PATTERN = /_potion$|_brew$|^antidote$|^strong_antidote$|^bandage$|^tourniquet$/;
function isCombatUsable(itemId: string): boolean {
  return COMBAT_USABLE_ITEM_PATTERN.test(itemId);
}

// Universal corpse marker — same six PNGs serve every humanoid death.
// No per-character assignment: each death rolls one of the variations
// at random, then locks that pick for the rest of the session via a
// useRef in the Slot. The variations exist purely to break visual
// repetition (different skull details + pack colors per
// `scripts/forge-corpse-marker.ts`); two bandits dying in the same
// fight can roll the same image or different — both are fine.
const CORPSE_MARKER_VARIATIONS = 6;
function rollCorpseMarker(): string {
  const v = Math.floor(Math.random() * CORPSE_MARKER_VARIATIONS) + 1;
  return `/art/corpse-marker/v${v}.png`;
}

// Howard-flavored corpse tooltip pool — terse, fatalistic, dark-humored.
// Each death rolls one once and locks via useRef in the Slot, so the
// same body never reshuffles its inscription. `{name}` is the only
// substitution. Curated 2026-05-09 with Scotch — no modern idioms.
// Cimmerian/Cimmeria stay radioactive; Crom is permitted (he's part
// of the game's cosmology — see project_maat_outer_dark_cosmology).
const CORPSE_TOOLTIP_VARIATIONS: ReadonlyArray<string> = [
  // Mortal-coil (original 6) ─────────────────────────────────
  "The mortal coil of {name}.",
  "The mortal coil shed by {name}.",
  "What remains of {name}'s mortal coil.",
  "{name}, slipped from the mortal coil.",
  "The mortal coil that was {name}.",
  "{name}'s mortal coil, fallen.",
  // Howard-style fatalism ────────────────────────────────────
  "{name} gave up the ghost.",
  "{name} paid the ferryman.",
  "{name}, briefly.",
  "Here lies {name}.",
  "Here ends the saga of {name}.",
  "All that remains of {name}'s ambitions.",
  "What {name} was reduced to.",
  "Dust takes {name}, as it takes all.",
  "{name}, whose road ends here.",
  "{name}, whose luck ran out.",
  "{name}, paid the iron price.",
  "{name} lost the gamble.",
  // Mythic / pagan / wry ────────────────────────────────────
  "{name} deserved better.",
  "{name} feasts with the gods.",
  "{name}'s blood feeds the earth.",
  "{name} is past all caring.",
  "{name} crossed the river.",
  "{name} fought to the end.",
  "{name}'s journey ends here.",
  // Added 2026-05-09 (batch 2) ──────────────────────────────
  "Crom laughs at {name}.",
  "{name} rode into the dark.",
  "The crows have their fill of {name}.",
  "Steel could not save {name}.",
  "{name}'s body failed.",
  "{name}, whose name is now dust.",
  "{name} sleeps the iron sleep.",
  "Even {name} was not iron enough.",
  "{name} discovered the eternal truth.",
  "{name} joined the gray ranks.",
  "The Reaper found {name}'s name.",
  "{name} crossed the gray river.",
  "Doom found {name} at last.",
  "{name} is meat for jackals.",
  "{name} strode into the abyss.",
  "The gods turned their faces from {name}.",
  "{name} rides no more.",
  "{name}, unmade by steel.",
  "The black wing brushed {name}.",
  "{name} walked into eternity.",
];
function rollCorpseTooltip(name: string): string {
  const i = Math.floor(Math.random() * CORPSE_TOOLTIP_VARIATIONS.length);
  return CORPSE_TOOLTIP_VARIATIONS[i]!.replace("{name}", name);
}

type AnchorRect = { top: number; left: number; width: number; height: number };
function rectFromEvent(e: React.MouseEvent<HTMLElement>): AnchorRect {
  const r = e.currentTarget.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}
type ClickHandler = (e: React.MouseEvent<HTMLElement>) => void;

// Combat-FX keyframes — inlined as a single CSS string so the arena
// ships its effects without depending on a global stylesheet. Timings
// per Scotch 2026-05-08: heal glow 1.4 s, blast / firebolt streaks
// 0.6 s, ward / haste auras fade-in over 0.6 s and settle into a faint
// 5-sec persistent state.
const COMBAT_FX_KEYFRAMES = `
@keyframes le-heal-glow {
  0%   { opacity: 0; transform: translate(-50%, 0) scale(0.85); }
  18%  { opacity: 0.95; transform: translate(-50%, 0) scale(1.05); }
  60%  { opacity: 0.7; transform: translate(-50%, 0) scale(1.2); }
  100% { opacity: 0; transform: translate(-50%, 0) scale(1.5); }
}
@keyframes le-blast-streak {
  0%   { opacity: 0; }
  18%  { opacity: 1; }
  60%  { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes le-firebolt-streak {
  0%   { opacity: 0; }
  18%  { opacity: 1; }
  70%  { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes le-firebolt-impact-1 {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  20%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.3); }
}
@keyframes le-firebolt-impact-2 {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  10%  { opacity: 0.95; transform: translate(-50%, -50%) scale(1.6); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.5); }
}
@keyframes le-aura-cast {
  0%   { opacity: 0; }
  6%   { opacity: 1; }
  100% { opacity: 0.22; }
}
@keyframes le-corpse-drop {
  0%   { transform: translate(-50%, calc(0px - var(--corpse-drop-start, 380px))) rotate(-2deg); opacity: 0; }
  6%   { opacity: 1; }
  55%  { transform: translate(-50%, 0) rotate(0deg); }
  62%  { transform: translate(-50%, -14px) rotate(-3deg); }
  72%  { transform: translate(-50%, 0) rotate(2deg); }
  80%  { transform: translate(-50%, -5px) rotate(-1deg); }
  88%  { transform: translate(-50%, 0) rotate(1deg); }
  94%  { transform: translate(-50%, 0) rotate(-0.4deg); }
  100% { transform: translate(-50%, 0) rotate(0deg); opacity: 1; }
}
/* Strike FX — impact burst centered on a body-zone anchor. */
@keyframes le-strike-impact {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  30%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.3); }
}
/* Crit gore — inner burst (fast, bone-white core). */
@keyframes le-gore-burst-1 {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  25%  { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
}
/* Crit gore — outer burst (slower, crimson halo). */
@keyframes le-gore-burst-2 {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  15%  { opacity: 0.9; transform: translate(-50%, -50%) scale(1.7); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2.6); }
}
/* Crit gore — droplet trajectory. Endpoint passed via CSS vars. */
@keyframes le-gore-droplet {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  10%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--droplet-dx-px, 0px)), calc(-50% + var(--droplet-dy-px, 0px))) scale(0.7);
  }
}
/* CLEANSE — concentric purification ring. */
@keyframes le-cleanse-flash {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  25%  { opacity: 0.9; transform: translate(-50%, -50%) scale(0.9); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
}
/* Floating damage popup — rises above target's head, fades, shrinks. */
@keyframes le-damage-float {
  0%   { opacity: 0; transform: translate(-50%, 0px)    scale(0.7); }
  6%   { opacity: 1; transform: translate(-50%, -10px)  scale(1.1); }
  14%  { opacity: 1; transform: translate(-50%, -22px)  scale(1.0); }
  100% { opacity: 0; transform: translate(-50%, -110px) scale(0.55); }
}
/* BLAST aftermath — wisp of dark smoke rising from the impact point.
   Origin is the target center (set via inline left/top); the keyframe
   translates upward + scales while fading. */
@keyframes le-blast-smoke {
  0%   { opacity: 0;    transform: translate(-50%, 0px)   scale(0.4); }
  20%  { opacity: 0.7;  transform: translate(-50%, -12px) scale(0.7); }
  60%  { opacity: 0.45; transform: translate(-50%, -55px) scale(1.2); }
  100% { opacity: 0;    transform: translate(-50%, -100px) scale(1.7); }
}
`;

// Popover state — exactly one popover open at a time.
type PopoverState =
  | { kind: "spell-menu"; combatantId: string; spell: SpellDef; anchor: AnchorRect }
  | { kind: "spell-lore"; spell: SpellDef }
  | { kind: "spell-target"; combatantId: string; spell: SpellDef; anchor: AnchorRect }
  | { kind: "item-menu"; combatantId: string; item: Item; anchor: AnchorRect }
  | { kind: "item-target"; combatantId: string; item: Item; anchor: AnchorRect }
  | { kind: "info"; combatantId: string }
  | { kind: "spellbook"; combatantId: string }
  | { kind: "strike-target"; combatantId: string; anchor: AnchorRect }
  | { kind: "strike-zone"; combatantId: string; targetId: string; anchor: AnchorRect };

// Per-slot vertical reservation. Class C renders at this height; smaller
// classes leave more empty space above their figure inside the same slot.
const SLOT_HEIGHT_PX = BASELINE_FIGURE_HEIGHT_PX;
// Slot pixel width — sprite is centered horizontally within this. 100%
// overlap is allowed across Z-classes (Decision #3), so slot width is
// only a render hint, not a layout constraint.
const SLOT_WIDTH_PX = 220;
// Per-side lane region width as a CSS calc — leaves 4vw outer margin.
const LANE_REGION_VW = 46;

export interface CombatArenaProps {
  session: ActiveCombatSession;
  /** Last few rounds of narrative. Stage 6 will format with banners. */
  combatLog: string[];
  /** True while engine is mid-resolution (input disabled). */
  loading: boolean;
  /** Send an ACT/AI_TURN command back to the page-level dispatcher. */
  onCommand: (cmd: string) => void;
  /**
   * Most recently resolved BLAST cast. Drives the white-streak FX
   * overlay. The `key` field changes per blast so the same
   * source/target pair re-fires the animation on subsequent casts.
   */
  lastBlast?: { sourceId: string; targetId: string; key: number } | null;
  /**
   * Most recently resolved FIREBOLT cast. Same shape as `lastBlast`
   * but drives the fiery streak with the orange/yellow tapered tail.
   */
  lastFirebolt?: { sourceId: string; targetId: string; key: number } | null;
  /**
   * Most recently resolved STRIKE. Drives the source lunge, target
   * reaction (dodge/knockback/recoil), zone-anchored hit-flash, crit
   * gore, and the floating damage popup. Always set on a strike
   * resolution — the `outcome` field selects which sub-FX run.
   */
  lastStrike?: {
    sourceId: string;
    targetId: string;
    zone: BodyZone;
    outcome: "hit" | "crit" | "evaded" | "blocked" | "armorStopped" | "criticalFail";
    damage: number;
    key: number;
  } | null;
  /** Most recently resolved DAYLIGHT cast. One-shot sun-beam on caster. */
  /** Most recently resolved CLEANSE cast. Purification ring on target. */
  lastCleanse?: { targetId: string; key: number } | null;
}

export default function CombatArena({
  session,
  combatLog,
  loading,
  onCommand,
  lastBlast,
  lastFirebolt,
  lastStrike,
  lastCleanse,
}: CombatArenaProps) {
  // Refs to each living sprite's <img> so combat FX (blast streak,
  // future projectiles, etc.) can measure on-screen coordinates. The
  // map is repopulated on every render — sprites that unmount on death
  // are garbage-collected naturally.
  const spriteRefs = useRef<Map<string, HTMLElement>>(new Map());
  const registerSprite = useCallback((id: string, el: HTMLElement | null) => {
    if (el) spriteRefs.current.set(id, el);
    else spriteRefs.current.delete(id);
  }, []);
  const allies = useMemo(
    () =>
      session.combatants
        .filter((c) => c.team === "ally")
        .slice()
        .sort((a, b) => b.position - a.position),
    [session.combatants],
  );
  const enemies = useMemo(
    () =>
      session.combatants
        .filter((c) => c.team === "enemy")
        .slice()
        .sort((a, b) => b.position - a.position),
    [session.combatants],
  );

  const activeId = currentActorId(session);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const closePopover = useCallback(() => setPopover(null), []);

  // Targets visible to the picker for a given spell-targeting flavor.
  // The COMBAT_SPELLS registry tags spells "self" for restorative/buff
  // spells (HEAL, GREATER-HEAL, WARD, …). The engine actually allows
  // these to be cast on any ally, so the picker shows ALL allies for
  // "self"-flavored spells; "enemy" shows opposing-team livings only;
  // "none" is caster-only (DAYLIGHT, POWER).
  const spellTargets = useCallback(
    (caster: CombatantState, spell: SpellDef): CombatantState[] => {
      const livings = session.combatants.filter((c) => c.hp > 0);
      switch (spell.targeting) {
        case "enemy":
          return livings.filter((c) => c.team !== caster.team);
        case "none":
          return [caster];
        case "self":
        default:
          return livings.filter((c) => c.team === caster.team);
      }
    },
    [session.combatants],
  );
  const allyTargets = useCallback(
    (sourceId: string): CombatantState[] => {
      const source = session.combatants.find((c) => c.id === sourceId);
      if (!source) return [];
      return session.combatants.filter((c) => c.hp > 0 && c.team === source.team);
    },
    [session.combatants],
  );

  // Render the active popover at the arena root (above all sprites).
  let popoverNode: React.JSX.Element | null = null;
  if (popover) {
    if (popover.kind === "spell-menu") {
      popoverNode = (
        <SpellActionMenu
          spell={popover.spell}
          anchorRect={popover.anchor}
          onCast={() => {
            setPopover({
              kind: "spell-target",
              combatantId: popover.combatantId,
              spell: popover.spell,
              anchor: popover.anchor,
            });
          }}
          onLore={() => setPopover({ kind: "spell-lore", spell: popover.spell })}
          onClose={closePopover}
        />
      );
    } else if (popover.kind === "spell-lore") {
      popoverNode = <SpellDetailPopup spell={popover.spell} onClose={closePopover} />;
    } else if (popover.kind === "spell-target") {
      const caster = session.combatants.find((c) => c.id === popover.combatantId);
      const candidates = caster ? spellTargets(caster, popover.spell) : [];
      popoverNode = (
        <TargetPicker
          spell={popover.spell}
          zone={null}
          anchorRect={popover.anchor}
          candidates={candidates}
          isStrike={false}
          onSelect={(target) => {
            onCommand(`ACT ${popover.combatantId} CAST ${popover.spell.name} ${target.id}`);
            closePopover();
          }}
          onClose={closePopover}
        />
      );
    } else if (popover.kind === "item-menu") {
      const selfLabel = popover.item.id === "bandage" || popover.item.id === "tourniquet"
        ? "Apply to self"
        : "Drink";
      popoverNode = (
        <ItemActionPopup
          item={popover.item}
          anchorRect={popover.anchor}
          selfLabel={selfLabel}
          onSelf={() => {
            onCommand(`ACT ${popover.combatantId} USE ${popover.item.id} ${popover.combatantId}`);
            closePopover();
          }}
          onAlly={() => {
            setPopover({
              kind: "item-target",
              combatantId: popover.combatantId,
              item: popover.item,
              anchor: popover.anchor,
            });
          }}
          onClose={closePopover}
        />
      );
    } else if (popover.kind === "item-target") {
      // Reuse TargetPicker for ally selection. Pass spell=null + zone=null
      // (it uses headerLabel = "Strike" by default; we override via the
      // header-fallback path below by rendering with spell=null isStrike=false).
      const candidates = allyTargets(popover.combatantId);
      popoverNode = (
        <TargetPicker
          spell={null}
          zone={null}
          anchorRect={popover.anchor}
          candidates={candidates}
          isStrike={false}
          onSelect={(target) => {
            onCommand(`ACT ${popover.combatantId} USE ${popover.item.id} ${target.id}`);
            closePopover();
          }}
          onClose={closePopover}
        />
      );
    } else if (popover.kind === "info") {
      const c = session.combatants.find((x) => x.id === popover.combatantId);
      if (c) popoverNode = <CombatantInfoPopup c={c} onClose={closePopover} />;
    } else if (popover.kind === "spellbook") {
      const c = session.combatants.find((x) => x.id === popover.combatantId);
      if (c) popoverNode = <Spellbook c={c} onClose={closePopover} />;
    } else if (popover.kind === "strike-target") {
      // Step 1: pick the target. Body zone is chosen AFTER the target
      // so the player decides "hit Korm" first, then "hit Korm where".
      const source = session.combatants.find((x) => x.id === popover.combatantId);
      const candidates = source
        ? session.combatants.filter((c) => c.team !== source.team && c.hp > 0)
        : [];
      popoverNode = (
        <TargetPicker
          spell={null}
          zone={null}
          anchorRect={popover.anchor}
          candidates={candidates}
          isStrike={true}
          onSelect={(target) => {
            // Chain to the zone picker now that we have a target.
            setPopover({
              kind: "strike-zone",
              combatantId: popover.combatantId,
              targetId: target.id,
              anchor: popover.anchor,
            });
          }}
          onClose={closePopover}
        />
      );
    } else if (popover.kind === "strike-zone") {
      // Step 2: pick the body zone for the chosen target.
      popoverNode = (
        <StrikeZonePicker
          anchorRect={popover.anchor}
          onPick={(zone) => {
            onCommand(
              `ACT ${popover.combatantId} STRIKE ${zone.toUpperCase()} ${popover.targetId}`,
            );
            closePopover();
          }}
          onClose={closePopover}
        />
      );
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: session.backgroundUrl
          ? `linear-gradient(180deg, rgba(20,10,5,0.55) 0%, rgba(20,10,5,0.10) 30%, rgba(20,10,5,0.55) 100%), url('${session.backgroundUrl}')`
          : undefined,
        backgroundColor: "#0a0805",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "#e8d4a0",
        fontFamily: "Georgia, serif",
        overflow: "hidden",
        // Single shared stacking context for all combatants. Any
        // transform / opacity / filter on an ancestor of a Slot would
        // create a child stacking context and silently break Z order.
        // Keep this contract; the `isolation: isolate` makes it explicit.
        isolation: "isolate",
      }}
    >
      <TurnRail session={session} />

      <Lane
        side="ally"
        combatants={allies}
        activeId={activeId}
        loading={loading}
        setPopover={setPopover}
        onCommand={onCommand}
        registerSprite={registerSprite}
        lastStrike={lastStrike}
      />

      <Lane
        side="enemy"
        combatants={enemies}
        activeId={activeId}
        loading={loading}
        setPopover={setPopover}
        onCommand={onCommand}
        registerSprite={registerSprite}
        lastStrike={lastStrike}
      />

      {lastBlast && (
        <BlastStreak
          key={`blast-${lastBlast.key}`}
          sourceId={lastBlast.sourceId}
          targetId={lastBlast.targetId}
          spriteRefs={spriteRefs}
        />
      )}
      {lastFirebolt && (
        <FireboltStreak
          key={`firebolt-${lastFirebolt.key}`}
          sourceId={lastFirebolt.sourceId}
          targetId={lastFirebolt.targetId}
          spriteRefs={spriteRefs}
        />
      )}
      {lastStrike && (
        <StrikeFxLayer
          key={`strike-fx-${lastStrike.key}`}
          lastStrike={lastStrike}
          spriteRefs={spriteRefs}
        />
      )}
      {lastCleanse && (
        <CleanseFlash
          key={`cleanse-${lastCleanse.key}`}
          targetId={lastCleanse.targetId}
          spriteRefs={spriteRefs}
        />
      )}

      {/* Combat-FX keyframes — heal glow on the recipient, white streak
          on BLAST. Inlined so the arena's effects ship without a CSS
          file dependency. */}
      <style>{COMBAT_FX_KEYFRAMES}</style>

      <CombatLogPanel lines={combatLog} />

      {popoverNode}
    </div>
  );
}

// ── Lane ───────────────────────────────────────────────────
// Per-side container that runs `layoutLane` across all combatants on
// this team. Each Z-class is laid out independently (3 fixed spaces);
// different classes share the same lane region but with their own Z.

function Lane({
  side,
  combatants,
  activeId,
  loading,
  setPopover,
  onCommand,
  registerSprite,
  lastStrike,
}: {
  side: "ally" | "enemy";
  combatants: CombatantState[];
  activeId: string | null;
  loading: boolean;
  setPopover: (s: PopoverState | null) => void;
  onCommand: (cmd: string) => void;
  registerSprite: (id: string, el: HTMLElement | null) => void;
  lastStrike?: CombatArenaProps["lastStrike"];
}): React.JSX.Element {
  // Cache last living centerX per combatant id. Combatants stamped with
  // the dead-sentinel (`position === -1`) read their pre-death centerX
  // from this cache so the fade+shrink animation plays IN PLACE while
  // surviving teammates slide to their promoted positions in the same
  // tick. The cache is updated in a post-render effect — only living
  // entries are written, so dying ones retain their last alive centerX.
  const lastCenterRef = useRef<Map<string, number>>(new Map());

  // Death-order tracker — assigns a monotonic counter to each combatant
  // the first time they're observed dying. Powers corpse-pile stacking:
  // a body that dies LATER on the same lane spot lands ON TOP of the
  // earlier corpse(s). Ref instead of state so registration is idempotent
  // across renders without firing extra cycles.
  const deathOrderRef = useRef<{ counter: number; map: Map<string, number> }>({
    counter: 0,
    map: new Map(),
  });

  // Prune stale ref entries whose IDs are no longer in the combatant
  // list. Without this, Reset / HMR / session-swap leaves dead-order
  // and centerX cache populated with vanished IDs, and stackIndexFor
  // counts them as "earlier corpses at the spot" — making a new corpse
  // float on top of an invisible base.
  {
    const liveIds = new Set(combatants.map((c) => c.id));
    for (const id of Array.from(deathOrderRef.current.map.keys())) {
      if (!liveIds.has(id)) deathOrderRef.current.map.delete(id);
    }
    for (const id of Array.from(lastCenterRef.current.keys())) {
      if (!liveIds.has(id)) lastCenterRef.current.delete(id);
    }
    if (deathOrderRef.current.map.size === 0) {
      deathOrderRef.current.counter = 0;
    }
  }

  // Layout is computed assuming all combatants are class C. Each Slot
  // re-fetches its own metadata and renders at its real class's height
  // and Z-index, so mixed-class lanes still render correctly even though
  // the LAYOUT pass is class-agnostic. layoutLane already filters
  // position < 1, so `placed` contains only the LIVING.
  const placed: PlacedSlot[] = useMemo(
    () => layoutLane(combatants, { widthPx: 1000 }, () => "C"),
    [combatants],
  );

  useEffect(() => {
    for (const p of placed) {
      lastCenterRef.current.set(p.combatant.id, p.centerXPx);
    }
  }, [placed]);

  // Dying combatants — kept mounted so the fade+shrink animation plays.
  // Centered on their cached pre-death centerX (or the lane midpoint if
  // they died before the cache was ever populated, which only happens
  // in pathological boot-time states).
  const dying = useMemo(
    () => combatants.filter(c => c.position < 0),
    [combatants],
  );

  // Register newly-dead combatants in death-order. Idempotent.
  for (const c of dying) {
    if (!deathOrderRef.current.map.has(c.id)) {
      deathOrderRef.current.counter += 1;
      deathOrderRef.current.map.set(c.id, deathOrderRef.current.counter);
    }
  }

  // Corpse-pile stacking. Each new body lands ON TOP of any earlier
  // bodies at the same lane spot, with a 20% overlap on the top
  // portion of the body below — visually convincing as a real pile.
  // Z-index steps by 2 per layer starting at 10 so each new pack
  // renders unambiguously above the one beneath. Stack INDEX (count
  // of earlier corpses at the same spot, capped) is what the Slot
  // receives; the Slot does the bottom-offset + zIndex math itself
  // so MARKER_HEIGHT_PX stays a single source of truth.
  const PROXIMITY_PX = 18;
  function stackIndexFor(id: string, centerXPx: number): number {
    const myOrder = deathOrderRef.current.map.get(id);
    if (myOrder === undefined) return 0;
    let earlierAtSpot = 0;
    for (const [otherId, otherOrder] of deathOrderRef.current.map) {
      if (otherId === id) continue;
      if (otherOrder >= myOrder) continue;
      const otherCx = lastCenterRef.current.get(otherId);
      if (otherCx === undefined) continue;
      if (Math.abs(otherCx - centerXPx) <= PROXIMITY_PX) earlierAtSpot += 1;
    }
    return earlierAtSpot;
  }

  const allRendered: Array<{
    c: CombatantState;
    centerXPx: number;
    isDying: boolean;
    stackIndex: number;
  }> = [
    ...placed.map(p => ({
      c: p.combatant,
      centerXPx: p.centerXPx,
      isDying: false,
      stackIndex: 0,
    })),
    ...dying.map(c => {
      const cx = lastCenterRef.current.get(c.id) ?? 500;
      return {
        c,
        centerXPx: cx,
        isDying: true,
        stackIndex: stackIndexFor(c.id, cx),
      };
    }),
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "6vh",
        ...(side === "ally"
          ? { left: "2vw", width: `${LANE_REGION_VW}vw` }
          : { right: "2vw", width: `${LANE_REGION_VW}vw` }),
        height: SLOT_HEIGHT_PX,
      }}
    >
      {allRendered.map(({ c, centerXPx, isDying, stackIndex }) => {
        // Convert centerXPx (in 0..1000) to a percentage of lane width.
        // Mirror enemies so position-1 (front) lands closest to centerline.
        const pctX = side === "ally" ? centerXPx / 1000 : 1 - centerXPx / 1000;
        const leftCss = `calc(${pctX * 100}% - ${SLOT_WIDTH_PX / 2}px)`;
        return (
          <div
            key={c.id}
            style={{
              position: "absolute",
              left: leftCss,
              bottom: 0,
              // Survivors with promoted positions slide to their new
              // centerX over 0.5s; dying combatants stay pinned in place
              // so their fade+shrink animation isn't combined with a
              // distracting horizontal slide.
              transition: isDying ? "none" : "left 0.5s ease",
            }}
          >
            <Slot
              c={c}
              side={side}
              isActive={c.id === activeId}
              loading={loading}
              setPopover={setPopover}
              onCommand={onCommand}
              registerSprite={registerSprite}
              corpseStackIndex={stackIndex}
              lastStrike={lastStrike}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Slot ────────────────────────────────────────────────────

// Stacking constants — single source of truth for marker geometry.
// 50% overlap on the body below means each new body sits 50% of marker
// height up from its neighbor. Z steps +2 per layer starting at 10.
// Cap protects against piles climbing past eye level for the LIVING
// figure standing on the same lane spot.
const CORPSE_MARKER_HEIGHT_PX = 120;
const CORPSE_STACK_OVERLAP_RATIO = 0.5;
const CORPSE_STACK_OFFSET_PX = Math.round(
  CORPSE_MARKER_HEIGHT_PX * (1 - CORPSE_STACK_OVERLAP_RATIO),
);
const CORPSE_STACK_Z_BASE = 10;
const CORPSE_STACK_Z_STEP = 2;
const CORPSE_STACK_CAP_PX = 360;

function Slot({
  c,
  side,
  isActive,
  loading,
  setPopover,
  onCommand,
  registerSprite,
  corpseStackIndex,
  lastStrike,
}: {
  c: CombatantState;
  side: "ally" | "enemy";
  isActive: boolean;
  loading: boolean;
  setPopover: (s: PopoverState | null) => void;
  onCommand: (cmd: string) => void;
  registerSprite: (id: string, el: HTMLElement | null) => void;
  corpseStackIndex: number;
  lastStrike?: CombatArenaProps["lastStrike"];
}) {
  const spritePath = spritePathFor(c);
  const { meta } = useSpriteMeta(spritePath);
  const fig = useFigureHeight(spritePath);
  const fallback = spriteFor(c);

  // Effective metadata: prefer reviewed values; fall back to hardcoded flip.
  const sizeClass: SizeClass = meta?.sizeClass ?? "C"; // C is the safe default for humanoid combat
  const flip = meta?.flip ?? fallback.flip;
  const eyeYPx = meta?.eyeYPx;

  // Stature modifier (locked 2026-05-08): female combatants render at
  // 0.9× their class baseline, the hero (npcId === null) at 1.1×.
  // Compounds for a hypothetical female hero (0.99×). Helper lives in
  // lib/art/sizeClasses.ts; canon source is the user's game_rules.md
  // memory.
  const staturePct = statureMultiplier({
    gender: c.gender,
    isHero: c.npcId === null,
  });

  // Try to compute figureScaleByEye. If eyeYPx is missing, this throws —
  // we render a placeholder + warning instead. (Decision: production-quality
  // gate via the Sprite Review Tool, no estimation fallback.)
  let scale: ReturnType<typeof figureScaleByEye> | null = null;
  let scaleError: string | null = null;
  try {
    if (fig.ready) {
      scale = figureScaleByEye(fig, eyeYPx, sizeClass, staturePct);
    }
  } catch (err) {
    scaleError = (err as Error).message;
    scale = null;
  }

  const teamColor = side === "ally" ? "#fbbf24" : "#f87171";
  const isDead = c.hp <= 0;
  const slotHeight = targetFigureHeightPx(sizeClass);
  const spriteZ = SIZE_CLASSES[sizeClass].spriteZ;

  // Per-combatant column visibility. Auto-pops when HP/mana/inventory/
  // active-effects change.
  const invSig = c.inventory.map((e) => `${e.itemId}:${e.quantity}`).join(",");
  const fxSig = c.activeEffects.map((e) => `${e.type}:${e.severity}:${e.turnsRemaining}`).join(",");
  const colSig = `${c.hp}|${c.mana}|${invSig}|${fxSig}`;
  const col = useColumnVisibility(colSig);

  // Heal-glow trigger — increments whenever this combatant's HP goes UP
  // (HEAL spell, GREATER-HEAL, healing potion). The overlay div uses
  // `key={healGlowKey}` so the CSS animation restarts on each event.
  //
  // Damage-popup trigger — fires whenever this combatant's HP goes DOWN
  // (any source: strike, spell, bleed tick, etc.). Stores the loss
  // amount + a key so consecutive hits each animate independently. The
  // popup component remounts per key.
  const prevHpRef = useRef(c.hp);
  const [healGlowKey, setHealGlowKey] = useState(0);
  const [damageEvent, setDamageEvent] = useState<{ amount: number; key: number } | null>(null);
  useEffect(() => {
    if (c.hp > prevHpRef.current) {
      setHealGlowKey((k) => k + 1);
    } else if (c.hp < prevHpRef.current) {
      const lost = prevHpRef.current - c.hp;
      setDamageEvent((prev) => ({ amount: lost, key: (prev?.key ?? 0) + 1 }));
    }
    prevHpRef.current = c.hp;
  }, [c.hp]);

  // Persistent buff auras — mount-while-active. The engine adds these
  // status-effect entries on cast and removes them when the duration
  // expires; the aura element follows React's natural mount/unmount.
  //
  // Yellow haste-aura covers BOTH `haste_extra_action` (HASTE spell)
  // AND `haste` (SPEED spell + alchemical brews — stamina_brew /
  // fatigue_brew). Visually they're all "this combatant moves faster"
  // and the aura signals that consistently regardless of source.
  const hasWardEffect = c.activeEffects.some((e) => e.type === "ward");
  const hasHasteEffect = c.activeEffects.some(
    (e) => e.type === "haste_extra_action" || e.type === "haste",
  );
  // Sprint-extension auras (2026-05-09): one Aura per active-effect type
  // that has a registered handler in lib/combat/engine.ts. Same mount/
  // unmount pattern as WARD/HASTE — driven by activeEffects presence.
  const hasSteelskinEffect = c.activeEffects.some((e) => e.type === "steelskin");
  const hasSilencedEffect  = c.activeEffects.some((e) => e.type === "silenced");
  const hasResistEffect    = c.activeEffects.some((e) => e.type === "resist_elemental");

  // Corpse-marker variation — rolled ONCE on the first render where
  // this combatant is dead, then locked for the rest of the session
  // so the same body doesn't shuffle through different markers
  // between renders. No per-id determinism: each death is an
  // independent random pick across the 6 universal variations.
  const corpseMarkerRef = useRef<string | null>(null);
  const corpseTooltipRef = useRef<string | null>(null);
  if (isDead && corpseMarkerRef.current === null) {
    corpseMarkerRef.current = rollCorpseMarker();
    corpseTooltipRef.current = rollCorpseTooltip(c.name);
  }
  // Hover state for the custom corpse-marker popover (replaces the
  // native title attribute, which has a 1-sec browser delay).
  const [corpseHover, setCorpseHover] = useState(false);

  const isPlayerActor = isActive && c.controlledBy === "player" && !isDead;

  const onSpellClick = (spellName: string): ClickHandler => (e) => {
    if (!isPlayerActor || loading) return;
    const spell = findSpell(spellName);
    if (!spell) return;
    setPopover({ kind: "spell-menu", combatantId: c.id, spell, anchor: rectFromEvent(e) });
  };

  const onPotionClick = (item: Item): ClickHandler => (e) => {
    if (!isPlayerActor || loading) return;
    setPopover({ kind: "item-menu", combatantId: c.id, item, anchor: rectFromEvent(e) });
  };

  const onStrikeClick: ClickHandler = (e) => {
    if (!isPlayerActor || loading) return;
    // New flow (2026-05-08): pick the TARGET first, then chain to the
    // body-zone picker. The strike-target popover renders TargetPicker
    // with isStrike=true; on selection it sets strike-zone with the
    // chosen target carried in the popover state.
    setPopover({ kind: "strike-target", combatantId: c.id, anchor: rectFromEvent(e) });
  };

  const onFleeClick: ClickHandler = () => {
    if (!isPlayerActor || loading) return;
    onCommand(`ACT ${c.id} FLEE`);
  };

  const onPortraitClick = () => {
    setPopover({ kind: "info", combatantId: c.id });
  };

  // Hotbar slots — render up to 4 (Phase 5 wires the swap UI; until then
  // the engine still allows 6, the arena UI exposes 4).
  const hotbarSpells = c.combatHotbar.slice(0, 4);
  const knownSet = new Set((c.knownSpells ?? []).map((s) => s.toUpperCase()));

  // Combat-usable items (potions / brews / antidote / bandage / tourniquet).
  const usableItems = c.inventory
    .filter((e) => isCombatUsable(e.itemId) && e.quantity > 0)
    .slice(0, 6);

  return (
    <div
      onMouseEnter={col.onMouseEnter}
      onMouseLeave={col.onMouseLeave}
      style={{
        position: "relative",
        width: 220,
        height: SLOT_HEIGHT_PX,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        // The slot itself does NOT define its own stacking context; the
        // arena root is the single shared context per Stage A's contract.
      }}
    >
      {/* Unified combat hotbar — single foot-anchored stack containing
          name, HP bar, mana bar, effect chips, 2×2 potion grid, 2×2
          spell grid, and the spellbook button. Visibility: hover-
          revealed + state-delta auto-pop for EVERY combatant including
          the hero (no always-visible exception — Scotch's correction
          2026-05-08). */}
      {!isDead && (
        <HotbarStrip
          c={c}
          teamColor={teamColor}
          visible={col.visible}
          isActive={isActive}
          loading={loading}
          isPlayerActor={isPlayerActor}
          spells={hotbarSpells}
          knownSet={knownSet}
          potions={usableItems}
          hasKnownSpells={knownSet.size > 0}
          onSpellClick={onSpellClick}
          onPotionClick={onPotionClick}
          onOpenSpellbook={() => setPopover({ kind: "spellbook", combatantId: c.id })}
          onStrikeClick={onStrikeClick}
          onFleeClick={onFleeClick}
        />
      )}

      {/* Active-actor indicator. Rendered above sprite + gore (z = max + 1). */}
      {isActive && !isDead && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: SLOT_HEIGHT_PX - slotHeight - 28,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: 110,
              height: 0,
              borderTop: `2px solid ${teamColor}`,
              boxShadow: `0 0 8px ${teamColor}`,
            }}
          />
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: `10px solid ${teamColor}`,
              filter: `drop-shadow(0 0 4px ${teamColor})`,
              marginTop: -1,
            }}
          />
        </div>
      )}

      {/* Sprite. Eye-anchored scaling by size class.
          Only `height` is set — `width` is left auto so the browser
          derives it from the source PNG's natural aspect ratio.
          CRITICAL: `maxWidth: "none"` overrides Tailwind v4 preflight's
          `img { max-width: 100%; }`, which would otherwise clamp the
          auto-computed width down to the parent slot's width (220px)
          while leaving the explicit height alone — producing a vertical
          stretch / horizontal squeeze. Without this override, wide-pose
          sprites (Brute's horizontal sword, Gaius's overhead blade)
          render with their bodies pinched thin. (Diagnosed 2026-05-08.)
          Per Scotch: "There should be no width setting or constraint
          only a height setting." */}
      {/* Heal-glow overlay — pink halo behind the sprite that fades in
          and bloomes outward whenever c.hp ticks UP (HEAL spell,
          GREATER-HEAL spell, healing-potion item). Keyed on healGlowKey
          so each fresh heal restarts the animation. Pointer-events
          none so it never intercepts portrait clicks. */}
      {!isDead && healGlowKey > 0 && scale?.ready && (
        <div
          key={`heal-${healGlowKey}`}
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            bottom: `${scale.offsetBelowPx}px`,
            width: `${scale.imgWidthPx * 0.85}px`,
            height: `${scale.imgHeightPx * 0.92}px`,
            transform: "translate(-50%, 0)",
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,182,193,0.85) 0%, rgba(255,105,180,0.4) 45%, rgba(255,105,180,0) 75%)",
            filter: "blur(8px)",
            pointerEvents: "none",
            zIndex: spriteZ - 0.5,
            animation: "le-heal-glow 1.4s ease-out forwards",
          }}
        />
      )}

      {/* Floating damage popup — fires on ANY HP loss (strike, spell,
          bleed tick, etc.). Anchored above the sprite's head; rises +
          fades + shrinks over 3s. Crit annotation appears when a recent
          STRIKE on this combatant was a crit (matched via lastStrike).
          Keyed by damageEvent.key so consecutive hits stack as separate
          animations. */}
      {!isDead && damageEvent && scale?.ready && (
        <SlotDamagePopup
          key={`dmg-${damageEvent.key}`}
          amount={damageEvent.amount}
          isCrit={
            !!lastStrike &&
            lastStrike.targetId === c.id &&
            lastStrike.outcome === "crit"
          }
          spriteHeightPx={scale.imgHeightPx}
          offsetBelowPx={scale.offsetBelowPx}
        />
      )}

      {/* WARD aura — blue oval + soft inner glow. Mounts on first
          appearance of the "ward" effect; unmounts when the engine
          ticks the buff off. Rendered behind the sprite (zIndex
          spriteZ - 0.4) so the character stands inside the aura. */}
      {!isDead && scale?.ready && hasWardEffect && (
        <Aura
          scaleWidthPx={scale.imgWidthPx}
          scaleHeightPx={scale.imgHeightPx}
          offsetBelowPx={scale.offsetBelowPx}
          color="rgba(96,165,250,1)"
          spriteZ={spriteZ}
        />
      )}

      {/* HASTE aura — same shape as WARD but yellow. */}
      {!isDead && scale?.ready && hasHasteEffect && (
        <Aura
          scaleWidthPx={scale.imgWidthPx}
          scaleHeightPx={scale.imgHeightPx}
          offsetBelowPx={scale.offsetBelowPx}
          color="rgba(250,204,21,1)"
          spriteZ={spriteZ}
        />
      )}

      {/* STEELSKIN aura — silver-metallic. Halves physical damage for 4 turns. */}
      {!isDead && scale?.ready && hasSteelskinEffect && (
        <Aura
          scaleWidthPx={scale.imgWidthPx}
          scaleHeightPx={scale.imgHeightPx}
          offsetBelowPx={scale.offsetBelowPx}
          color="rgba(220,220,230,1)"
          spriteZ={spriteZ}
        />
      )}

      {/* SILENCE aura — violet debuff. Next CAST fizzles. */}
      {!isDead && scale?.ready && hasSilencedEffect && (
        <Aura
          scaleWidthPx={scale.imgWidthPx}
          scaleHeightPx={scale.imgHeightPx}
          offsetBelowPx={scale.offsetBelowPx}
          color="rgba(168,85,247,1)"
          spriteZ={spriteZ}
        />
      )}

      {/* RESIST aura — ice-blue elemental shield. */}
      {!isDead && scale?.ready && hasResistEffect && (
        <Aura
          scaleWidthPx={scale.imgWidthPx}
          scaleHeightPx={scale.imgHeightPx}
          offsetBelowPx={scale.offsetBelowPx}
          color="rgba(125,211,252,1)"
          spriteZ={spriteZ}
        />
      )}

      {spritePath && scale?.ready && (
        <img
          ref={(el) => registerSprite(c.id, el)}
          src={spritePath}
          alt={c.name}
          onClick={isDead ? undefined : onPortraitClick}
          style={{
            position: "absolute",
            left: "50%",
            bottom: `${scale.offsetBelowPx}px`,
            height: `${scale.imgHeightPx}px`,
            maxWidth: "none",
            // Death: living body vanishes quickly (0.3 s fade) so the
            // corpse-marker drop FX takes over. Pre-2026-05-09 this was
            // a 0.5 s fade+shrink ("body shrinks then disappears"). The
            // skull-and-pack drop replaces that.
            transform: `translateX(-50%) ${flip ? "scaleX(-1)" : ""}`,
            opacity: isDead ? 0 : 1,
            transition: "opacity 0.3s ease",
            pointerEvents: isDead ? "none" : "auto",
            cursor: isDead ? "default" : "pointer",
            zIndex: spriteZ,
          }}
        />
      )}

      {/* Corpse marker — universal skull-and-pack sprite that drops
          from just under eye height to foot height with a slight
          bounce/wobble/settle. Renders only when the combatant is dead.
          Variation chosen deterministically from combatant id so the
          same character always shows the same marker. Tooltip "The
          bloody remains of …" reflects the post-fight loot affordance.
          Z-Layer 10 (per Scotch 2026-05-09) so it sits above all
          living sprites and gore. */}
      {isDead && scale?.ready && corpseMarkerRef.current && (() => {
        // Stacking math — each new body sits 80% of marker height up
        // from the body below (20% overlap on the bottom pack), capped
        // just under eye level so the pile never reaches the head of a
        // living combatant standing on the same lane spot. Z steps +2
        // per layer starting at 10 so a fresher body always renders on
        // top of an older one.
        const rawBottom = corpseStackIndex * CORPSE_STACK_OFFSET_PX;
        const bottomPx = Math.min(rawBottom, CORPSE_STACK_CAP_PX);
        const zIndex = CORPSE_STACK_Z_BASE + corpseStackIndex * CORPSE_STACK_Z_STEP;
        return (
          <div
            onMouseEnter={() => setCorpseHover(true)}
            onMouseLeave={() => setCorpseHover(false)}
            onClick={() => setPopover({ kind: "info", combatantId: c.id })}
            style={{
              position: "absolute",
              left: "50%",
              bottom: bottomPx,
              height: CORPSE_MARKER_HEIGHT_PX,
              transform: "translate(-50%, 0)",
              zIndex,
              cursor: "pointer",
              // CSS variable feeds the keyframe — start position is just
              // under the living figure's eye-line, MEASURED FROM THE
              // MARKER'S RESTING POSITION. On a tall pile the body has
              // less far to fall; clamped to a 40 px minimum so a tiny
              // drop is still visible at the cap.
              ["--corpse-drop-start" as string]: `${Math.max(
                40,
                Math.round(
                  scale.imgHeightPx * (1 - EYE_FROM_TOP_RATIO) - 30 - bottomPx,
                ),
              )}px`,
              animation: "le-corpse-drop 0.85s cubic-bezier(0.55, 0.1, 0.65, 1.4) forwards",
              filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.7))",
            }}
          >
            <img
              src={corpseMarkerRef.current}
              alt={`Remains of ${c.name}`}
              style={{
                height: "100%",
                maxWidth: "none",
                display: "block",
                pointerEvents: "none",
              }}
            />
            {/* Custom hover popover — shows instantly, no native-title
                delay. pointerEvents: none so the popover never breaks
                the hover state by sitting on top of the cursor. */}
            {corpseHover && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 6px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "Georgia, serif",
                  color: "#e8d4a0",
                  whiteSpace: "nowrap",
                  background: "linear-gradient(180deg, rgba(20,12,6,0.97) 0%, rgba(8,5,3,0.97) 100%)",
                  border: "1px solid rgba(146,64,14,0.7)",
                  borderRadius: 4,
                  boxShadow: "0 6px 14px rgba(0,0,0,0.85)",
                  pointerEvents: "none",
                  zIndex: 200,
                  textShadow: "0 1px 2px rgba(0,0,0,0.95)",
                }}
              >
                {corpseTooltipRef.current}
              </div>
            )}
          </div>
        );
      })()}

      {/* Quality-gate placeholder when sprite metadata is incomplete. */}
      {spritePath && !scale?.ready && (
        <div
          style={{
            width: 200,
            height: slotHeight,
            border: "2px dashed #9b2c2c",
            background: "rgba(0,0,0,0.3)",
            color: "#fbbf24",
            fontSize: 11,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            zIndex: spriteZ,
          }}
        >
          <strong>{c.name}</strong>
          <div style={{ marginTop: 4, color: "#f87171" }}>sprite unreviewed</div>
          <div style={{ marginTop: 6, fontSize: 9, color: "#aaa", wordBreak: "break-word" }}>
            {scaleError ?? "loading…"}
          </div>
          <div style={{ marginTop: 6, fontSize: 9 }}>
            review at <a href="/dev/sprite-review" style={{ color: "#7ec8ff" }}>/dev/sprite-review</a>
          </div>
        </div>
      )}

      {/* Name label below the sprite (temporary — Stage 2 replaces with status column).
          Fades out alongside the sprite when the combatant dies. The
          turn-rail still keeps the strike-through pip; this label just
          disappears with the body. */}
      <div
        style={{
          position: "absolute",
          bottom: -22,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 12,
          fontWeight: 700,
          color: teamColor,
          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
          opacity: isDead ? 0 : 1,
          transition: "opacity 0.5s ease",
          zIndex: 100,
        }}
      >
        {c.name}
      </div>
    </div>
  );
}

// ── HotbarStrip ─────────────────────────────────────────────
// Unified combat hotbar for one combatant — a single foot-anchored
// vertical stack containing (top → bottom):
//   1. Name
//   2. HP horizontal bar
//   3. Mana horizontal bar (gated on c.maxMana > 0)
//   4. Active-effect chips (up to 4)
//   5. 2×2 potion grid (painted ItemIcon graphics)
//   6. 2×2 spell grid (SpellIcon — first 4 of c.combatHotbar)
//   7. Spellbook button (📖) — opens the read-only spellbook modal
//
// Visibility uniform across every combatant — hover-revealed +
// state-delta auto-pop via the useColumnVisibility signature wired in
// the parent Slot. No always-visible exception for the hero.
//
// Position: absolute, anchored at the slot's bottom-center. Strip
// background is a faint chip-only gradient (no opaque panel) so the
// sprite's silhouette reads through.

const HOTBAR_WIDTH_PX = 86;

function HotbarStrip({
  c,
  teamColor,
  visible,
  isActive,
  loading,
  isPlayerActor,
  spells,
  knownSet,
  potions,
  hasKnownSpells,
  onSpellClick,
  onPotionClick,
  onOpenSpellbook,
  onStrikeClick,
  onFleeClick,
}: {
  c: CombatantState;
  teamColor: string;
  visible: boolean;
  isActive: boolean;
  loading: boolean;
  isPlayerActor: boolean;
  spells: string[];
  knownSet: Set<string>;
  potions: { itemId: string; quantity: number }[];
  hasKnownSpells: boolean;
  onSpellClick: (spellName: string) => ClickHandler;
  onPotionClick: (item: Item) => ClickHandler;
  onOpenSpellbook: () => void;
  onStrikeClick: ClickHandler;
  onFleeClick: ClickHandler;
}): React.JSX.Element {
  const interactable = isPlayerActor && !loading;
  return (
    <div
      style={{
        position: "absolute",
        bottom: -4,
        left: "50%",
        transform: "translateX(-50%)",
        width: HOTBAR_WIDTH_PX,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 4,
        padding: 4,
        borderRadius: 5,
        // Active-actor cue: gold border (matches turn-rail accent).
        // No border otherwise so the strip stays light.
        border: isActive ? `1px solid ${teamColor}` : "1px solid transparent",
        boxShadow: isActive ? `0 0 8px ${teamColor}55` : "none",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        // Above sprite (so clicks land on the icons), below the active-
        // actor indicator (z=100) and below popovers (z>=200).
        zIndex: 60,
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Name */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textAlign: "center",
          color: teamColor,
          textShadow: "0 1px 2px rgba(0,0,0,0.95)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          background: "rgba(8,5,3,0.7)",
          padding: "2px 4px",
          borderRadius: 3,
        }}
      >
        {c.name}
      </div>

      {/* HP bar */}
      <HBar current={c.hp} max={c.maxHp} fill="#dc2626" label="HP" />

      {/* Mana bar — gated on maxMana > 0 so non-casters (bandit_brute)
          don't render an awkward 0-width bar. */}
      {c.maxMana > 0 && (
        <HBar current={c.mana} max={c.maxMana} fill="#3b82f6" label="Mana" />
      )}

      {/* Active-effect chips. Max 4 — the strip is narrow. */}
      {c.activeEffects.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            flexWrap: "wrap",
            background: "rgba(8,5,3,0.5)",
            borderRadius: 3,
            padding: "2px 1px",
          }}
        >
          {c.activeEffects.slice(0, 4).map((e, i) => (
            <EffectMarkerIcon
              key={i}
              effectType={e.type}
              severity={e.severity}
              size={14}
              turnsRemaining={e.turnsRemaining}
            />
          ))}
        </div>
      )}

      {/* Potion grid — 2×2, painted ItemIcon graphics. */}
      {potions.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 3,
            justifyItems: "center",
            background: "rgba(8,5,3,0.5)",
            borderRadius: 3,
            padding: 3,
          }}
        >
          {potions.slice(0, 4).map((entry) => {
            const item = ITEMS[entry.itemId];
            if (!item) return null;
            return (
              <ItemIcon
                key={entry.itemId}
                item={item}
                size={32}
                quantity={entry.quantity}
                tooltip={`${item.name} ×${entry.quantity}`}
                onClick={interactable ? onPotionClick(item) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Spell grid — 2×2 from the first 4 hotbar slots. */}
      {spells.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 3,
            justifyItems: "center",
            background: "rgba(8,5,3,0.5)",
            borderRadius: 3,
            padding: 3,
          }}
        >
          {spells.slice(0, 4).map((spellName, i) => {
            const spell = findSpell(spellName);
            if (!spell) {
              return (
                <div
                  key={`s-${i}`}
                  title={`unknown spell: ${spellName}`}
                  style={{
                    width: 22,
                    height: 22,
                    border: "1px dashed rgba(146,64,14,0.4)",
                    borderRadius: 3,
                  }}
                />
              );
            }
            return (
              <SpellIcon
                key={`s-${i}`}
                spell={spell}
                known={knownSet.has(spell.name)}
                loading={loading || !isPlayerActor}
                onClick={onSpellClick(spell.name)}
              />
            );
          })}
        </div>
      )}

      {/* Action row — STRIKE / FLEE / Spellbook. STRIKE + FLEE render
          for every player-controlled combatant (hero AND any player-
          driven ally) so the player can SEE their options regardless of
          whose turn it is; the buttons dim when it's not that combatant's
          turn. Spellbook is informational for everyone with knownSpells. */}
      {(c.controlledBy === "player" || hasKnownSpells) && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            background: "rgba(8,5,3,0.5)",
            borderRadius: 3,
            padding: 3,
          }}
        >
          {c.controlledBy === "player" && (
            <ActionButton
              title={isPlayerActor ? "Strike — pick body zone" : "Strike (not this combatant's turn)"}
              disabled={loading || !isPlayerActor}
              color="#f87171"
              onClick={onStrikeClick}
            >
              ⚔
            </ActionButton>
          )}
          {c.controlledBy === "player" && (
            <ActionButton
              title={isPlayerActor ? "Flee — break off and run" : "Flee (not this combatant's turn)"}
              disabled={loading || !isPlayerActor}
              color="#a3a3a3"
              onClick={onFleeClick}
            >
              🏃
            </ActionButton>
          )}
          {hasKnownSpells && (
            <ActionButton
              title={`Open ${c.name}'s spellbook`}
              disabled={loading}
              color="#fbbf24"
              onClick={onOpenSpellbook}
            >
              📖
            </ActionButton>
          )}
        </div>
      )}
    </div>
  );
}

// Compact action button for the hotbar's bottom row (STRIKE / FLEE /
// Spellbook). Color drives both the border tint and the glyph color so
// the three buttons stay visually distinct.
function ActionButton({
  title,
  disabled,
  color,
  onClick,
  children,
}: {
  title: string;
  disabled: boolean;
  color: string;
  onClick: ClickHandler | (() => void);
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      onClick={onClick as unknown as React.MouseEventHandler<HTMLButtonElement>}
      disabled={disabled}
      title={title}
      style={{
        width: 26,
        height: 22,
        padding: 0,
        background: `radial-gradient(circle at 50% 45%, ${color}${disabled ? "11" : "33"} 0%, rgba(0,0,0,0.6) 70%)`,
        border: `1px solid ${color}${disabled ? "44" : "88"}`,
        borderRadius: 3,
        color,
        fontSize: 12,
        lineHeight: 1,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
        filter: disabled ? "grayscale(0.5)" : "none",
        transition: "opacity 0.15s, filter 0.15s",
        fontFamily: "Georgia, serif",
      }}
    >
      {children}
    </button>
  );
}

// ── HBar ────────────────────────────────────────────────────
// Tiny horizontal bar for HP / mana inside the hotbar. Inlined here
// rather than added as a sibling of `VerticalBar` because we only need
// it in one place and the geometry is fundamentally different.

function HBar({
  current,
  max,
  fill,
  label,
}: {
  current: number;
  max: number;
  fill: string;
  label: string;
}): React.JSX.Element {
  const [hover, setHover] = useState(false);
  const pct = max > 0 ? Math.max(0, current) / max : 0;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        width: "100%",
        height: 6,
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 2,
      }}
    >
      <div
        style={{
          width: `${pct * 100}%`,
          height: "100%",
          background: `linear-gradient(180deg, ${fill}ee 0%, ${fill} 100%)`,
          boxShadow: `0 0 4px ${fill}60`,
          borderRadius: 2,
          transition: "width 0.4s ease",
        }}
      />
      {/* Custom hover popover — shows instantly (no native-title delay)
          and uses the combat-UI styling. Positioned above the bar so it
          doesn't fight the hotbar's other rows below. pointerEvents
          none so the popover never breaks the hover state by sitting
          on top of the cursor. */}
      {hover && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "3px 7px",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            color: fill,
            whiteSpace: "nowrap",
            background: "linear-gradient(180deg, rgba(20,12,6,0.97) 0%, rgba(8,5,3,0.97) 100%)",
            border: `1px solid ${fill}88`,
            borderRadius: 3,
            boxShadow: "0 4px 12px rgba(0,0,0,0.7)",
            pointerEvents: "none",
            zIndex: 200,
            textShadow: "0 1px 2px rgba(0,0,0,0.95)",
          }}
        >
          {label} {current}/{max}
        </div>
      )}
    </div>
  );
}

// ── projectile coordinate helper ────────────────────────────
// Both BlastStreak and FireboltStreak need the same DOM-measurement
// dance: read source + target sprite refs, compute caster-chest →
// target-center coordinates plus rotation angle. Hook keeps the math
// in one place.

function useProjectileCoords(
  sourceId: string,
  targetId: string,
  spriteRefs: React.MutableRefObject<Map<string, HTMLElement>>,
): { x1: number; y1: number; distance: number; angle: number } | null {
  const [coords, setCoords] = useState<{
    x1: number;
    y1: number;
    distance: number;
    angle: number;
  } | null>(null);

  useLayoutEffect(() => {
    const src = spriteRefs.current.get(sourceId);
    const tgt = spriteRefs.current.get(targetId);
    if (!src || !tgt) return;
    const s = src.getBoundingClientRect();
    const t = tgt.getBoundingClientRect();
    const x1 = s.left + s.width / 2;
    const y1 = s.top + s.height / 3; // chest height of caster
    const x2 = t.left + t.width / 2;
    const y2 = t.top + t.height / 2; // center of target
    const dx = x2 - x1;
    const dy = y2 - y1;
    setCoords({
      x1,
      y1,
      distance: Math.hypot(dx, dy),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    });
  }, [sourceId, targetId, spriteRefs]);

  return coords;
}

// ── BlastStreak ─────────────────────────────────────────────
// White lance of stormlight from caster sprite to target sprite.
// Fires whenever the dev page emits a fresh `lastBlast` (key bumps per
// cast so the same source/target pair re-fires). Reads sprite refs at
// mount time to capture screen coordinates; the streak is rendered as
// a single rotated <div> with a CSS gradient + box-shadow halo.

function BlastStreak({
  sourceId,
  targetId,
  spriteRefs,
}: {
  sourceId: string;
  targetId: string;
  spriteRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}): React.JSX.Element | null {
  const coords = useProjectileCoords(sourceId, targetId, spriteRefs);
  if (!coords) return null;
  // Target screen coords for the smoke wisp — same trick as the firebolt
  // impact bursts (sibling fixed divs in viewport space, not children of
  // the rotated streak container).
  const angleRad = (coords.angle * Math.PI) / 180;
  const targetX = coords.x1 + coords.distance * Math.cos(angleRad);
  const targetY = coords.y1 + coords.distance * Math.sin(angleRad);
  return (
    <>
      {/* The white lance itself. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: coords.x1,
          top: coords.y1 - 2,
          width: coords.distance,
          height: 4,
          background:
            "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(220,240,255,0.92) 50%, rgba(255,255,255,1) 100%)",
          boxShadow:
            "0 0 10px rgba(255,255,255,0.95), 0 0 24px rgba(220,240,255,0.7), 0 0 48px rgba(180,210,255,0.45)",
          borderRadius: 2,
          transform: `rotate(${coords.angle}deg)`,
          transformOrigin: "0 50%",
          zIndex: 250,
          pointerEvents: "none",
          animation: "le-blast-streak 0.5s ease-out forwards",
        }}
      />
      {/* Smoke wisp — main puff. Begins as the streak resolves (0.4s),
          rises ~100px while expanding, fades over 1.2s. Dark grey with a
          subtle warm tint so it reads as residual heat. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: targetX,
          top: targetY,
          width: 38,
          height: 38,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(60,60,65,0.85) 0%, rgba(45,45,50,0.65) 45%, rgba(30,30,35,0.35) 75%, transparent 100%)",
          filter: "blur(2px)",
          transform: "translate(-50%, 0) scale(0.4)",
          opacity: 0,
          zIndex: 249,
          pointerEvents: "none",
          animation: "le-blast-smoke 1.2s ease-out 0.4s forwards",
        }}
      />
      {/* Smoke wisp — secondary smaller follow-up puff for depth. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: targetX,
          top: targetY,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(80,80,85,0.75) 0%, rgba(55,55,60,0.5) 50%, transparent 100%)",
          filter: "blur(1.5px)",
          transform: "translate(-50%, 0) scale(0.4)",
          opacity: 0,
          zIndex: 249,
          pointerEvents: "none",
          animation: "le-blast-smoke 1.0s ease-out 0.55s forwards",
        }}
      />
    </>
  );
}

// ── FireboltStreak ──────────────────────────────────────────
// Fiery bolt from caster to target with an orange-yellow tapered tail.
// The shape is a triangle — narrow at the caster (a tail point), wide
// at the target (the bolt head) — with a gradient from transparent
// near the caster up to white-hot at the bolt head. A small glowing
// ball sits at the target end as the bolt itself.

function FireboltStreak({
  sourceId,
  targetId,
  spriteRefs,
}: {
  sourceId: string;
  targetId: string;
  spriteRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}): React.JSX.Element | null {
  const coords = useProjectileCoords(sourceId, targetId, spriteRefs);
  if (!coords) return null;
  const TAIL_HEIGHT_PX = 20;
  // Target coords for the impact bursts. The streak's container is
  // rotated, so impact divs CANNOT live inside it (they'd inherit the
  // rotation and look elliptical). Sibling fixed-position divs live in
  // viewport space and stay perfectly circular regardless of bolt
  // angle.
  const angleRad = (coords.angle * Math.PI) / 180;
  const targetX = coords.x1 + coords.distance * Math.cos(angleRad);
  const targetY = coords.y1 + coords.distance * Math.sin(angleRad);
  const IMPACT_GRADIENT =
    "radial-gradient(circle, rgba(255,200,80,0.95) 0%, rgba(255,120,0,0.78) 30%, rgba(190,40,0,0.5) 60%, rgba(110,20,0,0.18) 85%, transparent 100%)";
  return (
    <>
      {/* Streak — rotated container holding the wedge tail + bolt
          head core. Animated via opacity only so the rotate inline
          transform isn't clobbered by the keyframes. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: coords.x1,
          top: coords.y1 - TAIL_HEIGHT_PX / 2,
          width: coords.distance,
          height: TAIL_HEIGHT_PX,
          transform: `rotate(${coords.angle}deg)`,
          transformOrigin: "0 50%",
          zIndex: 250,
          pointerEvents: "none",
          animation: "le-firebolt-streak 0.6s ease-out forwards",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: "polygon(0 50%, 100% 0, 100% 100%)",
            background:
              "linear-gradient(90deg, rgba(255,140,0,0) 0%, rgba(255,140,0,0.5) 28%, rgba(255,170,0,0.85) 65%, rgba(255,230,80,1) 100%)",
            boxShadow:
              "0 0 14px rgba(255,140,0,0.7), 0 0 32px rgba(255,180,0,0.5)",
            filter: "blur(0.5px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -12,
            top: "50%",
            width: 24,
            height: 24,
            transform: "translateY(-50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, #fff7c2 0%, #ffd166 40%, #ff8c00 80%, transparent 100%)",
            boxShadow:
              "0 0 22px rgba(255,180,0,0.95), 0 0 44px rgba(255,140,0,0.65)",
          }}
        />
      </div>

      {/* Impact burst 1 — instant flash on the target right after the
          streak resolves. Tight, bright, quick fade. Delay 0.5 s so it
          fires as the streak's bolt head reaches the target. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: targetX,
          top: targetY,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: IMPACT_GRADIENT,
          filter: "blur(2px)",
          transform: "translate(-50%, -50%) scale(0.4)",
          opacity: 0,
          zIndex: 251,
          pointerEvents: "none",
          animation: "le-firebolt-impact-1 0.45s ease-out 0.5s forwards",
        }}
      />

      {/* Impact burst 2 — secondary shockwave, larger and slower than
          the first. Fires after the first finishes (delay 0.95 s) and
          eases out over a longer 1.1 s so the heat lingers. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: targetX,
          top: targetY,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: IMPACT_GRADIENT,
          filter: "blur(4px)",
          transform: "translate(-50%, -50%) scale(0.5)",
          opacity: 0,
          zIndex: 250,
          pointerEvents: "none",
          animation: "le-firebolt-impact-2 1.1s ease-out 0.95s forwards",
        }}
      />
    </>
  );
}

// ── StrikeFxLayer ───────────────────────────────────────────
// Drives the four strike sub-FX off a single `lastStrike` signal:
//   1. Source sprite lunge — full traversal toward the target via
//      Element.animate() so the existing inline transform (translateX +
//      optional scaleX flip) composes cleanly with the lunge offset.
//   2. Target sprite reaction — axial knockback (hit/crit/blocked/
//      armorStopped) or perpendicular dodge (evaded). Delayed by the
//      contact frame so it visually coincides with the lunge peak.
//   3. Zone-anchored impact burst — white-hot core fading to dark
//      crimson, positioned by the target's body-zone vertical anchor
//      (head ≈ eye-Y, neck ≈ throat, torso = center, limbs = lower).
//   4. Crit gore — bigger dual-burst + 4 droplets fanning along the
//      strike axis. Stacked on top of the standard impact when
//      outcome === "crit".
//
// Outcomes: hit / crit / evaded / blocked / armorStopped / criticalFail.
// Outcomes that don't fire impact: evaded / blocked / armorStopped /
// criticalFail. The dodge/recoil animation still plays for those.

// Z-index bumping during the lunge — ref-counted so overlapping strikes
// on the same sprite still restore to the ORIGINAL value. Without this
// the second strike's "captured original" would be the first strike's
// bumped value (120), leaving the sprite stuck above the hotbar. The
// WeakMap ties the saved original to the DOM node lifetime.
const STRIKE_Z_BUMP = "120";
const STRIKE_Z_REFS = new WeakMap<HTMLElement, { count: number; original: string }>();
function bumpStrikeZ(el: HTMLElement): void {
  const cur = STRIKE_Z_REFS.get(el);
  if (cur) {
    cur.count += 1;
  } else {
    STRIKE_Z_REFS.set(el, { count: 1, original: el.style.zIndex });
    el.style.zIndex = STRIKE_Z_BUMP;
  }
}
function releaseStrikeZ(el: HTMLElement): void {
  const cur = STRIKE_Z_REFS.get(el);
  if (!cur) return;
  cur.count -= 1;
  if (cur.count <= 0) {
    el.style.zIndex = cur.original;
    STRIKE_Z_REFS.delete(el);
  }
}

// Strike timing — three phases. The attacker stays AT the target for
// the hold so all reactive FX (dodge, hit-flash, gore, knockback) play
// while the source is "standing over" the target.
const STRIKE_LUNGE_IN_MS    = 300;
const STRIKE_HOLD_MS        = 2000;
const STRIKE_LUNGE_OUT_MS   = 300;
const STRIKE_TOTAL_MS       = STRIKE_LUNGE_IN_MS + STRIKE_HOLD_MS + STRIKE_LUNGE_OUT_MS; // 2600
const STRIKE_CONTACT_DELAY_MS = STRIKE_LUNGE_IN_MS; // when target reactions fire

const STRIKE_REACT_PARAMS: Record<
  "hit" | "crit" | "evaded" | "blocked" | "armorStopped" | "criticalFail",
  { kind: "dodge" | "knockback" | "recoil" | "none"; magnitude: number; duration: number }
> = {
  // Defensive shrink + forward pitch (toward attacker), then return.
  // No translation — the duck-and-weave reads as a dodge, not a slide.
  evaded:       { kind: "dodge",     magnitude: 0,  duration: 700 },
  hit:          { kind: "knockback", magnitude: 30, duration: 500 },
  crit:         { kind: "knockback", magnitude: 55, duration: 600 },
  blocked:      { kind: "recoil",    magnitude: 10, duration: 300 },
  armorStopped: { kind: "recoil",    magnitude: 10, duration: 300 },
  criticalFail: { kind: "none",      magnitude: 0,  duration: 0   },
};

const STRIKE_ZONE_ANCHOR_Y_FRACTION: Record<BodyZone, number> = {
  head:  0.12,
  neck:  0.22,
  torso: 0.50,
  limbs: 0.78,
};

function StrikeFxLayer({
  lastStrike,
  spriteRefs,
}: {
  lastStrike?: NonNullable<CombatArenaProps["lastStrike"]>;
  spriteRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}): React.JSX.Element | null {
  const [derived, setDerived] = useState<{
    impactX: number;
    impactY: number;
    headX: number;
    headTopY: number;
    angleDeg: number;
    outcome: NonNullable<CombatArenaProps["lastStrike"]>["outcome"];
    damage: number;
    key: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!lastStrike) return;
    const src = spriteRefs.current.get(lastStrike.sourceId);
    const tgt = spriteRefs.current.get(lastStrike.targetId);
    if (!src || !tgt) return;
    const s = src.getBoundingClientRect();
    const t = tgt.getBoundingClientRect();
    const sourceCx = s.left + s.width / 2;
    const sourceCy = s.top + s.height / 2;
    const targetCx = t.left + t.width / 2;
    const targetCy = t.top + t.height / 2;
    const dx = targetCx - sourceCx;
    const dy = targetCy - sourceCy;
    const angleRad = Math.atan2(dy, dx);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // ── Source lunge ──
    // The sprite's existing inline transform is `translateX(-50%) [scaleX(-1)]`.
    // CRITICAL: `scaleX(-1)` mirrors any X-translate that comes AFTER it in the
    // transform list. So the lunge translate must be placed BEFORE scaleX(-1)
    // — otherwise a flipped sprite (every enemy) lunges in the WRONG direction.
    //
    // Vertical component is forced to 0: sprites are foot-anchored on a shared
    // ground line, so the lunge is purely horizontal. Without this, striking a
    // taller target produces a NEGATIVE dy and the attacker visibly floats up
    // off the ground.
    //
    // 30% overlap (locked 2026-05-09): stop short by 70% of the target's
    // width so the target stays mostly visible behind the lunger. Without
    // the overlap clamp the source center sat exactly on target center.
    const srcFlipped = (src.style.transform || "").includes("scaleX(-1)");
    const srcSuffix = srcFlipped ? " scaleX(-1)" : "";
    const dxSign = Math.sign(dx) || 1;
    const dxLunge = dxSign * Math.max(0, Math.abs(dx) - 0.7 * t.width);
    const srcRestT = `translateX(-50%) translate(0, 0)${srcSuffix}`;
    const srcPeakT = `translateX(-50%) translate(${dxLunge}px, 0)${srcSuffix}`;
    const offsetIn  = STRIKE_LUNGE_IN_MS / STRIKE_TOTAL_MS;             // 0.115
    const offsetOut = (STRIKE_LUNGE_IN_MS + STRIKE_HOLD_MS) / STRIKE_TOTAL_MS; // 0.885
    const lungeKeyframes: Keyframe[] =
      lastStrike.outcome === "criticalFail"
        ? [
            // Stumble pattern — overshoots back twice during the hold
            // before settling. Stays in the target's vicinity throughout.
            { transform: srcRestT, offset: 0, easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
            { transform: srcPeakT, offset: offsetIn, easing: "linear" },
            { transform: `translateX(-50%) translate(${dxLunge * 0.75}px, 0)${srcSuffix}`, offset: 0.30, easing: "linear" },
            { transform: srcPeakT, offset: 0.50, easing: "linear" },
            { transform: `translateX(-50%) translate(${dxLunge * 0.85}px, 0)${srcSuffix}`, offset: 0.65, easing: "linear" },
            { transform: srcPeakT, offset: offsetOut, easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
            { transform: srcRestT, offset: 1 },
          ]
        : [
            { transform: srcRestT, offset: 0, easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
            { transform: srcPeakT, offset: offsetIn, easing: "linear" },
            { transform: srcPeakT, offset: offsetOut, easing: "cubic-bezier(0.4, 0, 0.6, 1)" },
            { transform: srcRestT, offset: 1 },
          ];
    // Bump source above target during the lunge so the sprites overlap
    // correctly (source on top). Ref-counted via WeakMap so overlapping
    // strikes on the same sprite still restore to the ORIGINAL z, not
    // the bumped one.
    bumpStrikeZ(src);
    const lungeAnim = src.animate(lungeKeyframes, {
      duration: STRIKE_TOTAL_MS,
      fill: "none",
    });
    const restoreZ = () => releaseStrikeZ(src);
    lungeAnim.onfinish = restoreZ;
    lungeAnim.oncancel = restoreZ;
    // Safety net: if onfinish/oncancel doesn't fire (e.g. element removed
    // mid-animation, browser quirk), force the release after the full
    // duration so the sprite never gets stuck above the hotbar.
    setTimeout(() => releaseStrikeZ(src), STRIKE_TOTAL_MS + 200);

    // ── Target reaction ──
    // Fires at the contact frame (after the lunge in) so it plays during
    // the source's 2-sec hold over the target. Same flip-safe transform
    // composition as the source lunge.
    const r = STRIKE_REACT_PARAMS[lastStrike.outcome];
    const tgtFlipped = (tgt.style.transform || "").includes("scaleX(-1)");
    const tgtSuffix = tgtFlipped ? " scaleX(-1)" : "";
    const tgtRestT = `translateX(-50%) translate(0, 0)${tgtSuffix}`;
    if (r.kind === "dodge") {
      // Defensive shrink + forward pitch (toward attacker). Pitch
      // direction is set by the target's screen side: enemy (right of
      // source) pitches LEFT, ally (left of source) pitches RIGHT — both
      // lean TOWARD the attacker as a duck-and-weave. Rotate is placed
      // BEFORE scaleX(-1) so a flipped sprite still rotates in the same
      // VISUAL direction.
      const pitchDeg = sourceCx < targetCx ? -8 : 8;
      const dodgeT = `translateX(-50%) translate(0, 0) rotate(${pitchDeg}deg)${tgtSuffix} scale(0.92)`;
      tgt.animate(
        [
          { transform: tgtRestT, offset: 0 },
          { transform: dodgeT, offset: 0.4 },
          { transform: tgtRestT, offset: 1 },
        ],
        { duration: r.duration, delay: STRIKE_CONTACT_DELAY_MS, easing: "ease-out", fill: "none" },
      );
    } else if ((r.kind === "knockback" || r.kind === "recoil") && r.magnitude > 0) {
      // Horizontal-only knockback away from source — sign by screen
      // position, not by atan2 angle, so vertical chest-vs-center
      // differences don't lift the target off the ground.
      const direction = sourceCx < targetCx ? 1 : -1;
      const rdx = direction * r.magnitude;
      const tgtPeakT = `translateX(-50%) translate(${rdx}px, 0)${tgtSuffix}`;
      tgt.animate(
        [
          { transform: tgtRestT, offset: 0 },
          { transform: tgtPeakT, offset: 0.4 },
          { transform: tgtRestT, offset: 1 },
        ],
        { duration: r.duration, delay: STRIKE_CONTACT_DELAY_MS, easing: "ease-out", fill: "none" },
      );
    }

    // ── Impact / gore positioning ──
    const zoneFraction = STRIKE_ZONE_ANCHOR_Y_FRACTION[lastStrike.zone];
    setDerived({
      impactX: targetCx,
      impactY: t.top + t.height * zoneFraction,
      // Damage popup origin — just above the target's head (top of rect
      // minus a small gap). Centered horizontally on target.
      headX: targetCx,
      headTopY: t.top - 8,
      angleDeg: (angleRad * 180) / Math.PI,
      outcome: lastStrike.outcome,
      damage: lastStrike.damage,
      key: lastStrike.key,
    });
    // sourceCy is captured for parity with sourceCx — unused beyond the
    // lunge math but kept for clarity in case future polish (e.g. arc
    // trajectories) needs it.
    void sourceCy;
  }, [lastStrike?.key, spriteRefs, lastStrike]);

  if (!derived) return null;
  const showImpact = derived.outcome === "hit" || derived.outcome === "crit";
  if (!showImpact) return null;
  // The damage-number popup moved to per-Slot HP-decrement detection
  // (2026-05-09) so it fires for ALL HP loss — strikes, spell damage,
  // bleed/poison ticks. The Slot reads `lastStrike` for crit annotation.
  return (
    <StrikeImpactBurst
      key={`strike-${derived.key}`}
      x={derived.impactX}
      y={derived.impactY}
      angleDeg={derived.angleDeg}
      isCrit={derived.outcome === "crit"}
    />
  );
}

// Slot-anchored floating damage popup. Mounts when a Slot detects an
// HP decrement (any source: strike, spell, bleed/poison tick). Anchored
// to the sprite's head via absolute positioning relative to the Slot's
// stacking context. Rises 110 px, fades, and shrinks over 3 seconds.
// On crits (matched via `lastStrike` at the Slot level), an orange
// "Critical hit!" prefix is prepended.
function SlotDamagePopup({
  amount,
  isCrit,
  spriteHeightPx,
  offsetBelowPx,
}: {
  amount: number;
  isCrit: boolean;
  spriteHeightPx: number;
  offsetBelowPx: number;
}): React.JSX.Element {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        // Anchor just above the sprite's head (sprite top + small gap).
        bottom: `${offsetBelowPx + spriteHeightPx + 6}px`,
        transform: "translate(-50%, 0) scale(0.7)",
        opacity: 0,
        zIndex: 260,
        pointerEvents: "none",
        fontFamily: "Georgia, serif",
        fontWeight: 800,
        fontSize: isCrit ? 22 : 20,
        whiteSpace: "nowrap",
        textShadow:
          "0 1px 0 rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.85), 0 0 12px rgba(0,0,0,0.6)",
        animation: "le-damage-float 3s ease-out forwards",
      }}
    >
      {isCrit && (
        <span style={{ color: "#fb923c", marginRight: 6 }}>Critical hit!</span>
      )}
      <span style={{ color: "#ef4444" }}>{amount} HP damage</span>
    </div>
  );
}

// White-and-dark-red burst at the target's body-zone anchor point.
// On crit, layers a bigger crimson burst + droplet fan on top.
//
// Timing (revised 2026-05-09): impact + gore start 0.1s AFTER the
// attacker arrives at the target. Lunge-in is 0.3s, so the FX delay
// from strike-start is 0.3 + 0.1 = 0.4s.
const STRIKE_IMPACT_DELAY_S = 0.4;

function StrikeImpactBurst({
  x,
  y,
  angleDeg,
  isCrit,
}: {
  x: number;
  y: number;
  angleDeg: number;
  isCrit: boolean;
}): React.JSX.Element {
  // Lock droplet trajectories on mount — useMemo with [] keeps the
  // randomized fan stable for the lifetime of this component (which
  // remounts per-strike via the parent's `key` prop).
  const droplets = useMemo(() => {
    if (!isCrit) return [] as Array<{ dx: number; dy: number; delay: number }>;
    const baseRad = (angleDeg * Math.PI) / 180;
    const out: Array<{ dx: number; dy: number; delay: number }> = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * (50 * Math.PI / 180); // ±25°
      const ang = baseRad + spread;
      const mag = 30 + Math.random() * 30;
      out.push({
        dx: Math.cos(ang) * mag,
        dy: Math.sin(ang) * mag + 10, // small downward drift
        delay: i * 0.04,
      });
    }
    return out;
  }, [angleDeg, isCrit]);
  return (
    <>
      {/* Standard hit-flash — white core into dark-red ring. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: x,
          top: y,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,200,200,0.85) 25%, rgba(170,20,20,0.7) 55%, rgba(70,8,8,0.25) 82%, transparent 100%)",
          filter: "blur(1px)",
          transform: "translate(-50%, -50%) scale(0.4)",
          opacity: 0,
          zIndex: 250,
          pointerEvents: "none",
          animation: `le-strike-impact 0.45s ease-out ${STRIKE_IMPACT_DELAY_S}s forwards`,
        }}
      />
      {isCrit && (
        <>
          {/* Gore burst 1 — inner, fast. */}
          <div
            aria-hidden
            style={{
              position: "fixed",
              left: x,
              top: y,
              width: 110,
              height: 110,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,240,240,0.95) 0%, rgba(220,40,40,0.85) 30%, rgba(120,15,15,0.55) 65%, transparent 100%)",
              filter: "blur(1px)",
              transform: "translate(-50%, -50%) scale(0.4)",
              opacity: 0,
              zIndex: 251,
              pointerEvents: "none",
              animation: `le-gore-burst-1 0.55s ease-out ${STRIKE_IMPACT_DELAY_S + 0.05}s forwards`,
            }}
          />
          {/* Gore burst 2 — outer, slower. */}
          <div
            aria-hidden
            style={{
              position: "fixed",
              left: x,
              top: y,
              width: 170,
              height: 170,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(180,30,30,0.55) 0%, rgba(110,15,15,0.45) 50%, rgba(60,8,8,0.18) 80%, transparent 100%)",
              filter: "blur(3px)",
              transform: "translate(-50%, -50%) scale(0.6)",
              opacity: 0,
              zIndex: 250,
              pointerEvents: "none",
              animation: `le-gore-burst-2 0.95s ease-out ${STRIKE_IMPACT_DELAY_S + 0.15}s forwards`,
            }}
          />
          {/* Droplet fan — 4 droplets along strike axis ±25°. */}
          {droplets.map((d, i) => (
            <div
              key={`droplet-${i}`}
              aria-hidden
              style={{
                position: "fixed",
                left: x,
                top: y,
                width: 8 + (i % 2) * 2,
                height: 8 + (i % 2) * 2,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #fecaca 0%, #b91c1c 35%, #7f1d1d 75%, transparent 100%)",
                transform: "translate(-50%, -50%)",
                ["--droplet-dx-px" as string]: `${d.dx}px`,
                ["--droplet-dy-px" as string]: `${d.dy}px`,
                opacity: 0,
                zIndex: 252,
                pointerEvents: "none",
                animation: `le-gore-droplet 0.55s ease-out ${STRIKE_IMPACT_DELAY_S + d.delay}s forwards`,
                boxShadow: "0 0 4px rgba(120,8,8,0.7)",
              }}
            />
          ))}
        </>
      )}
    </>
  );
}

// ── CleanseFlash ────────────────────────────────────────────
// Pink-white concentric ring expanding from target's center.
function CleanseFlash({
  targetId,
  spriteRefs,
}: {
  targetId: string;
  spriteRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}): React.JSX.Element | null {
  const [pos, setPos] = useState<{ x: number; y: number; size: number } | null>(null);
  useLayoutEffect(() => {
    const el = spriteRefs.current.get(targetId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      size: Math.max(r.width, r.height) * 1.4,
    });
  }, [targetId, spriteRefs]);
  if (!pos) return null;
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: pos.size,
        height: pos.size,
        borderRadius: "50%",
        border: "3px solid rgba(255,240,250,0.95)",
        background:
          "radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,210,230,0.3) 50%, rgba(255,180,210,0.15) 80%, transparent 100%)",
        boxShadow:
          "0 0 24px rgba(255,220,235,0.85), inset 0 0 18px rgba(255,230,245,0.7)",
        opacity: 0,
        transform: "translate(-50%, -50%) scale(0.3)",
        zIndex: 249,
        pointerEvents: "none",
        animation: "le-cleanse-flash 0.6s ease-out forwards",
      }}
    />
  );
}

// ── Aura ────────────────────────────────────────────────────
// Persistent oval aura around a sprite that fades in solid on cast and
// settles to a faint translucent state for the rest of the buff's
// duration. Used by WARD (blue) and HASTE (yellow). Mounts when the
// matching activeEffect first appears on the combatant; unmounts when
// the engine ticks the effect off.
//
// Animation: opacity 0 → 1 (cast flash) → 0.22 (faint persistent).
// `animation-fill-mode: forwards` holds the end-state until the element
// unmounts.

function Aura({
  scaleWidthPx,
  scaleHeightPx,
  offsetBelowPx,
  color,
  spriteZ,
}: {
  scaleWidthPx: number;
  scaleHeightPx: number;
  offsetBelowPx: number;
  color: string;
  spriteZ: number;
}): React.JSX.Element {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        bottom: `${offsetBelowPx}px`,
        width: `${scaleWidthPx * 0.95}px`,
        height: `${scaleHeightPx * 0.92}px`,
        transform: "translateX(-50%)",
        borderRadius: "50%",
        border: `2px solid ${color}`,
        boxShadow: `inset 0 0 32px ${color}, 0 0 14px ${color}`,
        animation: "le-aura-cast 5s ease-out forwards",
        // Sit BEHIND the sprite (sprite is at spriteZ; subtract a small
        // fraction so the character appears inside its aura). Positive
        // enough to stay above the heal-glow at spriteZ - 0.5.
        zIndex: spriteZ - 0.4,
        pointerEvents: "none",
      }}
    />
  );
}

// ── CombatLogPanel ──────────────────────────────────────────
// Round-banner + glyph format. Replaces the placeholder slice(-3) flat
// list. Strike / cast / heal / death lines get distinguishing icons; the
// last 50 lines render in a scrollable bottom panel.

function classifyLogLine(line: string): { glyph: string | null; color: string } {
  if (/^─+\s*Round/i.test(line) || /^Round\s+\d+/i.test(line)) return { glyph: null, color: "#fbbf24" };
  if (/critically|critical hit/i.test(line)) return { glyph: "💥", color: "#ef4444" };
  if (/falls|dies|slain|dead/i.test(line)) return { glyph: "☠", color: "#9ca3af" };
  if (/heals?|restores?|knit/i.test(line)) return { glyph: "✨", color: "#fb7185" };
  if (/casts|weave|word of/i.test(line)) return { glyph: "🪄", color: "#a855f7" };
  if (/strikes?|swings?|hits?|stabs?|cleaves?/i.test(line)) return { glyph: "⚔", color: "#e8d4a0" };
  if (/drinks|applies|bind/i.test(line)) return { glyph: "🧪", color: "#22d3ee" };
  if (/refused|invalid|cannot/i.test(line)) return { glyph: "⊘", color: "#f87171" };
  return { glyph: null, color: "#cdb78a" };
}

function isRoundBanner(line: string): boolean {
  return /^─+\s*Round/i.test(line) || /^═+\s*Round/i.test(line) || /^Round\s+\d+/i.test(line);
}

// Cap visible log lines. Beyond this they're fully transparent so the
// stack visually trails off — this is the "etc until it disappears"
// requirement (2026-05-08).
const COMBAT_LOG_VISIBLE_LINES = 8;

// Per-distance render weights. Distance 0 = newest line (rendered at the
// BOTTOM of the bar). Each step up the bar gets dimmer + smaller until
// it's invisible past distance 6.
function logLineWeight(distance: number): {
  fontSize: number;
  fontWeight: 400 | 700;
  opacity: number;
} {
  if (distance === 0) return { fontSize: 14, fontWeight: 700, opacity: 1 };
  if (distance === 1) return { fontSize: 13, fontWeight: 400, opacity: 1 };
  // Beyond distance 1 the lines progressively fade and shrink. Capped
  // at fontSize 9 so legibility doesn't crater on the topmost visible
  // line; opacity dies after distance ~5.
  const fontSize = Math.max(9, 13 - (distance - 1));
  const opacity = Math.max(0, 1 - (distance - 1) * 0.22);
  return { fontSize, fontWeight: 400, opacity };
}

function CombatLogPanel({ lines }: { lines: string[] }): React.JSX.Element {
  const tail = lines.slice(-COMBAT_LOG_VISIBLE_LINES);
  return (
    <div
      style={{
        position: "absolute",
        // Anchored well above the active-actor indicator's screen Y so
        // the narration bar sits in the open space between the lanes
        // and the top turn rail. Math: slot baseline 6vh + slot height
        // 460 + indicator offset 28 + 100 px gap = calc(6vh + 588px).
        // Per Scotch 2026-05-08: bumped 40 px at a time over multiple
        // passes (508 → 548 → 588) to land near the upper third of the
        // viewport, just below the turn rail.
        left: "50%",
        bottom: "calc(6vh + 588px)",
        transform: "translateX(-50%)",
        width: "60vw",
        padding: "6px 12px",
        background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 100%)",
        border: "1px solid rgba(146,64,14,0.45)",
        borderRadius: 4,
        color: "#cdb78a",
        textShadow: "0 1px 2px rgba(0,0,0,0.9)",
        zIndex: 5,
        fontFamily: "Georgia, serif",
        // Keep the bar's geometry stable as old lines fade — newest line
        // pinned to the bottom edge regardless of how many fade-visible
        // entries exist above it.
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        // Cap at a generous height so even with all 8 entries the bar
        // doesn't crowd the turn rail at the top of the screen.
        maxHeight: "30vh",
        pointerEvents: "none",
      }}
    >
      {tail.map((line, i) => {
        const distance = tail.length - 1 - i;
        const isBanner = isRoundBanner(line);
        if (isBanner) {
          // Round banners get their own crisp style — they don't fade
          // with distance, they just sit between rounds.
          return (
            <div
              key={i}
              style={{
                margin: "4px 0 2px",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#fbbf24",
                textAlign: "center",
                borderTop: "1px solid rgba(251,191,36,0.4)",
                borderBottom: "1px solid rgba(251,191,36,0.4)",
                padding: "3px 0",
              }}
            >
              {line.replace(/^[─═]+\s*/, "").replace(/\s*[─═]+$/, "")}
            </div>
          );
        }
        const { glyph, color } = classifyLogLine(line);
        const { fontSize, fontWeight, opacity } = logLineWeight(distance);
        return (
          <div
            key={i}
            style={{
              padding: "1px 0",
              fontSize,
              fontWeight,
              opacity,
              color,
              display: "flex",
              gap: 6,
              alignItems: "baseline",
              transition: "opacity 0.3s ease, font-size 0.3s ease, font-weight 0.3s ease",
            }}
          >
            {glyph && (
              <span aria-hidden style={{ fontSize: Math.max(fontSize - 2, 8), flexShrink: 0 }}>
                {glyph}
              </span>
            )}
            <span>{line}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── TurnRail ────────────────────────────────────────────────
// Initiative pips with → arrows between them. Current actor outlined
// gold. Dead pips struck through.

function TurnRail({ session }: { session: ActiveCombatSession }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        padding: "4px 10px",
        background: "rgba(0,0,0,0.55)",
        border: "1px solid rgba(146,64,14,0.45)",
        borderRadius: 4,
        zIndex: 10,
        maxWidth: "90vw",
      }}
    >
      <span
        style={{
          fontSize: 9,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#fbbf24",
          marginRight: 4,
        }}
      >
        R{session.roundNumber + 1}
      </span>
      {session.turnOrder.map((id, i) => {
        const c = session.combatants.find((x) => x.id === id);
        const isCurrent = i === session.currentTurnIdx;
        const isDead = !c || c.hp <= 0;
        const isAlly = c?.team === "ally";
        const baseColor = isAlly ? "#fbbf24" : "#f87171";
        const isLast = i === session.turnOrder.length - 1;
        // Key includes the slot index because HASTE inserts a duplicate
        // id for the buffed combatant's extra action — `key={id}` alone
        // produced React duplicate-key warnings when haste fired.
        return (
          <div key={`${id}-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              title={c?.name ?? id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "2px 6px",
                fontSize: 10,
                color: isDead ? "#5a4a3a" : baseColor,
                background: isCurrent ? "rgba(251,191,36,0.18)" : "transparent",
                border: `1px solid ${isCurrent ? "#fbbf24" : "rgba(146,64,14,0.3)"}`,
                borderRadius: 3,
                opacity: isDead ? 0.45 : 1,
                textDecoration: isDead ? "line-through" : "none",
                boxShadow: isCurrent ? "0 0 6px rgba(251,191,36,0.5)" : "none",
              }}
            >
              <span>{c?.name ?? id}</span>
            </div>
            {!isLast && (
              <span
                aria-hidden
                style={{
                  color: "#92400e",
                  fontSize: 12,
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                →
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
