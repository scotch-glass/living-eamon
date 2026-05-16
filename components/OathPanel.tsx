// LIVING EAMON — OathPanel (S1 + S3 extension 2026-05-03)
// Sidebar tab showing the player's given Words (sworn quest oaths).
// The 42 Tenets of Ma'at are NOT shown here — they appear only via READ OATHS in temples.
// PICSSI virtues are NOT shown here — they live on the Stats tab.

import type { Word } from "../lib/quests/words";

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
  givenWords?: Word[];
}

export default function OathPanel({ givenWords = [] }: OathPanelProps): React.ReactElement {
  return (
    <div style={{ fontFamily: "Georgia, serif" }}>
      <WordsSection words={givenWords} />
    </div>
  );
}
