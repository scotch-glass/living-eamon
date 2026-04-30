// ============================================================
// LIVING EAMON — Quest registry dump
//
// Walks the in-memory quest + dialogue registries and writes a
// derived markdown index to docs/quest-registry.md so every PR
// diff surfaces registry changes.
//
// Run:
//   npx tsx scripts/dump-quest-registry.ts
//
// Output: docs/quest-registry.md (committed; diffable)
//
// This is read-only against the registries — no DB touched.
// See ~/.claude/plans/good-questions-ultimately-the-radiant-cat.md
// ============================================================

import fs from "node:fs";
import path from "node:path";
import "../lib/quests/load"; // side-effect: registers all quest line modules
import { allQuests, validateRegistry } from "../lib/quests/engine";
import { allQuestDialogues, getQuestDialogue } from "../lib/quests/dialogue";
import type {
  Quest,
  QuestStep,
  QuestStepBranch,
  QuestReward,
  QuestTriggerHook,
} from "../lib/quests/types";
import type { QuestNPCDialogue, QuestDialogueBranch } from "../lib/quests/dialogue";

const ROOT = process.cwd();
const FRAGMENTS_DIR = path.join(ROOT, "lore", "stobaean-fragments");
const OUT = path.join(ROOT, "docs", "quest-registry.md");

interface FragmentMeta {
  fragment: string;          // "SH 2.1"
  fragmentId: string;        // "sh-2-1"
  title: string;
  deliveryNpc: string;
  deliveryStep: string;
  deliveryVector: string;
}

// ── Fragment frontmatter loader ───────────────────────────────

function parseFragmentFiles(): FragmentMeta[] {
  if (!fs.existsSync(FRAGMENTS_DIR)) return [];
  const files = fs
    .readdirSync(FRAGMENTS_DIR)
    .filter(f => /^SH-\d+\.\d+\.md$/.test(f));
  const out: FragmentMeta[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(FRAGMENTS_DIR, f), "utf8");
    const fm = pluckFrontmatter(raw);
    const fragment = fm.fragment ?? f.replace(/\.md$/, "").replace(/-/, " ");
    const fragmentId = fragment.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "-");
    out.push({
      fragment,
      fragmentId,
      title: fm.title ?? "",
      deliveryNpc: fm.deliveryNpc ?? "",
      deliveryStep: fm.deliveryStep ?? "",
      deliveryVector: fm.deliveryVector ?? "",
    });
  }
  // Stable sort by fragment number then sub-number
  out.sort((a, b) => {
    const an = parseFragRef(a.fragment);
    const bn = parseFragRef(b.fragment);
    return an[0] - bn[0] || an[1] - bn[1];
  });
  return out;
}

function parseFragRef(s: string): [number, number] {
  const m = /(\d+)\.(\d+)/.exec(s);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}

function pluckFrontmatter(raw: string): Record<string, string> {
  const m = /^---\s*\n([\s\S]*?)\n---/.exec(raw);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*?)\s*$/.exec(line);
    if (!kv) continue;
    let v = kv[2];
    if (v.startsWith("|") || v === "") continue; // skip block scalars + empty
    if (v.startsWith("\"") && v.endsWith("\"")) v = v.slice(1, -1);
    out[kv[1]] = v;
  }
  return out;
}

// ── Renderers ─────────────────────────────────────────────────

function renderTriggerHook(h?: QuestTriggerHook): string {
  if (!h) return "—";
  const target = h.target ? `(${h.target})` : "";
  const guard = h.guard ? " +guard" : "";
  return `\`${h.event}\`${target}${guard}`;
}

function renderReward(r?: QuestReward): string {
  if (!r) return "—";
  const parts: string[] = [];
  if (r.picssi) {
    const deltas = Object.entries(r.picssi)
      .filter(([, v]) => typeof v === "number" && v !== 0)
      .map(([k, v]) => `${k}${(v as number) >= 0 ? "+" : ""}${v}`)
      .join(",");
    if (deltas) parts.push(`picssi(${deltas})`);
  }
  if (r.gold) parts.push(`gold${r.gold >= 0 ? "+" : ""}${r.gold}`);
  if (r.itemsGained?.length) parts.push(`+items[${r.itemsGained.join(",")}]`);
  if (r.itemsLost?.length) parts.push(`−items[${r.itemsLost.join(",")}]`);
  if (r.knownSpells?.length) parts.push(`+spells[${r.knownSpells.join(",")}]`);
  if (r.flagsLife?.length) parts.push(`flagsLife[${r.flagsLife.join(",")}]`);
  if (r.flagsLegacy?.length) parts.push(`flagsLegacy[${r.flagsLegacy.join(",")}]`);
  if (r.npcAffection) parts.push(`affection(${Object.keys(r.npcAffection).join(",")})`);
  if (r.introduceNpc) parts.push(`+npc(${r.introduceNpc.npcId})`);
  if (r.unlockCircle) parts.push(`circle${r.unlockCircle}`);
  if (r.chronicle) parts.push(`chronicle`);
  if (r.legacyChronicle) parts.push(`legacyChronicle`);
  return parts.length ? parts.join(" · ") : "(empty)";
}

function renderStep(step: QuestStep): string {
  const trigger = step.branches?.length
    ? `branches[${step.branches.length}]`
    : renderTriggerHook(step.trigger);
  const reward = step.branches?.length
    ? "(per-branch)"
    : renderReward(step.reward);
  const next = step.branches?.length
    ? "(per-branch)"
    : step.nextStep ?? "—";
  const prereqs = step.prerequisites?.length
    ? ` · prereqs[${step.prerequisites.length}]`
    : "";
  return `| \`${step.id}\` | ${esc(step.hint)} | ${trigger}${prereqs} | ${reward} | ${next} |`;
}

function renderBranch(b: QuestStepBranch): string {
  return `    - \`${b.id}\` (${b.label}): ${renderTriggerHook(b.trigger)} → ${renderReward(b.reward)} → next=${b.nextStep ?? "—"}`;
}

function renderQuest(q: Quest): string {
  const lines: string[] = [];
  lines.push(`### \`${q.id}\` — ${q.title}`);
  lines.push("");
  lines.push(`> ${esc(q.blurb)}`);
  lines.push("");
  lines.push(`- **Scope:** ${q.scope}`);
  lines.push(`- **Start step:** \`${q.startStep}\``);
  lines.push(`- **Step count:** ${Object.keys(q.steps).length}`);
  if (q.acceptanceTrigger) {
    lines.push(`- **Acceptance trigger:** ${renderTriggerHook(q.acceptanceTrigger)}`);
  }
  if (q.acceptancePrerequisites?.length) {
    lines.push(`- **Acceptance prereqs:** ${q.acceptancePrerequisites.length}`);
  }
  if (q.acceptReward) lines.push(`- **Accept reward:** ${renderReward(q.acceptReward)}`);
  if (q.completionReward) lines.push(`- **Completion reward:** ${renderReward(q.completionReward)}`);
  if (q.codexCommands?.length) {
    lines.push(`- **Codex commands:** ${q.codexCommands.map(c => `\`${c}\``).join(", ")}`);
  }
  lines.push("");
  lines.push("| Step id | Hint | Trigger | Reward | Next |");
  lines.push("|---------|------|---------|--------|------|");
  // Walk steps in declaration order — use Object.values which preserves insertion order
  for (const step of Object.values(q.steps)) {
    lines.push(renderStep(step));
    if (step.branches?.length) {
      for (const b of step.branches) {
        lines.push(renderBranch(b));
      }
    }
  }
  return lines.join("\n");
}

function renderDialogueBranch(b: QuestDialogueBranch): string {
  const w = b.when;
  const cond: string[] = [];
  cond.push(`quest=\`${w.questId}\``);
  if (w.onStep) cond.push(`onStep=\`${w.onStep}\``);
  if (w.afterStepCompleted) cond.push(`after=\`${w.afterStepCompleted}\``);
  if (w.questCompleted) cond.push(`questCompleted`);
  if (w.questNotAccepted) cond.push(`questNotAccepted`);
  if (w.extra?.length) cond.push(`+${w.extra.length}prereqs`);
  const reward = b.fireOnceReward ? ` → ${renderReward(b.fireOnceReward)}` : "";
  const fkey = b.fireOnceKey ? ` (key: \`${b.fireOnceKey}\`)` : "";
  return `  - \`${b.id}\`: ${cond.join(", ")}${reward}${fkey}`;
}

function renderDialogue(d: QuestNPCDialogue): string {
  const lines: string[] = [];
  lines.push(`#### \`${d.npcId}\``);
  lines.push("");
  for (const b of d.branches) lines.push(renderDialogueBranch(b));
  if (d.fallback === undefined) {
    lines.push(`  - *fallback:* — (extension-style, falls through to legacy NPCScript)`);
  } else {
    lines.push(`  - *fallback:* ${d.fallback.length} line(s)`);
  }
  return lines.join("\n");
}

// ── NPC↔quest matrix ──────────────────────────────────────────

function buildNpcQuestMatrix(): string {
  const dialogues = allQuestDialogues();
  // For each NPC, the set of questIds referenced by its branches
  const rows: { npcId: string; quests: string[]; branchCount: number }[] = [];
  for (const d of dialogues) {
    const qids = new Set(d.branches.map(b => b.when.questId));
    rows.push({
      npcId: d.npcId,
      quests: [...qids].sort(),
      branchCount: d.branches.length,
    });
  }
  rows.sort((a, b) => a.npcId.localeCompare(b.npcId));
  const lines: string[] = [];
  lines.push("| NPC id | Quests | Branch count |");
  lines.push("|--------|--------|--------------|");
  for (const r of rows) {
    lines.push(`| \`${r.npcId}\` | ${r.quests.map(q => `\`${q}\``).join(", ")} | ${r.branchCount} |`);
  }
  return lines.join("\n");
}

// ── Fragment delivery map ─────────────────────────────────────

function buildFragmentMap(fragments: FragmentMeta[]): string {
  const lines: string[] = [];
  lines.push("| Fragment | Title | NPC | Step | Vector | Wired |");
  lines.push("|----------|-------|-----|------|--------|-------|");
  for (const f of fragments) {
    const wired = isFragmentWired(f);
    const status = wired ? "✓" : "TODO 8f";
    lines.push(
      `| **${f.fragment}** | ${esc(f.title)} | \`${f.deliveryNpc}\` | \`${f.deliveryStep}\` | ${f.deliveryVector} | ${status} |`
    );
  }
  return lines.join("\n");
}

function isFragmentWired(f: FragmentMeta): boolean {
  if (!f.deliveryNpc) return false;
  const d = getQuestDialogue(f.deliveryNpc);
  if (!d) return false;
  // Match by branch id naming convention `deliver-<fragmentId>` OR
  // by fireOnceKey `<fragmentId>-delivered`
  const idMatch = `deliver-${f.fragmentId}`;
  const keyMatch = `${f.fragmentId}-delivered`;
  return d.branches.some(b => b.id === idMatch || b.fireOnceKey === keyMatch);
}

// ── Main ──────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function main(): void {
  const quests = allQuests();
  const dialogues = allQuestDialogues();
  const fragments = parseFragmentFiles();
  const validation = validateRegistry();

  const lines: string[] = [];
  lines.push("# Quest registry — derived index");
  lines.push("");
  lines.push(
    `> **Generated by** \`npx tsx scripts/dump-quest-registry.ts\`. ` +
      `Walks the in-memory quest + dialogue registries and the ` +
      `\`lore/stobaean-fragments/\` directory. Source-of-truth is ` +
      `the TypeScript registry; this file is a derived view for ` +
      `visibility and PR diffs.`
  );
  lines.push("");
  lines.push(`Last regenerated: ${new Date().toISOString()}`);
  lines.push("");

  // ── Quests overview ─────────────────────────────────────────
  lines.push("## Quests overview");
  lines.push("");
  lines.push("| Quest id | Title | Scope | Steps | Start step | Accept trigger |");
  lines.push("|----------|-------|-------|-------|-----------|----------------|");
  for (const q of quests) {
    lines.push(
      `| \`${q.id}\` | ${esc(q.title)} | ${q.scope} | ${Object.keys(q.steps).length} | \`${q.startStep}\` | ${renderTriggerHook(q.acceptanceTrigger)} |`
    );
  }
  lines.push("");

  // ── Per-quest step maps ─────────────────────────────────────
  lines.push("## Per-quest step maps");
  lines.push("");
  for (const q of quests) {
    lines.push(renderQuest(q));
    lines.push("");
  }

  // ── NPC ↔ quest matrix ──────────────────────────────────────
  lines.push("## NPC ↔ quest matrix");
  lines.push("");
  lines.push(`Total NPCs with QuestNPCDialogue registered: **${dialogues.length}**`);
  lines.push("");
  lines.push(buildNpcQuestMatrix());
  lines.push("");

  // ── Per-NPC dialogue detail ─────────────────────────────────
  lines.push("## Per-NPC dialogue detail");
  lines.push("");
  const sortedDialogues = [...dialogues].sort((a, b) => a.npcId.localeCompare(b.npcId));
  for (const d of sortedDialogues) {
    lines.push(renderDialogue(d));
    lines.push("");
  }

  // ── Fragment delivery map ───────────────────────────────────
  lines.push("## Fragment delivery map (Way of Thoth)");
  lines.push("");
  lines.push(`Total Stobaean fragment files on disk: **${fragments.length}**`);
  const wired = fragments.filter(isFragmentWired).length;
  lines.push(`Wired into dialogue registry: **${wired}** · Deferred to Sprint 8f: **${fragments.length - wired}**`);
  lines.push("");
  lines.push(buildFragmentMap(fragments));
  lines.push("");

  // ── Validator ───────────────────────────────────────────────
  lines.push("## Validator status");
  lines.push("");
  if (validation.ok) {
    lines.push("`validateRegistry()` → `{ ok: true }` ✓");
  } else {
    lines.push("`validateRegistry()` → `{ ok: false }` ✗");
    lines.push("");
    lines.push("Errors:");
    for (const e of validation.errors) lines.push(`- \`${e}\``);
  }
  lines.push("");

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join("\n"));
  console.log(`Wrote ${path.relative(ROOT, OUT)} (${lines.length} lines)`);
  console.log(
    `  - Quests: ${quests.length}, NPC dialogues: ${dialogues.length}, Fragments: ${fragments.length} (${wired} wired)`
  );
  if (!validation.ok) {
    console.error(`  ✗ validateRegistry() reported ${validation.errors.length} error(s)`);
    process.exit(1);
  }
}

main();
