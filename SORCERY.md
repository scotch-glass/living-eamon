# SORCERY.md — The Two Magics of Living Eamon

> **Status:** Canonical reference for Living Eamon's magic systems.
> **Extracted from `GAME_DESIGN.md` §9 on 2026-04-29** so the magic system has its own scoped doc (parallel to KARMA_SYSTEM.md). The full prior content is preserved verbatim below; future magic-system updates land here.
> **Cross-links:** GAME_DESIGN.md §11 (PICSSI — Illumination/Sorcery interaction), KARMA_SYSTEM.md §2.10 (Illumination as a stock).

---

## 1. Two Systems

Living Eamon has two distinct magic systems, deliberately asymmetric:

- **Official Guild Magic** — public, legal, weak. `CAST` command. No reagents.
- **Occult Magic / Sorcery** — forbidden, secret, powerful, soul-darkening. `INVOKE` command. Reagents required. Eight Circles of escalating power.

The asymmetry is the design: Guild magic is what villagers expect a hero to use. Sorcery is the price of real power, and that price is moral.

---

## 2. Official Guild Magic (CAST command)

Legal, taught in guilds, no reagents required. Roughly half the power of equivalent Circle 1 Occult spells. Safe to use anywhere. Nobody fears them.

Syntax: `CAST BLAST`, `CAST HEAL`, `CAST LIGHT`, `CAST SPEED`

| Spell | Effect |
|-------|--------|
| BLAST | Weak magic projectile — damages one target |
| HEAL | Minor healing — restores a small amount of HP |
| LIGHT | Illuminates dark areas |
| SPEED | Briefly increases movement and initiative |

Additional Guild spells planned for Phase 2.

---

## 3. Occult Magic (INVOKE command)

**In-world name:** Occult, the Art, the Old Ways — never "magic" or "spells" by those who know what it is.

**Legal status:** Forbidden everywhere. The knowledge barely exists — in fragments, adventure loot, whispered hints, never written openly.

**Command syntax:** `INVOKE [Words of Power]`
Example: `INVOKE Mag Ict Arc` attempts Energy Bolt (Circle 6).

The player must know the invocation. This knowledge must be discovered in-game through adventure loot, NPC hints, or secret research — or learned out-of-game by the player themselves. The knowledge barrier is intentional and part of the illegality. There is no in-game HELP text for Occult.

**Without reagents:** The attempt fizzles. A sulfur stench lingers. There is a chance it attracts unwanted attention — a flash, a smell, something noticed.

**With reagents, failed skill check:** Same or worse.

**With reagents and success:** Full Occult effect.

**Fizzle detection risk:** Using Occult magic in a public room risks witnesses. The Order investigates witnesses.

---

## 4. The Order

The only authorized Occult practitioners in the world — authorized exclusively to prosecute, punish, and remove unauthorized Occultists. They are knights and priests of absolute authority. They disappear people: not just practitioners, but witnesses, informants, anyone who has seen or heard too much. Everyone is terrified of The Order.

**Lore — The Cataclysm-That-Comes:** The Order's mission is not punitive but **preventive**. They believe — correctly — that the world is approaching a great Cataclysm: the same sundering that long ago drowned the civilizations before this one, and which (their secret texts warn) is gathering again. Every act of unauthorized Occult magic accelerates it. Every reagent stockpile feeds it. Every Word of Power spoken aloud in the wrong place loosens what holds the world together. The Order disappears practitioners and witnesses because the alternative — the world ending again, within the span of a generation — is untenable. The history of the **previous** Cataclysm is suppressed; only the Order keeps the chronicles. Most people don't even know why Occult magic is illegal — only that the Order comes for those who ask.

**The earlier civilization principle.** The Order's secret chronicles record at least one Cataclysm before this one — the sundering that ended the **age before our age**, whose ruins the player will explore in adventures. **There is always an earlier civilization.** Whatever destroyed them is gathering again now.

**In-game:** The Order is a dormant faction until Occult magic is used in a witnessed location. Phase 2 feature — documented here, not yet coded.

---

## 5. Reagents

Eight classic reagents, consumed on cast. In Living Eamon they cannot be purchased in the Main Hall or any starting area. They are found as adventure loot, grown or traded in other worlds, or purchased from sources who don't ask questions.

Their mundane value is what they would logically be worth as herbs, pearls, or natural materials. To Occultists they are invaluable — but Occultists try not to reveal that.

**The Order uses reagent collection as an investigative indicator.** Buying, selling, growing, or stockpiling these materials in quantity is grounds for investigation.

| Reagent | Abbreviation | Mundane form |
|---------|-------------|-------------|
| Black Pearl | BP | A rare black pearl |
| Blood Moss | BM | A crimson creeping moss |
| Garlic | GA | Common garlic bulb |
| Ginseng | GI | Medicinal root |
| Mandrake Root | MR | A forked root, screams when pulled |
| Nightshade | NS | A poisonous dark-berried plant |
| Spider's Silk | SS | Fine silk from giant spiders |
| Sulfurous Ash | SA | Grey ash with a sulfur smell |

---

## 5b. Words of Power — Vocabulary

The Old Tongue is **compositional**. Every Word of Power is a Latinate root, one or two syllables, and every spell-phrase is built from one to four such roots in the order **[operator] [element]** (with `Mag` "great" stacking in front of any phrase to amplify it). A practitioner who learns the vocabulary can in principle parse a phrase she has never heard — but she still cannot cast it without the reagents and the skill, and the Order knows the same vocabulary, which is why uttered Words in a public room are dangerous.

### Operators (verbs and qualifiers)

| Word | Meaning |
|------|---------|
| Aug | raise, strengthen, increase |
| Min | lower, weaken, decrease |
| Mag | great, vast (intensifies the phrase that follows) |
| Crea | create, summon, call forth |
| Solv | dissolve, dispel, undo |
| Mut | change, transform, redirect |
| Tra | across, through, transfer |
| Ten | bind, hold, lock |
| Lib | release, free, open |
| Dur | harden, fortify, ward |
| Vel | veil, hide, conceal |
| Pluv | rain, swarm (mass / multiple targets) |

### Elements (objects and domains)

| Word | Meaning |
|------|---------|
| Ign | fire |
| Aqu | water |
| Aer | air, wind |
| Terr | earth, stone |
| Luc | light |
| Umbr | shadow |
| Vit | life, vitality |
| Mort | death |
| Mens | mind, intellect |
| Cor | body, flesh |
| Sang | blood |
| Tox | poison |
| Via | way, path, gate |
| Ict | strike, blow |
| Sag | arrow, projectile |
| Vid | sight, vision |
| Pot | strength, might |
| Dex | dexterity, deftness |
| Pan | food, bread |
| Mat | matter, substance |
| Aeg | ward, shield |
| Mur | wall |
| Spec | appearance, form |
| Camp | field, zone |
| Ful | lightning |
| Bes | summoned beast / spirit form |
| Sig | sign, mark |
| Loc | place, locus |
| Fer | iron, blade |
| Arc | arcane essence (maps to the caster's mana) |

A handful of element-roots — *Vox* (word), *Som* (sleep), *Vul* (wound), *Cael* (sky) — are attested in older fragments of the Old Tongue but appear in no spell of the Eight Circles taught today. The Order treats those fragments as Outer-Dark in origin and confiscates copies on sight.

---

## 6. The Eight Circles of Occult Magic

Circles 1–4 are implemented. Circles 5–8 are documented for completeness and will be implemented in later phases.

Mana costs follow UO classic rules. In Living Eamon, mana maps to the player's Illumination virtue.

### Circle 1 — Mana cost 4

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Clumsy | Min Dex | Blood Moss, Nightshade | Decreases target's dexterity |
| Create Food | Crea Pan | Garlic, Ginseng, Mandrake Root | Creates a random food item |
| Feeblemind | Min Mens | Ginseng, Nightshade | Decreases target's intelligence |
| Heal | Aug Vit | Garlic, Ginseng, Spider's Silk | Heals HP; faster but weaker than Greater Heal |
| Magic Arrow | Crea Sag | Sulfurous Ash | Fire damage projectile, 14–18 damage |
| Night Sight | Aug Vid | Sulfurous Ash, Spider's Silk | Grants the caster the ability to see in complete darkness without a light source; lasts until dawn |
| Reactive Armor | Dur Cor | Garlic, Sulfurous Ash, Spider's Silk | Raises physical resistance; lowers elemental resistances |
| Weaken | Min Pot | Garlic, Nightshade | Decreases target's strength |

### Circle 2 — Mana cost 6

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Agility | Aug Dex | Blood Moss, Mandrake Root | Increases dexterity and stamina |
| Cunning | Aug Mens | Nightshade, Mandrake Root | Increases intelligence and mana |
| Cure | Solv Tox | Garlic, Ginseng | Cures poison; higher skill cures stronger poisons |
| Harm | Min Vit | Nightshade, Spider's Silk | Cold damage; strongest at close range, 23–29 at 0–1 tiles |
| Magic Trap | Crea Ten | Garlic, Spider's Silk, Sulfurous Ash | Magically traps a container |
| Remove Trap | Solv Ten | Blood Moss, Sulfurous Ash | Removes magic or low-level mechanical traps |
| Protection | Dur Aeg | Garlic, Ginseng, Sulfurous Ash | Prevents spell interruption; lowers resistances |
| Strength | Aug Pot | Mandrake Root, Nightshade | Increases strength and hit point cap |

### Circle 3 — Mana cost 9

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Bless | Mag Aug | Garlic, Mandrake Root | Combines Agility, Cunning and Strength in one cast |
| Fireball | Mag Ign | Black Pearl | Fire damage, 26–31; quick cast |
| Magic Lock | Ten Via | Blood Moss, Garlic, Sulfurous Ash | Magically locks a chest |
| Poison | Crea Tox | Nightshade | Poisons target; prevents healing; 4 levels of severity |
| Telekinesis | Tra Mat | Blood Moss, Mandrake Root | Manipulates objects at range; opens doors, springs traps |
| Teleport | Mut Via | Blood Moss, Mandrake Root | Teleports caster up to 11 tiles to a visible location |
| Unlock | Lib Via | Blood Moss, Sulfurous Ash | Unlocks magic-locked or low-level treasure chests |
| Wall of Stone | Crea Mur | Blood Moss, Garlic | Creates a stone wall; blocks movement; lasts 10 seconds |

### Circle 4 — Mana cost 11

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Arch Cure | Mag Solv Tox | Garlic, Ginseng, Mandrake Root | Stronger cure; affects all friendlies within 2 tiles |
| Arch Protection | Mag Dur Aeg | Garlic, Ginseng, Mandrake Root, Sulfurous Ash | Casts Protection on all party members within 3 tiles |
| Curse | Mag Min | Garlic, Nightshade, Sulfurous Ash | Combines Clumsy, Feeblemind and Weaken; lowers max resistances |
| Fire Field | Crea Camp Ign | Black Pearl, Spider's Silk, Sulfurous Ash | Creates a fire field; 2 damage/second; lasts ~54 seconds at GM |
| Greater Heal | Mag Aug Vit | Garlic, Ginseng, Mandrake Root, Spider's Silk | Major healing: (Magery × 0.4) + 1–10 HP |
| Lightning | Crea Ful | Mandrake Root, Sulfurous Ash | Instant energy bolt, 30–34 damage |
| Mana Drain | Min Arc | Black Pearl, Mandrake Root, Spider's Silk | Drains target's mana for 4 seconds |
| Recall | Crea Tra Via | Black Pearl, Blood Moss, Mandrake Root | Instant transport to a marked rune location |

### Circle 5 — Mana cost 14 *(documented; not yet implemented)*

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Blade Spirits | Crea Bes Fer | Black Pearl, Mandrake Root, Nightshade | Summons spirits that attack nearby enemies; lasts 120s |
| Dispel Field | Solv Camp | Black Pearl, Garlic, Spider's Silk, Sulfurous Ash | Dispels one tile of a field spell |
| Incognito | Mut Spec | Blood Moss, Mandrake Root, Nightshade, Sulfurous Ash | Temporarily changes name and appearance |
| Magic Reflection | Mut Arc | Garlic, Mandrake Root, Spider's Silk | Reflects spells back at caster; pool-based |
| Mind Blast | Mag Ict Mens | Black Pearl, Mandrake Root, Nightshade, Sulfurous Ash | Cold damage, 40–42; based on Magery and Intelligence |
| Paralyze | Ten Cor | Black Pearl, Nightshade, Spider's Silk | Freezes target; broken by damage |
| Poison Field | Crea Camp Tox | Black Pearl, Nightshade, Spider's Silk | Field of poison; same levels as Poison spell |
| Summon Creature | Crea Bes | Blood Moss, Mandrake Root, Spider's Silk | Summons a low-level creature; lasts up to 480s |

### Circle 6 — Mana cost 20 *(documented; not yet implemented)*

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Dispel | Solv Bes | Garlic, Mandrake Root, Sulfurous Ash | Dispels a summoned creature |
| Energy Bolt | Mag Ict Arc | Black Pearl, Nightshade | Energy damage, 51–56 |
| Explosion | Mag Arc Ign | Blood Moss, Mandrake Root | Fire damage, 51–56; 2-second delay before impact |
| Invisibility | Vel Cor | Blood Moss, Nightshade | Hides caster; lasts (Magery × 1.2) seconds |
| Mark | Crea Sig Loc | Black Pearl, Blood Moss, Mandrake Root | Marks a rune at current location for Recall/Gate |
| Mass Curse | Mag Pluv Min | Garlic, Mandrake Root, Nightshade, Sulfurous Ash | Curses all enemies within 3 tiles |
| Paralyze Field | Crea Camp Ten | Black Pearl, Ginseng, Spider's Silk | Field of paralysis |
| Reveal | Solv Vel | Blood Moss, Sulfurous Ash | Reveals hidden targets |

### Circle 7 — Mana cost 40 *(documented; not yet implemented)*

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Chain Lightning | Crea Pluv Ful | Black Pearl, Blood Moss, Mandrake Root, Sulfurous Ash | Lightning hits multiple targets; 64–69 total energy damage |
| Energy Field | Crea Camp Arc | Black Pearl, Mandrake Root, Spider's Silk, Sulfurous Ash | Wall of energy; blocks movement |
| Flamestrike | Crea Mag Ign | Spider's Silk, Sulfurous Ash | Massive fire burst; 64–69 damage |
| Gate Travel | Mag Mut Via | Black Pearl, Mandrake Root, Sulfurous Ash | Opens a moongate to a marked rune; lasts 30 seconds |
| Mana Vampire | Tra Arc | Black Pearl, Blood Moss, Mandrake Root, Spider's Silk | Drains target's mana and adds it to caster's |
| Mass Dispel | Mag Solv Bes | Black Pearl, Garlic, Mandrake Root, Sulfurous Ash | Dispels multiple summoned creatures |
| Meteor Swarm | Crea Pluv Ign | Blood Moss, Mandrake Root, Spider's Silk, Sulfurous Ash | Fire meteors hit multiple targets; 64–69 total damage |
| Polymorph | Mut Cor | Blood Moss, Mandrake Root, Spider's Silk | Transforms caster into another creature form |

### Circle 8 — Mana cost 50 *(documented; not yet implemented)*

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Earthquake | Mag Ict Terr | Blood Moss, Ginseng, Mandrake Root, Sulfurous Ash | ~33% physical damage to all visible targets in radius |
| Energy Vortex | Crea Bes Arc | Black Pearl, Blood Moss, Mandrake Root, Nightshade | Summons vortex that attacks nearby enemies; 26 dmg/hit |
| Resurrection | Solv Mort | Blood Moss, Garlic, Ginseng | Restores a dead character to life |
| Summon Air Elemental | Crea Bes Aer | Blood Moss, Mandrake Root, Spider's Silk | Summons air elemental; focuses on spellcasting |
| Summon Daemon | Crea Bes Mort | Blood Moss, Mandrake Root, Spider's Silk, Sulfurous Ash | Summons daemon; powerful melee + 7th circle magic; costs karma |
| Summon Earth Elemental | Crea Bes Terr | Blood Moss, Mandrake Root, Spider's Silk | Summons earth elemental; strong melee, no magic |
| Summon Fire Elemental | Crea Bes Ign | Blood Moss, Mandrake Root, Spider's Silk, Sulfurous Ash | Most powerful elemental; melee + magic |
| Summon Water Elemental | Crea Bes Aqu | Blood Moss, Mandrake Root, Spider's Silk | Combines air and earth elemental skills |

---

## 7. Sorcery and the Soul (cross-link to PICSSI Illumination)

Per GAME_DESIGN.md §11 (PICSSI — Illumination):

> Practicing powerful sorcery directly darkens the soul — the more powerful the Circle, the more Illumination is drained per cast in a logarithmic relationship. Circles 1–3 do not move Illumination directly (Circle 2 carries an occasional "this feels dark in subtle ways" warning, Circle 3 a "dark presence is near" line). Circles 4 and above darken the soul on every cast.

**Direction of the relation is one-way.** Powerful sorcery darkens the soul. A darkened soul does **not**, in turn, make subsequent sorcery more powerful. There is no Outer-Dark feedback loop — the Eight Circles are not a power-ladder unlocked by falling, they are a price-ladder paid in soul. Low Illumination has its own consequences (different gods answer prayers, different NPC reactions, different patron whispers at the lowest tiers — narrative only) but it does not boost spell damage, duration, mana efficiency, or any other mechanical magnitude.

### 7.1 Why the relation is one-way (Thoth's Principle of Correspondence)

The rule reflects the cosmological architecture the Order's chronicles record and the Scrolls of Thoth confirm.

**Light and Dark are not factions, parties, or teams of beings.** They are the two poles of the **PICSSI Illumination continuum** (−100 to +100), and every soul — heroes, NPCs, gods, even Outer-Dark patrons — sits somewhere on that single axis at any given moment. The player character moves along it daily, drawn now toward one pole, now toward the other. **No soul is ever absolutely Light or absolutely Dark.** The continuum is the field; the poles are limits, not residences.

Sorcery interacts with this continuum, and the key fact is: **a soul currently sitting near the Light pole that is forced to use Circle 8 sorcery to defend against an Outer-Dark assault** — *Meteor Swarm*, *Earthquake*, the binding-and-banishment of *Summon Daemon* — pays exactly the same Illumination toll as a soul sitting at the Dark pole using the same spell to attack. **The Eight Circles do not check where on the continuum the caster sits when they take their toll.** The defender is moved toward Dark by the act of defending.

The Outer-Dark side of the continuum reads this as proof that Darkness must ultimately prevail. The reasoning: war is inherently destructive; every Circle 8 cast by a high-Illumination soul against the Outer Dark drags the caster toward Dark; the longer the war runs, the more of the continuum slides toward the Dark pole. From inside the Outer Dark's logic, the universe is a slow erosion that ends in dark.

The Light-side response (preserved in *Logos Teleios* and the seventh Scroll of Thoth) is that the Outer Dark misreads its own physics. Darkness is sustained only by what it consumes; it produces nothing. Every act of destruction it forces — including the destruction it forces upon high-Illumination defenders — is a draw against a closed account. **Darkness is unsustainable by its own nature.** Light prevails not by being stronger but by being the only pole that *generates*. The polarity is real, but the poles are **not symmetric**: one feeds itself, the other feeds only by taking, and a system that only takes will eventually run out of things to take.

This is **Thoth's Principle of Correspondence** in its Living Eamon reading: as above, so below — and as the soul, so the spell. A spell that grew in power as the soul fell would imply Darkness as a *generative* force, which it is not. The one-way rule is the cosmological signature of that asymmetry. Mechanically, it forecloses the Outer-Dark feedback loop the design briefly entertained; theologically, it is a load-bearing piece of the metaphysics the Way of Thoth quest line teaches the player by stages.

### 7.2 The Two Fundamental Forces — what the Art actually draws on

Every spell of every Circle is a channeling of one of **two fundamental forces** — opposite in direction, asymmetric in nature, and corresponding to the two poles of the Illumination continuum (§7 + §7.1). Which force a spell draws on determines where, when, and against whom it can be cast. Mechanical rules in the engine — including which Circles require active combat to resolve — are direct consequences of which force a spell taps.

**The numbering is canonical and meaningful.** The creative force is **Force I** (the *primary*, generative force — the **one** that produces). The destructive force is **Force 0** (zero because, on its own, it produces nothing — it only consumes what Force I has made). The asymmetry is encoded in the labels themselves: **0** is what destruction generates; **1** is what creation generates. There is no Force II — there are only these two, and one of them is null on its own ledger.

**Force I — Creative / Inward / Conjunctive.** Heal, Cure, buff, debuff, summon, field, movement, conceal, reveal, transform, and most utility spells channel **the creative inward, connective fundamental force that knits tissues, binds toxins, and creates new things into Being**. This force does not require duress or a target's malice as input. It draws from the caster's own intent, the reagents, and the underlying generative substrate of the world. **It works wherever the caster is**, in combat or out. A caster alone in a quiet room can speak the Words for *Heal*, *Cure*, *Bless*, *Wall of Stone*, or *Teleport* and the Art will resolve — because the force these spells tap on is everywhere, always available to a caster who knows the Words and pays the price.

**Force 0 — Destructive / Outward / Disjunctive.** Damage spells (Magic Arrow, Harm, Fireball, Lightning, Mind Blast, Energy Bolt, Explosion, Chain Lightning, Flamestrike, Meteor Swarm, Earthquake) channel **directed malice seeded from duress and fear**. They tap the **fundamental explosive energy that extinguishes the spark of life itself**. The fuel of the Art in this mode is not merely the caster's mana and reagents — it is also the malice and fear that arise in the presence of a foe. **A foe is part of the recipe.** Without one, the directed-malice ingredient cannot transmute, and the Words have nothing to ignite. This is why damage sorcery cannot resolve outside of active combat: the Art literally cannot complete the transmutation without the duress-and-fear context that an enemy provides. A practitioner who attempts a damage cast in an empty room speaks the Words, feels the Art rise in answer, feels it seek the malice it needs — and feels it unwind, finding no such energy nor foe to take. Reagents and mana are not consumed; the cast did not occur.

**Why this asymmetry matters cosmologically.** The Two Forces are not equal moral teams competing on a level field. They mirror the asymmetric polarity §7.1 names: Force I *generates* (knits, binds, creates into Being); Force 0 *only consumes* (extinguishes, destroys, requires a foe whose duress it transmutes). A practitioner who specializes in Force 0 increasingly depends on the existence of foes in order to act at all — they become **structurally dependent on conflict**. A practitioner who specializes in Force I can act on the world from any place at any time, foe or no foe. The Way of Thoth teaches that this asymmetry, played out across a soul's lifetimes, is the reason the Outer Dark — which lives on Force 0 — is unsustainable, and the reason the Light — which lives on Force I — prevails not by power but by independence from the conditions Darkness requires.

**Mechanical entailment summary:**

| Force | Spell kinds | Combat required? | Cause |
|-------|-------------|------------------|-------|
| **0** — Destructive | damage | **Yes** | needs foe-supplied malice/fear as transmutation input |
| **I** — Creative | heal, cure, buff, debuff, summon, field, movement, conceal, reveal, transform, utility | **No** | draws from generative substrate, available everywhere |

(Note: `debuff` is classed as Force I rather than Force 0 because the lore here is that *quieting*, *softening*, and *binding* a target's faculties — the operations of Clumsy, Feeblemind, Weaken, Curse, Mana Drain, Paralyze — are still **connective** acts on the target's being, not destructive ones. They reshape; they do not extinguish.)

**Per-Circle Illumination cost (canonical magnitudes):**

| Circle | Direct Illumination loss per cast | Narrative warning |
|--------|------------------------------------|--------------------|
| 1 | 0 | none |
| 2 | 0 | occasional: "this feels dark in subtle ways" |
| 3 | 0 | confirmed: "a dark presence is near" |
| 4 | **−2** (Notable) | first real shift; the soul registers it |
| 5 | **−4** | clear darkening; NPCs may sense it |
| 6 | **−8** (Major) | visible to sensitive NPCs and beasts |
| 7 | **−15** | the Outer Dark notices |
| 8 | **−30** (Defining-tier) | a name is whispered; patrons rouse |

---

## 8. CAST vs INVOKE — quick reference

| | CAST (Guild) | INVOKE (Occult) |
|--|--|--|
| Legality | Public, legal | Forbidden, witnessed = Order investigation |
| Reagents | None | Required (8 classes; consumed on cast) |
| Power | ~½ of Circle 1 Occult | Circles 1–8, increasing |
| Soul cost | None | Circles 4+ darken Illumination (logarithmic) |
| Knowledge gate | In-game HELP available | No HELP; Words of Power must be discovered |
| Narrative weight | Hero is competent | Hero is risking everything every time |

---

## 9. Spell-specific design notes (canonical mechanics beyond the table)

The Eight Circles table in §6 lists each spell's reagents, mana, Words, and effect kind. Some spells carry mechanics richer than a row — failure modes, special reagent requirements, exceptions, twisted forms. Those mechanics live here. **Every entry here is canonical:** registry data and dispatcher behavior must match.

### 9.1 Mark + Teleport + Recall + Gate Travel — the rune-based travel system

Living Eamon does **not** have a free-roaming "teleport up to N tiles" spell. All Occult travel (intra-world and inter-planar) flows through **marked runes**. This is design-load-bearing because the future of the game includes physical travel by foot, horse, and ship — those journeys are logistical, slow, and dangerous, and they are the default. The rune-based teleport family is the **shortcut that bypasses physical travel entirely**, including across planes and worlds, which is why it's expensive (Circle 3 / 4 / 6 / 7) and reagent-heavy.

**Mark (C6 — `Crea Sig Loc`).** Programmatically captures the current location: room id, world/plane id, and any other coordinates the engine needs. Stores the capture into a rune item the player carries. The rune is the data structure; the player can hold many.

**Teleport (C3 — `Mut Via`).** Requires a marked rune as a targeting argument. Sets the player's location to the rune's captured coordinates. Instantaneous, zero distance limit, **crosses planes and worlds** as a matter of course. Without a marked rune the spell has no target and fails.

**Recall (C4 — `Crea Tra Via`).** Same destination semantics as Teleport but consumes the rune's charge (or the rune itself, depending on rune type). Functionally Teleport's stronger sibling for one-shot retreats from danger; less flexible because the rune is then gone.

**Gate Travel (C7 — `Mag Mut Via`).** Opens a two-way moongate at the current room and the rune's captured room. Other beings can pass through in either direction while the gate stands. Time-limited (the established 30s window for reference, balance-pass tunable).

**Why all four exist:** Mark is the writer; Teleport / Recall / Gate Travel are three readers with different costs and side-effects (cheap solo, expensive solo-and-burns-rune, very-expensive party). The whole family is a planar/cross-world transit network laid down by the caster's own hand, which is why The Order treats marked-rune practitioners as escape risks worth tracking.

**Future system this composes with:** physical travel (foot / horse / ship). Those journeys will be logistical (rations, weather, encounters, deaths) and the **default mode of moving across the world**. The rune family is a luxury bypass — expensive in mana, reagents, and Illumination at the upper Circles, and dependent on the caster having physically been to a place to mark it.

### 9.2 Bless (C3 — `Mag Aug`)

Three layered effects on the caster (or a chosen ally), all temporary, all stacked under a single "Blessed" status:

1. **Resistance to poison.** Poison status applications are reduced or rejected while Blessed.
2. **Resistance to bleeding.** Bleed status applications are reduced or rejected while Blessed.
3. **Temporary Illumination buff** — adds to PICSSI Illumination for the duration. This is a **temporary stat buff** (a layer that does not write through to the underlying PICSSI ledger; it modifies the effective value during checks).
4. **Temporary Charisma buff** — same temp-buff layering as Illumination.

The "temporary" qualifier is critical: PICSSI Illumination and the CHA attribute normally only move through committed acts (sorcery casts, virtuous deeds, NPC encounters). Bless is a sanctioned exception — sanctioned because it's Force I (creative) and Circle 3 (no Illumination drain on cast). The buff fades on a duration timer; the underlying ledger values are never touched.

**Temple invocation (canonical exception):** when Bless is INVOKEd inside a temple, **reagents are not required** and the duration is **much longer** than a standard cast. The temple's consecrated ground supplies what the reagents would have, and the connection to the divine extends the buff's hold on the caster. This is a location-conditional modification of the spell, not a separate spell — the same `Mag Aug` Words, the same effect kinds, but the temple context relaxes the reagent gate and stretches the timer. The cast still consumes mana.

**Implementation note:** existing combat-engine `ActiveStatusEffect` system handles turn-counted effects but not stat-modifier layers on PICSSI / CHA. The temp-buff layer for those needs to be designed alongside. The temple modification needs **two room tags** the dispatcher reads at cast time:

1. **`consecrated: true`** — marks the room as a temple / shrine / sanctified space. The Bless reagent-relaxation and duration-extension key off this tag.
2. **`deity: <god-id>`** — names the specific god the temple is dedicated to (e.g., Mythras, Crom). Required because (per design) which god's altar you stand on will eventually matter for: prayer responsiveness (PICSSI Spirituality + Illumination interactions), sorcery side-effects, NPC reactions to a hero who casts on a particular god's ground, and quest gating. Bless itself doesn't yet branch on deity, but the tag has to be there from the start so we don't have to retro-tag every temple room when god-specific behavior lands.

**Design pattern flag:** this temple modification may generalize to other Force-I spells (Heal, Greater Heal, Cure, Arch Cure, possibly Resurrection). Treat the temple-relaxation as a pattern that may apply elsewhere in Sorcery, not just to Bless. Confirm per-spell as those mechanics land.

### 9.2.1 Howard pantheon — pending canonical list

The `deity` room-tag (§9.2 above) and the future PRAY-side mechanics depend on a canonical list of in-fiction gods. Howard's PD-safe corpus contains a small pantheon (Mythras and Crom are example anchors); the full list needs to be authored once, in one place, with provenance (which Howard story / which name was used / which is renamed for trademark safety) so that registry data, room tags, NPC dialogue, and quest gating all reference the same identifiers. **Recommended location:** `lore/pantheon/HOWARD_GODS.md` (or a section in `GAME_DESIGN.md §10` Thurian Age Lore — designer's call). Authoring deferred; flagged here so this doc has a pointer when the list lands.

### 9.3 Resurrection (C8 — `Solv Mort`)

Resurrection is **not** an unconditional revival. It has a strict reagent gate: the corpse itself is the central reagent, and not every corpse qualifies.

**The Sun-and-Moon rule.** A mortal corpse can be resurrected if and only if it has not yet been exposed to **both** the sun and the moon since death. A corpse left out long enough to experience both becomes a *failed reagent* — the corpse itself is no longer viable, and the cast fails for reagent-missing reasons (the corpse, not the standard 8 reagents). A corpse that has been **buried or kept underground** is shielded from celestial exposure regardless of how long ago death occurred — it can be resurrected even after it has decayed to a skeleton.

**Mortal-vs-immortal.** Only mortal beings can be resurrected. The corpses of immortals — elves, dragons, daemons, gods — cannot. Their souls departed by other rules; the spell has no purchase on them.

**The undead-likelihood drift.** The longer a mortal corpse has been dead, the more likely the enlivened body comes back **undead** rather than truly alive. The drift is a probabilistic curve: fresh corpses come back alive almost always; long-dead corpses come back as something walking but not living. This is the natural form of the spell, not a misuse.

**Twisted forms (necromancy).** A deliberate corruption of Resurrection — same Words, different intent and reagent set — produces zombies, skeletal servants, and **liches** (undead sorcerers who chose this end). These are not separate spells in the registry but are the dark-side application of Resurrection by practitioners deep on the Outer-Dark side of the Illumination continuum. (Mechanically this may eventually live as a separate INVOKE branch or a low-Illumination-gated variant; design-pending.)

**The Hero exception (load-bearing).** **The hero cannot be resurrected by this spell.** The hero is the *Chosen of the god of Perpetual Life*, and on death his body **goes cold very quickly** — faster than any normal mortal — to the point that even a fresh corpse-state is not a viable reagent. Mechanically, the hero's death routes him through the **church reincarnation path** (instant, automatic, separate system). The Resurrection spell explicitly fails on the hero's corpse with a distinct outcome (the body has no warmth left to call back). This protects both the rebirth system's invariants and the lore.

**Implementation entailments (each is its own infra gap):**

- A **corpse model** — a world-state entity with: time of death, sun-exposure flag, moon-exposure flag, location-context (buried / underground / surface / other), mortal-or-immortal flag.
- A **world tick** — the sun/moon exposure flags update over in-game time when a corpse is on the surface.
- A **burial mechanic** — moves a corpse's location-context to underground/buried so the celestial flags freeze.
- A **mortal-or-immortal classification** on every NPC kind — elves, dragons, daemons, gods are immortal; everyone else is mortal.
- A **hero-death short-circuit** — the church reincarnation path runs before any corpse-creation step for the hero, and the hero's body cools too fast for resurrection to apply even hypothetically.
- An **undead-likelihood roll** at resurrection time, scaling with time-since-death.
- The **necromancy variant** is design-pending; carry the lore but don't wire mechanics yet.

---

*See also:*
- *GAME_DESIGN.md §11 — PICSSI Illumination dimension and how sorcery interacts with the soul*
- *KARMA_SYSTEM.md §2.10 — Illumination as a karma stock*
- *KARMA_SYSTEM.md §4b Q9 — open question on per-circle Illumination cost magnitudes*
