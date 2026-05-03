// ========================================================================
// LIVING EAMON — Regenerate all NPC sprites with the canonical framing
//
// One-off script. Walks every NPC with a spritePrompt, soft-deletes any
// live cache row, and generates a fresh sprite using the same path the
// runtime uses (spritePrompt + canonicalFraming("right")). Writes the
// result back to scene_image_cache so the client returns it on next
// /api/npc-image call.
//
// Usage:
//   npx tsx scripts/regen-npc-sprites.ts               # all NPCs
//   npx tsx scripts/regen-npc-sprites.ts hokas_tokas   # by id
//   npx tsx scripts/regen-npc-sprites.ts --dry-run     # list only
//
// Cost: ~$0.07 per NPC (grok-imagine-image-pro).
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { NPCS } from "../lib/gameData";
import { grokImageToTransparentPng } from "../lib/imageProcessing";
import { canonicalFraming, type SpriteSize } from "../lib/spriteFraming";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function readEnv(key: string): string | null {
  const p = path.join(root, ".env.local");
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return null;
  return line.slice(`${key}=`.length).trim().replace(/^["']|["']$/g, "");
}

const XAI_KEY = readEnv("XAI_API_KEY") ?? readEnv("GROK_API_KEY");
const SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY = readEnv("SUPABASE_SERVICE_KEY");
if (!XAI_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: missing XAI_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_KEY in .env.local");
  process.exit(1);
}

const grok = new OpenAI({ apiKey: XAI_KEY, baseURL: "https://api.x.ai/v1" });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const requestedIds = args.filter((a) => !a.startsWith("--"));

async function regenOne(
  npcId: string,
  spritePrompt: string,
  displayName: string,
  size: SpriteSize
): Promise<void> {
  const cacheKey = `sprite_${npcId}`;
  const fullPrompt = `${spritePrompt} ${canonicalFraming("right", size)}`;

  console.log(`\n── ${npcId} (${displayName}) size=${size} ──`);

  if (dryRun) {
    console.log(`   [dry-run] would regenerate`);
    return;
  }

  console.log(`   calling grok-imagine-image-pro…`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt: fullPrompt,
    response_format: "b64_json",
    aspect_ratio: "3:4",
  } as any);
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok Imagine returned no image data");
  console.log(`   raw image received (${Math.round((b64.length * 0.75) / 1024)} KB)`);

  console.log(`   rembg cutting white backdrop…`);
  const pngBuffer = await grokImageToTransparentPng(b64);

  const fileName = `${cacheKey}__${Date.now()}.png`;
  console.log(`   uploading ${fileName}…`);
  const { error: uploadErr } = await supabase.storage
    .from("scene-images")
    .upload(fileName, pngBuffer, { contentType: "image/png", upsert: false });
  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const { data: urlData } = supabase.storage.from("scene-images").getPublicUrl(fileName);

  // Upsert on (room_id, room_state, tone) — updates the existing row
  // in place (soft-deleted or not) so we don't collide with the
  // unique constraint. Clears deleted_at explicitly so any previously
  // tombstoned row comes back live with the new URL.
  const { error: upsertErr } = await supabase.from("scene_image_cache").upsert(
    {
      room_id: cacheKey,
      room_state: "normal",
      tone: "sprite",
      image_url: urlData.publicUrl,
      prompt_used: fullPrompt.slice(0, 4000),
      deleted_at: null,
    },
    { onConflict: "room_id,room_state,tone" }
  );
  if (upsertErr) throw new Error(`Cache upsert failed: ${upsertErr.message}`);

  console.log(`   ✓ ${urlData.publicUrl}`);
}

async function main(): Promise<void> {
  const all = Object.entries(NPCS).filter(([, n]) => n.spritePrompt);
  const selected =
    requestedIds.length > 0
      ? all.filter(([id]) => requestedIds.includes(id))
      : all;

  if (requestedIds.length > 0 && selected.length !== requestedIds.length) {
    const found = new Set(selected.map(([id]) => id));
    const missing = requestedIds.filter((id) => !found.has(id));
    console.error(`ERROR: unknown or no-sprite NPC id(s): ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`Regenerating ${selected.length} NPC sprite${selected.length === 1 ? "" : "s"}`);
  console.log(`  Model: grok-imagine-image-pro  |  Cost: ~$0.07 each`);
  if (dryRun) console.log("  [dry-run mode — no API calls, no cache writes]");

  let ok = 0;
  let failed = 0;
  for (const [id, npc] of selected) {
    try {
      await regenOne(id, npc.spritePrompt!, npc.name, npc.spriteSize ?? "medium");
      ok++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ✗ ${id} FAILED: ${msg}`);
    }
  }

  console.log(`\n─── Summary ───`);
  console.log(`Succeeded: ${ok}`);
  console.log(`Failed:    ${failed}`);
  if (!dryRun && ok > 0) {
    console.log(`Approx cost this run: $${(ok * 0.07).toFixed(2)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
