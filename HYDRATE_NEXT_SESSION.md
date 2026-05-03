# Hydration prompt — next Living Eamon session

## Before you start the session

1. **Switch model to Sonnet** with `/model sonnet`. Save Opus for hard reasoning or design calls.
2. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
3. Confirm branch: `dev`. Latest committed on dev: **`918244c`** (Sprint 8h: THE WAY / WAY / TEACHINGS codex command).
4. **Uncommitted Sprint S2 work is staged in the working tree** — see "This session — S2 shipped (UNCOMMITTED)" below. Either commit it first or carry forward; do NOT bundle with a new sprint.
5. Paste the prompt below as your first message.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview. Reflects G1–G7, 7b.buffs, A/B/C, 8a–8h, S2.
3. **`~/.claude/plans/i-accidentally-submitted-the-misty-map.md`** — S1–S4 system sprint plan. S2 just shipped; S3 (Word system) and S4 (graphical travel) are next.
4. **`~/.claude/plans/zim-can-be-the-encapsulated-sunset.md`** — canonical Way-of-Thoth design.
5. **`~/.claude/plans/fluffy-bouncing-hanrahan.md`** — Sprint 7b Phase 2 roadmap.
6. **`~/.claude/plans/your-recommended-sprint-1-moonlit-taco.md`** — Sprint G epic. Fully shipped. No further work needed.
7. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index.

After reading, confirm hydration with one paragraph naming: (a) what was done in the most recent session (Sprint S2 PICSSI-location taxonomy + confirmed Zim's spells are guild magic), (b) what the next sprint options are, (c) what known follow-ups remain unticketed.

---

## Shipped state

### Committed to dev/main (latest: `918244c`)

**Sprint G — Living World epic (fully shipped)**
- G1–G7: Real-time clock, weather, residue, room damage, NPC repair (complete)

**Sprint 7b — Sorcery sub-sprints (fully shipped through 7b.buffs)**
- 25+ spells implemented across Circles 1–8

**Sprints A/B/C** — Persistence audit, critical-hit hardening, dev disclaimer

**Quest Engine (Sprints 8a–8h — FULLY COMPLETE)**
- 8h: THE WAY / WAY / TEACHINGS codex — 9-section growing in-fiction journal

**Design documentation (prior session, no code)**
- `lore/thurian-cartography/WORLD_LOCATIONS.md` — 30 named locations, full nation lore
- `lore/thurian-cartography/TRAVEL_MATRIX.md` — routes, zone danger, encounter tables, 23 scene-background prompts
- `lore/thurian-cartography/LOOT_TABLES.md` — 5-tier loot system, caravan tables, 6 Great Rune-Blades
- `public/art/living-eamon-map.png` — canonical travel screen background

### This session — S2 shipped (UNCOMMITTED)

**Sprint S2 — PICSSI ↔ location-type taxonomy** — code complete, all tests green, ready to commit.

| File | Change |
|---|---|
| `lib/roomTypes.ts` | Added `picssiContacts?: PicssiVirtue[]` to `Room` |
| `lib/karma/recompute.ts` | Added `PICSSI_LOCATION_MULTIPLIER = 1.5` + `scaleDeltaForRoom(delta, contacts)` helper |
| `lib/karma/resolve.ts` | `applyChoice` scales atom deltas by room contacts |
| `lib/karma/activities.ts` | `applyActivity` scales gain + loss deltas by room contacts |
| `lib/gameEngine.ts` | `applyCombatDeltas` and funeral handler scale by room contacts |
| `lib/adventures/guild-hall.ts` | 6 rooms tagged (see table below) |
| `__tests__/karma/picssi-locations.test.ts` | 14 tests, all passing |

**Tagged rooms:**
| Room | Tags |
|---|---|
| `church_of_perpetual_life` | `["spirituality"]` |
| `guild_courtyard` | `["standing"]` |
| `main_hall` | `["passion", "standing"]` |
| `notice_board` | `["integrity"]` |
| `mage_school` | `["illumination"]` |
| `shrine_of_maat` | `["spirituality", "integrity"]` |

Untagged: `sams_sharps`, `armory`, `guild_vault` (vendor rooms — no clean taxonomy fit).

**Mechanic:** when `applyKarma` fires in a room whose `picssiContacts` includes the virtue being adjusted, that virtue's delta is multiplied by 1.5× (rounded). Applied symmetrically to gains AND losses. The log records the scaled delta.

**Verification:** `npx tsc --noEmit` clean. `npx tsx __tests__/karma/picssi-locations.test.ts` → 14/14 passing. Existing suites green: 8e, 8f-zim, 8h-codex, persistence round-trip.

**To commit:**
```
git add lib/roomTypes.ts lib/karma/recompute.ts lib/karma/resolve.ts lib/karma/activities.ts lib/gameEngine.ts lib/adventures/guild-hall.ts __tests__/karma/picssi-locations.test.ts HYDRATE_NEXT_SESSION.md CLAUDE_CONTEXT.md
git commit -m "Sprint S2: PICSSI-location taxonomy + 1.5x multiplier"
git checkout main && git merge --no-ff dev -m "Merge Sprint S2"
git checkout dev
```

### Diagnostic finding — Zim's 13 spell IDs are CAST (guild magic), NOT sorcery

User asked to confirm whether the 13 spell IDs Zim teaches across scrolls 1–14 (`greater-heal`, `daylight`, `firebolt`, `haste`, `ward`, `detect`, `cleanse`, `shield`, `steelskin`, `silence`, `resist`, `mirror`, `banish`, `invoke-light`) are sorcery or guild magic.

**Confirmed: guild magic (CAST).** Evidence:
- `lib/gameState.ts:417` comment: `/** Official guild magic — autocomplete for CAST */` on `knownSpells`
- These are added to `knownSpells` (CAST), not `knownCircles` (INVOKE)
- SORCERY.md §2 lists the canonical 4 CAST spells (BLAST, HEAL, LIGHT, SPEED) and notes "Additional Guild spells planned for Phase 2" — these are exactly that
- They have plain English names, not Latin Words of Power
- Zim is a guild wizard, not an Adept

**TWO BUGS surfaced:**
1. **Case mismatch** — `lib/gameEngine.ts:3037` does `rest.toUpperCase()` before `knownSpells.includes(spellName)`, but quest rewards store IDs in lowercase (`"daylight"`). So `CAST DAYLIGHT` would fail with "You haven't learned DAYLIGHT" even after Zim teaches it.
2. **No mechanical handlers** — none of the 13 new CAST spells have implementations in `resolveCombatSpell` or anywhere else. They'd fall through to Jane (or fail at the case check first).

**Fix path** (own sprint when scheduled):
- Normalize lookup in CAST handler — either lowercase both sides or store uppercase in rewards
- Add mechanical handlers in `lib/combatEngine.ts:resolveCombatSpell` (or sibling) per spell
- Do NOT add these to `lib/sorcery/registry.ts`

---

## Sorcery state (post-7b.buffs)

**Implemented (25+ spells):** heal, magic-arrow, agility, strength, cure, harm, protection, bless, fireball, poison, teleport, mark, recall, gate-travel, wall-of-stone, resurrection, cunning, feeblemind, weaken, clumsy, curse, arch-protection, reactive-armor, night-sight, paralyze

**Remaining unimplemented per `fluffy-bouncing-hanrahan.md`:**
- **Unblocked now:** invisibility, reveal, create-food, telekinesis
- **Field spells + trap system:** fire-field, poison-field, energy-field, paralyze-field, magic-trap, remove-trap, dispel-field
- **Blocked on ally combat:** summon-creature, summon-air/fire/earth/water-elemental, summon-daemon, dispel, mass-dispel, blade-spirits
- **Combat attack spells:** magic-lock, unlock, mind-blast, energy-bolt, explosion, lightning, chain-lightning, flamestrike, mana-drain, mana-vampire, mass-curse, meteor-swarm, earthquake, energy-vortex
- **Transform:** polymorph (blocked on size-class model)

---

## Next sprint options (Scotch picks)

### Option 1 — Commit S2, then S3 (The Word system)
S2 is the natural prerequisite for S3 — Words sworn in Integrity-tagged rooms now carry stronger stakes via the multiplier. Per `i-accidentally-submitted-the-misty-map.md` §S3:
- Add `givenWords: Word[]` on PlayerState
- Hook `acceptQuest` to create a Word
- `OathPanel.tsx` (also serves S1's Tenets display)
- `applyPlayerDeath` must explicitly preserve `givenWords` across rebirth (per Scotch's directive)
- Mithras-blessed Words (rooms with `deity: "mithras"`) carry ×2 break-penalty
- New `lib/quests/words.ts` + `__tests__/quests/words.test.ts`

### Option 2 — Fix Zim's 13 CAST spells
Closes a real bug. Two parts:
- Normalize CAST handler lookup (case-insensitive)
- Add mechanical implementations for all 13 in `resolveCombatSpell`
- May need design pass for what each spell mechanically does (some are obvious, others — `mirror`, `banish`, `invoke-light` — need spec)

### Option 3 — S4 Graphical Travel system
All design docs complete (TRAVEL_MATRIX.md, LOOT_TABLES.md, WORLD_LOCATIONS.md). 7 sub-sprints:
- S4a: World-map data model + first painting
- S4b: Starting-city map (Ostavar)
- S4c: WorldMap.tsx + click-to-travel + confirm flow
- S4d: Travel-execution + progress bar + flavor rotation
- S4e: Travel-mode mechanics (walk/horse/ship/air/Gate)
- S4f: Encounter tables + flavor pools
- S4g: Pegasus introduction arc

### Option 4 — Sprint 7b Phase 3 (sorcery)
Invisibility + Reveal (unblocked), Create Food (trivial Circle 1 close), or Telekinesis. Each is its own per-spell planning session.

### Option 5 — Pre-generate travel scene backgrounds (art sprint)
23 Grok Imagine Pro scenes spec'd in `TRAVEL_MATRIX.md` with prompt seeds and priority order. Pure art, no code. Populates `public/art/scenes/travel/`. Can run parallel to any code sprint.

### Option 6 — S1 Tenets display
The 42 Oaths are authored in `lore/maatic-library/oaths-of-maat.md` but have no player-facing surface yet. Three deliverables: `READ OATHS` command, temple-wall LOOK branch, `OathPanel.tsx`. ~1–2 days. Could land alongside S3 since both need OathPanel.

---

## Known follow-ups not yet ticketed

- **Zim's 13 CAST spells broken** — case mismatch + no mechanical handlers (see "Diagnostic finding" above). Real bug; player can't actually cast anything Zim teaches.
- **CombatScreen dead `__CRITICAL__` detection** at `components/CombatScreen.tsx:732-734, 1025-1027`. Marker never injected; visual flash + crit wound + vignette never fire.
- **8f Wave 2+ rooms** (Chapel of the Lamp / Salt Marsh / Necropolis / Yssa's Cottage / Library Annex / Watchtower / Pre-Thurian Vault / Lighthouse) do not exist yet. Without these, 8e/8f NPCs (Sister Hela, Maelis, Cassian, etc.) have no home.
- **Three SH fragments** (SH 1.1 / 18.3 / 19.7) await remote-NPC assignment (Aldric, Vivian, Hokas).
- **Way codex §7 Black Vellum** is a stub. Khepratha / Lady Vela / The Anonym encounter flags not yet wired.
- **Ostavar map pin** not yet placed on `living-eamon-map.png` — currently treated as co-located with City of Wonders for route math; needs a final decision before S4 travel UI builds.
- **23 travel scene backgrounds** not yet generated — spec + Grok prompts in `TRAVEL_MATRIX.md`.
- **Rune-blade item IDs** not yet in `lib/gameData.ts` — blades are designed but have no code representation.
- **Beyond guild-hall: PICSSI taxonomy retro-tag** — only guild-hall rooms are tagged. Future adventure modules author tags from the start; revisit if more pre-existing rooms need tagging.

---

## Persistence state (unchanged since Sprint A)

**Single source of truth:** `players` row in Supabase. Canonical serializer: `lib/persistence/playerRecord.ts`.

**6-step checklist for adding a new persistent field:**
1. Define on `PlayerState` or `WorldState` in `lib/gameState.ts`
2. Add to serializer in `lib/persistence/playerRecord.ts`
3. Add column mapping in `savePlayer()` at `lib/supabase.ts`
4. Add deserializer line in load path at `app/api/chat/route.ts`
5. Write Supabase migration in `supabase/migrations/`; apply via Management API
6. Add round-trip test to `__tests__/persistence/round-trip.test.ts`

**Note:** S2 added no new persistent fields — `picssiContacts` lives on the static `Room` definition (in `lib/adventures/`), not `PlayerState`. No migration needed.

---

## Tests (all suites — confirm green before any sprint commit)

```
npx tsx __tests__/karma/picssi-locations.test.ts    # NEW — 14 cases, S2
npx tsx __tests__/quests/sprint-8e.test.ts
npx tsx __tests__/quests/sprint-8f-zim.test.ts
npx tsx __tests__/quests/sprint-8h-codex.test.ts
npx tsc --noEmit
```

All other suites:
- `sprint-7a.test.ts` — 23 cases
- `sprint-7b.test.ts` — 20 cases
- `sprint-7b-bless.test.ts` — 18 cases
- `sprint-7b-cunning.test.ts` — 12 cases
- `sprint-7b-teleport.test.ts` — 14 cases
- `sprint-7b-corpse.test.ts` — 12 cases
- `sprint-7b-wall.test.ts` — 11 cases
- `sprint-7b-poison.test.ts` — 10 cases
- `__tests__/persistence/round-trip.test.ts` — 12 cases
- `sprint-8h-codex.test.ts` — 24 cases

---

## Discipline / process notes

- **The game is in dev mode. No real users.** Schema changes, destructive migrations are safe.
- **Per-sprint planning sessions.** Each spell, each sub-sprint gets its own focused session.
- **Circle unlocks on scroll read, not Zim dialogue.**
- **`fireOnceKey` scoped to QuestState.scratch** (legacy-scope → survives rebirth).
- **Temp modifiers don't write through.** Values add at recompute time; never touch `picssi.*` base attributes.
- **`damagePerTurn` is canonical** on `ActiveStatusEffect` for per-round HP drain.
- **Spell descriptions are POTENTIAL form.** Howard-canon house style.
- **Quest codex is generic.** Future quests opt in via `Quest.codexCommands` + `Quest.codexRenderer`.
- **PICSSI multiplier is symmetric.** Gains and losses both scale 1.5× in tagged rooms.
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
- **Never bundle pre-existing M-state into a sprint commit.**
- **Never use apostrophes inside `<<'EOF'` heredoc bodies.**

---

## Operational facts

- **Branch model:** `dev` is working; `main` is Vercel deploy target. Always merge with `--no-ff`.
- **Dev server:** port **3001** (Docker holds 3000). Test with `curl http://localhost:3001/api/chat`.
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

## Key files

### S2 — PICSSI-location taxonomy (this session)
- `lib/roomTypes.ts` — `picssiContacts?: PicssiVirtue[]` on `Room`
- `lib/karma/recompute.ts` — `PICSSI_LOCATION_MULTIPLIER`, `scaleDeltaForRoom`
- `lib/karma/resolve.ts` — atom-choice scaling
- `lib/karma/activities.ts` — activity-gain/loss scaling
- `lib/gameEngine.ts` — combat + funeral scaling
- `lib/adventures/guild-hall.ts` — 6 rooms tagged
- `__tests__/karma/picssi-locations.test.ts` — 14 cases

### World Map & Travel System
- `lore/thurian-cartography/WORLD_LOCATIONS.md` — 30-location registry
- `lore/thurian-cartography/TRAVEL_MATRIX.md` — route matrix, zone danger, scene background spec
- `lore/thurian-cartography/LOOT_TABLES.md` — loot tiers, 6 Great Blades
- `public/art/living-eamon-map.png` — travel screen background

### Quest Engine
- `lib/quests/types.ts`, `lib/quests/engine.ts`, `lib/quests/dialogue.ts`, `lib/quests/log.ts`
- `lib/quests/codex.ts` — resolveCodexCommand dispatcher
- `lib/quests/lines/way-of-thoth.ts` — fully committed (8f + 8h)
- `lib/quests/lines/way-of-thoth-codex.ts` — 9-section codex renderer

### Persistence
- `lib/persistence/playerRecord.ts` — canonical serializer
- `lib/supabase.ts` — savePlayer() column mappings
- `app/api/chat/route.ts` — load path (lines 350–580)

### Living World (Sprint G)
- `lib/world/spellResidue.ts`, `lib/world/weather.ts`, `lib/world/roomDamage.ts`

### Sorcery
- `lib/sorcery/types.ts`, `lib/sorcery/registry.ts`, `lib/sorcery/invoke.ts`, `lib/sorcery/effects.ts`

### Canonical specs
- `SORCERY.md`, `KARMA_SYSTEM.md`, `GAME_DESIGN.md` §11
- `~/.claude/plans/i-accidentally-submitted-the-misty-map.md` — S1–S4 system sprints (S2 done)
- `~/.claude/plans/zim-can-be-the-encapsulated-sunset.md` — Way-of-Thoth design
- `~/.claude/plans/fluffy-bouncing-hanrahan.md` — Sprint 7b Phase 2 roadmap

---

End of hydration prompt.
