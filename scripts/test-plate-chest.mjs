import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

const envRaw = fs.readFileSync(envPath, "utf8");
const envLine = envRaw.split(/\r?\n/).find((l) => l.trim().startsWith("GROK_API_KEY="));
if (!envLine) {
  console.error("ERROR: GROK_API_KEY not found in .env.local");
  process.exit(1);
}
const GROK_API_KEY = envLine
  .slice("GROK_API_KEY=".length)
  .trim()
  .replace(/^["']|["']$/g, "");

if (!GROK_API_KEY) {
  console.error("ERROR: GROK_API_KEY is empty");
  process.exit(1);
}

const PROMPT = `Recreate the classic Ultima Online 2D inventory icon for the Platemail Tunic (plate chest armor), as it appeared in Ultima Online circa 1997-2003. This is a flat 2D game inventory sprite, NOT a 3D render.

CRITICAL STYLE REQUIREMENTS — match the original UO art exactly:
- Pure true black background (#000000), no gradients, no glow, no shadow
- Flat 2D pixel-art illustration style, NOT photorealistic, NOT 3D rendered
- Hard pixel-clean edges, no anti-aliasing blur
- Viewed from a slight elevated front angle (not isometric, almost frontal)
- The item should fill approximately 75% of the square frame, centered

EXACT VISUAL DESCRIPTION of the Ultima Online Platemail Tunic icon:
- A squat, wide breastplate/cuirass shape — wider than it is tall
- Symmetrical left-right with a subtle slight right-lean typical of UO art
- Three to four horizontal articulated plate bands across the chest
- Two shoulder connection points (pauldron tabs) at upper corners
- A vertical center seam running top to bottom
- A slight outward flare at the very bottom (the fauld/tasset connection)
- Small rivets or dots at band intersections

COLOR AND SHADING — match UO's exact shading style:
- Base color: medium steel grey (#8a8a8a to #9a9a9a)
- Highlight color: bright near-white steel (#d8d8d8 to #e8e8e8) on upper-left surfaces only
- Shadow color: very dark grey (#2a2a2a to #3a3a3a) on right side and bottom edges
- The shading is HARD and FLAT — not gradient, not smooth — distinct regions of light, mid, and dark
- A single bright specular highlight streak on the upper-left surface of the top chest plate band
- NO colored tints, NO rust, NO damage — pristine basic steel

COMPOSITION:
- Square canvas
- Item perfectly centered
- Pure black (#000000) everywhere outside the item
- No text, no label, no border, no frame, no drop shadow
- This is a game inventory icon — clean, isolated, readable at small sizes

The result should look like it was ripped directly from the Ultima Online Classic Client art.mul file.`;

const outDir = path.join(root, "public", "uo-art", "items");
const outFile = path.join(outDir, "5143.png");

async function main() {
  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Use "grok-imagine-image-pro" for higher quality (~$0.07 per image)
      model: "grok-imagine-image",
      prompt: PROMPT,
      n: 1,
      response_format: "b64_json",
    }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("ERROR: Non-JSON response:", text);
    process.exit(1);
  }

  if (!res.ok) {
    console.error("ERROR: API returned", res.status, JSON.stringify(json, null, 2));
    process.exit(1);
  }

  const b64 =
    json?.data?.[0]?.b64_json ??
    json?.data?.[0]?.b64 ??
    null;

  if (!b64) {
    console.error("ERROR: No b64_json in response:", JSON.stringify(json, null, 2));
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const buf = Buffer.from(b64, "base64");
  fs.writeFileSync(outFile, buf);
  console.log("SUCCESS: Saved to public/uo-art/items/5143.png");
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
