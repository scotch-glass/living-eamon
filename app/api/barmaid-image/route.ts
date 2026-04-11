export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { NPCS } from "../../../lib/gameData";

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const VALID_IDS = ["lira", "mavia", "seraine"];

async function callGrokImagine(prompt: string): Promise<{
  b64: string | null;
  error: string | null;
}> {
  try {
    const response = await grok.images.generate({
      model: "grok-imagine-image",
      prompt,
      response_format: "b64_json",
    });
    const b64 = response.data?.[0]?.b64_json ?? null;
    if (!b64) return { b64: null, error: "No image data in response" };
    return { b64, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { b64: null, error: msg };
  }
}

async function uploadToStorage(
  b64: string,
  fileName: string
): Promise<string | null> {
  const imageBuffer = Buffer.from(b64, "base64");
  const { error } = await supabaseAdmin.storage
    .from("scene-images")
    .upload(fileName, imageBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });
  if (error) {
    console.error("Portrait upload failed:", error.message);
    return null;
  }
  const { data } = supabaseAdmin.storage
    .from("scene-images")
    .getPublicUrl(fileName);
  return data.publicUrl;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barmaidId = searchParams.get("id") ?? "";

  if (!VALID_IDS.includes(barmaidId)) {
    return NextResponse.json({ url: null, error: "Invalid barmaid id" }, { status: 400 });
  }

  const npc = NPCS[barmaidId];
  if (!npc?.portraitPrompt) {
    return NextResponse.json({ url: null, error: "No portrait prompt" }, { status: 500 });
  }

  try {
    // ── 1. Cache check (soft-delete aware) ─────────────────────
    const { data: cached } = await supabaseAdmin
      .from("scene_image_cache")
      .select("image_url")
      .eq("room_id", `portrait_${barmaidId}`)
      .eq("room_state", "normal")
      .eq("tone", "aquilonian")
      .is("deleted_at", null)
      .single();

    if (cached?.image_url) {
      return NextResponse.json({ url: cached.image_url, cached: true });
    }

    // ── 2. Generate ─────────────────────────────────────────────
    const result = await callGrokImagine(npc.portraitPrompt);

    if (!result.b64) {
      return NextResponse.json({ url: null, error: result.error });
    }

    const fileName = `portrait_${barmaidId}__${Date.now()}.jpg`;
    const url = await uploadToStorage(result.b64, fileName);

    if (url) {
      await supabaseAdmin.from("scene_image_cache").insert({
        room_id: `portrait_${barmaidId}`,
        room_state: "normal",
        tone: "aquilonian",
        image_url: url,
        prompt_used: npc.portraitPrompt,
      });
      return NextResponse.json({ url, cached: false });
    }

    return NextResponse.json({ url: null, error: "Upload failed" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Barmaid image error:", msg);
    return NextResponse.json({ url: null, error: msg });
  }
}
