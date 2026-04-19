// ============================================================
// LIVING EAMON — Sprite Pre-generation
// On server startup, checks which NPC sprites are missing from
// cache and generates them in the background.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { NPCS, ITEMS, ITEM_ICON_PROMPTS, buildItemIconPrompt } from "./gameData";
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
  } else {
    console.log(`[spritePregen] ${missing.length} sprites missing. Generating in background...`);
  }

  for (const [npcId, npc] of missing) {
    const cacheKey = `sprite_${npcId}`;
    try {
      console.log(`[spritePregen] Generating ${npc.name} (${npcId})...`);

      // Generate with Grok Imagine
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await grok.images.generate({
        model: "grok-imagine-image-pro",
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

  console.log("[spritePregen] Sprite pre-generation complete.");

  // ── Item background images (alchemical book pages) ──
  const itemsWithBg = Object.entries(ITEMS).filter(([, item]) => item.bookPagePrompt);
  const itemKeys = itemsWithBg.map(([id]) => `itemBg_${id}`);
  const { data: itemCached } = itemKeys.length
    ? await supabase
        .from("scene_image_cache")
        .select("room_id")
        .in("room_id", itemKeys)
        .is("deleted_at", null)
    : { data: [] as { room_id: string }[] };
  const itemCachedSet = new Set((itemCached ?? []).map(r => r.room_id));
  const missingItems = itemsWithBg.filter(([id]) => !itemCachedSet.has(`itemBg_${id}`));

  if (missingItems.length === 0) {
    console.log(`[itemBgPregen] All ${itemsWithBg.length} item backgrounds cached.`);
  } else {
    console.log(`[itemBgPregen] ${missingItems.length} item backgrounds missing. Generating...`);
  }

  for (const [itemId, item] of missingItems) {
    const cacheKey = `itemBg_${itemId}`;
    try {
      console.log(`[itemBgPregen] Generating ${item.name} (${itemId})...`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await grok.images.generate({
        model: "grok-imagine-image-pro",
        prompt: item.bookPagePrompt!,
        response_format: "b64_json",
        aspect_ratio: "4:3",
      } as any);
      const b64 = (response as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
      if (!b64) {
        console.error(`[itemBgPregen] No image data for ${itemId}`);
        continue;
      }

      const imageBuffer = Buffer.from(b64, "base64");
      const fileName = `${cacheKey}__${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("scene-images")
        .upload(fileName, imageBuffer, { contentType: "image/jpeg", upsert: false });

      if (uploadErr) {
        console.error(`[itemBgPregen] Upload failed for ${itemId}:`, uploadErr.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("scene-images")
        .getPublicUrl(fileName);

      const { error: insertErr } = await supabase
        .from("scene_image_cache")
        .upsert(
          {
            room_id: cacheKey,
            room_state: "normal",
            tone: "alchemical",
            image_url: urlData.publicUrl,
            prompt_used: item.bookPagePrompt,
            deleted_at: null,
          },
          { onConflict: "room_id,room_state,tone" }
        );

      if (insertErr) {
        console.error(`[itemBgPregen] Cache write failed for ${itemId}:`, insertErr.message);
        continue;
      }

      console.log(`[itemBgPregen] ✓ ${item.name} done.`);
    } catch (err) {
      console.error(`[itemBgPregen] Failed for ${itemId}:`, err);
    }
  }

  console.log("[itemBgPregen] Item background pre-generation complete.");

  // ── Item icons (square transparent PNG, used in inventory + equipment grid) ──
  // Every Item gets an icon. Override per-item via item.iconPrompt;
  // default is buildItemIconPrompt(item.name).
  const allItems = Object.entries(ITEMS);
  const iconKeys = allItems.map(([id]) => `itemIcon_${id}`);
  const { data: iconCached } = iconKeys.length
    ? await supabase
        .from("scene_image_cache")
        .select("room_id")
        .in("room_id", iconKeys)
        .is("deleted_at", null)
    : { data: [] as { room_id: string }[] };
  const iconCachedSet = new Set((iconCached ?? []).map(r => r.room_id));
  const missingIcons = allItems.filter(([id]) => !iconCachedSet.has(`itemIcon_${id}`));

  if (missingIcons.length === 0) {
    console.log(`[itemIconPregen] All ${allItems.length} item icons cached.`);
    return;
  }
  console.log(`[itemIconPregen] ${missingIcons.length} item icons missing. Generating...`);

  for (const [itemId, item] of missingIcons) {
    const cacheKey = `itemIcon_${itemId}`;
    // Lookup chain: explicit per-item override map → item.iconPrompt field → name fallback
    const subject = ITEM_ICON_PROMPTS[itemId] ?? item.name;
    const prompt = item.iconPrompt ?? buildItemIconPrompt(subject);
    try {
      console.log(`[itemIconPregen] Generating ${item.name} (${itemId})...`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await grok.images.generate({
        model: "grok-imagine-image-pro",
        prompt,
        response_format: "b64_json",
        aspect_ratio: "1:1",
      } as any);
      const b64 = (response as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
      if (!b64) {
        console.error(`[itemIconPregen] No image data for ${itemId}`);
        continue;
      }

      // rembg cuts the white background — same pipeline as NPC sprites
      const pngBuffer = await grokImageToTransparentPng(b64);

      const fileName = `${cacheKey}__${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("scene-images")
        .upload(fileName, pngBuffer, { contentType: "image/png", upsert: false });

      if (uploadErr) {
        console.error(`[itemIconPregen] Upload failed for ${itemId}:`, uploadErr.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("scene-images")
        .getPublicUrl(fileName);

      const { error: insertErr } = await supabase
        .from("scene_image_cache")
        .upsert(
          {
            room_id: cacheKey,
            room_state: "normal",
            tone: "icon",
            image_url: urlData.publicUrl,
            prompt_used: prompt,
            deleted_at: null,
          },
          { onConflict: "room_id,room_state,tone" }
        );

      if (insertErr) {
        console.error(`[itemIconPregen] Cache write failed for ${itemId}:`, insertErr.message);
        continue;
      }

      console.log(`[itemIconPregen] ✓ ${item.name} done.`);
    } catch (err) {
      console.error(`[itemIconPregen] Failed for ${itemId}:`, err);
    }
  }

  console.log("[itemIconPregen] Item icon pre-generation complete.");
}
