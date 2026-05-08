// ============================================================
// LIVING EAMON — Standing prompt-rules registry
//
// Single committed source: prompt-rules/standing.json
// Read at runtime by the Sprite Review Tool, the prompt-rules API
// route, and forge scripts that compose Grok prompts.
//
// Locked rules (locked: true) cannot be edited via the API; they
// represent project-wide invariants whose accidental override has
// caused regressions historically (e.g. mirror-bright blades, white
// chainmail bleed, Hyborian terms in marketing).
// ============================================================

import { promises as fs } from "node:fs";
import path from "node:path";

export interface PromptRule {
  id: string;
  title: string;
  body: string;
  locked: boolean;
  lastEdited: string;
  /** Optional pointer back to a code location that's the canonical
   *  source for this rule (e.g. the facing rule lives in
   *  lib/spriteFraming.ts and the JSON entry is a description). */
  linkRef?: string;
}

export interface StandingRulesFile {
  snapshotId: string;
  rules: PromptRule[];
}

const RULES_FILE = path.join(process.cwd(), "prompt-rules", "standing.json");

export async function loadStandingRules(): Promise<StandingRulesFile> {
  const raw = await fs.readFile(RULES_FILE, "utf8");
  return JSON.parse(raw) as StandingRulesFile;
}

export async function saveStandingRules(file: StandingRulesFile): Promise<void> {
  await fs.writeFile(RULES_FILE, JSON.stringify(file, null, 2) + "\n", "utf8");
}

/** Update one rule by id. Throws if the rule is locked or missing. */
export async function updatePromptRule(
  id: string,
  patch: Partial<Pick<PromptRule, "title" | "body">>,
): Promise<PromptRule> {
  const file = await loadStandingRules();
  const idx = file.rules.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error(`unknown rule id: ${id}`);
  const current = file.rules[idx]!;
  if (current.locked) throw new Error(`rule ${id} is locked`);
  const updated: PromptRule = {
    ...current,
    ...patch,
    lastEdited: new Date().toISOString().slice(0, 10),
  };
  file.rules[idx] = updated;
  // bump snapshotId so prompt-capture can record which version produced a sprite
  file.snapshotId = `${updated.lastEdited}-${file.rules.length.toString().padStart(3, "0")}`;
  await saveStandingRules(file);
  return updated;
}

/** Compose all rule bodies into a single prompt-suffix block.
 *  Forge scripts call this and append the result to their generated
 *  prompts. */
export function composeStandingRulesBlock(file: StandingRulesFile): string {
  return file.rules.map((r) => `[${r.title}] ${r.body}`).join(" ");
}
