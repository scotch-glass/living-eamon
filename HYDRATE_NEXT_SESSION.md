# Hydration prompt — next Living Eamon session

## Before you start the session

1. **Switch model to Sonnet** with `/model sonnet`. Opus 4.7 1M burns through quota fast on routine sprint work. Save Opus for hard reasoning or design calls; use Sonnet for editing, refactoring, file moves, commits, doc writes.
2. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
3. Confirm branch: `dev`. Latest main commit at session start should be `067f1d4` (merge Sprint 8c+8d).
4. Paste the prompt below as your first message.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order, no exploration agents needed:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview. The "Most recent session (2026-04-30) — Quest Engine 8a→8d shipped" block at the top is current.
3. `KARMA_SYSTEM.md` §2.7 "Group-flee mechanics" — ally-combat FLEE spec decided 2026-04-30.
4. `~/.claude/plans/zim-can-be-the-encapsulated-sunset.md` — full Quest Engine + Way-of-Thoth plan. Sprints 8a/8b/8c/8d done; **8e is next**.
5. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index.

After reading, confirm hydration with one paragraph naming: (a) what Sprint 8 sub-sprint just shipped, (b) what 8e ships, (c) what's deferred until ally combat lands.

---

## Where the work is (as of 2026-04-30 EOD)

### Shipped to prod (main: 067f1d4)
- **KARMA Sprints 1–6** — stamina/fatigue, PICSSI bedrock, activities, atom encounter loader+resolver, combat-PICSSI deltas, sidebar UI
- **Sprint 8a** — Quest Engine bedrock (`lib/quests/{types,engine,log}.ts`, `players.quests` jsonb, `quest_definitions` table)
- **Sprint 8b** — Quest event hooks at 6 sites + `QUESTS` / `QUESTS LOG` static commands
- **Sprint 8c** — Multi-stage NPC dialogue resolver. `lib/quests/dialogue.ts` with `QuestNPCDialogue` + `resolveQuestDialogue`. Runs before legacy NPCScript / Jane in TALK handler. `fireOnceReward` persisted in `QuestState.scratch`. 13 test cases.
- **Sprint 8d** — Vivian-arc + Way-of-Thoth scaffolding. Engine extended with `Quest.acceptanceTrigger` + Phase 1 auto-accept walk in `emitQuestEvent`. Two quests now register: **vivian-arc** (life-scope, atom-triggers-quest proof via flags) and **way-of-thoth** (legacy-scope, 15 stub steps with chronicle-only rewards). 9 test cases.

### Quest registry state
- **Registered**: `vivian-arc`, `way-of-thoth`
- **Validator**: `{ ok: true }`
- **Side-effect import chain**: `lib/gameEngine.ts` → `lib/quests/load.ts` → `lib/quests/lines/{vivian-arc,way-of-thoth}.ts` → `lib/quests/engine.ts:registerQuest`. Don't put line imports in engine.ts itself — TDZ on the `const QUEST_REGISTRY` will bite during the cycle.

### Next sprint: 8e — Stobaean Hermetic fragments + Logos Teleios

Authoring sprint; no engine changes. Ships:
- `lore/stobaean-fragments/SH-*.md` × 14 (Walter Scott, *Hermetica Vol. III* 1924, US-PD).
  - Pacing per plan: SH 2.1 / 11.2 / 18.3 / 1.1 = wisdom flavor; SH 19.7 / 25.8 / 23.5 / 7.4 = soul-architecture; SH 24.2 / 21.6 / 11.4 / 26.5 / 3.3 / 27.1 = cosmology + Word + warning.
- `lore/logos-teleios/` — partial-text excerpt (Mead 1906, US-PD).
- Wire each fragment into the appropriate Way-of-Thoth step as `talk-to-npc`-triggered dialogue lines using Sprint 8c's `fireOnceReward` mechanic. Fragments fire once per legacy lifetime (so they survive rebirth when delivered through legacy-scope quest scratch).
- DoD: each fragment fires once per legacy life; *Logos Teleios* found in Scroll 14 vault; Brother Inan dialogue triggers correctly.

### After 8e (in plan order)
- **8f** — 14 new NPCs (Old Bram, Sister Hela, Maelis, Cassian, Tavren, Yssa, Orin, Rhonen, Tava, Brother Inan, Mother Khe-Anun + Aldric/Hokas/Vivian extensions); Zim's 15 turn-in branches; `unlockCircle` reward type wired into stages 1, 3, 5, 7, 8.
- **8g** — Difficulty-curve calibration tied to PICSSI advancement bands.
- **8h** — `THE WAY` codex command (in-fiction tome that grows with quest progress).
- **Sprint 7** (deferred until 8 done) — Sorcery / Outer Dark / Circles 5–8.

### Deferred / dormant
- **Ally combat system.** Spec'd in KARMA_SYSTEM.md §2.7 (group-flee, max party 3, broken-leg gate, abandonment penalty per-ally-count). Implementation lives in `lib/karma/combat-deltas.ts` ally-abandoned + ordered-retreat branches — currently dormant. When that sprint lands, see project memory `project_ally_combat_flee_spec.md`.
- **Wardrobe Engine** + **painter-curation** subsystems — uncommitted, separate from the karma/quest work. Migration `20260424120000_wardrobe_tables.sql` is committed (already applied to prod) but the `lib/wardrobe/`, `app/api/wardrobe/`, `app/api/painter-curation/` source remains untracked. Only commit when explicitly asked; LoRA pipeline work is intertwined.

---

## How to work efficiently this session

- Use **Sonnet** by default. Switch to Opus only if Sonnet stumbles on a hard design or refactor. `/model` to switch.
- Use **`/clear`** between unrelated tasks (e.g., after shipping 8e and before starting 8f). Fresh context = cheap turns.
- Use the **Explore subagent** for codebase questions. The general-purpose agent for multi-step research.
- **Avoid full reads of large files.** `lib/gameEngine.ts` is 5,600+ lines; use Grep then Read with `offset`+`limit`. Same for `KARMA_SYSTEM.md` and `~/.claude/plans/zim-can-be-the-encapsulated-sunset.md`.
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
- **Run quest tests**: `npx tsx __tests__/quests/dialogue.test.ts && npx tsx __tests__/quests/sprint-8d.test.ts`
- **Watch for untracked code dependencies.** After committing a file that imports from a new module, always: `git ls-files <module-path>` to confirm the import target is tracked. The Sprint 8a/8b rescue commit shipped 8 karma modules whose import targets weren't tracked — broke prod silently for days.

---

## Operational facts you can rely on

- **Branch model:** `dev` is the working branch; `main` is what Vercel deploys. Always merge dev → main with `--no-ff`.
- **Prod DB:** Supabase. User has authorized prod migration pushes.
- **Vercel:** auto-deploys from `main`. Build failures are silent unless you check the dashboard.
- **Dev server:** runs on port **3001** (Docker holds 3000).
- **Image pipeline:** sprites use rembg (white BG → transparent PNG). Scenes upload as JPEG directly. Hero portraits in `public/art/heroes/`, scenes in `public/art/scenes/`.
- **Date format:** when saving project memories, always convert relative dates to ISO. Today is **2026-04-30**.

---

## Files to know (as of 2026-04-30 EOD)

### Quest Engine (Sprints 8a–8d)
- `lib/quests/types.ts` — Quest (incl. `acceptanceTrigger`), QuestStep, QuestState, QuestEvent (7 variants), QuestReward, QuestPrerequisite
- `lib/quests/engine.ts` — registerQuest, getQuest, validateRegistry, acceptQuest, emitQuestEvent (Phase 1 auto-accept + Phase 2 active-walk, depth-cap 8), completeStep, applyReward (10-channel fan-out), filterQuestsByScope, **checkPrerequisites (exported)**
- `lib/quests/dialogue.ts` — QuestNPCDialogue, QuestDialogueBranch, registerQuestDialogue, resolveQuestDialogue, _resetQuestDialogueRegistry (test hook)
- `lib/quests/log.ts` — renderActiveQuests, renderQuestLog, renderQuestRegistry
- `lib/quests/load.ts` — side-effect imports of line modules; consumed by gameEngine.ts
- `lib/quests/lines/vivian-arc.ts` — life-scope proof of atom-triggers-quest
- `lib/quests/lines/way-of-thoth.ts` — legacy-scope, 15 stub steps
- `supabase/migrations/20260430110000_quest_engine_bedrock.sql` — players.quests jsonb + quest_definitions table
- `__tests__/quests/dialogue.test.ts` — 13 cases (Sprint 8c)
- `__tests__/quests/sprint-8d.test.ts` — 9 cases (Sprint 8d)

### Karma (Sprints 1–6)
- `lib/karma/recompute.ts` — applyKarma, clampPicssi, recomputeDerivedStats, logKarmaDelta
- `lib/karma/activities.ts` — REST/PRAY/DRINK/BROTHEL/BATHE/DONATE/MORTIFY dispatcher
- `lib/karma/atom-types.ts` — canonical atom schema
- `lib/karma/loader.ts` — loads atoms from scripts/balance/library/*.json at runtime
- `lib/karma/triggers.ts` — KarmaEvent matcher
- `lib/karma/resolve.ts` — applyChoice, presentAtom (atom flags-set: `flagsSet` array; legacy: prefix flag with "legacy:")
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
