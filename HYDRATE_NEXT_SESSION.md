# Hydration prompt — next Living Eamon session

## Status of the previous session (2026-05-08)

The session shipped the **Sprite Normalization + Z-Layer Foundation** sprint (commit `8fd73d9`) and produced a new arena plan at `~/.claude/plans/i-don-t-think-that-immutable-pancake.md` for the next sprint.

### Shipped this session

**Sprite Normalization + Z-Layer Foundation** (10 stages, all complete, committed):
- 5-class size registry (`lib/art/sizeClasses.ts`): A=Small Animals, B=Small Humanoid, C=Normal Humanoid (baseline 460px), D=Large Humanoid, E=Extra Large Monster. Smaller class = higher Z; gore Z = sprite Z + 1.
- Sprite metadata registry at `public/art/_sprite-metadata.json` keyed by sprite path. Stores `sizeClass`, `eyeYPx`, `flip`, `approval`, `originalPrompt`, `goreZones`, `isCorpse`. APIs at `app/api/sprite-metadata`, `app/api/sprite-list`, `app/api/sprite-regen`, `app/api/prompt-rules`.
- Standing prompt rules at `prompt-rules/standing.json` with 8 seeded locked rules (grok-imagine-image-pro-only, white-bg+rembg pipeline, dark blade tone, chainmail+gambeson, armor layering, Howard skin palette, facing direction, corpse pose).
- **Sprite Review Tool** (permanent Creator UI) at `/dev/sprite-review`: three-pane layout (filterable list / canvas with three modes [eye-Y pin / erase BG / gore placement] / controls). Approval states: unreviewed (gray), approved (green), rejected+regen (dark red ↻), rejected no-regen (bright red ✗). Absorbed the old `/dev/sprite-touchup` flood-fill eraser. Edit standing rules inline (locked rules read-only).
- `figureScaleByEye()` in `lib/combat/useFigureHeight.ts` — eye-anchored scaling. Throws if `eyeYPx` undefined (production quality gate). Fixes the Gaius-greatsword shrink bug (overhead weapon no longer drives scale).
- Per-Z-layer lane layout at `lib/combat/laneLayout.ts`. Three fixed spaces per side at locked offsets `[0.1975, 0.5, 0.8025]` (memory `feedback_lane_spacing.md`; do not drift). Front rank (position 1) sits closest to the centerline; back rank (position 3) sits at the outer edge of the lane.
- `CombatArena.tsx` Stages G+H: single shared stacking context (`isolation: isolate`), per-class `zIndex`, three-space layout, `maxWidth: "none"` override on sprites to defeat Tailwind v4 preflight's `img { max-width: 100%; }` (the silent vertical-stretch bug we hit at end of session).
- `BloodOverlay.tsx` extended with `sizeClass` (drives gore Z) and `goreZones` (snaps splatters to human-placed anchors).
- 16 forged corpse PNGs (~$1.12 art spend) — but **corpses are now SKIPPED**, see decisions below.
- `forge-corpses.ts` script + bandit `UGLY_MEAN_OVERLAY` (broken nose, snaggle-teeth, scowl, scars; memory `feedback_bandits_uglier_meaner.md`).
- 22/22 unit tests across `__tests__/art/{size-classes, figure-scale-by-eye, lane-layout}.test.ts` — all green.

### Decisions locked late this session

1. **Corpses SKIPPED.** Grok cannot forge them correctly to spec (Scotch wants curled side-view from player POV with no ground/no shadow/no weapon; Grok keeps producing two-figure / top-down / weapon-attached output). The 16 forged PNGs stay in repo as historical art but **nothing in the next sprint reads them**. Death is reworked: dead combatant fades+shrinks out, surviving teammates promote forward to fill the gap.
2. **Lane spacing FROZEN** at `SPACE_OFFSETS = [0.1975, 0.5, 0.8025]` per `feedback_lane_spacing.md`. Don't drift back toward the original 0.25/0.75.
3. **Width never constrained** on combat sprites. The `<img>` only has `height` set + `maxWidth: "none"`. Width derives from natural aspect ratio. Per Scotch: "There should be no width setting or constraint only a height setting."
4. **No live game — pre-launch, players are aspirational.** New memory `project_no_live_game.md`. Don't reason in "time-to-player-impact" terms. Schema migrations and breaking refactors are safe.

### Next-sprint plan (the user has reviewed it once with corrections applied)

`~/.claude/plans/i-don-t-think-that-immutable-pancake.md` — **Combat Arena v2: finish Stages 2–7 (corpses out)**. 8 phases, ~3.5 days focused work.

- **Phase 1 — Death animation + survivor promotion** (~0.5 day) ← starts here. Combined fade+shrink animation; new `promoteSurvivorsAfterDeath()` engine helper that auto-promotes higher-position teammates forward by 1 when someone dies; survivors slide ~0.5 sec to their new lane spaces.
- **Phase 2 — Status columns** (~0.5 day). Hover-revealed HP/mana/status/hotbar/potions per combatant; 3-sec auto-hide; auto-popup on damage.
- **Phase 3 — Hotbar + popovers** (~0.5 day). SpellActionMenu, TargetPicker, ItemActionPopup, CombatantInfoPopup. Lifted from CombatScreen.tsx without modifying it.
- **Phase 4 — AI turn pacing** (~0.5 day). useArenaTurnPacing hook; ~2 sec per AI turn (reveal hotbar → highlight action → sprite jump → narrate). Extracts `le-atk-*` CSS into shared file.
- **Phase 5 — Spellbook + 4-slot hotbar** (~0.5 day). Modal grouped by Circle. Click-to-slot.
- **Phase 6 — Narration formatting** (~0.25 day). Round banners, action glyphs.
- **Phase 7 — Crit → gore wiring** (~0.5 day). Engine `__CRITICAL__` events flow into `BloodOverlay` with goreZones from metadata.
- **Phase 8 — End-to-end walkthrough** (~0.25 day). Full canonical 3v3 fight start to finish.

The plan was approved with one revision (Phase 1 was originally "death = disappear", Scotch corrected to "fade+shrink + survivor promotion"). Plan now reflects that.

---

## Before you start the session

1. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
2. Confirm branch: `dev`. Latest committed on dev: **`8fd73d9`** (Sprint: Sprite normalization + Z-layer foundation).
3. `git status` should be clean (the prior session committed everything via "commit everything" directive).
4. Dev server: existing process likely on port 3000 (run `lsof -nP -iTCP:3000 -sTCP:LISTEN` to confirm). If not running, `npx next dev -p 3000`.
5. Paste the prompt below as your first message.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview.
3. **`~/.claude/plans/i-don-t-think-that-immutable-pancake.md`** — Combat Arena v2 finish plan (Stages 2–7 + crit-gore, corpses out). Phase 1 is next.
4. **`~/.claude/plans/glowing-jumping-sprout.md`** — original C7 plan; the new plan reuses Stages 2–7 from here. Stage 1 + sprite normalization shipped 2026-05-08.
5. **`~/.claude/plans/i-accidentally-submitted-the-misty-map.md`** — S1–S4 system sprint plan. S1–S3 shipped; S4 graphical travel partially done.
6. **`~/.claude/plans/zim-can-be-the-encapsulated-sunset.md`** — canonical Way-of-Thoth design.
7. **`~/.claude/plans/fluffy-bouncing-hanrahan.md`** — Sprint 7b Phase 2 sorcery roadmap.
8. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index. Pay particular attention to:
   - `project_no_live_game.md` (no players exist; don't optimize for "time to player impact")
   - `feedback_lane_spacing.md` (locked SPACE_OFFSETS, don't drift)
   - `feedback_bandits_uglier_meaner.md` (UGLY_MEAN_OVERLAY for hostile NPCs)

After reading, confirm hydration with one paragraph naming: (a) what shipped in the last session, (b) what the next phase is + which file holds it, (c) any known open questions.

---

## Shipped state (committed to `dev`)

**Latest commit:** `8fd73d9 Sprint: Sprite normalization + Z-layer foundation` (2026-05-08)

**Prior commits still relevant:**
- `c05f3f5` Sprint S4d: travel execution system
- `4dc056c` Sprint S4c+: sidebar cleanup + travel node overhaul

The 8fd73d9 commit was a "commit everything" bundle covering both this sprint AND pre-existing C7/Sorcery in-flight work that was sitting uncommitted on `dev` (combat refactor, lib/combat/* renames, sorcery 7b spell test edits, KARMA system + GAME_DESIGN doc revisions, LoRA-anatomy-test asset deletions).

### Major shipped systems

**Sprint G — Living World epic** (G1–G7): Real-time clock, weather, residue, room damage, NPC repair.

**Sprint 7b — Sorcery sub-sprints**: 25+ spells across Circles 1–8 (heal, blast, speed, power, greater-heal, daylight, firebolt, haste, ward, detect, cleanse, shield*, steelskin, silence, resist, mirror, banish, invoke-light + INVOKE: agility, strength, cure, harm, protection, bless, fireball, poison, teleport, mark, recall, gate-travel, wall-of-stone, resurrection, cunning, feeblemind, weaken, clumsy, curse, arch-protection, reactive-armor, night-sight, paralyze).

**Sprints A/B/C**: persistence audit, critical-hit hardening, dev disclaimer.

**Quest Engine (Sprints 8a–8h, COMPLETE)**: full quest engine + The Way of Thoth quest line + 9-section codex.

**Sprints S1–S5**: Tenets display, PICSSI-location taxonomy, Word system, world-map travel (S4a/c/d shipped; S4b/e/f/g pending), Zim CAST spell fixes.

**Combat Arena v2 — Stage 1** (skeleton): `/dev/combat-arena` page + `<CombatArena>` component, eye-anchored sprite scaling via `figureScaleByEye`, three-space lane layout, Z-layer system, no Tailwind width-squeeze. Stages 2–7 are the next sprint.

**Sprite Normalization** (this session, just shipped): see top of this doc.

---

## Known follow-ups (not yet ticketed, not in next-sprint plan)

- **Casual / non-combat UI sprite migration** (Stage K of the prior sprint) — `HeroScenePortrait.tsx`, `NPCSprite.tsx` still use the legacy sizing path. Out of scope for arena work.
- **Auth + Creator-role gating** for the Sprite Review Tool — currently behind `/dev/`, NODE_ENV-gated only. Future sprint moves it behind login + Creator role.
- **Stagus quest hub** — designed in S4d session, not built. Three sub-sprints (hub module + destination stubs + quest-giver NPC).
- **Live-game integration of `<CombatArena>`** — replace v1 `<CombatScreen>` in production game flow. Separate sprint after Stages 2–7 land.
- **Sprite metadata for casual + dialogue + item PNGs** — Sprite Review Tool currently only walks combat sprites + corpse PNGs. Expanding scope is a Stage K follow-up.
- **Crit-event source is fragile** — engine writes `__CRITICAL__` markers into combatLog narrative strings. Phase 7 will parse strings; future refactor should use a structured event channel.
- **Zim `shield` spell still has no combat handler** — falls through to Jane.
- **CombatScreen `__CRITICAL__` detection** — confirmed working at line 987 / log-strip 1806–1807, NOT at the dead lines old memory cited. Memo: stale `feedback_*` may need touch-up.
- **8f Wave 2+ rooms** — Sister Hela / Maelis / Cassian etc. have no home rooms.
- **Three SH fragments** (SH 1.1 / 18.3 / 19.7) await remote-NPC assignment (Aldric, Vivian, Hokas).
- **Way codex §7 Black Vellum** is a stub.
- **23 travel scene backgrounds** ungenerated (spec in `TRAVEL_MATRIX.md`).
- **Rune-blade item IDs** not in `lib/gameData.ts`.
- **NPC undead/daemon tags** not applied — banish / invoke-light / daylight bonus paths dormant.
- **PICSSI taxonomy retro-tag beyond guild-hall** — only guild-hall rooms tagged.
- **Corpse art** — 16 forged PNGs in repo but skipped from arena pipeline. Future sprint may revisit with different generation approach (hand-painted, different model, different framing).
- **`OathPanel.tsx`** is unused, safe to delete.

---

## Persistence state (unchanged)

**Single source of truth:** `players` row in Supabase. Canonical serializer: `lib/persistence/playerRecord.ts`.

**6-step checklist for adding a new persistent field:**
1. Define on `PlayerState` or `WorldState` in `lib/gameState.ts`
2. Add to serializer in `lib/persistence/playerRecord.ts`
3. Add column mapping in `savePlayer()` at `lib/supabase.ts`
4. Add deserializer line in load path at `app/api/chat/route.ts`
5. Write Supabase migration in `supabase/migrations/`; apply via Management API
6. Add round-trip test to `__tests__/persistence/round-trip.test.ts`

**No new persistent fields added in this sprint.** All sprite metadata lives in the local JSON registry, not in Supabase.

---

## Tests (all suites — confirm green before any sprint commit)

```
npx tsx __tests__/art/size-classes.test.ts          # sprite normalization — 11 cases
npx tsx __tests__/art/figure-scale-by-eye.test.ts   # sprite normalization — 6 cases
npx tsx __tests__/art/lane-layout.test.ts           # sprite normalization — 5 cases
npx tsx __tests__/spells/zim-cast.test.ts           # S5 — 27 cases
npx tsx __tests__/oaths/sprint-s1.test.ts           # S1+ — 9 cases
npx tsx __tests__/quests/words.test.ts              # S3 — 12 cases
npx tsx __tests__/karma/picssi-locations.test.ts    # S2 — 14 cases
npx tsx __tests__/quests/sprint-8e.test.ts
npx tsx __tests__/quests/sprint-8f-zim.test.ts
npx tsx __tests__/quests/sprint-8h-codex.test.ts
npx tsx __tests__/persistence/round-trip.test.ts
npx tsc --noEmit
```

Other 7b suites + combat C-series migration tests also live under `__tests__/`.

---

## Discipline / process notes

- **The game is in dev mode. No players. Schema changes, destructive migrations are safe.** (Now also a memory: `project_no_live_game.md`.)
- **Per-sprint planning sessions.** Each phase gets its own focused execution session.
- **Hard rule from 2026-05-07 post-mortem (still in force):** do NOT modify `app/dev/combat-test/page.tsx` or `components/CombatScreen.tsx` without explicit specific permission. They're v1 references; copy patterns OUT, never rewrite.
- **Width is never constrained on combat sprites.** Only height. The Tailwind preflight `img { max-width: 100%; }` is overridden via inline `maxWidth: "none"` in `CombatArena.tsx`. Future sprite consumers must do the same OR be aware of the constraint.
- **Lane spacing is locked.** `SPACE_OFFSETS = [0.1975, 0.5, 0.8025]`. See `feedback_lane_spacing.md`.
- **Eye-Y is required.** `figureScaleByEye` throws on undefined. Every sprite must be reviewed in `/dev/sprite-review` before it can render in the arena.
- **Bandit / hostile NPC sprites apply `UGLY_MEAN_OVERLAY`** in their forge prompts. See `feedback_bandits_uglier_meaner.md`. Allies stay handsome; villains stay visibly hostile.
- **Hydration discipline.** `git log --oneline --all --graph | head -20` is authoritative over any doc.

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
- **Never bundle pre-existing M-state into a sprint commit** UNLESS the user explicitly says "commit everything" (as in 8fd73d9).
- **Never use apostrophes inside `<<'EOF'` heredoc bodies** (breaks bash).

---

## Operational facts

- **Branch model:** `dev` is working; `main` is Vercel deploy target. Always merge with `--no-ff`. (No live audience yet — see `project_no_live_game.md`.)
- **Dev server:** port **3000** (verified with `lsof` 2026-05-08 — was 3001 historically per docs but the running instance is on 3000).
- **Auth bypass for dev APIs:** `proxy.ts` whitelists `/api/sprite-list`, `/api/sprite-metadata`, `/api/sprite-regen`, `/api/sprite-touchup`, `/api/prompt-rules` under `NODE_ENV !== "production"`. Required for the Sprite Review Tool to function.
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

## Key files (single-glance reference)

### Sprite normalization (just shipped)
- `lib/art/sizeClasses.ts` — 5-class registry
- `lib/art/spriteMetadata.ts` — metadata read/write helpers
- `lib/art/promptRules.ts` — standing rules loader/editor
- `lib/art/recordPromptForSprite.ts` — forge-script helper
- `lib/art/useSpriteMeta.ts` — client hook for per-sprite metadata
- `lib/combat/laneLayout.ts` — three-space layout
- `lib/combat/useFigureHeight.ts` — `figureScaleByEye`
- `lib/combat/sprites.ts` — SPRITES table + `spritePathFor`
- `lib/spriteFraming.ts` — `SpriteSize → SizeClass` adapter
- `prompt-rules/standing.json` — 8 seeded locked rules
- `public/art/_sprite-metadata.json` — 26+ sprite entries
- `public/art/_regen-queue.json`
- `app/dev/sprite-review/` (page + components)
- `app/api/sprite-{list,metadata,regen}/route.ts`
- `app/api/prompt-rules/route.ts`
- `scripts/forge-corpses.ts`
- `__tests__/art/{size-classes,figure-scale-by-eye,lane-layout}.test.ts`

### Combat Arena v2 (Stages 2–7 next)
- `components/CombatArena.tsx` — main arena UI
- `app/dev/combat-arena/page.tsx` — host page
- `lib/combat/engine.ts` — needs `promoteSurvivorsAfterDeath` in Phase 1
- `components/BloodOverlay.tsx` — gore overlay (class-aware Z + goreZones already wired)

### Untouched (hard rule)
- `components/CombatScreen.tsx` — v1 production combat UI
- `app/dev/combat-test/page.tsx` — v1 admin arena reference

### Canonical specs
- `SORCERY.md`, `KARMA_SYSTEM.md`, `GAME_DESIGN.md` §11
- `~/.claude/plans/i-don-t-think-that-immutable-pancake.md` — current arena plan
- `~/.claude/plans/glowing-jumping-sprout.md` — original C7 plan (Stages 2–7 still relevant)
- `~/.claude/plans/i-accidentally-submitted-the-misty-map.md` — S1–S4 system sprints
- `~/.claude/plans/zim-can-be-the-encapsulated-sunset.md` — Way-of-Thoth design
- `~/.claude/plans/fluffy-bouncing-hanrahan.md` — Sprint 7b Phase 2 roadmap

---

End of hydration prompt.
