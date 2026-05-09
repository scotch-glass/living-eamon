// ============================================================
// Launch-Criteria parser — shared between the launch-readiness
// report and the work-queue triager.
//
// Parses LAUNCH_CRITERIA.md into typed `LaunchItem[]`. Walks the
// markdown for fenced ```yaml blocks and collects every entry with
// an `id` field.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { parseFrontmatter } from "./markdown";

const REPO_ROOT = process.cwd();
const CRITERIA_PATH = path.join(REPO_ROOT, "LAUNCH_CRITERIA.md");

export type LaunchStatus =
  | "shipped"
  | "in-progress"
  | "not-started"
  | "blocked"
  | "deferred";

export interface LaunchItem {
  id: string;
  title: string;
  tier: 0 | 1 | 2;
  status: LaunchStatus;
  source: string;
  blockers: string[];
  affects_ev?: string[];
  affects_docs?: string[];
  good_looks_like?: string;
  criticality_flag?: "high" | "low";
}

/** Parse all LaunchItem entries from the YAML blocks in LAUNCH_CRITERIA.md. */
export function loadLaunchItems(): LaunchItem[] {
  if (!fs.existsSync(CRITERIA_PATH)) return [];
  const raw = fs.readFileSync(CRITERIA_PATH, "utf-8");
  const { body } = parseFrontmatter(raw);
  const lines = body.split(/\r?\n/);
  const items: LaunchItem[] = [];
  let inYaml = false;
  let buffer: string[] = [];

  for (const line of lines) {
    if (line.trim() === "```yaml") {
      inYaml = true;
      buffer = [];
      continue;
    }
    if (line.trim() === "```" && inYaml) {
      inYaml = false;
      const parsed = yaml.load(buffer.join("\n"));
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (entry && typeof entry === "object" && "id" in entry) {
            items.push(entry as LaunchItem);
          }
        }
      }
      buffer = [];
      continue;
    }
    if (inYaml) buffer.push(line);
  }

  return items;
}

const ACTIVE_STATUSES = new Set<LaunchStatus>(["not-started", "blocked", "in-progress"]);

export function isActive(item: LaunchItem): boolean {
  return ACTIVE_STATUSES.has(item.status);
}
