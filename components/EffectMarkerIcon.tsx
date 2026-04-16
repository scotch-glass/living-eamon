"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { StatusEffectType } from "../lib/combatTypes";
import { EFFECT_ICON_MAP } from "../lib/effectIconData";

// ── Animation class map ──
// Maps the short animation name in effectIconData to the full CSS class name
// injected by CombatScreen's <style> block.
const ANIM_CLASS: Record<string, string> = {
  pulse: "le-fx-pulse",
  glow: "le-fx-glow",
  shake: "le-fx-shake",
  wobble: "le-fx-wobble",
  shimmer: "le-fx-shimmer",
  fade: "le-fx-fade",
  bounce: "le-fx-bounce",
};

export interface EffectMarkerIconProps {
  effectType: StatusEffectType;
  severity?: number;
  size?: number;
  turnsRemaining?: number;
  showTooltip?: boolean;
}

export default function EffectMarkerIcon({
  effectType,
  severity = 1,
  size = 20,
  turnsRemaining,
  showTooltip = true,
}: EffectMarkerIconProps) {
  const [hover, setHover] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const def = EFFECT_ICON_MAP[effectType];
  if (!def) return null;

  const animClass = def.animation ? ANIM_CLASS[def.animation] : undefined;

  // Severity ring: sev 2 = single outer ring, sev 3 = double ring
  const ringWidth = severity >= 3 ? 2.5 : severity >= 2 ? 1.5 : 0;
  const ringOffset = ringWidth > 0 ? ringWidth + 1 : 0;

  const tooltipText = [
    def.label,
    severity > 1 ? `(severity ${severity})` : "",
    turnsRemaining != null && turnsRemaining > 0
      ? `${turnsRemaining} round${turnsRemaining !== 1 ? "s" : ""} left`
      : turnsRemaining === -1
        ? "until cured"
        : "",
  ]
    .filter(Boolean)
    .join(" · ");

  // Compute tooltip position from the icon's bounding rect so the tooltip
  // renders via a portal at the document root — escaping any stacking
  // context created by parent transforms, backdrop-filters, etc.
  const getTooltipPos = (): { top: number; left: number } | null => {
    const el = iconRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top - 6, // 6px above the icon
      left: rect.left + rect.width / 2,
    };
  };

  return (
    <div
      ref={iconRef}
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={animClass}
        style={{
          width: size + ringOffset * 2,
          height: size + ringOffset * 2,
          borderRadius: "50%",
          background: "rgba(10,6,3,0.85)",
          border: `1px solid ${def.color}40`,
          boxShadow: ringWidth > 0
            ? `0 0 0 ${ringWidth}px ${def.color}60, 0 0 3px ${def.color}80`
            : `0 0 3px ${def.color}80`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          viewBox="0 0 20 20"
          width={size * 0.75}
          height={size * 0.75}
          style={{ display: "block" }}
        >
          <path
            d={def.svgPath}
            fill="none"
            stroke={def.color}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 2px ${def.color})`,
            }}
          />
        </svg>
      </div>

      {/* Tooltip — rendered via portal to document.body so it floats above
          every stacking context (backdrop-filter, transform, etc.). */}
      {showTooltip && hover && typeof document !== "undefined" && (() => {
        const pos = getTooltipPos();
        if (!pos) return null;
        return createPortal(
          <div
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform: "translate(-50%, -100%)",
              padding: "4px 8px",
              background: "rgba(10,6,3,0.95)",
              border: `1px solid ${def.color}55`,
              borderRadius: 4,
              boxShadow: "0 4px 12px rgba(0,0,0,0.8)",
              fontFamily: "Georgia, serif",
              fontSize: 10,
              color: "#e8d4a0",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 9999,
              textShadow: "0 1px 2px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ color: def.color, fontWeight: 700, marginBottom: 2 }}>
              {tooltipText}
            </div>
            <div style={{ color: "#8a7a60", fontSize: 9 }}>
              {def.description}
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
