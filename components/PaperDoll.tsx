"use client";

import type { BodyZone } from "../lib/combatTypes";

// ── Zone colors by state ────────────────────────────────────

function zoneColor(
  zone: BodyZone,
  selected: BodyZone | null,
  armorCover: number,
  woundLevel: number
): string {
  if (selected === zone) return "#fbbf24"; // Amber gold — selected
  if (woundLevel > 20) return "#dc2626";   // Red — heavy wounds
  if (woundLevel > 8) return "#f97316";    // Orange — moderate wounds
  if (armorCover > 50) return "#3b82f6";   // Blue — well armored
  if (armorCover > 0) return "#60a5fa";    // Light blue — some armor
  return "#6b7280";                         // Gray — exposed
}

function zoneBorderColor(zone: BodyZone, selected: BodyZone | null): string {
  return selected === zone ? "#fbbf24" : "#444444";
}

// ── Props ───────────────────────────────────────────────────

export interface PaperDollProps {
  selectedZone: BodyZone | null;
  onSelectZone: (zone: BodyZone) => void;
  /** Per-zone armor cover % (0-100) */
  armorCover: Record<BodyZone, number>;
  /** Per-zone accumulated wound damage */
  woundLevels: Record<BodyZone, number>;
  /** Disable interaction (e.g. while waiting for response) */
  disabled?: boolean;
}

// ── Component ───────────────────────────────────────────────

export default function PaperDoll({
  selectedZone,
  onSelectZone,
  armorCover,
  woundLevels,
  disabled,
}: PaperDollProps) {
  const zoneStyle = (zone: BodyZone): React.CSSProperties => ({
    fill: zoneColor(zone, selectedZone, armorCover[zone], woundLevels[zone]),
    stroke: zoneBorderColor(zone, selectedZone),
    strokeWidth: selectedZone === zone ? 2.5 : 1.5,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "fill 0.2s, stroke 0.2s, opacity 0.2s",
  });

  const labelStyle: React.CSSProperties = {
    fill: "#cccccc",
    fontSize: 9,
    fontFamily: "ui-sans-serif, sans-serif",
    pointerEvents: "none",
    textAnchor: "middle",
  };

  const click = (zone: BodyZone) => {
    if (!disabled) onSelectZone(zone);
  };

  return (
    <svg
      viewBox="0 0 120 200"
      width={120}
      height={200}
      style={{ display: "block" }}
    >
      {/* Head — circle */}
      <circle
        cx={60} cy={28} r={16}
        style={zoneStyle("head")}
        onClick={() => click("head")}
      />
      <text x={60} y={32} style={labelStyle}>HEAD</text>

      {/* Neck — small rect */}
      <rect
        x={52} y={45} width={16} height={14} rx={3}
        style={zoneStyle("neck")}
        onClick={() => click("neck")}
      />
      <text x={60} y={56} style={{ ...labelStyle, fontSize: 7 }}>NECK</text>

      {/* Torso — rounded rect */}
      <rect
        x={34} y={60} width={52} height={60} rx={6}
        style={zoneStyle("torso")}
        onClick={() => click("torso")}
      />
      <text x={60} y={94} style={labelStyle}>TORSO</text>

      {/* Limbs — left arm */}
      <rect
        x={10} y={64} width={20} height={50} rx={5}
        style={zoneStyle("limbs")}
        onClick={() => click("limbs")}
      />
      {/* Limbs — right arm */}
      <rect
        x={90} y={64} width={20} height={50} rx={5}
        style={zoneStyle("limbs")}
        onClick={() => click("limbs")}
      />
      {/* Limbs — left leg */}
      <rect
        x={36} y={124} width={20} height={56} rx={5}
        style={zoneStyle("limbs")}
        onClick={() => click("limbs")}
      />
      {/* Limbs — right leg */}
      <rect
        x={64} y={124} width={20} height={56} rx={5}
        style={zoneStyle("limbs")}
        onClick={() => click("limbs")}
      />
      <text x={60} y={158} style={labelStyle}>LIMBS</text>

      {/* Legend */}
      <text x={60} y={195} style={{ ...labelStyle, fontSize: 7, fill: "#666666" }}>
        click to target
      </text>
    </svg>
  );
}
