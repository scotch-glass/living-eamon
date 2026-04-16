"use client";

import type { Item } from "../lib/gameData";
import ItemIcon from "./ItemIcon";

export interface LootEntry {
  item: Item;
  quantity: number;
}

export interface LootScreenProps {
  /** Name of the defeated enemy. */
  enemyName: string;
  /** Gold dropped by the enemy. */
  gold: number;
  /** Items available to loot. */
  items: LootEntry[];
  /** Called when the player takes specific items + gold. */
  onTake: (itemIds: string[], takeGold: boolean) => void;
  /** Called when the player dismisses without taking anything. */
  onLeave: () => void;
}

export default function LootScreen({
  enemyName,
  gold,
  items,
  onTake,
  onLeave,
}: LootScreenProps) {
  const handleTakeAll = () => {
    onTake(items.map(e => e.item.id), true);
  };

  const handleTakeItem = (itemId: string) => {
    onTake([itemId], false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 90,
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          width: "min(92vw, 520px)",
          maxHeight: "80vh",
          overflowY: "auto",
          background: "linear-gradient(135deg, rgba(22,16,10,0.96) 0%, rgba(12,8,4,0.98) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(146,64,14,0.45)",
          borderRadius: 10,
          boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 1px rgba(205,183,138,0.15) inset",
          padding: "20px 24px",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#fbbf24",
            marginBottom: 4,
            textShadow: "0 1px 2px rgba(0,0,0,0.85)",
          }}
        >
          {enemyName} — Spoils
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "#8a7a60",
            marginBottom: 16,
          }}
        >
          Search the remains and take what you will.
        </div>

        {/* Gold line */}
        {gold > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(146,64,14,0.3)",
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
                {gold} Gold
              </div>
              <div style={{ fontSize: 10, color: "#8a7a60", marginTop: 2 }}>
                Coins scattered in the dust.
              </div>
            </div>
          </div>
        )}

        {/* Item list */}
        {items.map(entry => (
          <div
            key={entry.item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderBottom: "1px solid rgba(146,64,14,0.2)",
            }}
          >
            <ItemIcon item={entry.item} size={36} quantity={entry.quantity} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "#e8d4a0", fontWeight: 600 }}>
                {entry.item.name}
                {entry.quantity > 1 && (
                  <span style={{ color: "#8a7a60", fontWeight: 400, marginLeft: 6 }}>
                    ×{entry.quantity}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: "#8a7a60", marginTop: 2, lineHeight: 1.4 }}>
                {entry.item.glance ?? entry.item.description?.slice(0, 80)}
              </div>
              <div style={{ fontSize: 10, color: "#92400e", marginTop: 2 }}>
                Value: {entry.item.value} gp
              </div>
            </div>
            <button
              onClick={() => handleTakeItem(entry.item.id)}
              style={{
                padding: "5px 12px",
                fontFamily: "Georgia, serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                background: "rgba(146,64,14,0.2)",
                border: "1px solid rgba(146,64,14,0.4)",
                borderRadius: 4,
                color: "#e8d4a0",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(146,64,14,0.4)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(146,64,14,0.2)";
              }}
            >
              Take
            </button>
          </div>
        ))}

        {items.length === 0 && gold === 0 && (
          <div style={{ fontSize: 12, color: "#5a4a3a", fontStyle: "italic", padding: "12px 0" }}>
            Nothing of value remains.
          </div>
        )}

        {/* Bottom buttons */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 18,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onLeave}
            style={{
              padding: "8px 18px",
              fontFamily: "Georgia, serif",
              fontSize: 12,
              letterSpacing: "0.1em",
              background: "rgba(60,20,20,0.4)",
              border: "1px solid rgba(120,40,40,0.5)",
              borderRadius: 4,
              color: "#cdb78a",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(60,20,20,0.6)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(60,20,20,0.4)";
            }}
          >
            Leave
          </button>
          {(items.length > 0 || gold > 0) && (
            <button
              onClick={handleTakeAll}
              style={{
                padding: "8px 18px",
                fontFamily: "Georgia, serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.12em",
                background: "linear-gradient(180deg, rgba(251,191,36,0.3) 0%, rgba(146,64,14,0.4) 100%)",
                border: "1px solid #fbbf24",
                borderRadius: 4,
                color: "#fbbf24",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(251,191,36,0.2)",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "linear-gradient(180deg, rgba(251,191,36,0.45) 0%, rgba(146,64,14,0.55) 100%)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "linear-gradient(180deg, rgba(251,191,36,0.3) 0%, rgba(146,64,14,0.4) 100%)";
              }}
            >
              Take All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
