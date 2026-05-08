// Auto-crop a transparent-PNG sprite to the alpha bounding box of the
// figure, with a small uniform padding so the figure doesn't bleed to
// the edge. Used to normalise sprites that came back from rembg with
// large transparent margins (the figure ends up rendering small inside
// CombatScreen's `contain` + `flex-end` slot).
//
// Usage:
//   npx tsx scripts/autocrop-sprite.ts <path-to-png> [--padding=N]
// Examples:
//   npx tsx scripts/autocrop-sprite.ts public/art/heroes/gaius/combat/great_sword/v3.png
//   npx tsx scripts/autocrop-sprite.ts public/art/heroes/gaius/combat/great_sword/v3.png --padding=20

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const padArg = args.find((a) => a.startsWith("--padding="));
const alphaArg = args.find((a) => a.startsWith("--alpha-threshold="));

if (!file) {
  console.error("ERROR: pass a PNG path");
  process.exit(1);
}
const filePath: string = file;
const pad = padArg ? parseInt(padArg.slice("--padding=".length), 10) : 8;
const alphaThreshold = alphaArg ? parseInt(alphaArg.slice("--alpha-threshold=".length), 10) : 8;

async function main(): Promise<void> {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`ERROR: file not found: ${abs}`);
    process.exit(1);
  }
  const img = sharp(abs);
  const meta = await img.metadata();
  const w = meta.width;
  const h = meta.height;
  if (!w || !h) throw new Error("could not read image dimensions");
  const channels = meta.channels ?? 4;
  if (channels < 4) {
    console.error("ERROR: image has no alpha channel — autocrop only makes sense for transparent PNGs");
    process.exit(1);
  }

  const raw = await img.raw().toBuffer();
  // raw layout: row-major, RGBARGBA…
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = raw[(y * w + x) * channels + 3]!;
      if (a > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    console.error("ERROR: image is fully transparent");
    process.exit(1);
  }

  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const right = Math.min(w - 1, maxX + pad);
  const bottom = Math.min(h - 1, maxY + pad);
  const cropW = right - left + 1;
  const cropH = bottom - top + 1;

  console.log(`source : ${w} × ${h}`);
  console.log(`alpha bbox: (${minX}, ${minY}) → (${maxX}, ${maxY}) — ${maxX - minX + 1} × ${maxY - minY + 1}`);
  console.log(`crop   : (${left}, ${top}) — ${cropW} × ${cropH} (padding ${pad}px)`);
  console.log(`reduction: ${((1 - (cropW * cropH) / (w * h)) * 100).toFixed(1)}% pixels removed`);

  const cropped = await sharp(abs)
    .extract({ left, top, width: cropW, height: cropH })
    .png()
    .toBuffer();
  fs.writeFileSync(abs, cropped);
  console.log(`✓ overwrote ${abs} (${Math.round(cropped.length / 1024)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
