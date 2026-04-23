"use client";

import { useEffect, useState } from "react";
import type { Item } from "../lib/gameData";

// Module-level cache: itemId → resolved URL. Survives across renders so the
// sidebar doesn't re-fetch the same icons every time it re-renders.
const iconUrlCache = new Map<string, string>();
// In-flight promises so two simultaneous mounts of the same icon share one fetch.
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

/**
 * Glyph fallback by item type — shown while icon loads, or if loading fails.
 * Keeps the slot recognizable even before the painted icon arrives.
 */
function glyphForItem(item: Item | null): string {
  if (!item) return "·";
  switch (item.type) {
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

export interface ItemIconProps {
  item: Item | null;
  size?: number;          // px, default 40
  /** Click handler receives the MouseEvent so callers can read the tile's bounding rect. */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Display a quantity badge in the corner (for stackable inventory items). */
  quantity?: number;
  /** Title attribute (tooltip). Defaults to item.name. */
  tooltip?: string;
  /** True = render the empty-slot silhouette even if item is null. */
  showEmpty?: boolean;
  /** Optional ring color for "equipped" emphasis. */
  ringColor?: string;
}

export default function ItemIcon({
  item,
  size = 40,
  onClick,
  quantity,
  tooltip,
  showEmpty = false,
  ringColor,
}: ItemIconProps) {
  const [url, setUrl] = useState<string | null>(
    item ? iconUrlCache.get(item.id) ?? null : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) return;
    if (iconUrlCache.has(item.id)) {
      setUrl(iconUrlCache.get(item.id)!);
      return;
    }
    setLoading(true);
    fetchIconUrl(item.id).then(resolved => {
      setUrl(resolved);
      setLoading(false);
    });
  }, [item]);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: 4,
    border: ringColor ? `1px solid ${ringColor}` : "1px solid #2a1d0e",
    background: "linear-gradient(180deg, #1a120a 0%, #0d0805 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,200,140,0.05)",
    cursor: onClick ? "pointer" : "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transition: "border-color 0.15s, transform 0.1s",
  };

  if (!item && !showEmpty) return null;

  return (
    <div
      style={containerStyle}
      title={tooltip ?? item?.name}
      onClick={onClick ? (e) => onClick(e) : undefined}
      onMouseEnter={
        onClick
          ? e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#92400e";
            }
          : undefined
      }
      onMouseLeave={
        onClick
          ? e => {
              (e.currentTarget as HTMLDivElement).style.borderColor =
                ringColor ?? "#2a1d0e";
            }
          : undefined
      }
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={item?.name ?? ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            imageRendering: "auto",
            opacity: loading ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        />
      ) : (
        <span
          style={{
            color: "#aaaaaa",
            fontSize: Math.floor(size * 0.5),
            fontFamily: "Georgia, serif",
            opacity: loading ? 0.7 : 0.4,
          }}
        >
          {glyphForItem(item)}
        </span>
      )}
      {quantity != null && quantity > 1 && (
        <span
          style={{
            position: "absolute",
            bottom: 1,
            right: 2,
            color: "#fbbf24",
            fontSize: 9,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            textShadow: "0 1px 2px rgba(0,0,0,0.9), 0 0 3px rgba(0,0,0,0.9)",
            lineHeight: 1,
          }}
        >
          {quantity}
        </span>
      )}
    </div>
  );
}
