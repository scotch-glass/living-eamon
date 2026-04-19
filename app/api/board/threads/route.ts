import { createServerSupabase } from "../../../../lib/supabaseAuthServer";
import { serviceClient } from "../../../../lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const categorySlug = url.searchParams.get("category");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  try {
    let query = serviceClient
      .from("board_threads")
      .select(
        `
        id,
        category_id,
        title,
        hero_name,
        created_at,
        is_pinned,
        is_locked,
        board_categories(name, slug),
        board_posts(count)
      `,
        { count: "exact" }
      )
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (categorySlug) {
      const { data: category } = await serviceClient
        .from("board_categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

      if (!category) {
        return new Response(JSON.stringify({ error: "Category not found" }), { status: 404 });
      }

      query = query.eq("category_id", category.id);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(
      JSON.stringify({
        threads: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error fetching threads:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch threads" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const session = await supabase.auth.getSession();

  if (!session?.data?.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const userId = session.data.session.user.id;

  try {
    const body = await req.json();
    const { categoryId, title, body: threadBody } = body;

    if (!categoryId || !title || !threadBody) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Get hero name from players table
    const { data: player } = await serviceClient
      .from("players")
      .select("character_name")
      .eq("user_id", userId)
      .single();

    const heroName = player?.character_name || "Unknown Hero";

    const { data, error } = await serviceClient
      .from("board_threads")
      .insert({
        category_id: categoryId,
        user_id: userId,
        hero_name: heroName,
        title,
        body: threadBody,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating thread:", err);
    return new Response(JSON.stringify({ error: "Failed to create thread" }), { status: 500 });
  }
}
