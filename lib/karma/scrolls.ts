// ============================================================
// KARMA — Scrolls of Thoth
// KARMA Sprint 3. The fifteen scrolls live as markdown files in
// lore/scrolls-of-thoth/ with YAML-ish frontmatter declaring
// `scrollNumber`, `title`, `illuminationDelta`, and one or more
// fill-in-the-blank `riddles`.
//
// Reading a scroll opens the riddle gate; the player's NEXT command
// is taken as the answer. Pass = +Illumination on the FIRST riddle
// per scroll. Subsequent riddles still record passes but award no
// further Illumination — the soul lights once per text.
//
// We hand-parse the frontmatter to avoid pulling in js-yaml for one
// feature. The shape is fixed and we own the source.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import type { WorldState } from "../gameState";
import { addToChronicle } from "../gameState";
import { applyKarma, logKarmaDelta } from "./recompute";
import { emitQuestEvent } from "../quests/engine";

export interface ScrollRiddle {
  prompt: string;
  answer: string;
}

export interface Scroll {
  id: string;             // "thoth-1" .. "thoth-15"
  scrollNumber: number;
  title: string;
  illuminationDelta: number;
  riddles: ScrollRiddle[];
  body: string;
}

const SCROLLS_DIR = path.join(process.cwd(), "lore", "scrolls-of-thoth");

let cache: Scroll[] | null = null;

export function loadScrolls(): Scroll[] {
  if (cache) return cache;
  const files = fs
    .readdirSync(SCROLLS_DIR)
    .filter(f => /^scroll-\d+.*\.md$/.test(f));
  const scrolls: Scroll[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(SCROLLS_DIR, f), "utf8");
    const parsed = parseScroll(raw);
    if (parsed) scrolls.push(parsed);
  }
  scrolls.sort((a, b) => a.scrollNumber - b.scrollNumber);
  cache = scrolls;
  return cache;
}

/** Find a scroll by free-text identifier. Accepts "1", "thoth-1",
 *  the title, or any unique substring of the title. */
export function findScroll(query: string): Scroll | null {
  const all = loadScrolls();
  const q = query.trim().toLowerCase();
  if (!q) return null;
  // Numeric: "1", "I", "scroll 1"
  const numMatch = q.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1]!, 10);
    const byNum = all.find(s => s.scrollNumber === n);
    if (byNum) return byNum;
  }
  // Roman numeral up to XV — only if the player wrote "scroll <roman>"
  const roman = romanToInt(q);
  if (roman !== null) {
    const byRoman = all.find(s => s.scrollNumber === roman);
    if (byRoman) return byRoman;
  }
  // Title substring
  return all.find(s => s.title.toLowerCase().includes(q)) ?? null;
}

/**
 * Read a scroll. Renders the body and opens the riddle gate. If the
 * player has already passed every riddle in this scroll, the body
 * still renders but no gate opens.
 */
export function readScroll(state: WorldState, scrollId: string): { state: WorldState; narrative: string } {
  const scroll = loadScrolls().find(s => s.id === scrollId);
  if (!scroll) {
    return {
      state,
      narrative: "There is no such scroll.",
    };
  }

  const passed = state.player.scrollsRead?.[scrollId]?.riddlesPassed ?? [];
  const remaining = scroll.riddles.findIndex(
    r => !passed.includes(normalizeAnswer(r.answer))
  );

  if (remaining === -1) {
    return {
      state,
      narrative:
        `You unroll the ${scroll.title} again. The words are familiar; their meaning is yours. ` +
        "There is nothing new here for you.\n\n" +
        scroll.body,
    };
  }

  const riddle = scroll.riddles[remaining]!;
  const newState: WorldState = {
    ...state,
    player: {
      ...state.player,
      pendingRiddle: {
        scrollId: scroll.id,
        riddleIdx: remaining,
        prompt: riddle.prompt,
      },
    },
  };

  return {
    state: newState,
    narrative:
      scroll.body +
      "\n\n" +
      "─── The scroll closes with a riddle, written in red ink: ───\n" +
      `\n  ${riddle.prompt}\n\n` +
      "Speak your answer to claim the wisdom. (Type your answer.)",
  };
}

/**
 * Resolve a pending riddle. The player's command is taken verbatim
 * as the answer. Pass = mark the riddle, award Illumination if it's
 * the FIRST riddle ever passed for this scroll. Fail = clear the
 * gate; the player can READ the scroll again to re-attempt.
 */
export function answerPendingRiddle(state: WorldState, attempt: string): { state: WorldState; narrative: string } {
  const pending = state.player.pendingRiddle;
  if (!pending) {
    return { state, narrative: "There is no riddle awaiting your answer." };
  }
  const scroll = loadScrolls().find(s => s.id === pending.scrollId);
  if (!scroll) {
    // Scroll vanished between read and answer — clear gate.
    return {
      state: clearPendingRiddle(state),
      narrative: "The riddle slips your mind, formless and gone.",
    };
  }
  const riddle = scroll.riddles[pending.riddleIdx];
  if (!riddle) {
    return {
      state: clearPendingRiddle(state),
      narrative: "The riddle slips your mind, formless and gone.",
    };
  }

  const ok = answerMatches(attempt, riddle.answer);
  if (!ok) {
    return {
      state: clearPendingRiddle(state),
      narrative:
        "That is not the answer the scroll waits for. The red ink darkens; the riddle closes. " +
        "You may READ it again when you are ready.",
    };
  }

  // Pass: record + award Illumination on first per-scroll pass.
  const prior = state.player.scrollsRead?.[scroll.id];
  const isFirstPass = !prior || prior.riddlesPassed.length === 0;
  const normalizedAnswer = normalizeAnswer(riddle.answer);
  const updatedRecord = prior
    ? {
        firstReadAt: prior.firstReadAt,
        riddlesPassed: prior.riddlesPassed.includes(normalizedAnswer)
          ? prior.riddlesPassed
          : [...prior.riddlesPassed, normalizedAnswer],
      }
    : {
        firstReadAt: new Date().toISOString(),
        riddlesPassed: [normalizedAnswer],
      };

  let next: WorldState = {
    ...state,
    player: {
      ...state.player,
      pendingRiddle: null,
      scrollsRead: {
        ...(state.player.scrollsRead ?? {}),
        [scroll.id]: updatedRecord,
      },
    },
  };

  if (isFirstPass && scroll.illuminationDelta !== 0) {
    const ill = { illumination: scroll.illuminationDelta };
    next = {
      ...next,
      player: applyKarma(next.player, ill),
    };
    next = {
      ...next,
      player: logKarmaDelta(next.player, ill, `scroll: ${scroll.title}`),
    };
    next = addToChronicle(
      next,
      `${state.player.name} comprehended ${scroll.title} (Illumination ${scroll.illuminationDelta > 0 ? "+" : ""}${scroll.illuminationDelta}).`,
      false
    );
    next = emitQuestEvent(next, { type: "scroll-read", scrollId: scroll.id, firstPass: true });
    return {
      state: next,
      narrative:
        `Wisdom flows. Your soul brightens. (Illumination ${scroll.illuminationDelta > 0 ? "+" : ""}${scroll.illuminationDelta})`,
    };
  }

  next = emitQuestEvent(next, { type: "scroll-read", scrollId: scroll.id, firstPass: isFirstPass });
  return {
    state: next,
    narrative: "You speak the answer. The scroll's red ink dims to ash. The lesson is yours.",
  };
}

function clearPendingRiddle(state: WorldState): WorldState {
  if (!state.player.pendingRiddle) return state;
  return {
    ...state,
    player: { ...state.player, pendingRiddle: null },
  };
}

// ── Internal: frontmatter parser + answer normalization ───────────

function parseScroll(raw: string): Scroll | null {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!fmMatch) return null;
  const fm = fmMatch[1]!;
  const body = fmMatch[2]!.trim();

  const scrollNumber = pickInt(fm, "scrollNumber");
  if (scrollNumber === null) return null;
  const title = pickQuoted(fm, "title") ?? `Scroll ${scrollNumber}`;
  const illuminationDelta = pickInt(fm, "illuminationDelta") ?? 0;
  const riddles = pickRiddles(fm);

  return {
    id: `thoth-${scrollNumber}`,
    scrollNumber,
    title,
    illuminationDelta,
    riddles,
    body,
  };
}

function pickInt(fm: string, key: string): number | null {
  const m = fm.match(new RegExp(`^${key}\\s*:\\s*(-?\\d+)`, "m"));
  if (!m) return null;
  return parseInt(m[1]!, 10);
}

function pickQuoted(fm: string, key: string): string | null {
  const m = fm.match(new RegExp(`^${key}\\s*:\\s*"([^"]*)"`, "m"));
  if (m) return m[1]!;
  // Allow unquoted single-line values too.
  const u = fm.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, "m"));
  return u ? u[1]!.trim() : null;
}

function pickRiddles(fm: string): ScrollRiddle[] {
  // Match `- prompt: "..."` followed by `  answer: "..."` (or unquoted).
  const out: ScrollRiddle[] = [];
  const re = /-\s*prompt\s*:\s*(?:"([^"]*)"|([^\n]+))\s*\n\s+answer\s*:\s*(?:"([^"]*)"|([^\n]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fm)) !== null) {
    const prompt = (m[1] ?? m[2] ?? "").trim();
    const answer = (m[3] ?? m[4] ?? "").trim();
    if (prompt && answer) out.push({ prompt, answer });
  }
  return out;
}

function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/^(the|a|an)\s+/, "")
    .replace(/[.!?,;:]+$/, "");
}

function answerMatches(attempt: string, expected: string): boolean {
  return normalizeAnswer(attempt) === normalizeAnswer(expected);
}

function romanToInt(s: string): number | null {
  const m = s.match(/^scroll\s+([ivx]+)$/i) ?? s.match(/^([ivx]+)$/i);
  if (!m) return null;
  const map: Record<string, number> = { i: 1, v: 5, x: 10 };
  let result = 0;
  let prev = 0;
  for (const c of m[1]!.toLowerCase().split("").reverse()) {
    const v = map[c];
    if (v === undefined) return null;
    if (v < prev) result -= v;
    else result += v;
    prev = v;
  }
  return result > 0 && result <= 15 ? result : null;
}
