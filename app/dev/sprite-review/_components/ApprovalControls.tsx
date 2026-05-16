"use client";

import { useState } from "react";
import type { SpriteMetadata } from "@/lib/art/spriteMetadata";

interface Props {
  metadata: SpriteMetadata;
  flip: boolean;
  onFlipChange: (flip: boolean) => void;
  onApprove: () => void;
  onSaveMetadata: () => void;
  onReject: (note: string, regen: boolean) => void;
}

export default function ApprovalControls({
  metadata,
  flip,
  onFlipChange,
  onApprove,
  onSaveMetadata,
  onReject,
}: Props): React.JSX.Element {
  const [rejectMode, setRejectMode] = useState<"regen" | "noregen" | null>(null);
  const [note, setNote] = useState("");

  const approval = metadata.approval;
  const badgeColor =
    approval === "approved" ? "#1f9d55" : approval === "rejected" ? "#9b2c2c" : "#777";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 13, color: "#ccc" }}>
        Approval: <span style={{ color: badgeColor, fontWeight: 600 }}>{approval}</span>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "#ddd",
        }}
      >
        <input
          type="checkbox"
          checked={flip}
          onChange={(e) => onFlipChange(e.target.checked)}
        />
        Mirror horizontally (flip)
      </label>

      <button onClick={onSaveMetadata} style={btnStyle}>
        Save metadata
      </button>
      <button onClick={onApprove} style={{ ...btnStyle, background: "#1f9d55" }}>
        Approve
      </button>

      {rejectMode === null && (
        <>
          <button
            onClick={() => setRejectMode("regen")}
            style={{ ...btnStyle, background: "#9b2c2c" }}
          >
            Reject + queue regen
          </button>
          <button
            onClick={() => setRejectMode("noregen")}
            style={{ ...btnStyle, background: "#5a2a2a" }}
            title="Mark this sprite as rejected without queuing a regeneration. Use when the candidate is clearly worse than an existing approved one and you don't want to re-roll it."
          >
            Reject (no regen)
          </button>
        </>
      )}

      {rejectMode !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, color: "#fbbf24" }}>
            {rejectMode === "regen"
              ? "Reject + queue regen — note will inform the next forge run."
              : "Reject (no regen) — sprite stays rejected; nothing is queued."}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              rejectMode === "regen"
                ? "Reason for regen (e.g. 'facing wrong direction')"
                : "Optional note (e.g. 'duplicate of v3')"
            }
            rows={3}
            style={{
              padding: 6,
              background: "#222",
              color: "#eee",
              border: "1px solid #444",
              fontSize: 12,
            }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => {
                onReject(note, rejectMode === "regen");
                setRejectMode(null);
                setNote("");
              }}
              style={{
                ...btnStyle,
                background: rejectMode === "regen" ? "#9b2c2c" : "#5a2a2a",
                flex: 1,
              }}
            >
              {rejectMode === "regen" ? "Confirm reject + queue regen" : "Confirm reject"}
            </button>
            <button
              onClick={() => {
                setRejectMode(null);
                setNote("");
              }}
              style={btnStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {metadata.note && (
        <div style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>
          note: {metadata.note}
        </div>
      )}
      {metadata.reviewedAt && (
        <div style={{ fontSize: 10, color: "#666" }}>
          reviewed: {metadata.reviewedAt}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "6px 10px",
  background: "#333",
  color: "#eee",
  border: "1px solid #555",
  cursor: "pointer",
  fontSize: 13,
};
