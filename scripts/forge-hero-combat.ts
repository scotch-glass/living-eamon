// ========================================================================
// LIVING EAMON — Hero combat-armed forge (Sprint C7)
//
// Per the pre-roll image architecture (no game-time inference), each
// (heroId × weaponId) combat-stance variant must be pre-rendered offline.
// This script forges combat-armed variants of the canonical heroes
// holding a specific weapon in active combat stance — never casual,
// never weapon-on-shoulder, never blade hanging loose.
//
// Reads the canonical identity block from
// `public/art/heroes/_identity-blocks.txt` (see `project_hero_identity_block`
// memory: deterministic fill, never re-rolled, never LLM-rewritten).
//
// Output: public/art/heroes/<slug>/combat/<weapon>/v{N}.png
//
// Usage:
//   npx tsx scripts/forge-hero-combat.ts --hero=halvar --weapon=long_sword
//   npx tsx scripts/forge-hero-combat.ts --hero=halvar --weapon=long_sword --count=4
//
// Cost: ~$0.07 per candidate (grok-imagine-image-pro). Default 4 candidates ≈ $0.28.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { grokImageToTransparentPng } from "../lib/imageProcessing";
import { recordPromptForSprite } from "../lib/art/recordPromptForSprite";
import { loadStandingRules } from "../lib/art/promptRules";

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
const weaponArg = args.find((a) => a.startsWith("--weapon="));
const countArg = args.find((a) => a.startsWith("--count="));
const heroSlug = heroArg ? heroArg.slice("--hero=".length).trim().toLowerCase() : "";
const weaponId = weaponArg ? weaponArg.slice("--weapon=".length).trim().toLowerCase() : "long_sword";
const candidateCount = countArg ? parseInt(countArg.slice("--count=".length), 10) : 4;
if (!heroSlug) {
  console.error("ERROR: --hero=<slug> required (e.g. --hero=halvar)");
  process.exit(1);
}
if (!Number.isFinite(candidateCount) || candidateCount < 1 || candidateCount > 16) {
  console.error("ERROR: --count must be between 1 and 16");
  process.exit(1);
}

// ── Identity-block lookup ───────────────────────────────────────────

const identityBlocksPath = path.join(root, "public/art/heroes/_identity-blocks.txt");
if (!fs.existsSync(identityBlocksPath)) {
  console.error(`ERROR: ${identityBlocksPath} not found`);
  process.exit(1);
}
const identityBlocksRaw = fs.readFileSync(identityBlocksPath, "utf8");
const blockRe = new RegExp(
  `── ${heroSlug} · [^·]+ · id=[a-f0-9-]+ ──\\n([\\s\\S]*?)(?=\\n── |\\n*$)`,
  "i",
);
const blockMatch = identityBlocksRaw.match(blockRe);
if (!blockMatch) {
  console.error(`ERROR: hero "${heroSlug}" not found in _identity-blocks.txt`);
  process.exit(1);
}
const HERO_IDENTITY = blockMatch[1].trim();

// ── Weapon-specific combat-stance clause ────────────────────────────
//
// Locked stance descriptors per the C7 plan. Each weapon ID maps to one
// stance — never casual, never on-shoulder, never blade hanging loose.

// Each stance clause locks BOTH the weapon (a real, solid steel blade
// that the eye can clearly see — not transparent, not glowing) AND the
// footwear (simple plain dark-leather sandals, since the canonical hero
// identity is bare-chested-but-shod for combat readiness). The hero
// identity block at `_identity-blocks.txt` says "barefoot" — but for
// combat-stance variants we override to sandals so the hero looks
// equipped to fight rather than to nap.
//
// IMPORTANT — blade tone. A polished mirror-bright blade is the same
// luminance as the white studio backdrop, and rembg's alpha-cut treats
// it as background and erases it. Every blade we forge must be visibly
// DARKER than pure white: oiled grey-blue burnished steel, or streaked
// with fresh blood, or carrying a smear of dirt from the road. This
// preserves the blade through the rembg pass. Same rule as
// `feedback_chainmail_gambeson_rule` (chainmail loses the gambeson and
// vanishes) — see `feedback_blade_tone_rule` memory.
const SOLID_BLADE_LOCK = [
  "The weapon is a REAL, SOLID, OPAQUE STEEL SWORD — the blade and",
  "crossguard fully rendered as solid metal with clear edges and a",
  "defined point. NOT transparent, NOT translucent, NOT see-through, NOT",
  "made of light, NOT glowing, NOT magical, NOT a hologram. The viewer",
  "must be able to follow the entire length of the blade as solid steel",
  "from pommel to point, with the leather-wrapped grip and the steel",
  "crossguard distinctly drawn.",
  // Blade tone — DARK steel so rembg can find it against the white backdrop.
  "The blade is BURNISHED DARK STEEL — a deep oiled grey-blue tone, the",
  "kind of well-used campaign blade that has been blacked against rust,",
  "with a streak of fresh red blood running along one edge near the tip",
  "and small flecks and smears of dried blood on the flat. The blade is",
  "VISIBLY DARKER than the white studio backdrop — never mirror-bright,",
  "never silver-white, never polished to chromed gleam. The contrast",
  "between blade and backdrop must be high enough that the eye can read",
  "the blade as a distinct dark shape against the white.",
].join(" ");

const FOOTWEAR_LOCK = [
  "He wears simple plain dark-brown leather SANDALS strapped up the",
  "ankle — practical combat footwear, not bare feet. The sandals must",
  "be visible on both feet.",
].join(" ");

// Armor override — the canonical hero identity block locks the hero as
// "bare-chested in a leather loincloth," which is correct for the
// unarmored master sprite. For combat-armed variants, the hero is kitted
// for war: a hardened LEATHER CUIRASS (chest+back boiled-leather plate)
// over leather pteruges (thigh straps), bracers on the forearms, and a
// wide leather warbelt. This explicitly OVERRIDES the bare-chested
// clause in the identity block. The skin tone, build, hair, and face
// from the identity block all remain unchanged — only the costume is
// upgraded from loincloth-only to working leather armor.
const ARMOR_LOCK = [
  "ARMOR OVERRIDE — IGNORE the 'bare-chested' and 'leather loincloth only'",
  "wording in the identity block above. For this combat-armed variant the",
  "hero wears full LEATHER ARMOR over his skin: a HARDENED BOILED-LEATHER",
  "CUIRASS (chest plate + back plate) of dark oxblood-brown leather,",
  "buckled at the sides with iron rivets along the seams; a row of",
  "LEATHER PTERUGES (vertical strap-skirt of dark leather tongues) hanging",
  "from a wide warbelt at his waist down to mid-thigh; matching dark-",
  "leather BRACERS strapped on both forearms from wrist to elbow; and a",
  "wide tooled LEATHER WARBELT at the waist with iron buckle. The cuirass",
  "is fitted closely to his torso so the heavy chest and shoulder muscles",
  "still read clearly underneath. NO chainmail, NO plate, NO scale, NO",
  "metal armor — the armor is ENTIRELY DARK LEATHER. NO bare chest, NO",
  "loincloth-only, NO shirtless. The skin of his upper arms, neck, and",
  "lower thighs is still visible between cuirass / bracers / pteruges,",
  "but his torso is fully covered by the leather cuirass.",
].join(" ");

const STANCE_CLAUSE: Record<string, string> = {
  long_sword: [
    "He is in active COMBAT STANCE: longsword RAISED in TWO-HANDED HIGH",
    "GUARD above his right shoulder, both hands gripping the leather-",
    "wrapped hilt firmly, the blade tipped forward and down toward an",
    "unseen opponent ahead, point angled forward and slightly downward.",
    "Lead foot forward, hips squared toward the threat, knees slightly",
    "bent, weight low and loaded for a descending cleaving strike. Eyes",
    "locked hard on the unseen opponent. NOT casual, NOT a portrait, NOT",
    "the sword resting on his shoulder, NOT pointed at the ground — the",
    "weapon is committed to a guard, ready to descend on the next breath.",
    SOLID_BLADE_LOCK,
    FOOTWEAR_LOCK,
    ARMOR_LOCK,
  ].join(" "),
  short_sword: [
    "He is in active COMBAT STANCE: short sword held forward in a",
    "half-extended thrust guard at chest height, off-hand raised palm-out",
    "for balance, body bladed at a 45-degree angle, weight on the back",
    "foot, ready to lunge or parry.",
    SOLID_BLADE_LOCK,
    FOOTWEAR_LOCK,
    ARMOR_LOCK,
  ].join(" "),
  great_sword: [
    "He is in active COMBAT STANCE: a CONAN-LIKE TWO-HANDED SWORD raised",
    "across the body in a high diagonal ready-position, both hands gripping",
    "the leather-wrapped hilt, the blade rising over his right shoulder,",
    "lead foot planted forward, weight loaded for a downward cleaving",
    "strike. NOT casual, NOT on shoulder, NOT pointed at the ground.",
    // Anti-anime blade-proportion lock — Grok defaults to absurdly wide
    // slabs when prompted with words like "greatsword" or "massive".
    "The blade is a HISTORICALLY-PROPORTIONED European two-handed sword in",
    "the style of the Robert E. Howard / Frank Frazetta Conan paintings —",
    "a long straight DOUBLE-EDGED steel blade roughly 2 to 2.5 inches",
    "(5–6 cm) WIDE at the base, tapering smoothly to a sharp point, with a",
    "central fuller running most of its length. The blade is REALISTICALLY",
    "SLENDER and gracefully tapered. It is NOT oversized, NOT a slab, NOT",
    "anime-thick, NOT comically wide, NOT a giant fantasy buster sword,",
    "NOT a manga-style cleaver. The proportions match a real historical",
    "longsword/zweihänder — slender for its length, with weight and reach",
    "from length, never from absurd width or thickness.",
    SOLID_BLADE_LOCK,
    FOOTWEAR_LOCK,
    ARMOR_LOCK,
  ].join(" "),
};
const stanceClause = STANCE_CLAUSE[weaponId];
if (!stanceClause) {
  console.error(`ERROR: weapon "${weaponId}" has no combat-stance clause yet`);
  console.error(`Supported: ${Object.keys(STANCE_CLAUSE).join(", ")}`);
  process.exit(1);
}

// ── Prompt ──────────────────────────────────────────────────────────
//
// Style + identity + combat stance + framing. Style + framing follow
// the locked oil-painting / white-backdrop conventions from the
// existing Vivian and hero-master forges.

const PROMPT = [
  // Style anchor — oil painting, NOT photo / NOT cartoon
  "Full-body OIL PAINTING in the classic 1970s-1980s sword-and-sorcery",
  "cover style of Frank Frazetta and Frank Brom — visible painterly",
  "brushwork, warm romantic lighting, soft modeling of form, painted",
  "edges (NOT crisp lines). The medium is OIL PAINT ON CANVAS — visible",
  "brush texture. NOT a photograph, NOT photoreal, NOT a 3D render, NOT",
  "CGI, NOT cartoon, NOT cel-shaded, NOT anime, NOT manga, NOT comic-book",
  "line-art, NOT vector, NOT flat-shaded.",
  "",
  // Hero identity block (locked, deterministic)
  HERO_IDENTITY,
  "",
  // Combat stance (weapon-specific)
  stanceClause,
  "",
  // Framing — full body, white backdrop, no shadow under feet
  "3:4 vertical portrait. Pure clean opaque white (#FFFFFF) studio backdrop",
  "filling the entire frame. Full body visible from head to feet, the",
  "figure filling 80-87% of the frame vertically with feet at the bottom",
  "edge and modest empty white space above his head. Even soft warm studio",
  "lighting from the upper-left, no harsh shadows. NO scenery, NO floor,",
  "NO ground line, NO shadow under his feet, NO border, NO text, NO labels,",
  "NO other figures.",
].join("\n");

// ── Generation ──────────────────────────────────────────────────────

const outDir = path.join(root, "public", "art", "heroes", heroSlug, "combat", weaponId);

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

function nextStartingIndex(): number {
  if (!fs.existsSync(outDir)) return 1;
  const existing = fs
    .readdirSync(outDir)
    .map((name) => /^v(\d+)\.png$/.exec(name))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => parseInt(m[1]!, 10));
  if (existing.length === 0) return 1;
  return Math.max(...existing) + 1;
}

async function forgeCandidate(index: number, snapshotId: string | undefined): Promise<void> {
  const outPath = path.join(outDir, `v${index}.png`);
  console.log(`  generating candidate v${index}…`);
  const b64 = await callGrokImaginePro(PROMPT);
  console.log(`    raw image received (${Math.round((b64.length * 0.75) / 1024)} KB)`);
  console.log(`    running rembg to cut white backdrop…`);
  const pngBuffer = await grokImageToTransparentPng(b64);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, pngBuffer);
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`  ✓ wrote ${outPath} (${sizeKb} KB)`);
  // Capture verbatim prompt + standing-rules snapshot in metadata registry
  // so the Sprite Review Tool can show what generated this PNG.
  const relPath = `/${path.relative(path.join(root, "public"), outPath).split(path.sep).join("/")}`;
  await recordPromptForSprite({
    spritePath: relPath,
    prompt: PROMPT,
    promptRulesSnapshotId: snapshotId,
    defaultSizeClass: "C", // hero combat sprites are class C by default
  });
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });

  const promptPath = path.join(outDir, "_prompt.txt");
  fs.writeFileSync(promptPath, PROMPT + "\n");
  console.log(`Prompt written to ${promptPath}`);
  console.log("");

  const startIndex = nextStartingIndex();
  const endIndex = startIndex + candidateCount - 1;

  console.log(`Forging ${candidateCount} combat-armed candidates of ${heroSlug} with ${weaponId}`);
  console.log(`Output dir: ${outDir}`);
  console.log(`Naming: v${startIndex}…v${endIndex} (auto-increment; previous candidates preserved)`);
  console.log(`Model: grok-imagine-image-pro  |  Cost: ~$${(candidateCount * 0.07).toFixed(2)} total`);
  console.log("");

  // Snapshot the standing rules at generation time so the metadata can
  // record which version produced this sprite.
  let snapshotId: string | undefined;
  try {
    const rules = await loadStandingRules();
    snapshotId = rules.snapshotId;
  } catch {
    snapshotId = undefined;
  }

  let generated = 0;
  let failed = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    try {
      await forgeCandidate(i, snapshotId);
      generated++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ v${i} FAILED: ${msg}`);
    }
  }

  console.log("");
  console.log("─── Summary ───");
  console.log(`Generated: ${generated} (v${startIndex}…v${endIndex})`);
  console.log(`Failed:    ${failed}`);
  if (generated > 0) {
    console.log(`Approx cost this run: $${(generated * 0.07).toFixed(2)}`);
    console.log("");
    console.log(`Open ${outDir} and pick the keeper.`);
    console.log(`Reject any sprite where the weapon is on-shoulder, hanging loose,`);
    console.log(`pointed at the ground, or where the figure reads as "casual/portrait"`);
    console.log(`rather than mid-fight. Re-run for more candidates if all 4 are weak.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
