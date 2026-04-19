"use client";

import { ITEMS } from "../lib/gameData";
import type { Item } from "../lib/gameData";
import ItemIcon from "./ItemIcon";

interface ComparePopupProps {
  itemBeingCompared: Item;
  equippedItem: Item | null;
  onClose: () => void;
}

export default function ComparePopup({
  itemBeingCompared,
  equippedItem,
  onClose,
}: ComparePopupProps) {
  const getComparableStats = (item: Item, itemSlot?: string) => {
    const stats: Array<{ label: string; value: string }> = [];

    if (item.stats?.damage) {
      stats.push({ label: "Damage", value: item.stats.damage });
    }

    if (item.stats?.shieldBlockChance !== undefined) {
      stats.push({ label: "Block Chance", value: `${item.stats.shieldBlockChance}%` });
    }

    if (item.stats?.shieldDurability !== undefined) {
      stats.push({ label: "Shield Durability", value: String(item.stats.shieldDurability) });
    }

    if (item.stats?.zoneCover !== undefined) {
      stats.push({ label: "Coverage", value: `${item.stats.zoneCover}%` });
    }

    if (item.stats?.zoneDurability !== undefined) {
      stats.push({ label: "Durability", value: String(item.stats.zoneDurability) });
    }

    if (item.stats?.dexPenalty !== undefined) {
      stats.push({ label: "Dex Penalty", value: `−${item.stats.dexPenalty}` });
    }

    if (item.stats?.mountedDexPenalty !== undefined) {
      stats.push({ label: "Mounted Dex", value: `−${item.stats.mountedDexPenalty}` });
    }

    if (item.value > 0) {
      stats.push({ label: "Value", value: `${item.value} gp` });
    }

    return stats;
  };

  const newStats = getComparableStats(itemBeingCompared);
  const equippedStats = equippedItem ? getComparableStats(equippedItem) : [];

  const allStatLabels = new Set([
    ...newStats.map((s) => s.label),
    ...equippedStats.map((s) => s.label),
  ]);

  const getStatValue = (
    item: Item | null,
    label: string,
    stats: Array<{ label: string; value: string }>,
  ): string => {
    return stats.find((s) => s.label === label)?.value ?? "—";
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
            COMPARE
          </div>

          {/* Icons and labels row */}
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 16, gap: 12 }}>
            <div style={{ textAlign: "center" }}>
              {equippedItem ? (
                <>
                  <ItemIcon item={equippedItem} size={60} showEmpty={false} />
                  <div
                    style={{
                      color: "#cdb78a",
                      fontSize: 9,
                      marginTop: 6,
                      maxWidth: 80,
                      margin: "6px auto 0",
                    }}
                  >
                    {equippedItem.name}
                    <br />
                    <span style={{ color: "#92400e", fontSize: 8 }}>(equipped)</span>
                  </div>
                </>
              ) : (
                <div style={{ color: "#5a4a3a", fontSize: 10, padding: 20 }}>No item equipped</div>
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <ItemIcon item={itemBeingCompared} size={60} showEmpty={false} />
              <div style={{ color: "#cdb78a", fontSize: 9, marginTop: 6, maxWidth: 80, margin: "6px auto 0" }}>
                {itemBeingCompared.name}
              </div>
            </div>
          </div>

          {/* Stats comparison table */}
          {allStatLabels.size > 0 && (
            <div
              style={{
                backgroundColor: "#1a1410",
                border: "1px solid #2a1d0e",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                <tbody>
                  {Array.from(allStatLabels).map((label) => {
                    const equippedValue = getStatValue(
                      equippedItem,
                      label,
                      equippedItem ? getComparableStats(equippedItem) : [],
                    );
                    const newValue = getStatValue(itemBeingCompared, label, newStats);

                    const isBetter =
                      equippedValue !== "—" &&
                      newValue !== "—" &&
                      label === "Damage" &&
                      parseInt(newValue) > parseInt(equippedValue);

                    return (
                      <tr
                        key={label}
                        style={{
                          borderBottom: "1px solid #2a1d0e",
                        }}
                      >
                        <td style={{ padding: "8px 12px", color: "#92400e", textAlign: "left" }}>
                          {label}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            color: equippedValue === "—" ? "#5a4a3a" : "#cdb78a",
                            textAlign: "center",
                            borderRight: "1px solid #2a1d0e",
                          }}
                        >
                          {equippedValue}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            color: isBetter ? "#4ade80" : newValue === "—" ? "#5a4a3a" : "#cdb78a",
                            textAlign: "center",
                          }}
                        >
                          {newValue}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
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
          Close
        </button>
      </div>
    </div>
  );
}
