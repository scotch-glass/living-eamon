# Hydration prompt — next Living Eamon session

## Before you start the session

1. **Switch model to Sonnet** with `/model sonnet`. Opus 4.7 1M burns through quota fast on routine sprint work. Save Opus for hard reasoning or design calls; use Sonnet for editing, refactoring, file moves, commits, doc writes.
2. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
3. Confirm branch: `dev`. Latest main commit at session start should be **`3af7d8b`** (Merge Sprint B: critical-hit prescript hardening).
4. All sprints below are **fully committed and merged to main** — nothing to commit first thing this session.
5. Paste the prompt below as your first message.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order, no exploration agents needed:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines. Note the **dev-mode disclaimer** added 2026-05-03 — there are no real users, schema changes are safe.
2. `CLAUDE_CONTEXT.md` — project overview. Update the "Most recent session" block after confirming what shipped.
3. **`~/.claude/plans/your-recommended-sprint-1-moonlit-taco.md`** — the 2026-05-03 code-review-driven plan. Sprints A/B/C shipped. Sprint G (Living World epic — real-time tick, Eivissa weather, per-spell environmental residue, NPC repair) is documented but not implemented; it is broken into 7 sub-sprints (G1–G7), each requiring its own focused planning session before implementation.
4. **`SORCERY.md` §9** — canonical per-spell design notes.
5. **`~/.claude/plans/fluffy-bouncing-hanrahan.md`** — Sprint 7b Phase 2 roadmap. Next per-spell sprints: stat-buff/debuff family (Strength, Agility, Clumsy, Weaken) and Paralyze.
6. **`~/.claude/plans/i-accidentally-submitted-the-misty-map.md`** — system-sprint roadmap (S1 shipped; S2 PICSSI-location taxonomy, S3 The Word system, S4 Graphical Travel deferred with seeds in memory).
7. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index. Note the new `project_persistence_architecture.md` entry.

After reading, confirm hydration with one paragraph naming: (a) what shipped last session (Sprints A/B/C from the 2026-05-03 code review), (b) what infrastructure those sprints left standing, (c) the next sprint options per the approved roadmaps, (d) which next sprint Scotch should pick from.

---

## Where the work is (as of session end 2026-05-03 evening)

### Committed to main (`3af7d8b`)

- **Sprint C** — Dev-mode disclaimer at top of [CLAUDE_CONTEXT.md](CLAUDE_CONTEXT.md). Future agents now know there are no real users; destructive migrations are safe.
- **Sprint A** — Persistence audit + gap-fill. 10 fields that the engine read/wrote but never round-tripped through page refresh:
  - **Player-scoped:** `knownCircles`, `tempModifiers`, `currentPlane`, `previousRoom`, `prisonTurnsRemaining`, `lastAction`
  - **World-scoped (per-player world):** `worldTurn`, `corpses`, `vendorTempStock`, `activeEvents`
  - Migration `20260503150000_persistence_audit_gap_fill.sql` adds the columns; **already applied to prod** via Supabase Management API.
  - Serializer extracted from `app/api/chat/route.ts` to [lib/persistence/playerRecord.ts](lib/persistence/playerRecord.ts) — canonical WorldState → row-record mapper.
  - Load deserializer in `app/api/chat/route.ts` updated to read the 10 fields back.
  - New test suite `__tests__/persistence/round-trip.test.ts` — 12 cases, all green.
- **Sprint B** — Critical-hit prescript hardening.
  - Removed dormant `__CRITICAL__` Jane rewrite at `app/api/chat/route.ts` (dead code — engine never injected the marker).
  - Expanded `CRITICAL_PREFIXES` and `CRIT_ATTACKER_GORE` in `lib/combatZoneNarration.ts` from 2 → 10 lines per body zone (8 → 80 unique variants total).
  - Howard-canon visceral house style; matches existing tone.

### Persistence state (on main)

**Single source of truth:** `players` row in Supabase. World-scoped state (rooms, corpses, vendorTempStock, worldTurn, activeEvents) is per-player on the same row — there is no separate `world_state` table.

**Canonical serializer:** [lib/persistence/playerRecord.ts](lib/persistence/playerRecord.ts).

**6-step checklist for adding a new persistent field** (saved as project memory `project_persistence_architecture.md`):
1. Define on `PlayerState` or `WorldState` in [lib/gameState.ts](lib/gameState.ts).
2. Add to serializer in `lib/persistence/playerRecord.ts`.
3. Add column mapping in `savePlayer()` at `lib/supabase.ts:28`.
4. Add deserializer line in load path at `app/api/chat/route.ts:350-580`.
5. Write Supabase migration in `supabase/migrations/`; apply it.
6. Add round-trip test case to `__tests__/persistence/round-trip.test.ts`.

### Sorcery state (unchanged this session)

Same as session 2026-05-03 morning: 16 of ~64 spells implemented; dispatcher pattern intact; 9 sorcery test suites green.

### Tests

10 suites total, all passing. Typecheck clean.

- `sprint-7a.test.ts` — 23 cases
- `sprint-7b.test.ts` — 20 cases
- `sprint-7b-bless.test.ts` — 18 cases
- `sprint-7b-cunning.test.ts` — 12 cases
- `sprint-7b-teleport.test.ts` — 14 cases
- `sprint-7b-corpse.test.ts` — 12 cases
- `sprint-7b-wall.test.ts` — 11 cases
- `sprint-7b-poison.test.ts` — 10 cases
- `sprint-7b.test.ts` — 20 cases
- **`__tests__/persistence/round-trip.test.ts`** — 12 cases (NEW this session)

### Next sprint options per the approved plans

**Three live roadmaps. Scotch picks the next thread.**

#### Option 1 — Sprint G (Living World epic) — `your-recommended-sprint-1-moonlit-taco.md`

Promoted to the top of the work queue by the 2026-05-03 code review + Scotch's scope expansion. Real-time-anchored world: 1 in-game hour = 1 real hour; Eivissa weather via Open-Meteo; per-spell environmental residues (scorch, blood, rubble) with decay; NPC-driven repair scaled by Circle. **Each of G1–G7 is its own focused planning session before implementation.**

- **G1** — Real-time clock + on-demand catch-up infrastructure (`WorldState.realTimeMs`, `lastTickAt`, `tickRealTime`)
- **G2** — Per-room time-of-day field + day/night descriptions library
- **G3** — Eivissa weather via Open-Meteo + weather descriptions library
- **G4** — Per-spell environmental side-effect catalog (`lib/world/spellResidue.ts`)
- **G5** — Room damage state + real-time decay
- **G6** — NPC-driven repair logic (mason / carpenter / smith / scribe)
- **G7** — Authoring sweep (200–400 lines of weather/day/night/residue prose)

#### Option 2 — Continue sorcery roadmap — `fluffy-bouncing-hanrahan.md`

Sprint 7b.stat-debuffs (Clumsy + Weaken) — Circle 1/2 enemy debuffs targeting dexterity and strength. Then Sprint 7b.stat-buffs (Strength + Agility) and Sprint 7b.paralyze.

#### Option 3 — System sprints — `i-accidentally-submitted-the-misty-map.md`

S2 (PICSSI-location taxonomy), S3 (The Word system), S4 (Graphical Travel) — none block on sorcery; each gets its own focused planning session.

### Pre-existing uncommitted M-state (unchanged from prior session — DO NOT commit without explicit instruction)

The same files are M at session start as in prior sessions:
- `app/updates/page.tsx`, `lib/adventures/guild-hall-npcs.ts` — prior-session work
- `CLAUDE.md`, `app/layout.tsx`, `app/splash/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`, `app/legal/page.tsx`, `app/board/page.tsx` — pre-existing UI work
- Wardrobe Engine (`lib/wardrobe/`, `app/api/wardrobe/`, `lib/weaponCarry.ts`, etc.) — dormant
- Various `app/api/*-image/` routes — prior session

Surface these to Scotch before bundling into any commit.

### Known follow-ups not yet ticketed

- **CombatScreen has dead `__CRITICAL__` detection** at `components/CombatScreen.tsx:732-734, 1025-1027`. The marker was never injected so the visual flash + crit wound + vignette never fired. A future combat-UI sprint should re-establish crit visual feedback through a proper signal (e.g., `lastStrikeWasCrit: boolean` on `ActiveCombatSession` or `StrikeResolution.isCritical` propagated to client).
- **Supabase CLI `db push` is broken** due to remote migration history mismatch (a pre-existing duplicate policy in `20260411120000_grok_imagine_error_log.sql`). Workaround used this session: Supabase Management API direct SQL execution. See "Operational facts" below.

---

## Discipline / process notes (load-bearing)

- **The game is in dev mode. No real users.** Schema changes, destructive migrations, drop-and-recreate are all safe. Plan for paying users; do not yet protect data as if any are present. (Captured in `CLAUDE_CONTEXT.md` top-of-file block.)
- **Per-spell planning sessions, not one big sprint.** Each spell with design complexity gets its own focused planning session before implementation.
- **Per-sub-sprint planning sessions for Sprint G.** Same pattern — G1, G2, G3, etc. each get a focused session.
- **No in-fiction prose for unbuilt features.** `[DEV] <reason> not yet implemented` markers are dead code by release.
- **One-way Illumination rule** (`SORCERY.md §7.1`). Powerful sorcery darkens the soul; a darkened soul does NOT boost spell power.
- **Force I = Creative, Force 0 = Destructive.** Damage spells need a foe (Force 0). Field spells that are combat-only use `no-target` (not `dev-not-implemented`) when cast outside combat.
- **Temp modifiers don't write through.** `TempModifier` values add to effective stats at recompute time without touching `picssi.*` or base attributes.
- **`damagePerTurn` is the canonical field name** on `ActiveStatusEffect` for per-round HP drain — shared by bleed and poison; the narrative in `tickStatusEffects` differentiates by `effect.type`.
- **Hydration discipline.** `git log --oneline --all --graph | head -20` is authoritative over any doc.
- **Spell descriptions are POTENTIAL form.** Howard-canon house style.
- **When adding a persistent field, follow the 6-step checklist** in `project_persistence_architecture.md`. The round-trip test catches gaps automatically.

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
- Run tests: `npx tsx __tests__/<dir>/<suite>.test.ts`
- **Never bundle pre-existing M-state into a sprint commit.**
- **Never use apostrophes inside `<<'EOF'` heredoc bodies in commit messages** — bash parses them as quote-end markers and the commit fails.

---

## Operational facts

- **Branch model:** `dev` is the working branch; `main` is what Vercel deploys. Always merge dev → main with `--no-ff`.
- **Prod DB:** Supabase. User has authorized prod migration pushes.
- **Vercel:** auto-deploys from `main`. Build failures are silent unless you check the dashboard.
- **Dev server:** runs on port **3001** (Docker holds 3000).
- **Date format:** when saving project memories, always convert relative dates to ISO. Today is **2026-05-03** at session-end.
- **Supabase migration apply method (CURRENT):** `npx supabase db push` is broken due to remote migration history mismatch. **Workaround:** use the Supabase Management API directly:

  ```bash
  SUPABASE_ACCESS_TOKEN=$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2- | tr -d '"')
  SQL=$(cat supabase/migrations/<file>.sql)
  curl -sS -X POST \
    "https://api.supabase.com/v1/projects/dhjgfdfeopdjjyyvfmfy/database/query" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -nc --arg q "$SQL" '{query: $q}')"
  ```

  `[]` response = success (DDL returns no rows). Verify schema with a follow-up SELECT against `information_schema.columns`.

---

## Files to know

### Persistence (NEW this session)

- [lib/persistence/playerRecord.ts](lib/persistence/playerRecord.ts) — canonical `worldStateToPlayerRecord` serializer
- [lib/supabase.ts](lib/supabase.ts) — `savePlayer()` writes the row; column mappings at lines 28–160
- [app/api/chat/route.ts](app/api/chat/route.ts) — `POST` handler hydrates state from row at lines 350–580
- [supabase/migrations/20260503150000_persistence_audit_gap_fill.sql](supabase/migrations/20260503150000_persistence_audit_gap_fill.sql) — applied to prod
- [__tests__/persistence/round-trip.test.ts](__tests__/persistence/round-trip.test.ts) — round-trip coverage

### Sorcery (current state — unchanged this session)

- `lib/sorcery/types.ts` — `Spell`, `Circle`, `ReagentId`, `EffectResult` (15 variants), `InvokeOutcome`
- `lib/sorcery/registry.ts` — 63 spells across 8 Circles
- `lib/sorcery/invoke.ts` — `handleInvoke` + `composeInvokeResponse`
- `lib/sorcery/effects.ts` — `applyEffect` dispatcher
- `lib/combat/barriers.ts` — `isCrossingBarrier` + `tickBarriers`
- `lib/gameState.ts` — `Corpse`, `CreatureKind`, `isDay()`, `TempModifier`, `TempModifierStat`; `WorldState.corpses`

### Combat narration (CHANGED this session)

- [lib/combatZoneNarration.ts](lib/combatZoneNarration.ts) — `CRITICAL_PREFIXES` (~440), `CRIT_ATTACKER_GORE` (~565); both now 10 lines/zone

### Canonical specs

- `SORCERY.md` — magic systems
- `KARMA_SYSTEM.md` §2.10 — Illumination as karma stock
- `GAME_DESIGN.md` §11 — PICSSI Illumination dimension
- `lore/pantheon/PANTHEON.md` — full deity roster
- `lore/maatic-library/oaths-of-maat.md` — 42 Oaths
- `~/.claude/plans/your-recommended-sprint-1-moonlit-taco.md` — **2026-05-03 code-review plan** (Sprints A/B/C done, Sprint G epic deferred)
- `~/.claude/plans/fluffy-bouncing-hanrahan.md` — Sprint 7b Phase 2 roadmap
- `~/.claude/plans/i-accidentally-submitted-the-misty-map.md` — S1–S4 system sprints

### Karma + quest engine (unchanged this session)

- `lib/karma/recompute.ts` — `applyKarma`, `clampPicssi`, `recomputeDerivedStats`, `logKarmaDelta`
- `lib/karma/combat-deltas.ts` — 13 combat-PICSSI rules
- `lib/quests/engine.ts` — `registerQuest`, `acceptQuest`, `emitQuestEvent`, `completeStep`, `applyReward`

---

End of hydration prompt.
