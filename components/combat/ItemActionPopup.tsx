// Compact action menu for a combat-usable item (potion, bandage, etc.).
// Anchored to the clicked icon. Emits a self-use command on the primary
// action; for the ally-target branch, calls back to the caller so the
// caller can render a follow-up TargetPicker. Dismisses on Escape /
// outside-click.
"use client";

import { useEffect, useRef } from "react";
import type { Item } from "../../lib/gameData";
import { popoverAboveAnchor } from "./sharedWidgets";

interface ItemActionPopupProps {
  item: Item;
  /** Pixel rect of the clicked icon — popup positions to its right. */
  anchorRect: { top: number; left: number; width: number; height: number };
  /** Label shown on the self-target action (e.g. "Drink", "Apply"). */
  selfLabel: string;
  onSelf: () => void;
  /** Optional: present an "Use on ally…" branch. Caller opens a TargetPicker. */
  onAlly?: () => void;
  onClose: () => void;
}

export default function ItemActionPopup({
  item,
  anchorRect,
  selfLabel,
  onSelf,
  onAlly,
  onClose,
}: ItemActionPopupProps): React.JSX.Element {
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
        ...popoverAboveAnchor(anchorRect),
        zIndex: 200,
        minWidth: 150,
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
      <Action label={selfLabel} onClick={onSelf} />
      {onAlly && <Action label="Use on ally…" onClick={onAlly} />}
    </div>
  );
}

function Action({ label, onClick }: { label: string; onClick: () => void }): React.JSX.Element {
  return (
    <button
      onClick={onClick}
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
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(146,64,14,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {label}
    </button>
  );
}
