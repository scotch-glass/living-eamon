export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerSupabase } from "../../../lib/supabaseAuthServer";
import { serviceClient } from "../../../lib/supabase";

/**
 * GET /api/my-hero-master
 *
 * Returns the authenticated player's chosen hero_master_id. Used by the
 * game client to know which library master to render as the player's
 * on-screen portrait.
 *
 * Response: { heroMasterId: string | null }
 */
export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { heroMasterId: null, error: "unauthenticated" },
      { status: 401 }
    );
  }

  const { data: player, error } = await serviceClient
    .from("players")
    .select("hero_master_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { heroMasterId: null, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    heroMasterId: player?.hero_master_id ?? null,
  });
}
