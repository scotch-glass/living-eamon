import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "./lib/supabaseAuthServer";

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
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/player") ||
    pathname.startsWith("/api/board") ||
    pathname === "/favicon.ico"
  ) {
    return response;
  }

  // Protected routes (the game itself) — redirect unauthenticated users to splash
  if (!user) {
    const splashUrl = new URL("/splash", request.url);
    return NextResponse.redirect(splashUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default middleware;
