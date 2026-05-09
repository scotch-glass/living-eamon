---
id: hydrate_next_session
title: Hydrate Next Session
role: session-log
canonical_for: [session-end-snapshot, next-session-prompt]
visibility: internal
status: rolling
last_updated: 2026-05-09
cross_refs: [CLAUDE_CONTEXT.md, DOC_MAP.md]
---

# Hydration prompt — next Living Eamon session

## Status of the previous session (2026-05-09)

Two-phase session.

**Phase 1 — Marathon cleanup + lore commit.** The previous session's marathon (Combat Arena v2 FX, spell-registry purge, HASTE rewire, agility → dexterity refactor, CombatantInfoPopup overhaul, lore-sync banners) was ~50 files unstaged on `dev`. Reverted the TEMP `isCrit = true` debug at [lib/combat/engine.ts:371](lib/combat/engine.ts#L371), then committed in three discrete commits: the marathon (`ac875e4`), the Thurian-pantheon integration into [lore/pantheon/PANTHEON.md](lore/pantheon/PANTHEON.md) (`a73fb28`), and a small cleanup removing a stray `QIDP Advantages.png` from `lore/thurian-cartography/` (`9cfbeee`).

**Phase 2 — W1 foundation of the doc-orchestration / `/library` wiki sprint.** Scotch reported doc-volume + overlap concerns and requested a creator-facing wiki. Plan was researched (3 parallel Explore agents + 1 Plan agent), approved, and now lives at `~/.claude/plans/review-the-lore-and-floofy-hamming.md`. W1 (foundation) shipped across three commits — agility purge in KARMA_SYSTEM (`64020ca`), DOC_MAP.md spine + YAML frontmatter on 24 docs + hydration wiring (`5903d1b`), and auth role infrastructure (`97d5b61`).

### Six commits this session

| Commit | Sprint | What |
|---|---|---|
| [`97d5b61`](.) | **W1.3** | players.role migration + lib/auth/role.ts + proxy.ts /library gate |
| [`5903d1b`](.) | **W1.2** | DOC_MAP.md + YAML frontmatter on 24 docs + CLAUDE.md/CLAUDE_CONTEXT.md hydration wiring |
| [`64020ca`](.) | **W1.1** | agility → evasion in KARMA_SYSTEM.md (4 stale descriptors) |
| [`9cfbeee`](.) | cleanup | remove stray QIDP Advantages.png from lore tree |
| [`a73fb28`](.) | lore | merge Thurian-era pantheon integration (Valka/Hotath/Helfara/Honen/Helgor/The-Serpent + Valkyrie + dispatcher notes) into PANTHEON.md |
| [`ac875e4`](.) | (marathon) | Combat Arena v2 FX + spell purge + HASTE rewire + agility refactor (60 files, +6187/-831) |

### W1 deliverables — what now exists

**[`DOC_MAP.md`](DOC_MAP.md) (new, ~250 lines) — master documentation spine.** Every doc in the repo has a row declaring `id`, `role` (one of: `design-canon` / `sprint-plan` / `session-log` / `reference-generated` / `lore-artifact` / `legal` / `dev-process`), `canonical_for` (topic ownership), `visibility` (`internal` / `creator`), `status`, `last_updated`, `cross_refs`. Bottom of the file has a topic-lookup table ("PICSSI virtue defs (lore) → GAME_DESIGN.md §11", "Combat-PICSSI delta table → KARMA_SYSTEM.md §4c", etc.) plus maintenance rules.

**YAML frontmatter on 24 docs.** Schema applied to 14 root docs + 9 lore/reference docs. Lore artifacts that already had bespoke frontmatter (15 Scrolls of Thoth, 14 Stobaean fragments, the-conquerors-question, the-lament) NOT touched — their frontmatter is parsed by `lib/karma/scrolls.ts` and a future runtime loader.

**Hydration wiring.** [CLAUDE.md](CLAUDE.md) has a new "Doc index" callout pointing at DOC_MAP.md and a new item-0 in the read-stack. [CLAUDE_CONTEXT.md](CLAUDE_CONTEXT.md) rehydration block has DOC_MAP.md inserted as step 0. Future Claude sessions scan it first.

**`players.role` column** (migration `20260509000000_w1_player_role.sql`, applied via Management API). Values `'player'` (default, CHECK-constrained) | `'creator'` | `'admin'`. Indexed.

**[lib/auth/role.ts](lib/auth/role.ts) (new).** `UserRole` type, `getUserRole(userId)` (defaults to `'player'` if missing), `roleMeetsThreshold(role, threshold)`. Treated as auth metadata, NOT WorldState — does not round-trip through `lib/persistence/playerRecord.ts`.

**[proxy.ts](proxy.ts) `/library` gate.** Inserted between the unauthenticated check and the character-creation gate (so module authors who haven't built a hero can still browse the canon). Insufficient role bounces to splash; W2 will replace with a styled 403.

**Account roles flipped:**
- `joshua.mcclure@gmail.com` → `'admin'`
- `mcclure.jw@gmail.com` → no `players` row yet (auth.users exists; row auto-created on first login). Per Scotch's spec it should be `'creator'`. **Loose end:** after that account next signs in, run:
  ```sql
  update players set role = 'creator'
    where user_id = (select id from auth.users where email = 'mcclure.jw@gmail.com');
  ```

### Decisions / discoveries this session

1. **The doc-overlap audit was wrong about three of four dedup targets.** KARMA §2.5–2.10, MODULE_SYSTEM §5.1, and MODULE_SYSTEM §6.1 are NOT duplicates of GAME_DESIGN §11 — they contain load-bearing mechanical detail (atom magnitudes, Ordered-Retreat mechanic, triple-penalty rule, group-flee behavior, shop-deal formulas) and TypeScript implementation spec (`PicssiState`, `PICSSI_BOUNDS`, hook-point integration code) respectively. Replacing them with pointers would have destroyed content. The cross-references to GAME_DESIGN.md are already explicit. **Action:** the dedup-pointer items in the original plan were dropped; only the agility purge survived from W1.1.
2. **Visibility tiers locked.** `creator`-visible: GAME_DESIGN, KARMA_SYSTEM, MODULE_SYSTEM, ADVENTURE_MODULES_PLAN, SORCERY, Public_Domain_Rules, README, all `lore/` files, `docs/*` registries. `internal` only: CLAUDE, CLAUDE_CONTEXT, HYDRATE, KARMA_IMPLEMENTATION_PLAN, AGENTS, TECH, SESSION_001_*, DOC_MAP itself. Encoded in `DOC_MAP.md` and per-doc frontmatter.
3. **Roles confirmed by Scotch:** three values — `player` (default) / `creator` (Ink module authors) / `admin` (Scotch).
4. **Substrate decision:** the wiki ships as a Next.js 16 route `/library` inside the existing app (not VitePress / mkdocs / docusaurus / GitHub Wiki / Notion). Reuses `proxy.ts` auth, `/board`+`/splash`+`/legal` chrome, the running Vercel deploy. Single-login UX for Creators.

---

## What's next — W2 (wiki UI), ~1 day

The plan file (`~/.claude/plans/review-the-lore-and-floofy-hamming.md`) details Sprint W2 step-by-step. High-level:

1. **Read existing public pages first** (`app/splash/`, `app/board/`, `app/legal/`) to extract Tailwind tokens / typography / chrome. The wiki must visually feel like Living Eamon, not a Confluence clone.
2. **Build `/library` shell** — `app/library/layout.tsx` with top nav + sidebar. `lib/library/docMap.ts` parses `DOC_MAP.md`, filters by visibility for the current user's role.
3. **Markdown renderer** — `lib/library/markdown.ts` using `marked` (~30KB). Custom hooks: rewrite internal links (`lore/foo.md` → `/library/...`), parse + display frontmatter as a metadata sidebar on lore pages, syntax-highlight code blocks (`shiki` or `highlight.js`).
4. **Dynamic page route** — `app/library/[...slug]/page.tsx` with role-gating. Landing page renders DOC_MAP-derived section cards (Setting & Lore / Mechanics & PICSSI / Module Authoring / Registries / PD Rules). Styled 403 page replaces the splash redirect for insufficient-role users.
5. **Search box** — client-side `fuse.js` (~10KB) over titles + headings.

**New deps to install:** `marked`, `@tailwindcss/typography` (verify not already pulled in), `shiki` OR `highlight.js`, optionally `fuse.js`.

**Verification (per the plan's §Verification section):** build passes, wiki renders at `localhost:3000/library` as admin, sidebar covers all `creator`-visible docs, `internal` docs hidden, internal-link clicks resolve correctly, frontmatter renders in metadata sidebar.

After W2 ships, **W3 (~half day)** extends `npm run registry:dump` to spells / adventures / NPCs with an umbrella `npm run docs:dump` and drift-detection `npm run docs:check`. Closes the auto-sync loop that protects against doc/code drift.

---

## Known follow-ups (carried over)

- **`mcclure.jw@gmail.com` role flip** — after first login (see SQL above).
- **PRAY + Divinity System v1 sprint** — separate plan at `~/.claude/plans/the-skull-and-pack-luminous-muffin.md`. Approved but unimplemented. Independent of the wiki sprint.
- **Karma approval gates** — KARMA_SYSTEM §6, KARMA_IMPLEMENTATION Sprint 0 audit, MODULE_SYSTEM Stage I all still pending Scotch sign-off. These block Karma Sprint 1 but are unrelated to W2.
- **maatic-library books (8 files)** + `docs/quest-registry.md` — orchestration-declared in DOC_MAP.md but per-file YAML frontmatter deferred until W2 firms up the renderer's frontmatter expectations.
- **Corpse loot UI / burial / per-room clock** — deferred per `project_corpse_loot_burial_deferred.md`.
- **Click-to-slot from spellbook** — original arena Phase 5.
- **Live-game integration of `<CombatArena>`** — production game flow still on `<CombatScreen>` v1.
- **`c2-npc-kit.test.ts`** — 4 fixture-drift failures from before this session. Not regressions.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order:

0. [`DOC_MAP.md`](DOC_MAP.md) — **NEW master spine**. Every doc declared with role / visibility / status. Scan first.
1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview.
3. **This file** — the session-end snapshot above.
4. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index. Pay attention to:
   - `project_doc_orchestration_plan.md` (NEW — pointer to the approved /library wiki plan)
   - `feedback_doc_map_discipline.md` (NEW — when adding/moving/role-changing a doc, update DOC_MAP.md in the same commit)
   - `project_haste_design_locked.md` (HASTE mechanic spec)
   - `project_spells_purged_2026-05-09.md` (POWER/DAYLIGHT/MIRROR/BANISH/INVOKE-LIGHT removal)
   - `project_agility_to_dexterity.md` (terminology refactor outcome)
   - `project_pray_divinity_plan_approved.md` (PRAY plan — separate from wiki work)
5. **Approved orchestration plan:** `~/.claude/plans/review-the-lore-and-floofy-hamming.md` — currently W1 SHIPPED, W2 (wiki UI) DEFERRED, W3 (registry dumps) DEFERRED. Drive into W2 if Scotch authorizes.
6. **Approved divinity plan (separate):** `~/.claude/plans/the-skull-and-pack-luminous-muffin.md` — PRAY + Divinity v1.

After reading, confirm hydration with one paragraph naming: (a) what shipped in the previous session (W1 foundation: DOC_MAP + frontmatter + role gate), (b) what's next (W2 wiki UI), (c) any open questions or blockers.

---

## Operational facts

- **Branch model:** `dev` is working; `main` is Vercel deploy target. Always merge with `--no-ff`.
- **Dev server:** port **3000**.
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
- **`DOC_MAP.md` discipline:** any doc add / move / role-change updates DOC_MAP.md in the same commit. See `feedback_doc_map_discipline.md`.
- **Hard rule from 2026-05-07 post-mortem (still in force):** do NOT modify `app/dev/combat-test/page.tsx` or `components/CombatScreen.tsx` without explicit specific permission.
- **Combat sprite width is never constrained.** Only height. Tailwind preflight `img { max-width: 100%; }` overridden via inline `maxWidth: "none"`.
- **Lane spacing locked.** `SPACE_OFFSETS = [0.1975, 0.5, 0.8025]`.
- **Eye-Y is required.** `figureScaleByEye` throws on undefined.
- **Bandit / hostile NPC sprites apply `UGLY_MEAN_OVERLAY`** in their forge prompts.
- **Hydration discipline.** `git log --oneline --all --graph | head -20` is authoritative over any doc.
- **Apostrophes in heredoc commit messages break bash.** Use plain words instead (e.g., "renderer frontmatter expectations" not "renderer's...").

---

## Standard sprint-ship workflow

```
git add <specific files>
git commit -m "Sprint NX: <what>"
git checkout main
git merge --no-ff dev -m "Merge Sprint NX"
git checkout dev
```

- Typecheck before committing: `npx tsc --noEmit`
- Run tests: `npx tsx __tests__/<suite>.test.ts`
- **Never bundle unrelated drift into a sprint commit.** This session left `.claude/settings.json` unstaged for that reason.

---

End of hydration prompt.
