---
id: hydrate_next_session
title: Hydrate Next Session
role: session-log
canonical_for: [session-end-snapshot, next-session-prompt]
visibility: internal
status: rolling
last_updated: 2026-05-13
cross_refs: [CLAUDE_CONTEXT.md, DOC_MAP.md, EDGE_VECTORS.md, LAUNCH_CRITERIA.md, docs/hydration.md, docs/topic-routes.md, docs/plans/creator-forge-and-quest-line-orchestrator.md, docs/plans/cf-1-module-survivability-and-wizard.md]
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

## Status of this session (2026-05-12 → 2026-05-13)

**Creator Forge foundation + CF-1 difficulty engine + CF-1.5 Reader Panel with Eve voice.** Sixteen commits, ~6,500 lines net. The biggest single session of the project so far. Three sub-arcs:

1. **CF-0 Creator Forge foundation** — Opus 4.7 client, Supabase storage, admin routes, plan-storage convention. Foundation for the entire Creator authoring track.
2. **CF-1 Module survivability simulator + wizard** — 4-tier synthetic enemy table, Monte Carlo simulator, 18-question wizard with PD-anchor auto-defaults, anchor-A calibration at 49.8% (target 50% ±3%).
3. **CF-1.5 Reader Panel + Eve voice pre-roll pipeline** — Georgia serif modal reader, xAI TTS narration, admin approval surface with single-source-of-truth editable script.

Plus: KARMA tracker audit (discovered Sprints 1-6 already shipped); URL refactor (Creator Forge moved out of /admin/); Perpetual Hero king-thread woven into 4 PD anchors; admin dashboard top nav.

### Sub-arc 1 — CF-0 Foundation (commit `f855060`)

**What shipped:**
- `lib/anthropic/opus.ts` — Claude Opus 4.7 client (text-only, server-only).
- `lib/creator/storage.ts` — Supabase Storage backend (`creator-modules` bucket). Originally filesystem; switched to Supabase mid-sprint when Scotch flagged Vercel can't write to disk at runtime.
- `app/api/creator/llm/route.ts` — admin-gated Opus proxy. `ANTHROPIC_API_KEY` never reaches the browser.
- `app/api/creator/[...path]/route.ts` — module persistence REST (GET/PUT/DELETE).
- `app/admin/creator-forge/page.tsx` + `app/admin/quest-lines/page.tsx` — empty-state shells.
- `app/library/plans/page.tsx` + `[slug]/page.tsx` — plans index + detail in /library wiki.
- `docs/plans/creator-forge-and-quest-line-orchestrator.md` — canonical plan home in repo.
- `proxy.ts` — admin-role gating for new admin paths.
- DOC_MAP.md updated with `plan_creator_forge` row.

**Follow-up — moved to /creator-forge** (`ac1b425`): Scotch flagged that `/admin/creator-forge` shouldn't be admin-only if Creators are supposed to use it. Refactored:
- `/creator-forge/*` → `role IN ('creator', 'admin')`
- `/admin/quest-lines/*` → `role='admin'` (stitching is admin work)
- All path references throughout the codebase + plan doc updated

### Sub-arc 2 — KARMA Sprints 1-6 audit + tracker update (commit `e6acf50`)

Discovered the "Rescue" commit `88ce683` (2026-04-30) shipped Sprints 1-5 code + 8 migrations + Sprint 6 UI in one chunk, but the trackers were never updated. Audit confirmed:
- Sprint 1 (stamina/fatigue/actionBudget) — wired
- Sprint 2 (PICSSI bedrock, legacy 10-virtue dropped) — `updateVirtue` grep returns no active mutations
- Sprint 3 (activity dispatcher + VD + scrolls READ) — `lib/karma/activities.ts` wired at `gameEngine.ts:83,2646`
- Sprint 4 (encounter loader + triggers + affection + flags) — `lib/karma/triggers.ts` wired at `gameEngine.ts:85,5638`
- Sprint 5 (combat-PICSSI deltas) — wired at `gameEngine.ts:93`
- Sprint 6 (PICSSI UI, affection panel, karmaLog, riddle modal) — `app/page.tsx:1330,1346-1350,1399,1431`
- Sprint 7 (Sorcery + Illumination drain) — remains explicitly deferred

LAUNCH_CRITERIA.md `karma_sprint_chain` flipped `not-started` → `shipped`. **Critical path moved from `karma_sprint_chain` (priority 116) to `first_launch_adventure` (priority 108).** Headline counts: Tier 0 went from 7-active/7-shipped to 6-active/8-shipped.

### Sub-arc 3 — CF-1 Module survivability simulator + wizard (commit `7a818eb`)

The big one. After two replans (first plan anchored on Rurik combat-arena fixtures and got rejected; second introduced synthetic 4-tier enemy templates per Scotch's correction), shipped:

**Difficulty engine** (`lib/difficulty/`):
- `types.ts`, `enemyTiers.ts` (4-tier Grunt/Veteran/Elite/Boss, doubling unit values 1/2/4/8), `encounterPatterns.ts` (14 patterns with PF2e synergy multipliers), `constants.ts` (slope k=1.5, henchman discounts, severity weights, three reference parties).
- `probability.ts` — logistic P(success) per axis, min-of-axes overall.
- `courageReward.ts` — quadratic (1-P)² curves rounded to KARMA bands.
- `computeLoads.ts` + `computeCapability.ts` — per-axis math.
- `rng.ts` — seeded mulberry32 + dice parser.
- `combatSim.ts` — pure-function combat resolution ported from `lib/combat/engine.ts` (live engine unchanged).
- `atomSim.ts` — virtue + d100 ≥ threshold.
- `simulate.ts` — `simulateModule()` orchestrator with bootstrap CI.

**Anchor A passes at 49.8% over 10k trials** (target 50% ±3%). Tier 2-4 calibration is structurally limited by the analytic capability formula using Tier-1 armor as DPR baseline — empirical simulator handles it correctly, the wizard preview uses empirical P, follow-up tuning documented in `lib/difficulty/enemyTiers.ts` header.

**Wizard** (`lib/creator/`):
- `skeletonTypes.ts`, `questionnaire.ts` (18 questions, 4 sections), `pdAnchors.ts` (8 PD-safe Howard stories), `generateSkeleton.ts` (pure deterministic — mirrors `lib/identityBlock.ts` pattern).
- 5-step UI at `app/creator-forge/new/page.tsx`. Server-side POST `/api/creator/skeleton`. Per-archetype P(complete) shown in preview for fresh / mid / endgame heroes.
- Read-only viewer at `app/creator-forge/[moduleId]/page.tsx`. CF-2+ adds editor tabs.

**Smoke tests:** `scripts/difficulty/smoke-anchor.ts` (6 anchor scenarios) and `scripts/difficulty/smoke-wizard.ts` (end-to-end generator).

### Sub-arc 4 — PD anchor improvements (commits `1b2e892`, `b226337`)

**PD-safety audit** against `Public_Domain_Rules.md` §1.2 Bucket A:
- REMOVED unsafe entries: The Cat and the Skull (posthumous, not Bucket A), The Altar and the Scorpion (posthumous), The Pool of the Black One (Bucket B 1933, not PD yet).
- ADDED Bucket A alternatives: The Haunter of the Ring (1934 occult), Iron Shadows in the Moon (1934 sea), The Fire of Asshurbanipal (1936 Lovecraftian).

**Each PD anchor now provides a complete defaults map.** When Creator picks an anchor, the wizard auto-fills 16 other questions with story-specific defaults. Most use a new "Other (custom)" option whose textarea is pre-populated with ~25-word AI-authored story-specific prose. Creator can confirm, edit, or pick a different preset. ~112 story-specific flavor strings across 8 anchors.

**PD anchor buttons show provenance** ("Kull tale, Weird Tales Sep 1929 · Bucket A non-renewal verified") + "read source ↗" link to Wikisource.

**Perpetual Hero king-thread** woven into Mirrors of Tuzun Thune, Shadow Kingdom, Kings of the Night, Fire of Asshurbanipal. Hints: mirrors call the player "majesty," a serpent pauses on first sighting "as if checking a list," the summoned king "has eyes only for the player," the buried throne fits the player's body. Never explicit; the amnesia mechanic carries the doubt. Documented in `project_perpetual_hero_king_thread.md` memory for future PD-anchor authoring.

### Sub-arc 5 — CF-1.5 Reader Panel + Eve voice (commits `b1af5ca` → `fbb16aa`)

Major sub-sprint. Scotch flagged that text-heavy game prose needs a dedicated reading surface; chat panel is wrong for long-form. Designed + scaffolded:

**Reader Panel** (`components/ReaderPanel.tsx`):
- Full-page modal overlay, Georgia serif 18px, line-height 1.75, max-width 64ch, sepia-on-dark palette.
- **Manual scroll** (no streaming, no typewriter — per Scotch).
- Drop-cap on first paragraph.
- Continue button + Escape key to dismiss.
- Speaker icon top-left for voice toggle; preference persists in localStorage; default OFF.

**Eve voice pipeline** went through three iterations:
1. **`POST /v1/audio/speech`** — wrong endpoint, 403 "Team not authorized."
2. **WebSocket realtime voice agent** — accepts a system prompt for personality, but tried three strict-TTS prompts and the conversational LLM kept paraphrasing + adding "what do you do next?" extemporaneous content. Confirmed: **realtime voice agents cannot be prompt-constrained to verbatim**. Memory `feedback_voice_agent_cant_do_verbatim.md`.
3. **`POST /v1/tts`** (final) — pure TTS, verbatim guaranteed. Eve's voice profile (mysterious slow female, xAI default) provides base tone. Lost the Barcelona-accent customization — revisit when xAI Custom Voices ships broadly. Scotch confirmed: **"The Eve voice is perfect."**

**Pre-roll + approve pipeline** matches `/admin/destination-review` semantics:
- `POST /api/voice/generate` (creator|admin) — TTS + upload version to Supabase bucket `creator-audio` at `voice/<audioId>/v<N>.mp3`. Status = "pending."
- `POST /api/voice/approve` (admin) — flip `metadata.approvedVersion`.
- `PATCH /api/voice/script` (creator|admin) — edit canonical script without regenerating.
- `GET /api/voice/<audioId>` — signed-URL playback. Default returns the approved version; `?version=N` lets admins audition pending versions; `?meta=1` returns full metadata.
- `GET /api/voice/list` — admin listing.

**Single source of truth** (commit `fbb16aa`): `VoiceMetadata.currentScript` is the canonical text. Used as both (a) the input to the next regenerate-audio call and (b) what the player reads in the Reader Panel. Admin edits in `/admin/audio-review` change both surfaces together. **Drift warning** surfaces in the UI when the approved version's text snapshot != currentScript (player would hear one thing and read another).

**Admin Audio Review UI** at `/admin/audio-review`:
- Sidebar list of all audio entries with status pills (PENDING/APPROVED/REJECTED).
- Detail view: approved-audio player at top, **editable script textarea** (the canonical text), Save / Regenerate / Discard buttons.
- Per-version cards: Audition / Approve / Reject buttons + collapsible audit snapshot.
- Drift warning banner when audio + script disagree.

**Reader Demo** at `/dev/reader-demo`:
- Loads existing `currentScript` for an audioId on mount.
- Generate → audition (auto-plays + script displayed alongside for verbatim check) → Regenerate or Approve → Open Reader Panel.

**Architectural docs:**
- `public/audio/voice/README.md` — folder is the organizational mirror; canonical storage is Supabase Storage bucket `creator-audio`.
- Memory `project_voice_pipeline_architecture.md` — full pipeline reference.

### Other this session

- **Admin dashboard nav menu** (`f3f83fb`) — top pill bar with one chip per tool, status badges inline. Audio Review + Reader Demo cards added.
- **Planned sprint anchors** (`01d68f1`) — each "Planned sprint" item in the dashboard cards links to an anchor (`#cf-1`) in the canonical plan in `/library/plans`. Plan markdown got `<a id="cf-N">` markers before each Sprint heading.
- **Plan storage convention** documented as memory `feedback_plans_in_docs_plans.md` — approved plans land in `docs/plans/<meaningful-slug>.md` (not the auto-generated random Plan Mode filename).

### Open follow-ups

1. **CF-2 — Claude Opus 4.7 narrative prose generation.** Next sprint in the Creator Forge roadmap. Will pass `wizardAnswers.customText` (the AI-prefilled story-specific text per question) to Opus as prose seeds for Howard-voice room descriptions, atom prompts, choice labels. Plan in `docs/plans/creator-forge-and-quest-line-orchestrator.md` §CF-2. Each prose chunk gets an audioId so the Reader Panel auto-renders + Eve narrates.
2. **CF-1 follow-up — Tier 2/3/4 calibration.** Anchor A locked at 49.8%; B/C/E fail structurally because capability formula uses Tier-1 armor as DPR baseline. Real fix: make capability axis-aware. Or accept that the empirical simulator is the truth and the analytic formula is a fast-render approximation. Documented in `lib/difficulty/enemyTiers.ts` header.
3. **Voice — Custom Voices when xAI ships broadly.** The aspirational Barcelona-accent grimdark standing prompt for Eve (`EVE_STANDING_PROMPT` in `lib/voice/eve.ts`) is preserved for the day xAI's Custom Voices API graduates. Will attach persona to the voice itself, not per-call.
4. **CF-1.5 → game wiring.** Reader Panel + voice pipeline are scaffolded but not yet integrated into game-engine flows. CF-2 will tag prose chunks with `prose_mode: "chat" | "reader"`; the engine routes reader-mode prose to the panel. Currently only `/dev/reader-demo` exercises the panel.
5. **`first_launch_adventure` is now the critical-path Tier-0 blocker** (priority 108). Blocked by `module_system_ink_runtime`. With CF-1 wizard live, an admin can now author module skeletons — but the Ink runtime to play them is still pending. CF-6 ships Ink scaffolding + JSON compile + promote-CLI; runtime wiring is deferred until KARMA Sprint chain shipping was completed (now done, so runtime path is unblocked).

### Cost ledger (this session)

- xAI TTS calls during voice-pipeline iteration: small, probably under $0.50 total ($4.20 per 1M chars; few hundred chars × handful of test generations).
- No Grok image generation.
- Claude Opus calls: zero this session (all prose was authored by Claude-in-conversation; the Opus client + proxy route are scaffolded but not yet exercised by CF-2).

---

## Status of the previous session (2026-05-11 → 2026-05-12) [PRIOR SESSION LOG]

**Destination room art pipeline + scene template normalization + admin review tooling.** The 25 destination stubs went from "stubs only" to "scene-backdrop art + NPC sprites + review UI + regen workflow" end-to-end.

### What shipped

**Canonical scene template (`lib/sceneTemplate.ts`).** Single source of truth for every scene-backdrop prompt. Exports `STAGE_STYLE_ANCHOR` (photorealistic painterly Frazetta/Brom), `STAGE_FRAMING` (open foreground stage for sprite compositing), `STAGE_LIVING_WORLD` (working/active environments), `STAGE_NEGATIVE_PROMPT` (no text/spillage/figures), and `buildStageBackdropPrompt()`. Rule documented in `docs/scene-generation-rules.md` and feedback memory. **Every scene-gen script must import from this module — never re-declare style/framing constants locally.** Currently only `scripts/forge-destination-rooms-bg.ts` imports it; other forge scripts (bandit-trio, hero-combat, vivian-*) still fork their own constants and should be migrated.

**25 destination scene prompts rewritten** into a three-tier framework anchored to specific lore (`scripts/forge-destination-rooms-bg.ts`):
- **Tier 1 — Pure Prosperity (14):** Vibrant Empire waypoints. Cities (Vanara, Kamula, Talunia, Blaal), all 7 Nations, working Wilderness ports (Camoonian Desert, Zalgara Mts, Red Isles).
- **Tier 2 — Sacred Threshold (3):** Lake of Visions, Tathel Isle, Mu (the secretive geothermal-shore arrival point).
- **Tier 3 — Gateway to Dread (8):** Stagus (River Styx crossing), Skull of Silence, Accursed Gardens, Forbidden Lake, Lost Lands (Elder Races boundary), Jungles (Lizard ruins under canopy), World's End (timeless forest), Tiger Valley (predator-heavy hunters' trailhead on thriving Atlantis).

**Lore corrections (recurring time-frame errors fixed twice in one session).** Both saved as pinned MEMORY.md feedback entries so they stick across sessions:
- **Atlantis is THRIVING, not ruins** — Tiger Valley reframed as a fertile hunters' trailhead on the *living* Atlantean plateau, not cyclopean ruins. `feedback_atlantis_is_thriving.md`.
- **Mu is a secretive insular spiritual island-nation southwest of Lemuria** (NOT sunken, NOT a busy harbor). New canonical lore doc `lore/thurian-cartography/MU_SECRETS.md` with tiered reveals: Secret Level 1 (insularity), Level 2 (channel defenses), Level 3 (pegusii), Level 4 (portal to the gods). NPC renamed `scholar_sunken/` → `scholar_of_mu/` and rewritten as a Muvian Sage-priest. Travel-node lore + room stub updated. Map asset `public/art/living-eamon-map.png` deliberately does NOT mark Mu (designer reference at `lore/thurian-cartography/living-eamon-map-w-mu.png`). `feedback_mu_is_thriving.md`.

**Sprite-template framing strengthened** — `FRAMING_ALLY` + `FRAMING_LEFT` in `forge-destination-rooms-npcs.ts` got a CRITICAL FULL-BODY block: explicit head-to-toe checklist, "DO NOT crop at hem of robe — feet must extend below," 3-7% safety margin below feet, "image is INVALID if any body part extends past the edge." Addresses the Atlantean Elder cropping failure. `feedback_string_escape_codegen.md` is the unrelated string-escape lesson from the same session.

**Two batches of image generation.**
- Initial batch: 50 BG candidates (~$3.50) via `forge-destination-rooms-bg.ts`. Files `bg-v3/v4.jpg`.
- Regen batch: 33 of 34 attempts succeeded (1 rembg hiccup), $2.31. Via new `scripts/process-regen-queue.ts` which reads an exported queue JSON and runs Grok with each item's custom prompt verbatim. Files `bg-v5/v6.jpg` for 11 rooms + `v3/v4.png` for 6 NPCs.

**Admin dashboard at `/admin`** (`app/admin/page.tsx`). Lists every admin/dev tool (destination-review, room-map, sprite-review, sprite-touchup, forge-avatar) with status badge, pending-tasks list, and features-to-code list. Pulls live destination review counts from `localStorage`.

**Destination-review UI overhauled** (`app/admin/destination-review/page.tsx`):
- Approve/Reject buttons start bright; selected one gets glowing ring + past-tense label ("✓ Approved" / "✗ Rejected").
- Regenerate flow: typing a custom prompt + Submit sets `bgStatus`/`npcStatus` = `regen_requested`, persists the custom prompt as `bgRegenPrompt`/`npcRegenPrompt`, pill turns purple "REJECTED · SUBMITTED FOR REGENERATION".
- Top toolbar: status-count pills (All/Pending/Approved/Rejected/Regen Queue), each clickable to filter the carousel.
- "⬇ Export Regen Queue" button downloads a JSON of all `regen_requested` items with their custom prompts.
- Filter-aware Previous/Next stepping.
- All decisions persist to localStorage.

**`destinations.ts` now auto-detects latest image versions.** `/tmp/generate-destinations.js` scans each room's directory for the highest `bg-vN.jpg` / `vN.png` and writes those paths. So regen-targeted rooms point at v5/v6 BG and v3/v4 NPC; untouched rooms stay on their originals. Originals (`v1`/`v2`/etc.) are NEVER deleted — script appends, never overwrites.

### Open follow-ups

1. **Re-review the 14 regen-targeted destinations.** Open `/admin/destination-review` → click "Regen Queue" filter → step through. Each item now shows the new image but the status pill still says "REJECTED · SUBMITTED FOR REGENERATION" from the previous click. Approve/Reject to clear.
2. **`archaeologist_lost` NPC was skipped** during regen because the user marked it `regen_requested` without typing a custom prompt. Either retype a prompt + re-submit, or approve the existing one.
3. **Migrate other sprite forge scripts** (`forge-bandit-trio.ts`, `forge-hero-combat.ts`, `forge-henchman-caster.ts`, `forge-vivian-*.ts`) to import from a shared sprite-template module (mirror of `lib/sceneTemplate.ts` pattern). Currently each forks its own STYLE_ANCHOR/FRAMING_ALLY/FRAMING_LEFT — same drift problem we solved for scenes.
4. **Mu travel-node gating.** `geo_mu` should not appear in the player travel-screen until plot-unlocked. Requires a `hidden`/`discoverable` flag on the travel-node registry and UI honoring it. See `lore/thurian-cartography/MU_SECRETS.md` "Future work flagged."
5. **Wire regen submission server-side.** Currently the user must click Export → hand the JSON to Claude. An API endpoint that triggers `process-regen-queue.ts` server-side would close the loop.
6. **"Needs Re-Review" auto-detection.** When `destinations.ts` bgPath changes (new image landed), reset the matching localStorage status from `regen_requested` → `pending` so the user sees a fresh-state pill on the regenerated item.
7. **Pre-existing**: 4 `c2-npc-kit.test.ts` fixture-drift failures; vitest types missing from `lib/gameState.test.ts` etc. Both unrelated to this session.

### Cost ledger (this session)

- Initial destination art batch: ~$3.50 (50 BG candidates)
- Regen batch: $2.31 (33 of 34 candidates)
- Tiger Valley + Mu prompt corrections: $0 (no images regenerated — corrected in source; will pick up on next regen pass when user marks them)
- Total: ~$5.81

---

## Status of the previous session (2026-05-10)

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
