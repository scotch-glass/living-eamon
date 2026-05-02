"use client";

import { useState, useEffect, useRef } from "react";
import type { BodyZone, ActiveCombatSession } from "../lib/combatTypes";
import { BODY_ZONES } from "../lib/combatTypes";
import type { PlayerState } from "../lib/gameState";
import { ITEMS, type Item } from "../lib/gameData";
import type { ItemContext } from "./ItemActionMenu";
import { EFFECT_COLORS } from "../lib/effectIconData";
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
   * combat UI column (weapon/shield/helmet/gorget/bodyArmor/limbArmor icons
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
  /**
   * Layout-preview only: render N decorative copies of the enemy sprite to
   * the right of the main enemy (for testing 3-enemy scenes). Defaults to 0.
   */
  enemyLayoutPreviewCount?: number;
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
  // Classic RPG red health bar. (Previously faded green→yellow→red based on %;
  // player feedback: HP should always read red so it's instantly recognizable.)
  return "#dc2626";
}

/**
 * Vertical stat bar — fills from the bottom up. Used for HP (green/yellow/red)
 * and Mana (blue). Matches the sidebar mana-bar visual, just taller.
 */
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

/**
 * Tight vertical status cap that mounts on top of the body-targeting
 * column: HP bar + mana bar side-by-side, with a compact name label
 * above. Optional spell column to the right of the mana bar — tiny
 * 2-wide grid of SpellIcons, dimmed for unlearned spells.
 */
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
  /** Optional vertical column of spell-cast icons next to the mana bar. */
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
        <VerticalBar current={mana} max={maxMana} height={barHeight} color="mana" label="Mana" />
        {spellSlots}
      </div>
    </div>
  );
}

// ── Spell catalog ───────────────────────────────────────────
// Tiny iconography for the known-spell row. Each spell's `name` is the
// command argument (CAST HEAL, CAST BLAST, etc.) — must match what the
// engine's CAST handler accepts and what `knownSpells` stores.

interface SpellDef {
  name: string;     // CAST argument, uppercase to match engine convention
  label: string;    // hover label / menu title
  glyph: string;    // small unicode/emoji symbol (heart, bolt, etc.)
  cost: number;     // mana cost (display only)
  color: string;    // glow color when known
  /** One-line type tag shown in the lore popup ("Restoration", etc.). */
  school: string;
  /** Numeric effect string ("18-32 HP", "2d8+4", "—"). */
  effect: string;
  /** Long-form lore for the Lore popup. */
  lore: string;
  /** "self" = always targets caster, "enemy" = targets an enemy, "none" = fires immediately (no picker) */
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
        // Strip the emoji color so glyphs match each spell's tint.
        // Falls back to the colored glyph on browsers that ignore this.
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

// ── Spell action menu — mirrors ItemActionMenu visual + behavior ──

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

// ── Spell target picker — appears after clicking Cast ──

interface SpellTargetMenuProps {
  spell: SpellDef;
  anchorRect: { top: number; left: number; width: number; height: number };
  enemyName: string;
  onSelect: (cmd: string) => void;
  onClose: () => void;
}

function SpellTargetMenu({ spell, anchorRect, enemyName, onSelect, onClose }: SpellTargetMenuProps) {
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

  const targets: { label: string; cmd: string }[] =
    spell.targeting === "enemy"
      ? [{ label: enemyName, cmd: `CAST ${spell.name}` }]
      : [{ label: "Self", cmd: `CAST ${spell.name}` }];

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
          Target
        </span>
      </div>
      {targets.map((t, i) => (
        <button
          key={i}
          onClick={() => onSelect(t.cmd)}
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
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Spell lore popup — small dark glassmorphism modal ──

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
        {/* Header */}
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

        {/* Effect line */}
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

        {/* Lore */}
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

// ── Sprite loaders (NPC + hero share one cache) ─────────────

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
  enemyLayoutPreviewCount = 0,
  heroGoreSplatters = [],
  onHeroGoreChange,
}: CombatScreenProps) {
  const [selectedZone, setSelectedZone] = useState<BodyZone>("torso");
  // Spell action menu (anchored to the clicked spell icon) + lore popup state.
  const [spellMenu, setSpellMenu] = useState<{
    spell: SpellDef;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const [spellDetail, setSpellDetail] = useState<SpellDef | null>(null);
  // Spell target picker — shown after clicking Cast on a targeted spell.
  const [spellTarget, setSpellTarget] = useState<{
    spell: SpellDef;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);

  // ── Blood & gore state ──
  // Enemy splatters reset per fight. Hero gore accumulates and is lifted
  // to page.tsx via onHeroGoreChange so it persists between fights.
  const [enemyBlood, setEnemyBlood] = useState<BloodSplatter[]>([]);
  // Red flash on defender (fades out via CSS transition).
  const [hitFlash, setHitFlash] = useState<"left" | "right" | null>(null);
  // Critical hit vignette overlay.
  const [critVignette, setCritVignette] = useState(false);
  // Track previous HP values to detect damage this render.
  const prevEnemyHpRef = useRef(session.enemyCombatant.hp);
  const prevPlayerHpRef = useRef(session.playerCombatant.hp);
  // Track the last zone the player targeted (for splatter placement).
  const lastZoneRef = useRef<SplatterZone>("torso");

  // Reset enemy blood when fight changes.
  const enemyIdRef = useRef(session.enemyNpcId);
  useEffect(() => {
    if (session.enemyNpcId !== enemyIdRef.current) {
      enemyIdRef.current = session.enemyNpcId;
      setEnemyBlood([]);
      prevEnemyHpRef.current = session.enemyCombatant.hp;
      prevPlayerHpRef.current = session.playerCombatant.hp;
    }
  }, [session.enemyNpcId, session.enemyCombatant.hp, session.playerCombatant.hp]);

  // ── Hit detection: compare HP snapshots to detect damage each render ──
  useEffect(() => {
    const enemyHpNow = session.enemyCombatant.hp;
    const playerHpNow = session.playerCombatant.hp;
    const enemyDelta = prevEnemyHpRef.current - enemyHpNow;
    const playerDelta = prevPlayerHpRef.current - playerHpNow;

    // Check last combat log entry for __CRITICAL__ marker
    const lastLog = combatLog[combatLog.length - 1] ?? "";
    const isCrit = lastLog.includes("__CRITICAL__");

    // Enemy took damage — player hit them
    if (enemyDelta > 0) {
      const tier = getWoundTierFromDamage(enemyDelta, session.enemyCombatant.maxHp);
      const zone = lastZoneRef.current;
      const newSplatters = generateHitSplatters(zone, tier, isCrit);
      // On crit: enemy gets a visible wound + player gets splattered with blood
      if (isCrit) {
        const wound = generateCritWound(zone);
        setEnemyBlood(prev => [...prev, ...newSplatters, ...wound]);
        // Attacker (hero) gets splattered by the spray
        const attackerSplatter = generateAttackerSplatter(zone);
        const updatedGore = [...heroGoreSplatters, ...attackerSplatter];
        onHeroGoreChange?.(updatedGore);
        setCritVignette(true);
      } else {
        setEnemyBlood(prev => [...prev, ...newSplatters]);
      }
      setHitFlash("right");
    }

    // Player took damage — enemy hit them.
    // Normal hits flash red. Crits leave a visible wound on the hero.
    if (playerDelta > 0) {
      setHitFlash("left");
      if (isCrit) {
        // Crit: hero gets a wound mark in the hit zone
        const zones: SplatterZone[] = ["head", "neck", "torso", "torso", "torso", "limbs", "limbs"];
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const wound = generateCritWound(zone);
        const updatedGore = [...heroGoreSplatters, ...wound];
        onHeroGoreChange?.(updatedGore);
        setCritVignette(true);
      }
    }

    prevEnemyHpRef.current = enemyHpNow;
    prevPlayerHpRef.current = playerHpNow;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.enemyCombatant.hp, session.playerCombatant.hp, session.roundNumber]);

  // Clear hit flash after a short duration.
  useEffect(() => {
    if (!hitFlash) return;
    const t = setTimeout(() => setHitFlash(null), 400);
    return () => clearTimeout(t);
  }, [hitFlash]);

  // Clear crit vignette after animation.
  useEffect(() => {
    if (!critVignette) return;
    const t = setTimeout(() => setCritVignette(false), 800);
    return () => clearTimeout(t);
  }, [critVignette]);

  // ── Attack animation state ──
  // "attacker" = which side is animating (hero slot or enemy slot key).
  // The animation plays BEFORE the command fires, so the player sees the
  // pulse+blur, THEN the narration arrives with the result.
  const [atkAnim, setAtkAnim] = useState<{
    attackerKey: string;   // ally key ("hero") or enemy slot key ("main")
    defenderSide: "left" | "right"; // which side shakes on hit
  } | null>(null);
  const atkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Fire the attack animation, wait for it to finish, then execute the command. */
  const animateThenCommand = (cmd: string, attackerKey: string, defenderSide: "left" | "right") => {
    if (loading || atkAnim) return;
    // Track the zone for blood splatter placement.
    const zoneMatch = cmd.match(/STRIKE\s+(HEAD|NECK|TORSO|LIMBS)/i);
    if (zoneMatch) lastZoneRef.current = zoneMatch[1].toLowerCase() as SplatterZone;
    setAtkAnim({ attackerKey, defenderSide });
    // Animation lasts 0.8s total. Fire the engine command after 0.5s so
    // narration arrives as the defender shake is finishing.
    atkTimerRef.current = setTimeout(() => {
      onCommand(cmd);
      // Clear animation state after defender shake completes (0.3s more)
      setTimeout(() => setAtkAnim(null), 350);
    }, 500);
  };

  // Preview enemy sprites (unique NPCs, not clones of the main enemy).
  // Hooks must be called unconditionally so they sit here at the top.
  const previewSprite0 = useSpriteFromUrl(`npc_armory_attendant`, `/api/npc-image?id=armory_attendant`);
  const previewSprite1 = useSpriteFromUrl(`npc_hokas_tokas`, `/api/npc-image?id=hokas_tokas`);
  const previewSprites = [previewSprite0, previewSprite1];

  const player = session.playerCombatant;
  const enemy = session.enemyCombatant;
  const enemySprite = useSpriteFromUrl(
    `npc_${session.enemyNpcId}`,
    `/api/npc-image?id=${encodeURIComponent(session.enemyNpcId)}`,
  );

  // Hero sprite — looked up by lowercase character name. Falls back to
  // the PaperDoll HUD when no sprite exists for this hero.
  const heroId = player.name.trim().toLowerCase();
  const heroSprite = useSpriteFromUrl(
    `hero_${heroId}`,
    `/api/hero-image?id=${encodeURIComponent(heroId)}`,
  );

  // Henchmen sprites (visual layout test — a real henchman system would
  // pull these from worldState.party once it exists). Both are NPCs so
  // we hit the NPC sprite endpoint.
  const zimSprite = useSpriteFromUrl(`npc_zim_the_wizard`, `/api/npc-image?id=zim_the_wizard`);
  const aldricSprite = useSpriteFromUrl(`npc_old_mercenary`, `/api/npc-image?id=old_mercenary`);

  // playerArmor / playerWounds removed — PaperDoll wireframe no longer used.

  // ── Hero + henchmen roster ──
  // Hero gear/potions resolved from the live PlayerState. Henchmen carry
  // hardcoded sample loadouts so the layout has something to render until
  // the party-system mechanic ships. Slot 0 = leftmost (Aldric), slot N-1
  // = closest to the enemies (the hero).
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

  type AllySlot = {
    key: string;
    name: string;
    nameColor: string;
    sprite: { url: string | null; loading: boolean };
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    activeEffects: typeof player.activeEffects;
    gear: Item[];
    potions: { item: Item; quantity: number }[];
    /** Uppercase spell names this ally has learned (matches `knownSpells`
     *  on PlayerState). Used to dim/enable the spell icon row. */
    knownSpells: string[];
    showFlee: boolean;
  };

  const aldricItems: { item: Item; quantity: number }[] = [
    { item: ITEMS.bandage!, quantity: 3 },
    { item: ITEMS.healing_potion!, quantity: 1 },
  ].filter(x => x.item != null);
  const zimItems: { item: Item; quantity: number }[] = [
    { item: ITEMS.mana_potion!, quantity: 2 },
    { item: ITEMS.healing_potion!, quantity: 1 },
    { item: ITEMS.fatigue_brew!, quantity: 1 },
  ].filter(x => x.item != null);

  // Order: leftmost first. Aldric → Zim → Hero (closest to the enemies).
  const allies: AllySlot[] = [
    {
      key: "aldric",
      name: "Aldric",
      nameColor: "#fbbf24",
      sprite: aldricSprite,
      hp: 60, maxHp: 60,
      mana: 0, maxMana: 0,
      activeEffects: [],
      gear: [],
      potions: aldricItems,
      knownSpells: [], // veteran sword, not a caster
      showFlee: false,
    },
    {
      key: "zim",
      name: "Zim",
      nameColor: "#fbbf24",
      sprite: zimSprite,
      hp: 30, maxHp: 30,
      mana: 18, maxMana: 18,
      activeEffects: [],
      gear: [],
      potions: zimItems,
      knownSpells: ["HEAL", "BLAST", "POWER", "SPEED"], // wizard knows all 4
      showFlee: false,
    },
    {
      key: "hero",
      name: player.name || "Hero",
      nameColor: "#fbbf24",
      sprite: heroSprite,
      hp: playerHp, maxHp: playerMaxHp,
      mana: playerMana, maxMana: playerMaxMana,
      activeEffects: player.activeEffects,
      gear: heroEquipped,
      potions: heroPotions,
      knownSpells: playerState.knownSpells ?? [],
      showFlee: true,
    },
  ];

  const handleFlee = () => {
    if (!loading && !session.finished) onCommand("FLEE");
  };

  // Auto-scroll the combat log to the bottom whenever a new line appears
  const logScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = logScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [combatLog.length, combatLog[combatLog.length - 1]]);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 50,
      pointerEvents: "auto",
      fontFamily: "Georgia, serif",
      color: "#e8d4a0",
      // No backdrop — the ScenePanel behind shows through as the combat stage.
    }}>
      {/* ═══════════════════════════════════════════════════════
          CENTER COMBAT LOG — just below the middle of the screen.
          Newest entry pops in large; older entries dim above it.
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        position: "absolute",
        bottom: "50%",
        left: 0,
        right: 0,
        pointerEvents: "none",
      }}>
        {/* Round counter — centered small pill */}
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

        {/* Combat narration — newest pops in large, older entries dim above */}
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
              // Strip the __CRITICAL__ marker from display text
              const displayLine = line.replace(/__CRITICAL__\s*/g, "");
              // Newest = full brightness + large. Older messages dim.
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

      {/* ═══════════════════════════════════════════════════════
          ALLY ROW — hero + henchmen on the LEFT side of the field.
          Slot 0 = leftmost (Aldric), Slot N-1 = closest to enemies
          (Hero). Each slot renders sprite + status/inventory column.
          Geometry: each slot 240px sprite + 80px column overlapping
          the sprite by 60px (so column sits over the sprite's empty
          right margin without obscuring the painted figure).
          ═══════════════════════════════════════════════════════ */}
      {allies.map((ally, slotIdx) => {
        // Tight pitch: 200px between slot left-edges. Sprite containers
        // are 240px wide so adjacent sprites overlap each other by 40px,
        // but the painted figures themselves sit centered with ~60px of
        // empty margin per side, so visual overlap is rare.
        // Columns shift further right (offset 170 instead of 140) so they
        // sit in the empty gap between this ally's painted figure and the
        // next ally's. Any unavoidable overlap is with THIS ally's own
        // right-margin, never the neighbor's painted figure.
        const SLOT_PITCH = 200;
        const spriteLeft = `calc(1vw + ${slotIdx * SLOT_PITCH}px)`;
        const columnLeft = `calc(1vw + ${slotIdx * SLOT_PITCH + 170}px)`;

        // Visual: semi-transparent ghosting for invisible / hiding / sneaking allies.
        // Invisible = 35% opacity + faint blue tint. Stealth = 55% opacity.
        const isInvisible = ally.activeEffects.some(e => e.type === "invisible");
        const isStealth = false; // TODO: wire once stealth/hide skill exists as a status effect
        const spriteOpacity = isInvisible ? 0.35 : isStealth ? 0.55 : 1;
        const spriteFilter = isInvisible
          ? "drop-shadow(0 14px 24px rgba(0,0,0,0.5)) brightness(1.15) saturate(0.6) hue-rotate(200deg)"
          : "drop-shadow(0 14px 24px rgba(0,0,0,0.85))";

        // Attack animation: is THIS ally the current attacker?
        const isAttacking = atkAnim?.attackerKey === ally.key;
        // Is the left side (allies) the defender side? (enemy attacked us)
        const isDefending = atkAnim?.defenderSide === "left";

        return (
          <div key={ally.key}>
            {/* Sprite */}
            <div
              className={isDefending ? "le-atk-shake" : undefined}
              style={{
                position: "absolute",
                left: spriteLeft,
                bottom: 0,
                width: 240,
                height: "72vh",
                maxHeight: 640,
                minHeight: 320,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                opacity: ally.sprite.url ? spriteOpacity : (ally.sprite.loading ? 0.4 : 1),
                transition: "opacity 0.5s ease, filter 0.5s ease",
                filter: spriteFilter,
                pointerEvents: "none",
              }}
            >
              {/* Dark radial blur disc behind attacker during pulse */}
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
              {ally.sprite.url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={isAttacking ? "le-atk-pulse" : undefined}
                    src={ally.sprite.url}
                    alt={ally.name}
                    style={{
                      maxHeight: "100%",
                      maxWidth: "100%",
                      width: "auto",
                      objectFit: "contain",
                      position: "relative",
                      zIndex: 1,
                    }}
                  />
                  {/* Blood overlay — masked to sprite silhouette.
                      Hero gets persistent gore; henchmen get nothing for now. */}
                  {ally.key === "hero" && heroGoreSplatters.length > 0 && (
                    <BloodOverlay
                      splatters={heroGoreSplatters}
                      spriteUrl={ally.sprite.url}
                    />
                  )}
                  {/* Red hit flash — brief red tint over sprite on taking damage */}
                  {ally.key === "hero" && hitFlash === "left" && (
                    <div className="le-hit-flash" style={{
                      position: "absolute",
                      inset: 0,
                      background: "radial-gradient(ellipse at 50% 60%, rgba(180,0,0,0.35) 0%, transparent 70%)",
                      pointerEvents: "none",
                      zIndex: 3,
                      WebkitMaskImage: `url(${ally.sprite.url})`,
                      maskImage: `url(${ally.sprite.url})`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "bottom center",
                      maskPosition: "bottom center",
                    }} />
                  )}
                </>
              ) : (
                <div style={{
                  fontSize: 80,
                  color: "#5a4a3a",
                  opacity: 0.5,
                }}>◉</div>
              )}

              {/* Floating sprite overlay — up to 3 priority effect icons
                  centered near the sprite's lower body. Hoverable for tooltips. */}
              {ally.activeEffects.length > 0 && (
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
                  {ally.activeEffects
                    .slice()
                    .sort((a, b) => {
                      // Spell effects first, then severity desc
                      const spellTypes = new Set(["haste", "shield_aura", "invisible", "feared_skip", "numb_hand", "hiccups", "tongue_tied", "marked_by_set"]);
                      const aSpell = spellTypes.has(a.type) ? 0 : 1;
                      const bSpell = spellTypes.has(b.type) ? 0 : 1;
                      if (aSpell !== bSpell) return aSpell - bSpell;
                      return b.severity - a.severity;
                    })
                    .slice(0, 3)
                    .map((e, i) => (
                      <EffectMarkerIcon
                        key={`${ally.key}-overlay-${i}-${e.type}`}
                        effectType={e.type}
                        severity={e.severity}
                        size={24}
                        showTooltip={true}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Status + inventory column */}
            <div style={{
              position: "absolute",
              left: columnLeft,
              bottom: "4vh",
              width: 80,
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
            }}>
              <VerticalStatusCap
                name={ally.name}
                nameColor={ally.nameColor}
                hp={ally.hp}
                maxHp={ally.maxHp}
                mana={ally.mana}
                maxMana={ally.maxMana}
                barHeight={94}
                spellSlots={
                  // Tiny vertical stack of spell-cast icons next to the
                  // mana bar. Always rendered (layout stays stable as
                  // spells are learned) — unlearned spells dim out.
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
                        key={`${ally.key}-spell-${spell.name}`}
                        spell={spell}
                        known={ally.knownSpells.includes(spell.name)}
                        loading={loading}
                        onClick={(e) => {
                          // Open the spell action menu (Cast / Lore) anchored
                          // to the clicked icon — mirrors the gear/potion
                          // click-for-options pattern.
                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                          setSpellMenu({ spell, rect });
                        }}
                      />
                    ))}
                  </div>
                }
              />
              {ally.activeEffects.length > 0 && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 3,
                  marginBottom: 2,
                }}>
                  {ally.activeEffects.slice(0, 6).map((e, i) => (
                    <EffectMarkerIcon
                      key={`${ally.key}-fx-${i}-${e.type}`}
                      effectType={e.type}
                      severity={e.severity}
                      size={20}
                      turnsRemaining={e.turnsRemaining}
                    />
                  ))}
                  {ally.activeEffects.length > 6 && (
                    <span style={{
                      fontSize: 8,
                      color: "#8a7a60",
                      fontFamily: "Georgia, serif",
                      alignSelf: "center",
                    }}>
                      +{ally.activeEffects.length - 6}
                    </span>
                  )}
                </div>
              )}

              {/* Equipped gear (2-col grid). Empty for henchmen until the
                  party-system mechanic ships. */}
              {ally.gear.length > 0 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  justifyItems: "center",
                  gap: 3,
                  paddingTop: 3,
                  marginBottom: 2,
                  borderTop: "1px solid rgba(146,64,14,0.35)",
                }}>
                  {ally.gear.map(item => (
                    <ItemIcon
                      key={`${ally.key}-gear-${item.id}`}
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

              {/* Potion / consumable quick-use grid */}
              {ally.potions.length > 0 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  justifyItems: "center",
                  gap: 3,
                  paddingTop: 3,
                  marginBottom: 2,
                  borderTop: "1px solid rgba(146,64,14,0.35)",
                }}>
                  {ally.potions.map(({ item, quantity }) => (
                    <ItemIcon
                      key={`${ally.key}-potion-${item.id}`}
                      item={item}
                      size={32}
                      quantity={quantity}
                      tooltip={`${ally.name}: ${item.name} — click for options`}
                      onClick={onIconClick ? (e) => {
                        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                        onIconClick(item, "pack", rect);
                      } : undefined}
                    />
                  ))}
                </div>
              )}

              {/* FLEE — only on the hero column. */}
              {ally.showFlee && (
                <button
                  onClick={handleFlee}
                  disabled={loading}
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
                    color: loading ? "#5a4a3a" : "#f5c2a3",
                    cursor: loading ? "default" : "pointer",
                    transition: "all 0.15s",
                    textShadow: "0 1px 2px rgba(0,0,0,0.85)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(180,50,50,0.5)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#dc2626";
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(120,30,30,0.35)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(180,60,60,0.5)";
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
      })}

      {/* ═══════════════════════════════════════════════════════
          ENEMY ROW — one "slot" per enemy on the right side.
          Slot 0 is the main (rightmost, almost touching the edge).
          Slots 1+ are layout-preview NPCs stacking LEFTWARD. Each
          gets its own sprite + status + zone-targeting column so
          we can see a 3-enemy combat frame. The engine is still 1v1,
          so preview zone clicks route to the main enemy for now.
          ═══════════════════════════════════════════════════════ */}
      {(() => {
        // Slot 0 = main target (real). Slots 1+ = layout-preview NPCs with
        // unique sprites so each enemy slot looks distinct.
        const PREVIEW_NPCS = [
          { npcId: "armory_attendant", name: "Pip", hp: 25, maxHp: 25 },
          { npcId: "hokas_tokas", name: "Hokas Tokas", hp: 40, maxHp: 40 },
        ];
        const slots = [
          {
            key: "main",
            npcId: session.enemyNpcId,
            name: enemy.name,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
            activeEffects: enemy.activeEffects,
            isMain: true,
          },
          ...Array.from({ length: enemyLayoutPreviewCount }).map((_, i) => ({
            key: `preview-${i}`,
            npcId: PREVIEW_NPCS[i]?.npcId ?? session.enemyNpcId,
            name: PREVIEW_NPCS[i]?.name ?? `Enemy ${i + 2}`,
            hp: PREVIEW_NPCS[i]?.hp ?? 50,
            maxHp: PREVIEW_NPCS[i]?.maxHp ?? 50,
            activeEffects: [] as typeof enemy.activeEffects,
            isMain: false,
          })),
        ];

        return slots.map((slot, slotIdx) => {
          // Mirror of the ally geometry — 200px slot pitch, 240px sprite
          // containers, columns nested INSIDE the inner-facing edge of
          // each sprite. Slot 0 sits flush against the right edge.
          // Column offset 170 (was 140) shifts each column LEFT by 30px so
          // it sits in the gap between this enemy's painted figure and the
          // next enemy's. Any unavoidable overlap is with THIS enemy's own
          // left-margin, never the neighbor's painted figure.
          const SLOT_PITCH = 200;
          const spriteRight = `${slotIdx * SLOT_PITCH - 20}px`;
          const columnRight = `${slotIdx * SLOT_PITCH + 170}px`;
          // Main enemy uses the real enemy sprite; preview NPCs use their own.
          const spriteUrl = slot.isMain
            ? enemySprite.url
            : (previewSprites[slotIdx - 1]?.url ?? enemySprite.url);

          // Ghost-out enemies who are invisible.
          const enemyInvisible = slot.activeEffects.some(e => e.type === "invisible");
          // Dead state: session is finished and player won.
          const enemyDead = slot.isMain && session.finished && session.playerWon === true;
          const enemySpriteOpacity = enemyInvisible ? 0.35 : enemyDead ? 0.25 : 1;
          const enemySpriteFilter = enemyInvisible
            ? "drop-shadow(0 14px 24px rgba(0,0,0,0.5)) brightness(1.15) saturate(0.6) hue-rotate(200deg)"
            : enemyDead
              ? "grayscale(100%) brightness(0.4) drop-shadow(0 14px 24px rgba(0,0,0,0.85))"
              : "drop-shadow(0 14px 24px rgba(0,0,0,0.85))";

          // Is the right side (enemies) the defender? Hero attacked them.
          // Only the main (targeted) enemy shakes — preview NPCs stay still.
          const isEnemyDefending = slot.isMain && atkAnim?.defenderSide === "right";

          return (
            <div key={slot.key}>
              {/* Sprite */}
              <div
                className={isEnemyDefending ? "le-atk-shake" : undefined}
                style={{
                  position: "absolute",
                  right: spriteRight,
                  bottom: 0,
                  width: 240,
                  height: "72vh",
                  maxHeight: 640,
                  minHeight: 320,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  opacity: spriteUrl ? enemySpriteOpacity : 0.3,
                  transition: "opacity 0.5s ease, filter 0.5s ease",
                  filter: enemySpriteFilter,
                  pointerEvents: "none",
                }}
              >
                {spriteUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={spriteUrl}
                      alt={slot.name}
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        width: "auto",
                        objectFit: "contain",
                        position: "relative",
                        zIndex: 1,
                      }}
                    />
                    {/* Blood overlay on enemy — masked to sprite silhouette */}
                    {slot.isMain && enemyBlood.length > 0 && (
                      <BloodOverlay
                        splatters={enemyBlood}
                        spriteUrl={spriteUrl}
                      />
                    )}
                    {/* Corpse on ground — floats at feet after death.
                        Uses corpseImageUrl from NPC def when available;
                        otherwise renders a dark body-shadow placeholder
                        until Sprint 7b.RA art arrives. zIndex 2 sits
                        above the standing sprite but below blood (3). */}
                    {enemyDead && (
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
                    {/* Red hit flash on enemy when struck */}
                    {slot.isMain && hitFlash === "right" && (
                      <div className="le-hit-flash" style={{
                        position: "absolute",
                        inset: 0,
                        background: "radial-gradient(ellipse at 50% 60%, rgba(180,0,0,0.35) 0%, transparent 70%)",
                        pointerEvents: "none",
                        zIndex: 3,
                        WebkitMaskImage: `url(${spriteUrl})`,
                        maskImage: `url(${spriteUrl})`,
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "bottom center",
                        maskPosition: "bottom center",
                      }} />
                    )}
                  </>
                ) : (
                  <div style={{
                    fontSize: 80,
                    color: "#5a4a3a",
                    opacity: 0.5,
                  }}>◉</div>
                )}

                {/* Floating sprite overlay — up to 3 priority effect icons */}
                {slot.activeEffects.length > 0 && (
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
                    {slot.activeEffects
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
                          key={`${slot.key}-overlay-${i}-${e.type}`}
                          effectType={e.type}
                          severity={e.severity}
                          size={24}
                          showTooltip={true}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Status + zone-targeting column (top-anchored so all caps align) */}
              <div style={{
                position: "absolute",
                right: columnRight,
                bottom: "4vh",
                width: 64,
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
              }}>
                <VerticalStatusCap
                  name={slot.name}
                  nameColor="#f87171"
                  hp={slot.hp}
                  maxHp={slot.maxHp}
                  mana={0}
                  maxMana={0}
                  barHeight={94}
                />
                {slot.activeEffects.length > 0 && (
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 3,
                    marginBottom: 2,
                  }}>
                    {slot.activeEffects.slice(0, 6).map((e, i) => (
                      <EffectMarkerIcon
                        key={`${slot.key}-fx-${i}-${e.type}`}
                        effectType={e.type}
                        severity={e.severity}
                        size={20}
                        turnsRemaining={e.turnsRemaining}
                      />
                    ))}
                    {slot.activeEffects.length > 6 && (
                      <span style={{
                        fontSize: 8,
                        color: "#8a7a60",
                        fontFamily: "Georgia, serif",
                        alignSelf: "center",
                      }}>
                        +{slot.activeEffects.length - 6}
                      </span>
                    )}
                  </div>
                )}
                {BODY_ZONES.map(z => {
                  const isSelected = slot.isMain && selectedZone === z;
                  return (
                    <button
                      key={z}
                      onClick={() => {
                        setSelectedZone(z);
                        // Hero attacks → pulse hero, shake enemy side.
                        animateThenCommand(`STRIKE ${z.toUpperCase()}`, "hero", "right");
                      }}
                      disabled={loading || session.finished}
                      title={session.finished ? "Combat is over" : `Strike ${ZONE_LABELS[z].toLowerCase()} — ${ZONE_EVASION_HINT[z]}`}
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
                        color: isSelected ? "#fbbf24" : "#cdb78a",
                        cursor: loading ? "default" : "pointer",
                        transition: "all 0.15s",
                        textShadow: "0 1px 2px rgba(0,0,0,0.85)",
                        boxShadow: isSelected ? "0 2px 6px rgba(251,191,36,0.25)" : "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                      }}
                      onMouseEnter={e => {
                        if (!loading && !isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(146,64,14,0.28)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#92400e";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!loading && !isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(146,64,14,0.35)";
                        }
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
              </div>
            </div>
          );
        });
      })()}

      {/* Spell action menu (Cast / Lore) — anchored to the clicked icon. */}
      {spellMenu && (
        <SpellActionMenu
          spell={spellMenu.spell}
          anchorRect={spellMenu.rect}
          onCast={() => {
            const s = spellMenu.spell;
            const rect = spellMenu.rect;
            setSpellMenu(null);
            if (s.targeting === "none") {
              // POWER — fires immediately, no target picker
              animateThenCommand(`CAST ${s.name}`, "hero", "right");
            } else {
              // Open target picker for self/enemy spells
              setSpellTarget({ spell: s, rect });
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

      {/* Spell target picker — choose Self or enemy after clicking Cast. */}
      {spellTarget && (
        <SpellTargetMenu
          spell={spellTarget.spell}
          anchorRect={spellTarget.rect}
          enemyName={session.enemyName}
          onSelect={(cmd) => {
            const defSide = spellTarget.spell.targeting === "enemy" ? "right" : "left";
            setSpellTarget(null);
            animateThenCommand(cmd, "hero", defSide);
          }}
          onClose={() => setSpellTarget(null)}
        />
      )}

      {/* Spell lore popup — modal with stats + flavor text. */}
      {spellDetail && (
        <SpellDetailPopup spell={spellDetail} onClose={() => setSpellDetail(null)} />
      )}

      {/* Critical hit vignette — red border flash across the whole viewport */}
      {critVignette && (
        <div className="le-crit-vignette" style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 100,
          boxShadow: "inset 0 0 120px 40px rgba(139,0,0,0.5), inset 0 0 60px 20px rgba(200,0,0,0.3)",
        }} />
      )}

      {/* Keyframes for combat + effect marker animations */}
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

        /* ── Attack animations (Option B: Impact Pulse) ── */
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

        /* ── Combat text pop animation ── */
        @keyframes le-combat-text-pop-kf {
          0%   { opacity: 0; transform: scale(0.7) translateY(8px); }
          50%  { opacity: 1; transform: scale(1.06) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .le-combat-text-pop { animation: le-combat-text-pop-kf 0.4s ease-out; }

        /* ── Blood & gore animations ── */
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
