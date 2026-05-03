// ========================================================================
// LIVING EAMON — Style LoRA training driver (Scenario.gg, Flux 2 Dev)
//
// Reads the curation state at public/art/painter-curation/_curation.json,
// gathers the approved entries from _candidates.json + _manual_candidates.json,
// uploads them to Scenario as training images with subject-only captions,
// kicks off Flux 2 Dev LoRA training, and polls until the model is trained
// or fails.
//
// **Captioning convention:** subject only, no style words. The LoRA learns
// style from the visual content; describing style in captions just confuses
// it. For grok-style entries we pull the original subject from SUBJECTS in
// forge-style-refs.ts. For painter-sourced entries we use _candidates.json's
// subject_caption field.
//
// Cost: ~$15 (default training params). Wall: ~30-60 min.
//
// Usage:
//   npx tsx scripts/scenario/train-style-lora.ts                 # full run
//   npx tsx scripts/scenario/train-style-lora.ts --dry-run       # build payload, no API
//   npx tsx scripts/scenario/train-style-lora.ts --resume=mod_X  # poll an existing run
//   npx tsx scripts/scenario/train-style-lora.ts --name=foo      # override model name
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createModel,
  getDefaultProjectId,
  getModel,
  startTraining,
  uploadTrainingImage,
} from "../../lib/scenario";
import type { ScenarioModel } from "../../lib/scenario";
import { SUBJECTS, type Subject } from "./forge-style-refs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

// ── CLI ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const resumeArg = args
  .find((a) => a.startsWith("--resume="))
  ?.slice("--resume=".length);
const nameArg = args.find((a) => a.startsWith("--name="))?.slice("--name=".length);
const MODEL_NAME = nameArg ?? "living-eamon-style-v1";

// ── Manifest types (subset of what the curation files contain) ─────────

interface CandidateEntry {
  id: string;
  painter: string;
  title: string;
  year?: number | null;
  subject_caption?: string;
  source_page?: string;
  thumbnail_url: string;
}

interface CurationDecision {
  state: "approved" | "rejected" | null;
  notes?: string;
  updatedAt?: string;
}

// ── Load curation + manifests ──────────────────────────────────────────

function loadJson<T>(rel: string): T {
  const p = path.join(root, rel);
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

const curation = loadJson<Record<string, CurationDecision>>(
  "public/art/painter-curation/_curation.json"
);
const claudeCandidates = loadJson<CandidateEntry[]>(
  "public/art/painter-curation/_candidates.json"
);
const manualCandidates = loadJson<CandidateEntry[]>(
  "public/art/painter-curation/_manual_candidates.json"
);
const allById = new Map<string, CandidateEntry>(
  [...claudeCandidates, ...manualCandidates].map((c) => [c.id, c])
);

const approvedIds = Object.entries(curation)
  .filter(([, v]) => v.state === "approved")
  .map(([id]) => id);

const approved: CandidateEntry[] = approvedIds
  .map((id) => allById.get(id))
  .filter((c): c is CandidateEntry => Boolean(c));

if (approved.length === 0) {
  console.error("ERROR: 0 approved candidates in _curation.json. Curate first.");
  process.exit(1);
}

// ── Caption derivation ─────────────────────────────────────────────────
//
// Goal: subject-only caption per the LoRA convention. For grok-style
// entries the slug ("savages-12", "damsel-03", etc.) maps to the
// SUBJECTS array's `subject` field — that text already follows the
// convention (subject-only, no style words). For painter-sourced
// entries the manifest's `subject_caption` is what the candidate-curation
// metadata recorded, also subject-only by convention.

const subjectsBySlug = new Map<string, Subject>(
  SUBJECTS.map((s) => [s.slug, s])
);

function captionFor(c: CandidateEntry): string {
  // Manual grok-style entries have ids like "manual_grok-style_savages-12";
  // strip the "manual_grok-style_" prefix to recover the slug.
  if (c.painter === "grok-style") {
    const slug = c.id.replace(/^manual_grok-style_/, "");
    const subj = subjectsBySlug.get(slug);
    if (subj) return subj.subject;
    // Fallback: title (which is the slug title-cased) is better than empty.
    return c.title;
  }
  if (c.subject_caption && c.subject_caption.trim().length > 0) {
    return c.subject_caption.trim();
  }
  return c.title;
}

// ── Image loader ───────────────────────────────────────────────────────

async function imageToDataUri(c: CandidateEntry): Promise<{ dataUri: string; bytes: number }> {
  // Manual uploads + grok-style: thumbnail_url is "/art/painter-curation/manual/.../foo.jpg"
  // (a local public-folder path). Read from disk directly.
  if (c.thumbnail_url.startsWith("/art/painter-curation/")) {
    const localPath = path.join(root, "public", c.thumbnail_url);
    const buf = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
    return { dataUri: `data:${mime};base64,${buf.toString("base64")}`, bytes: buf.length };
  }
  // Painter-sourced: thumbnail_url is a remote URL (Wikimedia, ComicArtFans).
  // Fetch and base64-encode. Use referrerpolicy bypass equivalent via fresh fetch.
  const resp = await fetch(c.thumbnail_url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${c.thumbnail_url}: HTTP ${resp.status}`);
  }
  const ab = await resp.arrayBuffer();
  const buf = Buffer.from(ab);
  const ct = resp.headers.get("content-type") || "image/jpeg";
  return { dataUri: `data:${ct};base64,${buf.toString("base64")}`, bytes: buf.length };
}

// ── Training params (Scenario doc-recommended starting point) ──────────

const TRAINING_PARAMS = {
  seed: 123456789,
  learningRate: 0.00005,
  rank: 64,
  nbEpochs: 10,
  nbRepeats: 20,
};

// ── Polling ────────────────────────────────────────────────────────────

async function waitForTraining(
  projectId: string,
  modelId: string
): Promise<ScenarioModel> {
  const startedAt = Date.now();
  let lastLog = "";
  let consecErrors = 0;
  // Scenario's API occasionally flakes with transient 403 "Given APIKey
  // does not exists" or socket errors mid-poll even though the training
  // is fine. Tolerate up to 10 consecutive pollers failing — that's 5
  // minutes of pure-flake before we give up.
  const MAX_CONSEC_ERRORS = 10;
  while (true) {
    let m: ScenarioModel;
    try {
      m = await getModel(projectId, modelId);
      consecErrors = 0;
    } catch (err) {
      consecErrors++;
      const elapsed = Math.round((Date.now() - startedAt) / 1000);
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `  [${elapsed}s] poll error ${consecErrors}/${MAX_CONSEC_ERRORS}: ${msg.slice(0, 160)}`
      );
      if (consecErrors >= MAX_CONSEC_ERRORS) {
        throw new Error(
          `Polling gave up after ${MAX_CONSEC_ERRORS} consecutive errors. ` +
            `Training may still be running server-side — re-run with ` +
            `--resume=${modelId} to keep watching.`
        );
      }
      await new Promise((r) => setTimeout(r, 30_000));
      continue;
    }
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    const stage = m.trainingProgress?.stage ?? "—";
    const pct =
      typeof m.trainingProgress?.progress === "number"
        ? `${Math.round(m.trainingProgress.progress * 100)}%`
        : "?";
    const log = `  [${elapsed}s] status=${m.status} stage=${stage} progress=${pct}`;
    if (log !== lastLog) {
      console.log(log);
      lastLog = log;
    }
    if (m.status === "trained") return m;
    if (m.status === "failed" || m.status === "cancelled") return m;
    await new Promise((r) => setTimeout(r, 30_000));
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`── style-LoRA training driver ──`);
  console.log(`  approved entries:   ${approved.length}`);
  console.log(`  by painter:         ${countBy(approved, (c) => c.painter)}`);
  console.log(`  model name:         ${MODEL_NAME}`);
  console.log(`  training params:    ${JSON.stringify(TRAINING_PARAMS)}`);
  if (dryRun) console.log(`  --dry-run: no API calls`);
  if (resumeArg) console.log(`  --resume=${resumeArg}: skipping create+upload, polling existing model`);
  console.log("");

  if (dryRun) {
    console.log("Dry-run captions preview (first 5):");
    for (const c of approved.slice(0, 5)) {
      console.log(`  [${c.id}] ${captionFor(c).slice(0, 120)}…`);
    }
    return;
  }

  const projectId = await getDefaultProjectId();
  console.log(`  project:            ${projectId}`);

  let model: ScenarioModel;
  if (resumeArg) {
    model = await getModel(projectId, resumeArg);
    console.log(`  resumed model:      ${model.id} (status=${model.status})`);
  } else {
    // Step 1: create model entry
    console.log(`\n  → createModel(...)`);
    model = await createModel(projectId, {
      name: MODEL_NAME,
      type: "flux.2-dev-lora",
    });
    console.log(`  ✓ created model: ${model.id}`);

    // Step 2: upload each approved image with caption
    console.log(`\n  → uploading ${approved.length} training images…`);
    let uploaded = 0;
    let failed = 0;
    for (const c of approved) {
      try {
        const { dataUri, bytes } = await imageToDataUri(c);
        const caption = captionFor(c);
        await uploadTrainingImage(projectId, model.id, {
          name: `${c.id}.jpg`,
          data: dataUri,
          caption,
        });
        uploaded++;
        console.log(
          `    ✓ [${uploaded.toString().padStart(2)}/${approved.length}] ${c.id.padEnd(40)} ${(bytes / 1024).toFixed(0)} KB`
        );
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`    ✗ ${c.id} FAILED: ${msg.slice(0, 200)}`);
      }
    }
    console.log(`\n  uploaded: ${uploaded}/${approved.length}  (${failed} failed)`);
    if (uploaded === 0) {
      console.error("ERROR: no images uploaded successfully — aborting before training.");
      process.exit(1);
    }

    // Step 3: kick off training
    console.log(`\n  → startTraining(...)`);
    await startTraining(projectId, model.id, TRAINING_PARAMS);
    console.log(`  ✓ training started`);
  }

  // Step 4: poll
  console.log(`\n  → polling getModel(...) every 30s until status flips…`);
  const finalModel = await waitForTraining(projectId, model.id);
  console.log("");
  console.log("─── Result ───");
  console.log(`  modelId: ${finalModel.id}`);
  console.log(`  status:  ${finalModel.status}`);
  if (finalModel.status === "trained") {
    console.log(`\n  ✅ Training complete. Use this modelId in validate-style-lora.ts.`);
    console.log(`     The Scenario dashboard will show the LoRA at https://app.scenario.gg/models/${finalModel.id}`);
  } else {
    console.log(`\n  ❌ Training did not succeed. Check the Scenario dashboard.`);
    process.exit(1);
  }
}

function countBy<T>(arr: T[], fn: (x: T) => string): string {
  const counts: Record<string, number> = {};
  for (const x of arr) counts[fn(x)] = (counts[fn(x)] ?? 0) + 1;
  return Object.entries(counts)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
