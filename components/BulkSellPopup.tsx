"use client";

import { useState } from "react";
import { ITEMS } from "../lib/gameData";
import type { PlayerInventoryItem } from "../lib/gameState";

interface BulkSellPopupProps {
  inventory: PlayerInventoryItem[];
  vendorName: string;
  onSell: (itemIds: string[]) => void;
  onClose: () => void;
}

export default function BulkSellPopup({
  inventory,
  vendorName,
  onSell,
  onClose,
}: BulkSellPopupProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sellableItems = inventory.filter((entry) => {
    const item = ITEMS[entry.itemId];
    return item && item.isCarryable && item.value > 0;
  });

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelected(newSelected);
  };

  const totalGold = sellableItems.reduce((sum, entry) => {
    if (selected.has(entry.itemId)) {
      const item = ITEMS[entry.itemId]!;
      const salePrice = Math.max(1, Math.floor(item.value / 2));
      return sum + salePrice * entry.quantity;
    }
    return sum;
  }, 0);

  const handleSell = () => {
    if (selected.size > 0) {
      onSell(Array.from(selected));
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        cursor: "default",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#0d0a06",
          border: "2px solid #2a1d0e",
          borderRadius: 8,
          padding: 24,
          maxWidth: 500,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.9)",
          fontFamily: "Georgia, serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              color: "#92400e",
              fontSize: 11,
              letterSpacing: "0.1em",
              fontWeight: 600,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            SELL TO {vendorName.toUpperCase()}
          </div>

          {sellableItems.length === 0 ? (
            <div style={{ color: "#5a4a3a", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
              Thou hast nothing to sell.
            </div>
          ) : (
            <>
              {/* Items list */}
              <div
                style={{
                  backgroundColor: "#1a1410",
                  border: "1px solid #2a1d0e",
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                {sellableItems.map((entry) => {
                  const item = ITEMS[entry.itemId]!;
                  const salePrice = Math.max(1, Math.floor(item.value / 2));
                  const isSelected = selected.has(entry.itemId);

                  return (
                    <div
                      key={entry.itemId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        borderBottom: "1px solid #2a1d0e",
                        backgroundColor: isSelected ? "rgba(146, 64, 14, 0.2)" : "transparent",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onClick={() => toggleItem(entry.itemId)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLDivElement).style.backgroundColor =
                            "rgba(146, 64, 14, 0.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = isSelected
                          ? "rgba(146, 64, 14, 0.2)"
                          : "transparent";
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(entry.itemId)}
                        style={{
                          width: 16,
                          height: 16,
                          marginRight: 12,
                          cursor: "pointer",
                          accentColor: "#92400e",
                        }}
                      />

                      {/* Item details */}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: "#cdb78a",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {item.name}
                          {entry.quantity > 1 && ` ×${entry.quantity}`}
                        </div>
                        <div style={{ color: "#5a4a3a", fontSize: 10, marginTop: 2 }}>
                          {salePrice} gp {entry.quantity > 1 ? `(${salePrice * entry.quantity} total)` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              {totalGold > 0 && (
                <div
                  style={{
                    backgroundColor: "#1a1410",
                    border: "1px solid #2a1d0e",
                    borderRadius: 4,
                    padding: "12px",
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#92400e", fontSize: 11, letterSpacing: "0.05em" }}>
                    TOTAL
                  </span>
                  <span style={{ color: "#facc15", fontWeight: "bold", fontSize: 14 }}>
                    ⚜ {totalGold}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleSell}
            disabled={selected.size === 0}
            style={{
              flex: 1,
              padding: "8px 12px",
              backgroundColor: selected.size === 0 ? "#2a1d0e" : "#92400e",
              border: "1px solid #2a1d0e",
              color: selected.size === 0 ? "#5a4a3a" : "#fbbf24",
              fontSize: 10,
              letterSpacing: "0.05em",
              cursor: selected.size === 0 ? "not-allowed" : "pointer",
              fontFamily: "Georgia, serif",
              borderRadius: 4,
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (selected.size > 0) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#a84d10";
              }
            }}
            onMouseLeave={(e) => {
              if (selected.size > 0) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#92400e";
              }
            }}
          >
            Sell ({selected.size})
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "8px 12px",
              backgroundColor: "#1a1410",
              border: "1px solid #2a1d0e",
              color: "#92400e",
              fontSize: 10,
              letterSpacing: "0.05em",
              cursor: "pointer",
              fontFamily: "Georgia, serif",
              borderRadius: 4,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2a1d0e";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1a1410";
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
