# Hydration prompt — next Living Eamon session

## Before you start the session

1. **Switch model to Sonnet** with `/model sonnet`. Opus 4.7 1M burned through ~5 hours of quota in one session of routine sprint work. Save Opus for hard reasoning or design calls; use Sonnet for editing, refactoring, file moves, commits, doc writes.
2. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
3. Confirm branch: `dev`. Latest main commit at session start should be `73a6406` (rescue + Sprint 8b live).
4. Paste the prompt below as your first message.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order, no exploration agents needed:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview. **Note: may be slightly stale on the 8a/8b quest-engine work; the authoritative state is below.**
3. `KARMA_SYSTEM.md` §2.7 "Group-flee mechanics" — ally-combat FLEE spec decided 2026-04-30.
4. `~/.claude/plans/zim-can-be-the-encapsulated-sunset.md` — full Quest Engine + Way-of-Thoth plan.
5. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index. The latest entry to focus on: `project_ally_combat_flee_spec.md` (2026-04-30).

After reading, confirm hydration with one paragraph naming: (a) what Sprint 8 sub-sprint just shipped, (b) what's next, (c) what's deferred until ally combat lands.

---

## Where the work is (as of 2026-04-30)

### Shipped to prod (main: 73a6406)
- **KARMA Sprints 1–6** — stamina/fatigue, PICSSI bedrock, activities (REST/PRAY/DRINK/BROTHEL/etc.), atom encounter loader+resolver, combat-PICSSI deltas, sidebar UI (PICSSI bars, affection meter, karma history log)
- **Sprint 8a** — Quest Engine bedrock (`lib/quests/{types,engine,log}.ts`, `players.quests` jsonb, `quest_definitions` table)
- **Sprint 8b** — Quest event hooks at 6 sites (enter-room, talk-to-npc, command, item-acquired, scroll-read, combat-end) + `QUESTS` and `QUESTS LOG` static commands
- **Quest registry is empty** — engine cycles silently against zero quests until 8d

### Next sprint: 8c — Multi-stage NPC dialogue resolver
Implementation file: `lib/quests/dialogue.ts` (new). Ships:
- `QuestNPCDialogue` interface (npcId + branches[] + fallback)
- `QuestDialogueBranch` (when: questId/onStep/afterStepCompleted/extra)
- `resolveQuestDialogue(state, npcId)` runs **before** the legacy `NPCScript` matcher in `lib/gameEngine.ts` TALK handler
- `fireOnceReward` semantics + `fireOnceKey` persisted in `QuestState.scratch`
- DoD: `__tests__/quests/dialogue.test.ts` covers stage-aware branching, fire-once gating, fallback when no branch matches

### After 8c (in plan order)
- **8d** — Vivian-arc + Way-of-Thoth scaffolding (proof of atom-triggers-quest pattern via `flagsLife["vivian-met"]`)
- **8e** — Stobaean Hermetic fragments (Walter Scott 1924, US-PD) + Logos Teleios (Mead 1906, US-PD)
- **8f** — 14 new NPCs (Old Bram, Sister Hela, Maelis, Cassian, Tavren, Yssa, Orin, Rhonen, Tava, Brother Inan, Mother Khe-Anun + Aldric/Hokas/Vivian extensions); Zim's 15 turn-in branches; `unlockCircle` reward type wired
- **8g** — Difficulty-curve calibration tied to PICSSI advancement bands
- **8h** — `THE WAY` codex command (in-fiction tome that grows with quest progress)
- **Sprint 7** (deferred until 8 done) — Sorcery / Outer Dark / Circles 5–8

### Deferred / dormant
- **Ally combat system.** Spec'd in KARMA_SYSTEM.md §2.7 (group-flee, max party 3, broken-leg gate, abandonment penalty per-ally-count). Implementation lives in `lib/karma/combat-deltas.ts` ally-abandoned + ordered-retreat branches — currently dormant. When that sprint lands, see project memory `project_ally_combat_flee_spec.md`.
- **Wardrobe Engine** + **painter-curation** subsystems — uncommitted, separate from the karma/quest work. Their migration `20260424120000_wardrobe_tables.sql` is committed (already applied to prod) but the `lib/wardrobe/`, `app/api/wardrobe/`, `app/api/painter-curation/` source remains untracked. Only commit when explicitly asked; a lot of LoRA pipeline work is intertwined.

---

## How to work efficiently this session

- Use **Sonnet** by default. Switch to Opus only if Sonnet stumbles on a hard design or refactor. `/model` to switch.
- Use **`/clear`** between unrelated tasks (e.g., after shipping 8c and before starting 8d). Fresh context = cheap turns.
- Use the **Explore subagent** for codebase questions (it runs in its own context and returns a summary; your main context stays lean). The general-purpose agent for multi-step research.
- **Avoid full reads of large files.** `lib/gameEngine.ts` is 5,600+ lines; use Grep to find the right block, then Read with `offset`+`limit`. Same for `KARMA_SYSTEM.md` (1,300+ lines) and `~/.claude/plans/zim-can-be-the-encapsulated-sunset.md`.
- **Commit + push + merge to main** at every shipped sprint. Pattern from this session:
  ```
  git add <specific files>
  git commit -m "Sprint 8X: <what>"
  git push origin dev
  git stash push -u -m wip
  git checkout main
  git merge --no-ff dev -m "Merge Sprint 8X"
  git push origin main
  git checkout dev
  git stash pop
  ```
- **Run typecheck before committing**: `npx tsc --noEmit; echo exit=$?`
- **Watch for untracked code dependencies.** This session's rescue commit shipped 8 karma modules that prior sessions committed via gameEngine.ts imports without ever committing the imported files — broke prod silently for days. After committing a file that imports from a new module, always: `git ls-files <module-path>` to confirm the import target is tracked.

---

## Operational facts you can rely on

- **Branch model:** `dev` is the working branch; `main` is what Vercel deploys. Always merge dev → main with `--no-ff` so the merge commits stay readable.
- **Prod DB:** Supabase. User has authorized prod migration pushes. Use `npx supabase db push --linked` (or whatever the project's standard command is) and migration files in `supabase/migrations/`.
- **Vercel:** auto-deploys from `main`. Build failures are silent unless you check the dashboard.
- **Dev server:** runs on port **3001** (Docker holds 3000).
- **Image pipeline:** sprites use rembg (white BG → transparent PNG). Scenes upload as JPEG directly. Hero portraits live in `public/art/heroes/`, scenes in `public/art/scenes/`, brand in `public/art/brand/`.
- **Date format:** when saving project memories, always convert relative dates ("Thursday") to ISO. Today is **2026-04-30**.

---

## Files to know (as of 2026-04-30)

### Quest Engine (Sprints 8a–8b)
- `lib/quests/types.ts` — Quest, QuestStep, QuestState, QuestEvent (7 variants), QuestReward, QuestPrerequisite
- `lib/quests/engine.ts` — registerQuest, getQuest, validateRegistry, acceptQuest, emitQuestEvent (depth-cap 8), completeStep, applyReward (10-channel fan-out), filterQuestsByScope
- `lib/quests/log.ts` — renderActiveQuests, renderQuestLog, renderQuestRegistry
- `supabase/migrations/20260430110000_quest_engine_bedrock.sql` — players.quests jsonb + quest_definitions table

### Karma (Sprints 1–6)
- `lib/karma/recompute.ts` — applyKarma, clampPicssi, recomputeDerivedStats, logKarmaDelta
- `lib/karma/activities.ts` — REST/PRAY/DRINK/BROTHEL/BATHE/DONATE/MORTIFY dispatcher
- `lib/karma/atom-types.ts` — canonical atom schema (mirrored thinly in scripts/balance/types.ts)
- `lib/karma/loader.ts` — loads atoms from scripts/balance/library/*.json at runtime
- `lib/karma/triggers.ts` — KarmaEvent matcher
- `lib/karma/resolve.ts` — applyChoice, presentAtom
- `lib/karma/combat-deltas.ts` — 13 combat-PICSSI rules; ally-abandonment branch dormant
- `lib/karma/scrolls.ts` — reads `lore/scrolls-of-thoth/*.md` at runtime; riddle-gate Illumination award
- `lib/karma/brothel.ts` — VD mechanic
- `lib/karma/types.ts` — PicssiVirtue, KarmaDelta

### Reference docs
- `KARMA_SYSTEM.md` — canonical for stamina/PICSSI/atoms/affection/flags
- `KARMA_IMPLEMENTATION_PLAN.md` — sprint-by-sprint wiring plan (now mostly historical)
- `SORCERY.md` — Eight Circles + Outer Dark + Order
- `~/.claude/plans/zim-can-be-the-encapsulated-sunset.md` — full Quest Engine + Way-of-Thoth plan

---

End of hydration prompt.
