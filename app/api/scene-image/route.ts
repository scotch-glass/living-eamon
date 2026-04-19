export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  buildScenePrompt,
  buildScenePromptSanitized,
  SceneTone,
  SceneState,
} from "../../../lib/sceneData";
import { getRoom } from "../../../lib/adventures/registry";

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ── Error log writer ────────────────────────────────────────────────────────
async function appendErrorLog(entry: {
  timestamp: string;
  roomId: string;
  tone: SceneTone;
  roomState: SceneState;
  attemptNumber: number;
  promptUsed: string;
  errorType: "censored" | "api_error" | "timeout" | "no_data";
  rawError: string;
}) {
  // Local visibility
  console.error("[GROK_IMAGINE_ERROR]", JSON.stringify(entry, null, 2));

  // Persist to Supabase for production visibility
  try {
    await supabaseAdmin.from("grok_imagine_error_log").insert({
      room_id: entry.roomId,
      tone: entry.tone,
      room_state: entry.roomState,
      attempt_number: entry.attemptNumber,
      error_type: entry.errorType,
      raw_error: entry.rawError.slice(0, 2000),
      prompt_used: entry.promptUsed.slice(0, 4000),
      created_at: entry.timestamp,
    });
  } catch {
    // Log table may not exist yet — fail silently, console.error above is enough
  }
}

// ── Single Grok Imagine call ─────────────────────────────────────────────────
async function callGrokImagine(prompt: string): Promise<{
  b64: string | null;
  censored: boolean;
  error: string | null;
}> {
  try {
    const imageResponse = await grok.images.generate({
      model: "grok-imagine-image-pro",
      prompt,
      response_format: "b64_json",
      // @ts-expect-error — xAI-specific parameter
      aspect_ratio: "16:9",
    });

    const b64 = imageResponse.data?.[0]?.b64_json ?? null;
    if (!b64) {
      return { b64: null, censored: false, error: "No image data in response" };
    }
    return { b64, censored: false, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // xAI returns moderation rejections as errors containing these strings
    const isCensored =
      msg.toLowerCase().includes("moderat") ||
      msg.toLowerCase().includes("policy") ||
      msg.toLowerCase().includes("safety") ||
      msg.toLowerCase().includes("content") ||
      msg.toLowerCase().includes("violat");
    return { b64: null, censored: isCensored, error: msg };
  }
}

// ── Upload b64 image to Supabase Storage ─────────────────────────────────────
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
    console.error("Storage upload failed:", error.message);
    return null;
  }
  const { data } = supabaseAdmin.storage
    .from("scene-images")
    .getPublicUrl(fileName);
  return data.publicUrl;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("room") ?? "main_hall";
  const roomState = (searchParams.get("state") ?? "normal") as SceneState;
  const tone = (searchParams.get("tone") ?? "civilized") as SceneTone;
  const visualDescription = getRoom(roomId)?.visualDescription ?? null;

  try {
    // ── 1. Cache check (soft-delete aware) ──────────────────────────────────
    const { data: cached } = await supabaseAdmin
      .from("scene_image_cache")
      .select("image_url")
      .eq("room_id", roomId)
      .eq("room_state", roomState)
      .eq("tone", tone)
      .is("deleted_at", null)
      .single();

    if (cached?.image_url) {
      return NextResponse.json({
        url: cached.image_url,
        cached: true,
        visualDescription,
      });
    }

    // ── 2. First attempt ──────────────────────────────────────────────────────
    const prompt = buildScenePrompt(roomId, tone, roomState);
    const attempt1 = await callGrokImagine(prompt);

    if (attempt1.b64) {
      // Success on first try
      const fileName = `${roomId}__${tone}__${roomState}__${Date.now()}.jpg`;
      const url = await uploadToStorage(attempt1.b64, fileName);
      if (url) {
        await supabaseAdmin.from("scene_image_cache").insert({
          room_id: roomId,
          room_state: roomState,
          tone,
          image_url: url,
          prompt_used: prompt,
        });
        return NextResponse.json({ url, cached: false, visualDescription });
      }
    }

    // ── 3. Censorship retry ───────────────────────────────────────────────────
    if (attempt1.censored) {
      const timestamp = new Date().toISOString();
      void appendErrorLog({
        timestamp,
        roomId,
        tone,
        roomState,
        attemptNumber: 1,
        promptUsed: prompt,
        errorType: "censored",
        rawError: attempt1.error ?? "unknown",
      });

      // Retry with sanitized prompt
      const sanitizedPrompt = buildScenePromptSanitized(roomId, tone, roomState);
      const attempt2 = await callGrokImagine(sanitizedPrompt);

      if (attempt2.b64) {
        const fileName = `${roomId}__${tone}__${roomState}__retry__${Date.now()}.jpg`;
        const url = await uploadToStorage(attempt2.b64, fileName);
        if (url) {
          await supabaseAdmin.from("scene_image_cache").insert({
            room_id: roomId,
            room_state: roomState,
            tone,
            image_url: url,
            prompt_used: sanitizedPrompt,
          });
          return NextResponse.json({
            url,
            cached: false,
            visualDescription,
            retried: true, // tells ScenePanel to show the apology
          });
        }
      }

      // Both attempts censored or failed
      void appendErrorLog({
        timestamp: new Date().toISOString(),
        roomId,
        tone,
        roomState,
        attemptNumber: 2,
        promptUsed: sanitizedPrompt,
        errorType: attempt2.censored ? "censored" : "api_error",
        rawError: attempt2.error ?? "unknown",
      });

      return NextResponse.json({
        url: null,
        cached: false,
        visualDescription,
        error: "Scene could not be rendered — the Sight is clouded here.",
        errorType: "censored",
      });
    }

    // ── 4. Non-censorship API error ───────────────────────────────────────────
    void appendErrorLog({
      timestamp: new Date().toISOString(),
      roomId,
      tone,
      roomState,
      attemptNumber: 1,
      promptUsed: prompt,
      errorType: "api_error",
      rawError: attempt1.error ?? "unknown",
    });

    return NextResponse.json({
      url: null,
      cached: false,
      visualDescription,
      error: "The Sight falters. Jane cannot show you this place right now.",
      errorType: "api_error",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Scene image route error:", msg);
    return NextResponse.json({
      url: null,
      cached: false,
      visualDescription,
      error: "The Sight is unavailable. The realm continues without vision.",
      errorType: "unknown",
    });
  }
}
