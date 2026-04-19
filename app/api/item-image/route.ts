export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { ITEMS } from "../../../lib/gameData";

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
      model: "grok-imagine-image-pro",
      prompt,
      response_format: "b64_json",
      aspect_ratio: "4:3",
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
 * GET /api/item-image?id=healing_potion
 *
 * Returns an alchemical-book-page background image for an item's popup.
 * Generates on first request, caches in Supabase Storage. NO background removal.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("id") ?? "";

  const item = ITEMS[itemId];
  if (!item?.bookPagePrompt) {
    return NextResponse.json({ url: null, error: "No bookPagePrompt for this item" }, { status: 400 });
  }

  const cacheKey = `itemBg_${itemId}`;

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

    const result = await callGrokImagine(item.bookPagePrompt);
    if (!result.b64) {
      return NextResponse.json({ url: null, error: result.error });
    }

    const imageBuffer = Buffer.from(result.b64, "base64");
    const fileName = `${cacheKey}__${Date.now()}.jpg`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("scene-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      console.error("Item bg upload failed:", uploadErr.message);
      return NextResponse.json({ url: null, error: "Upload failed" });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("scene-images")
      .getPublicUrl(fileName);

    await supabaseAdmin.from("scene_image_cache").insert({
      room_id: cacheKey,
      room_state: "normal",
      tone: "alchemical",
      image_url: urlData.publicUrl,
      prompt_used: item.bookPagePrompt,
    });

    return NextResponse.json({ url: urlData.publicUrl, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Item bg error:", msg);
    return NextResponse.json({ url: null, error: msg });
  }
}
