---
id: hydrate_next_session
title: Hydrate Next Session
role: session-log
canonical_for: [session-end-snapshot, next-session-prompt]
visibility: internal
status: rolling
last_updated: 2026-05-10
cross_refs: [CLAUDE_CONTEXT.md, DOC_MAP.md, EDGE_VECTORS.md, LAUNCH_CRITERIA.md, docs/hydration.md, docs/topic-routes.md]
---

# Hydration prompt — next Living Eamon session

## TL;DR — the new minimum-cost hydration ritual

Read these three, in order, and stop:

1. [`docs/hydration.md`](docs/hydration.md) — auto-generated. Topology + gravity wells + critical-path + recent-activity. ~1600 tokens.
2. [`docs/launch-readiness.md`](docs/launch-readiness.md) — auto-generated. Prioritized blocker list.
3. `MEMORY.md` — auto-loaded by the harness; pay attention to feedback memories.

**For any specific task** — look up the topic in [`docs/topic-routes.md`](docs/topic-routes.md) and load the 2–4 docs ranked there. Each design-canon doc has a Q+A block at the top that answers most questions in ~600 tokens.

**Visual topology (optional):** [`docs/doc-graph.svg`](docs/doc-graph.svg). If stale: `npx -y -p @mermaid-js/mermaid-cli@latest mmdc -i docs/doc-graph.mmd -o docs/doc-graph.svg`.

**This file** is the session-end snapshot below — read for last-session context only. The historical 7-step rehydration ladder is preserved in `CLAUDE.md` under "Full-audit hydration."

---

## Status of the previous session (2026-05-09 → 2026-05-10)

Two-phase session. **Phase A:** authored Q+A annotation blocks on the remaining 12 design-canon / sprint-plan / lore-design docs (the post-pilot batch). **Phase B:** built three orchestration generators that compress the hydration stack from 7 reads to 3 and surface drift automatically.

### Phase A — Q+A annotation sprint (12 docs)

Authored Q+A blocks on KARMA_SYSTEM, MODULE_SYSTEM, SORCERY, Public_Domain_Rules, ADVENTURE_MODULES_PLAN, KARMA_IMPLEMENTATION_PLAN, hyborian-pd MODULE_PLAN, WORLD_LOCATIONS, TRAVEL_MATRIX, LOOT_TABLES, scrolls-of-thoth INDEX, stobaean-fragments INDEX. Each follows the PANTHEON / GAME_DESIGN pilot schema: frontmatter declares `questions_total`, `questions_answered`, `questions_open`, `edge_vector_ids`; body has `### [CATEGORY]` blocks ending with confidence tags + `↔ relates to:` lines.

**Totals:**
- 94 new Q+A entries (combined corpus is now 115 entries across 15 docs)
- 19 new Edge Vectors (combined open EV count: 23)
- Graph density: 91 → 187 edges, 4 → 23 EVs
- Critical-path priority: 116 → 136 (better-quantified blocker)
- 9 commits (one per doc / commit-pair)

### Phase B — doc orchestration v2

Three layers shipped:

**Layer 1 — `docs/hydration.md` generator** (`scripts/build-hydration.ts`, 1600 tokens of output).
Single-page primer fusing topology + gravity wells + open EVs + critical-path + recent-activity. Replaces items 0–7 of the old rehydration stack for routine sessions.

**Layer 2 — `docs/topic-routes.md` generator** (`scripts/build-topic-routes.ts`, 2500 tokens).
Reverse index: each Q+A category lists the docs that answer it ranked by question count. Lookup-table for "what to load when the question is X."

**Layer 3 — `npm run docs:validate`** (`scripts/validate-docs.ts`).
Fails on Q+A frontmatter drift, missing EV references, broken DOC_MAP paths, body Q+A without frontmatter counts. Caught real drift: `LAUNCH_CRITERIA.md` had 3 body Q+A entries but no frontmatter counts — fixed in the same commit.

**Wiring:** `scripts/watch-docs.ts` cascades all four generators on every doc change (`graph → launch-readiness → hydration → topic-routes → validate`). New npm scripts: `hydration:build`, `topic-routes:build`, `docs:build` (chains all four), `docs:validate`. The watcher runs alongside `next dev` via `npm run dev:all`.

**Bonus before Phase B:** added `docs/doc-graph.mmd` + Mermaid renderer to `scripts/build-doc-graph.ts`, generating a visual flowchart with role-clustered subgraphs, status-colored doc nodes, and red-dashed open EVs. Render via `npx mmdc -i docs/doc-graph.mmd -o docs/doc-graph.svg`.

### Commit ledger this session

| Commit | What |
|---|---|
| `857c935` | Q+A: KARMA_SYSTEM (10 questions, 8 high + 2 open) |
| `e472c83` | Q+A: MODULE_SYSTEM (10 questions, 8 high + 2 non-high) |
| `678f8e6` | Q+A: SORCERY (10 questions, 8 high + 2 non-high) |
| `ca0e6bf` | Q+A: Public_Domain_Rules (10 questions, 8 high + 2 non-high) |
| `64cb4f3` | Q+A: ADVENTURE_MODULES_PLAN (8 questions, 6 high + 2 non-high) |
| `5bb6748` | Q+A: KARMA_IMPLEMENTATION_PLAN (8 questions, 6 high + 2 non-high) |
| `aac7f0e` | Q+A: hyborian-pd MODULE_PLAN (8 questions, 6 high + 2 non-high) |
| `5d0f448` | Q+A: WORLD_LOCATIONS + TRAVEL_MATRIX (cartography pair) |
| `b22f8b9` | Q+A: LOOT_TABLES + scrolls/stobaean INDEX docs (final batch) |
| `2494d97` | chore: refresh .claude/settings.json allowlist |
| `b3dee7e` | graph:build emits doc-graph.mmd for Mermaid preview |
| `6d1cb35` | Layer 1: docs/hydration.md generator |
| `7c9a9b0` | Layer 2: docs/topic-routes.md generator |
| `9d1b7ee` | Layer 3: docs:validate + watcher cascade + ritual switch |

### Critical-path answer (from `docs/launch-readiness.md`)

Unchanged: **`karma_sprint_chain`** — priority **136** — KARMA Sprints 1–7 end-to-end. Blocks 10 downstream sprint items + multiple open EVs. Awaits Scotch sign-off on KARMA_SYSTEM §6, Sprint 0 audit, MODULE_SYSTEM Stage I.

### Loose ends carried forward

- **`mcclure.jw@gmail.com` role flip** still pending (auth.users exists; no `players` row until first login).
- **KARMA approval gates** still pending (literal critical path).
- **Q+A coverage** is now 115 entries across 15 docs. Remaining design-canon doc without Q+A: **CLAUDE_CONTEXT.md** (lower priority, dev-process role, may not need Q+A).
- **Mermaid graph viz at `/library/graph`** — still deferred polish. The .mmd file ships now; the wiki page is a future option.
- **Production build broken** on a pre-existing Turbopack issue with `lib/imageProcessing.ts` referencing a `.venv/bin/python3` symlink. Dev mode tolerates it.
- **`c2-npc-kit.test.ts`** has 4 fixture-drift failures from before this session.
- **`.claude/settings.json`** — committed once mid-session; will likely accumulate more incidental Bash allowlist entries between sessions.

---

## What's next — your choice

Three plausible directions:

1. **Authorize the KARMA approval gate.** Still the literal #1 priority on the launch-readiness report. Single highest-leverage decision Scotch can make. **Not a coding task — a review/sign-off task.**
2. **Layer 4 polish** — speed multipliers Scotch deferred this session: (a) auto-rewrite of `HYDRATE_NEXT_SESSION.md` from `git log` at session-end; (b) `docs:watch:strict` mode that fails the dev server on validation errors; (c) per-task scopes ("loading scope: KARMA-implementation" pre-loads 3 specific docs). Mechanical work; ~1 session.
3. **PRAY + Divinity v1** (separate plan, approved). Independent of the doc-orchestration work, gated on KARMA_SYSTEM §6 approval (so blocked until #1 above).

Other options queued: production-integrate Combat Arena v2, Stripe payment gate, Mermaid wiki page at `/library/graph`.

---

## Operational facts

- **Branch model:** `dev` is working; `main` is Vercel deploy target. Always merge with `--no-ff`.
- **Dev server:** port **3000**. **Recommended dev command: `npm run dev:all`** (runs `next dev` + `docs:watch` together via `concurrently`, color-prefixed).
- **Doc-orchestration npm scripts (full set after this session):**
  - `graph:build` — regenerates `docs/doc-graph.{json,md,mmd}`
  - `launch:status` — regenerates `docs/launch-readiness.md`
  - `hydration:build` — regenerates `docs/hydration.md`
  - `topic-routes:build` — regenerates `docs/topic-routes.md`
  - `docs:build` — chains all four generators
  - `docs:validate` — fails on drift (Q+A counts, EV refs, missing paths)
  - `docs:watch` — chokidar watcher; cascades all generators + validate on any markdown change (300ms debounce)
  - `dev:all` — convenience: `next dev` + `docs:watch` in parallel
- **Auth bypass for dev APIs:** `proxy.ts` whitelists `/api/sprite-list`, `/api/sprite-metadata`, `/api/sprite-regen`, `/api/sprite-touchup`, `/api/prompt-rules`, `/api/item-icon` under `NODE_ENV !== "production"`.
- **Roles in DB:** `joshua.mcclure@gmail.com` is `admin`. All other accounts default to `player` until flipped.
- **Supabase migration apply method:** `npx supabase db push` is broken. Use Management API:
  ```bash
  SUPABASE_ACCESS_TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2- | tr -d '"')
  SQL=$(cat supabase/migrations/<file>.sql)
  curl -sS -X POST \
    "https://api.supabase.com/v1/projects/dhjgfdfeopdjjyyvfmfy/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -nc --arg q "$SQL" '{query: $q}')"
  ```

---

## Discipline / process notes

- **No live game.** Schema changes + breaking refactors are safe.
- **`DOC_MAP.md` discipline:** any doc add / move / role-change updates `DOC_MAP.md` in the same commit. See `feedback_doc_map_discipline.md`.
- **Q+A discipline:** when adding a Q+A block, also add the EV entries to `EDGE_VECTORS.md` AND make sure the source doc's frontmatter `edge_vector_ids` array matches. Run `npm run docs:validate` to verify before commit. Run `npm run docs:build` (or rely on the watcher) to regenerate the indexes.
- **LAUNCH_CRITERIA discipline:** when an item ships, flip `status: not-started` → `status: shipped` and re-run `npm run launch:status` (or rely on the watcher).
- **Hard rule from 2026-05-07 post-mortem:** do NOT modify `app/dev/combat-test/page.tsx` or `components/CombatScreen.tsx` without explicit specific permission.
- **Combat sprite width is never constrained.** Only height. Tailwind preflight `img { max-width: 100%; }` overridden via inline `maxWidth: "none"`.
- **Lane spacing locked.** `SPACE_OFFSETS = [0.1975, 0.5, 0.8025]`.
- **Eye-Y is required.** `figureScaleByEye` throws on undefined.
- **Bandit / hostile NPC sprites apply `UGLY_MEAN_OVERLAY`** in their forge prompts.
- **Hydration discipline.** `git log --oneline --all --graph | head -20` is authoritative over any doc.
- **Apostrophes in heredoc commit messages break bash.** Use plain words instead.

---

## Standard sprint-ship workflow

```
git add <specific files>     # never -A; avoid bundling unrelated drift
npm run docs:validate        # confirm Q+A frontmatter is consistent
git commit -m "Sprint NX: <what>"
# (graph + readiness + hydration + topic-routes already fresh thanks to docs:watch)
git checkout main
git merge --no-ff dev -m "Merge Sprint NX"
git checkout dev
```

- Typecheck before committing: `npx tsc --noEmit`
- Run tests: `npx tsx __tests__/<suite>.test.ts`
- **Never bundle unrelated drift into a sprint commit.**
- If you edit Q+A blocks or DOC_MAP, the watcher rebuilds the graph + readiness + hydration + topic-routes automatically. Just commit the source change + the regenerated `docs/*` outputs in the same commit (the diff makes it obvious which is which).

---

End of hydration prompt.
