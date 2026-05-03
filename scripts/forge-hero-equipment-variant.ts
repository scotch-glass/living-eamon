// ========================================================================
// LIVING EAMON — Hero Equipment Variant Forge (offline, per-hero)
//
// Generates a transparent PNG of a specific hero wearing a specific
// equipment state in a specific stance. Uploads to Supabase Storage and
// writes a scene_image_cache row so /api/hero-equipment-sprite returns
// instantly on the next client fetch.
//
// Mirrors the logic in app/api/hero-equipment-sprite/route.ts so both
// the offline and on-demand paths produce identical cache rows.
//
// Usage:
//   npx tsx scripts/forge-hero-equipment-variant.ts \
//     --slug=seward --equipment=gray_robe --stance=casual
//
//   # Generate for ALL library masters:
//   npx tsx scripts/forge-hero-equipment-variant.ts \
//     --equipment=gray_robe --stance=casual --all
//
//   # Force regeneration (delete any existing cache row first):
//   npx tsx scripts/forge-hero-equipment-variant.ts \
//     --slug=seward --equipment=gray_robe --stance=casual --force
//
// Cost: ~$0.07 per call (grok-imagine-image-pro).
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { grokImageToTransparentPng } from "../lib/imageProcessing";
import { canonicalFraming } from "../lib/spriteFraming";
import {
  EQUIPMENT_FRAMING,
  WEAPON_CARRY_FRAMING,
  STANCE_FRAMING,
  FRESH_REBIRTH_FRAMING,
  type Equipment,
  type Stance,
  type WeaponCarry,
} from "../lib/wardrobe";

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
const SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY = readEnv("SUPABASE_SERVICE_KEY");

if (!XAI_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "ERROR: missing XAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_KEY in .env.local"
  );
  process.exit(1);
}

const grok = new OpenAI({ apiKey: XAI_KEY, baseURL: "https://api.x.ai/v1" });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Framing ────────────────────────────────────────────────────────
// EQUIPMENT_FRAMING / WEAPON_CARRY_FRAMING / STANCE_FRAMING /
// FRESH_REBIRTH_FRAMING are imported from lib/wardrobe/prompts/body.ts
// (single source of truth as of the V2 wardrobe refactor, 2026-04-24).

// ── CLI parsing ────────────────────────────────────────────────────

const args = process.argv.slice(2);
function flag(name: string): string | undefined {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(`--${name}=`.length);
}
function bool(name: string): boolean {
  return args.includes(`--${name}`);
}

const slug = flag("slug");
const equipment = (flag("equipment") ?? "gray_robe") as Equipment;
const stance = (flag("stance") ?? "casual") as Stance;
const weapon = (flag("weapon") ?? "unarmed") as WeaponCarry;
const force = bool("force");
const all = bool("all");

if (!(equipment in EQUIPMENT_FRAMING)) {
  console.error(
    `ERROR: unknown equipment "${equipment}". Valid: ${Object.keys(EQUIPMENT_FRAMING).join(", ")}`
  );
  process.exit(1);
}
if (!(stance in STANCE_FRAMING)) {
  console.error(
    `ERROR: unknown stance "${stance}". Valid: ${Object.keys(STANCE_FRAMING).join(", ")}`
  );
  process.exit(1);
}
if (!(weapon in WEAPON_CARRY_FRAMING)) {
  console.error(
    `ERROR: unknown weapon "${weapon}". Valid: ${Object.keys(WEAPON_CARRY_FRAMING).join(", ")}`
  );
  process.exit(1);
}
if (!all && !slug) {
  console.error("ERROR: pass either --slug=<slug> or --all");
  process.exit(1);
}

// ── Core generation ────────────────────────────────────────────────

async function callGrokImaginePro(prompt: string): Promise<string> {
  // `aspect_ratio` is xAI-specific and not in the OpenAI SDK typings.
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "3:4",
  } as Parameters<typeof grok.images.generate>[0] & { aspect_ratio: string });
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok Imagine returned no image data");
  return b64;
}

interface HeroMasterRow {
  id: string;
  slug: string;
  hero_name: string | null;
  identity_block: string;
  master_image_url: string;
}

async function forgeVariant(master: HeroMasterRow): Promise<void> {
  const cacheRoomId = `hero_eq_${master.id}`;
  const cacheRoomState = `${equipment}_${weapon}_${stance}`;

  console.log(`\n── ${master.slug} (${master.id}) ──`);
  console.log(`   equipment=${equipment} weapon=${weapon} stance=${stance}`);

  // Default state short-circuits to the stored master image.
  if (equipment === "loincloth" && weapon === "unarmed" && stance === "casual") {
    console.log(`   skip: loincloth+unarmed+casual uses master_image_url directly`);
    return;
  }

  // Existing cache check.
  const { data: existing } = await supabase
    .from("scene_image_cache")
    .select("id, image_url, deleted_at")
    .eq("room_id", cacheRoomId)
    .eq("room_state", cacheRoomState)
    .maybeSingle();

  if (existing && !existing.deleted_at && !force) {
    console.log(`   already cached: ${existing.image_url}`);
    console.log(`   (pass --force to regenerate)`);
    return;
  }

  if (existing && force) {
    console.log(`   --force: existing row will be overwritten via upsert`);
  }

  const prompt = [
    master.identity_block,
    EQUIPMENT_FRAMING[equipment],
    WEAPON_CARRY_FRAMING[weapon],
    STANCE_FRAMING[stance],
    FRESH_REBIRTH_FRAMING,
    canonicalFraming("left"),
  ]
    .filter((s) => s.length > 0)
    .join(" ");

  console.log(`   calling grok-imagine-image-pro… (~30s)`);
  const b64 = await callGrokImaginePro(prompt);
  console.log(`   raw image received (${Math.round((b64.length * 0.75) / 1024)} KB)`);

  console.log(`   rembg cutting white backdrop…`);
  const pngBuffer = await grokImageToTransparentPng(b64);

  const fileName = `${cacheRoomId}__${cacheRoomState}__${Date.now()}.png`;
  console.log(`   uploading ${fileName} to scene-images bucket…`);
  const { error: uploadErr } = await supabase.storage
    .from("scene-images")
    .upload(fileName, pngBuffer, { contentType: "image/png", upsert: false });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const { data: urlData } = supabase.storage
    .from("scene-images")
    .getPublicUrl(fileName);

  const { error: upsertErr } = await supabase.from("scene_image_cache").upsert(
    {
      room_id: cacheRoomId,
      room_state: cacheRoomState,
      tone: "hero_equipment",
      image_url: urlData.publicUrl,
      prompt_used: prompt.slice(0, 4000),
      deleted_at: null,
    },
    { onConflict: "room_id,room_state,tone" }
  );
  if (upsertErr) throw new Error(`Cache upsert failed: ${upsertErr.message}`);

  console.log(`   ✓ ${urlData.publicUrl}`);
}

// ── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  let query = supabase
    .from("hero_masters")
    .select("id, slug, hero_name, identity_block, master_image_url");
  if (!all) query = query.eq("slug", slug!);
  const { data: masters, error } = await query;
  if (error) throw new Error(`Load hero_masters failed: ${error.message}`);
  if (!masters || masters.length === 0) {
    console.error(`ERROR: no hero_masters ${all ? "found" : `matching slug=${slug}`}`);
    process.exit(1);
  }

  console.log(`Forging ${masters.length} variant${masters.length === 1 ? "" : "s"}`);
  console.log(`  equipment=${equipment}  stance=${stance}  force=${force}`);
  console.log(`  Model: grok-imagine-image-pro  |  Cost: ~$0.07 each`);

  let ok = 0;
  let failed = 0;
  for (const master of masters) {
    try {
      await forgeVariant(master as HeroMasterRow);
      ok++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ✗ ${master.slug} FAILED: ${msg}`);
    }
  }

  console.log(`\n─── Summary ───`);
  console.log(`Succeeded: ${ok}`);
  console.log(`Failed:    ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
