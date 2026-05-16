// ============================================================
// xAI TTS effect tag registry, validator, and stripper.
//
// xAI /v1/tts supports two tag families inline in the `text` body:
//
//   Inline tags (point-insert):
//     [pause] [long-pause] [laugh] [cry] [breath] [mouth]
//
//   Wrapping tags (modify a span):
//     <whisper>x</whisper>
//     <soft>x</soft>
//     <emphasis>x</emphasis>     (NOT <loud>)
//     <slow>x</slow>
//     <fast>x</fast>
//     <singing>x</singing>
//
// Wrapping tags may nest: <slow><soft>goodnight</soft></slow>.
//
// This module is the single source of truth for what is and is not
// a valid xAI tag. The validator runs before any TTS call so we
// don't spend money on broken syntax. `stripTags()` is what the
// Reader Panel displays — players read clean prose; only the TTS
// engine sees the tags.
//
// Docs:
//   https://docs.x.ai/developers/model-capabilities/audio/text-to-speech
// ============================================================

export const INLINE_TAGS = [
  "pause",
  "long-pause",
  "laugh",
  "cry",
  "breath",
  "mouth",
] as const;

export const WRAPPING_TAGS = [
  "whisper",
  "soft",
  "emphasis",
  "slow",
  "fast",
  "singing",
] as const;

export type InlineTag = (typeof INLINE_TAGS)[number];
export type WrappingTag = (typeof WRAPPING_TAGS)[number];

const INLINE_SET = new Set<string>(INLINE_TAGS);
const WRAPPING_SET = new Set<string>(WRAPPING_TAGS);

/**
 * Common typos / Creator-intuitive aliases that should be rewritten
 * before validation. Surfaces "did you mean" suggestions instead of
 * silent failures. Lowercased lookup.
 */
const TYPO_SUGGESTIONS: Record<string, WrappingTag | InlineTag> = {
  loud: "emphasis",
  emphasize: "emphasis",
  emphasized: "emphasis",
  shout: "emphasis",
  shouted: "emphasis",
  yell: "emphasis",
  quiet: "soft",
  hushed: "whisper",
  whispered: "whisper",
  slowly: "slow",
  quickly: "fast",
  sing: "singing",
  laughing: "laugh",
  laughed: "laugh",
  crying: "cry",
  cried: "cry",
  breathe: "breath",
  breathing: "breath",
  sigh: "breath",
  break: "pause",
  silence: "pause",
};

// ── Issues ────────────────────────────────────────────────────

export type IssueKind =
  | "unknown-inline"
  | "unknown-wrapping"
  | "unclosed-wrapping"
  | "stray-closing"
  | "did-you-mean";

export interface TagIssue {
  kind: IssueKind;
  /** 0-based character offset where the issue starts. */
  position: number;
  /** The raw text that triggered the issue (e.g. "<loud>", "[example]"). */
  raw: string;
  /** Human-readable explanation. */
  message: string;
  /** Suggested replacement, if known. */
  suggestion?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: TagIssue[];
  /** Total characters that will be sent to xAI (tags included). */
  charsForTTS: number;
  /** Length of the player-facing prose (tags stripped). */
  charsStripped: number;
}

// ── Regexes ───────────────────────────────────────────────────

// Matches [tagname] — strict bracket pair, no nested brackets.
const INLINE_RE = /\[([a-z-]+)\]/gi;

// Matches <tagname> or </tagname>. Loose: any token of letters/dashes.
// We only treat tokens in WRAPPING_SET as effect tags; everything
// else flagged as unknown so prose `<...>` accidents don't slip past.
const WRAPPING_RE = /<(\/?)([a-z-]+)>/gi;

// ── Validation ────────────────────────────────────────────────

export function validateTags(text: string): ValidationResult {
  const issues: TagIssue[] = [];

  // Inline tags ----------------------------------------------------
  for (const m of text.matchAll(INLINE_RE)) {
    const name = m[1].toLowerCase();
    if (INLINE_SET.has(name)) continue;
    const suggestion = TYPO_SUGGESTIONS[name];
    if (suggestion && INLINE_SET.has(suggestion)) {
      issues.push({
        kind: "did-you-mean",
        position: m.index ?? 0,
        raw: m[0],
        message: `Unknown inline tag "[${name}]" — did you mean "[${suggestion}]"?`,
        suggestion: `[${suggestion}]`,
      });
    } else {
      issues.push({
        kind: "unknown-inline",
        position: m.index ?? 0,
        raw: m[0],
        message: `Unknown inline tag "[${name}]". Valid: ${INLINE_TAGS.map((t) => `[${t}]`).join(", ")}.`,
      });
    }
  }

  // Wrapping tags --------------------------------------------------
  const openStack: Array<{ name: string; position: number; raw: string }> = [];
  for (const m of text.matchAll(WRAPPING_RE)) {
    const isClose = m[1] === "/";
    const name = m[2].toLowerCase();
    const position = m.index ?? 0;
    const raw = m[0];

    if (!WRAPPING_SET.has(name)) {
      const suggestion = TYPO_SUGGESTIONS[name];
      if (suggestion && WRAPPING_SET.has(suggestion)) {
        issues.push({
          kind: "did-you-mean",
          position,
          raw,
          message: `Unknown wrapping tag "<${isClose ? "/" : ""}${name}>" — did you mean "<${isClose ? "/" : ""}${suggestion}>"?`,
          suggestion: `<${isClose ? "/" : ""}${suggestion}>`,
        });
      } else {
        issues.push({
          kind: "unknown-wrapping",
          position,
          raw,
          message: `Unknown wrapping tag "<${name}>". Valid: ${WRAPPING_TAGS.map((t) => `<${t}>`).join(", ")}.`,
        });
      }
      continue;
    }

    if (isClose) {
      const top = openStack[openStack.length - 1];
      if (!top || top.name !== name) {
        issues.push({
          kind: "stray-closing",
          position,
          raw,
          message: top
            ? `Closing "</${name}>" does not match open "<${top.name}>" at ${top.position}.`
            : `Closing "</${name}>" has no matching open tag.`,
        });
      } else {
        openStack.pop();
      }
    } else {
      openStack.push({ name, position, raw });
    }
  }

  // Any tags left open at end of text are unclosed wrappers.
  for (const open of openStack) {
    issues.push({
      kind: "unclosed-wrapping",
      position: open.position,
      raw: open.raw,
      message: `Open "<${open.name}>" was never closed. Add "</${open.name}>".`,
    });
  }

  return {
    ok: issues.length === 0,
    issues,
    charsForTTS: countCharsForTTS(text),
    charsStripped: stripTags(text).length,
  };
}

// ── Char counting ─────────────────────────────────────────────

/**
 * Length of text as xAI will count it. Equal to the raw string
 * length — every byte sent in the `text` field counts toward the
 * 15,000-char cap, including tag syntax. Surfaced as a function
 * so callers don't have to remember that detail.
 */
export function countCharsForTTS(text: string): number {
  return text.length;
}

// ── Stripping ─────────────────────────────────────────────────

/**
 * Remove all inline + wrapping tags, leaving the player-facing
 * prose. Wrapping tags are removed but the inner text is preserved.
 * Inline point-tags are removed entirely.
 */
export function stripTags(text: string): string {
  let out = text;
  // Inline tags: drop entirely.
  out = out.replace(INLINE_RE, (m, name: string) => {
    return INLINE_SET.has(name.toLowerCase()) ? "" : m;
  });
  // Wrapping tags: keep inner text. Replace recognized open + close
  // markers with the empty string. Unknown tags are left intact so
  // the user can see what the validator complained about.
  out = out.replace(WRAPPING_RE, (m, slash: string, name: string) => {
    return WRAPPING_SET.has(name.toLowerCase()) ? "" : m;
  });
  // Squash any double whitespace introduced by tag removal,
  // preserving paragraph breaks (\n\n).
  out = out
    .split(/\n\n/)
    .map((para) => para.replace(/[ \t]+/g, " ").trim())
    .join("\n\n");
  return out;
}

// ── Help text ─────────────────────────────────────────────────

export interface TagReference {
  kind: "inline" | "wrapping";
  tag: string;
  example: string;
  description: string;
}

export const TAG_REFERENCE: TagReference[] = [
  { kind: "inline", tag: "[pause]", example: "Wait... [pause] there.", description: "Brief silence." },
  { kind: "inline", tag: "[long-pause]", example: "She thought it through. [long-pause] Then spoke.", description: "Extended dramatic silence." },
  { kind: "inline", tag: "[laugh]", example: "And I could not believe it! [laugh]", description: "Laughter at the marked point." },
  { kind: "inline", tag: "[cry]", example: "She read the letter. [cry]", description: "Crying sound." },
  { kind: "inline", tag: "[breath]", example: "[breath] Let me start again.", description: "Audible breath / sigh." },
  { kind: "inline", tag: "[mouth]", example: "He swallowed nervously. [mouth]", description: "Subtle mouth sound." },
  { kind: "wrapping", tag: "<whisper>", example: "<whisper>It is a secret.</whisper>", description: "Hushed, intimate delivery." },
  { kind: "wrapping", tag: "<soft>", example: "<soft>I'm so tired.</soft>", description: "Quieter, lower intensity." },
  { kind: "wrapping", tag: "<emphasis>", example: "<emphasis>Never</emphasis> say his name.", description: "Louder, more intense. Use for what older docs called \"loud.\"" },
  { kind: "wrapping", tag: "<slow>", example: "<slow>Listen carefully.</slow>", description: "Slower pace, weighty." },
  { kind: "wrapping", tag: "<fast>", example: "<fast>Run, run, run!</fast>", description: "Faster pace, urgent." },
  { kind: "wrapping", tag: "<singing>", example: "<singing>la la la</singing>", description: "Sung delivery." },
];
