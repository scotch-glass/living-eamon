"use client";

import React, { useState, useRef, useMemo } from "react";
import { TRAVEL_NODES, TravelNode, TravelMode } from "../lib/world/travelNodes";
import { getLeg, TRAVEL_LEGS } from "../lib/world/travelMatrix";
import { getModules } from "../lib/adventures/registry";

// Source image dimensions (living-eamon-map.png — lore/thurian-cartography/)
const MAP_W = 2092;
const MAP_H = 1382;

// Display at 50% — fixed pixel size, no window-resize drift
const SCALE = 0.5;
const DISPLAY_W = MAP_W * SCALE; // 1046
const DISPLAY_H = MAP_H * SCALE; // 691

const DANGER_COLORS: Record<string, string> = {
  safe: "#86efac",
  moderate: "#fbbf24",
  dangerous: "#f97316",
  extreme: "#ef4444",
  deadly: "#a855f7",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  novice: "#86efac",     // green
  moderate: "#fbbf24",   // amber
  deadly: "#ef4444",     // red
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
  onTravelConfirm?: (destinationId: string, mode: TravelMode) => void;
}

interface ConfirmState {
  node: TravelNode;
  mode: TravelMode;
  days: number;
  dangerRating: string;
}

interface DragState {
  nodeId: string;
  // Offset from pin centre to mouse click, in display pixels
  offsetX: number;
  offsetY: number;
}

export default function WorldMap({ currentNodeId, onClose, onTravelConfirm }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [placingPins, setPlacingPins] = useState(false);

  // Source-coordinate overrides set by drag — keyed by node id
  const [pinOverrides, setPinOverrides] = useState<Record<string, { x: number; y: number }>>({});
  const dragRef = useRef<DragState | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Build nodeId -> difficulty lookup from registered modules
  const difficultyByNode = useMemo(() => {
    const lookup: Record<string, string> = {};
    const modules = getModules();
    for (const mod of modules) {
      if (mod.locationId && mod.difficulty) {
        lookup[mod.locationId] = mod.difficulty;
      }
    }
    return lookup;
  }, []);

  const reachableIds = new Set<string>(
    Object.keys(TRAVEL_NODES).filter(
      (id) => getLeg(currentNodeId, id) !== undefined && id !== currentNodeId
    )
  );

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
    setConfirm({ node, mode: travel.mode, days: travel.days, dangerRating: leg.dangerRating });
  }

  function handleConfirmYes() {
    if (!confirm) return;
    onTravelConfirm?.(confirm.node.id, confirm.mode);
    setConfirm(null);
    onClose();
  }

  // Pixel position on display canvas for a given source coordinate
  const px = (n: number) => n * SCALE;

  // Source coordinate for a given display pixel position
  const toSrc = (n: number) => Math.round(n / SCALE);

  // Effective display position for a node (override takes precedence)
  function displayPos(node: TravelNode): { x: number; y: number } {
    const ov = pinOverrides[node.id];
    if (ov) return { x: px(ov.x), y: px(ov.y) };
    return { x: px(node.x), y: px(node.y) };
  }

  // ── Drag handlers ────────────────────────────────────────────

  function handlePinMouseDown(e: React.MouseEvent, node: TravelNode) {
    if (!placingPins) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = displayPos(node);
    dragRef.current = {
      nodeId: node.id,
      offsetX: e.clientX - (mapRef.current?.getBoundingClientRect().left ?? 0) - pos.x,
      offsetY: e.clientY - (mapRef.current?.getBoundingClientRect().top ?? 0) - pos.y,
    };
  }

  function handleMapMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragRef.current || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const dispX = Math.max(0, Math.min(DISPLAY_W, e.clientX - rect.left - dragRef.current.offsetX));
    const dispY = Math.max(0, Math.min(DISPLAY_H, e.clientY - rect.top - dragRef.current.offsetY));
    setPinOverrides(prev => ({
      ...prev,
      [dragRef.current!.nodeId]: { x: toSrc(dispX), y: toSrc(dispY) },
    }));
  }

  function handleMapMouseUp() {
    dragRef.current = null;
  }

  const currentNode = TRAVEL_NODES[currentNodeId];
  const overrideEntries = Object.entries(pinOverrides);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid #2a1d0e", backgroundColor: "rgba(0,0,0,0.7)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#92400e", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Georgia, serif", fontWeight: 600 }}>
            World Map
          </span>
          {currentNode && (
            <span style={{ color: "#fbbf24", fontSize: 11, fontFamily: "Georgia, serif" }}>
              ✦ {currentNode.name}
            </span>
          )}
          <button
            onClick={() => { setPlacingPins(p => !p); }}
            style={{
              background: placingPins ? "#92400e" : "transparent",
              border: "1px solid #92400e",
              borderRadius: 3,
              color: placingPins ? "#fbbf24" : "#92400e",
              fontSize: 10,
              fontFamily: "Georgia, serif",
              padding: "2px 8px",
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            {placingPins ? "EXIT PLACE PINS" : "PLACE PINS"}
          </button>
          {placingPins && (
            <span style={{ color: "#9ca3af", fontSize: 10, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
              Drag any pin to reposition
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#888", fontSize: 18, cursor: "pointer", padding: "2px 8px", lineHeight: 1 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fbbf24"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#888"; }}
        >
          ✕
        </button>
      </div>

      {/* Coordinate readout panel — visible in place-pins mode */}
      {placingPins && (
        <div style={{ padding: "8px 20px", borderBottom: "1px solid #1a1208", backgroundColor: "rgba(0,0,0,0.85)", flexShrink: 0, display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
          {overrideEntries.length === 0 ? (
            <span style={{ color: "#4b5563", fontSize: 10, fontFamily: "monospace", fontStyle: "italic" }}>
              No pins moved yet — drag pins on the map
            </span>
          ) : (
            overrideEntries.map(([id, coord]) => (
              <span key={id} style={{ color: "#86efac", fontSize: 11, fontFamily: "monospace", userSelect: "all" }}>
                {id}: x:{coord.x} y:{coord.y}
              </span>
            ))
          )}
        </div>
      )}

      {/* Scrollable map area */}
      <div style={{ flex: 1, overflow: "auto", backgroundColor: "#080604" }}>
        <div
          ref={mapRef}
          style={{
            position: "relative",
            width: DISPLAY_W,
            height: DISPLAY_H,
            flexShrink: 0,
            cursor: placingPins ? (dragRef.current ? "grabbing" : "default") : "default",
            userSelect: "none",
          }}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={handleMapMouseUp}
        >
          {/* Map painting */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/art/living-eamon-map.png"
            alt="Thurian Age world map"
            style={{ position: "absolute", top: 0, left: 0, width: DISPLAY_W, height: DISPLAY_H, display: "block", userSelect: "none", pointerEvents: "none" }}
            draggable={false}
          />

          {/* SVG edge lines — full network, reachable legs brighter */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: DISPLAY_W, height: DISPLAY_H, pointerEvents: "none" }}>
            {TRAVEL_LEGS.map((leg, i) => {
              const source = TRAVEL_NODES[leg.from];
              const target = TRAVEL_NODES[leg.to];
              if (!source || !target) return null;
              const sp = displayPos(source);
              const tp = displayPos(target);
              const isReachable = reachableIds.has(leg.to) && leg.from === currentNodeId ||
                                  reachableIds.has(leg.from) && leg.to === currentNodeId;
              const color = DANGER_COLORS[leg.dangerRating] ?? "#4a5568";
              return (
                <line key={i} x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y}
                  stroke={color} strokeWidth={isReachable ? 1.5 : 1}
                  strokeDasharray="6 4"
                  strokeOpacity={isReachable ? 0.7 : 0.25} />
              );
            })}
          </svg>

          {/* Node pins */}
          {Object.values(TRAVEL_NODES).map((node) => {
            const isCurrent = node.id === currentNodeId;
            const isReachable = reachableIds.has(node.id);
            const isHovered = hovered === node.id;
            const leg = getLeg(currentNodeId, node.id);
            const dangerColor = leg ? (DANGER_COLORS[leg.dangerRating] ?? "#9ca3af") : "#9ca3af";
            const travel = bestMode(node.id);
            const pos = displayPos(node);

            let pinColor = "#374151";
            if (isCurrent) pinColor = "#fbbf24";
            else if (isReachable) pinColor = dangerColor;

            const pinSize = isCurrent ? 12 : 8;

            return (
              <div
                key={node.id}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  transform: "translate(-50%, -50%)",
                  cursor: placingPins ? "grab" : (isReachable && !isCurrent ? "pointer" : "default"),
                  zIndex: isCurrent ? 10 : isHovered ? 8 : 5,
                }}
                onMouseEnter={() => !placingPins && setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onMouseDown={(e) => handlePinMouseDown(e, node)}
                onClick={(e) => { if (!placingPins) { e.stopPropagation(); handleNodeClick(node); } }}
              >
                <div
                  style={{
                    width: pinSize,
                    height: pinSize,
                    borderRadius: "50%",
                    backgroundColor: pinColor,
                    border: `1.5px solid ${isCurrent ? "#92400e" : isHovered ? "#fff" : "rgba(0,0,0,0.6)"}`,
                    boxShadow: isCurrent ? "0 0 8px rgba(251,191,36,0.7)" : isHovered && isReachable ? "0 0 6px rgba(255,255,255,0.4)" : "none",
                    outline: placingPins ? "1px dashed rgba(255,255,255,0.4)" : "none",
                  }}
                />

                {/* Difficulty badge — small circle below pin if module registered */}
                {difficultyByNode[node.id] && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      marginTop: 2,
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      backgroundColor: DIFFICULTY_COLORS[difficultyByNode[node.id]] || "#9ca3af",
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Tooltip — hover only, never auto-open */}
                {isHovered && !placingPins && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "130%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "rgba(0,0,0,0.92)",
                      border: `1px solid ${isCurrent ? "#92400e" : dangerColor}`,
                      borderRadius: 4,
                      padding: "6px 10px",
                      minWidth: 140,
                      maxWidth: 220,
                      pointerEvents: "none",
                      whiteSpace: "normal",
                      zIndex: 30,
                    }}
                  >
                    <div style={{ color: isCurrent ? "#fbbf24" : "#e5e7eb", fontSize: 11, fontFamily: "Georgia, serif", fontWeight: 600, marginBottom: 3, whiteSpace: "nowrap" }}>
                      {isCurrent && "✦ "}{node.name}
                    </div>
                    {node.lore && (
                      <div style={{ color: "#9ca3af", fontSize: 10, fontFamily: "Georgia, serif", lineHeight: 1.4, marginBottom: isReachable && !isCurrent ? 4 : 0 }}>
                        {node.lore}
                      </div>
                    )}
                    {isReachable && !isCurrent && travel && (
                      <div style={{ color: dangerColor, fontSize: 10, fontFamily: "Georgia, serif", marginTop: 2 }}>
                        {MODE_ICONS[travel.mode]} {travel.days} day{travel.days !== 1 ? "s" : ""} · {leg?.dangerRating}
                      </div>
                    )}
                    {difficultyByNode[node.id] && (
                      <div style={{ color: DIFFICULTY_COLORS[difficultyByNode[node.id]], fontSize: 10, fontFamily: "Georgia, serif", marginTop: 4, textTransform: "capitalize" }}>
                        {difficultyByNode[node.id]}
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
      <div style={{ padding: "8px 20px", borderTop: "1px solid #2a1d0e", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", gap: 16, flexShrink: 0, flexWrap: "wrap" }}>
        {(["safe", "moderate", "dangerous", "extreme", "deadly"] as const).map((d) => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: DANGER_COLORS[d] }} />
            <span style={{ color: "#9ca3af", fontSize: 10, fontFamily: "Georgia, serif", textTransform: "capitalize" }}>{d}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", color: "#4b5563", fontSize: 10, fontFamily: "Georgia, serif" }}>
          Click a destination to travel
        </div>
      </div>

      {/* Confirm travel overlay */}
      {confirm && (
        <div
          style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}
          onClick={() => setConfirm(null)}
        >
          <div
            style={{ backgroundColor: "#0d0a06", border: "1px solid #92400e", borderRadius: 6, padding: "28px 36px", maxWidth: 380, textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ color: "#92400e", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "Georgia, serif", marginBottom: 12 }}>Set Forth?</div>
            <div style={{ color: "#fbbf24", fontSize: 16, fontFamily: "Georgia, serif", fontWeight: 600, marginBottom: 6 }}>{confirm.node.name}</div>
            <div style={{ color: "#9ca3af", fontSize: 12, fontFamily: "Georgia, serif", marginBottom: 18, lineHeight: 1.6 }}>
              {MODE_ICONS[confirm.mode]} {confirm.days} day{confirm.days !== 1 ? "s" : ""} by {confirm.mode}
              {" · "}
              <span style={{ color: DANGER_COLORS[confirm.dangerRating] }}>{confirm.dangerRating}</span> road
            </div>
            <div style={{ color: "#6b7280", fontSize: 11, fontFamily: "Georgia, serif", marginBottom: 24, fontStyle: "italic" }}>
              This journey cannot be undone once begun.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={handleConfirmYes}
                style={{ background: "linear-gradient(180deg, #92400e 0%, #6b2d09 100%)", border: "1px solid #b45309", borderRadius: 4, color: "#fbbf24", fontSize: 12, fontFamily: "Georgia, serif", fontWeight: 600, letterSpacing: "0.1em", padding: "8px 24px", cursor: "pointer", textTransform: "uppercase" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(180deg, #b45309 0%, #92400e 100%)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(180deg, #92400e 0%, #6b2d09 100%)"; }}
              >
                Yes
              </button>
              <button
                onClick={() => setConfirm(null)}
                style={{ background: "transparent", border: "1px solid #374151", borderRadius: 4, color: "#9ca3af", fontSize: 12, fontFamily: "Georgia, serif", fontWeight: 600, letterSpacing: "0.1em", padding: "8px 24px", cursor: "pointer", textTransform: "uppercase" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#6b7280"; (e.currentTarget as HTMLButtonElement).style.color = "#d1d5db"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#374151"; (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
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
