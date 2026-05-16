// ============================================================
// Layer 2 — Topic-route manifest generator.
//
// Walks every doc's Q+A block and emits docs/topic-routes.md, a
// reverse index by Q+A category (e.g. [PD-SAFETY], [INK-AUTHORING],
// [WIRING]) listing the docs that answer each topic ranked by
// question count.
//
// Use case: when a session asks a domain question, the router tells
// Claude which 2-4 docs to load — no exploratory grepping.
//
// Read-only. Pure deterministic generation.
// Run:
//   npm run topic-routes:build
//   (or: npx tsx scripts/build-topic-routes.ts)
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { allDocs, type DocEntry } from "../lib/library/docMap";
import { parseFrontmatter } from "../lib/library/markdown";

const REPO_ROOT = process.cwd();
const OUT_PATH = path.join(REPO_ROOT, "docs", "topic-routes.md");

// ── Parse helpers ──────────────────────────────────────────────

interface QAEntry {
  category: string;
  confidence: "high" | "medium" | "low" | "open";
  evRefs: string[];
}

interface DocCategoryStats {
  docId: string;
  category: string;
  high: number;
  nonHigh: number;
  evRefs: string[];
}

const QA_BLOCK_START = /^##\s+Questions answered by this document/m;
const QA_BLOCK_END = /^---\s*$/m;
const CATEGORY_HEADER = /^###\s+\[([A-Z][A-Z-]*)\]\s*$/;
const CONFIDENCE_TAG = /`\[(high|medium|low|open)\]`/i;
const EV_REF = /EV-[a-z][a-z0-9_]*-\d{3}/g;

/**
 * Parse the Q+A block of a doc body and return an entry per `### [CATEGORY]`
 * header. Tolerates docs without a Q+A block (returns empty array).
 */
function parseQABlock(body: string): QAEntry[] {
  const startMatch = body.match(QA_BLOCK_START);
  if (!startMatch) return [];
  const startIdx = body.indexOf(startMatch[0]) + startMatch[0].length;
  const tail = body.slice(startIdx);
  const endMatch = tail.match(QA_BLOCK_END);
  // The first --- after the Q+A heading closes the block. (PANTHEON-pilot
  // schema uses --- before the body title.) If no --- found, take the rest.
  const blockBody = endMatch ? tail.slice(0, tail.indexOf(endMatch[0])) : tail;

  // Split on H3 category headers; each chunk after a header is one Q+A entry.
  const entries: QAEntry[] = [];
  const lines = blockBody.split(/\r?\n/);
  let currentCategory: string | null = null;
  let currentChunk = "";

  const flush = () => {
    if (!currentCategory) return;
    const conf = currentChunk.match(CONFIDENCE_TAG);
    const confidence = (conf?.[1]?.toLowerCase() ?? "high") as QAEntry["confidence"];
    const evMatches = [...currentChunk.matchAll(EV_REF)].map((m) => m[0]);
    const evRefs = [...new Set(evMatches)];
    entries.push({ category: currentCategory, confidence, evRefs });
  };

  for (const line of lines) {
    const m = line.match(CATEGORY_HEADER);
    if (m) {
      flush();
      currentCategory = m[1];
      currentChunk = "";
      continue;
    }
    currentChunk += line + "\n";
  }
  flush();
  return entries;
}

/** All Q+A categories observed across the corpus, in our preferred order. */
const CATEGORY_ORDER = [
  "LORE",
  "ARCHITECTURE",
  "WIRING",
  "INK-AUTHORING",
  "PICSSI-BALANCE",
  "AFFECT-VECTOR",
  "NAV-MAP",
  "PLAYER-SURFACE",
  "PD-SAFETY",
];

// ── Aggregation ────────────────────────────────────────────────

function aggregate(): {
  byCategory: Map<string, DocCategoryStats[]>;
  byDoc: Map<string, DocCategoryStats[]>;
  totalEntries: number;
  totalDocs: number;
} {
  const byCategory = new Map<string, DocCategoryStats[]>();
  const byDoc = new Map<string, DocCategoryStats[]>();
  let totalEntries = 0;
  let docsWithQA = 0;

  for (const doc of allDocs()) {
    if (doc.path.includes("*") || doc.path.endsWith("/")) continue;
    const full = path.join(REPO_ROOT, doc.path);
    if (!fs.existsSync(full)) continue;
    const raw = fs.readFileSync(full, "utf-8");
    const { body } = parseFrontmatter(raw);
    const entries = parseQABlock(body);
    if (entries.length === 0) continue;
    docsWithQA += 1;

    // Group entries by category for this doc
    const perCategory = new Map<string, QAEntry[]>();
    for (const e of entries) {
      if (!perCategory.has(e.category)) perCategory.set(e.category, []);
      perCategory.get(e.category)!.push(e);
      totalEntries += 1;
    }

    for (const [cat, list] of perCategory.entries()) {
      const high = list.filter((e) => e.confidence === "high").length;
      const nonHigh = list.length - high;
      const evRefs = [...new Set(list.flatMap((e) => e.evRefs))];
      const stat: DocCategoryStats = { docId: doc.id, category: cat, high, nonHigh, evRefs };

      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(stat);

      if (!byDoc.has(doc.id)) byDoc.set(doc.id, []);
      byDoc.get(doc.id)!.push(stat);
    }
  }

  return { byCategory, byDoc, totalEntries, totalDocs: docsWithQA };
}

// ── Renderer ───────────────────────────────────────────────────

function renderCategoryTable(stats: DocCategoryStats[]): string[] {
  const sorted = [...stats].sort((a, b) => {
    const aTotal = a.high + a.nonHigh;
    const bTotal = b.high + b.nonHigh;
    if (aTotal !== bTotal) return bTotal - aTotal;
    if (a.high !== b.high) return b.high - a.high;
    return a.docId.localeCompare(b.docId);
  });
  const lines: string[] = [];
  lines.push("| Rank | Doc | High | Non-high | EVs |");
  lines.push("|------|-----|------|----------|-----|");
  sorted.forEach((s, idx) => {
    const evList = s.evRefs.length > 0 ? s.evRefs.map((id) => `\`${id}\``).join(", ") : "—";
    lines.push(`| ${idx + 1} | [\`${s.docId}\`](../${docPathFor(s.docId)}) | ${s.high} | ${s.nonHigh} | ${evList} |`);
  });
  return lines;
}

const _docPathCache = new Map<string, string>();
function docPathFor(id: string): string {
  if (_docPathCache.size === 0) {
    for (const d of allDocs()) _docPathCache.set(d.id, d.path);
  }
  return _docPathCache.get(id) ?? `${id}.md`;
}

function render(): string {
  const { byCategory, byDoc, totalEntries, totalDocs } = aggregate();
  const today = new Date().toISOString().slice(0, 10);

  const orderedCategories = [...CATEGORY_ORDER];
  for (const cat of byCategory.keys()) {
    if (!orderedCategories.includes(cat)) orderedCategories.push(cat);
  }

  const lines: string[] = [];

  lines.push("---");
  lines.push("id: topic_routes");
  lines.push("title: Topic Routes — Q+A Category Manifest");
  lines.push("role: reference-generated");
  lines.push("canonical_for: [topic-routing, qa-category-index]");
  lines.push("visibility: internal");
  lines.push("status: active");
  lines.push(`last_updated: ${today}`);
  lines.push("cross_refs: [DOC_MAP.md, EDGE_VECTORS.md, hydration.md]");
  lines.push("generated_by: scripts/build-topic-routes.ts");
  lines.push("npm_script: topic-routes:build");
  lines.push("---");
  lines.push("");
  lines.push("<!-- AUTO-GENERATED by scripts/build-topic-routes.ts. Do not hand-edit. Run: npm run topic-routes:build -->");
  lines.push("");
  lines.push("# Topic Routes — Q+A Category Manifest");
  lines.push("");
  lines.push(`Generated ${today}. **Use this when a task asks a domain question.** The category-to-doc index below tells you the 2–4 docs that answer any topic, ranked by question count. Load them in order; stop when answered.`);
  lines.push("");
  lines.push(`**Coverage:** ${totalEntries} Q+A entries across ${totalDocs} docs · ${byCategory.size} categories. Source: each doc's \`## Questions answered by this document\` block.`);
  lines.push("");

  // ── Index table (one row per category) ──
  lines.push("## Index");
  lines.push("");
  lines.push("| Category | Total entries | Top doc | Anchor |");
  lines.push("|----------|---------------|---------|--------|");
  for (const cat of orderedCategories) {
    const stats = byCategory.get(cat) ?? [];
    if (stats.length === 0) continue;
    const total = stats.reduce((s, x) => s + x.high + x.nonHigh, 0);
    const top = [...stats].sort((a, b) => (b.high + b.nonHigh) - (a.high + a.nonHigh))[0];
    const anchor = `[\`${cat}\`](#${cat.toLowerCase()})`;
    lines.push(`| ${anchor} | ${total} | \`${top.docId}\` (${top.high + top.nonHigh}) | ${anchor} |`);
  }
  lines.push("");

  // ── Per-category routes ──
  for (const cat of orderedCategories) {
    const stats = byCategory.get(cat) ?? [];
    if (stats.length === 0) continue;
    const total = stats.reduce((s, x) => s + x.high + x.nonHigh, 0);
    const docCount = stats.length;
    lines.push(`## [${cat}]`);
    lines.push("");
    lines.push(`${total} entries across ${docCount} doc(s).`);
    lines.push("");
    lines.push(...renderCategoryTable(stats));
    lines.push("");
  }

  // ── Per-doc reverse index ──
  lines.push("## Per-doc category footprint");
  lines.push("");
  lines.push("Reverse index: each doc's contribution across categories. Useful when triaging which doc to update with a new Q+A entry.");
  lines.push("");
  const docIds = [...byDoc.keys()].sort();
  lines.push("| Doc | Total | Categories |");
  lines.push("|-----|-------|------------|");
  for (const id of docIds) {
    const stats = byDoc.get(id)!;
    const total = stats.reduce((s, x) => s + x.high + x.nonHigh, 0);
    const cats = [...stats].sort((a, b) => a.category.localeCompare(b.category))
      .map((s) => `\`[${s.category}]\` ${s.high + s.nonHigh}`)
      .join(", ");
    lines.push(`| \`${id}\` | ${total} | ${cats} |`);
  }
  lines.push("");

  return lines.join("\n") + "\n";
}

function main(): void {
  const out = render();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, out, "utf-8");
  const approxTokens = Math.round(out.length / 4);
  console.log(
    `[topic-routes:build] wrote ${path.relative(REPO_ROOT, OUT_PATH)} (${out.split("\n").length} lines · ~${approxTokens} tokens)`
  );
}

main();
