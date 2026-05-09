"use client";

// ============================================================
// Sprint W2 — Top nav for /library wiki.
//
// Mirrors the visual language of components/PublicNav.tsx but for
// authed creators+admins instead of public visitors. Shows the
// user's role badge so creators know they have wiki access without
// poking around.
// ============================================================

import type { UserRole } from "../../lib/auth/role";

export interface LibraryNavProps {
  role: UserRole;
  email: string | null;
}

const ROLE_LABEL: Record<UserRole, string> = {
  player: "Player",
  creator: "Creator",
  admin: "Admin",
};

const ROLE_COLOR: Record<UserRole, string> = {
  player: "#8a7a60",
  creator: "#fbbf24",
  admin: "#fef3c7",
};

export default function LibraryNav({ role, email }: LibraryNavProps) {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 32px",
        background: "rgba(3, 7, 18, 0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(146, 64, 14, 0.3)",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Brand / wiki title */}
      <a
        href="/library"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 700,
          color: "#fbbf24",
          letterSpacing: "0.08em",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fef3c7")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#fbbf24")}
      >
        <img
          src="/art/brand/logo.png"
          alt="Living Eamon"
          style={{ width: 32, height: 32, objectFit: "contain" }}
        />
        <span>
          LIVING EAMON
          <span
            style={{
              marginLeft: 12,
              color: "#a8a097",
              fontWeight: 400,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontSize: 11,
            }}
          >
            · Library
          </span>
        </span>
      </a>

      {/* Right side: role badge + back-to-game */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          title={email ?? undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: ROLE_COLOR[role],
            padding: "6px 12px",
            border: `1px solid ${ROLE_COLOR[role]}40`,
            borderRadius: 4,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: ROLE_COLOR[role],
            }}
          />
          {ROLE_LABEL[role]}
        </div>
        <a
          href="/"
          style={{
            color: "#a8a097",
            fontSize: 13,
            textDecoration: "none",
            fontFamily: "Georgia, serif",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#a8a097")}
        >
          ← Back to Game
        </a>
      </div>
    </nav>
  );
}
