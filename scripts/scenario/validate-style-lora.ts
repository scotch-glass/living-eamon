// ========================================================================
// LIVING EAMON — Style LoRA validation generator
//
// Once train-style-lora.ts produces a trained Flux 2 Dev LoRA, this script
// runs ~10 test generations at LoRA strength 0.3 (the locked target) to
// confirm the four-painter style transfers without dominating subject
// coherence. Outputs are saved to public/scenario-spike/style-validation/
// for visual inspection.
//
// **Style anchor for VALIDATION prompts is locked-down:**
// We do NOT include the four-painter names in the validation prompts.
// The point is to test whether the LoRA produces the look on its own —
// if we name the painters in-prompt too, we conflate Flux 2's pretrained
// painter knowledge with the LoRA's contribution. The validation tests
// the LoRA in isolation against a neutral prompt.
//
// Usage:
//   npx tsx scripts/scenario/validate-style-lora.ts --modelId=mod_XXX
//   npx tsx scripts/scenario/validate-style-lora.ts --modelId=mod_XXX --strength=0.5
//   npx tsx scripts/scenario/validate-style-lora.ts --modelId=mod_XXX --slug=barbarian-portrait
//   npx tsx scripts/scenario/validate-style-lora.ts --modelId=mod_XXX --dry-run
//
// Cost: ~$0.07 per generation × 10 prompts = ~$0.70.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generate, getDefaultProjectId } from "../../lib/scenario";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

// ── CLI ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const modelIdArg = args.find((a) => a.startsWith("--modelId="))?.slice("--modelId=".length);
const strengthArg = args.find((a) => a.startsWith("--strength="))?.slice("--strength=".length);
const slugArg = args.find((a) => a.startsWith("--slug="))?.slice("--slug=".length);
const dryRun = args.includes("--dry-run");

if (!modelIdArg) {
  console.error("ERROR: --modelId=mod_XXX required (the trained LoRA's model id)");
  process.exit(1);
}
const MODEL_ID = modelIdArg;
const STRENGTH = strengthArg ? parseFloat(strengthArg) : 0.3;
if (Number.isNaN(STRENGTH) || STRENGTH < 0 || STRENGTH > 1) {
  console.error(`ERROR: --strength must be a float in [0, 1], got "${strengthArg}"`);
  process.exit(1);
}

// ── Validation prompt set ─────────────────────────────────────────────
//
// Each prompt is **bare-bones** — no painter names, no "painted-realism"
// language. The LoRA is supposed to add the look. We're testing whether
// it does, so we don't double-up via the prompt.

interface ValidationPrompt {
  slug: string;
  aspect: "3:4" | "16:9";
  prompt: string;
}

const VALIDATION_PROMPTS: ValidationPrompt[] = [
  {
    slug: "barbarian-portrait",
    aspect: "3:4",
    prompt:
      "Solo barbarian warrior in fur and leather, three-quarter view, broadsword across his back, weathered olive-skinned face with short brown hair and stubble, mountainous backdrop at sunset.",
  },
  {
    slug: "female-warrior",
    aspect: "3:4",
    prompt:
      "Female warrior with auburn hair and a longsword, light leather armor, three-quarter view, ruined stone columns behind her, dawn light catching her shoulders.",
  },
  {
    slug: "barbarian-vs-sorcerer",
    aspect: "3:4",
    prompt:
      "Barbarian warrior charging through a torchlit ritual chamber toward a robed dark sorcerer mid-incantation; basalt altar, glowing rune circle on the floor, smoke curling around them.",
  },
  {
    slug: "barbarian-vs-orc",
    aspect: "16:9",
    prompt:
      "Barbarian warrior on a rocky outcrop holding back a tide of green-skinned orcs surging up the slope below, sword raised, storm sky cracking above.",
  },
  {
    slug: "wide-environment-cavern",
    aspect: "16:9",
    prompt:
      "Vast underground cavern temple, half-flooded with black water, a single torchlit basalt idol at its center, no figures, mist rising from the water.",
  },
  {
    slug: "damsel-rescue",
    aspect: "3:4",
    prompt:
      "Barbarian warrior carrying an unconscious bare-breasted blonde damsel in tattered silks out of a burning sorcerer's tower, his cloak partly wrapped around her, flames behind.",
  },
  {
    slug: "wandering-merchant-npc",
    aspect: "3:4",
    prompt:
      "Solo grey-bearded older man in travel-worn brown wool robes, leaning on a wooden walking staff, kind face, three-quarter view, warm tavern light.",
  },
  {
    slug: "quiet-moment",
    aspect: "3:4",
    prompt:
      "Lone barbarian warrior sitting at a campfire at night, head bowed, sword across his knees, breath visible in cold air, distant mountains under stars.",
  },
  {
    slug: "dark-sorcerer-alone",
    aspect: "3:4",
    prompt:
      "Solo dark sorcerer in black robes at the apex of a tower, hands raised in incantation, glowing rune-light playing across his pale gaunt face, storm sky overhead.",
  },
  {
    slug: "beast-prowling",
    aspect: "16:9",
    prompt:
      "A massive black wolf with golden eyes prowling at the edge of a dying campfire's light, snowfall, no visible humans, the moment of detection.",
  },
];

const targets = slugArg
  ? VALIDATION_PROMPTS.filter((p) => p.slug === slugArg)
  : VALIDATION_PROMPTS;

if (slugArg && targets.length === 0) {
  console.error(
    `ERROR: --slug="${slugArg}" matched zero prompts. Available: ${VALIDATION_PROMPTS.map((p) => p.slug).join(", ")}`
  );
  process.exit(1);
}

// ── Output dir ─────────────────────────────────────────────────────────

const outDir = path.join(
  root,
  "public",
  "scenario-spike",
  "style-validation",
  `${MODEL_ID}-strength-${STRENGTH.toFixed(2)}`
);

// ── Aspect → dimensions (Flux 2's recommended 3MP range) ──────────────

function dimsFor(aspect: "3:4" | "16:9"): { width: number; height: number } {
  if (aspect === "3:4") return { width: 1456, height: 1936 }; // ~2.8 MP
  return { width: 1936, height: 1088 }; // 16:9 at ~2.1 MP
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`── style-LoRA validation ──`);
  console.log(`  modelId:        ${MODEL_ID}`);
  console.log(`  LoRA strength:  ${STRENGTH}`);
  console.log(`  prompts:        ${targets.length}`);
  console.log(`  output dir:     ${path.relative(root, outDir)}`);
  console.log(`  cost:           ~$${(targets.length * 0.07).toFixed(2)}`);
  if (dryRun) console.log(`  --dry-run: no API calls`);
  console.log("");

  if (dryRun) {
    for (const p of targets) {
      console.log(`  ${p.slug.padEnd(28)} ${p.aspect}  ${p.prompt.slice(0, 100)}…`);
    }
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const projectId = await getDefaultProjectId();

  let succeeded = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    const { width, height } = dimsFor(p.aspect);
    process.stdout.write(`  [${(i + 1).toString().padStart(2)}/${targets.length}] ${p.slug.padEnd(28)} ${p.aspect}  `);
    try {
      const resp = (await generate(projectId, {
        modelId: MODEL_ID,
        prompt: p.prompt,
        width,
        height,
        // Apply the LoRA at the locked target strength. (Scenario's
        // generate endpoint accepts the LoRA's modelId in additionalModelIds
        // OR uses modelId itself as primary — we set it as primary so the
        // request shape is unambiguous.)
        additionalModelIds: [{ modelId: MODEL_ID, influence: STRENGTH }],
      })) as { images?: Array<{ url?: string; b64?: string }> };

      // Response shape unverified — log it on first run if image isn't found.
      const img = resp.images?.[0];
      if (!img) {
        throw new Error(`unexpected response shape: ${JSON.stringify(resp).slice(0, 400)}`);
      }
      let pngBuf: Buffer;
      if (img.b64) {
        pngBuf = Buffer.from(img.b64, "base64");
      } else if (img.url) {
        const r = await fetch(img.url);
        if (!r.ok) throw new Error(`download ${img.url} failed: HTTP ${r.status}`);
        const ab = await r.arrayBuffer();
        pngBuf = Buffer.from(ab);
      } else {
        throw new Error("response had neither b64 nor url for the image");
      }
      const outPath = path.join(outDir, `${p.slug}.png`);
      fs.writeFileSync(outPath, pngBuf);
      console.log(`✓  ${(pngBuf.length / 1024).toFixed(0)} KB`);
      succeeded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗  FAILED: ${msg.slice(0, 200)}`);
      failed++;
    }
    // Brief pause between calls to be polite.
    if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("");
  console.log("─── Summary ───");
  console.log(`  succeeded: ${succeeded}`);
  console.log(`  failed:    ${failed}`);
  console.log(`  output:    ${outDir}`);
  if (succeeded > 0) {
    console.log("");
    console.log("  Eyeball the outputs in the folder above. Decision criteria:");
    console.log("    ✅ four-painter look transfers without distorting subjects → spike succeeds");
    console.log("    ⚠️  too strong / too weak → re-run with --strength=0.2 or 0.5");
    console.log("    ❌ style is fundamentally wrong → reject spike");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
