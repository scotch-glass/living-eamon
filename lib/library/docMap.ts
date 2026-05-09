// ============================================================
// Sprint W2 — DOC_MAP.md loader for the /library wiki.
//
// Parses the YAML-fenced doc entries in DOC_MAP.md (the master
// orchestration spine, see project memory project_doc_orchestration_plan.md
// + feedback_doc_map_discipline.md) and exposes typed accessors used
// by app/library/* server components.
//
// Server-only: reads the markdown file from disk via fs.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

// ── Schema ─────────────────────────────────────────────────────

export type DocRole =
  | "design-canon"
  | "sprint-plan"
  | "session-log"
  | "reference-generated"
  | "lore-artifact"
  | "legal"
  | "dev-process";

export type DocVisibility = "internal" | "creator";

export type DocStatus =
  | "active"
  | "draft"
  | "approved"
  | "deferred"
  | "rolling"
  | "historical";

export interface DocEntry {
  id: string;
  path: string;
  title: string;
  role: DocRole;
  canonical_for: string[];
  visibility: DocVisibility;
  status: DocStatus | string; // string for "rebuilt-on-demand" etc
  last_updated: string;
  cross_refs?: string[];
  generated_by?: string;
  npm_script?: string;
  note?: string;
}

// ── Section grouping (visual) ─────────────────────────────────
//
// DOC_MAP.md groups entries into sections by markdown heading. We
// preserve those groupings so the sidebar can render them as named
// section trees. Mapping from markdown H2 to a section key.

export interface DocSection {
  key: string;
  title: string;
  docs: DocEntry[];
}

const SECTION_HEADINGS: Record<string, string> = {
  "Root design docs": "design",
  "Dev / process docs": "process",
  "Lore — design refs": "lore-design",
  "Lore — in-world artifacts (player-readable; runtime-loaded where noted)":
    "lore-artifacts",
  "Generated registries (auto-derived; never hand-edit)": "registries",
};

// ── Parse helpers ─────────────────────────────────────────────
//
// js-yaml auto-converts unquoted ISO dates (e.g. `2026-04-30`) to
// JavaScript Date objects. We need string fields end-to-end so the
// React renderer doesn't throw "Objects are not valid as a React
// child (found: [object Date])". Coerce any Date values to a plain
// YYYY-MM-DD string at parse time.

function coerceDates(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v instanceof Date) {
      out[k] = v.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item instanceof Date ? item.toISOString().slice(0, 10) : item
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ── File loading + caching ─────────────────────────────────────

const REPO_ROOT = process.cwd();
const DOC_MAP_PATH = path.join(REPO_ROOT, "DOC_MAP.md");

let cachedSections: DocSection[] | null = null;

/**
 * Parses DOC_MAP.md. Walks the markdown line-by-line tracking the
 * current ## heading; whenever we hit a fenced ```yaml block while
 * under a known section heading, we js-yaml.load() it and append
 * each row to that section.
 */
function loadSections(): DocSection[] {
  if (cachedSections && process.env.NODE_ENV === "production") {
    return cachedSections;
  }

  const raw = fs.readFileSync(DOC_MAP_PATH, "utf-8");
  const lines = raw.split(/\r?\n/);

  const sections: Record<string, DocSection> = {};
  for (const [heading, key] of Object.entries(SECTION_HEADINGS)) {
    sections[key] = { key, title: heading, docs: [] };
  }

  let currentSectionKey: string | null = null;
  let inYaml = false;
  let yamlBuffer: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) {
      const heading = headingMatch[1];
      currentSectionKey = SECTION_HEADINGS[heading] ?? null;
      continue;
    }

    if (line.trim() === "```yaml" && currentSectionKey) {
      inYaml = true;
      yamlBuffer = [];
      continue;
    }

    if (line.trim() === "```" && inYaml) {
      inYaml = false;
      const text = yamlBuffer.join("\n");
      const parsed = yaml.load(text);
      if (Array.isArray(parsed) && currentSectionKey) {
        for (const entry of parsed) {
          if (entry && typeof entry === "object" && "id" in entry) {
            sections[currentSectionKey].docs.push(
              coerceDates(entry as Record<string, unknown>) as unknown as DocEntry
            );
          }
        }
      }
      yamlBuffer = [];
      continue;
    }

    if (inYaml) {
      yamlBuffer.push(line);
    }
  }

  cachedSections = Object.values(sections);
  return cachedSections;
}

// ── Public API ─────────────────────────────────────────────────

/**
 * All sections, in DOC_MAP.md authoring order. Includes empty sections.
 */
export function allSections(): DocSection[] {
  return loadSections();
}

/**
 * Flat list of every doc entry (across all sections).
 */
export function allDocs(): DocEntry[] {
  return loadSections().flatMap((s) => s.docs);
}

/**
 * Look up a single doc by its `id` slug. Returns null if not found.
 */
export function docById(id: string): DocEntry | null {
  return allDocs().find((d) => d.id === id) ?? null;
}

/**
 * Filter a list of docs to those a given role is allowed to see.
 *  - 'admin'   → sees everything (internal + creator)
 *  - 'creator' → sees `creator`-visibility docs only
 *  - 'player'  → sees nothing
 */
export function filterByRole(
  docs: DocEntry[],
  role: "player" | "creator" | "admin"
): DocEntry[] {
  if (role === "admin") return docs;
  if (role === "creator") return docs.filter((d) => d.visibility === "creator");
  return [];
}

/**
 * Sections with their docs filtered to those the given role can see.
 * Empty sections are dropped.
 */
export function sectionsForRole(
  role: "player" | "creator" | "admin"
): DocSection[] {
  return loadSections()
    .map((s) => ({ ...s, docs: filterByRole(s.docs, role) }))
    .filter((s) => s.docs.length > 0);
}
