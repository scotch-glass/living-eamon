"use client";

import PublicNav from "../../components/PublicNav";
import { PROGRESS_CATEGORIES, countSystems } from "../../lib/alphaProgress";

export default function UpdatesPage() {
  const { done, active, planned } = countSystems();

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

        {/* Status Summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
            maxWidth: 600,
            margin: "0 auto 60px",
          }}
        >
          <div
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: 8,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e", marginBottom: 4 }}>
              {done}
            </div>
            <div style={{ fontSize: 12, color: "#86efac", fontFamily: "Georgia, serif" }}>
              Systems Complete
            </div>
          </div>
          <div
            style={{
              background: "rgba(251, 191, 36, 0.1)",
              border: "1px solid rgba(251, 191, 36, 0.3)",
              borderRadius: 8,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>
              {active}
            </div>
            <div style={{ fontSize: 12, color: "#fcd34d", fontFamily: "Georgia, serif" }}>
              In Progress
            </div>
          </div>
          <div
            style={{
              background: "rgba(107, 114, 128, 0.1)",
              border: "1px solid rgba(107, 114, 128, 0.3)",
              borderRadius: 8,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, color: "#9ca3af", marginBottom: 4 }}>
              {planned}
            </div>
            <div style={{ fontSize: 12, color: "#d1d5db", fontFamily: "Georgia, serif" }}>
              Planned
            </div>
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
            How This Roadmap Works
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
              This is a <strong style={{ color: "#c5ad75" }}>living roadmap</strong> that grows as the game is built. New systems are discovered and planned as we work. The list below shows what we know we need; many more features will emerge during development.
            </p>
            <p style={{ margin: "0 0 12px 0" }}>
              <strong style={{ color: "#c5ad75" }}>MVP (Current)</strong> — A theoretically playable game: one hero, one city, combat, magic, banking, consequences. Rough around the edges but functional.
            </p>
            <p style={{ margin: "0 0 12px 0" }}>
              <strong style={{ color: "#c5ad75" }}>Alpha (2028)</strong> — Adventure modules (3 PD stories adapted), expanded world map, balance tuning. Testers help us find what breaks and what doesn't feel right.
            </p>
            <p style={{ margin: "0 0 0 0" }}>
              <strong style={{ color: "#c5ad75" }}>Beta (2029+)</strong> — Polish, UI refinement, performance. The game works; now make it shine.
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
