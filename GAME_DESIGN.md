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
   restrictions, Bucket A / B / C corpus, future PD calendar.
2. [**ADVENTURE_MODULES_PLAN.md**](./ADVENTURE_MODULES_PLAN.md) —
   per-module roadmap for the expanded PD library, customization
   discipline, scroll/fragment seeding map.
3. The Safe Harbor / Radioactive tables below in this document —
   **name-by-name authoritative lookup.** Supersedes any other doc on
   individual term status.
4. [**lore/hyborian-pd/MODULE_PLAN.md**](./lore/hyborian-pd/MODULE_PLAN.md) —
   methodology for converting PD stories into adventure modules.

**Current PD corpus (verified April 2026, expanded April 30, 2026):**

*Phantagraph non-renewal (1936 / 1940):*
- **"The Hyborian Age"** essay, *The Phantagraph* 1936 — fully PD.
  Hyborian-Age geography, migrations, cataclysms, named kingdoms, peoples.
- **"Always Comes Evening"** poem, *The Phantagraph* Aug 1936 — fully PD.
- **"Song at Midnight"** / **"Man, the Master"** poem, *The Phantagraph*
  Aug 1940 — fully PD (posthumous).

*Weird Tales 1929–1930 non-renewal:*
- **"The Shadow Kingdom"** *Weird Tales* Aug 1929 — fully PD. Thurian Age.
- **"The Mirrors of Tuzun Thune"** *Weird Tales* Sept 1929 — fully PD. Thurian Age.
- **"Kings of the Night"** *Weird Tales* Nov 1930 — fully PD. Thurian Age.

*Weird Tales 1934–1936 non-renewal (project-adopted 2026-04-30):*
- **"Iron Shadows in the Moon"** (Apr 1934)
- **"Queen of the Black Coast"** (May 1934) — Bêlit, Yag-Kosha (as
  encountered in this story)
- **"The Haunter of the Ring"** (Jun 1934) — Conrad & Kirowan
- **"The Devil in Iron"** (Aug 1934) — Khosatral Khel, Octavia
- **"The People of the Black Circle"** (Sep–Nov 1934) — Yasmina, Khemsa
- **"A Witch Shall Be Born"** (Dec 1934) — Salome, Taramis
- **"The Grisly Horror" / "Moon of Zambebwei"** (Feb 1935)
- **"Jewels of Gwahlur"** (Mar 1935) — Bît-Yakin, Muriela
- **"Beyond the Black River"** (May–Jun 1935) — Balthus, Slasher, Zogar Sag
- **"Shadows in Zamboula"** (Nov 1935) — Aram Baksh, Zabibi, Totrasmek
- **"The Hour of the Dragon"** (Dec 1935 – Apr 1936) — **Acheron, Xaltotun,
  Heart of Ahriman, Pelias** (now PD)
- **"Black Canaan"** (Jun 1936)
- **"Red Nails"** (Jul–Oct 1936) — Valeria, Tascela, Xuchotl
- **"Black Hound of Death"** (Nov 1936)
- **"The Fire of Asshurbanipal"** (Dec 1936)

**Trademark-radioactive terms (apply forever, regardless of PD status
of any underlying story):** "Conan," "Conan the Barbarian," "Cimmerian,"
"Cimmerians," "Cimmeria," "Hyboria," "Hyborian Age," "Hyborian" as a
marketing adjective. These are CPI / Cabinet / Heroic Signatures
trademarks (or project-designated brand-marker avoids); they do not
appear in player-facing pages, marketing, titles, meta tags, alt text,
or module prose **even when the underlying source story is PD**. The
player replaces Conan as protagonist in adventures derived from
Bucket A Conan-era stories — see [`ADVENTURE_MODULES_PLAN.md`](./ADVENTURE_MODULES_PLAN.md) §1.

**Still copyright-protected (Bucket B):** Pre-1934 Conan stories from
the 1932–1933 *Weird Tales* issues remain in Bucket B until either
(a) non-renewal is verified for those issues (would move them to
Bucket A early), or (b) the 95-year clock unlocks them (2028 / 2029).
Affected: *Phoenix on the Sword* (1932), *Scarlet Citadel* (1932),
*Tower of the Elephant* (1933), *Black Colossus* (1933), *Slithering
Shadow* (1933), *Pool of the Black One* (1933), *Rogues in the House*
(1933), and any unique elements introduced only in those stories. See
the Radioactive table below.

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
| "Robert E. Howard" | TM only in the United States | Avoid use pemanently in USA | Use is allowed if the browser IP is anywhere in the world, other than the USA |

#### Copyright-radioactive — Bucket B (1932–1933 stories pending non-renewal audit OR 2028–2029 unlock)

The 2026-04-30 PD expansion moved most Conan-story content into Bucket
A (see top-of-file PD corpus block). The remaining radioactive items
are the 1932–1933 *Weird Tales* Conan stories not yet covered by the
project's adopted non-renewal audit.

| Term | Source | Status |
|---|---|---|
| Conan (character, as a *named protagonist* in module prose / marketing) | All sources | **Trademark-radioactive forever** — see table above. Player replaces Conan as protagonist in adventures derived from Bucket A stories. |
| Thoth-Amon (as a named figure) | First major appearance *The Phoenix on the Sword* (1932) | 2028 (or sooner if 1932 *WT* non-renewal is confirmed) |
| Tarantia (Aquilonia's capital city, as a named place) | 1932–1933 Conan stories | 2028+ (or sooner if 1932/1933 *WT* non-renewal is confirmed). The kingdom Aquilonia itself is PD via the 1936 essay; only the capital-city name "Tarantia" is restricted. |
| *The Phoenix on the Sword* / *The Scarlet Citadel* (titles + plot) | *Weird Tales* 1932 | 2028 (or sooner) |
| *The Tower of the Elephant*, *Black Colossus*, *Rogues in the House*, *The Slithering Shadow*, *The Pool of the Black One* (titles + plot) | *Weird Tales* 1933 | 2029 (or sooner) |
| Yag-Kosha (named-figure first introduction) | *The Tower of the Elephant* (1933) | 2029 (or sooner). **Project working stance:** Yag-Kosha is treated as usable via the 1934 *Queen of the Black Coast* appearance (Bucket A) where the character is fully described — strict-reading defers until 1933 *WT* non-renewal confirmed. See [Public_Domain_Rules.md §6.2](./Public_Domain_Rules.md). |

#### Newly available (Bucket A, 2026-04-30 expansion)

The following terms moved from Copyright-radioactive to Safe Harbor on
2026-04-30 per the project's adopted non-renewal position for *Weird
Tales* 1934–1936 issues. Use is permitted in module prose, NPC names,
Chronicle entries, and lore docs — subject to the **trademark
restrictions above** (Conan / Cimmerian / Hyborian remain scrubbed
forever) and the **customization discipline** in [Public_Domain_Rules.md §4.4](./Public_Domain_Rules.md):

- **Bêlit, Yag-Kosha** (*Queen of the Black Coast*, 1934)
- **Olivia, Shah Amurath** (*Iron Shadows in the Moon*, 1934)
- **Khosatral Khel, Octavia, Jehungir Agha** (*The Devil in Iron*, 1934)
- **Yasmina, the Black Seers of Yimsha, Khemsa** (*The People of the Black Circle*, 1934)
- **Salome, Taramis, Constantius the Falcon, Krallides** (*A Witch Shall Be Born*, 1934)
- **Bît-Yakin, Muriela, Gwarunga** (*Jewels of Gwahlur*, 1935)
- **Balthus, Slasher, Valannus, Zogar Sag** (*Beyond the Black River*, 1935)
- **Aram Baksh, Zabibi, Totrasmek** (*Shadows in Zamboula*, 1935)
- **Acheron, Xaltotun, Heart of Ahriman, Pelias, Hadrathus, Zelata, Tarascus, Amalric, Valerius** (*The Hour of the Dragon*, 1935–1936)
- **Tascela, Valeria, Xuchotl, Olmec, Tolkemec, Techotl** (*Red Nails*, 1936)
- **Conrad, John Kirowan** (*The Haunter of the Ring*, 1934)
- **Adam Grimm, Bristol McGrath** (*The Grisly Horror / Moon of Zambebwei*, 1935)
- **Kirby Buckner, Saul Stark** (*Black Canaan*, 1936)
- **Kirby Garfield** (*Black Hound of Death*, 1936)
- **Yar Ali, Steve Clarney, Asshurbanipal** (*The Fire of Asshurbanipal*, 1936)

Settings / regions newly available: **Vendhya, Khauran, Vilayet Sea,
Black Coast, Zamboula, Xuchotl, Yimsha, Alkmeenon, Dagoth Hill, the
Pictish frontier east of the Black River.**

Per-module customization plans live in [`ADVENTURE_MODULES_PLAN.md`](./ADVENTURE_MODULES_PLAN.md).

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

> **Canonical reference moved to [SORCERY.md](./SORCERY.md) on 2026-04-29.** That file now holds the full content of the magic systems: Guild Magic (CAST), Occult Magic / Sorcery (INVOKE), The Order, the Eight Reagents, and the Eight Circles of Occult Magic with all spells, Words of Power, and per-circle Illumination cost. **Update SORCERY.md, not this section, for any future magic-system changes.**
>
> The summary below is preserved as a quick orientation. For full text — including all 64 spells across the Eight Circles — see SORCERY.md.

**At a glance:**
- **CAST** = Guild Magic. Legal, no reagents, weak (~½ Circle-1 power). 4 spells: BLAST, HEAL, LIGHT, SPEED.
- **INVOKE** = Occult Sorcery. Forbidden, reagent-required, 8 Circles of escalating power. Witnessed casting attracts The Order.
- **Eight Reagents:** Black Pearl, Blood Moss, Garlic, Ginseng, Mandrake Root, Nightshade, Spider's Silk, Sulfurous Ash.
- **Soul cost:** Circles 1–3 only narrative warnings; Circles 4+ darken Illumination logarithmically (per §11 + SORCERY.md §7).

The full spell tables, Words of Power, reagent lists, and lore on The Order live in [SORCERY.md](./SORCERY.md).

---

## 10. Thurian Age Lore — The Foundational Setting

Living Eamon is set in **Robert E. Howard's Thurian Age — the
pre-Cataclysmic epoch** of Howard's mythos. This is not generic
fantasy. **All future adventures, story modules, Occult magic,
monsters, enemies, and magical-item back-stories must descend
from this canon** — either adapted directly from Howard's
public-domain Thurian works, or invented in his voice and fitted
to his geography and chronology.

> **Setting decision (2026-04-28):** Living Eamon's present is
> the Thurian Age, *before* the great Cataclysm. The Hyborian
> Age (Conan-era) is in our **future**, not our past — its
> kingdoms have not yet risen. This is both an IP-safety choice
> (Thurian-Age PD corpus is unambiguous; Hyborian/Aquilonia/
> Cimmeria are trademark-radioactive) and a creative one: it
> lets us write derivative Thurian stories that build on the
> three PD Kull short stories without colliding with copyrighted
> Conan material.

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

The Thurian Age sits roughly **before the sinking of Atlantis
and the rise of the kingdoms that would, in some far future,
become known as the Hyborian Age** — Howard placed the Cataclysm
~12,000–10,000 BC, and the Thurian world above it some thousands
of years earlier. It is a world of pre-human stonework and
serpent-haunted courts; of seven kingdoms held precariously
together against shapeshifting infiltration; of guttering torches
in chambers that should not stand and oaths sworn on names older
than the human voice. The dominant power is **Valusia**, the
decadent jewel of the Thurian kingdoms; **Atlantis** rises as a
barbarian island far to the west; the **Picts** hold the
wilderness; the **Lemurians** brood across the eastern sea. The
Cataclysm has not yet come — but it is gathering. Magic exists,
is feared, and is policed by The Order. Heroes are mortal; the
universe is indifferent; and the world will end within a few
generations whether anyone is ready or not.

All kingdom names above are PD-safe via the *Hyborian Age* essay
(1936, non-renewed) and the three Thurian-Age Kull short stories.

---

### 10.2 The Thurian Age — Our Present

The **Thurian Age** is the player's present. It is exceptionally
well-suited to Living Eamon because **three Thurian-Age short
stories by Howard are fully public domain** (see
`Public_Domain_Rules.md` §5): *The Shadow Kingdom*, *The Mirrors
of Tuzun Thune*, and *Kings of the Night*. These give us **named
characters, named places, named magical phenomena, and named
races** that we can use freely as living, breathing elements of
the player's world — not as crumbled ruins.

**PD-safe Thurian elements (use freely as living, present-tense
content):**

- **Valusia** — the decadent serpent-haunted empire; the dominant
  human civilization of the present, corrupted by Serpent-Men
  infiltration. Its courts are intrigue-thick; its temples ancient
  but in active use.
- **Atlantis** — the barbarian island home of Kull. Still standing.
  The Cataclysm that will sink it has not yet come.
- **Kull of Atlantis** — the barbarian who became king of Valusia.
  Active, alive, possibly the player's contemporary or recent
  predecessor (timeline flexibility — keep him offstage or briefly
  on-stage as the modules require).
- **Tuzun Thune** — the ancient Valusian wizard whose **mirror
  chamber** showed visions of alternate realities. He is dead by
  Kull's time per the source story; his tower is sealed; the
  mirrors are findable artifacts.
- **Bran Mak Morn** — by Howard's mythos, Bran's name reaches
  back across eras through ritual time-bridges. Pictish shamans of
  the Thurian present still invoke him as a future-king prophecy.
- **Serpent Men** — the **active** shapeshifting threat. They
  ruled the world before humans; in the Thurian present they
  infiltrate human courts by mimicking faces. The exposure phrase
  *"Ka nama kaa lajerama"* (PD via *The Shadow Kingdom*) is
  current operational counter-intelligence, not lost lore.
- **The Cataclysm** — the great sundering that *will* sink
  Atlantis, drown Valusia, and end the Thurian Age. The Order
  knows it is coming. Most others do not.

**Thurian Aesthetic.** Ancient stonework that the people of this
age live and rule among (not crumbled — *occupied*). Stepped
pyramids and serpent-columns. Mirror chambers. Pre-human geometry
that doesn't quite fit the human eye. Frazetta's most weathered
ruins are still our setting's *modern* civic architecture, just
weathered after thousands of years of use.

---

### 10.2a The Earlier Civilization — Pre-Thurian Ruins

**There is always an earlier civilization.** Even the Thurian Age
is built atop the buried bones of an older one — the **Pre-Thurian
Builders**, whose names are not preserved in the PD corpus and so
remain ours to invent. Their works appear as:

- **Pre-human geometry** in the deepest substrata of Valusian
  temples — angles and proportions that human masonry adopts
  but does not understand.
- **Stones that predate language** — inscriptions in scripts
  before script, marked with marks Kull's wisest scholars cannot
  read.
- **Sealed crypts beneath Valusia, Atlantis, and the eastern
  sea-trenches** — most never opened, many deliberately buried by
  the Order to prevent rediscovery.
- **Whispers in the deepest mirror-chambers** suggesting that
  Tuzun Thune himself learned his craft from older sources.

Adventures that explore Pre-Thurian ruins follow the same
template-shape as Thurian-ruin modules in the Hyborian-era plan
(see `lore/hyborian-pd/MODULE_PLAN.md` §3, "Setting from Thurian
present → Thurian ruin in Hyborian present" — re-rooted for our
era as "Thurian present → Pre-Thurian ruin in Thurian present"):
the player walks current corridors that lead down into chambers
no living mind has read since before the human age.

**The recursive principle:** Whatever the Pre-Thurians feared,
they buried. Whatever they buried, the Order is afraid will be
unburied. Whatever the player unburies, the Order will come for.

This is also our designer-side trapdoor for new adventure
content: any module set in the Thurian present can credibly
descend into a "Pre-Thurian" sub-region without requiring more
PD source material than we already have.

---

### 10.3 The Serpent-Men — The Living Threat

In the Thurian present, **Serpent-Men are an active,
shapeshifting infiltration**, not a relic. They ruled the world
before humans (per *The Shadow Kingdom*, 1929, PD), most were
driven out at the rise of human civilization, and a population
of survivors persists in deep places — and in human courts,
wearing the faces of dead nobles.

The exposure phrase **"Ka nama kaa lajerama"** (PD via *The
Shadow Kingdom*) is operational counter-intelligence in this era,
not lost lore: it is a current Order tool. Watch faces when the
phrase is spoken. Anyone who cannot say it back is not human.

**Game implication:** any Thurian-court adventure (including
investigation modules, court-intrigue mysteries, and any
encounter where a once-trusted NPC has become a stranger) can
seed a Serpent-Man reveal. Serpent-Men make excellent body-zone combat model
opponents — agile, fast, poison-fanged. They are the natural
living antagonists of the Thurian setting, and unlike post-
Cataclysmic Stygia (which does not yet exist in our era) they
can appear *anywhere* a human can — including at the next table
in the Main Hall.

> **Stygia in our era:** The southern serpent-god-worshipping
> kingdom of Stygia, prominent in the post-Cataclysmic Hyborian
> Age, **does not yet exist** in the Thurian present. Stygia and
> the cult of Set rise after the Cataclysm, drawing on Thurian
> serpent-magic that survived the sundering. We can foreshadow
> the future cult through Serpent-Man oaths to "the Old Coiled
> One," but Set and Stygia themselves are not period-appropriate
> for the player's current era.

---

### 10.4 Ostavar and the Thurian Kingdoms

**Ostavar — the player's starting hub** — is a Living-Eamon-
invented Thurian-Age city. **Visually it is styled after Howard's
late-Aquilonian civic architecture** — marble colonnades, gilt
towers, silk banners, Frazetta/Brom palace and temple interiors —
even though the in-fiction era is the Thurian Age, thousands of
years before Aquilonia rises. Visual styles are immortal:
marble cities look like marble cities whether they stand in
Valusia or Aquilonia, and Howard's architectural language is the
designed-from-the-start tonal anchor for Ostavar's civic
buildings. Players will never read the word "Aquilonia" in-game,
but the art will continue to read late-Aquilonian.

**Tone for Ostavar is "aquilonian"** in the scene-image system —
this is an art-prompt reference, not an in-fiction location tag.
Continue using "Aquilonian style" / "Hyborian style" / "Frazetta
palace" / "Brom temple" freely in image-generation prompts and
internal design docs; just keep those words out of player-facing
prose, NPC dialogue, marketing copy, and any signage/UI the
player reads.

When future modules introduce other regions, use these
era-appropriate in-fiction names paired with Howard-derived
visual styles:
- **Ostavar (Thurian-era city)** → late-Aquilonian visual style:
  marble, gilt, civilized, Frazetta palace, Brom temple-interior
- **Valusia** (in-fiction the great Thurian empire) → ancient
  mottled marble, serpent-columns, brass and bronze, late-imperial
  decadence; visually overlaps Aquilonian palace style with darker
  serpent-iconography accents
- **Atlantis** → barbarian island stronghold, weathered stone
  fortresses, sea-rock and longboats — Kull's homeland, wilder
  than Valusia
- **Pictish Wilderness** → standing stones, dark forest, ritual
  fires, Bran Mak Morn's prophesied heritage
- **Thurian frontier kingdoms** (Commoria, Grondar, Kamelia,
  Thule, Verulia — all named in the *Hyborian Age* essay, all
  PD-safe in the Thurian present): each gets its own flavor when
  needed; freely invent specifics within Howard's voice
- **Pre-Thurian ruins** → pre-human stonework, geometry that
  doesn't fit the human eye, sealed crypts older than language
  (the recursive earlier-civilization layer)

> **Hyborian-era kingdoms are FUTURE prophecy IN-FICTION but their
> visual styles are present-day art references.** Aquilonia,
> Stygia, Cimmeria, Nemedia, the Black Kingdoms — all PD-safe via
> the *Hyborian Age* essay — do not yet exist as places in the
> player's Thurian Age. The Order's secret chronicles foretell
> these kingdoms; some Thurian seers glimpse them in mirror
> visions. The player cannot travel to them. **But their visual
> aesthetics — Aquilonian marble, Stygian black basalt, Pictish
> standing stones — are usable as art-prompt references whenever
> the in-fiction Thurian setting needs that visual flavor.**

---

### 10.5 Tuzun Thune and the Mirror Chambers — The Template Artifact

**Tuzun Thune** was an ancient Valusian wizard whose tower
contained a chamber of mirrors that showed visions of alternate
realities. From "The Mirrors of Tuzun Thune" (1929, PD): when
Kull stared into the mirrors he saw himself living different
lives, considered which was real, and almost lost himself to the
visions.

In the Thurian present Tuzun Thune is recently dead (per the
source story, his death is contemporaneous with Kull's reign);
his tower stands sealed; his mirrors persist and can be entered
by adventurers willing to risk the visions.

**This is the template for Living Eamon's permanent legacy
artifacts.** Future modules should design artifacts in this mould:

- **Discovered in Thurian or Pre-Thurian ruins** (sealed towers,
  buried temples, mirror-chambers, time-tombs)
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

## 11. PICSSI — The Six-Virtue Character Scoring System

*Pronounced "Pixy." Ratified 2026-04-26.*

PICSSI is Living Eamon's multi-dimensional scoring framework for the player's character. It does not replace traditional combat stats (Strength, Dexterity, Constitution, etc.) — those still drive damage rolls, encumbrance, and saves. PICSSI sits *above* those mechanics and shapes how the world reacts: which NPCs flirt with the hero, which gods listen to his prayers, which quests will accept him, which dark patrons answer his INVOKE spells. It is the social and metaphysical state of the character. It is the core scoring system of the game and attracts followers of similar tendencies, the more extreme the score, the more extreme the followers scores. The goal is to attract an end game Band of Heros or Band of Villans over which to become a Lord with a title and land, ie a dark lord might be called "Lord Vard the Destroyer" or "...the Feared" and a highly illuminated Lord might be called "Lord Cedric the Lightbringer" and the opposite would be "Lord Elric the Dark Lord." We will need to prescript multi-dimensional titles for each of the extreme scores.

The acronym is the six dimensions, scored independently. Each dimension runs from a deeply negative pole (vice / void) to a peak positive pole (virtue / fullness), with midline as moral neutrality on that axis.

### P — Passion

Fervor, drive, energy, eagerness, inner fire. Visible in *how* the hero pursues goals, faces challenges, and expresses desire. This is directly related to the physical attribute, strength. The higher the Passion virtue, the higher the Strength attribute. **Attracts passionate women.**

- **Gain**: bold pursuits, declarations of intent, choosing decisively, loud and dramatic acts, decisive action, picking fights, taking women, getting high or drunk, kissing women, fondling women, having sex (R rated game).
- **Lose**: hesitation, indecision, listless drifting, half-measures, getting lost, slow action, abandoning quests partway out of boredom.

### I — Integrity

The literal keeping of one's word. The ultimate goal of integrity is keeping promises to the letter — to others *and* to oneself ("to thine own self be true"). When circumstances make a promise unkeepable, integrity is preserved by either asking forgiveness or being transparent in one's failure — never by quiet evasion. **Attracts wise women.**
*Direct link to physical attribute Hit Points. The more Integrity the more maximum Hit Points.*

- **Gain**: completing committed quests on time, keeping vows, paying debts, returning rescued items, owning up to failures publicly.
- **Lose**: breaking promises, concealing failures, lying to NPCs, abandoning declared goals without acknowledgment.

### C — Courage

Passion in the face of danger. Courage scales with the apparent overwhelming-ness of opposition: the more impossibly out-matched the hero looks when he engages, the more courage he earns. **Attracts romantic women.** *Direct link to physical attribute Dexterity. The more Courage the more maximum Dexterity.*

- **Gain**: engaging unbeatable-looking odds, refusing to flee from monstrous threats, protecting weaker against stronger, accepting trial-by-combat against superior foes.
- **Lose**: fleeing during combat (a major loss), abandoning allies in danger (worse than fleeing is fleeing while friends are still in combat), attacking only when victory is certain, refusing trials.

### S — Standing

Visible standing, winning, victory, masculinity, virility — the triumphant body. (Renamed 2026-04-28 from "Strength" to disambiguate from the physical STR attribute.) Note: this is the *narrative-virtue* dimension of public stature, not the combat stat. A weak hero who improbably wins still gains Standing here. A strong hero who loses still loses Standing here. **Attracts lusty women.** *Increases chance of legendary magic weapons appearing in treasure and loot.*

- **Gain**: combat victories (especially decisive ones), feats of physical power, visible domination over physical challenges, public displays of vigor.
- **Lose**: combat defeats, public displays of weakness, illness, public humiliation, being subdued without resistance.

### S — Spirituality

Respect for and an internal sense of the spiritual; praying to a god even when it seems hopeless. The **Conan-Crom paradigm** is canonical here: Crom only cares about *witnessing* his hero's strength and courage in the face of hopelessness, and never overtly intervenes with magic during battle — but he blesses successful heroes after the fact with wine, women, song, and treasure. The praying itself is the virtue, not the answer but is  (and maybe whimsically) honored by the gods. **Attracts spiritual women.** *Increases chance of gods responding to Power spell & increases chance of quests from gods & increases power of heal spell.* *Direct link to physical attributes, the more Spirituality, the faster Mana regenerates."

- **Gain**: praying (regardless of outcome), respecting shrines and holy ground, conducting oneself as if observed by gods, leaving offerings.
- **Lose**: blasphemy, defiling sacred sites, mocking priests, dismissing oaths sworn to gods, performing sorcery on consecrated ground.

### I — Illumination

The amount of Light inside the hero's self. **Light** is the source of Life and Creation; **Darkness** is the source of Death and Destruction. The Way of the Warrior is, by nature, partly death and destruction — but *defending* Light-Life by *using* the tools of Destruction is a beautiful quest, and one of the most illuminating things a warrior can do.
*Direct link to physical attribute Mana. The more Illumination the more maximum Mana.*

Conan was mostly negative in Illumination — a casual brigand and reaver — but had great moments of Illuminative power: killing demons, killing sorcerers, saving innocents. Those acts pulled him toward Light without making him saintly. Conversely, **practicing powerful sorcery directly darkens the soul** — the more powerful the sorcery, the darker the Illumination in a longrithmic relationship (ie 1-3 circle sorcery have no effect on illumination but 2nd Circle Sorcery comes with an occassional message tells the hero this feels dark in subtle ways, and 3rd circle confirms a dark presence is near)  *cross-link to §9.2 Occult Magic and the Eight Circles).*

Illumination is the only PICSSI dimension that **attracts at both extremes**: saintly Illumination calls to both saintly women and abyssal women (to tempt you to the darkness); abyssal Darkness calls to both abyssal women and saintly women (to tempt you to the light); midline attracts no one along this axis. (Romance with mid-axis NPCs flows through the other five dimensions.)

- **Gain Light**: killing beings of darkness (demons, undead, sorcerers, dark cults), saving innocent lives, healing the helpless, restoring desecrated holy sites.
- **Gain Darkness**: practicing sorcery (every INVOKE casting), killing innocents, sacrificing the helpless, defiling holy sites, performing necromancy.
- The two are NOT a single zero-sum slider — a hero who heals an orphanage in the morning and casts INVOKE at night accumulates BOTH Light gain and Darkness gain, and the scoring weighs the absolute distance from midline. Saints and demons are equally "Illuminated"; the bored midline is the lowest social-status state.

### How PICSSI scores affect gameplay

| System | PICSSI input |
|--|--|
| **NPC dialogue / romance** | female NPCs weigh the player's PICSSI scores when choosing flirtation, marriage offers, betrayals, rescue offers. The dimension that attracts them dictates which axis they read. |
| **Prayer reach** (CAST) | low-Illumination heroes find that only dark gods answer their prayers; high-Illumination heroes find that bright gods answer. Mid-Illumination heroes get inconsistent or weak answers. |
| **Sorcery cost** (INVOKE) | every casting darkens Illumination. Compounding: lower Illumination → wider door for Outer Dark gods to answer further INVOKE attempts. The Eight Circles thus become darker AND more powerful as the hero descends. |
| **Quest gating** | attributes and virtues lock adventure modules and even magical doors in adventures and in temples and in magic rooms (like wizard and sorcery schools), integrity-locked quests refuse to launch for a hero who has broken too many prior promises this life. Courage-locked quests likewise check courage history. |
| **NPC trust thresholds** | shopkeepers, merchants, and quest-givers extend credit to high integrity heros / offer assassination, banditry and thuggery adventures to low-Integrity heroes. |

### PICSSI is per-life, not per-character

PICSSI scores are tracked across the **current life** of the Perpetual Hero. Death at the Church of Perpetual Life wipes them; the reborn hero starts at midline on every axis. This means every life is its own PICSSI arc, and the player's choices in *this* life dictate *this* life's reactions, prayer reach, and quest access.

### PICSSI replaces the Ultima-derived 10-virtue system (DECIDED 2026-04-26)

Living Eamon previously had a 10-virtue moral tracker on `PlayerState` (keys: `Honesty`, `Compassion`, `Valor`, `Justice`, `Sacrifice`, `Honor`, `Spirituality`, `Humility`, `Grace`, `Mercy` — Ultima-derived). **PICSSI replaces it entirely.** The 10-virtue model is deprecated; new code reads/writes PICSSI scores only.

**Why:** the 10-virtue model was a *moral ledger* (each virtue tracked behavior consistency in isolation). PICSSI is a *behavioral consequence engine* (each dimension drives NPC reactions, prayer reach, patron alignment). One system can do the second job; the first is redundant.

**Replacement scope (code + DB cleanup task — not yet started):**

- `PlayerState` shape: drop the 10 virtue keys (`Honesty`, `Compassion`, `Valor`, `Justice`, `Sacrifice`, `Honor`, `Spirituality`, `Humility`, `Grace`, `Mercy`). Add the 6 PICSSI keys (`Passion`, `Integrity`, `Courage`, `Standing`, `Spirituality`, `Illumination`).
- Database: migrate the existing `player_state.virtues` JSON column (or equivalent) to a `player_state.picssi` column with the new schema. Existing live players will reset to midline on first load post-migration (no per-axis mapping — the systems aren't isomorphic).
- `STATS` panel UI: replace the 10-virtue list with a PICSSI panel showing the 6 dimensions and their current values.
- `CLAUDE_CONTEXT.md` §6 Player State: update to reflect PICSSI as the single virtue model.
- Any narrative text that says "your Honesty virtue increased" rewrites to PICSSI ("your Integrity rose").

**Lossy axes to acknowledge in the rewrite:** the 10-virtue keys `Compassion`, `Justice`, `Sacrifice`, `Humility`, `Grace`, `Mercy` have no direct PICSSI counterpart and disappear. Their game-mechanical effect (NPC reactions to charitable behavior, etc.) folds into PICSSI's `Illumination` dimension at design time, not via code mapping.

### Other open design questions (deferred)

- Should some virtues persist as faint "echoes" across lives — e.g., a hero who lived ten high-Integrity lives has a small Integrity-bias on rebirth?
- Should a hero who dies mid-quest with extreme PICSSI scores leave behind ghostly NPCs / world reactions referencing that prior incarnation?
- Should there be PICSSI-driven legacy flags in the world cache (cross-link to existing legacy-flag memory)?

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

**Expanded Equipment Slots (body-zone combat-aligned):**
- Current: weapon, shield, helmet, gorget, bodyArmor, limbArmor (6)
- Adding: **2 ring slots per hand** (4 ring slots total),
  **necklace/medallion** (1 slot), **waist/belt with pouches**
  (1 slot).
- Total: 12 slots. Research body-zone `.rpy` files for exact slot
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

### Brothels, the Fertility Temple, and Venereal Disease *(Phase 2)*

*Decided 2026-04-29.* Brothels exist in Living Eamon as one of the canonical Passion-growing rest activities (see KARMA_SYSTEM.md §2.3 and §2.13a). They are also one of the few activities that simultaneously grow one PICSSI virtue and damage another — and one of two activities (alongside CAST HEAL) that interact with the body-state flag `vdActive`.

**Brothel mechanics:**

- **Cost:** gold (default 45g; Vivian-discount possible if affection is high; "Casanova"-style talents may waive cost).
- **Stamina:** full restore (`stamina = maxStamina`).
- **Fatigue:** complete reset (`fatiguePool = 0`).
- **PICSSI:** +Passion (Notable). Minor +Courage (real risk-of-thieves/VD justifies a small Courage award per Scotch's note that "women can be scary thieves and assassins, and venereal diseases definitely are").
- **Side effects:**
  - **−Spirituality** (Notable). The act is read as appetite over devotion.
  - **Small chance** (proposed: 5–10%, tunable) of contracting **venereal disease** (`vdActive = true`).

**Venereal Disease (VD):**

- Persistent body-state boolean: `vdActive`. Survives sleep/rest. **Reset on death.**
- While `vdActive = true`: −2 STR_effective (proposed magnitude — see KARMA_SYSTEM.md §2.13a). Floors at minimum playable STR.
- One VD at a time (no stacking).

**Cure paths:**

1. **Cast HEAL on self** (either CAST or INVOKE) → cures VD instantly.
2. **Pray at any temple** → small chance the god responds and cures (chance scales with Spirituality).
3. **Pray at the Fertility Temple** → CANONICAL HIGH chance to cure. The fertility-god's domain explicitly includes diseases of generation; the temple is the textbook destination.

**The Fertility Temple paradox** *(canonical)*:

The Temple of the Fertility God in Ostavar (and analogous temples in other Thurian-Age cities) is, in the same building:

- The most popular **brothel** in the city — the temple's "sacred prostitutes" are dancers, courtesans, and ritual partners. Visiting here = brothel rest activity (Passion +, Spirituality −, VD risk).
- The most effective **cure** for venereal disease in the city — praying at the fertility-god's altar has the highest chance of removing `vdActive`.

A hero who contracts VD at the temple and then prays at the same altar to be cured is participating in a deeply ironic ritual. NPCs may comment on it. Priests of austere gods will not.

**Atom themes:** brothel-choice scenes; "morning regret" check-ins; fertility-god prayer scenes; cure-quest atoms; rumor/gossip about heroes who frequent the fertility temple "for both reasons."

**Implementation status:** designed, not yet wired. Lives downstream of:
- Stamina system (KARMA_SYSTEM.md Sprint 1).
- PICSSI bedrock (KARMA_SYSTEM.md Sprint 2).
- Activity dispatcher (KARMA_SYSTEM.md Sprint 3).

The `vd_active` boolean column on `players` is added in Sprint 2 alongside the PICSSI columns. Brothel and fertility-temple as recovery activities ship in Sprint 3.

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
### 20.1 Deprecated
---

### 20.2 Deprecated

---

### 20.3 Deprecated

---

### 20.4 Jane Personalization Injection

Each session, Jane receives a personalization block built from the Reader's Mirror

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

### 20.7 Deprecated

---

### 20.8 Deprecated

---

### 20.9 Deprecated

---

## 21. Deprecated