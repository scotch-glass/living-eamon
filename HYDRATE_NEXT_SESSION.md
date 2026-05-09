# Hydration prompt — next Living Eamon session

## Status of the previous session (2026-05-09)

Marathon session that built on top of the previous session's Combat Arena v2 skeleton, then expanded sideways into spell-registry cleanup, effect wiring, terminology refactor, and a full-system PLAN for the PRAY spell + divinity system. Nothing has been committed yet — all changes still unstaged on `dev`. Tip is still `dcada39`.

### Shipped this session

**Corpse marker polish** ([components/CombatArena.tsx](components/CombatArena.tsx), [public/art/corpse-marker/](public/art/corpse-marker/), [scripts/trim-corpse-markers.ts](scripts/trim-corpse-markers.ts), [scripts/forge-corpse-marker.ts](scripts/forge-corpse-marker.ts))
- Trimmed transparent padding from all 6 PNGs (2048² → 1.5–2k × 1.3–1.8k) so the rendered 120 px box maps 1:1 to visible content. New `trim-corpse-markers.ts` is idempotent and reusable; `sharp.trim()` step baked into the forge script for future re-rolls.
- `CORPSE_STACK_OVERLAP_RATIO` 0.2 → 0.5 — corpses now stack with 50% overlap.
- Z-stuck-floating fix: ref-counted `bumpStrikeZ` / `releaseStrikeZ` (WeakMap) so overlapping animations restore to ORIGINAL z, not bumped value. Plus `setTimeout` safety net at duration+200 ms.
- Lane refs prune stale entries (deathOrderRef + lastCenterRef) on each render — fixes the "corpse stacks on invisible base" bug that hit on Reset / HMR.
- Corpse tooltip pool grew from 28 → 48 entries (added 20 new "Crom laughs at X / X rode into the dark / steel could not save X / etc." variations). Updated comment to allow Crom (Cimmerian/Cimmeria stay radioactive).

**Combat Arena v2 strike + spell FX sprint** ([components/CombatArena.tsx](components/CombatArena.tsx), [lib/combat/engine.ts](lib/combat/engine.ts), [app/dev/combat-arena/page.tsx](app/dev/combat-arena/page.tsx))
- New `firedStrike` discriminator on `ActionResult` — `{ sourceId, targetId, zone, outcome, damage }`. Outcome priority: criticalFail > evaded > blocked > armorStopped > crit > hit. Source of truth for FX gating.
- `<StrikeFxLayer>` drives source lunge (full traversal w/ 30% target-overlap clamp), target reaction (axial knockback / dodge / recoil), zone-anchored hit-flash (head/neck/torso/limbs vertical anchor), crit gore (dual-burst + 4 droplets fanning ±25° along strike axis).
- Strike timing: lunge-in 300 ms → 2 s hold AT target → lunge-out 300 ms (total 2.6 s). Hit-flash + gore fire at +0.1 s after arrival (= 0.4 s into the strike).
- Dodge revised: shrink to 0.92 + pitch toward attacker (rotate ±8°, sign by source/target screen position). Rotate placed BEFORE `scaleX(-1)` in transform list so flipped sprites pitch in the correct VISUAL direction.
- BLAST gets a smoke-wisp aftermath (two staggered dark-grey puffs rising 100 px while fading, 1.0–1.2 s).
- New `SlotDamagePopup` — fires on ANY HP loss (not just strikes), renders `<X> HP damage` in red above target's head, drifts 110 px / fades / shrinks over 3 s. Crit annotation `Critical hit!` in orange when `lastStrike.targetId === c.id && outcome === "crit"`.
- AI 5-sec pacing remains; total strike anim (2.6 s) fits comfortably.
- Z-bump WeakMap ref-counting (above) prevents the "sprite stuck above hotbar" bug on overlapping strikes.
- Bug fixes: flip-mirror direction (translate placed BEFORE scaleX(-1)), vertical-floating bug (use horizontal-only translate).
- Tests: extended [__tests__/combat/c3-actions.test.ts](__tests__/combat/c3-actions.test.ts) with 3 firedStrike cases.

**Spell registry purge** ([lib/combat/spellData.ts](lib/combat/spellData.ts), [lib/combat/engine.ts](lib/combat/engine.ts))
- Removed entirely: **POWER, DAYLIGHT, MIRROR, BANISH, INVOKE-LIGHT** (all had blocker effects with no functional read). Stripped from `SPELL_DATA`, `COMBAT_HANDLER_SPELLS`, `OFFENSIVE_SPELLS`, both spell switches (multi-combatant + legacy), `rollPowerOutcome` helper + `POWER_OUTCOMES` table. Removed from page hero `knownSpells`. Removed `<DaylightBeam>` component + `lastDaylight` FX state. Removed POWER aura mount. Test suites updated (cardinality 13 → 11; MIRROR-using tests now use FIREBOLT).

**Effect implementations — closed the audit gaps**
- **steelskin** (revised per Scotch) — halves all incoming physical damage for **4 turns** (passive; NOT consumed on first hit). Read in [lib/combat/engine.ts:386-388](lib/combat/engine.ts#L386).
- **ward** — flat **−8 damage absorbed per hit per severity**. Read in [lib/combat/engine.ts:392](lib/combat/engine.ts#L392).
- **resist_elemental** — halves BLAST/FIREBOLT damage. Read in the BLAST + FIREBOLT spell handlers.
- **pierced_lung** — **−25% outgoing strike damage per severity** (attacker side). Major chest wound.
- **cracked_ribs** — **−10% outgoing strike damage per severity** (attacker side). Torso pain.
- Strike-resolver damage chain order: `crit doubling → weakened (atk) → protection_aura (def) → pierced_lung (atk) → cracked_ribs (atk) → steelskin (def, halve) → ward (def, −8/sev)`.

**HASTE rewired** (Scotch direct spec)
- Now grants **+1 action per round for 2 rounds AND +3 DEX for the duration** — net `+2 free actions over 2 rounds` after paying the 1-turn cast cost.
- Sets a single `haste_extra_action` effect (no longer also stacks `haste`). The `haste` effect with "+10 dexterity / Feet like wings" stays on SPEED + stamina_brew.
- New round-wrap logic in `advanceTurn`: any combatant with `haste_extra_action.turnsRemaining > 0` post-tick gets a SECOND consecutive slot inserted in `turnOrder`. With `turnsRemaining: 3` at cast, this fires for round-2 + round-3 then expires.
- New `effectiveCombatantDex(c)` helper bumps DEX by `+3 × severity` for any active `haste_extra_action`. Plugged into `calculateEvasionChance` (defender + attacker terms) and `rollInitiativeOrder`'s `getDexReactionBonus` call. Dynamic — reads activeEffects, no permanent stat mutation.
- TurnRail key fix: `key={\`${id}-${i}\`}` in both v2 + v1 turn rails so the duplicate id from haste's extra slot doesn't trigger React warnings.
- Tests: ally-buff + c3-actions both green.

**`agility` → `dexterity` project-wide refactor** (legacy terminology cleanup)
- `CombatantState.agility` field DELETED. `dexterity` becomes the single combat stat — encumbrance penalty is now baked into `c.dexterity` at `buildCombatantFromPlayer` time (was previously `c.agility`).
- `NPCCombatProfile.agility` → `dexterity`.
- Sorcery spell renamed: id `agility` → `dexterity`, name "Agility" → "Dexterity", helper `applyAgilityBuff` → `applyDexterityBuff`, effect kind `agility-applied` → `dexterity-applied`, TempModifier source `agility` → `dexterity`. spellResidue map key renamed.
- Narrative + UI strings: `+10 agility` → `+10 dexterity`; "Feet like wings" stays; popup `STR / DEX / AGI` → `STR / DEX`; tutorial dialogue ("costs you agility" → "costs you dexterity"); narrationPools `surprising agility` → `surprising speed`.
- Save-data load fallback removed at [app/api/chat/route.ts:293](app/api/chat/route.ts#L293) (no production saves to protect per `project_no_live_game.md`).
- All test fixtures updated (8 files). Stale tests for the removed MIRROR/BANISH/DAYLIGHT spells in [__tests__/spells/zim-cast.test.ts](__tests__/spells/zim-cast.test.ts) also stripped (pre-existing debt that surfaced).

**CombatantInfoPopup overhaul** ([components/combat/CombatantInfoPopup.tsx](components/combat/CombatantInfoPopup.tsx))
- Effect chips replaced with structured panels: human-readable label (`Pierced Lung` not `pierced_lung`), severity multiplier, turns remaining, AND description. Color-coded by effect color from `EFFECT_ICON_MAP`.
- Stale effect descriptions refreshed in [lib/combat/effectIconData.ts](lib/combat/effectIconData.ts) (pierced_lung / cracked_ribs / ward / steelskin / resist_elemental / haste_extra_action all updated to reflect shipped mechanics).
- Weapon row now shows `<weaponName> · <damage>` (e.g., `Long Sword · 1d12+4`) — pulled from `WEAPON_DATA[c.weaponId].damage`.
- Deferred Chronicle placeholder section reserves space at the bottom for the future per-companion log (backstory, kills, lives saved, heals given). Panel is now `maxHeight: min(86vh, 720px); overflowY: auto` so it scrolls when the Chronicle ships.

**Spell-lore sync banners** ([lib/combat/engine.ts](lib/combat/engine.ts))
- ⚠️ banner above `applyCombatSpellEffect` reminding to update `sharedWidgets.tsx` + `CombatScreen.tsx` whenever a spell mechanic changes.
- ⚠️ banner above the consumable item switch reminding to update item lore (item-icon hover / inventory tooltip / shop blurbs) when a consumable mechanic changes.

**Spell descriptions updated** ([components/combat/sharedWidgets.tsx](components/combat/sharedWidgets.tsx) + [components/CombatScreen.tsx](components/CombatScreen.tsx))
- HASTE: `+1 action/round, +3 DEX, 2 rounds`
- WARD: `−8 damage / hit, 3 rounds` (was misleading "+8 armor")
- STEELSKIN: `Halve all physical damage, 4 rounds` (was "halve next strike")
- RESIST: `Halve BLAST/FIREBOLT, 3 rounds` (was vague "elemental")
- POWER + DAYLIGHT entries deleted from both lists.

### Plans approved this session (NOT yet implemented)

**PRAY + Divinity System v1 plan** — `~/.claude/plans/the-skull-and-pack-luminous-muffin.md` (overwritten the previous strike-FX plan; current contents = the PRAY plan). Approved by Scotch with all 4 design Qs locked: combat + out-of-combat, bipolar favor (−100..+100), Foundation v1 scope, dark prayer = Illumination drop. Reuses extensive existing infrastructure (11-deity pantheon canonical, room.deity field, knownDeities array, PRAY-temple activity, Word system Mithras×2 multiplier, Spirituality multiplier in HEAL/GREATER-HEAL). v1 scope: god registry, divineFavor map on PlayerState, PRAY combat spell handler, PRAY out-of-combat verb (replaces LLM stub), god-response resolver, sacred-site multiplier, 2 starter divine quests (Crom JUDGES + Mithras Honor-the-Contract), Illumination cost for dark prayer. v2/v3 docs follow.

### Decisions locked late this session

1. **agility is legacy terminology — fully retired.** Only `dexterity` exists from now on.
2. **HASTE design contract**: +1 action/round + 3 DEX for 2 rounds. Net positive value; not a wash.
3. **POWER/DAYLIGHT/MIRROR/BANISH/INVOKE-LIGHT permanently removed.** Will be re-added only with proper engine wiring (no stub spells).
4. **Damage popup uses HP-decrement detection, not strike-only.** Spell damage + bleed/poison ticks all surface a number now.
5. **PRAY replaces POWER's Circle 1 hotbar slot** (per the approved plan, when it ships).
6. **Crom JUDGES** — does not casually witness or bless; selecting his chosen warriors for the cyclic war against the Outer Dark. (Lore update from Scotch during plan iteration.)
7. **Lore-update reminders** are now part of the engine's spell + consumable handler banners — drift between mechanic and description should be caught at the call site, not at runtime by a confused player.

### Files changed (full inventory)

**Modified (40):**
- `.claude/settings.json` (incidental)
- `HYDRATE_NEXT_SESSION.md` (this file)
- `__tests__/art/lane-layout.test.ts`
- `__tests__/combat/barriers.test.ts`
- `__tests__/combat/c1-migration.test.ts`
- `__tests__/combat/c3-actions.test.ts`
- `__tests__/combat/c3-multi.test.ts`
- `__tests__/combat/c4-ai-loop.test.ts`
- `__tests__/combat/c4-ai.test.ts`
- `__tests__/sorcery/sprint-7a.test.ts`
- `__tests__/sorcery/sprint-7b-bless.test.ts`
- `__tests__/sorcery/sprint-7b-buffs.test.ts`
- `__tests__/sorcery/sprint-7b-cunning.test.ts`
- `__tests__/sorcery/sprint-7b-poison.test.ts`
- `__tests__/sorcery/sprint-7b-wall.test.ts`
- `__tests__/sorcery/sprint-7b.test.ts`
- `__tests__/spells/zim-cast.test.ts`
- `app/api/chat/route.ts`
- `app/dev/combat-arena/page.tsx`
- `components/CombatArena.tsx` — center of gravity for the FX work
- `components/CombatScreen.tsx` — spell descriptions + turn-rail key fix (rare exception to "don't touch v1")
- `lib/art/sizeClasses.ts` (incidental)
- `lib/combat/effectIconData.ts`
- `lib/combat/engine.ts` — spell purge + effect wiring + HASTE + agility merge
- `lib/combat/laneLayout.ts` (incidental)
- `lib/combat/narrationPools.ts`
- `lib/combat/spellData.ts`
- `lib/combat/types.ts` — agility field deleted
- `lib/combat/useFigureHeight.ts` (incidental)
- `lib/gameData.ts`
- `lib/gameState.ts`
- `lib/npcAi.ts`
- `lib/sorcery/effects.ts`
- `lib/sorcery/invoke.ts`
- `lib/sorcery/registry.ts`
- `lib/sorcery/types.ts`
- `lib/world/spellResidue.ts`
- `proxy.ts`
- `public/art/_sprite-metadata.json`
- `public/art/npcs/henchman_brand/master/v1.png`
- `scripts/generate-all-art.mjs`

**Created (8):**
- `__tests__/art/stature.test.ts`
- `__tests__/combat/ally-buff.test.ts`
- `__tests__/combat/combat-ready.test.ts`
- `__tests__/combat/death-promotion.test.ts`
- `components/combat/` — CombatantInfoPopup, ItemActionPopup, Spellbook, StrikeZonePicker, sharedWidgets
- `lib/combat/useColumnVisibility.ts`
- `public/art/corpse-marker/` — v1.png … v6.png + `_prompt.txt`
- `scripts/forge-corpse-marker.ts`
- `scripts/trim-corpse-markers.ts`

### Test status (full run)

```
npx tsc --noEmit                                   # clean
[c3-actions]                                       # ✓ all cases passed
[c3-multi]                                         # ✓ all cases passed
[combat-ready]                                     # all green
[ally-buff]                                        # all green
[death-promotion]                                  # all green
[c1-migration]                                     # ✓ all cases passed
[c4-ai]                                            # ✓ all cases passed
[c4-ai-loop]                                       # ✓ all cases passed
[barriers]                                         # all green
[sprint-7a]                                        # ✓ all cases passed
[sprint-7b]                                        # ✓ all cases passed
[sprint-7b-buffs]                                  # all green
[sprint-7b-poison]                                 # ✓ all cases passed
[sprint-7b-bless]                                  # ✓ all cases passed
[sprint-7b-wall]                                   # all green
[sprint-7b-cunning]                                # all green
[zim-cast]                                         # All Sprint S5 tests passed (after stripping stale MIRROR/BANISH/DAYLIGHT cases)
[stature]                                          # ✓ all cases passed
[lane-layout]                                      # ✓ all cases passed
[figure-scale-by-eye]                              # ✓ all cases passed
[size-classes]                                     # ✓ all cases passed
```

Pre-existing fixture-drift in `c2-npc-kit.test.ts` not touched this session.

### Untouched (hard rule still in force, with one declared exception)

- `app/dev/combat-test/page.tsx` — v1 admin arena reference, untouched.
- `components/CombatScreen.tsx` — v1 production combat UI, **TOUCHED THIS SESSION** for two narrowly-scoped reasons:
  1. Spell descriptions + lore (HASTE/WARD/STEELSKIN/RESIST + remove POWER/DAYLIGHT) — Scotch explicitly requested the lore sync.
  2. Turn-rail key fix (`key={\`${id}-${i}\`}`) — required because the HASTE round-wrap logic now puts duplicate ids in `turnOrder`.
- No v1 patterns were rewritten — only text strings + a key-prop change.

---

## Before you start the next session

1. Confirm working dir: `/Users/joshuamcclure/Desktop/living-eamon`
2. Confirm branch: `dev`. Latest committed: **`dcada39`**. Session work is unstaged — see "Files changed" above.
3. `git status` should show ~41 modified + ~9 untracked files.
4. **Decide first:** commit this work, OR begin the PRAY sprint (which adds substantially more changes and risks ballooning the eventual commit).
5. Dev server: existing process likely on port 3000 (`lsof -nP -iTCP:3000 -sTCP:LISTEN`).

## Hydration prompt (paste as first message)

You are being rehydrated into Living Eamon. Read this stack in order:

1. `CLAUDE.md` (root) — top-level rules + behavioral guidelines.
2. `CLAUDE_CONTEXT.md` — project overview.
3. **This file** — the session-end snapshot above.
4. `~/.claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md` — memory index. Pay attention to:
   - `project_haste_design_locked.md` (NEW — current HASTE mechanic spec)
   - `project_spells_purged_2026-05-09.md` (NEW — POWER/DAYLIGHT/MIRROR/BANISH/INVOKE-LIGHT removal)
   - `project_agility_to_dexterity.md` (NEW — terminology refactor outcome)
   - `project_pray_divinity_plan_approved.md` (NEW — pointer to the approved v1 plan)
   - `project_corpse_loot_burial_deferred.md` (existing — corpse-arena features deferred)
   - `feedback_lore_sync_reminder.md` (NEW — when changing a spell or consumable mechanic, update lore in the same PR)
5. Approved plan at `~/.claude/plans/the-skull-and-pack-luminous-muffin.md` — currently the **PRAY + Divinity System v1** plan (overwrote the strike-FX plan when that work shipped).

After reading, confirm hydration with one paragraph naming: (a) what shipped in the previous session, (b) what's next, (c) any open questions.

---

## Known follow-ups (not in current scope)

- **PRAY + Divinity System v1 sprint** — plan approved, ready to implement. See plan file. ~7-10 file changes, 2 new quest lines, 6-8 hours of work estimate.
- **Corpse loot UI** — when KARMA + per-room clock design lands.
- **Corpse burial** — disposal + XP/karma reward + time-cost.
- **Click-to-slot from spellbook** — original arena Phase 5.
- **Per-zone impact anchoring polish** — V1 strike-flash uses target rect with zone-fraction Y; per-class pixel offsets would be cleaner.
- **Screen-shake on crits** — explicitly omitted; can feel cheap.
- **Live-game integration of `<CombatArena>`** — production game flow still on `<CombatScreen>` v1.
- **Crit-event `__CRITICAL__` narrative parsing** — `firedStrike.outcome === "crit"` is now the structured signal for Combat Arena v2; v1 still parses the string. Eventually unify.
- **Documentation sweep** — agility refactor didn't touch TECH.md / KARMA_SYSTEM.md / CLAUDE_CONTEXT.md / SORCERY.md / MODULE_PLAN.md / HYDRATE_NEXT_SESSION.md (this file is fresh). Those docs still contain "agility" historical references. Low priority.
- **Pre-existing technical debt:** `c2-npc-kit.test.ts` has 4 fixture-drift failures from before this session. Not regressions.
- **TEMP debug at [lib/combat/engine.ts:355](lib/combat/engine.ts#L355)** — `const isCrit = true` forces every hit to be a crit for blood/gore testing. Real `getCritChance` line is right below it commented out. Swap back when the FX testing is finished.

---

## Operational facts

- **Branch model:** `dev` is working; `main` is Vercel deploy target. Always merge with `--no-ff`.
- **Dev server:** port **3000**.
- **Auth bypass for dev APIs:** `proxy.ts` whitelists `/api/sprite-list`, `/api/sprite-metadata`, `/api/sprite-regen`, `/api/sprite-touchup`, `/api/prompt-rules`, `/api/item-icon` under `NODE_ENV !== "production"`.
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

## Discipline / process notes

- **No live game.** Schema changes + breaking refactors are safe.
- **Hard rule from 2026-05-07 post-mortem (still in force):** do NOT modify `app/dev/combat-test/page.tsx` or `components/CombatScreen.tsx` without explicit specific permission. (Touched this session for the spell-lore sync + turn-rail key fix; both with explicit Scotch direction.)
- **Combat sprite width is never constrained.** Only height. Tailwind preflight `img { max-width: 100%; }` is overridden via inline `maxWidth: "none"`.
- **Lane spacing locked.** `SPACE_OFFSETS = [0.1975, 0.5, 0.8025]`. See `feedback_lane_spacing.md`.
- **Eye-Y is required.** `figureScaleByEye` throws on undefined. Sprites must be reviewed in `/dev/sprite-review`.
- **Bandit / hostile NPC sprites apply `UGLY_MEAN_OVERLAY`** in their forge prompts.
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
- **Never bundle pre-existing M-state into a sprint commit** UNLESS explicitly asked to "commit everything".
- **Never use apostrophes inside `<<'EOF'` heredoc bodies** (breaks bash).

---

End of hydration prompt.
