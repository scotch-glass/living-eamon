// Throwaway: collect the 50 approved curation entries into a single
// flat folder for upload to civitai.red. Each image gets a sidecar
// .txt caption (Civitai's LoRA trainer reads `{stem}.txt` as the
// caption for `{stem}.{ext}`). Local manifest entries get copied;
// remote URLs (Wikimedia / ComicArtFans) get downloaded.
//
// Output: public/art/painter-curation/_civitai-upload/
//
// Delete after the Civitai upload is complete.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SUBJECTS, type Subject } from "./forge-style-refs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

interface CandidateEntry {
  id: string;
  painter: string;
  title: string;
  year?: number | null;
  subject_caption?: string;
  source_page?: string;
  thumbnail_url: string;
}
interface CurationDecision { state: "approved" | "rejected" | null; }

function loadJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8")) as T;
}

const curation = loadJson<Record<string, CurationDecision>>(
  "public/art/painter-curation/_curation.json"
);
const claude = loadJson<CandidateEntry[]>(
  "public/art/painter-curation/_candidates.json"
);
const manual = loadJson<CandidateEntry[]>(
  "public/art/painter-curation/_manual_candidates.json"
);
const allById = new Map<string, CandidateEntry>(
  [...claude, ...manual].map((c) => [c.id, c])
);

const approved = Object.entries(curation)
  .filter(([, v]) => v.state === "approved")
  .map(([id]) => allById.get(id))
  .filter((c): c is CandidateEntry => Boolean(c));

const subjectsBySlug = new Map<string, Subject>(SUBJECTS.map((s) => [s.slug, s]));

function captionFor(c: CandidateEntry): string {
  if (c.painter === "grok-style") {
    const slug = c.id.replace(/^manual_grok-style_/, "");
    const subj = subjectsBySlug.get(slug);
    if (subj) return subj.subject;
    return c.title;
  }
  if (c.subject_caption && c.subject_caption.trim().length > 0) {
    return c.subject_caption.trim();
  }
  return c.title;
}

/** Wikimedia thumb→full transform; other URLs unchanged. */
function fullResUrl(url: string): string {
  const wm = url.match(
    /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[a-z]+)\/thumb\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)\/\d+px-[^/]+$/
  );
  if (wm) return `${wm[1]}/${wm[2]}/${wm[3]}/${wm[4]}`;
  return url;
}

/** Friendly filename stem from candidate id. */
function stemFor(c: CandidateEntry): string {
  if (c.painter === "grok-style") {
    return c.id.replace(/^manual_grok-style_/, "");
  }
  // For painter-sourced and manual painter uploads: keep the painter prefix
  // so the upload set is auditable.
  return c.id.replace(/^manual_/, "");
}

const outDir = path.join(root, "public", "art", "painter-curation", "_civitai-upload");

async function main(): Promise<void> {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Exporting ${approved.length} approved entries to ${path.relative(root, outDir)}`);
  console.log("");

  let copied = 0;
  let downloaded = 0;
  let failed = 0;

  for (const c of approved) {
    const stem = stemFor(c);
    const caption = captionFor(c);
    try {
      let outImagePath: string;
      if (c.thumbnail_url.startsWith("/art/painter-curation/")) {
        // Local file — copy directly.
        const src = path.join(root, "public", c.thumbnail_url);
        const ext = path.extname(src).toLowerCase() || ".jpg";
        outImagePath = path.join(outDir, `${stem}${ext}`);
        fs.copyFileSync(src, outImagePath);
        copied++;
      } else {
        // Remote URL — fetch full-res, write to disk.
        const url = fullResUrl(c.thumbnail_url);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
        const ab = await resp.arrayBuffer();
        const buf = Buffer.from(ab);
        const ct = resp.headers.get("content-type") || "image/jpeg";
        const ext = ct.includes("png") ? ".png" : ct.includes("webp") ? ".webp" : ".jpg";
        outImagePath = path.join(outDir, `${stem}${ext}`);
        fs.writeFileSync(outImagePath, buf);
        downloaded++;
      }
      // Sidecar caption file (Civitai convention: same stem, .txt extension).
      fs.writeFileSync(path.join(outDir, `${stem}.txt`), caption + "\n", "utf8");
      console.log(`  ✓ ${stem}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${stem} FAILED: ${msg.slice(0, 200)}`);
      failed++;
    }
  }

  console.log("");
  console.log("─── Summary ───");
  console.log(`  copied (local):     ${copied}`);
  console.log(`  downloaded (remote): ${downloaded}`);
  console.log(`  failed:             ${failed}`);
  console.log(`  output directory:   ${outDir}`);
  console.log("");
  if (failed === 0) {
    console.log("Each image has a same-stem .txt caption file alongside it.");
    console.log("Upload the whole folder's contents (images + .txt files) to Civitai.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
