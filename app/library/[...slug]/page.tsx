// ============================================================
// Sprint W2 — /library/<slug> dynamic doc route (server component).
//
// Resolves the slug to a DOC_MAP entry, role-checks visibility,
// renders the markdown body via marked. Frontmatter (if present)
// renders as a metadata sidebar to the right of the content.
//
// Auth-gating is enforced upstream in proxy.ts (requires
// players.role IN ('creator','admin')); the per-doc visibility
// check here is defense-in-depth so that an internal-only doc
// is never rendered for a creator even via direct URL.
// ============================================================

import { notFound, redirect } from "next/navigation";
import { getCurrentUserRole } from "../../../lib/auth/role";
import { docById } from "../../../lib/library/docMap";
import { renderDocFile } from "../../../lib/library/markdown";

// Catch-all: slug is `string[]`, but we render only the first segment
// for v1 (DOC_MAP ids are single-segment slugs). Multi-segment URLs
// fall through to notFound().

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (!slug || slug.length !== 1) notFound();
  const id = slug[0];

  const doc = docById(id);
  if (!doc) notFound();

  // Defense-in-depth: refuse to render an `internal` doc for a creator
  // even if they hit the URL directly.
  const { role } = await getCurrentUserRole();
  if (doc.visibility === "internal" && role !== "admin") {
    redirect("/library");
  }

  // Glob/corpus paths (e.g. "lore/scrolls-of-thoth/scroll-*.md")
  // describe a corpus, not a single page. Render a placeholder.
  if (doc.path.includes("*")) {
    return (
      <div style={{ maxWidth: 820, fontFamily: "Georgia, serif" }}>
        <h1 style={{ color: "#fef3c7", fontSize: "2rem", fontWeight: 700 }}>
          {doc.title}
        </h1>
        <p style={{ color: "#a8a097", fontSize: 15, fontStyle: "italic" }}>
          This entry covers a corpus of files at{" "}
          <code style={{ color: "#fbbf24" }}>{doc.path}</code>. Per-file
          rendering for corpus collections is a follow-up; for now, browse the
          files directly in the repo.
        </p>
      </div>
    );
  }

  const rendered = renderDocFile(doc.path);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 280px",
        gap: 40,
        alignItems: "start",
        fontFamily: "Georgia, serif",
      }}
      className="le-library-doc-grid"
    >
      <article style={{ minWidth: 0 }}>
        <header
          style={{
            marginBottom: 28,
            paddingBottom: 18,
            borderBottom: "1px solid rgba(146, 64, 14, 0.3)",
          }}
        >
          <p
            style={{
              color: "#fbbf24",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              margin: "0 0 8px 0",
            }}
          >
            {doc.role.replace(/-/g, " ")}
          </p>
          <h1
            style={{
              color: "#fef3c7",
              fontSize: "clamp(1.6rem, 3vw, 2.25rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {rendered.title}
          </h1>
        </header>
        <div
          className="le-library-prose"
          dangerouslySetInnerHTML={{ __html: rendered.html }}
        />
      </article>
      <DocMetaSidebar doc={doc} renderedTitle={rendered.title} />

      {/* Prose styles for the rendered markdown body. Scoped to
          .le-library-prose so they don't leak into the rest of the
          app. Inline styles + a <style> tag is the cheapest way to
          ship server-rendered prose typography that matches the
          splash/board chrome without pulling in @tailwindcss/typography. */}
      <style>{LE_LIBRARY_PROSE_CSS}</style>

      {/* Mobile: stack metadata under the article. */}
      <style>{`
        @media (max-width: 980px) {
          .le-library-doc-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Metadata sidebar (right rail) ─────────────────────────────

function DocMetaSidebar({
  doc,
  renderedTitle,
}: {
  doc: ReturnType<typeof docById> & object;
  renderedTitle: string;
}) {
  return (
    <aside
      style={{
        position: "sticky",
        top: 96,
        alignSelf: "flex-start",
        background: "rgba(45, 22, 0, 0.35)",
        border: "1px solid rgba(146, 64, 14, 0.35)",
        borderRadius: 6,
        padding: "20px 22px",
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      <div
        style={{
          color: "#fbbf24",
          fontSize: 10,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 14,
          paddingBottom: 8,
          borderBottom: "1px solid rgba(146, 64, 14, 0.3)",
        }}
      >
        Metadata
      </div>

      <MetaRow label="Source">
        <code
          style={{
            color: "#a8a097",
            fontSize: 11.5,
            fontFamily: "Menlo, monospace",
            wordBreak: "break-all",
          }}
        >
          {doc.path}
        </code>
      </MetaRow>
      <MetaRow label="Role">
        <span style={{ color: "#e8d4a0" }}>{doc.role.replace(/-/g, " ")}</span>
      </MetaRow>
      <MetaRow label="Visibility">
        <span style={{ color: "#e8d4a0" }}>{doc.visibility}</span>
      </MetaRow>
      <MetaRow label="Status">
        <span style={{ color: "#e8d4a0" }}>{String(doc.status)}</span>
      </MetaRow>
      <MetaRow label="Last updated">
        <span style={{ color: "#e8d4a0" }}>{doc.last_updated}</span>
      </MetaRow>
      {doc.canonical_for && doc.canonical_for.length > 0 && (
        <MetaRow label="Canonical for">
          <span style={{ color: "#e8d4a0" }}>
            {doc.canonical_for.join(", ")}
          </span>
        </MetaRow>
      )}
      {doc.cross_refs && doc.cross_refs.length > 0 && (
        <MetaRow label="Cross-refs">
          <span style={{ color: "#e8d4a0" }}>
            {doc.cross_refs.join(", ")}
          </span>
        </MetaRow>
      )}
      {doc.generated_by && (
        <MetaRow label="Generated by">
          <code
            style={{
              color: "#a8a097",
              fontSize: 11.5,
              fontFamily: "Menlo, monospace",
            }}
          >
            {doc.generated_by}
          </code>
        </MetaRow>
      )}
      {doc.npm_script && (
        <MetaRow label="Run">
          <code
            style={{
              color: "#fbbf24",
              fontSize: 11.5,
              fontFamily: "Menlo, monospace",
            }}
          >
            npm run {doc.npm_script}
          </code>
        </MetaRow>
      )}
      {doc.note && (
        <p
          style={{
            color: "#a8a097",
            fontStyle: "italic",
            fontSize: 12.5,
            margin: "16px 0 0 0",
            lineHeight: 1.55,
          }}
        >
          {doc.note}
        </p>
      )}
    </aside>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          color: "#92400e",
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ── Prose typography (scoped) ─────────────────────────────────
//
// Tuned to match the splash/board chrome: cream body text on dark
// navy, gold for headings, copper for borders, Georgia serif.
// Tables get a subtle dark-brown stripe so they read clearly.

const LE_LIBRARY_PROSE_CSS = `
  .le-library-prose {
    color: #e8d4a0;
    font-family: Georgia, serif;
    font-size: 16px;
    line-height: 1.7;
  }
  .le-library-prose h1 { color: #fef3c7; font-size: 1.6rem; font-weight: 700; margin: 1.6em 0 0.5em; line-height: 1.25; }
  .le-library-prose h2 { color: #fbbf24; font-size: 1.35rem; font-weight: 700; margin: 1.6em 0 0.5em; padding-bottom: 0.3em; border-bottom: 1px solid rgba(146, 64, 14, 0.3); line-height: 1.3; }
  .le-library-prose h3 { color: #fef3c7; font-size: 1.125rem; font-weight: 700; margin: 1.4em 0 0.4em; line-height: 1.3; }
  .le-library-prose h4 { color: #e8d4a0; font-size: 1rem; font-weight: 700; margin: 1.2em 0 0.4em; }
  .le-library-prose p { margin: 0.75em 0; }
  .le-library-prose strong { color: #fef3c7; font-weight: 700; }
  .le-library-prose em { color: #f6e3b8; }
  .le-library-prose a { color: #fbbf24; text-decoration: underline; text-decoration-color: rgba(251, 191, 36, 0.4); transition: color 0.15s, text-decoration-color 0.15s; }
  .le-library-prose a:hover { color: #fef3c7; text-decoration-color: #fbbf24; }
  .le-library-prose code { background: rgba(146, 64, 14, 0.22); color: #fef3c7; padding: 1px 6px; border-radius: 3px; font-family: Menlo, monospace; font-size: 0.875em; }
  .le-library-prose pre { background: rgba(8, 4, 0, 0.6); border: 1px solid rgba(146, 64, 14, 0.3); border-radius: 6px; padding: 14px 16px; overflow-x: auto; font-family: Menlo, monospace; font-size: 13px; line-height: 1.55; margin: 1em 0; }
  .le-library-prose pre code { background: transparent; padding: 0; color: #e8d4a0; font-size: inherit; }
  .le-library-prose blockquote { border-left: 3px solid #92400e; padding: 0.4em 1em; margin: 1em 0; color: #f6e3b8; background: rgba(146, 64, 14, 0.1); font-style: italic; }
  .le-library-prose ul, .le-library-prose ol { margin: 0.7em 0; padding-left: 1.6em; }
  .le-library-prose li { margin: 0.3em 0; }
  .le-library-prose hr { border: 0; border-top: 1px solid rgba(146, 64, 14, 0.4); margin: 2em 0; }
  .le-library-prose table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 14.5px; }
  .le-library-prose th { background: rgba(146, 64, 14, 0.25); color: #fef3c7; text-align: left; padding: 8px 12px; border: 1px solid rgba(146, 64, 14, 0.4); font-weight: 700; }
  .le-library-prose td { padding: 7px 12px; border: 1px solid rgba(146, 64, 14, 0.25); vertical-align: top; }
  .le-library-prose tr:nth-child(odd) td { background: rgba(45, 22, 0, 0.18); }
  .le-library-prose img { max-width: 100%; border-radius: 4px; }
`;
