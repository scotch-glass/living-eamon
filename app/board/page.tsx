"use client";

import { useEffect, useState } from "react";
import PublicNav from "../../components/PublicNav";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface ThreadSummary {
  id: number;
  category_id: number;
  title: string;
  hero_name: string;
  created_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  board_posts: { count: number }[];
}

export default function BoardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [threadCounts, setThreadCounts] = useState<Record<number, { threads: number; posts: number; lastPost: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch threads to count by category
        const res = await fetch("/api/board/threads?limit=1000");
        const data = await res.json();
        const threads: ThreadSummary[] = data.threads || [];

        // Build category stats
        const stats: Record<number, { threads: number; posts: number; lastPost: string }> = {};
        threads.forEach((thread) => {
          if (!stats[thread.category_id]) {
            stats[thread.category_id] = { threads: 0, posts: 0, lastPost: "" };
          }
          stats[thread.category_id].threads += 1;
          stats[thread.category_id].posts += thread.board_posts?.[0]?.count || 0;
          if (!stats[thread.category_id].lastPost || new Date(thread.created_at) > new Date(stats[thread.category_id].lastPost)) {
            stats[thread.category_id].lastPost = thread.created_at;
          }
        });

        setThreadCounts(stats);
      } catch (err) {
        console.error("Error loading board:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Hardcoded categories (seeded via migration)
  const hardcodedCategories: Category[] = [
    { id: 1, name: "Adventurers' Hall", slug: "hall", description: "General discussion. Heroes, battles, secrets, and tales of the realm." },
    { id: 2, name: "The Bug Catcher's Trap", slug: "bugs", description: "Report errors, broken mechanics, glitches, and unexpected behavior." },
    { id: 3, name: "Petitions to Jane", slug: "petitions", description: "Feature ideas and requests. Tell Jane what you wish existed." },
    { id: 4, name: "Lore & Theory", slug: "lore", description: "Speculation about the world, Jane's nature, the Order, and hidden truths." },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        backgroundImage: "url(/board-bg.jpg)",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Background overlay for readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(3, 7, 18, 0.87)",
          pointerEvents: "none",
        }}
      />
      <PublicNav currentPage="board" />

      <main
        style={{
          flex: 1,
          padding: "60px 32px",
          maxWidth: 1000,
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "#fbbf24",
              fontFamily: "Georgia, serif",
              marginBottom: 4,
              letterSpacing: "0.05em",
            }}
          >
            The Adventurers' Hall
          </h1>
          <p
            style={{
              color: "#8a7a60",
              fontSize: 13,
              fontFamily: "Georgia, serif",
            }}
          >
            Where heroes gather to share tales, report glitches, and speculate on mysteries.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#6b7280", fontFamily: "Georgia, serif" }}>
            Loading the board...
          </div>
        ) : (
          <>
            {/* Categories Table */}
            <div
              style={{
                background: "rgba(12, 6, 2, 0.4)",
                border: "1px solid rgba(146, 64, 14, 0.3)",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 40,
              }}
            >
              {hardcodedCategories.map((cat, idx) => {
                const stats = threadCounts[cat.id] || { threads: 0, posts: 0, lastPost: "" };
                const lastPostDate = stats.lastPost
                  ? new Date(stats.lastPost).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—";

                return (
                  <a
                    key={cat.id}
                    href={`/board?cat=${cat.slug}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 120px 120px 120px",
                      gap: 16,
                      padding: "16px 20px",
                      borderBottom: idx < hardcodedCategories.length - 1 ? "1px solid rgba(146, 64, 14, 0.2)" : "none",
                      background: idx % 2 === 0 ? "rgba(45, 22, 0, 0.2)" : "transparent",
                      textDecoration: "none",
                      transition: "background 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(146, 64, 14, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        idx % 2 === 0 ? "rgba(45, 22, 0, 0.2)" : "transparent";
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#fbbf24",
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: "Georgia, serif",
                          marginBottom: 4,
                        }}
                      >
                        {cat.name}
                      </div>
                      <div
                        style={{
                          color: "#8a7a60",
                          fontSize: 12,
                          fontFamily: "Georgia, serif",
                        }}
                      >
                        {cat.description}
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "#fbbf24", fontSize: 16, fontWeight: 700 }}>
                        {stats.threads}
                      </div>
                      <div style={{ color: "#5a4a3a", fontSize: 10, fontFamily: "Georgia, serif" }}>
                        threads
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "#fbbf24", fontSize: 16, fontWeight: 700 }}>
                        {stats.posts}
                      </div>
                      <div style={{ color: "#5a4a3a", fontSize: 10, fontFamily: "Georgia, serif" }}>
                        posts
                      </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "#8a7a60", fontSize: 11, fontFamily: "Georgia, serif" }}>
                        {lastPostDate}
                      </div>
                      <div style={{ color: "#5a4a3a", fontSize: 10, fontFamily: "Georgia, serif" }}>
                        last post
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Stats footer */}
            <div
              style={{
                textAlign: "center",
                color: "#5a4a3a",
                fontSize: 12,
                fontFamily: "Georgia, serif",
                padding: "16px",
                background: "rgba(45, 22, 0, 0.2)",
                borderRadius: 6,
              }}
            >
              <p style={{ margin: 0 }}>
                Total threads: {Object.values(threadCounts).reduce((sum, s) => sum + s.threads, 0)} | Total posts:{" "}
                {Object.values(threadCounts).reduce((sum, s) => sum + s.posts, 0)}
              </p>
              <p style={{ margin: "4px 0 0 0" }}>The board is read-only until you log in. Heroes, tell your tales.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
