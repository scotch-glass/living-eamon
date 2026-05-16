// One-shot: trim transparent padding from each corpse-marker PNG so the
// rendered 120 px-tall box maps 1:1 to visible content. Stacking math in
// CombatArena.tsx (CORPSE_STACK_OFFSET_PX = 80% of marker height) assumes
// the box IS the content; without this trim, ~14% top + ~12% bottom of
// transparent padding produces a visible gap between stacked corpses.
//
// Usage:  npx tsx scripts/trim-corpse-markers.ts
//
// Idempotent — running twice is a no-op (already-trimmed PNGs have no
// transparent rows/cols to remove).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "..", "public", "art", "corpse-marker");

async function trimOne(file: string) {
  const p = path.join(dir, file);
  const before = await sharp(p).metadata();
  const trimmed = await sharp(p).trim({ threshold: 8 }).toBuffer();
  fs.writeFileSync(p, trimmed);
  const after = await sharp(p).metadata();
  console.log(
    `${file}:  ${before.width}x${before.height}  →  ${after.width}x${after.height}`,
  );
}

async function main() {
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^v\d+\.png$/.test(f))
    .sort();
  for (const f of files) await trimOne(f);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
