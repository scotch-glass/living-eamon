// ========================================================================
// LIVING EAMON — Universal corpse-marker forge (2026-05-09)
//
// Forges six (6) variations of the canonical fresh-skull-on-an-old-pack
// marker that replaces every fallen combatant in the Combat Arena. The
// marker is universal — same image set used for every dying character —
// so the variations exist purely to break visual repetition (some have
// an eye, some an ear, some bloody, some plain, with slight pack-color
// drift).
//
// Per Scotch's locked prompt 2026-05-09. Prompt structure is identical
// across variations; only the skull-detail and pack-color sentences
// differ. Pure white background, ready for rembg.
//
// Output:
//   public/art/corpse-marker/v1.png  (one eye, brown pack, faint blood)
//   public/art/corpse-marker/v2.png  (plain skull, dark pack, faint blood)
//   public/art/corpse-marker/v3.png  (ear remnant, sandy pack, light blood)
//   public/art/corpse-marker/v4.png  (plain skull, reddish pack, blood pool)
//   public/art/corpse-marker/v5.png  (eye + jaw flesh, olive pack, dry blood)
//   public/art/corpse-marker/v6.png  (plain skull, gray pack, dried streak)
//   public/art/corpse-marker/_prompt.txt  (verbatim prompts for the record)
//
// Each PNG is captured into _sprite-metadata.json with isCorpse: true and
// no livingSpriteRef (since this is the universal marker, not per-NPC).
//
// Usage:
//   npx tsx scripts/forge-corpse-marker.ts          # forge all 6
//   npx tsx scripts/forge-corpse-marker.ts --only=v3  # re-roll just v3
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import sharp from "sharp";
import { grokImageToTransparentPng } from "../lib/imageProcessing";
import { recordPromptForSprite } from "../lib/art/recordPromptForSprite";

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

// ── Prompt variations ───────────────────────────────────────────────
//
// Each entry is a single Grok-Imagine-Pro prompt. Structure is held
// identical to the locked base prompt; only the SKULL_DETAIL and
// PACK_DETAIL clauses change between entries so variations are
// recognizably from the same set.

const SHARED_TAIL =
  " Earthy, Robert E Howard, painterly palette: bone white, leather brown," +
  " dull bronze, dust, dried-blood maroon. Style: Frazetta/Brom" +
  " Hyborian-Age painted realism, weathered but iconic, slightly" +
  " desaturated. Pure clean white background. No shadow, no ground line," +
  " no border, no text, no labels, no characters, no other objects." +
  " Square 1024×1024 composition, the image fills 70% of the frame," +
  " viewed from a slightly elevated three-quarter angle as if a passing" +
  " scout were looking down at what was left.";

interface Variation {
  slug: string;
  description: string;
  body: string;
}

const VARIATIONS: Variation[] = [
  {
    slug: "v1",
    description: "one eye, brown leather pack, faint blood smear",
    body:
      "A fresh human skull resting atop an old, weathered adventurer's leather pack, fallen on the ground. The skull is bone-white, recently exposed — one eye still in the socket in deep shadow, jaw slightly agape, a little flesh still remaining. The pack is well-traveled brown leather, cracked at the seams with dark iron buckles tarnished to near-black. A faint dark blood smear runs down the leather and pools under the skull's jaw — present, not lurid." +
      SHARED_TAIL,
  },
  {
    slug: "v2",
    description: "plain skull, dark brown pack, faint streak",
    body:
      "A fresh human skull resting atop an old, weathered adventurer's leather pack, fallen on the ground. The skull is plain bone-white, picked clean — both eye sockets in deep shadow, jaw set, no flesh remaining. The pack is well-traveled dark brown leather, almost black at the creases, cracked at the seams with dull iron buckles tarnished to near-black. A faint dark blood streak runs down one strap — present, not lurid." +
      SHARED_TAIL,
  },
  {
    slug: "v3",
    description: "leathery ear remnant, sandy-tan pack, light blood",
    body:
      "A fresh human skull resting atop an old, weathered adventurer's leather pack, fallen on the ground. The skull is bone-white, recently exposed — both eye sockets in deep shadow, jaw slightly agape, a leathery remnant of one ear still clinging to the side of the skull, a little dried sinew at the temple. The pack is well-traveled sandy-tan leather, cracked at the seams with dark iron buckles tarnished to near-black. A light dark blood smear runs down the side of the leather — present, not lurid." +
      SHARED_TAIL,
  },
  {
    slug: "v4",
    description: "plain skull, reddish-brown pack, dried blood pool",
    body:
      "A fresh human skull resting atop an old, weathered adventurer's leather pack, fallen on the ground. The skull is plain bone-white, recently exposed — both eye sockets in deep shadow, jaw open and skewed, no flesh remaining. The pack is well-traveled reddish-brown leather, cracked at the seams with dark iron buckles tarnished to near-black. A dark dried blood pool spreads under the skull's jaw and seeps down the leather — present, not lurid." +
      SHARED_TAIL,
  },
  {
    slug: "v5",
    description: "eye + jaw flesh, olive-brown pack, no fresh blood",
    body:
      "A fresh human skull resting atop an old, weathered adventurer's leather pack, fallen on the ground. The skull is bone-white, recently exposed — one eye still in the socket in deep shadow, jaw slightly agape with leathery flesh still clinging to the lower jaw and chin, dried sinew at the joint. The pack is well-traveled olive-brown leather, cracked at the seams with dark iron buckles tarnished to near-black. Old dark blood has dried into the leather — long since dry, no fresh smear." +
      SHARED_TAIL,
  },
  {
    slug: "v6",
    description: "plain skull, gray-brown iron-banded pack, dried streak",
    body:
      "A fresh human skull resting atop an old, weathered adventurer's leather pack, fallen on the ground. The skull is plain bone-white, picked clean — both eye sockets in deep shadow, jaw closed, no flesh remaining. The pack is well-traveled gray-brown leather with a corner reinforced by riveted iron banding, cracked at the seams with dark iron buckles tarnished to near-black. A dried dark blood streak runs from the skull's temple down across the leather — long ago, not fresh." +
      SHARED_TAIL,
  },
];

// ── CLI ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith("--only="));
const onlySlug = onlyArg ? onlyArg.slice("--only=".length).trim() : null;

const targets = onlySlug
  ? VARIATIONS.filter((v) => v.slug === onlySlug)
  : VARIATIONS;

if (targets.length === 0) {
  console.error(`ERROR: --only=${onlySlug} did not match any variation slug`);
  console.error(`Valid slugs: ${VARIATIONS.map((v) => v.slug).join(", ")}`);
  process.exit(1);
}

// ── Grok call ───────────────────────────────────────────────────────

async function callGrokImaginePro(prompt: string): Promise<string> {
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "1:1",
    resolution: "2k",
  } as Parameters<typeof grok.images.generate>[0] & {
    aspect_ratio: string;
    resolution: string;
  });
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok Imagine returned no image data");
  return b64;
}

// ── Output ──────────────────────────────────────────────────────────

const outDir = path.join(root, "public", "art", "corpse-marker");
fs.mkdirSync(outDir, { recursive: true });

// Persist all six prompts verbatim for the record. Overwritten on each
// run so the file always reflects the current source-of-truth prompts.
const promptManifest = VARIATIONS.map(
  (v) => `── ${v.slug} · ${v.description} ──\n${v.body}\n`,
).join("\n");
fs.writeFileSync(path.join(outDir, "_prompt.txt"), promptManifest);

// ── Forge loop ──────────────────────────────────────────────────────

async function forgeOne(v: Variation): Promise<void> {
  const outPath = path.join(outDir, `${v.slug}.png`);
  console.log(`\n[corpse-marker ${v.slug}] ${v.description}`);
  try {
    console.log(`  generating…`);
    const b64 = await callGrokImaginePro(v.body);
    console.log(`    raw image received (${Math.round((b64.length * 0.75) / 1024)} KB)`);
    console.log(`    running rembg…`);
    const pngBuffer = await grokImageToTransparentPng(b64);
    // Trim transparent padding so the rendered 120 px-tall box maps 1:1
    // to visible content. Without this, ~5–20% of empty canvas around
    // the skull/pack creates a visible gap between stacked corpses
    // because CombatArena.tsx's 80%/20%-overlap math treats the full
    // box as content. Threshold 8 to match rembg edge fuzz.
    const trimmed = await sharp(pngBuffer).trim({ threshold: 8 }).toBuffer();
    fs.writeFileSync(outPath, trimmed);
    const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  ✓ wrote ${outPath} (${sizeKb} KB)`);

    const relPath = `/art/corpse-marker/${v.slug}.png`;
    await recordPromptForSprite({
      spritePath: relPath,
      prompt: v.body,
      // Universal marker — no per-character living-sprite reference.
      defaultSizeClass: "C",
      isCorpse: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${v.slug} FAILED: ${msg}`);
  }
}

async function main(): Promise<void> {
  console.log(`Forging ${targets.length} corpse-marker variation(s)…`);
  for (const v of targets) {
    await forgeOne(v);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
