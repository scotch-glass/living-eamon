// Read-only spellbook modal for Combat Arena v2.
// Lists every entry in c.knownSpells, grouped by Guild CAST (Circles 1–3)
// and Outer Dark INVOKE (Circles 4–8). Spells with a real engine handler
// (per `hasCombatHandler` in lib/combat/spellData.ts) get a green
// "✓ READY" badge; others render dimmed with a "not yet" badge.
// Click-to-slot is deferred to a follow-up sprint.
"use client";

import { useEffect } from "react";
import type { CombatantState } from "../../lib/combat/types";
import { hasCombatHandler } from "../../lib/combat/spellData";
import { findSpell, type SpellDef } from "./sharedWidgets";
import { SPELL_REGISTRY } from "../../lib/sorcery/registry";
import type { Spell } from "../../lib/sorcery/types";

interface SpellbookProps {
  c: CombatantState;
  onClose: () => void;
}

interface CastRow {
  kind: "cast";
  name: string;
  spell: SpellDef;
  ready: boolean;
}
interface InvokeRow {
  kind: "invoke";
  name: string;
  spell: Spell;
  ready: boolean;
}
type Row = CastRow | InvokeRow;

function classifyKnownSpells(knownSpells: string[]): { cast: CastRow[]; invoke: InvokeRow[] } {
  const cast: CastRow[] = [];
  const invoke: InvokeRow[] = [];

  for (const raw of knownSpells) {
    const upper = raw.toUpperCase();
    const def = findSpell(upper);
    if (def) {
      cast.push({ kind: "cast", name: upper, spell: def, ready: hasCombatHandler(upper) });
      continue;
    }
    // Try SPELL_REGISTRY — names are kebab-case ids; combat hotbar uses
    // either uppercase forms or names converted by lowercase+hyphen.
    const id = upper.toLowerCase();
    const occ = SPELL_REGISTRY.find((s) => s.id === id || s.name.toUpperCase() === upper);
    if (occ && occ.circle >= 4) {
      invoke.push({ kind: "invoke", name: upper, spell: occ, ready: false });
    } else if (occ) {
      // Sub-Circle-4 sorcery counted as CAST flavor — treat as cast,
      // but with no engine handler (so it shows "not yet").
      cast.push({
        kind: "cast",
        name: upper,
        spell: {
          name: upper,
          label: occ.name,
          glyph: "✶",
          cost: occ.manaCost,
          color: "#a3a3a3",
          school: "Sorcery",
          effect: occ.description,
          lore: occ.description,
          targeting: "self",
        },
        ready: false,
      });
    }
  }

  return { cast, invoke };
}

export default function Spellbook({ c, onClose }: SpellbookProps): React.JSX.Element {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const { cast, invoke } = classifyKnownSpells(c.knownSpells ?? []);

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
          width: "min(88vw, 480px)",
          maxHeight: "82vh",
          overflowY: "auto",
          background: "linear-gradient(135deg, rgba(22,16,10,0.95) 0%, rgba(12,8,4,0.97) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(146,64,14,0.55)",
          borderRadius: 10,
          boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 24px rgba(251,191,36,0.18)",
          padding: "20px 24px",
          cursor: "default",
          fontFamily: "Georgia, serif",
          color: "#e8d4a0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            paddingBottom: 8,
            borderBottom: "1px solid rgba(146,64,14,0.4)",
          }}
        >
          <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fbbf24" }}>
            Spellbook — {c.name}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "1px solid rgba(146,64,14,0.4)",
              color: "#cdb78a",
              borderRadius: 4,
              padding: "2px 8px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "Georgia, serif",
            }}
          >
            ✕
          </button>
        </div>

        <Section title="Guild CAST" subtitle="Circles 1–3" rows={cast} />
        <Section title="Outer Dark INVOKE" subtitle="Circles 4–8" rows={invoke} />

        <div style={{ marginTop: 14, fontSize: 10, color: "#5a4a3a", textAlign: "right" }}>
          Esc or click outside to close
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Row[];
}): React.JSX.Element {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#fbbf24",
          marginBottom: 6,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 10, color: "#8a7a60", letterSpacing: "0.08em" }}>{subtitle}</span>
      </div>
      {rows.length === 0 ? (
        <div
          style={{
            fontSize: 12,
            fontStyle: "italic",
            color: "#5a4a3a",
            padding: "4px 6px",
          }}
        >
          (none known)
        </div>
      ) : (
        rows.map((row, i) => <SpellRow key={i} row={row} />)
      )}
    </div>
  );
}

function SpellRow({ row }: { row: Row }): React.JSX.Element {
  const isCast = row.kind === "cast";
  const def = isCast ? row.spell : null;
  const occ = isCast ? null : row.spell;
  const glyph = def?.glyph ?? "✶";
  const label = def?.label ?? occ?.name ?? row.name;
  const color = def?.color ?? "#a3a3a3";
  const circle = isCast ? null : occ!.circle;
  const cost = def?.cost ?? occ?.manaCost ?? null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 6px",
        borderBottom: "1px solid rgba(146,64,14,0.18)",
        opacity: row.ready ? 1 : 0.5,
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 22,
          textAlign: "center",
          color,
          textShadow: row.ready ? `0 0 4px ${color}80` : "none",
          flexShrink: 0,
        }}
      >
        {glyph}
      </span>
      <span style={{ flex: 1, color: row.ready ? "#e8d4a0" : "#8a7a60", fontWeight: 600 }}>
        {label}
      </span>
      {circle != null && (
        <span style={{ fontSize: 10, color: "#8a7a60", flexShrink: 0 }}>C{circle}</span>
      )}
      {cost != null && (
        <span style={{ fontSize: 10, color: "#7dd3fc", flexShrink: 0 }}>{cost} mana</span>
      )}
      <span
        style={{
          fontSize: 9,
          padding: "2px 6px",
          borderRadius: 3,
          flexShrink: 0,
          fontWeight: 700,
          letterSpacing: "0.08em",
          background: row.ready ? "rgba(34,197,94,0.18)" : "rgba(146,64,14,0.15)",
          border: `1px solid ${row.ready ? "rgba(34,197,94,0.55)" : "rgba(146,64,14,0.4)"}`,
          color: row.ready ? "#4ade80" : "#8a7a60",
        }}
      >
        {row.ready ? "✓ READY" : "not yet"}
      </span>
    </div>
  );
}
