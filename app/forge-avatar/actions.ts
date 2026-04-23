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

  // Does a player row already exist for this auth user?
  const { data: existing } = await serviceClient
    .from("players")
    .select("id")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (existing) {
    const { error } = await serviceClient
      .from("players")
      .update({
        hero_master_id: masterId,
        character_name: heroName,
        backstory,
      })
      .eq("user_id", user!.id);
    if (error) {
      redirect(`/forge-avatar?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await serviceClient.from("players").insert({
      user_id: user!.id,
      hero_master_id: masterId,
      character_name: heroName,
      backstory,
      current_room: "church_of_perpetual_life",
      turn_count: 0,
    });
    if (error) {
      redirect(`/forge-avatar?error=${encodeURIComponent(error.message)}`);
    }
  }

  redirect("/");
}
