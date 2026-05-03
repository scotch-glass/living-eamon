# Hydration prompt — next Living Eamon session

## Before you start the session

1. **Switch model to Sonnet** with `/model sonnet`. Opus 4.7 1M burns through quota fast on routine sprint work. Save Opus for hard reasoning or design calls; use Sonnet for editing, refactoring, file moves, commits, doc writes.
2. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
3. Confirm branch: `dev`. Latest main commit at session start should be **`60fc633`** (Merge Sprint 7b.poison).
4. All sprints below are **fully committed and merged to main** — nothing to commit first thing this session.
5. Paste the prompt below as your first message.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order, no exploration agents needed:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview. Update the "Most recent session" block after confirming what shipped.
3. **`SORCERY.md` §9** — canonical per-spell design notes. §9.1 Teleport family. §9.2 Bless. §9.3 Resurrection. §7.1–7.2 Illumination one-way rule + Force I/Force 0 numbering.
4. **`~/.claude/plans/fluffy-bouncing-hanrahan.md`** — Sprint 7b Phase 2 roadmap. Next per-spell sprints are the stat-buff/debuff family (Strength, Agility, Clumsy, Weaken) and Paralyze.
5. **`~/.claude/plans/i-accidentally-submitted-the-misty-map.md`** — system-sprint roadmap (S1 shipped; S2 PICSSI-location taxonomy, S3 The Word system, S4 Graphical Travel deferred with seeds in memory).
6. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index.

After reading, confirm hydration with one paragraph naming: (a) what shipped last session (Sprint 7b.cunning/feeblemind, 7b.R corpse + Resurrection, 7b.wall-of-stone, 7b.poison + damagePerTurn rename), (b) what infrastructure those sprints left standing, (c) the next sprint per the approved roadmap.

---

## Where the work is (as of session end 2026-05-03)

### Committed to main (`60fc633`)

- **Pre-work B** — combat 3-vs-3 position model + barrier infrastructure.
- **Pre-work C** — Incognito dropped; Invisibility semi-transparency render complete.
- **Pre-work F** — `lore/pantheon/PANTHEON.md` + `lore/maatic-library/oaths-of-maat.md` (42 Oaths) + 8 math-magic books.
- **S1** — `components/OathPanel.tsx` (42 Oaths inline + PICSSI summary; 4th sidebar tab "oaths"). `app/page.tsx` wired.
- **Sprint 7b.B** — Bless. Temp buff layer + room tags + temple reagent waiver.
- **Sprint 7b.T** — Teleport family (Mark, Teleport, Recall, Gate Travel). Rune stones as inventory items with `runeBinding`.
- **Sprint 7b.cunning + 7b.feeblemind** — Cunning self-buff (+33% spell strength/success), Feeblemind enemy debuff (−33%). `spell_strength` / `spell_success` TempModifierStats. `spellStrengthMult()` helper scales damage + heal rolls.
- **Sprint 7b.R** — Corpse system, BURY/BURN, Resurrection. `Corpse` in `WorldState.corpses`. 48-turn day/night cycle. Sun/moon exposure tick. BURY (20 stamina) + BURN (flame-source gated). Resurrection full validation chain. Dead enemy dims + shadow blob in `CombatScreen.tsx`.
- **Sprint 7b.wall-of-stone** — Wall of Stone (`Crea Mur`, Circle 3). Combat-only (no-target out of combat). Places `stone-wall` Barrier at boundary 0 for 10 turns. Re-cast refreshes. `isCrossingBarrier` + `tickBarriers` already wired in combat engine (Pre-work B).
- **Sprint 7b.poison** — Poison (`Crea Tox`, Circle 3). Applies persistent severity-2 poison (4 HP/turn) to active enemy. Combat-only (no-target out of combat). `bleedPerTurn → damagePerTurn` rename across all call sites.

### Sorcery state (on main)

**Effect dispatcher (`lib/sorcery/effects.ts`):**
- `damage` → `applyDamage` (scales by `spellStrengthMult`)
- `heal` → `applyHealOrCure` + `applyResurrection`
- `buff` → `applyBless`, `applyCunning`; others → `dev-not-implemented`
- `debuff` → `applyFeeblemind`, `applyPoison`; others → `dev-not-implemented`
- `field` → `applyWallOfStone`; others → `dev-not-implemented`
- `movement` → `applyMovement` (Teleport/Recall/Gate Travel)
- `utility` → `applyMark`; others → `dev-not-implemented`
- `summon`, `reveal`, `conceal`, `transform` → `dev-not-implemented`

**EffectResult variants (all implemented):** `damage-dealt`, `healed`, `cure-applied`, `blessed`, `cunning-applied`, `feeblemind-applied`, `resurrected`, `resurrection-rejected` (5 reason variants), `marked`, `teleported`, `recalled`, `gate-opened`, `wall-erected`, `poison-applied`, `dev-not-implemented`.

**Key infra layers:**
- `TempModifier` + `tempModifiers: TempModifier[]` on `PlayerState`; tick in `tickWorldState`
- `TempModifierStat`: `"illumination" | "charisma" | "spell_strength" | "spell_success"`
- `spellStrengthMult(state)` in effects.ts — sums `spell_strength` deltas → multiplier
- `StatusEffectType` includes: `"blessed" | "cunning" | "feeblemind" | "poison"` (+ prior combat injuries)
- `ActiveStatusEffect.damagePerTurn` (renamed from `bleedPerTurn`) — shared by bleed and poison
- `Corpse` interface + `WorldState.corpses: Record<string, Corpse>`
- `creatureKind?: CreatureKind` + `corpseImageUrl?: string` on NPC def
- `isDay(worldTurn)` — 48-turn cycle, day = turn % 48 < 24
- `Barrier` interface + `barriers: Barrier[]` on `ActiveCombatSession`
- `isCrossingBarrier()` + `tickBarriers()` in `lib/combat/barriers.ts`

**Tests:** 9 suites, all passing. Typecheck clean.
- `sprint-7a.test.ts` — 23 cases
- `sprint-7b.test.ts` — 20 cases
- `sprint-7b-bless.test.ts` — 18 cases
- `sprint-7b-cunning.test.ts` — 12 cases
- `sprint-7b-teleport.test.ts` — 14 cases
- `sprint-7b-corpse.test.ts` — 12 cases
- `sprint-7b-wall.test.ts` — 11 cases
- `sprint-7b-poison.test.ts` — 10 cases

### Next sprints per the approved plan

**Sprint 7b.stat-debuffs — Clumsy + Weaken**
Both are Circle 1/2 enemy debuffs targeting `dexterity` and `strength` respectively. Pattern: add `"clumsy"` and `"weaken"` to `StatusEffectType`; apply to `enemyCombatant.activeEffects`; wire the combat engine to read them when computing enemy hit chance (Clumsy) and damage output (Weaken). Requires reading the combat engine hit/damage paths carefully before implementing.

**Sprint 7b.stat-buffs — Strength + Agility (self-buffs)**
Both are Circle 3 self-buffs. `Strength` → +STR, raises maxHP. `Agility` → +DEX/agility, raises evasion. Requires extending `TempModifierStat` with `"strength"` and `"dexterity"`, and reading those mods in the combat engine when the player combatant's stats are consulted. Key question: do we modify `playerCombatant.strength`/`.dexterity` at cast time (sync into session), or does the combat engine read `tempModifiers` at round-resolve time? Decide before implementing.

**Sprint 7b.paralyze — Paralyze**
Circle 6 debuff (`Ten Cor`). "Freezes target; broken by damage." Needs a new `"paralyze"` status that blocks enemy turns in the combat loop — when the enemy's turn comes and they have `paralyze` active, the round returns without an enemy strike. Broken by any incoming damage (check in the strike-resolution path).

**Alternative pivot:** S2 (PICSSI-location taxonomy), S3 (The Word system), or S4 (Graphical Travel) — each per `~/.claude/plans/i-accidentally-submitted-the-misty-map.md`. None block on sorcery; Scotch chooses the order.

### Pre-existing uncommitted M-state (from prior sessions — DO NOT commit without explicit instruction)

Many files in the working tree were already M at the start of session. Notable ones:
- `app/updates/page.tsx` — prior-session work.
- `lib/adventures/guild-hall-npcs.ts` — prior-session Zim heal-response rewrite.
- `CLAUDE.md`, `app/layout.tsx`, `app/splash/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`, `app/legal/page.tsx` — pre-existing from wardrobe / UI work.
- Wardrobe Engine (`lib/wardrobe/`, `app/api/wardrobe/`, `lib/weaponCarry.ts`, etc.) — dormant.

Surface these to Scotch before bundling into any commit.

---

## Discipline / process notes (load-bearing)

- **Per-spell planning sessions, not one big sprint.** Each spell with design complexity gets its own focused planning session before implementation.
- **No in-fiction prose for unbuilt features.** `[DEV] <reason> not yet implemented` markers are dead code by release.
- **One-way Illumination rule** (`SORCERY.md §7.1`). Powerful sorcery darkens the soul; a darkened soul does NOT boost spell power.
- **Force I = Creative, Force 0 = Destructive.** Damage spells need a foe (Force 0). Field spells that are combat-only use `no-target` (not `dev-not-implemented`) when cast outside combat.
- **Temp modifiers don't write through.** `TempModifier` values add to effective stats at recompute time without touching `picssi.*` or base attributes.
- **`damagePerTurn` is the canonical field name** on `ActiveStatusEffect` for per-round HP drain — shared by bleed and poison; the narrative in `tickStatusEffects` differentiates by `effect.type`.
- **Poison severity tiers:** 1=2/t, 2=4/t (Poison spell), 3=6/t (Poison Field), 4=8/t.
- **Hydration discipline.** `git log --oneline --all --graph | head -20` is authoritative over any doc.
- **Spell descriptions are POTENTIAL form.** *"The Art reaches for the veins, ready to bloom black flowers..."* not *"Black flowers bloom."* — potential, not consummated, until cast.

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
- Run tests: `npx tsx __tests__/sorcery/<suite>.test.ts`
- **Never bundle pre-existing M-state into a sprint commit.**

---

## Operational facts

- **Branch model:** `dev` is the working branch; `main` is what Vercel deploys. Always merge dev → main with `--no-ff`.
- **Prod DB:** Supabase. User has authorized prod migration pushes.
- **Vercel:** auto-deploys from `main`. Build failures are silent unless you check the dashboard.
- **Dev server:** runs on port **3001** (Docker holds 3000).
- **Date format:** when saving project memories, always convert relative dates to ISO. Today is **2026-05-03**.

---

## Files to know

### Sorcery (current state)

- `lib/sorcery/types.ts` — `Spell`, `Circle`, `ReagentId`, `EffectResult` (15 variants), `InvokeOutcome`
- `lib/sorcery/registry.ts` — 63 spells across 8 Circles
- `lib/sorcery/invoke.ts` — `handleInvoke` + `composeInvokeResponse`; INVOKE arg parsing for rune labels + Resurrection target
- `lib/sorcery/effects.ts` — `applyEffect` dispatcher; damage/heal/cure/Bless/Cunning/Feeblemind/Resurrection/Mark/Teleport/Recall/Gate/WallOfStone/Poison implemented
- `lib/combat/barriers.ts` — `isCrossingBarrier` + `tickBarriers`
- `lib/gameState.ts` — `Corpse`, `CreatureKind`, `isDay()`, `TempModifier`, `TempModifierStat`; `WorldState.corpses`

### Tests (all passing)

`__tests__/sorcery/` — 9 suites. Run individually with `npx tsx __tests__/sorcery/<name>.test.ts`.

### Canonical specs

- `SORCERY.md` — §1–8 the system; §9.1–9.3 per-spell designs; §7.1–7.2 cosmology
- `KARMA_SYSTEM.md` §2.10 — Illumination as a karma stock
- `GAME_DESIGN.md` §11 — PICSSI Illumination dimension
- `lore/pantheon/PANTHEON.md` — full deity roster
- `lore/maatic-library/oaths-of-maat.md` — 42 Oaths
- `~/.claude/plans/fluffy-bouncing-hanrahan.md` — Sprint 7b Phase 2 roadmap
- `~/.claude/plans/i-accidentally-submitted-the-misty-map.md` — S1–S4 system sprints

### Karma + quest engine (unchanged this session)

- `lib/karma/recompute.ts` — `applyKarma`, `clampPicssi`, `recomputeDerivedStats`, `logKarmaDelta`
- `lib/karma/combat-deltas.ts` — 13 combat-PICSSI rules; ally branches dormant
- `lib/quests/engine.ts` — `registerQuest`, `acceptQuest`, `emitQuestEvent`, `completeStep`, `applyReward`

---

End of hydration prompt.
