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

## Status of this session (2026-05-10)

**Three-system infrastructure sprint: Systems 1–2 complete, System 3 pending approval.**

### What shipped

**System 1: Room Map Maker** ✓ (1 day)
- `scripts/build-room-graph.ts` — Mermaid flowchart generator from ALL_ROOMS registry
- `app/admin/room-map/page.tsx` — dev-only SVG visualization at `/admin/room-map` (NODE_ENV gated)
- Output: `docs/room-graph.{mmd,svg}` with 34 rooms, 16 edges, 2 modules (guild_hall=9 rooms, destination_stubs=25 rooms)
- CLI: `npm run room-graph:build` / `npm run room-graph:build:svg`
- Commit: `6fc248b`

**System 2.1: Encounters + Difficulty Badges** ✓ (1.5 days)
- `lib/world/travelEncounters.ts` — 13 zone-type encounter pools (mix of combat + narrative events)
- Travel encounter system wired: `DANGER_ENCOUNTER_CHANCE` tuned (safe=10%, moderate=25%, dangerous=40%, extreme=57%, deadly=75%)
- `lib/gameState.ts`: `AdvanceTravelResult.encounter` changed from boolean → TravelEncounter | null; `advanceTravel()` now picks actual encounters via `pickEncounter(zone, danger)`
- `lib/gameEngine.ts`: Encounter wired into travel dispatch block; event text appends to narrative
- `components/WorldMap.tsx`: Difficulty badges (green/amber/red circles) render below pins; difficulty label in hover tooltip
- Modules tagged: `guild_hall` and `destination_stubs` both set `difficulty: "novice"`
- Commit: `1a4432c`

**System 2.2: Multi-hop Pathfinding** ✓ (1 day)
- `lib/world/travelMatrix.ts`: Added `findRoute(source, target)` BFS pathfinder (returns TravelLeg[] path or null)
- `lib/gameState.ts`: Extended TravelRoute with `waypoints[]` (intermediate nodes) + `currentLegIndex` (0-indexed current leg)
- `startTravel()` now: tries direct leg first (fast path), falls back to BFS if unreachable; sums days across all legs, combines zones, uses max danger rating
- DB migration marker (documentation-only): `supabase/migrations/20260510150000_travel_route_v2_waypoints.sql`
- Commit: `43ef7a2`

### What's pending

**System 3: Ink Runtime** — requires Scotch approval before coding:
1. Read and approve `MODULE_SYSTEM.md` Stage I (Ink spec, 16 EXTERNAL functions, 19 variable bindings)
2. Choose which travel node the first Ink module should anchor to

Once approved, System 3 will add:
- Ink module loader + Story caching + compilation/validation scripts
- 16 EXTERNAL function bindings (apply_karma, set_flag, start_combat, etc.)
- 19 PlayerState variable synchronization
- GPE balance analyzer for per-virtue PICSSI deltas

### Next sprint: Destination Room Authoring

All 25 destination stubs need rich descriptions + exotic NPCs. Authoring template ready at `~/.claude/plans/destination-rooms-authoring.md`:
- 5 Cities (Vanara, Kamula, Talunia, Blaal, Stagus)
- 5 Landmarks (Skull of Silence, Lake of Visions, Accursed Gardens, Forbidden Lake, Tiger Valley)
- 7 Nations (Atlantis, Thule, Commoria, Lemuria, Farsun, Thurania, Kamelia)
- 8 Wilderness (Lost Lands, Camoonian Desert, Deep Jungle, World's End, Red Isles, Mu, Tathel Isle, Zalgara Mts)

Process: Author descriptions in conversation (prose + exotic NPC details), then convert to Room definitions. ~2-4 hours total.

---

## Status of the previous session (2026-05-11) [PRIOR SESSION LOG]

**Parallel coder/interviewer workflow shipped end-to-end.** Three commits (`a447333`, `cc4294d`, `ec94618`) on top of the prior session's scaffold (`74e3ce8`) bring the full plan from `~/.claude/plans/ok-now-i-want-robust-alpaca.md` to operational. All nine "still to ship" items from the previous session log are done.

### What landed

**Refactor (`a447333`).** `scripts/launch-readiness.ts` and `scripts/build-doc-graph.ts` now consume the typed loaders shipped in `74e3ce8` (`lib/library/launchCriteria` + `lib/library/edgeVectors`). ~130 lines of duplicated parsing removed; behavior preserved (top priority unchanged at `karma_sprint_chain` 136).

**Triager + interviewer (`cc4294d`).**
- `lib/anthropic/client.ts` — minimal `callHaiku()` (no Grok fallback, no streaming). Per the plan, `app/api/chat/route.ts:streamWithFallback` was NOT refactored — too risky for this sprint; route.ts stays inline.
- `scripts/build-work-queue.ts` — triager. Classifies every outstanding item across `EDGE_VECTORS.md` + `LAUNCH_CRITERIA.md` into 5 buckets. Wired into `docs:build` cascade + `docs:watch`. Headline: **23 awaits_answer · 2 awaits_approval · 7 ready_to_code · 7 blocked · 15 done**.
- `scripts/interview.ts` — Haiku daemon. Picks highest-priority `awaits_answer` EV, prints structured Q + best guess + resolution path, takes free-form answer via stdin, optionally polishes via Haiku (graceful no-API-key fallback uses raw answer verbatim), confirms, then atomically mutates the source doc: locates the Q+A block via the EV link, flips `[open]/[low]/[medium]` → `[high]`, removes the EV-link suffix, preserves the `↔ relates to:` line, decrements `questions_open`, increments `questions_answered`, removes the EV from `edge_vector_ids`, and deletes the corresponding block from `EDGE_VECTORS.md`. Runs `docs:build` to refresh the queue; idles 30s when empty; SIGINT-clean. Per-session skip set prevents infinite loops on declined items.
- `scripts/smoke-interview-mutation.ts` — in-memory smoke test. Exercises `locateQABlock` / `rewriteQABlock` / `patchFrontmatter` / `locateEvBlock` end-to-end on `KARMA_SYSTEM.md` + `EV-karma_system-002`. **6/6 checks pass:** Q+A block located by EV link, tag flip, ↔ relates-to preserved, frontmatter counts correct (open 2→1, answered 8→9), EV removed from `edge_vector_ids`, EDGE_VECTORS.md range located. Touches no files on disk.
- Wiring: `package.json` adds `work-queue:build` + `interview` scripts; `docs:build` chains 5 generators. `scripts/watch-docs.ts` cascade extended. `DOC_MAP.md` gains a `work_queue` reference-generated row.

**Docs (`ec94618`).** `CLAUDE.md` hydration ritual + `HYDRATE_NEXT_SESSION.md` operational facts get the 3-terminal workflow note + new npm scripts.

### How to run the parallel workflow

```
Terminal 1: npm run dev:all          # next dev + docs:watch
Terminal 2: npm run interview        # Haiku daemon (needs ANTHROPIC_API_KEY)
Terminal 3: Claude Code              # Opus coding ready_to_code items from docs/work-queue.json
```

The interviewer keeps running. When the `awaits_answer` queue is empty it logs `[interview] no open questions — sleeping 30s` and waits. When Scotch (or anyone) adds a new `[open]` Q+A entry to a doc, the watcher regenerates the queue and the interviewer picks it up on its next loop.

### Known caveat — readline + piped stdin

`readline.question()` hangs on the second prompt when stdin is piped (not a TTY). The mutation logic is therefore validated via the in-memory smoke test rather than via a `--dry-run` of the daemon driven by a here-doc. The daemon itself works fine in an interactive terminal. If we ever need to drive it programmatically (e.g., for CI), swap to a stdin queue or `node-pty`.

### Critical-path answer (from `docs/launch-readiness.md`)

Unchanged: **`karma_sprint_chain`** — priority **136** — KARMA Sprints 1–7 end-to-end. Blocks 10 downstream sprint items + 13 open EVs. Awaits Scotch sign-off on KARMA_SYSTEM §6, Sprint 0 audit, MODULE_SYSTEM Stage I.

### Loose ends carried forward

- **`mcclure.jw@gmail.com` role flip** still pending (auth.users exists; no `players` row until first login).
- **KARMA approval gates** still pending (literal critical path; the interviewer can now walk Scotch through them).
- **Q+A coverage** is 115 entries across 15 docs. Remaining design-canon doc without Q+A: **CLAUDE_CONTEXT.md** (dev-process role, may not need Q+A).
- **Mermaid graph viz at `/library/graph`** — deferred polish. The .mmd file ships; the wiki page is a future option.
- **Production build broken** on a pre-existing Turbopack issue with `lib/imageProcessing.ts` referencing a `.venv/bin/python3` symlink. Dev mode tolerates it.
- **`c2-npc-kit.test.ts`** has 4 fixture-drift failures from before this session.
- **`.claude/settings.json` + `docs/doc-graph.svg`** — pre-existing drift not bundled into this sprint's commits. Decide whether to land a chore commit next session.

---

## What's next — recommended order

1. **Authorize the KARMA approval gate.** Still the literal #1 priority on the launch-readiness report. Single highest-leverage decision Scotch can make. Not a coding task — a review/sign-off task. The new interviewer (`npm run interview`) is now the natural way to walk through the §6 approval list, since the gate items show up as the highest-priority `awaits_answer` EVs.
2. **PRAY + Divinity v1** (separate plan, approved at `~/.claude/plans/the-skull-and-pack-luminous-muffin.md`). Gated on KARMA_SYSTEM §6 approval (so blocked until #1).
3. **Drain the awaits_answer backlog via the interviewer.** Even before KARMA approval, every resolved EV improves graph density + critical-path quality. The 23-item queue at session-start is the natural target. Each answered EV regenerates the queue automatically through the watcher.

Other options queued: production-integrate Combat Arena v2, Stripe payment gate, Mermaid wiki page at `/library/graph`, Layer 4 speed multipliers (auto-rewrite HYDRATE on session-end via `git log`, `docs:watch:strict` mode, per-task scope pre-loaders), fix the 4 `c2-npc-kit.test.ts` fixture-drift failures.

---

## Operational facts

- **Branch model:** `dev` is working; `main` is Vercel deploy target. Always merge with `--no-ff`.
- **Dev server:** port **3000**. **Recommended dev command: `npm run dev:all`** (runs `next dev` + `docs:watch` together via `concurrently`, color-prefixed).
- **Doc-orchestration npm scripts (full set after this session):**
  - `graph:build` — regenerates `docs/doc-graph.{json,md,mmd}`
  - `launch:status` — regenerates `docs/launch-readiness.md`
  - `hydration:build` — regenerates `docs/hydration.md`
  - `topic-routes:build` — regenerates `docs/topic-routes.md`
  - `work-queue:build` — regenerates `docs/work-queue.{json,md}` (triaged backlog)
  - `docs:build` — chains all five generators
  - `docs:validate` — fails on drift (Q+A counts, EV refs, missing paths)
  - `docs:watch` — chokidar watcher; cascades all generators + validate on any markdown change (300ms debounce)
  - `interview` — Haiku-driven interactive daemon that walks open EVs with Scotch and writes answers back into source docs (run in a second terminal)
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
