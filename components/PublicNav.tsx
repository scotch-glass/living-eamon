"use client";

export interface PublicNavProps {
  currentPage?: "login" | "updates" | "board" | "legal";
}

export default function PublicNav({ currentPage }: PublicNavProps) {
  const isActive = (page: string) => currentPage === page ? "#fbbf24" : "#92400e";

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
        borderBottom: "1px solid rgba(146, 64, 14, 0.2)",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Logo */}
      <a
        href="/login"
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "#fbbf24",
          textDecoration: "none",
          letterSpacing: "0.1em",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fef3c7")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#fbbf24")}
      >
        LIVING EAMON
      </a>

      {/* Links */}
      <div
        style={{
          display: "flex",
          gap: 32,
          alignItems: "center",
        }}
      >
        <a
          href="/updates"
          style={{
            color: isActive("updates"),
            fontSize: 13,
            textDecoration: "none",
            transition: "color 0.2s",
            fontFamily: "Georgia, serif",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
          onMouseLeave={(e) => (e.currentTarget.style.color = isActive("updates"))}
        >
          Updates
        </a>

        <a
          href="/board"
          style={{
            color: isActive("board"),
            fontSize: 13,
            textDecoration: "none",
            transition: "color 0.2s",
            fontFamily: "Georgia, serif",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
          onMouseLeave={(e) => (e.currentTarget.style.color = isActive("board"))}
        >
          Community
        </a>

        <a
          href="/legal"
          style={{
            color: isActive("legal"),
            fontSize: 13,
            textDecoration: "none",
            transition: "color 0.2s",
            fontFamily: "Georgia, serif",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fbbf24")}
          onMouseLeave={(e) => (e.currentTarget.style.color = isActive("legal"))}
        >
          Legal
        </a>

        <a
          href="/login"
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            padding: "8px 16px",
            background: "rgba(146, 64, 14, 0.3)",
            border: "1px solid rgba(251, 191, 36, 0.4)",
            borderRadius: 4,
            color: "#fbbf24",
            textDecoration: "none",
            transition: "background 0.2s",
            fontFamily: "Georgia, serif",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(146, 64, 14, 0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(146, 64, 14, 0.3)";
          }}
        >
          Alpha Access →
        </a>
      </div>
    </nav>
  );
}
