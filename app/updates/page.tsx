"use client";

import PublicNav from "../../components/PublicNav";
import { PROGRESS_CATEGORIES, countSystems, LAST_UPDATED } from "../../lib/alphaProgress";

export default function UpdatesPage() {
  const { done, active, planned } = countSystems();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        backgroundImage: "url(/art/scenes/updates-bg.jpg)",
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
          background: "rgba(3, 7, 18, 0.85)",
          pointerEvents: "none",
        }}
      />
      <PublicNav currentPage="updates" />

      <main
        style={{
          flex: 1,
          padding: "60px 32px",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <p
            style={{
              color: "#fbbf24",
              fontSize: 13,
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              margin: "0 0 16px 0",
            }}
          >
            Latest Update · {LAST_UPDATED}
          </p>
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

        {/* Latest Design Decision — featured update */}
        <div
          style={{
            background: "rgba(45, 22, 0, 0.55)",
            border: "1px solid rgba(251, 191, 36, 0.4)",
            borderRadius: 8,
            padding: 32,
            maxWidth: 900,
            margin: "0 auto 48px",
            boxShadow: "0 0 24px rgba(251, 191, 36, 0.08)",
          }}
        >
          <div
            style={{
              color: "#fbbf24",
              fontSize: 11,
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Latest Design Decision · April 26, 2026
          </div>
          <h2
            style={{
              color: "#fbbf24",
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "Georgia, serif",
              marginBottom: 16,
              letterSpacing: "0.03em",
            }}
          >
            The PICSSI Virtue System Replaces the Ten-Virtue Ledger
          </h2>
          <div
            style={{
              color: "#c5ad75",
              fontSize: 14,
              fontFamily: "Georgia, serif",
              lineHeight: 1.8,
            }}
          >
            <p style={{ margin: "0 0 16px 0" }}>
              Living Eamon&rsquo;s old ten-virtue moral ledger
              (Honesty, Compassion, Valor, Justice, Sacrifice, Honor, Spirituality, Humility, Grace, Mercy)
              tracked behavior consistency. It told the game whether you had &ldquo;been honest enough&rdquo;
              or &ldquo;been valorous enough.&rdquo; It did not change how the world reacted to you.
            </p>
            <p style={{ margin: "0 0 16px 0" }}>
              <strong style={{ color: "#fbbf24" }}>PICSSI</strong> (pronounced <em>Pixy</em>) replaces it
              with a behavioral consequence engine. Six dimensions, each one drives <em>which NPCs flirt
              with you, which gods listen to your prayers, which dark patrons answer your INVOKE spells,
              which quests will accept you, and what title you ultimately earn as Lord</em>.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                columnGap: 16,
                rowGap: 12,
                margin: "20px 0",
                paddingLeft: 12,
              }}
            >
              <div style={{ color: "#fbbf24", fontWeight: 700 }}>Passion</div>
              <div style={{ color: "#a8a097" }}>
                Fervor, drive, inner fire. Attracts romantic women.
              </div>
              <div style={{ color: "#fbbf24", fontWeight: 700 }}>Integrity</div>
              <div style={{ color: "#a8a097" }}>
                Keeping your word literally; if unkeepable, owning the failure transparently. Attracts wise women.
              </div>
              <div style={{ color: "#fbbf24", fontWeight: 700 }}>Courage</div>
              <div style={{ color: "#a8a097" }}>
                Passion in the face of danger. Scales with the overwhelming-ness of the opposition. Attracts romantic women.
              </div>
              <div style={{ color: "#fbbf24", fontWeight: 700 }}>Standing</div>
              <div style={{ color: "#a8a097" }}>
                The narrative-virtue triumphant body — winning, masculinity, virility. (Distinct from the combat stat STR.) Attracts lusty women.
              </div>
              <div style={{ color: "#fbbf24", fontWeight: 700 }}>Spirituality</div>
              <div style={{ color: "#a8a097" }}>
                Praying to a god even when hopeless — the Conan-Crom paradigm. Crom witnesses but does not intervene; he blesses successful heroes after the fact. Attracts spiritual women.
              </div>
              <div style={{ color: "#fbbf24", fontWeight: 700 }}>Illumination</div>
              <div style={{ color: "#a8a097" }}>
                Light vs. Darkness inside the soul. Sorcery (INVOKE) darkens; killing daemons and saving innocents lights. Attracts at <em>both</em> extremes (saintly OR abyssal); midline attracts no one along this axis.
              </div>
            </div>

            <p style={{ margin: "0 0 16px 0" }}>
              <strong style={{ color: "#fbbf24" }}>PICSSI is per-life, not per-character.</strong>
              {" "}Death at the Church of Perpetual Life wipes your scores; the reborn hero starts at midline on every axis.
              Every life is its own PICSSI arc, and your choices in <em>this</em> life dictate <em>this</em> life&rsquo;s
              reactions, prayer reach, and quest access.
            </p>
            <p style={{ margin: "0 0 16px 0" }}>
              The end-game promise: extreme PICSSI scores attract followers with similarly extreme scores.
              The more extreme yours, the more extreme they become. The goal is to gather a Band of Heroes
              — or a Band of Villains — over which to rule as a titled Lord. <em>Lord Vard the Destroyer.
              Lord Cedric the Lightbringer. Lord Elric the Dark Lord.</em> The title you earn at apotheosis is
              the multi-dimensional shape of your soul.
            </p>
            <p style={{ margin: 0, color: "#8a7a60", fontSize: 13, fontStyle: "italic" }}>
              The old ten-virtue keys (Compassion, Justice, Sacrifice, Humility, Grace, Mercy) have no direct
              PICSSI counterpart. Their effect — NPC reactions to charitable behavior — folds into Illumination.
              Existing live characters reset to midline PICSSI on first load post-migration; the systems are
              not shape-compatible and do not map cleanly across.
            </p>
          </div>
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
              <strong style={{ color: "#c5ad75" }}>Pre-Alpha (Current)</strong> — Foundational systems landing: one hero, one city, combat, magic, banking, consequences, karma. Rough around the edges and not yet feature-complete.
            </p>
            <p style={{ margin: "0 0 12px 0" }}>
              <strong style={{ color: "#c5ad75" }}>MVP</strong> — A theoretically playable game with the full Valus hub experience and one complete adventure module.
            </p>
            <p style={{ margin: "0 0 12px 0" }}>
              <strong style={{ color: "#c5ad75" }}>Alpha Test</strong> — Adventure modules, expanded world map, balance tuning. Testers help us find what breaks and what doesn't feel right.
            </p>
            <p style={{ margin: "0 0 0 0" }}>
              <strong style={{ color: "#c5ad75" }}>Beta Test</strong> — Polish, UI refinement, performance. The game works; now make it shine.
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
            Last updated: {LAST_UPDATED}
            <br />
            Jane is perpetually building. This chronicle is updated at the end of each development cycle.
          </p>
        </div>
      </main>
    </div>
  );
}
