"use client";

import { useState } from "react";
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
  /** Called when the player dismisses (Leave / click outside / after taking everything). */
  onLeave: () => void;
}

export default function LootScreen({
  enemyName,
  gold,
  items: initialItems,
  onTake,
  onLeave,
}: LootScreenProps) {
  // Track remaining items locally so individual Takes remove from the list
  // without dismissing the whole screen.
  const [remaining, setRemaining] = useState(initialItems);
  const [goldTaken, setGoldTaken] = useState(false);

  const handleTakeAll = () => {
    onTake(remaining.map(e => e.item.id), !goldTaken);
    onLeave();
  };

  const handleTakeItem = (itemId: string) => {
    // Take just this item — remove from the displayed list
    onTake([itemId], false);
    setRemaining(prev => prev.filter(e => e.item.id !== itemId));
  };

  const handleTakeGold = () => {
    if (!goldTaken) {
      onTake([], true);
      setGoldTaken(true);
    }
  };

  const hasAnythingLeft = remaining.length > 0 || (gold > 0 && !goldTaken);

  return (
    <div
      onClick={(e) => {
        // Click outside the inner box → dismiss
        if (e.target === e.currentTarget) onLeave();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 90,
        fontFamily: "Georgia, serif",
        cursor: "pointer",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
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
          cursor: "default",
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
              background: goldTaken ? "rgba(60,60,60,0.1)" : "rgba(251,191,36,0.06)",
              border: "1px solid rgba(146,64,14,0.3)",
              borderRadius: 6,
              marginBottom: 10,
              opacity: goldTaken ? 0.4 : 1,
              transition: "opacity 0.3s",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
                {gold} Gold
              </div>
              <div style={{ fontSize: 10, color: "#8a7a60", marginTop: 2 }}>
                {goldTaken ? "Taken." : "Coins scattered in the dust."}
              </div>
            </div>
            {!goldTaken && (
              <button
                onClick={handleTakeGold}
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
            )}
          </div>
        )}

        {/* Item list */}
        {remaining.map(entry => (
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

        {remaining.length === 0 && (gold === 0 || goldTaken) && (
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
          {hasAnythingLeft && (
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
