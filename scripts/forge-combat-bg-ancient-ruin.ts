// ========================================================================
// LIVING EAMON — Combat background: ancient ruin in the woods
//
// Generates a scene background used behind the 3v3 combat sprites in the
// /dev/combat-test arena (and later, the live combat screen). Per the
// project image rules: scenes are saved as JPEG directly with NO rembg
// (rembg is sprite-only, white-background → transparent PNG).
//
// Usage:  npx tsx scripts/forge-combat-bg-ancient-ruin.ts [--force] [--count=N]
// Cost:   ~$0.07 per candidate. Default 4 candidates ≈ $0.28.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

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
const force = args.includes("--force");
const countArg = args.find((a) => a.startsWith("--count="));
const candidateCount = countArg ? parseInt(countArg.slice("--count=".length), 10) : 4;

const outDir = path.join(root, "public", "art", "scenes", "combat", "ancient-ruin-woods");

const PROMPT = [
  "Painted-realism scene in the spirit of Frank Frazetta and Gerald Brom —",
  "oil-painting brushwork, warm cinematic lighting, sword-and-sorcery cover",
  "art mood. NOT photographic, NOT CGI, NOT cartoon, NOT anime.",
  "",
  "Subject: an ANCIENT STONE RUIN deep in a temperate northern WOODLAND.",
  "The ruin is the remnant of a Thurian-Age temple or watchtower — massive",
  "weather-worn limestone blocks, several broken columns toppled or",
  "leaning, a half-collapsed archway in the middle distance, fragments of",
  "carved bas-relief glyphs on the stones almost worn smooth by centuries",
  "of rain. Thick mossy growth has crept up the lower stones; pale lichen",
  "marbles the upper faces. A few stubborn flowering vines climb a",
  "standing column. The flagstones of the ruin's floor are cracked and",
  "uneven, partly buried under fallen leaves and forest litter. Tree roots",
  "have pushed up between the stones in places.",
  "",
  "Surroundings: dense old-growth FOREST presses in on three sides — tall",
  "straight oak and beech trunks vanishing into the canopy gloom, dappled",
  "shafts of slanting golden afternoon sunlight breaking through the leaf-",
  "ceiling and falling across the moss and stone, ferns and undergrowth",
  "thick around the ruin's edges, a thin ground-mist hugging the forest",
  "floor. Distant trees fade to soft blue-green atmospheric haze.",
  "",
  "Foreground: an open patch of mossy stone-flagged GROUND extending to",
  "the bottom edge of the frame — clear enough to stand and fight on, the",
  "ground reading as a flat fightable surface, with broken stone debris",
  "scattered to either side. NO rocks or columns blocking the central",
  "third of the foreground; the central foreground is open and ready to",
  "have combat sprites composited on top of it.",
  "",
  "Composition: cinematic LANDSCAPE 16:9, eye-level horizon roughly two-",
  "thirds up the frame, the ruin's archway centered in the middle distance",
  "behind the open foreground floor. Painted as a backdrop intended to",
  "have humanoid combat figures composited in front of it — the central",
  "foreground band is uncluttered. EMPTY OF FIGURES — NO people, NO",
  "warriors, NO bandits, NO animals, NO monsters in the scene; just the",
  "ruin and the woods.",
  "",
  "Mood: ancient, watchful, hushed but sunlit — a place of forgotten",
  "violence that nature has slowly reclaimed. Palette: mossy greens, warm",
  "weathered limestone greys and tans, deep umber forest shadow, golden",
  "afternoon highlights. Slightly desaturated and atmospheric so",
  "compositing characters in front read as the focal point.",
  "",
  "NO text, NO borders, NO watermarks, NO UI overlays. Full-bleed.",
].join(" ");

async function callGrokImaginePro(prompt: string): Promise<string> {
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "16:9",
  } as Parameters<typeof grok.images.generate>[0] & { aspect_ratio: string });
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok Imagine returned no image data");
  return b64;
}

function nextStartingIndex(): number {
  if (!fs.existsSync(outDir)) return 1;
  const existing = fs
    .readdirSync(outDir)
    .map((name) => /^v(\d+)\.jpg$/.exec(name))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => parseInt(m[1]!, 10));
  if (existing.length === 0) return 1;
  return Math.max(...existing) + 1;
}

async function main(): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true });
  const promptPath = path.join(outDir, "_prompt.txt");
  fs.writeFileSync(promptPath, PROMPT + "\n");
  console.log(`Prompt written to ${promptPath}`);

  // If force, blow away existing candidates so we re-number from v1.
  if (force) {
    for (const f of fs.readdirSync(outDir)) {
      if (/^v\d+\.jpg$/.test(f)) fs.unlinkSync(path.join(outDir, f));
    }
  }

  const startIndex = nextStartingIndex();
  const endIndex = startIndex + candidateCount - 1;
  console.log(`Forging ${candidateCount} ancient-ruin-woods candidates (v${startIndex}…v${endIndex})`);
  console.log(`Output dir: ${outDir}`);
  console.log(`Cost: ~$${(candidateCount * 0.07).toFixed(2)}`);
  console.log("");

  let generated = 0;
  let failed = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    const outPath = path.join(outDir, `v${i}.jpg`);
    try {
      console.log(`  generating v${i}…`);
      const b64 = await callGrokImaginePro(PROMPT);
      fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
      const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`  ✓ wrote ${outPath} (${sizeKb} KB)`);
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
  console.log(`Open ${outDir} and pick the keeper.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
