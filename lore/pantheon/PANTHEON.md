# The Pantheon — Living Eamon canonical deities

Single source of truth for which gods exist in the Living Eamon cosmos, who they are, and how they relate to Ma'at and to one another. Used by:

- The `deity` room tag on consecrated rooms (`SORCERY.md §9.2`).
- Per-spell sprint dispatchers that branch on patron deity (Sprint 7b.B Bless, Sprint 7b.R Resurrection, etc.).
- NPC dialogue + quest gating that depends on which god a character serves.
- Jane / narrator lore-lookups when the player asks "tell me about [god]."

**All gods named here are public-domain by virtue of antiquity.** The Egyptian deities predate the modern copyright era by ~5000 years; Mithras is Roman/Persian and equally PD; Crom is a Howard-PD anchor with explicit care taken (no Cimmerian framing — see entry).

---

## The cosmological frame

**Ma'at = BEING.** The principle of Order, Truth, and Rightness. Everything that IS exists within her domain. The other gods serve her when aligned; they slip toward Isfet when corrupted.

**Outer Dark / Isfet = UN-BEING.** Not a deity, not a faction. The entropic Nothing that grows when imagination collapses, when names are forgotten, when meaning is abandoned. Closing section of this document.

**The Light/Dark continuum** (per `SORCERY.md §7.1`) operates *within* Ma'at's domain. Both Light (creation) and Dark (destruction) are Being-acts; both push back against Outer Dark by simply existing. Gods of every domain — even Set, even Sekhmet — are aligned with Ma'at against the void.

---

## Ma'at — Truth, Order, Rightness

```yaml
id: maat
domain: [order, truth, balance, justice, the-feather]
alignment: light
peoples: [universal — every just civilization, every age]
worship_marker: ostrich-feather upon the altar
provenance: Egyptian mythology (PD, pre-Howard by ~3500 years)
cross_tags: [hall-of-two-truths, weighing-of-the-heart, the-order, sprint-7c]
```

Ma'at is not first among the gods by ranking — she is the principle by which any god *is* a god. The feather she wears is the unit of measure against which the heart of the dead is weighed in the Hall of Two Truths; if the heart is lighter than her feather (or even equal), the soul passes onward; if heavier, weighed down by Isfet, Ammit devours it.

In Living Eamon she is **pilot of the Solar Barque** Mesektet on its nightly war-voyage, and pilot of the Mandjet on its daily science-circuit. Her hand at the tiller holds the cosmos to its course. The Ma'atic Order — externally called *The Order* (`SORCERY.md`) — exists to record what she measures, witness what she weighs, and uphold the doctrine that **observation sustains Being.**

Etymological resonance: *matrix, matrimony, mathematics, matter, mother, Mary* — the `ma-` root saturates the human languages of measure and foundation.

---

## Ra — Sun, Kingship, Supreme Creator

```yaml
id: ra
domain: [sun, light, kingship, creation]
alignment: light
peoples: [Khemite priesthoods, sun-worshipping cultures]
worship_marker: solar disk + falcon
provenance: Egyptian mythology (PD)
cross_tags: [solar-barque, mandjet, mesektet]
```

Captain of the Solar Barque fleet. Each dawn he rides the Mandjet (the Day Barque, science vessel) across the heavens; each sunset he descends into the Duat aboard the Mesektet (the Night Barque, battleship) to fight Apep. The voyage has run since before there were stars to count it.

Ra is the light by which Ma'at sees what she weighs. His priests are scholars of the sun — astronomers, calendar-keepers, time-measurers. To swear *by Ra's eye* is to swear that the truth one speaks is as visible as noon.

---

## Thoth — Wisdom, Writing, Magic, Judgment

```yaml
id: thoth
domain: [wisdom, writing, magic, recording, judgment]
alignment: light
peoples: [scholars, scribes, sorcerers of the Order]
worship_marker: ibis-headed effigy + writing palette
provenance: Egyptian mythology (PD)
cross_tags: [solar-barque, scrolls-of-thoth, the-order, sorcery, sprint-7b.B]
```

**Navigator** of the Solar Barque. Where Ma'at pilots, Thoth charts the passage. He records every measurement she makes — and the Scrolls of Thoth (see `lore/scrolls-of-thoth/INDEX.md`) are pieces of his hand reaching back to mortal scholars across every age.

He is patron of the Ma'atic Order, of every sorcerer who treats the Words as instruments of truth rather than power, and of every scribe who refuses to write what they have not seen. Bless and Heal cast in temples consecrated to Thoth carry his measure; the duration is longer because his recording extends the truth of the act.

---

## Shu — Air, Light, the Separator

```yaml
id: shu
domain: [air, light, the-sky-above, breath]
alignment: light
peoples: [breath-cults, high-altitude monasteries, mountain pilgrims]
worship_marker: feather (different from Ma'at's — wider, less symmetric)
provenance: Egyptian mythology (PD)
cross_tags: [breath, mountain-shrines]
```

Shu separated the sky from the earth at the world's first morning, and holds the gap between them with his shoulders to this day. To breathe is to participate in his act. Mountaintop shrines are dedicated to him; pilgrimages there are said to lengthen life by drawing breath closer to its source.

---

## Anubis — Embalming, Judgment of the Dead

```yaml
id: anubis
domain: [embalming, funeral-rites, judgment-of-the-dead, threshold]
alignment: neutral
peoples: [embalmers, mortuary priests, funeral-keepers]
worship_marker: jackal-headed effigy on the altar
provenance: Egyptian mythology (PD)
cross_tags: [funeral-rites, sprint-7b.R, bury, burn]
```

Patron of the threshold between life and the Hall of Two Truths. Anubis-priests preside over funerals; they wash the body, recite the passage-words, and place the dead within the earth or upon the pyre. Sprint 7b.R wires the BURY and BURN commands; both invoke Anubis whether the hero names him or not.

To despoil a grave under Anubis's watch is one of the heaviest violations of Ma'at — see Oath 39.

---

## Isis — Healing, Magic, Motherhood, Queen of Heaven

```yaml
id: isis
domain: [healing, magic, motherhood, sorrow, devotion]
alignment: light
peoples: [healers, midwives, mourners, devoted lovers]
worship_marker: throne-headdress; ankh held aloft
provenance: Egyptian mythology (PD)
cross_tags: [healing, devotion, sprint-7b.B, §11-Passion]
```

Wife of Osiris, mother of Horus, sorrow-keeper of the world. When Set slew her husband and scattered him across the land, she gathered every piece and reassembled him — that act is the mythological root of every healing-spell ever cast. Cure, Heal, and Greater Heal cast on consecrated Isis-ground draw on her devotion; the spells reach further when the caster's heart is wounded.

To swear *by Isis* is to swear by love that endures past death.

---

## Osiris — Death, Resurrection, Afterlife King

```yaml
id: osiris
domain: [death, resurrection, the-afterlife, the-rebirth-cycle]
alignment: neutral
peoples: [those who would be reborn; those who tend the grain]
worship_marker: crook-and-flail; green-skinned mummy effigy
provenance: Egyptian mythology (PD)
cross_tags: [resurrection, sprint-7b.R, §9.3, the-rebirth-cycle]
```

The slain god who returned. Murdered by Set, resurrected by Isis, made king of the afterlife. Patron of the Resurrection spell (`SORCERY.md §9.3`) and of every grain that dies in autumn to rise again in spring. To call on Osiris is to call on the cycle that does not end.

His worshippers tend the rebirth-cycle in mortals and in fields alike; many are farmers and many are funeral-priests, the two callings being one in his eyes.

---

## Sekhmet — War, Plague, Scorching Heat

```yaml
id: sekhmet
domain: [war, plague, vengeance, the-burning-sun]
alignment: dark
peoples: [warriors, plague-healers, those who have been wronged]
worship_marker: lioness-headed effigy with sun-disk; copper or red bronze
provenance: Egyptian mythology (PD)
cross_tags: [war, plague, justified-violence]
```

The lioness-goddess. Daughter of Ra. When the world rebelled against Ra in the first age, Sekhmet was loosed against it; she would have unmade humanity entirely had Ra not tricked her into drinking beer dyed red as blood, after which she slept. Her priests are warriors and plague-healers — the same priesthood, since both serve the principle that *destruction in service of order is itself Ma'atic.*

She is Dark-aligned (per §7.1) but not anti-Ma'at. Slaying a daemon is a Sekhmet-act. Vengeance for the wronged is a Sekhmet-act. Cruelty for its own sake is *not* — and Sekhmet's priests will refuse the petition of one who confuses the two.

---

## Set — Storm, Chaos, Darkness Personified

```yaml
id: set
domain: [storm, desert, chaos, foreigners, betrayal, the-night]
alignment: dark
peoples: [desert-tribes, exiles, betrayed-and-bitter; rarely worshipped openly in just lands]
worship_marker: the Set-animal (long-snouted, forked tail); red ochre
provenance: Egyptian mythology (PD)
cross_tags: [darkness, the-mesektet, intramural-foe, outer-dark-ally]
```

The most complex god of the pantheon. Set is **the Darkness** of §7.1 personified — destruction, betrayal, the storm that wrecks the harvest, the brother who murders his brother. He slew Osiris and scattered him; the gods war against him most days.

**And yet** — when the Mesektet descends into the Duat each night to fight Apep, Set fights aboard her, beside the same gods he rivals by day. Darkness within Ma'at unites with the rest of the pantheon when Outer Dark threatens. Of all the gods, Set understands best that intramural enemies remain co-defenders against the void.

To call on Set is risky — he answers, and his answer is rarely the one you wanted, but rarely the one your enemy wanted either.

---

## Mithras — Light, Contracts, the Bull-Slaying

```yaml
id: mithras
domain: [light, contracts, oaths, soldiers, the-bull-slaying]
alignment: light
peoples: [soldiers, oath-bound brotherhoods, mystery-cult initiates]
worship_marker: the tauroctony — Mithras slaying the cosmic bull; cave-altars
provenance: Roman / Persian (Mithra/Mithras), PD by antiquity
cross_tags: [oaths, soldiers, contracts, hidden-shrines]
```

A Roman/Persian deity who came to Living Eamon's world with the contracts of soldiers. His mysteries are sworn in caves; his initiates form bonded brotherhoods that hold across battles and across borders. He is the god of *the oath that holds*, of *the contract spoken in honest light*, of *the bull slain to renew the world.*

To break a Mithraic oath is harder than to break a common one — and the price of breaking is paid in Standing and in Integrity, not just in coin.

---

## Crom — The Distant Witness

```yaml
id: crom
domain: [strength, courage, witness, the-cold-north, the-silent-god]
alignment: light
peoples: [northern hill-clans; highland warriors of the cold reaches]
worship_marker: a great stone, an axe driven into a tree, or simply a high place
provenance: Howard, *The Hyborian Age* (1936, PD)
cross_tags: [§11-Spirituality, the-conan-crom-paradigm, witness-not-intervene]
```

The silent god of the high cold places. Crom is canon-distant — he watches his heroes' acts but does not intervene with magic in their hour of need. He grants strength at birth; he asks the use of it. To pray to Crom *when it seems hopeless* is itself the act that pleases him; the answer, if any, comes after the battle is won, in the form of wine and women and treasure.

This is **the canonical Conan-Crom paradigm** of `GAME_DESIGN.md §11`. Heroes who pray under impossible odds gain Spirituality whether the prayer is answered or not — Crom is the patron of that mechanic.

*PD provenance note: Crom-the-name is essay-PD per `Public_Domain_Rules.md`. Crom's people are described as "northern hill-clans" and "highland warriors of the cold reaches" — deliberately not "Cimmerians," which is trademark-radioactive.*

---

## The Outer Dark — Isfet, Apep, The Nothing

The Outer Dark is **not a deity**. It has no priesthood, no altar, no faction, no agents within Being. It is included in this pantheon document because its absence shapes every god's mission.

**Isfet** is the Egyptian name. It means *chaos, falsehood, injustice* — but in Living Eamon canon, those are merely *aspects* of a deeper principle: **un-being.** Isfet is what is left when Ma'at withdraws — when the cosmos goes un-witnessed, un-named, un-recorded, un-imagined. It is the Nothing of *The Neverending Story:* not evil, *unmaking*. The void that grows when belief, story, meaning collapse.

**Apep** (also *Apophis*) is Isfet given form within Ma'at's domain — a chaos-serpent who attacks the Solar Barque each night. Because Apep has form, he can be fought. The crew of the Mesektet — gods of every domain, even Set — fight him together, every night, for eternity. They do not destroy him; Apep returns each dusk. But each night they hold the line, and so the sun rises again.

**The Nothing** is the deepest layer — Outer Dark itself, formless and beyond reach. It cannot be fought. It is *defied* by simply existing, naming, acting, telling stories. Saints push back against it. Daemons-within-Ma'at push back against it (yes — even daemons affirm Being by acting). What feeds the Nothing is *indifference, apathy, refusal-to-look* — the bored midline of §11 PICSSI is the Nothing-prone state.

When Sprint 7c lands the Outer Dark narrative consequences, low-Illumination heroes won't gain dark patrons — they will simply begin to *thin*: NPCs forget their names, reflections falter, effects on the world weaken. The void doesn't recruit; it erodes.

---

## Cross-references

- `SORCERY.md §7.1` — Light/Dark continuum within Ma'at's domain
- `SORCERY.md §7.2` — Two Forces (Force I = Creative, Force 0 = Destructive)
- `SORCERY.md §9.2` — `consecrated` + `deity` room tags
- `GAME_DESIGN.md §11` — PICSSI Illumination as karmic stock
- `lore/scrolls-of-thoth/INDEX.md` — Thoth's hand reaching back
- `lore/maatic-library/oaths-of-maat.md` — the 42 Oaths
- Project memory `project_maat_outer_dark_cosmology.md`
- Project memory `project_solar_barque_fleet.md`
- Project memory `project_observation_sustains_being.md`
- Project memory `project_segenhotep_maatic_order_leader.md`
