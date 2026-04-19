# Living Eamon — Game Design

---

## ⚠️ READ BEFORE DESIGNING ANYTHING — PUBLIC-DOMAIN SAFETY

Before using any name, creature, artifact, nation, magic school, or quoted
prose in this document or in code, you **must** verify it against the
public-domain rules. Most Conan-related material is **not** yet public
domain — using it will expose Thot Technologies to a takedown or suit.

**Required reading, in order:**

1. [**Public_Domain_Rules.md**](./Public_Domain_Rules.md) — **the
   authoritative legal doc.** Full legal framework, trademark
   restrictions, Always-Safe Corpus, future PD calendar, Phase 1 /
   Phase 2 timeline. (As of April 19, 2026, this file consolidated
   the former `lore/hyborian-pd/PD_RESEARCH.md` and that file was
   deleted.)
2. The Safe Harbor / Radioactive tables below in this document —
   **name-by-name authoritative lookup.** Supersedes any other doc on
   individual term status.
3. [**lore/hyborian-pd/MODULE_PLAN.md**](./lore/hyborian-pd/MODULE_PLAN.md) —
   methodology for converting PD stories into adventure modules.

**Current PD corpus (verified April 2026):**

- **"The Hyborian Age"** essay, *The Phantagraph* 1936 — fully PD. No
  US copyright registration or renewal found. Project Gutenberg hosts
  the full text. The entire Hyborian-Age geography, migrations,
  cataclysms, named kingdoms, and peoples are freely usable.
- **"Always Comes Evening"** poem, *The Phantagraph* Aug 1936 — fully PD.
- **"Song at Midnight"** / **"Man, the Master"** poem, *The Phantagraph*
  Aug 1940 — fully PD (posthumous).
- **"The Shadow Kingdom"** *Weird Tales* Aug 1929 — fully PD.
- **"The Mirrors of Tuzun Thune"** *Weird Tales* Sept 1929 — fully PD.
- **"Kings of the Night"** *Weird Tales* Nov 1930 — fully PD.

**Trademark-radioactive terms (apply forever, regardless of any PD
claim):** "Conan," "Conan the Barbarian," "Cimmerian," "Cimmerians,"
"Cimmeria," "Hyboria," "Hyborian Age," "Hyborian" as a marketing
adjective. These are CPI-held trademarks or project-designated
brand-marker avoids; they do not appear in player-facing pages,
marketing, titles, meta tags, or alt text regardless of copyright
status of the underlying essay.

**Still copyright-protected until 2028–2032:** All Conan short-story
content (Conan himself, Tarantia, Thoth-Amon, Bêlit, Valeria,
Yag-Kosha) and *The Hour of the Dragon* content (Acheron, Xaltotun,
Heart of Ahriman, Python). See the Radioactive table below.

When in doubt, **ask before using.**

---

## Safe Harbor & Radioactive Terms — Authoritative Reference

This is the canonical lookup table for every name, place, people, deity,
artifact, or concept the project uses. It supersedes anything in
`lore/**`, `CLAUDE_CONTEXT.md`, or memory if there is a conflict.

Before using any proper noun in code, prose, player-facing copy, or
design docs, check it against these tables. If it's not listed, treat
it as **UNCERTAIN** and ask before using.

### 🟢 SAFE HARBOR — Terms We Can Use

Sources cited below:
- **Essay** = *The Hyborian Age* essay, *The Phantagraph* 1936 (PD).
- **Shadow Kingdom** = Kull story, *Weird Tales* Aug 1929 (PD).
- **Mirrors** = *The Mirrors of Tuzun Thune*, *Weird Tales* Sept 1929 (PD).
- **Kings** = *Kings of the Night*, *Weird Tales* Nov 1930 (PD).

**Usage rule for all Safe Harbor terms:** free to use in player-facing
narrative prose, room descriptions, item descriptions, NPC dialogue,
and internal code. **Never use in marketing titles or slogans** if
flagged with ⚠ — those are trademark-adjacent in the popular mind.

#### Ages & Eras
| Term | Source | Notes |
|---|---|---|
| The Hyborian Age (setting concept) | Essay | ⚠ Internal + in-game prose OK. **Never in marketing / splash / register / login / board / nav / meta tags** (CPI trademark concern). In marketing use "Thurian Age" or "sword & sorcery." |
| Thurian Age | Essay + Shadow Kingdom | Pre-Cataclysmic era. **Preferred marketing label.** |
| The Cataclysm | Essay | Great catastrophe ending the Thurian Age. |
| Age after the Cataclysm | Essay | Substitute for "Hyborian Age" in marketing copy. |

#### Nations & Kingdoms — Hyborian Era (post-Cataclysm, from Essay)
| Term | Source | Notes |
|---|---|---|
| Aquilonia | Essay | Central western kingdom. Ostavar (our invented city) is visually styled after it. Usable in narrative. |
| Argos | Essay | |
| Asgard | Essay | Northern Aesir homeland. |
| Border Kingdom | Essay | |
| Brythunia | Essay | |
| Corinthia | Essay | |
| Gunderland | Essay | Sub-region of Aquilonia. |
| Hyperborea | Essay | |
| Hyrkania | Essay | |
| Iranistan | Essay | |
| Khauran | Essay | |
| Khitai | Essay | |
| Koth | Essay | |
| Kush | Essay | |
| Nemedia | Essay | |
| Ophir | Essay | |
| Pictish Wilderness | Essay + Kings | Picts appear in *Kings of the Night* as well. |
| Poitain | Essay | |
| Shem (incl. Pelishtia sub-region) | Essay | |
| Stygia | Essay | Essay reference is safe. Don't import plot elements from copyrighted Conan stories. |
| Turan | Essay | |
| Vanaheim | Essay | Northern Vanir homeland. |
| Vendhya | Essay | |
| Zamora | Essay | |
| Zingara | Essay | |

#### Nations & Kingdoms — Thurian Age (pre-Cataclysm)
| Term | Source | Notes |
|---|---|---|
| Atlantis | Essay + Shadow Kingdom | Kull's barbarian homeland. |
| Valusia | Shadow Kingdom | Serpent-haunted empire where Kull reigns. |
| Commoria | Essay | Lost pre-Cataclysmic kingdom. |
| Grondar | Essay | Lost pre-Cataclysmic kingdom. |
| Kamelia | Essay | Lost pre-Cataclysmic kingdom. |
| Thule | Essay | Lost pre-Cataclysmic kingdom. |
| Verulia | Essay | Lost pre-Cataclysmic kingdom. |

#### Peoples, Tribes, Races
| Term | Source | Notes |
|---|---|---|
| Aesir | Essay | People of Asgard. |
| Vanir | Essay | People of Vanaheim. |
| Picts | Essay + Kings | |
| Hyborians (as a descent group) | Essay | Central post-Cataclysm civilizations. |
| Shemites | Essay | |
| Stygians | Essay | |
| Hyrkanians | Essay | |
| Khitans | Essay | |
| Kushites | Essay | |
| Zamorans | Essay | |
| Lemurians | Essay | Ancient race. |
| Atlanteans | Essay + Shadow Kingdom | Kull's people. |
| Valusians | Shadow Kingdom | Decadent human empire. |
| Serpent-Men | Shadow Kingdom | Shapeshifting race that ruled before humans. Core antagonist archetype. Full combat profile permissible. |

#### Named Characters
| Term | Source | Notes |
|---|---|---|
| Kull of Atlantis / Kull the Conqueror | Shadow Kingdom | Barbarian king of Valusia. Fully usable. |
| Tuzun Thune | Mirrors | Ancient wizard. Preferred template for our ancient-sorcerer archetype. |
| Bran Mak Morn | Kings | King of the Picts. May appear in person in modules. |

#### Magic & Sorcery Concepts
| Term | Source | Notes |
|---|---|---|
| Thurian sorcery / pre-Cataclysmic magic | Mirrors + Shadow Kingdom | Ancient, calmer, more philosophical than later necromancy. |
| Mirror portals / alternate-reality visions | Mirrors | Mirrors show visions of alternate realities. Core mechanic for legacy-artifact use. |
| Serpent-men shapeshifting / infiltration | Shadow Kingdom | Core antagonist mechanic. |
| Time-bridging ritual summoning | Kings | Bran Mak Morn summons Kull across ages. |
| "Ka nama kaa lajerama" | Shadow Kingdom | Canonical exposure phrase for identifying Serpent-Men imposters. Usable verbatim. |

#### Locations & Ruins
| Term | Source | Notes |
|---|---|---|
| Valusian stonework / Valusian ruins | Shadow Kingdom | Pre-human architecture. Usable as location description. |
| Ruined towers of Valusia (post-Cataclysm dungeon) | MODULE_PLAN (derivative) | Our framing of Valusia as a ruin in the player's era. |
| Mirror chamber of Tuzun Thune | Mirrors | Setting containing the mirrors. |

#### Artifacts & Items
| Term | Source | Notes |
|---|---|---|
| The mirrors of Tuzun Thune | Mirrors | Central legacy artifact. |
| Serpent-Men poisoned fangs | Shadow Kingdom | Looted as artifact after combat. |

#### Atmospheric / Quotable Material
| Term | Source | Notes |
|---|---|---|
| Howard quotations up to ~200 words per module | Any of the 6 always-safe works | Always cite source. Use in room descriptions, item inscriptions, Chronicle entries. |
| "Always Comes Evening" lines | *The Phantagraph* Aug 1936 poem | Quotable atmospheric verse. |
| "Song at Midnight" / "Man, the Master" lines | *The Phantagraph* Aug 1940 poem | Quotable atmospheric verse. |

#### Living Eamon Original Terms (our IP)
| Term | Source | Notes |
|---|---|---|
| Aurelion | Public_Domain_Rules.md | Invented frame city for Phase 1 content. |
| Ostavar | MODULE_PLAN + CLAUDE_CONTEXT | **Invented** city. Visually styled after Aquilonia but the name and all specifics are ours. |
| Jane | Living Eamon original | The ancient intelligence / narrator. Our IP. |
| The Eamon Chronicle | Living Eamon original | Persistent deed-log system. Our IP. |
| The Order | Living Eamon original | Inquisition faction that prosecutes Occultists. Our IP. |
| The Church of Perpetual Life | Living Eamon original | Respawn location. Our IP. |

---

### 🔴 RADIOACTIVE — Never Use

Two categories live here:

1. **Trademark-protected terms** — permanent. Forbidden in player-facing
   pages, marketing, titles, meta tags, alt text, and branding
   regardless of underlying copyright status. Held by Conan Properties
   International (CPI) or designated project-radioactive by Scotch.
2. **Copyright-protected terms from Conan stories (not yet PD)** —
   these enter US public domain between 2028 and 2032, per story
   publication date + 95 years. Do not use until their year passes.

#### Trademark-radioactive (permanent; never use in player-facing content)
| Term | Why | PD date |
|---|---|---|
| **Conan** | CPI trademark. Forbidden in titles, character names, branding, marketing. | Permanent TM (story PD 2028, TM forever) |
| **Conan the Barbarian** | CPI trademark. | Permanent TM |
| **Hyboria** | CPI trademark. | Permanent TM |
| **Hyborian Age** | CPI trademark. Internal design docs + in-game prose may reference the concept; **never in marketing / splash / register / login / board / updates / legal / nav / meta tags.** Use "Thurian Age" or "age after the Cataclysm" in marketing. | Permanent TM |
| **Hyborian** (as marketing adjective) | TM-adjacent. Never in splash, login, register, board, updates, legal, nav, or meta tags. | Permanent avoid |
| **Cimmerian** | Iconic Conan-brand marker. Project-designated radioactive. Use a synonym ("highland barbarian," "mountain folk"). | Permanent avoid |
| **Cimmerians** | Same as above. | Permanent avoid |
| **Cimmeria** (place) | Technically PD-copyright via essay, but project-designated radioactive for brand reasons. | Permanent avoid |
| "Conan universe" (colloquial) | TM via usage. | Permanent avoid |

#### Copyright-radioactive — Conan-story content (enters PD 2028–2032)
| Term | Source | Earliest PD date |
|---|---|---|
| Conan (character) | Any Conan story | 2028 |
| Thoth-Amon | Copyrighted Conan stories | 2028+ |
| Bêlit | *Queen of the Black Coast* (1934) | 2030 |
| Valeria | *Red Nails* (1936) | 2032 |
| Yag-Kosha | *The Tower of the Elephant* (1933) | 2029 |
| Tarantia (Aquilonia's capital) | Copyrighted Conan stories | 2028+ |
| Acheron (as named empire) | *The Hour of the Dragon* (1935–1936). Use **"Thurian"** as substitute. | 2031 |
| Xaltotun | *The Hour of the Dragon*. Use **Tuzun Thune** as template. | 2031 |
| Heart of Ahriman | *The Hour of the Dragon*. Use **mirror chamber** (from *Mirrors*). | 2031 |
| Python (Acheronian capital) | *The Hour of the Dragon* | 2031 |
| *The Hour of the Dragon* (novel title) | 1935–1936 serial | 2031 |
| Any Conan short-story title (*"The Tower of the Elephant," "Queen of the Black Coast," "Red Nails," "Beyond the Black River," "Black Colossus,"* etc.) | Copyrighted. See `Public_Domain_Rules.md` §8 calendar. | 2028–2032 (varies per story) |

---

### 🟡 UNCERTAIN — Ask Scotch Before Using

These require Scotch's explicit approval before they appear in code or
copy.

| Term | Issue |
|---|---|
| Stygia as used beyond essay-level reference | Essay reference is safe. Plot elements drawn from copyrighted Conan stories are not. Spot-check any Stygia-focused module prose. |
| Connecting the three PD Thurian stories into a grand canon | The three PD stories (*Shadow Kingdom*, *Mirrors*, *Kings*) do not explicitly cross-reference each other in Howard's text. Building a unified canon that links them thematically risks creating derivative work beyond what's in the PD originals. Have Scotch review. |
| Any Howard term not listed above | Treat as uncertain by default. |

---

## 9. Magic — Two Systems

### Official Guild Magic (CAST command)

Legal, taught in guilds, no reagents required. Roughly half
the power of equivalent Circle 1 Occult spells. Safe to use
anywhere. Nobody fears them.

Syntax: `CAST BLAST`, `CAST HEAL`, `CAST LIGHT`, `CAST SPEED`

| Spell | Effect |
|-------|--------|
| BLAST | Weak magic projectile — damages one target |
| HEAL | Minor healing — restores a small amount of HP |
| LIGHT | Illuminates dark areas |
| SPEED | Briefly increases movement and initiative |

Additional Guild spells planned for Phase 2.

---

### Occult Magic (INVOKE command)

**In-world name:** Occult, the Art, the Old Ways — never
"magic" or "spells" by those who know what it is.

**Legal status:** Forbidden everywhere. The knowledge barely
exists — in fragments, adventure loot, whispered hints,
never written openly.

**Command syntax:** `INVOKE [Words of Power]`
Example: `INVOKE Corp Por` attempts Energy Bolt (Circle 6).

The player must know the invocation. This knowledge must be
discovered in-game through adventure loot, NPC hints, or
secret research — or learned out-of-game by the player
themselves. The knowledge barrier is intentional and part
of the illegality. There is no in-game HELP text for Occult.

**Without reagents:** The attempt fizzles. A sulfur stench
lingers. There is a chance it attracts unwanted attention —
a flash, a smell, something noticed.

**With reagents, failed skill check:** Same or worse.

**With reagents and success:** Full Occult effect.

**Fizzle detection risk:** Using Occult magic in a public
room risks witnesses. The Order investigates witnesses.

---

### The Order

The only authorized Occult practitioners in the world —
authorized exclusively to prosecute, punish, and remove
unauthorized Occultists. They are knights and priests of
absolute authority. They disappear people: not just
practitioners, but witnesses, informants, anyone who has
seen or heard too much. Everyone is terrified of The Order.

**Lore:** Thousands of years ago, great wars fought with
Occult magic destroyed entire worlds. Since then, The Order
has stamped it out wherever found. The history is suppressed.
Most people don't even know why it's illegal — only that
The Order comes for those who ask.

**In-game:** The Order is a dormant faction until Occult
magic is used in a witnessed location. Phase 2 feature —
documented here, not yet coded.

---

### Reagents

Eight classic reagents, consumed on cast. In Living Eamon
they cannot be purchased in the Main Hall or any starting
area. They are found as adventure loot, grown or traded
in other worlds, or purchased from sources who don't ask
questions.

Their mundane value is what they would logically be worth
as herbs, pearls, or natural materials. To Occultists they
are invaluable — but Occultists try not to reveal that.

**The Order uses reagent collection as an investigative
indicator.** Buying, selling, growing, or stockpiling these
materials in quantity is grounds for investigation.

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

### The Eight Circles of Occult Magic

Circles 1–4 are implemented. Circles 5–8 are documented
for completeness and will be implemented in later phases.

Mana costs follow UO classic rules. In Living Eamon, mana
maps to the player's Expertise stat (renamed for lore;
functions identically).

---

#### Circle 1 — Mana cost 4

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Clumsy | Uus Jux | Blood Moss, Nightshade | Decreases target's dexterity |
| Create Food | In Mani Ylem | Garlic, Ginseng, Mandrake Root | Creates a random food item |
| Feeblemind | Rel Wis | Ginseng, Nightshade | Decreases target's intelligence |
| Heal | In Mani | Garlic, Ginseng, Spider's Silk | Heals HP; faster but weaker than Greater Heal |
| Magic Arrow | In Por Ylem | Sulfurous Ash | Fire damage projectile, 14–18 damage |
| Night Sight | In Lor | Sulfurous Ash, Spider's Silk | Grants the caster the ability to see in complete darkness without a light source; lasts until dawn |
| Reactive Armor | Flam Sanct | Garlic, Sulfurous Ash, Spider's Silk | Raises physical resistance; lowers elemental resistances |
| Weaken | Des Mani | Garlic, Nightshade | Decreases target's strength |

---

#### Circle 2 — Mana cost 6

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Agility | Ex Uus | Blood Moss, Mandrake Root | Increases dexterity and stamina |
| Cunning | Uus Wis | Nightshade, Mandrake Root | Increases intelligence and mana |
| Cure | An Nox | Garlic, Ginseng | Cures poison; higher skill cures stronger poisons |
| Harm | An Mani | Nightshade, Spider's Silk | Cold damage; strongest at close range, 23–29 at 0–1 tiles |
| Magic Trap | In Jux | Garlic, Spider's Silk, Sulfurous Ash | Magically traps a container |
| Remove Trap | An Jux | Blood Moss, Sulfurous Ash | Removes magic or low-level mechanical traps |
| Protection | Uus Sanct | Garlic, Ginseng, Sulfurous Ash | Prevents spell interruption; lowers resistances |
| Strength | Uus Mani | Mandrake Root, Nightshade | Increases strength and hit point cap |

---

#### Circle 3 — Mana cost 9

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Bless | Rel Sanct | Garlic, Mandrake Root | Combines Agility, Cunning and Strength in one cast |
| Fireball | Vas Flam | Black Pearl | Fire damage, 26–31; quick cast |
| Magic Lock | An Por | Blood Moss, Garlic, Sulfurous Ash | Magically locks a chest |
| Poison | In Nox | Nightshade | Poisons target; prevents healing; 4 levels of severity |
| Telekinesis | Ort Por Ylem | Blood Moss, Mandrake Root | Manipulates objects at range; opens doors, springs traps |
| Teleport | Rel Por | Blood Moss, Mandrake Root | Teleports caster up to 11 tiles to a visible location |
| Unlock | Ex Por | Blood Moss, Sulfurous Ash | Unlocks magic-locked or low-level treasure chests |
| Wall of Stone | In Sanct Ylem | Blood Moss, Garlic | Creates a stone wall; blocks movement; lasts 10 seconds |

---

#### Circle 4 — Mana cost 11

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Arch Cure | Vas An Nox | Garlic, Ginseng, Mandrake Root | Stronger cure; affects all friendlies within 2 tiles |
| Arch Protection | Vas Uus Sanct | Garlic, Ginseng, Mandrake Root, Sulfurous Ash | Casts Protection on all party members within 3 tiles |
| Curse | Des Sanct | Garlic, Nightshade, Sulfurous Ash | Combines Clumsy, Feeblemind and Weaken; lowers max resistances |
| Fire Field | In Flam Grav | Black Pearl, Spider's Silk, Sulfurous Ash | Creates a fire field; 2 damage/second; lasts ~54 seconds at GM |
| Greater Heal | In Vas Mani | Garlic, Ginseng, Mandrake Root, Spider's Silk | Major healing: (Magery × 0.4) + 1–10 HP |
| Lightning | Por Ort Grav | Mandrake Root, Sulfurous Ash | Instant energy bolt, 30–34 damage |
| Mana Drain | Ort Rel | Black Pearl, Mandrake Root, Spider's Silk | Drains target's mana for 4 seconds |
| Recall | Kal Ort Por | Black Pearl, Blood Moss, Mandrake Root | Instant transport to a marked rune location |

---

#### Circle 5 — Mana cost 14 *(documented; not yet implemented)*

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Blade Spirits | In Jux Hur Ylem | Black Pearl, Mandrake Root, Nightshade | Summons spirits that attack nearby enemies; lasts 120s |
| Dispel Field | An Grav | Black Pearl, Garlic, Spider's Silk, Sulfurous Ash | Dispels one tile of a field spell |
| Incognito | Kal In Ex | Blood Moss, Mandrake Root, Nightshade, Sulfurous Ash | Temporarily changes name and appearance |
| Magic Reflection | In Jux Sanct | Garlic, Mandrake Root, Spider's Silk | Reflects spells back at caster; pool-based |
| Mind Blast | Por Corp Wis | Black Pearl, Mandrake Root, Nightshade, Sulfurous Ash | Cold damage, 40–42; based on Magery and Intelligence |
| Paralyze | An Ex Por | Black Pearl, Nightshade, Spider's Silk | Freezes target; broken by damage |
| Poison Field | In Nox Grav | Black Pearl, Nightshade, Spider's Silk | Field of poison; same levels as Poison spell |
| Summon Creature | Kal Xen | Blood Moss, Mandrake Root, Spider's Silk | Summons a low-level creature; lasts up to 480s |

---

#### Circle 6 — Mana cost 20 *(documented; not yet implemented)*

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Dispel | An Ort | Garlic, Mandrake Root, Sulfurous Ash | Dispels a summoned creature |
| Energy Bolt | Corp Por | Black Pearl, Nightshade | Energy damage, 51–56 |
| Explosion | Vas Ort Flam | Blood Moss, Mandrake Root | Fire damage, 51–56; 2-second delay before impact |
| Invisibility | An Lor Xen | Blood Moss, Nightshade | Hides caster; lasts (Magery × 1.2) seconds |
| Mark | Kal Por Ylem | Black Pearl, Blood Moss, Mandrake Root | Marks a rune at current location for Recall/Gate |
| Mass Curse | Vas Des Sanct | Garlic, Mandrake Root, Nightshade, Sulfurous Ash | Curses all enemies within 3 tiles |
| Paralyze Field | In Ex Grav | Black Pearl, Ginseng, Spider's Silk | Field of paralysis |
| Reveal | Wis Quas | Blood Moss, Sulfurous Ash | Reveals hidden targets |

---

#### Circle 7 — Mana cost 40 *(documented; not yet implemented)*

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Chain Lightning | Vas Ort Grav | Black Pearl, Blood Moss, Mandrake Root, Sulfurous Ash | Lightning hits multiple targets; 64–69 total energy damage |
| Energy Field | In Sanct Grav | Black Pearl, Mandrake Root, Spider's Silk, Sulfurous Ash | Wall of energy; blocks movement |
| Flamestrike | Kal Vas Flam | Spider's Silk, Sulfurous Ash | Massive fire burst; 64–69 damage |
| Gate Travel | Vas Rel Por | Black Pearl, Mandrake Root, Sulfurous Ash | Opens a moongate to a marked rune; lasts 30 seconds |
| Mana Vampire | Ort Sanct | Black Pearl, Blood Moss, Mandrake Root, Spider's Silk | Drains target's mana and adds it to caster's |
| Mass Dispel | Vas An Ort | Black Pearl, Garlic, Mandrake Root, Sulfurous Ash | Dispels multiple summoned creatures |
| Meteor Swarm | Kal Des Flam Ylem | Blood Moss, Mandrake Root, Spider's Silk, Sulfurous Ash | Fire meteors hit multiple targets; 64–69 total damage |
| Polymorph | Vas Ylem Rel | Blood Moss, Mandrake Root, Spider's Silk | Transforms caster into another creature form |

---

#### Circle 8 — Mana cost 50 *(documented; not yet implemented)*

| Spell | Words of Power | Reagents | Effect |
|-------|---------------|----------|--------|
| Earthquake | In Vas Por | Blood Moss, Ginseng, Mandrake Root, Sulfurous Ash | ~33% physical damage to all visible targets in radius |
| Energy Vortex | Vas Corp Por | Black Pearl, Blood Moss, Mandrake Root, Nightshade | Summons vortex that attacks nearby enemies; 26 dmg/hit |
| Resurrection | An Corp | Blood Moss, Garlic, Ginseng | Restores a dead character to life |
| Summon Air Elemental | Kal Vas Xen Hur | Blood Moss, Mandrake Root, Spider's Silk | Summons air elemental; focuses on spellcasting |
| Summon Daemon | Kal Vas Xen Corp | Blood Moss, Mandrake Root, Spider's Silk, Sulfurous Ash | Summons daemon; powerful melee + 7th circle magic; costs karma |
| Summon Earth Elemental | Kal Vas Xen Ylem | Blood Moss, Mandrake Root, Spider's Silk | Summons earth elemental; strong melee, no magic |
| Summon Fire Elemental | Kal Vas Xen Flam | Blood Moss, Mandrake Root, Spider's Silk, Sulfurous Ash | Most powerful elemental; melee + magic |
| Summon Water Elemental | Kal Vas Xen An Flam | Blood Moss, Mandrake Root, Spider's Silk | Combines air and earth elemental skills |

---

## 10. Hyborian Age Lore — The Foundational Setting

Living Eamon is set in **Robert E. Howard's Hyborian Age**. This
is not generic fantasy. **All future adventures, story modules,
Occult magic, monsters, enemies, and magical-item back-stories
must descend from this canon** — either adapted directly from
Howard's public-domain works, or invented in his voice and fitted
to his geography and chronology.

> ⚠️ **CRITICAL — PD STATUS:** Most of Howard's Conan corpus is
> NOT yet in US public domain. The full PD-status framework and
> calendar live in **`Public_Domain_Rules.md`** (repo root); the
> name-by-name Safe Harbor / Radioactive lookup lives at the top
> of this document. **Read both before designing anything new.**
> This §10 references only PD-safe material. The full
> module-creation methodology is in
> **`lore/hyborian-pd/MODULE_PLAN.md`**.

When a new adventure, NPC, or artifact is being designed, the
writer must first ask: *Is this element verifiable as public
domain per the Safe Harbor table above and `Public_Domain_Rules.md`?*
If no, either find a PD-safe equivalent or wait until it enters PD
(see PD calendar in `Public_Domain_Rules.md` §8 — most Conan stories
enter 2028–2032).

---

### 10.1 The Setting in One Paragraph

The Hyborian Age sits roughly **between the sinking of Atlantis
and the dawn of recorded history** — Howard placed it ~12,000–10,000
BC. It is a world of marble cities and naked barbarians; of
decadent civilizations crusted over the ruins of older, blacker
empires; of slow-grinding theocracies and lone-genius adventurers
who topple them. The dominant powers are the Hyborian kingdoms of
the west (Aquilonia, Nemedia, Brythunia), with serpent-haunted
**Stygia** to the south, the **Black Kingdoms** beyond, and the
ruins of the older **Thurian Age** beneath every well-traveled
road. Magic exists, but it is rare, hated, and almost always evil
at the edges. Heroes are mortal; the universe is indifferent.

All kingdom names above are PD-safe via the *Hyborian Age* essay
(1936, non-renewed).

---

### 10.2 The Thurian Age — The Pre-Cataclysmic Foundation

The **Thurian Age** is the lost prehistoric epoch that preceded
the Hyborian Age. It ended in the Cataclysm that sank Atlantis
and reshaped the world. **The Thurian Age is the spine of Living
Eamon's Occult magic** — its ruins, its forgotten races, and its
buried artifacts are the natural source of the dark sorcery that
seeps into the player's present.

The Thurian Age is exceptionally well-suited to Living Eamon
because **three Thurian-Age short stories by Howard are fully
public domain** (see `Public_Domain_Rules.md` §5): *The Shadow Kingdom*,
*The Mirrors of Tuzun Thune*, and *Kings of the Night*. These
give us **named characters, named places, named magical
phenomena, and named races** that we can use freely.

**PD-safe Thurian elements (use freely):**

- **Valusia** — the decadent serpent-haunted empire; pre-Cataclysmic
  human civilization corrupted by Serpent-Men infiltration. Its
  ruins exist in the Hyborian present as crumbling crypts and
  half-buried temples.
- **Atlantis** — the barbarian homeland of Kull; sank in the
  Cataclysm. Atlantean ruins occasionally surface on remote
  shores.
- **Kull of Atlantis** — the barbarian who became king of Valusia.
  Long dead by the Hyborian present, but his name persists in
  legend and his deeds in carved stone.
- **Tuzun Thune** — the ancient Valusian wizard whose **mirror
  chamber** showed visions of alternate realities. His tower is
  abandoned but sealed; his mirrors persist.
- **Bran Mak Morn** — king of the Picts; known across both
  Thurian and Hyborian eras through ritual time-bridges. Pictish
  shamans still invoke his name.
- **Serpent Men** — the ancient shapeshifting race that ruled
  before humans. Most were destroyed at the Cataclysm; some
  survived in deep places and can still infiltrate human courts
  by mimicking faces. Speak the phrase *"Ka nama kaa lajerama"*
  to expose them — they cannot say it.
- **The Cataclysm** — the great sundering that sank Atlantis,
  drowned Valusia, and ended the Thurian Age. The boundary
  event between the two ages.

**Thurian Aesthetic.** Ancient stonework predating any known
script. Stepped pyramids and serpent-columns. Mirror chambers.
Pre-human geometry that doesn't quite fit the human eye. Frazetta's
oldest, most weathered ruins. Scenes lit by guttering torches in
chambers that shouldn't have stood for ten thousand years.

---

### 10.3 Stygia and Set — The Living Serpent-Cult

**Stygia** is the southern serpent-god-worshipping kingdom of the
Hyborian Age — named in the *Hyborian Age* essay (PD-safe). Older
than the Hyborian kingdoms, the cult of **Set** persists from
Stygia south through the Black Kingdoms.

Stygian sorcery is **the living tradition** that connects most
directly to the lost Thurian magic. Where Thurian Serpent-Men
ruled the world from Valusia, the Stygian serpent-priests rule a
shrunken modern kingdom — but they remember much that should have
died with the Cataclysm.

**Game implication:** anywhere Thurian ruins appear, expect
Stygian-style iconography (serpents, eyes of Set, black pearls
used as scrying foci). Stygian assassins, snake-cultists, and
suspected Serpent-Man infiltrators are the natural living
antagonists who carry Thurian techniques forward into the
player's present.

> **Note on names:** "Stygia," "Set," "Khemi," "serpent-priests"
> are all from the *Hyborian Age* essay (PD). "Thoth-Amon" and
> other named Stygian sorcerers from the Conan stories remain
> copyrighted until 2028+.

---

### 10.4 Aquilonia and Ostavar — The Civilized Present

**Aquilonia** is the dominant Hyborian kingdom of the present —
named in the *Hyborian Age* essay (PD-safe). Marble colonnades,
gilt towers, silk banners, Frazetta/Brom interiors. It is the
westernmost Hyborian power, civilized to the point of decadence,
patrolling its border against serpentine Stygia to the south and
Pictish wilderness to the west.

**Ostavar — the player's starting hub — is styled after
Aquilonia.** This is canonical (see CLAUDE_CONTEXT memory
`project_ostavar_aquilonia.md`). The Guild Hall, Sam's Sharps,
Pots & Bobbles, the Church of Perpetual Life — all read as
late-Aquilonian civic architecture. **Tone for Ostavar is
"aquilonian"** in the scene-image system.

When future modules introduce other regions, use these tonal
anchors:
- **Aquilonia** → marble, gilt, civilized, Frazetta palace
- **Stygia** → serpent stone, black basalt, Brom temple-interiors
- **Thurian ruins** → ancient pre-human stonework, mirror chambers,
  serpent-columns, Frazetta's oldest weathered crypts
- **Cimmeria / barbarian frontier** → grey crags, snow, Conan-tone
  (Cimmeria is named in the essay; Conan himself is NOT yet PD)
- **Pictish Wilderness** → standing stones, dark forest, Bran Mak
  Morn's heritage
- **Black Kingdoms** → jungle, mud-brick, drum-haunted
- **Vanaheim / Asgard** → ice, longships, Vendel-era

---

### 10.5 Tuzun Thune and the Mirror Chambers — The Template Artifact

**Tuzun Thune** was an ancient Valusian wizard whose tower
contained a chamber of mirrors that showed visions of alternate
realities. From "The Mirrors of Tuzun Thune" (1929, PD): when
Kull stared into the mirrors he saw himself living different
lives, considered which was real, and almost lost himself to the
visions.

**This is the template for Living Eamon's permanent legacy
artifacts.** Future modules should design artifacts in this mould:

- **Discovered in Thurian ruins** (or comparable PD-derived
  Thurian sites)
- **Carries permanent power** the player can claim
- **Carries permanent corruption / risk** the player must manage —
  taint score, virtue ceiling shifts, profile-driven visions, NPC
  reactions
- **Recorded in the Eamon Chronicle forever** — even destroying
  the artifact is a Chronicle event
- **Has a verbatim Howard-style description** drawn from PD
  prose where possible

A **Tuzun-Thune-Mirror artifact** is the natural first legacy
artifact for the player to encounter (see Module 1 in
MODULE_PLAN.md). It can be claimed (powerful but mind-eating),
destroyed (shatters with a sound nothing else makes), or returned
sealed (forever findable by the next player who reaches the
ruin).

---

### 10.6 The Outer Dark — Source of the Worst Knowledge

The **Outer Dark** is Howard's term for the home of nameless
horrors older than even the Thurian Age — the entities Thurian
sorcerers and Serpent-Men bargained with for their most monstrous
spells. Think H.P. Lovecraft's Outer Gods, but predating Lovecraft
by a few years and grimmer in tone (Howard was Lovecraft's
correspondent and influence ran both ways).

> **PD note:** "The Outer Dark" as a phrase appears in multiple
> Howard works including PD ones. Specific Outer Dark entities
> named in copyrighted Conan stories should NOT be used by name
> until those stories enter PD.

**Game use:**
- Highest-circle Occult spells (Circles 6–8) draw from the Outer
  Dark and have permanent karmic costs
- Summoning Outer Dark entities is the highest-tier Occult act —
  realm-cataclysm scale (see §11 World Destruction)
- Specific named Outer Dark beings should be invented fresh in
  Howard's voice, NOT borrowed from copyrighted Conan stories
- The Order's deepest fear is anyone who has made an Outer Dark
  pact — they erase such practitioners and everyone who knew them

---

### 10.7 The Eight Reagents — Mapped to Hyborian Function

The eight canonical reagents (see §9 Reagents) each have a
specific Thurian / Stygian / Hyborian role. **All future Occult
spell designs must respect these mappings:**

| Reagent | Hyborian Function |
|---------|-------------------|
| **Black Pearl** | Stygian — scrying, mental domination, Set serpent rites. Coastal/sea-tomb origin. Opens the inner eye. |
| **Blood Moss** | Sacrificial residue — clings to altars where blood has been spilled. Living evidence of pre-Cataclysmic atrocity. Only grows where men died screaming. |
| **Garlic** | The **counter-reagent.** Wards against Thurian undead and Serpent-Men. Why protective NPCs hand it out. Why a Thurian remnant flinches near it. |
| **Ginseng** | Vital-force fuel for resurrection rites. Sustains a corpse-vessel through the long restoration ritual. |
| **Mandrake Root** | Necromancy catalyst — binds a soul to a corpse-vessel. Pulled from soil under pre-Cataclysmic altars; the loudest scream. |
| **Nightshade** | Death-sleep / millennia-trance. The poison that wasn't death — used by Thurian sorcerers to wait out the centuries. |
| **Spider's Silk** | Binding threads for **Outer Dark contracts.** Weaves the sorcerer's tether to summoned things. |
| **Sulfurous Ash** | Destruction, daemon trace — the **signature** the Order smells. Ash from Thurian altars is the most potent grade. |

A **reagent quality flag** is on the roadmap: same `itemId`,
additive `quality` field. Common-grade reagents are found
everywhere; **Thurian-grade** reagents (only from pre-Cataclysmic
ruins) multiply effect *and* multiply Order-detection probability.
Clearing a real Thurian ruin should be a meaningful reagent reward.

---

### 10.8 Module & NPC Hooks

**See `lore/hyborian-pd/MODULE_PLAN.md` for the canonical near-term
module roster, build order, and full conversion methodology.**
Summary here:

**First three modules** (all built from Thurian-Age PD source
stories — see `Public_Domain_Rules.md` §5 for verification):

1. **The Mirrors of Tuzun Thune** — ruined Thurian tower with the
   wizard's mirror chamber. Profile-driven visions. Low combat,
   dynamic-heavy. **First module to build.**
2. **The Serpent in the Court** — Serpent-Man infiltration of a
   Hyborian-era noble court. Investigation + moderate combat to
   advance weapon skills + earn gold for training.
3. **The Pictish Time-Tomb** — Bran Mak Morn-style time-bridge
   ritual opens a Thurian tomb. Player aids or opposes. Battle
   climax with Stygian raiders standing in for the Romans of
   Howard's original story.

**NPC archetypes** that should recur:

- **Thurian remnant cultist** — last survivor of a forgotten
  pre-Cataclysmic temple, trying to revive ancient rites on a
  small scale. Low-level necromancer with a personal grimoire.
- **Serpent-Man infiltrator** — ancient shapeshifter wearing a
  human face. Use the *"Ka nama kaa lajerama"* phrase from
  *The Shadow Kingdom* as the canonical exposure mechanic.
- **Stygian assassin / snake-cultist** — Set-priest with poisoned
  blade and serpentine charisma. The Painful Poison and Quick
  Death the player can buy from Zim are also what these enemies
  use.
- **Hyborian inquisitor / Order agent** — descends on suspected
  Occult practitioners. Erases practitioners AND witnesses.
- **Cimmerian / barbarian wanderer** — high-DEX unarmored archetype
  the player can hire or fight. (Cimmerian as a *people* is
  PD-safe via the essay; specific named Cimmerian heroes from
  Conan stories are NOT.)
- **Pictish shaman** — Bran Mak Morn lineage; wields ancient
  ritual magic distinct from the serpent-cult tradition.
- **Aquilonian noble** — civilized but possibly decadent;
  patron of legitimate adventures.

**Magical-item back-stories** must place each artifact on the
Hyborian/Thurian timeline:
- *"This blade was forged in lost Valusia in the reign of the
  Serpent-Kings."*
- *"The serpent-priests of Khemi sealed this scroll under wax in
  the days when Set walked among kings."*
- *"This mirror was salvaged from the wreck of Tuzun Thune's
  tower after the Cataclysm took the rest."*

Generic D&D-style flavor ("a magical sword from the Old Kingdom")
is forbidden. Every artifact must have a **specific Hyborian or
Thurian provenance** that traces to a PD-safe source.

---

### 10.9 Public Domain Sources & Voice Notes

The currently usable Robert E. Howard works (US public domain)
are:

- **The Hyborian Age essay** (1936) — non-renewed. The geographic
  and historical skeleton of the entire setting. Does NOT name
  individual heroes.
- **The Shadow Kingdom** (Weird Tales, August 1929) — Kull,
  Valusia, Serpent-Men, the *"Ka nama kaa lajerama"* phrase.
- **The Mirrors of Tuzun Thune** (Weird Tales, September 1929) —
  Tuzun Thune, his mirror chamber, alternate-reality visions.
- **Kings of the Night** (Weird Tales, November 1930) — Bran Mak
  Morn, Pictish ritual time-bridges, Kull summoned across eras.

> **`Public_Domain_Rules.md` (repo root) is the authoritative source
> on what's PD and when more works enter (mostly 2028–2032).**

**Voice when writing in this canon:**
- Spare, Anglo-Saxon-rooted vocabulary
- "Lone genius vs ancient evil" arc, never chosen-one
- Civilization is decadent; barbarism is honest
- Magic is hated, rare, and almost always evil at the edges
- Survival is the mechanic; death is permanent consequence
- Annalist voice for Chronicle entries (per §6 above) — terse,
  factual, Glen-Cook-flavored

When in doubt, ask: *"Would Howard publish this in a 1934
Weird Tales issue?"* If the answer is no, rewrite. Then ask:
*"Is every named element PD-verified per the Safe Harbor table at
the top of this doc and `Public_Domain_Rules.md`?"* If no, rewrite
again.

---

### 10.10 The PD Calendar — Future Module Pipeline

The Conan corpus enters PD on a rolling annual schedule starting
**January 2028.** When that begins, we will be able to add full
Conan modules using copyrighted-today material:

- **2028:** First two Conan stories enter PD (1932 publications:
  *The Phoenix on the Sword*, *The Scarlet Citadel*). At this
  point, **Conan himself becomes PD** as a named character.
- **2029–2030:** The bulk of the classic Conan short stories enter
  PD wave by wave.
- **2031:** *The Hour of the Dragon* (the only full Conan novel)
  enters PD — finally unlocking **Acheron, Xaltotun, the Heart of
  Ahriman, and the city of Python** for use in Living Eamon prose
  and modules.

When 2028 arrives, **revisit `Public_Domain_Rules.md` §8 and
MODULE_PLAN.md together** and queue Conan modules. Treat the unlock
as a deliberate design event, not an automatic batch import — each
newly-unlocked story should be reviewed for fit and only the
best-fitting are converted to modules.

The full PD entry calendar is maintained in **`Public_Domain_Rules.md`
§8**.

---

## 12. Planned Core Systems *(Phase 2 unless noted)*

### Inventory & Equipment UI *(High Priority — April 2026)*

Ratified April 14, 2026. This section records the canonical
design decisions for item interaction, inspection, comparison,
vendor integration, and equipment slot expansion.

**Item Action Menu (right-click / click):**
- Click any item icon (in pack, gear, shop, or any future
  clickable context) → contextual verb menu anchored to the tile.
- Verbs are context-sensitive:
  - **In pack, not in shop:** Equip / Drink / Apply / Inspect / Drop
  - **In pack, in a shop room:** Equip / Drink / Apply / Inspect / **Sell** (replaces Drop)
  - **Equipped (GEAR tab):** Unequip / Inspect (no Sell — must
    unequip first)
- Equip and Drop execute **instantly with no confirmation dialog.**
  Players live with mistakes.
- "Apply to Blade" (for Painful Poison, Quick Death) generates
  `APPLY [poison] TO [weapon]` — works on any weapon including
  bow and crossbow. Response text reflects arrows/bolts for
  ranged weapons. The poison item is consumed; the weapon gains
  `weaponPoisonCharges` and `weaponPoisonSeverity`, decremented
  per combat hit.
- **The right-click / action-menu pattern applies to ALL clickable
  objects across the game.** Implement as new clickable surfaces
  are added.

**Inspect Popup — Two Visual Styles:**
1. **Alchemical Book style** — the existing Thurian-codex parchment
   layout (Linear B, Cedarville Cursive, illuminated margins).
   Used **only for books, scrolls, and grimoires.** Not for
   general items.
2. **Standard Inspection style** — item sprite (from the icon
   pipeline) displayed large on the **left third** of a dark
   translucent container, positioned **vertically** (e.g., a sword
   stands upright). The **right two-thirds** holds scrollable
   long-form text (description, stats, lore). No parchment
   texture. Clean dark glassmorphism.

**COMPARE Popup:**
- For weapons, rings, amulets/necklaces, and armor in a shop or
  hero inventory (not equipped): shows a **side-by-side comparison**
  against whatever is currently equipped in the relevant slot.
- Layout: small popup with a 2-column table. Left column head =
  equipped item icon + "(equipped)" label. Right column head =
  the inspected/shop item icon. Rows below: comparable attributes
  (damage, speed, armor coverage, magical properties, etc.).
- Triggered via "Compare" verb in the action menu, or
  automatically on hover/inspect in shop context.

**Bulk Sell + Vendor Temp Inventory:**
- SELL in a vendor room → opens a sell menu with **checkboxes**
  so the player can sell multiple items at once.
- When an item is sold to a vendor, it enters the **vendor's
  temporary inventory for 100 turns**. The player can buy it
  back at **double the sale price** (i.e., the original item.value
  — since they sold it at half, buying it back costs the full
  price, netting a 50% loss on the round trip).
- After 100 turns the item leaves the vendor's stock permanently.
- Vendor temp inventory stored as `vendorTempStock[]` on
  WorldState (per vendor NPC id).

**Expanded Equipment Slots (HWRR-aligned):**
- Current: weapon, shield, helmet, gorget, bodyArmor, limbArmor (6)
- Adding: **2 ring slots per hand** (4 ring slots total),
  **necklace/medallion** (1 slot), **waist/belt with pouches**
  (1 slot).
- Total: 12 slots. Research HWRR `.rpy` files for exact slot
  layout before implementing.
- EquipmentGrid layout will need redesign to accommodate 12 slots
  (probably 4×3 grid).

---

### Critical Fail System *(Combat — April 2026)*

The opposite of a Critical Hit. When a combatant rolls poorly
enough, a Critical Fail occurs — the most dramatic being
**dropping the weapon.**

**Design rules:**
- Critical Fail chance mirrors the Critical Hit algorithm
  (inverse conditions — low roll on the attack, modified by
  weapon skill).
- **Masters are immune.** A true master of a weapon skill
  (e.g., 200+ swordsmanship) NEVER critically fails with that
  weapon type. The threshold scales with skill: high skill
  progressively reduces Critical Fail probability until it
  reaches zero.
- **Weapon drop** is the primary Critical Fail consequence.
  Dropped weapon goes to the floor of the combat room; the
  combatant must fight unarmed until they retrieve it (costs
  a combat turn) or switch to a backup weapon.
- Critical Fail narration pools should be added to
  `combatZoneNarration.ts` alongside the existing hit/block/
  evade narration pools.
- Enemies can also Critical Fail. An enemy dropping their
  weapon creates a tactical opening.

---

### Prescripted Text Display *(UI — April 2026)*

**Prescripted (static engine) text displays instantly** — no
character-by-character streaming. The appearance effect is a
**fade-in** (opacity 0→1 over ~300ms).

**Only Jane's dynamic content streams** (character-by-character
animation). This gives the player:
1. No waiting for room descriptions, vendor menus, combat logs,
   HEALTH output, or any other prescripted response.
2. A clear visual signal of which text is Jane (streams in) vs.
   engine (appears instantly) — useful for development debugging
   and for player awareness of when the AI is speaking.

---

### Stamina System *(High Priority)*

Stamina is a third vital stat alongside HP and mana (Expertise).
It represents physical endurance and directly affects combat,
movement, and survival.

**Stamina sources:**
- Food and water restore stamina
- Rest (being stationary for several turns) slowly restores stamina
- Certain spells and items affect stamina

**Stamina effects:**
- **Full stamina:** Natural HP healing over time at maximum rate;
  poison effects end naturally and quickly; all actions available
- **Low stamina:** FLEE command disabled ("Your legs will not
  answer — you are too exhausted to run."); natural healing slows
  significantly; poison progresses more aggressively
- **Very low stamina:** Natural healing stops entirely; wounds
  worsen over time without treatment; poison can become lethal
- **Zero stamina:** Player cannot attack, cast, or flee; HP begins
  to drain slowly

**Stamina display:** Shown in the sidebar as a bar, similar to HP.

---

### Campfire System *(Phase 2)*

A campfire can be built anywhere there is solid ground (not in
water, not in rooms with active enemies). Buildings are fair
game — but doing it in town has consequences.

**Requirements:**
- 5 wood shavings (consumed on use)
- Command: `MAKE CAMPFIRE` or `BUILD FIRE`

**Effects while campfire is burning:**
- **Double healing rate** when well-fed (stamina above 50%):
  HP regen doubles from 1/turn to 2/turn
- Campfire lasts 50 turns before dying out
- Provides light (equivalent to a torch) in dark areas
- Some NPCs and animals are attracted to or repelled by fire
- **In town/buildings:** NPCs are furious. They stamp it out
  immediately (fire is destroyed, shavings consumed). Player
  loses 1 Honor. Narration reflects the social disgrace.

**Wood shavings sources:**
- Training dummies drop 1–4 on destruction
- Found as adventure loot in forests, workshops, carpenter areas
- Purchased cheaply from general goods vendors (when implemented)

**Design intent:** Wood shavings are a common, low-value material
with genuine tactical use. The campfire is a survival tool for
dungeon expeditions — the player who carries wood shavings can
rest more efficiently than one who does not. Combined with food,
a campfire rest stop becomes a meaningful tactical decision:
stop and heal, or push forward wounded.

---

### Hunger & Thirst System *(Phase 2)*

Hunger and thirst are tracked separately. Both reduce stamina
over time when unmet. Extended hunger and thirst eventually
reduce maximum HP.

**Hunger:**
- Builds over time (turn count)
- Mild hunger: minor stamina drain
- Moderate hunger: stamina cap reduced; natural healing slowed
- Severe hunger: HP begins declining slowly
- Starvation: HP drains steadily; death possible

**Thirst:**
- Builds faster than hunger
- Mild thirst: minor stamina drain
- Moderate thirst: concentration broken (spell cast chance reduced)
- Severe thirst: same as severe hunger but faster progression
- Dehydration: HP drains; death possible without water

**Food and water sources:**
- Hokas Tokas sells ale (restores thirst) and hearty meals
  (restores hunger + some stamina)
- Trail rations (from Pip or adventure loot) restore both slowly
- Adventures should include food and water sources as meaningful
  resources, not just flavor
- Create Food (Occult Circle 1) satisfies mild hunger

**Design intent:** The player should never die of hunger or thirst
in the Main Hall — resources are available. Hunger and thirst
become survival mechanics in dungeons and long adventures, where
managing supplies is a meaningful choice.

---

### Weight & Encumbrance System *(High Priority — Phase 2)*

Every item in the game has a weight value, following the original
Eamon design philosophy. Players can only carry so much before
they are encumbered. This is a high priority addition.

**Weight rules:**
- Every item has a weight in stones (classic UO unit) or Eamon
  equivalent
- Player carry capacity is determined by Strength:
  `maxCarryWeight = Strength * 3.5` (adjustable)
- Encumbrance levels:
  - **Normal** (0–80% capacity): No penalty
  - **Burdened** (80–95%): Movement slowed; stamina drains faster
  - **Overloaded** (95–100%): Cannot move; cannot flee; stamina
    drains rapidly
  - **Cannot pick up** (at 100%): Engine refuses the action with
    a message

**Weight display:** Current carried weight / max shown in
INVENTORY output and optionally in the sidebar.

**Design intent:** Forces meaningful inventory decisions.
Adventurers cannot carry every weapon they find. The vault and
personal room become strategically important for storing gear
between adventures. Encumbrance also makes the gray robe respawn
more interesting — the player starts at zero weight and must
decide what to carry back from the Main Hall.

---

### Runes & Runegates *(Phase 2)*

Runes are items that can be marked at a specific location using
the Occult spell Mark (Circle 6: `Kal Por Ylem`). A marked rune
stores the location and can be used with:

- **Recall** (Circle 4: `Kal Ort Por`) — instant solo transport
  to the rune's location, consuming the rune's charge
- **Gate Travel** (Circle 7: `Vas Rel Por`) — opens a two-way
  moongate to the rune's location; lasts 30 seconds; anyone can
  pass through

**Rune properties:**
- Blank runes are found as adventure loot or purchased from
  certain merchants (not in the Main Hall)
- A rune can be marked once; re-marking overwrites the location
- Runes can be stored in Runebooks (a special item that holds
  up to 16 runes and allows labeling each destination)
- Runebooks are rare and valuable

**Design intent:** Runes and runegates are the primary fast-travel
system for experienced players. They reward exploration —
a player who has marked runes in key adventure locations can
navigate the world far more efficiently than one who has not.
Since Mark requires Circle 6 Occult magic, fast travel is gated
behind significant Occult progression, making it a meaningful
milestone.

**The Order and runes:** Possessing a runebook is not itself
illegal, but the runes inside mark where the owner has been —
and the Mark spell that created them is Circle 6 Occult.
The Order considers runebooks strong evidence of Occult practice.

---

## 19. Design Decisions Log

### April 2026

- Occult Magic system uses classic UO Magery rules (8 circles,
  64 spells, reagent consumption). Reagents cannot be purchased
  in starting areas — found in adventure loot or traded in other
  worlds. Occult is illegal; the Order prosecutes practitioners
  and witnesses. Collecting reagents is an investigative
  indicator. The system is NOT patched as it is used — it is
  limited by reagent availability. INVOKE is the command;
  CAST is for legal Guild magic only. Circles 1–4 implemented;
  5–8 documented for later phases. Guild spells (BLAST, HEAL,
  LIGHT, SPEED) use no reagents and are roughly half the power
  of Circle 1 Occult.
- Stamina system planned: third vital stat; food/water restore
  it; full stamina = max natural healing + fast poison recovery;
  low stamina disables FLEE and slows healing; very low stops
  healing entirely; zero drains HP.
- Hunger and thirst planned as separate mechanics; both drain
  stamina; severe cases drain HP; starvation/dehydration can
  be lethal; food/water always available in Main Hall so death
  only possible in prolonged adventures without supplies.
- Weight and encumbrance planned as high priority Phase 2
  feature; every item has weight; carry limit based on Strength;
  four encumbrance levels (normal/burdened/overloaded/cannot
  pick up); forces meaningful inventory decisions; vault and
  personal room become strategically important.
- Runes and runegates planned for Phase 2: Mark (Circle 6)
  creates a rune; Recall (Circle 4) transports solo; Gate Travel
  (Circle 7) opens a moongate; Runebooks hold 16 runes; fast
  travel gated behind Occult progression; The Order treats
  runebooks as evidence of Occult practice.
- Night Sight (Circle 1 Occult) corrected: grants vision in
  complete darkness without a light source, not merely
  illumination.

---

## 20. The Reader's Mirror — Psychological Profile System

*The most ambitious feature of Living Eamon. The engine that makes this the player's favorite novel.*

---

### The Vision

Living Eamon is not a game. It is a novel. Specifically, it is the player's favorite novel — the one they have always wanted to read but that has never existed because it requires knowing them.

Every reader carries a subconscious library: the authors whose prose made them feel something they could not name, the villains who frightened them in ways that felt personal, the themes that recur across every book they have ever loved. Living Eamon reads that library and writes from it.

Jane does not write generic fantasy. She writes in the style of the player's favorite authors. She builds plots around the moral dilemmas that genuinely disturb the player. She calibrates darkness, romance, humor, and violence to the player's demonstrated tolerance — not to what they say they want, but to what their choices reveal.

The product is a Kindle Unlimited subscription to an infinite library of one — a living novel that is always in progress, always shaped by the reader's subconscious, and always their favorite book.

---

### 20.1 The Two Sources of Truth

The psychological profile is built from two sources:

**Source 1 — In-game behavior (automatic, continuous)**

Every choice a player makes is a data point. Jane observes silently:

- **Virtue pattern:** A player who consistently chooses Mercy over Justice has a different moral center than one who chooses Justice over Compassion. These patterns map to literary preferences — the Mercy-dominant player likely prefers Dostoevsky to Cormac McCarthy.
- **Combat vs. diplomacy ratio:** Players who always try to talk first before fighting prefer character-driven fiction over action. Jane paces their narrative accordingly.
- **NPC relationship investment:** Players who spend turns building relationships with NPCs rather than moving toward goals prefer sprawling character novels (Tolstoy, George R.R. Martin) over tight thrillers.
- **Risk appetite:** Players who attempt the Occult despite knowing it is illegal are drawn to transgressive fiction — Nabokov, Bret Easton Ellis, Chuck Palahniuk.
- **Darkness tolerance:** A player who casts fireball in the Main Hall without hesitation can handle darker narrative. A player who carefully deposits gold before every adventure prefers order and resolution.
- **Curiosity signals:** Players who examine everything before acting prefer literary fiction with layered prose (Le Guin, Ishiguro, Toni Morrison).
- **Adventure selection:** Players who go straight to The Beginner's Cave prefer genre fiction with clear goals. Players who spend hours in the Main Hall building relationships prefer character studies.

**Source 2 — Reading history (player-provided, one-time import)**

- **GoodReads public profile:** The player provides their GoodReads URL. The system reads their shelves, ratings, and read lists. A 5-star rating for *Blood Meridian* and *Crime and Punishment* tells Jane more about the player's ideal fiction than any survey.
- **Kindle reading history:** Amazon provides a CSV export of every book purchased and read. Completion rates (did they finish it?), re-reads, and purchase patterns reveal preferences more honestly than ratings.

---

### 20.2 The Profile Dimensions

The Player Profile tracks the following dimensions. Each is a number or enum derived from the two data sources above.

| Dimension | Type | What it controls |
|-----------|------|-----------------|
| `genre_weights` | Object (12 genres, 0–100 each) | What adventure types Jane proposes |
| `author_styles` | Ranked list of author names | Jane's prose style and dialogue register |
| `narrative_themes` | List of theme tags | Recurring plot elements Jane emphasizes |
| `darkness_tolerance` | 0–100 | Content rating ceiling |
| `pacing_preference` | `fast` / `measured` / `slow` | Scene length and action density |
| `moral_complexity` | 0–100 | How morally ambiguous Jane makes villains and choices |
| `romance_weight` | 0–100 | Frequency and depth of romantic subplots |
| `horror_weight` | 0–100 | Frequency and intensity of horror elements |
| `humor_weight` | 0–100 | Frequency of comic beats and levity |
| `mystery_weight` | 0–100 | Frequency of mystery/revelation structure |
| `violence_weight` | 0–100 | Intensity of combat and consequence narration |
| `age_tier` | `young_adult` / `adult` / `mature` | Content filter |

**The 12 genres tracked:** Dark fantasy/grimdark · Epic fantasy · Psychological thriller · Mystery/detective · Horror/cosmic horror · Hard sci-fi · Soft sci-fi/social · Romance/erotica · Historical fiction · Literary fiction · Adventure/action · Young adult

---

### 20.3 Content Tiers

| Tier | `darkness_tolerance` | Content |
|------|---------------------|---------|
| Young Adult | 0–30 | Coming-of-age adventure, light conflict, no explicit content, villains defeated not annihilated |
| Adult | 31–69 | Moral ambiguity, moderate violence, romantic subplots (no explicit content), tragedy is possible |
| Mature | 70–100 | R-rated; explicit romance/erotica; brutal war and consequence; psychological horror; no redemptive requirement |

Age tier is set at registration (date of birth or self-selection). Players must confirm they are 18+ for the Mature tier.

---

### 20.4 Jane Personalization Injection

Each session, Jane receives a personalization block built from the player's profile:

```
READER PROFILE — use this to personalize every response:
Preferred genres: dark fantasy (87), psychological thriller (74), literary fiction (68)
Write in the style of: Cormac McCarthy, Dostoevsky, Ursula K. Le Guin
Recurring themes this player loves: moral ambiguity, redemption, the weight of violence, isolation
Darkness tolerance: 82/100 (mature content permitted)
Pacing: measured — scenes should breathe; do not rush to action
Romance: 40/100 — present but not dominant
Shape all narration, NPC voice, plot beats, and adventure content to this profile.
The villain of any adventure should feel personally threatening to this player — not physically, but morally.
```

This block is generated fresh each session from the current profile state.

---

### 20.5 The Reader's Mirror — Profile Page

The Player Profile page (`/profile`) shows the player their psychological profile as a report called "The Reader's Mirror." Sections:

1. **Your Author** — ranked list of 3–5 identified author affinities with explanations
2. **Your Themes** — 5–8 recurring themes with percentages
3. **Your Darkness** — a meter with plain-language description of content tolerance
4. **Your Genre Map** — visual breakdown of the 12 genre weights
5. **Your Virtue Pattern** — plain-language interpretation of in-game virtue choices
6. **Your Reading History** — summary of imported GoodReads/Kindle data (editable)
7. **What Jane Knows** — the exact personalization block Jane is receiving this session (transparency feature)

---

### 20.6 GoodReads Integration

Player provides their GoodReads public profile URL. The system:
1. Fetches the public `read` shelf via GoodReads RSS (`https://www.goodreads.com/review/list_rss/<user_id>?shelf=read`)
2. Sends the book list to Claude for analysis (authors, genres, themes, rating patterns)
3. Stores the analysis in `player_profiles` and merges with in-game signals

---

### 20.7 Kindle Integration

Player uploads an Amazon "Request My Data" CSV export. We analyze:
- Books with high page-count read (completion = strong preference signal)
- Re-reads (the strongest signal of all)
- Sample-to-purchase conversions (curiosity signal)

The raw CSV is never stored server-side — processed client-side and only the analysis is stored.

---

### 20.8 The Infinite Novel — Content Generation Vision

At full development, Jane operates in four modes:

**Mode 1 — Style Mimicry:** Jane writes in the prose style of the player's identified authors.

**Mode 2 — Theme Weaving:** Jane builds recurring themes into every adventure. A player with high Redemption weight finds that their past follows them across the world.

**Mode 3 — Genre Adaptation:** The same adventure is written differently for different players. The Beginner's Cave is a dungeon crawl for the action player, a locked-room mystery for the thriller player, a cosmic horror for the horror player, and an archaeological mystery for the sci-fi player.

**Mode 4 — Villain Personalization:** Jane builds villains that are morally threatening to each player — mirrors of their fears, their temptations, or the choices they have avoided.

---

### 20.9 Privacy and Consent

- Players opt in to profile building. It is not on by default.
- The full profile is always visible and editable by the player on their Profile page.
- Players can delete the profile entirely at any time.
- GoodReads and Kindle data is never stored raw — only the analysis is kept.
- The profile is never sold or shared. The business model is subscription only.
- Players can export their profile as JSON.

---

## 21. Design Decisions Log (continued)

### April 2026 (continued)

- **Auth system:** Email/password + Google SSO via Supabase Auth; cookie-based sessions via `@supabase/ssr`; middleware protects all routes; `players.user_id` FK to `auth.users`; `/login` and `/register` pages match game visual style.
- **Reader's Mirror (§20) designed:** Psychological profile built from in-game virtue/choice signals + optional GoodReads/Kindle import; 12 genre dimensions; darkness tolerance drives content rating (YA / Adult / Mature); Jane receives personalization block each session; Profile page surfaces the profile with a transparency section showing Jane's exact current instructions. Privacy-first: opt-in, editable, deletable, never sold.
- **Living Eamon vision:** Kindle Unlimited for a library of one — an infinite novel written in the style of the player's favorite authors, shaped by the themes they love, calibrated to their darkness tolerance, featuring villains designed to threaten them morally rather than physically.
