// ============================================================
// /library/plans — index of all approved implementation plans
// (Sprint CF-0).
//
// Lists every markdown file under `docs/plans/` with its title
// (parsed from frontmatter or first H1) and last-modified date.
// Each entry links to /library/plans/<slug> which renders the full
// plan via the existing markdown renderer.
//
// Server component. Auth-gated upstream in proxy.ts (creator | admin).
// ============================================================

import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { parseFrontmatter } from "../../../lib/library/markdown";

interface PlanEntry {
  slug: string;
  title: string;
  updatedAt: string;
}

function loadPlans(): PlanEntry[] {
  const dir = path.join(process.cwd(), "docs", "plans");
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const plans: PlanEntry[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".md")) continue;
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    const raw = fs.readFileSync(full, "utf-8");
    const { frontmatter, body } = parseFrontmatter(raw);

    let title: string;
    if (frontmatter && typeof frontmatter.title === "string") {
      title = frontmatter.title;
    } else {
      const h1 = body.match(/^#\s+(.+?)\s*$/m);
      title = h1 ? h1[1] : entry.replace(/\.md$/, "");
    }

    plans.push({
      slug: entry.replace(/\.md$/, ""),
      title,
      updatedAt: stat.mtime.toISOString().slice(0, 10),
    });
  }
  plans.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return plans;
}

export default function PlansIndex() {
  const plans = loadPlans();

  return (
    <div style={{ maxWidth: 900, fontFamily: "Georgia, serif" }}>
      <header style={{ marginBottom: 36 }}>
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
          Plans
        </p>
        <h1
          style={{
            color: "#fef3c7",
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
            fontWeight: 700,
            margin: "0 0 14px 0",
            lineHeight: 1.2,
          }}
        >
          Approved implementation plans
        </h1>
        <p
          style={{
            color: "#e8d4a0",
            fontSize: 16,
            lineHeight: 1.6,
            maxWidth: 720,
            margin: 0,
          }}
        >
          Multi-sprint plans approved by Scotch land here as the canonical
          record. Working drafts may live in <code>~/.claude/plans/</code> but
          the merged-into-repo home is <code>docs/plans/</code>.
        </p>
      </header>

      {plans.length === 0 ? (
        <p style={{ color: "#a8a097", fontStyle: "italic" }}>
          No plans yet. The first approved plan will land here on the next merge.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {plans.map((p) => (
            <li
              key={p.slug}
              style={{
                background: "rgba(45, 22, 0, 0.45)",
                border: "1px solid rgba(146, 64, 14, 0.4)",
                borderLeft: "3px solid #fbbf24",
                borderRadius: 6,
                padding: "18px 22px",
                marginBottom: 14,
              }}
            >
              <Link
                href={`/library/plans/${p.slug}`}
                style={{
                  color: "#fef3c7",
                  textDecoration: "none",
                  fontSize: 18,
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 4,
                }}
              >
                {p.title}
              </Link>
              <div style={{ color: "#a8a097", fontSize: 13 }}>
                <code>{p.slug}.md</code> · updated {p.updatedAt}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
