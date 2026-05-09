// ============================================================
// Layer 3 — Doc-system drift validator.
//
// Fails CI / prebuild on any of:
//   - Q+A frontmatter `questions_total !== questions_answered + questions_open`
//   - `edge_vector_ids` array length doesn't match `questions_open`
//   - EV id in any doc's `edge_vector_ids` not present in EDGE_VECTORS.md
//   - EV in EDGE_VECTORS.md not referenced by its source doc's frontmatter
//   - DOC_MAP entry points at a non-existent path (excluding corpus *)
//   - Q+A `### [CATEGORY]` count in body doesn't match frontmatter total
//
// Exit code: 0 on clean, 1 on any failure.
//
// Run:
//   npm run docs:validate
//   (or: npx tsx scripts/validate-docs.ts)
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { allDocs, type DocEntry } from "../lib/library/docMap";
import { parseFrontmatter } from "../lib/library/markdown";

const REPO_ROOT = process.cwd();
const EDGE_VECTORS_PATH = path.join(REPO_ROOT, "EDGE_VECTORS.md");

interface Issue {
  severity: "error" | "warning";
  source: string;
  message: string;
}

const issues: Issue[] = [];

function report(severity: "error" | "warning", source: string, message: string): void {
  issues.push({ severity, source, message });
}

// ── Helpers ────────────────────────────────────────────────────

function existsFile(rel: string): boolean {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

const QA_BLOCK_START = /^##\s+Questions answered by this document/m;
const QA_BLOCK_END = /^---\s*$/m;
const CATEGORY_HEADER = /^###\s+\[([A-Z][A-Z-]*)\]\s*$/gm;

interface DocFrontmatter {
  qt?: number;
  qa?: number;
  qo?: number;
  evIds?: string[];
}

function readFrontmatter(doc: DocEntry): { fm: DocFrontmatter; body: string } | null {
  if (doc.path.includes("*") || doc.path.endsWith("/")) return null;
  const full = path.join(REPO_ROOT, doc.path);
  if (!fs.existsSync(full)) return null;
  const raw = fs.readFileSync(full, "utf-8");
  const parsed = parseFrontmatter(raw);
  const fmRaw = (parsed.frontmatter ?? {}) as Record<string, unknown>;
  const evIds = Array.isArray(fmRaw.edge_vector_ids)
    ? (fmRaw.edge_vector_ids as unknown[]).filter((x): x is string => typeof x === "string")
    : undefined;
  return {
    fm: {
      qt: typeof fmRaw.questions_total === "number" ? fmRaw.questions_total : undefined,
      qa: typeof fmRaw.questions_answered === "number" ? fmRaw.questions_answered : undefined,
      qo: typeof fmRaw.questions_open === "number" ? fmRaw.questions_open : undefined,
      evIds,
    },
    body: parsed.body,
  };
}

/** Count `### [CATEGORY]` headers within the Q+A block of a doc body. */
function countQAEntries(body: string): number {
  const startMatch = body.match(QA_BLOCK_START);
  if (!startMatch) return 0;
  const startIdx = body.indexOf(startMatch[0]) + startMatch[0].length;
  const tail = body.slice(startIdx);
  const endMatch = tail.match(QA_BLOCK_END);
  const blockBody = endMatch ? tail.slice(0, tail.indexOf(endMatch[0])) : tail;
  const matches = blockBody.matchAll(CATEGORY_HEADER);
  return [...matches].length;
}

/** Parse EDGE_VECTORS.md to get all defined EV ids. */
function loadDefinedEvs(): Set<string> {
  if (!fs.existsSync(EDGE_VECTORS_PATH)) return new Set();
  const raw = fs.readFileSync(EDGE_VECTORS_PATH, "utf-8");
  const matches = raw.matchAll(/^####\s+(EV-[a-z][a-z0-9_-]*)/gm);
  return new Set([...matches].map((m) => m[1]));
}

// ── Validators ─────────────────────────────────────────────────

function validateDocMapPaths(docs: DocEntry[]): void {
  for (const doc of docs) {
    if (doc.path.includes("*") || doc.path.endsWith("/")) continue;
    if (!existsFile(doc.path)) {
      report("error", "DOC_MAP.md", `${doc.id}: path "${doc.path}" does not exist`);
    }
  }
}

function validateQACounts(docs: DocEntry[]): void {
  for (const doc of docs) {
    const result = readFrontmatter(doc);
    if (!result) continue;
    const { fm, body } = result;

    const hasQAFrontmatter =
      fm.qt !== undefined || fm.qa !== undefined || fm.qo !== undefined;

    // Body has Q+A block but frontmatter has no counts -> drift.
    const bodyCount = countQAEntries(body);
    if (bodyCount > 0 && !hasQAFrontmatter) {
      report(
        "error",
        doc.path,
        `body has ${bodyCount} ### [CATEGORY] Q+A entries but frontmatter is missing questions_total/answered/open + edge_vector_ids`
      );
      continue;
    }

    // Skip docs without any Q+A surface at all.
    if (!hasQAFrontmatter) continue;

    // Total = answered + open
    if (fm.qt !== undefined && fm.qa !== undefined && fm.qo !== undefined) {
      if (fm.qt !== fm.qa + fm.qo) {
        report(
          "error",
          doc.path,
          `frontmatter questions_total=${fm.qt} but answered=${fm.qa} + open=${fm.qo} = ${fm.qa + fm.qo}`
        );
      }
    } else {
      report(
        "error",
        doc.path,
        `frontmatter has partial Q+A counts; need all three (questions_total, questions_answered, questions_open)`
      );
    }

    // edge_vector_ids length should equal questions_open
    if (fm.qo !== undefined) {
      const evCount = fm.evIds?.length ?? 0;
      if (evCount !== fm.qo) {
        report(
          "error",
          doc.path,
          `questions_open=${fm.qo} but edge_vector_ids has ${evCount} entries`
        );
      }
    }

    // Body Q+A count should equal questions_total
    if (fm.qt !== undefined) {
      const bodyCount = countQAEntries(body);
      if (bodyCount !== fm.qt) {
        report(
          "error",
          doc.path,
          `frontmatter questions_total=${fm.qt} but body has ${bodyCount} ### [CATEGORY] entries in the Q+A block`
        );
      }
    }
  }
}

function validateEvIds(docs: DocEntry[], definedEvs: Set<string>): void {
  // Every EV id referenced in any doc's frontmatter must be defined in EDGE_VECTORS.md.
  const referencedEvs = new Set<string>();
  for (const doc of docs) {
    const result = readFrontmatter(doc);
    if (!result) continue;
    const ids = result.fm.evIds ?? [];
    for (const id of ids) {
      referencedEvs.add(id);
      if (!definedEvs.has(id)) {
        report(
          "error",
          doc.path,
          `references ${id} in edge_vector_ids but no entry in EDGE_VECTORS.md`
        );
      }
    }
  }

  // Every EV in EDGE_VECTORS.md must be referenced by some doc's frontmatter.
  for (const ev of definedEvs) {
    if (!referencedEvs.has(ev)) {
      report(
        "error",
        "EDGE_VECTORS.md",
        `${ev} defined but not referenced by any doc's edge_vector_ids frontmatter`
      );
    }
  }
}

// ── Main ───────────────────────────────────────────────────────

function main(): void {
  const docs = allDocs();
  const definedEvs = loadDefinedEvs();

  validateDocMapPaths(docs);
  validateQACounts(docs);
  validateEvIds(docs, definedEvs);

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (errors.length === 0 && warnings.length === 0) {
    console.log(
      `[docs:validate] OK — ${docs.length} docs · ${definedEvs.size} EVs · 0 issues`
    );
    process.exit(0);
  }

  for (const issue of issues) {
    const tag = issue.severity === "error" ? "ERROR" : "WARN";
    console.error(`[docs:validate] ${tag} ${issue.source}: ${issue.message}`);
  }
  console.error(
    `\n[docs:validate] ${errors.length} error(s) · ${warnings.length} warning(s)`
  );
  if (errors.length > 0) process.exit(1);
  process.exit(0);
}

main();
