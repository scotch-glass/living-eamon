# Hydration prompt — next Living Eamon session

## Before you start the session

1. **Switch model to Sonnet** with `/model sonnet`. Opus 4.7 1M burns through quota fast on routine sprint work. Save Opus for hard reasoning or design calls; use Sonnet for editing, refactoring, file moves, commits, doc writes.
2. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
3. Confirm branch: `dev`. Latest main commit at session start should be **`633028c`** (Merge Sprint 7b.B: Bless).
4. Sprint 7b.B Bless is **fully committed and merged to main** — nothing to commit first thing this session.
5. Paste the prompt below as your first message.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order, no exploration agents needed:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview. Update the "Most recent session" block after confirming what shipped.
3. **`SORCERY.md` §9**  — canonical per-spell design notes. **§9.1** Mark/Teleport/Recall/Gate Travel rune system. **§9.2** Bless (shipped). **§9.3** Resurrection corpse model. **§7.1–7.2** Illumination one-way rule + Force I/Force 0 numbering.
4. **`~/.claude/plans/fluffy-bouncing-hanrahan.md`** — Sprint 7b Phase 2 roadmap. Next per-spell sprint is **Sprint 7b.T — Teleport family** (Mark, Teleport, Recall, Gate Travel).
5. **`~/.claude/plans/i-accidentally-submitted-the-misty-map.md`** — system-sprint roadmap (S1 shipped; S2 PICSSI-location taxonomy, S3 The Word system, S4 Graphical Travel are deferred with seeds in memory).
6. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index.

After reading, confirm hydration with one paragraph naming: (a) what shipped last session (Pre-work B/C/F, S1, Sprint 7b.B Bless), (b) what Sprint 7b.B Bless delivered and the two foundational infra pieces it built (temp buff layer + room tags), (c) the next sprint per the approved roadmap.

---

## Where the work is (as of session end 2026-05-02)

### Committed to main (current state — `633028c`)

- **Pre-work B** — combat 3-vs-3 position model + barrier infrastructure.
- **Pre-work C** — Incognito dropped; Invisibility semi-transparency render complete.
- **Pre-work F** — `lore/pantheon/PANTHEON.md` + `lore/maatic-library/oaths-of-maat.md` (42 Oaths) + 8 math-magic books.
- **S1** — `components/OathPanel.tsx` (42 Oaths inline + PICSSI summary; 4th sidebar tab "oaths"). `app/page.tsx` wired.
- **Sprint 7b.B Bless** — fully committed and on main. See sorcery state below.

### Sorcery state after 7b.B (on main)

**Pre-work D (temp buff layer):**
- `TempModifier` type + `tempModifiers: TempModifier[]` on `PlayerState` ([lib/gameState.ts](lib/gameState.ts)).
- `recomputeDerivedStats` folds `tempModifiers` into `charismaEffective` and effective-Illumination-for-maxMana ([lib/karma/recompute.ts](lib/karma/recompute.ts)).
- `tickWorldState` decrements `turnsRemaining` per turn; expired entries drop.
- Initialized to `[]` in factory + rebirth.

**Pre-work E (room tags):**
- `consecrated?: boolean; deity?: string;` added to `Room` interface ([lib/roomTypes.ts](lib/roomTypes.ts)).
- **Shrine of Ma'at** added to guild-hall: `id: "shrine_of_maat"`, `consecrated: true, deity: "maat"`. Accessible `southeast` from the guild courtyard.

**Bless mechanics ([lib/sorcery/effects.ts](lib/sorcery/effects.ts), [lib/sorcery/invoke.ts](lib/sorcery/invoke.ts)):**
- Duration: **10 turns** normal room; **15 turns** in consecrated room.
- Reagent waiver: garlic + mandrake_root are NOT consumed in a consecrated room. Mana (9) always consumed.
- Adds `"blessed"` status effect + two `TempModifier` entries: `illumination +10` and `charisma +5`.
- Re-casting Bless refreshes (replaces existing — no stacking).

**Blessed resistance ([lib/combatEngine.ts](lib/combatEngine.ts)):**
- Skips `bleed`, `severed_artery`, and `poison` injury applications when `"blessed"` is in `activeEffects`.

**Tests:** 18 cases in `__tests__/sorcery/sprint-7b-bless.test.ts`. **114/114 total, 7 suites, typecheck clean.**

### Next sprint per the approved plan

**Sprint 7b.T — Teleport family** (Mark, Teleport, Recall, Gate Travel) per `~/.claude/plans/fluffy-bouncing-hanrahan.md §Sprint 7b.T`. Four rune-based travel spells sharing infra — they ship together.

Infra needed (not yet built):
- `"rune"` item type + `unmarked_rune` item in `lib/gameData.ts`.
- `markedRunes: Array<{ id, targetRoomId, targetPlaneId, label }>` on `PlayerState`.
- `planeId?: string` on `Room` + `currentPlane: string` on `PlayerState` (default `"thurian"`).
- Mark, Teleport, Recall, Gate Travel dispatchers in `lib/sorcery/effects.ts`.
- INVOKE argument parsing for rune labels in `lib/sorcery/invoke.ts`.

Run a focused planning session against `fluffy-bouncing-hanrahan.md §Sprint 7b.T` before implementing.

**Alternative pivot:** S2 (PICSSI-location taxonomy), S3 (The Word system), or S4 (Graphical Travel) — each per `~/.claude/plans/i-accidentally-submitted-the-misty-map.md`. None block on sorcery; Scotch chooses the order.

### Pre-existing uncommitted M-state (from prior sessions — DO NOT commit without explicit instruction)

Many files in the working tree were already M at the start of the previous session. Notable ones:
- `app/updates/page.tsx` — prior-session work (new design-decision card + background-image path change).
- `lib/adventures/guild-hall-npcs.ts` — prior-session Zim heal-response rewrite.
- `CLAUDE.md`, `app/layout.tsx`, `app/splash/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`, `app/legal/page.tsx` — pre-existing from wardrobe / UI work.
- Wardrobe Engine (`lib/wardrobe/`, `app/api/wardrobe/`, `lib/weaponCarry.ts`, etc.) — dormant.

Surface these to Scotch before bundling into any commit.

---

## Discipline / process notes (load-bearing)

- **Per-spell planning sessions, not one big sprint.** Each spell with design complexity gets its own focused planning session before implementation. `fluffy-bouncing-hanrahan.md` is the list of sessions to run.
- **No in-fiction prose for unbuilt features.** `[DEV] <reason> not yet implemented` markers are dead code by release. Don't paper over dev gaps with fictional prose.
- **One-way Illumination rule** (`SORCERY.md §7.1` + memory `feedback_no_illumination_amplification.md`). Powerful sorcery darkens the soul. A darkened soul does NOT boost spell power.
- **Force I = Creative, Force 0 = Destructive.** The numbering encodes asymmetry (1 generates, 0 generates nothing on its own).
- **Temp modifiers don't write through.** `TempModifier` values add to effective stats at recompute time without touching `picssi.*` or base attributes. Expired modifiers dropped by `tickWorldState`.
- **Shrine of Ma'at is the first consecrated room.** `id: "shrine_of_maat"`, accessible southeast from the guild courtyard.
- **Hydration discipline.** `git log --oneline --all --graph | head -20` is authoritative over any doc.
- **Spell descriptions are POTENTIAL form.** *"Three quiet warmths gather, ready to layer themselves..."* not *"Three warmths layer."*

---

## Standard sprint-ship workflow

```
git add <specific files>
git commit -m "Sprint NX: <what>"
git push origin dev
git checkout main
git merge --no-ff dev -m "Merge Sprint NX"
git push origin main
git checkout dev
```

- Typecheck before committing: `npx tsc --noEmit; echo exit=$?`
- Full test suite: `npm run test:quests`
- **Never bundle pre-existing M-state into a sprint commit.**

---

## Operational facts

- **Branch model:** `dev` is the working branch; `main` is what Vercel deploys. Always merge dev → main with `--no-ff`.
- **Prod DB:** Supabase. User has authorized prod migration pushes.
- **Vercel:** auto-deploys from `main`. Build failures are silent unless you check the dashboard.
- **Dev server:** runs on port **3001** (Docker holds 3000).
- **Date format:** when saving project memories, always convert relative dates to ISO. Today is **2026-05-02**.

---

## Files to know

### Sorcery (current state)

- `lib/sorcery/types.ts` — `Spell`, `Circle`, `ReagentId`, `EffectResult` (damage-dealt / healed / cure-applied / **blessed** / dev-not-implemented), `InvokeOutcome`
- `lib/sorcery/registry.ts` — 63 spells (Circle 5 = 7; Incognito dropped 2026-05-02)
- `lib/sorcery/invoke.ts` — `handleInvoke` + `composeInvokeResponse`; temple reagent-waiver logic for Bless
- `lib/sorcery/effects.ts` — `applyEffect` dispatcher; damage/heal/cure/Bless implemented; others return `dev-not-implemented`
- `__tests__/sorcery/sprint-7a.test.ts` — 23 cases
- `__tests__/sorcery/sprint-7b.test.ts` — 20 cases
- `__tests__/sorcery/sprint-7b-bless.test.ts` — 18 cases

### Sprint 7b.B infra (now on main)

- `lib/gameState.ts` — `TempModifier` type; `tempModifiers: TempModifier[]` on `PlayerState`
- `lib/karma/recompute.ts` — `tempModifiers` folded into `charismaEffective` + effective-illumination-for-maxMana
- `lib/combatTypes.ts` — `"blessed"` added to `StatusEffectType`
- `lib/effectIconData.ts` — `"blessed"` entry (feather SVG, gold glow)
- `lib/roomTypes.ts` — `consecrated?: boolean; deity?: string;` on `Room`
- `lib/adventures/guild-hall.ts` — `shrine_of_maat` room (`consecrated: true, deity: "maat"`)

### Canonical specs

- `SORCERY.md` — §1–8 the system; §9.1–9.3 per-spell designs; §7.1–7.2 cosmology
- `KARMA_SYSTEM.md` §2.10 — Illumination as a karma stock
- `GAME_DESIGN.md` §11 — PICSSI Illumination dimension
- `lore/pantheon/PANTHEON.md` — full deity roster
- `lore/maatic-library/oaths-of-maat.md` — 42 Oaths
- `~/.claude/plans/fluffy-bouncing-hanrahan.md` — Sprint 7b Phase 2 roadmap
- `~/.claude/plans/i-accidentally-submitted-the-misty-map.md` — S1–S4 system sprints

### Karma + quest engine (unchanged this session)

- `lib/karma/recompute.ts` — applyKarma, clampPicssi, recomputeDerivedStats (reads tempModifiers), logKarmaDelta
- `lib/karma/combat-deltas.ts` — 13 combat-PICSSI rules; ally branches dormant
- `lib/quests/engine.ts` — registerQuest, acceptQuest, emitQuestEvent, completeStep, applyReward (unlockCircle)

---

End of hydration prompt.
