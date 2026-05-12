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

  // Quest Line Orchestrator — admin-role required in BOTH dev and prod.
  // Quest Lines stitch creator-authored modules together; that's admin
  // work. Sits before the general /admin/ dev-open gate so the role
  // check is never skipped.
  if (pathname.startsWith("/admin/quest-lines")) {
    if (!user) {
      return NextResponse.redirect(new URL("/splash", request.url));
    }
    const { data: roleRow } = await supabaseAdmin
      .from("players")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    const role = (roleRow?.role as "player" | "creator" | "admin" | undefined) ?? "player";
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/splash", request.url));
    }
    return response;
  }

  // Creator Forge — role creator OR admin required (in BOTH dev and
  // prod). Lives at /creator-forge/* outside /admin/ since creators
  // are not admins.
  if (pathname.startsWith("/creator-forge")) {
    if (!user) {
      return NextResponse.redirect(new URL("/splash", request.url));
    }
    const { data: roleRow } = await supabaseAdmin
      .from("players")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    const role = (roleRow?.role as "player" | "creator" | "admin" | undefined) ?? "player";
    if (role !== "creator" && role !== "admin") {
      return NextResponse.redirect(new URL("/splash", request.url));
    }
    return response;
  }

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
    (pathname.startsWith("/admin/") && process.env.NODE_ENV !== "production") ||
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

  // /library — Creator-facing wiki. Requires players.role IN ('creator', 'admin').
  // Sits BEFORE the character-creation gate so module authors who haven't built
  // a hero can still browse the canon. Sprint W2 will replace the redirect with
  // a styled 403 page; for now, insufficient role bounces to splash.
  if (pathname.startsWith("/library")) {
    const { data: roleRow } = await supabaseAdmin
      .from("players")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    const role = (roleRow?.role as "player" | "creator" | "admin" | undefined) ?? "player";
    if (role !== "creator" && role !== "admin") {
      return NextResponse.redirect(new URL("/splash", request.url));
    }
    return response;
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
