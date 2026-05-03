# Hydration prompt — next Living Eamon session

## Before you start the session

1. **Switch model to Sonnet** with `/model sonnet`. Save Opus for hard reasoning or design calls.
2. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
3. Confirm branch: `dev`. Latest committed on dev: **`6dff551`** (Sprint S4c: WorldMap component + currentNodeId persistence).
4. No uncommitted work. Working tree is clean on dev.
5. Paste the prompt below as your first message.

---

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview. Reflects G1–G7, 7b.buffs, A/B/C, 8a–8h, S1–S5.
3. **`~/.claude/plans/i-accidentally-submitted-the-misty-map.md`** — S1–S4 system sprint plan. S1–S3 are shipped; S4 (graphical travel) is next in that sequence.
4. **`~/.claude/plans/zim-can-be-the-encapsulated-sunset.md`** — canonical Way-of-Thoth design.
5. **`~/.claude/plans/fluffy-bouncing-hanrahan.md`** — Sprint 7b Phase 2 roadmap.
6. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index.

After reading, confirm hydration with one paragraph naming: (a) what was done in the most recent session (S4c WorldMap component — map tab in sidebar, node pins, edge lines, confirm modal, currentNodeId persistence), (b) what the next sprint options are, (c) what known follow-ups remain unticketed.

---

## Shipped state

### Committed to dev/main (latest: `c97e628`)

**Sprint G — Living World epic (fully shipped)**
- G1–G7: Real-time clock, weather, residue, room damage, NPC repair

**Sprint 7b — Sorcery sub-sprints (fully shipped through 7b.buffs)**
- 25+ spells implemented across Circles 1–8

**Sprints A/B/C** — Persistence audit, critical-hit hardening, dev disclaimer

**Quest Engine (Sprints 8a–8h — FULLY COMPLETE)**
- 8h: THE WAY / WAY / TEACHINGS codex — 9-section growing in-fiction journal

**Design documentation**
- `lore/thurian-cartography/WORLD_LOCATIONS.md` — 30 named locations, full nation lore
- `lore/thurian-cartography/TRAVEL_MATRIX.md` — routes, zone danger, encounter tables, 23 scene-background prompts
- `lore/thurian-cartography/LOOT_TABLES.md` — 5-tier loot system, caravan tables, 6 Great Rune-Blades
- `public/art/living-eamon-map.png` — canonical travel screen background

**Sprint S4a — World-map data model**
- `lib/world/travelNodes.ts` — `TravelNode` type + 19-node registry with (x,y) over map (origin, 6 cities, 5 POIs, 4 nation hubs, 3 wilderness)
- `lib/world/travelMatrix.ts` — `ZoneType` union (15 types), `DangerRating`, `TravelLeg` type; 30 authored legs covering all routes; `getLegsFrom` / `getLeg` / `getRouteZones` / `sceneIdForZone` helpers
- `lib/roomTypes.ts:AdventureModule` — extended with `locationId?`, `travelZones?`, `travelDays?`
- `lib/adventures/guild-hall.ts` — `GUILD_HALL` anchored to `valus` node

**Sprint S4c — WorldMap component**
- `PlayerState.currentNodeId: string` — default `"valus"`, persists across rebirth; DB column `current_node_id text default 'valus'` applied
- `components/WorldMap.tsx` — map painting + SVG dashed edge lines color-coded by danger + node pins (gold=current, danger-colored=reachable, gray=unreachable) + tooltips (travel mode/days/danger) + click-to-travel confirm modal
- `app/page.tsx` — "map" tab added to sidebar; WorldMap renders as `position:absolute` overlay in main area when tab active; close returns to stats

**Sprint S2 — PICSSI ↔ location-type taxonomy**
- `Room.picssiContacts?: PicssiVirtue[]` + `scaleDeltaForRoom()` at 4 karma chokepoints
- 6 guild-hall rooms tagged; 1.5× symmetric multiplier on matching virtue deltas

**Sprint S3 — The Word system**
- `PlayerState.givenWords: Word[]` — persists across rebirth
- `acceptQuest` creates a Word; `completeStep` fulfills it; `breakWord` applies scaled penalty
- Mithras-room ×2, Integrity-room ×1.5 baked at swear-time
- DB column `given_words jsonb` applied to Supabase

**Sprint S1+ — Tenets display + OathPanel Words section**
- `READ OATHS` command in Ma'at-consecrated rooms: returns litany + +2 Spirituality (first read only)
- LOOK branch in `shrine_of_maat`: hints `READ OATHS` verb
- `lib/oaths.ts` — 42 Oaths canonical data + `formatOathsLitany()`
- `OathPanel.tsx` extended with Words section (active/fulfilled/broken, Mithraic badge)

**Sprint S5 — Fix Zim CAST spells**
- `lib/gameEngine.ts:3045`: `rest.toUpperCase()` → `rest.trim().toLowerCase()` — case mismatch that made all 13 Zim spells uncallable is fixed
- `lib/combatEngine.ts`: 12 new entries in `SPELL_MANA_COST` + full switch cases:
  - `greater-heal` (8 mana) — 30–55 HP + Spirituality scaling, cures VD + poison
  - `firebolt` (6 mana) — 10–24 fire damage
  - `haste` (4 mana) — haste 4 rounds
  - `ward` (5 mana) — shield_aura 3 rounds
  - `steelskin` (5 mana) — protection_aura 3 rounds
  - `silence` (4 mana) — feared_skip on enemy (consumes immediately in enemy turn)
  - `resist` (4 mana) — protection_aura sev-2, 2 rounds
  - `mirror` (6 mana) — reactive_armor sev-2, 2 rounds
  - `banish` (7 mana) — ×2 damage vs undead/daemon NPC tags; normal otherwise
  - `invoke-light` (5 mana) — light damage + feared_skip vs undead/daemon
  - `daylight` (3 mana) — feared_skip vs undead/daemon; flavor-only vs others
  - `cleanse` (4 mana) — cures poison + bleed from player combatant
  - `detect` — out-of-combat only; routes to Jane (no combat handler, by design)
- Undead/daemon bonus paths (banish, invoke-light, daylight) are wired and activate as soon as any NPC gets `"undead"` or `"daemon"` tags in `lib/gameData.ts`
- 27 tests, all passing (`__tests__/spells/zim-cast.test.ts`)

---

## Design decision (this session)

**Hall of Two Truths is NOT an NPC surface.** Scotch corrected a note in the sprint plan that suggested the Hall might appear "for other beings — NPCs the hero kills, vision-quests, Mesektet voyages." That idea is deleted. Everything in the game is designed for players. The Hall of Two Truths is a cosmological aspiration the hero recites (Oath 42) and lives by — never a scene the player watches any other being pass through.

---

## Sorcery state (post-7b.buffs + S5)

**Guild spells (CAST) — implemented:**
- Original quartet: heal, blast, speed, power
- Zim's 13: greater-heal, daylight, firebolt, haste, ward, detect, cleanse, shield\*, steelskin, silence, resist, mirror, banish, invoke-light
- \*`shield` (the spell) is a Branch 8 reward — distinct from the EQUIP SHIELD command; no combat handler added yet (not in SPELL_MANA_COST — routes to Jane)

**Sorcery (INVOKE) — implemented (25+ spells):** heal, magic-arrow, agility, strength, cure, harm, protection, bless, fireball, poison, teleport, mark, recall, gate-travel, wall-of-stone, resurrection, cunning, feeblemind, weaken, clumsy, curse, arch-protection, reactive-armor, night-sight, paralyze

**Remaining unimplemented per `fluffy-bouncing-hanrahan.md`:**
- **Unblocked now:** invisibility, reveal, create-food, telekinesis
- **Field spells + trap system:** fire-field, poison-field, energy-field, paralyze-field, magic-trap, remove-trap, dispel-field
- **Blocked on ally combat:** summon-creature, summon-air/fire/earth/water-elemental, summon-daemon, dispel, mass-dispel, blade-spirits
- **Combat attack spells:** magic-lock, unlock, mind-blast, energy-bolt, explosion, lightning, chain-lightning, flamestrike, mana-drain, mana-vampire, mass-curse, meteor-swarm, earthquake, energy-vortex
- **Transform:** polymorph (blocked on size-class model)

---

## Next sprint options (Scotch picks)

### Option 1 — S4 Graphical Travel system (multi-sprint epic)
All design docs complete. Sub-sprints:
- ~~**S4a** — World-map data model~~ ✓ **SHIPPED** (`lib/world/travelNodes.ts` + `travelMatrix.ts`)
- ~~**S4c** — `WorldMap.tsx` component~~ ✓ **SHIPPED** (map tab, node pins, edge lines, confirm modal)
- **S4b** — Starting-city map for Valus (Ultima-style top-down, Grok-Imagine-Pro)
- **S4d** — Travel execution: progress bar, flavor rotation, encounter pause
- **S4e** — Travel-mode mechanics: walk/horse/ship/air/Gate, guide-hire
- **S4f** — Encounter tables + flavor pools per region
- **S4g** — Pegasus introduction arc

### Option 2 — Sprint 7b Phase 3 (sorcery)
Unblocked spells: invisibility, reveal, create-food, telekinesis. Each is its own focused sprint.

### Option 3 — Zim's `shield` spell combat handler
Branch 8 rewards `"shield"` (the spell ID) but `SPELL_MANA_COST` has no entry for it — it falls through to Jane in combat. Add a mechanical handler: applies `shield_aura` + costs mana, similar to Ward but with a different flavor. One-session fix.

### Option 4 — CombatScreen `__CRITICAL__` detection fix
Dead detection code at `components/CombatScreen.tsx:732-734, 1025-1027`. The `__CRITICAL__` marker is never injected by the combat engine, so the visual flash + critical wound + vignette never fire. Fix: inject the marker from `combatEngine.ts` when a critical wound lands.

### Option 5 — Pre-generate travel scene backgrounds (art sprint)
23 Grok Imagine Pro scenes spec'd in `TRAVEL_MATRIX.md` with prompts and priority order. Populates `public/art/scenes/travel/`. Pure art, no code. Can run parallel to any code sprint.

### Option 6 — Wave 2 rooms (8f follow-up)
Chapel of the Lamp, Salt Marsh, Necropolis, Yssa's Cottage, Library Annex, Watchtower, Pre-Thurian Vault, Lighthouse do not exist yet. Without them, 8e/8f NPCs (Sister Hela, Maelis, Cassian, etc.) have no home rooms.

---

## Known follow-ups not yet ticketed

- **Zim `shield` spell has no combat handler** — falls through to Jane; fix is one switch case in combatEngine (see Option 3 above)
- **CombatScreen dead `__CRITICAL__` detection** — `components/CombatScreen.tsx:732-734, 1025-1027`. Marker never injected; crit visual never fires.
- **8f Wave 2+ rooms** — Sister Hela / Maelis / Cassian etc. have no home rooms yet (Chapel of the Lamp, Salt Marsh, Necropolis, Yssa's Cottage, etc.)
- **Three SH fragments** (SH 1.1 / 18.3 / 19.7) await remote-NPC assignment (Aldric, Vivian, Hokas)
- **Way codex §7 Black Vellum** is a stub — Khepratha / Lady Vela / The Anonym flags not yet wired
- **Valus map pin** not yet placed on `living-eamon-map.png` — needed before S4 travel UI (node id `valus` at pixel 600, 530)
- **23 travel scene backgrounds** not yet generated — spec + prompts in `TRAVEL_MATRIX.md`
- **Rune-blade item IDs** not yet in `lib/gameData.ts`
- **NPC undead/daemon tags** not yet applied — `banish`, `invoke-light`, `daylight` bonus paths are wired but dormant until any NPC gets `tags: ["undead"]` or `tags: ["daemon"]` in `lib/gameData.ts`
- **Beyond guild-hall: PICSSI taxonomy retro-tag** — only guild-hall rooms tagged; future modules author tags from the start

---

## Persistence state (unchanged since Sprint A + S3 migration)

**Single source of truth:** `players` row in Supabase. Canonical serializer: `lib/persistence/playerRecord.ts`.

**6-step checklist for adding a new persistent field:**
1. Define on `PlayerState` or `WorldState` in `lib/gameState.ts`
2. Add to serializer in `lib/persistence/playerRecord.ts`
3. Add column mapping in `savePlayer()` at `lib/supabase.ts`
4. Add deserializer line in load path at `app/api/chat/route.ts`
5. Write Supabase migration in `supabase/migrations/`; apply via Management API
6. Add round-trip test to `__tests__/persistence/round-trip.test.ts`

---

## Tests (all suites — confirm green before any sprint commit)

```
npx tsx __tests__/spells/zim-cast.test.ts          # S5 — 27 cases
npx tsx __tests__/oaths/sprint-s1.test.ts          # S1+ — 9 cases
npx tsx __tests__/quests/words.test.ts             # S3 — 12 cases
npx tsx __tests__/karma/picssi-locations.test.ts   # S2 — 14 cases
npx tsx __tests__/quests/sprint-8e.test.ts
npx tsx __tests__/quests/sprint-8f-zim.test.ts
npx tsx __tests__/quests/sprint-8h-codex.test.ts
npx tsx __tests__/persistence/round-trip.test.ts
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
- `sprint-7b-buffs.test.ts` — passing
- `combat/barriers.test.ts` — passing

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
- **Guild spells stored lowercase** in `knownSpells` (e.g. `"greater-heal"`). `SPELL_MANA_COST` keys are uppercase; `resolveCombatSpell` does `.toUpperCase()` internally. Never store them uppercase.
- **Hall of Two Truths is player-only cosmology.** Not an NPC experience surface. Not a game mechanic for other beings. Oath 42 is an aspiration the hero recites, not a scene anyone else passes through.
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

### S5 — Zim CAST spell fix (this session)
- `lib/gameEngine.ts:3045` — lowercased spell lookup (the fix)
- `lib/combatEngine.ts` — `SPELL_MANA_COST` + 12 new switch cases
- `__tests__/spells/zim-cast.test.ts` — 27 cases

### S4c — WorldMap component
- `components/WorldMap.tsx` — map painting + SVG edges + node pins + confirm modal
- `lib/world/travelNodes.ts` + `travelMatrix.ts` — data backing the component
- `lib/gameState.ts` — `PlayerState.currentNodeId: string`
- `app/page.tsx:1560` — WorldMap overlay conditional + map tab

### S2 — PICSSI-location taxonomy
- `lib/roomTypes.ts` — `picssiContacts?: PicssiVirtue[]` on `Room`
- `lib/karma/recompute.ts` — `PICSSI_LOCATION_MULTIPLIER`, `scaleDeltaForRoom`
- `lib/karma/resolve.ts` — atom-choice scaling
- `lib/karma/activities.ts` — activity-gain/loss scaling
- `lib/adventures/guild-hall.ts` — 6 rooms tagged

### S3 — Word system
- `lib/quests/words.ts` — `Word` interface, `createWord`, `fulfillWord`, `breakWord`
- `lib/quests/engine.ts` — `acceptQuest` + `completeStep` hooks
- `lib/gameState.ts` — `givenWords: Word[]` on PlayerState; preserved in `applyPlayerDeath`
- `supabase/migrations/20260506000000_s3_given_words.sql` — applied

### S1+ — Tenets display
- `lib/oaths.ts` — 42 Oaths data + `formatOathsLitany()`
- `components/OathPanel.tsx` — PICSSI scores + Words section + 42 Oaths litany
- `lib/gameEngine.ts` — READ OATHS handler + LOOK branch

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

### Canonical specs
- `SORCERY.md`, `KARMA_SYSTEM.md`, `GAME_DESIGN.md` §11
- `~/.claude/plans/i-accidentally-submitted-the-misty-map.md` — S1–S4 system sprints (S1–S3 done)
- `~/.claude/plans/zim-can-be-the-encapsulated-sunset.md` — Way-of-Thoth design
- `~/.claude/plans/fluffy-bouncing-hanrahan.md` — Sprint 7b Phase 2 roadmap

---

End of hydration prompt.
