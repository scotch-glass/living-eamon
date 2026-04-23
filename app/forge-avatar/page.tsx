import { redirect } from "next/navigation";
import { createServerSupabase } from "../../lib/supabaseAuthServer";
import { serviceClient } from "../../lib/supabase";
import WizardClient, { type HeroMaster } from "./WizardClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function ForgeAvatarPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;

  // Require auth. Proxy already enforces this but defense in depth.
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If this player already has a chosen master, no wizard needed — straight to game.
  const { data: existingPlayer } = await serviceClient
    .from("players")
    .select("hero_master_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingPlayer?.hero_master_id) redirect("/");

  // Load the live curated library.
  const { data, error } = await serviceClient
    .from("hero_masters")
    .select("id, slug, hero_name, master_image_url, customization_vector")
    .eq("source", "curated")
    .is("retired_at", null)
    .order("hero_name", { ascending: true });

  if (error) {
    console.error("hero_masters load failed:", error.message);
  }

  const masters: HeroMaster[] = (data ?? []) as HeroMaster[];

  return <WizardClient masters={masters} error={params?.error ?? null} />;
}
