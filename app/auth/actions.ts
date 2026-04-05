// app/auth/actions.ts
// Server Actions for login, register, and logout

"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabaseAuthServer";
import { serviceClient } from "../../lib/supabase";

// ── Register ───────────────────────────────────────────────────
export async function registerAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const heroName = formData.get("heroName") as string;

  if (!email || !password || !heroName) {
    redirect("/register?error=missing_fields");
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { hero_name: heroName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  // Link auth user to players table
  if (data.user) {
    await serviceClient.from("players").insert({
      user_id: data.user.id,
      character_name: heroName,
    });
  }

  // If email confirmation is required, redirect to a "check your email" page
  if (data.user && !data.session) {
    redirect("/register?success=check_email");
  }

  redirect("/");
}

// ── Login ──────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

// ── Google SSO ─────────────────────────────────────────────────
export async function googleSignInAction() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google_auth_failed");
  }

  redirect(data.url);
}

// ── Logout ─────────────────────────────────────────────────────
export async function logoutAction() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
