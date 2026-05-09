// ============================================================
// Sprint G1 -- Doc Graph generator
//
// Walks DOC_MAP.md + per-doc Q+A blocks + EDGE_VECTORS.md and emits:
//   - docs/doc-graph.json (machine-readable)
//   - docs/doc-graph.md   (human/Claude-readable adjacency list)
//
// Run:
//   npm run graph:build
//   (or: npx tsx scripts/build-doc-graph.ts)
//
// Deterministic: sorted keys, stable iteration. Read-only against the
// canon. No DB, no network. Drift becomes structurally impossible
// because the graph regenerates from the canonical sources.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import {
  allDocs,
  type DocEntry,
} from "../lib/library/docMap";
import { parseFrontmatter } from "../lib/library/markdown";

const REPO_ROOT = process.cwd();
const OUT_JSON = path.join(REPO_ROOT, "docs", "doc-graph.json");
const OUT_MD = path.join(REPO_ROOT, "docs", "doc-graph.md");

// ── Types ──────────────────────────────────────────────────────

type EdgeType =
  | "cross_ref"
  | "relates_to"
  | "has_open_question"
  | "affects"
  | "derives_from";

interface DocNode {
  type: "doc";
  id: string;
  path: string;
  title: string;
  role: string;
  visibility: string;
  status: string;
  last_updated: string;
  questions_total?: number;
  questions_answered?: number;
  questions_open?: number;
}

interface EvNode {
  type: "edge_vector";
  id: string;
  source_doc: string;
  category: string;
  confidence: string;
  question: string;
  best_guess: string;
}

type Node = DocNode | EvNode;

interface Edge {
  from: string;
  to: string;
  type: EdgeType;
}

interface GraphPayload {
  generated_at: string;
  stats: {
    doc_count: number;
    ev_count: number;
    edge_count: number;
    creator_visible: number;
    internal: number;
  };
  nodes: Record<string, Node>;
  edges: Edge[];
}

// ── Helpers ────────────────────────────────────────────────────

/**
 * Build a lookup table from "PANTHEON.md" / "lore/pantheon/PANTHEON.md" /
 * "pantheon" -> doc id. Used to resolve "relates to:" line tokens to
 * graph nodes.
 */
function buildResolver(docs: DocEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const doc of docs) {
    if (doc.path.includes("*")) continue; // skip corpus paths
    map.set(doc.path, doc.id);
    map.set(doc.path.toLowerCase(), doc.id);
    // basename ("PANTHEON.md", "GAME_DESIGN.md")
    const base = path.basename(doc.path);
    map.set(base, doc.id);
    map.set(base.toLowerCase(), doc.id);
    // id itself
    map.set(doc.id, doc.id);
  }
  return map;
}

/**
 * Strip a "relates to:" token of any "§...", "(parenthetical)" annotation,
 * leading/trailing whitespace. Returns the cleaned reference string.
 */
function cleanRefToken(token: string): string {
  return token
    .replace(/\s*\([^)]*\)\s*/g, "")
    .replace(/\s*§[^,]*$/g, "")
    .replace(/\s*§\S+/g, "")
    .replace(/^[`*]+|[`*]+$/g, "")
    .trim();
}

/**
 * Parse the lines of a doc's Q+A markdown body. For every line matching
 * "↔ relates to: A, B, C", emit one outbound edge per resolved target.
 * Tokens that don't resolve to a known doc id are dropped silently for
 * v1 (they describe code paths or external memory files; future
 * iterations can model those as separate node types).
 */
function extractRelatesToEdges(
  body: string,
  fromId: string,
  resolver: Map<string, string>
): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^[↔↪→]\s*relates to:\s*(.+)$/i);
    if (!m) continue;
    const tokens = m[1].split(",").map(cleanRefToken).filter((t) => t.length > 0);
    for (const tok of tokens) {
      const id = resolver.get(tok) ?? resolver.get(tok.toLowerCase());
      if (!id) continue;
      if (id === fromId) continue; // skip self-loops
      const key = `${fromId}->${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: `doc:${fromId}`, to: `doc:${id}`, type: "relates_to" });
    }
  }
  return edges;
}

/**
 * Parse EDGE_VECTORS.md for the structured "### EV-<id>" entries.
 * Returns one EvNode per entry plus the implied edges:
 *   doc:<source> -> ev:<id>      (has_open_question)
 *   ev:<id>      -> doc:<target> (affects, one per Affects: link)
 */
function parseEdgeVectors(
  resolver: Map<string, string>
): { nodes: EvNode[]; edges: Edge[] } {
  const file = path.join(REPO_ROOT, "EDGE_VECTORS.md");
  if (!fs.existsSync(file)) return { nodes: [], edges: [] };
  const raw = fs.readFileSync(file, "utf-8");
  const { body } = parseFrontmatter(raw);

  const nodes: EvNode[] = [];
  const edges: Edge[] = [];

  // Split on "#### EV-" anchors (per the EDGE_VECTORS.md schema; entries
  // are H4 nested under H3 source-doc groupings). First chunk is preamble.
  const chunks = body.split(/^####\s+(EV-[a-z0-9_-]+)\s+/im);
  // chunks: [preamble, id1, body1, id2, body2, ...]
  for (let i = 1; i < chunks.length; i += 2) {
    const evId = chunks[i].trim();
    const evBody = chunks[i + 1] ?? "";

    const category = evBody.match(/`\[([A-Z-]+)\]`/)?.[1] ?? "UNKNOWN";

    // Source: extract first markdown link target inside the Source: line
    const sourceLine = evBody.match(/-\s*\*\*Source:\*\*\s*(.+)$/m)?.[1] ?? "";
    const sourceLink = sourceLine.match(/\(([^)]+)\)/)?.[1] ?? sourceLine.trim();
    const sourceDocId = resolveSourceLink(sourceLink, resolver);

    const question = evBody.match(/-\s*\*\*Question:\*\*\s*(.+)$/m)?.[1]?.trim() ?? "";
    const bestGuess = evBody.match(/-\s*\*\*Best guess:\*\*\s*(.+)$/m)?.[1]?.trim() ?? "";
    const confidence = evBody.match(/-\s*\*\*Confidence:\*\*\s*(\w+)/)?.[1]?.trim() ?? "open";

    nodes.push({
      type: "edge_vector",
      id: evId,
      source_doc: sourceDocId,
      category,
      confidence,
      question,
      best_guess: bestGuess,
    });

    // doc -> ev edge
    if (sourceDocId) {
      edges.push({
        from: `doc:${sourceDocId}`,
        to: `ev:${evId}`,
        type: "has_open_question",
      });
    }

    // Affects line -- extract every markdown link target on that line
    const affectsLine = evBody.match(/-\s*\*\*Affects:\*\*\s*(.+)$/m)?.[1] ?? "";
    const linkTargets = [...affectsLine.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]);
    const seen = new Set<string>();
    for (const target of linkTargets) {
      const id = resolveSourceLink(target, resolver);
      if (!id) continue;
      const key = `${evId}->${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: `ev:${evId}`, to: `doc:${id}`, type: "affects" });
    }
  }

  return { nodes, edges };
}

/**
 * "/library/pantheon" or "lore/pantheon/PANTHEON.md" or "pantheon" -> "pantheon"
 */
function resolveSourceLink(link: string, resolver: Map<string, string>): string {
  const cleaned = link
    .replace(/^\/library\//, "")
    .replace(/#.*$/, "")
    .trim();
  return (
    resolver.get(cleaned) ??
    resolver.get(cleaned.toLowerCase()) ??
    resolver.get(path.basename(cleaned)) ??
    ""
  );
}

// ── Main ───────────────────────────────────────────────────────

function main() {
  const docs = allDocs();
  const resolver = buildResolver(docs);

  const nodes: Record<string, Node> = {};
  const edges: Edge[] = [];

  // 1. Doc nodes + cross_ref edges from DOC_MAP
  for (const doc of docs) {
    const isCorpus = doc.path.includes("*") || doc.path.endsWith("/");

    // Per-doc frontmatter (counts) -- only if the file exists and has Q+A
    let frontmatterCounts: {
      qt?: number;
      qa?: number;
      qo?: number;
    } = {};
    let body = "";
    if (!isCorpus) {
      const full = path.join(REPO_ROOT, doc.path);
      if (fs.existsSync(full)) {
        const raw = fs.readFileSync(full, "utf-8");
        const parsed = parseFrontmatter(raw);
        body = parsed.body;
        const fm = parsed.frontmatter as Record<string, unknown> | null;
        if (fm) {
          frontmatterCounts = {
            qt: typeof fm.questions_total === "number" ? fm.questions_total : undefined,
            qa: typeof fm.questions_answered === "number" ? fm.questions_answered : undefined,
            qo: typeof fm.questions_open === "number" ? fm.questions_open : undefined,
          };
        }
      }
    }

    nodes[`doc:${doc.id}`] = {
      type: "doc",
      id: doc.id,
      path: doc.path,
      title: doc.title,
      role: doc.role,
      visibility: doc.visibility,
      status: String(doc.status),
      last_updated: doc.last_updated,
      questions_total: frontmatterCounts.qt,
      questions_answered: frontmatterCounts.qa,
      questions_open: frontmatterCounts.qo,
    };

    // cross_ref edges from DOC_MAP
    if (doc.cross_refs) {
      for (const ref of doc.cross_refs) {
        const cleaned = cleanRefToken(ref);
        const targetId =
          resolver.get(cleaned) ?? resolver.get(cleaned.toLowerCase());
        if (targetId && targetId !== doc.id) {
          edges.push({
            from: `doc:${doc.id}`,
            to: `doc:${targetId}`,
            type: "cross_ref",
          });
        }
      }
    }

    // derives_from edges (generated_by)
    if (doc.generated_by) {
      // The "from" of derives_from is the source code, not a doc node.
      // For v1, we model this as a self-annotation only -- skip the edge.
    }

    // relates_to edges from per-doc Q+A body
    if (!isCorpus && body) {
      edges.push(...extractRelatesToEdges(body, doc.id, resolver));
    }
  }

  // 2. EV nodes + has_open_question + affects edges
  const { nodes: evNodes, edges: evEdges } = parseEdgeVectors(resolver);
  for (const ev of evNodes) {
    nodes[`ev:${ev.id}`] = ev;
  }
  edges.push(...evEdges);

  // 3. Deduplicate edges (a cross_ref + a relates_to between the same pair
  //    are kept as TWO edges, since they're distinct edge types. But two
  //    relates_to between the same pair collapse to one.)
  const dedupKey = (e: Edge) => `${e.from}|${e.to}|${e.type}`;
  const uniqEdges = Array.from(
    new Map(edges.map((e) => [dedupKey(e), e])).values()
  );

  // 4. Sort for determinism
  uniqEdges.sort((a, b) => {
    if (a.from !== b.from) return a.from.localeCompare(b.from);
    if (a.to !== b.to) return a.to.localeCompare(b.to);
    return a.type.localeCompare(b.type);
  });
  const sortedNodes: Record<string, Node> = {};
  for (const k of Object.keys(nodes).sort()) sortedNodes[k] = nodes[k];

  // 5. Stats
  const docNodeIds = Object.keys(sortedNodes).filter((k) => k.startsWith("doc:"));
  const evNodeIds = Object.keys(sortedNodes).filter((k) => k.startsWith("ev:"));
  const creatorVisible = docNodeIds.filter(
    (k) => (sortedNodes[k] as DocNode).visibility === "creator"
  ).length;
  const internal = docNodeIds.filter(
    (k) => (sortedNodes[k] as DocNode).visibility === "internal"
  ).length;

  const payload: GraphPayload = {
    generated_at: new Date().toISOString().slice(0, 10), // YYYY-MM-DD only -- avoids spurious diffs
    stats: {
      doc_count: docNodeIds.length,
      ev_count: evNodeIds.length,
      edge_count: uniqEdges.length,
      creator_visible: creatorVisible,
      internal,
    },
    nodes: sortedNodes,
    edges: uniqEdges,
  };

  // 6. Write JSON
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2) + "\n", "utf-8");

  // 7. Write markdown
  fs.writeFileSync(OUT_MD, renderMarkdown(payload, sortedNodes, uniqEdges), "utf-8");

  console.log(
    `[graph:build] ${payload.stats.doc_count} docs · ${payload.stats.ev_count} EVs · ${payload.stats.edge_count} edges -> ${path.relative(REPO_ROOT, OUT_JSON)}, ${path.relative(REPO_ROOT, OUT_MD)}`
  );
}

// ── Markdown renderer ──────────────────────────────────────────

function renderMarkdown(
  payload: GraphPayload,
  nodes: Record<string, Node>,
  edges: Edge[]
): string {
  // In-degree per doc (for "most-connected" list)
  const inDegree = new Map<string, number>();
  for (const e of edges) {
    if (!e.to.startsWith("doc:")) continue;
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }
  const topConnected = [...inDegree.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8);

  const docNodes = Object.values(nodes).filter(
    (n): n is DocNode => n.type === "doc"
  );
  const evNodes = Object.values(nodes).filter(
    (n): n is EvNode => n.type === "edge_vector"
  );

  // Group docs by role for the adjacency listing
  const docsByRole = new Map<string, DocNode[]>();
  for (const d of docNodes) {
    if (!docsByRole.has(d.role)) docsByRole.set(d.role, []);
    docsByRole.get(d.role)!.push(d);
  }

  // Outgoing edges per doc (for the adjacency listing)
  const outgoing = new Map<string, Edge[]>();
  for (const e of edges) {
    if (!e.from.startsWith("doc:")) continue;
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    outgoing.get(e.from)!.push(e);
  }

  const lines: string[] = [];
  lines.push(
    `<!-- AUTO-GENERATED by scripts/build-doc-graph.ts. Do not hand-edit. Run: npm run graph:build -->`
  );
  lines.push("");
  lines.push(`# Doc Graph`);
  lines.push("");
  lines.push(`Generated ${payload.generated_at}.`);
  lines.push("");
  lines.push(
    `Compact adjacency view of every Living Eamon canon doc, every Edge Vector, and the relationships between them. **This file is loaded into Claude hydration as item 0.5 of the rehydration stack** so future sessions get the topology in one read instead of grep-and-load 5–30K tokens per cross-doc question.`
  );
  lines.push("");
  lines.push(`## Stats`);
  lines.push("");
  lines.push(
    `- ${payload.stats.doc_count} docs · ${payload.stats.ev_count} open Edge Vectors · ${payload.stats.edge_count} edges`
  );
  lines.push(
    `- ${payload.stats.creator_visible} creator-visible · ${payload.stats.internal} internal`
  );
  lines.push("");

  // Most-connected
  lines.push(`## Most-connected nodes (by in-degree)`);
  lines.push("");
  for (const [k, n] of topConnected) {
    const node = nodes[k] as DocNode;
    if (!node) continue;
    lines.push(`- **${node.id}** (${n} incoming) — ${node.title}`);
  }
  lines.push("");

  // Adjacency, grouped by role
  lines.push(`## Adjacency`);
  lines.push("");
  for (const role of [...docsByRole.keys()].sort()) {
    lines.push(`### ${role}`);
    lines.push("");
    const roleDocs = docsByRole.get(role)!.sort((a, b) => a.id.localeCompare(b.id));
    for (const d of roleDocs) {
      const out = outgoing.get(`doc:${d.id}`) ?? [];
      const groups = new Map<EdgeType, string[]>();
      for (const e of out) {
        const targetNode = nodes[e.to];
        const targetLabel = targetNode
          ? targetNode.type === "doc"
            ? (targetNode as DocNode).id
            : (targetNode as EvNode).id
          : e.to;
        if (!groups.has(e.type)) groups.set(e.type, []);
        groups.get(e.type)!.push(targetLabel);
      }
      const flagsParts: string[] = [];
      flagsParts.push(`**${d.id}**`);
      if (d.questions_open && d.questions_open > 0)
        flagsParts.push(`Q:${d.questions_total}(open=${d.questions_open})`);
      flagsParts.push(`[${d.status}]`);
      lines.push(`- ${flagsParts.join(" ")} — ${d.title}`);
      for (const t of [...groups.keys()].sort()) {
        const labels = [...new Set(groups.get(t)!)].sort();
        if (labels.length === 0) continue;
        lines.push(`  - **${t}** → ${labels.join(", ")}`);
      }
    }
    lines.push("");
  }

  // Open questions
  lines.push(`## Open Edge Vectors (${evNodes.length})`);
  lines.push("");
  for (const ev of evNodes.sort((a, b) => a.id.localeCompare(b.id))) {
    const affected = edges
      .filter((e) => e.from === `ev:${ev.id}` && e.type === "affects")
      .map((e) => (nodes[e.to] as DocNode | undefined)?.id ?? e.to)
      .sort();
    lines.push(
      `- **${ev.id}** \`[${ev.category}, ${ev.confidence}]\` ← ${ev.source_doc} → affects: ${affected.length > 0 ? affected.join(", ") : "(none mapped)"}`
    );
    if (ev.question) {
      const truncated = ev.question.length > 120 ? ev.question.slice(0, 117) + "..." : ev.question;
      lines.push(`  - Q: ${truncated}`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

main();
