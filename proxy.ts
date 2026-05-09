import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createMiddlewareSupabase } from "./lib/supabaseAuthServer";

// Service-role client for reading players.hero_master_id during the
// character-creation gate check. Scoped to middleware only.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareSupabase(request, response);

  // Refresh session if it exists — required for SSR auth
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes — allow through always (no auth required)
  if (
    pathname.startsWith("/splash") ||
    pathname.startsWith("/updates") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/board") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    // Dev-only routes (combat test harness, etc.). Gated on NODE_ENV so
    // they can't leak past staging into production builds.
    (pathname.startsWith("/dev/") && process.env.NODE_ENV !== "production") ||
    // Sprite Review Tool APIs — paired with /dev/sprite-review. Same
    // NODE_ENV gate so they can't leak past staging.
    ((pathname === "/api/sprite-list" ||
      pathname === "/api/sprite-metadata" ||
      pathname === "/api/sprite-regen" ||
      pathname === "/api/sprite-touchup" ||
      pathname === "/api/prompt-rules" ||
      // /dev/combat-arena fetches painted potion / bandage icons via
      // ItemIcon. Same NODE_ENV gate so this doesn't leak past staging.
      pathname === "/api/item-icon") &&
      process.env.NODE_ENV !== "production") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/player") ||
    pathname.startsWith("/api/board") ||
    pathname === "/favicon.ico"
  ) {
    return response;
  }

  // Protected routes — redirect unauthenticated users to splash
  if (!user) {
    const splashUrl = new URL("/splash", request.url);
    return NextResponse.redirect(splashUrl);
  }

  // Character-creation gate: authenticated users without a chosen hero
  // master go to the wizard. The wizard itself is allowed through.
  if (pathname.startsWith("/forge-avatar")) {
    return response;
  }
  const { data: player } = await supabaseAdmin
    .from("players")
    .select("hero_master_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!player?.hero_master_id) {
    const wizardUrl = new URL("/forge-avatar", request.url);
    return NextResponse.redirect(wizardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default middleware;
