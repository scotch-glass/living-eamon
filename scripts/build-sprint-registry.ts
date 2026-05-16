// ============================================================
// Sprint registry generator.
//
// Walks docs/plans/*.md, extracts each plan's `sprints:` frontmatter
// array, emits docs/sprint-registry.json as a single canonical
// snapshot of every sprint's status across every plan.
//
// Consumers:
//   - app/admin/page.tsx (dashboard sprint list + rollup tool status)
//   - lib/library/sprintRegistry.ts (typed loader)
//   - any future surface that needs "what shipped vs what's planned"
//
// Single source of truth: the plan-file frontmatter. Edit one field
// there and the next docs:build flushes everything downstream.
//
// Run: npx tsx scripts/build-sprint-registry.ts
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { loadSprints, sprintCounts, sprintsByTool } from "../lib/library/sprintRegistry";

const REPO_ROOT = process.cwd();
const OUT_PATH = path.join(REPO_ROOT, "docs", "sprint-registry.json");

interface Snapshot {
  generated_at: string;
  source: "docs/plans/*.md frontmatter";
  counts: ReturnType<typeof sprintCounts>;
  sprints: ReturnType<typeof loadSprints>;
  by_tool: Record<string, ReturnType<typeof loadSprints>>;
}

function main(): void {
  const sprints = loadSprints();
  const counts = sprintCounts();
  const byTool: Record<string, typeof sprints> = {};
  for (const [tool, list] of sprintsByTool()) {
    if (!tool) continue; // skip the empty-key bucket
    byTool[tool] = list;
  }

  const snapshot: Snapshot = {
    generated_at: new Date().toISOString(),
    source: "docs/plans/*.md frontmatter",
    counts,
    sprints,
    by_tool: byTool,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2) + "\n");

  const totals =
    `${counts.shipped} shipped · ${counts.inProgress} in-progress · ` +
    `${counts.planned} planned · ${counts.deferred} deferred (${counts.total} total)`;
  console.log(`[sprint-registry] wrote ${path.relative(REPO_ROOT, OUT_PATH)} — ${totals}`);
}

main();
