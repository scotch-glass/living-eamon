// Normalise a transparent-PNG combat sprite to a uniform aspect ratio
// by adding transparent padding (or, if already too narrow, by cropping
// the alpha-empty margins first and then padding to the target).
//
// Why: the production CombatScreen renders sprites in a 240×72vh slot
// with `objectFit: contain`. Sprites with different aspect ratios end
// up at different rendered scales (a 0.5-aspect sprite renders ~50%
// taller than a 0.7-aspect sprite at the same slot width). Normalising
// every combat sprite to the same aspect makes them visually consistent
// without touching CSS.
//
// The figure stays bottom-anchored after normalisation so all six
// combatants stand on the same ground line (the slot uses
// `align-items: flex-end`).
//
// Usage:
//   npx tsx scripts/normalize-sprite-aspect.ts <path.png> [--aspect=0.6] [--padding=8]
//   npx tsx scripts/normalize-sprite-aspect.ts <path.png> --aspect=0.6 --padding=8

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const aspectArg = args.find((a) => a.startsWith("--aspect="));
const padArg = args.find((a) => a.startsWith("--padding="));
const alphaArg = args.find((a) => a.startsWith("--alpha-threshold="));

if (!file) {
  console.error("ERROR: pass a PNG path");
  process.exit(1);
}
const filePath: string = file;
const targetAspect = aspectArg ? parseFloat(aspectArg.slice("--aspect=".length)) : 0.6;
const pad = padArg ? parseInt(padArg.slice("--padding=".length), 10) : 8;
const alphaThreshold = alphaArg ? parseInt(alphaArg.slice("--alpha-threshold=".length), 10) : 8;

if (!Number.isFinite(targetAspect) || targetAspect <= 0 || targetAspect >= 2) {
  console.error("ERROR: --aspect must be a positive number, typically 0.4 to 1.0");
  process.exit(1);
}

async function main(): Promise<void> {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`ERROR: file not found: ${abs}`);
    process.exit(1);
  }

  const meta = await sharp(abs).metadata();
  if (!meta.width || !meta.height) throw new Error("could not read image dimensions");
  if ((meta.channels ?? 4) < 4) {
    console.error("ERROR: image has no alpha channel");
    process.exit(1);
  }

  // Compute the alpha bounding box first so we can anchor the figure
  // to the bottom of the new canvas without including pre-existing
  // empty top/bottom margins.
  const raw = await sharp(abs).raw().toBuffer();
  const ch = meta.channels ?? 4;
  const w = meta.width;
  const h = meta.height;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = raw[(y * w + x) * ch + 3]!;
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

  // Step 1: tight-crop to the alpha bbox + a small padding on every
  // side. This removes pre-existing transparent margins so step 2's
  // padding math is anchored to the figure itself.
  const cropLeft = Math.max(0, minX - pad);
  const cropTop = Math.max(0, minY - pad);
  const cropRight = Math.min(w - 1, maxX + pad);
  const cropBottom = Math.min(h - 1, maxY + pad);
  const cropW = cropRight - cropLeft + 1;
  const cropH = cropBottom - cropTop + 1;

  // Step 2: pad to target aspect. If figure is too narrow, add
  // transparent margin LEFT/RIGHT (symmetrical). If figure is too
  // wide, add margin TOP-only (so feet stay at the bottom of the
  // canvas — slot's `flex-end` anchors all combatants to the same
  // ground line).
  let padLeft = 0, padRight = 0, padTop = 0, padBottom = 0;
  const currentAspect = cropW / cropH;
  if (currentAspect < targetAspect) {
    // too narrow → pad horizontally
    const newW = Math.round(cropH * targetAspect);
    const horizPad = newW - cropW;
    padLeft = Math.floor(horizPad / 2);
    padRight = horizPad - padLeft;
  } else if (currentAspect > targetAspect) {
    // too wide → pad vertically (top only, so feet stay anchored)
    const newH = Math.round(cropW / targetAspect);
    padTop = newH - cropH;
  }

  const finalW = cropW + padLeft + padRight;
  const finalH = cropH + padTop + padBottom;
  const finalAspect = finalW / finalH;

  console.log(`source canvas       : ${w} × ${h} (aspect ${(w / h).toFixed(3)})`);
  console.log(`figure bbox         : (${minX}, ${minY}) → (${maxX}, ${maxY})`);
  console.log(`tight crop          : ${cropW} × ${cropH} (aspect ${currentAspect.toFixed(3)})`);
  console.log(`target aspect       : ${targetAspect}`);
  console.log(`pad L/R/T/B         : ${padLeft} / ${padRight} / ${padTop} / ${padBottom}`);
  console.log(`final canvas        : ${finalW} × ${finalH} (aspect ${finalAspect.toFixed(3)})`);

  const out = await sharp(abs)
    .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
    .extend({
      left: padLeft,
      right: padRight,
      top: padTop,
      bottom: padBottom,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  fs.writeFileSync(abs, out);
  console.log(`✓ overwrote ${abs} (${Math.round(out.length / 1024)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
