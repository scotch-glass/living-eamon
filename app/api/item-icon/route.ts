export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { ITEMS, ITEM_ICON_PROMPTS, buildItemIconPrompt } from "../../../lib/gameData";
import { grokImageToTransparentPng } from "../../../lib/imageProcessing";

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function callGrokImagine(prompt: string): Promise<{
  b64: string | null;
  error: string | null;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await grok.images.generate({
      model: "grok-imagine-image",
      prompt,
      response_format: "b64_json",
      aspect_ratio: "1:1",
    } as any);
    const b64 = (response as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json ?? null;
    if (!b64) return { b64: null, error: "No image data in response" };
    return { b64, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { b64: null, error: msg };
  }
}

/**
 * GET /api/item-icon?id=healing_potion
 *
 * Returns a transparent PNG icon of the item for inventory/equipment display.
 * Generates on first request, runs through rembg to cut the white background,
 * caches in Supabase Storage. Falls back to buildItemIconPrompt(item.name) if
 * the item has no explicit iconPrompt.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("id") ?? "";

  const item = ITEMS[itemId];
  if (!item) {
    return NextResponse.json({ url: null, error: "Unknown item" }, { status: 400 });
  }

  // Lookup chain: explicit per-item override map → item.iconPrompt field → name fallback
  const subject = ITEM_ICON_PROMPTS[itemId] ?? item.name;
  const prompt = item.iconPrompt ?? buildItemIconPrompt(subject);
  const cacheKey = `itemIcon_${itemId}`;

  try {
    const { data: cached } = await supabaseAdmin
      .from("scene_image_cache")
      .select("image_url")
      .eq("room_id", cacheKey)
      .eq("room_state", "normal")
      .is("deleted_at", null)
      .single();

    if (cached?.image_url) {
      return NextResponse.json({ url: cached.image_url, cached: true });
    }

    const result = await callGrokImagine(prompt);
    if (!result.b64) {
      return NextResponse.json({ url: null, error: result.error });
    }

    const pngBuffer = await grokImageToTransparentPng(result.b64);

    const fileName = `${cacheKey}__${Date.now()}.png`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("scene-images")
      .upload(fileName, pngBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadErr) {
      console.error("Item icon upload failed:", uploadErr.message);
      return NextResponse.json({ url: null, error: "Upload failed" });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("scene-images")
      .getPublicUrl(fileName);

    const { error: cacheErr } = await supabaseAdmin
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
    if (cacheErr) console.error("Item icon cache write failed:", cacheErr);

    return NextResponse.json({ url: urlData.publicUrl, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Item icon error:", msg);
    return NextResponse.json({ url: null, error: msg });
  }
}
