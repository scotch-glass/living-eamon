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

import { useMemo } from "react";
import type { ActiveCombatSession, CombatantState } from "../lib/combat/types";
import { spriteFor, spritePathFor } from "../lib/combat/sprites";
import { currentActorId } from "../lib/combat/engine";
import { useFigureHeight, figureScaleByEye } from "../lib/combat/useFigureHeight";
import {
  BASELINE_FIGURE_HEIGHT_PX,
  SIZE_CLASSES,
  targetFigureHeightPx,
  type SizeClass,
} from "../lib/art/sizeClasses";
import { useSpriteMeta } from "../lib/art/useSpriteMeta";
import { layoutLane, type PlacedSlot } from "../lib/combat/laneLayout";

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
}

export default function CombatArena({
  session,
  combatLog,
  loading: _loading,
  onCommand: _onCommand,
}: CombatArenaProps) {
  // Sort combatants by position so front-rank sits closest to centerline.
  // Allies left lane: position 1 (Front) at the highest laneIndex (rightmost).
  // Enemies right lane: position 1 (Front) at the highest laneIndex (leftmost).
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

      {/* Ally lane — absolute three-space layout, per-Z-layer independent. */}
      <Lane
        side="ally"
        combatants={allies}
        activeId={activeId}
      />

      {/* Enemy lane — mirrored. */}
      <Lane
        side="enemy"
        combatants={enemies}
        activeId={activeId}
      />

      {/* Combat log — Stage 6 will replace this with the v1 banner-format. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "2vh",
          transform: "translateX(-50%)",
          maxWidth: "60vw",
          maxHeight: "20vh",
          overflowY: "auto",
          fontSize: 13,
          textAlign: "center",
          color: "#e8d4a0",
          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          pointerEvents: "none",
        }}
      >
        {combatLog.slice(-3).map((line, i) => (
          <div key={i} style={{ marginBottom: 2, opacity: i === combatLog.slice(-3).length - 1 ? 1 : 0.6 }}>
            {line}
          </div>
        ))}
      </div>
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
}: {
  side: "ally" | "enemy";
  combatants: CombatantState[];
  activeId: string | null;
}): React.JSX.Element {
  // Layout is computed assuming all combatants are class C. Each Slot
  // re-fetches its own metadata and renders at its real class's height
  // and Z-index, so mixed-class lanes still render correctly even though
  // the LAYOUT pass is class-agnostic. (Per-class layout grouping needs
  // pre-loaded metadata, which would require a stable hook-count contract
  // we don't have when combatants enter/leave mid-session.)
  const placed: PlacedSlot[] = useMemo(
    () => layoutLane(combatants, { widthPx: 1000 }, () => "C"),
    [combatants],
  );

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
      {placed.map((p) => {
        // Convert centerXPx (in 0..1000) to a percentage of lane width.
        // Mirror enemies so position-1 (front) lands closest to centerline.
        const pctX =
          side === "ally" ? p.centerXPx / 1000 : 1 - p.centerXPx / 1000;
        const leftCss = `calc(${pctX * 100}% - ${SLOT_WIDTH_PX / 2}px)`;
        return (
          <div
            key={p.combatant.id}
            style={{
              position: "absolute",
              left: leftCss,
              bottom: 0,
            }}
          >
            <Slot
              c={p.combatant}
              side={side}
              isActive={p.combatant.id === activeId}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Slot ────────────────────────────────────────────────────

function Slot({
  c,
  side,
  isActive,
}: {
  c: CombatantState;
  side: "ally" | "enemy";
  isActive: boolean;
}) {
  const spritePath = spritePathFor(c);
  const { meta } = useSpriteMeta(spritePath);
  const fig = useFigureHeight(spritePath);
  const fallback = spriteFor(c);

  // Effective metadata: prefer reviewed values; fall back to hardcoded flip.
  const sizeClass: SizeClass = meta?.sizeClass ?? "C"; // C is the safe default for humanoid combat
  const flip = meta?.flip ?? fallback.flip;
  const eyeYPx = meta?.eyeYPx;

  // Try to compute figureScaleByEye. If eyeYPx is missing, this throws —
  // we render a placeholder + warning instead. (Decision: production-quality
  // gate via the Sprite Review Tool, no estimation fallback.)
  let scale: ReturnType<typeof figureScaleByEye> | null = null;
  let scaleError: string | null = null;
  try {
    if (fig.ready) {
      scale = figureScaleByEye(fig, eyeYPx, sizeClass);
    }
  } catch (err) {
    scaleError = (err as Error).message;
    scale = null;
  }

  const teamColor = side === "ally" ? "#fbbf24" : "#f87171";
  const isDead = c.hp <= 0;
  const slotHeight = targetFigureHeightPx(sizeClass);
  const spriteZ = SIZE_CLASSES[sizeClass].spriteZ;

  return (
    <div
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
      {spritePath && scale?.ready && (
        <img
          src={spritePath}
          alt={c.name}
          style={{
            position: "absolute",
            left: "50%",
            bottom: `${scale.offsetBelowPx}px`,
            height: `${scale.imgHeightPx}px`,
            maxWidth: "none",
            transform: `translateX(-50%)${flip ? " scaleX(-1)" : ""}`,
            filter: isDead
              ? "grayscale(100%) brightness(0.4) drop-shadow(0 14px 24px rgba(0,0,0,0.85))"
              : "drop-shadow(0 14px 24px rgba(0,0,0,0.85))",
            opacity: isDead ? 0.35 : 1,
            transition: "opacity 0.5s ease, filter 0.5s ease",
            pointerEvents: "auto",
            zIndex: spriteZ,
          }}
        />
      )}

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

      {/* Name label below the sprite (temporary — Stage 2 replaces with status column). */}
      <div
        style={{
          position: "absolute",
          bottom: -22,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 12,
          fontWeight: 700,
          color: isDead ? "#5a4a3a" : teamColor,
          textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
          textDecoration: isDead ? "line-through" : "none",
          zIndex: 100,
        }}
      >
        {c.name}
      </div>
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
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
