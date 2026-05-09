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
aliases: [valka]
alias_doctrine: >
  The Order of Ma'at recognizes Valka as the Atlantean name for Ma'at.
  Atlantean and Pictish PCs swearing "By Valka!" are invoking Ma'at by
  her older name. Order priests will gently correct the name in
  liturgical contexts; in adventure contexts the names are
  interchangeable for spell dispatch and consecrated-ground effects.
cross_tags: [hall-of-two-truths, weighing-of-the-heart, the-order, sprint-7c, alias-valka, valkyrie-host]
```

Ma'at is not first among the gods by ranking — she is the principle by which any god *is* a god. The feather she wears is the unit of measure against which the heart of the dead is weighed in the Hall of Two Truths; if the heart is lighter than her feather (or even equal), the soul passes onward; if heavier, weighed down by Isfet, Ammit devours it.

In Living Eamon she is **pilot of the Solar Barque** Mesektet on its nightly war-voyage, and pilot of the Mandjet on its daily science-circuit. Her hand at the tiller holds the cosmos to its course. The Ma'atic Order — externally called *The Order* (`SORCERY.md`) — exists to record what she measures, witness what she weighs, and uphold the doctrine that **observation sustains Being.**

Etymological resonance: *matrix, matrimony, mathematics, matter, mother, Mary* — the `ma-` root saturates the human languages of measure and foundation.

The Order preserves Ma'at's other names. **Valka** is what the Atlanteans came to call her once their cosmology grew large enough to recognize her station — the name compounds in their tongue as *lord of the Valkyrie*, the host of feminine warrior emanations who patrol the borders of all creation in her service. Through the Atlanteans the name spread to the Picts, the Valusians, and the Zarfhannians; she became the only deity those four peoples shared, the principle they all recognized as supreme regardless of which other gods they kept. The "lord-of" honorific gave her name a masculine cast in later pastiche translation; the Order knows the cast for an artifact of grammar and nothing more.

Older names from the same Pre-Cataclysmic Age belong to gods Ma'at served alongside. Sekhmet's warrior-aspect was called **Hotath** in his calmed face and **Helfara** in her raging face, where later Egyptian rite folded both into one name managed by the red-beer ritual. The threshold-god of battlefield deaths was **Helgor**, a name preserved alongside Anubis in the Order's funeral records. The hill-god of single combat and steel was **Honen**, who would later go silent and be called Crom.

The Order does not consider these names obsolete. Some — like Valka — are still spoken openly; some — like Honen — survive only in the records. To know them is to know how long Ma'at has been weighing hearts, and how many languages the feather has been measured in.

---

## The Valkyrie — Emanations of Ma'at, Defenders of the Borders of Creation

```yaml
id: the-valkyrie
type: emanations (not deities)
domain: [the-borders-of-creation, soul-gathering, perimeter-defense, the-valk-host, the-feathered-spear]
alignment: light
peoples: [invoked by warriors at the moment of death; named in Atlantean and Pictish battle-songs; remembered in the City of Wonders as Ma'at's reach]
worship_marker: an ostrich-feather (mirroring Ma'at's) bound to a spear-haft; never an altar of their own — their honor is given through Ma'at
provenance: Living Eamon canon (original synthesis; the valk- root is etymologically real-world but the cosmology is ours)
cross_tags: [maat-emanations, the-mesektet-perimeter, soul-gathering, valk-root, the-borders-of-being, sprint-7c]
```

The Valkyrie are not gods. They are **Ma'at**, in a manner the Hall of Two Truths cannot do alone — feminine warrior women, each a *soul shard* of her measure, sent outward to the edges of being. Ma'at sits at the still center where the heart is weighed. The Valkyrie ride the perimeter where Being meets the Outer Dark, and they do not let the perimeter break.

Their work is twofold. First, they **defend the borders of all creation** — alongside the Mesektet's crew but on its outer ring, the deck-guard against Apep's coils, the spear-line at the place where Isfet would otherwise enter. Apep is not the only thing that presses on that perimeter; lesser un-beings press too, and the Valkyrie meet them with feathered spears that the Outer Dark cannot consume because the spears are shards of Ma'at herself.

Second, they **gather the slain**. When a warrior falls in service to Ma'atic alignment — in just battle, in true defense, in the death that completes a worthy life — a Valkyrie comes for the soul. She does not weigh it; that is Ma'at's office. She carries it home. The Hall of Two Truths receives a soul that has been *escorted*, not one that has wandered. This is the deepest form of mercy in the cosmology: the Order teaches that the worst death is not painful death but *unwitnessed* death, the soul left to find its own way through what is no longer there. The Valkyrie ensure no Ma'atic-aligned death is unwitnessed.

The Atlantean name **Valka** — "lord of the Valkyrie" — is recognition of this office. To call Ma'at by that name is to call her by what she does at the edge of creation, not only by what she does at its center.

In Living Eamon gameplay, the Valkyrie are most likely to surface as:

- **Battlefield apparitions** — a winged shadow with a spear seen at the edge of vision after a just kill; never spoken to directly, never named in plain prose narration unless Jane judges the moment is right
- **Death-rite invocations** — "May the Valkyrie find you whole" is the standard battlefield blessing among Ma'atic warriors; appears in NPC dialogue
- **Resurrection-flow reframing** (Sprint 7b.R, Church of Perpetual Life) — for Ma'atic-aligned PCs, the death-passage may include a Valkyrie escort beat in the narration before the respawn fires
- **Quest hooks at the cosmological scale** — a Valkyrie wounded, lost, or captured means a hole in Ma'at's perimeter and Outer Dark pressure leaking through; this is high-tier endgame material, Sprint 7c-aligned

```yaml
narrative_rules:
  - The Valkyrie are never spoken of casually. NPCs name them only in battle-blessings,
    death-rites, or sworn oaths. Tavern banter does not include them.
  - Jane should not describe a Valkyrie's face. They are seen partially: a feathered
    spear-tip catching torchlight, the shadow of wings across a field, the weight of
    a presence that gathers and is gone.
  - PCs cannot pray to a specific Valkyrie. Prayers travel through Ma'at, who decides
    whether one is dispatched. ("Ma'at heard you, and one came.")
  - A Valkyrie is never killed. If overwhelmed, she withdraws; if her spear is broken,
    Ma'at re-tempers it. They are emanations, not lives.
  - The valk- etymology is in-world canon. Bards and scholars who notice the root in
    Atlantean and in northern hill-clan tongues are noticing something true.
```

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
aliases: [helgor]
alias_doctrine: >
  Helgor is the Atlantean name for the threshold-god of unprepared
  deaths — battlefield, shipwreck, fire. The Order of Ma'at considers
  Helgor's battlefield rite (jackal-tooth + pyre-ash) a complete
  passage-rite, equivalent to Anubis's tomb-rite. Spell dispatch
  treats them as one deity; consecrated battlefields are valid
  Anubis-ground for funeral-spells.
cross_tags: [funeral-rites, sprint-7b.R, bury, burn, alias-helgor, battlefield-rites]
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
aliases: [hotath, helfara]
dual_aspect:
  hotath:
    face: calmed
    domain_focus: [controlled-war, disciplined-violence]
    sprint_hook: force-zero-controlled
  helfara:
    face: raging
    domain_focus: [uncontrolled-destruction, plague, vengeance-without-stop]
    sprint_hook: force-zero-uncontrolled
alias_doctrine: >
  Sekhmet is one goddess; the Atlantean priesthood preserved her dual
  nature as two named faces (Hotath, Helfara) where Egyptian rite folded
  them into one name managed by the red-beer ritual. Spell dispatchers
  may branch on aspect: Hotath-invocation for controlled war-magic,
  Helfara-invocation for uncontrolled rage-magic. Combat magic pushed
  past safe limits "wakes the second face."
cross_tags: [war, plague, justified-violence, alias-hotath, alias-helfara, sekhmet-twin-face, the-red-beer-rite]
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
aliases: [the-serpent]
alias_doctrine: >
  The Serpent of pre-human Valusia is the same deity worshipped in
  post-Cataclysmic Stygia as Set. This is REH's own continuity, not
  Living Eamon retcon — see "The Hyborian Age" essay. The Order's
  forbidden archives preserve the older name; Stygian priesthoods
  have largely forgotten it. The Ka-nama-kaa-lajerama anti-shibboleth
  is still effective against Serpent Men in the rare cases they
  survive.
cross_tags: [darkness, the-mesektet, intramural-foe, outer-dark-ally, alias-the-serpent, stygian-precursor, ka-nama-kaa-lajerama]
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
aliases: [honen]
alias_doctrine: >
  Crom is Honen's surviving name. In the Pre-Cataclysmic Age, Honen
  answered prayers in the hill-clans of Atlantis and the Pictish
  highlands. The Cataclysm sank his civilizational frame; the
  survivors who became the Cimmerians and the northern hill-clans
  carried his worship forward, but the god they had known fell silent
  with the loss of his people, his mountains, his forges. The
  canonical Conan-Crom paradigm (witness, do not intervene) is what
  Honen *became* after Atlantis. Atlantean PCs may pray to Honen
  with the expectation of answer; post-Cataclysmic PCs pray to Crom
  with the expectation of silence.
cross_tags: [§11-Spirituality, the-conan-crom-paradigm, witness-not-intervene, alias-honen, the-silent-god-when-young]
```

The silent god of the high cold places. Crom is canon-distant — he watches his heroes' acts but does not intervene with magic in their hour of need. He grants strength at birth; he asks the use of it. To pray to Crom *when it seems hopeless* is itself the act that pleases him; the answer, if any, comes after the battle is won, in the form of wine and women and treasure.

This is **the canonical Conan-Crom paradigm** of `GAME_DESIGN.md §11`. Heroes who pray under impossible odds gain Spirituality whether the prayer is answered or not — Crom is the patron of that mechanic.

*PD provenance note: Crom-the-name is essay-PD per `Public_Domain_Rules.md`. Crom's people are described as "northern hill-clans" and "highland warriors of the cold reaches" — deliberately not "Cimmerians," which is trademark-radioactive.*

---

## Thurian-era aliases (REH-PD)

The six entries below are the Pre-Cataclysmic names of gods documented above. Each is **aliased** to a canonical entry — the dispatcher resolves Thurian names back to the canonical id (see "Notes for the dispatcher" at the end of this document). Use these for adventures, NPC oaths, and consecrated rooms set before the Cataclysm.

---

### Valka — Atlantean name for Ma'at

```yaml
id: valka
domain: [supreme, creator, sea-and-land, fertility, growth, the-god-of-all-gods, lord-of-the-valkyrie]
alignment: light
peoples: [Atlanteans, Picts, Valusians, Zarfhannians — universally invoked across the Pre-Cataclysmic Age]
worship_marker: stone altar facing the sea; offering of bread and salt
provenance: Robert E. Howard, Kull stories (PD); aliased to Ma'at by Living Eamon canon
aliased_to: maat
temporal_relation: >
  Ma'at is the older name. Valka is the name the Atlanteans developed
  for her once their cosmology grew to recognize her station as
  commander of the Valkyrie host. Valka is therefore Ma'at as the
  Atlanteans (and through them, the Picts, Valusians, and Zarfhannians)
  came to know her — not Ma'at's older name, but Ma'at's Atlantean name.
etymology: >
  "Valka" is the Atlantean compound meaning "lord of the Valkyrie."
  The valk- root survives forward into Old Norse valr ("the slain")
  and into the wider Indo-European family. The honorific "lord"
  describes Ma'at's office as commander of the Valkyrie host that
  patrols the borders of creation; it does not assign her gender.
  Pastiche traditions read the "lord" as masculine by 1920s English
  convention; this is a translation artifact, not the underlying name.
gender_provenance: >
  REH primary text never assigns Valka an explicit pronoun. Pastiche
  traditions (Marvel, post-1970 fan wikis) read masculine by 1920s
  "god"-default convention and by the masculine cast of the "lord-of"
  honorific, but these are not REH-PD and not binding. Living Eamon
  canon: Valka is Ma'at; the feminine reading is the original, preserved
  by the Order. See also: the Valkyrie entry below.
canon_references:
  - '"god of the sea and the land" — The Shadow Kingdom (SK 18)'
  - '"Almighty Valka" — The Shadow Kingdom (SK 34)'
  - '"Man is Valka''s mightiest creation" — Khor-na, Exile of Atlantis (EA 9)'
  - '"god of all gods" — Thuron, The Altar and the Scorpion (AS 50)'
  - '"god of fertility and growth" — The Isle of the Eons'
  - 'Most invoked deity in the Kull canon (67 mentions); sworn by Atlantean, Pictish, Valusian, and Zarfhannian peoples'
cross_tags: [pre-cataclysmic, atlantean, pictish, valusian, the-order, ma-root, valk-root, alias-of-maat, valkyrie-host]
```

The most invoked deity of the Pre-Cataclysmic Age. Kull, an Atlantean exile on the Valusian throne, swears by Valka more than any other name — and Picts, Valusians, and Zarfhannians swear by Valka too. The universality is the tell: Valka is not one tribe's god. Valka is *the principle by which any god is a god*, named in the language of Atlantis.

**Ma'at is the older name. Valka is what the Atlanteans came to call her** when their cosmology grew large enough to recognize her — and the name they chose carries its own meaning. *Valka* in Atlantean compounds as **"lord of the Valkyrie"** — the *valk-* root surviving forward into Old Norse *valr*, "the slain." The Valkyrie are Ma'at's own emanations: feminine warrior women, soul shards of her, defenders of the borders of all creation. To call her Valka is to call her by her station — *the commander of those who patrol the edge of being*. The honorific "lord" describes her office, not her gender, and it is this title that gave the name its masculine cast in pastiche tradition. The Order preserves the original feminine.

The Order of Ma'at recognizes this. To them, Valka is not a separate deity to be reconciled — Valka is Ma'at's name as the Atlanteans came to know her, after the Solar Barque had been sailing for ages already and the Valkyrie host was already at the perimeter.

---

### Hotath — Atlantean name for Sekhmet (warrior face)

```yaml
id: hotath
domain: [war, controlled-violence, the-disciplined-blade, the-warrior-face]
alignment: dark
peoples: [Atlantean warriors, Pictish spear-slayers, oath-bound veterans of the Pre-Cataclysmic Age]
worship_marker: a sword laid across an altar; bronze edge polished to mirror
provenance: Robert E. Howard, Kull stories (PD); aliased to Sekhmet (calmed face) by Living Eamon canon
aliased_to: sekhmet
aspect: masculine — the focused warrior, the controlled killing-stroke
canon_references:
  - '"Valka and Hotath!" — Kull''s most common compound oath (5x in Delcardes'' Cat alone)'
  - '"god of war" — The Isle of the Eons gloss'
  - 'Considered a respectable deity by Valusians; Tu does not object when Kull pairs Hotath with Valka'
  - 'Invoked by Rotath of Lemuria in his death-curse: "by Hotath and Helgor, by Ra and Ka and Valka" — The Curse of the Golden Skull'
cross_tags: [pre-cataclysmic, atlantean, sekhmet-twin-face, force-zero-controlled, the-warrior-face]
```

The disciplined warrior. Hotath is the killing-stroke that lands where it was aimed, the spear that breaks the line without breaking the line-keeper, the violence that serves Ma'at by ending what should not be. Atlantean and Pictish warriors swear by him at the moment of engagement. His rites are spare: a sword laid down, an oath spoken, an enemy named.

In Living Eamon canon, Hotath is the **calmed face** of Sekhmet — the same goddess Egyptian tradition knows under one name, but the Atlanteans understood as two. Hotath is what Sekhmet is *after* the red beer is drunk. He is not merciful, but he is *governed*.

---

### Helfara — Atlantean name for Sekhmet (raging face)

```yaml
id: helfara
domain: [rage, plague, uncontrolled-destruction, the-storm-of-vengeance, the-raging-face]
alignment: dark
peoples: [Atlantean warriors invoking vengeance; the betrayed; those past appeasement]
worship_marker: red wine poured on bare earth; never on stone
provenance: Robert E. Howard, Kull stories (PD); aliased to Sekhmet (raging face) by Living Eamon canon
aliased_to: sekhmet
aspect: feminine — the storm, the unappeased, the slaughter that does not stop
canon_references:
  - '"Helfara and Hotath damn my soul to everlasting Hell if I wreak not my vengeance on Fenar!" — Kull, Riders Beyond the Sunrise (RBS 166)'
  - 'Burke speculates consort of Hotath; Living Eamon canon makes them two faces of one deity'
  - 'Mentioned only once in REH primary text, but the pairing with Hotath is consistent with the dual-aspect reading'
cross_tags: [pre-cataclysmic, atlantean, sekhmet-twin-face, force-zero-uncontrolled, the-raging-face, the-red-beer-rite]
```

The unappeased face. Where Hotath's violence ends with the enemy, Helfara's does not end. She is the plague that does not stop at the guilty. She is the storm that breaks the harvest of the village that did not raise the army. She is what Sekhmet became when the gods of Egypt loosed her against rebel humanity, and what only the red beer of Ra could quiet.

To invoke Helfara *and* Hotath together — as Kull does in the vengeance-oath against Fenar — is to call on Sekhmet's full unbalanced strength, and to swear to ride it. The rite is dangerous. Helfara, once woken, does not always remember whose enemy she was sent against.

The Atlantean priesthood of the dual face maintained the **Red-Wine Rite** to keep Helfara dormant during peace: wine dyed red as blood, poured on bare earth at sunset, the same myth-shape Egypt would later preserve as Ra's red beer. A Sekhmet-priest who fails the rite sees Hotath shift, mid-prayer, into Helfara's face.

---

### Honen — Atlantean name for Crom

```yaml
id: honen
domain: [strength, courage, single-combat, steel, the-witness-of-the-cold-places]
alignment: light
peoples: [Atlantean hill-clans, Pictish highland-kin, ancestors of the northern barbarian peoples]
worship_marker: an axe driven into a tree; a great stone on a high place; a forge unbanked
provenance: Robert E. Howard, Kull stories (PD); aliased to Crom by Living Eamon canon
aliased_to: crom
canon_references:
  - '"Valka, Honan and Hotath!" — Kull, Swords of the Purple Kingdom'
  - '"Valka, Honen, Holgar and Hotath!" — Kull, Riders Beyond the Sunrise (RBS 162)'
  - 'Tu (Valusian councilor) labels Honen a "heathen god" — RBS 162'
  - 'Burke groups Honen with the minor Atlantean gods Kull invokes from his birth-culture'
  - 'Burke notes Honan and Honen as variant spellings of the same deity'
spelling_note: >
  REH uses both "Honan" (Swords of the Purple Kingdom) and "Honen"
  (Riders Beyond the Sunrise). Living Eamon canon treats these as the
  same deity; "Honen" is the preferred spelling.
continuity_note: >
  Per Howard's "The Hyborian Age" essay, Cimmerians descend from
  Atlanteans. Living Eamon canon extends this: Honen is the Atlantean
  name for the same god the highland clans later call Crom. Tu's
  "heathen" reaction matches exactly how a civilized Hyborian would
  view a Cromite's prayer — the god is consistent across both names.
  The silence of Crom in the post-Cataclysmic era is, in Living Eamon
  canon, the consequence of his civilizational frame drowning with
  Atlantis. Crom went silent because the people who knew his louder
  name went under the sea.
cross_tags: [pre-cataclysmic, atlantean, pictish, crom-pre-cataclysmic, the-silent-god-when-young, single-combat, steel-rite]
```

The god of the cold places, the high stones, the single combat that decides the matter. In the Pre-Cataclysmic Age, Honen was not yet silent. He answered prayers in the form of strength returned to the arm at the moment of the killing-stroke; he stood witness at the steel-oath sworn between hill-clan chiefs; his shrines were forges left unbanked overnight, and the smith who slept beside the embers woke with his hands surer.

When Atlantis sank, Honen's people went with it — the hill-clans of Atlantis, the highland Picts whose mountain ranges became sea-floor. The survivors carried his worship north and inland, into what would become Cimmeria, where they began to call him **Crom**. But the god they prayed to had lost his frame. He had been the god of *those mountains, those forges, those clans*. Without them, his answers thinned. By Conan's day he is the silent witness of the original Pantheon entry — strength granted at birth, and after that, silence.

The steel-rite, the single combat under his eye, the high-stone shrine: these are Honen's, and they are Crom's. The same hands made them, generations apart, on different sides of the Cataclysm.

---

### Helgor — Atlantean name for Anubis

```yaml
id: helgor
domain: [the-threshold, soul-gathering-on-the-battlefield, the-passage-of-the-slain]
alignment: neutral
peoples: [Atlantean funeral-keepers, battle-scribes, those who tend the dead of war]
worship_marker: jackal-tooth on a leather thong; pyre-ash mixed with water
provenance: Robert E. Howard, Kull stories (PD); aliased to Anubis by Living Eamon canon
aliased_to: anubis
canon_references:
  - '"Valka, Honen, Holgar and Hotath!" — Kull, Riders Beyond the Sunrise (RBS 162)'
  - '"by Hotath and Helgor, by Ra and Ka and Valka" — Rotath of Lemuria, The Curse of the Golden Skull'
  - 'Tu labels Holgar/Helgor a "heathen god" — RBS 162'
  - 'Burke groups Helgor with the minor Atlantean gods'
spelling_note: >
  REH uses both "Holgar" (Riders Beyond the Sunrise) and "Helgor"
  (The Curse of the Golden Skull). Living Eamon canon treats these
  as the same deity; "Helgor" is the preferred spelling because it
  appears in Howard's stronger curse-litany alongside Ra and Valka,
  and pairs alliteratively with Hotath.
cross_tags: [pre-cataclysmic, atlantean, anubis-pre-cataclysmic, the-threshold, battlefield-rites]
```

Where Anubis presides over the embalmer's table and the priestly funeral, Helgor walks the battlefield. He is the threshold-god of *unprepared* deaths — the spear-struck, the burned-in-the-keep, the drowned-in-the-shipwreck — souls that did not have a wash-and-passage rite before the moment of crossing.

Atlantean battle-scribes followed armies in his name. After the engagement, they walked the field, named what dead they could, and burned what could not be carried home. The rite was simple: jackal-tooth touched to the dead's brow, pyre-ash mixed with water and poured on the ground beneath them. The Order of Ma'at considers Helgor's rite complete; Anubis-priests of later eras consider it the bare minimum, but valid.

To despoil a battlefield grave under Helgor's watch carries the same weight as desecrating an Anubis-tended tomb. See Oath 39.

---

### The Serpent — pre-human name for Set

```yaml
id: the-serpent
domain: [the-serpent-cult, pre-human-sorcery, the-hidden-coil-beneath-the-throne]
alignment: dark
peoples: [the Serpent Men of Valusia (pre-human race); their human cultists; surviving forward into Hyborian-era Stygian Set worship]
worship_marker: serpent-coil engraved in obsidian; the inversion-phrase "Ka nama kaa lajerama"
provenance: Robert E. Howard, Kull stories (PD); aliased to Set by Living Eamon canon
aliased_to: set
canon_references:
  - '"The Serpent God — of the serpent men and serpents" — cult of Valusia, The Shadow Kingdom'
  - 'REH "The Hyborian Age" essay threads serpent-cult survival from pre-cataclysmic Valusia into Stygian Set-worship — this is Howard''s own continuity, not a retcon'
  - 'The phrase "Ka nama kaa lajerama" — anti-shibboleth no Serpent Man can pronounce, used by Brule and Kull to identify infiltrators'
continuity_note: >
  The clearest god-bridge in Howard's own canon. The Serpent Men of
  Valusia worshipped this deity before humanity walked upright. Their
  cult survived the Cataclysm in fragments — exiled priesthoods,
  hidden temples, lineages passed through human cultists. By the
  post-Cataclysmic age, the serpent-god is known throughout Stygia
  as Set, and the old name is forgotten outside scholarly circles.
  Living Eamon canon treats them as one deity across both ages.
cross_tags: [pre-cataclysmic, valusian, stygian-precursor, the-serpent-cult, ka-nama-kaa-lajerama, set-pre-cataclysmic]
```

The deity of the Serpent Men, the pre-human race that ruled Valusia before mankind walked upright. Their cult predates every other religion in this pantheon save Ma'at herself, and unlike the gods of the Pre-Cataclysmic peoples, the Serpent's worshippers were not human and did not love humanity.

When humanity rose and broke the Serpent Men's empire, the cult went underground: human cultists wearing the faces of nobles, hidden temples beneath the foundations of Valusia's cities, lineages of sorcery passed mouth to mouth. The phrase **"Ka nama kaa lajerama"** — which no Serpent Man's tongue can shape — survives as the anti-shibboleth used to expose them.

The Cataclysm scattered the cult further but did not extinguish it. By the post-Cataclysmic age, the same god is worshipped throughout Stygia under the name **Set**, and the older name is known only to scholars of forbidden libraries. The Order of Ma'at maintains the older name in its records — the cult is the same cult, the god is the same god, the danger is the same danger.

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

---

## Notes for the dispatcher

The `deity` room tag (per `SORCERY.md §9.2`) and per-spell sprint dispatchers should resolve aliases by lookup:

- A consecrated room tagged `deity: valka` resolves to the Ma'at sprint branch.
- A consecrated room tagged `deity: hotath` resolves to Sekhmet with `aspect: hotath` — controlled-war branch.
- A consecrated room tagged `deity: helfara` resolves to Sekhmet with `aspect: helfara` — uncontrolled-rage branch.
- A consecrated room tagged `deity: honen` resolves to Crom (and may want a flag indicating Pre-Cataclysmic frame for any age-gated narrative).
- A consecrated room tagged `deity: helgor` resolves to Anubis (battlefield-rite branch).
- A consecrated room tagged `deity: the-serpent` resolves to Set (pre-human / Valusian-cult branch).

Recommended dispatcher helper signature (pseudo):

```typescript
function resolveDeity(tag: string): { canonical: string; aspect?: string } {
  // 'valka' → { canonical: 'maat' }
  // 'hotath' → { canonical: 'sekhmet', aspect: 'hotath' }
  // 'helfara' → { canonical: 'sekhmet', aspect: 'helfara' }
  // 'honen' → { canonical: 'crom' }
  // 'helgor' → { canonical: 'anubis' }
  // 'the-serpent' → { canonical: 'set' }
  // 'maat' → { canonical: 'maat' }  // canonical id passes through
  // ...etc
}
```
