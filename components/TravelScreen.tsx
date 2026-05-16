"use client";

import React, { useEffect } from "react";
import type { TravelRoute } from "../lib/gameState";
import { TRAVEL_NODES } from "../lib/world/travelNodes";

const DANGER_COLORS: Record<string, string> = {
  safe: "#4ade80",
  moderate: "#fbbf24",
  dangerous: "#f97316",
  extreme: "#ef4444",
  deadly: "#a855f7",
};

const MODE_LABELS: Record<string, string> = {
  walk: "on foot",
  horse: "on horseback",
  ship: "by sea",
  air: "by air",
  gate: "by Gate",
};

const ZONE_LABELS: Record<string, string> = {
  civilization: "Settled Road",
  plains: "Open Plains",
  forest_valley: "Forest Valley",
  mountain: "Mountain Pass",
  cold_north: "Cold North",
  desert: "Desert",
  coastal_sea: "Open Sea",
  river: "River Road",
  jungle_fringe: "Jungle Fringe",
  deep_jungle: "Deep Jungle",
  frontier: "The Frontier",
  lost_lands: "The Lost Lands",
  hostile_tribal: "Hostile Territory",
  thurania_hills: "Thurania Hills",
  grondar_plains: "Grondar Plains",
};

interface Props {
  route: TravelRoute;
  latestNarrative: string;
  onContinue: () => void;
  loading: boolean;
}

export default function TravelScreen({ route, latestNarrative, onContinue, loading }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !loading) onContinue();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, onContinue]);
  const destNode = TRAVEL_NODES[route.destinationNodeId];
  const originNode = TRAVEL_NODES[route.originNodeId];
  const pct = route.totalDays > 0 ? (route.daysElapsed / route.totalDays) * 100 : 0;

  const zoneIndex = Math.min(
    Math.floor((route.daysElapsed / route.totalDays) * route.zones.length),
    route.zones.length - 1
  );
  const currentZone = route.zones[zoneIndex];
  const zoneLabel = ZONE_LABELS[currentZone] ?? currentZone;
  const dangerColor = DANGER_COLORS[route.dangerRating] ?? "#f97316";
  const modeLabel = MODE_LABELS[route.mode] ?? route.mode;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.88)",
      backdropFilter: "blur(4px)",
    }}>
      {/* Background map image, very dark */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/art/living-eamon-map.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.08,
        zIndex: 0,
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        width: "min(540px, 92vw)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}>
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
            TRAVELING {modeLabel.toUpperCase()}
          </div>
          <div style={{ color: "#e8d4a0", fontSize: 20, fontFamily: "Georgia, serif", fontWeight: 600 }}>
            {originNode?.name ?? route.originNodeId}
            <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 12px" }}>→</span>
            {destNode?.name ?? route.destinationNodeId}
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
              Day {route.daysElapsed} of {route.totalDays}
            </span>
            <span style={{ color: dangerColor, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {route.dangerRating}
            </span>
          </div>
          <div style={{
            height: 6,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 3,
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              backgroundColor: dangerColor,
              borderRadius: 3,
              transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 6 }}>
            {zoneLabel}
          </div>
        </div>

        {/* Narrative */}
        {latestNarrative && (
          <div style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "16px 20px",
            color: "#d4c9b0",
            fontSize: 14,
            fontFamily: "Georgia, serif",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            maxHeight: 180,
            overflowY: "auto",
          }}>
            {latestNarrative}
          </div>
        )}

        {/* Continue button */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={onContinue}
            disabled={loading}
            style={{
              backgroundColor: loading ? "rgba(146,64,14,0.2)" : "rgba(146,64,14,0.35)",
              color: loading ? "rgba(251,191,36,0.4)" : "#fbbf24",
              border: "1px solid rgba(251,191,36,0.4)",
              borderRadius: 6,
              padding: "10px 32px",
              fontSize: 13,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: loading ? "default" : "pointer",
              fontFamily: "ui-sans-serif, -apple-system, sans-serif",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(146,64,14,0.55)"; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(146,64,14,0.35)"; }}
          >
            {loading ? "Traveling..." : "Continue →"}
          </button>
        </div>

        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          Press <span style={{ color: "rgba(255,255,255,0.4)" }}>ENTER</span> or type <span style={{ color: "rgba(255,255,255,0.4)" }}>CONTINUE</span> to press on
        </div>
      </div>
    </div>
  );
}
