// ============================================================
// LIVING EAMON — OathPanel (S1)
// Read-only display of the 42 Oaths of Ma'at + the hero's
// current PICSSI scores. The litany is canonical content
// (`lore/maatic-library/oaths-of-maat.md`) duplicated here as
// a TS const so the component renders without a fetch.
//
// v1 = static read; per-oath delta tracking lands in S2 once
// PICSSI deltas can be tagged with the oath they touched.
// ============================================================

import type { PicssiState } from "../lib/karma/types";

type OathTag =
  | "passion"
  | "integrity"
  | "courage"
  | "standing"
  | "spirituality"
  | "illumination";

interface Oath {
  n: number;
  text: string;
  tags: OathTag[];
}

const OATHS: Oath[] = [
  { n: 1,  text: "I walk the way of Ma'at.", tags: ["integrity", "spirituality"] },
  { n: 2,  text: "I do not prey upon the weak.", tags: ["integrity", "illumination"] },
  { n: 3,  text: "I take only what I earn.", tags: ["integrity"] },
  { n: 4,  text: "I defend innocent lives.", tags: ["illumination", "courage"] },
  { n: 5,  text: "I steal no laborer's bread.", tags: ["integrity"] },
  { n: 6,  text: "I steal no offering from the altar.", tags: ["spirituality"] },
  { n: 7,  text: "I do not plunder temples.", tags: ["spirituality"] },
  { n: 8,  text: "My word is true.", tags: ["integrity"] },
  { n: 9,  text: "I eat only what is mine.", tags: ["integrity"] },
  { n: 10, text: "I speak grievance openly.", tags: ["integrity", "courage"] },
  { n: 11, text: "I honor the marriage bond.", tags: ["integrity", "passion"] },
  { n: 12, text: "I bring no tears to the innocent.", tags: ["illumination", "passion"] },
  { n: 13, text: "I strike with purpose, not pleasure.", tags: ["illumination"] },
  { n: 14, text: "I do not strike first.", tags: ["integrity", "courage"] },
  { n: 15, text: "I name the world truly.", tags: ["integrity"] },
  { n: 16, text: "I claim only what I have raised.", tags: ["integrity"] },
  { n: 17, text: "I do not listen at doors.", tags: ["integrity"] },
  { n: 18, text: "I speak only to a man's face.", tags: ["integrity", "courage"] },
  { n: 19, text: "I am slow to anger.", tags: ["courage", "integrity"] },
  { n: 20, text: "I break no heart-bond.", tags: ["passion", "integrity"] },
  { n: 21, text: "My body is a vessel of Light.", tags: ["spirituality", "illumination"] },
  { n: 22, text: "I rule no man by fear.", tags: ["illumination"] },
  { n: 23, text: "I walk within just law.", tags: ["spirituality", "integrity"] },
  { n: 24, text: "I am master of my temper.", tags: ["courage", "integrity"] },
  { n: 25, text: "I hear the wounding truth.", tags: ["integrity", "illumination"] },
  { n: 26, text: "I doubt with reverence.", tags: ["spirituality"] },
  { n: 27, text: "I take no joy in killing.", tags: ["courage", "illumination"] },
  { n: 28, text: "I sow no discord.", tags: ["integrity", "illumination"] },
  { n: 29, text: "I weigh before I strike.", tags: ["integrity"] },
  { n: 30, text: "I do not pry into the hidden.", tags: ["integrity"] },
  { n: 31, text: "I speak with measure.", tags: ["integrity"] },
  { n: 32, text: "I leave the world less wronged.", tags: ["illumination"] },
  { n: 33, text: "I turn no Words against the just.", tags: ["spirituality", "illumination"] },
  { n: 34, text: "I block no flowing thing.", tags: ["spirituality"] },
  { n: 35, text: "I do not shout.", tags: ["integrity", "standing"] },
  { n: 36, text: "I curse no silent god.", tags: ["spirituality"] },
  { n: 37, text: "I know my smallness.", tags: ["spirituality", "integrity"] },
  { n: 38, text: "What is the gods' is the gods'.", tags: ["spirituality"] },
  { n: 39, text: "I honor the graves of the old.", tags: ["spirituality", "illumination"] },
  { n: 40, text: "I take no bread from a child.", tags: ["illumination"] },
  { n: 41, text: "I spare the sacred beasts.", tags: ["spirituality"] },
  { n: 42, text: "I stand before the feather. What I am, I am.", tags: ["passion", "integrity", "courage", "standing", "spirituality", "illumination"] },
];

// Painterly palette per virtue. Tweakable in S2 when per-oath deltas land.
const TAG_COLOR: Record<OathTag, string> = {
  passion:      "#ef4444", // rose-red
  integrity:    "#3b82f6", // deep blue
  courage:      "#f97316", // ember orange
  standing:     "#fbbf24", // royal gold
  spirituality: "#a855f7", // temple violet
  illumination: "#facc15", // candle cream
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

interface OathPanelProps {
  picssi: PicssiState;
}

export default function OathPanel({ picssi }: OathPanelProps): React.ReactElement {
  return (
    <div style={{ fontFamily: "Georgia, serif" }}>
      {/* Header — current PICSSI scores */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ color: "#aaaaaa", fontSize: 9, letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6 }}>
          THY VIRTUES
        </div>
        <PicssiSummary picssi={picssi} />
      </div>

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
        {OATHS.map(oath => (
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
            {/* Number */}
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

            {/* Oath text */}
            <span style={{ color: "#cdb78a", flex: 1 }}>{oath.text}</span>

            {/* Tag badges */}
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

      {/* Footer note */}
      <div style={{ color: "#5a4f3a", fontSize: 9, fontStyle: "italic", textAlign: "center", marginTop: 14, lineHeight: 1.4 }}>
        Per-oath karmic accounting will land in a later sprint;<br/>
        for now, watch thy six virtues above.
      </div>
    </div>
  );
}
