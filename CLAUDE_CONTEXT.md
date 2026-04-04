## 0. Local Development Path

- Mac laptop username: joshuamcclure
- Local project path: /Users/joshuamcclure/Desktop/living-eamon
- Terminal shorthand: ~/Desktop/living-eamon

> 🧑 USER NOTE: This user is not a developer. They need explicit step-by-step instructions for every action — including where to click, what to type, and what terminal commands to run. Never assume they know how to do something. Always spell it out completely.

---

# ⚡ CLAUDE — READ THIS FIRST

You are being rehydrated into the Living Eamon project.

Every time you start a new conversation about this project, do this:
1. Fetch this file from:
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/CLAUDE_CONTEXT.md
   and read it completely before responding. The repo is public.
2. After reading, confirm rehydration with:
   "Rehydrated. [X] milestones complete. Currently: [top Next Up item].
   Paste the file URLs above so I can read the code."
3. Every time you write a Cursor prompt that changes the codebase,
   end that prompt with:
   "After making these changes, update CLAUDE_CONTEXT.md: update all
   relevant sections, add a Session Log entry at the top, move any
   completed items from Next Up to Completed Milestones, update the
   Last Updated date, then commit CLAUDE_CONTEXT.md in the same commit
   as the code changes."
4. Never write a Cursor prompt that omits step 3. The file must stay
   current at all times.
5. At the end of your rehydration confirmation message, print this
   exact block so the user can copy and paste all file URLs into
   the chat in one shot. Then tell the user: "Paste all of these URLs
   into the chat now so I can read the current code before we begin."

   ---
   📋 PASTE THESE INTO CHAT SO CLAUDE CAN READ THE CODE:

   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/api/chat/route.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/api/player/route.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/globals.css
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/layout.tsx
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/page.tsx
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/components/CommandInput.tsx
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/eslint.config.mjs
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/combatNarrationPools.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/npcBodyType.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/gameData.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/gameEngine.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/gameState.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/supabase.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/uoData.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/weatherService.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/next-env.d.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/next.config.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/postcss.config.mjs
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/scripts/generate-all-art.mjs
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/scripts/test-plate-chest.mjs
   ---

---

# Living Eamon — Claude Rehydration Document
*Auto-maintained by Cursor. Updated every time the codebase changes.*
*Last updated: April 4, 2026*

## 1. Project Overview

Living Eamon is an AI-powered recreation of the classic Apple II text-adventure system **Eamon**, intended for **LivingEamon.ai**. It features a persistent living world, the AI narrator **Jane**, virtue tracking, a consequence engine (room/NPC state, bounties, chronicle), and Ultima Online–inspired item/weapon metadata and batch icon generation.

**Tech stack (runtime):** Next.js (App Router), TypeScript, React 19, Supabase (Postgres), Vercel deployment, **Anthropic Claude** (Jane via `/api/chat`), **xAI Grok** (optional text via OpenAI-compatible API; image generation in `scripts/`). Tailwind CSS v4 is a project dependency (PostCSS); the main play UI in `app/page.tsx` is largely **inline-styled**.

## 2. Live URLs

- Production: https://living-eamon.vercel.app
- GitHub (public): https://github.com/scotch-glass/living-eamon
- Raw file access: https://raw.githubusercontent.com/scotch-glass/living-eamon/main/[filename]
- Supabase project (informal name in docs): living-eamon

## 3. Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind v4 (dependency); primary game UI uses inline styles in `app/page.tsx`
- Database: Supabase (Postgres)
- AI narrator: Anthropic Claude (`claude-sonnet-4-20250514`) via `app/api/chat/route.ts`; optional Grok `grok-3` for streaming when `GROK_API_KEY` is set. **Testing:** when `processInput` returns `dynamic` and `player.currentRoom === "main_hall"`, `/api/chat` returns **JSON** `{ response, worldState }` (full Jane text, no stream) instead of chunked `text/plain`. **Critical hits:** when `responseType === "static"` but `staticResponse` includes **`__CRITICAL__`**, the route calls **`streamJane`** with a rewrite prompt (same stream vs **main_hall** JSON rule as dynamic). **Guild Courtyard:** when `responseType === "static"` and the player is in **`guild_courtyard`**, **`route.ts`** calls **`getCourtyardWeather()`** (Open-Meteo, Warsaw) and replaces the body with **`buildCourtyardDescription`** (no LLM).
- Image generation: xAI `https://api.x.ai/v1/images/generations`, model **`grok-imagine-image`** in `scripts/generate-all-art.mjs`
- Deployment: Vercel
- IDE: Cursor (e.g. MacBook Pro)

## 4. File Map

| Path | Purpose |
|------|---------|
| `CLAUDE_CONTEXT.md` | This rehydration document (must stay current with every code change) |
| `.cursorrules` | Cursor rule: mandatory `CLAUDE_CONTEXT.md` updates with each change |
| `AGENTS.md` | Next.js version warning for agents |
| `CLAUDE.md` | Points to `@AGENTS.md` |
| `README.md` | Project readme |
| `package.json` / `package-lock.json` | Dependencies and scripts (`dev`, `build`, `start`, `lint`) |
| `tsconfig.json` | TypeScript config; path alias `@/*` → project root |
| `next.config.ts` | Next.js config |
| `next-env.d.ts` | Next.js type refs |
| `eslint.config.mjs` | ESLint flat config |
| `postcss.config.mjs` | PostCSS (Tailwind) |
| `lib/gameData.ts` | Static world: `MAIN_HALL_ROOMS` (incl. **`guild_courtyard`**, **`church_of_perpetual_life`**), `NPCS`, `ITEMS` (incl. **`gray_robe`**, plain + **ragged** clothing, **`rusty_shortsword`**, **`castoff_short_sword`**), `PRIEST_SILENCE_RESPONSES`, `REBIRTH_NARRATIVES`, `ROOM_ROBE_HUMILIATION`, `COURTYARD_ROBE_HUMILIATION`, `SAM_INVENTORY`, `ADVENTURES`, `COMBAT_TEMPLATES` |
| `lib/npcBodyType.ts` | Shared `NPCBodyType` union (`"humanoid" \| "beast" \| "amorphous" \| "undead"`); imported by `gameData.ts` and `combatNarrationPools.ts` |
| `lib/gameState.ts` | Types (`PlayerState`, `WorldState`, …), `createInitialWorldState()`, **`applyPlayerDeath`** (Church respawn: wipe carried gold + inventory, **`gray_robe`**, weapon sentinel **`unarmed`** (not an ITEMS id), armor/shield **null**, HP full, room **`church_of_perpetual_life`**), mutators incl. **`setNPCCombatHp`**, **`NPCStateEntry.combatHp`**, `tickWorldState`, `applyFireballConsequences` |
| `lib/gameEngine.ts` | `processInput`, **`buildCourtyardDescription`**, autocomplete, `buildSituationBlock` (NPC HP bar when **`combatHp`** set), combat (**`ATTACK`** with **`unarmed`** guard, 10% **`__CRITICAL__`**, **`FLEE`**, **`BEG`**), **Hokas unarmed pity** (**`TELL HOKAS`**, **`EXAMINE` / name-alone / look-at** mentioning Hokas), Church **`SAY`/`TELL`** → static priest silence pool, robe humiliation on **`buildRoomDescription`**, banking, **EQUIP** / **WIELD**, **Sam shop**, `extractDirection` (token-safe) |
| `lib/weatherService.ts` | **`getCourtyardWeather()`** — Open-Meteo forecast (Warsaw), WMO code → condition, CET/CEST hour → **`TimeOfDay`**, 24 static **`weatherLine`** strings; fallback if fetch fails |
| `lib/uoData.ts` | `WEAPON_DATA` (incl. **`weaponSpeed`**), `getDexReactionBonus()`, `isTwoHanded()`, `rollWeaponDamage()` |
| `lib/supabase.ts` | `browserClient`, `serviceClient`, `savePlayer` (incl. **`received_sam_starter_outfit`**), `loadPlayer`, `createPlayer`, world object cache, room/NPC state, Jane memory, chronicle, `checkAndDecrementJaneCalls` |
| `app/layout.tsx` | Root layout |
| `app/globals.css` | Global CSS |
| `app/page.tsx` | Client UI: name gate, chat log, `CommandInput`, sidebar, **JSON vs stream** handling for `/api/chat` (`application/json` = instant append; else char streaming + `__STATE__`) |
| `app/api/chat/route.ts` | POST: load/merge player, `processInput`; **`guild_courtyard`** static → **`getCourtyardWeather`** + **`buildCourtyardDescription`**; **`__CRITICAL__`** → **`streamJane`** crit rewrite; Jane stream or **buffered JSON** in `main_hall`+dynamic (and `main_hall`+crit); `completeJaneNonStream`, `savePlayer`, situation append |
| `app/api/player/route.ts` | POST create player name; GET load player by id |
| `components/CommandInput.tsx` | Command bar with engine-driven autocomplete |
| `scripts/generate-all-art.mjs` | Batch UO-style PNGs via Grok image API → `public/uo-art/items/{artId}.png` |
| `scripts/test-plate-chest.mjs` | Single-item art test |
| `public/*.svg` | Default Next/Vercel assets (`public/uo-art` may be generated locally and not committed) |

## 5. Game Architecture

**Tier 1 — Static engine:** Movement (`GO`, single-letter dirs, **`FLEE`**), `LOOK`, `EXAMINE`, `GET`/`DROP`, `STATS`/`INVENTORY`, **`EQUIP`** (weapon/shield/armor; **`WIELD`** is an alias), `EQUIP SHIELD` / `EQUIP ARMOR` / `SHIELD`, `REMOVE`/`UNEQUIP` (shield, armor, or by item name), vault `DEPOSIT`/`WITHDRAW`, **`SHOP` / `LIST` / `SAM` and `BUY` in `main_hall`** (Sam’s `SAM_INVENTORY`), static combat round helper, fireball consequence hook, etc. Implemented in `lib/gameEngine.ts`; **no** LLM when `responseType === "static"` **unless** the payload contains **`__CRITICAL__`** (player crit — then **`route.ts`** invokes Jane once to rewrite the marked hit line).

**Tier 2 — State-modified static:** Room `RoomState` (`normal` \| `burnt` \| `flooded` \| `dark` \| `ransacked`) with `stateModifiers` copy in `gameData.ts`; NPC `disposition` / memory / agenda in `WorldState.npcs`. Applied by engine + `gameState` helpers; still no AI for pure state ticks.

**Tier 3 — Jane (dynamic):** Open-ended input, NPC conversation beyond first greeting, `BUY` **outside** `main_hall`, `SELL`, `ATTACK`, `CAST` (non-fireball), examinations, adventures — `responseType === "dynamic"` builds `dynamicContext` for Claude/Grok. **Delivery:** streamed `text/plain` except **main_hall + dynamic** → JSON body (see Known Issues).

## 6. Player State Shape

Source: `lib/gameState.ts` — `PlayerState` interface and defaults from `createInitialWorldState()`.

**Interface (fields and types):**

- `id`: `string`
- `name`: `string`
- `currentRoom`: `string`
- `previousRoom`: `string | null`
- `hp`: `number`
- `maxHp`: `number`
- `strength`: `number`
- `dexterity`: `number`
- `charisma`: `number`
- `expertise`: `number`
- `gold`: `number`
- `bankedGold`: `number`
- `weapon`: `string` (item id)
- `armor`: `string | null`
- `shield`: `string | null`
- `inventory`: `PlayerInventoryItem[]` where each item is `{ itemId: string; quantity: number }`
- `virtues`: object with keys `Honesty`, `Compassion`, `Valor`, `Justice`, `Sacrifice`, `Honor`, `Spirituality`, `Humility`, `Grace`, `Mercy` — all `number`
- `reputationScore`: `number`
- `reputationLevel`: `ReputationLevel`
- `knownAs`: `string | null`
- `currentAdventure`: `string | null`
- `completedAdventures`: `string[]`
- `activeQuests`: `string[]`
- `bounty`: `number`
- `isWanted`: `boolean`
- `prisonTurnsRemaining`: `number`
- `turnCount`: `number`
- `lastAction`: `string | null`
- `knownSpells`: `string[]`
- `knownDeities`: `string[]`
- `receivedSamStarterOutfit`: `boolean` — set after Sam’s first-purchase outfit bundle; reset to **`false`** on **`applyPlayerDeath`**
- `receivedHokasUnarmedGift`: `boolean` — set after Hokas’s one-time unarmed pity gift; reset to **`false`** on **`applyPlayerDeath`**

**Default values for a new world** (`createInitialWorldState(playerName)`):

- `id`: `"player_1"` until replaced by Supabase id in chat route
- `name`: `playerName` argument (default `"Adventurer"`)
- `currentRoom`: `"main_hall"`
- `previousRoom`: `null`
- `hp` / `maxHp`: `20` / `20`
- `strength`: `12`, `dexterity`: `10`, `charisma`: `10`, `expertise`: `0`
- `gold`: `0`, `bankedGold`: `0`
- `weapon`: `"unarmed"`, `armor`: `null`, `shield`: `null`
- `inventory`: `[{ itemId: "gray_robe", quantity: 1 }]`
- All virtues: `0`
- `reputationScore`: `0`, `reputationLevel`: `"neutral"`, `knownAs`: `null`
- `currentAdventure`: `null`, `completedAdventures`: `[]`, `activeQuests`: `[]`
- `bounty`: `0`, `isWanted`: `false`, `prisonTurnsRemaining`: `0`
- `turnCount`: `0`, `lastAction`: `null`
- `knownSpells`: `["BLAST", "HEAL", "LIGHT", "SPEED"]`, `knownDeities`: `[]`
- `receivedSamStarterOutfit`: `false`
- `receivedHokasUnarmedGift`: `false`

## 7. World State

### Rooms (`MAIN_HALL_ROOMS` in `lib/gameData.ts`)

| id | name | Exits | NPCs (static list) | Default floor items | Notable `stateModifiers` |
|----|------|-------|--------------------|----------------------|---------------------------|
| `main_hall` | The Main Hall | north→`armory`, east→`notice_board`, south→`main_hall_exit`, down→`guild_vault` | hokas_tokas, sam_slicker, old_mercenary | notice_board_key | `burnt`, `ransacked`, `dark` |
| `armory` | The Guild Armory | south→`main_hall` | armory_attendant | short_sword, leather_armor, torch, rope | _(none)_ |
| `notice_board` | The Notice Board | west→`main_hall` | _(none)_ | _(none)_ | _(none)_ |
| `main_hall_exit` | The Guild Entrance | north→`main_hall`, west→`guild_courtyard` | door_guard | _(none)_ | _(none)_ |
| `guild_courtyard` | The Guild Courtyard | east→`main_hall_exit`, west→`church_of_perpetual_life` | _(none)_ | _(none)_ | _(none)_ — live weather via **`route.ts`** + **`buildCourtyardDescription`** |
| `church_of_perpetual_life` | The Church of Perpetual Life | east→`guild_courtyard` | priest_of_perpetual_life | _(none)_ | _(none)_ |
| `guild_vault` | The Guild Vault | up→`main_hall` | brunt_the_banker | _(none)_ | _(none)_ |

**`createInitialWorldState.rooms` keys:** `main_hall`, `armory`, `notice_board`, `guild_vault`, **`guild_courtyard`**, **`church_of_perpetual_life`** (not `main_hall_exit`). `door_guard` NPC state uses `location: "main_hall_exit"`.

### NPC catalog (`NPCS` in `gameData.ts`) — default disposition in fresh state

| npcId | Name | Default disposition (`createInitialWorldState`) | Default location |
|-------|------|-----------------------------------------------|------------------|
| hokas_tokas | Hokas Tokas | friendly | main_hall |
| sam_slicker | Sam Slicker | neutral | main_hall |
| old_mercenary | Aldric the Old | neutral | main_hall |
| brunt_the_banker | Brunt | neutral | guild_vault |
| armory_attendant | Pip | neutral | armory |
| door_guard | The Door Guard | neutral | main_hall_exit |
| priest_of_perpetual_life | A Priest of Perpetual Life | neutral | church_of_perpetual_life |

## 8. Merchants

**Sam (Main Hall):** prices and keys come from **`SAM_INVENTORY`** in `lib/gameData.ts` (static `SHOP` / `BUY`). **`NPCS.sam_slicker.merchant.inventory`** is `SAM_INVENTORY.map(r => r.key)` for autocomplete. The **first** successful **`BUY`** also grants a complimentary plain outfit (see Session Log — destitute new player).

**Hokas / Pip (non-Sam):** reference `ITEMS[itemId].value` for display; purchases still **Jane** unless a static Pip shop is added later.

### Hokas Tokas — Main Hall (`hokas_tokas`)

- Personality (summary): Warm innkeeper; Universal Common; furious if hall burnt until repairs paid.
- Inventory: `ale` (1g), `hearty_meal` (3g), `rumor_token` (5g)

### Sam Slicker — Main Hall (`sam_slicker`) — static `SAM_INVENTORY`

| key | displayName | price (gp) |
|-----|-------------|------------|
| dagger | Dagger | 8 |
| short_sword | Short Sword | 15 |
| long_sword | Long Sword | 30 |
| katana | Katana | 90 |
| kryss | Kryss | 35 |
| war_axe | War Axe | 70 |
| mace | Mace | 45 |
| scepter | Scepter | 50 |
| scimitar | Scimitar | 55 |
| cutlass | Cutlass | 50 |
| skinning_knife | Skinning Knife | 10 |
| halberd | Halberd | 100 |
| battle_axe | Battle Axe | 95 |
| war_hammer | War Hammer | 110 |
| maul | Maul | 95 |
| bardiche | Bardiche | 100 |
| executioners_axe | Executioner's Axe | 120 |
| large_battle_axe | Large Battle Axe | 115 |
| spear | Spear | 75 |
| war_fork | War Fork | 70 |
| black_staff | Black Staff | 40 |
| gnarled_staff | Gnarled Staff | 35 |
| quarter_staff | Quarter Staff | 25 |
| pitchfork | Pitchfork | 30 |
| bow | Bow | 80 |
| crossbow | Crossbow | 45 |
| repeating_crossbow | Repeating Crossbow | 90 |
| leather_armor | Leather Armor | 20 |
| chain_mail | Chain Mail | 60 |
| buckler | Buckler | 30 |

- **Static commands (Main Hall only):** `SHOP`, `SAM`, `LIST`, or `BUY` with no argument → formatted listing; `BUY <item>` → gold check, **everything stacks in `player.inventory` only** (no auto-equip). Player uses **`EQUIP [item]`** (or **`WIELD`** as alias), plus **`EQUIP SHIELD`** / **`SHIELD`** / **`EQUIP ARMOR`** where explicit.
- **`SHOP` listing — ARMOR & SHIELDS:** each row shows **`[AC: n]`** from **`ITEMS[key].stats.armorClass`** (leather, chain, buckler).
- Elsewhere: `SHOP`/`SAM`/`LIST` → static hint to go to Main Hall; `BUY` → still **Jane**.

### Pip (armory attendant) — Guild Armory (`armory_attendant`)

- Personality (summary): Young apprentice; wants to adventure; chatty about posted adventures.
- Inventory: `short_sword` (15g), `leather_armor` (20g), `buckler` (30g per `ITEMS`), `torch` (2g), `rope` (5g), `rations` (3g)

## 9. Weapon & Equip System

- **Data:** `lib/uoData.ts` — `WEAPON_DATA`: keys are weapon item ids; each entry has `artId`, `twoHanded`, `skill`, `damage` (`"min-max"` string), `layer` (1 = one-handed, 2 = two-handed), **`weaponSpeed`** (AD&D 2e initiative factor **1–10**, **1 = fastest**). **`halberd`** and **`bardiche`** use **`Mace Fighting`** (corrected from Swordsmanship).
- **`weaponSpeed` source:** Ultima Online **T2A** swing speeds (see [wiki.uosecondage.com/Weapons](https://wiki.uosecondage.com/Weapons)), converted to the AD&D scale with **`round(10 − ((UOspeed − 10) / 48) × 9)`** (higher UO speed ⇒ lower AD&D factor ⇒ acts earlier).
- **`getDexReactionBonus(dex)`:** AD&D 2e PHB Table 2 (exported from `uoData.ts`), used in initiative below.
- **`isTwoHanded(weaponKey)`:** `WEAPON_DATA[weaponKey]?.twoHanded ?? false`.
- **`rollWeaponDamage(weaponKey)`:** Parses `damage` range; if key missing, returns uniform **1–5**.
- **Combat (`resolveCombatRound` in `gameEngine.ts`):** Signature **`resolveCombatRound(state, enemyId, enemyHp, { name, damage, armor }, bodyType?)`** → **`{ narrative, newState, enemyHp, combatOver, playerWon }`**. **Player defeat:** **`fillTemplate(pickTemplate(COMBAT_TEMPLATES.playerDeath))`** — **48** lines. **Enemy defeat:** **`fillTemplate(pickTemplate(getEnemyDeathPool(bodyType)), { enemy, weapon })`** — body-type pools (**55** / **40** / **35** / **40** humanoid+).
  - **INITIATIVE (prepended):** **`⚡ Initiative — You: {p} · {enemy}: {e}`** then **`{winner} acts first.`** Player: **`floor(rand×10)+1 + WEAPON_DATA[weapon].weaponSpeed (default 5) − getDexReactionBonus(dex)`**. Enemy: **`floor(rand×10)+1 + 5`** (no DEX). **Tie → player first.** Order of **`doPlayerAttack` / `doEnemyAttack`** follows initiative.
  - **HIT CHANCE (T2A):** **`(skill+50)/((foeSkill+50)×2)`**; player skill from expertise; **enemy skill fixed 30**.
  - **PLAYER DAMAGE:** **`rollWeaponDamage × (1 + STR% + Tactics%)`**, minus enemy **AR**, **halve**, **min 1**. **Critical hit:** 10% on each successful player hit → final damage **×2**; narrative prefixes that hit line with **`__CRITICAL__ `** so **`route.ts`** sends the full combat text to Jane for a **≤20-word** replacement of the marked line only. Enemy attacks never crit.
  - **ENEMY DAMAGE:** **`raw = rollDice(damage)`**; **`enemyDmg = max(0, raw − armorAC − shieldAC)`** from **`ITEMS[].stats.armorClass`** — **no post-AC halving**, **no min-1 clamp** (full block possible). If **`totalAC > 0`** and **`raw > 0`**: narrate **`ARMOR_FULL_ABSORB_DESCRIPTIONS`** or **`ARMOR_ABSORB_DESCRIPTIONS`** using **`absorbKey = player.armor ?? player.shield ?? "default"`** (armor priority for key). If **`enemyDmg === 0`**, skip wound line and **do not** change player HP.
  - **Cinematic pools:** **`getPlayerHitEnemyPool`**, **`getEnemyHitPlayerPool`**, **`getEnemyMissPlayerPool`**, **`PLAYER_MISS_DESCRIPTIONS`** via **`fillTemplate` + `pickTemplate`**. **Wound tiers:** player on enemy vs **starting `enemyHp`** (this round): **≤15%** glancing, **≤40%** solid, else devastating; enemy on player vs **`player.maxHp`**: **≤10%** / **≤25%** / else.
  - **`NPCBodyType`:** defined in **`lib/npcBodyType.ts`**, re-exported from **`gameData.ts`**; **`combatNarrationPools.ts`** imports it (no duplicate **`CombatBodyType`**).
  - **`ATTACK`:** If **`NPCS[id].stats`** exists and foe is hostile → **static** **`resolveCombatRound`** with **`enemyHp = npcs[id].combatHp ?? stats.hp`**; ongoing fights persist **`combatHp`** until kill or round-ending player death (**`combatHp → null`** only then). **`GO`**, direction shorthand, and **`FLEE`** do **not** reset foe **`combatHp`**. If **no `stats`** → **dynamic** Jane fallback.
- **Buy flow:** Sam **`BUY`** (and any future static shops) add items **only** to **`player.inventory`**. Nothing auto-fills **`weapon`**, **`armor`**, or **`shield`** on purchase. Success hint: *"Type EQUIP [item] to equip any weapon, shield, or armor."*
- **Primary command — `EQUIP [item]`** (and **`WIELD [item]`**, same handler): **`runEquipItemFromPhrase`** resolves in order — (1) shield-slot item in inventory → **`runEquipShield`**, (2) body armor in inventory → **`runEquipArmor`**, (3) else weapon → **`runWieldWeapon`**. Underscores in the phrase are normalized to spaces (e.g. `leather_armor`).
- **Explicit forms:** **`EQUIP SHIELD …`**, **`EQUIP ARMOR …`**, and **`SHIELD …`** unchanged; equipping still **does not remove** stacks from inventory.
- **Unequip:** **`REMOVE SHIELD`** / **`UNEQUIP SHIELD`**; **`REMOVE ARMOR`** / **`UNEQUIP ARMOR`**; **`UNEQUIP [item]`** / **`REMOVE [item]`** (with a following phrase) clears **shield**, **armor**, or **weapon** when the phrase matches the **equipped** item by name. Weapon unequip sets **`player.weapon`** back to default **`short_sword`**.
- **`WIELD`:** Alias only — same behavior as bare **`EQUIP [item]`**; HELP lists it second.
- **`INVENTORY` / `I`:** Each line shows `(xN)`, then optional **`[dmg: min-max]`** (from **`WEAPON_DATA`** first, else **`ITEMS[].stats.damage`**) and **`[2H]`** for two-handed weapons, or **`[AC: n]`** for armor (buckler fixed at **`[AC: 1]`**), then **`(wielded)`** / **`(shield equipped)`** / **`(armor equipped)`** when that row’s `itemId` matches the active slot.
- **`STATS`:** **Weapon** with **`[spd: n]`**; **Armor** / **Shield** with **`[AC: n]`**; **Total AC**; separator; **Hit% vs avg enemy** (foe skill 30); **STR damage bonus %** and **Tactics bonus %**; **Initiative** line **`1d10 + [spd] (weapon) − [DEX bonus] (DEX)`**. Primary stats use **Dexterity**.
- **Shield slot items:** `isShieldSlotItem` — currently **`buckler`** only. **Body armor slot:** `leather_armor`, `chain_mail` (`isBodyArmorSlotItem`).
- **Autocomplete:** After **`EQUIP `** (not `EQUIP SHIELD` / `EQUIP ARMOR`), suggestions include **all** equippable inventory rows (weapons + shield + body armor). **`WIELD `** uses the **same** item list with the **`WIELD`** prefix.
- **UI:** Sidebar shows *"— both hands occupied —"* when a two-handed weapon is equipped (`app/page.tsx` + `isTwoHanded`).

## 10. Art System

- Output path (script): `public/uo-art/items/[numeric artId].png` (created by `scripts/generate-all-art.mjs`; folder may be absent in a fresh clone).
- Model: **`grok-imagine-image`** (xAI Images API).
- Batch script: `scripts/generate-all-art.mjs` (reads `GROK_API_KEY` from `.env.local`).
- Test script: `scripts/test-plate-chest.mjs`.
- Paperdoll figures, male/female layered wearables: **not built** (parked).
- Item icons are treated as gender-neutral inventory sprites; future paperdoll would need layered male/female assets.

## 11. Supabase Schema (inferred from code)

SQL migrations: **`supabase/migrations/`** (e.g. **`received_sam_starter_outfit`** on **`players`**). The following is **inferred** from `lib/supabase.ts` and `app/api/chat/route.ts`.

**`players` table — columns touched by `savePlayer` upsert (camelCase → snake_case in DB):**

| Column (snake_case) | Inferred type / notes |
|---------------------|------------------------|
| `id` | UUID / text (primary key) |
| `character_name` | text |
| `hp`, `max_hp` | number |
| `strength`, `dexterity`, `charisma`, `expertise` | number |
| `gold`, `banked_gold` | number |
| `weapon` | text |
| `armor` | text nullable |
| `shield` | text nullable (required for equip feature; add column if missing) |
| `inventory` | JSON (array of `{ itemId, quantity }`) |
| `virtues` | JSON |
| `reputation_score` | number |
| `reputation_level` | text |
| `known_as` | text nullable |
| `current_room` | text |
| `current_adventure` | text nullable |
| `completed_adventures` | JSON / array |
| `bounty` | number |
| `is_wanted` | boolean |
| `turn_count` | number |
| `received_sam_starter_outfit` | boolean (default false) — Sam’s first-purchase plain outfit already given |
| `received_hokas_unarmed_gift` | boolean (default false) — Hokas pity bundle already given |
| `last_seen` | timestamptz (ISO string from code) |

**Also referenced on `players` (Jane limits):** `jane_calls_today`, `jane_calls_reset_at`, `tier` — see `checkAndDecrementJaneCalls`.

**Load merge (chat route)** additionally reads `known_spells`, `known_deities` if present; **`savePlayer` / `worldStateToPlayerRecord` do not currently persist these** — spells reset to defaults on full reload unless DB defaults or another path saves them.

Other tables used: `world_objects`, `room_states`, `npc_states`, `jane_memories`, `chronicle_log` (see `supabase.ts`).

## 12. Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude client in `app/api/chat/route.ts` |
| `GROK_API_KEY` | Optional Grok chat + required for `scripts/generate-all-art.mjs` / `test-plate-chest.mjs` (script reads `.env.local`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (`lib/supabase.ts`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (`browserClient`) |
| `SUPABASE_SERVICE_KEY` | Service role key (`serviceClient`, server routes) |

Do not commit secret values.

## 13. Known Issues / Parked Items

- **Supabase `players` column `agility` → `dexterity`:** The **`players`** table must rename **`agility`** to **`dexterity`**. Run in the Supabase SQL editor:
  ```
  ALTER TABLE players RENAME COLUMN agility TO dexterity;
  ```
  Until this is done, **dexterity will not persist correctly** across sessions. (The chat route falls back to **`agility`** on load only when **`dexterity`** is missing.)
- **`main_hall` Jane streaming disabled for testing:** When `responseType === "dynamic"` and `player.currentRoom === "main_hall"`, `/api/chat` returns **`application/json`** `{ response, worldState }` instead of a streamed `text/plain` body. **Re-enable streaming for production** (remove or gate the `bufferMainHallDynamic` path in `app/api/chat/route.ts`) so Main Hall behaves like other rooms unless you intentionally keep this for debugging.
- `known_spells` / `known_deities`: loaded from DB when present but **not** written in `worldStateToPlayerRecord` / `savePlayer` — persistence gap.
- `main_hall_exit` room has no `RoomStateEntry` in `createInitialWorldState.rooms`.
- `SELL` and **non–main_hall** `BUY` remain **Jane-driven** (no static transaction loop).
- Static structured shop for **Pip** (`PIP_INVENTORY`): not implemented.
- Female/male paperdoll and compositing: parked.
- `public/uo-art`: may be empty until scripts are run locally.

## 14. Completed Milestones

- [x] Next.js app scaffolded and running locally
- [x] Jane AI narrator integrated (Claude; optional Grok)
- [x] Supabase persistence for core player fields (character survives refresh when saved)
- [x] Deployed to Vercel (living-eamon.vercel.app)
- [x] GitHub repo scotch-glass/living-eamon
- [x] `WEAPON_DATA` with `twoHanded`, damage bands, `artId`, `layer`
- [x] `isTwoHanded()` and `rollWeaponDamage()`
- [x] Two-handed vs shield equip guards + `shield` on `PlayerState` + sidebar messaging
- [x] New characters: **`0`** gold, **`unarmed`**, **`gray_robe`** only; first Sam **`BUY`** adds complimentary plain outfit (shirt, trousers, belt, shoes) and removes the robe
- [x] Direction parsing: `extractDirection` uses whole tokens (fixes `STATS` / substring false positives)
- [x] Batch art script targeting Grok image API (`grok-imagine-image`)
- [x] `CLAUDE_CONTEXT.md` + `.cursorrules` maintenance rule
- [x] **`SAM_INVENTORY`** + static Sam shop in **Main Hall** (`SHOP` / `LIST` / `SAM`, `BUY`); `ITEMS` extended for all Sam weapon keys; `NPCS.sam_slicker.merchant.inventory` driven by `SAM_INVENTORY`
- [x] **main_hall + dynamic** → JSON Jane response + **client** handles `application/json` vs stream
- [x] **Cinematic combat narration:** wound-tier pools, armor narration, static **`ATTACK`** path (evolved across sessions)
- [x] **Body-type combat pools** + **+5 strings** per existing humanoid pool; **`NPCBodyType`** on **`NPC`**
- [x] **Cinematic death narration:** expanded **`playerDeath`**; body-type enemy death pools + **`getEnemyDeathPool`**
- [x] **Death pool expansion:** +20 lines each (**48** / **55** / **40** / **35** / **40**)
- [x] Combat engine wired: ATTACK handler calls resolveCombatRound statically for any NPC with stats
- [x] Initiative display with ⚡ using weaponSpeed + getDexReactionBonus
- [x] Wound tier narration (glancing/solid/devastating × weapon category × body type) via combatNarrationPools.ts
- [x] Armor absorption narration with AC lookup from ITEMS and full-block path (no minimum-1 clamp)
- [x] Enemy death body type pools (humanoid/beast/amorphous/undead) via getEnemyDeathPool
- [x] NPCBodyType / CombatBodyType consolidated to single type in lib/npcBodyType.ts
- [x] Persistent enemy HP tracking across combat rounds (`NPCStateEntry.combatHp` + `setNPCCombatHp`)
- [x] FLEE command (random exit, enemy HP preserved on flee)
- [x] Critical hit system (10% crit, double damage, Jane rewrites the hit line)
- [x] Church of Perpetual Life (respawn room, silent priests, rebirth narratives)
- [x] Guild Courtyard (live Warsaw weather, CET time, 24 static descriptions)
- [x] Death redesign: inventory wipe, gray robe, `applyPlayerDeath`
- [x] Gray robe humiliation on every room transition while worn
- [x] BEG command (BEG SAM gives rusty sword while unarmed)
- [x] Unarmed state after death (weapon sentinel `unarmed`)
- [x] Hokas unarmed pity (**`TELL HOKAS`** / examine Hokas): ragged clothes + **castoff short sword** (1–4), once per life arc

## 15. Next Up

- [ ] Re-enable Jane streaming in `main_hall` before production
- [ ] Persist `known_spells` / `known_deities` in savePlayer
- [ ] Static structured shop for Pip (beginner gear)
- [ ] Apply **`supabase/migrations`** on the Supabase project (incl. **`received_sam_starter_outfit`**; shield column if still missing on older DBs)
- [ ] Male / female paperdoll art and compositor

## 16. Session Log

### 2026-04-04 — Hokas pity for unarmed players

- In **`main_hall`**, if **`player.weapon === "unarmed"`**, Hokas is present and alive, disposition is not **`furious`** / **`hostile`**, and **`receivedHokasUnarmedGift`** is false: **`TELL HOKAS …`**, **`EXAMINE`** / **`LOOK AT`** / **name-alone** targeting Hokas triggers a **static** scene (he avoids eye contact) and grants **ragged** shirt/trousers/belt/shoes plus **`castoff_short_sword`** (**`WEAPON_DATA`** damage **1–4**), **equipped**, flag set. Resets on **`applyPlayerDeath`**.
- New **`ITEMS`** + migration **`received_hokas_unarmed_gift`** on **`players`**.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Destitute new player, Sam first-purchase outfit

- **`createInitialWorldState`:** **`gold: 0`**, **`weapon: unarmed`**, inventory only **`gray_robe`** (matches post-death poverty).
- **First successful Sam `BUY` in Main Hall:** if **`receivedSamStarterOutfit`** is false, Sam adds **`plain_shirt`**, **`plain_trousers`**, **`plain_belt`**, **`plain_shoes`** to inventory, removes **`gray_robe`**, sets flag true, and appends narration. Flag resets on **`applyPlayerDeath`** so reborn characters can earn the bundle again on next first purchase.
- **`ITEMS`:** four nondescript clothing entries (no AC; robe humiliation stops once the robe is gone).
- **`UNEQUIP` weapon:** sheathes to **`unarmed`** (removed old “humble blade” short-sword lock).
- **`/api/chat`:** opening Jane prompt notes no gold, no weapon, backless gray robe; **removed** dev **`gold < 1000` → 10000** bump.
- **Persistence:** **`received_sam_starter_outfit`** on **`players`** via **`savePlayer`** / load merge; migration **`supabase/migrations/20260404180000_players_received_sam_starter_outfit.sql`**.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Unarmed death, BEG SAM, rusty shortsword

- Fixed death state: **`player.weapon = 'unarmed'`** after death (not **`short_sword`**). Inventory contains only **`gray_robe`**.
- Added **`unarmed`** sentinel handling throughout the engine: **`ATTACK`** blocked with message; **`STATS`** / free-text Jane context show **Unarmed**; **`resolveCombatRound`** early guard; unequip autocomplete skips **`unarmed`**.
- **`rusty_shortsword`** in **`ITEMS`** and **`WEAPON_DATA`** (`uoData.ts`).
- **`BEG`** command: **`BEG SAM`** (or **slicker**) in **`main_hall`** while **`unarmed`** gives the rusty short sword and equips it once per session (inventory check). Other **`BEG`** targets or bare **`BEG`** go to Jane with robe/unarmed context.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Church of Perpetual Life, Guild Courtyard, death redesign, live weather

- **Church of Perpetual Life + Guild Courtyard** in **`gameData`** (`MAIN_HALL_ROOMS`), initial **`rooms`/`npcs`** in **`gameState`**. **`main_hall_exit`** gains west→**`guild_courtyard`**. Item **`gray_robe`** (`type: "clothing"`). NPC **`priest_of_perpetual_life`** (silent). Pools: **`PRIEST_SILENCE_RESPONSES`** (10), **`REBIRTH_NARRATIVES`** (15), **`ROOM_ROBE_HUMILIATION`** / **`COURTYARD_ROBE_HUMILIATION`** (10 each).
- **Death:** **`applyPlayerDeath`** — carried **gold → 0**, inventory → **gray robe only**, weapon **`unarmed`**, armor/shield **null**, **`receivedSamStarterOutfit` → false**, **HP** full, **`currentRoom` → `church_of_perpetual_life`**, chronicle line. **`resolveCombatRound`** appends **`COMBAT_TEMPLATES.playerDeath`**, rebirth line, gold/carry loss text.
- **Priest:** **`SAY`** / **`TELL`** in church → static **`pickTemplate(PRIEST_SILENCE_RESPONSES)`**, no Jane.
- **Robe humiliation:** **`buildRoomDescription`** appends a line whenever **`gray_robe`** is in inventory (**`ROOM_ROBE_HUMILIATION`** or courtyard pool in courtyard).
- **Courtyard:** **`lib/weatherService.ts`** — **`getCourtyardWeather()`** (Open-Meteo Warsaw + CET/CEST **`TimeOfDay`**, 24 **`weatherLine`** strings). **`app/api/chat/route.ts`** intercepts static responses when **`currentRoom === "guild_courtyard"`** and replaces body with **`buildCourtyardDescription`** (no LLM). Fallback if API fails.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Critical hit system (`__CRITICAL__`, Jane rewrite)

- **10%** chance on each **successful player hit** in **`resolveCombatRound`**: damage **×2** vs **`calcPlayerDamage()`** output; **`__CRITICAL__ `** prepended before the templated hit line (plain marker, no extra styling).
- **`app/api/chat/route.ts`:** If **`staticResponse`** contains **`__CRITICAL__`**, **`streamJane`** with instructions to replace marker + following line with one vivid sentence (**≤20 words**), preserve all other lines; **`main_hall`** still uses buffered JSON like dynamic Jane. Non-crit combat rounds stay fully static (no API).
- `npx tsc --noEmit` — clean.

### 2026-04-04 — FLEE command; movement no longer clears combatHp

- **`FLEE`** added: picks a random **`currentRoom.exits`** entry, **`movePlayer`** to destination, static line + **`buildRoomDescription`**; does not modify **`combatHp`**.
- Removed incorrect **`combatHp`** reset from **`GO`/`WALK`/`MOVE`** and single-token direction handlers — fleeing or walking away does **not** reset enemy HP; only fight-end (**kill** or **player death** round) clears **`combatHp`**.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Persistent enemy HP (`combatHp`, situation bar)

- Persistent enemy HP via **`NPCStateEntry.combatHp`** (`number | null`); **`setNPCCombatHp`** in **`gameState.ts`**. **`ATTACK`** reads **`combatHp ?? npcData.stats.hp`** each round; on kill or round-ending player death, **`combatHp → null`**; mid-fight, **`combatHp`** stores **`resolveCombatRound`**’s remaining enemy HP.
- **`buildSituationBlock`:** compact **█/░** HP bar + **`current/max`** for NPCs with **`combatHp !== null`**.
- `npx tsc --noEmit` — clean.

### 2026-04-07 — Fix combat bugs A–F: ATTACK static resolve, initiative, wounds, armor AC, body type pools, NPCBodyType

- **Bug A (enemyDeath crash):** `resolveCombatRound` now calls `getEnemyDeathPool(bodyType)` instead of the non-existent `COMBAT_TEMPLATES.enemyDeath`. Template receives `{enemy, weapon}`.
- **Bug B (ATTACK wired to static engine):** `processInput` ATTACK handler calls `resolveCombatRound` for any NPC with defined stats; returns `responseType: "static"` with `combat.narrative`. Falls through to dynamic Jane only when NPC has no stats. On player win, sets `npc.isAlive: false`.
- **Bug C (initiative):** `resolveCombatRound` now rolls initiative for both sides using `weaponSpeed` from `WEAPON_DATA` and `getDexReactionBonus(dex)` from `uoData.ts`. Narrative starts with `⚡ Initiative — You: {n} · {enemy}: {n}` line. Enemy goes first when it wins; tie goes to player.
- **Bug D (wound tier pools):** `resolveCombatRound` uses `getWoundTier(dmg, maxHp, side)` with 15%/40% (player on enemy) and 10%/25% (enemy on player) cutoffs. All four narration picks (`playerHit`, `playerMiss`, `enemyHit`, `enemyMiss`) now use `getPlayerHitEnemyPool`, `PLAYER_MISS_DESCRIPTIONS`, `getEnemyHitPlayerPool`, `getEnemyMissPlayerPool` from `combatNarrationPools.ts` via `gameData.ts` re-exports.
- **Bug E (armor absorption):** `rawEnemyDmg - totalAC` where `totalAC = armorAC + shieldAC` from `ITEMS[id].stats.armorClass`. No minimum-1 clamp — full block is possible. Partial and full absorb narration from `ARMOR_ABSORB_DESCRIPTIONS` / `ARMOR_FULL_ABSORB_DESCRIPTIONS`. No HP change and no wound line when fully blocked.
- **Bug F (type consolidation):** New `lib/npcBodyType.ts` exports `NPCBodyType`. `gameData.ts` imports and re-exports it. `NPC.bodyType` unchanged. `combatNarrationPools.ts` imports `NPCBodyType` from `./npcBodyType`; `CombatBodyType` removed entirely.
- **`resolveCombatRound` new signature:** `resolveCombatRound(state, enemyId, enemyHp, {name,damage,armor}, bodyType?)`
- *(Superseded by 2026-04-04 Church session — death now uses **`applyPlayerDeath`** / Church.)*
- `npx tsc --noEmit` — clean after all changes.

*Recorded in docs 2026-04-12; implementation landed in commit `27a34e4`.*

### 2026-04-06 — +20 death lines per pool

- **`COMBAT_TEMPLATES.playerDeath`:** **48** strings. **`HUMANOID_DEATH_DESCRIPTIONS`:** **55**. **`BEAST_DEATH_DESCRIPTIONS`:** **40**. **`AMORPHOUS_DEATH_DESCRIPTIONS`:** **35**. **`UNDEAD_DEATH_DESCRIPTIONS`:** **40**.

### 2026-04-05 — Cinematic death lines (player + body-type enemy)

- **`COMBAT_TEMPLATES.playerDeath`:** **28** strings (short through long-form). **`enemyDeath` removed** from **`COMBAT_TEMPLATES`**; enemy kill uses **`HUMANOID_DEATH_DESCRIPTIONS`** / beast / amorphous / undead pools in **`gameData.ts`** and **`getEnemyDeathPool`**. **`resolveCombatRound`** uses **`fillCombat`** with **`{ enemy, weapon }`** for enemy deaths.

### 2026-04-04 — Body type narration + expanded pools

- **+5 lines** appended to each humanoid **`PLAYER_HIT_DESCRIPTIONS`** tier (12 pools), **`ENEMY_HIT_DESCRIPTIONS`** tier (3), **`PLAYER_MISS_DESCRIPTIONS`**, **`ENEMY_MISS_DESCRIPTIONS`**.
- **`NPC.bodyType?: NPCBodyType`** (**humanoid** default when omitted); beast / amorphous / undead pools + **`getEnemyHitPlayerPool`**, **`getEnemyMissPlayerPool`**, **`getPlayerHitEnemyPool`**; **`resolveCombatRound`** uses them from **`enemyData.bodyType`**.

### 2026-04-04 — Cinematic combat narration (UO absorption, crits, static ATTACK)

- **`lib/combatNarrationPools.ts` + `gameData` re-exports:** weapon category sets, **`PLAYER_HIT_DESCRIPTIONS`**, **`ENEMY_HIT_DESCRIPTIONS`**, armor absorb / full-absorb pools, miss pools; **`getWeaponCategory`**, **`WoundTier`**.
- **`resolveCombatRound`:** T2A hit chance; initiative with **`getDexReactionBonus`**; player damage pipeline (UO-style); enemy damage **raw − totalAC** (later iterations dropped halving / min-1 on enemy side); armor absorb narration. *(Later: see Session Log — critical hit **`__CRITICAL__`** + Jane rewrite in **`route.ts`**.)*
- **`ATTACK`:** Resolves one round statically; persists **`npcs[id].combatHp`**; non-hostile NPCs get a refusal line.
- **`CLAUDE_CONTEXT` §9** updated for absorption model and pool counts.

### 2026-04-16 — Rebuilt combat: T2A hit/damage + AD&D initiative

- **`resolveCombatRound`:** initiative (**1d10 + weaponSpeed − getDexReactionBonus**); T2A hit **`(skill+50)/((foeSkill+50)×2)`**; player damage from weapon roll × (1+STR%+Tactics%) − enemy AR, halved; enemy damage from dice − **totalAC**, halved; **+1 expertise** on win; returns **`initiativeWinner`**.
- **`buildStatDescription`:** **[spd]**, AC block, **Hit% vs avg enemy**, STR/Tactics %, initiative summary.

### 2026-04-15 — T2A `weaponSpeed` + AD&D DEX reaction bonus in `uoData`

- **`WEAPON_DATA`:** each weapon has **`weaponSpeed`** (1–10) from T2A UO swing speeds via **`round(10 − ((UOspeed − 10) / 48) × 9)`**; comments cite wiki.uosecondage.com/Weapons.
- **`getDexReactionBonus(dex)`:** PHB Table 2 for initiative (now used in **`resolveCombatRound`**).

### 2026-04-14 — Dexterity rename, combat DEX hit/dodge, STATS combat readout

- **`PlayerState`:** **`agility`** → **`dexterity`** (`gameState`, `gameEngine` **`STATS`**, sidebar **DEX**, `worldStateToPlayerRecord`, **`savePlayer`** upsert **`dexterity`**). Load path supports legacy **`agility`** until DB column is renamed.
- **`resolveCombatRound`:** DEX modifier **±2% per point from 10** on player hit (75% base, cap 40–95%) and enemy hit (70% base, cap 15–95%). Enemy damage still uses **total AC** from equipped armor + shield, min 1.
- **`buildStatDescription`:** **Total AC | Hit% | Dodge%**, **STR bonus to damage** line.

### 2026-04-13 — Rehydration file URL block, .cursorrules audit rule, full file list

- **READ THIS FIRST:** Step 2 confirmation text updated; **step 5** adds **📋 PASTE THESE INTO CHAT** raw URL block (audited list of all project **.ts** / **.tsx** / **.mjs** / **app/globals.css** under repo root, excluding `node_modules` / `.next` / build).
- **`.cursorrules`:** **FILE URL LIST RULE** — new source files in those extensions must add a raw GitHub URL to that block; deleted files removed from the list.

### 2026-04-12 — Combat AC from real armor + shield; STATS Total AC

- **`resolveCombatRound`:** Enemy damage uses **`armorAC + shieldAC`** from equipped **`ITEMS[].stats.armorClass`** (not flat −2 when any armor).
- **`buildStatDescription`:** **Armor** / **Shield** show **`[AC: n]`** per slot; **`Total AC`** line added.

### 2026-04-11 — Document public repo and raw GitHub URLs

- **§2 Live URLs:** GitHub labeled **(public)**; added **raw.githubusercontent.com** pattern for `main/[filename]`.
- **READ THIS FIRST — step 1:** Rehydration fetches **`CLAUDE_CONTEXT.md`** from the raw URL; notes repo is public.

### 2026-04-10 — Inventory and Sam shop: damage and AC tags

- **`buildInventoryDescription`:** weapons show **`[dmg: …]`** from **`WEAPON_DATA`** then **`ITEMS.stats.damage`**, **`[2H]`** when two-handed; armor shows **`[AC: n]`** (buckler **`[AC: 1]`**); equipped suffixes unchanged.
- **`buildSamShopListing`:** **ARMOR & SHIELDS** lines append **`[AC: n]`** from **`ITEMS[row.key].stats.armorClass`**.

### 2026-04-09 — Fixed halberd and bardiche skill from Swordsmanship to Mace Fighting

- **`WEAPON_DATA`** in `lib/uoData.ts`: **`halberd`** and **`bardiche`** `skill` set to **Mace Fighting** (was Swordsmanship).

### 2026-04-08 — Consolidate WIELD into EQUIP (single equip command)

- **`EQUIP [item]`** uses **`runEquipItemFromPhrase`**: try shield in pack → armor in pack → weapon (**`runWieldWeapon`**). **`EQUIP SHIELD`** / **`EQUIP ARMOR`** long forms unchanged.
- **`WIELD [item]`** calls the **same** router (alias; no separate behavior).
- **Player text:** BUY hint and HELP emphasize **`EQUIP`**; empty-weapon prompt is *"Equip what?"*
- **`REMOVE ARMOR`** / **`UNEQUIP ARMOR`**; generic **`REMOVE [item]`** / **`UNEQUIP [item]`** for equipped gear (weapon sheathes to **`unarmed`** in current code).
- **Autocomplete:** **`EQUIP `** suggests weapons + shields + body armor from inventory; **`WIELD `** mirrors those targets.

### 2026-04-07 — Equip system: buy → inventory only, explicit equip, INVENTORY tags

- **`BUY` (Sam):** All purchases (weapons, buckler, leather, chain) **only** increment **`player.inventory`** — no auto **`shield`** / **`armor`** / **`weapon`**. Removed purchase-time two-handed vs buckler block (shield is not applied on buy).
- **`EQUIP SHIELD` / `SHIELD`:** Resolves shield **from inventory only** (removed “match equipped shield” shortcut). Equipping sets **`player.shield`** and **does not remove** the stack from inventory.
- **`EQUIP ARMOR`:** New static path for **`leather_armor`** / **`chain_mail`** from inventory → **`player.armor`**; messages *"Thou dost not carry that armor."* / *"{Name} equipped."*; bare **`EQUIP <key>`** routes body armor like buckler routes to shield.
- **`WIELD`:** Already required inventory; unchanged behavior aside from global buy flow.
- **`INVENTORY`:** Lines show **`(xN)`** plus **`(wielded)`**, **`(shield equipped)`**, **`(armor equipped)`**; gold lines suffixed with **`gp`**.
- **Autocomplete:** **`EQUIP ARMOR …`** suggestions for body armor in pack.

### 2026-04-06 — BUY persistence, EQUIP SHIELD / EQUIP buckler, dev gold bump

- **BUG 1 (BUY not updating inventory/shield/armor):** Engine `runSamPurchase` now builds a single **`nextPlayer`** snapshot after `updatePlayerGold` (buckler → `shield`, leather/chain → `armor`, weapons → new/merged **`inventory`** array). Root cause of “lost” purchases was **`/api/chat` reloading state from Supabase only** and ignoring the client’s **`worldState`**, so the next command ran on stale DB before async `savePlayer` finished. **Fix:** after a successful `loadPlayer`, if the request body’s **`worldState.player.id`** matches the saved player, **merge** rooms/npcs/events/chronicle/worldTurn and **player** from the client over the DB-built state (keep canonical `id` / `name` from DB).
- **BUG 2 (EQUIP SHIELD after buy):** **`matchShieldFromPhrase`** now also matches the **equipped** `player.shield` (e.g. buckler from Sam’s shop). **`runEquipShield`** short-circuits if already bearing that shield.
- **BUG 3 (EQUIP BUCKLER → weapon path):** After `EQUIP SHIELD …`, **`EQUIP <phrase>`** checks **`isShieldSlotItem(asKey)`** (underscore-normalized) and routes to **`runEquipShield`** before **`runWieldWeapon`**.
- **BUG 4 (starting gold 50):** *Superseded (2026-04-04):* new characters now start at **`0`** gold; the route’s **`< 1000` → 10000** bump was **removed** so destitute onboarding is real.

### 2026-04-05 — Static Sam shop + main_hall JSON Jane (testing)

- **`lib/gameData.ts`:** Added `SamShopRow`, **`SAM_INVENTORY`** (full weapon/armor/shield table); `sam_slicker.merchant.inventory` = `SAM_INVENTORY.map(r => r.key)`; added **`ITEMS`** entries for every Sam weapon key; `buckler` **value** set to **30** to match Sam price.
- **`lib/gameEngine.ts`:** Tier-1 **`SHOP` / `SAM` / `LIST`** and **`BUY`** (with/without arg) in **`main_hall`** only; boxed listing with `WEAPON_DATA` skill/damage; **`BUY`** match/partial match, gold check, inventory vs armor vs buckler→shield; wrong room static hint; autocomplete for `SHOP`/`LIST`/`SAM` in Main Hall.
- **`app/api/chat/route.ts`:** **`completeJaneNonStream`**; **`streamJane(..., asBufferedJson)`** — when engine returns **dynamic** and room is **`main_hall`**, respond with **`NextResponse.json({ response, worldState })`** (situation block included in `response`).
- **`app/page.tsx`:** If response **`Content-Type`** includes **`application/json`**, **`res.json()`**, append assistant message in full (no typing animation), update state from **`worldState`**.
- **CLAUDE_CONTEXT.md:** This update.

### 2026-04-04 — User instruction style note (top of CLAUDE_CONTEXT)

- Prepended a USER NOTE blockquote for Claude: spell out every step for a non-developer (clicks, typing, terminal). No code or game logic changes.

### 2026-04-04 — CLAUDE_CONTEXT.md and Cursor maintenance rule

- Added root `CLAUDE_CONTEXT.md` as full project rehydration doc (file map, architecture, player/world/merchant/weapon/art/Supabase/env/issues/milestones/next/session log).
- Added `.cursorrules` requiring Cursor to update this file on every codebase change and commit it with code.
- Documented actual `gameData` merchants (Hokas, Sam, Pip) and inventories; noted `savePlayer` does not persist spells/deities; noted `main_hall_exit` room state gap; art output path vs empty `public/` in repo.
- No application logic changed in this commit aside from documentation and Cursor rules.

---
