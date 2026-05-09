// ============================================================
// W1 — User role helper for the /library wiki gate.
//
// Roles (matches the players.role column added in
// supabase/migrations/20260509000000_w1_player_role.sql):
//   - 'player'  : default; cannot access /library
//   - 'creator' : Ink module authors; read access to /library
//   - 'admin'   : Scotch; full access (only Scotch initially)
//
// Treated as auth metadata, NOT WorldState — does not round-trip
// through lib/persistence/playerRecord.ts. Modified by admin SQL,
// queried directly in proxy.ts and server components.
// ============================================================

import { createClient } from "@supabase/supabase-js";

export type UserRole = "player" | "creator" | "admin";

const ROLE_RANK: Record<UserRole, number> = {
  player: 0,
  creator: 1,
  admin: 2,
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Look up the role for a given Supabase auth user id.
 * Returns 'player' if the row is missing or the column is null.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const { data } = await supabaseAdmin
    .from("players")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  const role = data?.role as UserRole | undefined;
  return role ?? "player";
}

/**
 * True if `role` is at least as privileged as `threshold`.
 * admin >= creator >= player.
 */
export function roleMeetsThreshold(role: UserRole, threshold: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[threshold];
}
