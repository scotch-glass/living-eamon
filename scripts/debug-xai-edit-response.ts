// One-off diagnostic. Posts a single topless-Vivian /v1/images/edits call
// and prints the FULL response body so we can see what xAI is actually
// rejecting (or not). No images written to disk regardless of outcome.

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
if (!XAI_KEY) { console.error("No XAI key"); process.exit(1); }

const MASTER_PATH = path.join(root, "public", "art", "npcs", "vivian", "master", "vivian_master_v1.png");
const masterB64 = fs.readFileSync(MASTER_PATH).toString("base64");
const masterDataUrl = `data:image/png;base64,${masterB64}`;

const TEST_PROMPT = `Oil painting of a young woman, painterly Frazetta style, topless, bare breasts, small breasts, three-quarter view, neutral expression, soft studio lighting, white background.`;

async function probe(label: string, body: object): Promise<void> {
  console.log(`\n── ${label} ──`);
  console.log("Request body keys:", Object.keys(body).join(", "));
  const res = await fetch("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_KEY}`,
    },
    body: JSON.stringify(body),
  });
  console.log("HTTP status:", res.status);
  const text = await res.text();
  console.log("Response body (first 2000 chars):");
  console.log(text.slice(0, 2000));
}

async function main(): Promise<void> {
  // Probe 1: same shape we've been using (image as object {url, type})
  await probe("PROBE 1 — image as {url, type} object", {
    model: "grok-imagine-image-pro",
    prompt: TEST_PROMPT,
    response_format: "b64_json",
    aspect_ratio: "3:4",
    resolution: "2k",
    image: { url: masterDataUrl, type: "image_url" },
  });

  // Probe 2: image as bare data URL string
  await probe("PROBE 2 — image as bare data URL string", {
    model: "grok-imagine-image-pro",
    prompt: TEST_PROMPT,
    response_format: "b64_json",
    aspect_ratio: "3:4",
    image: masterDataUrl,
  });

  // Probe 3: image_url field name (OpenAI-edits uses 'image' as file)
  await probe("PROBE 3 — field name image_url instead of image", {
    model: "grok-imagine-image-pro",
    prompt: TEST_PROMPT,
    response_format: "b64_json",
    aspect_ratio: "3:4",
    image_url: masterDataUrl,
  });

  // Probe 4: SAME prompt but on /generations (no image ref) — does topless
  // text-to-image work at all on the API?
  console.log("\n── PROBE 4 — topless text-to-image on /v1/images/generations ──");
  const r4 = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image-pro",
      prompt: TEST_PROMPT,
      response_format: "b64_json",
      aspect_ratio: "3:4",
      resolution: "2k",
    }),
  });
  console.log("HTTP status:", r4.status);
  const t4 = await r4.text();
  console.log("Response body (first 1000 chars):");
  console.log(t4.slice(0, 1000));
}

main().catch((e) => { console.error(e); process.exit(1); });
