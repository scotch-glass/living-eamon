// ============================================================
// Sprint W2 — Markdown loader + renderer for the /library wiki.
//
// Responsibilities:
//   - Read a markdown file from disk
//   - Strip + parse YAML frontmatter
//   - Convert body to HTML via `marked`
//   - Rewrite internal links: [text](lore/foo.md) -> /library/<slug>
//     when a DOC_MAP entry's `path` matches.
//
// Server-only: reads files from disk via fs.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import yaml from "js-yaml";
import { allDocs } from "./docMap";

const REPO_ROOT = process.cwd();

// ── Frontmatter parsing ───────────────────────────────────────

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

export interface ParsedDoc {
  frontmatter: Record<string, unknown> | null;
  body: string;
}

export function parseFrontmatter(raw: string): ParsedDoc {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return { frontmatter: null, body: raw };
  try {
    const parsed = yaml.load(match[1]);
    return {
      frontmatter:
        parsed && typeof parsed === "object"
          ? (parsed as Record<string, unknown>)
          : null,
      body: match[2],
    };
  } catch {
    // YAML parse failed — render the whole thing as body
    return { frontmatter: null, body: raw };
  }
}

// ── Internal-link rewriting ────────────────────────────────────
//
// Build a Map<repo-relative-path, doc-id> once per process. The
// custom marked link renderer consults it to rewrite Markdown
// links pointing at known docs.

let pathToIdCache: Map<string, string> | null = null;

function getPathToIdMap(): Map<string, string> {
  if (pathToIdCache) return pathToIdCache;
  const map = new Map<string, string>();
  for (const doc of allDocs()) {
    // Skip glob paths like "lore/scrolls-of-thoth/scroll-*.md" — they
    // describe a corpus, not a single page. Per-file rewrites for
    // those need a different strategy (TODO when corpus pages ship).
    if (doc.path.includes("*")) continue;
    map.set(doc.path, doc.id);
    // Also accept ./ prefix and a leading slash for resilience.
    map.set("./" + doc.path, doc.id);
    map.set("/" + doc.path, doc.id);
  }
  pathToIdCache = map;
  return map;
}

function rewriteLinkHref(href: string): string {
  // External links (http://, https://, mailto:, etc) — leave alone.
  if (/^[a-z]+:/i.test(href) || href.startsWith("//")) return href;
  // Anchor-only links — leave alone.
  if (href.startsWith("#")) return href;
  // Strip optional ./ prefix and any anchor/query for lookup.
  const [bare, rest] = href.split(/(?=[#?])/);
  const map = getPathToIdMap();
  const id = map.get(bare);
  if (id) return `/library/${id}${rest ?? ""}`;
  return href;
}

// ── marked configuration ──────────────────────────────────────

const renderer = new marked.Renderer();

const baseLinkRenderer = renderer.link.bind(renderer);
renderer.link = function (token) {
  return baseLinkRenderer({ ...token, href: rewriteLinkHref(token.href) });
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: false,
});

// ── Public API ────────────────────────────────────────────────

export interface RenderedDoc {
  /** Display title (frontmatter `title` or first H1 or fallback to slug). */
  title: string;
  /** Repo-relative path (e.g., "lore/pantheon/PANTHEON.md"). */
  path: string;
  /** Parsed frontmatter, or null if the doc has none. */
  frontmatter: Record<string, unknown> | null;
  /** Rendered HTML body (link rewrites applied). */
  html: string;
}

/**
 * Resolves a doc's path on disk to a fully-rendered HTML payload.
 * Throws if the file cannot be read.
 */
export function renderDocFile(repoRelPath: string): RenderedDoc {
  // Glob/corpus paths (e.g. "lore/scrolls-of-thoth/scroll-*.md") are
  // not loadable as a single file — caller should not pass these.
  if (repoRelPath.includes("*")) {
    throw new Error(
      `renderDocFile: corpus path "${repoRelPath}" is not a single file`
    );
  }

  const full = path.join(REPO_ROOT, repoRelPath);
  const raw = fs.readFileSync(full, "utf-8");
  const { frontmatter, body } = parseFrontmatter(raw);

  // Title precedence: frontmatter.title > first H1 in body > path basename
  let title: string;
  if (frontmatter && typeof frontmatter.title === "string") {
    title = frontmatter.title;
  } else {
    const h1Match = body.match(/^#\s+(.+?)\s*$/m);
    title = h1Match ? h1Match[1] : path.basename(repoRelPath, ".md");
  }

  const html = marked.parse(body, { async: false }) as string;

  return { title, path: repoRelPath, frontmatter, html };
}
