// ========================================================================
// LIVING EAMON — Build Hero QA Page
//
// Reads scripts/hero-seed-data.json and generates
// public/hero-masters/qa.html — a self-contained static HTML page that
// shows every hero master composited on the church backdrop, with a
// per-hero "Re-forge this one" checkbox + notes field. A "Generate
// Report" button emits a markdown block of everything marked which
// Scotch copy-pastes back into chat.
//
// Usage:  npx tsx scripts/build-hero-qa.ts
// Output: public/hero-masters/qa.html  (open in any browser via file://)
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { HeroCustomization } from "../lib/heroTypes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const seedPath = path.join(root, "scripts", "hero-seed-data.json");
const outPath = path.join(root, "public", "hero-masters", "qa.html");

interface SeedHero extends HeroCustomization {
  slug: string;
}

function tagSummary(h: SeedHero): string {
  return [
    h.ageBand,
    h.skinTone.replace(/_/g, " "),
    `${h.hairColor} ${h.hairLength}`,
    h.facialHair.replace(/_/g, " "),
    `${h.eyeColor} eyes`,
    h.scarCount ? `${h.scarCount} scars` : "fresh",
  ].join(" · ");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function heroCard(h: SeedHero): string {
  const tags = escapeHtml(tagSummary(h));
  const name = escapeHtml(h.heroName);
  const slug = escapeHtml(h.slug);
  return `
    <article class="card" data-slug="${slug}">
      <div class="stage">
        <img class="bg" src="./qa-church-bg.jpg" alt="Church interior backdrop" />
        <img class="sprite" src="./${slug}.png" alt="${name} hero sprite" />
      </div>
      <div class="meta">
        <h2>${name}</h2>
        <p class="tags">${tags}</p>
        <p class="id">id: ${escapeHtml(h.id ?? "(none — run forge script)")}</p>
        <label class="reroll-label">
          <input type="checkbox" class="reroll" />
          <span>Re-forge this one</span>
        </label>
        <textarea class="notes" placeholder="What's wrong? (blank = just re-roll, no issue specified)"></textarea>
      </div>
    </article>`;
}

function buildHtml(heroes: SeedHero[]): string {
  const cards = heroes.map(heroCard).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Living Eamon — Hero Library QA</title>
<style>
  :root {
    --amber: #fbbf24;
    --amber-dim: #92400e;
    --parchment: #e8d4a0;
    --dim: #a8a097;
    --void: #030712;
    --panel: rgba(45, 22, 0, 0.55);
    --panel-border: rgba(146, 64, 14, 0.4);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: var(--void);
    color: var(--parchment);
    font-family: Georgia, "Times New Roman", serif;
  }
  header {
    padding: 32px 32px 16px;
    border-bottom: 1px solid var(--panel-border);
  }
  h1 {
    color: var(--amber);
    font-size: 2rem;
    margin: 0 0 8px 0;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  header p {
    color: var(--dim);
    font-size: 0.95rem;
    margin: 0;
    max-width: 800px;
    line-height: 1.6;
  }
  main {
    padding: 32px;
    max-width: 1600px;
    margin: 0 auto;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 28px;
  }
  .card {
    background: var(--panel);
    border: 1px solid var(--panel-border);
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .stage {
    position: relative;
    aspect-ratio: 3 / 4;
    overflow: hidden;
    background: #000;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
    filter: brightness(0.75);
  }
  .sprite {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
    filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.7));
  }
  .meta {
    padding: 16px 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 {
    color: #fef3c7;
    font-size: 1.25rem;
    margin: 0;
    letter-spacing: 0.02em;
  }
  .tags {
    color: var(--dim);
    font-size: 0.875rem;
    margin: 0;
    line-height: 1.5;
  }
  .id {
    color: #6b7280;
    font-size: 0.7rem;
    margin: 0;
    font-family: "SF Mono", Menlo, Consolas, monospace;
    letter-spacing: 0;
    word-break: break-all;
  }
  .reroll-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--amber);
    font-size: 0.95rem;
    cursor: pointer;
    user-select: none;
  }
  .reroll-label input {
    width: 18px;
    height: 18px;
    accent-color: var(--amber);
    cursor: pointer;
  }
  .card:has(.reroll:checked) {
    border-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
  }
  .card:has(.reroll:checked) .reroll-label { color: #fca5a5; }
  textarea.notes {
    background: #111827;
    border: 1px solid #374151;
    color: var(--parchment);
    border-radius: 6px;
    padding: 10px 12px;
    font-family: Georgia, serif;
    font-size: 0.9rem;
    resize: vertical;
    min-height: 64px;
    outline: none;
  }
  textarea.notes:focus { border-color: var(--amber); }
  footer {
    padding: 24px 32px 48px;
    text-align: center;
    border-top: 1px solid var(--panel-border);
    margin-top: 40px;
  }
  button#gen-report {
    background: var(--amber-dim);
    color: #fef3c7;
    border: 1px solid var(--amber);
    padding: 14px 32px;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 8px;
    cursor: pointer;
    font-family: Georgia, serif;
    transition: background 0.2s;
  }
  button#gen-report:hover { background: #b35712; }
  pre#report {
    background: #0a0a0a;
    color: var(--parchment);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid var(--panel-border);
    text-align: left;
    margin: 24px auto 0;
    max-width: 900px;
    white-space: pre-wrap;
    font-family: "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    display: none;
  }
  pre#report.show { display: block; }
  .hint {
    color: var(--dim);
    font-size: 0.875rem;
    margin-top: 12px;
  }
</style>
</head>
<body>

<header>
  <h1>Hero Library QA</h1>
  <p>
    Ten fresh-rebirth masters. Each hero is shown in front of the Church of Perpetual
    Life interior — the backdrop the player will see at their first wakeup and every
    rebirth thereafter. Check "Re-forge this one" on any image that needs regeneration;
    use the notes field to describe what's wrong. When you're done, click
    <em>Generate Report</em> and paste the output back into chat.
  </p>
</header>

<main>
  <div class="grid">
${cards}
  </div>
</main>

<footer>
  <button id="gen-report" type="button">Generate Report</button>
  <div class="hint">Report also copies to your clipboard automatically.</div>
  <pre id="report" aria-live="polite"></pre>
</footer>

<script>
(function () {
  const btn = document.getElementById("gen-report");
  const out = document.getElementById("report");
  btn.addEventListener("click", function () {
    const cards = document.querySelectorAll(".card");
    const marked = [];
    cards.forEach(function (c) {
      const reroll = c.querySelector(".reroll").checked;
      if (!reroll) return;
      const slug = c.getAttribute("data-slug");
      const name = c.querySelector("h2").textContent.trim();
      const notes = c.querySelector(".notes").value.trim();
      marked.push({ slug, name, notes });
    });
    const lines = [];
    if (marked.length === 0) {
      lines.push("All heroes accepted. No re-forges requested.");
    } else {
      lines.push("## Hero QA Report");
      lines.push("");
      lines.push("Re-forge the following heroes:");
      lines.push("");
      marked.forEach(function (m) {
        const note = m.notes ? m.notes : "(no specific note — just re-roll)";
        lines.push("- **" + m.name + "** (\`" + m.slug + "\`): " + note);
      });
      lines.push("");
      lines.push("Slugs only: " + marked.map(function (m) { return m.slug; }).join(" "));
    }
    const text = lines.join("\\n");
    out.textContent = text;
    out.classList.add("show");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    }
  });
})();
</script>

</body>
</html>
`;
}

function main(): void {
  const heroes: SeedHero[] = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const html = buildHtml(heroes);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`✓ wrote ${outPath} (${heroes.length} heroes)`);
  console.log(`Open in your browser: file://${outPath}`);
}

main();
