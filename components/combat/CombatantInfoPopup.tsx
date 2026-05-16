// Read-only stats panel for any combatant. Opens when the player
// clicks a sprite portrait. No actions — purely informational.
//
// FUTURE (DEFERRED 2026-05-09): this popup will eventually become the
// home for a per-companion relationship log — short backstory, notable
// shared moments, kill count, lives saved, heals given. The intent is
// to compile every meaningful interaction (kills made, hero saved at
// HP < threshold, heals applied, deaths witnessed) into a personal
// chronicle that grows with the campaign. The bottom of this popup
// has a placeholder section reserving the space; the popup will need
// to scroll once the log lands.
"use client";

import { useEffect } from "react";
import type { CombatantState } from "../../lib/combat/types";
import { ITEMS } from "../../lib/gameData";
import { EFFECT_ICON_MAP } from "../../lib/combat/effectIconData";
import { WEAPON_DATA } from "../../lib/uoData";

interface CombatantInfoPopupProps {
  c: CombatantState;
  onClose: () => void;
}

export default function CombatantInfoPopup({
  c,
  onClose,
}: CombatantInfoPopupProps): React.JSX.Element {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const accent = c.team === "ally" ? "#fbbf24" : "#f87171";
  const weaponName = ITEMS[c.weaponId]?.name ?? c.weaponId;
  const weaponDamage = WEAPON_DATA[c.weaponId]?.damage ?? null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 250,
        cursor: "pointer",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(88vw, 380px)",
          // Cap height so the panel scrolls once the deferred relationship
          // log lands and content overflows. Today the panel rarely needs
          // to scroll, but the rule is set now to avoid a layout reshuffle
          // when the chronicle ships.
          maxHeight: "min(86vh, 720px)",
          overflowY: "auto",
          background: "linear-gradient(135deg, rgba(22,16,10,0.94) 0%, rgba(12,8,4,0.97) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${accent}55`,
          borderRadius: 10,
          boxShadow: `0 24px 64px rgba(0,0,0,0.85), 0 0 24px ${accent}25`,
          padding: "20px 22px",
          cursor: "default",
          fontFamily: "Georgia, serif",
          color: "#e8d4a0",
        }}
      >
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: accent,
            marginBottom: 4,
            textShadow: "0 1px 2px rgba(0,0,0,0.85)",
          }}
        >
          {c.name}
        </div>
        <div style={{ fontSize: 11, color: "#8a7a60", marginBottom: 14 }}>
          {c.team === "ally" ? "Ally" : "Enemy"} · position {c.position < 0 ? "—" : c.position}
          {c.controlledBy === "player" && " · player-controlled"}
        </div>

        <Row label="HP" value={`${c.hp} / ${c.maxHp}`} accent="#dc2626" />
        {c.maxMana > 0 && (
          <Row label="Mana" value={`${c.mana} / ${c.maxMana}`} accent="#3b82f6" />
        )}
        <Row
          label="Weapon"
          value={weaponDamage ? `${weaponName} · ${weaponDamage}` : weaponName}
        />
        <Row label="STR / DEX" value={`${c.strength} / ${c.dexterity}`} />

        {c.activeEffects.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#8a7a60", marginBottom: 6 }}>Active effects</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {c.activeEffects.map((e, i) => {
                // Look up label + description from the canonical effect
                // registry. Falls back to the raw type if an effect was
                // added to the type union without an icon-data entry.
                const meta = EFFECT_ICON_MAP[e.type];
                const label = meta?.label ?? e.type;
                const description = meta?.description ?? "";
                const color = meta?.color ?? "#cdb78a";
                return (
                  <div
                    key={i}
                    style={{
                      padding: "6px 8px",
                      background: "rgba(146,64,14,0.12)",
                      border: `1px solid ${color}55`,
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>
                        {label}
                        {e.severity > 1 ? ` ×${e.severity}` : ""}
                      </span>
                      <span style={{ fontSize: 10, color: "#8a7a60" }}>
                        {e.turnsRemaining > 0
                          ? `${e.turnsRemaining} turn${e.turnsRemaining === 1 ? "" : "s"} left`
                          : "—"}
                      </span>
                    </div>
                    {description && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#cdb78a",
                          marginTop: 3,
                          lineHeight: 1.4,
                        }}
                      >
                        {description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {c.knownSpells.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "#8a7a60", marginBottom: 4 }}>
              Known spells ({c.knownSpells.length})
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#cdb78a",
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              {c.knownSpells.join(", ")}
            </div>
          </div>
        )}

        {/* DEFERRED — Relationship Chronicle.
            Placeholder for the future per-companion log: short backstory,
            shared moments, kill count, lives saved, heals given. Will
            populate from atom flags + combat-log scraping. Until then,
            this dim panel reserves the space and signals to the player
            that more is coming. */}
        {c.team === "ally" && c.controlledBy !== "player" && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              background: "rgba(8,5,3,0.5)",
              border: "1px dashed rgba(146,64,14,0.35)",
              borderRadius: 4,
              fontSize: 11,
              color: "#5a4a3a",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: "#7a6a4a", marginBottom: 4 }}>
              Chronicle (coming soon)
            </div>
            Backstory, shared deeds, kills made, times {c.name} saved your
            life — none of it is being recorded yet. The Chronicle ships in
            a future sprint.
          </div>
        )}

        <div style={{ marginTop: 14, textAlign: "right", fontSize: 10, color: "#5a4a3a" }}>
          Esc or click outside to close
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        borderBottom: "1px solid rgba(146,64,14,0.18)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "#8a7a60" }}>{label}</span>
      <span style={{ color: accent ?? "#e8d4a0", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
