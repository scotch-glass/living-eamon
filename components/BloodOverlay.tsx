"use client";

import { type BloodSplatter } from "../lib/bloodSplatterData";
import { SIZE_CLASSES, type SizeClass } from "../lib/art/sizeClasses";
import type { GoreZone } from "../lib/art/spriteMetadata";

// ============================================================
// BLOOD OVERLAY
// Renders accumulated blood splatters on top of a sprite,
// clipped to the sprite's alpha channel via CSS mask-image.
//
// 2026-05-08 (sprite-normalization sprint, Stage J):
// - Optional `sizeClass` prop drives zIndex (smaller class = higher Z,
//   gore Z = sprite Z + 1). Without it, falls back to the legacy
//   hardcoded zIndex: 2 used by v1 CombatScreen.tsx.
// - Optional `goreZones` prop holds human-placed gore anchors from the
//   Sprite Review Tool. When provided + non-empty, splatters are drawn
//   at those exact normalized positions instead of the procedural
//   positions encoded in BloodSplatter.x/y.
// ============================================================

interface BloodOverlayProps {
  /** Array of splatter instances to render. */
  splatters: BloodSplatter[];
  /** URL of the sprite image — used as the CSS mask so blood only
   *  appears where the character has opaque pixels. */
  spriteUrl: string;
  /** If true, newly added splatters get a brief appear animation. */
  animate?: boolean;
  /** Class-aware Z-layer. Omitting this preserves v1 behavior (zIndex=2). */
  sizeClass?: SizeClass;
  /** Human-placed gore anchors. When provided + non-empty, splatters
   *  are drawn at these positions in lieu of their procedural ones. */
  goreZones?: GoreZone[];
}

export default function BloodOverlay({
  splatters,
  spriteUrl,
  animate = true,
  sizeClass,
  goreZones,
}: BloodOverlayProps) {
  if (splatters.length === 0) return null;

  const zIndex = sizeClass ? SIZE_CLASSES[sizeClass].goreZ : 2;
  const useApprovedZones = !!goreZones && goreZones.length > 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex,
        overflow: "hidden",
      }}
    >
      {/* The blood SVG and mask are both positioned to match the sprite's
          contain-fit behavior: anchored to the bottom-center of the container,
          sized to fill while preserving aspect ratio. */}
      <div style={{
        position: "absolute",
        inset: 0,
        // Clip blood to the sprite's silhouette
        WebkitMaskImage: `url(${spriteUrl})`,
        maskImage: `url(${spriteUrl})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "bottom center",
        maskPosition: "bottom center",
      }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMax meet"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {splatters.map((s, i) => {
            // Wounds (from crits) use negative pathIndex — render darker
            // with a wet-wound glow to distinguish from splatter blobs.
            const isWound = s.pathIndex < 0;
            const fill = isWound ? "#4a0000" : (s.isCrit ? "#8b0000" : "#6b0000");
            const stroke = isWound ? "#2a0000" : "none";
            const strokeWidth = isWound ? 0.8 : 0;
            const filter = isWound
              ? "drop-shadow(0 0 4px rgba(120,0,0,0.8)) drop-shadow(0 0 1px rgba(60,0,0,0.9))"
              : s.isCrit
                ? "drop-shadow(0 0 3px rgba(180,0,0,0.6))"
                : "drop-shadow(0 0 1px rgba(100,0,0,0.3))";

            // When approved gore zones exist, snap each splatter to the
            // i-th zone (round-robin if more splatters than zones). The
            // SVG coordinate space is 0..100, so multiply normalized X/Y
            // (0..1) by 100. Otherwise use the splatter's own x/y.
            let cx: number;
            let cy: number;
            if (useApprovedZones) {
              const zone = goreZones![i % goreZones!.length]!;
              cx = zone.normalizedX * 100;
              cy = zone.normalizedY * 100;
            } else {
              cx = s.x;
              cy = s.y;
            }

            return (
              <g
                key={s.id}
                transform={`translate(${cx}, ${cy}) scale(${s.scale * 0.3}) rotate(${s.rotation})`}
                style={{
                  transformOrigin: "center",
                  transformBox: "fill-box",
                }}
              >
                <path
                  d={s.path}
                  fill={fill}
                  fillOpacity={s.opacity}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  className={animate ? "le-blood-appear" : undefined}
                  style={{ filter }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
