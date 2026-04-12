// ============================================================
// LIVING EAMON — Sprite Pre-generation
// On server startup, checks which NPC sprites are missing from
// cache and generates them in the background.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { NPCS } from "./gameData";
import { grokImageToTransparentPng } from "./imageProcessing";

let hasRun = false;

/**
 * Call this on server startup (module load of any API route).
 * Runs once — subsequent calls are no-ops.
 * Generates missing NPC sprites in the background without blocking requests.
 */
export function pregenerateSprites() {
  if (hasRun) return;
  hasRun = true;

  // Run in background — don't block server startup
  doPregenerate().catch(err => {
    console.error("[spritePregen] Error:", err);
  });
}

async function doPregenerate() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const xaiKey = process.env.XAI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !xaiKey) {
    console.log("[spritePregen] Missing env vars, skipping.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const grok = new OpenAI({ apiKey: xaiKey, baseURL: "https://api.x.ai/v1" });

  // Find all NPCs with spritePrompt
  const npcsWithSprites = Object.entries(NPCS).filter(([, npc]) => npc.spritePrompt);
  if (npcsWithSprites.length === 0) {
    console.log("[spritePregen] No NPCs with spritePrompt found.");
    return;
  }

  // Check which are already cached
  const cacheKeys = npcsWithSprites.map(([id]) => `sprite_${id}`);
  const { data: cached } = await supabase
    .from("scene_image_cache")
    .select("room_id")
    .in("room_id", cacheKeys)
    .is("deleted_at", null);

  const cachedSet = new Set((cached ?? []).map(r => r.room_id));
  const missing = npcsWithSprites.filter(([id]) => !cachedSet.has(`sprite_${id}`));

  if (missing.length === 0) {
    console.log(`[spritePregen] All ${npcsWithSprites.length} sprites cached. Nothing to generate.`);
    return;
  }

  console.log(`[spritePregen] ${missing.length} sprites missing. Generating in background...`);

  for (const [npcId, npc] of missing) {
    const cacheKey = `sprite_${npcId}`;
    try {
      console.log(`[spritePregen] Generating ${npc.name} (${npcId})...`);

      // Generate with Grok Imagine
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await grok.images.generate({
        model: "grok-imagine-image",
        prompt: npc.spritePrompt!,
        response_format: "b64_json",
        aspect_ratio: "3:4",
      } as any);
      const b64 = (response as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
      if (!b64) {
        console.error(`[spritePregen] No image data for ${npcId}`);
        continue;
      }

      // Remove background
      const pngBuffer = await grokImageToTransparentPng(b64);

      // Upload to storage
      const fileName = `${cacheKey}__${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("scene-images")
        .upload(fileName, pngBuffer, { contentType: "image/png", upsert: false });

      if (uploadErr) {
        console.error(`[spritePregen] Upload failed for ${npcId}:`, uploadErr.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("scene-images")
        .getPublicUrl(fileName);

      // Cache record
      await supabase.from("scene_image_cache").insert({
        room_id: cacheKey,
        room_state: "normal",
        tone: "sprite",
        image_url: urlData.publicUrl,
        prompt_used: npc.spritePrompt,
      });

      console.log(`[spritePregen] ✓ ${npc.name} done.`);
    } catch (err) {
      console.error(`[spritePregen] Failed for ${npcId}:`, err);
    }
  }

  console.log("[spritePregen] Pre-generation complete.");
}
