Living Eamon — Claude Context & Rehydration Guide

REHYDRATION INSTRUCTIONS FOR EVERY NEW SESSION
Before doing any work, read these files in order:

1. This file (CLAUDE_CONTEXT.md) — project overview, architecture, current status
2. GAME_DESIGN.md — full game design document
3. .claude/projects/-Users-joshuamcclure-Desktop-living-eamon/memory/MEMORY.md — memory index with links to:
   - User profile (Scotch — non-developer founder)
   - Feedback rules (image cache safety, CLAUDE_CONTEXT.md updates, etc.)
   - Project decisions (Aquilonia styling, PD adaptation plan, etc.)
4. §5.4 below — HWRR combat system status (Phases 1-2 complete, Phases 3-6 remaining)

Check the todo list for in-progress tasks from the previous session.

These documents together contain everything needed to work on Living Eamon without losing context. Read them before writing a single line of code or advice.


§1 — Project Identity
Living Eamon is a persistent, AI-driven text adventure — a spiritual successor to the 1980 classic Eamon. One hero carries across hundreds of adventures and infinite procedurally-regenerated realms. The world is alive, reactive, and builds itself through play. An ancient intelligence named Jane watches every decision and quietly turns the universe into a mirror of the player's soul.
Repository: github.com/scotch-glass/living-eamon
Local path: /Users/joshuamcclure/Desktop/living-eamon
Hosting: Vercel
Status: Active development — single-player first, multiplayer Phase 3

§2 — Player / Owner Context
Name: Joshua McClure (goes by Scotch)
Role: Non-developer founder/designer
Critical rule: All technical instructions must be delivered as explicit, unambiguous step-by-step instructions OR as precise Cursor AI prompts. No vague guidance. No mixing general advice with explicit steps. If Scotch needs to do something in code, write the exact Cursor prompt he pastes verbatim, or the exact terminal command, or the exact SQL to run — nothing less.

§3 — Tech Stack
LayerTechnologyFrontendNext.js 16 + React 19 + TypeScriptBackendNext.js API routesDatabaseSupabase (PostgreSQL)AI — NarratorGrok (xAI) ("Jane")AI — World/StoryGrok (xAI) — primary LLM for world generation and story arcsAI — ArtGrok Imagine Pro (xAI) — all scene and character image generationHostingVercel
Important Next.js 16 note: Route protection uses proxy.ts — NOT middleware.ts. This is a Next.js 16 convention change. Never write middleware.ts for route protection in this project.
Environment variables required:
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
XAI_API_KEY=
GROK_IMAGINE_BASE_URL=https://api.x.ai/v1/images/generations

§4 — Architecture: Static With State
The world is pre-written and stateful. Jane only generates content when something genuinely novel occurs. Once Jane writes it, it's saved permanently to Supabase and served to every subsequent player for free.
Engine decision tree:
Player input
  → Static intent? (movement, inventory, stats, look, banking)
      → Return immediately, zero API cost
  → World object DB cache hit? (Supabase)
      → Return cached description, zero API cost
  → Dynamic (conversation, magic, moral choice, unexpected)
      → Call Jane → stream response → save to Supabase (World Cache) 
Cost model:

Movement, inventory, stats: free
Room descriptions: free (after first generation)
Cached world objects: free
NPC conversation, magic, moral choices: ~$0.009/call
Typical 30-minute session: ~$0.15


§5 — Current Development Status (April 2026)
Most recent combat fix commit: 27a34e4 — bugs A–F resolved
Completed systems:

Authentication: email/password + Google SSO scaffolding, cookie-based sessions via @supabase/ssr, proxy.ts route protection, server actions for auth, /login and /register pages
user_id FK column linking players to auth.users
Jane daily call limit: unlimited in development via NODE_ENV check
Combat system — HWRR-style body-part targeting COMPLETE (all 6 phases). See §5.4 below.
10-virtue moral system
Consequence engine (burnt rooms, NPC memory, Sheriff alerts, bounties)
NPC agenda system
Living World Database (object descriptions generated once, saved permanently)
Streaming chat interface with character-by-character animation + Space to skip
HEALTH command — prescripted, 5 severity pools, no Jane call
Modular adventure system — rooms, NPCs, cold opens, scene data defined per-adventure in lib/adventures/
Adventure registry — lib/adventures/registry.ts merges all modules, provides getRoom(), getScriptsForRoom()
NPC scripted interactions — condition-triggered scripts (on_enter, on_response) live in adventure NPC files, not route.ts
Fog-of-war exit labels — situation block hides destination names for unvisited rooms (visitedRooms on PlayerState)
Scene image crossfade — two-layer system, fade-to-black on room change, fade-in from black when new image loads
Scene tone system — per-room sceneTone (pastoral/civilized/aquilonian/grimdark), resolved from room data
Barmaid selection system — Aldric's drink offer triggers __BARMAID_SELECT__ token, Grok Imagine portraits, player choice stored as barmaidPreference
Image cache safety — soft-delete (deleted_at), approved flag, scripts/image-cache.sh management tool
Supabase CLI linked — migrations via Management API (scripts/db-push.sh)

§5.1 — Starting Area: Ostavar (Aquilonian Hub)
Ostavar is styled after Aquilonia from Robert E. Howard's Hyborian Age — the Conan-universe equivalent of Tolkien's Gondor. Marble colonnades, gilt towers, Frazetta/Brom art style.

Current rooms (lib/adventures/guild-hall.ts):
- Church of Perpetual Life (spawn/respawn, grimdark tone, cold open with __YESNO__)
- Guild Courtyard (Dufus training dummy, Sam's sign=sword+shield, Pots & Bobbles sign=red potion bottle, live weather)
- Sam's Sharps (weapons shop, moved from Main Hall)
- Main Hall (Hokas bar, Aldric veteran, 3 barmaids — Lira/Mavia/Seraine, notice board, members chest)
- Notice Board (3 adventure postings)
- Armory (Pip attendant)
- Guild Vault (Brunt banker)
- Pots & Bobbles / Mage School (south of courtyard, Zim wizard, potions, reagents, identification, magic training)
  - Larger inside than outside (subtle magical architecture)
  - Sells: healing potions, stamina/fatigue brews, antidotes, bandages, tourniquets, poisons, mana potions
  - Buys: herbs and reagents (mandrake, ginseng, nightshade, black pearl, blood moss, spider silk, mysterious baubles)
  - Services: magical item identification (small fee), magic training (HEAL = 100g discounted)
  - Zim warns about cursed/corrupted items, crosses himself (shoulder-shoulder-forehead-heart-kiss)

NPC scripts (lib/adventures/guild-hall-npcs.ts):
- aldric_welcome — on_enter Main Hall when remembersOwnName=false, name reveal + tutorial chips + combat training YES/NO
- aldric_training_response — on_response YES moves to courtyard + Dufus intro, NO proceeds to barmaid select
- barmaid_select_response — on_response, handles LIRA/MAVIA/SERAINE choice, stores barmaidPreference
- zim_welcome — on_enter Pots & Bobbles when metZim=false, foot-in-mouth intro, spell curriculum + HEAL discount YES/NO
- zim_heal_response — on_response, YES+gold teaches HEAL, YES+broke gives reagent/identification speech

§5.2 — Key Architecture Files
| File | Purpose |
|------|---------|
| lib/roomTypes.ts | Room, AdventureModule, NPCScript, RoomColdOpen interfaces |
| lib/adventures/registry.ts | Module loader, ALL_ROOMS, getRoom(), getScriptsForRoom() |
| lib/adventures/guild-hall.ts | All starting area rooms with scene data |
| lib/adventures/guild-hall-npcs.ts | Aldric/barmaid scripted interactions |
| lib/sceneData.ts | Tone modifiers, style references, buildScenePrompt() — reads from getRoom() |
| lib/combatTypes.ts | BodyZone, CombatantState, StrikeResolution, ActiveCombatSession, NPCCombatProfile |
| lib/combatEngine.ts | 3-roll strike resolution, round resolution, enemy AI, status ticks, combatant builders |
| lib/combatZoneNarration.ts | Zone-specific narration pools, buildZoneStrikeNarrative(), injury/crit narration |
| components/CombatScreen.tsx | Full-screen combat overlay — PaperDoll, log, strike/flee buttons |
| components/PaperDoll.tsx | SVG clickable body zones — color-coded by armor/wounds/selection |
| lib/gameData.ts | NPCs, Items, SAM_INVENTORY — re-exports Room types from roomTypes.ts |
| app/api/scene-image/route.ts | Grok Imagine scene generation + cache (soft-delete aware) |
| app/api/barmaid-image/route.ts | Grok Imagine portrait generation for barmaids |
| scripts/image-cache.sh | list/approve/delete/recover cached images |
| scripts/db-push.sh | Run SQL migrations via Supabase Management API |

§5.3 — Supabase Schema Additions (April 10-11 2026)
- players.visited_rooms text[] — fog-of-war room tracking
- players.barmaid_preference text — Aldric drink offer choice
- scene_image_cache.deleted_at timestamptz — soft delete
- scene_image_cache.approved boolean — protects accepted images from accidental clearing

§5.4 — HWRR Combat System Rewrite (In Progress)
Replacing flat ATTACK [enemy] with Heads Will Roll Reforged-style body-part targeting.
Status tracked in §5.4 below (plan file archived).

4 target zones: head (1.5x dmg), neck (2.0x), torso (1.0x), limbs (0.8x)
3-roll attack resolution: Evasion (+ zone accuracy penalty) → Shield Block → Armor Penetration (per-zone cover rating)
Zone evasion penalties (HWRR-faithful): torso +0, limbs +10, head +30, neck +50 — smaller targets are harder to hit
Evasion formula: (defender.agility × 0.8) − (attacker.agility × 0.4) + zone penalty + injury mods, capped 0-95%
Armor dex penalties: each armor piece has dexPenalty (leather 1-2, chain 3-5, plate 6-12, buckler 1) — cumulative, subtracted from agility
Mounted state: player.mounted boolean — plate armor uses mountedDexPenalty when mounted (plate on horseback ≈ chain on foot)
Plate armor: 4 pieces (plate_helm/gorget/cuirass/greaves), 5000 gp total, customFit=true, on-foot dexPenalty=36 total (crippling), mounted=13 (viable)
Unarmored barbarian archetype: high DEX + no armor = full agility → high evasion + high accuracy (Conan-faithful)
Per-zone armor with degradation (durability decreases on hit, pieces break)
Zone-specific injuries: concussion, damaged_eye (head), severed_artery, crushed_windpipe (neck), pierced_lung, cracked_ribs (torso), broken_arm, broken_leg (limbs)
Status effects stack with severity (1-3) and duration
Enemy AI targeting: low-skill enemies favor torso, high-skill target weakest zone
No stamina system (excluded by design)
Combat UI: paper doll SVG with clickable zones, combat screen overlay, combat log

COMPLETED:
- Phase 1: lib/combatTypes.ts — all type definitions (BodyZone, CombatantState, StrikeResolution, ActiveCombatSession, etc.)
- Phase 1: PlayerState extended — helmet, gorget, bodyArmor, limbArmor, activeCombat fields
- Phase 1: NPC interface extended — optional combatProfile (agility, weaponSkill, per-zone armor, shield)
- Phase 1: Item interface extended — zoneSlot, zoneCover, zoneDurability, shieldBlockChance, shieldDurability
- Phase 1: New armor items — leather_cap, iron_helm, leather_gorget, chain_coif, leather_greaves, chain_greaves
- Phase 1: Existing armor updated — leather_armor/chain_mail get torso zone data, buckler gets shieldBlockChance
- Phase 1: Supabase migration — helmet, gorget, body_armor, limb_armor, active_combat columns
- Phase 1: Save/load updated in supabase.ts and route.ts
- Phase 2: lib/combatEngine.ts — complete 3-roll resolution engine with:
  - resolveStrike() — evasion/block/armor/damage/injury per hit
  - applyStrike() — applies damage + durability loss + injury effects to combatant
  - tickStatusEffects() — bleed damage, duration decrement
  - chooseEnemyTargetZone() — AI targeting based on weapon skill
  - buildCombatantFromPlayer/NPC() — constructs unified CombatantState
  - deriveZonesFromFlatArmor() — backward compat for NPCs without combatProfile
  - resolveCombatRound() — full round: tick → initiative → first strike → second strike
  - initCombatSession() — creates ActiveCombatSession from WorldState
  - buildRoundNarrative() — assembles combat text from round result
- Phase 2: gameEngine.ts ATTACK handler rewrite:
  - ATTACK [enemy] now initiates HWRR combat → stores ActiveCombatSession on player.activeCombat, emits __COMBAT_START__
  - STRIKE HEAD/NECK/TORSO/LIMBS → resolves one HWRR round per command, syncs HP/injuries/armor durability
  - __COMBAT_END__ emitted on victory, death, or flee
  - Combat-mode guard blocks non-combat commands while activeCombat is set (STRIKE/FLEE/HEALTH/HELP only)
  - FLEE checks for broken_leg injury preventing escape, clears activeCombat on success
  - Autocomplete shows STRIKE zone targets when in combat, blocks other suggestions
  - HELP text updated with STRIKE documentation

- Phase 3: Player equipment migration + NPC fallback:
  - EQUIP ARMOR routes items to correct zone slot based on zoneSlot field (helmet/gorget/bodyArmor/limbArmor)
  - isBodyArmorSlotItem() now matches any item with type=armor + zoneSlot (not hardcoded ids)
  - REMOVE ARMOR doffs all zone armor at once, UNEQUIP [item] removes specific zone piece
  - Inventory display: shows zone coverage % instead of flat AC, "(worn)" tag for equipped zone pieces
  - Stats display: per-zone armor breakdown (Head/Neck/Torso/Limbs with cover% and durability)
  - Shield display: shows block% and durability instead of flat AC
  - All goblin NPCs + Goblin King now have explicit combatProfile (agility, weaponSkill, per-zone armor)
  - Legacy armor field auto-synced: save derives armor from bodyArmor; load falls back armor→bodyArmor
  - Old resolveCombatRound() still exists in gameEngine.ts as dead code (safe to remove later)

- Phase 4: lib/combatZoneNarration.ts — zone-specific combat narration:
  - Zone-aware narration pools: evasion, shield block, armor stop, hit (player→enemy + enemy→player)
  - Per-zone evasion flavors (ducking head strikes vs sidestepping torso blows)
  - Shield/armor block + broken variants per zone
  - Player hit pool: zone × weapon category × wound tier (4×4×3 = 48 pool combos)
  - Enemy hit pool: zone × wound tier (4×3 = 12 pool combos)
  - Injury narration for all 9 StatusEffectTypes (bleed, concussion, damaged_eye, etc.)
  - Critical hit zone-specific prefixes
  - buildZoneStrikeNarrative() assembles full narrative from StrikeResolution
  - getZoneWoundTier() derives wound tier from damage/maxHp ratio
  - buildRoundNarrative() in combatEngine.ts now uses zone narration instead of simple strings
  - Template vars: {attacker}, {defender}, {weapon}, {enemy}, {damage}, {zone}

- Phase 5: Zone-specific equipment commands + sidebar display:
  - EQUIP HELMET/GORGET/GREAVES [item] — zone-filtered equip commands with autocomplete
  - REMOVE HELMET/GORGET/GREAVES — per-zone armor removal (REMOVE ARMOR still doffs all)
  - runEquipZoneArmor() filters inventory by target zone; lists available if no argument
  - runRemoveZoneArmor() removes a single zone slot
  - matchArmorFromPhrase() now accepts optional filterZone parameter
  - Autocomplete for all three zone-specific EQUIP commands (filters by zoneSlot)
  - HELP text expanded with all zone equip/remove commands
  - Sidebar (app/page.tsx): ARMOR section shows Head/Neck/Body/Limbs with equipped item or "—"

- Phase 6: Combat UI — CombatScreen overlay + PaperDoll + page.tsx combat mode:
  - components/PaperDoll.tsx: SVG front-facing body with 4 clickable zones (head/neck/torso/limbs)
    - Zone colors: blue=armored, gray=exposed, orange/red=wounded, amber=selected
    - Click to select target zone, disabled when waiting for response
  - components/CombatScreen.tsx: full-screen glassmorphism overlay during combat
    - Left: PaperDoll + player HP bar + player status effects
    - Center: enemy HP bar + enemy status effects + scrollable combat log
    - Bottom: zone selector buttons with difficulty hints + STRIKE/FLEE buttons
    - Round counter header
  - app/page.tsx combat mode integration:
    - inCombat state derived from worldState.player.activeCombat !== null
    - __COMBAT_START__/__COMBAT_END__ tokens stripped from display text
    - combatLog state accumulates round narratives (last 20)
    - CombatScreen rendered as fixed overlay (z-index 50) when inCombat
    - CombatScreen onCommand wired to sendMessage() for STRIKE/FLEE
    - Rehydration sync: sets inCombat on page load if activeCombat exists

HWRR COMBAT SYSTEM REWRITE — ALL 6 PHASES COMPLETE.

§5.5 — Three-Tier Description Verbosity System
Rooms, items, and NPCs support three verbosity levels:
- Verbose: EXAMINE ROOM / SEARCH — full room.description. Thorough examination, takes time. Rewards attention.
- Semiverbose: LOOK / first visit — room.look (2-4 sentences). Orientation, what matters, where exits are.
- Nonverbose: Revisit/flee/pass-through — room.glance (1-2 sentences). No robe humiliation.
Exception: Church cold open uses the coldOpen system (bypasses buildRoomDescription) for full verbose on first spawn.
New fields: Room.look (semiverbose), Room.glance (nonverbose), Item.glance, NPC.glance — all optional, fall back gracefully.
Commands: LOOK = semiverbose. EXAMINE ROOM / SEARCH / SEARCH ROOM = verbose. EXAMINE [target] / SEARCH [target] = examine specific object.
buildRoomDescription() accepts Verbosity param. Movement checks visitedRooms before movePlayer().
Inventory display appends item.glance after item name when present.
All 7 guild-hall rooms have look + glance strings. All hub NPCs have glance strings. Key starter items have glance.

§5.6 — Amnesia & Name-Revelation System
The hero has lost their memory. NPCs in the hub recognize the hero but notice the amnesia and try not to mention it.
- Hokas, Sam, Aldric: greetings show subtle recognition without confronting the memory loss
- player.remembersOwnName (boolean, default false): first BEG interaction with Hokas/Sam/Aldric triggers name-revelation
- Name revelation: NPC says the hero's name → hero is startled → NPC explains:
  - If wearing gray robe: points to the name stitched into the gown hem
  - If not wearing robe: "I know you from before... just the name and that I've seen you around"
- After revelation: remembersOwnName = true, subsequent interactions are normal
- maybeRevealName() helper in gameEngine.ts — wraps any NPC response with the revelation scene
- Sam's BEG works in both main_hall and sams_sharps
- Aldric's Welcome Flow (replaces old drink offer):
  - on_enter in main_hall when remembersOwnName=false: buys drink, says name, reveals identity
  - Explains situation: "Last you left, thou were armed for slaughter. I'm guessing ye lost."
  - Offers command tutorial via __CMD chips (survival, combat, adventures, etc.)
  - "Ask yourself for HELP if you forget" chip
  - Asks "Would you like to remember how to fight?" → __YESNO__
  - YES: moves to courtyard, introduces training dummy as "Dufus"
  - NO: proceeds to barmaid selection
- Training dummy renamed to "Dufus" — DUFUS carved into forehead
- Aldric personality: most talkative/forthcoming NPC, knows hero from before, covers heartbreak with gruff practicality

Pending / next up (non-combat):
Player creation screen / psychological profile questionnaire (pre-cold-open)
Variable substitution engine for PD prose placeholders
Legacy flag system (append-only cross-module persistence)
Content gate system (player-level opt-in, controls module section visibility)
First adventure module: Kull — The Shadow Kingdom
Phase 2 systems (see §12 in GAME_DESIGN.md): Stamina, Hunger/Thirst, Encumbrance, Runes


§6 — The Eamon Chronicle
Every significant action the player takes appends a terse log entry to the Chronicle. This is stored in Supabase and serves as:

The persistent soul layer of the hero across infinite realms
The rehydration context fed to Grok at every chapter start
The Living Eamon equivalent of The Black Company's annalist logs

The Chronicle records: INVOKE uses, destruction events, Virtue shifts, reagent trades, Order encounters, deaths, Chapter completions, realm transitions.

§7 — Tone & Art Direction: Hyborian Sword & Sorcery
The Tone
Living Eamon's source material is Robert E. Howard's Hyborian Age (Conan, Kull, Solomon Kane, Bran Mak Morn) and other public-domain sword & sorcery (Clark Ashton Smith, Lord Dunsany). The visual and narrative tone reflects this lineage:

Robert E. Howard: barbaric grandeur, civilized decadence, lone-genius protagonists against ancient evil, moral weight without moralism
The Black Company (Glen Cook, 1984): unromantic mercenary survival, persistent consequences, annalist-style gritty-dark-soldier-humor narration — the direct literary ancestor of the Eamon Chronicle
Heads Will Roll: Reforged (Ren'Py visual novel): scene-setting art + layered character sprites + survival pressure + branching reputation-gated arcs

Art style references by tone:
- aquilonian: Frank Frazetta's Conan paintings — marble palaces, bronze, gilt, silk banners. Brom's palatial interiors.
- civilized: Frazetta/Brom tavern and fortress interiors. Lived-in, warm, dangerous.
- pastoral: Frazetta's pastoral backgrounds. Warm, golden, ancient peace.
- grimdark: Frazetta's darkest work crossed with Brom. Every shadow hides something.

Tone is regional (per-room sceneTone field) and can degrade: consequence events can shift room tone permanently toward grimdark.
The narrative voice mirrors the Eamon Chronicle — spare, factual, annalist-style, never melodramatic.
No chosen-one fantasy. No plot armor. Survival and moral choices have permanent weight.

Visual Art Direction
Scene images:
Every major scene transition generates one establishing image — like Tolkien and C.S. Lewis illustrating their own books. The image sets the tone; text takes over from there.
Style: Extremely high definition, gritty, photorealistic grimdark. Warhammer meets Tolkien's visual gravity.
Maps: Hand-drawn in the style of Tolkien's own cartography — Middle-earth aesthetic with compass roses, illustrated terrain, aged parchment texture.
Image API: Grok Imagine

Master reference generation: grok-imagine-image-pro ($0.07/image)
Composited scene renders: grok-imagine-image standard ($0.02/image)

White studio backdrop rule: All master character reference images are generated on clean white background for maximum contrast and sharpest Flux model anchor. Black backgrounds cause edge halos and lighting bleed. White is canon.
Regional Tone Archetypes
Three permanent tonal zones, each with distinct master background templates:
ToneVisual StyleDefault StatePastoral InnocentRolling hills, thatched cottages, halflings, golden light, flower gardens — Shire/HobbitonHigh purityCivilized HumanStone towns, guild halls, market squares, ordered inns — classic Tolkien townMedium purityGrimdark FrontierBrothels, ruined villages, sulfur traces, daemon taint, goreLow purity
Zones degrade from Pastoral → Civilized → Grimdark through player actions. Destruction is permanent in the Chronicle. Virtue shifts are amplified by zone type.

§8 — Scene Image Architecture (Template Layering)
Modeled on how Ren'Py visual novels work (confirmed from Heads Will Roll: Reforged source study):
Background template  (static, generated once, cached forever)
  + NPC sprites      (archetype masters, 5–8 locked poses each)
  + Player avatar    (custom master + 12 poses, generated once at Soul Forge)
  = One Grok Imagine API call ($0.02) → composited scene image
Background Library: ~15–25 master templates

One base per major location type
Three tonal variants per type (Pastoral / Civilized / Grimdark)
Three destruction states per location (pristine / partial / fully ruined)
Generated once. Cached forever in Supabase Storage. Never regenerated unless realm-wide cataclysm.
Examples canon: Greenhollow village square, ruined Thornvale, Scarlet Veil interior, dungeon chamber, forest road, battlefield

Standard NPC Library: archetype masters + pose sheets

Recurring types: generic barmaid, goblin raider, halfling farmer, grizzled mercenary, Order inquisitor, tavern patron, etc.
Each gets one master reference + 5–8 locked poses
Named major NPCs get full individual masters

Compositing art call structure:

Reference 1: player character (PC) master
References 2–4: background template + 1–2 standard NPCs in correct poses
Reference 5: chosen player pose from hero_poses table
Prompt: full Identity Block + "exact lighting, action, tone, gore level, sulfur traces if INVOKE used"
Cache by scene hash in Supabase Storage

Cost reality:

Initial library build (all templates + first player master): ~$15–25 one-time
Average chapter (10–20 scenes): $0.10–$0.50 after caching
100 chapters: still pennies per player session


§9 — The Soul Forge (Avatar Creation System)
One-time permanent avatar creation at game start (Chapter 0 — "The Awakening"). Generates one canonical master reference image on white background + one locked Identity Block. Both are sacred canon in the Visual Codex. All clothing, armor, gore, blood, poses, and backgrounds layer on top via multi-reference API calls.
Coherence protocol: master image reference + verbatim Identity Block in every single API call. Drift below 97% triggers re-forge notification.
Player Flow

Gender selection (Male / Female)
Archetype gallery (8 options per gender)
Deep customization (sliders, dropdowns, backstory textarea)
Live previews (three tonal backgrounds)
Forge the Legend (Grok ImaginePro master + 12 poses)
Confirmation + first Chronicle entry

Gender Options

Male
Female
(Non-binary and non-human: Phase 2)

Archetypes (8 per gender — same names, different base builds)

The Eternal Wanderer
The Occult Scholar
The Iron-Blood Mercenary
The Fallen Paladin
The Reagent Hunter
The Daemon-Scarred
The Shadow Walker
The Exiled Noble

Each archetype ships with pre-rendered previews on Pastoral, Civilized, and Grimdark backgrounds + default Virtue bias + 50-word flavor text.
Customization Parameters
Shared (all genders):

Height: Male 5'4"–6'10" (2" increments); Female 5'0"–6'4" (2" increments)
Build: gaunt / wiry / athletic / muscular / heavy / voluptuous (female only) — dropdown + slider intensity
Skin tone & weathering: fair / olive / dark / ashen / scarred-weathered / sun-burned (6 base tones + weathering intensity slider)
Hair style: short-cropped, shoulder-length, long-straight, long-wavy, braided, ponytail, bun, shaved/bald (+ gender-specific variants)
Hair color + graying slider (0–100%)
Eye color + intensity: steel-gray, ice-blue, emerald, amber, violet, obsidian (+ glow intensity for occult archetypes)
Facial structure + apparent age 25–50 (jaw, cheekbones, nose, lip fullness)
Scars & markings: vertical facial scar, chest slash pack, forearm ritual burns, back whip scars, ritual brands, bite marks (up to 5 simultaneous)
Signature mark (one major permanent feature): missing finger, ritual tattoo, daemon brand, silver streak, eye patch scar, neck brand
Backstory prompt: optional 100–300 words — Grok folds key phrases into scar placement and expression

Male-only:

Chest/arm/leg hair density (none/light/medium/heavy)
Abdominal definition (flat/defined/ripped)
Shoulder breadth slider

Female-only:

Breast size & shape (small/medium/full/athletic)
Hip-to-waist ratio slider
Thigh and glute definition
Neck and collarbone prominence

Master Reference Generation Rules

White studio backdrop (always)
Minimal clothing: dark leather loincloth (male) or wrap (female) + thin chest/shoulder straps that NEVER intersect scars
Neutral three-quarter standing pose, arms relaxed
Generated via grok-imagine-image-pro ($0.07)
12 standard poses batched immediately after master

12 Standard Poses
idle, walking, INVOKE casting, combat strike, wounded, sitting, fleeing, brothel negotiation, death, reagent trading, victory stance, gate travel
Identity Block Template
Photorealistic [gender] player avatar from Living Eamon – [Archetype Name], exactly [height] tall, [build] build of a battle-hardened survivor, [skin tone] skin with [scar list]. [Hair description]. [Eye description]. [Facial scar description]. [Signature mark]. [Gender-specific body details]. Thin leather straps cross chest and shoulders above all scars without any interaction. Clean white studio backdrop. This is the single persistent hero.
Supabase Schema
sqlcreate table if not exists hero_masters (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid references auth.users(id) on delete cascade not null,
  archetype text not null,
  gender text not null,
  master_image_url text not null,
  identity_block text not null,
  customization_vector jsonb,
  locked_at timestamptz default now(),
  unique(player_id)
);

create table if not exists hero_poses (
  id uuid primary key default uuid_generate_v4(),
  master_id uuid references hero_masters(id) on delete cascade not null,
  pose_name text not null,
  pose_image_url text not null,
  created_at timestamptz default now()
);

alter table hero_masters enable row level security;
alter table hero_poses enable row level security;

create policy "Users own their master" on hero_masters
  for all using (auth.uid() = player_id);
create policy "Users own their poses" on hero_poses
  for all using (auth.uid() = (select player_id from hero_masters where id = master_id));
API Routes

GET /api/avatar/archetypes — returns 16 archetypes (8M/8F) with previews and Virtue bias
POST /api/avatar/preview — low-res composite preview ($0.02, for the Live Preview step)
POST /api/avatar/forge — full master + 12 poses ($0.91 max) → saves to tables → returns URLs + Identity Block

Frontend Wizard

Route: /forge-avatar
4-step shadcn/ui wizard:

Step 1: Gender + Archetype gallery grid
Step 2: Customization sliders/dropdowns + backstory textarea
Step 3: LivePreviewCanvas (three tonal composites)
Step 4: Confirmation modal showing master + all 12 poses + "Forge Legend" button


New component files: ArchetypeGallery.tsx, CustomizationPanel.tsx, LivePreviewCanvas.tsx, ForgeConfirmationModal.tsx

Integration Points

Called once at new game start, OR on explicit "Soul Evolution" (rare, player-approved)
Master + Identity Block appended to every Chapter rehydration prompt
Permanent scars from in-game trauma trigger optional controlled Soul Update (player approval required)
Ties directly to Chapter Engine, destruction system, and the Eamon Chronicle


§10 — Story Engine: The Chapter System
Structural Model
Living Eamon uses a programmatic chapter/arc engine modeled on two sources:
1. Heads Will Roll: Reforged (Ren'Py visual novel)
The confirmed structural spine. Key properties:

Tight survival pressure — fatigue, hunger, injuries, disease all tracked
Time-boxed forced events (chapters have timers, not open sandbox)
Reputation-gated branching: choices only unlock based on accumulated standing
Shared trunk → major split → multiple route-specific chapters → 30+ possible endings
No hero fantasy — survival is the mechanic, death is permanent consequence
Grimdark tone throughout

HWR Reforged arc skeleton (for mutation into Eamon arcs):

Trunk (Chapters 0–3): Camp arrival, forced training, first battle, reputation seeds, time-driven
Chapter 3 Split (reputation-gated): Mercenary route / Nobility route / French route / Civilian DLC route
Post-split: 3–6 chapters per route, escalating climaxes, persistent injury carry-forward

Maps to Living Eamon:

HWR fatigue + hunger + wounds → our Stamina/Hunger/Thirst/Encumbrance system
HWR persistent injury/disease → our polymicrobial disease vectors and gore states
HWR reputation gates → our Virtue vector + Order hunt probability
HWR roguelite cross-death meta-progress → our hero Chronicle carrying across infinite realms

2. The Black Company (Glen Cook, 1984)
The narrative DNA. Key properties:

Mercenary company as persistent identity across campaigns and employers
Annalist (Croaker) records everything without heroism — spare, factual, permanent
Moral erosion, shifting alliances, no chosen-one arc
Long campaigns with escalating consequence

Maps to Living Eamon:

The Annalist + permanent Chronicles → the Eamon Chronicle
Company's accumulating scars across campaigns → hero carrying every ruined town, Virtue shift, and Order mark
Long structured campaigns → Chapter arcs with forced events and no sandbox sprawl

The Stag Company
The Living Eamon-native mercenary arc set. Same DNA as The Black Company — mercenary company chronicle, employer shifts, moral erosion, annalist logging — but no IP conflict. One of many arc sets available once the story engine is live. A formal license inquiry to Glen Cook / Tor/Macmillan is aspirational but not required.
Chapter Generation Flow
At every new chapter load:

Pull player's full Chronicle + Virtue vector + current zone tone + reagent stock + destruction scars
AI receives HWR arc template JSON + player state
AI mutates template into Eamon chapter:

Replace medieval survival with Stamina/Hunger/Thirst/Encumbrance + polymicrobial disease
Replace reputation with Virtue + Order hunt probability
Inject reagent trades, INVOKE risks, sulfur traces, destruction opportunities
Keep chapter on-rails with time pressure and forced events


Mutated ruleset cached in Supabase chapter_rulesets table
Static engine runs 95% of play — only novel choices trigger Grok delta for next chapter

Arc Seeding
Joshua or hired writers supply one-line arc seeds. Grok handles 100% of the mutation and regeneration. Example seeds:

"Lowborn footman rises through a reagent war meat grinder — the hero can burn the kingdom with Circle 5 INVOKE"
"Game of Thrones Season 1 but the hero sacks the capital early and carries the guilt into the next realm"
"The Stag Company takes a contract from an Order inquisitor against their own reagent network"

Supabase Tables
sqlcreate table story_arc_templates (
  id uuid primary key default uuid_generate_v4(),
  source text default 'heads_will_roll_reforged',
  arc_name text,
  base_events jsonb,
  time_box_days integer,
  reputation_gates jsonb,
  transition_rules jsonb,
  created_at timestamptz default now()
);

create table chapter_arc_seeds (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid references auth.users(id),
  chapter_number integer,
  seed_text text,
  mutated_ruleset jsonb,
  cached_at timestamptz default now()
);

create table chapter_rulesets (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid references auth.users(id),
  chapter_number integer,
  ruleset jsonb,
  created_at timestamptz default now()
);

§11 — World Destruction System
Fully destructible settlements and realms. Destruction is permanent — no resets.
Destruction states per location: pristine → partial damage → fully ruined (0–100% per building/quarter, tracked in Supabase)
Visual Codex behavior: auto-switches between pristine and ruined master background templates at damage thresholds.
Destruction tiers:

Circle 3–4 INVOKE: building-level damage, gore states, sulfur traces, Order witness probability spikes
Circle 5–6: district-level destruction, NPC displacement, reagent market collapse
Circle 7–8 rituals / prolonged daemon pacts: realm-level cataclysm — realm marked "dead" in Chronicle, hero carries everything into next procedural realm

Ripple effects: surviving NPCs become refugees or bandits, Order hunt probability spikes, Virtue alignment shifts, reagent markets collapse.
World-level destruction: infinite realms mean the legend never runs out of canvas. Dead realms are permanent — never regenerated, always accessible in Chronicle as history.

§12 — The Order
The only authorized Occult practitioners in the world — authorized exclusively to prosecute, punish, and remove unauthorized Occultists. They erase practitioners AND witnesses. Everyone is terrified of them.
Activation triggers (dormant until Occult is used publicly):

Witnessed INVOKE (sulfur traces, fizzle smells, light flashes in public)
Reagent stockpiling in quantity
Possession of runebooks
High-circle destruction events that attract investigation

Response escalation: investigation → pursuit → disappearance of all witnesses → erasure from the record
Full Order mechanics are Phase 2 (documented, not yet coded).

§13 — Magic Systems (Summary)
Full spell tables are in GAME_DESIGN.md §9. Summary here for orientation:
Guild Magic (CAST command): Legal. No reagents. ~half the power of Circle 1 Occult. Safe anywhere. Spells: BLAST, HEAL, LIGHT, SPEED.
Occult Magic (INVOKE command): Forbidden everywhere. Requires discovered Words of Power (in-game loot/hints only — no help text) + exact reagents. Eight circles, 64 spells. Circles 1–4 implemented; 5–8 documented for later phases.
Eight reagents: Black Pearl, Blood Moss, Garlic, Ginseng, Mandrake Root, Nightshade, Spider's Silk, Sulfurous Ash. Cannot be purchased in starting areas. Found as adventure loot, traded in other worlds, or purchased from sources who don't ask questions.

§14 — The Reader's Mirror (Personalization Layer)
Living Eamon is an infinite personalized novel that writes itself in the style of the player's favorite authors, shaped by behavioral signals.
Behavioral signals tracked:

Virtue patterns (10-virtue system)
Combat vs. diplomacy ratios
Curiosity signals (exploration behavior)
12 genre dimensions
Darkness tolerance → three content tiers (Young Adult / Adult / Mature)

External imports (optional): GoodReads RSS, Kindle CSV
Jane's personalization block: inserted at start of every session
"What Jane Knows" transparency section: planned for player profile page

§15 — Pricing Tiers
TierPriceDescriptionLone WandererFreeFull solo play, 10 Jane calls/dayAdventurer$9.99/moMultiplayer, 100 Jane calls/dayWorldshaper$19.99/moUnlimited Jane, pocket realmsEternal Legend$49.99/moImmortal NPC, custom adventures
No pay-to-win. Virtues, combat, and Jane's moral mirror are identical across all tiers.

§16 — Roadmap
PhaseFocusPhase 1Core engine, streaming chat, Supabase persistence, character creation, consequence engine, Living World Database — COMPLETEPhase 2Full Beginner's Cave adventure, banking, henchman hiring, Chronicle newspaper, Grok API integration, stamina/hunger/encumbrance, Soul Forge, Scene Image systemPhase 3Occult magic full (all 8 circles), prison adventure, multiplayer shardsPhase 4Hundreds of classic Eamon adventures, player retirement → immortal NPC, Hall of Legends, Jane self-evolution, full Chapter/Arc engine with Story Engine

§17 — Key Design Decisions Log
April 2026

- **Expertise field clarification (April 2026):** `expertise` in `PlayerState` was documented in `GAME_DESIGN.md` as "mana renamed for lore" but this is incorrect per the game design intent. In a skill-based system (UO/Eamon), `expertise` is a combat/skill stat, separate from mana. The mana bar graphic is implemented in the sidebar but shows `— / —` until mana is properly designed and added as its own `PlayerState` fields (`currentMana`, `maxMana`). Consider whether `expertise` is needed at all — the UO skill system uses per-skill values (see `WeaponSkills`), not a single expertise score. Flag for review before Phase 2 combat implementation.
Mana System Design (planned, graphic-only UI implemented April 2026): `expertise` in `PlayerState` is the mana pool; sidebar now shows HP (red) and Mana (blue) in full and collapsed states. When mana mechanics land, add `currentMana: number`; mana bar width becomes `(currentMana / expertise) * 100%`. Guild `CAST` costs no mana. Occult `INVOKE` costs mana by circle (Circle 1 = 4, Circle 2 = 6; see `GAME_DESIGN.md` §9). Mana regenerates over time at rest; stamina affects regen rate.
Tolkienian-GrimDark tone locked. Fusion of Tolkien world-building aesthetic + The Black Company narrative DNA + Heads Will Roll: Reforged structural model. Regional tone system: Pastoral Innocent / Civilized Human / Grimdark Frontier. Zones degrade permanently through player actions.
Scene image architecture confirmed. Every major scene transition generates one establishing image (Tolkien/Lewis illustrative model). Template layering: background + NPC sprites + custom player avatar composited in one Grok Imagine API call. Modeled on HWR Reforged's Ren'Py architecture (confirmed from source file study).
Soul Forge designed. One-time permanent avatar creation. Grok Imagine Pro master reference + 12 standard poses. White studio backdrop for all masters. Coherence protocol: master image + verbatim Identity Block in every call. Full customization: 8 archetypes per gender (M/F), extensive body/face/scar parameters.
Chapter/Arc story engine designed. Programmatic chapter regeneration using HWR Reforged arc templates + Black Company narrative DNA. Grok mutates templates using player Chronicle + Virtue vector at chapter start. The Stag Company is Arc Set #1. Sandbox trap eliminated — every chapter is on-rails with survival pressure and forced events.
World Destruction System locked. Fully destructible settlements and realms. Permanent in Chronicle. Circle-tier-based escalation. Realm-level cataclysm possible at Circle 7–8.
AI stack confirmed. Anthropic Claude = Jane (narrator, moral mirror, NPC dialogue). Grok = primary world/story generation LLM. Grok Imagine Pro = all image generation. Image API costs: $0.07/master (pro tier), $0.02/composite scene (standard tier).
Occult magic system: classic UO Magery rules (8 circles, 64 spells, reagent consumption). INVOKE command. Reagents not purchasable in starting areas. The Order prosecutes practitioners and witnesses. Circles 1–4 implemented; 5–8 documented for later phases.
Stamina system planned (Phase 2 high priority): third vital stat; full stamina = max natural healing + fast poison recovery; low stamina disables FLEE; very low stops healing; zero drains HP.
Hunger/thirst planned (Phase 2): separate mechanics; both drain stamina; severe cases drain HP; always available in Main Hall so death only possible in prolonged adventures.
Weight/encumbrance planned (Phase 2 high priority): every item has weight; carry limit based on Strength; four levels (normal/burdened/overloaded/cannot pick up).
Runes/runegates planned (Phase 2): Mark (Circle 6) creates rune; Recall (Circle 4) transports solo; Gate Travel (Circle 7) opens moongate; Runebooks = evidence of Occult practice to The Order.

Earlier

Combat bugs A–F fixed (commit 27a34e4)
Authentication system implemented (email/password, Google SSO scaffolding, @supabase/ssr, proxy.ts, server actions, /login, /register, user_id FK on players)
Reader's Mirror personalization vision documented
Ultima Online skill/magic system integration explored (pending QA)
Jane daily call limit: unlimited in development via NODE_ENV check
## 0. Local Development Path

- Mac laptop username: joshuamcclure
- Local project path: /Users/joshuamcclure/Desktop/living-eamon
- Terminal shorthand: ~/Desktop/living-eamon

> 🧑 USER NOTE: This user is not a developer. They need explicit step-by-step instructions for every action — including where to click, what to type, and what terminal commands to run. Never assume they know how to do something. Always spell it out completely.

---

# ⚡ CLAUDE — READ THIS FIRST

You are being rehydrated into the Living Eamon project.

Every time you start a new conversation about this project, do this:
1. Fetch and read ALL THREE rehydration documents before responding:
   - https://raw.githubusercontent.com/scotch-glass/living-eamon/main/CLAUDE_CONTEXT.md
   - https://raw.githubusercontent.com/scotch-glass/living-eamon/main/TECH.md
   - https://raw.githubusercontent.com/scotch-glass/living-eamon/main/GAME_DESIGN.md
   The repo is public. Read all three before responding.
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
5. After reading CLAUDE_CONTEXT.md, check §17 (Aldric
   the Veteran). Any new feature being built must include
   an Aldric topic update. Any feature in the "does not
   know yet" list that is now being implemented must be
   moved to the "knows" table with its topic description.
6. At the end of your rehydration confirmation message, print this
   exact block so the user can copy and paste all file URLs into
   the chat in one shot. Then tell the user: "Paste all of these URLs
   into the chat now so I can read the current code before we begin."

   ---
   📋 PASTE THESE INTO CHAT SO CLAUDE CAN READ THE CODE:

   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/CLAUDE_CONTEXT.md
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/TECH.md
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/GAME_DESIGN.md
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/api/chat/route.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/api/scene-image/route.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/api/player/route.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/globals.css
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/layout.tsx
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/app/page.tsx
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/components/CommandInput.tsx
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/components/ScenePanel.tsx
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/eslint.config.mjs
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/combatNarrationPools.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/npcBodyType.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/gameData.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/gameEngine.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/gameState.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/supabase.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/uoData.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/weatherService.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/scenePrompt.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/lib/sceneData.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/next-env.d.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/next.config.ts
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/postcss.config.mjs
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/scripts/generate-all-art.mjs
   https://raw.githubusercontent.com/scotch-glass/living-eamon/main/scripts/test-plate-chest.mjs
   ---

7. PROMPT SIZE RULE: When writing Cursor prompts that touch
   more than 3 files or exceed ~150 lines of instruction,
   split into sequential numbered parts (Part 1, Part 2,
   etc.). Each part must be small enough to run completely
   in one Cursor context window. Each part must be committed
   before the next part runs. Never write a single prompt
   that touches 4+ files with complex interdependencies —
   it will be silently truncated and Cursor will infer the
   missing parts incorrectly, causing divergences.

8. **NPC NAMING RULE:** Never name an NPC with a leading article ("A", "An", "The"). NPC names are always proper identifiers without articles. Examples:
   - **CORRECT:** "Priest of Perpetual Life", "Orc Captain", "King Elric", "Door Guard"
   - **WRONG:** "A Priest", "The Guard", "An Elder"
   Leading articles break Jane's suggested action generation — she treats "A" or "The" as the name itself and generates "talk to A" or "talk to The" in suggestions. This rule applies to all NPCs in `gameData.ts` forever.

---

# Living Eamon — Claude Rehydration Document
*Auto-maintained by Cursor. Updated every time the codebase changes.*
*Last updated: April 7, 2026*


## 1. Project Overview

Living Eamon is an AI-powered recreation of the classic Apple II text-adventure system **Eamon**, intended for **LivingEamon.ai**. It features a persistent living world, the AI narrator **Jane**, virtue tracking, a consequence engine (room/NPC state, bounties, chronicle), and Ultima Online–inspired item/weapon metadata and batch icon generation.

**Tech stack (runtime):** Next.js (App Router), TypeScript, React 19, Supabase (Postgres), Vercel deployment, **Anthropic Claude** (Jane via `/api/chat`), **xAI Grok** (optional text via OpenAI-compatible API; image generation in `scripts/` and **`components/ScenePanel`** → **`/api/scene-image`**). Tailwind CSS v4 is a project dependency (PostCSS); the main play UI in `app/page.tsx` is largely **inline-styled**.

## 2. Live URLs

- Production: https://living-eamon.vercel.app
- GitHub (public): https://github.com/scotch-glass/living-eamon
- Raw file access: https://raw.githubusercontent.com/scotch-glass/living-eamon/main/[filename]
- Tech doc: https://raw.githubusercontent.com/scotch-glass/living-eamon/main/TECH.md
- Game design: https://raw.githubusercontent.com/scotch-glass/living-eamon/main/GAME_DESIGN.md
- Supabase project (informal name in docs): living-eamon

## 3. Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind v4 (dependency); primary game UI uses inline styles in `app/page.tsx`
- Database: Supabase (Postgres)
- AI narrator: Anthropic Claude (`claude-sonnet-4-20250514`) via `app/api/chat/route.ts`; optional Grok `grok-3` for streaming when **`XAI_API_KEY` or `GROK_API_KEY`** is set (`useGrok` / shared OpenAI client). **Testing:** when `processInput` returns `dynamic` and `player.currentRoom === "main_hall"`, `/api/chat` returns **JSON** `{ response, worldState }` (full Jane text, no stream) instead of chunked `text/plain`. **Critical hits:** when `responseType === "static"` but `staticResponse` includes **`__CRITICAL__`**, the route calls **`streamJane`** with a rewrite prompt (same stream vs **main_hall** JSON rule as dynamic). **Guild Courtyard:** when `responseType === "static"` and the player is in **`guild_courtyard`**, **`route.ts`** calls **`getCourtyardWeather()`** (Open-Meteo, Warsaw) and replaces the body with **`buildCourtyardDescription`** (no LLM).
- Image generation: xAI **`grok-imagine-image`** — batch item art in `scripts/generate-all-art.mjs` (`GROK_API_KEY`); **scene establishing shots** via **`GET /api/scene-image`** (`export const runtime = "nodejs"`, `XAI_API_KEY`, OpenAI SDK at `https://api.x.ai/v1`, Supabase **`scene_image_cache`** + **`scene-images`** bucket). **Scene route:** moderation-shaped failures → **`console.error`** + insert **`grok_imagine_error_log`** (fire-and-forget **`void appendErrorLog`**); one **`buildScenePromptSanitized`** retry; JSON **`visualDescription`**, **`error`**, **`retried`**. **ScenePanel:** loading copy, errors, 30s abort, apology on **`retried`**. 
- Deployment: Vercel
- IDE: Cursor (e.g. MacBook Pro)

## 4. File Map

| Path | Purpose |
|------|---------|
| `CLAUDE_CONTEXT.md` | This rehydration document (must stay current with every code change) |
| `TECH.md` | Technical architecture, auth, DB schema, Jane architecture, roadmap |
| `middleware.ts` | Auth middleware; protects all routes; redirects unauthenticated users to `/login` |
| `lib/supabaseAuth.ts` | Cookie-based Supabase SSR clients (browser, server, middleware) |
| `app/auth/callback/route.ts` | OAuth and email confirmation callback handler |
| `app/auth/actions.ts` | Server Actions: `loginAction`, `registerAction`, `googleSignInAction`, `logoutAction` |
| `app/login/page.tsx` | Login page (email/password) |
| `app/register/page.tsx` | Registration page (hero name + email + password) |
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
| `lib/gameData.ts` | Static world: `MAIN_HALL_ROOMS` (**`main_hall`** east-wall copy + **charity / gown barrels** + south-wall barrel copy; **`notice_board`** full **GUILD POSTINGS — OPEN** text + per-adventure **examinableObjects**), `NPCS`, `ITEMS` (incl. **charity-barrel clothing** variants), barrel / robe ceremony narrative pools, `ADVENTURES`, `SAM_INVENTORY`, … |
| `lib/npcBodyType.ts` | Shared `NPCBodyType` union (`"humanoid" \| "beast" \| "amorphous" \| "undead"`); imported by `gameData.ts` and `combatNarrationPools.ts` |
| `lib/gameState.ts` | Types (`PlayerState`, `WorldState`, **`WeaponSkills`**, **`SKILL_CAP` 700**), `createInitialWorldState()`, **`updateWeaponSkill`** (cap + decay), **`applyPlayerDeath`**, **`setNPCCombatHp`**, `tickWorldState`, `applyFireballConsequences` |
| `lib/gameEngine.ts` | `processInput`, **`READ`**, **`ENTER`**, **Main Hall barrels** / **robe ceremony**, **Aldric** (**`TELL Aldric`**, **`TALK Aldric`**, tiered **`TRAIN`**), **`TALK`** else = **`SAY`**, player hit **75% + skill** (max **95%**) + **fumbles**, `buildSituationBlock`, combat, **BEG**, Sam shop, … |
| `lib/weatherService.ts` | **`getCourtyardWeather()`** — Open-Meteo forecast (Warsaw), WMO code → condition, CET/CEST hour → **`TimeOfDay`**, 24 static **`weatherLine`** strings; fallback if fetch fails |
| `lib/sceneData.ts` | **`SCENE_DATA`**, **`CHURCH_ATMOSPHERE`** (Church overrides grim **`TONE_MODIFIERS`** in **`buildScenePrompt`** + **`buildScenePromptSanitized`**), **`buildScenePrompt`**, modifiers, types |
| `lib/scenePrompt.ts` | Re-exports **`./sceneData`** (backward compatibility; prefer **`sceneData`**) |
| `lib/uoData.ts` | `WEAPON_DATA` (incl. **`weaponSpeed`**), `getDexReactionBonus()`, `isTwoHanded()`, `rollWeaponDamage()` |
| `lib/supabase.ts` | `browserClient`, `serviceClient`, `savePlayer` (incl. **`received_sam_starter_outfit`**), `loadPlayer`, **`createPlayer(name, authUserId?)`** — **`loadPlayerByUserId`** guard before insert, sets **`user_id`**, **`current_room`**, **`turn_count`** on create; world object cache, room/NPC state, Jane memory, chronicle, `checkAndDecrementJaneCalls` |
| `app/layout.tsx` | Root layout |
| `app/globals.css` | Global CSS |
| `app/page.tsx` | Client UI: auth, **`ScenePanel`**, header/sidebar chrome, **`formatMessage`** parses **`__YESNO__`** (YES/NO chips) and **`__CMD:COMMAND__`** (amber chips → **`sendMessage(cmd)`**); `CommandInput`, **JSON vs stream** for `/api/chat` |
| `app/api/chat/route.ts` | **Empty `messages` (session start):** respects **`currentRoom`** from DB — **`turnCount === 0`** + Church → static cold open + **`__YESNO__`**; Church + **`turnCount > 0`** → respawn prose; **other rooms** → **`streamJane`** re-entry prompt (**`MAIN_HALL_ROOMS`** name/desc; JSON buffer if **`main_hall`**). **`savedPlayer.current_room`** fallback **`church_of_perpetual_life`**. YES/NO branch unchanged. Then **`processInput`** + static/dynamic Jane as before |
| `app/api/scene-image/route.ts` | **GET**, **`runtime = "nodejs"`** — cache → Grok → Storage → **`scene_image_cache`**; errors → **`void appendErrorLog`** (structured **`console.error`** + **`grok_imagine_error_log`** insert); sanitized retry; JSON **`visualDescription`** / **`error`**; outer catch HTTP 200 **`url: null`** |
| `app/api/player/route.ts` | **POST:** **`createPlayer(name, authUser?.id)`** (link when session present). **GET:** **`loadPlayerByUserId(id)`** first (bootstrap passes auth UUID), then **`loadPlayer(id)`** |
| `components/CommandInput.tsx` | Command bar with engine-driven autocomplete |
| `components/ScenePanel.tsx` | **`ScenePanel`** — **`SCENE_DATA`** loading subtitle, shimmer, **30s** `AbortController` timeout, error panel, crossfade, **`retried`** apology toast; vignette + label when loaded |
| `scripts/generate-all-art.mjs` | Batch UO-style PNGs via Grok image API → `public/uo-art/items/{artId}.png` |
| `scripts/test-plate-chest.mjs` | Single-item art test |
| `public/*.svg` | Default Next/Vercel assets (`public/uo-art` may be generated locally and not committed) |

## 5. Game Architecture

**Tier 1 — Static engine:** Movement (`GO`, single-letter dirs, **`FLEE`**), `LOOK`, `EXAMINE`, `GET`/`DROP`, `STATS`/`INVENTORY`, **`HEALTH`**/**`HP`** (pool-based, no Jane), **`EQUIP`** (weapon/shield/armor; **`WIELD`** is an alias), `EQUIP SHIELD` / `EQUIP ARMOR` / `SHIELD`, `REMOVE`/`UNEQUIP` (shield, armor, or by item name), vault `DEPOSIT`/`WITHDRAW`, **`SHOP` / `LIST` / `SAM` and `BUY` in `main_hall`** (Sam’s `SAM_INVENTORY`), static combat round helper, fireball consequence hook, etc. Implemented in `lib/gameEngine.ts`; **no** LLM when `responseType === "static"` **unless** the payload contains **`__CRITICAL__`** (player crit — then **`route.ts`** invokes Jane once to rewrite the marked hit line).

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
- `currentRoom`: `"church_of_perpetual_life"` (new game start; rebirth after death matches)
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
| old_mercenary | Aldric the Veteran | neutral | main_hall |
| brunt_the_banker | Brunt | neutral | guild_vault |
| armory_attendant | Pip | neutral | armory |
| door_guard | Door Guard | neutral | main_hall_exit |
| priest_of_perpetual_life | Priest of Perpetual Life | neutral | church_of_perpetual_life |

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
| `user_id` | UUID — FK to `auth.users(id)` ON DELETE CASCADE (added April 2026; apply migration if missing) |
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

**`scene_image_cache` (scene art API):** Used by **`app/api/scene-image/route.ts`**. Inferred columns: **`room_id`**, **`room_state`**, **`tone`**, **`image_url`**, **`prompt_used`**. **Storage:** public bucket **`scene-images`**.

**`grok_imagine_error_log`:** Grok Imagine failures from **`scene-image`** route — **`room_id`**, **`tone`**, **`room_state`**, **`attempt_number`**, **`error_type`**, **`raw_error`**, **`prompt_used`**, **`created_at`**. RLS enabled; policy blocks non–service-role access; **service role bypasses RLS** for inserts. Migration: **`supabase/migrations/20260411120000_grok_imagine_error_log.sql`** (run / apply on Supabase project).

**Planned tables (Phase 2):** `player_profiles`, `subscriptions` — see `TECH.md` §3.3.

## 12. Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude client in `app/api/chat/route.ts` |
| `GROK_API_KEY` | Optional Grok chat + required for `scripts/generate-all-art.mjs` / `test-plate-chest.mjs` (script reads `.env.local`) |
| `XAI_API_KEY` | xAI key for **`GET /api/scene-image`** and optional **Jane Grok** in **`app/api/chat/route.ts`** (same key as **`GROK_API_KEY`** fallback); OpenAI SDK at `https://api.x.ai/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (`lib/supabase.ts`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (`browserClient`) |
| `SUPABASE_SERVICE_KEY` | Service role key (`serviceClient`, server routes) |
| `NEXT_PUBLIC_SITE_URL` | Auth redirect base URL (localhost in dev, Vercel URL in prod) |

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
- [x] **`GET /api/scene-image`** — room scene JPEGs via Grok Imagine, Supabase cache + **`scene-images`** bucket
- [x] **`ScenePanel`** wired in **`app/page.tsx`** above main header (room, mapped state, tone)
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
- [x] Unarmed state after death (weapon sentinel `unarmed`)
- [x] Hokas unarmed pity (**`TELL HOKAS`** / examine Hokas): ragged clothes + **castoff short sword** (1–4), once per life arc
- [x] BEG HOKAS (butcher knife, no limit)
- [x] BEG SAM limit removed (gives rusty sword every time)
- [x] Notice board + adventure entry: room copy, **`READ`**, **`ENTER`** word-match + fallback, autocomplete on **`notice_board`**
- [x] Charity barrels: clothing dispensed, robe ceremony, NPC barrel hints
- [x] Autocomplete full NPC name fix
- [x] Weapon skill system (nine tracks, **700** cap, **`updateWeaponSkill`** decay)
- [x] Aldric static tutorial (**`ALDRIC_TOPIC_RESPONSES`**, **`TELL Aldric`**)
- [x] **TRAIN** tiered costs (Main Hall, Aldric: **25 / 100 / 300 / 750** gp by skill band)
- [x] Hit chance formula corrected (**75%** base + **0.5%** per weapon-skill point, max **95%**)
- [x] **TALK Aldric** routes to static topic list (Main Hall; other **TALK** still **SAY**)
- [x] Combat fumbles, **TALK** = **SAY** (except **TALK Aldric** shortcut), skill gain on hits
- [x] **`weapon_skills`** DB persistence
- [x] Revealed items system (container contents in 👁 line)
- [x] GET ALL command (classic Eamon looting)
- [x] Auth system: email/password + Google SSO via Supabase Auth
- [x] Cookie-based sessions via `@supabase/ssr` + Next.js middleware
- [x] players table linked to `auth.users` via `user_id`
- [x] `/login` and `/register` pages in Living Eamon visual style
- [x] TECH.md created — full technical architecture document
- [x] GAME_DESIGN.md §20 — Reader's Mirror psychological profile system designed

## 15. Next Up

- [ ] Load player record from auth session on game start (replace name-gate with auto-start)
- [ ] Player Profile page (`/profile`) — psychological profile report
- [ ] Stripe subscription integration (Lone Wanderer / Adventurer / Worldshaper / Eternal Legend tiers)
- [ ] GoodReads/Kindle integration for reader profile import
- [ ] Jane personalization injection from `player_profiles`
- [ ] `player_profiles` Supabase table + Profile Builder job
- [ ] Re-enable Jane streaming in `main_hall` before production
- [ ] Persist `known_spells` / `known_deities` in savePlayer
- [ ] Static structured shop for Pip (beginner gear)
- [ ] Apply **`supabase/migrations`** on the Supabase project (incl. **`received_sam_starter_outfit`**; shield column if still missing on older DBs)
- [ ] Male / female paperdoll art and compositor

## 16. Session Log

### 2026-04-07 — Header room-name removal + user-bubble suppression + collapse ordering fix

- `app/page.tsx`: Header now displays only `Living Eamon`; room name duplicate removed (scene label remains the canonical location display).
- `app/page.tsx`: User-role messages are no longer rendered as separate bubbles; only assistant narrative bubbles are displayed in chat.
- `app/page.tsx`: Right-column ordering tuned (`header: order 0`, `scroll: order 1`, `input: order 2`) with bottom-anchored column layout to improve collapsed-text behavior.

### 2026-04-07 — Chat resize toggle + placeholder mana display

- `app/page.tsx`: Added `chatExpanded` state with `hide text` / `show text` toggle to collapse/expand the scroll area while preserving input-at-bottom layout.
- `app/page.tsx`: Unified text-area and input widths at `620px`; assistant bubbles now full-width within that column with consistent rounded corners.
- `app/page.tsx`: Mana visuals now intentionally placeholder (`— / —`, empty full-sidebar bar, empty collapsed mini bar) and stat grid label remains `EXP`.

### 2026-04-07 — Sidebar color/clarity pass + mana HUD visuals

- `app/page.tsx`: Brightened sidebar/header palette (white/amber emphasis), upgraded HP label/value contrast, and increased `WANTED` visibility.
- `app/page.tsx`: Added mana visualization using `player.expertise` in both full sidebar (blue mana bar) and collapsed rail (mini blue pillar).
- `app/page.tsx`: Unified user/assistant smoky bubble treatment, brightened situation block text, and boosted Jane direct-voice amber styling.

### 2026-04-07 — Full-viewport scene bleed + frosted sidebar/input pass

- `app/page.tsx`: Scene background now fixed to viewport (`position: fixed`) so art renders behind both sidebar and main content.
- `app/page.tsx`: Sidebar converted to frosted glass (`rgba(0,0,0,0.55)` + `backdropFilter`), with `minWidth` transition parity for expanded/collapsed widths.
- `app/page.tsx`: Removed input hint text and tightened bottom input bar spacing with transparent background; header opacity/blur tuned for readability over full-screen scene.

### 2026-04-07 — Layered scene background UI (`app/page.tsx`) + `ScenePanel` full-screen mode

- `app/page.tsx`: Right column converted from stacked layout to layered `position: relative` composition with `ScenePanel` as absolute full-background layer and translucent header/chat/input overlays.
- `app/page.tsx`: Assistant messages now render in smoky translucent cards; collapsed sidebar rail can be expanded by clicking anywhere; chevrons updated to brighter/heavier `«` / `»`.
- `components/ScenePanel.tsx`: Added optional `fullScreen` prop; panel container/vignette adapt between legacy panel mode and full-height background mode.

### 2026-04-07 — `app/page.tsx` UI polish: pill input + chevrons + compact sidebar typography

- `app/page.tsx`: Visual-only pass for Grok-style pill command input, integrated circular send button (up-arrow icon), sidebar chevron controls (`«` / `»`), collapsed-rail mini HP indicator, and sans-serif sidebar/header typography refinements.
- `app/page.tsx`: Added sidebar footer divider hover effect and no-wrap/ellipsis behavior for player/location/reputation text to prevent spillover in narrow layouts.
- `components/CommandInput.tsx`: Added optional `style` prop passthrough to support page-level visual customization of the input field without changing command logic.

### 2026-04-07 — `app/page.tsx` visual dark-theme pass + collapsible rail

- Visual-only UI polish in `app/page.tsx`: blackened outer/header/scroll/input backgrounds, darker sidebar/section borders, darker HP track and stat cards.
- Sidebar now always renders when `player` exists, with width transition between full panel and a minimal collapsed rail (`48px`) containing only the expand toggle.
- Moved collapse control into full sidebar top-right and removed header toggle button; no gameplay/state logic changed.

### 2026-04-20 — **`GET /api/player`**: **`user_id`** before **`id`**

- **`app/api/player/route.ts`:** **GET** calls **`loadPlayerByUserId`** first, then **`loadPlayer`** (matches **`page.tsx`** passing auth UUID). **POST** passes **`authUser?.id`** into **`createPlayer`** without hard **401**.

### 2026-04-20 — **`createPlayer`** links **`user_id`** at insert (no orphan rows)

- **`lib/supabase.ts`:** **`createPlayer(name, authUserId?)`** — if **`authUserId`**, **`loadPlayerByUserId`**-style select first; else insert with **`user_id`**, **`current_room: church_of_perpetual_life`**, **`turn_count: 0`**.
- **`app/api/chat/route.ts`:** New-player path calls **`createPlayer(playerName, authUserId)`**.

### 2026-04-19 — **`JANE_SYSTEM_PROMPT`**: death economy + Hokas amnesia beat

- **`WORLD RULES`:** Carried/equip/inventory loss on death vs **banked gold safe**; soul persists (name, virtues, chronicle, adventures, bank).
- **`HOKAS TOKAS — FIRST MEETING AFTER MEMORY LOSS`:** **`turnCount` 0–1**, Hokas knows player / player does not; gruff Church-floor recognition; introductions; no name in player interior monologue.

### 2026-04-18 — Church cold open: trim pre-YESNO paragraphs

- **`app/api/chat/route.ts`:** Removed five lines (figures / door / survival beat) before **`__YESNO__`** in static cold open.

### 2026-04-18 — Session start respects saved **`currentRoom`**

- **`/api/chat`:** Empty messages → branch on **`currentRoom`** + **`turnCount`**: Church cold open / Church respawn / **Jane re-entry** for other rooms (room name, state, description from **`MAIN_HALL_ROOMS`**). Load merge: **`current_room`** null → **`church_of_perpetual_life`** (in **`route.ts`** player merge — not in **`page.tsx`**).

### 2026-04-17 — Static Church open, command chips, white Church scene art

- **`/api/chat`:** Opening + YES/NO + tutorial are **pre-written** **`sendResponse`** (no Jane). Cold open ends with **`__YESNO__`**; tutorial embeds **`__CMD:LOOK AROUND__`**, **`__CMD:I__`**, **`__CMD:HEALTH__`**, **`__CMD:GO EAST__`**.
- **`app/page.tsx`:** Renders **`__YESNO__`** and **`__CMD:…__`** as clickable chips calling **`sendMessage`**. Fixed **`react/no-unescaped-entities`** on **`knownAs`** quotes.
- **`lib/sceneData.ts`:** Church **visualDescription** (white marble chamber); **`CHURCH_ATMOSPHERE`** for prompts instead of grimdark modifier for that room.

### 2026-04-16 — Opening narrative + YES/NO tutorial branch (`/api/chat`)

- *(Superseded by 2026-04-17: opening is now static prose, not Jane.)*

### 2026-04-15 — New players spawn in **Church of Perpetual Life**

- **`createInitialWorldState`:** **`player.currentRoom`** default **`church_of_perpetual_life`** (was **`main_hall`**), aligned with post-death rebirth room.

### 2026-04-14 — Header / sidebar chrome (`app/page.tsx`)

- **Sign out** moved from top bar to sidebar bottom row (flex with *she is watching*). Top bar: bordered **◀ / ▶** toggle with **`title`**, title shows current room (title case from **`player.currentRoom`**).

### 2026-04-13 — **`/api/chat`** accepts **`XAI_API_KEY`** for Grok Jane

- **`app/api/chat/route.ts`:** **`useGrok`** and the shared **`grok`** OpenAI client use **`process.env.XAI_API_KEY`** or **`process.env.GROK_API_KEY`** so one xAI key can drive both Imagine and **`grok-3`** chat when **`GROK_API_KEY`** is unset.

### 2026-04-12 — **`grok_imagine_error_log`** + Node route runtime (`scene-image`)

- **`app/api/scene-image/route.ts`:** **`export const runtime = "nodejs"`**; removed **`fs`** / **`path`**; **`appendErrorLog`** is **`async`** — **`console.error`** and Supabase **`grok_imagine_error_log`** insert (truncated fields); call sites use **`void appendErrorLog({...})`**. Migration **`20260411120000_grok_imagine_error_log.sql`** added. Removed gitignored **`GROK_IMAGINE_ERROR_LOG.md`** usage.

### 2026-04-11 — Scene image robustness (route + panel + **`lib/sceneData`**)

- **`lib/sceneData.ts`** is now the **canonical** scene definitions module (**`buildScenePrompt`**, **`buildScenePromptSanitized`**). **`lib/scenePrompt.ts`** re-exports only.
- **`app/api/scene-image/route.ts`**: `appendErrorLog` (later replaced by Supabase **`grok_imagine_error_log`** — see 2026-04-12); moderation-style Grok errors → one sanitized retry; responses include **`visualDescription`**; Storage upload helper.
- **`components/ScenePanel.tsx`**: loading UI with description, error state, **30s** fetch timeout, apology when **`retried`**.

### 2026-04-10 — Wire **`ScenePanel`** in **`app/page.tsx`**

- Import **`ScenePanel`**; render above top bar with **`roomId`** from **`worldState.player.currentRoom`**, **`roomState`** from **`rooms[currentRoom].currentState`** (**`burnt`** → **`ruined`**, other non-**`normal`** → **`damaged`**), **`tone`** **`grimdark`** for **`church_of_perpetual_life`** and **`pit`** else **`civilized`**.

### 2026-04-09 — **`ScenePanel`** (`components/ScenePanel.tsx`)

- Client component: **`GET /api/scene-image`** with **`room`**, **`state`**, **`tone`** query params; shimmer while loading; opacity crossfade on room/state change; bottom vignette and title-case room label.

### 2026-04-08 — `GET /api/scene-image` (Grok Imagine + Supabase cache)

- Added **`app/api/scene-image/route.ts`** — cache check on **`scene_image_cache`**, **`buildScenePrompt`**, **`grok-imagine-image`** with **`b64_json`**, upload to Storage bucket **`scene-images`**, insert cache row; graceful **`{ url: null }`** on failure.
- Added **`lib/sceneData.ts`** re-export barrel for imports matching **`sceneData`** module path. **TypeScript:** optional chaining on **`imageResponse.data?.[0]`** so **`tsc`** passes strict null checks.

### 2026-04-06 — Scene image prompt module (`lib/scenePrompt.ts`)

- Added **`SceneTone`**, **`SceneState`**, per-room **`SCENE_DATA`** with visual descriptions, tone/state modifier strings, and **`buildScenePrompt(roomId, tone, state)`** for full Grok Imagine prompts (known rooms + generic fallback).

### 2026-04-06 — Auth system implementation sync

- **Auth routing + pages:** Confirmed auth route surface and pages (`/auth/callback`, `/login`, `/register`) with Living Eamon styling and email/password path active.
- **Schema + env alignment:** Confirmed `players.user_id` linkage to `auth.users` in context docs and `NEXT_PUBLIC_SITE_URL` env variable coverage for local and production redirect base URL.
- **Progress tracking:** Updated File Map, Supabase schema notes, Completed Milestones, and Next Up auth-specific items to reflect the current implementation and remaining auth/profile work.

### 2026-04-06 — Auth-linked player resolution hardened in chat route

- **Identity resolution:** `app/api/chat/route.ts` now resolves the authenticated user's linked player first (`loadPlayerByUserId(authUser.id)`), then uses that canonical player id for load/merge/save. Request-body `playerId` no longer overrides another account's player when auth is present.
- **Behavioral intent:** Existing world-state merge logic is unchanged; only player identity source-of-truth was tightened for authenticated sessions.

### 2026-04-05 — Auth system + Reader's Mirror design

- **Auth:** `@supabase/ssr` installed; `lib/supabaseAuth.ts` created (3 client factories: browser, server, middleware); `middleware.ts` created at root — protects all routes, always-public: `/login`, `/register`, `/auth/callback`; `app/auth/actions.ts` — Server Actions for login, register, Google SSO, logout; `app/auth/callback/route.ts` — OAuth + email confirmation handler; `app/login/page.tsx` and `app/register/page.tsx` created in Living Eamon visual style.
- **DB:** `players.user_id` UUID column (FK → `auth.users`) — add/apply migration on Supabase when not yet present; `NEXT_PUBLIC_SITE_URL` env var added; Google OAuth manual setup documented in `TECH.md`.
- **TECH.md:** New technical architecture document created at repo root. Contains full auth architecture, DB schema, Jane architecture, subscription tiers, roadmap.
- **GAME_DESIGN.md §20:** Reader's Mirror psychological profile system fully designed. Two data sources: in-game behavior signals (automatic) + GoodReads/Kindle import (optional). 12 genre dimensions tracked. Darkness tolerance drives content tiers (YA / Adult / Mature). Jane receives personalization block each session. Profile page surfaces full profile with transparency section. Privacy-first: opt-in, editable, deletable, never sold.
- **Vision documented:** Living Eamon is Kindle Unlimited for a library of one — an infinite novel in the style of the player's favorite authors, shaped by their subconscious themes, calibrated to their darkness tolerance, with villains designed to threaten them morally.

### 2026-04-04 — Jane suggested actions removed

- Removed Jane **suggested actions** from **`JANE_SYSTEM_PROMPT`** and from opening-game instructions in **`app/api/chat/route.ts`**. Stripped **`*You might: …*`** tails from **`JANE_UNAVAILABLE_FREE`**, **`JANE_UNAVAILABLE_PAID`**, and **`CONTENT_NOT_YET_KNOWN`**. Church **`buildJaneContext`** note rewritten to silence-only (no suggestion wording). **Autocomplete** handles command discovery. Jane suggestions were causing confusion — wrong syntax, truncated NPC names, not matching actual game commands.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Door Guard display name

- **`door_guard`** **`NPCS[].name`:** **"The Door Guard"** → **"Door Guard"** (§8 NPC naming rule). NPC table in this doc updated.

### 2026-04-04 — NPC naming rule (no leading articles)

- **NPC naming rule** established: no leading articles in **`NPCS[].name`** in **`gameData.ts`**. **READ THIS FIRST** in **`CLAUDE_CONTEXT.md`** now includes rule **§8** (examples + Jane suggested-action rationale). **`priest_of_perpetual_life`** display name set to **"Priest of Perpetual Life"** (was **"The Priest of Perpetual Life"**); greeting prose updated to avoid **"The priest"** as an opener.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — "Talk to A" / priest silence

- Fixed **"Talk to A"** bug: **`priest_of_perpetual_life`** display name renamed from **"A Priest of Perpetual Life"** to **"The Priest of Perpetual Life"** in **`gameData.ts`** (avoids article-style truncation in Jane’s suggested actions). **`buildJaneContext`** (**`app/api/chat/route.ts`**) appends a **church-only** instruction: no suggested actions involving speaking to the priest; movement and examine-objects only. **`ASK`** and **`SPEAK`** in **`church_of_perpetual_life`** now return **`PRIEST_SILENCE_RESPONSES`** like **`SAY` / `TALK` / `TELL`**.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Smart auto-scroll (`app/page.tsx`)

- Smart auto-scroll: the transcript **`overflowY: scroll`** container uses **`scrollContainerRef`**. A passive **`scroll`** listener sets **`userScrolledRef`** when the user is more than **100px** above the bottom. The **`messages`** effect calls **`bottomRef.scrollIntoView({ behavior: "smooth" })`** only when **`userScrolledRef`** is false, so scrolling up during streaming pauses follow mode. **`userScrolledRef`** resets to **`false`** at the start of **`sendMessage`** and just before **`streamResponse`** in **`startGame`**.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — GET ALL command

- **GET ALL** command added: takes all carryable items from **`room.items`** and **`revealedItems`** in one action (**`GET` / `TAKE` / `GRAB`** + **`all`**, **`everything`**, **`it all`**, **`them all`**). In **`main_hall`**, auto-rolls and takes the random charity-barrel clothing set when nothing from that barrel is revealed and the player does not already carry barrel clothing. Triggers robe ceremony when appropriate (**`gray_robe`** was in inventory before and a barrel shirt variant was taken). Autocomplete offers **GET ALL** when the room has carryable floor items or any revealed items; **HELP_TEXT** documents the command.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Revealed items system (container contents in situation block)

- Revealed items system: added **`revealedItems`** field to **`RoomStateEntry`** (array of **`{ itemId, containerId}`**). **`revealItemsInRoom()`** and **`removeRevealedItem()`** mutators added to **`gameState.ts`**. **`changeRoomState`** preserves **`revealedItems`** when updating a room.
- **`buildSituationBlock`** now shows revealed items on the 👁 line as **`Item Name (in Container Label)`** (container label from **`examinableObjects`** when **`id`** matches).
- Barrel examine (**`LOOK` / `LOOK AT` / `EXAMINE`** with barrel-related phrasing in **`main_hall`**) calls **`randomClothingSet()`**, stores the four IDs via **`revealItemsInRoom`**, and returns **`stateChanged: true`**.
- **`GET` / `TAKE` clothing from the barrel:** if a full four-piece set is already revealed for **`charity_barrel`**, that set is used; otherwise a new random set is rolled and revealed. Taking items removes each from **`revealedItems`** via **`removeRevealedItem`**.
- `npx tsc --noEmit` — clean.

### 2026-04-05 — Aldric divergences fixed (hit %, TRAIN tiers, TALK Aldric)

- Fixed three Aldric divergences: hit chance now **75%** base **+0.5%** per weapon-skill point capped at **95%** (was **`weaponSkill / 7`** in the T2A-style formula). **Enemy** hit chance unchanged (**`enemySkill` / `playerSkill`** scaling).
- **TRAIN** now tiered: **25 / 100 / 300 / 750** gp for Basic / Journeyman / Advanced / Master by current skill (**0–19 / 20–49 / 50–99 / 100–199**); **200+** Aldric has nothing left to teach; bare **TRAIN** shows cost table + four weapon skill lines + total. Success line shows tier label and **`*italic summary*`**.
- **TALK Aldric** (or **TALK TO Aldric**, **veteran**, **old mercenary**) in **Main Hall** with Aldric alive → **`ALDRIC_OPENING_LINES`** static (no Jane); other **TALK** still follows **SAY**.
- `npx tsc --noEmit` — clean.

### 2026-04-05 — Prompt size rule added to READ THIS FIRST

- Added **PROMPT SIZE RULE** to the rehydration instructions: prompts touching 4+ files or exceeding ~150 lines must be split into sequential committed parts.
- Reason: the Aldric/weapon-skills prompt was truncated mid-execution causing three divergences (flat training costs instead of tiered, different hit chance formula, TALK not fully wired to Aldric topic system).

### 2026-04-05 — Aldric the Veteran, weapon skills (700 cap), TRAIN, fumbles, TALK

- **`PlayerState.weaponSkills`:** nine tracks (`gameState.ts`); **`SKILL_CAP` 700**; **`updateWeaponSkill`** degrades lowest other skill by 1 (repeated) when total would exceed cap. **`getWeaponSkillKey`** in **`uoData.ts`** maps equipped weapon → track.
- **Combat:** *(Superseded 2026-04-05 — see Session Log “divergences fixed”.)* Originally **weapon skill ÷ 7** for hit%; now **75% + 0.5%/pt** (max **95%**). **+1** skill on hit; **~8%** of misses **fumble**.
- **Aldric** (`old_mercenary`): renamed/re-statted in **`gameData`**; **`ALDRIC_OPENING_LINES`**, **`ALDRIC_TOPIC_RESPONSES`**. **`TELL Aldric`** / topics static.
- **`TRAIN`:** *(Superseded — now tiered **25/100/300/750** gp.)* Was flat **25 gp / +3**. **`STATS`** lists skills and total / cap.
- **`TALK`:** alias of **`SAY`**; **TALK Aldric** in hall → opening list. Autocomplete: **`TRAIN`**, **`TELL Aldric …`**.
- **Persistence:** **`weapon_skills`** JSON on **`players`** (`savePlayer`, load merge, migration **`20260405140000_players_weapon_skills.sql`**).
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Autocomplete natural casing for names and items

- **Autocomplete name casing fixed:** NPC names and item names in **`insertText`** now use natural case (e.g. **`TELL Hokas Tokas`** not **`TELL HOKAS TOKAS`**). Command words stay uppercase. Spell and deity names stay uppercase. Applied in **`getCommandAutocompleteSuggestions`** (**`lib/gameEngine.ts`**) to **SAY**, **TELL**, **ATTACK**, **BEG**, **EXAMINE** (NPCs, room items, examinable labels), **GET**, **DROP**, **SELL**, **BUY**, **EQUIP**, **WIELD**, **SHIELD**, **UNEQUIP**, and **ENTER** adventure titles (no forced all-caps on **`a.name`**).
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Charity barrels, robe ceremony, clothing, autocomplete NPC names

- **Charity barrels in Main Hall:** Barrel 1 (Clothes for the Poor) gives random clothing variants (3 per category: shirts, pants, shoes, belts). Barrel 2 (Used Gowns Only) receives returned robes in narrative. Taking a shirt while wearing **`gray_robe`** triggers automatic robe ceremony — robe removed from inventory, 5 narrative variants fire. **`BARREL_EXAMINE_DESCRIPTIONS`** (4 variants), **`ROBE_CEREMONY_NARRATIVES`** (5 variants), **`BARREL_NPC_HINTS`** (5 variants) added to **`gameData.ts`**. **`BEG SAM`** and **`BEG HOKAS`** now append barrel hint. **SAY** / **TELL** Jane context gets robe-awareness injection. Barrel autocomplete added for **`main_hall`**. Autocomplete full NPC names fixed: **SAY** / **TELL** / **BEG** now use **`n.name`** not **`n.firstName`** in **`insertText`**.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Notice board, READ, ENTER adventure flow

- **`notice_board`** description rewritten (**GUILD POSTINGS — OPEN** with three contracts + **ENTER** hints); **`examinableObjects`:** per-posting labels + treasure maps + wanted posters. **`main_hall`** east-wall sentence now points players **east** to read postings.
- **`READ`:** in **`notice_board`** → static **`buildRoomDescription`**; elsewhere → Jane. **`HELP_TEXT`** INTERACTION line for **READ**.
- **`ENTER`:** third match on significant words (**≥4** chars) from adventure **`name`**; no match → static message to visit notice board / list the three **ENTER** lines. Autocomplete: bare **`ENTER`** on **`notice_board`** offers all three adventures; **`READ`** prefix on **`notice_board`**.
- *Note:* **`ADVENTURES`** in repo currently defines **`beginners_cave`** only; the board lists three contracts for narrative/UI parity until other adventures are added.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — BEG HOKAS butcher knife, BEG SAM unlimited, HELP

- Added **`butcher_knife`** to **`ITEMS`** (value 2, damage **2–14**) and **`WEAPON_DATA`** (**artId** **5111** / **0x13F7**, Swordsmanship, **weaponSpeed** 4).
- **BEG HOKAS:** **`main_hall`** + **`unarmed`** → static scene, **`butcher_knife`** added and equipped, no limit.
- **BEG SAM** one-time inventory check **removed** — Sam gives **`rusty_shortsword`** every time while unarmed.
- **`HELP_TEXT`** **BEG** entry expanded (SAM + HOKAS + survival blurb).
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Hokas pity for unarmed players

- In **`main_hall`**, if **`player.weapon === "unarmed"`**, Hokas is present and alive, disposition is not **`furious`** / **`hostile`**, and **`receivedHokasUnarmedGift`** is false: **`TELL HOKAS …`**, **`EXAMINE`** / **`LOOK AT`** / **name-alone** targeting Hokas triggers a **static** scene (he avoids eye contact) and grants **ragged** shirt/trousers/belt/shoes plus **`castoff_short_sword`** (**`WEAPON_DATA`** damage **1–4**), **equipped**, flag set. Resets on **`applyPlayerDeath`**.
- New **`ITEMS`** + migration **`received_hokas_unarmed_gift`** on **`players`**.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Destitute new player, Sam first-purchase outfit

- **`createInitialWorldState`:** **`gold: 0`**, **`weapon: unarmed`**, inventory only **`gray_robe`**, start in **`church_of_perpetual_life`** (matches post-death poverty / rebirth).
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
- **`BEG`** command: **`BEG SAM`** (or **slicker**) in **`main_hall`** while **`unarmed`** gives the rusty short sword and equips it (historically one-time via inventory check; **removed** in later session). Other **`BEG`** targets or bare **`BEG`** go to Jane with robe/unarmed context.
- `npx tsc --noEmit` — clean.

### 2026-04-04 — Church of Perpetual Life, Guild Courtyard, death redesign, live weather

- **Church of Perpetual Life + Guild Courtyard** in **`gameData`** (`MAIN_HALL_ROOMS`), initial **`rooms`/`npcs`** in **`gameState`**. **`main_hall_exit`** gains west→**`guild_courtyard`**. Item **`gray_robe`** (`type: "clothing"`). NPC **`priest_of_perpetual_life`** (silent). Pools: **`PRIEST_SILENCE_RESPONSES`** (10), **`REBIRTH_NARRATIVES`** (15), **`ROOM_ROBE_HUMILIATION`** / **`COURTYARD_ROBE_HUMILIATION`** (10 each).
- **Death:** **`applyPlayerDeath`** — carried **gold → 0** (**`bankedGold`** unchanged), inventory → **gray robe only**, weapon **`unarmed`**, armor/shield **null**, **`receivedSamStarterOutfit` → false**, **HP** full, **`currentRoom` → `church_of_perpetual_life`**, chronicle line. **`resolveCombatRound`** appends **`COMBAT_TEMPLATES.playerDeath`**, rebirth line, gold/carry loss text. **Jane** **`WORLD RULES`** align: banked safe; secure storage TBD.
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

- **READ THIS FIRST:** Step 2 confirmation text updated; **step 6** adds **📋 PASTE THESE INTO CHAT** raw URL block (audited list of all project **.ts** / **.tsx** / **.mjs** / **app/globals.css** under repo root, excluding `node_modules` / `.next` / build). *(Renumbered when §17 / Aldric step 5 was added.)*
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

## 17. Aldric the Veteran — Living Context Engine

Aldric the Veteran (`old_mercenary` NPC, Main Hall) is the
game's primary in-world tutorial and lore delivery system.
He is not just a character — he is a living index of
everything the player can do, learn, and discover.

**Every time a new mechanic, room, system, item category,
command, or secret is added to Living Eamon, Aldric must
be updated to know about it.**

This is a standing rule. It applies to every Cursor prompt
that changes gameplay. If a prompt adds a new feature,
the same prompt must also update Aldric's topic responses
in `lib/gameData.ts` to reflect that feature.

### What Aldric knows (current)

| Topic | What he covers |
|-------|---------------|
| Survival | Barrel, BEG, banking gold, death/respawn |
| Combat | Hit chance 75% + skill bonus (max 95%), weapon types, armor, fumbles, crits, FLEE |
| Skills | Nine tracks, 700 cap, decay at cap, STATS, combat gains on hits |
| Training | **TRAIN** in Main Hall, tiered **25/100/300/750** gp; Aldric present |
| Adventures | Beginner's Cave, Thieves Guild, Haunted Manor |
| The World | The Guild, the Church, Hokas, Sam |
| The Order | Whispered hint only — keep voice down |
| Magic | Guild magic (safe) vs things not discussed in public |
| Personal stories | Unlocked after buying him an ale (Jane, cached) |

### What Aldric does NOT know yet (add when implemented)

- Stamina system
- Hunger and thirst
- Weight and encumbrance
- Runes and runegates
- Security boxes and VIP room
- Banking gnomes (when Brunt is replaced)
- Clothing and thermal system
- Weather effects on health
- Occult magic details (he hints, never explains)
- Prison adventure
- Shards and multiplayer
- Henchmen

### How Aldric's topics work (technical)

- `TELL Aldric` with no topic text → **`pickTemplate(ALDRIC_OPENING_LINES)`**
  (static topic list; no Jane call)
- `TALK Aldric` / `TALK TO Aldric` in **Main Hall** → same static opening as **`TELL Aldric`** (no Jane)
- `TALK` otherwise is an alias for **`SAY`** (room speech)
- `TELL Aldric [topic]` → **`pickTemplate(ALDRIC_TOPIC_RESPONSES[topic])`**
  (no Jane call for standard topics)
- Personal stories (ale required) → Jane generates
  once, saved to world_objects cache permanently
- Secret/lore topics → Jane generates once, cached,
  gated behind player progress flags
- Aldric's responses live in `ALDRIC_TOPIC_RESPONSES`
  in `lib/gameData.ts`

### Rule for future sessions

When writing any Cursor prompt that adds a new feature:
1. Add the feature code as normal
2. Add a corresponding entry to `ALDRIC_TOPIC_RESPONSES`
   in `lib/gameData.ts` so Aldric can explain it
3. Add the topic to the table above in this section
4. If the feature is not yet implemented, add it to the
   "What Aldric does NOT know yet" list above

This keeps Aldric current and prevents the tutorial
system from drifting out of sync with the game.

---
