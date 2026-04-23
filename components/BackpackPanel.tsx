"use client";

import { ITEMS } from "../lib/gameData";
import type { Item } from "../lib/gameData";
import ItemIcon from "./ItemIcon";

export interface BackpackPanelProps {
  inventory: { itemId: string; quantity: number }[];
  /** Item ids currently equipped — these get a faint dimming + "(worn)" tooltip suffix. */
  equippedIds?: Set<string>;
  iconSize?: number;
  onItemClick?: (item: Item, rect: DOMRect) => void;
}

export default function BackpackPanel({
  inventory,
  equippedIds,
  iconSize = 40,
  onItemClick,
}: BackpackPanelProps) {
  if (!inventory.length) {
    return (
      <div
        style={{
          color: "#aaaaaa",
          fontSize: 11,
          fontStyle: "italic",
          fontFamily: "Georgia, serif",
          padding: "12px 0",
          textAlign: "center",
        }}
      >
        Your pack is empty.
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          color: "#aaaaaa",
          fontSize: 9,
          letterSpacing: "0.1em",
          marginBottom: 6,
          fontWeight: 600,
          fontFamily: "Georgia, serif",
        }}
      >
        PACK ({inventory.reduce((sum, e) => sum + e.quantity, 0)})
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, ${iconSize}px)`,
          gap: 4,
          justifyContent: "start",
        }}
      >
        {inventory.map(entry => {
          const item = ITEMS[entry.itemId];
          if (!item) return null;
          const equipped = equippedIds?.has(entry.itemId) ?? false;
          const tooltip = equipped
            ? `${item.name} (worn)`
            : entry.quantity > 1
              ? `${item.name} ×${entry.quantity}`
              : item.name;
          return (
            <div key={entry.itemId} style={{ opacity: equipped ? 0.55 : 1 }}>
              <ItemIcon
                item={item}
                size={iconSize}
                quantity={entry.quantity}
                tooltip={tooltip}
                onClick={onItemClick ? (e) => onItemClick(item, (e.currentTarget as HTMLDivElement).getBoundingClientRect()) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
