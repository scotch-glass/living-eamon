---
id: travel_matrix
title: Travel Cost Matrix
role: design-canon
canonical_for: [travel-cost-matrix, travel-mode-table, random-encounter-pools]
visibility: creator
status: active
last_updated: 2026-05-03
cross_refs: [lore/thurian-cartography/WORLD_LOCATIONS.md]
---

# Living Eamon — Travel Matrix & Random Encounter Design

> **Status:** Design reference — feeds the S4 Graphical Travel System sprint.
> **Canonical travel spec:** `~/.claude/plans/i-accidentally-submitted-the-misty-map.md`
> **Location registry:** `lore/thurian-cartography/WORLD_LOCATIONS.md`
> **Loot tables:** `lore/thurian-cartography/LOOT_TABLES.md`

---

## Travel Nodes

All destinations a player can travel to. **Valus is the fixed origin** — the City of Wonders,
capital of Valusia. The Guild Hall sits within Valus. Node id: `valus`.

| Node ID | Name | Type | Map coords |
|---|---|---|---|
| `valus` | Valus, the City of Wonders (Guild Hall hub) | Origin | 600, 530 |
| `city_vanara` | Vanara | City | 490, 380 |
| `city_kamula` | Kamula | City | 620, 420 |
| `city_talunia` | Talunia | City | 1160, 560 |
| `city_blaal` | Blaal | City | 820, 690 |
| `city_stagus` | Stagus | City | 1540, 650 |
| `poi_skull_of_silence` | Skull of Silence | Landmark | 980, 230 |
| `poi_lake_of_visions` | Lake of Visions | Landmark | 500, 510 |
| `poi_accursed_gardens` | Accursed Gardens | Landmark | 640, 565 |
| `poi_forbidden_lake` | Forbidden Lake | Landmark | 510, 640 |
| `poi_tiger_valley` | Tiger Valley (Atlantis) | Landmark | 320, 245 |
| `nation_thule` | Thule (capital region) | Nation hub | 680, 130 |
| `nation_commoria` | Commoria (citadel region) | Nation hub | 1050, 175 |
| `nation_lemuria` | Lemuria (coastal port) | Nation hub | 1820, 400 |
| `nation_atlantis` | Atlantis | Nation hub | 210, 200 |
| `geo_lost_lands` | Lost Lands (entry) | Wilderness | 900, 1100 |

---

## Zone Types & Danger Ratings

Each route leg crosses one or more geographic zones. The **most dangerous zone** on a leg
determines the encounter roll frequency for that day. Multiple zones in one day = use the
worst zone's danger rating.

| Zone type | Zone IDs | Danger rating | Daily encounter chance |
|---|---|---|---|
| Civilization | `nation_valusia` core, roads between cities | Safe | 15% |
| Plains / scrub | `nation_farsun`, `nation_thurania` lowlands | Moderate | 35% |
| Forest / valley | `nation_zarfhaana`, `nation_kamelia` foothills | Moderate | 35% |
| Mountain | `geo_zalgara_mts`, `geo_zhemri_mts`, Thule/Kamelia highlands | Dangerous | 55% |
| Cold north | `nation_thule` interior, `nation_commoria` heights | Dangerous | 55% |
| Desert | `geo_camoonia_desert` | Dangerous | 55% |
| Coastal / sea | Verulia coast, sea crossings | Dangerous | 55% |
| River | `geo_river_stagus` | Moderate | 35% |
| Hostile tribal | `geo_kaa_u_picts`, `geo_isles_of_picts` | Dangerous | 55% |
| Jungle fringe | Thuria south transitional | Dangerous | 55% |
| Deep jungle | `geo_jungles` | Extreme | 75% |
| Frontier | `geo_worlds_end`, eastern Thuria | Extreme | 75% |
| Lost Lands | `geo_lost_lands` | Extreme | 75% |

---

## Travel Matrix

Travel time in **days on foot** (horse = ÷2, rounded up; ship = varies by sea route).
Zones listed are the primary zones crossed in order. Danger = highest zone on that leg.

### Routes from Valus (hub)

| From | To | Days (foot) | Days (horse) | Zones crossed | Danger | Encounter rolls |
|---|---|---|---|---|---|---|
| `valus` | `poi_lake_of_visions` | 1 | 1 | Valusia civilization | Safe | 1 |
| `valus` | `poi_accursed_gardens` | 1 | 1 | Valusia civilization | Safe | 1 |
| `valus` | `city_kamula` | 1 | 1 | Valusia civilization | Safe | 1 |
| `valus` | `city_vanara` | 2 | 1 | Valusia civilization → Kamelia foothills | Moderate | 2 |
| `valus` | `poi_forbidden_lake` | 2 | 1 | Valusia civilization → Farsun plains | Moderate | 2 |
| `valus` | `city_blaal` | 4 | 2 | Valusia plains → Farsun scrub → Thurania hills | Moderate | 4 |
| `valus` | `poi_skull_of_silence` | 7 | 4 | Valusia plains → Kamelia foothills → Zalgara Mts (4d) | Dangerous | 7 |
| `valus` | `nation_thule` | 6 | 3 | Valusia → Kamelia foothills → Thule cold highlands (3d) | Dangerous | 6 |
| `valus` | `city_talunia` | 7 | 4 | Valusia → Camoonia Desert (3d) → Zarfhaana valleys (2d) | Dangerous | 7 |
| `valus` | `city_stagus` | 11 | 6 | Valusia → Thurania → Grondar plains (3d) → Thuria → River Stagus | Dangerous | 11 |
| `valus` | `nation_commoria` | 9 | 5 | Valusia → Kamelia → Zalgara Mts (3d) → Skull of Silence pass → Commoria heights | Dangerous | 9 |
| `valus` | `nation_atlantis` | — | — | Sea crossing required (3 days by ship) | Dangerous | 3 (sea) |
| `valus` | `nation_lemuria` | — | — | Sea crossing required (7 days by ship) | Dangerous | 7 (sea) |
| `valus` | `geo_lost_lands` | 8 | 5 | Valusia → Thurania → Thurania south hills (3d) → Lost Lands entry | Extreme | 8 |
| `valus` | `poi_tiger_valley` | — | — | Sea crossing to Atlantis (3d ship) + 2d overland | Dangerous | 5 |

### Routes between destinations (intermediate / onward legs)

| From | To | Days (foot) | Days (horse) | Zones crossed | Danger | Encounter rolls |
|---|---|---|---|---|---|---|
| `city_vanara` | `nation_thule` | 4 | 2 | Kamelia foothills → Thule cold highlands | Dangerous | 4 |
| `city_vanara` | `poi_skull_of_silence` | 5 | 3 | Kamelia foothills → Zalgara Mts | Dangerous | 5 |
| `poi_skull_of_silence` | `nation_commoria` | 2 | 1 | Zalgara Mts (mountain pass) | Dangerous | 2 |
| `poi_skull_of_silence` | `city_talunia` | 4 | 2 | Zalgara Mts → Zarfhaana valleys | Dangerous | 4 |
| `city_talunia` | `city_stagus` | 4 | 2 | Grondar stone plains → River Stagus → Thuria coast | Moderate | 4 |
| `city_talunia` | `nation_lemuria` | — | — | Sea crossing (5d ship) | Dangerous | 5 (sea) |
| `city_blaal` | `city_stagus` | 7 | 4 | Thurania hills → Thuria interior → River Stagus | Dangerous | 7 |
| `city_blaal` | `geo_lost_lands` | 4 | 2 | Thurania south hills → Lost Lands entry | Extreme | 4 |
| `city_stagus` | `geo_worlds_end` | 5 | 3 | Thuria east → frontier wilderness | Extreme | 5 |
| `city_stagus` | `geo_jungles` | 3 | 2 | Thuria south → jungle fringe → deep jungle | Extreme | 3 |
| `nation_atlantis` | `poi_tiger_valley` | 2 | 1 | Atlantis island interior | Moderate | 2 |
| `nation_thule` | `nation_commoria` | 3 | 2 | Thule/Kamelia highlands → Zalgara pass | Dangerous | 3 |

---

## Encounter Roll Mechanics

### Per-day resolution
```
For each day of travel:
  1. Identify the zone type for that day (use TRAVEL MATRIX above)
  2. Roll d100
  3. If result ≤ zone's daily encounter chance → encounter occurs
  4. Roll d100 on that zone's encounter table (see below)
  5. Load the encounter: combat room, dialogue event, or terrain event
  6. Use the pre-generated scene background for that zone type
```

### Encounter table structure (all zones)
Every zone's d100 table is structured identically — only the specific entries change:

| Roll | Category | Notes |
|---|---|---|
| 01–25 | **Bandits** | Universal. Varies by region flavor only. |
| 26–45 | **Wild animals** | Zone-specific species. |
| 46–60 | **Terrain event** | Zone-specific non-combat hazard (storm, rockfall, etc.). |
| 61–75 | **Discovery** | Abandoned camp, old ruin, cairn, lost item. |
| 76–90 | **Neutral encounter** | Merchant, pilgrim, lost traveler, hermit. |
| 91–100 | **Rare / special** | Zone-unique high-value encounter. One-per-journey cap. |

---

## Zone Encounter Tables

### UNIVERSAL entries (apply to every zone — rolled from 01–25)

| Roll | Encounter |
|---|---|
| 01–06 | Road bandits — 3 footpads, light armor, want coin or blood |
| 07–11 | Bandit ambush from treeline / rocks — 5 attackers |
| 12–15 | Deserter soldiers — 2 armed men, nervous, may parley or fight |
| 16–18 | Slavers — 4 guards with 3 bound captives; player can intervene or pass |
| 19–20 | Bounty hunter — alone, hunting someone who matches hero's description |
| 21–22 | Black Vellum courier — carrying a sealed letter; knows they're spotted |
| 23–24 | **Caravan encounter** — a merchant caravan of 2–4 wagons and 3 guards. Player chooses: **(A) Trade** — opens a vendor screen with region-appropriate goods and prices; **(B) Raid** — attack the guards and take the wagons (Standing penalty, goods become loot; PICSSI: −Standing, −Integrity, +Passion if victorious) |
| 25 | **Caravan under attack** — player arrives to find a caravan or lone traveler already being raided by 4 bandits. Player chooses: **(A) Help the caravan** — fight the bandits (PICSSI: +Integrity, +Standing; caravan owner rewards with coin or goods); **(B) Help the raiders** — join the attack (+Passion, −Integrity, −Standing; share of the loot); **(C) Pass by** — no consequence except a private Chronicle entry |

### CIVILIZATION (Valusia core roads)

| Roll | Encounter |
|---|---|
| 26–35 | Stray hunting dog pack — 4 dogs, starving, semi-hostile |
| 36–45 | Wild boar crosses road — only attacks if cornered |
| 46–52 | Storm closes the road — find shelter or take weather damage |
| 53–60 | Broken bridge — detour adds half a day; water crossing required |
| 61–68 | Abandoned roadside shrine — offerings left; Spirituality delta if player prays |
| 69–75 | Overturned merchant wagon — owner trapped under wheel; goods scattered |
| 76–83 | Traveling physician — sells healing poultices |
| 84–90 | Royal courier — important letter, asks hero to carry it ahead |
| 91–96 | Order agent — watching the road, watching the hero specifically |
| 97–100 | Serpent-Man in disguise as a pilgrim — passes the test only if player uses counter-phrase |

### PLAINS / SCRUB (Farsun, Thurania lowlands)

| Roll | Encounter |
|---|---|
| 26–33 | Wolf pack — 6 wolves, testing the herd; will break off if hero fights back hard |
| 34–40 | Wild horses — stampede risk if hero is on foot |
| 41–45 | Giant scorpion (Farsun variant) — attacks without warning |
| 46–52 | Dust storm — half-day delay, visibility zero, risk of separation |
| 53–58 | Dry riverbed — no water source; dehydration risk begins |
| 59–65 | Ancient burial mound — sealed entrance, faint light visible at dusk |
| 66–72 | Abandoned caravan — recent attack, bodies still warm, goods untouched |
| 73–82 | Farsunian water merchant — sells water at extortionate price |
| 83–90 | Thuranian shaman — offers a warning in riddle form |
| 91–96 | Pict outriders scouting south of their usual range |
| 97–100 | Pre-human stone circle — active at night; screaming if approached after dark |

### FOREST / VALLEY (Zarfhaana, Kamelia foothills)

| Roll | Encounter |
|---|---|
| 26–33 | Forest wolves — 4 animals, coordinated pack hunters |
| 34–40 | Wild boar — 1 large male; aggressive if startled |
| 41–45 | Cave bear — blocking the path, with cubs |
| 46–52 | Sudden fog — visibility to arm's length for hours |
| 53–58 | Swollen river crossing — stamina check or swept downstream |
| 59–65 | Ruins of a Zarfhaanian waystation — old, looted, one room intact |
| 66–72 | Wounded deer — arrow still in its side; hunter will come looking |
| 73–82 | Zarfhaanian herbalist — sells reagents; has heard unusual things on the road |
| 83–90 | Hunter with a kill — suspicious of strangers on his land |
| 91–96 | Ancient carved standing stones — recent blood on the altar stone |
| 97–100 | Dream-walker apparition — a woman in white, pointing toward something; vanishes on approach |

### MOUNTAIN (Zalgara Mts, Zhemri Mts, Kamelia heights, Thule)

| Roll | Encounter |
|---|---|
| 26–33 | Mountain wolves — 5 animals, lean and fearless |
| 34–40 | Rock eagle — attacks from above; nest in the pass ahead |
| 41–45 | Giant mountain goat / ibex — charges if cornered on a ledge |
| 46–52 | Rockslide — blocks the pass; half-day detour or dangerous climb |
| 53–58 | Altitude sickness — stamina drain until lower elevation |
| 59–65 | Cave mouth — recent fire inside; someone lives here |
| 66–72 | Frozen body in the ice — holding something valuable |
| 73–82 | Mountain hermit — knows the pass better than anyone; has a price |
| 83–90 | Commorian outriders — horse patrol; hostile if hero is unknown |
| 91–96 | Thulian ghost rider trace — old campsite, a bound iron chain in the rock |
| 97–100 | Skull of Silence whisper — even far from the castle, a faint sound like breathing stops all noise |

### DESERT (Camoonia Desert)

| Roll | Encounter |
|---|---|
| 26–33 | Scorpion swarm — dozens of small ones; hard to avoid without fire |
| 34–40 | Camel spider — single large specimen; fast and aggressive |
| 41–44 | Sand viper — nearly invisible in the sand |
| 46–52 | Sandstorm — zero visibility for 4 hours; risk of losing the trail |
| 53–58 | Dehydration — water supply runs low; must find water or take damage each subsequent day |
| 59–65 | Buried ruin — only the top of a doorway visible above the sand |
| 66–72 | Bleached bones with equipment — a traveler who didn't make it; gear still usable |
| 73–82 | Camoonian trade caravan — water and supplies for a price |
| 83–90 | Desert guide — will escort across for payment; knows every water source |
| 91–96 | Zarfhaanian nomads — hostile on first contact, tradeable if approached correctly |
| 97–100 | Mirage of water — leads hero a full day off course before breaking |

### COLD NORTH (Thule interior, Commoria heights)

| Roll | Encounter |
|---|---|
| 26–33 | Arctic wolf pack — 7 animals; white-coated, nearly silent |
| 34–40 | Polar bear — single massive specimen; blocking a choke-point |
| 41–45 | Ice wyrm — large serpentine creature under the ice; attacks if hero crosses a frozen lake |
| 46–52 | Blizzard — shelter must be found or hero takes cold damage |
| 53–58 | Frozen river crossing — ice cracks; stamina check |
| 59–65 | Thulian war party — 6 warriors returning from a raid; wary but not hostile |
| 66–72 | Frozen Commorian soldier in a snowdrift — clutching something |
| 73–82 | Thulian trader — furs and weapons; excellent quality |
| 83–90 | Thulian shaman (völva) — warns of something ahead in cryptic verse |
| 91–96 | Ghost rider trace — a chain embedded in frozen stone; the chain moves if touched |
| 97–100 | Iraina's tiger women — a scouting pack of 3, in human form; golden eyes |

### COASTAL / SEA

| Roll | Encounter |
|---|---|
| 26–33 | Sharks circling the hull / coastal swimmers |
| 34–40 | Sea serpent — surfaces alongside the vessel, curious |
| 41–45 | Giant octopus — grabs at the hull in shallow water |
| 46–52 | Storm at sea — vessel takes damage; stamina drain for all |
| 53–58 | Fog bank — off-course; add 1 day to journey |
| 59–65 | Ghost ship — unmanned, drifting; recent cargo still aboard |
| 66–72 | Stranded survivors on a rock — from a sunken Lemurian vessel |
| 73–82 | Merchant vessel — willing to trade; news from distant ports |
| 83–90 | Pictish raider longship — pursuing; can be outrun or fought |
| 91–96 | Lemurian war vessel — corvette with golden-eyed crew; not hostile unless provoked |
| 97–100 | Roc of Lemuria's pirate fleet — 3 ships; the infamous captain is aboard |

### RIVER (River Stagus)

| Roll | Encounter |
|---|---|
| 26–33 | Crocodile — large specimen blocking a ford |
| 34–40 | River serpent — 20 feet long; coils around small boats |
| 41–45 | Hippo — charges the boat; not a combat encounter, a navigation crisis |
| 46–52 | Rapids — boat takes damage; cargo at risk |
| 53–58 | Flash flood — river rises suddenly; camp must be abandoned |
| 59–65 | Drowned village — submerged buildings visible in clear water |
| 66–72 | Abandoned fishing camp — fire still warm, nets left mid-cast |
| 73–82 | River trader — flat barge heading upstream; happy to talk |
| 83–90 | Grondarite river toll post — legitimate fee, or fight |
| 91–96 | River pirates — Stagus-based operation, well-equipped |
| 97–100 | Serpent-Man ritual site on the far bank — lit torches, chanting |

### JUNGLE (Thuria deep jungle, jungle fringe)

| Roll | Encounter |
|---|---|
| 26–33 | Giant spider — web across the trail; spider drops from above |
| 34–40 | Jaguar / great cat — follows for hours before attacking |
| 41–44 | Venomous serpent — nearly stepped on; poison check |
| 45 | Giant constrictor — in the canopy; drops without warning |
| 46–52 | Fever — tropical disease; stamina drain for next 2 days unless treated |
| 53–58 | Quicksand bog — hero sinks rapidly if stepping off the trail |
| 59–65 | Ancient stone idol — offerings at its feet; recent ones |
| 66–72 | Ruins of a pre-human temple — column-lined courtyard, entirely intact, no dust |
| 73–80 | Hunter's trail — a human hunter, local, who knows every Serpent-Man patrol route |
| 81–88 | Pict scout — alone, hostile at first, may become guide |
| 89–95 | Serpent-Man scout patrol — 2 soldiers; the counter-phrase buys confusion |
| 96–100 | Serpent-Man ritual procession — 8 figures, captive human, full regalia |

### FRONTIER / WORLD'S END / LOST LANDS

| Roll | Encounter |
|---|---|
| 26–33 | Mutant creature — animal shape, wrong number of eyes or limbs |
| 34–40 | Pack of dire wolves — larger than any wolf seen before |
| 41–45 | Basilisk — must not meet its gaze; stone statue of a previous traveler nearby |
| 46–52 | Reality tremor — the terrain shifts; yesterday's path is today's cliff |
| 53–58 | Unexplained light in the distance — moves when approached, stationary when ignored |
| 59–65 | Perfectly preserved ancient ruin — no damage, no dust, door stands open |
| 66–72 | Eldar patrol (Lost Lands only) — gray-eyed, tall, watching silently from a ridge |
| 73–80 | Cult patrol — Order scouts this deep in the frontier, looking for something specific |
| 81–88 | Dwarf prospector (Lost Lands only) — alone, well-armed, deeply suspicious |
| 89–95 | Black Vellum expedition camp — a sorcerer and 4 guards, excavating something |
| 96–100 | Pre-Thurian vault — open, recently opened, something came OUT |

---

## Scene Backgrounds Required (Pre-Generation List)

One Grok Imagine Pro pre-generated background per zone type, used as the encounter screen
backdrop. Each background is a wide landscape painting — no figures, no text, no UI elements.
The encounter combatants and dialogue are layered over it at runtime.

Every background: **wide landscape, Thurian Age sword-and-sorcery painterly style, no figures,
no text, dramatic lighting. 1792×1024 landscape. Grok Imagine Pro.**

| Scene ID | Description | Time of day | Prompt seed |
|---|---|---|---|
| `scene_valusia_road_day` | Broad stone road through Valusian farmland, distant palace towers on the horizon, rolling green hills | Day | *"Wide Roman-style stone road cuts through fertile farmland, ancient palace towers visible in warm golden distance, Thurian Age sword-and-sorcery painterly style, dramatic afternoon light, no figures"* |
| `scene_valusia_road_night` | Same road at night, twin moons, fireflies in the grass, towers lit by distant fires | Night | *"Ancient stone road at night, twin moons above, fireflies in tall grass beside the road, distant palace windows glowing, painterly Thurian Age fantasy style, no figures"* |
| `scene_plains_day` | Flat dry scrubland, ancient burial mounds on the horizon, lone dead tree, cloudless sky | Day | *"Vast dry scrubland plains, ancient burial mounds dotting the horizon, solitary gnarled dead tree, Thurian Age painterly style, harsh midday sun, no figures"* |
| `scene_plains_night` | Same plains under stars, burial mounds silver in moonlight, wind-bent grass | Night | *"Open scrubland plains at night, burial mounds silver under a full moon, wind-bent dry grass, vast starfield, painterly Thurian Age fantasy, no figures"* |
| `scene_forest_valley_day` | Ancient forest, shafts of green light through canopy, mossy ruins of a waystation, mist in the valley below | Day | *"Ancient primeval forest, shafts of green sunlight through dense canopy, mossy stone ruins of a waystation, misty valley visible below, painterly Thurian Age style, no figures"* |
| `scene_forest_valley_night` | Same forest at night, bioluminescent fungi, moonlight patches on forest floor | Night | *"Dark ancient forest at night, bioluminescent fungi glowing blue-green, moonlight falling in patches on forest floor, Thurian Age painterly style, no figures"* |
| `scene_mountain_pass_day` | Rocky mountain pass, sheer cliffs on both sides, distant snow peaks, thin air haze | Day | *"Dramatic rocky mountain pass, sheer cliff walls on both sides, snow-capped peaks in distance, thin high-altitude haze, Thurian Age sword-and-sorcery painterly style, no figures"* |
| `scene_mountain_pass_night` | Same pass at night, stars shockingly bright at altitude, ice glittering on cliff faces | Night | *"Rocky mountain pass at night, shockingly bright stars at high altitude, ice glittering on cliff faces, cold blue light, painterly Thurian Age style, no figures"* |
| `scene_desert_day` | Camoonia desert, rolling sand dunes, ruins of columns half-buried, brutal sun | Day | *"Vast desert of rolling red-gold sand dunes, ancient stone columns half-buried at the base of a dune, brutal overhead sun, heat haze on the horizon, Thurian Age painterly style, no figures"* |
| `scene_desert_night` | Same desert at night, cold blue starlight on sand, a buried doorway arch visible | Night | *"Desert at night, cold blue starlight on pale sand dunes, the top arch of a buried stone doorway just visible above the sand, Thurian Age fantasy painterly style, no figures"* |
| `scene_cold_north_day` | Frozen tundra, wind-scoured rock, distant Thulian longhouse smoke, low gray sky | Day | *"Frozen northern tundra, wind-scoured bare rock, distant longhouse smoke on the horizon, low heavy gray sky, Thurian Age painterly style, cold light, no figures"* |
| `scene_cold_north_night` | Same tundra under aurora borealis, ice-locked lake, black trees | Night | *"Frozen tundra under aurora borealis, ice-locked lake reflecting green and violet light, black leafless trees, Thurian Age painterly style, no figures"* |
| `scene_sea_day` | Open ocean, white-capped waves, distant island silhouette, sailing vessel rigging in foreground | Day | *"Open Thurian ocean, white-capped deep blue waves, distant island silhouette, ship rigging lines in foreground framing the view, Thurian Age painterly style, no figures"* |
| `scene_sea_night` | Same ocean at night, twin moons on the water, phosphorescent wake | Night | *"Open ocean at night, twin moons reflected in dark water, phosphorescent blue-green wake, Thurian Age fantasy painterly style, no figures"* |
| `scene_river_stagus_day` | Wide brown river, reed banks, flat trading barges in the distance, tropical trees beginning | Day | *"Wide tropical river, tall reed banks, distant flat trading barges silhouetted on the water, tropical vegetation beginning on the banks, Thurian Age painterly style, no figures"* |
| `scene_jungle_fringe_day` | Edge of jungle, last open road visible behind, wall of dense green ahead, ancient stone arch in the undergrowth | Day | *"Edge of a primeval jungle, last remnant of road behind, wall of dense tropical green ahead, ancient stone arch half-consumed by vines, Thurian Age sword-and-sorcery painterly style, no figures"* |
| `scene_deep_jungle_day` | Oppressive jungle canopy, shafts of green light, massive roots, stone temple wall visible through the trees | Day | *"Oppressive tropical jungle interior, massive ancient roots, shafts of green light from high canopy, crumbling stone temple wall visible through dense vegetation, Thurian Age painterly style, no figures"* |
| `scene_deep_jungle_night` | Same jungle at night, fireflies, distant orange torch light through the trees | Night | *"Dense tropical jungle at night, fireflies, distant orange torch light glowing through thick tree trunks, humid darkness, Thurian Age painterly style, no figures"* |
| `scene_frontier_day` | Wrong landscape — too flat, too silent, ruins that shouldn't be there, sky slightly wrong color | Day | *"Eerie open frontier wasteland, too-flat terrain, ancient ruins that should not exist here, sky an unsettling amber instead of blue, oppressive silence, Thurian Age dark fantasy painterly style, no figures"* |
| `scene_frontier_night` | Same frontier at night, unexplained light in the middle distance, no stars directly overhead | Night | *"Frontier wasteland at night, an unexplained light in the middle distance, the area directly overhead has no stars — just black, Thurian Age dark fantasy painterly style, no figures"* |
| `scene_lost_lands_day` | Otherworldly landscape, ancient Eldar architecture in ruins, mountains that shouldn't geologically exist, unearthly flora | Day | *"Otherworldly lost lands, ancient Eldar stone architecture in ruins, impossible geology, unearthly luminescent flora, Thurian Age dark fantasy painterly style, no figures"* |
| `scene_thurania_hills_day` | Rolling hill country, stone circles on ridgelines, dry stone walls, a village smoke far below | Day | *"Rolling Thuranian hill country, ancient stone circles on ridgelines, dry-stone walls crossing the slopes, village hearth smoke in the valley far below, Thurian Age painterly style, no figures"* |
| `scene_grondar_plains_day` | Flat stone moor, wind-bent grass, a Grondarite fortress on the far hill, storm building | Day | *"Flat rocky moor, wind-bent sparse grass, a massive granite Grondarite fortress silhouetted on a far hill, storm clouds building on the horizon, Thurian Age painterly style, no figures"* |

**Total scenes to pre-generate: 23**

### Pre-generation priority order
1. `scene_valusia_road_day` / `scene_valusia_road_night` — used on almost every journey start
2. `scene_plains_day` / `scene_plains_night` — high-frequency zone
3. `scene_desert_day` / `scene_desert_night` — Talunia/Zarfhaana route
4. `scene_mountain_pass_day` / `scene_mountain_pass_night` — Skull of Silence, Thule routes
5. `scene_deep_jungle_day` / `scene_deep_jungle_night` — Thuria / Serpent-Man content
6. All others in any order

---

## Scene-to-Zone Mapping (runtime lookup)

When an encounter triggers, the engine picks the background using this table:

| Zone type | Day scene ID | Night scene ID |
|---|---|---|
| Civilization | `scene_valusia_road_day` | `scene_valusia_road_night` |
| Plains / scrub | `scene_plains_day` | `scene_plains_night` |
| Forest / valley | `scene_forest_valley_day` | `scene_forest_valley_night` |
| Mountain | `scene_mountain_pass_day` | `scene_mountain_pass_night` |
| Cold north | `scene_cold_north_day` | `scene_cold_north_night` |
| Desert | `scene_desert_day` | `scene_desert_night` |
| Coastal / sea | `scene_sea_day` | `scene_sea_night` |
| River | `scene_river_stagus_day` | `scene_river_stagus_day` (no night variant yet) |
| Jungle fringe | `scene_jungle_fringe_day` | `scene_deep_jungle_night` |
| Deep jungle | `scene_deep_jungle_day` | `scene_deep_jungle_night` |
| Frontier | `scene_frontier_day` | `scene_frontier_night` |
| Lost Lands | `scene_lost_lands_day` | `scene_frontier_night` |
| Thurania hills | `scene_thurania_hills_day` | `scene_plains_night` |
| Grondar plains | `scene_grondar_plains_day` | `scene_plains_night` |

Day/night determined by the world clock (`worldTurn % 24`): turns 6–18 = day, 0–5 / 19–23 = night.

---

## Implementation Notes (for S4 sprint)

- Scene backgrounds live at `public/art/scenes/travel/` with the `scene_*` IDs as filenames.
- The travel matrix data lives in `lib/world/travelMatrix.ts` as a typed record of `TravelLeg` objects.
- Each `TravelLeg`: `{ from, to, daysFoot, daysHorse, zones: ZoneType[], dangerRating, encounterRolls }`.
- `ZoneType` is a union of zone type strings matching the tables above.
- The encounter resolver in `lib/world/travelEncounters.ts` takes `(zoneType, roll: number)` and returns an `EncounterTemplate`.
- Each `EncounterTemplate` references a `sceneId` which maps to a background asset via the scene-to-zone table above.
