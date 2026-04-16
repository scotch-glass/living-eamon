"use client";

import { useState, useEffect } from "react";
import type { Item } from "../lib/gameData";

// ── Shared icon cache (mirrors ItemIcon.tsx module-level pattern) ──
const iconUrlCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();

function fetchIconUrl(itemId: string): Promise<string | null> {
  const cached = iconUrlCache.get(itemId);
  if (cached) return Promise.resolve(cached);
  const existing = inFlight.get(itemId);
  if (existing) return existing;
  const p = fetch(`/api/item-icon?id=${encodeURIComponent(itemId)}`)
    .then(r => r.json())
    .then((data: { url: string | null }) => {
      if (data.url) iconUrlCache.set(itemId, data.url);
      inFlight.delete(itemId);
      return data.url;
    })
    .catch(() => {
      inFlight.delete(itemId);
      return null;
    });
  inFlight.set(itemId, p);
  return p;
}

export interface ItemDetailPopupProps {
  item: Item | null;
  onClose: () => void;
}

/** Books, scrolls, grimoires get the alchemical codex style. Everything else gets standard. */
function isBookItem(item: Item): boolean {
  return item.type === "spell";
}

// ── Linear B decorator (for alchemical style) ──

function toLinearB(name: string): string {
  const syllables: Record<string, string> = {
    a: "𐀀", e: "𐀁", i: "𐀂", o: "𐀃", u: "𐀄",
    da: "𐀅", de: "𐀆", di: "𐀇", do: "𐀈", du: "𐀉",
    ja: "𐀊", je: "𐀋", jo: "𐀍",
    ka: "𐀏", ke: "𐀐", ki: "𐀑", ko: "𐀒", ku: "𐀓",
    ma: "𐀔", me: "𐀕", mi: "𐀖", mo: "𐀗", mu: "𐀘",
    na: "𐀙", ne: "𐀚", ni: "𐀛", no: "𐀜", nu: "𐀝",
    pa: "𐀞", pe: "𐀟", pi: "𐀠", po: "𐀡", pu: "𐀢",
    qa: "𐀣", qe: "𐀤", qi: "𐀥", qo: "𐀦",
    ra: "𐀨", re: "𐀩", ri: "𐀪", ro: "𐀫", ru: "𐀬",
    sa: "𐀭", se: "𐀮", si: "𐀯", so: "𐀰", su: "𐀱",
    ta: "𐀲", te: "𐀳", ti: "𐀴", to: "𐀵", tu: "𐀶",
    wa: "𐀷", we: "𐀸", wi: "𐀹", wo: "𐀺",
    za: "𐀼", ze: "𐀽", zo: "𐀿",
  };
  const lower = name.toLowerCase().replace(/[^a-z ]/g, "");
  return lower
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      let result = "";
      let i = 0;
      while (i < word.length) {
        const c = word[i]!;
        const next = word[i + 1];
        const isVowel = /[aeiou]/.test(c);
        if (!isVowel && next && /[aeiou]/.test(next)) {
          result += syllables[c + next] ?? syllables[next] ?? "𐀀";
          i += 2;
        } else if (isVowel) {
          result += syllables[c] ?? "𐀀";
          i += 1;
        } else {
          result += syllables[c + "a"] ?? "";
          i += 1;
        }
      }
      return result;
    })
    .join(" ");
}

// ── Stats helpers ──

function typeLabel(item: Item): string {
  switch (item.type) {
    case "weapon": return "Weapon";
    case "armor": return item.stats?.shieldBlockChance ? "Shield" : "Armor";
    case "clothing": return "Clothing";
    case "consumable": return "Consumable";
    case "treasure": return "Treasure";
    case "key": return "Quest Item";
    case "spell": return "Spell";
    default: return "Item";
  }
}

function buildStatRows(item: Item): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const s = item.stats;
  if (!s) return rows;

  if (s.damage) rows.push({ label: "Damage", value: s.damage });
  if (s.healAmount) rows.push({ label: "Healing", value: `+${s.healAmount} HP` });

  // Armor / shield
  if (s.zoneCover) rows.push({ label: "Coverage", value: `${s.zoneCover}%` });
  if (s.zoneDurability) rows.push({ label: "Durability", value: `${s.zoneDurability}` });
  if (s.zoneSlot) rows.push({ label: "Slot", value: s.zoneSlot.charAt(0).toUpperCase() + s.zoneSlot.slice(1) });
  if (s.shieldBlockChance) rows.push({ label: "Block", value: `${s.shieldBlockChance}%` });
  if (s.shieldDurability) rows.push({ label: "Durability", value: `${s.shieldDurability}` });
  if (s.dexPenalty) rows.push({ label: "Dex Penalty", value: `-${s.dexPenalty}` });
  if (s.mountedDexPenalty != null) rows.push({ label: "Mounted Penalty", value: `-${s.mountedDexPenalty}` });

  // Poison
  if (s.poisonSeverity) rows.push({ label: "Poison", value: `Severity ${s.poisonSeverity}` });
  if (s.poisonCharges) rows.push({ label: "Charges", value: `${s.poisonCharges}` });

  return rows;
}

// ═══════════════════════════════════════════════════════════════
// Standard Inspection View — dark glassmorphism + item sprite
// ═══════════════════════════════════════════════════════════════

function StandardInspectView({ item }: { item: Item }) {
  const [iconUrl, setIconUrl] = useState<string | null>(iconUrlCache.get(item.id) ?? null);
  const [iconLoading, setIconLoading] = useState(!iconUrlCache.has(item.id));

  useEffect(() => {
    if (iconUrlCache.has(item.id)) {
      setIconUrl(iconUrlCache.get(item.id)!);
      setIconLoading(false);
      return;
    }
    setIconLoading(true);
    fetchIconUrl(item.id).then(url => {
      setIconUrl(url);
      setIconLoading(false);
    });
  }, [item.id]);

  const statRows = buildStatRows(item);
  const glyph = glyphForType(item.type);

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "relative",
        width: "min(92vw, 520px)",
        maxHeight: "80vh",
        background: "linear-gradient(135deg, rgba(22,16,10,0.92) 0%, rgba(12,8,4,0.96) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(146,64,14,0.35)",
        borderRadius: 10,
        boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 1px rgba(205,183,138,0.15) inset",
        display: "flex",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* ── Left: item sprite ── */}
      <div
        style={{
          flex: "0 0 38%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "linear-gradient(180deg, rgba(30,20,12,0.6) 0%, rgba(10,6,2,0.8) 100%)",
          borderRight: "1px solid rgba(146,64,14,0.2)",
          minHeight: 220,
        }}
      >
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt={item.name}
            style={{
              maxWidth: "100%",
              maxHeight: 180,
              objectFit: "contain",
              filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.7))",
              opacity: iconLoading ? 0.4 : 1,
              transition: "opacity 0.3s",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 72,
              color: "#5a4a3a",
              opacity: iconLoading ? 0.6 : 0.35,
              fontFamily: "Georgia, serif",
              transition: "opacity 0.3s",
            }}
          >
            {glyph}
          </span>
        )}
      </div>

      {/* ── Right: text content ── */}
      <div
        style={{
          flex: 1,
          padding: "20px 22px",
          overflowY: "auto",
          maxHeight: "80vh",
        }}
      >
        {/* Item name */}
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#fbbf24",
            marginBottom: 4,
            lineHeight: 1.25,
          }}
        >
          {item.name}
        </div>

        {/* Type + value line */}
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.75rem",
            color: "#8a7a60",
            marginBottom: 14,
            display: "flex",
            gap: 12,
          }}
        >
          <span>{typeLabel(item)}</span>
          {item.value > 0 && <span>{item.value} gp</span>}
        </div>

        {/* Stats table */}
        {statRows.length > 0 && (
          <div
            style={{
              marginBottom: 14,
              borderTop: "1px solid rgba(146,64,14,0.25)",
              borderBottom: "1px solid rgba(146,64,14,0.25)",
              padding: "10px 0",
            }}
          >
            {statRows.map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 0",
                  fontFamily: "Georgia, serif",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ color: "#8a7a60" }}>{row.label}</span>
                <span style={{ color: "#e8d4a0", fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.85rem",
            color: "#cdb78a",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {item.alchemicalDescription ?? item.description}
        </div>
      </div>
    </div>
  );
}

function glyphForType(type: string): string {
  switch (type) {
    case "weapon": return "⚔";
    case "armor": return "⛊";
    case "clothing": return "👕";
    case "consumable": return "⚱";
    case "treasure": return "✦";
    case "key": return "⚷";
    case "spell": return "✶";
    default: return "·";
  }
}

// ═══════════════════════════════════════════════════════════════
// Alchemical Book View — Thurian codex (existing style)
// ═══════════════════════════════════════════════════════════════

function AlchemicalBookView({ item }: { item: Item }) {
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/item-image?id=${encodeURIComponent(item.id)}`)
      .then(r => r.json())
      .then((data: { url: string | null }) => {
        setBgUrl(data.url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [item.id]);

  const linearBName = toLinearB(item.name);

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "relative",
        width: "min(90vw, 640px)",
        aspectRatio: "4/3",
        maxHeight: "85vh",
        backgroundColor: "transparent",
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 8,
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        cursor: "default",
        overflow: "hidden",
      }}
    >
      {loading && !bgUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#cdb78a",
            fontSize: 14,
          }}
        >
          Opening the codex…
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: "34%",
          left: "24%",
          right: "18%",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-linear-b), serif",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#1a0e05",
            textAlign: "right",
            marginBottom: 4,
            lineHeight: 1.2,
            textShadow: "0 1px 0 rgba(255,240,210,0.3)",
          }}
        >
          {linearBName}
        </div>
        <div
          style={{
            fontFamily: "var(--font-cedarville), cursive",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "#2a1a0a",
            textAlign: "right",
          }}
        >
          {item.name}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "56%",
          left: "19%",
          right: "18%",
          bottom: "8%",
          fontFamily: "var(--font-cedarville), cursive",
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#2a1a0a",
          textAlign: "right",
          lineHeight: 1.55,
          overflow: "hidden",
        }}
      >
        {item.alchemicalDescription ?? item.description}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main popup — modal shell + style router
// ═══════════════════════════════════════════════════════════════

export default function ItemDetailPopup({ item, onClose }: ItemDetailPopupProps) {
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [item, onClose]);

  if (!item) return null;

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
        zIndex: 100,
        cursor: "pointer",
      }}
    >
      {isBookItem(item) ? (
        <AlchemicalBookView item={item} />
      ) : (
        <StandardInspectView item={item} />
      )}
    </div>
  );
}
