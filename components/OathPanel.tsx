// ============================================================
// LIVING EAMON — OathPanel (S1 + S3 extension 2026-05-03)
// Sidebar tab showing:
//   - the hero's current 6 PICSSI scores
//   - the player's active Words (S3) — sworn quests
//   - the canonical 42 Oaths of Ma'at
//
// Data lives in lib/oaths.ts (canonical lore) and PlayerState.givenWords.
// ============================================================

import type { PicssiState } from "../lib/karma/types";
import { OATHS_OF_MAAT, type OathTag } from "../lib/oaths";
import type { Word } from "../lib/quests/words";

const TAG_COLOR: Record<OathTag, string> = {
  passion:      "#ef4444",
  integrity:    "#3b82f6",
  courage:      "#f97316",
  standing:     "#fbbf24",
  spirituality: "#a855f7",
  illumination: "#facc15",
};

const TAG_LABEL: Record<OathTag, string> = {
  passion:      "P",
  integrity:    "I",
  courage:      "C",
  standing:     "St",
  spirituality: "Sp",
  illumination: "Il",
};

interface PicssiSummaryProps {
  picssi: PicssiState;
}

function PicssiSummary({ picssi }: PicssiSummaryProps): React.ReactElement {
  const rows: Array<[OathTag, number, string]> = [
    ["passion",      picssi.passion,      "0..100"],
    ["integrity",    picssi.integrity,    "0..100"],
    ["courage",      picssi.courage,      "0..100"],
    ["standing",     picssi.standing,     "0..100"],
    ["spirituality", picssi.spirituality, "0..100"],
    ["illumination", picssi.illumination, "-100..+100"],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 14, fontSize: 11, fontFamily: "Georgia, serif" }}>
      {rows.map(([tag, value, range]) => (
        <div
          key={tag}
          title={`${tag} (${range})`}
          style={{
            backgroundColor: "#0d0a06",
            padding: "5px 8px",
            borderRadius: 3,
            border: `1px solid ${TAG_COLOR[tag]}33`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: TAG_COLOR[tag], fontSize: 9, letterSpacing: "0.1em", fontWeight: 600, textTransform: "uppercase" }}>
            {tag.slice(0, 4)}
          </span>
          <span style={{ color: "#cdb78a", fontWeight: 600 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function WordStatusBadge({ status, mithraic }: { status: Word["status"]; mithraic: boolean }): React.ReactElement {
  const palette: Record<Word["status"], { bg: string; fg: string; label: string }> = {
    active:    { bg: "#1e3a5f", fg: "#7eb6ff", label: mithraic ? "ACTIVE · MITHRAIC" : "ACTIVE" },
    fulfilled: { bg: "#1e3a1e", fg: "#7ed47e", label: "FULFILLED" },
    broken:    { bg: "#3a1e1e", fg: "#ff7e7e", label: "BROKEN" },
  };
  const p = palette[status];
  return (
    <span style={{
      backgroundColor: p.bg,
      color: p.fg,
      padding: "1px 5px",
      borderRadius: 2,
      fontSize: 8,
      fontWeight: 700,
      letterSpacing: "0.08em",
    }}>
      {p.label}
    </span>
  );
}

interface WordsSectionProps {
  words: Word[];
}

function WordsSection({ words }: WordsSectionProps): React.ReactElement {
  const active = words.filter(w => w.status === "active");
  const closed = words.filter(w => w.status !== "active");
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#4a2e15" }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #4a2e15, transparent)" }} />
        <span style={{ fontSize: 10, color: "#92400e", letterSpacing: "0.15em" }}>WORDS GIVEN</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #4a2e15, transparent)" }} />
      </div>

      {words.length === 0 ? (
        <div style={{ color: "#7a6f5a", fontSize: 10, fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
          No Words sworn. Every quest accepted is a Word given.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[...active, ...closed].map(w => (
            <div
              key={w.id}
              style={{
                backgroundColor: "#0d0a06",
                padding: "6px 8px",
                borderRadius: 3,
                border: "1px solid #2a1d0e",
                fontSize: 11,
                lineHeight: 1.45,
                opacity: w.status === "active" ? 1 : 0.7,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color: "#cdb78a", flex: 1 }}>{w.questTitle}</span>
                <WordStatusBadge status={w.status} mithraic={w.mithraic} />
              </div>
              <div style={{ color: "#7a6f5a", fontSize: 9, marginTop: 2 }}>
                Sworn turn {w.swornAtTurn} · stake ×{w.breakPenaltyMultiplier}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface OathPanelProps {
  picssi: PicssiState;
  givenWords?: Word[];
}

export default function OathPanel({ picssi, givenWords = [] }: OathPanelProps): React.ReactElement {
  return (
    <div style={{ fontFamily: "Georgia, serif" }}>
      {/* Header — current PICSSI scores */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ color: "#aaaaaa", fontSize: 9, letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6 }}>
          THY VIRTUES
        </div>
        <PicssiSummary picssi={picssi} />
      </div>

      {/* S3 — Words given */}
      <WordsSection words={givenWords} />

      {/* Litany header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#4a2e15" }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #4a2e15, transparent)" }} />
        <span style={{ fontSize: 10, color: "#92400e", letterSpacing: "0.15em" }}>THE 42 OATHS OF MA'AT</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #4a2e15, transparent)" }} />
      </div>

      {/* Subtitle */}
      <div style={{ color: "#7a6f5a", fontSize: 10, fontStyle: "italic", textAlign: "center", marginBottom: 14, lineHeight: 1.4 }}>
        Sworn by every initiate of the Ma'atic Order.<br/>
        The path the hero walks who would have his heart found light against the feather.
      </div>

      {/* The 42 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {OATHS_OF_MAAT.map(oath => (
          <div
            key={oath.n}
            style={{
              backgroundColor: "#0d0a06",
              padding: "6px 8px",
              borderRadius: 3,
              border: "1px solid #2a1d0e",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 11,
              lineHeight: 1.45,
            }}
          >
            <span
              style={{
                color: "#7a6f5a",
                fontSize: 10,
                fontWeight: 600,
                minWidth: 18,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {oath.n}.
            </span>

            <span style={{ color: "#cdb78a", flex: 1 }}>{oath.text}</span>

            <span style={{ display: "flex", gap: 3, flexShrink: 0 }}>
              {oath.tags.map(tag => (
                <span
                  key={tag}
                  title={tag}
                  style={{
                    color: TAG_COLOR[tag],
                    backgroundColor: `${TAG_COLOR[tag]}1a`,
                    border: `1px solid ${TAG_COLOR[tag]}66`,
                    padding: "1px 4px",
                    borderRadius: 2,
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {TAG_LABEL[tag]}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div style={{ color: "#5a4f3a", fontSize: 9, fontStyle: "italic", textAlign: "center", marginTop: 14, lineHeight: 1.4 }}>
        Per-oath karmic accounting will land in a later sprint;<br/>
        for now, watch thy six virtues above.
      </div>
    </div>
  );
}
