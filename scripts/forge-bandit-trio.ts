// ========================================================================
// LIVING EAMON — Bandit trio forge (Sprint C7)
//
// Forges canonical master sprites for the three Sprint C2 bandit NPCs
// that appear in the C8 dev test scenario:
//   - bandit_blade  (Rurik)  — lean cutthroat, longsword middle guard
//   - bandit_witch  (Sela)   — robed sorceress, staff two-handed guard
//   - bandit_brute  (Korm)   — heavyset warrior, Conan-like two-handed sword ready
//
// Each subject gets `--count` candidates. Combat stance IS the master
// (no separate "casual" portrait — bandits are introduced mid-fight).
//
// Output:
//   public/art/npcs/bandit_blade/master/v{N}.png
//   public/art/npcs/bandit_witch/master/v{N}.png
//   public/art/npcs/bandit_brute/master/v{N}.png
//
// Usage:
//   npx tsx scripts/forge-bandit-trio.ts                 # 4 each
//   npx tsx scripts/forge-bandit-trio.ts --count=4       # 4 each
//   npx tsx scripts/forge-bandit-trio.ts --only=bandit_brute --count=8
//
// Cost: ~$0.07 per candidate. 3 subjects × 4 candidates = 12 calls ≈ $0.84.
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

const args = process.argv.slice(2);
const countArg = args.find((a) => a.startsWith("--count="));
const onlyArg = args.find((a) => a.startsWith("--only="));
const candidateCount = countArg ? parseInt(countArg.slice("--count=".length), 10) : 4;
if (!Number.isFinite(candidateCount) || candidateCount < 1 || candidateCount > 16) {
  console.error("ERROR: --count must be between 1 and 16");
  process.exit(1);
}

// ── Style + framing (shared across all three subjects) ──────────────

const STYLE_ANCHOR = [
  "Full-body OIL PAINTING in the classic 1970s-1980s sword-and-sorcery",
  "cover style of Frank Frazetta and Gerald Brom — visible painterly",
  "brushwork, warm romantic lighting, soft modeling of form, painted",
  "edges (NOT crisp lines). The medium is OIL PAINT ON CANVAS — visible",
  "brush texture. NOT a photograph, NOT photoreal, NOT a 3D render, NOT",
  "CGI, NOT cartoon, NOT cel-shaded, NOT anime, NOT manga, NOT comic-book",
  "line-art, NOT vector art.",
].join(" ");

// Bandits read uglier + meaner than allies. Per Scotch (2026-05-08): the
// player should viscerally want these dead. Lean into the Howard tradition
// of "the brute is brutish on his face." Apply on top of each subject's
// description, so per-character beauty/ugly modifiers stack.
const UGLY_MEAN_OVERLAY = [
  "UGLY-AND-MEAN OVERLAY (applies to this bandit on top of all other",
  "description above): the face reads as visibly UNPLEASANT and",
  "VISIBLY HOSTILE to the viewer. Add at least three of: a broken or",
  "previously-broken NOSE crooked off-center; YELLOWED, CHIPPED, or",
  "SNAGGLE-TEETH visible when the lip curls; a permanent SCOWL or SNEER;",
  "deep facial SCARS or pockmarks; UNWASHED, GREASY hair and skin; a",
  "torn or notched EAR; sun-cracked LIPS; deep CROW'S-FEET set in a hard",
  "frown. The expression is pure threat — no charm, no nobility, no",
  "softness. The eyes read as a man who enjoys hurting people. NOT",
  "handsome, NOT heroic, NOT tragic-and-sympathetic, NOT a fallen",
  "noble — these are roadside cutthroats whose faces tell their work.",
].join(" ");

// Bandits face screen-LEFT (ENEMY orientation, mirror of allies who face right).
const FRAMING = [
  "3:4 vertical portrait. Pure clean opaque white (#FFFFFF) studio backdrop",
  "filling the entire frame. Full body visible from head to feet, the",
  "figure filling 80-87% of the frame vertically with feet at the bottom",
  "edge and modest empty white space above the head. Body angled three-",
  "quarters toward screen-LEFT (ENEMY orientation, opposing the hero's",
  "right-facing ally orientation). Even soft warm studio lighting from the",
  "upper-left, no harsh shadows. NO scenery, NO floor, NO ground line, NO",
  "shadow under the feet, NO border, NO text, NO other figures.",
].join(" ");

// ── Per-subject prompts ─────────────────────────────────────────────

interface BanditSpec {
  id: string;          // npcId — matches lib/gameData.ts and output dir
  description: string; // identity + costume + stance, joined with framing
}

// Howard-canon-safe names: Rurik, Sela, Korm. No tan/sunburn language —
// pale or weathered or sun-darkened-bald only (per Howard skin palette
// memory). Chainmail clauses always include "over a black quilted
// gambeson" per the chainmail-gambeson rule.

const BANDITS: BanditSpec[] = [
  {
    id: "bandit_blade",
    description: [
      // Identity — lean cutthroat
      "A LEAN CUTTHROAT MAN in his late twenties, wiry and dangerous —",
      "approximately 5'10\", lean-muscled but not bulky, the body of a",
      "knife-fighter who has lived hard. Pale European skin with a faint",
      "cold-weathered cast (NOT tan, NOT olive, NOT dark — pale and",
      "weathered). Close-cropped sandy-brown hair, several days of stubble",
      "across his jaw. Sharp pale-blue eyes, a thin scar running across",
      "his left cheekbone. A snarl curling his lip — bared teeth, the look",
      "of a man who hurts people for coin. NOT a hero physique, NOT noble —",
      "this is a hard-living roadside cutthroat.",
      "",
      // Costume — leather + chainmail with REQUIRED gambeson
      "He wears WORN BUFF LEATHER over CHAINMAIL OVER A BLACK QUILTED",
      "GAMBESON — a sleeveless leather jerkin laced over short-sleeved",
      "chainmail, the chainmail itself worn over a thick black quilted",
      "gambeson padding (the black gambeson visible at the cuffs, neckline,",
      "and skirt edges so no white background bleeds through the metal",
      "rings). Dark leather breeches, scuffed leather boots to mid-calf.",
      "A wide leather belt at his waist with a longsword scabbard hanging",
      "at his left hip, scabbard empty (the sword is drawn — see stance).",
      "",
      // Combat stance — longsword middle guard
      "He is in active COMBAT STANCE: his LONGSWORD is DRAWN and held",
      "FORWARD in MIDDLE GUARD, gripped with his right hand at the hilt,",
      "off-hand raised palm-out for balance, body bladed at a 45-degree",
      "angle to the viewer with his left shoulder leading (he faces screen-",
      "LEFT). Weight on the back foot, knees soft, ready to lunge or parry.",
      "Blade angled forward toward an unseen opponent ahead. NOT casual,",
      "NOT a portrait, NOT the sword resting on his shoulder, NOT pointed",
      "at the ground — he is mid-fight.",
      "",
      // Blade tone — DARK steel against the white backdrop so rembg can
      // find the blade. See `feedback_blade_tone_rule`.
      "The longsword blade is BURNISHED DARK STEEL — a deep oiled grey-",
      "blue tone, with a streak of fresh red blood along one edge and small",
      "smears of dried blood on the flat. VISIBLY DARKER than the white",
      "studio backdrop; never mirror-bright, never silver-white, never",
      "chromed. The contrast between blade and backdrop must read as a",
      "distinct dark shape.",
    ].join("\n"),
  },
  {
    id: "bandit_witch",
    description: [
      // Identity — robed sorceress, hard-eyed
      "A ROBED SORCERESS WOMAN in her early thirties, hard-eyed and grim —",
      "approximately 5'6\", lean and ascetic in build (NOT voluptuous, NOT",
      "buxom — a working sorceress, undernourished by years of hard road).",
      "Pale European skin (NOT tan, NOT olive, NOT dark). Black hair pulled",
      "back severely from her face, gathered at the back of her skull in a",
      "tight knot — NO loose strands, NO wisps, NO bangs. Sharp dark-brown",
      "eyes, hard and certain. Strong cheekbones, a thin unsmiling mouth.",
      "At her throat, a small carved BONE-AND-SILVER PENDANT on a fine chain",
      "(a single distinguishing piece, not flashy).",
      "",
      // Costume — dark hooded robe
      "She wears a LONG DARK HOODED ROBE of charcoal-grey wool reaching to",
      "her ankles, the hood pushed back off her head (face fully visible),",
      "the robe tied at her waist with a simple dark leather cord. Plain",
      "dark leather sandals on her feet. NO armor, NO chainmail, NO jewelry",
      "beyond the bone-and-silver pendant. The robe is travel-stained and",
      "lived-in — a working sorceress's kit, not a court regalia.",
      "",
      // Combat stance — staff two-handed guard
      "She is in active COMBAT STANCE: her IRON-SHOD QUARTERSTAFF is held",
      "in a TWO-HANDED GUARD, braced DIAGONALLY across her body — her right",
      "hand high near her right shoulder, her left hand low near her left",
      "hip, the iron-shod butt of the staff close to the ground on her left",
      "side. Knuckles whitened on the haft. Her body is coiled and ready —",
      "she will either swing the staff in a strike or release a Word of",
      "Power. Her free fingers (left index finger lifting slightly off the",
      "haft) trace the start of a faint glowing SIGIL in the air, with",
      "subtle wisps of cold blue-white arcane light gathering around the",
      "fingertip. Lead foot forward (her right foot), weight low. Eyes hard",
      "and locked on an unseen opponent ahead. NOT casual, NOT a portrait,",
      "NOT the staff resting at her side or planted upright like a walking",
      "stick — she is mid-fight, the staff committed to a guard.",
    ].join("\n"),
  },
  {
    id: "bandit_brute",
    description: [
      // Identity — heavyset scarred warrior
      "A HEAVYSET SCARRED WARRIOR MAN in his mid-thirties — broad as an",
      "ox, approximately 6'1\", thick chest, thick shoulders, powerful arms",
      "and legs. Olive-toned Mediterranean skin (NOT tan in the sunburned",
      "sense — naturally olive, weathered by years of campaigning). Shaved",
      "scalp, sun-darkened skin showing on the bare skull. A short black",
      "beard streaked with grey. Hard dark-brown eyes, a deep scar running",
      "from his right brow across his nose down to his left cheek. A",
      "missing upper-right canine tooth visible when his lip lifts.",
      "",
      // Costume — dirty mail + half-helm with gambeson + dark arming cap
      // under the helm (helm-darkening rule: a polished iron half-helm on
      // a white backdrop comes back transparent from rembg, same class of
      // bug as `feedback_blade_tone_rule` and `feedback_chainmail_gambeson_rule`).
      "He wears a SHORT-SLEEVED CHAINMAIL HAUBERK OVER A BLACK QUILTED",
      "GAMBESON — the mail dirty and travel-stained, the black gambeson",
      "padding visible at the cuffs, neckline, and skirt edges so no white",
      "background bleeds through the rings. He wears a BLACKENED IRON",
      "HALF-HELM (open-faced, covering the top and back of his skull but",
      "leaving the face fully visible) — the iron is DARK OXIDIZED",
      "GREY-BLACK, never polished, never silver-bright, never chrome. A",
      "DARK BROWN WOOL ARMING CAP is visible underneath the helmet rim at",
      "his temples and the back of his neck — the helmet sits on dark",
      "padding so no white backdrop bleeds through the metal. Heavy leather",
      "breeches, scuffed iron-shod boots to mid-calf. A wide leather belt",
      "at his waist. NO cloak, NO surcoat.",
      "",
      // Combat stance — CONAN-LIKE TWO-HANDED SWORD held forward in a
      // committed two-handed middle guard, point angled toward an unseen
      // opponent at SCREEN-LEFT. Earlier prompts placed the blade
      // OVER-SHOULDER, which Grok kept hallucinating as an axe / pole-
      // arm; the forward-guard stance disambiguates the silhouette and
      // also makes the screen-left orientation unambiguous (blade tip is
      // literally drawn at the left edge of the frame).
      "He is in active COMBAT STANCE: a CONAN-LIKE TWO-HANDED SWORD is",
      "GRIPPED in BOTH HANDS in a TWO-HANDED MIDDLE GUARD, the BLADE HELD",
      "OUT IN FRONT of his body parallel to the ground at chest height,",
      "the POINT of the blade aimed STRAIGHT TO THE LEFT side of the frame",
      "toward an unseen opponent at screen-left. The weapon is a",
      "HISTORICALLY-PROPORTIONED European two-handed sword in the style of",
      "the Robert E. Howard / Frank Frazetta Conan paintings — a long",
      "straight DOUBLE-EDGED steel blade roughly four to five feet long but",
      "only 2 to 2.5 inches (5–6 cm) WIDE at the base, tapering smoothly",
      "to a sharp point, with a central fuller running most of its length,",
      "a leather-wrapped two-handed grip, a heavy steel pommel, and a long",
      "straight crossguard at the base of the blade. The blade is",
      "REALISTICALLY SLENDER and gracefully tapered — NOT oversized, NOT a",
      "slab, NOT anime-thick, NOT comically wide, NOT a giant fantasy",
      "buster sword, NOT a manga-style cleaver. The blade and crossguard",
      "are CLEARLY VISIBLE, SOLID, OPAQUE STEEL — NOT transparent, NOT",
      "translucent, NOT glowing, NOT magical.",
      "",
      // Body orientation — every redundancy locks screen-LEFT facing.
      "BODY ORIENTATION (critical): his entire body is ORIENTED toward the",
      "LEFT side of the frame. His hips, shoulders, and chest face the left",
      "edge. His EYES look STRAIGHT TO THE LEFT, locked on the unseen",
      "opponent at screen-left. His LEAD FOOT (the foot closer to the",
      "opponent) is his LEFT FOOT, planted forward toward the LEFT edge of",
      "the frame; his RIGHT FOOT is the rear foot, planted further to the",
      "RIGHT, weight loaded low and back. His RIGHT HAND grips the pommel",
      "of the sword near his right hip; his LEFT HAND grips the blade-end",
      "of the hilt near the crossguard, extended out toward screen-left.",
      "The point of the sword is at the LEFT EDGE of the frame. He is NOT",
      "facing the viewer, NOT facing right, NOT in three-quarter portrait —",
      "he is in PROFILE-LEANING-LEFT, body bladed toward screen-left,",
      "weight committed forward toward the unseen left-side opponent.",
      "",
      "NOT casual, NOT a portrait, NOT the sword resting on the ground or",
      "hanging at his side, NOT the sword over his shoulder. NOT a maul,",
      "NOT a hammer, NOT a club, NOT a polearm, NOT an axe — specifically",
      "a CONAN-LIKE TWO-HANDED STEEL SWORD held forward in middle guard,",
      "point aimed at an opponent at screen-left.",
      "",
      // Framing override — Korm's wide forward stance keeps cropping his
      // feet. Force smaller figure scale and explicit boot-margin.
      "FRAMING OVERRIDE for this character: the figure fills only 70-78%",
      "of the frame vertically (smaller than the other characters because",
      "his stance is wider and lower). His ENTIRE BODY from the crown of",
      "the helmet at the top to the SOLES of his iron-shod boots at the",
      "bottom must be FULLY VISIBLE inside the frame, with at least a",
      "three-finger-width margin of pure white BELOW his boots and a",
      "two-finger-width margin of pure white above his helmet. Both feet",
      "and both boots are visible, planted on the white backdrop. NOTHING",
      "is cropped off the bottom edge — never the boots, never the feet,",
      "never the toes. The horizontal blade extending toward screen-left",
      "must also fit fully inside the frame; if positioning the blade",
      "would push the body outward, render the figure smaller. NEVER crop",
      "the blade tip, NEVER crop the pommel, NEVER crop the boots.",
      "",
      // Blade tone — DARK steel so rembg sees the blade against the
      // white backdrop. Otherwise a polished mirror-bright blade is the
      // same luminance as the studio white and gets erased by the alpha
      // cut. See `feedback_blade_tone_rule`.
      "The blade is BURNISHED DARK STEEL — a deep oiled grey-blue tone,",
      "blacked against rust the way a mercenary keeps a weapon in the",
      "field, with a streak of fresh red blood running along one edge and",
      "small smears of dried blood on the flat. The blade is VISIBLY",
      "DARKER than the white studio backdrop — never mirror-bright, never",
      "silver-white, never polished to chromed gleam. The contrast between",
      "blade and backdrop must be high enough that the eye can read the",
      "blade as a distinct dark shape against the white.",
    ].join("\n"),
  },
];

// ── Generation ──────────────────────────────────────────────────────

function buildPrompt(b: BanditSpec): string {
  return [STYLE_ANCHOR, "", b.description, "", UGLY_MEAN_OVERLAY, "", FRAMING].join("\n");
}

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

async function forgeBandit(
  b: BanditSpec,
  snapshotId: string | undefined,
): Promise<{ generated: number; failed: number }> {
  const outDir = path.join(root, "public", "art", "npcs", b.id, "master");
  fs.mkdirSync(outDir, { recursive: true });
  const prompt = buildPrompt(b);

  const promptPath = path.join(outDir, "_prompt.txt");
  fs.writeFileSync(promptPath, prompt + "\n");

  const startIndex = nextStartingIndex(outDir);
  const endIndex = startIndex + candidateCount - 1;

  console.log("");
  console.log(`── ${b.id} ──`);
  console.log(`  Output dir: ${outDir}`);
  console.log(`  Naming: v${startIndex}…v${endIndex}`);
  console.log(`  Cost this subject: ~$${(candidateCount * 0.07).toFixed(2)}`);

  let generated = 0;
  let failed = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    const outPath = path.join(outDir, `v${i}.png`);
    console.log(`  generating candidate v${i}…`);
    try {
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
        defaultSizeClass: "C",
      });
      generated++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ v${i} FAILED: ${msg}`);
    }
  }
  return { generated, failed };
}

async function main(): Promise<void> {
  const targetIds = onlyArg
    ? new Set(onlyArg.slice("--only=".length).split(",").map((s) => s.trim()))
    : null;
  const subjects = targetIds
    ? BANDITS.filter((b) => targetIds.has(b.id))
    : BANDITS;
  if (subjects.length === 0) {
    console.error(`ERROR: --only filter matched no subjects. Valid: ${BANDITS.map((b) => b.id).join(", ")}`);
    process.exit(1);
  }

  console.log(`Forging ${subjects.length} bandit subject(s) × ${candidateCount} candidates each`);
  console.log(`Total estimated cost: ~$${(subjects.length * candidateCount * 0.07).toFixed(2)}`);

  let snapshotId: string | undefined;
  try {
    snapshotId = (await loadStandingRules()).snapshotId;
  } catch {
    snapshotId = undefined;
  }

  let totalGenerated = 0;
  let totalFailed = 0;
  for (const b of subjects) {
    const r = await forgeBandit(b, snapshotId);
    totalGenerated += r.generated;
    totalFailed += r.failed;
  }

  console.log("");
  console.log("─── Grand Summary ───");
  console.log(`Generated: ${totalGenerated}`);
  console.log(`Failed:    ${totalFailed}`);
  if (totalGenerated > 0) {
    console.log(`Approx cost this run: $${(totalGenerated * 0.07).toFixed(2)}`);
    console.log("");
    console.log("Open public/art/npcs/{bandit_blade,bandit_witch,bandit_brute}/master/");
    console.log("and pick the keepers. Reject any sprite where the weapon is");
    console.log("on-shoulder, hanging loose, pointed at the ground, or where the");
    console.log("figure reads as 'casual/portrait' rather than mid-fight.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
