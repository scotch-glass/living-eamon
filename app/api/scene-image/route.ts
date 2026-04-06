import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { buildScenePrompt, SceneTone, SceneState } from "../../../lib/sceneData";

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("room") ?? "main_hall";
    const roomState = (searchParams.get("state") ?? "normal") as SceneState;
    const tone = (searchParams.get("tone") ?? "civilized") as SceneTone;

    // ── 1. Cache check ──────────────────────────────────────────────────────
    const { data: cached } = await supabaseAdmin
      .from("scene_image_cache")
      .select("image_url")
      .eq("room_id", roomId)
      .eq("room_state", roomState)
      .eq("tone", tone)
      .single();

    if (cached?.image_url) {
      return NextResponse.json({ url: cached.image_url, cached: true });
    }

    // ── 2. Build prompt ─────────────────────────────────────────────────────
    const prompt = buildScenePrompt(roomId, tone, roomState);

    // ── 3. Call Grok Imagine (standard tier — $0.02, cached after first gen) ─
    // response_format b64_json so we can upload to Supabase immediately —
    // xAI temporary URLs expire quickly and cannot be stored long-term.
    const imageResponse = await grok.images.generate({
      model: "grok-imagine-image",
      prompt,
      response_format: "b64_json",
      // @ts-expect-error — xAI-specific parameter not in OpenAI SDK types
      aspect_ratio: "16:9",
    });

    const b64 = imageResponse.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("No image data returned from Grok Imagine");
    }

    // ── 4. Upload to Supabase Storage ────────────────────────────────────────
    const imageBuffer = Buffer.from(b64, "base64");
    const fileName = `${roomId}__${tone}__${roomState}__${Date.now()}.jpg`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("scene-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // ── 5. Get permanent public URL ──────────────────────────────────────────
    const { data: publicData } = supabaseAdmin.storage
      .from("scene-images")
      .getPublicUrl(fileName);

    const permanentUrl = publicData.publicUrl;

    // ── 6. Save to cache ─────────────────────────────────────────────────────
    await supabaseAdmin.from("scene_image_cache").insert({
      room_id: roomId,
      room_state: roomState,
      tone,
      image_url: permanentUrl,
      prompt_used: prompt,
    });

    return NextResponse.json({ url: permanentUrl, cached: false });

  } catch (error) {
    console.error("Scene image error:", error);
    // Return 200 with null URL — ScenePanel handles this gracefully
    return NextResponse.json(
      { url: null, error: "Scene image unavailable" },
      { status: 200 }
    );
  }
}
