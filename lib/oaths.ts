// ============================================================
// LIVING EAMON — The 42 Oaths of Ma'at (S1 extension 2026-05-03)
//
// Shared canonical data for the litany. Imported by both the
// OathPanel UI and the READ OATHS / LOOK-in-Ma'at-temple paths
// in lib/gameEngine.ts.
//
// Source: lore/maatic-library/oaths-of-maat.md (markdown is canon).
// This file mirrors the 42 entries as a TS const so the runtime
// renders without a fetch.
// ============================================================

export type OathTag =
  | "passion"
  | "integrity"
  | "courage"
  | "standing"
  | "spirituality"
  | "illumination";

export interface Oath {
  n: number;
  text: string;
  tags: OathTag[];
}

export const OATHS_OF_MAAT: Oath[] = [
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

/** Format the litany for the in-game READ OATHS / temple-wall recitation. */
export function formatOathsLitany(): string {
  const lines = OATHS_OF_MAAT.map(o => `  ${String(o.n).padStart(2, " ")}. ${o.text}`);
  return [
    "You recite the Forty-Two Oaths of Ma'at.",
    "",
    ...lines,
    "",
    "—— What I am, I am.",
  ].join("\n");
}

/** First-read flag (life-scope). Subsequent reads are flavor only. */
export const READ_OATHS_FIRST_FLAG = "read_oaths_first";
