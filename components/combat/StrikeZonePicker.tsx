// Body-zone picker for the STRIKE action. Anchored to the clicked
// hotbar button. Pick a zone → caller chains a TargetPicker (or fires
// directly when only one enemy is alive).
"use client";

import { useEffect, useRef } from "react";
import type { BodyZone } from "../../lib/combat/types";
import { BODY_ZONES } from "../../lib/combat/types";
import { ZONE_LABELS, popoverAboveAnchor } from "./sharedWidgets";

const ZONE_EVASION_HINT: Record<BodyZone, string> = {
  torso: "easy",
  limbs: "moderate",
  head: "hard",
  neck: "very hard · 2×",
};

interface StrikeZonePickerProps {
  anchorRect: { top: number; left: number; width: number; height: number };
  onPick: (zone: BodyZone) => void;
  onClose: () => void;
}

export default function StrikeZonePicker({
  anchorRect,
  onPick,
  onClose,
}: StrikeZonePickerProps): React.JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        ...popoverAboveAnchor(anchorRect),
        zIndex: 200,
        minWidth: 170,
        background: "linear-gradient(180deg, #1a120a 0%, #0d0805 100%)",
        border: "1px solid #4a2e15",
        borderRadius: 6,
        boxShadow: "0 8px 24px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.5)",
        padding: "4px 0",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          padding: "6px 12px 4px",
          fontSize: 11,
          color: "#fbbf24",
          fontWeight: 700,
          borderBottom: "1px solid #2a1d0e",
          marginBottom: 2,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>⚔</span>
        <span>Strike — pick a zone</span>
      </div>
      {BODY_ZONES.map((z) => (
        <button
          key={z}
          onClick={() => onPick(z)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            padding: "6px 12px",
            background: "transparent",
            border: "none",
            textAlign: "left",
            color: "#e8d4a0",
            fontSize: 12,
            fontFamily: "Georgia, serif",
            cursor: "pointer",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(146,64,14,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <span style={{ fontWeight: 700, letterSpacing: "0.06em" }}>{ZONE_LABELS[z]}</span>
          <span style={{ color: "#8a7a60", fontSize: 10, marginLeft: 12 }}>
            {ZONE_EVASION_HINT[z]}
          </span>
        </button>
      ))}
    </div>
  );
}
