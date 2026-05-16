---
id: world_locations
title: World Locations — Thurian Cartography
role: design-canon
canonical_for: [travel-node-registry, nation-roster, loot-zone-ids]
visibility: creator
status: active
last_updated: 2026-05-03
cross_refs: [GAME_DESIGN.md, lore/thurian-cartography/TRAVEL_MATRIX.md, lore/thurian-cartography/LOOT_TABLES.md, EDGE_VECTORS.md]
questions_total: 6
questions_answered: 6
questions_open: 0
edge_vector_ids: []
---

## Questions answered by this document

> Answers are tagged by category and confidence (`[high]` / `[medium]` / `[low]` / `[open]`).
> Non-`[high]` answers are mirrored in [`EDGE_VECTORS.md`](EDGE_VECTORS.md) under their `EV-` id.

### [NAV-MAP]

**Q:** What is the registry shape — what categories of nodes does this doc declare?
**A:** Four categories. (1) **Nations / Kingdoms** (12): the Seven Empires (Valusia, Kamelia, Verulia, Grondar, Thule, Commoria, Farsun) plus 5 others (Atlantis, Zarfhaana, Thurania, Thuria, Lemuria). (2) **Cities / Settlements** (6): City of Wonders, Vanara, Kamula, Talunia, Blaal, Stagus — each is an adventure hub with a map dot. (3) **Named Points of Interest / Landmarks** (5): Skull of Silence, Lake of Visions, Accursed Gardens, Forbidden Lake, Tiger Valley — prime adventure-module anchors. (4) **Geographic wilderness areas** (11): Tathel Isle, Kaa-U Picts, Isles of the Picts, Red Isles, Camoonia Desert, Zalgara Mts, Zhemri Mts, River Stagus, World's End, Lost Lands, Jungles. Each entry has an id, name, approximate map pixel coordinates (origin top-left of the 2560×1693 map image), and lore notes. `[high]`
↔ relates to: §Nations / Kingdoms, §Cities / Settlements, §Named POI / Landmarks, §Geographic Wilderness Areas

### [NAV-MAP]

**Q:** What is the Valus origin contract that anchors travel and the hub layout?
**A:** **Valus, the City of Wonders, capital of Valusia, is the Guild Hall hub and the fixed origin for all travel calculations.** Node id: `valus`. Map coords: 600, 530 (slightly offset from `city_of_wonders` at 600, 530 — they are the same place; the Guild Hall hub uses the `valus` id). All travel-time calculations originate from Valus; encounter-roll counts in TRAVEL_MATRIX.md sum the days from `valus` outward; the hub-return action that resets `actionBudget = 25` (per KARMA_SYSTEM.md §2.3) fires when the player re-enters Valus. **Adventure modules must declare a `locationId`** from this registry, plus `travelZones[]` (geographic zones crossed en route from Valus) and `travelDays` (approximate overland days). The travel UI reads `travelZones` to build the zone-specific encounter table for that journey. `[high]`
↔ relates to: §Travel System (design contract), §Adventure module location tagging, lore/thurian-cartography/TRAVEL_MATRIX.md (Travel Matrix table), KARMA_SYSTEM.md §2.3 (actionBudget reset)

### [INK-AUTHORING]

**Q:** What design contract does this doc enforce on adventure modules?
**A:** Three rules in the §Travel System block. (1) **Every adventure module must declare a `locationId` from this registry** — no module can ship without a registered destination. (2) **Travel to a remote adventure uses the map as the background**, with a moving hero marker and random encounters along the route (per S4 Graphical Travel System spec at `~/.claude/plans/i-accidentally-submitted-the-misty-map.md`). (3) **The travel screen reads `travelZones`** from each module's registry entry to build the zone-specific encounter roll table — so longer routes through more dangerous zones get more encounter rolls. The contract surfaces in `lib/adventures/registry.ts` as the `locationId: string`, `travelZones: string[]`, and `travelDays: number` fields on every module entry. `[high]`
↔ relates to: §Travel System (design contract), §Adventure module location tagging, ~/.claude/plans/i-accidentally-submitted-the-misty-map.md (S4 plan)

### [NAV-MAP]

**Q:** How are random encounters wired to geographic zones?
**A:** Five-step resolution. (1) Each travel leg crosses one or more zones — `geo_camoonia_desert`, `geo_zalgara_mts`, etc. (2) The §Travel System block lists six high-level zone types: wilderness/plains, mountain, desert, jungle, sea/river, frontier/Lost Lands — each with its own bullet-list encounter pool. (3) TRAVEL_MATRIX.md elaborates: 13 zone types each with a daily encounter chance (Safe 15% / Moderate 35% / Dangerous 55% / Extreme 75%) and a d100 sub-table (universal 01–25 + zone-specific 26–100). (4) The encounter resolver hits the **most dangerous zone** on a leg if multiple zones cross in one day. (5) Pre-generated scene backgrounds at `public/art/scenes/travel/` (23 total per TRAVEL_MATRIX) provide the painterly backdrop for any encounter screen, day or night, sourced through Grok Imagine Pro. `[high]`
↔ relates to: §Travel System / Random encounters en route, lore/thurian-cartography/TRAVEL_MATRIX.md (zone tables + scene mapping), lore/thurian-cartography/LOOT_TABLES.md

### [PD-SAFETY]

**Q:** Are the place names in this registry PD-safe for player-facing prose?
**A:** Yes — the cartography is built almost entirely on **Howard's *Hyborian Age* essay (1936, PD via Phantagraph non-renewal)** plus the three PD Kull stories (*Shadow Kingdom* / *Mirrors of Tuzun Thune* 1929; *Kings of the Night* 1930). Specifically: Atlantis, Thule, Kamelia, Valusia, Commoria, Verulia, Grondar, Farsun, Thurania, Thuria, Lemuria are all from Howard's essay or the Kull canon. **City of Wonders** is the canonical capital of Kull's Valusia per Howard. Skull of Silence + Lake of Visions + Accursed Gardens are from "The Skull of Silence" / "By This Axe I Rule!" Kull stories (PD by 1929 *Weird Tales* non-renewal). The **Mirrors of Tuzun Thune** in Kamelia ties to the M-1 launch module. PANTHEON-aligned dispatcher: **Valka** = the Atlantean / Pictish / Valusian / Zarfhannian alias for Ma'at (per PANTHEON.md alias_doctrine). All trademark restrictions on Conan / Cimmerian / Hyborian still apply — none of those terms appear here. `[high]`
↔ relates to: Public_Domain_Rules.md §1.2 + §5 Always-Safe Corpus, lore/pantheon/PANTHEON.md alias dispatcher, GAME_DESIGN.md top-of-file Safe Harbor / Radioactive tables

### [NAV-MAP]

**Q:** Which of the 34 nodes (12 nations + 6 cities + 5 POIs + 11 wilderness areas) are actually travel destinations vs lore-on-map references?
**A:** **Lore-on-map references for narrative texture.** The 18 non-destination nodes (8 nations: Zarfhaana, Verulia, Grondar, Farsun, Thurania, Thuria, Kamelia; 10 wilderness: Tathel Isle, Kaa-U Picts, Isles of the Picts, Red Isles, Camoonia Desert, Zalgara Mts, Zhemri Mts, River Stagus, World's End, Jungles) are **traversed as zones during travel** but not direct click targets in v1. Infrastructure requirement: each lore-only node needs **regional descriptions, peoples, dominant gods** so Ink authors can choose them as adventure settings. Future sprints can unlock specific adventures and convert lore-only nodes to travel destinations as needed. Add a `nodeKind: 'destination' | 'lore-only'` field to each entry so the travel UI filters click-targets without ambiguity. `[high]`
↔ relates to: lore/thurian-cartography/TRAVEL_MATRIX.md §Travel Nodes (16 destinations), §Adventure module location tagging, ~/.claude/plans/i-accidentally-submitted-the-misty-map.md (S4 click-targets)

---

# Living Eamon — World Map Location Reference

> **Source map (canonical / branded):** `lore/thurian-cartography/living-eamon-map.png` — 2560×1693, includes "LIVING EAMON" logo. This is the travel screen background asset.
> **Public path (for travel UI):** `/art/living-eamon-map.png`
> **Source map (unlabeled reference):** `lore/thurian-cartography/thurian-age-known-lands-v3.png`
>
> **Map coordinate system:** origin (0,0) = top-left corner of the 2560×1693 original image.
> Approximate pixel coordinates listed per location — use these to place adventure pins on the
> travel UI overlay.
>
> **Design contract:**
> - Every adventure module must declare a `locationId` from this registry.
> - Travel to a remote adventure uses the map as the background, with a moving hero marker
>   and random encounters along the route (see "Travel System" section below).
> - **Valus** (the City of Wonders, capital of Valusia) is the Guild Hall hub and the fixed
>   origin for all travel calculations. Node id: `valus`.

---

## Nations / Kingdoms

These are the large named regions — each is a potential adventure zone containing multiple
adventure modules, cities, and points of interest. The world is dominated by the Seven Empires—Valusia, Kamelia, Verulia, Grondar, Thule, Commoria, and Farsun. The era is marked by the war between humanity and the ancient, sub-human Serpent Men, who were forced into hiding. The Thurian Age represents a time of high civilization decaying into sorcery and madness.

| ID | Name | Approx. map coords (x, y) | Lore notes |
|---|---|---|---|
| `nation_atlantis` | **Atlantis** | 210, 200 | Island nation; "age of wonders" — sci-fi anachronisms in deep past (per project memory). Ringed by sea. One of the tribes of Atlantis is the blue-eyed Celts who have a raider and warrior-honor culture.|
| `nation_thule` | **Thule** | 680, 130 | Northern kingdom; cold, mountainous. Tall Nordic people with gray eyes and blonde hair live here. They are sea traders and fierce warriors. The women fight alongside the men and they are all uncommonly large and well muscled. It is said that in ancient times their forebears were Eldar who mated with humans and thus they are related to the tell, gray-eyed, Eldar of the Lost Lands. The scholar Malakar spent his childhood in Thule, where he developed the wish to unravel the legend of Qar, the City Beneath. Bakas once encountered a water nymph in Thule. Despite multiple attempts, he and his fellows were unable to slay it. During King Kull's reign over Valusia, around the time he was usurped by Ardyon (Thulsa Doom), outlaw hordes from Thule allegedly crossed into Valusia to steal from the tribe set at the northern peaks of Valusia. At some point, a Ghost Rider emerged from Thule. Driven mad by the Spirit of Vengeance, he was chained in a prison in Thule. 

King Governi's rule
During a week long festival held to celebrate the union of two kingdoms through the marriage of Elise, daughter of King Governi of Thule, to Rashver, son of the King of Verulia, the rulers of the various nations of the Thurian Continent and the surrounding islands were invited to enjoy King Governi of Thule's hospitality. Kull of Valusia and his retinue, including his Pictish chief warrior Brule the Spear Slayer, his advisor Tu, and the select of Valusian royalty, including Kaanub were among those in attendance, as were Ku-Var, self proclaimed ruler of Atlantis and his woman Iraina.

King Governi proclaimed a tournament for the entertainment of his royal guests with each ruler pitting their champion against the others. Finally it came down to Kull choosing his favorite soldier, Brule, and Ku-Var picking his, Iraina. Both the crowd and Kull were amused by a woman being chosen to face the Spear Slayer Brule to fight and was eventually humiliated, but before Kull could speak with him, the barbarian king was approached by his old friend, the shaman Ram-Os, now a slave. Before being called away to Ku-Var's side, Ram-Os told Kull of how all the men of the tribe were now slaves, and the women were taken to Ku-Var's harem, all except Iraina, whose ambition knew no bounds. Ku-Var's love for the wild woman drove him to conquer all the world. Kull recalled how Iraina claimed she was no man's mistress, and Ram-Os replied that it was true, and that she locked Ku-Var out of her room.

Some days later, the festival ended. Beneath the full moon, Iraina stood with her lissome army of warrior women, confronting King Governi and the army of Thule. The army of women slowly walked forward to meet them, their tiger skins becoming real stripes, and their eyes turning yellow and slatted. Suddenly, the men of Thule found themselves facing an army not of women but of tigers. The slaughter that followed was swift and merciless.

Some time later, in an icy cavern Kull and Gorn rushed Roc of Lemuria and his pirates and freed the kidnapped senators.|
| `nation_commoria` | **Commoria** | 1050, 175 | One of the Seven Empires. Northeastern mountain nation beyond Kamelia, between the Zalgara spine and the northeastern sea. The Commorians are a proud, warlike people famed for their heavy cavalry — the horse lords of the north, whose armored lancers are considered the finest shock troops in the Thurian world. Their cities are fortress-citadels carved into mountainsides, virtually impregnable from below. Politically, Commoria nurses a long-festering rivalry with Valusia — Commorian noble houses have for generations viewed the City of Wonders throne as rightfully theirs by blood. Their court is a nest of assassins and whisper-brokers; ambassadors from Commoria are watched closely in every capital. The mountain pass through the Skull of Silence is the only practical route connecting Commoria to Kamelia, making control of that pass worth more than an army. The Serpent-Men have found Commoria's culture of secrecy and political murder extremely hospitable — several Commorian noble families are believed to be entirely replaced. **Adventure hooks:** horse lord tournament, mountain citadel siege, assassination contract, control of the Skull of Silence pass, Serpent-Men court infiltration. |
| `nation_kamelia` | **Kamelia** | 730, 260 | Between Thule and Valusia; mountainous southern border. The location of the Mirrors of Tuzun Thune, these mirrors are the source of strange wisdom and cursed illusions, causing Kull to doubt reality and questioning whether they trapped the souls of men. Setting for the canon Robert E Howard tale "The Mirrors of Tuzun Thune."|
| `nation_valusia` | **Valusia** | 530, 500 | The greatest of the Seven Empires and the oldest living civilization on the Thurian continent. Its capital, the City of Wonders, is a vast, ancient metropolis of towers, broad marble avenues, and layered history so deep that no man knows what lies beneath its foundations. King Kull of Atlantis — a former barbarian and slave — rules from the topaz throne after killing the previous king in single combat, a legal if scandalous succession. Kull is known as the Tiger of Valusia. His rule is constantly threatened by the ancient laws of the kingdom, which are so old no one remembers why they exist, yet bind even the king. He has already broken several (most notably the law forbidding nobles from marrying slaves) and earned as many enemies as admirers for it.

The **Red Slayers** are Kull's elite crimson-armored bodyguard — the most feared soldiers on the continent. **Brule the Spear-Slayer**, a Pict, is Kull's closest friend, general, and the man who first saved his life. **Tu** is the Royal Counselor — fastidious, nervous, loyal, and perpetually overwhelmed. **Ka-nu** is the ancient Pictish ambassador, a canny old fox who engineered the alliance with the Tiger Tribe and first revealed the Serpent-Men conspiracy to Kull. The **Silent Ones** are a robed order of advisors whose faces are never seen and whose counsel is always cryptic — they may be the last surviving mages fighting the Serpent-Men from within the court.

The Serpent-Men have been infiltrating Valusian noble houses for generations. No one knows how deep the replacement goes. The only reliable test is the counter-phrase: *"Ka nama kaa lajerama"* — a true man will repeat it; a Serpent-Man cannot. The Lake of Visions and the Accursed Gardens are within Valusian borders. The tiger is the national symbol. Valusian culture is formal, ancient, layered with ceremony so thick that the king himself is half-prisoner to tradition. **PD source:** Howard's *The Shadow Kingdom* (1929), *By This Axe I Rule!* (1929), *The Mirrors of Tuzun Thune* (1929). **Adventure hooks:** Serpent-Men court replacement, ancient law broken or enforced, Silent Ones and their true agenda, pre-human ruins beneath the City of Wonders, Kull's personal enemies among the nobility. |
| `nation_zarfhaana` | **Zarfhaana** | 1080, 430 | East of Zalgara Mts. The region is described as having dreamy valleys and verdant forests. The Camoonian Desert lies between Zarfhaana and the Zalgara Mountains. |
| `nation_grondar` | **Grondar** | 1280, 540 | One of the Seven Empires. The easternmost of the great kingdoms, a harsh land of stone plains, wind-scoured moors, and granite ridgelines. The Grondarites are a stoic, laconic people — less ceremonially civilized than Valusia but deeply honorable, bound by oaths they consider unbreakable. They are the finest siege engineers and fortification builders in the Thurian world; every Grondarite city is a fortress designed by generations of military architects. They produce the best heavy infantry on the continent, and Grondarite mercenary companies (the Stone Companies, as they are called) serve in armies across every kingdom. Their patron deity is an unnamed god of endurance and stone — worshipped not in words but in labor. The trade city of Talunia on their western border with Zarfhaana is among the most prosperous eastern trade hubs, a place where eastern caravans and western merchants meet under Grondarite law. The eastern frontier past Grondar is largely unknown — nomadic raiders press from the east, and the Grondarites spend as much effort holding that border as participating in continental politics. **Adventure hooks:** hire a Stone Company, Grondarite oath-feud, siege of a citadel, nomadic eastern raid, Talunia trade conspiracy, god-of-stone temple cult. |
| `nation_farsun` | **Farsun** | 400, 620 | One of the Seven Empires. Southwestern plains nation between Valusia to the north and Verulia at the coast. Semi-arid scrubland and wide flat grasslands dominate the interior, cut through by several seasonal rivers whose green valley floors are the only fertile land. Farsun is first and foremost a trading nation — a crossroads kingdom whose merchants move goods between every other empire. Farsunian caravanners know every road on the continent. Their cities are built around water: each has a great cistern or canal system at its heart, and water rights are more valuable than gold here. The Farsunians are not natural warriors but they are excellent at the tactics their geography demands — hit-and-run cavalry, ambush on the flat plains, denial of water to besieging armies. They maintain studied neutrality in most conflicts, preferring to sell to both sides. Several families have grown immensely wealthy supplying every war of the last century without fighting in any of them. The Forbidden Lake lies on the Farsun/Valusia border — Farsunians refuse to approach it and will not speak of what happened there. Ancient burial mounds rise from the grasslands, remnants of a pre-human civilization that Farsunians superstitiously avoid. **Adventure hooks:** caravan escort through bandit country, water-rights dispute between cities, ancient burial mound plunder, Forbidden Lake investigation, neutral Farsun suddenly taking a side in a war. |
| `nation_verulia` | **Verulia** | 390, 820 | Southern coastal maritime nation at the southwestern edge of the continent. The Verulians are a sea people above all else — their navy is the largest in the Thurian world, their merchant fleet sails routes no other nation charts. The southern coastline is riddled with natural harbors, hidden coves, and fortified sea-forts that make invasion from the water nearly impossible. Verulia has planted colonies on several southern islands and maintains trading contact with peoples south of the Lost Lands that other kingdoms don't know exist. This gives their court a cosmopolitan quality — Verulian cities host more foreign faces than anywhere except the City of Wonders. The Verulian naval code is among the most sophisticated in the Thurian world: prize rights, letters of marque, salvage law. Piracy is a constant problem along the southern sea lanes; Verulia spends heavily hunting pirates while quietly employing a few who know which flags to avoid. The marriage of Rashver, son of the King of Verulia, to Elise of Thule (from the Governi festival) cemented a northern trade alliance that still holds — Verulian wine and southern goods for Thulian iron and furs. **Adventure hooks:** naval pursuit of pirates, smuggling operation in a sea-fort, secret contact with a civilization south of the Lost Lands, salvage rights dispute, Verulian colony cut off and silent. |
| `nation_thurania` | **Thurania** | 820, 780 | A mid-sized southern interior kingdom sandwiched between the great powers. Not one of the Seven Empires — Thurania has survived by being useful and unthreatening to whoever is strongest at any given moment. The terrain is mixed: wide river plains in the north where the city of Blaal sits, rising to broken hill country in the south where the road into the Lost Lands begins. The Thuranians are famously hospitable to travelers — inns are plentiful, roads are maintained, and a lone wanderer can cross the kingdom in reasonable safety. Their reputation for welcoming strangers is partly genuine warmth and partly strategic: Thurania makes its living as a transit corridor. Their shamanic religious tradition is very old, predating the Seven Empires. Stone circles and megalithic monuments are scattered across the hills — Thuranian hedge-priests perform rites at these sites that the more sophisticated empires find barbaric and disturbing. Strange creatures from the Lost Lands occasionally cross into Thuranian territory from the south, and the southern hill folk have adapted to living with things other peoples only hear about in horror stories. **Adventure hooks:** stone circle ritual gone wrong, creature from the Lost Lands loose in a farming village, Thuranian shaman with forbidden knowledge, buffer-state politics (being squeezed between two empires at war), the road south into the Lost Lands. |
| `nation_thuria` | **Thuria** | 1200, 800 | The largest landmass in the southeast — more of a subcontinent than a single kingdom. The northern coastal strip is the most civilized part, dominated by the River Stagus and the frontier trade city of Stagus where the river meets the sea. The interior is vast grassland and scrub that becomes progressively denser and stranger as it moves south. The southern fringe is true jungle — some of the most dangerous terrain on the map, where Serpent-Man strongholds persist in ancient temple complexes, hidden in vine-choked ruins that predate every human civilization. These are not scattered survivors; these are organized enclaves, the last organized Serpent-Man power centers outside of infiltrated human courts. The River Stagus is the eastern continent's economic artery: Grondarite iron, Zarfhaanan forest goods, and mysterious Thurian exports (rare woods, resins, captive creatures) all flow down it to the coast. Pictish raider colonies exist in the northern Thurian hills, a constant friction with the settled coastal towns. The approach to World's End begins in eastern Thuria — beyond Stagus, the road simply stops, and the land becomes something travelers describe but cannot map. **Adventure hooks:** River Stagus piracy, Serpent-Man jungle temple, Pictish hill raiders, Grondarite trade embargo, following the road to World's End, ruins from a pre-Serpent-Man civilization in the deep jungle. |
| `nation_lemuria` | **Lemuria** | 1820, 400 | Eastern sea-coast nation; partially off the map's right edge. These are a highly advanced dark skinned people similar to real life people of Tamil in Sri Lanka. They have great temples and libraries. They are famed for their poetry. For game content purposes, we can use ancient Tamil poetry and stories to fill in content for the Lemurian culture and adventures there. The men are short in stature, fierce fighters, hard workers, honorable. The women are petite, tough, independent and have small breasts. The people are famously golden-eyed  (a light hazel mixed with gold flecks). |

---

## Cities / Settlements

Named settlements with a map dot. Each is an adventure hub — a place to resupply,
get quests, and find NPCs.

| ID | Name | Nation | Approx. map coords (x, y) | Notes |
|---|---|---|---|---|
| `city_of_wonders` | **City of Wonders** | Valusia | 600, 530 | Kull's capital. Largest city on the map. Marked with a city symbol. |
| `city_vanara` | **Vanara** | Valusia (west) | 490, 380 | Western Valusian city. |
| `city_kamula` | **Kamula** | Valusia (central) | 620, 420 | Central Valusian city. |
| `city_talunia` | **Talunia** | Zarfhaana / Grondar border | 1160, 560 | Eastern trade city. |
| `city_blaal` | **Blaal** | Thurania | 820, 690 | Southern interior city. |
| `city_stagus` | **Stagus** | Thuria / World's End | 1540, 650 | River city on the Stagus. Eastern frontier. |

---

## Named Points of Interest / Landmarks

Specific named locations — dungeons, cursed zones, mystical geography. Prime adventure
module anchors.

| ID | Name | Region | Approx. map coords (x, y) | Adventure potential |
|---|---|---|---|---|
| `poi_skull_of_silence` | **Skull of Silence** | Zalgara Mts. / Kamelia border | 980, 230 | Mountain landmark; dot-marked. Dungeon / cult stronghold candidate. Featured in the stories of King Kull of Atlantis, the Skull of Silence is a legendary castle built of black stone, perched on a solitary hill within the Zalgara Mountains. It acts as a prison for "the Silence" which is an elemental, malevolent entity that somehow entered the material world from the Outer Dark and embodies absolute, destructive quiet. Origin: thousands of years before Kull's reign, the sage Raama--the wisest man of the Thurian Age--imprisoned the Silence there to prevent it from destroying all sound and life in the universe. Significance: the region surrounding the Skull of Silence is feared, with no one daring to live with a hundred miles of it, as the entity within is constantly trying to escape. The story of the same name "The Skull of Silence" (sometimes associated with the story "The Striking of the Gong") is part of the original Kull canon written by Robert E. Howard.|
| `poi_lake_of_visions` | **Lake of Visions** | Central Valusia | 500, 510 | Mystical lake. Scrying, oracle, or Outer Dark portal. |
| `poi_accursed_gardens` | **Accursed Gardens** | Near City of Wonders | 640, 565 | Named danger zone adjacent to capital. Cursed flora, ancient sorcery. The Accursed Gardens is a ruined country estate and pleasure resort located two miles east of the Valusian capital city. Before falling into ruin, this estate belonged to an unnamed nobleman a hundred years before the reign of Kull. At the time, there had been rumors about what occurred there, including lascivious orgies and dark rituals of devil worship. When local children began disappearing with alarming regularity, the nobleman was blamed for this and was killed by an angry mob.

Afterward, certain gruesome discoveries were made on the estate that supported the truth of the rumors. Many of the buildings and walls were demolished by the people, but being made of imperishable marble, others were simply left standing to crumble into decay. The estate was abandoned and became overgrown with wild vegetation. These ruins gained an evil reputation and were said to be haunted.|
| `poi_forbidden_lake` | **Forbidden Lake** | Valusia / Farsun border | 510, 640 | Named forbidden zone. Unknown prohibition — good mystery hook. |
| `poi_tiger_valley` | **Tiger Valley** | On the main island of Atlantis | 320, 245 | Named valley; predator-heavy wilderness. Hunting / survival adventure. |

---

## Geographic Wilderness Areas

Named natural regions — no city, no fixed dungeon, but defined travel zones. These host
random encounters and overland travel hazards.

| ID | Name | Position | Travel hazards |
|---|---|---|---|
| `geo_tathel_isle` | **Tathel Isle** | Far left (small island) | Sea crossing required. Isolation. |
| `geo_kaa_u_picts` | **Kaa-U Picts** | Far left coast | Hostile tribal territory. Kaa-u is an island country mentioned in the Kull story "The Shadow Kingdom." Mercenaries from Kaa-u served in the Valusian army during the reign of Kull.|
| `geo_isles_of_picts` | **Isles of the Picts** | Far left offshore | Pirate / raider territory. Sea encounters. A chain islands far to the west of Thuria and Atlantis. Due to raiding expeditions, they have colonies on Thuria itself. There were Pictish settlements among the mountains south of Valusia, guarding the kingdom against invaders. They are a comparable civilization to Atlantis and have an ancient feud with the Atlanteans.|
| `geo_red_isles` | **Red Isles** | Far left | Named; color implies blood or mineral wealth. |
| `geo_camoonia_desert` | **Camoonia Desert** | Center (Valusia ↔ Zarfhaana) | Dehydration, desert bandits, scorpions, sandstorms. |
| `geo_zalgara_mts` | **Zalgara Mountains** | Center spine | Altitude sickness, mountain passes, avalanche, cave systems. Corresponds to the modern day Balkan Mountains. |
| `geo_zhemri_mts` | **Zhemri Mountains** | Far right | Eastern barrier range. |
| `geo_river_stagus` | **River Stagus** | Right side | River travel option; river pirates, crocodiles. |
| `geo_worlds_end` | **World's End** | Far right | Frontier; unknown beyond. |
| `geo_lost_lands` | **Lost Lands** | Bottom | Unmapped southern reaches. High danger, ancient ruins. In the Lost Lands exist other "equally civilized" but non-human kingdoms - the Eldar (Tolkienian style tall, gray-eyed, elves) and the Dwarves. The races here of one or more older, pre-human races. This country is, at first, untouched by the Cataclysm. When the oppressors of the Lemurians are overthrown, however, the survivors escape to this region and destroy it in turn, creating the new country of Stygia.|
| `geo_jungles` | **Jungles** | Bottom right (Thuria) | Dense jungle; serpent-men strongholds per Howard lore. |

---

## Travel System (design contract)

> **Full spec lives in `~/.claude/plans/i-accidentally-submitted-the-misty-map.md` (S4 — Graphical travel system).**
> This section records the world-map-specific design decisions made 2026-05-03.

### Core mechanic
- The **world map image** (`/art/living-eamon-map.png`) is the travel screen background.
- A **hero marker** moves along a route from origin to destination.
- Travel is **node-to-node**: click a destination → confirm → loading bar → arrival.
- Travel time is proportional to geographic distance (rough pixel distance between nodes).
- Five travel modes: walk / horse / ship / air / Gate (per S4 plan).

### Random encounters en route
Every travel leg rolls for encounters based on the **geographic zones crossed**. Encounter
tables are zone-specific:

| Zone type | Encounter pool |
|---|---|
| Wilderness / plains | Bandits, wolves, wild boar, lone traveler, abandoned campfire, old battle site |
| Mountain | Rock slide, mountain bandits, cave mouth (dungeon hook), eagle attack, hermit |
| Desert | Scorpion swarm, dehydration event, caravan (trade), dust storm, buried ruin |
| Jungle | Serpent-men scouts, giant spider, fever (status), ancient stone idol, hunter's trail |
| Sea / river | Pirates, storm, sea creature, ghost ship, stranded survivors |
| Frontier / Lost Lands | Ancient ruin (full adventure hook), mutant creature, cult patrol, unexplained light |

### Adventure module location tagging
Every module in `lib/adventures/registry.ts` declares:
```typescript
locationId: string;          // from this registry (e.g. "valus")
travelZones: string[];       // geo zones crossed en route from Valus (e.g. ["geo_camoonia_desert", "geo_zalgara_mts"])
travelDays: number;          // approximate overland days (affects encounter roll count)
```

The travel screen reads `travelZones` to build the encounter roll table for that specific
journey. Longer routes through more dangerous zones = more rolls.

---

## Adjacency / Route Notes

Rough overland adjacency for route-planning (direct connections without sea crossing):

```
Valus (hub/capital of Valusia) → all routes originate here
Valusia → Kamelia → Thule (north road)
Valusia → Farsun → Verulia (south road)
Valusia → Camoonia Desert → Zarfhaana (east road, dangerous)
Zarfhaana → Grondar → Thuria (east)
Thuria → Lost Lands (south, extreme danger)
Kamelia → Skull of Silence → Commoria (mountain pass)
Atlantis → (sea crossing required from any land)
Lemuria → (sea crossing required from any land)
```

Sea routes (ship mode only):
```
Any coastal city → Atlantis
Any coastal city → Lemuria
River Stagus → Stagus city (river mode)
Isles of the Picts / Red Isles / Tathel Isle → (sea only)
```
