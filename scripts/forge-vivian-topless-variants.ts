// ========================================================================
// LIVING EAMON — Vivian topless seductive variants (LoRA training data)
//
// Generates 10 topless seductive variants of Vivian for the Pony LoRA
// training set. Mix of close-ups (face identity), waist-up shots (chest
// + face), and reclining/seated full-body (whole-body data). All use
// xAI image-to-image with the locked master as identity anchor.
//
// Costume difference from forge-vivian-poses.ts: the leather VEST is
// REMOVED. Bare breasts visible. Leather pants, moccasins, paired belts
// with sword + pouches, and the silver locket all stay (locket is the
// identity anchor at the throat). Tight high ponytail unchanged.
//
// Output → scripts/lora/vivian/training-set/v51.png … v60.png + captions.
// Captions tagged with topless / bare breasts / nipples / rating_explicit
// per the kohya booru schema in scripts/lora/vivian/CAPTIONS.md.
//
// Usage:
//   npx tsx scripts/forge-vivian-topless-variants.ts             # all 10
//   npx tsx scripts/forge-vivian-topless-variants.ts --only=51,55  # subset
//   npx tsx scripts/forge-vivian-topless-variants.ts --force       # overwrite
//
// Cost: 10 × $0.07 = $0.70.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const MASTER_PATH = path.join(root, "public", "art", "npcs", "vivian", "master", "vivian_master_v1.png");
const OUT_DIR = path.join(root, "scripts", "lora", "vivian", "training-set");

if (!fs.existsSync(MASTER_PATH)) {
  console.error(`ERROR: locked master not found at ${MASTER_PATH}`);
  process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlySet = onlyArg
  ? new Set(onlyArg.slice("--only=".length).split(",").map((s) => parseInt(s, 10)))
  : null;

// ── Locked anchors (same as forge-vivian-poses.ts, costume modified) ─

const LOCKED_STYLE = [
  "OIL PAINTING in the classic oil-painted fantasy-illustration style of",
  "Frank Frazetta, Gerald Brom, Boris Vallejo — visible painterly brush",
  "texture, warm romantic lighting, painted edges. NOT photographic, NOT",
  "3D render, NOT cartoon, NOT cel-shaded, NOT anime, NOT comic-book.",
  "Tasteful painted nudity in the Frazetta tradition — sensual, romantic,",
  "dignified, never crude or pornographic.",
].join(" ");

const LOCKED_IDENTITY = [
  "Subject: Vivian — a 20-year-old young adult woman, petite (5'2\"),",
  "athletic dancer-acrobat build with subtle visible muscle tone (toned",
  "bare arms with deltoid and bicep definition, faint flat-abdomen tone,",
  "defined calves and gluteal tone), narrow waist, narrow but feminine",
  "hips, small perky breasts (small/high/pert — NOT large, NOT busty).",
  "Fair pale skin with the faintest warm undertone (NOT ashen, NOT olive,",
  "NOT tan). Chestnut-auburn hair (warm brown with subtle copper-red glints)",
  "pulled back into a TIGHT HIGH PONYTAIL secured at the crown with a thin",
  "black leather cord, the bound length falling between her shoulder blades.",
  "Hair smooth and clean off her face — NO loose strands, NO bangs, NO wisps.",
  "Bright green almond-shaped eyes slightly upturned at the outer corners.",
  "Simple small silver ear studs. NO tattoos, NO moles, NO freckles, NO",
  "birthmarks, NO scars — clean unblemished skin. At her throat a fine",
  "silver chain holding a small closed silver locket.",
].join(" ");

// Costume: VEST REMOVED, everything else stays.
const LOCKED_COSTUME = [
  "She is TOPLESS — bare-breasted, no garment of any kind covering her",
  "torso, shoulders, or arms. Her small perky breasts are fully visible,",
  "with anatomically-correct soft pink areolae and small nipples,",
  "unobscured. Her sleeveless leather vest from her usual thief outfit",
  "has been removed; the rest of her gear remains: tight full-length",
  "black LEATHER PANTS reaching to her ankles, BLACK LEATHER MOCCASINS",
  "(soft kid-leather slippers, ankle-high, with NO heels and NO hard",
  "sole, drawstring laces tucked cleanly under the top edge), a PAIRED",
  "belt rig of dark-brown leather (one narrow at the waist, one wider",
  "slung lower across her hips), a short sword in a plain dark-leather",
  "scabbard at her LEFT hip, and several small dark-leather pouches at",
  "her hips. The silver locket on its fine chain rests against her bare",
  "skin between her collarbones, fully visible above the curve of her",
  "breasts. NO armor, NO cloak, NO hood, NO shirt, NO vest, NO bra, NO",
  "covering of any kind on her upper body.",
].join(" ");

const LOCKED_FRAMING_FULL = [
  "Pose orientation: her body is angled three-quarters toward screen-RIGHT",
  "(ALLY orientation, the same direction the hero faces), feet planted",
  "comfortably on or near the floor. 3:4 vertical portrait. Pure clean",
  "opaque white (#FFFFFF) studio backdrop filling the entire frame. Full",
  "body visible from head to feet, the figure filling 80-87% of the frame",
  "vertically with feet at the bottom edge and modest empty white space",
  "above her head. Even soft warm studio lighting from the upper-left, no",
  "harsh shadows. NO scenery, NO floor, NO ground line, NO shadow, NO",
  "border, NO text, NO other figures.",
].join(" ");

const LOCKED_FRAMING_WAIST_UP = [
  "Framing: WAIST-UP shot — visible from the top of her head down to",
  "approximately her hips/upper-thighs. Her body is angled three-quarters",
  "toward screen-RIGHT. 3:4 vertical portrait. Pure clean opaque white",
  "(#FFFFFF) studio backdrop filling the entire frame. The figure fills",
  "the full vertical of the frame from chin level near top to hips at",
  "bottom, with her face / chest the dominant compositional weight. Even",
  "soft warm studio lighting from the upper-left, no harsh shadows. NO",
  "scenery, NO ground line, NO shadow, NO border, NO text, NO other figures.",
].join(" ");

const LOCKED_FRAMING_CLOSEUP = [
  "Framing: CLOSE-UP head-and-shoulders portrait — visible from the top",
  "of her head down to mid-chest (just below the breasts). Her body is",
  "angled three-quarters toward screen-RIGHT, head turned more nearly",
  "toward the viewer. 3:4 vertical portrait. Pure clean opaque white",
  "(#FFFFFF) studio backdrop filling the entire frame. The face is the",
  "dominant compositional weight — eyes and lips clearly readable. Even",
  "soft warm studio lighting from the upper-left, no harsh shadows. NO",
  "scenery, NO ground line, NO shadow, NO border, NO text, NO other figures.",
].join(" ");

// ── Pose specs ──────────────────────────────────────────────────────

type Framing = "closeup" | "waist_up" | "full_body";

interface PoseSpec {
  id: number;
  slug: string;
  framing: Framing;
  promptPose: string;
  promptExpression: string;
  captionPose: string;
  captionExpression: string;
  captionFraming?: string;
}

const POSES: PoseSpec[] = [
  // ── Close-ups (face identity + bare upper chest) ─────────────────
  { id: 51, slug: "closeup-soft-gaze",
    framing: "closeup",
    promptPose: "Head and shoulders only, body softly angled three-quarters toward screen-right. Her near (left) shoulder slightly forward; her far shoulder back. The top of her bare upper chest visible at the bottom of the frame.",
    promptExpression: "Lips slightly parted, eyes meeting the viewer's directly with a soft come-hither warmth, head barely tilted to her right.",
    captionPose: "upper body, head tilt",
    captionExpression: "looking at viewer, parted lips, seductive",
    captionFraming: "portrait, head and shoulders, close-up" },
  { id: 52, slug: "closeup-hand-at-jaw",
    framing: "closeup",
    promptPose: "Head and shoulders. Her near (left) hand raised, fingertips lightly touching the side of her own jaw, head tilted into the touch.",
    promptExpression: "Eyes downcast, dreamy half-smile.",
    captionPose: "upper body, hand on own face, head tilt",
    captionExpression: "half-closed eyes, looking down, slight smile" },
  { id: 53, slug: "closeup-over-shoulder-coy",
    framing: "closeup",
    promptPose: "Head and bare shoulders, body turned three-quarters AWAY from viewer (toward screen-right) so her bare upper back is shown to the viewer's left, while her head is turned back over her near shoulder to look at the viewer. The line of her bare shoulder and upper back visible.",
    promptExpression: "Coy small smile over the shoulder, eyes locked on viewer.",
    captionPose: "upper body, looking back, from behind, back focus",
    captionExpression: "looking at viewer, smirk, looking back" },
  { id: 54, slug: "closeup-locket",
    framing: "closeup",
    promptPose: "Head, shoulders, and upper chest — frame composition is centered slightly lower than usual so the silver locket at her throat is the visual focus, the curve of her bare upper breasts visible at the bottom of the frame. Her near (left) hand raised with her fingertips lightly touching the silver locket at her throat.",
    promptExpression: "Quiet thoughtful gaze meeting the viewer, very slight smile.",
    captionPose: "upper body, hand at neck, jewelry focus",
    captionExpression: "looking at viewer, slight smile, closed mouth" },

  // ── Waist-up (face + bare chest) ─────────────────────────────────
  { id: 55, slug: "waist-arms-overhead",
    framing: "waist_up",
    promptPose: "Standing relaxed, both arms raised high overhead with fingers loosely interlocked above her head. Her back slightly arched, chest pushed forward, bare breasts naturally lifted by the raised arms. Body three-quarters to screen-right.",
    promptExpression: "Eyes half-closed, contented small smile, head tilted back slightly.",
    captionPose: "standing, arms up, both arms up, stretching, arched back, bare breasts",
    captionExpression: "half-closed eyes, slight smile" },
  { id: 56, slug: "waist-leaning-back-hands",
    framing: "waist_up",
    promptPose: "Sitting on an unseen surface, leaning back with both arms straight behind her, palms flat on the surface for support, chest pushed forward, bare breasts prominently displayed.",
    promptExpression: "Confident half-smile, eyes meeting the viewer.",
    captionPose: "sitting, leaning back, arms behind back, chest out, bare breasts",
    captionExpression: "looking at viewer, smirk" },
  { id: 57, slug: "waist-hand-on-hip-bare",
    framing: "waist_up",
    promptPose: "Standing relaxed, weight on her right leg, her right hand on her right hip, left arm hanging easy at her side. Chest natural and unforced.",
    promptExpression: "Knowing slight smile, eyes meeting the viewer with self-possessed warmth.",
    captionPose: "standing, hand on hip, bare breasts",
    captionExpression: "looking at viewer, slight smile" },
  { id: 58, slug: "waist-pulling-ponytail-aside",
    framing: "waist_up",
    promptPose: "Standing, her near (left) hand reaching back behind her head to pull her tight ponytail forward over her near shoulder, the ponytail visible falling over her bare upper chest.",
    promptExpression: "Eyes meeting the viewer, lips slightly parted, candid.",
    captionPose: "standing, hand in hair, holding own hair, bare breasts",
    captionExpression: "looking at viewer, parted lips" },

  // ── Full body (whole-body nude data, leather pants on) ──────────
  { id: 59, slug: "full-reclining-on-furs",
    framing: "full_body",
    promptPose: "Reclining on her side on what appears to be soft fur (suggested only by texture under her — no scenery beyond an implied warm tone), body length fully extended, hips and shoulders both turned three-quarters toward the viewer (and toward screen-right). Her near elbow propped under her so her upper body is slightly raised. Legs gently bent.",
    promptExpression: "Slow knowing smile, eyes meeting the viewer, head propped on her hand.",
    captionPose: "lying, on side, reclining, leg up, bare breasts",
    captionExpression: "looking at viewer, smile" },
  { id: 60, slug: "full-standing-shifted-weight",
    framing: "full_body",
    promptPose: "Standing full-body, weight all on her right leg, left knee slightly bent and turned in, hip jutted out to her right (screen-right), her near (left) hand resting lightly on her hip, far arm hanging loose. Body angled three-quarters to screen-right.",
    promptExpression: "Confident half-smile, eyebrow slightly raised, eyes meeting the viewer.",
    captionPose: "standing, hand on hip, contrapposto, bare breasts",
    captionExpression: "looking at viewer, smirk" },
];

if (POSES.length !== 10) {
  console.error(`ERROR: pose list has ${POSES.length} entries, expected 10`);
  process.exit(1);
}

// ── Caption builder (booru-style per scripts/lora/vivian/CAPTIONS.md) ───

const TRIGGER = "vivian1";
const CHAR_BASE = "1girl, solo";
const QUALITY = "score_9, score_8_up, score_7_up";
const RATING = "rating_explicit";
const SOURCE = "source_realistic";
const HAIR = "long hair, brown hair, ponytail, high ponytail, single ponytail";
const EYE = "green eyes";
const NUDITY_TAGS = "topless, bare breasts, nipples, small breasts";
const OUTFIT_BELOW = "leather pants, leather belt";
const LIGHTING = "soft lighting, even lighting, studio lighting";
const BACKGROUND = "simple background, white background";

function buildCaption(pose: PoseSpec): string {
  const parts = [
    TRIGGER,
    CHAR_BASE,
    QUALITY,
    RATING,
    SOURCE,
    HAIR,
    EYE,
    pose.captionExpression,
    pose.captionPose,
    pose.captionFraming ?? "",
    NUDITY_TAGS,
    OUTFIT_BELOW,
    LIGHTING,
    BACKGROUND,
  ].filter(Boolean);
  return parts.join(", ");
}

// ── Prompt builder ──────────────────────────────────────────────────

function buildPrompt(pose: PoseSpec): string {
  const framingBlock = pose.framing === "closeup"
    ? LOCKED_FRAMING_CLOSEUP
    : pose.framing === "waist_up"
      ? LOCKED_FRAMING_WAIST_UP
      : LOCKED_FRAMING_FULL;

  return [
    LOCKED_STYLE,
    "",
    LOCKED_IDENTITY,
    "",
    LOCKED_COSTUME,
    "",
    `Pose: ${pose.promptPose}`,
    "",
    `Expression: ${pose.promptExpression}`,
    "",
    framingBlock,
  ].join("\n");
}

// ── xAI image-to-image call ─────────────────────────────────────────

const MASTER_BASE64_DATA_URL = (() => {
  const buf = fs.readFileSync(MASTER_PATH);
  return `data:image/png;base64,${buf.toString("base64")}`;
})();

interface XaiImageResponse {
  data?: { b64_json?: string }[];
  error?: { message?: string };
}

async function callXaiImageEdit(prompt: string): Promise<Buffer> {
  const body = {
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "3:4",
    resolution: "2k",
    image: { url: MASTER_BASE64_DATA_URL, type: "image_url" },
  };

  const res = await fetch("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as XaiImageResponse;
  if (!res.ok) {
    const errMsg = json.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`xAI /images/edits failed: ${errMsg}`);
  }
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("xAI /images/edits returned no image data");
  return Buffer.from(b64, "base64");
}

// ── Main ────────────────────────────────────────────────────────────

async function forgePose(pose: PoseSpec): Promise<void> {
  const idStr = String(pose.id).padStart(2, "0");
  const pngPath = path.join(OUT_DIR, `v${idStr}.png`);
  const txtPath = path.join(OUT_DIR, `v${idStr}.txt`);

  if (fs.existsSync(pngPath) && !force) {
    console.log(`  skip v${idStr} ${pose.slug} (already exists; --force to regenerate)`);
    return;
  }

  console.log(`  generating v${idStr} ${pose.slug} (${pose.framing})…`);
  const buf = await callXaiImageEdit(buildPrompt(pose));

  fs.writeFileSync(pngPath, buf);
  fs.writeFileSync(txtPath, buildCaption(pose) + "\n");
  const sizeKb = Math.round(fs.statSync(pngPath).size / 1024);
  console.log(`  ✓ wrote v${idStr}.png (${sizeKb} KB) + v${idStr}.txt`);
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const toRun = onlySet
    ? POSES.filter((p) => onlySet.has(p.id))
    : POSES;

  console.log(`Vivian topless variants — generating ${toRun.length} pose${toRun.length === 1 ? "" : "s"}`);
  console.log(`Output dir: ${OUT_DIR}`);
  console.log(`Master ref: ${path.relative(root, MASTER_PATH)}`);
  console.log(`Model: grok-imagine-image-pro via /v1/images/edits`);
  console.log(`Cost:  ~$${(toRun.length * 0.07).toFixed(2)} total`);
  console.log("");

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const pose of toRun) {
    const before = fs.existsSync(path.join(OUT_DIR, `v${String(pose.id).padStart(2, "0")}.png`));
    try {
      await forgePose(pose);
      const after = fs.existsSync(path.join(OUT_DIR, `v${String(pose.id).padStart(2, "0")}.png`));
      if (before && !force) skipped++;
      else if (after) generated++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ v${String(pose.id).padStart(2, "0")} ${pose.slug} FAILED: ${msg}`);
    }
  }

  console.log("");
  console.log("─── Summary ───");
  console.log(`Generated: ${generated}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Failed:    ${failed}`);
  if (generated > 0) {
    console.log(`Approx cost this run: $${(generated * 0.07).toFixed(2)}`);
  }
  if (failed > 0) {
    console.log("");
    console.log("Failures may be content moderation. Retry-able with --only=<ids>.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
