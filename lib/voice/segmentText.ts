// ============================================================
// Tag-aware text segmenter for the xAI TTS 15,000-char cap.
//
// Splits a long script into ≤ TARGET_MAX-char chunks at the
// strongest available boundary in this order:
//
//   1. Markdown horizontal rules (---) — chapter / section seams.
//   2. Markdown headings (## or # at line start).
//   3. Paragraph breaks (\n\n).
//   4. Sentence breaks (. ! ? ; followed by whitespace).
//
// Never splits inside a balanced wrapping tag, but can split across
// adjacent inline tags. If a single un-splittable paragraph
// (no sentence boundaries) exceeds the cap, the segmenter throws
// with a clear "split your paragraph" message rather than
// producing audio that drops mid-word.
//
// Segments are independently valid xAI TTS payloads: each is
// tag-balanced on its own (wrapping tags are never carried across
// segment boundaries because we refuse to split inside them).
// ============================================================

import { countCharsForTTS, WRAPPING_TAGS } from "./effectTags";
import { MAX_TTS_CHARS } from "./eve";

/** Leave headroom under the hard cap for safety + any future suffix. */
const HEADROOM = 200;
export const TARGET_MAX = MAX_TTS_CHARS - HEADROOM; // 14800

const WRAPPING_SET = new Set<string>(WRAPPING_TAGS);

export interface Segment {
  index: number;
  text: string;
  /** Length sent to xAI. */
  chars: number;
}

export interface SegmentationResult {
  segments: Segment[];
  /** Total chars across all segments (== input length when no tags re-added). */
  totalChars: number;
  /** Boundary kind used for splits, in order encountered. */
  boundariesUsed: Array<"hr" | "heading" | "paragraph" | "sentence">;
}

/**
 * Split text for xAI TTS. Returns one segment if text fits in
 * TARGET_MAX, otherwise splits at the best available boundary.
 */
export function segmentForTTS(text: string): SegmentationResult {
  if (countCharsForTTS(text) <= TARGET_MAX) {
    return {
      segments: [{ index: 0, text, chars: countCharsForTTS(text) }],
      totalChars: countCharsForTTS(text),
      boundariesUsed: [],
    };
  }

  const boundariesUsed: SegmentationResult["boundariesUsed"] = [];
  const chunks: string[] = [];
  let remaining = text;

  while (countCharsForTTS(remaining) > TARGET_MAX) {
    const split = findBestSplit(remaining);
    if (split == null) {
      throw new Error(
        `Cannot segment text: no valid split point found within ${TARGET_MAX} chars. ` +
          `Add a paragraph or sentence break, or shorten the wrapping tags so a ` +
          `split point falls outside them.`,
      );
    }
    chunks.push(remaining.slice(0, split.position).trimEnd());
    boundariesUsed.push(split.kind);
    remaining = remaining.slice(split.position).trimStart();
  }
  chunks.push(remaining);

  const segments: Segment[] = chunks.map((s, i) => ({
    index: i,
    text: s,
    chars: countCharsForTTS(s),
  }));

  return {
    segments,
    totalChars: segments.reduce((sum, s) => sum + s.chars, 0),
    boundariesUsed,
  };
}

interface SplitCandidate {
  position: number;
  kind: "hr" | "heading" | "paragraph" | "sentence";
}

/**
 * Find the last valid split position ≤ TARGET_MAX chars into `text`
 * that does not fall inside an open wrapping tag.
 */
function findBestSplit(text: string): SplitCandidate | null {
  const limit = Math.min(TARGET_MAX, text.length);

  // Build a per-character map: is index i inside an open wrapping tag?
  // This makes split-eligibility a constant-time lookup.
  const insideWrap = buildInsideWrapMap(text);

  // Try boundaries in order of strongest preference.
  // We scan from the limit backward to find the last eligible boundary.
  const tryKinds: Array<{
    kind: SplitCandidate["kind"];
    re: RegExp;
  }> = [
    { kind: "hr", re: /\n\n---\n\n/g },
    { kind: "heading", re: /\n\n#{1,6}\s+/g },
    { kind: "paragraph", re: /\n\n+/g },
    { kind: "sentence", re: /(?<=[.!?;])\s+(?=[A-Z"'(])/g },
  ];

  for (const { kind, re } of tryKinds) {
    re.lastIndex = 0;
    let best: number | null = null;
    for (const m of text.matchAll(re)) {
      const pos = (m.index ?? 0) + m[0].length;
      if (pos > limit) break;
      if (pos < 200) continue; // don't make tiny leading segments
      if (insideWrap[pos]) continue; // don't split inside a wrapping tag
      best = pos;
    }
    if (best != null) return { position: best, kind };
  }

  return null;
}

/**
 * Returns an array of length text.length+1 where index i is true
 * if position i lies inside an open <wrapping>...</wrapping> tag.
 */
function buildInsideWrapMap(text: string): boolean[] {
  const inside = new Array<boolean>(text.length + 1).fill(false);
  let depth = 0;
  const tagRe = /<(\/?)([a-z-]+)>/gi;
  let lastEnd = 0;
  for (const m of text.matchAll(tagRe)) {
    const name = m[2].toLowerCase();
    if (!WRAPPING_SET.has(name)) continue;
    const start = m.index ?? 0;
    const end = start + m[0].length;
    // Mark span [lastEnd, start) with current depth state.
    if (depth > 0) {
      for (let i = lastEnd; i < start; i++) inside[i] = true;
    }
    depth += m[1] === "/" ? -1 : 1;
    if (depth < 0) depth = 0;
    lastEnd = end;
  }
  if (depth > 0) {
    for (let i = lastEnd; i <= text.length; i++) inside[i] = true;
  }
  return inside;
}
