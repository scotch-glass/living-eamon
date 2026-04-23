export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { grokImageToTransparentPng } from "../../../lib/imageProcessing";

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Framing addendums for each (equipment × stance) combination.
 *
 * For `equipment === "loincloth"` + `stance === "casual"` we return the
 * hero's stored master image directly — that IS the loincloth casual pose
 * that was generated at character creation. All other combos require a
 * fresh Grok Imagine Pro call using the hero's Identity Block + the
 * framing below, then cache the result.
 *
 * Adding a new equipment state means adding one entry here — no schema
 * or client changes required.
 */
type Equipment = "loincloth" | "gray_robe";
type Stance = "casual" | "combat";

const EQUIPMENT_FRAMING: Record<Equipment, string> = {
  loincloth:
    "Clothed only in a dark leather loincloth, bare-chested and fully barefoot, torso and limbs exposed.",
  gray_robe: [
    "Dressed only in a coarse gray sackcloth robe of the Church of",
    "Perpetual Life — a thin, ill-fitting hospital-gown-style garment",
    "that ties loosely at the nape of the neck and falls just above the",
    "knee. The robe covers the front and sides but is open at the back,",
    "held together only by a single thin tie; the gap exposes the hero's",
    "bare muscled spine, shoulder blades, and the small of his back. His",
    "bare legs are visible below the knee. The garment is barely long",
    "enough to be decent — a shameful and humbling vestment given to the",
    "freshly-rebirthed.",
  ].join(" "),
};

const STANCE_FRAMING: Record<Stance, string> = {
  casual: [
    "Casual standing pose, three-quarter angle facing the camera, feet",
    "shoulder-width apart, arms relaxed at the sides, weight balanced,",
    "expression stoic. Not ready for combat — simply standing.",
  ].join(" "),
  combat: [
    "Combat-ready stance, three-quarter angle facing the camera, feet",
    "braced in a fighter's guard, weight low and balanced, arms raised",
    "ready to strike or defend, jaw set, eyes hard. Coiled to move.",
  ].join(" "),
};

const BACKDROP_FRAMING = [
  "Rendered on a pure white studio backdrop, cleanly isolated from any",
  "environment, no background elements, no props except what is worn.",
  "Even studio lighting. Full body in frame from head to feet with",
  "comfortable margin.",
  "Fresh-rebirth state: unscarred smooth skin, no battle marks, no",
  "blood, no dirt or grime, no tan lines or sunburn, no visible wounds,",
  "no bandages, no eye patches, no brands.",
].join(" ");

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
      aspect_ratio: "3:4",
    } as any);
    const b64 =
      (response as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json ??
      null;
    if (!b64) return { b64: null, error: "No image data in response" };
    return { b64, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { b64: null, error: msg };
  }
}

/**
 * GET /api/hero-equipment-sprite?heroMasterId=UUID&equipment=gray_robe&stance=casual
 *
 * Returns a transparent-PNG sprite of the specific player's hero wearing
 * the specified equipment in the specified stance.
 *
 * - Default state (loincloth + casual) short-circuits to the master image
 *   that was generated during character creation.
 * - Any other combination is generated via Grok Imagine Pro once and
 *   cached forever in scene_image_cache (room_id=hero_eq_{heroMasterId},
 *   room_state={equipment}_{stance}).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const heroMasterId = (searchParams.get("heroMasterId") ?? "").trim();
  const equipment = (searchParams.get("equipment") ?? "loincloth") as Equipment;
  const stance = (searchParams.get("stance") ?? "casual") as Stance;

  if (!heroMasterId) {
    return NextResponse.json(
      { url: null, error: "heroMasterId required" },
      { status: 400 }
    );
  }
  if (!(equipment in EQUIPMENT_FRAMING)) {
    return NextResponse.json(
      { url: null, error: `unknown equipment: ${equipment}` },
      { status: 400 }
    );
  }
  if (!(stance in STANCE_FRAMING)) {
    return NextResponse.json(
      { url: null, error: `unknown stance: ${stance}` },
      { status: 400 }
    );
  }

  try {
    // ── Load the master row (we need the Identity Block + fallback URL) ──
    const { data: master, error: masterErr } = await supabaseAdmin
      .from("hero_masters")
      .select("id, identity_block, master_image_url")
      .eq("id", heroMasterId)
      .maybeSingle();
    if (masterErr || !master) {
      return NextResponse.json(
        { url: null, error: `hero master not found: ${heroMasterId}` },
        { status: 404 }
      );
    }

    // ── Default state: return the master image directly ──
    if (equipment === "loincloth" && stance === "casual") {
      return NextResponse.json({
        url: master.master_image_url,
        cached: true,
        source: "master",
      });
    }

    // ── Cache check for variations ──
    const cacheRoomId = `hero_eq_${heroMasterId}`;
    const cacheRoomState = `${equipment}_${stance}`;
    const { data: cached } = await supabaseAdmin
      .from("scene_image_cache")
      .select("image_url")
      .eq("room_id", cacheRoomId)
      .eq("room_state", cacheRoomState)
      .is("deleted_at", null)
      .maybeSingle();

    if (cached?.image_url) {
      return NextResponse.json({
        url: cached.image_url,
        cached: true,
        source: "variation_cache",
      });
    }

    // ── Generate ──
    const prompt = [
      master.identity_block,
      EQUIPMENT_FRAMING[equipment],
      STANCE_FRAMING[stance],
      BACKDROP_FRAMING,
    ].join(" ");

    const result = await callGrokImagine(prompt);
    if (!result.b64) {
      return NextResponse.json({ url: null, error: result.error }, { status: 502 });
    }

    // ── rembg cuts the white backdrop to transparent ──
    const pngBuffer = await grokImageToTransparentPng(result.b64);

    // ── Upload to scene-images bucket ──
    const fileName = `${cacheRoomId}__${cacheRoomState}__${Date.now()}.png`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("scene-images")
      .upload(fileName, pngBuffer, {
        contentType: "image/png",
        upsert: false,
      });
    if (uploadErr) {
      console.error("Hero equipment sprite upload failed:", uploadErr.message);
      return NextResponse.json(
        { url: null, error: "Upload failed" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("scene-images")
      .getPublicUrl(fileName);

    // ── Cache ──
    const { error: cacheErr } = await supabaseAdmin
      .from("scene_image_cache")
      .insert({
        room_id: cacheRoomId,
        room_state: cacheRoomState,
        tone: "hero_equipment",
        image_url: urlData.publicUrl,
        prompt_used: prompt.slice(0, 4000),
      });
    if (cacheErr) {
      console.error("Hero equipment sprite cache insert failed:", cacheErr);
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      cached: false,
      source: "grok_freshly_generated",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Hero equipment sprite error:", msg);
    return NextResponse.json({ url: null, error: msg }, { status: 500 });
  }
}
