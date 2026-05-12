// ============================================================
// /library/plans/<slug> — single approved plan view (Sprint CF-0).
//
// Renders one markdown file from `docs/plans/<slug>.md` via the
// existing markdown renderer. Server component; auth-gated upstream
// in proxy.ts (creator | admin).
// ============================================================

import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderDocFile } from "../../../../lib/library/markdown";

export default async function PlanDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,128}$/.test(slug)) notFound();

  const relPath = path.join("docs", "plans", `${slug}.md`);
  const full = path.join(process.cwd(), relPath);
  if (!fs.existsSync(full)) notFound();

  const rendered = renderDocFile(relPath);

  return (
    <div style={{ maxWidth: 900, fontFamily: "Georgia, serif" }}>
      <p style={{ marginBottom: 18 }}>
        <Link
          href="/library/plans"
          style={{ color: "#fbbf24", textDecoration: "none", fontSize: 13 }}
        >
          ← All plans
        </Link>
      </p>
      <article
        style={{
          color: "#e8d4a0",
          fontSize: 16,
          lineHeight: 1.7,
        }}
        dangerouslySetInnerHTML={{ __html: rendered.html }}
      />
    </div>
  );
}
