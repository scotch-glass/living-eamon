"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import PublicNav from "../../../components/PublicNav";
import { createBrowserSupabase } from "../../../lib/supabaseAuthClient";

interface ThreadData {
  id: number;
  title: string;
  hero_name: string;
  body: string;
  created_at: string;
  is_locked: boolean;
  category_id: number;
}

interface PostData {
  id: number;
  hero_name: string;
  body: string;
  created_at: string;
}

export default function ThreadPage() {
  const params = useParams();
  const threadId = parseInt(params.threadId as string);

  const [thread, setThread] = useState<ThreadData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createBrowserSupabase();
        const session = await supabase.auth.getSession();
        setUser(session.data.session?.user || null);

        // Fetch thread (using Supabase client for public data)
        const { data: threadData } = await supabase
          .from("board_threads")
          .select("id, title, hero_name, body, created_at, is_locked, category_id")
          .eq("id", threadId)
          .single();

        if (threadData) {
          setThread(threadData);
        }

        // Fetch posts
        const { data: postsData } = await supabase
          .from("board_posts")
          .select("id, hero_name, body, created_at")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true });

        if (postsData) {
          setPosts(postsData);
        }
      } catch (err) {
        console.error("Error loading thread:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [threadId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyText.trim()) return;

    setReplyLoading(true);
    try {
      const res = await fetch("/api/board/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, body: replyText }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts([...posts, newPost]);
        setReplyText("");
      } else {
        alert("Failed to post reply");
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      alert("Error posting reply");
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#030712",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <PublicNav currentPage="board" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#6b7280", fontFamily: "Georgia, serif" }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#030712",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <PublicNav currentPage="board" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ color: "#6b7280", fontFamily: "Georgia, serif" }}>Thread not found</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PublicNav currentPage="board" />

      <main
        style={{
          flex: 1,
          padding: "40px 32px",
          maxWidth: 900,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: 12,
            color: "#8a7a60",
            fontFamily: "Georgia, serif",
            marginBottom: 24,
          }}
        >
          <a href="/board" style={{ color: "#8a7a60", textDecoration: "none" }}>
            Board
          </a>
          {" → "}
          <span>{thread.title}</span>
        </div>

        {/* Original Post */}
        <div
          style={{
            background: "rgba(45, 22, 0, 0.4)",
            border: "1px solid rgba(146, 64, 14, 0.3)",
            borderRadius: 8,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div
                style={{
                  color: "#fbbf24",
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: "Georgia, serif",
                }}
              >
                {thread.hero_name}
              </div>
              <div
                style={{
                  color: "#8a7a60",
                  fontSize: 11,
                  fontFamily: "Georgia, serif",
                  marginTop: 4,
                }}
              >
                {new Date(thread.created_at).toLocaleString()}
              </div>
            </div>
            {thread.is_locked && (
              <div
                style={{
                  color: "#ca8a04",
                  fontSize: 11,
                  fontFamily: "Georgia, serif",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                🔒 Locked
              </div>
            )}
          </div>

          <h1
            style={{
              color: "#fbbf24",
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              margin: "16px 0",
            }}
          >
            {thread.title}
          </h1>

          <div
            style={{
              color: "#a8a097",
              fontSize: 13,
              fontFamily: "Georgia, serif",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {thread.body}
          </div>
        </div>

        {/* Replies */}
        {posts.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2
              style={{
                color: "#fbbf24",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "Georgia, serif",
                marginBottom: 16,
              }}
            >
              {posts.length} {posts.length === 1 ? "Reply" : "Replies"}
            </h2>

            {posts.map((post, idx) => (
              <div
                key={post.id}
                style={{
                  background: idx % 2 === 0 ? "rgba(45, 22, 0, 0.2)" : "transparent",
                  border: "1px solid rgba(146, 64, 14, 0.2)",
                  borderRadius: 6,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div
                    style={{
                      color: "#c5ad75",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {post.hero_name}
                  </div>
                  <div
                    style={{
                      color: "#5a4a3a",
                      fontSize: 10,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {new Date(post.created_at).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    color: "#a8a097",
                    fontSize: 12,
                    fontFamily: "Georgia, serif",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {post.body}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Form */}
        {user ? (
          <div
            style={{
              background: "rgba(12, 6, 2, 0.6)",
              border: "1px solid rgba(146, 64, 14, 0.3)",
              borderRadius: 8,
              padding: 24,
            }}
          >
            <h3
              style={{
                color: "#fbbf24",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Georgia, serif",
                marginBottom: 12,
              }}
            >
              Add thy reply
            </h3>
            <form onSubmit={handleReply} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Share thy thoughts..."
                required
                style={{
                  backgroundColor: "#111827",
                  border: "1px solid #374151",
                  color: "#e5e7eb",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: "Georgia, serif",
                  minHeight: 100,
                  outline: "none",
                  resize: "vertical",
                }}
              />
              <button
                type="submit"
                disabled={replyLoading}
                style={{
                  backgroundColor: "#92400e",
                  color: "#fef3c7",
                  padding: "10px 16px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  border: "none",
                  cursor: replyLoading ? "not-allowed" : "pointer",
                  opacity: replyLoading ? 0.6 : 1,
                  fontFamily: "Georgia, serif",
                  transition: "background 0.2s",
                  textTransform: "uppercase",
                }}
                onMouseEnter={(e) => {
                  if (!replyLoading) (e.currentTarget as HTMLButtonElement).style.background = "#a84d10";
                }}
                onMouseLeave={(e) => {
                  if (!replyLoading) (e.currentTarget as HTMLButtonElement).style.background = "#92400e";
                }}
              >
                {replyLoading ? "Posting..." : "Post Reply"}
              </button>
            </form>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(146, 64, 14, 0.1)",
              border: "1px solid rgba(146, 64, 14, 0.3)",
              borderRadius: 8,
              padding: 24,
              textAlign: "center",
            }}
          >
            <p style={{ color: "#8a7a60", fontFamily: "Georgia, serif", fontSize: 13, margin: 0 }}>
              <a
                href="/login"
                style={{
                  color: "#fbbf24",
                  textDecoration: "none",
                  borderBottom: "1px solid #fbbf24",
                }}
              >
                Sign in
              </a>
              {" "}to add a reply and join the conversation.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
