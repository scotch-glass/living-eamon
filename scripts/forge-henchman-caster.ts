// ========================================================================
// LIVING EAMON — Henchman Brand caster forge (Sprint C7)
//
// Generates the canonical master sprite for `henchman_brand` — the
// dual-class fighter-mage hireable ally introduced in Sprint C2. Combat
// stance IS the master (Brand has no prior canonical art; the master
// itself is mid-fight per the C7 plan, never casual).
//
// Output: public/art/npcs/henchman_brand/master/v{N}.png
//
// Usage:
//   npx tsx scripts/forge-henchman-caster.ts             # 4 candidates
//   npx tsx scripts/forge-henchman-caster.ts --count=8   # 8 candidates
//
// Cost: ~$0.07 per candidate (grok-imagine-image-pro). Default 4 ≈ $0.28.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { grokImageToTransparentPng } from "../lib/imageProcessing";

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

const args = process.argv.slice(2);
const countArg = args.find((a) => a.startsWith("--count="));
const candidateCount = countArg ? parseInt(countArg.slice("--count=".length), 10) : 4;
if (!Number.isFinite(candidateCount) || candidateCount < 1 || candidateCount > 16) {
  console.error("ERROR: --count must be between 1 and 16");
  process.exit(1);
}

const outDir = path.join(root, "public", "art", "npcs", "henchman_brand", "master");

// ── Prompt ──────────────────────────────────────────────────────────
//
// Brand is a sober, weathered DUAL-CLASS fighter-mage. Holds a longsword
// in middle guard with off-hand half-raised in the beginning of a Word
// of Power — wisps of arcane light at the fingertips. He's the
// canonical "back-rank caster who can also swing a blade" archetype.
//
// Howard-canon-safe Brand. No tan / sunburn language ("reddens under
// sun") per `feedback_howard_skin_palette` — pale or weathered only.

const PROMPT = [
  // Style anchor
  "Full-body OIL PAINTING in the classic 1970s-1980s sword-and-sorcery",
  "cover style of Frank Frazetta and Gerald Brom — visible painterly",
  "brushwork, warm romantic lighting, soft modeling of form, painted",
  "edges (NOT crisp lines). The medium is OIL PAINT ON CANVAS. NOT a",
  "photograph, NOT photoreal, NOT a 3D render, NOT CGI, NOT cartoon,",
  "NOT anime, NOT comic-book line-art, NOT vector art.",
  "",
  // Identity — sober, weathered, dual-class fighter-mage
  "A sober weathered MAN in his late thirties — a dual-class fighter-mage",
  "who has worked as a mercenary-spellsword for fifteen hard years.",
  "Approximately 5'11\", lean and wiry build (NOT a barbarian-hero",
  "physique — Brand is mid-rank: trained, fit, capable, but not heroic",
  "in scale). Pale weathered European skin, a face lined by years of",
  "campaigns under sun and rain (NOT sunburned, NOT olive, NOT tan, NOT",
  "dark — pale and weathered with subtle warm undertone). Close-cropped",
  "iron-grey hair, a short well-trimmed grey beard. Calm grey eyes that",
  "have seen too much, set in a face that no longer surprises easily.",
  "NO tattoos, NO scars on the face. NO long hair, NO loose flowing hair —",
  "his hair is short and practical for a working man at arms.",
  "",
  // Costume — modest dark robe over leather, belt pouches for reagents
  "He wears a MODEST DARK GREY-BROWN ROBE OVER LEATHER ARMOR — knee-length",
  "wool robe of dark slate grey, open at the front, worn over a buckled",
  "fitted leather cuirass and dark leather breeches. Dark leather boots",
  "to mid-calf. A wide leather belt at his waist with several small",
  "leather REAGENT POUCHES of varying sizes hanging at his hips, each",
  "cinched with a drawstring. NO cloak, NO hood, NO chainmail, NO plate.",
  "The clothes are practical, lived-in, road-dusted but well-kept — a",
  "working spellsword's kit, not a wizard's regalia.",
  "",
  // Combat stance — longsword middle guard + spell-fingers
  "He is in active COMBAT STANCE: a LONG SWORD held forward in",
  "ONE-HANDED MIDDLE GUARD by his right hand, blade angled forward",
  "toward an unseen opponent ahead, point at chest height. His LEFT",
  "HAND is RAISED palm-out at shoulder height, fingers half-curled in",
  "the beginning of a WORD OF POWER, with subtle wisps of arcane",
  "blue-white light gathering at his fingertips — magical luminescence",
  "starting to take shape but not yet released. Lead foot forward,",
  "knees soft and bent, weight low and centered, eyes hard and locked",
  "on the threat ahead. NOT casual, NOT a portrait, NOT the sword",
  "resting on his shoulder, NOT the sword pointed at the ground — he",
  "is mid-fight, weapon committed to a guard, ready to strike with",
  "blade or release a Word on the next breath.",
  // Blade tone — DARK steel against the white backdrop so rembg sees
  // the blade. See `feedback_blade_tone_rule`.
  "The longsword blade is BURNISHED DARK STEEL — a deep oiled grey-blue",
  "tone, with a streak of fresh red blood along one edge and small smears",
  "of dried blood on the flat. VISIBLY DARKER than the white studio",
  "backdrop; never mirror-bright, never silver-white. The contrast",
  "between blade and backdrop must read as a distinct dark shape.",
  "",
  // Expression
  "Expression: hard focused intensity, jaw set, brows lowered, eyes",
  "narrow and locked on the threat ahead, mouth a firm line — the look",
  "of a man who has been here a hundred times and still takes it",
  "seriously.",
  "",
  // Framing
  "3:4 vertical portrait. Pure clean opaque white (#FFFFFF) studio",
  "backdrop filling the entire frame. Full body visible from head to",
  "feet, the figure filling 80-87% of the frame vertically with feet",
  "at the bottom edge. Body angled three-quarters toward screen-RIGHT",
  "(ALLY orientation). Even soft warm studio lighting from the upper-",
  "left, no harsh shadows. NO scenery, NO floor, NO ground line, NO",
  "shadow under his feet, NO border, NO text, NO other figures.",
].join("\n");

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

async function forgeCandidate(index: number): Promise<void> {
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
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });

  const promptPath = path.join(outDir, "_prompt.txt");
  fs.writeFileSync(promptPath, PROMPT + "\n");
  console.log(`Prompt written to ${promptPath}`);
  console.log("");

  const startIndex = nextStartingIndex();
  const endIndex = startIndex + candidateCount - 1;

  console.log(`Forging ${candidateCount} Brand (henchman_brand) candidates`);
  console.log(`Output dir: ${outDir}`);
  console.log(`Naming: v${startIndex}…v${endIndex}`);
  console.log(`Model: grok-imagine-image-pro  |  Cost: ~$${(candidateCount * 0.07).toFixed(2)} total`);
  console.log("");

  let generated = 0;
  let failed = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    try {
      await forgeCandidate(i);
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
    console.log(`Open ${outDir} and pick the keeper. Tell Claude which`);
    console.log(`v{N} to lock as the canonical Brand master.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
