"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabaseAuthServer";
import { serviceClient } from "../../lib/supabase";

/**
 * Commit a chosen hero master to the authenticated user's player row.
 * Creates the player row if it doesn't exist yet. Called from the
 * character-creation wizard form.
 */
export async function commitHero(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const masterId = (formData.get("masterId") as string | null)?.trim() ?? "";
  const heroName = (formData.get("heroName") as string | null)?.trim() ?? "";
  const backstoryRaw = (formData.get("backstory") as string | null)?.trim() ?? "";
  const backstory = backstoryRaw.length > 0 ? backstoryRaw : null;

  if (!masterId || !heroName) {
    redirect("/forge-avatar?error=missing_fields");
  }

  // Verify the master exists and is live. Prevents tampering with masterId.
  const { data: master, error: masterErr } = await serviceClient
    .from("hero_masters")
    .select("id")
    .eq("id", masterId)
    .is("retired_at", null)
    .maybeSingle();
  if (masterErr || !master) {
    redirect("/forge-avatar?error=invalid_master");
  }

  // Fresh-start defaults applied to BOTH insert and update. Legacy testers
  // who had pre-wizard player rows will get their game state reset when
  // they commit their new hero — no carryover of old gold, inventory,
  // adventure progress, etc. This matches the design intent that
  // character creation yields a truly fresh Perpetual Hero.
  const freshState = {
    hero_master_id: masterId,
    character_name: heroName,
    backstory,
    hp: 20,
    max_hp: 20,
    strength: 12,
    dexterity: 10,
    charisma: 10,
    gold: 0,
    banked_gold: 0,
    weapon: "unarmed",
    armor: null,
    shield: null,
    helmet: null,
    gorget: null,
    body_armor: null,
    limb_armor: null,
    active_combat: null,
    mounted: false,
    remembers_own_name: false,
    met_zim: false,
    inventory: [{ itemId: "gray_robe", quantity: 1 }],
    virtues: {},
    reputation_score: 0,
    reputation_level: "Unknown",
    known_as: null,
    current_room: "church_of_perpetual_life",
    current_adventure: null,
    completed_adventures: [],
    bounty: 0,
    is_wanted: false,
    turn_count: 0,
    visited_rooms: ["church_of_perpetual_life"],
    barmaid_preference: null,
    received_sam_starter_outfit: false,
    received_hokas_unarmed_gift: false,
    weapon_skills: {},
  };

  // Does a player row already exist for this auth user?
  const { data: existing } = await serviceClient
    .from("players")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (existing) {
    // Legacy tester: reset the existing row to fresh-hero state.
    const { error } = await serviceClient
      .from("players")
      .update(freshState)
      .eq("user_id", user!.id);
    if (error) {
      redirect(`/forge-avatar?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    // New user: insert a fresh row.
    const { error } = await serviceClient
      .from("players")
      .insert({ user_id: user!.id, ...freshState });
    if (error) {
      redirect(`/forge-avatar?error=${encodeURIComponent(error.message)}`);
    }
  }

  redirect("/");
}
