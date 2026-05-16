// ============================================================
// Sprint W2 — /library wiki layout (server component).
//
// Auth-gating happens upstream in proxy.ts (requires
// players.role IN ('creator','admin')) — so by the time we render
// here the user is at least a creator.
//
// Visual chrome matches /splash + /board: dark navy bg (#030712),
// cream text (#e8d4a0), gold accents (#fbbf24), Georgia serif,
// inline styles (NOT Tailwind utility classes).
// ============================================================

import { getCurrentUserRole } from "../../lib/auth/role";
import { sectionsForRole } from "../../lib/library/docMap";
import LibraryNav from "./LibraryNav";
import Sidebar from "./Sidebar";

export default async function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, email } = await getCurrentUserRole();
  const sections = sectionsForRole(role);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#030712",
        color: "#e8d4a0",
        fontFamily: "Georgia, serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LibraryNav role={role} email={email} />
      <div
        style={{
          display: "flex",
          flex: 1,
          maxWidth: 1480,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <Sidebar sections={sections} />
        <main
          style={{
            flex: 1,
            padding: "40px 56px 96px",
            minWidth: 0, // critical so flex children can shrink
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
