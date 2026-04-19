"use client";

import { useEffect, useRef } from "react";
import type { Item } from "../lib/gameData";

export interface ItemAction {
  label: string;
  /** The engine command to send (e.g. "EQUIP LONG SWORD"). null = handled by callback instead. */
  command: string | null;
  /** If true, this action is coming soon but not wired yet. Shows dimmed. */
  comingSoon?: boolean;
  /** If true, this opens the inspect popup instead of sending a command. */
  isInspect?: boolean;
  /** If true, open the compare popup. */
  isCompare?: boolean;
  /** If true, open the bulk sell popup. */
  isBulkSell?: boolean;
}

export type ItemContext =
  | "pack"          // in the player's inventory, not equipped
  | "equipped"      // in the GEAR tab, currently worn/wielded
  | "vendor";       // in a vendor's shop listing (future)

const VENDOR_ROOMS = new Set(["main_hall", "sams_sharps", "armory", "mage_school"]);

/**
 * Derive contextual actions for an item based on its type, the
 * context it's being viewed in, and the player's current room.
 */
export function getItemActions(
  item: Item,
  context: ItemContext,
  currentRoom: string,
  isEquipped: boolean,
): ItemAction[] {
  const actions: ItemAction[] = [];
  const inShop = VENDOR_ROOMS.has(currentRoom);

  if (context === "equipped") {
    // Equipped items: Unequip + Inspect only (no Sell — must unequip first)
    actions.push({ label: "Unequip", command: `UNEQUIP ${item.name.toUpperCase()}` });
    actions.push({ label: "Inspect", command: null, isInspect: true });
    return actions;
  }

  // ── Pack context ──

  // Equip actions (weapons, armor, shields)
  if (item.type === "weapon" && !isEquipped) {
    actions.push({ label: "Equip", command: `EQUIP ${item.name.toUpperCase()}` });
    actions.push({ label: "Compare", command: null, isCompare: true });
  }
  if (item.type === "armor" && !isEquipped) {
    actions.push({ label: "Equip", command: `EQUIP ${item.name.toUpperCase()}` });
    actions.push({ label: "Compare", command: null, isCompare: true });
  }

  // Consumable actions
  if (item.type === "consumable") {
    // Healing / mana / stamina potions
    if (item.id === "healing_potion" || item.id === "greater_healing_potion") {
      actions.push({ label: "Drink", command: `USE ${item.name.toUpperCase()}` });
    } else if (item.id === "mana_potion") {
      actions.push({ label: "Drink", command: `USE ${item.name.toUpperCase()}` });
    } else if (item.id === "stamina_brew" || item.id === "fatigue_brew") {
      actions.push({ label: "Drink", command: `USE ${item.name.toUpperCase()}` });
    }
    // Antidotes
    else if (item.id === "antidote" || item.id === "strong_antidote") {
      actions.push({ label: "Drink", command: `USE ${item.name.toUpperCase()}` });
    }
    // Bandage / Tourniquet
    else if (item.id === "bandage") {
      actions.push({ label: "Apply", command: "BANDAGE" });
    } else if (item.id === "tourniquet") {
      actions.push({ label: "Apply", command: "TOURNIQUET" });
    }
    // Poisons — apply to blade
    else if (item.id === "unreliable_poison" || item.id === "strong_poison") {
      actions.push({ label: "Apply to Blade", command: `APPLY ${item.name.toUpperCase()} TO WEAPON` });
    }
    // Food / drink
    else if (item.id === "ale" || item.id === "hearty_meal" || item.id === "rations") {
      actions.push({ label: item.id === "ale" ? "Drink" : "Eat", command: `USE ${item.name.toUpperCase()}` });
    }
  }

  // Key / scroll
  if (item.type === "key") {
    actions.push({ label: "Use", command: `USE ${item.name.toUpperCase()}` });
  }

  // Inspect (always available)
  actions.push({ label: "Inspect", command: null, isInspect: true });

  // Drop / Sell (mutually exclusive based on location)
  if (inShop) {
    actions.push({ label: "Sell", command: `SELL ${item.name.toUpperCase()}` });
    actions.push({ label: "Bulk Sell", command: null, isBulkSell: true });
  } else {
    actions.push({ label: "Drop", command: `DROP ${item.name.toUpperCase()}` });
  }

  return actions;
}

// ── The popup menu component ────────────────────────────────

export interface ItemActionMenuProps {
  item: Item;
  actions: ItemAction[];
  /** Position relative to the sidebar (anchor point of the tile). */
  anchorRect: { top: number; left: number; width: number; height: number };
  onAction: (action: ItemAction) => void;
  onClose: () => void;
}

export default function ItemActionMenu({
  item,
  actions,
  anchorRect,
  onAction,
  onClose,
}: ItemActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
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

  // Position: to the right of the anchor tile, or below if no room
  const menuTop = anchorRect.top;
  const menuLeft = anchorRect.left + anchorRect.width + 6;

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: menuTop,
        left: menuLeft,
        zIndex: 200,
        minWidth: 130,
        background: "linear-gradient(180deg, #1a120a 0%, #0d0805 100%)",
        border: "1px solid #4a2e15",
        borderRadius: 6,
        boxShadow: "0 8px 24px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.5)",
        padding: "4px 0",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Item name header */}
      <div
        style={{
          padding: "6px 12px 4px",
          fontSize: 11,
          color: "#fbbf24",
          fontWeight: 600,
          borderBottom: "1px solid #2a1d0e",
          marginBottom: 2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: 180,
        }}
      >
        {item.name}
      </div>

      {actions.map((action, i) => (
        <button
          key={i}
          onClick={() => {
            if (!action.comingSoon) onAction(action);
          }}
          disabled={action.comingSoon}
          style={{
            display: "block",
            width: "100%",
            padding: "6px 12px",
            background: "transparent",
            border: "none",
            textAlign: "left",
            color: action.comingSoon ? "#5a4a3a" : "#e8d4a0",
            fontSize: 12,
            fontFamily: "Georgia, serif",
            cursor: action.comingSoon ? "default" : "pointer",
            fontStyle: action.comingSoon ? "italic" : "normal",
            transition: "background 0.1s",
          }}
          onMouseEnter={e => {
            if (!action.comingSoon) {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(146,64,14,0.3)";
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          {action.label}
          {action.comingSoon && <span style={{ fontSize: 9, marginLeft: 6, color: "#5a4a3a" }}>(soon)</span>}
        </button>
      ))}
    </div>
  );
}
