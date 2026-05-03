"use client";

import React, { useState, useRef, useCallback } from "react";
import { TRAVEL_NODES, TravelNode, TravelMode } from "../lib/world/travelNodes";
import { getLegsFrom, getLeg } from "../lib/world/travelMatrix";

// Source image dimensions (living-eamon-map.png)
const MAP_W = 2560;
const MAP_H = 1693;

const DANGER_COLORS: Record<string, string> = {
  safe: "#86efac",
  moderate: "#fbbf24",
  dangerous: "#f97316",
  extreme: "#ef4444",
};

const MODE_ICONS: Record<TravelMode, string> = {
  walk: "🚶",
  horse: "🐎",
  ship: "⛵",
  air: "🦅",
  gate: "✦",
};

interface Props {
  currentNodeId: string;
  onClose: () => void;
  /** Called when the player confirms travel to a destination node. */
  onTravelConfirm?: (destinationId: string, mode: TravelMode) => void;
}

interface ConfirmState {
  node: TravelNode;
  mode: TravelMode;
  days: number;
  dangerRating: string;
}

export default function WorldMap({ currentNodeId, onClose, onTravelConfirm }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reachable node ids from current position
  const reachableLegs = getLegsFrom(currentNodeId);
  // Also check reverse direction legs
  const reachableIds = new Set<string>(
    Object.keys(TRAVEL_NODES).filter((id) => getLeg(currentNodeId, id) !== undefined && id !== currentNodeId)
  );

  // Preferred travel mode: foot, horse, ship, gate
  function bestMode(nodeId: string): { mode: TravelMode; days: number } | null {
    const leg = getLeg(currentNodeId, nodeId);
    if (!leg) return null;
    if (leg.daysFoot !== null) return { mode: "walk", days: leg.daysFoot };
    if (leg.daysHorse !== null) return { mode: "horse", days: leg.daysHorse };
    if (leg.daysShip !== null) return { mode: "ship", days: leg.daysShip };
    return null;
  }

  function handleNodeClick(node: TravelNode) {
    if (node.id === currentNodeId) return;
    const travel = bestMode(node.id);
    if (!travel) return;
    const leg = getLeg(currentNodeId, node.id)!;
    setConfirm({
      node,
      mode: travel.mode,
      days: travel.days,
      dangerRating: leg.dangerRating,
    });
  }

  function handleConfirmYes() {
    if (!confirm) return;
    onTravelConfirm?.(confirm.node.id, confirm.mode);
    setConfirm(null);
    onClose();
  }

  // Convert map pixel coords to percentage strings for absolute positioning
  const pct = useCallback(
    (x: number, y: number) => ({
      left: `${(x / MAP_W) * 100}%`,
      top: `${(y / MAP_H) * 100}%`,
    }),
    []
  );

  const currentNode = TRAVEL_NODES[currentNodeId];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 20,
        backgroundColor: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          borderBottom: "1px solid #2a1d0e",
          backgroundColor: "rgba(0,0,0,0.7)",
          flexShrink: 0,
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              color: "#92400e",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "Georgia, serif",
              fontWeight: 600,
            }}
          >
            World Map
          </span>
          {currentNode && (
            <span
              style={{
                color: "#fbbf24",
                fontSize: 11,
                fontFamily: "Georgia, serif",
              }}
            >
              ✦ {currentNode.name}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            fontSize: 18,
            cursor: "pointer",
            padding: "2px 8px",
            lineHeight: 1,
            fontFamily: "Georgia, serif",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#fbbf24";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#888";
          }}
        >
          ✕
        </button>
      </div>

      {/* Map area */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Map image + node overlay */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          {/* The map painting */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/art/living-eamon-map.png"
            alt="Thurian Age world map"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
              userSelect: "none",
              pointerEvents: "none",
            }}
            draggable={false}
          />

          {/* SVG edge lines between current node and reachable nodes */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "visible",
            }}
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {Array.from(reachableIds).map((targetId) => {
              const target = TRAVEL_NODES[targetId];
              const source = TRAVEL_NODES[currentNodeId];
              if (!source || !target) return null;
              const leg = getLeg(currentNodeId, targetId);
              const color = leg ? DANGER_COLORS[leg.dangerRating] ?? "#4a5568" : "#4a5568";
              return (
                <line
                  key={targetId}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="8 5"
                  strokeOpacity={0.55}
                />
              );
            })}
          </svg>

          {/* Node pins */}
          {Object.values(TRAVEL_NODES).map((node) => {
            const isCurrent = node.id === currentNodeId;
            const isReachable = reachableIds.has(node.id);
            const isHovered = hovered === node.id;
            const leg = getLeg(currentNodeId, node.id);
            const dangerColor = leg ? DANGER_COLORS[leg.dangerRating] ?? "#9ca3af" : "#9ca3af";
            const travel = bestMode(node.id);

            let pinColor = "#4b5563"; // unreachable gray
            if (isCurrent) pinColor = "#fbbf24";
            else if (isReachable) pinColor = dangerColor;

            const pinSize = isCurrent ? 14 : 10;

            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  ...pct(node.x, node.y),
                  transform: "translate(-50%, -50%)",
                  cursor: isReachable && !isCurrent ? "pointer" : "default",
                  zIndex: isCurrent ? 10 : isHovered ? 8 : 5,
                }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleNodeClick(node)}
              >
                {/* Pin dot */}
                <div
                  style={{
                    width: pinSize,
                    height: pinSize,
                    borderRadius: "50%",
                    backgroundColor: pinColor,
                    border: `2px solid ${isCurrent ? "#92400e" : isHovered ? "#fff" : "rgba(0,0,0,0.5)"}`,
                    boxShadow: isCurrent
                      ? "0 0 10px rgba(251,191,36,0.6)"
                      : isHovered && isReachable
                      ? "0 0 8px rgba(255,255,255,0.4)"
                      : "none",
                    transition: "box-shadow 0.15s, border-color 0.15s",
                  }}
                />

                {/* Label + tooltip */}
                {(isHovered || isCurrent) && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "120%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: `1px solid ${isCurrent ? "#92400e" : dangerColor}`,
                      borderRadius: 4,
                      padding: "6px 10px",
                      minWidth: 140,
                      maxWidth: 220,
                      pointerEvents: "none",
                      whiteSpace: "normal",
                      zIndex: 20,
                    }}
                  >
                    <div
                      style={{
                        color: isCurrent ? "#fbbf24" : "#e5e7eb",
                        fontSize: 11,
                        fontFamily: "Georgia, serif",
                        fontWeight: 600,
                        marginBottom: 3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isCurrent && "✦ "}
                      {node.name}
                    </div>
                    {node.lore && (
                      <div
                        style={{
                          color: "#9ca3af",
                          fontSize: 10,
                          fontFamily: "Georgia, serif",
                          lineHeight: 1.4,
                          marginBottom: isReachable && !isCurrent ? 4 : 0,
                        }}
                      >
                        {node.lore}
                      </div>
                    )}
                    {isReachable && !isCurrent && travel && (
                      <div
                        style={{
                          color: dangerColor,
                          fontSize: 10,
                          fontFamily: "Georgia, serif",
                          marginTop: 2,
                        }}
                      >
                        {MODE_ICONS[travel.mode]} {travel.days} day{travel.days !== 1 ? "s" : ""}{" "}
                        · {leg?.dangerRating ?? "unknown"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          padding: "8px 20px",
          borderTop: "1px solid #2a1d0e",
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          gap: 16,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {(["safe", "moderate", "dangerous", "extreme"] as const).map((d) => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: DANGER_COLORS[d],
              }}
            />
            <span
              style={{
                color: "#9ca3af",
                fontSize: 10,
                fontFamily: "Georgia, serif",
                textTransform: "capitalize",
              }}
            >
              {d}
            </span>
          </div>
        ))}
        <div
          style={{
            marginLeft: "auto",
            color: "#4b5563",
            fontSize: 10,
            fontFamily: "Georgia, serif",
          }}
        >
          Click a destination to travel
        </div>
      </div>

      {/* Confirm travel overlay */}
      {confirm && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
          }}
          onClick={() => setConfirm(null)}
        >
          <div
            style={{
              backgroundColor: "#0d0a06",
              border: "1px solid #92400e",
              borderRadius: 6,
              padding: "28px 36px",
              maxWidth: 380,
              textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                color: "#92400e",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontFamily: "Georgia, serif",
                marginBottom: 12,
              }}
            >
              Set Forth?
            </div>
            <div
              style={{
                color: "#fbbf24",
                fontSize: 16,
                fontFamily: "Georgia, serif",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {confirm.node.name}
            </div>
            <div
              style={{
                color: "#9ca3af",
                fontSize: 12,
                fontFamily: "Georgia, serif",
                marginBottom: 18,
                lineHeight: 1.6,
              }}
            >
              {MODE_ICONS[confirm.mode]}{" "}
              {confirm.days} day{confirm.days !== 1 ? "s" : ""} by {confirm.mode}
              {" · "}
              <span style={{ color: DANGER_COLORS[confirm.dangerRating] }}>
                {confirm.dangerRating}
              </span>{" "}
              road
            </div>
            <div
              style={{
                color: "#6b7280",
                fontSize: 11,
                fontFamily: "Georgia, serif",
                marginBottom: 24,
                fontStyle: "italic",
              }}
            >
              This journey cannot be undone once begun.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={handleConfirmYes}
                style={{
                  background: "linear-gradient(180deg, #92400e 0%, #6b2d09 100%)",
                  border: "1px solid #b45309",
                  borderRadius: 4,
                  color: "#fbbf24",
                  fontSize: 12,
                  fontFamily: "Georgia, serif",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  padding: "8px 24px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "linear-gradient(180deg, #b45309 0%, #92400e 100%)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "linear-gradient(180deg, #92400e 0%, #6b2d09 100%)";
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setConfirm(null)}
                style={{
                  background: "transparent",
                  border: "1px solid #374151",
                  borderRadius: 4,
                  color: "#9ca3af",
                  fontSize: 12,
                  fontFamily: "Georgia, serif",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  padding: "8px 24px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#6b7280";
                  (e.currentTarget as HTMLButtonElement).style.color = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#374151";
                  (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af";
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
