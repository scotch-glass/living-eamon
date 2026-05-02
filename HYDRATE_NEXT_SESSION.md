# Hydration prompt — next Living Eamon session

## Before you start the session

1. **Switch model to Sonnet** with `/model sonnet`. Opus 4.7 1M burns through quota fast on routine sprint work. Save Opus for hard reasoning or design calls; use Sonnet for editing, refactoring, file moves, commits, doc writes.
2. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
3. Confirm branch: `dev`. Latest main commit at session start should be **`bb92d74`** (Merge: remove Beginner's Cave references).
4. Paste the prompt below as your first message.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order, no exploration agents needed:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview. The "Most recent session (2026-05-01)" block at the top tracks Sprint 7b state.
3. **`SORCERY.md` §9** — canonical per-spell design notes for the spells with mechanics richer than a registry row. **§9.1** Mark/Teleport/Recall/Gate Travel rune system. **§9.2** Bless three-effect spec + temple-invocation modification + the two required room tags (`consecrated`, `deity`). **§9.2.1** pointer for the future Howard pantheon list. **§9.3** Resurrection corpse model + Sun-and-Moon rule + hero exception. **§7.1** is the cosmological one-way Illumination rule (Thoth's Principle of Correspondence — Light/Dark are continuum poles, not factions). **§7.2** is the **Two Fundamental Forces** with the canonical numbering: **Force I = Creative** (the *one* that generates), **Force 0 = Destructive** (zero because it generates nothing on its own).
4. **`~/.claude/plans/fluffy-bouncing-hanrahan.md`** — Sprint 7b Phase 2 roadmap: cross-cutting pre-work + per-spell planning sessions + recommended order. **Approved by Scotch.**
5. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index. Pay attention to `feedback_no_illumination_amplification.md` (one-way Illumination rule, load-bearing).

After reading, confirm hydration with one paragraph naming: (a) what shipped this session (Sprint 7-vocab + 7a + 7b Phase 1 + Sprint 7b polish + Pre-work A demon→daemon rename + Beginner's Cave removal), (b) the canonical Force-I / Force-0 numbering and what it encodes, (c) the next pre-work or per-spell sprint per the approved roadmap.

---

## Where the work is (as of session end 2026-05-01)

### Shipped to prod (main `bb92d74`)

- **Sprint 7-vocab + Sprint 7a + Sprint 7b Phase 1 + Sprint 7b polishes** — INVOKE numeric effects (damage / heal / cure) actually fire. Howard-pastiche prose on every player-facing response. Potential-form spell descriptions. Dev-only `[DEV] <reason> not yet implemented` markers for unbuilt effects (no in-fiction camouflage over dev holes).
- **`SORCERY.md` §9** spec drops — Teleport rune system, Bless temple invocation + two room tags, Resurrection corpse model + hero exception.
- **§7.2 Force I / Force 0 numbering** — canonical asymmetric labels for the Two Fundamental Forces (Creative = the *one* that generates; Destructive = the *zero* that generates nothing).
- **Pre-work A — `demon` → `daemon` rename** (10 of 12 tracked files). Type-literal in `lib/gameData.ts` is now `"daemon"`; engine's `tags.includes("daemon")` aligned. No NPC currently uses the tag, so no data migration was needed.
- **Beginner's Cave deleted** — orphaned `cave_treasure` item gone; roadmap docs scrubbed; Aldric's adventures table now lists the three Thurian-PD contracts (Mirrors of Tuzun Thune, Serpent in the Court, Pictish Time-Tomb).

### Sorcery state on prod

- **`lib/sorcery/`** — `types.ts` + `registry.ts` (64 spells, all with potential-form descriptions) + `invoke.ts` + `effects.ts`.
- **Implemented effect kinds:** `damage` (per-spell `damageRoll`), `heal` (per-spell `healRoll`), `cure` (poison removal). Out-of-combat damage casts return `no-target` with metaphysical "transmuted fear and malice" prose; resources are spared.
- **Stubbed effect kinds:** `buff`, `debuff`, `summon`, `field`, `movement`, `conceal`, `reveal`, `transform`, `utility`, plus Resurrection's corpse model. All return `{ kind: "dev-not-implemented", reason }` rendered as `[DEV] <reason> not yet implemented` in dev play. Each removal is a per-spell sprint per the approved plan.
- **Tests:** 79/79 across 5 suites; typecheck clean.

### Two files left in working tree (uncommitted) from this session

These had pre-existing M state from prior sessions; my demon→daemon rename hunk is mixed in with their pre-existing edits, and I didn't bundle the prior-session work into a rename commit. Both are sitting in the working tree with the rename applied:

- **`lib/adventures/guild-hall-npcs.ts`** — rename hunk + a prior-session rewrite of Zim's heal-response (the "Beginner's Cave" line had already been replaced with "there's coin to be had in the field once you take a contract" — that change is still uncommitted).
- **`app/updates/page.tsx`** — rename hunk + a prior-session block of work (new "Latest Design Decision" featured update card + a background-image path change from `/updates-bg.jpg` to `/art/scenes/updates-bg.jpg`).

When you commit either of those files next session, both edits will go in together. That's fine; just be aware the rename is bundled.

### Next sprint per the approved plan

The plan at `~/.claude/plans/fluffy-bouncing-hanrahan.md` has the recommended order. **Pre-work B — Combat-UI 3-vs-3 position model** is next on the pre-work list (load-bearing for Wall of Stone and Mass Curse / Mass Dispel). After that, **Pre-work C** (semi-transparency sprite layer for Incognito + Invisibility) and **Pre-work F** (pantheon stub list — Mythras, Crom, +2-4 others from PD-safe Howard corpus).

Once pre-work clears, the per-spell sessions begin with **Sprint 7b.B — Bless** (foundational; lands the temp PICSSI/CHA buff layer + room tags inside its own sprint).

### Spec-to-canonical doc port pending

These canonical specs live ONLY in the plan file right now; they need to be ported into `SORCERY.md §9.4+` at the start of each per-spell sprint:

- **§9.4 Wall of Stone** — combat-positional barrier, 3-vs-3 layout, three boundary targeting options, circular caging, 5-turn duration.
- **§9.5 Summon Daemon** — live-NPC-target requirement, reverse-mode (cast on a live daemon = dispel + raise Illumination), and the rule that Dispel / Mass Dispel have **no effect on daemons** (Summon Daemon is the only spell that can dispel a daemon).
- **§9.6 Cunning / Feeblemind** — magical buffs/debuffs on the target's **spellcasting** (±33% spell strength + spell-success).
- **§9.7 Polymorph** — caster-size-class restriction (combat UI can't fit cross-size morphs).
- **§9.8 Create Food** — spawn-on-ground (`TAKE` to inventory), not auto-add.
- **§9.9 Incognito + Invisibility** — semi-transparency sprite render directive.
- **§9.10 Field spells share trap mechanics** — the field/trap unified entity model.
- **§9.11 Hero corpse persistence** — created on death, persists in world, can be buried/burned by the hero himself for **+Spirituality AND +Standing** (concealing the shame of failure), but cannot be resurrected (body goes cold too fast).
- **§9.12 Funeral rites + Spirituality** — `BURY <corpse>` (stamina cost) + `BURN <corpse>` (no stamina, requires hot flame source: campfire / pyre / Fire Field / Fireball residue). Both grant +Spirituality; hero-own-corpse grants +Spirituality AND +Standing.

### Deferred / dormant

- **Sprint 7b.S Summons + Sprint 7b.dispel + Sprint 7b.mass-dispel** — blocked on ally combat unblock (ally-combat is dormant per `project_ally_combat_flee_spec.md`).
- **Sprint 7c — Outer Dark narrative consequences** (low Illumination triggers different gods answering prayers, NPC reactions, patron whispers — narrative only, NOT a power amplifier per the canonical one-way rule).
- **Sprint 7d — The Order witness mechanic** — Phase 2 per spec.
- **Wardrobe Engine + painter-curation** — uncommitted, separate from sorcery work. Do not commit unless asked.

---

## Discipline / process notes (load-bearing)

- **Per-spell planning sessions, not one big sprint.** Scotch directive mid-plan: each spell that has design complexity gets its own focused planning session before implementation. The roadmap (`fluffy-bouncing-hanrahan.md`) is the *list* of sessions to run, not a single execution plan.
- **No in-fiction prose for unbuilt features.** Scotch principle: "Build the feature, the nothing will be gone. Do not create something to explain nothing." `[DEV] <reason> not yet implemented` markers are dead code by release; until then they shout. Don't paper over dev gaps with fictional prose.
- **One-way Illumination rule** (canonical, `SORCERY.md §7.1` + memory `feedback_no_illumination_amplification.md`). Powerful sorcery darkens the soul. A darkened soul does **not** boost spell power. Light and Dark are **poles of the PICSSI Illumination continuum**, not factions of beings.
- **Force I = Creative, Force 0 = Destructive.** The numbering encodes the asymmetry (1 generates, 0 generates nothing). Force I works anywhere; Force 0 (damage spells only) requires a foe to supply the duress/malice transmutation input.
- **Hydration discipline.** The most-recent-session block in CLAUDE_CONTEXT.md can lag actual repo state. Always run `git log --oneline --all --graph | head -20` and compare to what the doc claims is shipped. If the log shows a sprint commit the doc doesn't mention, treat the log as authoritative and update the doc before proceeding.
- **Spell descriptions are POTENTIAL form**, not declarative. *"Energy gathers to pull stone up from the earth in the shape of a wall"*, not *"Stone rises from the floor"*. The description sets up intent; the effect line resolves it.
- **Howard-pastiche voice** for player-facing INVOKE responses — sparse-mystical-archaic with sensory detail. Sample: *"You speak the Words and the Art rises to meet them — gathers, coils, seeks the transmuted fear and malice required to destroy life from which Magic Arrow is made..."*

---

## Standard sprint-ship workflow

```
git add <specific files>
git commit -m "Sprint NX: <what>"
git push origin dev
git stash push -u -m wip
git checkout main
git merge --no-ff dev -m "Merge Sprint NX"
git push origin main
git checkout dev
git stash pop
```

- Run typecheck before committing: `npx tsc --noEmit; echo exit=$?`
- Run quest tests: `npm run test:quests` (auto-discovers `__tests__/**/*.test.ts` recursively, including the sorcery suites)
- **Avoid bundling pre-existing M-state hunks into your sprint commit.** If a file you need to edit was already M at session start, surface the entanglement to Scotch rather than bundling unrelated work.

---

## Operational facts

- **Branch model:** `dev` is the working branch; `main` is what Vercel deploys. Always merge dev → main with `--no-ff`.
- **Prod DB:** Supabase. User has authorized prod migration pushes.
- **Vercel:** auto-deploys from `main`. Build failures are silent unless you check the dashboard.
- **Dev server:** runs on port **3001** (Docker holds 3000).
- **Date format:** when saving project memories, always convert relative dates to ISO. Today is **2026-05-01**.

---

## Files to know

### Sorcery (current state)

- `lib/sorcery/types.ts` — `Spell`, `Circle`, `ReagentId`, `EffectResult` (damage-dealt / healed / cure-applied / dev-not-implemented), `InvokeOutcome` (incl. `no-target`)
- `lib/sorcery/registry.ts` — 64 spells with potential-form descriptions, per-spell `damageRoll` / `healRoll` where applicable
- `lib/sorcery/invoke.ts` — `handleInvoke` (gate cascade) + `composeInvokeResponse` (Howard-pastiche renderer with branched success variants)
- `lib/sorcery/effects.ts` — `applyEffect` dispatcher; damage/heal/cure implemented; Phase-2 kinds return `dev-not-implemented` markers
- `__tests__/sorcery/sprint-7a.test.ts` — 23 cases (registry + parser + gate cascade + unlockCircle wiring)
- `__tests__/sorcery/sprint-7b.test.ts` — 20 cases (effect dispatch + composer + dev markers)

### Canonical specs

- `SORCERY.md` — §1–8 the system; §9.1–9.3 per-spell designs (Teleport / Bless / Resurrection); §7.1–7.2 cosmology
- `KARMA_SYSTEM.md` §2.10 — Illumination as a karma stock
- `GAME_DESIGN.md` §11 — PICSSI Illumination dimension
- `~/.claude/plans/fluffy-bouncing-hanrahan.md` — Sprint 7b Phase 2 roadmap (approved)

### Karma + quest engine (unchanged this session, listed for continuity)

- `lib/karma/recompute.ts` — applyKarma, clampPicssi, recomputeDerivedStats, logKarmaDelta. **Note: no temp PICSSI / attribute buff layer yet — Sprint 7b.B Bless will add it.**
- `lib/karma/combat-deltas.ts` — 13 combat-PICSSI rules; ally branches dormant
- `lib/quests/engine.ts` — registerQuest, getQuest, validateRegistry, acceptQuest, emitQuestEvent, completeStep, applyReward (10-channel fan-out incl. unlockCircle)
- `lib/quests/dialogue.ts` — multi-stage NPC dialogue resolver

### Combat (unchanged this session, but Sprint 7b.B+ will hook into it)

- `lib/combatTypes.ts` — `ActiveStatusEffect`, existing types include haste / shield_aura / invisible / feared_skip / numb_hand / hiccups / tongue_tied / marked_by_set + 9 injury types. `blessed` and other new spell-driven types arrive in the per-spell sprints.
- `lib/combatEngine.ts` — combat round resolution; status-effect hooks at `calculateEvasionChance`, `calculateShieldBlockChance`, armor-pen path; `tickStatusEffects` + out-of-combat tick in `tickWorldState`.

---

End of hydration prompt.
