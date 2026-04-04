> 🧑 USER NOTE: This user is not a developer. They need explicit step-by-step instructions for every action — including where to click, what to type, and what terminal commands to run. Never assume they know how to do something. Always spell it out completely.

---

# ⚡ CLAUDE — READ THIS FIRST

You are being rehydrated into the Living Eamon project.

Every time you start a new conversation about this project, do this:
1. Fetch this file from GitHub and read it completely before responding
2. After reading, confirm rehydration with one line:
   "Rehydrated. [X] milestones complete. Currently: [top Next Up item]."
3. Every time you write a Cursor prompt that changes the codebase,
   end that prompt with:
   "After making these changes, update CLAUDE_CONTEXT.md: update all
   relevant sections, add a Session Log entry at the top, move any
   completed items from Next Up to Completed Milestones, update the
   Last Updated date, then commit CLAUDE_CONTEXT.md in the same commit
   as the code changes."
4. Never write a Cursor prompt that omits step 3. The file must stay
   current at all times.

---

# Living Eamon — Claude Rehydration Document
*Auto-maintained by Cursor. Updated every time the codebase changes.*
*Last updated: April 7, 2026*

## 1. Project Overview

Living Eamon is an AI-powered recreation of the classic Apple II text-adventure system **Eamon**, intended for **LivingEamon.ai**. It features a persistent living world, the AI narrator **Jane**, virtue tracking, a consequence engine (room/NPC state, bounties, chronicle), and Ultima Online–inspired item/weapon metadata and batch icon generation.

**Tech stack (runtime):** Next.js (App Router), TypeScript, React 19, Supabase (Postgres), Vercel deployment, **Anthropic Claude** (Jane via `/api/chat`), **xAI Grok** (optional text via OpenAI-compatible API; image generation in `scripts/`). Tailwind CSS v4 is a project dependency (PostCSS); the main play UI in `app/page.tsx` is largely **inline-styled**.

## 2. Live URLs

- Production: https://living-eamon.vercel.app
- GitHub: https://github.com/scotch-glass/living-eamon
- Supabase project (informal name in docs): living-eamon

## 3. Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind v4 (dependency); primary game UI uses inline styles in `app/page.tsx`
- Database: Supabase (Postgres)
- AI narrator: Anthropic Claude (`claude-sonnet-4-20250514`) via `app/api/chat/route.ts`; optional Grok `grok-3` for streaming when `GROK_API_KEY` is set. **Testing:** when `processInput` returns `dynamic` and `player.currentRoom === "main_hall"`, `/api/chat` returns **JSON** `{ response, worldState }` (full Jane text, no stream) instead of chunked `text/plain`.
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
| `lib/gameData.ts` | Static world: `MAIN_HALL_ROOMS`, `NPCS`, `ITEMS`, `SAM_INVENTORY`, `ADVENTURES`, `COMBAT_TEMPLATES` |
| `lib/gameState.ts` | Types (`PlayerState`, `WorldState`, …), `createInitialWorldState()`, state mutators, `tickWorldState`, `applyFireballConsequences` |
| `lib/gameEngine.ts` | `processInput`, autocomplete, `buildSituationBlock`, combat, banking, WIELD/EQUIP/SHIELD, **Sam shop** (`SHOP`/`LIST`/`SAM`, `BUY` in `main_hall`), `extractDirection` (token-safe) |
| `lib/uoData.ts` | `WEAPON_DATA`, `isTwoHanded()`, `rollWeaponDamage()` |
| `lib/supabase.ts` | `browserClient`, `serviceClient`, `savePlayer`, `loadPlayer`, `createPlayer`, world object cache, room/NPC state, Jane memory, chronicle, `checkAndDecrementJaneCalls` |
| `app/layout.tsx` | Root layout |
| `app/globals.css` | Global CSS |
| `app/page.tsx` | Client UI: name gate, chat log, `CommandInput`, sidebar, **JSON vs stream** handling for `/api/chat` (`application/json` = instant append; else char streaming + `__STATE__`) |
| `app/api/chat/route.ts` | POST: load/merge player, `processInput`, Jane stream or **buffered JSON** in `main_hall`+dynamic, `completeJaneNonStream`, `savePlayer`, situation append |
| `app/api/player/route.ts` | POST create player name; GET load player by id |
| `components/CommandInput.tsx` | Command bar with engine-driven autocomplete |
| `scripts/generate-all-art.mjs` | Batch UO-style PNGs via Grok image API → `public/uo-art/items/{artId}.png` |
| `scripts/test-plate-chest.mjs` | Single-item art test |
| `public/*.svg` | Default Next/Vercel assets (`public/uo-art` may be generated locally and not committed) |

## 5. Game Architecture

**Tier 1 — Static engine:** Movement (`GO`, single-letter dirs), `LOOK`, `EXAMINE`, `GET`/`DROP`, `STATS`/`INVENTORY`, `WIELD`, `EQUIP`/`EQUIP SHIELD`/`EQUIP ARMOR`/`SHIELD`, vault `DEPOSIT`/`WITHDRAW`, **`SHOP` / `LIST` / `SAM` and `BUY` in `main_hall`** (Sam’s `SAM_INVENTORY`), static combat round helper, fireball consequence hook, etc. Implemented in `lib/gameEngine.ts`; **no** LLM call when `responseType === "static"`.

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
- `agility`: `number`
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

**Default values for a new world** (`createInitialWorldState(playerName)`):

- `id`: `"player_1"` until replaced by Supabase id in chat route
- `name`: `playerName` argument (default `"Adventurer"`)
- `currentRoom`: `"main_hall"`
- `previousRoom`: `null`
- `hp` / `maxHp`: `20` / `20`
- `strength`: `12`, `agility`: `10`, `charisma`: `10`, `expertise`: `0`
- `gold`: `10000`, `bankedGold`: `0`
- `weapon`: `"short_sword"`, `armor`: `null`, `shield`: `null`
- `inventory`: `[{ itemId: "short_sword", quantity: 1 }]`
- All virtues: `0`
- `reputationScore`: `0`, `reputationLevel`: `"neutral"`, `knownAs`: `null`
- `currentAdventure`: `null`, `completedAdventures`: `[]`, `activeQuests`: `[]`
- `bounty`: `0`, `isWanted`: `false`, `prisonTurnsRemaining`: `0`
- `turnCount`: `0`, `lastAction`: `null`
- `knownSpells`: `["BLAST", "HEAL", "LIGHT", "SPEED"]`, `knownDeities`: `[]`

## 7. World State

### Rooms (`MAIN_HALL_ROOMS` in `lib/gameData.ts`)

| id | name | Exits | NPCs (static list) | Default floor items | Notable `stateModifiers` |
|----|------|-------|--------------------|----------------------|---------------------------|
| `main_hall` | The Main Hall | north→`armory`, east→`notice_board`, south→`main_hall_exit`, down→`guild_vault` | hokas_tokas, sam_slicker, old_mercenary | notice_board_key | `burnt`, `ransacked`, `dark` |
| `armory` | The Guild Armory | south→`main_hall` | armory_attendant | short_sword, leather_armor, torch, rope | _(none)_ |
| `notice_board` | The Notice Board | west→`main_hall` | _(none)_ | _(none)_ | _(none)_ |
| `main_hall_exit` | The Guild Entrance | north→`main_hall` | door_guard | _(none)_ | _(none)_ |
| `guild_vault` | The Guild Vault | up→`main_hall` | brunt_the_banker | _(none)_ | _(none)_ |

**`createInitialWorldState.rooms` keys:** `main_hall`, `armory`, `notice_board`, `guild_vault` only (not `main_hall_exit`). `door_guard` NPC state uses `location: "main_hall_exit"`.

### NPC catalog (`NPCS` in `gameData.ts`) — default disposition in fresh state

| npcId | Name | Default disposition (`createInitialWorldState`) | Default location |
|-------|------|-----------------------------------------------|------------------|
| hokas_tokas | Hokas Tokas | friendly | main_hall |
| sam_slicker | Sam Slicker | neutral | main_hall |
| old_mercenary | Aldric the Old | neutral | main_hall |
| brunt_the_banker | Brunt | neutral | guild_vault |
| armory_attendant | Pip | neutral | armory |
| door_guard | The Door Guard | neutral | main_hall_exit |

## 8. Merchants

**Sam (Main Hall):** prices and keys come from **`SAM_INVENTORY`** in `lib/gameData.ts` (static `SHOP` / `BUY`). **`NPCS.sam_slicker.merchant.inventory`** is `SAM_INVENTORY.map(r => r.key)` for autocomplete.

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

- **Static commands (Main Hall only):** `SHOP`, `SAM`, `LIST`, or `BUY` with no argument → formatted listing; `BUY <item>` → gold check, **everything stacks in `player.inventory` only** (no auto-equip). Player uses **`WIELD`**, **`EQUIP SHIELD`** / **`SHIELD`**, or **`EQUIP ARMOR`** to set equipped slots.
- Elsewhere: `SHOP`/`SAM`/`LIST` → static hint to go to Main Hall; `BUY` → still **Jane**.

### Pip (armory attendant) — Guild Armory (`armory_attendant`)

- Personality (summary): Young apprentice; wants to adventure; chatty about posted adventures.
- Inventory: `short_sword` (15g), `leather_armor` (20g), `buckler` (30g per `ITEMS`), `torch` (2g), `rope` (5g), `rations` (3g)

## 9. Weapon & Equip System

- **Data:** `lib/uoData.ts` — `WEAPON_DATA`: keys are weapon item ids; each entry has `artId`, `twoHanded`, `skill`, `damage` (`"min-max"` string), `layer` (1 = one-handed, 2 = two-handed).
- **`isTwoHanded(weaponKey)`:** `WEAPON_DATA[weaponKey]?.twoHanded ?? false`.
- **`rollWeaponDamage(weaponKey)`:** Parses `damage` range; if key missing, returns uniform **1–5**.
- **Combat:** `resolveCombatRound` in `gameEngine.ts` uses `rollWeaponDamage(player.weapon) +` strength bonus (not `ITEMS[].stats.damage` dice).
- **Buy flow:** Sam **`BUY`** (and any future static shops) add items **only** to **`player.inventory`**. Nothing auto-fills **`weapon`**, **`armor`**, or **`shield`** on purchase.
- **Equip flow (all require the item in inventory):**
  - **`WIELD`** — match weapon in inventory → set `player.weapon` (two-handed vs shield guard unchanged).
  - **`EQUIP SHIELD`** / **`SHIELD`** / bare **`EQUIP buckler`** — match shield-slot item in inventory → set `player.shield`; item **stays** in inventory.
  - **`EQUIP ARMOR …`** / bare **`EQUIP leather_armor`** / **`chain_mail`** — match `leather_armor` or `chain_mail` in inventory → set `player.armor`; item **stays** in inventory.
- **`INVENTORY` / `I`:** Each line shows `(xN)` plus **`(wielded)`**, **`(shield equipped)`**, **`(armor equipped)`** when that row’s `itemId` matches the active slot.
- **`STATS`:** Still shows equipped **Weapon / Armor / Shield** from `player.weapon` / `player.armor` / `player.shield` (resolved names via `ITEMS`).
- **Shield slot items:** `isShieldSlotItem` — currently **`buckler`** only. **Body armor slot:** `leather_armor`, `chain_mail` (`isBodyArmorSlotItem`).
- **UI:** Sidebar shows *"— both hands occupied —"* when a two-handed weapon is equipped (`app/page.tsx` + `isTwoHanded`).

## 10. Art System

- Output path (script): `public/uo-art/items/[numeric artId].png` (created by `scripts/generate-all-art.mjs`; folder may be absent in a fresh clone).
- Model: **`grok-imagine-image`** (xAI Images API).
- Batch script: `scripts/generate-all-art.mjs` (reads `GROK_API_KEY` from `.env.local`).
- Test script: `scripts/test-plate-chest.mjs`.
- Paperdoll figures, male/female layered wearables: **not built** (parked).
- Item icons are treated as gender-neutral inventory sprites; future paperdoll would need layered male/female assets.

## 11. Supabase Schema (inferred from code)

No SQL migrations live in this repo. The following is **inferred** from `lib/supabase.ts` and `app/api/chat/route.ts`.

**`players` table — columns touched by `savePlayer` upsert (camelCase → snake_case in DB):**

| Column (snake_case) | Inferred type / notes |
|---------------------|------------------------|
| `id` | UUID / text (primary key) |
| `character_name` | text |
| `hp`, `max_hp` | number |
| `strength`, `agility`, `charisma`, `expertise` | number |
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
- [x] Starting gold `10000` for new initial state
- [x] Direction parsing: `extractDirection` uses whole tokens (fixes `STATS` / substring false positives)
- [x] Batch art script targeting Grok image API (`grok-imagine-image`)
- [x] `CLAUDE_CONTEXT.md` + `.cursorrules` maintenance rule
- [x] **`SAM_INVENTORY`** + static Sam shop in **Main Hall** (`SHOP` / `LIST` / `SAM`, `BUY`); `ITEMS` extended for all Sam weapon keys; `NPCS.sam_slicker.merchant.inventory` driven by `SAM_INVENTORY`
- [x] **main_hall + dynamic** → JSON Jane response + **client** handles `application/json` vs stream

## 15. Next Up

- [ ] **Re-enable Jane streaming in `main_hall`** (or gate behind env) before production — see Known Issues
- [ ] Persist `known_spells` / `known_deities` in `savePlayer` + `worldStateToPlayerRecord`
- [ ] Static structured shop for Pip (beginner gear)
- [ ] Align any remaining `WEAPON_DATA`-only keys with `ITEMS` if new shops add them
- [ ] End-to-end test of two-handed blocking in UI
- [ ] Supabase migration file in repo documenting `players` + `shield` column
- [ ] Push/deploy verification after local tests
- [ ] Male / female paperdoll art and compositor

## 16. Session Log

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
- **BUG 4 (starting gold 50):** `createInitialWorldState` already uses **`gold: 10000`**; old rows kept **`50`** in Supabase. **Fix:** after merge, if **`player.gold < 1000`**, set **`gold` to `10000`** and **`savePlayer`** once (dev/stale-test bump; does not lower gold for rich characters).

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
