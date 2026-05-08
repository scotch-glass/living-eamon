// ========================================================================
// LIVING EAMON — Corpse forge (Stage I of the sprite-normalization sprint)
//
// Generates a single per-character corpse PNG (no weapon visible — see
// `prompt-rules/standing.json:corpse_pose_rule`). One corpse per HERO
// (regardless of weapon) and one corpse per named combat NPC.
//
// Forge inventory (Decision #2, plan):
//   ~9 heroes × 1 corpse each   = ~9
//   ~6–7 named combat NPCs       ≈ ~7
//   Total: ~15 forges × ~$1.50 grok-imagine-image-pro = ~$22 total spend.
//
// Output:
//   public/art/heroes/<slug>/corpse/v{N}.png
//   public/art/npcs/<id>/corpse/v{N}.png
//
// Each PNG is captured into _sprite-metadata.json with:
//   isCorpse: true, originalPrompt: <verbatim>, sizeClass: <inferred>,
//   livingSpriteRef: <hero/NPC master path>.
//
// Usage:
//   npx tsx scripts/forge-corpses.ts --hero=gaius
//   npx tsx scripts/forge-corpses.ts --npc=vivian
//   npx tsx scripts/forge-corpses.ts --all-heroes
//   npx tsx scripts/forge-corpses.ts --all-combat-npcs
//   npx tsx scripts/forge-corpses.ts --hero=gaius --count=3   # candidates
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { grokImageToTransparentPng } from "../lib/imageProcessing";
import { recordPromptForSprite } from "../lib/art/recordPromptForSprite";
import { loadStandingRules } from "../lib/art/promptRules";
import { NPCS } from "../lib/gameData";
import type { SizeClass } from "../lib/art/sizeClasses";
import { spriteSizeToSizeClass } from "../lib/spriteFraming";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function readEnv(key: string): string | null {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return null;
  return line.slice(`${key}=`.length).trim().replace(/^["']|["']$/g, "");
}

const XAI_KEY = readEnv("XAI_API_KEY") ?? readEnv("GROK_API_KEY");
if (!XAI_KEY) {
  console.error("ERROR: neither XAI_API_KEY nor GROK_API_KEY in .env.local");
  process.exit(1);
}
const grok = new OpenAI({ apiKey: XAI_KEY, baseURL: "https://api.x.ai/v1" });

// ── CLI ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const heroArg = args.find((a) => a.startsWith("--hero="));
const npcArg = args.find((a) => a.startsWith("--npc="));
const allHeroes = args.includes("--all-heroes");
const allCombatNpcs = args.includes("--all-combat-npcs");
const countArg = args.find((a) => a.startsWith("--count="));
const candidateCount = countArg ? parseInt(countArg.slice("--count=".length), 10) : 1;

if (!heroArg && !npcArg && !allHeroes && !allCombatNpcs) {
  console.error(
    "ERROR: pass --hero=<slug>, --npc=<id>, --all-heroes, or --all-combat-npcs",
  );
  process.exit(1);
}
if (!Number.isFinite(candidateCount) || candidateCount < 1 || candidateCount > 8) {
  console.error("ERROR: --count must be between 1 and 8");
  process.exit(1);
}

// ── Identity-block lookup (heroes only) ─────────────────────────────

function loadHeroIdentity(slug: string): string {
  const blocksPath = path.join(root, "public/art/heroes/_identity-blocks.txt");
  const raw = fs.readFileSync(blocksPath, "utf8");
  const re = new RegExp(
    `── ${slug} · [^·]+ · id=[a-f0-9-]+ ──\\n([\\s\\S]*?)(?=\\n── |\\n*$)`,
    "i",
  );
  const m = raw.match(re);
  if (!m) throw new Error(`hero "${slug}" not found in _identity-blocks.txt`);
  return m[1]!.trim();
}

// ── Prompt composition ──────────────────────────────────────────────

const CORPSE_FRAMING_BLOCK = [
  "3:4 portrait, white backdrop. Viewer is a standing combatant at the",
  "body from 30 feet away so that only the side profile is visible, eye",
  "height ~5-6 ft, angled from the side of the body. Body in PROFILE",
  "from the side, long axis horizontal. Curled body anchored to the",
  "lower 20% of the frame, with empty white above. ONE figure only.",
].join(" ");

/**
 * Strip weapon mentions from a character identity description so the
 * corpse_pose_rule's "no weapon visible" clause isn't fighting "longsword
 * belted at his hip" wording in the identity. Removes sentences that
 * primarily describe a weapon, scabbard, shield, belt-rig, baldric, or
 * combat stance. Preserves clothes / armor / face / body lines.
 */
function stripWeaponClauses(identity: string): string {
  // Split on sentence boundaries, drop any sentence whose dominant noun
  // is a weapon or weapon-bearing apparatus.
  const sentences = identity.split(/(?<=\.|!|\?)\s+/);
  const weaponRe =
    /\b(sword|longsword|short[- ]?sword|great[- ]?sword|two[- ]?handed sword|dagger|knife|scabbard|shield|bow|quiver|axe|mace|hammer|spear|staff|quarterstaff|club|cudgel|baldric|weapon[- ]?belt|sword[- ]?belt|belt-rig|combat stance|stand|stands|standing|wields?|gripping|drawn|raised|guard)\b/i;
  return sentences
    .filter((s) => !weaponRe.test(s))
    .join(" ")
    .trim();
}

async function buildPrompt(identityBlock: string, _kind: "hero" | "npc"): Promise<{
  prompt: string;
  snapshotId: string | undefined;
}> {
  const rules = await loadStandingRules();
  const corpseRule = rules.rules.find((r) => r.id === "corpse_pose_rule");
  if (!corpseRule) {
    throw new Error("prompt-rules/standing.json missing corpse_pose_rule");
  }
  // Strip weapon/stance phrasing from the identity BEFORE composing.
  // This prevents Grok from rendering a sword/shield/scabbard/etc. that
  // contradicts the corpse_pose_rule's "no weapon visible" clause.
  const cleanedIdentity = stripWeaponClauses(identityBlock);
  const prompt = [
    cleanedIdentity,
    `[POSE] ${corpseRule.body}`,
    CORPSE_FRAMING_BLOCK,
  ].join("\n\n");
  return { prompt, snapshotId: rules.snapshotId };
}

// ── Grok call ───────────────────────────────────────────────────────

async function callGrokImaginePro(prompt: string): Promise<string> {
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "3:4",
    resolution: "2k",
  } as Parameters<typeof grok.images.generate>[0] & {
    aspect_ratio: string;
    resolution: string;
  });
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok Imagine returned no image data");
  return b64;
}

// ── Output path resolver ────────────────────────────────────────────

function corpseOutDir(kind: "hero" | "npc", slug: string): string {
  return kind === "hero"
    ? path.join(root, "public", "art", "heroes", slug, "corpse")
    : path.join(root, "public", "art", "npcs", slug, "corpse");
}

function nextStartingIndex(outDir: string): number {
  if (!fs.existsSync(outDir)) return 1;
  const existing = fs
    .readdirSync(outDir)
    .map((name) => /^v(\d+)\.png$/.exec(name))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => parseInt(m[1]!, 10));
  if (existing.length === 0) return 1;
  return Math.max(...existing) + 1;
}

// ── Forge a single subject ──────────────────────────────────────────

interface Subject {
  kind: "hero" | "npc";
  slug: string;
  identity: string;
  livingSpriteRef: string;
  defaultSizeClass: SizeClass;
}

async function forgeSubject(s: Subject): Promise<void> {
  const outDir = corpseOutDir(s.kind, s.slug);
  fs.mkdirSync(outDir, { recursive: true });
  const startIndex = nextStartingIndex(outDir);
  const endIndex = startIndex + candidateCount - 1;

  console.log(`\n[${s.kind} ${s.slug}] forging ${candidateCount} corpse candidate(s) → v${startIndex}…v${endIndex}`);

  const { prompt, snapshotId } = await buildPrompt(s.identity, s.kind);

  // Persist the prompt to disk for inspection (mirrors the per-script
  // _prompt.txt convention of forge-hero-combat).
  fs.writeFileSync(path.join(outDir, "_prompt.txt"), prompt + "\n");

  for (let i = startIndex; i <= endIndex; i++) {
    const outPath = path.join(outDir, `v${i}.png`);
    try {
      console.log(`  generating v${i}…`);
      const b64 = await callGrokImaginePro(prompt);
      console.log(`    raw image received (${Math.round((b64.length * 0.75) / 1024)} KB)`);
      console.log(`    running rembg…`);
      const pngBuffer = await grokImageToTransparentPng(b64);
      fs.writeFileSync(outPath, pngBuffer);
      const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`  ✓ wrote ${outPath} (${sizeKb} KB)`);

      const relPath = `/${path.relative(path.join(root, "public"), outPath).split(path.sep).join("/")}`;
      await recordPromptForSprite({
        spritePath: relPath,
        prompt,
        promptRulesSnapshotId: snapshotId,
        defaultSizeClass: s.defaultSizeClass,
        isCorpse: true,
        livingSpriteRef: s.livingSpriteRef,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ v${i} FAILED: ${msg}`);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────

const HERO_SLUGS_DEFAULT = [
  "gaius",
  "halvar",
  "hollan",
  "lev",
  "marik",
  "rurik",
  "selek",
  "seward",
  "talon",
];

function isCombatNpc(npcId: string): boolean {
  // A loose heuristic: NPCs that have a bandit/henchman/named combat
  // sprite already live in /art/npcs/<id>/combat or /art/npcs/<id>/master.
  // The corpse-forge target list is the named combat NPCs Scotch has been
  // shipping. Hardcode for now; expand as the bestiary grows.
  return [
    "vivian",
    "henchman_brand",
    "bandit_blade",
    "bandit_brute",
    "bandit_witch",
    "hokas_tokas",
    "zim_the_wizard",
  ].includes(npcId);
}

async function main(): Promise<void> {
  const subjects: Subject[] = [];

  if (heroArg || allHeroes) {
    const slugs = heroArg ? [heroArg.slice("--hero=".length).trim().toLowerCase()] : HERO_SLUGS_DEFAULT;
    for (const slug of slugs) {
      try {
        const identity = loadHeroIdentity(slug);
        subjects.push({
          kind: "hero",
          slug,
          identity,
          livingSpriteRef: `/art/heroes/${slug}.png`,
          defaultSizeClass: "C", // heroes are class C by default
        });
      } catch (err) {
        console.error(`  skip ${slug}: ${(err as Error).message}`);
      }
    }
  }

  if (npcArg || allCombatNpcs) {
    const ids = npcArg ? [npcArg.slice("--npc=".length).trim()] : Object.keys(NPCS).filter(isCombatNpc);
    for (const id of ids) {
      const npc = NPCS[id];
      if (!npc) {
        console.error(`  skip ${id}: not in NPCS registry`);
        continue;
      }
      // Prefer spritePrompt (sprite-shaped); fall back to description
      // (verbose physical/personality blurb on every NPC). The latter
      // covers vivian, henchman_brand, and the bandits — they were
      // forged via dedicated scripts that bypass the spritePrompt field.
      // Either source is acceptable identity payload for a corpse pose.
      const sourcePrompt = npc.spritePrompt ?? npc.description;
      if (!sourcePrompt) {
        console.error(`  skip ${id}: no spritePrompt and no description on NPC entry`);
        continue;
      }
      // The full strip (weapons + stance + scabbard + shield + bow etc.)
      // happens later in buildPrompt → stripWeaponClauses, so just hand
      // off the raw source here.
      const identity = sourcePrompt;
      const cls: SizeClass = npc.sizeClass ?? (npc.spriteSize ? spriteSizeToSizeClass(npc.spriteSize) : "C");
      subjects.push({
        kind: "npc",
        slug: id,
        identity,
        livingSpriteRef: `/art/npcs/${id}/master/v1.png`, // approximate — meta link points at the master
        defaultSizeClass: cls,
      });
    }
  }

  if (subjects.length === 0) {
    console.error("ERROR: no subjects resolved");
    process.exit(1);
  }

  console.log(`Forging ${subjects.length} corpse subject(s) × ${candidateCount} candidate(s)`);
  console.log(`Approx total cost: $${(subjects.length * candidateCount * 0.07).toFixed(2)}`);
  console.log(`Model: grok-imagine-image-pro`);

  for (const s of subjects) {
    await forgeSubject(s);
  }

  console.log("\n─── done ───");
  console.log("Next: open /dev/sprite-review, filter by isCorpse, eye-pin + classify + approve each.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
