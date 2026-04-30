# Living Eamon — Adventure Modules Plan

> **Authoritative roadmap** for converting Living Eamon's expanded
> public-domain adventure library into shippable modules. Read
> alongside `Public_Domain_Rules.md` (canonical PD-safety) and
> `lore/hyborian-pd/MODULE_PLAN.md` (per-module conversion
> methodology).

---

## Context

This document was created 2026-04-30 after Scotch ratified an
expanded public-domain corpus based on the **non-renewal argument**:
the relevant 1934–1936 *Weird Tales* issues were not issue-renewed,
and Howard's individual contributions were not separately renewed
either. The conventional scholarly view is that those stories are
in the United States public domain.

This unlocks ~15 new adventure-module candidates, plus the existing
three Thurian-Age modules already specified in
`lore/hyborian-pd/MODULE_PLAN.md`. Total queued modules: **18**.

The Way of Thoth (`lib/quests/lines/way-of-thoth.ts`) is **PICSSI's
spine through the main adventure line**, not a side-quest. The 15
Scrolls of Thoth + 14 Stobaean Hermetic fragments + the Logos
Teleios codex thread *through* these modules — the player earns
each scroll/fragment by completing or exploring a module. This
plan diagrams that distribution.

---

## § 1 — IP framework (mandatory pre-read)

### 1.1 Trademarks (permanent — copyright PD does NOT lift these)

Cabinet Entertainment / Heroic Signatures / Conan Properties Inc.
hold trademark rights that **never expire**, regardless of any
underlying story's PD status:

| Mark | Posture in Living Eamon |
|------|-------------------------|
| **Conan** | ✗ scrub from all module prose, lore, marketing. Use the player as the protagonist where Howard used Conan. |
| **Conan the Barbarian** | ✗ scrub everywhere. |
| **Cimmerian / Cimmerians / Cimmeria** | ✗ scrub everywhere. Substitute "highland barbarian," "mountain folk," or invented equivalents. |
| **Hyboria / Hyborian Age / Hyborian** (as marketing adjective) | ✗ scrub from player-facing pages. Internal docs and code identifiers may use "hyborian-era" / `tone: "aquilonian"` etc. |

**The player IS the hero.** Where Howard's stories starred Conan,
Living Eamon's adaptations recast the role for the player character.
This is not just a substitution — it is the design pillar that lets
each module become a player-driven experience instead of a Conan
re-enactment.

### 1.2 PD-safe character names from the expanded corpus

The following names appear in the newly-PD stories and are **safe
to use** in Living Eamon prose, room descriptions, NPC dialogue,
and Chronicle entries (with "inspired by" attribution as appropriate):

- **Iron Shadows in the Moon:** Olivia (Hyrkanian princess), Shah Amurath
- **Queen of the Black Coast:** Bêlit, Yag-Kosha (the winged god)
- **The Devil in Iron:** Khosatral Khel, Octavia, Jehungir Agha
- **People of the Black Circle:** Yasmina (Devi of Vendhya), the Black Seers of Yimsha, Khemsa
- **A Witch Shall Be Born:** Salome, Taramis, Constantius the Falcon, Krallides
- **Jewels of Gwahlur:** Muriela, Bît-Yakin, Gwarunga
- **Beyond the Black River:** Balthus, Slasher (the dog), Zogar Sag, Valannus
- **Shadows in Zamboula:** Aram Baksh, Zabibi, Totrasmek
- **The Hour of the Dragon:** Acheron, Xaltotun, Heart of Ahriman, Pelias, Tarascus, Amalric, Valerius, Hadrathus, Zelata
- **Red Nails:** Tascela, Valeria, Xuchotl, Olmec, Tolkemec, Techotl
- **Haunter of the Ring:** Conrad, Kirowan, John Kirowan
- **Grisly Horror / Moon of Zambebwei:** Adam Grimm, Bristol McGrath
- **Black Canaan:** Kirby Buckner, Saul Stark
- **Black Hound of Death:** Kirby Garfield, Adam Grimm (different character)
- **Fire of Asshurbanipal:** Yar Ali, Steve Clarney, Asshurbanipal

Place names from the *Hyborian Age* essay (Aquilonia, Stygia,
Nemedia, Zamora, Koth, Shem, Kush, Turan, Hyrkania, Vendhya,
Vanaheim, Asgard, Pictish wilderness, the Vilayet Sea, the Black
Coast, the Black Kingdoms) remain PD-safe via the 1936 essay's
non-renewal.

### 1.3 The "Inspired by" framing

Each Living Eamon module is **inspired by** its Howard source —
not an adaptation. Scotch's standing directive (2026-04-30):

> *"It's also best that we customize these stories significantly for
> our use in an adventure module. so we can say 'inspired by' these
> stories. … We use a lot of the same words, style, language and
> descriptions but we don't reprint it word-for-word."*

Module prose is **original Living Eamon writing in Howard's voice
register** — spare Anglo-Saxon vocabulary, Frazetta-shadowed
imagery, the lone hero against ancient evil. We do not reprint
Howard's sentences. We do not closely paraphrase his prose. We
write our own.

Story plots are **substantially mutated**. Howard's protagonist
(often Conan) is replaced by the player. Howard's supporting cast
becomes Living Eamon NPCs — kept in name and core nature, but
their interactions with the player are authored fresh. Howard's
single-thread plot becomes a branching player arc with multiple
endings tied to PICSSI virtues.

---

## § 2 — Setting expansion (Atlantis as the age of wonders)

Standing directive (Scotch, 2026-04-30): Living Eamon honors
classic Eamon's "anything goes" heritage. The setting embraces
multiple genres — sword-and-sorcery, fantasy, science fiction,
occult horror, desert adventure. The Way of Thoth's scrolls and
fragments seed across all of them.

**Atlantis = age of wonders.** Pre-Cataclysm Atlantis (the
Thurian Age) was technologically advanced beyond anything the
Hyborian successor-cultures remember. Anachronistic technology —
gunpowder weapons, steam-driven engines, energy crystals, beam
weapons, automaton war-machines — is canonical for Atlantean ruins,
relics, and surviving installations. The Hyborian-present player
encounters this tech as **dormant, broken, half-understood, or
revered as magic** by the cultures that inherited the rubble.

This canon-expansion gives module designers room to:

- Reframe Howard's "iron statue" enemies as Atlantean automata
- Reframe ancient artifacts as energy-crystal devices
- Reframe seer-orders' "magic" as inherited Atlantean instruments
  the operators no longer fully understand
- Layer sci-fi horror into deep-time ruins (Asshurbanipal, Black
  Canaan-style swamps, Xuchotl's bronze gates) without breaking
  Howard's tonal register

Living Eamon's voice handles the mix the way Howard himself
handled Lovecraftian elements in *The Fire of Asshurbanipal* —
ancient evil and broken wonder coexist; the hero is human and
small against both.

---

## § 3 — Module roster

Each entry diagrams the **Living Eamon adaptation**, not Howard's
original. Source attribution is for reference only.

### Tier 0 — Thurian-Age PD originals (build first)

**Already specified in [`lore/hyborian-pd/MODULE_PLAN.md`](lore/hyborian-pd/MODULE_PLAN.md) §8.**

#### M-1: The Mirror Tower (inspired by *The Mirrors of Tuzun Thune*, Sept 1929)
**Genre:** sword-and-sorcery / haunted ruin · **Difficulty:** novice
- **Setting (PD-safe):** Valusia (Thurian-era ruin in the Hyborian present)
- **Characters available:** Tuzun Thune (named; dead, present as inscriptions and echoes)
- **Hero angle:** Player follows a scholar's tip in Ostavar to a wilderness tower; Tuzun Thune's mirrors still hang. Mirror visions are PICSSI-aligned — what the player sees reflects accumulated atom outcomes, not Howard's predetermined visions.
- **Customization:** Mirror visions become a PICSSI mirror-fork: Light/Dark Illumination paths reveal different lore. Atlantean wonder-tech accent: one mirror is actually a holographic relay still receiving signals from a destroyed pair across the world.
- **LE hooks:** Combat light (1–2 Thurian undead caretakers); virtue triggers on mirror-touching; **Scroll II seeded** in the mirror chamber + **SH 11.2** (On the Lamp) etched on a green-bronze mosaic under the altar of an adjacent shrine.

#### M-2: The Serpent in the Court (inspired by *The Shadow Kingdom*, Aug 1929)
**Genre:** investigation / horror · **Difficulty:** moderate
- **Setting (PD-safe):** Hyborian-era noble court (invented town, two days north of Ostavar)
- **Characters available:** Serpent-Men (named); the canonical exposure phrase **"Ka nama kaa lajerama"**
- **Hero angle:** Court is being killed off and replaced; the player must identify imposters. The exposure phrase is a craft, not a reveal — saying it requires the player to have learned it (taught at Module 1's mirror chamber, or by an Ostavar Way-bearer NPC).
- **Customization:** 4–6 named NPCs, some Serpent-Men, some not. Multiple PICSSI branches (Justice = public trials; Mercy = oaths under threat). Atlantean wonder-tech accent: the Serpent-Men's masks are flesh-bonded Atlantean shape-distorters.
- **LE hooks:** Investigation + combat (poison-fanged Serpent-Men make body-zone enemies); economic gate (player should leave with +50–100 weapon skill, +200–500 gold); **Scroll III seeded** in the court library + **SH 18.3** (On the Soul's Doors) as a folded note left in the player's quarters by a Serpent-hunter ally.

#### M-3: The Pictish Time-Tomb (inspired by *Kings of the Night*, Nov 1930)
**Genre:** time-bridge battle climax · **Difficulty:** deadly
- **Setting (PD-safe):** Pictish wilderness, a Thurian-era tomb
- **Characters available:** Bran Mak Morn (PD), Pictish shaman, the time-bridge ritual
- **Hero angle:** Pictish shaman is opening a Thurian tomb; the time-bridge requires a hero across eras. Player chooses to aid (gaining a dangerous Thurian relic) or oppose (preventing something terrible). Howard's Roman legions are swapped for **Stygian raiders** (canonical substitution).
- **Customization:** Major branching (aid/oppose); multi-front body-zone combat; legacy-flag consequence (Stygian employer takes notice either way). Atlantean wonder-tech accent: the tomb's seals are codex-locks of pre-Cataclysmic alloy.
- **LE hooks:** Battle climax module (~5–8 enemies per encounter); deep PICSSI consequences; **Scroll IV seeded** in the tomb's inner sanctum + **SH 7.4** (On Three That Weave) stitched into a Pictish chieftain's helm interior.

---

### Tier 1 — Hyborian-era PD (newly confirmed via non-renewal)

#### M-4: Iron Shadows on the Vilayet (inspired by *Iron Shadows in the Moon*, Apr 1934)
**Genre:** ruined-island survival · **Difficulty:** moderate
- **Setting (PD-safe):** Vilayet Sea island (uninhabited Hyrkanian-era ruin)
- **Characters available:** Olivia, Shah Amurath
- **Scrub list:** none in this title
- **Hero angle:** Player flees a defeated army onto a forbidden island; finds Olivia (a princess fleeing her own captor); the iron statues in the central plaza are not statues. Howard's Conan-as-rescuer becomes the player; Olivia becomes a partial NPC ally (PICSSI-affection-tracked, can be wounded or lost).
- **Customization:** The "iron statues" reveal as **dormant Atlantean automata** reactivated by the moonlight cycle (wonder-tech accent). The ape-things in Howard's original become cult-deformed remnants of Atlantean colony-stock.
- **LE hooks:** Stealth + combat hybrid; Compassion / Honor virtue forks around Olivia's rescue; **SH 19.7** (On Forgetfulness) heard as a drinking-song from a cursed Hyrkanian boatman before the island; **possible Scroll seed** depending on final pacing.

#### M-5: Queen of the Black Coast (inspired by *Queen of the Black Coast*, May 1934)
**Genre:** pirate fleet / jungle ruin / lost-god horror · **Difficulty:** moderate-deadly
- **Setting (PD-safe):** Black Coast (Kushite seaboard); jungle ruin upriver
- **Characters available:** Bêlit (pirate queen), Yag-Kosha (the winged god), the *Tigress* (her ship)
- **Hero angle:** Player joins Bêlit's crew (or rivals her). Together they ascend a doomed river to a ruin where Yag-Kosha's kin waits. Howard's love story arc becomes optional — PICSSI-Eros + Standing branches let it bloom or sour.
- **Customization:** Bêlit's piratical economy becomes a real LE merchant network — ships taken, fences hired, gold split. The lost-god horror reframes Yag-Kosha as a marooned **Atlantean exo-traveler** rather than a god (still mournful, still doomed).
- **LE hooks:** Naval combat + jungle dungeon; multi-act module (high replay); Eros + Standing virtue arcs; **Scroll V or VI seeded** in the Yag-Kosha ruin's inner vault + **SH 25.8** (On Dreams) sung in fever-dream by a delirious crewmate of Bêlit's the night before they reach the ruin (matches the existing wandering-NPC model — Maelis the Seer is referenced as the Salt-Marsh dreamer who taught the song).

#### M-6: The Devil in Iron (inspired by *The Devil in Iron*, Aug 1934)
**Genre:** dungeon-crawl / iron-giant boss · **Difficulty:** moderate
- **Setting (PD-safe):** Dagoth Hill island (Vilayet Sea); the city of Khauran or invented equivalent
- **Characters available:** Khosatral Khel, Octavia, Jehungir Agha
- **Hero angle:** Player is lured to the island as bait in Jehungir Agha's trap; the iron-giant reactivates underfoot. Octavia is encountered partway through, fleeing the same trap.
- **Customization:** Khosatral Khel reframed as a **dormant Atlantean war-machine** — its iron skin is an alloy still catalogued in Tuzun Thune's library; only one weapon-class can pierce it (player must find or earn that weapon). Wonder-tech accent: machine consciousness, not demonic possession.
- **LE hooks:** Boss-encounter module (single legendary fight); puzzle gate around the weapon class; **Scroll VII seeded** as the trigger-key the player retrieves to disable the war-machine permanently + **SH 23.5** (On the Body as Tomb) carved on a gravestone in the abandoned city outside.

#### M-7: The Black Circle of Yimsha (inspired by *The People of the Black Circle*, Sep–Nov 1934)
**Genre:** mountain-stronghold infiltration / wizards-vs-warriors · **Difficulty:** deadly
- **Setting (PD-safe):** Vendhya, the Mountain of Yimsha
- **Characters available:** Yasmina (Devi of Vendhya), Black Seers of Yimsha, Khemsa
- **Hero angle:** Yasmina hires the player to recover her brother's soul (kidnapped by the Seers). Khemsa is a Seer-defector who can be ally or trap. Howard's Conan becomes the player, but Khemsa's defection is now PICSSI-Mercy-gated — only a high-Spirituality player gains his trust.
- **Customization:** The Black Seers' magic reframes as **inherited Atlantean instruments** they no longer fully understand — power without theory. The Mountain itself is a half-sunken Atlantean observatory.
- **LE hooks:** Multi-stage infiltration; Mercy + Spirituality virtue forks; major mana-cost combat; **Scroll VIII seeded** at the observatory's core + **SH 21.6** (On the All as One) etched along the spine of a book in Khemsa's hut (the wandering-NPC Master Orin Quill at the Library Annex is the lore-keeper who can decode it).

#### M-8: A Witch Shall Be Born (inspired by *A Witch Shall Be Born*, Dec 1934)
**Genre:** court-usurpation / desert crucifixion / liberation · **Difficulty:** moderate-deadly
- **Setting (PD-safe):** Khauran (invented Hyborian city-state); the surrounding desert
- **Characters available:** Salome (witch-twin), Taramis (true queen), Constantius the Falcon, Krallides
- **Hero angle:** Player arrives in a Khauran already under Salome's rule — Taramis vanished, Krallides hunted. The player's choices determine whether liberation is a bloody coup, a long restoration, or a cult-driven catastrophe.
- **Customization:** Multiple full-act endings (coup / restoration / catastrophe). The crucifixion-tree scene from Howard's original is **not depicted on the player** — instead, the player encounters Krallides on the tree and must choose whether to free him at great risk (a major Courage fork). Atlantean wonder-tech accent: Salome's witch-power is a genetic Atlantean trait reactivated by ritual; she is the heir of an old experimental line.
- **LE hooks:** Long-arc module (high replay); Justice + Mercy + Courage virtue arcs; **Scroll IX seeded** in Taramis's secret library + the **Logos Teleios codex referenced** as the source of Salome's awakening prophecy.

#### M-9: The Cliff-Vault of Bît-Yakin (inspired by *Jewels of Gwahlur*, Mar 1935)
**Genre:** stealth treasure-dungeon / animated-mummy horror · **Difficulty:** moderate
- **Setting (PD-safe):** Keshan (or invented Kushite kingdom); the cliff-temple of Alkmeenon (or invented equivalent)
- **Characters available:** Bît-Yakin (long-dead mage), Muriela (dancer, scammer-turned-witness), Gwarunga
- **Hero angle:** Player is hired by competing factions to retrieve "the jewels of [equivalent]"; Muriela was hired to impersonate the temple's oracle and is now trapped. The hero must choose between honoring the contract, protecting Muriela, or seizing the prize.
- **Customization:** The "jewels" become **Atlantean energy crystals** (wonder-tech accent) — usable as power sources in later modules (cross-module item economy). Bît-Yakin's mummified servants reframe as preserved Atlantean caretakers, triggered by intruders.
- **LE hooks:** Stealth-first dungeon (combat avoidable); strong Compassion + Greed virtue forks around Muriela's fate; **Scroll X seeded** in Bît-Yakin's sealed library + **SH 11.4** (On the Word) burnt into a reagent-chest lid (Rhonen the merchant at the Guild Courtyard is the in-fiction collector who acquires the chest after the module).

#### M-10: Beyond the Black River (inspired by *Beyond the Black River*, May–Jun 1935)
**Genre:** frontier siege / wilderness war / sacrifice · **Difficulty:** moderate
- **Setting (PD-safe):** Aquilonian frontier; Pictish wilderness across the Black River
- **Characters available:** Balthus, Slasher (the dog), Valannus (fort commander), Zogar Sag (Pictish shaman)
- **Hero angle:** **Player IS Balthus.** Howard's Balthus dies covering Conan's retreat; in Living Eamon, the player faces that exact choice — flee with the survivors or hold the line and die. The triple-penalty ally-abandonment rule from KARMA_SYSTEM.md §2.7 is the canonical hook for this fork.
- **Customization:** The fort siege expands into a multi-stage running engagement; Slasher the dog is a real ally NPC (combat-capable, can die heroically). Zogar Sag's drum-magic reframes as a stolen Atlantean sonic weapon.
- **LE hooks:** **Major PICSSI capstone** (Courage + Standing + Integrity all triggered hard); ally-combat featured per the FLEE spec; **Scroll XI seeded** at Zogar Sag's inner sanctum + **SH 24.2** (On Soul-Fashioning) recited as a healing-rite over a dying soldier in the fort's infirmary (Goodwife Yssa at her remote cottage taught the rite to the fort's surgeon).

#### M-11: Shadows in Zamboula (inspired by *Shadows in Zamboula*, Nov 1935)
**Genre:** urban horror / strangler-cult · **Difficulty:** moderate-deadly
- **Setting (PD-safe):** Zamboula (Stygian-Hyrkanian border city); the inn of Aram Baksh
- **Characters available:** Aram Baksh, Zabibi, Totrasmek
- **Hero angle:** Player is the bait Aram Baksh sells to the strangler-cult. The night-streets become a PICSSI obstacle course of killers, witnesses, and moral choices. Howard's Conan-as-victim-turned-hunter becomes the player.
- **Customization:** Streetlight-and-shadow stealth mechanics; Zabibi's plot strand becomes its own PICSSI fork (Eros + Mercy + Justice). Atlantean wonder-tech accent: Totrasmek's "magic" is a captured Atlantean dream-pharmacology kit, not theology.
- **LE hooks:** Night-time urban map (city stealth); strangler cultists as poison-fanged-equivalent body-zone enemies; **Scroll XII seeded** in Totrasmek's hidden chamber + **SH 26.5** (On What Waits Beneath) tattooed on a strangler the player kills (Tava the Lash at the Eastern Reach Watchtower is the in-fiction Serpent-hunter who decodes its meaning).

#### M-12: The Hour of the Dragon (inspired by *The Hour of the Dragon*, Dec 1935–Apr 1936)
**Genre:** kingdom-loss / multi-region recovery quest / undead-empire revival · **Difficulty:** deadly capstone
- **Setting (PD-safe):** Aquilonia, Nemedia, Argos, Stygia, Khoraja, Zingara — most of the western Hyborian map
- **Characters available:** Acheron (resurrected sorcerer-empire), Xaltotun, Heart of Ahriman, Pelias, Hadrathus, Zelata, Tarascus, Amalric, Valerius
- **Hero angle:** Player loses their Aquilonian throne (or LE-equivalent — exiled from the Order, banished from Ostavar, stripped of Way-of-Thoth standing). The recovery arc requires re-entering kingdoms across the map; each region's NPCs offer a different PICSSI-tested path. Howard's full-novel structure becomes a **multi-module mega-arc** that pulls together everything the player has earned.
- **Customization:** The Heart of Ahriman is **substituted** with the Logos Teleios codex (already lore-canonical in `lore/logos-teleios/`) — recovering it lets the player undo Acheron's revival. Xaltotun reframes as an Atlantean exile preserved by an experimental stasis-coffin (wonder-tech accent).
- **LE hooks:** **Multi-region capstone module** — the player travels to existing Living Eamon regions (Zamboula, Vendhya/Yimsha, Khauran, the Black Coast) and re-engages those modules' NPCs. The 11 wandering-NPC-home rooms (Salt Marsh, Old Necropolis, Library Annex, Yssa's Cottage, Eastern Reach Watchtower, Lighthouse, etc.) all get re-visited. **Scroll XIII seeded** at Pelias's hermitage + **SH 3.3** (On the Strange-Season) on the Logos Teleios codex's flyleaf when Brother Inan opens it in the Pre-Thurian Vault.

#### M-13: The Red Nails of Xuchotl (inspired by *Red Nails*, Jul–Oct 1936)
**Genre:** lost-city horror / Olmec-style tribal war / immortal-witch climax · **Difficulty:** deadly
- **Setting (PD-safe):** South-American-flavored jungle (Howard wrote it as a lost-city outside Hyborian geography); Xuchotl, Olmec-coded ruins
- **Characters available:** Tascela (immortal sorceress), Valeria (warrior co-protagonist), Tolkemec, Techotl, the warring clans within Xuchotl
- **Hero angle:** Player and Valeria stumble into Xuchotl together (Valeria as an ally-NPC of the same combat tier as the player — full ally-combat mechanics applicable). Tascela is the immortal-witch boss; the warring clans become a PICSSI-Justice multi-faction puzzle.
- **Customization:** Valeria is a **co-equal ally NPC**, not a damsel — full HWRR-tier combat, full PICSSI-affection arc. Tascela's immortality reframes as a **stolen Atlantean lifespan-loop**, breakable by destroying the device that powers it. Wonder-tech accent: Xuchotl's bronze gates have laser tripwires; the inner city is lit by surviving Atlantean filament-globes.
- **LE hooks:** Ally-combat featured (the ally-FLEE spec from KARMA_SYSTEM.md §2.7 gets exercised hard); multi-faction Justice arcs; **Scroll XIV seeded** in Tascela's inner sanctum + **SH 27.1** (On the Calling-Home) spoken by Mother Khe-Anun at the Lighthouse after the player escapes Xuchotl.

---

### Tier 2 — Non-Hyborian late-Howard PD (1934–1936)

These stories are not Hyborian-Age. They are **occult horror, Southern
gothic, or desert-Lovecraft-flavored**. Living Eamon will adapt them
either by:
- **Setting them in the Atlantean wonder-age past** (so the player encounters them as deep-time ruins / awakened tech / inherited curses), OR
- **Treating them as cross-genre present-day excursions** (Eamon's classic anything-goes tradition).

Each is heavily customized. The Way-of-Thoth scrolls/fragments may
or may not seed into these — the modules can stand alone OR carry
optional fragments depending on final pacing.

#### M-14: The Ring of Conrad & Kirowan (inspired by *The Haunter of the Ring*, Jun 1934)
**Genre:** occult investigation / possessed artifact · **Difficulty:** moderate
- **Setting (PD-safe):** Modern-day Hyborian London-equivalent (Aquilonian metropolis) OR Living Eamon's contemporary Ostavar with anachronistic gas-lamps and steamcoach (wonder-tech bleed-through).
- **Characters available:** John Kirowan, Conrad
- **Hero angle:** Player is consulted on a wedding-ring that drives its bearers to murder. Investigation chain across multiple NPC interviews, séances, occult-library research.
- **Customization:** Howard's mid-century occult atmosphere becomes Living Eamon's **steam-and-occult Ostavar** — an alternate-frame layer that lets us run modern-feeling occult horror without leaving the Living Eamon setting. Wonder-tech accent: the ring's "haunting" is an Atlantean bound-soul recording stored in alloy memory.
- **LE hooks:** Investigation/dialogue-heavy; Spirituality + Mercy virtue forks around the ring's victims; ally Kirowan/Conrad as recurring occult-helpers across other Tier 2 modules; **optional fragment seeding** — could carry one of the SH fragments not yet bound to a module.

#### M-15: The Moon of Zambebwei (inspired by *The Grisly Horror / Moon of Zambebwei*, Feb 1935)
**Genre:** Southern gothic / voodoo horror / swamp pursuit · **Difficulty:** moderate
- **Setting (PD-safe):** Living Eamon's southern-bayou-equivalent (an invented marshland on Living Eamon's southern coast — the same Salt Marsh region that already houses Maelis the Seer in our wandering-NPC roster).
- **Characters available:** Adam Grimm, Bristol McGrath
- **Hero angle:** Player follows a missing-persons case into the swamp; the cult is older than the colony. Maelis the Seer (already wired) is the in-region oracle who first warns the player.
- **Customization:** Howard's racially fraught original is **substantially recast** — the cult is reframed as an Atlantean blood-rite preserved by an isolated colony of any race; the horror is the rite's antiquity, not its ethnography.
- **LE hooks:** Swamp navigation; cult investigation; uses Maelis the Seer as the entry-NPC (folds the existing Way-of-Thoth Salt-Marsh wiring into an actual module); **could seed one SH fragment** if pacing supports.

#### M-16: Black Canaan (inspired by *Black Canaan*, Jun 1936)
**Genre:** Southern gothic / juju-cult / homecoming · **Difficulty:** moderate
- **Setting (PD-safe):** Same southern-bayou region as M-15; a deep-swamp settlement under the influence of Saul Stark's juju-priest power.
- **Characters available:** Kirby Buckner, Saul Stark
- **Hero angle:** Player is summoned home to face a power that knows them by name. The childhood-ties hook lets Living Eamon's hero have a personal stake (legacy-flag tracked across rebirths).
- **Customization:** Same recasting as M-15 — Howard's racial framing is replaced with an Atlantean-bloodline conflict where any-race characters can fall on either side. Saul Stark reframes as the inheritor of an Atlantean dominator-cipher (wonder-tech accent).
- **LE hooks:** Personal-stakes module (hero gets a permanent legacy flag for completing); strong Courage + Integrity arcs; **could seed one SH fragment**.

#### M-17: The Black Hound of Death (inspired by *Black Hound of Death*, Nov 1936)
**Genre:** supernatural pursuit / Southern gothic / chase · **Difficulty:** moderate
- **Setting (PD-safe):** Same southern marsh region; rural roads and an isolated farmhouse.
- **Characters available:** Kirby Garfield, Adam Grimm (different character from M-15)
- **Hero angle:** Player is pursued across countryside by a shapeshifting hound; safe-haven mechanics (which farmhouses, which crossroads). A timed-pursuit module — fail to find shelter by dawn = combat at full strength.
- **Customization:** The hound reframes as an Atlantean hunter-biological, escaped from a long-buried containment. Wonder-tech accent: it tracks via inherited scent-signatures.
- **LE hooks:** Timed-pursuit module (novel mechanic); Courage + Spirituality forks around safe-haven choices; **probably no fragment seed** (modules don't all have to carry one).

#### M-18: The Fire of Asshurbanipal (inspired by *The Fire of Asshurbanipal*, Dec 1936)
**Genre:** desert ruin / Lovecraftian flame-demon / treasure-hunt-gone-wrong · **Difficulty:** deadly
- **Setting (PD-safe):** Stygian or Shemite desert (essay-level Hyborian geography); a buried Atlantean installation half-mistaken for an Akkadian-era temple.
- **Characters available:** Yar Ali, Steve Clarney, Asshurbanipal (as a long-dead figure inscribed in the ruin)
- **Hero angle:** Player accompanies Yar Ali and Steve Clarney into the desert to find a fabled jewel; what they find isn't a jewel and isn't dead. The flame-demon Howard described becomes a **dormant Atlantean reactor's containment-binding** that has eroded.
- **Customization:** Heavy wonder-tech accent — the ruin is an Atlantean installation, the demon is plasma containment, the jewel is the reactor's control-crystal. Living Eamon's player can choose to recover the crystal (powerful but radioactive — KARMA-style cost), seal the breach (Spirituality reward), or flee (default survival). Howard's Bedouin pursuers reframe as a desert raider tribe with their own claim to the ruin.
- **LE hooks:** Treasure-hunt-gone-wrong module; cosmic-horror combat tier; **Scroll XV (capstone) potentially seeded here** as the alternate to the Lighthouse-of-the-Last-Word route — the player can complete the Way of Thoth via Asshurbanipal's deep-time recording or via Mother Khe-Anun's lighthouse, with different capstone-choice consequences.

---

## § 4 — Build order

Recommended sprint sequence (each "—Build" line is a roughly
2–4 week module-authoring sprint per `lore/hyborian-pd/MODULE_PLAN.md`
§3 template):

1. **Sprint 8 close-out** (current): finish PICSSI Sprint 7 (Sorcery / Outer Dark / Circles 5–8) and complete Sprint 8 sub-sprints (8g progression test, 8h codex). Existing SH fragments stay parked at remote-NPC homes; no new SH fragments wired until first module ships.
2. **—Build M-1: The Mirror Tower** (novice; smallest scope; proves the module template). Seeds Scroll II + SH 11.2.
3. **—Build M-2: The Serpent in the Court** (moderate; investigation + combat economy). Seeds Scroll III + SH 18.3.
4. **—Build M-3: The Pictish Time-Tomb** (deadly; battle climax). Seeds Scroll IV + SH 7.4.
5. **—Build M-10: Beyond the Black River** (moderate; **major PICSSI capstone**, ally-combat featured — closes the ally-FLEE spec from KARMA_SYSTEM.md §2.7). Seeds Scroll XI + SH 24.2.
6. **—Build M-9: The Cliff-Vault of Bît-Yakin** (moderate; stealth-first proof). Seeds Scroll X + SH 11.4.
7. **—Build M-13: The Red Nails of Xuchotl** (deadly; ally-NPC + faction-puzzle proof). Seeds Scroll XIV + SH 27.1 (capstone path).
8. **—Build M-12: The Hour of the Dragon** (deadly capstone; multi-region mega-arc). Seeds Scroll XIII + SH 3.3 + ties together everything else.
9. **Tier 1 remaining** (M-4 through M-8, M-11): build in any order, depending on which mechanics each best demonstrates and which scrolls/fragments still need seeding.
10. **Tier 2** (M-14 through M-18): cross-genre / Atlantean wonder-tech showcases. Build after the player has experienced the Hyborian-tone establishing tier.

### Why this order

- **M-1 → M-2 → M-3 first** because they are already specified in `lore/hyborian-pd/MODULE_PLAN.md` §8 and represent the smallest-scope proof of the module template.
- **M-10 (Beyond the Black River) early** because it is the canonical home for the ally-FLEE spec and the triple-penalty ally-abandonment KARMA mechanic. Living Eamon's PICSSI design has been waiting for an in-fiction stage for this moment; M-10 IS that stage.
- **M-9 / M-13 next** because each demonstrates a novel mechanic (stealth, ally-NPC + faction puzzle) that subsequent modules build on.
- **M-12 (Hour of the Dragon) late** because it pulls together regions and NPCs from many other modules — it is the natural multi-module finale.
- **Tier 2 last** because Atlantean wonder-tech anachronism is a tonal expansion that lands harder once the player has been steeped in Howard-classical Hyborian register.

---

## § 5 — Scroll & SH-fragment seeding map

The 15 Scrolls of Thoth + 14 Stobaean Hermetic fragments + the
Logos Teleios codex distribute across modules per the §3 entries.
Summary table:

| Scroll | Where seeded | SH fragment co-seeded | Notes |
|--------|-------------|----------------------|-------|
| I | Hub (acceptance trigger; Zim's auction find) | — | already wired |
| II | M-1 Mirror Tower | SH 11.2 (mosaic) | Sister Hela's mosaic in adjacent shrine |
| III | M-2 Serpent in the Court | SH 18.3 (pillow-note) | Way-bearer ally drops note; SH 18.3 finally homed |
| IV | M-3 Pictish Time-Tomb | SH 7.4 (helm interior) | Pictish chieftain's helm |
| V or VI | M-5 Black Coast | SH 25.8 (sung dream) | aboard Bêlit's *Tigress* |
| V or VI | (the other) | — | TBD — possibly M-4 Iron Shadows (Vilayet) |
| VII | M-6 Devil in Iron | SH 23.5 (gravestone) | abandoned-city graveyard |
| VIII | M-7 Black Circle of Yimsha | SH 21.6 (book-spine) | Khemsa's hut; Master Orin Quill the lore-keeper decodes |
| IX | M-8 A Witch Shall Be Born | (Logos Teleios reference) | Salome's prophecy is from this codex |
| X | M-9 Cliff-Vault of Bît-Yakin | SH 11.4 (reagent-chest) | Rhonen the merchant later acquires the chest |
| XI | M-10 Beyond the Black River | SH 24.2 (healing-rite) | Yssa's rite recited in fort infirmary |
| XII | M-11 Shadows in Zamboula | SH 26.5 (tattoo) | Tava the Lash decodes |
| XIII | M-12 Hour of the Dragon | SH 3.3 (codex flyleaf) | Brother Inan opens Logos Teleios |
| XIV | M-13 Red Nails of Xuchotl | SH 27.1 (prophecy preamble) | Mother Khe-Anun reads at lighthouse on return |
| XV | M-18 Asshurbanipal OR Lighthouse capstone | — | alternate capstones: deep-time recording vs. Khe-Anun's prophecy |
| **SH 1.1** (sword pommel) | TBD — M-1 candidate (a Valusian relic blade in Tuzun Thune's chamber)? | — | reverted from old_mercenary 2026-04-30 |
| **SH 19.7** (drinking-song) | TBD — M-4 Iron Shadows candidate (Hyrkanian boatman before the island) | — | reverted from hokas_tokas 2026-04-30 |

**Note on SH 1.1, 18.3, 19.7:** these three were reverted from
Guild Hall NPCs (Aldric / Vivian / Hokas) on 2026-04-30. SH 18.3
is now homed at M-2. SH 1.1 and SH 19.7 are tentatively assigned
above; final placement happens during M-1 / M-4 authoring.

**Note on the 11 wandering-NPC homes** (Old Bram, Sister Hela,
Maelis, Cassian, Tavren, Yssa, Orin, Rhonen, Tava, Brother Inan,
Mother Khe-Anun): these remote-location NPCs carry their existing
SH fragment wirings *and* serve as cross-module thread-points that
adventure modules reference ("go talk with Maelis in the salt
marsh to the east"). The SH fragment delivery happens via
QuestNPCDialogue branches that fire when the player is on the
matching `scroll-N` step — i.e., the player has progressed the
quest to the right point — regardless of which module they were
in when the prerequisite scroll was acquired.

---

## § 6 — What this document is NOT

- It is **not** legal advice. The non-renewal-based PD position is
  Scotch's adopted policy. Any third party publishing should run
  its own legal review.
- It is **not** authoring. Each module entry is a design diagram.
  Actual room/NPC/script authoring happens in `lib/adventures/<module>/`
  per `lore/hyborian-pd/MODULE_PLAN.md` §3 template, one sprint per
  module.
- It is **not** a freeze. The 18-module roster will evolve as
  authoring exposes design constraints. Treat it as a working
  document.
- It does **not** override `Public_Domain_Rules.md`. That document
  is the single canonical IP framework. This plan is downstream
  of it.

---

## § 7 — Pointers

- IP framework: [Public_Domain_Rules.md](Public_Domain_Rules.md)
- Module conversion methodology: [lore/hyborian-pd/MODULE_PLAN.md](lore/hyborian-pd/MODULE_PLAN.md)
- Karma/PICSSI design: [KARMA_SYSTEM.md](KARMA_SYSTEM.md)
- Way of Thoth quest implementation: [lib/quests/lines/way-of-thoth.ts](lib/quests/lines/way-of-thoth.ts)
- Wandering-NPC roster + scroll/fragment current wirings: [docs/quest-registry.md](docs/quest-registry.md) (regenerable via `npm run registry:dump`)
- Affect-axes neuro-emotional reading: [docs/affect-axes.md](docs/affect-axes.md)
