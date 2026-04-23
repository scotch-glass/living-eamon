"use client";

import { ITEMS } from "../lib/gameData";
import type { Item } from "../lib/gameData";
import ItemIcon from "./ItemIcon";

export interface EquipmentGridProps {
  weaponId: string;
  shieldId: string | null;
  helmetId: string | null;
  gorgetId: string | null;
  bodyArmorId: string | null;
  limbArmorId: string | null;
  bootsId: string | null;
  ringLeftId: string | null;
  ringRightId: string | null;
  cuffLeftId: string | null;
  cuffRightId: string | null;
  necklaceId: string | null;
  weaponIsTwoHanded?: boolean;
  iconSize?: number;
  onItemClick?: (item: Item, rect: DOMRect) => void;
}

interface SlotConfig {
  key: string;
  label: string;
  itemId: string | null;
  emptyAllowed: boolean;
  forcedEmptyMsg?: string;
}

export default function EquipmentGrid({
  weaponId,
  shieldId,
  helmetId,
  gorgetId,
  bodyArmorId,
  limbArmorId,
  bootsId,
  ringLeftId,
  ringRightId,
  cuffLeftId,
  cuffRightId,
  necklaceId,
  weaponIsTwoHanded = false,
  iconSize = 40,
  onItemClick,
}: EquipmentGridProps) {
  const slots: SlotConfig[] = [
    { key: "weapon", label: "Weapon", itemId: weaponId === "unarmed" ? null : weaponId, emptyAllowed: true },
    { key: "helmet", label: "Head", itemId: helmetId, emptyAllowed: true },
    {
      key: "shield",
      label: "Shield",
      itemId: shieldId,
      emptyAllowed: true,
      forcedEmptyMsg: weaponIsTwoHanded ? "two-handed" : undefined,
    },
    { key: "gorget", label: "Neck", itemId: gorgetId, emptyAllowed: true },
    { key: "necklace", label: "Amulet", itemId: necklaceId, emptyAllowed: true },
    { key: "boots", label: "Feet", itemId: bootsId, emptyAllowed: true },
    { key: "bodyArmor", label: "Body", itemId: bodyArmorId, emptyAllowed: true },
    { key: "ringLeft", label: "Ring L", itemId: ringLeftId, emptyAllowed: true },
    { key: "ringRight", label: "Ring R", itemId: ringRightId, emptyAllowed: true },
    { key: "limbArmor", label: "Limbs", itemId: limbArmorId, emptyAllowed: true },
    { key: "cuffLeft", label: "Cuff L", itemId: cuffLeftId, emptyAllowed: true },
    { key: "cuffRight", label: "Cuff R", itemId: cuffRightId, emptyAllowed: true },
  ];

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
        EQUIPPED
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(3, ${iconSize}px)`,
          gap: 6,
          justifyContent: "start",
        }}
      >
        {slots.map(slot => {
          const item = slot.itemId ? ITEMS[slot.itemId] ?? null : null;
          const tooltip = slot.forcedEmptyMsg
            ? `${slot.label}: ${slot.forcedEmptyMsg}`
            : item
              ? `${slot.label}: ${item.name}`
              : `${slot.label}: empty`;
          return (
            <div key={slot.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <ItemIcon
                item={item}
                size={iconSize}
                tooltip={tooltip}
                showEmpty
                ringColor={item ? "#92400e" : "#2a1d0e"}
                onClick={item && onItemClick ? (e) => onItemClick(item, (e.currentTarget as HTMLDivElement).getBoundingClientRect()) : undefined}
              />
              <div
                style={{
                  fontSize: 8,
                  color: "#aaaaaa",
                  fontFamily: "Georgia, serif",
                  letterSpacing: "0.05em",
                  textAlign: "center",
                  lineHeight: 1,
                }}
              >
                {slot.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
