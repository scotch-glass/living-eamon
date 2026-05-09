---
id: loot_tables
title: Loot Tables & Treasure System
role: design-canon
canonical_for: [loot-tables, per-zone-distribution, treasure-system]
visibility: creator
status: active
last_updated: 2026-05-03
cross_refs: [lore/thurian-cartography/WORLD_LOCATIONS.md]
---

# Living Eamon — Loot Tables & Treasure System

> **Feeds:** Travel encounter resolution, dungeon room loot, caravan raids.
> **Cross-ref:** `TRAVEL_MATRIX.md` (encounter triggers), `WORLD_LOCATIONS.md` (zone types).

---

## Loot System Mechanics

### When loot rolls happen
After any combat encounter is resolved (hero wins or survivors flee), one loot roll occurs.
Discovery encounters (ruins, abandoned camps) always trigger a loot roll with no combat required.
Caravan trade opens a vendor screen instead of a loot roll — **unless** the hero raided the caravan, in which case normal loot rules apply to the wagon contents.

### Loot tiers
Every loot roll produces a **tier result** first, then an **item result** within that tier.

| Tier | d100 roll | Description |
|---|---|---|
| **Common** | 01–45 | Coin, basic weapons, food, basic armor, mundane goods |
| **Uncommon** | 46–72 | Better weapons, armor pieces, reagents, trade goods |
| **Rare** | 73–90 | Quality weapons/armor, magic consumables, artifacts |
| **Legendary** | 91–99 | Named weapons, powerful artifacts, unique items |
| **Special** | 100 | Zone-specific legendary — see Legendary Items below |

### Loot tier modifiers by enemy type
Certain enemies shift the base tier roll up or down:

| Enemy type | Tier modifier |
|---|---|
| Footpad / starving wolf | −10 |
| Road bandit (standard) | +0 |
| Elite bandit / deserter captain | +10 |
| Slaver with keys | +10 |
| Caravan (raided) | +15 |
| Serpent-Man scout | +20 |
| Serpent-Man ritual procession | +30 |
| Black Vellum courier | +20 |
| Black Vellum sorcerer | +35 |
| Ruins discovery (no combat) | +25 |
| Pre-Thurian vault (no combat) | +40 |

---

## Universal Loot Table — Common Tier (01–45)

Roll d10 within the Common tier:

| d10 | Loot | Quantity |
|---|---|---|
| 1–3 | Silver coin | 3–18 gp |
| 4–5 | Iron ration / hard bread | 1–3 days food |
| 6 | Crude dagger | 1 |
| 7 | Worn short sword (−1 damage, still usable) | 1 |
| 8 | Leather armor scraps (salvageable) | 1 |
| 9 | Torches | 3–6 |
| 10 | Roll twice on this table | — |

---

## Universal Loot Table — Uncommon Tier (46–72)

Roll d12:

| d12 | Loot | Notes |
|---|---|---|
| 1–2 | Gold coin | 8–32 gp |
| 3 | Short sword (standard quality) | — |
| 4 | Mace or hand axe (standard quality) | — |
| 5 | Leather armor (intact) | — |
| 6 | Chain shirt (damaged, needs repair) | −1 armor until repaired |
| 7 | Healing poultice × 2 | Restores 12 HP each |
| 8 | Sorcery reagent bundle | 2–4 units, random type |
| 9 | Lockpicks (set of 6) | — |
| 10 | Rope (50 ft) + grapple | — |
| 11 | Trade goods (zone-specific — see below) | — |
| 12 | Roll once on Rare tier | — |

---

## Universal Loot Table — Rare Tier (73–90)

Roll d10:

| d10 | Loot | Notes |
|---|---|---|
| 1–2 | Gold + gems | 25–80 gp + 1 gemstone |
| 3 | Long sword (fine quality, balanced) | +1 damage |
| 4 | Chainmail (intact) | — |
| 5 | Plate bracers / greaves (Pre-Thurian make, heavy) | — |
| 6 | Enchanted healing draught | Restores 30 HP |
| 7 | Sorcery reagent (rare, named) | Nightshade / blackmoss / serpent fang |
| 8 | Scroll of a spell (Circle 1–3, random) | Single-use, consumable |
| 9 | Named piece of armor (zone-specific — see below) | — |
| 10 | Roll once on Legendary tier | — |

---

## Universal Loot Table — Legendary Tier (91–99)

Roll d8:

| d8 | Loot | Notes |
|---|---|---|
| 1 | **Rune-carved short sword** | Pre-Thurian make; glows faintly near Serpent-Men. +2 damage, never rusts. |
| 2 | **Amulet of Warding** | Passive: reduces first hit each combat by 5 damage. Rechargeable at a temple. |
| 3 | **Serpent-Man venom sac** (intact) | Rare reagent; required for Circle 5 poison spells; sells for 200+ gp to an alchemist |
| 4 | **Black Vellum cipher document** | Quest item — partial map to a Vellum safe-house; usable by Way-of-Thoth quest |
| 5 | **Bag of holding** (small) | Carry weight effectively doubled for items stored inside |
| 6 | **Enchanted crossbow bolt ×3** | Each deals +15 damage; not reusable |
| 7 | **Circle 4–6 spell scroll** (random) | Single-use cast without Illumination cost |
| 8 | **Roll on the zone Special table** (100 result) | — |

---

## Zone-Specific Loot Additions

These tables **add to or replace** the trade goods / named armor / zone-special entries
in the universal tables above. When a universal table result calls for "trade goods (zone-specific)"
or a "named piece of armor (zone-specific)", roll here.

### CIVILIZATION / VALUSIA ROADS

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | Valusian wine, sealed amphora (3–5 gp each, ×4) |
| 3 | Fine Valusian cloth, bolt (8 gp) |
| 4 | Scribe's writing kit — ink, parchment, quill |
| 5 | Official Valusian road-pass document (forged or real) |
| 6 | Sealed letter with a royal wax stamp |

**Zone rare (named armor):** *Valusian City Guard cuirass* — red-lacquered iron, matched set. Identifies wearer as a Valusian soldier (opens doors in the capital, causes suspicion elsewhere).

**Zone special (roll 100):** *Red Slayer's blade* — a genuine Red Slayer sword lost or taken from a soldier. Unmistakable crimson-etched blade. Causes immediate challenge from any Red Slayer who sees it in a hero's hand.

---

### PLAINS / SCRUB (Farsun, Thurania)

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | Dried meat and hardtack (5 days' rations) |
| 3 | Water skins, full (×4, each worth 2 gp in the desert) |
| 4 | Farsunian copper coins (12–40 gp equivalent) |
| 5 | Tanned hides (wolf / boar) — 3–6 gp each |
| 6 | Buried cache of old coin — d100 + 20 gp, Thuranian mint |

**Zone rare (named armor):** *Thuranian hill-chief's leather cuirass* — boar-hide, reinforced shoulder guards. Well-made. +2 armor vs. slashing.

**Zone special (roll 100):** *Map to a burial mound* — hand-drawn, smeared with ochre. Marks a specific mound in Thurania. The mound contains a pre-human tomb with Rare+ loot (roll Rare table twice, take best result).

---

### FOREST / VALLEY (Zarfhaana, Kamelia foothills)

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | Zarfhaanian hardwood (crafting material, 10 gp/bundle) |
| 3 | Forest herbs — rare reagent bundle (nightshade, wolfsbane) |
| 4 | Furs (wolf, bear, forest cat) — 8–15 gp per pelt |
| 5 | Zarfhaanian spiced spirits — 2 flasks, 5 gp each |
| 6 | Carved wooden idol — unusual, has a small hollow compartment |

**Zone rare (named armor):** *Zarfhaanian ranger's scale vest* — overlapping bone and hardwood scales. Light, quiet. Counts as chainmail equivalent for piercing only.

**Zone special (roll 100):** *The dream-walker's journal* — a Zarfhaanian seer's travel notes, written in cipher. Contains 3 fragments of prophecy directly relevant to the Way-of-Thoth quest. Grants +3 Illumination on first read.

---

### MOUNTAIN (Zalgara, Zhemri, Kamelia heights)

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | Mountain iron ore (raw, heavy — 15 gp if sold to a smith) |
| 3 | Rock eagle feathers ×5 — sorcery reagent for wind spells |
| 4 | Carved stone flask of mountain spirits (strong, medicinal) |
| 5 | Commorian horse tack — saddle, bridle, quality (20 gp) |
| 6 | Mountain map — pass routes through the Zalgara, hand-drawn by a guide |

**Zone rare (named armor):** *Commorian mountain-rider's helm* — full-face iron, with a hinged cheek guard. Covers vulnerable head zone. Well-fitted.

**Zone special (roll 100):** *Zalgara cave cache* — a hermit's hidden supply. Contains: 60 gp, a rare reagent (shadow-moss), and a Circle 3 spell scroll.

---

### DESERT (Camoonia Desert)

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | Spices (rare Zarfhaanian variety) — 20 gp/bundle |
| 3 | Camoonian water merchant's full supply (×8 skins) |
| 4 | Desert scorpion venom (intact vial) — 30 gp to alchemist, poison ingredient |
| 5 | Camel-bone knife, carved with desert glyphs |
| 6 | Sand-buried old coin hoard — 40–120 gp, various mint marks |

**Zone rare (named armor):** *Camoonian sand-cloak* — a treated linen cloak that reduces heat damage from desert travel. Also provides light camouflage in desert terrain.

**Zone special (roll 100):** *Pre-Thurian desert shrine cache* — a stone box buried at the base of a half-buried column. Contains a Pre-Thurian amulet: *Eye of the Burning Sky* — once per day, caster may spend 10 Mana to send a flash of blinding light (stuns one enemy for 1 round).

---

### COLD NORTH (Thule, Commoria)

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | Thulian furs — arctic wolf, snow bear — 15–25 gp each |
| 3 | Thulian iron — superior quality (used in crafting +1 weapons) |
| 4 | Carved bone amulet — Thulian sea-spirit design |
| 5 | Mead cask — 10 portions, double the restorative effect of standard spirits |
| 6 | Ghost rider chain fragment — links of iron, always cold to the touch. Unclear purpose |

**Zone rare (named armor):** *Thulian plate gauntlets* — overlapping iron plates, riveted. Excellent protection for the arm/hand zones.

**Zone special (roll 100):** *Thulian war-axe of the Ghost Rider* — a great axe bound with cold iron and etched with Spirit of Vengeance runes. +3 damage; in the hands of a hero with Illumination below −30 it causes 2 HP self-damage per swing (the curse activates). Extremely valuable to a scholar of the Way.

---

### COASTAL / SEA

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | Lemurian silk — lightweight, strong, exotic (30 gp/bolt) |
| 3 | Pictish raider plunder — mixed goods, mixed origin, 25–60 gp value |
| 4 | Nautical charts — sea routes the caravan masters don't share |
| 5 | Preserved sea serpent oil — reagent; used in Circle 6 water spells |
| 6 | Roc of Lemuria's manifest — a ship's cargo list with something extraordinary on it |

**Zone rare (named armor):** *Lemurian lacquered sea-armor* — light bamboo-and-lacquer breastplate. Exceptional against slashing, weak against blunt. Golden-eyed Lemurian craftsmanship.

**Zone special (roll 100):** *Sealed Lemurian bronze chest* — recovered from the sea bed or a ghost ship. Contains: a Lemurian poem-scroll (lore document, Illumination +2 on read), 80 gp in gold Lemurian discs, and a *Tide-caller's ring* (once per day: walk across water surface for 30 seconds; no sorcery cost).

---

### RIVER (River Stagus)

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | River trader's manifest goods — textiles, oil, grain — 20–50 gp value |
| 3 | Crocodile hide (large, intact) — 18 gp to a leatherworker |
| 4 | Grondarite iron tools (high quality) |
| 5 | Thurian exotic wood — rare variety, used in bow-making |
| 6 | River serpent scales (intact, large) — spell component; 40 gp to alchemist |

**Zone rare (named armor):** *River pirate's brigandine* — metal plates sewn into canvas. Well-used but solid. Mid-tier protection, flexible.

**Zone special (roll 100):** *Drowned city relic* — an object recovered from the submerged village visible in clear water. Roll d4: (1) Pre-Thurian bronze idol, worth 120 gp; (2) Waterlogged spell scroll — Circle 2, text still legible; (3) Serpent-Man ritual knife — ancient, intact; (4) Key to a lock that has not been found yet.

---

### JUNGLE (Thuria, deep jungle)

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | Jungle fruit — rare variety; restores 8 HP and acts as a stimulant for 2 turns |
| 3 | Giant spider silk (spooled) — extremely strong, 25 gp to a ropemaker |
| 4 | Serpent-Man ritual components — disturbing materials, very high value to the right scholar |
| 5 | Rare jungle reagents — vine of forgetting, black lotus sample (see SORCERY.md) |
| 6 | Pict hunter's trophy — a carved bone necklace with a map glyph |

**Zone rare (named armor):** *Serpent-Man scale armor (partial)* — recovered from a dead Serpent-Man. Reptilian scales, shimmering green-black. Strong vs. slashing; counts as full leather armor. Causes unease in any NPC who recognizes what it is.

**Zone special (roll 100):** *Pre-Thurian jungle altar* — partially cleared by the Serpent-Man procession. Contains a sealed stone box. Inside: *The Worm-Ward Amulet* — an amulet that pulses warm when a Serpent-Man is within 30 feet. Passive; always active; no mana cost. Invaluable for the Way-of-Thoth quest.

---

### FRONTIER / WORLD'S END / LOST LANDS

**Trade goods (d6):**

| d6 | Goods |
|---|---|
| 1–2 | Strange metal ingot — not copper, not iron; glows faintly; 50 gp to a curious smith |
| 3 | Black Vellum excavation notes — partial, describes something they were digging up |
| 4 | Eldar artifact — a carved stone sphere, perfectly smooth, weight varies mysteriously |
| 5 | Dwarf-forged tool (Lost Lands) — extraordinary quality; an axe, chisel, or hammer |
| 6 | Pre-Thurian map fragment — depicts coastlines that don't exist today |

**Zone rare (named armor):** *Eldar warden's breastplate* — gray metal, unknown alloy, ancient. Lighter than iron, harder than steel. Counts as plate for protection. Cannot be repaired by any human smith — damage stays.

**Zone special (roll 100):** Roll on the Legendary Ruins table below.

---

## Ruins Loot (Discovery encounters — no combat required)

When the hero enters **any abandoned ruin, camp, or vault**, use this table instead of
the universal loot table. Ruins always roll twice and take both results.

### Ruins — Common (01–35, d8)

| d8 | Loot |
|---|---|
| 1–2 | Scattered old coin — 10–40 gp (various mint marks, some unfamiliar) |
| 3 | Broken pottery — one piece has a maker's mark, possibly sigificant |
| 4 | Rusted tools — mostly junk, one is still usable |
| 5 | Charcoal drawings on the wall — someone was here recently |
| 6 | Bones of a previous explorer — with all their equipment (roll Uncommon on the universal table) |
| 7 | Cache of torches, dried out but usable |
| 8 | Old wine sealed in clay — still drinkable; 8 HP restored |

### Ruins — Uncommon (36–65, d8)

| d8 | Loot |
|---|---|
| 1–2 | Bronze weapons (pre-iron era) — still sharp, good condition, 10 gp each |
| 3 | Stone tablet — inscribed, language unknown. +1 Illumination on close study |
| 4 | Intact amphora of oil — valuable, burns well |
| 5 | Old spell components — rare reagents (3–5 types, 1–2 units each) |
| 6 | Leather-bound codex (damaged) — lore document, readable with effort |
| 7 | Bronze shield — embossed with a civilization that no longer exists |
| 8 | Hidden floor cache — 50–90 gp and one Uncommon item |

### Ruins — Rare (66–88, d8)

| d8 | Loot |
|---|---|
| 1–2 | Pre-Thurian bronze sword (intact, balanced) — counts as a quality long sword, cannot rust |
| 3 | Stone idol with a gemstone eye — 100+ gp or a powerful ritual focus |
| 4 | Intact Stobaean tablet — a fragment not yet in the Way codex (+4 Illumination) |
| 5 | Pre-Thurian armor piece (one zone) — harder than iron, unknown metal |
| 6 | Vellum manuscript — a spell described in a dead language; a scholar could translate it |
| 7 | Circle 4–5 spell scroll, ancient — faded but legible |
| 8 | Serpent-Man altar relic — a carved jade idol, cold to the touch, immensely valuable and cursed |

### Ruins — Legendary (89–99, d6)

| d6 | Loot |
|---|---|
| 1 | **Worm-Ward Amulet** — see Jungle zone special above |
| 2 | **Pre-Thurian staff of the Adept** — a sorcerer's walking staff, Circle 1–4 spells cast through it cost 1 less Mana |
| 3 | **Serpent-Man ceremonial blade** — poisons on a critical hit (automatic bleed/poison stack) |
| 4 | **The Pale Circlet** — an ancient crown of bone and silver. Raises Illumination cap by +5 permanently (legacy-scope). Gives the wearer terrible dreams. |
| 5 | **An ancient war-horn of the Elder Age** — sounds it draws all Serpent-Men in the area toward the sound; but also draws all Way-aligned NPCs as allies. One-use per adventure. |
| 6 | **Roll on the Legendary Rune-Blade table below** |

---

## Legendary Rune-Blades (roll 100 / Ruins roll 6 / Vault-only)

Rune-blades are the rarest class of weapon in Living Eamon. They are weapons of the Elder
Age — forged before the Seven Empires existed, before the Serpent-Men were driven into hiding,
when the war between humanity and the ancient races was fought openly. Every rune-blade has
a name in a dead language and a will of its own. None can be sold. None can be discarded
willingly (the hero can *lose* one — through death or story event — but not sell it for coin).

A rune-blade will not be found twice in the same playthrough.

### Rune-Blade — Base stats (all share these)
- **Damage:** Greatsword class (two-handed) — highest base damage tier in the game
- **Critical hit:** 3× the base critical chance (if base crit = 5%, rune-blade = 15%; expressed in combat engine as `critChance × 3`)
- **Dexterity:** +5 DEX while equipped (applies to evasion, initiative, and all DEX-derived checks)
- **Condition:** Never rusts, never chips, edge never dulls
- **Serpent-tell:** Blade etches glow cold blue within 20 feet of a Serpent-Man in disguise (no mana cost; always active — same effect as the Worm-Ward Amulet but built into the blade)
- **Illumination (universal):** +1 Illumination per Serpent-Man killed while wielding the blade, up to a lifetime cap of +10 from this source. Cap is per-blade, tracked on `WorldState`. Does not reset on death.
- **Encumbrance:** Heavy — counts as two carry slots
- **On death:** The blade vanishes from the hero's corpse and returns to its original vault. The vault's rune-blade flag resets on `WorldState` — the blade can be found and claimed again in a future life.

### Rune-Blade Table (d6 — each is unique, only one can exist per world)

| d6 | Name | Origin | Additional power | Illumination effect |
|---|---|---|---|---|
| 1 | **Veth-Karan** ("Worm's Bane" in the Elder tongue) | Atlantean war-forge, pre-Cataclysm | +5 damage vs. Serpent-Men and undead specifically | Universal only |
| 2 | **Skeld-Araan** ("Skull Cleaver") | Thulian ancestor-blade, forged for the war against the ice-things | On a critical hit, target is also stunned — skips their next action | Universal only |
| 3 | **Vo-Urath** ("The Opened Way") | Valusian pre-history, Silent Ones' order | On any hit against a Serpent-Man: instantly strips all active magical protections (illusions, shields, reactive armor, spell buffs) and prevents them from casting for the remainder of that round | Universal only |
| 4 | **Khal-Sethet** ("The Drinker") | Zarfhaanian valley-forge, enchanted by a seer | Each kill restores 5 HP to the wielder | Universal applies for Serpent-Man kills; additionally −1 Illumination per 5 non-Serpent-Man kills (the blade hungers regardless of prey) |
| 5 | **Maerath-Vund** ("Wall of the World") | Grondarite stone-cult, made for a legendary siege | Grants +10 max HP permanently while equipped | Universal only |
| 6 | **Ur-Thann** ("First Wrath") | Pre-Thurian origin; oldest of the rune-blades; no human forged it | Strikes ignore armor entirely on any Serpent-Man, ancient, or elder creature | Universal only |

### Rune-Blade spawn locations
Rune-blades do not appear in bandit camps or on road encounters. They are **ruins-only**
and spawn only in specific vault types:

| Blade | Where it can be found |
|---|---|
| Veth-Karan | Atlantis ruins (Tiger Valley, island interior) |
| Skeld-Araan | Thule — frozen vault beneath a longhouse |
| Vo-Urath | City of Wonders — deep beneath the oldest district |
| Khal-Sethet | Zarfhaana — a sealed cave above a dream-valley |
| Maerath-Vund | Grondar — center vault of the oldest fortress |
| Ur-Thann | Pre-Thurian jungle vault (Thuria deep jungle) — always guarded by a Serpent-Man Adept |

### Rune-Blade discovery narrative
When a hero finds a rune-blade, it is never lying in a chest. Each blade has a discovery
moment (authored once per blade, static text):

- **Veth-Karan:** Embedded upright in stone, the stone grown around it over millennia. The stone cracks when the hero's hand closes on the hilt.
- **Skeld-Araan:** In the grip of a frozen giant, perfectly preserved in a Thulian glacier vault. The giant's eyes are open. As the hero takes the blade, the giant exhales once and is still.
- **Vo-Urath:** Behind a sealed door in the oldest layer of the City of Wonders — a door that has resisted every key for three thousand years. The blade is on an altar. The altar inscription reads, in old Valusian: *"For the one who opens what cannot be opened."*
- **Khal-Sethet:** Submerged at the bottom of a crystal-clear pool in a cave. Fish swim around it. It has been there so long the stone beneath it has taken its shape.
- **Maerath-Vund:** Planted in the foundation stone of the oldest Grondarite fortress, load-bearing in a way no engineer can explain. Removing it should collapse the wall. It does not.
- **Ur-Thann:** On the chest of a Serpent-Man Adept who has been sleeping for three thousand years. Taking it wakes him.

---

## Caravan-Specific Loot (Raided)

When the hero raids a caravan rather than trading, roll on this table for wagon contents.
The caravan flavor varies by zone — the type of goods reflects what that region trades in.

| Zone | Caravan type | Typical goods (raid loot, d6) |
|---|---|---|
| Valusia / civilization | Merchant caravan | 1–2: Valusian wine ×6 (30 gp total); 3: Fine cloth (20 gp); 4: Official documents (quest use); 5: Coin strongbox (40–80 gp); 6: Sorcery reagents (30 gp value) |
| Farsun / plains | Water merchant | 1–2: Water skins ×12 (24 gp in desert); 3: Dried food (10 days); 4: Coin (20–40 gp); 5: Tanned hides (25 gp); 6: Buried coin hidden under floorboards (50 gp) |
| Zarfhaana / forest | Reagent trader | 1–2: Rare herbs ×8 (40 gp value); 3: Spiced spirits (20 gp); 4: Carved wood goods (15 gp); 5: Alchemical components (30 gp); 6: Encrypted ledger (quest hook — someone is buying unusual quantities of something) |
| Mountain / Commoria | Arms merchant | 1–2: Iron weapons (short swords ×4, 40 gp); 3: Commorian armor pieces (50 gp); 4: Crossbows ×2 + bolts (35 gp); 5: Horse tack (25 gp); 6: A crated war-horse, poorly secured (valuable if released or sold) |
| Desert | Spice caravan | 1–2: Spices (50 gp); 3: Desert scorpion venom ×3 (90 gp); 4: Water + food (survival value); 5: Coin (30–60 gp); 6: A sealed clay chest — locked; contains pre-Thurian artifact |
| Thule / cold north | Fur trader | 1–2: Arctic furs (60 gp); 3: Thulian iron weapons (45 gp); 4: Mead ×6 casks (30 gp); 5: Coin (25–50 gp); 6: A crated artifact with Thulian runes — origin unknown |
| River / Thuria | Goods barge (captured) | 1–2: Mixed trade goods (30–60 gp); 3: River serpent oil (25 gp); 4: Thurian hardwood (20 gp); 5: Coin strongbox (50–90 gp); 6: A locked iron chest addressed to a Black Vellum name |
| Sea (pirate/ship) | Sea merchant | 1–2: Lemurian silk (80 gp); 3: Nautical charts (unique value); 4: Coin (60–120 gp); 5: Rare sea reagents (40 gp); 6: Sealed Lemurian bronze chest (see Coastal zone special) |

---

## PICSSI Effects on Loot Actions

Certain loot actions carry karma consequences:

| Action | PICSSI effect |
|---|---|
| Raid a caravan unprovoked | −5 Integrity, −3 Standing |
| Help a caravan being attacked | +4 Integrity, +3 Standing |
| Join raiders attacking a caravan | −8 Integrity, −5 Standing, +2 Passion |
| Bury / burn the body of a fallen enemy | +2 Spirituality |
| Take a rune-blade that costs Illumination (Vo-Urath, Ur-Thann) | As specified per blade |
| Leave discovered loot untouched at a sacred site | +3 Spirituality |
| Loot a sacred site (temple, altar, Way shrine) | −4 Integrity, −3 Spirituality |
| Sell a rune-blade | **Cannot be done** — rune-blades have no sell price |

---

## Implementation Notes (for S4 / item system)

- Loot tables live in `lib/world/lootTables.ts` as typed `LootTable` records keyed by `zoneType + encounterType`.
- Each `LootEntry` shape: `{ id, name, type, quantity, goldValue, karmaEffect?: KarmaDelta, isLegendary, isQuest }`.
- Rune-blades live in `lib/items/runeBlade.ts` — each blade is a singleton; a flag in `WorldState` tracks which blades have been found (per-player world).
- The loot roll sequence: `rollTier(modifiers) → rollItemInTier(tier, zoneType, encounterType) → applyToInventory`.
- Rune-blade discovery text is static, returned as `staticResponse` (same as scroll bodies — never through Jane, no content filter risk).
