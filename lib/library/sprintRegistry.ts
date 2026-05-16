// ============================================================
// Sprint registry loader — reads plan-file frontmatter from
// docs/plans/*.md and returns the union of every `sprints:` map.
//
// Each plan declares its own sprints in YAML frontmatter. The
// dashboard and other surfaces consume the loader so they don't
// drift from the canonical plan.
//
// Source-of-truth pattern: edit ONE plan file → dashboard +
// generated docs update on next `docs:build`.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { parseFrontmatter } from "./markdown";

const REPO_ROOT = process.cwd();
const PLANS_DIR = path.join(REPO_ROOT, "docs", "plans");

export type SprintStatus = "shipped" | "in-progress" | "planned" | "deferred";

export interface SprintEntry {
  id: string;            // e.g. "cf-0", "cf-1.5"
  name: string;
  status: SprintStatus;
  /** Plan file this sprint came from (basename without .md). */
  planSlug: string;
  /** Anchor in the plan body — defaults to id (i.e. <a id="cf-1"></a>). */
  anchor: string;
  /** Optional ship metadata. */
  shipped_at?: string;
  commit?: string;
  /** Tool href this sprint owns (e.g. "/creator-forge", "/admin/audio-review"). */
  tool?: string;
}

interface RawSprint {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  shipped_at?: unknown;
  commit?: unknown;
  tool?: unknown;
  anchor?: unknown;
}

interface PlanFrontmatter {
  plan_id?: string;
  title?: string;
  sprints?: RawSprint[];
}

const VALID_STATUSES: SprintStatus[] = ["shipped", "in-progress", "planned", "deferred"];

function isStatus(v: unknown): v is SprintStatus {
  return typeof v === "string" && (VALID_STATUSES as string[]).includes(v);
}

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  // js-yaml parses unquoted ISO-8601 dates as Date — coerce back to a
  // canonical YYYY-MM-DD string so the registry stays serializable.
  if (v instanceof Date && !isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  return undefined;
}

/**
 * Load every sprint from every plan file. Skips entries with a
 * malformed shape (missing id or status). Order: plan-file scan
 * order, then sprint-array order within each plan.
 */
export function loadSprints(): SprintEntry[] {
  if (!fs.existsSync(PLANS_DIR)) return [];
  const out: SprintEntry[] = [];
  for (const file of fs.readdirSync(PLANS_DIR).sort()) {
    if (!file.endsWith(".md")) continue;
    const planSlug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(PLANS_DIR, file), "utf-8");
    const { frontmatter } = parseFrontmatter(raw);
    if (!frontmatter) continue;
    const fm = frontmatter as PlanFrontmatter;
    if (!Array.isArray(fm.sprints)) continue;
    for (const s of fm.sprints) {
      const id = asString(s.id);
      const name = asString(s.name);
      const status = s.status;
      if (!id || !name || !isStatus(status)) continue;
      out.push({
        id,
        name,
        status,
        planSlug,
        anchor: asString(s.anchor) ?? id,
        shipped_at: asString(s.shipped_at),
        commit: asString(s.commit),
        tool: asString(s.tool),
      });
    }
  }
  return out;
}

/**
 * Group sprints by their `tool` field. Sprints with no tool are
 * collected under the empty string key.
 */
export function sprintsByTool(): Map<string, SprintEntry[]> {
  const map = new Map<string, SprintEntry[]>();
  for (const s of loadSprints()) {
    const key = s.tool ?? "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return map;
}

/**
 * Derive a tool-level rollup status from a list of its sprints:
 *   - all shipped → "live"
 *   - some shipped, others active → "partial"
 *   - none shipped, all deferred → "planned" (treat deferred as not-yet)
 *   - none shipped, some active → "planned"
 *   - empty list → null (caller must use a hand-set status)
 */
export type ToolRollupStatus = "live" | "partial" | "planned";

export function rollupToolStatus(sprints: SprintEntry[]): ToolRollupStatus | null {
  if (sprints.length === 0) return null;
  const shipped = sprints.filter((s) => s.status === "shipped").length;
  if (shipped === sprints.length) return "live";
  if (shipped > 0) return "partial";
  return "planned";
}

/** Counts for the dashboard "At a glance" tiles. */
export interface SprintCounts {
  total: number;
  shipped: number;
  inProgress: number;
  planned: number;
  deferred: number;
}

export function sprintCounts(): SprintCounts {
  const all = loadSprints();
  return {
    total: all.length,
    shipped: all.filter((s) => s.status === "shipped").length,
    inProgress: all.filter((s) => s.status === "in-progress").length,
    planned: all.filter((s) => s.status === "planned").length,
    deferred: all.filter((s) => s.status === "deferred").length,
  };
}
