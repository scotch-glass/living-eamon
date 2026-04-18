"use client";

import PublicNav from "../../components/PublicNav";
import { PROGRESS_CATEGORIES, calculateTotalProgress } from "../../lib/alphaProgress";

export default function UpdatesPage() {
  const { done, total, percent } = calculateTotalProgress();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PublicNav currentPage="updates" />

      <main
        style={{
          flex: 1,
          padding: "60px 32px",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#fbbf24",
              fontFamily: "Georgia, serif",
              marginBottom: 8,
              letterSpacing: "0.05em",
            }}
          >
            The Chronicles of Construction
          </h1>
          <p
            style={{
              color: "#8a7a60",
              fontSize: 14,
              fontFamily: "Georgia, serif",
              lineHeight: 1.6,
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            What Jane has built. What she is building. What is yet to come.
          </p>
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginBottom: 60,
            maxWidth: 600,
            margin: "0 auto 60px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "#e8d4a0", fontSize: 13, fontFamily: "Georgia, serif" }}>
              Overall Progress
            </span>
            <span style={{ color: "#fbbf24", fontSize: 13, fontFamily: "Georgia, serif", fontWeight: 700 }}>
              {percent}% ({done}/{total})
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "rgba(146, 64, 14, 0.2)",
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid rgba(146, 64, 14, 0.3)",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #fbbf24, #92400e)",
                width: `${percent}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Development Philosophy */}
        <div
          style={{
            background: "rgba(45, 22, 0, 0.4)",
            border: "1px solid rgba(146, 64, 14, 0.3)",
            borderRadius: 8,
            padding: 24,
            maxWidth: 800,
            margin: "0 auto 60px",
          }}
        >
          <h2
            style={{
              color: "#fbbf24",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              marginBottom: 12,
              letterSpacing: "0.05em",
            }}
          >
            Development Roadmap
          </h2>
          <div
            style={{
              color: "#a8a097",
              fontSize: 13,
              fontFamily: "Georgia, serif",
              lineHeight: 1.8,
            }}
          >
            <p style={{ margin: "0 0 12px 0" }}>
              <strong style={{ color: "#c5ad75" }}>MVP (Current)</strong> — A theoretically playable game with core systems. One hero, one city, combat, magic, banking, consequences. Enough to experience the world's essence, but not polished.
            </p>
            <p style={{ margin: "0 0 12px 0" }}>
              <strong style={{ color: "#c5ad75" }}>Alpha (2028)</strong> — Balance & bug fixes. Adventure modules, expanded world, proper difficulty tuning. Early testers help us discover what breaks and what feels wrong.
            </p>
            <p style={{ margin: "0 0 0 0" }}>
              <strong style={{ color: "#c5ad75" }}>Beta (2029+)</strong> — Polish & shine. UI refinement, performance optimization, quality-of-life improvements. The game works; now make it sing.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 32,
          }}
        >
          {PROGRESS_CATEGORIES.map((category) => {
            const catDone = category.items.filter((i) => i.status === "done").length;
            const catPercent = Math.round((catDone / category.items.length) * 100);

            return (
              <div
                key={category.id}
                style={{
                  background: "rgba(45, 22, 0, 0.4)",
                  border: "1px solid rgba(146, 64, 14, 0.3)",
                  borderRadius: 8,
                  padding: 24,
                }}
              >
                <h2
                  style={{
                    color: "#fbbf24",
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: "Georgia, serif",
                    marginBottom: 4,
                    letterSpacing: "0.05em",
                  }}
                >
                  {category.label}
                </h2>
                <div
                  style={{
                    fontSize: 11,
                    color: "#8a7a60",
                    fontFamily: "Georgia, serif",
                    marginBottom: 16,
                  }}
                >
                  {catDone}/{category.items.length} complete
                </div>

                {/* Small progress bar */}
                <div
                  style={{
                    height: 4,
                    background: "rgba(146, 64, 14, 0.2)",
                    borderRadius: 2,
                    overflow: "hidden",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#fbbf24",
                      width: `${catPercent}%`,
                    }}
                  />
                </div>

                {/* Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {category.items.map((item, idx) => {
                    const statusIcon =
                      item.status === "done"
                        ? "✅"
                        : item.status === "active"
                          ? "🔨"
                          : "◯";
                    const statusColor =
                      item.status === "done"
                        ? "#e8d4a0"
                        : item.status === "active"
                          ? "#b8a8a0"
                          : "#7a6a60";

                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: 8,
                          fontSize: 12,
                          color: statusColor,
                          fontFamily: "Georgia, serif",
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ flexShrink: 0 }}>{statusIcon}</span>
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div
          style={{
            marginTop: 60,
            textAlign: "center",
            padding: 24,
            background: "rgba(146, 64, 14, 0.1)",
            border: "1px solid rgba(146, 64, 14, 0.2)",
            borderRadius: 8,
          }}
        >
          <p
            style={{
              color: "#8a7a60",
              fontSize: 13,
              fontFamily: "Georgia, serif",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Last updated: April 18, 2026
            <br />
            Jane is perpetually building. This chronicle is updated at the end of each development cycle.
          </p>
        </div>
      </main>
    </div>
  );
}
