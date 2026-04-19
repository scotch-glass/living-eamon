import { createServerSupabase } from "../../../../lib/supabaseAuthServer";
import { serviceClient } from "../../../../lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const threadId = url.searchParams.get("thread");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  if (!threadId) {
    return new Response(JSON.stringify({ error: "Missing thread ID" }), { status: 400 });
  }

  try {
    const { data, error, count } = await serviceClient
      .from("board_posts")
      .select("id, thread_id, hero_name, body, created_at", { count: "exact" })
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        posts: data || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error fetching posts:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), { status: 500 });
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
    const { threadId, body: postBody } = body;

    if (!threadId || !postBody) {
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
      .from("board_posts")
      .insert({
        thread_id: threadId,
        user_id: userId,
        hero_name: heroName,
        body: postBody,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error creating post:", err);
    return new Response(JSON.stringify({ error: "Failed to create post" }), { status: 500 });
  }
}
