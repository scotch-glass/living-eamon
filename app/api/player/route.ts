import { NextRequest, NextResponse } from "next/server";
import { createPlayer, loadPlayer, loadPlayerByUserId } from "../../../lib/supabase";
import { createServerSupabase } from "../../../lib/supabaseAuthServer";

export async function POST(request: NextRequest) {
  try {
    const { playerName } = await request.json();
    if (!playerName || !playerName.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    // Get the auth user so we can link immediately on creation
    const supabaseAuth = await createServerSupabase();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const authUserId = user?.id;

    const player = await createPlayer(playerName.trim(), authUserId);
    if (!player) {
      return NextResponse.json({ error: "Could not create player" }, { status: 500 });
    }

    return NextResponse.json({ playerId: player.id, playerName: player.character_name });
  } catch (error) {
    console.error("Player creation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("id");
    if (!playerId) {
      return NextResponse.json({ error: "Player ID required" }, { status: 400 });
    }

    // Try auth user ID first (most common bootstrap case)
    let player = await loadPlayerByUserId(playerId);

    // Fall back to direct player ID lookup
    if (!player) {
      player = await loadPlayer(playerId);
    }

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error("Player load error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
