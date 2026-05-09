"use client";

// ============================================================
// Sprint W2 — /library wiki sidebar.
//
// Reads pre-filtered DocSection[] from the layout (server already
// applied role-visibility filtering via lib/library/docMap.ts).
// Highlights the active doc based on the current pathname.
// ============================================================

import { usePathname } from "next/navigation";
import type { DocSection } from "../../lib/library/docMap";

export interface SidebarProps {
  sections: DocSection[];
}

const STATUS_COLOR: Record<string, string> = {
  active: "#92400e",
  approved: "#fbbf24",
  draft: "#a8a097",
  deferred: "#6b5d4a",
  rolling: "#a8a097",
  historical: "#5a4a3a",
};

export default function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 280,
        flexShrink: 0,
        padding: "32px 24px 64px",
        borderRight: "1px solid rgba(146, 64, 14, 0.25)",
        fontFamily: "Georgia, serif",
        fontSize: 14,
        position: "sticky",
        top: 64, // matches nav height
        alignSelf: "flex-start",
        maxHeight: "calc(100vh - 64px)",
        overflowY: "auto",
      }}
    >
      <a
        href="/library"
        style={{
          display: "block",
          fontSize: 11,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: pathname === "/library" ? "#fbbf24" : "#92400e",
          textDecoration: "none",
          marginBottom: 28,
          fontWeight: 700,
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color =
            pathname === "/library" ? "#fbbf24" : "#92400e")
        }
      >
        ← Library Index
      </a>

      {sections.map((section) => (
        <div key={section.key} style={{ marginBottom: 28 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#fbbf24",
              fontWeight: 700,
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: "1px solid rgba(146, 64, 14, 0.3)",
            }}
          >
            {section.title.replace(/\s*—\s*.*$/, "")}
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {section.docs.map((doc) => {
              const href = `/library/${doc.id}`;
              const isActive = pathname === href;
              return (
                <li key={doc.id}>
                  <a
                    href={href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 4,
                      fontSize: 13.5,
                      lineHeight: 1.35,
                      color: isActive ? "#fef3c7" : "#e8d4a0",
                      background: isActive
                        ? "rgba(146, 64, 14, 0.35)"
                        : "transparent",
                      borderLeft: isActive
                        ? "2px solid #fbbf24"
                        : "2px solid transparent",
                      textDecoration: "none",
                      transition: "background 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background =
                          "rgba(146, 64, 14, 0.18)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background =
                          "transparent";
                      }
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>{doc.title}</span>
                    {doc.status && doc.status !== "active" && (
                      <span
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: STATUS_COLOR[doc.status] ?? "#5a4a3a",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {doc.status}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
