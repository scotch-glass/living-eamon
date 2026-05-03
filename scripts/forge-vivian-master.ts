// ========================================================================
// LIVING EAMON — Vivian master forge (one-off, recurring NPC reference)
//
// Generates N candidate master images of Vivian — the hero's first ally,
// thief / dancer / lockpicking-and-shadows trainer / first eros interest.
// We need a SINGLE canonical image as the coherence anchor for every
// future Vivian generation (scene art, dialogue sprites, intimate scenes,
// eventually her death portrait). Pick the best candidate, lock it, then
// reference-image future generations off it.
//
// Output: public/art/npcs/vivian/master/v1.png … vN.png (transparent PNG, white
// backdrop cut by rembg). Plus _prompt.txt for record.
//
// Usage:
//   npx tsx scripts/forge-vivian-master.ts             # 4 candidates
//   npx tsx scripts/forge-vivian-master.ts --count=8   # 8 candidates
//   npx tsx scripts/forge-vivian-master.ts --force     # overwrite existing
//
// Cost: ~$0.07 per candidate (grok-imagine-image-pro). 4 candidates ≈ $0.28.
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

const outDir = path.join(root, "public", "art", "npcs", "vivian", "master");

// ── CLI ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const countArg = args.find((a) => a.startsWith("--count="));
const candidateCount = countArg ? parseInt(countArg.slice("--count=".length), 10) : 4;
if (!Number.isFinite(candidateCount) || candidateCount < 1 || candidateCount > 16) {
  console.error("ERROR: --count must be between 1 and 16");
  process.exit(1);
}

// ── Prompt ──────────────────────────────────────────────────────────
//
// The canonical Vivian master prompt. Locked coherence anchors:
//   - chestnut-auburn loose hair to mid-back
//   - bright green almond eyes
//   - small silver locket on a fine chain at her throat
//   - petite dancer's build, fair pale warm-toned skin
//   - thief outfit: tight form-fitting black leather (NOT armor) — sleeveless
//     leather bodice, leather hot-pants or short-shorts, leather over-knee
//     stockings or leather thigh-high boots
//   - faces three-quarters to screen-right (ALLY orientation, same as hero)
//
// These anchors must survive every future generation. Once we pick the
// keeper from this batch, we reference-image off it in every subsequent
// Grok call so identity stays put.

const VIVIAN_PROMPT = [
  // Subject + style — locked HARD so cartoon / photoreal renders don't sneak in
  "Full-body OIL PAINTING of a young adult woman, age 20, executed in the",
  "classic oil-painted fantasy-illustration style of Frank Frazetta, Gerald",
  "Brom, Boris Vallejo, and the great 1970s-1980s sword-and-sorcery cover",
  "artists. The medium is OIL PAINT ON CANVAS — visible painterly brush",
  "texture, warm romantic lighting, soft modeling of form, painted edges",
  "(NOT crisp lines), dignified and serious in tone. This is a PAINTING,",
  "not a photograph, not a render, not an illustration drawn with lines.",
  "",
  "STRICT NEGATIVE: NOT photographic, NOT photorealistic, NOT a photo, NOT",
  "a 3D render, NOT CGI, NOT digital painting that looks plastic, NOT",
  "smooth-airbrushed. Equally NOT cartoon, NOT cel-shaded, NOT anime, NOT",
  "manga, NOT comic-book line-art, NOT Disney, NOT Pixar, NOT illustrated,",
  "NOT graphic novel, NOT vector art, NOT flat-shaded. The output MUST",
  "read as a traditional oil painting on canvas — visible brush strokes,",
  "painterly surfaces, the warm earthy palette of Frazetta paperback covers.",
  "",
  // Identity anchors (the locked coherence list)
  "She is petite — about 5'2\" — and visibly ATHLETIC: a working acrobat-",
  "dancer's body that has been earned, not sedentary, not soft, not",
  "untrained. Lean, fit, agile. Subtle but visible muscle tone throughout —",
  "she is a girl who runs across rooftops and climbs walls for a living.",
  "Specifically: visible deltoid and bicep definition in her bare arms",
  "(her arms are toned and shapely, NOT flabby, NOT skinny-soft, NOT",
  "untoned, but ALSO NOT bulky, NOT ripped, NOT bodybuilder, NOT veiny);",
  "a flat firm abdomen with the faintest modest hint of definition (NOT a",
  "six-pack, NOT shredded, NOT cut — just toned and trim); defined calves",
  "and quadriceps visible through the leather of her pants; tight gluteal",
  "tone. A narrow waist, narrow but feminine hips, small perky breasts",
  "(small, high, pert — NOT large, NOT full, NOT busty), healthy proportions.",
  "The overall impression is gymnastic / dancer / parkour-thief: lean and",
  "fit, capable, athletic, never bulky, never soft. Fair pale skin with the",
  "faintest warm undertone (not ashen, not olive, not tan). Chestnut-auburn",
  "hair — warm brown with subtle copper-red glints — pulled back into a",
  "TIGHT high PONYTAIL secured at the crown of her head with a thin black",
  "leather cord, the bound length of the ponytail falling down her back to",
  "between her shoulder blades. Hair is pulled back smooth and clean off",
  "her face and ears, NO loose strands across her forehead, NO bangs, NO",
  "wisps falling on her cheeks — face fully exposed. Bright green",
  "almond-shaped eyes, slightly upturned at the outer corners. Ears",
  "pierced with simple small silver studs. NO tattoos anywhere on her body.",
  "NO moles, NO freckles, NO birthmarks, NO scars on her face or body —",
  "clean unblemished skin.",
  "",
  // Locket (single distinguishing piece of jewelry)
  "At her throat, a fine silver chain holding a small closed silver locket",
  "about 1cm across, resting just below her collarbones. No other jewelry,",
  "no rings, no bracelets, no other necklaces, no piercings beyond the simple",
  "silver ear studs.",
  "",
  // Costume — sleeveless leather vest + leather pants + ankle boots
  "She wears tight, form-fitting BLACK LEATHER clothing — NOT armor, NOT plate,",
  "NOT chain mail, NOT a tunic, NOT linen, NOT cloth, NOT loose fabric, NOT a",
  "skirt, NOT shorts. Three pieces: (1) a sleeveless black-leather VEST cut",
  "with a deep V-neck — fitted snugly to her torso, bare shoulders and bare",
  "arms exposed, the V-neck running from her collarbones down between her",
  "small breasts, the silver locket visible against bare skin within the V;",
  "(2) tight, full-length black LEATHER PANTS — skin-tight, contouring her",
  "hips, thighs, and calves, reaching all the way down to her ankles (these",
  "are long pants, NOT shorts, NOT cropped, NOT a skirt); (3) BLACK LEATHER",
  "MOCCASINS — soft kid-leather slippers that hug the foot like a second skin,",
  "rising just above the ankle bone, made entirely of supple flexible leather",
  "with the sole formed from the SAME piece of leather as the upper (a single",
  "continuous wrap, NOT a separate sole, NOT a stitched welt). These are",
  "moccasins, NOT boots, NOT shoes, NOT slippers in the indoor sense — they",
  "have NO heel, NO hard leather sole, NO rigid construction, NO hobnails,",
  "NO stitched welt, NO defined arch — entirely soft, silent footwear made",
  "for creeping across stone floors without a sound. Think Native American",
  "moccasin construction in pure black leather, ankle-high, hugging the foot",
  "and ankle, with simple leather drawstring lacing at the top — and the",
  "drawstring lace ends are TUCKED CLEANLY UNDER the top edge of each",
  "moccasin so NO lace ends hang loose, NO trailing tails, NO dangling",
  "drawstrings (a thief's discipline: nothing trails to catch, nothing",
  "hangs to make noise). A PAIRED belt rig of dark-brown",
  "leather: one narrow belt cinched at her natural waist, and a second wider",
  "belt slung lower and angled across her hips — the lower belt riding the",
  "curve of her right hip and dipping toward her left thigh. From the lower",
  "belt, a short sword in a plain dark-leather scabbard hangs at her LEFT",
  "hip — a long-dagger / short-sword (about 18 inches of blade, leather-wrapped",
  "grip, simple iron crossguard, plain scabbard), the scabbard tip pointing",
  "down along the outside of her left thigh, hilt angled forward for a",
  "right-handed cross-draw. Several small dark-leather POUCHES hang from",
  "the lower belt at varying heights around her hips — three or four of them,",
  "different sizes, each cinched at the top with a leather drawstring (these",
  "are a thief's working pouches: lockpicks, coin, small finds). NO other",
  "weapons. NO cloak, NO hood, NO armor of",
  "any kind. The leather of the clothes is supple, well-oiled, lived-in — a",
  "working thief's kit, cut and worn deliberately to show off her body.",
  "",
  // Expression
  "Her expression: a slight knowing smile, head tilted just slightly toward",
  "the viewer, an air of warm mischief — confident but not predatory, inviting",
  "but self-possessed, the look of a girl who knows a secret and might tell it.",
  "Her eyes glance toward the viewer over her near shoulder.",
  "",
  // Pose — facing screen-right (ally orientation)
  "Pose: standing relaxed, three-quarters angled toward screen-RIGHT, weight",
  "on her right leg, left knee bent slightly. Her body is turned three-quarters",
  "to screen-right (the same orientation a hero would face), with her head",
  "turned slightly back toward the viewer so her face is more nearly camera-on",
  "while her shoulders and hips remain three-quarter to screen-right. Right",
  "arm hangs easy at her side, left hand rests lightly on her left hip. This",
  "is an ALLY orientation — she stands as the hero would stand, beside him,",
  "not opposite him.",
  "",
  // Framing (white backdrop, full body, sprite-pipeline-ready)
  "3:4 vertical portrait. Pure clean opaque white (#FFFFFF) studio backdrop",
  "filling the entire frame. The figure fills 83-87% of the frame vertically,",
  "with 10-12% empty white space above her head and her feet touching the",
  "very bottom edge of the frame (no more than 2% margin below her feet).",
  "She is horizontally centered. Even soft warm studio lighting from the",
  "upper-left, no harsh shadows. NO scenery, NO floor, NO ground line, NO",
  "shadow under her feet, NO border, NO text, NO labels, NO other figures.",
].join("\n");

// ── Generation ──────────────────────────────────────────────────────

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

async function forgeCandidate(index: number): Promise<void> {
  const outPath = path.join(outDir, `v${index}.png`);
  // No skip / no overwrite — caller picks an index that doesn't yet exist.
  console.log(`  generating candidate v${index}…`);
  const b64 = await callGrokImaginePro(VIVIAN_PROMPT);
  console.log(`    raw image received (${Math.round((b64.length * 0.75) / 1024)} KB)`);

  console.log(`    running rembg to cut white backdrop…`);
  const pngBuffer = await grokImageToTransparentPng(b64);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, pngBuffer);
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`  ✓ wrote ${outPath} (${sizeKb} KB)`);
}

/** Find the lowest unused v{N}.png index in the output directory.
 *  Each new run appends rather than overwriting, so previous candidates
 *  (including ones from old prompt iterations) stay around for comparison. */
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

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });

  // Save the current prompt for audit. Each run also stamps the prompt
  // alongside the candidate batch with the index range so you can correlate
  // images to prompts later.
  const promptPath = path.join(outDir, "_prompt.txt");
  fs.writeFileSync(promptPath, VIVIAN_PROMPT + "\n");
  console.log(`Prompt written to ${promptPath}`);
  console.log("");

  const startIndex = nextStartingIndex();
  const endIndex = startIndex + candidateCount - 1;

  // Stamp this batch's prompt to a per-batch file so we can trace which
  // prompt produced which candidates after multiple iterations.
  const batchPromptPath = path.join(outDir, `_prompt_v${startIndex}-v${endIndex}.txt`);
  fs.writeFileSync(batchPromptPath, VIVIAN_PROMPT + "\n");

  console.log(`Forging ${candidateCount} Vivian candidate${candidateCount === 1 ? "" : "s"}`);
  console.log(`Output dir: ${outDir}`);
  console.log(`Naming: v${startIndex} … v${endIndex} (auto-incremented; previous candidates preserved)`);
  console.log(`Batch prompt stamped to: ${path.basename(batchPromptPath)}`);
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
  console.log(`Generated: ${generated} (v${startIndex} - v${endIndex})`);
  console.log(`Failed:    ${failed}`);
  if (generated > 0) {
    console.log(`Approx cost this run: $${(generated * 0.07).toFixed(2)}`);
    console.log("");
    console.log("Next: open public/art/npcs/vivian/master/ and pick the keeper.");
    console.log("      Tell Claude which v{N} to lock as vivian_master_v1.png.");
    console.log("      That image becomes the coherence anchor for all future Vivian art.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
