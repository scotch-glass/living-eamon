"use client";

import type { SpriteMetadata, SpriteMetadataMap } from "@/lib/art/spriteMetadata";
import { ALL_SIZE_CLASSES } from "@/lib/art/sizeClasses";

interface Props {
  paths: string[];
  metadata: SpriteMetadataMap;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  filterApproval: "any" | "unreviewed" | "approved" | "rejected";
  onFilterApproval: (v: "any" | "unreviewed" | "approved" | "rejected") => void;
  filterClass: "any" | "A" | "B" | "C" | "D" | "E";
  onFilterClass: (v: "any" | "A" | "B" | "C" | "D" | "E") => void;
}

interface BadgeSpec {
  bg: string;
  border?: string;
  /** A char rendered inside the dot. Empty string = blank dot. */
  glyph: string;
  glyphColor?: string;
  title: string;
}

function badgeFor(meta: SpriteMetadata): BadgeSpec {
  if (meta.approval === "approved") {
    return { bg: "#1f9d55", glyph: "", title: "approved" };
  }
  if (meta.approval === "rejected") {
    if (meta.regenRequested) {
      // Rejected with a regen queued — open red circle (loop icon).
      return {
        bg: "#9b2c2c",
        glyph: "↻",
        glyphColor: "#fff",
        title: "rejected — regen queued",
      };
    }
    // Rejected with NO regen queued — dead-end. Filled bright-red square
    // with an ✗ so it reads as final, distinct from the regen-loop dot.
    return {
      bg: "#dc2626",
      border: "1px solid #fca5a5",
      glyph: "✗",
      glyphColor: "#fff",
      title: "rejected — no regen",
    };
  }
  return { bg: "#666", glyph: "", title: "unreviewed" };
}

export default function SpriteList({
  paths,
  metadata,
  selectedPath,
  onSelect,
  filterApproval,
  onFilterApproval,
  filterClass,
  onFilterClass,
}: Props): React.JSX.Element {
  const filtered = paths.filter((p) => {
    const m = metadata[p];
    const approval = m?.approval ?? "unreviewed";
    if (filterApproval !== "any" && approval !== filterApproval) return false;
    if (filterClass !== "any" && m?.sizeClass !== filterClass) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, height: "100%" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <select
          value={filterApproval}
          onChange={(e) => onFilterApproval(e.target.value as Props["filterApproval"])}
          style={selectStyle}
        >
          <option value="any">All approval</option>
          <option value="unreviewed">Unreviewed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filterClass}
          onChange={(e) => onFilterClass(e.target.value as Props["filterClass"])}
          style={selectStyle}
        >
          <option value="any">All classes</option>
          {ALL_SIZE_CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div style={{ fontSize: 11, color: "#888" }}>
        {filtered.length} / {paths.length} sprites
      </div>
      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #333" }}>
        {filtered.map((p) => {
          const m = metadata[p];
          const isSelected = p === selectedPath;
          const isCorpse = m?.isCorpse ?? false;
          const badge = badgeFor(m ?? { path: p, approval: "unreviewed" });
          return (
            <button
              key={p}
              onClick={() => onSelect(p)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "5px 8px",
                background: isSelected ? "#2a4a8a" : "transparent",
                color: "#ddd",
                border: "none",
                borderBottom: "1px solid #2a2a2a",
                cursor: "pointer",
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: badge.bg,
                  border: badge.border,
                  color: badge.glyphColor ?? "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                title={badge.title}
              >
                {badge.glyph}
              </span>
              {m?.sizeClass && (
                <span
                  style={{
                    background: "#444",
                    padding: "0 4px",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {m.sizeClass}
                </span>
              )}
              {isCorpse && (
                <span
                  style={{
                    background: "#553",
                    color: "#fbbf24",
                    padding: "0 4px",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                  title="corpse"
                >
                  ✟
                </span>
              )}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.replace(/^\/art\//, "")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  flex: 1,
  padding: 4,
  background: "#222",
  color: "#eee",
  border: "1px solid #333",
  fontSize: 11,
};
