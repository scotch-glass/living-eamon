// ========================================================================
// LIVING EAMON — Scenario style-LoRA · manual painter-reference scanner
//
// Walks public/art/painter-curation/manual/{painter}/ for image files dropped
// in by Scotch and writes a manifest at public/art/painter-curation/_manual_candidates.json
// that the curation page (public/art/painter-curation/qa.html) loads alongside
// the Claude-sourced _candidates.json.
//
// Usage:
//   npx tsx scripts/scenario/scan-manual-painter-refs.ts
//   npm run painter:scan
//
// Idempotent: re-running refreshes the manifest from the current folder
// state. Files removed from the folder disappear from the manifest on
// next run.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

const PAINTERS = ["frazetta", "vallejo", "kelly", "brunner", "grok-style"] as const;
type Painter = (typeof PAINTERS)[number];

const VALID_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

interface Candidate {
  id: string;
  painter: Painter;
  title: string;
  year: number | null;
  subject_caption: string;
  source_page: string;
  thumbnail_url: string;
}

/** Convert a kebab-case filename stem to a Title Case display title. */
function titleCase(stem: string): string {
  return stem
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function scan(): Candidate[] {
  const candidates: Candidate[] = [];
  for (const painter of PAINTERS) {
    const dir = path.join(root, "public", "art", "painter-curation", "manual", painter);
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir).sort();
    for (const file of entries) {
      const ext = path.extname(file).toLowerCase();
      if (!VALID_EXTENSIONS.has(ext)) continue;
      const stem = path.basename(file, ext);
      const id = `manual_${painter}_${stem.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`;
      candidates.push({
        id,
        painter,
        title: titleCase(stem),
        year: null,
        subject_caption: "",
        source_page: "manual upload",
        thumbnail_url: `/art/painter-curation/manual/${painter}/${file}`,
      });
    }
  }
  return candidates;
}

function main(): void {
  const candidates = scan();
  const outPath = path.join(
    root,
    "public",
    "art",
    "painter-curation",
    "_manual_candidates.json"
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(candidates, null, 2) + "\n");

  const byPainter = candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.painter] = (acc[c.painter] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`── manual painter-ref scan ──`);
  console.log(`  ${candidates.length} image${candidates.length === 1 ? "" : "s"} found`);
  for (const painter of PAINTERS) {
    console.log(`    ${painter.padEnd(10)} ${byPainter[painter] ?? 0}`);
  }
  console.log(`  ✓ wrote ${path.relative(root, outPath)}`);
}

main();
