// ============================================================
// Edge-Vectors parser — shared between the doc-graph builder and
// the work-queue triager.
//
// Parses EDGE_VECTORS.md into typed `EdgeVectorEntry` objects:
//   - id           ("EV-pantheon-001")
//   - sourceDocId  ("pantheon")
//   - category     ("INK-AUTHORING")
//   - confidence   ("open" | "low" | "medium")
//   - question
//   - bestGuess
//   - affects[]    (other doc ids affected by this EV)
//   - resolutionPath
//
// Schema reference: EDGE_VECTORS.md `## How to add an entry` section.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { allDocs, type DocEntry } from "./docMap";
import { parseFrontmatter } from "./markdown";

const REPO_ROOT = process.cwd();
const EDGE_VECTORS_PATH = path.join(REPO_ROOT, "EDGE_VECTORS.md");

export type EdgeVectorConfidence = "open" | "low" | "medium";

export interface EdgeVectorEntry {
  id: string;
  sourceDocId: string;
  category: string;
  confidence: EdgeVectorConfidence;
  question: string;
  bestGuess: string;
  affects: string[];
  resolutionPath: string;
}

/** Resolve a markdown link target like "/library/pantheon" or "PANTHEON.md" -> doc id. */
function buildDocResolver(): Map<string, string> {
  const m = new Map<string, string>();
  for (const d of allDocs()) {
    if (d.path.includes("*")) continue;
    m.set(d.id, d.id);
    m.set(d.id.toLowerCase(), d.id);
    m.set(d.path, d.id);
    m.set(d.path.toLowerCase(), d.id);
    const base = path.basename(d.path);
    m.set(base, d.id);
    m.set(base.toLowerCase(), d.id);
  }
  return m;
}

function resolveLink(link: string, resolver: Map<string, string>): string {
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

/**
 * Parse EDGE_VECTORS.md into typed entries. Returns [] if the file is
 * absent (e.g., during fresh-clone bootstrap).
 */
export function loadEdgeVectors(): EdgeVectorEntry[] {
  if (!fs.existsSync(EDGE_VECTORS_PATH)) return [];
  const raw = fs.readFileSync(EDGE_VECTORS_PATH, "utf-8");
  const { body } = parseFrontmatter(raw);
  const resolver = buildDocResolver();

  // Split on "#### EV-" anchors. First chunk is preamble.
  const chunks = body.split(/^####\s+(EV-[a-z0-9_-]+)\s+/im);
  const entries: EdgeVectorEntry[] = [];

  for (let i = 1; i < chunks.length; i += 2) {
    const id = chunks[i].trim();
    const evBody = chunks[i + 1] ?? "";

    const category = evBody.match(/`\[([A-Z][A-Z-]*)\]`/)?.[1] ?? "UNKNOWN";

    const sourceLine = evBody.match(/-\s*\*\*Source:\*\*\s*(.+)$/m)?.[1] ?? "";
    const sourceLink = sourceLine.match(/\(([^)]+)\)/)?.[1] ?? sourceLine.trim();
    const sourceDocId = resolveLink(sourceLink, resolver);

    const question = evBody.match(/-\s*\*\*Question:\*\*\s*(.+)$/m)?.[1]?.trim() ?? "";
    const bestGuess = evBody.match(/-\s*\*\*Best guess:\*\*\s*(.+)$/m)?.[1]?.trim() ?? "";
    const confidenceRaw = evBody
      .match(/-\s*\*\*Confidence:\*\*\s*(\w+)/)?.[1]
      ?.trim()
      .toLowerCase();
    const confidence = (
      confidenceRaw === "low" || confidenceRaw === "medium" ? confidenceRaw : "open"
    ) as EdgeVectorConfidence;

    const affectsLine = evBody.match(/-\s*\*\*Affects:\*\*\s*(.+)$/m)?.[1] ?? "";
    const linkTargets = [...affectsLine.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]);
    const affects = [
      ...new Set(
        linkTargets
          .map((t) => resolveLink(t, resolver))
          .filter((id) => Boolean(id) && id !== sourceDocId)
      ),
    ];

    const resolutionPath =
      evBody.match(/-\s*\*\*Resolution path:\*\*\s*([\s\S]+?)(?=\n\n|$)/m)?.[1]?.trim() ?? "";

    entries.push({
      id,
      sourceDocId,
      category,
      confidence,
      question,
      bestGuess,
      affects,
      resolutionPath,
    });
  }

  return entries;
}

/**
 * Locate the markdown body block that defines a given EV. Used by the
 * interviewer to delete an entry once it has been answered.
 *
 * Returns the [startIdx, endIdx) range within the file body, or null
 * if the EV is not found. The range covers the H4 header + body lines
 * up to (but not including) the next `^### ` or `^---` boundary.
 */
export function locateEvBlock(
  fileBody: string,
  evId: string
): { start: number; end: number } | null {
  const headerRe = new RegExp(`^####\\s+${evId}\\b.*$`, "m");
  const headerMatch = fileBody.match(headerRe);
  if (!headerMatch || headerMatch.index === undefined) return null;
  const start = headerMatch.index;
  // Find the end: the next H3/H4 header, or the next `## ` (resolved/preamble), or `---` divider.
  const tail = fileBody.slice(start + headerMatch[0].length);
  const enders = [
    tail.search(/\n####\s+EV-/),
    tail.search(/\n###\s+\[/),
    tail.search(/\n##\s+\w/),
    tail.search(/\n---\s*\n/),
  ].filter((idx) => idx >= 0);
  if (enders.length === 0) {
    return { start, end: fileBody.length };
  }
  const tailEnd = Math.min(...enders);
  return { start, end: start + headerMatch[0].length + tailEnd };
}
