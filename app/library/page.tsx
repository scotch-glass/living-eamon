// ============================================================
// Sprint W2 — /library landing page (server component).
//
// Welcome card + per-section grids that link to the docs the
// current user can see. Section card visuals match the splash
// "Three Things..." pillars and "What You Will Actually Do"
// feature grid.
// ============================================================

import { getCurrentUserRole } from "../../lib/auth/role";
import { sectionsForRole } from "../../lib/library/docMap";

const ROLE_DESCRIPTOR: Record<"player" | "creator" | "admin", string> = {
  player: "viewer",
  creator: "Ink module author",
  admin: "administrator",
};

export default async function LibraryIndex() {
  const { role } = await getCurrentUserRole();
  const sections = sectionsForRole(role);
  const totalDocs = sections.reduce((n, s) => n + s.docs.length, 0);

  return (
    <div style={{ maxWidth: 1100, fontFamily: "Georgia, serif" }}>
      {/* Hero */}
      <header style={{ marginBottom: 48 }}>
        <p
          style={{
            color: "#fbbf24",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            margin: "0 0 14px 0",
          }}
        >
          The Living Eamon Library
        </p>
        <h1
          style={{
            color: "#fef3c7",
            fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
            fontWeight: 700,
            margin: "0 0 18px 0",
            lineHeight: 1.2,
          }}
        >
          Canon, mechanics, and authoring spec for module creators.
        </h1>
        <p
          style={{
            color: "#e8d4a0",
            fontSize: 17,
            lineHeight: 1.65,
            maxWidth: 780,
            margin: 0,
          }}
        >
          You are signed in as a <strong style={{ color: "#fbbf24" }}>
            {ROLE_DESCRIPTOR[role]}
          </strong>
          . You have access to {totalDocs} documents across {sections.length}{" "}
          sections — the canon you write modules against, the mechanics they
          plug into, and the public-domain rules that keep everything safe.
          Browse the sidebar or pick a section below.
        </p>
      </header>

      {/* Section cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}
      >
        {sections.map((section) => {
          const sectionLabel = section.title.replace(/\s*—\s*.*$/, "");
          return (
            <section
              key={section.key}
              style={{
                background: "rgba(45, 22, 0, 0.45)",
                border: "1px solid rgba(146, 64, 14, 0.4)",
                borderLeft: "3px solid #fbbf24",
                borderRadius: 6,
                padding: "24px 26px",
              }}
            >
              <h2
                style={{
                  color: "#fef3c7",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  margin: "0 0 14px 0",
                  letterSpacing: "0.04em",
                }}
              >
                {sectionLabel}
              </h2>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {section.docs.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={`/library/${doc.id}`}
                      style={{
                        display: "block",
                        color: "#e8d4a0",
                        textDecoration: "none",
                        fontSize: 15,
                        lineHeight: 1.4,
                        padding: "4px 0",
                        transition: "color 0.15s",
                      }}
                    >
                      <span style={{ color: "#fbbf24", marginRight: 8 }}>›</span>
                      {doc.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Footer note */}
      <p
        style={{
          marginTop: 56,
          color: "#8a7a60",
          fontSize: 13,
          lineHeight: 1.6,
          maxWidth: 780,
          fontStyle: "italic",
        }}
      >
        Source of truth for what each doc owns and who can see it lives in{" "}
        <code
          style={{
            color: "#a8a097",
            background: "rgba(146, 64, 14, 0.2)",
            padding: "2px 6px",
            borderRadius: 3,
            fontFamily: "Menlo, monospace",
            fontSize: 12,
          }}
        >
          DOC_MAP.md
        </code>{" "}
        in the repo root. When new docs are added, they get a row there in the
        same commit and appear here automatically.
      </p>
    </div>
  );
}
