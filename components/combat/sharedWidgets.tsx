// Shared combat widgets — verbatim copies of the v1 CombatScreen.tsx
// internals so the Combat Arena v2 can compose them without modifying
// or re-importing from the v1 file. Hard rule (2026-05-07 post-mortem):
// CombatScreen.tsx is untouchable. Patterns are copied OUT, not shared
// in-place. When v1 is eventually retired, the duplicates in CombatScreen
// can be deleted in a separate sweep.
"use client";

import { useEffect, useRef } from "react";
import type { BodyZone, CombatantState } from "../../lib/combat/types";

// ── Zone labels ─────────────────────────────────────────────

export const ZONE_LABELS: Record<BodyZone, string> = {
  head: "HEAD",
  neck: "NECK",
  torso: "TORSO",
  limbs: "LIMBS",
};

// ── Popover anchoring ──────────────────────────────────────
//
// Combat hotbar buttons live at the FOOT of each character, near the
// bottom of the viewport. A naive `top: anchorRect.top` overflows below
// the screen. Instead, anchor the popover's BOTTOM edge to just above
// the trigger so the popover GROWS UPWARD. Horizontally we still place
// to the right of the trigger; if that would overflow the right edge,
// flip to the left side. SSR-safe (returns top-anchor when window is
// undefined since the popover never renders server-side anyway).

export function popoverAboveAnchor(rect: {
  top: number;
  left: number;
  width: number;
  height: number;
}): React.CSSProperties {
  if (typeof window === "undefined") {
    return {
      position: "fixed",
      top: rect.top,
      left: rect.left + rect.width + 6,
    };
  }
  const GAP = 6;
  const EST_POPOVER_WIDTH = 180;
  const wantsLeft = rect.left + rect.width + GAP + EST_POPOVER_WIDTH > window.innerWidth;
  return {
    position: "fixed",
    bottom: window.innerHeight - rect.top + GAP,
    ...(wantsLeft
      ? { right: window.innerWidth - rect.left + GAP }
      : { left: rect.left + rect.width + GAP }),
  };
}

// ── Spell catalog ───────────────────────────────────────────

export interface SpellDef {
  name: string;     // CAST argument, uppercase
  label: string;
  glyph: string;
  cost: number;
  color: string;
  school: string;
  effect: string;
  lore: string;
  /** "self" = caster targets self; "enemy" = picks an opposing combatant. */
  targeting: "self" | "enemy" | "none";
}

export const COMBAT_SPELLS: SpellDef[] = [
  {
    name: "HEAL",
    label: "Heal",
    glyph: "❤",
    cost: 4,
    color: "#dc2626",
    school: "Restoration",
    effect: "Restores 18-32 HP",
    lore:
      "A simple binding of the body's own knitting-force. The caster speaks the wound shut " +
      "and the flesh remembers what it was. Restores between 18 and 32 hit points to the " +
      "target. Costs 4 mana. The Thurian field-priests carried it everywhere they went.",
    targeting: "self",
  },
  {
    name: "BLAST",
    label: "Blast",
    glyph: "⚡",
    cost: 6,
    color: "#facc15",
    school: "Evocation",
    effect: "2d8+4 lightning damage",
    lore:
      "A short, ugly spear of stormlight from the caster's open hand. Deals 2d8+4 lightning " +
      "damage to a single target on the opposite side of the field. Costs 6 mana. Loud " +
      "enough to draw attention — use it where being seen is acceptable.",
    targeting: "enemy",
  },
  {
    name: "SPEED",
    label: "Speed",
    glyph: "🪶",
    cost: 3,
    color: "#60a5fa",
    school: "Enchantment",
    effect: "+10 dex for 3 rounds",
    lore:
      "The body remembers wings it never had. The target's reactions sharpen and their feet " +
      "lighten — +10 effective dexterity for the next 3 rounds. Costs 3 mana. Cheap, brief, " +
      "and good. The Thurian assassins wove it into their breath and called it nothing in " +
      "particular.",
    targeting: "self",
  },
  {
    name: "GREATER-HEAL",
    label: "Greater Heal",
    glyph: "✚",
    cost: 8,
    color: "#fb7185",
    school: "Restoration",
    effect: "Restores 35-55 HP",
    lore:
      "A deeper binding of the body's knitting-force. Where HEAL closes a wound, GREATER-HEAL " +
      "rebuilds what was lost. Restores between 35 and 55 hit points. Costs 8 mana.",
    targeting: "self",
  },
  {
    name: "FIREBOLT",
    label: "Firebolt",
    glyph: "🔥",
    cost: 6,
    color: "#f97316",
    school: "Evocation",
    effect: "3d6+4 fire damage",
    lore:
      "A bright dart of fire from the caster's fingertip. Sets dry cloth alight on a clean hit. " +
      "Deals 3d6+4 fire damage. Costs 6 mana.",
    targeting: "enemy",
  },
  {
    name: "HASTE",
    label: "Haste",
    glyph: "💨",
    cost: 4,
    color: "#22d3ee",
    school: "Enchantment",
    effect: "+1 action/round, +3 DEX, 2 rounds",
    lore:
      "The target accelerates between heartbeats. For the next 2 rounds they take an extra " +
      "action each round AND gain +3 effective dexterity. Net of the cast cost: two free " +
      "swings, not one. Costs 4 mana. Worth the slot.",
    targeting: "self",
  },
  {
    name: "WARD",
    label: "Ward",
    glyph: "🛡",
    cost: 5,
    color: "#a3e635",
    school: "Abjuration",
    effect: "−8 damage / hit, 3 rounds",
    lore:
      "A barrier of woven Words. Each incoming physical blow lands 8 damage lighter for the " +
      "next 3 rounds. A clean strike that would have killed becomes a wound; a glancing blow " +
      "becomes nothing. Costs 5 mana.",
    targeting: "self",
  },
  {
    name: "STEELSKIN",
    label: "Steelskin",
    glyph: "⛨",
    cost: 5,
    color: "#9ca3af",
    school: "Abjuration",
    effect: "Halve all physical damage, 4 rounds",
    lore:
      "The target's skin remembers iron. ALL incoming physical damage — every strike, every " +
      "round — is halved for the next 4 rounds. Costs 5 mana. The Word holds whether you stand " +
      "or fall; whether you are struck once or twenty times.",
    targeting: "self",
  },
  {
    name: "SILENCE",
    label: "Silence",
    glyph: "🤫",
    cost: 4,
    color: "#6b7280",
    school: "Abjuration",
    effect: "Cancels target's casting",
    lore:
      "Words die in the target's throat. Their channeling spell breaks; their next cast is " +
      "interrupted. Costs 4 mana.",
    targeting: "enemy",
  },
  {
    name: "RESIST",
    label: "Resist",
    glyph: "⊘",
    cost: 4,
    color: "#84cc16",
    school: "Abjuration",
    effect: "Halve BLAST/FIREBOLT, 3 rounds",
    lore:
      "The body refuses fire and stormlight. Damage from BLAST and FIREBOLT is halved for " +
      "the next 3 rounds. Costs 4 mana. Good against sorcerous opponents; useless against " +
      "a man with a sword.",
    targeting: "self",
  },
  {
    name: "CLEANSE",
    label: "Cleanse",
    glyph: "🜄",
    cost: 4,
    color: "#67e8f9",
    school: "Restoration",
    effect: "Removes one debuff",
    lore:
      "Strips poison, disease, or one hostile enchantment from the target. Costs 4 mana.",
    targeting: "self",
  },
];

export function findSpell(name: string): SpellDef | null {
  const upper = name.toUpperCase();
  return COMBAT_SPELLS.find((s) => s.name === upper) ?? null;
}

// ── VerticalBar ─────────────────────────────────────────────

function hpBarColor(_pct: number): string {
  return "#dc2626";
}

export function VerticalBar({
  current,
  max,
  height,
  color,
  label,
}: {
  current: number;
  max: number;
  height: number | string;
  color: "hp" | "mana";
  label: string;
}): React.JSX.Element {
  const pct = max > 0 ? Math.max(0, current) / max : 0;
  const fill = color === "mana" ? "#3b82f6" : hpBarColor(pct);
  const glow = color === "mana" ? "rgba(59,130,246,0.35)" : `${fill}60`;
  return (
    <div
      title={`${label}: ${current} / ${max}`}
      style={{
        width: 10,
        height,
        background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.9) 100%)",
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          width: "100%",
          height: `${pct * 100}%`,
          background: `linear-gradient(180deg, ${fill}ee 0%, ${fill} 100%)`,
          transition: "height 0.4s ease, background 0.4s ease",
          boxShadow: `0 0 6px ${glow}`,
        }}
      />
    </div>
  );
}

// ── SpellIcon ───────────────────────────────────────────────

interface SpellIconProps {
  spell: SpellDef;
  known: boolean;
  loading: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function SpellIcon({ spell, known, loading, onClick }: SpellIconProps): React.JSX.Element {
  return (
    <button
      onClick={known && !loading ? onClick : undefined}
      disabled={!known || loading}
      title={
        known
          ? `${spell.label} (${spell.cost} mana) — click to cast`
          : `${spell.label} — not yet learned`
      }
      style={{
        width: 22,
        height: 22,
        padding: 0,
        background: known
          ? `radial-gradient(circle at 50% 45%, ${spell.color}40 0%, rgba(0,0,0,0.5) 70%)`
          : "rgba(0,0,0,0.45)",
        border: `1px solid ${known ? spell.color + "aa" : "rgba(146,64,14,0.25)"}`,
        borderRadius: 3,
        color: known ? spell.color : "#3a2f25",
        fontSize: 12,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: known && !loading ? "pointer" : "default",
        opacity: known ? 1 : 0.4,
        transition: "all 0.15s",
        textShadow: known ? `0 0 4px ${spell.color}` : "none",
        filter: known ? undefined : "grayscale(1) brightness(0.5)",
      }}
      onMouseEnter={(e) => {
        if (known && !loading) {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 8px ${spell.color}80`;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {spell.glyph}
    </button>
  );
}

// ── SpellActionMenu — Cast / Lore ───────────────────────────

interface SpellActionMenuProps {
  spell: SpellDef;
  anchorRect: { top: number; left: number; width: number; height: number };
  onCast: () => void;
  onLore: () => void;
  onClose: () => void;
}

export function SpellActionMenu({
  spell,
  anchorRect,
  onCast,
  onLore,
  onClose,
}: SpellActionMenuProps): React.JSX.Element {
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
        minWidth: 140,
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
          color: spell.color,
          fontWeight: 700,
          borderBottom: "1px solid #2a1d0e",
          marginBottom: 2,
          display: "flex",
          alignItems: "center",
          gap: 6,
          textShadow: `0 0 4px ${spell.color}80`,
        }}
      >
        <span>{spell.glyph}</span>
        <span>{spell.label}</span>
        <span style={{ marginLeft: "auto", fontSize: 9, color: "#8a7a60", fontWeight: 400 }}>
          {spell.cost} mana
        </span>
      </div>
      {[
        { label: "Cast", onClick: onCast },
        { label: "Lore", onClick: onLore },
      ].map((action, i) => (
        <button
          key={i}
          onClick={action.onClick}
          style={{
            display: "block",
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
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ── SpellDetailPopup — full-screen lore modal ───────────────

export function SpellDetailPopup({
  spell,
  onClose,
}: {
  spell: SpellDef;
  onClose: () => void;
}): React.JSX.Element {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
          width: "min(88vw, 440px)",
          background: "linear-gradient(135deg, rgba(22,16,10,0.94) 0%, rgba(12,8,4,0.97) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${spell.color}55`,
          borderRadius: 10,
          boxShadow: `0 24px 64px rgba(0,0,0,0.85), 0 0 24px ${spell.color}25`,
          padding: "22px 24px",
          cursor: "default",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              color: spell.color,
              background: `radial-gradient(circle at 50% 45%, ${spell.color}30 0%, rgba(0,0,0,0.5) 70%)`,
              border: `1px solid ${spell.color}aa`,
              borderRadius: 6,
              textShadow: `0 0 12px ${spell.color}`,
              flexShrink: 0,
            }}
          >
            {spell.glyph}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                color: spell.color,
                lineHeight: 1.1,
                textShadow: `0 1px 2px rgba(0,0,0,0.85)`,
              }}
            >
              {spell.label}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#8a7a60",
                marginTop: 4,
                display: "flex",
                gap: 12,
              }}
            >
              <span>{spell.school}</span>
              <span>{spell.cost} mana</span>
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "8px 12px",
            borderTop: "1px solid rgba(146,64,14,0.3)",
            borderBottom: "1px solid rgba(146,64,14,0.3)",
            marginBottom: 14,
            fontSize: "0.85rem",
            color: "#e8d4a0",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {spell.effect}
        </div>
        <div
          style={{
            fontSize: "0.85rem",
            color: "#cdb78a",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {spell.lore}
        </div>
      </div>
    </div>
  );
}

// ── TargetPicker ────────────────────────────────────────────

interface TargetPickerProps {
  spell: SpellDef | null;          // null = STRIKE picker
  zone: BodyZone | null;           // STRIKE zone, or null for CAST
  anchorRect: { top: number; left: number; width: number; height: number };
  candidates: CombatantState[];
  isStrike: boolean;
  onSelect: (target: CombatantState) => void;
  onClose: () => void;
}

export function TargetPicker({
  spell,
  zone,
  anchorRect,
  candidates,
  isStrike,
  onSelect,
  onClose,
}: TargetPickerProps): React.JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
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

  const headerColor = spell?.color ?? "#fbbf24";
  const headerLabel = spell ? spell.label : zone ? `Strike ${ZONE_LABELS[zone]}` : "Strike";

  return (
    <div
      ref={menuRef}
      style={{
        ...popoverAboveAnchor(anchorRect),
        zIndex: 200,
        minWidth: 160,
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
          color: headerColor,
          fontWeight: 700,
          borderBottom: "1px solid #2a1d0e",
          marginBottom: 2,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {spell && <span>{spell.glyph}</span>}
        <span>{headerLabel}</span>
        <span style={{ marginLeft: "auto", fontSize: 9, color: "#8a7a60", fontWeight: 400 }}>
          Target
        </span>
      </div>
      {candidates.map((c) => {
        // Engine evasion bonus per rank (lib/combat/engine.ts:79):
        // pos 1 = +0, pos 2 = +10, pos 3 = +20. Show the hint for
        // STRIKE picks so the player understands why hitting back-rank
        // casters is hard.
        let evasionHint: string | null = null;
        if (isStrike) {
          if (c.position === 2) evasionHint = "harder to hit (+10)";
          else if (c.position === 3) evasionHint = "much harder to hit (+20)";
        }
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              display: "block",
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
            {c.name}
            {evasionHint && (
              <span style={{ color: "#8a7a60", fontSize: 10, marginLeft: 6 }}>
                ({evasionHint})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
