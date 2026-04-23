// ========================================================================
// LIVING EAMON — QA Church Background
//
// Generates the church interior scene used as the backdrop on the QA page
// (public/hero-masters/qa.html). Reuses Grok Imagine Pro with a landscape
// aspect ratio and NO background removal (it's a scene, not a sprite).
//
// Usage:  npx tsx scripts/forge-qa-church-bg.ts [--force]
// Cost:   ~$0.07 one-time.
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

const outDir = path.join(root, "public", "hero-masters");
const outPath = path.join(outDir, "qa-church-bg.jpg");

const force = process.argv.includes("--force");

const PROMPT = [
  "Painted-realism scene in the spirit of Frank Frazetta and Gerald Brom.",
  "Interior of the Church of Perpetual Life — a cold, silent, high-vaulted",
  "stone chamber with tall narrow arched windows admitting pale grey light,",
  "heavy stone flagstone floor, a simple dark stone altar in the background,",
  "tall iron candelabra with guttering candles, carved stone pillars",
  "receding into shadow on either side, worn flagstones in the foreground.",
  "Grim, austere, hushed mood. Empty of figures — no people, no priests,",
  "no hero. Ready to be used as a backdrop for compositing character",
  "sprites in front of. Muted desaturated palette, stone greys, muted",
  "candle amber, deep shadow. Cinematic wide composition. No text, no",
  "borders, no watermarks. Full-bleed.",
].join(" ");

async function main(): Promise<void> {
  if (fs.existsSync(outPath) && !force) {
    console.log(`Church bg already exists at ${outPath} — skipping (use --force to regenerate)`);
    return;
  }
  console.log("Generating church interior background via grok-imagine-image-pro…");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt: PROMPT,
    response_format: "b64_json",
    aspect_ratio: "16:9",
  } as any);
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) {
    console.error("ERROR: no image data returned");
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  // Save directly as JPEG bytes (xAI returns JPEG in b64_json for images).
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`✓ wrote ${outPath} (${sizeKb} KB)`);
  console.log("Cost this run: ~$0.07");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
