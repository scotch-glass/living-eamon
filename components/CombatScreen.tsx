"use client";

import { useState, useRef, useEffect } from "react";
import type { BodyZone, ActiveCombatSession } from "../lib/combatTypes";
import { BODY_ZONES } from "../lib/combatTypes";
import PaperDoll from "./PaperDoll";

// ── Props ───────────────────────────────────────────────────

export interface CombatScreenProps {
  session: ActiveCombatSession;
  playerHp: number;
  playerMaxHp: number;
  /** Recent combat log lines (last few rounds) */
  combatLog: string[];
  /** True while waiting for API response */
  loading: boolean;
  /** Send a command back to the game engine */
  onCommand: (cmd: string) => void;
}

// ── Helpers ─────────────────────────────────────────────────

function hpBarColor(pct: number): string {
  if (pct > 0.6) return "#4ade80";
  if (pct > 0.3) return "#facc15";
  return "#dc2626";
}

function hpBar(hp: number, max: number, width: number): React.ReactNode {
  const pct = Math.max(0, hp) / Math.max(1, max);
  return (
    <div style={{
      width,
      height: 10,
      backgroundColor: "#1a1a1a",
      borderRadius: 3,
      overflow: "hidden",
      border: "1px solid #333",
    }}>
      <div style={{
        width: `${pct * 100}%`,
        height: "100%",
        backgroundColor: hpBarColor(pct),
        transition: "width 0.4s ease, background-color 0.4s ease",
      }} />
    </div>
  );
}

// ── Zone labels ─────────────────────────────────────────────

const ZONE_LABELS: Record<BodyZone, string> = {
  head: "HEAD",
  neck: "NECK",
  torso: "TORSO",
  limbs: "LIMBS",
};

const ZONE_EVASION_HINT: Record<BodyZone, string> = {
  torso: "easy to hit",
  limbs: "moderate",
  head: "hard to hit",
  neck: "very hard, 2x damage",
};

// ── Status effect display names ─────────────────────────────

const EFFECT_COLORS: Record<string, string> = {
  bleed: "#dc2626",
  severed_artery: "#dc2626",
  concussion: "#a855f7",
  damaged_eye: "#a855f7",
  crushed_windpipe: "#f97316",
  pierced_lung: "#f97316",
  cracked_ribs: "#facc15",
  broken_arm: "#facc15",
  broken_leg: "#facc15",
};

// ── Component ───────────────────────────────────────────────

export default function CombatScreen({
  session,
  playerHp,
  playerMaxHp,
  combatLog,
  loading,
  onCommand,
}: CombatScreenProps) {
  const [selectedZone, setSelectedZone] = useState<BodyZone>("torso");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [combatLog.length]);

  const player = session.playerCombatant;
  const enemy = session.enemyCombatant;

  // Armor cover percentages for paper doll
  const playerArmor: Record<BodyZone, number> = {
    head: player.zones.head.armor?.cover ?? 0,
    neck: player.zones.neck.armor?.cover ?? 0,
    torso: player.zones.torso.armor?.cover ?? 0,
    limbs: player.zones.limbs.armor?.cover ?? 0,
  };
  const playerWounds: Record<BodyZone, number> = {
    head: player.zones.head.woundLevel,
    neck: player.zones.neck.woundLevel,
    torso: player.zones.torso.woundLevel,
    limbs: player.zones.limbs.woundLevel,
  };

  const handleStrike = () => {
    if (!loading) onCommand(`STRIKE ${selectedZone.toUpperCase()}`);
  };

  const handleFlee = () => {
    if (!loading) onCommand("FLEE");
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(8px)",
      fontFamily: "Georgia, serif",
      color: "#dddddd",
    }}>
      {/* Title */}
      <div style={{
        fontSize: 12,
        letterSpacing: "0.15em",
        color: "#fbbf24",
        marginBottom: 16,
        fontFamily: "ui-sans-serif, sans-serif",
        textTransform: "uppercase",
      }}>
        Combat — Round {session.roundNumber}
      </div>

      {/* Main panel */}
      <div style={{
        display: "flex",
        gap: 24,
        maxWidth: 720,
        width: "100%",
        padding: "0 16px",
      }}>
        {/* Left column: Paper doll + player info */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          minWidth: 140,
        }}>
          <PaperDoll
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            armorCover={playerArmor}
            woundLevels={playerWounds}
            disabled={loading}
          />

          {/* Player HP */}
          <div style={{ fontSize: 11, color: "#aaaaaa", textAlign: "center" }}>
            <div style={{ marginBottom: 2 }}>You: {playerHp}/{playerMaxHp}</div>
            {hpBar(playerHp, playerMaxHp, 120)}
          </div>

          {/* Player status effects */}
          {player.activeEffects.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", maxWidth: 130 }}>
              {player.activeEffects.map((e, i) => (
                <span key={i} style={{
                  fontSize: 8,
                  padding: "1px 4px",
                  borderRadius: 3,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  border: `1px solid ${EFFECT_COLORS[e.type] ?? "#666"}`,
                  color: EFFECT_COLORS[e.type] ?? "#999",
                  whiteSpace: "nowrap",
                }}>
                  {e.type.replace(/_/g, " ")}
                  {e.severity > 1 ? ` x${e.severity}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Center column: Combat log */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          {/* Enemy info */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 10px",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            border: "1px solid #333",
            borderRadius: 4,
          }}>
            <span style={{ color: "#f87171", fontWeight: "bold", fontSize: 13 }}>{enemy.name}</span>
            <div style={{ flex: 1 }}>
              {hpBar(enemy.hp, enemy.maxHp, 999)}
            </div>
            <span style={{ fontSize: 11, color: "#aaaaaa", whiteSpace: "nowrap" }}>
              {enemy.hp}/{enemy.maxHp}
            </span>
          </div>

          {/* Enemy status effects */}
          {enemy.activeEffects.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {enemy.activeEffects.map((e, i) => (
                <span key={i} style={{
                  fontSize: 8,
                  padding: "1px 4px",
                  borderRadius: 3,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  border: `1px solid ${EFFECT_COLORS[e.type] ?? "#666"}`,
                  color: EFFECT_COLORS[e.type] ?? "#999",
                }}>
                  {e.type.replace(/_/g, " ")}
                  {e.severity > 1 ? ` x${e.severity}` : ""}
                </span>
              ))}
            </div>
          )}

          {/* Combat log */}
          <div style={{
            flex: 1,
            minHeight: 180,
            maxHeight: 280,
            overflowY: "auto",
            padding: "8px 10px",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid #222",
            borderRadius: 4,
            fontSize: 12,
            lineHeight: 1.6,
          }}>
            {combatLog.length === 0 ? (
              <div style={{ color: "#555", fontStyle: "italic" }}>
                Choose a target zone and strike.
              </div>
            ) : (
              combatLog.map((line, i) => (
                <div key={i} style={{
                  marginBottom: 8,
                  color: i === combatLog.length - 1 ? "#dddddd" : "#888888",
                  whiteSpace: "pre-wrap",
                }}>
                  {line}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Zone select buttons */}
            {BODY_ZONES.map(z => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  fontSize: 10,
                  fontFamily: "ui-sans-serif, sans-serif",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  backgroundColor: selectedZone === z ? "rgba(251, 191, 36, 0.2)" : "rgba(255,255,255,0.03)",
                  border: selectedZone === z ? "1px solid #fbbf24" : "1px solid #333",
                  borderRadius: 4,
                  color: selectedZone === z ? "#fbbf24" : "#888",
                  cursor: loading ? "default" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {ZONE_LABELS[z]}
                <div style={{ fontSize: 7, color: "#666", marginTop: 1 }}>
                  {ZONE_EVASION_HINT[z]}
                </div>
              </button>
            ))}
          </div>

          {/* Strike + Flee */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleStrike}
              disabled={loading}
              style={{
                flex: 3,
                padding: "10px 0",
                fontSize: 14,
                fontWeight: "bold",
                fontFamily: "Georgia, serif",
                letterSpacing: "0.1em",
                backgroundColor: loading ? "#333" : "rgba(251, 191, 36, 0.15)",
                border: "1px solid #fbbf24",
                borderRadius: 4,
                color: loading ? "#666" : "#fbbf24",
                cursor: loading ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {loading ? "..." : `STRIKE ${ZONE_LABELS[selectedZone]}`}
            </button>
            <button
              onClick={handleFlee}
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 0",
                fontSize: 11,
                fontFamily: "ui-sans-serif, sans-serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid #555",
                borderRadius: 4,
                color: loading ? "#444" : "#aaaaaa",
                cursor: loading ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              FLEE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
