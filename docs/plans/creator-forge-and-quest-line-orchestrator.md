---
plan_id: creator-forge-and-quest-line-orchestrator
title: Creator Forge + Quest Line Orchestrator
sprints:
  - id: cf-0
    name: "Foundation — routes, Opus client, Supabase storage, /creator-forge shell"
    status: shipped
    shipped_at: 2026-05-12
    commit: f855060
    tool: /creator-forge
  - id: cf-1
    name: "Multiple-choice template engine + module skeleton wizard"
    status: shipped
    shipped_at: 2026-05-13
    commit: 7a818eb
    tool: /creator-forge
  - id: cf-1.5
    name: "Reader Panel + Eve voice pre-roll + effect-tag tooling"
    status: shipped
    shipped_at: 2026-05-13
    commit: b1af5ca
    tool: /admin/audio-review
  - id: cf-2
    name: "Claude Opus 4.7 narrative prose generation (Howard grimdark)"
    status: planned
    tool: /creator-forge
  - id: cf-3
    name: "Eamon-style SVG map generator (1980s graph-paper aesthetic)"
    status: planned
    tool: /creator-forge
  - id: cf-4
    name: "NPC + henchman authoring with difficulty-clamped stats"
    status: planned
    tool: /creator-forge
  - id: cf-5
    name: "Room art + NPC sprite workflow (Grok-Imagine-Pro only)"
    status: planned
    tool: /creator-forge
  - id: cf-6
    name: "Ink scaffolding + JSON compile + promote-module CLI"
    status: planned
    tool: /creator-forge
  - id: cf-7
    name: "Quest Line Orchestrator — narrative spine, interludes, meta-reward editor"
    status: planned
    tool: /admin/quest-lines
  - id: cf-8
    name: "Validation + GPE balance scorecard + publish gate"
    status: planned
    tool: /creator-forge
---

# Creator Forge + Quest Line Orchestrator — multi-sprint roadmap

## Context

Living Eamon currently has 25 destination stubs + a guild hall and no first-class authoring surface. Modules are hand-written TypeScript objects ([lib/adventures/destination-stubs.ts](lib/adventures/destination-stubs.ts), [lib/adventures/guild-hall.ts](lib/adventures/guild-hall.ts)) registered via [lib/adventures/registry.ts](lib/adventures/registry.ts). Atoms, quests, NPCs, and difficulty all have well-formed types ([lib/karma/atom-types.ts](lib/karma/atom-types.ts), [lib/quests/types.ts](lib/quests/types.ts), [lib/roomTypes.ts](lib/roomTypes.ts), [lib/gameData.ts](lib/gameData.ts)) but no authoring UI. [MODULE_SYSTEM.md](MODULE_SYSTEM.md) specifies an Ink runtime + GPE balance analyzer, but it is draft and gated behind `karma_sprint_chain`.

The 18-module roadmap ([ADVENTURE_MODULES_PLAN.md](ADVENTURE_MODULES_PLAN.md)) is the downstream demand. The launch needs all 3 Mirrors-of-Tuzun-Thune sagas plus 15 more modules; manually authoring each in TypeScript is unworkable. Both Scotch (alpha) and future external Creators need:

1. A **Creator toolset** — author one Module end-to-end: rooms, atoms, NPCs, henchmen, scene art, narrative prose, Eamon-style map.
2. An **Admin toolset** — orchestrate Quest Lines (full narrative spines that wrap multiple Modules with interludes, persistent flags, meta-rewards).

Resolved during planning:
- **Quest Line model:** Full narrative spine — Admin tool authors prose + map + interludes between Modules.
- **Module format on disk:** Ink (`.ink`) per [MODULE_SYSTEM.md](MODULE_SYSTEM.md). Runtime hookup deferred until `karma_sprint_chain` ships; Creator tool ships authoring + JSON pre-compile + stub preview now.
- **Map aesthetic:** SVG hand-drawn 1980s graph-paper style — Claude Opus 4.7 emits initial SVG; Creator drags/edits in-browser; Rough.js jitter; sepia palette.
- **Access gating:** Creator Forge at `/creator-forge/*` gated to `role IN ('creator','admin')`. Quest Line Orchestrator at `/admin/quest-lines/*` gated to `role='admin'` (stitching modules is admin work). Roles already defined per [supabase/migrations/20260509000000_w1_player_role.sql](supabase/migrations/20260509000000_w1_player_role.sql).
- **AI assignments (HARD RULE):** Claude Opus 4.7 for ALL text generation (narrative prose, SVG maps, Ink scaffolding, template prose). Grok-Imagine-Pro ONLY for raster images (scene backdrops, NPC sprites). No Grok text calls in Creator/Admin surfaces.
- **Plan persistence:** This plan (and future ones) lives in [docs/plans/](docs/plans/) and is surfaced in the `/library` wiki. CF-0 wires the storage pattern.

---

## Architecture

```
+------------------------+        +-------------------------+
| /admin/quest-lines/*   |        | /creator-forge/*  |
|  (Admin: spine + UI)   |  uses  |  (Creator: per-module)  |
+-----------+------------+        +------------+------------+
            |                                  |
            |  emit .ink + JSON                | emit .ink + JSON
            v                                  v
       modules/<questline-id>/        modules/<module-id>/
       ├── quest-line.ink             ├── main.ink
       ├── module.json (manifest)     ├── module.json (manifest)
       ├── map.svg                    ├── map.svg
       └── interludes/                ├── rooms/<id>.md
                                      ├── npcs/<id>.json
                                      └── art/ -> public/art/<scope>
                                                  (referenced by path)

      +------------------- shared services --------------------+
      | lib/anthropic/opus.ts   — Claude Opus 4.7 client       |
      | lib/narrativePrompt.ts  — Howard-voice system prompt   |
      | lib/creator/template.ts — multiple-choice algorithm    |
      | lib/creator/inkEmit.ts  — Ink scaffolder + compiler    |
      | lib/creator/mapSvg.ts   — SVG hand-drawn map utilities |
      | app/api/creator/*       — persistence + LLM proxy      |
      | app/api/forge-image/*   — Grok-Imagine-Pro proxy       |
      +--------------------------------------------------------+
```

Reuses:
- Schema: [lib/roomTypes.ts](lib/roomTypes.ts), [lib/karma/atom-types.ts](lib/karma/atom-types.ts), [lib/quests/types.ts](lib/quests/types.ts), [lib/karma/types.ts](lib/karma/types.ts)
- Image pipeline: [lib/sceneTemplate.ts](lib/sceneTemplate.ts) (`buildStageBackdropPrompt`), [scripts/process-regen-queue.ts](scripts/process-regen-queue.ts), [lib/imageProcessing.ts](lib/imageProcessing.ts)
- Approval UX pattern: [app/admin/destination-review/page.tsx](app/admin/destination-review/page.tsx) (carousel + status pills + regen prompt)
- Room graph: [scripts/build-room-graph.ts](scripts/build-room-graph.ts) (currently Mermaid — repurpose its registry walk for SVG)
- Anthropic client pattern: [lib/anthropic/client.ts](lib/anthropic/client.ts) (extend with Opus 4.7 variant)
- Identity-block deterministic template: [lib/identityBlock.ts](lib/identityBlock.ts) (pattern reference)
- Standing prompt rules: [lib/art/promptRules.ts](lib/art/promptRules.ts) (locked vs editable)

---

## Sprint roadmap (8 sprints, sequenced)

<a id="cf-0"></a>

### Sprint CF-0 — Foundation (1–2 days)

**Goal:** Routes + persistence + shared services ready for the rest of the toolset to plug into. Nothing user-visible besides empty shells. Plan-storage pattern wired.

- `app/creator-forge/page.tsx` — module list (empty state)
- `app/admin/quest-lines/page.tsx` — quest-line list (empty state)
- `app/admin/page.tsx` — add cards for both ([app/admin/page.tsx](app/admin/page.tsx))
- `lib/anthropic/opus.ts` — `callOpus({ system, messages, maxTokens })` using `claude-opus-4-7[1m]` model. Mirror [lib/anthropic/client.ts](lib/anthropic/client.ts) shape; no streaming for v1.
- `app/api/creator/[...path]/route.ts` — REST: GET/POST/PATCH/DELETE for `modules/<id>/{manifest|room|npc|atom|quest|map|interlude}`. Persistence: filesystem under `modules/<id>/` (gitignored draft folder; promoted to `lib/adventures/` on publish).
- `app/api/creator/llm/route.ts` — server-side Claude Opus 4.7 proxy (admin-role gated; never expose ANTHROPIC_API_KEY to browser).
- `lib/creator/storage.ts` — read/write JSON manifest + Ink files under `modules/<id>/`.
- Auth: extend [proxy.ts](proxy.ts) — gate `/creator-forge/*` and `/admin/quest-lines/*` to `role='admin'`.
- **Plan-storage pattern:** copy this plan to `docs/plans/creator-forge-and-quest-line-orchestrator.md`, add a row to [DOC_MAP.md](DOC_MAP.md) (`role: dev-process`, `visibility: internal`), and add a `/library/plans` index page so future plans land here automatically. Future plan files in `~/.claude/plans/` are working drafts; canonical home is `docs/plans/`.

**Verification:** Visit both new admin pages while logged in as admin; both render empty state. Hitting them as `player` redirects to `/splash`. `curl localhost:3000/api/creator/llm` returns 401 unauthenticated. `/library/plans` shows the index with this plan listed.

---

<a id="cf-1"></a>

### Sprint CF-1 — Multiple-choice template engine (2–3 days)

**Goal:** Creator fills a multi-step questionnaire that yields a Module skeleton: room IDs, atom slots, NPC slots, difficulty range, AffectVector + PICSSI targets. Skeleton only — no prose yet.

- `lib/creator/template.ts` — pure functions:
  - `Question` type (id, prompt, weight, axis: `AffectAxis | PicssiVirtue | "difficulty"`, options[]).
  - `QUESTIONNAIRE: Question[]` — ~20 questions covering: setting biome, conflict shape, faction count, friendly/enemy NPC mix, henchman slots, scroll/fragment seeding, PD anchor (which Howard story inspires), difficulty tier.
  - `generateSkeleton(answers: Answer[]): ModuleSkeleton` — deterministic algorithm. Maps option weights → AffectVector + PICSSI targets, picks room count (`floor(2 + difficulty × 4)`), allocates atom slots per room weighted by chosen axes, names rooms with placeholder IDs.
- `ModuleSkeleton` shape: `{ moduleId, name, difficulty, locationId, travelZones[], affectTargets: AffectVector, picssiTargets: Partial<Record<PicssiVirtue, number>>, rooms: { id, picssiContacts[], atomSlots: number, npcSlots: { friendly: number, hostile: number }, henchmanSlots: number }[], questOutline: { steps: number, branches: number } }`.
- `app/creator-forge/new/page.tsx` — wizard UI mirroring [app/forge-avatar/WizardClient.tsx](app/forge-avatar/WizardClient.tsx) pattern (3-step pattern: questionnaire → preview → confirm).
- `app/creator-forge/[moduleId]/page.tsx` — module editor shell with tabs: Overview / Rooms / Atoms / NPCs / Map / Narrative / Quest / Art / Preview.

**Verification:** Run the wizard end-to-end; resulting `modules/<id>/module.json` matches expected skeleton (3 rooms for novice, 7 rooms for moderate, 11 for deadly). Re-running with same answers yields identical skeleton (determinism).

---

<a id="cf-2"></a>

### Sprint CF-2 — Claude Opus 4.7 narrative prose generation (2–3 days)

**Goal:** Every room description, atom prompt, choice label, and resolutionHint can be generated by Claude Opus 4.7 in Howard grimdark voice. Creator edits inline.

- `lib/narrativePrompt.ts` — exports:
  - `HOWARD_VOICE_SYSTEM_PROMPT` — anchors Howard grimdark voice: kinetic verbs, sensory detail, PD-trademark-safe vocabulary (cross-ref [Public_Domain_Rules.md](Public_Domain_Rules.md) Always-Safe Corpus), no flowery filler, European-coded palettes only (cross-ref `feedback_howard_skin_palette.md`).
  - `buildRoomPromptUserMessage(skeleton, roomSpec)`, `buildAtomPromptUserMessage(...)`, `buildChoicePromptUserMessage(...)`.
  - Negative-list block (terms to NEVER use: "Hyborian", "Cimmerian", "Conan", "Tarantia", etc. — cross-ref MEMORY).
- `app/api/creator/[moduleId]/generate/route.ts` — POST { target: "room"|"atom"|"choice", id, contextOverrides } → Claude Opus 4.7 → returns prose. Server-side only.
- `app/creator-forge/[moduleId]/narrative/page.tsx` — per-room/per-atom inline editor: AI button generates prose, human edits in textarea, save persists. Show token-cost estimate per call.
- `app/creator-forge/[moduleId]/components/RegenButton.tsx` — three-state: idle / generating / generated. Holds previous version for undo.

**Verification:** Generate prose for a sample room; verify it reads as Howard grimdark; verify negative-list terms never appear (lint script `scripts/validate-pd-safety.ts` greps the output). Edit and save; reload; persists.

---

<a id="cf-3"></a>

### Sprint CF-3 — Eamon-style SVG map generator (2–3 days)

**Goal:** Claude Opus 4.7 emits an SVG map of the module in hand-drawn 1980s graph-paper aesthetic; Creator edits in browser.

- `lib/creator/mapSvg.ts`:
  - `buildMapPromptUserMessage(skeleton)` — instructs Claude to emit ONLY valid SVG with: numbered room rects, cardinal-direction connectors, compass rose, sepia palette (#faf3f0 paper, #5a4a42 ink, #d4a574 sepia), Rough.js-style hand-drawn stroke jitter (filter or path roughness), <100KB total. System prompt forbids `<script>`, `<image>`, external refs.
  - `validateSvg(raw): SafeSvg | Error` — strict allowlist parser (tags: svg, g, rect, line, path, text, circle, defs, filter). Reject anything else.
  - `applyRoughStyle(svg): svg` — server-side post-process to add Rough.js-equivalent perturbation if Claude underdelivers on hand-drawn feel.
- `app/creator-forge/[moduleId]/map/page.tsx` — editor:
  - Left: SVG canvas. Room rects draggable via SVG transform mutation.
  - Right: room list, rename, add/delete connector.
  - Toolbar: Generate (AI), Regenerate, Add Room, Add Connector, Export SVG.
  - "Open in Excalidraw" link (optional v2): export → Excalidraw JSON → user edits externally → re-import.
- Persistence: `modules/<id>/map.svg` + `modules/<id>/map.json` (room positions, connector list — derived view for fast UI).

**Verification:** Generate a map for a 5-room module; SVG validates; drag a room rect, save, reload; position persists. Open `/creator-forge/<id>/map` — aesthetic reads as graph-paper, not flowchart.

---

<a id="cf-4"></a>

### Sprint CF-4 — NPC + henchman authoring (2 days)

**Goal:** Creator can add/edit/delete NPCs in any room, set stats within difficulty-range bounds, mark friendly vs enemy, and roster henchmen.

- `lib/creator/npc.ts`:
  - `defaultStatsForDifficulty(difficulty): { hp: [min,max], armor: [min,max], damage: ["1d4","2d8"] }` — bounds table.
  - `clampNpcStats(npc, difficulty)` — enforce bounds.
- `app/creator-forge/[moduleId]/npcs/page.tsx` — table editor: id, name, friendly/enemy toggle, HP slider, armor slider, damage dice picker, sprite thumbnail (from CF-5), "Generate description via Opus" button, room assignment dropdown.
- `app/creator-forge/[moduleId]/henchmen/page.tsx` — roster: which NPCs in this module are recruitable; per-henchman loyalty hooks (which atoms shift their loyalty).
- Schema additions to `module.json`: `npcs: { id, name, isHostile, stats, spritePrompt, descPrompt, roomId, henchmanRecruitable }[]`.

**Verification:** Create an NPC with HP=200 in a novice module; UI clamps to ~30 max. Toggle hostile; sprite-prompt regen suggests UGLY_MEAN_OVERLAY (per `feedback_bandits_uglier_meaner.md`). Friendly NPC strips the overlay.

---

<a id="cf-5"></a>

### Sprint CF-5 — Room art + NPC sprite workflow (2 days)

**Goal:** Per-room and per-NPC: request art, approve/reject, request regens. Grok-Imagine-Pro is the only generator. Strict reuse of [lib/sceneTemplate.ts](lib/sceneTemplate.ts) for scenes; per-NPC framing block for sprites.

- `app/api/creator/[moduleId]/forge-image/route.ts` — POST { kind: "scene"|"npc", targetId, prompt } → enqueues a Grok call; on completion writes to `public/art/scenes/<moduleId>/<roomId>/bg-vN.jpg` or `public/art/npcs/<moduleId>/<npcId>/master/vN.png`. Logs to `_prompt.txt`. Reuses [lib/imageProcessing.ts](lib/imageProcessing.ts) (grokImageToJpeg / grokImageToTransparentPng + rembg).
- `app/creator-forge/[moduleId]/art/page.tsx` — review carousel adapted from [app/admin/destination-review/page.tsx](app/admin/destination-review/page.tsx). Per-asset: approve / reject / regen-with-custom-prompt. Server-side persistence (replaces destination-review's localStorage; this is the unified pattern going forward).
- `module.json` extensions: `rooms[].bgPath`, `npcs[].spritePath`, `rooms[].artStatus`, `npcs[].artStatus` (pending|approved|rejected|regen_requested|generated).
- Cost guard: per-module spend tracker; warn at $5, hard-stop at $20 unless override flag.

**Verification:** Generate a scene for a room; appears in carousel; click reject → request regen with new prompt → second candidate appears; approve → status pill flips green; `module.json` records `bgPath` pointing at `bg-v2.jpg`.

---

<a id="cf-6"></a>

### Sprint CF-6 — Ink scaffolding + JSON compile (2 days)

**Goal:** When Creator hits "Save Module", the toolset emits a valid `.ink` file plus pre-compiled JSON, ready for the runtime (which lands when KARMA Sprint chain ships).

- `lib/creator/inkEmit.ts`:
  - `emitModuleInk(module: ModuleManifest): string` — generate Ink syntax from manifest: rooms as knots, atoms as stitches, choices as `* [...]` lines, EXTERNAL calls (`apply_karma`, `adjust_affection`, `set_flag`, `start_combat`) per [MODULE_SYSTEM.md](MODULE_SYSTEM.md) §4.2. Inject `# atom:`, `# tier:`, `# delta:`, `# touches:` tags from atom metadata.
  - `compileToJson(inkSource): Promise<object>` — wraps `inkjs/full` compiler.
- `scripts/creator/promote-module.ts` — CLI: `npm run creator:promote -- <moduleId>` — copies `modules/<id>/main.ink` + `module.json` into the live tree (`public/modules/<id>.ink` + `public/modules/<id>.json`), adds an entry stub to [lib/adventures/registry.ts](lib/adventures/registry.ts).
- Stub preview adapter `lib/creator/preview/stubAdapter.ts` — minimal Ink-walker that lets the Creator click through atoms in-tool without the full runtime; just renders prose + simulates karma deltas in-memory for review.

**Verification:** Save a module; `modules/<id>/main.ink` validates against [MODULE_SYSTEM.md](MODULE_SYSTEM.md) §4.2 contract; `inkjs/full` compiles it without warnings; `# delta:` tags match actual `apply_karma()` calls.

---

<a id="cf-7"></a>

### Sprint CF-7 — Quest Line Orchestrator (Admin tool) (3 days)

**Goal:** Admin authors a Quest Line as a full narrative spine that wraps multiple Modules. Same prose + map tools, but at quest-line scope. Interludes between Modules are first-class authored atoms.

- `lib/creator/questLine.ts`:
  - `QuestLineManifest` shape: `{ id, name, blurb, scope: "life"|"legacy", moduleIds: string[], interludes: InterludeAtom[], persistentFlags: string[], metaReward: QuestReward, openingProse, closingProse }`.
  - `InterludeAtom` = a stripped-down Atom rendered between Modules (single choice, AffectVector + PICSSI delta, prose anchor).
- `app/admin/quest-lines/page.tsx` — list view.
- `app/admin/quest-lines/new/page.tsx` — wizard: name + blurb + module-picker (multi-select from existing modules in `modules/`).
- `app/admin/quest-lines/[questId]/page.tsx` — editor with tabs:
  - **Spine:** drag-reorder modules, insert interlude atoms between any two modules.
  - **Narrative:** opening prose + closing prose (Opus-generated; Creator edits).
  - **Map:** zoomed-out Eamon-style — modules as numbered nodes, interlude atoms as small annotations on connectors.
  - **Flags:** persistent flags (this Quest Line sets `arc_NN_resolved` etc.) — drag-link flags to module-completion triggers.
  - **Reward:** the meta-reward when the whole arc completes (PICSSI delta, items, legacy chronicle, optional Word ×2-Mithras boost).
- `app/api/admin/quest-lines/[id]/route.ts` — REST persistence.
- Emit format on save: `modules/<questline-id>/quest-line.ink` + `modules/<questline-id>/manifest.json`.

**Verification:** Author a 3-module Quest Line with 2 interludes; emitted Ink walks Module-1 → interlude-A → Module-2 → interlude-B → Module-3 → metaReward; opening + closing prose render in stub preview.

---

<a id="cf-8"></a>

### Sprint CF-8 — Validation + balance preview + publish (2 days)

**Goal:** Before a Creator can promote a Module/Quest-Line to the live game, the toolset proves it's well-formed and balanced.

- `lib/creator/validate.ts`:
  - `validateModule(manifest): ValidationIssue[]` — schema: every room exit resolves; every NPC id referenced exists; every choice's PICSSI deltas sum within `[-30, +30]` per virtue; every atom has at least 2 choices; PD-safety pass (no trademark terms); image paths exist; difficulty/stat bounds respected.
  - `validateQuestLine(manifest): ValidationIssue[]` — every module referenced exists + validates; persistent flags don't collide with reserved names; interlude atoms PD-safe.
- `lib/creator/gpe.ts` — minimal GPE port from MODULE_SYSTEM.md §7: walk all atom choices, compute per-virtue reachable growth, flag any virtue >2× the median of others (the "GPE imbalance" signal). Display per-virtue scorecard.
- `app/creator-forge/[moduleId]/validate/page.tsx` — issues list with severity (error/warn/info); GPE scorecard chart.
- `scripts/creator/promote-module.ts` — refuse promote if any `error`-severity issues remain.

**Verification:** Intentionally create a module with a dangling exit + an unbalanced atom; validation flags both; fix; promote succeeds; the module appears in `npm run dev` as a real adventure (stub runtime; full runtime arrives with KARMA Sprint chain).

---

## Critical files to be created or modified

**Created:**
- `lib/anthropic/opus.ts` — Claude Opus 4.7 client (text-only)
- `lib/narrativePrompt.ts` — Howard-voice system prompt + PD negative list
- `lib/creator/{template,storage,inkEmit,mapSvg,npc,questLine,validate,gpe}.ts`
- `lib/creator/preview/stubAdapter.ts`
- `app/creator-forge/page.tsx` + `/new` + `/[moduleId]/{overview,rooms,atoms,npcs,henchmen,map,narrative,art,validate}/page.tsx`
- `app/admin/quest-lines/page.tsx` + `/new` + `/[questId]/page.tsx`
- `app/api/creator/llm/route.ts`
- `app/api/creator/[...path]/route.ts`
- `app/api/creator/[moduleId]/forge-image/route.ts`
- `app/api/creator/[moduleId]/generate/route.ts`
- `app/api/admin/quest-lines/[id]/route.ts`
- `scripts/creator/promote-module.ts`
- `scripts/validate-pd-safety.ts`
- `docs/plans/creator-forge-and-quest-line-orchestrator.md` (this file, copied into the repo + indexed in `/library/plans`)
- `app/library/plans/page.tsx` — index of all plans in `docs/plans/`

**Modified:**
- [proxy.ts](proxy.ts) — gate `/creator-forge/*` and `/admin/quest-lines/*` to `role='admin'`
- [app/admin/page.tsx](app/admin/page.tsx) — add Creator Forge + Quest Lines cards
- [lib/adventures/registry.ts](lib/adventures/registry.ts) — extend to load promoted modules (stub for now; runtime hookup with KARMA Sprint chain)
- [DOC_MAP.md](DOC_MAP.md) — add rows for new design-canon doc (`CREATOR_FORGE.md` to be authored as part of CF-0), this plan (under `docs/plans/`), and any session-log entries
- `.gitignore` — add `modules/*/draft/` for unpublished work-in-progress
- `package.json` — `creator:promote` script

**Reused (do not modify, just import):**
- [lib/roomTypes.ts](lib/roomTypes.ts) (Room, AdventureModule, SceneTone)
- [lib/karma/atom-types.ts](lib/karma/atom-types.ts) (Encounter, Choice, AffectVector, Virtue)
- [lib/karma/types.ts](lib/karma/types.ts) (PicssiVirtue, KarmaDelta)
- [lib/karma/recompute.ts](lib/karma/recompute.ts) (scaleDeltaForRoom — for preview)
- [lib/quests/types.ts](lib/quests/types.ts) (Quest, QuestStep, QuestReward)
- [lib/sceneTemplate.ts](lib/sceneTemplate.ts) (buildStageBackdropPrompt — single source of truth for scene prompts)
- [lib/imageProcessing.ts](lib/imageProcessing.ts) (Grok output → JPEG / transparent PNG)
- [scripts/process-regen-queue.ts](scripts/process-regen-queue.ts) (regen-queue processor pattern)
- [lib/identityBlock.ts](lib/identityBlock.ts) (deterministic-template pattern reference)
- [lib/art/promptRules.ts](lib/art/promptRules.ts) (locked vs editable rules — apply to NPC sprite prompts)
- [app/admin/destination-review/page.tsx](app/admin/destination-review/page.tsx) (approval-carousel pattern reference)

---

## Hard rules (load-bearing)

1. **Claude Opus 4.7 (`claude-opus-4-7[1m]`) is the only model for text generation in the Creator/Admin surfaces.** Grok is forbidden for prose, SVG, Ink scaffolding, multiple-choice template prose, anywhere text appears in this toolset. Grok-Imagine-Pro is ONLY for raster image generation (scene backdrops via [lib/sceneTemplate.ts](lib/sceneTemplate.ts), NPC sprites).
2. **All LLM calls are server-side** (`app/api/creator/llm/...`). Never expose `ANTHROPIC_API_KEY` to the browser.
3. **Roles split by surface.** Creator Forge lives at `/creator-forge/*` and is gated to `role IN ('creator','admin')`. Quest Line Orchestrator lives at `/admin/quest-lines/*` and stays admin-only — stitching modules into Quest Lines is admin work. The general `/admin/*` namespace stays admin-only as before.
4. **PD-safety lint runs on every Opus output.** `scripts/validate-pd-safety.ts` is called server-side before returning prose to the client. Trademark-radioactive terms (Hyborian, Cimmerian, Conan, Tarantia, Thoth-Amon, Bêlit, etc. — full list in [Public_Domain_Rules.md](Public_Domain_Rules.md)) block the response.
5. **Module output format is Ink.** Even though the runtime is gated behind `karma_sprint_chain`, the authoring tool emits Ink + JSON now, so when the runtime lands, every Creator-authored module is ready to plug in.
6. **No image regenerations without explicit user click.** Per `feedback_image_workflow.md`. Auto-regen on hot-reload is forbidden.
7. **Scene prompts MUST flow through `buildStageBackdropPrompt`.** Per `feedback_scene_template_canonical.md`. No local style anchors.
8. **NPC stats clamped to difficulty range.** Creator can override only via explicit "override bounds" toggle (logged).
9. **`modules/<id>/draft/` is gitignored.** Only promoted modules land in `lib/adventures/` and `public/modules/`.
10. **Cost guard active.** Per-module Grok spend tracker; warn $5, hard-stop $20 unless `--force` flag.
11. **Plans live in `docs/plans/` + are indexed in `/library/plans`.** Working drafts may live in `~/.claude/plans/` but the canonical home is the repo, surfaced in the wiki.

---

## Open risks / decisions deferred

- **Ink runtime is not yet shipped.** Creator emits valid Ink, but the live game still loads TypeScript modules. Stub preview (`lib/creator/preview/stubAdapter.ts`) lets Creators walk atoms in-tool. Full playtest waits on `karma_sprint_chain`.
- **Cost of Opus 4.7 per module.** Rough estimate: 30 rooms × ~800 tokens prose × $0.015/1K = ~$0.36/module for room prose; SVG generation ~$0.05; total ballpark $0.50–$2/module. Cheap relative to image costs.
- **External Creator workflow.** v1 is admin-only. Multi-tenant authoring (collision detection on module IDs, per-Creator drafts, review queue from creator → admin) is a v2 design conversation.
- **Excalidraw integration** in CF-3 is optional — ships only if SVG drag-edit alone proves insufficient.

---

## Verification (end-to-end)

After all 8 sprints land, the success criterion is:

> **Scotch can sit down, walk through `/creator-forge/new`, answer the 20-question wizard for "Mirrors of Tuzun Thune" (M-1 from [ADVENTURE_MODULES_PLAN.md](ADVENTURE_MODULES_PLAN.md)), let Opus 4.7 generate all prose + the Eamon-style SVG map, request and approve scene art + NPC sprites for all rooms, edit NPC stats, validate clean, and promote to a `.ink` file that compiles and previews in the stub adapter — all without writing a single line of TypeScript.**

Test plan after each sprint:
- CF-0: routes render; auth gates work; LLM proxy is admin-gated; this plan visible at `/library/plans`.
- CF-1: wizard yields deterministic skeleton; novice/moderate/deadly produce 3/7/11 rooms.
- CF-2: prose passes PD lint + reads as Howard grimdark; edit + save persists.
- CF-3: SVG validates; drag-edit persists; aesthetic reads graph-paper not flowchart.
- CF-4: NPC bounds enforced; UGLY_MEAN_OVERLAY applied to hostiles only.
- CF-5: art carousel approve/reject/regen mirrors destination-review UX; status persists server-side.
- CF-6: `npm run creator:promote -- <id>` lands the Ink file; `inkjs/full` compiles clean.
- CF-7: Quest Line with 3 modules + 2 interludes walks in stub preview; opening/closing prose render.
- CF-8: dangling exit + unbalanced atom both flagged; fix → promote succeeds; module appears in registry.

Final integration after CF-8: `npm run docs:validate` clean; `npx tsc --noEmit` clean; new admin pages link from [app/admin/page.tsx](app/admin/page.tsx).
