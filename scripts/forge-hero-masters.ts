// ========================================================================
// LIVING EAMON — Hero Master Forge (offline seed generator)
//
// Reads scripts/hero-seed-data.json, builds each hero's Identity Block via
// lib/identityBlock.ts, generates a master reference image with Grok Imagine
// Pro, cuts the white backdrop via rembg, and writes transparent PNGs to
// public/hero-masters/.
//
// Usage:
//   npx tsx scripts/forge-hero-masters.ts            # generate all
//   npx tsx scripts/forge-hero-masters.ts kane       # one by slug
//   npx tsx scripts/forge-hero-masters.ts kane orin  # several
//   npx tsx scripts/forge-hero-masters.ts --force    # re-generate existing
//
// Cost: ~$0.07 per hero (grok-imagine-image-pro). 10 heroes ≈ $0.70.
//
// After generation, eyeball each PNG in public/hero-masters/. Keep what
// works; delete and re-run to regenerate. When the library looks right,
// Sprint 2 uploads these to Supabase and populates the hero_masters table.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { buildForgeGenerationPrompt, buildIdentityBlock } from "../lib/identityBlock";
import type { HeroCustomization } from "../lib/heroTypes";
import { grokImageToTransparentPng } from "../lib/imageProcessing";

// ── Setup ──────────────────────────────────────────────────────────

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
if (!XAI_KEY) {
  console.error("ERROR: neither XAI_API_KEY nor GROK_API_KEY found in .env.local");
  process.exit(1);
}

const grok = new OpenAI({
  apiKey: XAI_KEY,
  baseURL: "https://api.x.ai/v1",
});

const seedPath = path.join(root, "scripts", "hero-seed-data.json");
const outDir = path.join(root, "public", "hero-masters");

interface SeedHero extends HeroCustomization {
  slug: string;
}

// ── ID assignment + slug validation ─────────────────────────────────
//
// Heroes without an `id` get a fresh UUID assigned and written back to
// the seed JSON. Two heroes may NOT share a slug — if they do the
// script fails before making any API calls.
//
// The id is the canonical primary key (future hero_masters.id). The
// slug is a human-readable handle used for filenames and display only.

function ensureIdsAndValidate(heroes: SeedHero[]): {
  heroes: SeedHero[];
  assigned: number;
} {
  const slugCounts = new Map<string, number>();
  for (const h of heroes) {
    slugCounts.set(h.slug, (slugCounts.get(h.slug) ?? 0) + 1);
  }
  const dupes = [...slugCounts.entries()].filter(([, n]) => n > 1).map(([s]) => s);
  if (dupes.length > 0) {
    console.error(
      `ERROR: duplicate slug(s) in hero-seed-data.json: ${dupes.join(", ")}`
    );
    console.error("Slugs must be unique. Rename and try again.");
    process.exit(1);
  }

  let assigned = 0;
  const updated = heroes.map((h) => {
    if (h.id && h.id.trim().length > 0) return h;
    assigned++;
    return { ...h, id: randomUUID() };
  });

  return { heroes: updated, assigned };
}

// ── CLI parsing ────────────────────────────────────────────────────

const args = process.argv.slice(2);
const force = args.includes("--force");
const requestedSlugs = args.filter((a) => !a.startsWith("--"));

// ── Core generation ────────────────────────────────────────────────

async function callGrokImaginePro(prompt: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "3:4",
  } as any);
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok Imagine returned no image data");
  return b64;
}

async function forgeHero(hero: SeedHero): Promise<void> {
  const outPath = path.join(outDir, `${hero.slug}.png`);
  if (fs.existsSync(outPath) && !force) {
    console.log(`  skip ${hero.slug} (already exists; use --force to regenerate)`);
    return;
  }

  const prompt = buildForgeGenerationPrompt(hero);
  console.log(`  generating ${hero.slug} (${hero.heroName})…`);

  const b64 = await callGrokImaginePro(prompt);
  console.log(`    raw image received (${Math.round(b64.length * 0.75 / 1024)} KB)`);

  console.log(`    running rembg to cut white backdrop…`);
  const pngBuffer = await grokImageToTransparentPng(b64);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, pngBuffer);
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`  ✓ wrote ${outPath} (${sizeKb} KB)`);
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const rawHeroes: SeedHero[] = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  // Validate slug uniqueness + assign UUIDs to any missing ones.
  const { heroes: allHeroes, assigned } = ensureIdsAndValidate(rawHeroes);
  if (assigned > 0) {
    fs.writeFileSync(seedPath, JSON.stringify(allHeroes, null, 2) + "\n");
    console.log(`Assigned ${assigned} new UUID${assigned === 1 ? "" : "s"} and wrote back to ${path.basename(seedPath)}`);
  }

  const heroes =
    requestedSlugs.length > 0
      ? allHeroes.filter((h) => requestedSlugs.includes(h.slug))
      : allHeroes;

  if (requestedSlugs.length > 0 && heroes.length !== requestedSlugs.length) {
    const found = new Set(heroes.map((h) => h.slug));
    const missing = requestedSlugs.filter((s) => !found.has(s));
    console.error(`ERROR: unknown slug(s): ${missing.join(", ")}`);
    console.error(`Available: ${allHeroes.map((h) => h.slug).join(", ")}`);
    process.exit(1);
  }

  console.log(`Forging ${heroes.length} hero master${heroes.length === 1 ? "" : "s"}`);
  console.log(`Output dir: ${outDir}`);
  console.log(`Model: grok-imagine-image-pro  |  Cost: ~$0.07/hero`);
  console.log("");

  // Write an Identity Block preview file so the operator can audit the
  // prompts before approving generations. Useful for Scotch to eyeball.
  const previewPath = path.join(outDir, "_identity-blocks.txt");
  fs.mkdirSync(outDir, { recursive: true });
  const previews = heroes
    .map(
      (h) =>
        `── ${h.slug} · ${h.heroName} · id=${h.id ?? "(none)"} ──\n${buildIdentityBlock(h)}\n`
    )
    .join("\n");
  fs.writeFileSync(previewPath, previews);
  console.log(`Identity Block previews written to ${previewPath}`);
  console.log("");

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const hero of heroes) {
    try {
      const before = fs.existsSync(path.join(outDir, `${hero.slug}.png`));
      await forgeHero(hero);
      const after = fs.existsSync(path.join(outDir, `${hero.slug}.png`));
      if (before && !force) skipped++;
      else if (after) generated++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${hero.slug} FAILED: ${msg}`);
    }
  }

  console.log("");
  console.log("─── Summary ───");
  console.log(`Generated: ${generated}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Failed:    ${failed}`);
  if (generated > 0) {
    console.log(`Approx cost this run: $${(generated * 0.07).toFixed(2)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
