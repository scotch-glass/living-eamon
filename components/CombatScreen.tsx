"use client";

import { useState, useEffect, useRef } from "react";
import type { BodyZone, ActiveCombatSession, CombatantState } from "../lib/combat/types";
import { BODY_ZONES } from "../lib/combat/types";
import type { PlayerState } from "../lib/gameState";
import { ITEMS, type Item } from "../lib/gameData";
import type { ItemContext } from "./ItemActionMenu";
import { EFFECT_COLORS } from "../lib/combat/effectIconData";
import { SPRITES } from "../lib/combat/sprites";
import { currentActorId } from "../lib/combat/engine";
import EffectMarkerIcon from "./EffectMarkerIcon";
import BloodOverlay from "./BloodOverlay";
import { generateHitSplatters, generateCritWound, generateAttackerSplatter, getWoundTierFromDamage, type BloodSplatter, type SplatterZone } from "../lib/bloodSplatterData";
import ItemIcon from "./ItemIcon";

// ── Props ───────────────────────────────────────────────────

export interface CombatScreenProps {
  session: ActiveCombatSession;
  playerHp: number;
  playerMaxHp: number;
  playerMana: number;
  playerMaxMana: number;
  /** Full player state — used to resolve equipped gear + inventory for the
   * hero's column (weapon/shield/helmet/gorget/bodyArmor/limbArmor icons
   * and potion quick-use icons). */
  playerState: PlayerState;
  /** Recent combat log lines (last few rounds) */
  combatLog: string[];
  /** True while waiting for API response */
  loading: boolean;
  /** Send a command back to the game engine */
  onCommand: (cmd: string) => void;
  /** Forward an item-icon click up to page.tsx so it can open the
   * shared ItemActionMenu popup (Drink / Inspect / Unequip / etc.). */
  onIconClick?: (item: Item, context: ItemContext, rect: DOMRect) => void;
  /** Persistent hero blood splatters that accumulate across fights.
   * Passed down from page.tsx; updated via onHeroGoreChange. */
  heroGoreSplatters?: BloodSplatter[];
  /** Callback when hero gore changes (new splatters from enemy hits). */
  onHeroGoreChange?: (splatters: BloodSplatter[]) => void;
}

// ── Zone labels + hints ─────────────────────────────────────

const ZONE_LABELS: Record<BodyZone, string> = {
  head: "HEAD",
  neck: "NECK",
  torso: "TORSO",
  limbs: "LIMBS",
};

const ZONE_EVASION_HINT: Record<BodyZone, string> = {
  torso: "easy",
  limbs: "moderate",
  head: "hard",
  neck: "very hard · 2×",
};

// EFFECT_COLORS imported from lib/effectIconData.ts

// ── Helpers ─────────────────────────────────────────────────

function hpBarColor(_pct: number): string {
  return "#dc2626";
}

function VerticalBar({
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
}) {
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
      <div style={{
        width: "100%",
        height: `${pct * 100}%`,
        background: `linear-gradient(180deg, ${fill}ee 0%, ${fill} 100%)`,
        transition: "height 0.4s ease, background 0.4s ease",
        boxShadow: `0 0 6px ${glow}`,
      }} />
    </div>
  );
}

function VerticalStatusCap({
  name,
  nameColor,
  hp,
  maxHp,
  mana,
  maxMana,
  barHeight = 64,
  spellSlots,
}: {
  name: string;
  nameColor: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  barHeight?: number;
  spellSlots?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      paddingBottom: 4,
      borderBottom: "1px solid rgba(146,64,14,0.35)",
      marginBottom: 4,
    }}>
      <div
        title={name}
        style={{
          fontSize: 9,
          fontFamily: "Georgia, serif",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: nameColor,
          fontWeight: 700,
          textAlign: "center",
          textShadow: "0 1px 2px rgba(0,0,0,0.95)",
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          lineHeight: 1.15,
          maxWidth: "100%",
        }}
      >
        {name}
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
        <VerticalBar current={hp} max={maxHp} height={barHeight} color="hp" label="HP" />
        {maxMana > 0 && (
          <VerticalBar current={mana} max={maxMana} height={barHeight} color="mana" label="Mana" />
        )}
        {spellSlots}
      </div>
    </div>
  );
}

// ── Spell catalog ───────────────────────────────────────────

interface SpellDef {
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

const COMBAT_SPELLS: SpellDef[] = [
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
    name: "POWER",
    label: "Power",
    glyph: "🙏",
    cost: 5,
    color: "#a855f7",
    school: "Augury",
    effect: "Unpredictable boon",
    lore:
      "A bargain prayed upward to a power the caster only half-knows. If the boon arrives — " +
      "if blessed, it may be an extra strike, mana surge, sudden vigor, momentary invisibility, " +
      "a divine vision — but extremely unreliable. Costs 5 mana. Veterans have already " +
      "accepted that the next round may be their last.",
    targeting: "none",
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
  // ── Circle 2 (Guild magic) ───────────────────────────────────
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
    effect: "Extra action next round",
    lore:
      "The target moves between heartbeats. Grants an extra action on the caster's next turn. " +
      "Costs 4 mana.",
    targeting: "self",
  },
  {
    name: "WARD",
    label: "Ward",
    glyph: "🛡",
    cost: 5,
    color: "#a3e635",
    school: "Abjuration",
    effect: "+8 armor for 3 rounds",
    lore:
      "A barrier of woven Words. +8 effective armor for the next 3 rounds. Costs 5 mana.",
    targeting: "self",
  },
  {
    name: "STEELSKIN",
    label: "Steelskin",
    glyph: "⛨",
    cost: 5,
    color: "#9ca3af",
    school: "Abjuration",
    effect: "Halve next strike",
    lore:
      "The target's skin remembers iron. The next physical strike against the target is halved. " +
      "Costs 5 mana.",
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
    effect: "Half elemental damage",
    lore:
      "The body refuses fire, ice, lightning. Halves elemental damage taken for 3 rounds. " +
      "Costs 4 mana.",
    targeting: "self",
  },
  {
    name: "DAYLIGHT",
    label: "Daylight",
    glyph: "☀",
    cost: 3,
    color: "#fde047",
    school: "Evocation",
    effect: "Bright light, blinds undead",
    lore:
      "A short stab of midday sun. Dark beings flinch; the wounded see better. Costs 3 mana.",
    targeting: "none",
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
  // Circle 3+ deferred until handlers ship — see Sprint C6.1 plan.
];

interface SpellIconProps {
  spell: SpellDef;
  known: boolean;
  loading: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function SpellIcon({ spell, known, loading, onClick }: SpellIconProps) {
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
      onMouseEnter={e => {
        if (known && !loading) {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 8px ${spell.color}80`;
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {spell.glyph}
    </button>
  );
}

// ── Spell action menu — Cast / Lore ──

interface SpellActionMenuProps {
  spell: SpellDef;
  anchorRect: { top: number; left: number; width: number; height: number };
  onCast: () => void;
  onLore: () => void;
  onClose: () => void;
}

function SpellActionMenu({ spell, anchorRect, onCast, onLore, onClose }: SpellActionMenuProps) {
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
        position: "fixed",
        top: anchorRect.top,
        left: anchorRect.left + anchorRect.width + 6,
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
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(146,64,14,0.3)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

// ── Spell lore popup ──

function SpellDetailPopup({ spell, onClose }: { spell: SpellDef; onClose: () => void }) {
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
        onClick={e => e.stopPropagation()}
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
          <div style={{
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
          }}>
            {spell.glyph}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: spell.color,
              lineHeight: 1.1,
              textShadow: `0 1px 2px rgba(0,0,0,0.85)`,
            }}>
              {spell.label}
            </div>
            <div style={{
              fontSize: "0.75rem",
              color: "#8a7a60",
              marginTop: 4,
              display: "flex",
              gap: 12,
            }}>
              <span>{spell.school}</span>
              <span>{spell.cost} mana</span>
            </div>
          </div>
        </div>
        <div style={{
          padding: "8px 12px",
          borderTop: "1px solid rgba(146,64,14,0.3)",
          borderBottom: "1px solid rgba(146,64,14,0.3)",
          marginBottom: 14,
          fontSize: "0.85rem",
          color: "#e8d4a0",
          fontWeight: 600,
          textAlign: "center",
        }}>
          {spell.effect}
        </div>
        <div style={{
          fontSize: "0.85rem",
          color: "#cdb78a",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}>
          {spell.lore}
        </div>
      </div>
    </div>
  );
}

// ── Target picker ───────────────────────────────────────────
// Shows 1-3 buttons, one per opposing combatant. STRIKE actions
// flag back-rank (position 3) targets as "harder to hit"; CAST
// ignores position. Defaults to first alive opposing combatant.

interface TargetPickerProps {
  spell: SpellDef | null;          // null = STRIKE picker
  zone: BodyZone | null;           // STRIKE zone, or null for CAST
  anchorRect: { top: number; left: number; width: number; height: number };
  candidates: CombatantState[];
  isStrike: boolean;
  onSelect: (target: CombatantState) => void;
  onClose: () => void;
}

function TargetPicker({ spell, zone, anchorRect, candidates, isStrike, onSelect, onClose }: TargetPickerProps) {
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
  const headerLabel = spell ? spell.label : (zone ? `Strike ${ZONE_LABELS[zone]}` : "Strike");

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: anchorRect.top,
        left: anchorRect.left + anchorRect.width + 6,
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
      {candidates.map(c => {
        const harderToHit = isStrike && c.position === 3;
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
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(146,64,14,0.3)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {c.name}
            {harderToHit && (
              <span style={{ color: "#8a7a60", fontSize: 10, marginLeft: 6 }}>
                (harder to hit)
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Sprite loader (hero sprite is fetched lazily) ───────────

const spriteCache = new Map<string, string>();

function useSpriteFromUrl(cacheKey: string, fetchUrl: string | null): { url: string | null; loading: boolean } {
  const [url, setUrl] = useState<string | null>(spriteCache.get(cacheKey) ?? null);
  const [loading, setLoading] = useState(!spriteCache.has(cacheKey));

  useEffect(() => {
    if (!fetchUrl) {
      setUrl(null);
      setLoading(false);
      return;
    }
    if (spriteCache.has(cacheKey)) {
      setUrl(spriteCache.get(cacheKey)!);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(fetchUrl)
      .then(r => r.json())
      .then((data: { url: string | null }) => {
        if (data.url) spriteCache.set(cacheKey, data.url);
        setUrl(data.url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cacheKey, fetchUrl]);

  return { url, loading };
}

/**
 * Resolve sprite for any combatant. Hero (npcId == null) hits the
 * hero-image API endpoint; static NPCs read from the SPRITES table.
 * Wraps SPRITES into the same `{ url, loading, flip }` shape the hero
 * loader uses so render code is symmetrical.
 *
 * Hooks-rule: hero hook is called unconditionally at the top of
 * CombatScreen (the hero is always present in `session.combatants`).
 * NPC sprite lookup is synchronous and hookless — safe to call inside
 * a render-time loop.
 */
function spriteResolver(
  c: CombatantState,
  heroSprite: { url: string | null; loading: boolean },
): { url: string | null; loading: boolean; flip: boolean } {
  if (c.npcId == null) {
    // Prefer the canonical combat sprite from SPRITES["hero"] (e.g.
    // gaius greatsword) over the API-fetched master, so the test arena
    // and any pre-rolled hero combat sprite always wins. Fall back to
    // the live API URL when no static entry exists.
    const heroEntry = SPRITES.hero;
    if (heroEntry?.src) {
      return { url: heroEntry.src, loading: false, flip: heroEntry.flip ?? false };
    }
    return { url: heroSprite.url, loading: heroSprite.loading, flip: false };
  }
  const entry = SPRITES[c.npcId];
  return { url: entry?.src ?? null, loading: false, flip: entry?.flip ?? false };
}

// ── TurnOrderRail ───────────────────────────────────────────
// Pip per combatant in initiative order; current pip outlined gold;
// dead pips dimmed. Channeling combatants get a glowing rune badge
// with turnsRemaining.

function TurnOrderRail({ session }: { session: ActiveCombatSession }) {
  return (
    <div style={{
      position: "absolute",
      top: 8,
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      padding: "4px 10px",
      background: "rgba(0,0,0,0.55)",
      border: "1px solid rgba(146,64,14,0.45)",
      borderRadius: 4,
      zIndex: 10,
      maxWidth: "90vw",
    }}>
      <span style={{
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#fbbf24",
        marginRight: 4,
      }}>
        R{session.roundNumber + 1}
      </span>
      {session.turnOrder.map((id, i) => {
        const c = session.combatants.find(x => x.id === id);
        const isCurrent = i === session.currentTurnIdx;
        const isDead = !c || c.hp <= 0;
        const isAlly = c?.team === "ally";
        const baseColor = isAlly ? "#fbbf24" : "#f87171";
        const isLast = i === session.turnOrder.length - 1;
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              title={c?.name ?? id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "2px 6px",
                fontSize: 10,
                fontFamily: "Georgia, serif",
                color: isDead ? "#5a4a3a" : baseColor,
                background: isCurrent ? "rgba(251,191,36,0.18)" : "transparent",
                border: `1px solid ${isCurrent ? "#fbbf24" : "rgba(146,64,14,0.3)"}`,
                borderRadius: 3,
                opacity: isDead ? 0.45 : 1,
                textDecoration: isDead ? "line-through" : "none",
                boxShadow: isCurrent ? "0 0 6px rgba(251,191,36,0.5)" : "none",
              }}
            >
              <span>{c?.name ?? id}</span>
              {c?.channelingState && (
                <span
                  title={`Channeling ${c.channelingState.spellName}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 14,
                    height: 14,
                    padding: "0 3px",
                    borderRadius: 7,
                    background: "rgba(96,165,250,0.25)",
                    border: "1px solid rgba(96,165,250,0.7)",
                    color: "#bfdbfe",
                    fontSize: 9,
                    fontWeight: 700,
                    boxShadow: "0 0 6px rgba(96,165,250,0.7)",
                  }}
                >
                  ✦{c.channelingState.turnsRemaining}
                </span>
              )}
            </div>
            {!isLast && (
              <span
                aria-hidden
                style={{
                  color: "#92400e",
                  fontSize: 12,
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                →
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────

export default function CombatScreen({
  session,
  playerHp,
  playerMaxHp,
  playerMana,
  playerMaxMana,
  playerState,
  combatLog,
  loading,
  onCommand,
  onIconClick,
  heroGoreSplatters = [],
  onHeroGoreChange,
}: CombatScreenProps) {
  const [selectedZone, setSelectedZone] = useState<BodyZone>("torso");
  // Per-slot visibility — each column is independent.
  const [visibleSlots, setVisibleSlots] = useState<Set<string>>(new Set());
  const showTimesRef = useRef<Record<string, number>>({});
  const hideTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function handleSlotEnter(key: string) {
    if (hideTimersRef.current[key]) { clearTimeout(hideTimersRef.current[key]); delete hideTimersRef.current[key]; }
    setVisibleSlots(prev => new Set([...prev, key]));
    showTimesRef.current[key] = Date.now();
  }
  function handleSlotLeave(key: string) {
    const elapsed = Date.now() - (showTimesRef.current[key] ?? Date.now());
    const delay = Math.max(0, 3000 - elapsed) + 3000;
    hideTimersRef.current[key] = setTimeout(() => {
      setVisibleSlots(prev => { const n = new Set(prev); n.delete(key); return n; });
      delete hideTimersRef.current[key];
    }, delay);
  }

  // Spell action menu / lore popup state.
  const [spellMenu, setSpellMenu] = useState<{
    spell: SpellDef;
    rect: { top: number; left: number; width: number; height: number };
    casterId: string;
  } | null>(null);
  const [spellDetail, setSpellDetail] = useState<SpellDef | null>(null);

  // Target picker — for STRIKE (zone+target) or CAST (spell+target).
  const [targetPicker, setTargetPicker] = useState<{
    kind: "strike" | "cast";
    rect: { top: number; left: number; width: number; height: number };
    casterId: string;
    zone?: BodyZone;
    spell?: SpellDef;
  } | null>(null);

  // Blood splatter state — enemy splatters are session-scoped, hero gore persists.
  const [enemyBlood, setEnemyBlood] = useState<Record<string, BloodSplatter[]>>({});
  // Per-combatant red flash on incoming damage.
  const [hitFlash, setHitFlash] = useState<string | null>(null);
  const [critVignette, setCritVignette] = useState(false);

  // HP snapshots per combatant id, to detect damage between renders.
  const prevHpRef = useRef<Record<string, number>>({});
  // Last STRIKE zone (for splatter placement).
  const lastZoneRef = useRef<SplatterZone>("torso");
  // Last STRIKE target (for splatter placement on the right combatant).
  const lastTargetRef = useRef<string | null>(null);

  // Reset enemy blood when the enemy roster changes.
  const enemyKeyRef = useRef<string>("");
  useEffect(() => {
    const enemyIds = session.combatants
      .filter(c => c.team === "enemy")
      .map(c => c.id)
      .sort()
      .join(",");
    if (enemyIds !== enemyKeyRef.current) {
      enemyKeyRef.current = enemyIds;
      setEnemyBlood({});
      const snapshot: Record<string, number> = {};
      for (const c of session.combatants) snapshot[c.id] = c.hp;
      prevHpRef.current = snapshot;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.combatants.map(c => `${c.id}:${c.team}`).join("|")]);

  // ── Hit detection ──
  useEffect(() => {
    const lastLog = combatLog[combatLog.length - 1] ?? "";
    const isCrit = lastLog.includes("__CRITICAL__");

    for (const c of session.combatants) {
      const prev = prevHpRef.current[c.id];
      const delta = (prev ?? c.hp) - c.hp;
      if (delta <= 0) {
        prevHpRef.current[c.id] = c.hp;
        continue;
      }

      if (c.team === "enemy") {
        const tier = getWoundTierFromDamage(delta, c.maxHp);
        const zone = (lastTargetRef.current === c.id ? lastZoneRef.current : "torso") as SplatterZone;
        const newSplatters = generateHitSplatters(zone, tier, isCrit);
        if (isCrit) {
          const wound = generateCritWound(zone);
          setEnemyBlood(prev => ({ ...prev, [c.id]: [...(prev[c.id] ?? []), ...newSplatters, ...wound] }));
          // Hero gets splattered if the hero landed the killing blow.
          const attackerSplatter = generateAttackerSplatter(zone);
          onHeroGoreChange?.([...heroGoreSplatters, ...attackerSplatter]);
          setCritVignette(true);
        } else {
          setEnemyBlood(prev => ({ ...prev, [c.id]: [...(prev[c.id] ?? []), ...newSplatters] }));
        }
        setHitFlash(c.id);
      } else if (c.npcId == null) {
        // Hero took damage — gate gore + flash to hero only.
        setHitFlash(c.id);
        if (isCrit) {
          const zones: SplatterZone[] = ["head", "neck", "torso", "torso", "torso", "limbs", "limbs"];
          const zone = zones[Math.floor(Math.random() * zones.length)];
          const wound = generateCritWound(zone);
          onHeroGoreChange?.([...heroGoreSplatters, ...wound]);
          setCritVignette(true);
        }
      } else {
        // Friendly NPC — flash only, no persistent gore.
        setHitFlash(c.id);
      }
      prevHpRef.current[c.id] = c.hp;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.combatants.map(c => `${c.id}:${c.hp}`).join("|"), session.roundNumber]);

  useEffect(() => {
    if (!hitFlash) return;
    const t = setTimeout(() => setHitFlash(null), 400);
    return () => clearTimeout(t);
  }, [hitFlash]);

  useEffect(() => {
    if (!critVignette) return;
    const t = setTimeout(() => setCritVignette(false), 800);
    return () => clearTimeout(t);
  }, [critVignette]);

  // ── Attack animation ──
  // attackerId pulses; defenderId shakes. Only the targeted combatant
  // shakes (no team-wide shake).
  const [atkAnim, setAtkAnim] = useState<{
    attackerId: string;
    defenderId: string;
  } | null>(null);
  const atkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateThenCommand = (cmd: string, attackerId: string, defenderId: string) => {
    if (loading || atkAnim) return;
    const zoneMatch = cmd.match(/STRIKE\s+(HEAD|NECK|TORSO|LIMBS)/i);
    if (zoneMatch) {
      lastZoneRef.current = zoneMatch[1].toLowerCase() as SplatterZone;
      lastTargetRef.current = defenderId;
    }
    setAtkAnim({ attackerId, defenderId });
    atkTimerRef.current = setTimeout(() => {
      onCommand(cmd);
      setTimeout(() => setAtkAnim(null), 350);
    }, 500);
  };

  // Hero sprite — lookup by lowercase player name. (Hooks must be called
  // unconditionally; the hero is always present in session.combatants.)
  const hero = session.combatants.find(c => c.npcId == null && c.controlledBy === "player");
  const heroId = (hero?.name ?? playerState.name ?? "hero").trim().toLowerCase();
  const heroSprite = useSpriteFromUrl(
    `hero_${heroId}`,
    `/api/hero-image?id=${encodeURIComponent(heroId)}`,
  );

  // Roster splits — front-rank closest to centerline.
  // Allies: position 1 sits rightmost (closest to enemies).
  // Enemies: position 1 sits leftmost (closest to allies).
  const allies = session.combatants
    .filter(c => c.team === "ally")
    .slice()
    .sort((a, b) => b.position - a.position);
  const enemies = session.combatants
    .filter(c => c.team === "enemy")
    .slice()
    // Sort descending so position-1 (Front) ends up at the highest
    // laneIndex — combined with the right-anchored geometry, that puts
    // Front-rank enemies closest to the centerline. (Position-3 Back
    // sits at laneIndex 0 = furthest right = furthest from centerline.)
    .sort((a, b) => b.position - a.position);

  // Active actor + gating.
  const activeId = currentActorId(session);
  const activeActor = activeId ? session.combatants.find(c => c.id === activeId) ?? null : null;
  const canActNow =
    !!activeActor &&
    activeActor.controlledBy === "player" &&
    activeActor.channelingState == null &&
    !activeActor.interruptedSinceLastTurn &&
    !session.finished &&
    !loading;

  // Default-target: first alive enemy (for hero strikes/casts) — for
  // ally combatants, picks first alive opposing combatant.
  function defaultTargetFor(caster: CombatantState): CombatantState | null {
    const opposing = session.combatants.filter(c => c.team !== caster.team && c.hp > 0);
    return opposing[0] ?? null;
  }

  // ── Hero gear / potion column data (hero-only) ──
  const heroEquipped: Item[] = [
    playerState.weapon === "unarmed" ? null : playerState.weapon,
    playerState.shield,
    playerState.helmet,
    playerState.gorget,
    playerState.bodyArmor,
    playerState.limbArmor,
  ]
    .map(id => (id ? ITEMS[id] : null))
    .filter((it): it is Item => it != null);
  const heroPotions = playerState.inventory
    .map(entry => {
      const item = ITEMS[entry.itemId];
      if (!item || item.type !== "consumable") return null;
      if (item.id === "unreliable_poison" || item.id === "strong_poison") return null;
      return { item, quantity: entry.quantity };
    })
    .filter((x): x is { item: Item; quantity: number } => x != null);

  // ── FLEE ──
  const handleFlee = () => {
    if (!canActNow || !activeActor) return;
    onCommand(`ACT ${activeActor.id} FLEE`);
  };

  // Auto-scroll combat log.
  const logScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = logScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [combatLog.length, combatLog[combatLog.length - 1]]);

  // Status banner when it's not the player's turn (or hero is locked out).
  let statusBanner: string | null = null;
  if (activeActor && !canActNow && !session.finished) {
    if (activeActor.channelingState) {
      statusBanner = `${activeActor.name} weaves the Word…`;
    } else if (activeActor.interruptedSinceLastTurn) {
      statusBanner = `${activeActor.name} reels — concentration broken.`;
    } else if (activeActor.controlledBy !== "player") {
      statusBanner = `${activeActor.name}'s turn…`;
    }
  }

  // Background — scene art + dark vignette, or fallback gradient.
  const backgroundStyle: React.CSSProperties = session.backgroundUrl
    ? {
        backgroundImage:
          `linear-gradient(180deg, rgba(20,10,5,0.55) 0%, rgba(20,10,5,0.15) 35%, rgba(20,10,5,0.55) 100%), url(${session.backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {
        background: "linear-gradient(180deg, rgba(20,10,5,0.85) 0%, rgba(8,4,2,0.95) 100%)",
      };

  // ── Slot renderer ───────────────────────────────────────────
  // Renders one combatant's sprite + status/action column. `side` flips
  // alignment: ally combatants positioned by left offset (column on the
  // sprite's right), enemy combatants by right offset (column on the
  // sprite's left).

  function Slot({
    c,
    laneIndex,
    side,
  }: {
    c: CombatantState;
    laneIndex: number;
    side: "ally" | "enemy";
  }) {
    const SLOT_PITCH = 200;
    const sprite = spriteResolver(c, heroSprite);
    const isHero = c.npcId == null && c.controlledBy === "player";
    const isPlayerControlled = c.controlledBy === "player";
    const isDead = c.hp <= 0;

    // Geometry — ally lane anchors LEFT; enemy lane anchors RIGHT.
    const spritePos = side === "ally"
      ? { left: `calc(1vw + ${laneIndex * SLOT_PITCH}px)` }
      : { right: `calc(1vw + ${laneIndex * SLOT_PITCH}px)` };
    const columnPos = side === "ally"
      ? { left: `calc(1vw + ${laneIndex * SLOT_PITCH + 170}px)` }
      : { right: `calc(1vw + ${laneIndex * SLOT_PITCH + 170}px)` };

    const isInvisible = c.activeEffects.some(e => e.type === "invisible");
    const spriteOpacity = isDead ? 0.25 : isInvisible ? 0.35 : 1;
    const spriteFilter = isDead
      ? "grayscale(100%) brightness(0.4) drop-shadow(0 14px 24px rgba(0,0,0,0.85))"
      : isInvisible
        ? "drop-shadow(0 14px 24px rgba(0,0,0,0.5)) brightness(1.15) saturate(0.6) hue-rotate(200deg)"
        : "drop-shadow(0 14px 24px rgba(0,0,0,0.85))";

    const isAttacking = atkAnim?.attackerId === c.id;
    const isDefending = atkAnim?.defenderId === c.id;
    const showHitFlash = hitFlash === c.id;
    const showHeroGore = isHero && heroGoreSplatters.length > 0;
    const showEnemyGore = c.team === "enemy" && (enemyBlood[c.id]?.length ?? 0) > 0;

    const nameColor = side === "ally" ? "#fbbf24" : "#f87171";

    // Highlight current actor on the rail with a glowing outline.
    const isCurrentActor = c.id === activeId;

    return (
      <div key={c.id}>
        {/* Sprite */}
        <div
          className={isDefending ? "le-atk-shake" : undefined}
          onMouseEnter={() => handleSlotEnter(c.id)}
          onMouseLeave={() => handleSlotLeave(c.id)}
          style={{
            position: "absolute",
            ...spritePos,
            bottom: 0,
            width: 240,
            height: "72vh",
            maxHeight: 640,
            minHeight: 320,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            opacity: sprite.url ? spriteOpacity : (sprite.loading ? 0.4 : 1),
            transition: "opacity 0.5s ease, filter 0.5s ease",
            filter: spriteFilter,
            pointerEvents: "auto",
          }}
        >
          {/* Active-actor indicator — flat line + down-chevron sitting
              just above the sprite, no surrounding box. Color matches
              the team. */}
          {isCurrentActor && !isDead && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: 6,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
                zIndex: 6,
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 0,
                  borderTop: `2px solid ${nameColor}`,
                  boxShadow: `0 0 8px ${nameColor}`,
                }}
              />
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderTop: `9px solid ${nameColor}`,
                  filter: `drop-shadow(0 0 4px ${nameColor})`,
                  marginTop: -1,
                }}
              />
            </div>
          )}
          {isAttacking && (
            <div className="le-atk-blur" style={{
              position: "absolute",
              bottom: "20%",
              left: "50%",
              width: 120,
              height: 120,
              transform: "translateX(-50%)",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 70%)",
              pointerEvents: "none",
              zIndex: 0,
            }} />
          )}
          {sprite.url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={isAttacking ? "le-atk-pulse" : undefined}
                src={sprite.url}
                alt={c.name}
                style={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  width: "auto",
                  objectFit: "contain",
                  position: "relative",
                  zIndex: 1,
                  transform: sprite.flip ? "scaleX(-1)" : undefined,
                }}
              />
              {showHeroGore && (
                <BloodOverlay splatters={heroGoreSplatters} spriteUrl={sprite.url} />
              )}
              {showEnemyGore && (
                <BloodOverlay splatters={enemyBlood[c.id] ?? []} spriteUrl={sprite.url} />
              )}
              {isHero && showHitFlash && (
                <div className="le-hit-flash" style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at 50% 60%, rgba(180,0,0,0.35) 0%, transparent 70%)",
                  pointerEvents: "none",
                  zIndex: 3,
                  WebkitMaskImage: `url(${sprite.url})`,
                  maskImage: `url(${sprite.url})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "bottom center",
                  maskPosition: "bottom center",
                }} />
              )}
              {/* Enemy hit flash (transient, no gore overlay) */}
              {!isHero && c.team === "enemy" && showHitFlash && (
                <div className="le-hit-flash" style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at 50% 60%, rgba(180,0,0,0.35) 0%, transparent 70%)",
                  pointerEvents: "none",
                  zIndex: 3,
                  WebkitMaskImage: `url(${sprite.url})`,
                  maskImage: `url(${sprite.url})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "bottom center",
                  maskPosition: "bottom center",
                }} />
              )}
              {isDead && (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: -2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 170,
                    height: 46,
                    borderRadius: "50%",
                    background: "radial-gradient(ellipse at 40% 60%, rgba(55,18,8,0.85) 0%, rgba(20,6,2,0.45) 55%, transparent 100%)",
                    filter: "blur(5px)",
                    zIndex: 2,
                    pointerEvents: "none",
                  }}
                />
              )}
            </>
          ) : (
            <div style={{ fontSize: 80, color: "#5a4a3a", opacity: 0.5 }}>◉</div>
          )}

          {/* Floating effect markers */}
          {c.activeEffects.length > 0 && (
            <div style={{
              position: "absolute",
              bottom: "12%",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 4,
              pointerEvents: "auto",
              zIndex: 5,
            }}>
              {c.activeEffects
                .slice()
                .sort((a, b) => {
                  const spellTypes = new Set(["haste", "shield_aura", "invisible", "feared_skip", "numb_hand", "hiccups", "tongue_tied", "marked_by_set"]);
                  const aSpell = spellTypes.has(a.type) ? 0 : 1;
                  const bSpell = spellTypes.has(b.type) ? 0 : 1;
                  if (aSpell !== bSpell) return aSpell - bSpell;
                  return b.severity - a.severity;
                })
                .slice(0, 3)
                .map((e, i) => (
                  <EffectMarkerIcon
                    key={`${c.id}-overlay-${i}-${e.type}`}
                    effectType={e.type}
                    severity={e.severity}
                    size={24}
                    showTooltip={true}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Status / action column */}
        <div
          onMouseEnter={() => handleSlotEnter(c.id)}
          onMouseLeave={() => handleSlotLeave(c.id)}
          style={{
            position: "absolute",
            ...columnPos,
            bottom: "4vh",
            width: side === "ally" && isHero ? 80 : 64,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            background: "linear-gradient(180deg, rgba(18,12,6,0.92) 0%, rgba(8,5,2,0.96) 100%)",
            border: "1px solid rgba(146,64,14,0.55)",
            borderRadius: 4,
            padding: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            // Player-controlled combatants (hero + recruited allies) keep
            // their column visible at all times so the player can see
            // every party member's HP / mana / spells / potions at a
            // glance during a 3v3. Enemy columns retain the hover-gate so
            // the screen doesn't clutter with bandit gear we don't need.
            transform: isPlayerControlled || visibleSlots.has(c.id) ? "translateY(0)" : "translateY(160px)",
            opacity: isPlayerControlled || visibleSlots.has(c.id) ? 1 : 0,
            transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease",
            pointerEvents: isPlayerControlled || visibleSlots.has(c.id) ? "auto" : "none",
            zIndex: isPlayerControlled || visibleSlots.has(c.id) ? 20 : 1,
          }}
        >
          <VerticalStatusCap
            name={c.name}
            nameColor={nameColor}
            hp={isHero ? playerHp : c.hp}
            maxHp={isHero ? playerMaxHp : c.maxHp}
            mana={isHero ? playerMana : c.mana}
            maxMana={isHero ? playerMaxMana : c.maxMana}
            barHeight={94}
            spellSlots={
              // Spell row only for player-controlled combatants (hero or
              // recruited ally) AND only when they have any combat spells.
              isPlayerControlled && c.knownSpells.length > 0 ? (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  marginLeft: 1,
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}>
                  {COMBAT_SPELLS.map(spell => (
                    <SpellIcon
                      key={`${c.id}-spell-${spell.name}`}
                      spell={spell}
                      known={c.knownSpells.includes(spell.name)}
                      loading={loading || activeId !== c.id || !canActNow}
                      onClick={(e) => {
                        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                        setSpellMenu({ spell, rect, casterId: c.id });
                      }}
                    />
                  ))}
                </div>
              ) : undefined
            }
          />

          {c.activeEffects.length > 0 && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 3,
              marginBottom: 2,
            }}>
              {c.activeEffects.slice(0, 6).map((e, i) => (
                <EffectMarkerIcon
                  key={`${c.id}-fx-${i}-${e.type}`}
                  effectType={e.type}
                  severity={e.severity}
                  size={20}
                  turnsRemaining={e.turnsRemaining}
                />
              ))}
              {c.activeEffects.length > 6 && (
                <span style={{
                  fontSize: 8,
                  color: "#8a7a60",
                  fontFamily: "Georgia, serif",
                  alignSelf: "center",
                }}>
                  +{c.activeEffects.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Equipped gear + potion strip — hero only. Friendly NPCs
              have abstracted kits; we don't render their gear column. */}
          {isHero && heroEquipped.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              justifyItems: "center",
              gap: 3,
              paddingTop: 3,
              marginBottom: 2,
              borderTop: "1px solid rgba(146,64,14,0.35)",
            }}>
              {heroEquipped.map(item => (
                <ItemIcon
                  key={`${c.id}-gear-${item.id}`}
                  item={item}
                  size={32}
                  tooltip={`${item.name} (equipped) — click for options`}
                  ringColor="rgba(251,191,36,0.4)"
                  onClick={onIconClick ? (e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    onIconClick(item, "equipped", rect);
                  } : undefined}
                />
              ))}
            </div>
          )}

          {/* Potion strip — hero shows from playerState.inventory; friendly
              NPCs (Vivian, Brand) show from their CombatantState.inventory
              so we can test every consumable in combat from every slot. */}
          {(() => {
            const allyPotions: { item: Item; quantity: number }[] = isHero
              ? heroPotions
              : isPlayerControlled
                ? c.inventory
                    .map(entry => {
                      const item = ITEMS[entry.itemId];
                      if (!item || item.type !== "consumable") return null;
                      if (item.id === "unreliable_poison" || item.id === "strong_poison") return null;
                      return { item, quantity: entry.quantity };
                    })
                    .filter((x): x is { item: Item; quantity: number } => x != null)
                : [];
            if (allyPotions.length === 0) return null;
            return (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                justifyItems: "center",
                gap: 3,
                paddingTop: 3,
                marginBottom: 2,
                borderTop: "1px solid rgba(146,64,14,0.35)",
              }}>
                {allyPotions.map(({ item, quantity }) => (
                  <ItemIcon
                    key={`${c.id}-potion-${item.id}`}
                    item={item}
                    size={32}
                    quantity={quantity}
                    tooltip={`${c.name}: ${item.name} — click for options`}
                    onClick={onIconClick ? (e) => {
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      onIconClick(item, "pack", rect);
                    } : undefined}
                  />
                ))}
              </div>
            );
          })()}

          {/* Enemy zone-strike buttons — only on enemy slots. The hero's
              column has gear + potions; allies have neither. STRIKE
              buttons are gated on canActNow + activeActor. */}
          {side === "enemy" && (
            <>
              {BODY_ZONES.map(z => {
                const isSelected = selectedZone === z;
                const disabled = !canActNow || isDead;
                return (
                  <button
                    key={z}
                    onClick={(e) => {
                      if (!activeActor || !canActNow) return;
                      setSelectedZone(z);
                      const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                      // Open target picker — defaults to this enemy as target.
                      const candidates = session.combatants.filter(x => x.team !== activeActor.team && x.hp > 0);
                      // Single-target shortcut: if only one alive enemy and
                      // it's this one, fire directly without opening the picker.
                      if (candidates.length <= 1 && candidates[0]) {
                        const target = candidates[0];
                        animateThenCommand(
                          `ACT ${activeActor.id} STRIKE ${z.toUpperCase()} ${target.id}`,
                          activeActor.id,
                          target.id,
                        );
                        return;
                      }
                      // Pre-select THIS enemy as the default target.
                      const defaultTarget = candidates.find(x => x.id === c.id) ?? candidates[0];
                      if (defaultTarget && defaultTarget.id === c.id) {
                        animateThenCommand(
                          `ACT ${activeActor.id} STRIKE ${z.toUpperCase()} ${c.id}`,
                          activeActor.id,
                          c.id,
                        );
                      } else {
                        setTargetPicker({ kind: "strike", rect, casterId: activeActor.id, zone: z });
                      }
                    }}
                    disabled={disabled}
                    title={
                      session.finished ? "Combat is over" :
                      !canActNow ? "Not your turn" :
                      `Strike ${ZONE_LABELS[z].toLowerCase()} — ${ZONE_EVASION_HINT[z]}`
                    }
                    style={{
                      width: "100%",
                      padding: "6px 2px 4px",
                      fontFamily: "Georgia, serif",
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontWeight: isSelected ? 700 : 600,
                      background: isSelected
                        ? "linear-gradient(180deg, rgba(251,191,36,0.32) 0%, rgba(146,64,14,0.4) 100%)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSelected ? "#fbbf24" : "rgba(146,64,14,0.35)"}`,
                      borderRadius: 3,
                      color: disabled ? "#5a4a3a" : (isSelected ? "#fbbf24" : "#cdb78a"),
                      cursor: disabled ? "default" : "pointer",
                      transition: "all 0.15s",
                      textShadow: "0 1px 2px rgba(0,0,0,0.85)",
                      boxShadow: isSelected ? "0 2px 6px rgba(251,191,36,0.25)" : "none",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      opacity: disabled ? 0.55 : 1,
                    }}
                  >
                    <span>{ZONE_LABELS[z]}</span>
                    <span style={{
                      fontSize: 7,
                      letterSpacing: "0.06em",
                      textTransform: "lowercase",
                      fontWeight: 400,
                      color: isSelected ? "#cdb78a" : "#7a6a50",
                      lineHeight: 1,
                    }}>
                      {ZONE_EVASION_HINT[z]}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {/* FLEE — only on hero column. */}
          {isHero && (
            <button
              onClick={handleFlee}
              disabled={!canActNow}
              title="Flee the fight"
              style={{
                width: "100%",
                padding: "6px 2px 4px",
                fontFamily: "Georgia, serif",
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 600,
                background: "rgba(120,30,30,0.35)",
                border: "1px solid rgba(180,60,60,0.5)",
                borderRadius: 3,
                color: !canActNow ? "#5a4a3a" : "#f5c2a3",
                cursor: !canActNow ? "default" : "pointer",
                transition: "all 0.15s",
                textShadow: "0 1px 2px rgba(0,0,0,0.85)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                opacity: !canActNow ? 0.55 : 1,
              }}
            >
              <span>Flee</span>
              <span style={{
                fontSize: 7,
                letterSpacing: "0.06em",
                textTransform: "lowercase",
                fontWeight: 400,
                color: "#8a6a5a",
                lineHeight: 1,
              }}>
                exit combat
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      pointerEvents: "auto",
      fontFamily: "Georgia, serif",
      color: "#e8d4a0",
      ...backgroundStyle,
    }}>
      <TurnOrderRail session={session} />

      {/* Status banner — when it's not the hero's turn or hero is locked. */}
      {statusBanner && (
        <div style={{
          position: "absolute",
          top: 52,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "4px 14px",
          background: "rgba(0,0,0,0.65)",
          border: "1px solid rgba(96,165,250,0.5)",
          borderRadius: 3,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#bfdbfe",
          textShadow: "0 1px 2px rgba(0,0,0,0.85)",
          zIndex: 11,
          fontStyle: "italic",
        }}>
          {statusBanner}
        </div>
      )}

      {/* Center combat log */}
      <div style={{
        position: "absolute",
        bottom: "50%",
        left: 0,
        right: 0,
        pointerEvents: "none",
      }}>
        <div style={{
          textAlign: "center",
          marginBottom: 10,
        }}>
          <span style={{
            display: "inline-block",
            padding: "3px 14px",
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(251,191,36,0.45)",
            borderRadius: 3,
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#fbbf24",
            boxShadow: "0 2px 10px rgba(0,0,0,0.6)",
          }}>
            Round {session.roundNumber}
          </span>
        </div>

        <div
          ref={logScrollRef}
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 32px",
            maxHeight: "30vh",
            overflowY: "auto",
            scrollbarWidth: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          {combatLog.length === 0 ? (
            <div style={{
              textAlign: "center",
              fontSize: 16,
              color: "#a89c7e",
              fontStyle: "italic",
              textShadow: "0 2px 8px rgba(0,0,0,0.95)",
            }}>
              Choose a target zone, then strike.
            </div>
          ) : (
            combatLog.map((line, i) => {
              const distanceFromNewest = combatLog.length - 1 - i;
              const isNewest = distanceFromNewest === 0;
              const hasCrit = isNewest && line.includes("__CRITICAL__");
              const displayLine = line.replace(/__CRITICAL__\s*/g, "");
              const opacity = isNewest ? 1
                : distanceFromNewest === 1 ? 0.5
                : distanceFromNewest === 2 ? 0.3
                : 0.15;
              const color = isNewest
                ? (hasCrit ? "#ff4444" : "#f5e8c8")
                : "#cdb78a";
              const fontSize = isNewest ? 17 : (distanceFromNewest === 1 ? 13 : 11);
              return (
                <div
                  key={`${i}-${line.slice(0, 20)}`}
                  className={isNewest ? "le-combat-text-pop" : undefined}
                  style={{
                    textAlign: "center",
                    fontSize,
                    lineHeight: 1.55,
                    color,
                    opacity,
                    fontWeight: isNewest ? 600 : 400,
                    whiteSpace: "pre-wrap",
                    padding: isNewest ? "6px 0" : "2px 0",
                    textShadow: isNewest
                      ? "0 2px 8px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.8)"
                      : "0 1px 3px rgba(0,0,0,0.95)",
                    transition: "opacity 0.3s ease, font-size 0.3s ease",
                    background: isNewest
                      ? "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.55) 0%, transparent 75%)"
                      : "none",
                    borderRadius: 8,
                  }}
                >
                  {hasCrit && <span style={{ color: "#ff4444", fontWeight: 800 }}>CRITICAL! </span>}
                  {displayLine}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Ally lane — leftmost = back rank, rightmost = front rank. */}
      {allies.map((c, i) => (
        <Slot key={c.id} c={c} laneIndex={i} side="ally" />
      ))}

      {/* Enemy lane — leftmost = front rank, rightmost = back rank. */}
      {enemies.map((c, i) => (
        <Slot key={c.id} c={c} laneIndex={i} side="enemy" />
      ))}

      {/* Spell action menu */}
      {spellMenu && (
        <SpellActionMenu
          spell={spellMenu.spell}
          anchorRect={spellMenu.rect}
          onCast={() => {
            const s = spellMenu.spell;
            const rect = spellMenu.rect;
            const casterId = spellMenu.casterId;
            setSpellMenu(null);
            const caster = session.combatants.find(x => x.id === casterId);
            if (!caster) return;
            if (s.targeting === "self") {
              animateThenCommand(`ACT ${caster.id} CAST ${s.name} ${caster.id}`, caster.id, caster.id);
            } else if (s.targeting === "none") {
              // No target — engine handles the boon. Use caster as the
              // nominal target for the ACT grammar.
              animateThenCommand(`ACT ${caster.id} CAST ${s.name} ${caster.id}`, caster.id, caster.id);
            } else {
              // enemy-target: open target picker.
              const candidates = session.combatants.filter(x => x.team !== caster.team && x.hp > 0);
              if (candidates.length === 1 && candidates[0]) {
                const t = candidates[0];
                animateThenCommand(`ACT ${caster.id} CAST ${s.name} ${t.id}`, caster.id, t.id);
              } else {
                setTargetPicker({ kind: "cast", rect, casterId: caster.id, spell: s });
              }
            }
          }}
          onLore={() => {
            const def = spellMenu.spell;
            setSpellMenu(null);
            setSpellDetail(def);
          }}
          onClose={() => setSpellMenu(null)}
        />
      )}

      {/* Target picker — STRIKE or CAST */}
      {targetPicker && (() => {
        const caster = session.combatants.find(x => x.id === targetPicker.casterId);
        if (!caster) return null;
        const candidates = session.combatants.filter(x => x.team !== caster.team && x.hp > 0);
        const def = defaultTargetFor(caster);
        const ordered = def
          ? [def, ...candidates.filter(x => x.id !== def.id)]
          : candidates;
        return (
          <TargetPicker
            spell={targetPicker.kind === "cast" ? (targetPicker.spell ?? null) : null}
            zone={targetPicker.zone ?? null}
            anchorRect={targetPicker.rect}
            candidates={ordered}
            isStrike={targetPicker.kind === "strike"}
            onSelect={(target) => {
              const tp = targetPicker;
              setTargetPicker(null);
              if (tp.kind === "strike" && tp.zone) {
                animateThenCommand(
                  `ACT ${caster.id} STRIKE ${tp.zone.toUpperCase()} ${target.id}`,
                  caster.id,
                  target.id,
                );
              } else if (tp.kind === "cast" && tp.spell) {
                animateThenCommand(
                  `ACT ${caster.id} CAST ${tp.spell.name} ${target.id}`,
                  caster.id,
                  target.id,
                );
              }
            }}
            onClose={() => setTargetPicker(null)}
          />
        );
      })()}

      {/* Spell lore popup */}
      {spellDetail && (
        <SpellDetailPopup spell={spellDetail} onClose={() => setSpellDetail(null)} />
      )}

      {/* Critical hit vignette */}
      {critVignette && (
        <div className="le-crit-vignette" style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 100,
          boxShadow: "inset 0 0 120px 40px rgba(139,0,0,0.5), inset 0 0 60px 20px rgba(200,0,0,0.3)",
        }} />
      )}

      <style>{`
        @keyframes le-combat-breathe {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 12px 24px rgba(0,0,0,0.85)); }
          50% { transform: scale(1.02); filter: drop-shadow(0 14px 28px rgba(220,38,38,0.35)); }
        }
        @keyframes le-fx-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes le-fx-glow {
          0%, 100% { box-shadow: 0 0 3px currentColor; }
          50% { box-shadow: 0 0 10px currentColor, 0 0 16px currentColor; }
        }
        @keyframes le-fx-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-1.5px); }
          75% { transform: translateX(1.5px); }
        }
        @keyframes le-fx-wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        @keyframes le-fx-shimmer {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 2px currentColor); }
          50% { filter: brightness(1.4) drop-shadow(0 0 4px currentColor); }
        }
        @keyframes le-fx-fade {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }
        @keyframes le-fx-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .le-fx-pulse { animation: le-fx-pulse 1.5s ease-in-out infinite; }
        .le-fx-glow { animation: le-fx-glow 2s ease-in-out infinite; }
        .le-fx-shake { animation: le-fx-shake 0.3s linear infinite; }
        .le-fx-wobble { animation: le-fx-wobble 2s ease-in-out infinite; }
        .le-fx-shimmer { animation: le-fx-shimmer 1s ease-in-out infinite; }
        .le-fx-fade { animation: le-fx-fade 2s ease-in-out infinite; }
        .le-fx-bounce { animation: le-fx-bounce 0.6s ease-in-out infinite; }

        @keyframes le-atk-pulse-kf {
          0%   { transform: scale(1); }
          20%  { transform: scale(1.05); }
          40%  { transform: scale(1); }
          60%  { transform: scale(1.05); }
          80%  { transform: scale(1); }
          100% { transform: scale(1); }
        }
        @keyframes le-atk-blur-kf {
          0%   { transform: translateX(-50%) scale(0); opacity: 0; }
          25%  { transform: translateX(-50%) scale(1); opacity: 0.5; }
          100% { transform: translateX(-50%) scale(1.3); opacity: 0; }
        }
        @keyframes le-atk-shake-kf {
          0%, 100% { transform: translateX(0); }
          15%  { transform: translateX(-4px); }
          30%  { transform: translateX(4px); }
          45%  { transform: translateX(-3px); }
          60%  { transform: translateX(3px); }
          75%  { transform: translateX(-2px); }
          90%  { transform: translateX(2px); }
        }
        .le-atk-pulse { animation: le-atk-pulse-kf 0.5s ease-in-out; }
        .le-atk-blur  { animation: le-atk-blur-kf 0.6s ease-out forwards; }
        .le-atk-shake { animation: le-atk-shake-kf 0.35s ease-in-out 0.45s; }

        @keyframes le-combat-text-pop-kf {
          0%   { opacity: 0; transform: scale(0.7) translateY(8px); }
          50%  { opacity: 1; transform: scale(1.06) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .le-combat-text-pop { animation: le-combat-text-pop-kf 0.4s ease-out; }

        @keyframes le-blood-appear-kf {
          0%   { opacity: 0; transform: scale(0.3); }
          40%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        .le-blood-appear { animation: le-blood-appear-kf 0.35s ease-out forwards; }

        @keyframes le-hit-flash-kf {
          0%   { opacity: 0.7; }
          100% { opacity: 0; }
        }
        .le-hit-flash { animation: le-hit-flash-kf 0.4s ease-out forwards; }

        @keyframes le-crit-vignette-kf {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          60%  { opacity: 0.8; }
          100% { opacity: 0; }
        }
        .le-crit-vignette { animation: le-crit-vignette-kf 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
}
