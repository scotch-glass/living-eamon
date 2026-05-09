// ============================================================
// Layer 1 — Hydration Primer generator.
//
// Emits docs/hydration.md, a single-page primer that replaces items
// 0-3 of the old rehydration stack. Pulls together:
//   - Most-connected docs (gravity wells) with one-paragraph abstracts
//     drawn from canonical_for + Q+A counts
//   - Topology stats (doc/EV/edge counts)
//   - Critical-path summary from launch-readiness
//   - Recent activity (commits since HYDRATE_NEXT_SESSION last touch)
//   - High-impact open Edge Vectors (those affecting 3+ launch items)
//
// Read-only. Pure deterministic generation from canonical sources.
// Run:
//   npm run hydration:build
//   (or: npx tsx scripts/build-hydration.ts)
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { allDocs, type DocEntry } from "../lib/library/docMap";
import { parseFrontmatter } from "../lib/library/markdown";

const REPO_ROOT = process.cwd();
const OUT_PATH = path.join(REPO_ROOT, "docs", "hydration.md");
const GRAPH_JSON_PATH = path.join(REPO_ROOT, "docs", "doc-graph.json");
const READINESS_PATH = path.join(REPO_ROOT, "docs", "launch-readiness.md");
const HYDRATE_PATH = path.join(REPO_ROOT, "HYDRATE_NEXT_SESSION.md");

const TOP_GRAVITY_WELLS = 8;

// ── Helpers ────────────────────────────────────────────────────

function readJsonIfExists<T>(p: string): T | null {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
  } catch {
    return null;
  }
}

interface GraphStats {
  doc_count: number;
  ev_count: number;
  edge_count: number;
  creator_visible: number;
  internal: number;
}

interface GraphNode {
  type: "doc" | "edge_vector";
  id: string;
  title?: string;
  source_doc?: string;
  category?: string;
  question?: string;
  confidence?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

interface GraphPayload {
  generated_at: string;
  stats: GraphStats;
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
}

/** Last-mtime of HYDRATE_NEXT_SESSION.md as the "session boundary" anchor. */
function lastSessionAnchor(): string | null {
  if (!fs.existsSync(HYDRATE_PATH)) return null;
  try {
    // Use the last commit that touched HYDRATE_NEXT_SESSION.md as the boundary.
    const output = execSync(
      `git log -1 --format=%aI -- HYDRATE_NEXT_SESSION.md`,
      { cwd: REPO_ROOT, encoding: "utf-8" }
    ).trim();
    return output || null;
  } catch {
    return null;
  }
}

/** Commits between the session anchor and now. */
function recentCommits(anchor: string | null): { hash: string; subject: string }[] {
  try {
    const since = anchor ? `--since=${anchor}` : "--max-count=15";
    const output = execSync(
      `git log ${since} --format=%h%x09%s --no-merges`,
      { cwd: REPO_ROOT, encoding: "utf-8" }
    ).trim();
    if (!output) return [];
    return output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, ...rest] = line.split("\t");
        return { hash, subject: rest.join("\t") };
      });
  } catch {
    return [];
  }
}

/** Per-doc in-degree from the graph payload. */
function computeInDegree(graph: GraphPayload): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of graph.edges) {
    if (!e.to.startsWith("doc:")) continue;
    m.set(e.to, (m.get(e.to) ?? 0) + 1);
  }
  return m;
}

/** Read the launch-readiness headline + critical-path block. */
function extractCriticalPath(): { priority: number | null; id: string | null; downstreamCount: number } {
  if (!fs.existsSync(READINESS_PATH)) {
    return { priority: null, id: null, downstreamCount: 0 };
  }
  const raw = fs.readFileSync(READINESS_PATH, "utf-8");
  // Match e.g. "**Critical path:** [`karma_sprint_chain`] — priority **136**"
  const m = raw.match(
    /\*\*Critical path:\*\*\s*\[`([a-z_]+)`\][^—]*—\s*priority\s*\*\*(\d+)\*\*\s*—\s*(\d+)\s*downstream/
  );
  if (!m) return { priority: null, id: null, downstreamCount: 0 };
  return { id: m[1], priority: parseInt(m[2], 10), downstreamCount: parseInt(m[3], 10) };
}

/** Find EVs that affect the most downstream items (high-impact). */
function highImpactEvs(graph: GraphPayload, top = 5): { id: string; affects: number; question: string; category: string }[] {
  const evAffectCounts = new Map<string, number>();
  for (const e of graph.edges) {
    if (e.type !== "affects") continue;
    if (!e.from.startsWith("ev:")) continue;
    const evId = e.from.slice(3);
    evAffectCounts.set(evId, (evAffectCounts.get(evId) ?? 0) + 1);
  }
  return [...evAffectCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([id, affects]) => {
      const node = graph.nodes[`ev:${id}`];
      return {
        id,
        affects,
        question: (node?.question ?? "").slice(0, 110),
        category: node?.category ?? "UNKNOWN",
      };
    });
}

/** Most-incoming-edges docs are gravity wells. */
function gravityWells(
  graph: GraphPayload,
  inDegree: Map<string, number>,
  docs: DocEntry[]
): { doc: DocEntry; incoming: number; abstract: string }[] {
  const docById = new Map(docs.map((d) => [d.id, d]));
  return [...inDegree.entries()]
    .map(([key, count]) => ({ id: key.replace(/^doc:/, ""), count }))
    .map(({ id, count }) => ({ id, count, doc: docById.get(id) }))
    .filter((x): x is { id: string; count: number; doc: DocEntry } => Boolean(x.doc))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, TOP_GRAVITY_WELLS)
    .map(({ doc, count }) => ({
      doc,
      incoming: count,
      abstract: buildAbstract(doc),
    }));
}

/** One-line abstract from canonical_for + status + Q+A counts. */
function buildAbstract(doc: DocEntry): string {
  const ownership = (doc.canonical_for || []).slice(0, 4).join(", ") || "(no canonical_for)";
  const qa =
    typeof doc.questions_total === "number" && doc.questions_total > 0
      ? `Q:${doc.questions_total}/${doc.questions_open ?? 0}open`
      : "no Q+A";
  return `**Owns:** ${ownership} · **Status:** ${doc.status} · **${qa}**`;
}

/** Extract per-doc Q+A counts from frontmatter (fall back to docMap). */
function readDocFrontmatter(doc: DocEntry): {
  qt?: number;
  qa?: number;
  qo?: number;
} {
  if (doc.path.includes("*") || doc.path.endsWith("/")) return {};
  const full = path.join(REPO_ROOT, doc.path);
  if (!fs.existsSync(full)) return {};
  try {
    const raw = fs.readFileSync(full, "utf-8");
    const { frontmatter } = parseFrontmatter(raw);
    if (!frontmatter) return {};
    const fm = frontmatter as Record<string, unknown>;
    return {
      qt: typeof fm.questions_total === "number" ? fm.questions_total : undefined,
      qa: typeof fm.questions_answered === "number" ? fm.questions_answered : undefined,
      qo: typeof fm.questions_open === "number" ? fm.questions_open : undefined,
    };
  } catch {
    return {};
  }
}

// ── Renderer ───────────────────────────────────────────────────

function render(): string {
  const docs = allDocs();
  // Hydrate Q+A counts from each file's frontmatter (DOC_MAP doesn't track them).
  for (const d of docs) {
    const fm = readDocFrontmatter(d);
    if (fm.qt !== undefined) d.questions_total = fm.qt;
    if (fm.qa !== undefined) d.questions_answered = fm.qa;
    if (fm.qo !== undefined) d.questions_open = fm.qo;
  }

  const graph = readJsonIfExists<GraphPayload>(GRAPH_JSON_PATH);
  const inDegree = graph ? computeInDegree(graph) : new Map<string, number>();
  const wells = graph ? gravityWells(graph, inDegree, docs) : [];
  const critical = extractCriticalPath();
  const evs = graph ? highImpactEvs(graph, 5) : [];
  const anchor = lastSessionAnchor();
  const commits = recentCommits(anchor);

  const today = new Date().toISOString().slice(0, 10);

  // Aggregate Q+A totals across the corpus.
  let totalQuestions = 0;
  let totalAnswered = 0;
  let totalOpen = 0;
  let docsWithQA = 0;
  for (const d of docs) {
    if (typeof d.questions_total === "number" && d.questions_total > 0) {
      docsWithQA += 1;
      totalQuestions += d.questions_total;
      totalAnswered += d.questions_answered ?? 0;
      totalOpen += d.questions_open ?? 0;
    }
  }

  const lines: string[] = [];

  lines.push("---");
  lines.push("id: hydration");
  lines.push("title: Living Eamon — Hydration Primer");
  lines.push("role: reference-generated");
  lines.push("canonical_for: [hydration-stack, gravity-wells, critical-path-summary, session-diff]");
  lines.push("visibility: internal");
  lines.push("status: active");
  lines.push(`last_updated: ${today}`);
  lines.push("cross_refs: [DOC_MAP.md, EDGE_VECTORS.md, LAUNCH_CRITERIA.md, HYDRATE_NEXT_SESSION.md]");
  lines.push("generated_by: scripts/build-hydration.ts");
  lines.push("npm_script: hydration:build");
  lines.push("---");
  lines.push("");
  lines.push("<!-- AUTO-GENERATED by scripts/build-hydration.ts. Do not hand-edit. Run: npm run hydration:build -->");
  lines.push("");
  lines.push("# Hydration Primer");
  lines.push("");
  lines.push(`Generated ${today}. **Read this first; it is the new top of the rehydration stack.**`);
  lines.push("");
  lines.push("This page fuses topology + open questions + recent activity into one read so you can skip the per-doc grep cycle. Load **this**, then `docs/launch-readiness.md`, then `MEMORY.md`. Routes for specific topics are in [`docs/topic-routes.md`](topic-routes.md). Visual: [`docs/doc-graph.svg`](doc-graph.svg) (regen via `npx -y -p @mermaid-js/mermaid-cli@latest mmdc -i docs/doc-graph.mmd -o docs/doc-graph.svg`).");
  lines.push("");

  // ── Stats ──
  lines.push("## At a glance");
  lines.push("");
  if (graph) {
    lines.push(`- **Topology:** ${graph.stats.doc_count} docs · ${graph.stats.ev_count} open Edge Vectors · ${graph.stats.edge_count} edges`);
    lines.push(`- **Visibility:** ${graph.stats.creator_visible} creator-visible · ${graph.stats.internal} internal-only`);
  } else {
    lines.push(`- **Topology:** (graph payload missing — run \`npm run graph:build\`)`);
  }
  lines.push(`- **Q+A coverage:** ${totalQuestions} questions across ${docsWithQA} docs · ${totalAnswered} high-confidence · ${totalOpen} open`);
  if (critical.id && critical.priority !== null) {
    lines.push(`- **Critical path:** \`${critical.id}\` — priority **${critical.priority}** — blocks ${critical.downstreamCount} downstream sprint(s)`);
  }
  lines.push("");

  // ── Gravity wells ──
  lines.push("## Gravity wells (most-incoming docs)");
  lines.push("");
  lines.push("These eight docs sit at the topological center. When a question crosses domains, one of these almost certainly owns it.");
  lines.push("");
  if (wells.length === 0) {
    lines.push("_(graph payload missing — run `npm run graph:build`)_");
  } else {
    for (const w of wells) {
      lines.push(`### ${w.doc.id} — ${w.doc.title}  \`(${w.incoming} incoming)\``);
      lines.push("");
      lines.push(w.abstract);
      lines.push("");
      lines.push(`Path: [\`${w.doc.path}\`](${path.relative(path.dirname(OUT_PATH), path.join(REPO_ROOT, w.doc.path))})`);
      lines.push("");
    }
  }

  // ── Critical path detail ──
  if (critical.id) {
    lines.push("## Critical path");
    lines.push("");
    lines.push(`The single highest-priority blocker per \`docs/launch-readiness.md\` is **\`${critical.id}\`** (priority ${critical.priority}). It blocks **${critical.downstreamCount}** downstream sprint(s). Consult \`docs/launch-readiness.md\` Tier-0 entry for what good looks like, what's blocking it, and what it blocks.`);
    lines.push("");
  }

  // ── High-impact open EVs ──
  if (evs.length > 0) {
    lines.push("## High-impact open questions");
    lines.push("");
    lines.push("Edge Vectors that, when resolved, unblock the most downstream items. See [`EDGE_VECTORS.md`](../EDGE_VECTORS.md) for full entries.");
    lines.push("");
    lines.push(`| EV ID | Category | Affects | Question |`);
    lines.push(`|---|---|---|---|`);
    for (const ev of evs) {
      const q = ev.question.replace(/\|/g, "\\|");
      lines.push(`| \`${ev.id}\` | ${ev.category} | ${ev.affects} doc(s) | ${q}${ev.question.length >= 110 ? "…" : ""} |`);
    }
    lines.push("");
  }

  // ── Recent activity ──
  lines.push("## Recent activity");
  lines.push("");
  if (anchor) {
    lines.push(`Commits since \`HYDRATE_NEXT_SESSION.md\` last touched (${anchor}):`);
  } else {
    lines.push(`Last 15 commits (no session anchor available):`);
  }
  lines.push("");
  if (commits.length === 0) {
    lines.push(`_(no commits — working tree may be ahead of session log)_`);
  } else {
    for (const c of commits.slice(0, 20)) {
      const subject = c.subject.replace(/\|/g, "\\|");
      lines.push(`- \`${c.hash}\` — ${subject}`);
    }
  }
  lines.push("");

  // ── Reading guide ──
  lines.push("## Reading guide");
  lines.push("");
  lines.push("**The new minimal stack (replaces the old 7-step ladder for typical sessions):**");
  lines.push("");
  lines.push("1. **This file** (`docs/hydration.md`) — topology + recent activity + critical path.");
  lines.push("2. **`docs/launch-readiness.md`** — prioritized blocker list.");
  lines.push("3. **`MEMORY.md`** — auto-loaded by the harness; pay attention to feedback memories.");
  lines.push("");
  lines.push("**Then for any specific task:**");
  lines.push("");
  lines.push("- Look up the topic in [`docs/topic-routes.md`](topic-routes.md) → load the 2–4 docs ranked there.");
  lines.push("- For deep dives, the Q+A block at the top of each design-canon doc answers most questions in ~600 tokens.");
  lines.push("- For the visual topology, open `docs/doc-graph.svg`.");
  lines.push("");
  lines.push("**Old hydration stack** (`CLAUDE.md` 5–8): keep available for first-time sessions or full audit, but skip for routine work.");
  lines.push("");

  return lines.join("\n");
}

function main(): void {
  const out = render();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, out, "utf-8");
  // Approximate the reading cost so the user can verify the savings.
  const approxTokens = Math.round(out.length / 4);
  console.log(
    `[hydration:build] wrote ${path.relative(REPO_ROOT, OUT_PATH)} (${out.split("\n").length} lines · ~${approxTokens} tokens)`
  );
}

main();
