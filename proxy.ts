import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "./lib/supabaseAuthServer";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareSupabase(request, response);

  // Refresh session if it exists — required for SSR auth
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Auth routes — allow through always
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/player") ||
    pathname === "/favicon.ico"
  ) {
    return response;
  }

  // Protected routes — redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default middleware;
