// ========================================================================
// LIVING EAMON — Upload Hero Masters to Supabase
//
// Reads scripts/hero-seed-data.json, uploads each approved PNG from
// public/hero-masters/{slug}.png to the `hero-masters` Supabase storage
// bucket (creates bucket if missing), and upserts one row per hero into
// `public.hero_masters`.
//
// Idempotent — safe to run multiple times. Uploads overwrite; rows upsert.
//
// Prereq:
//   - Migration 20260423120000_add_hero_masters.sql has been applied
//     (./scripts/db-push.sh prod).
//   - SUPABASE_SERVICE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local.
//
// Usage:  npx tsx scripts/upload-hero-masters.ts
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { buildIdentityBlock } from "../lib/identityBlock";
import type { HeroCustomization } from "../lib/heroTypes";

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

const SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_KEY = readEnv("SUPABASE_SERVICE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must both be set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface SeedHero extends HeroCustomization {
  slug: string;
}

const BUCKET = "hero-masters";
const seedPath = path.join(root, "scripts", "hero-seed-data.json");
const spriteDir = path.join(root, "public", "hero-masters");

// ── Ensure bucket exists ─────────────────────────────────────────────

async function ensureBucket(): Promise<void> {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("ERROR listing buckets:", listErr.message);
    process.exit(1);
  }
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (exists) {
    console.log(`Bucket '${BUCKET}' already exists`);
    return;
  }
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB cap per hero
  });
  if (createErr) {
    console.error("ERROR creating bucket:", createErr.message);
    process.exit(1);
  }
  console.log(`Bucket '${BUCKET}' created (public)`);
}

// ── Upload one hero ──────────────────────────────────────────────────

async function uploadHero(h: SeedHero): Promise<string> {
  if (!h.id) {
    throw new Error(`Hero ${h.slug} has no id — run forge script first`);
  }
  const spritePath = path.join(spriteDir, `${h.slug}.png`);
  if (!fs.existsSync(spritePath)) {
    throw new Error(`Sprite missing at ${spritePath} — run forge script first`);
  }

  const fileBuffer = fs.readFileSync(spritePath);
  const remoteKey = `${h.id}.png`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(remoteKey, fileBuffer, {
      contentType: "image/png",
      upsert: true,
    });
  if (upErr) throw new Error(`Upload failed for ${h.slug}: ${upErr.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(remoteKey);
  return urlData.publicUrl;
}

// ── Upsert one row ───────────────────────────────────────────────────

async function upsertRow(h: SeedHero, publicUrl: string): Promise<void> {
  const identityBlock = buildIdentityBlock(h);
  const row = {
    id: h.id!,
    slug: h.slug,
    hero_name: h.heroName,
    customization_vector: h as unknown as Record<string, unknown>,
    identity_block: identityBlock,
    master_image_url: publicUrl,
    source: "curated",
    consent_shared: true,
  };
  const { error } = await supabase
    .from("hero_masters")
    .upsert(row, { onConflict: "id" });
  if (error) throw new Error(`DB upsert failed for ${h.slug}: ${error.message}`);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const heroes: SeedHero[] = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  // Quick precondition checks
  const missingId = heroes.filter((h) => !h.id);
  if (missingId.length > 0) {
    console.error(
      `ERROR: heroes missing id (run \`npx tsx scripts/forge-hero-masters.ts\` first): ${missingId
        .map((h) => h.slug)
        .join(", ")}`
    );
    process.exit(1);
  }
  const missingFile = heroes.filter(
    (h) => !fs.existsSync(path.join(spriteDir, `${h.slug}.png`))
  );
  if (missingFile.length > 0) {
    console.error(
      `ERROR: missing sprite files (run forge script): ${missingFile
        .map((h) => h.slug)
        .join(", ")}`
    );
    process.exit(1);
  }

  await ensureBucket();
  console.log("");

  let ok = 0;
  let failed = 0;
  for (const hero of heroes) {
    try {
      process.stdout.write(`  ${hero.slug} (${hero.heroName})… `);
      const url = await uploadHero(hero);
      await upsertRow(hero, url);
      console.log("✓");
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log("FAILED");
      console.error(`    ${msg}`);
      failed++;
    }
  }

  console.log("");
  console.log("─── Summary ───");
  console.log(`Uploaded + upserted: ${ok}`);
  console.log(`Failed:              ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
