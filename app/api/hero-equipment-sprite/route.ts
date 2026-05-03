export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { grokImageToTransparentPng } from "../../../lib/imageProcessing";
import { canonicalFraming } from "../../../lib/spriteFraming";
import {
  EQUIPMENT_FRAMING,
  WEAPON_CARRY_FRAMING,
  STANCE_FRAMING,
  FRESH_REBIRTH_FRAMING,
  type Equipment,
  type Stance,
  type WeaponCarry,
} from "../../../lib/wardrobe";

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: "https://api.x.ai/v1",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Equipment/weapon/stance framing types + prompt blocks are the single
// source of truth in lib/wardrobe/prompts/body.ts — imported above.
// Wardrobe V2 refactor (2026-04-24) ended the duplication that used to
// live here and in scripts/forge-hero-equipment-variant.ts.

async function callGrokImagine(prompt: string): Promise<{
  b64: string | null;
  error: string | null;
}> {
  try {
    // `aspect_ratio` is xAI-specific and not in the OpenAI SDK typings.
    const response = await grok.images.generate({
      model: "grok-imagine-image-pro",
      prompt,
      response_format: "b64_json",
      aspect_ratio: "3:4",
    } as Parameters<typeof grok.images.generate>[0] & { aspect_ratio: string });
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
  const weapon = (searchParams.get("weapon") ?? "unarmed") as WeaponCarry;

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
  if (!(weapon in WEAPON_CARRY_FRAMING)) {
    return NextResponse.json(
      { url: null, error: `unknown weapon: ${weapon}` },
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
    // loincloth + unarmed + casual = the canonical master reference.
    if (
      equipment === "loincloth" &&
      weapon === "unarmed" &&
      stance === "casual"
    ) {
      return NextResponse.json({
        url: master.master_image_url,
        cached: true,
        source: "master",
      });
    }

    // ── Cache check for variations ──
    // Cache key encodes all three dimensions; unarmed is a first-class
    // value in the key so lookups are unambiguous.
    const cacheRoomId = `hero_eq_${heroMasterId}`;
    const cacheRoomState = `${equipment}_${weapon}_${stance}`;
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
    // Heroes always render screen-left and face screen-right.
    // Canonical framing enforces shared figure-fill + feet-at-bottom
    // so the hero and on-screen NPCs render at identical size.
    const prompt = [
      master.identity_block,
      EQUIPMENT_FRAMING[equipment],
      WEAPON_CARRY_FRAMING[weapon],
      STANCE_FRAMING[stance],
      FRESH_REBIRTH_FRAMING,
      canonicalFraming("left"),
    ]
      .filter((s) => s.length > 0)
      .join(" ");

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
