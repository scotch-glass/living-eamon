export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { HEROES } from "../../../lib/gameData";
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
      aspect_ratio: "3:4",
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
 * GET /api/hero-image?id=george
 *
 * Returns a transparent PNG sprite of the player hero. Mirrors the NPC
 * sprite pipeline exactly — same Grok aspect ratio, same rembg cut, same
 * cache table — so the combat overlay can render hero & enemy sprites
 * with identical sizing rules.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const heroId = (searchParams.get("id") ?? "").toLowerCase();

  const hero = HEROES[heroId];
  if (!hero?.spritePrompt) {
    return NextResponse.json({ url: null, error: "No sprite prompt for this hero" }, { status: 400 });
  }

  const cacheKey = `hero_sprite_${heroId}`;

  try {
    // ── 1. Cache check ──
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

    // ── 2. Generate ──
    const result = await callGrokImagine(hero.spritePrompt);
    if (!result.b64) {
      return NextResponse.json({ url: null, error: result.error });
    }

    // ── 3. Cut white → transparent PNG ──
    const pngBuffer = await grokImageToTransparentPng(result.b64);

    // ── 4. Upload ──
    const fileName = `${cacheKey}__${Date.now()}.png`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("scene-images")
      .upload(fileName, pngBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadErr) {
      console.error("Hero sprite upload failed:", uploadErr.message);
      return NextResponse.json({ url: null, error: "Upload failed" });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("scene-images")
      .getPublicUrl(fileName);

    // ── 5. Cache record ──
    const { error: cacheErr } = await supabaseAdmin.from("scene_image_cache").insert({
      room_id: cacheKey,
      room_state: "normal",
      tone: "sprite",
      image_url: urlData.publicUrl,
      prompt_used: hero.spritePrompt,
    });
    if (cacheErr) console.error("Hero sprite cache insert failed:", cacheErr);

    return NextResponse.json({ url: urlData.publicUrl, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Hero sprite error:", msg);
    return NextResponse.json({ url: null, error: msg });
  }
}
