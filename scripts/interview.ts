// ============================================================
// Interactive interviewer daemon (long-running)
//
// Walks the open Edge Vector backlog with the user, captures their
// answer, optionally polishes it via Haiku, and writes it back into
// the source doc's Q+A block + removes the EV entry. Idles when the
// queue is empty.
//
// Run:
//   npm run interview
//   (or: npx tsx scripts/interview.ts [--dry-run])
//
// Control commands at the prompt:
//   skip   — move to next item without changes
//   defer  — leave the EV in the queue (alias for skip)
//   quit   — clean exit
// ============================================================

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";
import { allDocs } from "../lib/library/docMap";
import { locateEvBlock } from "../lib/library/edgeVectors";
import type { WorkItem, WorkQueue } from "./build-work-queue";
import { callHaiku } from "../lib/anthropic/client";

const REPO_ROOT = process.cwd();
const QUEUE_PATH = path.join(REPO_ROOT, "docs", "work-queue.json");
const EDGE_VECTORS_PATH = path.join(REPO_ROOT, "EDGE_VECTORS.md");

const DRY_RUN = process.argv.includes("--dry-run");
const IDLE_MS = 30_000;

// ── Tiny readline helper ──────────────────────────────────────

let rl: readline.Interface | null = null;

function getRl(): readline.Interface {
  if (rl) return rl;
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return rl;
}

function ask(prompt: string): Promise<string> {
  return new Promise((resolve) => getRl().question(prompt, (answer) => resolve(answer)));
}

function log(msg: string): void {
  process.stdout.write(`[interview] ${msg}\n`);
}

// ── Queue loader ──────────────────────────────────────────────

function loadQueue(): WorkQueue {
  if (!fs.existsSync(QUEUE_PATH)) {
    throw new Error(
      `${QUEUE_PATH} missing. Run \`npm run work-queue:build\` first.`
    );
  }
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8")) as WorkQueue;
}

const sessionSkipped = new Set<string>();

function nextOpenEv(queue: WorkQueue): WorkItem | null {
  const items = queue.items
    .filter(
      (it) =>
        it.kind === "ev" &&
        it.status === "awaits_answer" &&
        !sessionSkipped.has(it.id)
    )
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  return items[0] ?? null;
}

// ── Source-doc mutation ───────────────────────────────────────

function findSourceDocPath(sourceDocId: string): string | null {
  const doc = allDocs().find((d) => d.id === sourceDocId);
  if (!doc) return null;
  if (doc.path.includes("*")) return null;
  return path.join(REPO_ROOT, doc.path);
}

interface QABlock {
  start: number; // index in body of the `### [` heading
  end: number;   // index of the next `### ` or `---` boundary (exclusive)
}

/** Locate the Q+A block in `body` whose answer links to the given EV. */
export function locateQABlock(body: string, evId: string): QABlock | null {
  const evMarker = new RegExp(
    `\\(EDGE_VECTORS\\.md#${evId.toLowerCase()}\\)`,
    "i"
  );
  const markerMatch = body.match(evMarker);
  if (!markerMatch || markerMatch.index === undefined) return null;

  // Walk back from the marker to find the nearest `### [` heading
  const beforeMarker = body.slice(0, markerMatch.index);
  const headingRe = /^###\s+\[[^\]]+\]\s*$/gm;
  let lastHeading: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(beforeMarker)) !== null) {
    lastHeading = m;
  }
  if (!lastHeading) return null;
  const start = lastHeading.index;

  // Walk forward from the marker to find the next `### ` or `---` boundary
  const afterStart = body.slice(start + lastHeading[0].length);
  const nextHeadingIdx = afterStart.search(/\n###\s+\[/);
  const nextDividerIdx = afterStart.search(/\n---\s*\n/);
  const enders = [nextHeadingIdx, nextDividerIdx].filter((i) => i >= 0);
  if (enders.length === 0) return { start, end: body.length };
  const end = start + lastHeading[0].length + Math.min(...enders);
  return { start, end };
}

/** Replace a Q+A block's `**A:** ...` line with the new answer at `[high]`. */
export function rewriteQABlock(blockText: string, newAnswer: string): string {
  const lines = blockText.split(/\r?\n/);
  const out: string[] = [];
  let answerHandled = false;
  let dropContinuation = false;
  for (const line of lines) {
    if (!answerHandled && /^\*\*A:\*\*/.test(line)) {
      out.push(`**A:** ${newAnswer.trim()} \`[high]\``);
      answerHandled = true;
      // The original answer may span continuation lines until the next
      // `↔ relates to:` line or blank line. Drop those continuations.
      dropContinuation = true;
      continue;
    }
    if (dropContinuation) {
      // Stop dropping when we hit a relates-to line, blank line, or new heading
      if (/^[↔↪→]\s*relates to:/i.test(line)) {
        dropContinuation = false;
        out.push(line);
        continue;
      }
      if (line.trim() === "" || /^###/.test(line)) {
        dropContinuation = false;
        out.push(line);
        continue;
      }
      // Otherwise drop the continuation line
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

interface FrontmatterEdits {
  decrementOpen: boolean;
  removeEvId: string;
}

/**
 * Targeted line edits on the YAML frontmatter so we don't round-trip
 * the whole file through js-yaml (which would reformat unrelated
 * fields). Modifies questions_open, questions_answered, and the
 * edge_vector_ids array entry for the resolved EV.
 */
export function patchFrontmatter(raw: string, edits: FrontmatterEdits): string {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!fmMatch) return raw;
  const fmText = fmMatch[1];

  let newFm = fmText;

  if (edits.decrementOpen) {
    newFm = newFm.replace(/^questions_open:\s*(\d+)\s*$/m, (_, n) => {
      const v = Math.max(0, parseInt(n, 10) - 1);
      return `questions_open: ${v}`;
    });
    newFm = newFm.replace(/^questions_answered:\s*(\d+)\s*$/m, (_, n) => {
      const v = parseInt(n, 10) + 1;
      return `questions_answered: ${v}`;
    });
  }

  // edge_vector_ids: [EV-xxx-001, EV-xxx-002]  -> remove the resolved id
  newFm = newFm.replace(
    /^edge_vector_ids:\s*\[([^\]]*)\]\s*$/m,
    (_, inner: string) => {
      const items = inner
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s !== edits.removeEvId);
      return `edge_vector_ids: [${items.join(", ")}]`;
    }
  );

  return raw.replace(fmText, newFm);
}

interface MutationResult {
  sourceDocPath: string;
  edgeVectorsPath: string;
  ok: boolean;
  reason?: string;
}

function commitAnswer(ev: WorkItem, answer: string): MutationResult {
  const result: MutationResult = {
    sourceDocPath: "",
    edgeVectorsPath: EDGE_VECTORS_PATH,
    ok: false,
  };

  const docPath = findSourceDocPath(ev.source_doc);
  if (!docPath || !fs.existsSync(docPath)) {
    result.reason = `source doc not found for ${ev.source_doc}`;
    return result;
  }
  result.sourceDocPath = docPath;

  // 1. Mutate the source doc Q+A block + frontmatter
  const raw = fs.readFileSync(docPath, "utf-8");
  const fmMatch = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!fmMatch) {
    result.reason = `${docPath} has no frontmatter`;
    return result;
  }
  const bodyStart = fmMatch[0].length;
  const body = raw.slice(bodyStart);
  const block = locateQABlock(body, ev.id);
  if (!block) {
    result.reason = `Q+A block linking to ${ev.id} not found in ${path.basename(docPath)}`;
    return result;
  }

  const blockText = body.slice(block.start, block.end);
  const newBlock = rewriteQABlock(blockText, answer);
  const newBody = body.slice(0, block.start) + newBlock + body.slice(block.end);
  let newRaw = raw.slice(0, bodyStart) + newBody;
  newRaw = patchFrontmatter(newRaw, { decrementOpen: true, removeEvId: ev.id });

  if (DRY_RUN) {
    log(`[dry-run] would write ${path.relative(REPO_ROOT, docPath)} (${newRaw.length} bytes)`);
  } else {
    fs.writeFileSync(docPath, newRaw, "utf-8");
  }

  // 2. Delete the EV entry from EDGE_VECTORS.md
  const evRaw = fs.readFileSync(EDGE_VECTORS_PATH, "utf-8");
  const range = locateEvBlock(evRaw, ev.id);
  if (!range) {
    result.reason = `EV block ${ev.id} not found in EDGE_VECTORS.md`;
    return result;
  }
  // Trim a trailing blank line so we don't accumulate empty gaps
  let endTrim = range.end;
  while (endTrim < evRaw.length && /[\r\n]/.test(evRaw[endTrim])) endTrim++;
  const newEv = evRaw.slice(0, range.start) + evRaw.slice(endTrim);
  if (DRY_RUN) {
    log(`[dry-run] would delete ${ev.id} from EDGE_VECTORS.md (range ${range.start}-${endTrim})`);
  } else {
    fs.writeFileSync(EDGE_VECTORS_PATH, newEv, "utf-8");
  }

  result.ok = true;
  return result;
}

// ── docs:build invocation ─────────────────────────────────────

function runDocsBuild(): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn("npm", ["run", "docs:build"], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (out += d.toString()));
    proc.on("close", (code) => {
      const headline = out.trim().split(/\r?\n/).filter(Boolean).pop() ?? "";
      log(`docs:build exited ${code}${headline ? " — " + headline : ""}`);
      resolve(code ?? 1);
    });
  });
}

// ── Haiku polish ──────────────────────────────────────────────

const POLISH_SYSTEM = `You are a documentation editor for the Living Eamon design canon. The user gives you a raw answer to an open Edge Vector question. Your job: rewrite their answer as a single tight paragraph (no more than 4 sentences) suitable for a [high]-confidence Q+A block. Keep their wording, decisions, and specifics; remove filler ("um", "I think", "yeah"); add structure where the user's prose is rambling. Never invent facts. Never add caveats they didn't make. Output the rewritten answer only — no preamble, no quotes, no markdown wrapping.`;

async function polishAnswer(ev: WorkItem, raw: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return raw.trim();
  try {
    const text = await callHaiku({
      systemPrompt: POLISH_SYSTEM,
      maxTokens: 600,
      messages: [
        {
          role: "user",
          content: `EV: ${ev.id} \`[${ev.category}]\`\nQuestion: ${ev.question}\nBest guess (from doc): ${ev.best_guess ?? "(none)"}\n\nMy raw answer:\n${raw}`,
        },
      ],
    });
    return text || raw.trim();
  } catch (err) {
    log(`Haiku polish failed (${(err as Error).message}); using raw answer verbatim.`);
    return raw.trim();
  }
}

// ── Interview loop ────────────────────────────────────────────

let stopping = false;

async function interviewOne(ev: WorkItem): Promise<"answered" | "skipped" | "quit"> {
  process.stdout.write("\n");
  process.stdout.write("─".repeat(72) + "\n");
  process.stdout.write(`${ev.id}  [${ev.category}]   priority: ${ev.priority}\n`);
  process.stdout.write(`source: ${ev.source_doc}\n\n`);
  process.stdout.write(`Q: ${ev.question}\n\n`);
  if (ev.best_guess) process.stdout.write(`Best guess (from doc): ${ev.best_guess}\n\n`);
  if (ev.resolution_path) {
    process.stdout.write(`Resolution path: ${ev.resolution_path}\n\n`);
  }
  process.stdout.write(`Type your answer. Commands: skip, defer, quit.\n`);

  const raw = (await ask("> ")).trim();
  if (raw === "") return "skipped";
  const cmd = raw.toLowerCase();
  if (cmd === "quit" || cmd === "exit") return "quit";
  if (cmd === "skip" || cmd === "defer") return "skipped";

  const polished = await polishAnswer(ev, raw);
  process.stdout.write(`\nProposed answer:\n${polished}\n\n`);
  const confirm = (await ask("Commit? [y]es / [n]o / [r]aw (use my words verbatim): ")).trim().toLowerCase();
  let finalAnswer: string;
  if (confirm === "n" || confirm === "no") {
    log("skipping (declined)");
    return "skipped";
  } else if (confirm === "r" || confirm === "raw") {
    finalAnswer = raw;
  } else {
    finalAnswer = polished;
  }

  const result = commitAnswer(ev, finalAnswer);
  if (!result.ok) {
    log(`commit failed: ${result.reason}`);
    return "skipped";
  }
  log(`committed ${ev.id} -> ${path.relative(REPO_ROOT, result.sourceDocPath)} + EDGE_VECTORS.md${DRY_RUN ? " (dry-run)" : ""}`);
  if (!DRY_RUN) await runDocsBuild();
  return "answered";
}

async function mainLoop(): Promise<void> {
  while (!stopping) {
    let queue: WorkQueue;
    try {
      queue = loadQueue();
    } catch (err) {
      log((err as Error).message);
      await sleep(IDLE_MS);
      continue;
    }
    const next = nextOpenEv(queue);
    if (!next) {
      log(`no open questions — sleeping ${Math.round(IDLE_MS / 1000)}s`);
      await sleep(IDLE_MS);
      continue;
    }

    const outcome = await interviewOne(next);
    if (outcome === "quit") {
      stopping = true;
      break;
    }
    // Always add to the per-session skip set after touching an item,
    // whether answered or skipped. The real run regenerates the queue
    // file, so the just-answered EV won't be in the next load anyway;
    // dry-run leaves the queue intact, so the skip set prevents
    // an infinite loop on the same EV.
    sessionSkipped.add(next.id);
  }
  rl?.close();
  process.stdout.write("\n[interview] bye.\n");
  process.exit(0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── SIGINT handling ───────────────────────────────────────────

process.on("SIGINT", () => {
  process.stdout.write("\n[interview] caught SIGINT; finishing current step...\n");
  stopping = true;
  rl?.close();
  process.exit(0);
});

// ── Boot ──────────────────────────────────────────────────────

const invokedDirectly =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (invokedDirectly) {
  log(`starting${DRY_RUN ? " (dry-run mode)" : ""}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    log("ANTHROPIC_API_KEY not set — answers will be saved verbatim (no Haiku polish).");
  }
  void mainLoop();
}
