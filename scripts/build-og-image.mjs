import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const heroPath = path.join(root, "public", "hero.jpg");
const outPath = path.join(root, "public", "og-image.jpg");

const W = 1200;
const H = 630;

const TITLE = "LIVING EAMON";
const TAGLINE = "One Hero. A thousand realms.";
const CREDIT = "Inspired by Robert E. Howard's tales of sword and sorcery.";

// SVG overlay: bottom-to-top dark gradient + title + tagline.
const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="vignette" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%"  stop-color="#000000" stop-opacity="0.88"/>
      <stop offset="40%" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="topshade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#000000" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Top shade so if there's bright sky, the title area stays legible in small previews -->
  <rect x="0" y="0" width="${W}" height="180" fill="url(#topshade)"/>

  <!-- Bottom vignette for the wordmark block -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#vignette)"/>

  <!-- Wordmark block -->
  <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">
    <text x="${W / 2}" y="${H - 180}"
          font-size="92" font-weight="700"
          letter-spacing="14"
          fill="#fbbf24"
          style="paint-order: stroke; stroke: rgba(0,0,0,0.55); stroke-width: 3px;">
      ${TITLE}
    </text>

    <!-- Divider -->
    <line x1="${W / 2 - 110}" y1="${H - 140}" x2="${W / 2 + 110}" y2="${H - 140}"
          stroke="#fbbf24" stroke-width="2" stroke-opacity="0.8"/>

    <text x="${W / 2}" y="${H - 92}"
          font-size="32" font-weight="400"
          fill="#e8d4a0"
          style="paint-order: stroke; stroke: rgba(0,0,0,0.6); stroke-width: 2px;">
      ${TAGLINE}
    </text>
    <text x="${W / 2}" y="${H - 48}"
          font-size="22" font-weight="400" font-style="italic"
          fill="#c5ad75"
          style="paint-order: stroke; stroke: rgba(0,0,0,0.6); stroke-width: 2px;">
      ${CREDIT}
    </text>
  </g>
</svg>
`;

async function main() {
  // Resize/crop hero.jpg to 1200x630, centered cover
  const bg = await sharp(heroPath)
    .resize(W, H, { fit: "cover", position: "attention" })
    .toBuffer();

  await sharp(bg)
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(outPath);

  const size = fs.statSync(outPath).size;
  console.log(`Wrote ${outPath} (${(size / 1024).toFixed(1)} KB, ${W}x${H})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
