# Adventure Module Plan — Building Modules from Public Domain Howard

> **Read `Public_Domain_Rules.md` first** (the consolidated PD-safety
> doc at the repo root). This document presumes you know what is and
> isn't currently PD. The single most important rule:
> **only build modules from PD-confirmed source material.**

---

## 1. The PD-First Design Rule

Every adventure module in Living Eamon must trace its named
elements (characters, places, magical phenomena, races) to a
public-domain Howard source verified in `Public_Domain_Rules.md`. Generic
or invented elements are fine; **using a copyrighted name is
not.**

The PD test for any new module element:

1. Is this name from the *Hyborian Age* essay (1936, PD)?  ✓ safe
2. Is this name from one of the three Thurian-Age PD short
   stories (*The Shadow Kingdom* 1929, *The Mirrors of Tuzun
   Thune* 1929, *Kings of the Night* 1930)?  ✓ safe
3. Is this name a Howard invention from a copyrighted Conan
   story?  ✗ wait until PD entry (mostly 2028–2031)
4. Is this name a freshly invented Howard-voice element with no
   external IP claim?  ✓ safe (but mark clearly in source notes)

When in doubt, swap the name for a PD-safe equivalent (e.g.,
**Acheron → Thurian, Heart of Ahriman → mirror of Tuzun Thune,
Xaltotun → Tuzun Thune himself**).

---

## 2. The "One Short Story = One Module" Simplification

Howard's PD short stories are **short** — 6,000–10,000 words
each. That means a single module can adapt the **whole** story,
not a fragment. This is our core simplification.

Each Living Eamon module corresponds to **one PD source story**,
extended with:

- A small original framing (what brings the player to this place
  in this era?)
- body-zone combat encounters where Howard's prose summarizes a
  battle in a sentence
- Profile-driven branches (per Reader's Mirror) where Howard's
  protagonist had a single fixed reaction
- Living Eamon system integrations (mana costs, virtue triggers,
  Chronicle entries, Order detection, charity-system style
  moral choices)
- A Hyborian-era frame: even though the PD source is set in the
  Thurian Age, the player **explores the ruin in the Hyborian
  present**. The Thurian event happened thousands of years ago;
  what remains is the dungeon, the artifact, and the lingering
  enchantment.

---

## 3. Module Template Structure

Every adventure module under `lib/adventures/` follows the same
shape:

```
lib/adventures/<module-name>/
├── rooms.ts          ← Room definitions (descriptions, exits, scene tones)
├── npcs.ts           ← Module-specific NPCs + scripts
├── items.ts          ← Module-specific items (loot, key items, artifact)
├── encounters.ts     ← Combat encounter setup, NPC combat profiles
├── cold-open.ts      ← Entry sequence (text + image prompt)
├── module.ts         ← Registration, completion criteria, Chronicle entries
└── README.md         ← Source story attribution + PD verification
```

The module file then registers via `lib/adventures/registry.ts`
— same machinery as the guild-hall hub.

The README.md inside each module folder must include:

```markdown
# <Module Name>

**Source:** <PD story title> (Weird Tales, <month year>)
**PD status:** Verified <date> per `Public_Domain_Rules.md`
**Difficulty:** <novice / moderate / deadly>
**Recommended hero level:** <range>

## Howard's Original
<2-3 sentence summary of the source story plot>

## Adapted For Living Eamon
<2-3 sentences on how this module differs from / extends the source>

## PD Elements Used
- <element 1> — from <source>
- <element 2> — from <source>

## Original Elements (not from Howard)
- <element 1>
- <element 2>
```

---

## 4. Source-Story → Module Conversion Methodology

### What stays verbatim

- **Named PD elements** (Tuzun Thune, his mirrors, Valusian
  stonework, Bran Mak Morn, Serpent-Men, the *"Ka nama kaa
  lajerama"* phrase) — use exactly as Howard wrote them.
- **Atmospheric descriptions** — short Howard quotes (≤200 words
  per module) can be inserted as room descriptions, item
  inscriptions, or Chronicle entries. Always cite the source.
- **Characters' core nature** — Tuzun Thune is a wizard who built
  mirror portals. Serpent-Men shapeshift to imitate humans. Don't
  invert these.

### What mutates

- **Setting from Thurian present → Thurian ruin in Hyborian
  present.** Howard's Kull walks Valusia in its prime; our player
  walks the same place 12,000 years later. The mirrors are dusty;
  the throne room is collapsed; the Serpent-Men remnants are
  fewer and more desperate.
- **Plot from single fixed protagonist arc → branching player
  arc.** Howard's Kull always reacts a certain way; our player
  has a profile (per Reader's Mirror) that opens different
  branches at the same junction.
- **Villain/enemy substitution where the source uses an out-of-
  setting force.** *Kings of the Night* uses Roman legions as the
  Pictish enemy. We swap them for a Hyborian-era enemy that fits
  our setting (Stygian raiders, Pictish breakaway clan, Hyborian
  inquisitor task force).
- **Outcome plurality.** Howard's stories have one ending; our
  modules have 2–4 ending paths recorded in the Chronicle.

### What is invented (carefully)

- **Filler rooms** between key story scenes — small chambers,
  approach paths, antechambers — described in Howard's voice.
- **Combat encounters** where Howard summarized a fight in a
  sentence ("a brief savage struggle, and the thing was dead") —
  expanded into body-zone engagements with NPC combat profiles.
- **Modern-system loot** (potions Zim sells, weapons Sam sells)
  found as treasure to give the player tangible reward beyond
  story progression and Chronicle entries.
- **The cold open** — how does the player learn about this ruin
  and decide to go? Usually a tip from an Ostavar NPC, a posted
  notice on the Guild Hall board, or an inheritance.

### What is forbidden

- Any name from a copyrighted Conan story (Conan himself,
  Acheron, Xaltotun, Heart of Ahriman, Thoth-Amon, Bêlit,
  Valeria, the city of Python, etc. — see `Public_Domain_Rules.md` §6).
- Generic D&D-style flavor that breaks Howard's voice.
- Plot armor for the player. Death is permanent (respawn
  resets gold and inventory; Chronicle is forever).

---

## 5. Living Eamon System Integration Checklist

Every module must explicitly handle each of these:

### body-zone Combat
- Define `combatProfile` for every hostile NPC (agility, weapon
  skill, per-zone armor, shield)
- Specify which body zones their armor covers
- For poison-using enemies (Serpent-Man assassins, etc.), set
  `combatProfile.poisonOnHit: { severity, chance }` (Phase B
  feature — wire data now, gameplay engages when handler ships)
- Confirm at least one combat encounter the player can survive
  with starting equipment for novice modules

### Virtue Triggers
- List the 2–4 moral choice points per module
- For each: which virtue moves and by how much
  - **Compassion** — sparing a defeated foe, helping a victim
  - **Honor** — keeping a promise, refusing dishonor
  - **Valor** — facing a clearly stronger foe
  - **Justice** — punishing a wrongdoer
  - **Mercy** — restraint where revenge is possible
  - (etc.)

### Chronicle Entries
- Identify 3–6 key events that are Chronicle-worthy
- Format: terse, factual, annalist-voice ("Took the mirror from
  Tuzun Thune's chamber. The wizard had been dead twelve thousand
  years. Refused to look into it again.")

### Mana / Occult Costs
- If the module exposes Occult opportunities (Thurian sorcery
  found in the ruin), specify mana costs by circle
- If using a Thurian artifact provides a CAST/INVOKE buff,
  document it
- Order detection probability for each Occult use

### Bleed/Poison Sources
- Wire bleed-causing weapons on enemies (claws, jagged blades)
- Wire poison sources where appropriate (Serpent-Man fangs,
  poisoned blades on Stygian assassins, environmental hazards)

### Charity-Barrel-Style Moral Choices Specific to the Module
- A small, specific moral choice that costs a virtue point if
  taken — like the charity barrel's −1 Honor per take
- Examples: looting a fallen ally's body (−1 Honor), accepting
  a Thurian artifact's whispered offer (−1 Spirituality), etc.

### Order Detection Wiring
- Public Occult use in this module → Order witness probability
- Sulfur-trace residue from spent reagents
- Stockpiling Thurian-grade reagents → investigation flag

### Difficulty Tier + Recommended Hero Level
- **Novice:** assumes starting equipment, < 50 weapon skill,
  no allies. Combat is survivable but real.
- **Moderate:** assumes some weapon training (~100 skill),
  basic armor, antidotes/bandages on hand.
- **Deadly:** assumes advanced training (~200 skill), full zone
  armor, mana potions, party support if available.

---

## 6. Profile-Driven Branching (Reader's Mirror)

Per GAME_DESIGN.md §20, the Reader's Mirror tracks player
profile dimensions. Each module should expose 1–3 branches that
fire only when specific profile flags align:

- **High tragedy tolerance** → grislier outcomes, permanent
  scars, harder Chronicle entries
- **Lone-genius preference** → opportunities to outwit ancient
  foes alone, dialogue options that exclude allies
- **Erotic-tinged content** (only if mature content gate enabled)
  → seductive Thurian undead, serpent-women, etc.
- **Curiosity-driven exploration** → hidden lore rooms, deeper
  Chronicle entries

For each branch, document:
- Profile flag(s) required to unlock
- What changes (extra room, alternate dialogue, alternate
  ending, etc.)
- Whether it's persistent (legacy flag) or one-shot

---

## 7. Cold Open + Scene Image Prompts

Every module begins with a cold open — a short scripted entry
sequence that establishes the place and the stakes.

**Cold open structure:**
1. Short scene-setting paragraph (Howard voice)
2. Scene image prompt (passed to Grok Imagine via the existing
   scene-image system)
3. Initial choice chip(s) — usually `__YESNO__` or 2–3 `__CMD__`
   chips

**Scene image prompt template:**
```
[Tonal anchor], [time of day], [weather/atmosphere].
[Foreground subject — what dominates the frame].
[Mid-ground — supporting detail].
[Background — distant terrain or sky].
Style: [Frazetta / Brom / Hyborian iconography].
Mood: [decadent / grim / haunted / ancient].
```

For Thurian-ruin modules, the tonal anchor is "Thurian ruin"
with these visual ingredients: ancient pre-human stonework,
serpent-columns, mirror chambers, weathered glyphs in a script
no living scholar can read, Frazetta's oldest most weathered
crypts.

---

## 8. The First Three Modules (Build Order)

> **2026-04-30 update:** the project's PD corpus expanded to include
> 15 additional *Weird Tales* 1934–1936 stories (per the non-renewal
> audit recorded in `Public_Domain_Rules.md` §1.2). The full
> 18-module roadmap, per-module customization diagrams, scroll/
> fragment seeding map, and recommended build order are now in
> [`ADVENTURE_MODULES_PLAN.md`](../../ADVENTURE_MODULES_PLAN.md).
> The three Thurian-Age modules below remain the recommended
> first-three (M-1, M-2, M-3) per that plan.

All three are based on the three Thurian-Age PD short stories.
Build in this order; each demonstrates a different module type.

### Module 1: The Mirrors of Tuzun Thune
**Source:** *The Mirrors of Tuzun Thune* (Weird Tales, Sept 1929)
**Difficulty:** Novice → Moderate
**Recommended hero level:** Starting hero, no training required

**Pitch:** A traveling scholar in Ostavar tells the player of a
ruined tower in the wilderness — once the home of a Valusian
wizard named Tuzun Thune, dead twelve thousand years. His mirrors
are said to still hang there, undusted, undamaged, showing
visions of lives the viewer never lived. The Order considers the
mirrors a temptation to be destroyed; the Thurian remnants
consider them a sacred relic; the player decides.

**Why first:** Low combat (1–2 small fights at most), heavy on
exploration and dynamic Grok-generated visions. Demonstrates the
module template, the cold-open system, and the legacy-artifact
mechanic without requiring all subsystems at once. Perfect proof
of the conversion methodology.

**Key elements:**
- Tuzun Thune (named, dead, present only as inscriptions and
  echoes)
- The mirror chamber (the central artifact)
- A handful of Thurian undead caretakers (low-level combat)
- Profile-driven mirror visions (lone-genius sees power; high-
  tragedy sees ruin; curiosity-driven sees deep lore)
- A legacy artifact: *one mirror* the player can take, destroy,
  or seal. Permanent Chronicle event either way.

**Difficulty notes:** Combat is light but lethal if rushed.
Encourages the player to use BANDAGE/TOURNIQUET and to think
about positioning. Good body-zone tutorial.

---

### Module 2: The Serpent in the Court
**Source:** *The Shadow Kingdom* (Weird Tales, Aug 1929)
**Difficulty:** Moderate
**Recommended hero level:** ~50–100 weapon skill (so the player
benefits from training between Module 1 and Module 2)

**Pitch:** A Hyborian-era noble court (a small town two days
north of Ostavar) is host to a serpent-cult infiltration. The
court is being killed off one by one, replaced by Serpent-Men
wearing the dead's faces. The player must investigate, identify
the imposters, and stop them. **The PD-canonical exposure
mechanic — saying *"Ka nama kaa lajerama"* and watching who
cannot say it back — is central to the module.**

**Why second:** Investigation + combat + social play. Demonstrates
NPC interrogation, deduction mechanics, and **enough combat to
advance weapon skills + earn gold for training before Module 3**.
The Serpent-Men make excellent body-zone opponents — agile, fast,
poison-fanged.

**Key elements:**
- Serpent-Men (named, with the canonical exposure phrase)
- A Hyborian noble court (invented town, generic Hyborian flavor
  — no copyrighted city names)
- 4–6 named NPCs to investigate (some are Serpent-Men; some
  aren't)
- Multiple combat encounters across the investigation
- Gold reward + a poisoned blade as artifact loot
- Profile branches: high-Justice player can demand public trials;
  high-Mercy player can spare exposed Serpent-Men under oath
  (with consequences)

**Combat / economy goals:** Player should leave Module 2 with
+50–100 weapon skill and +200–500 gold — enough for serious
weapon training and equipment upgrades before tackling Module 3.

---

### Module 3: The Pictish Time-Tomb
**Source:** *Kings of the Night* (Weird Tales, Nov 1930)
**Difficulty:** Deadly
**Recommended hero level:** Trained hero, full zone armor,
antidotes/bandages on hand

**Pitch:** A Pictish shaman in the western wilderness is
performing a ritual to open a Thurian-era tomb. The ritual
requires a time-bridge — and someone must reach across the eras
to bring back what's inside. The player can aid the shaman (and
gain a powerful but dangerous Thurian relic) or oppose her (and
prevent something terrible). **The Roman legions of Howard's
original story are swapped for Stygian raiders** — same dramatic
function, fits our setting cleanly.

**Why third:** Battle climax module. Demonstrates large-scale
body-zone combat, the time-bridge mechanic (player briefly fights
alongside or against a summoned Thurian warrior), and a
substantial legacy-flag consequence (the Stygian raiders'
employer takes notice of the player either way).

**Key elements:**
- Bran Mak Morn (named, present in person — he's PD)
- A Pictish ritual circle
- A Thurian tomb with sealed doors
- Stygian raiders (substituted for Howard's Romans) as the
  battle climax
- A pre-Cataclysmic warrior who can be summoned through time
- Multiple major combat encounters
- Two clear endings (aid the shaman / oppose the shaman) plus
  several minor branch outcomes

**Combat / economy goals:** This module assumes the player has
trained up. It is winnable with starting equipment but
**punishingly hard** without ~100 weapon skill, full zone armor,
and a stack of cures.

---

## 9. After The First Three — The PD Calendar

Once the three Thurian modules ship, **we are out of currently-PD
source material for net-new modules.** The next significant PD
event is **January 2028,** when the first Conan stories enter
public domain.

Until then, additional content should be:

- **Original modules in Howard's voice** that use only PD-safe
  named elements (kingdoms from the essay, Thurian elements
  from the three PD stories, freshly-invented original names)
- **Extensions to existing modules** (deeper Tuzun Thune mirror
  visions, more Serpent-Man cells discovered across the realms,
  recurring Bran Mak Morn appearances)
- **Module-set arcs** that link the three Thurian modules into a
  larger campaign (e.g., the same Stygian sorcerer-priest
  surfaces across all three)

When 2028 hits, **revisit `Public_Domain_Rules.md` §8 calendar and this
document together** and queue Conan modules:

- **2028:** *The Phoenix on the Sword*, *The Scarlet Citadel* —
  Conan himself becomes PD; first Conan-era modules possible
- **2029:** Major batch (*Tower of the Elephant*, *Black Colossus*,
  *Rogues in the House*, etc.) — pick the 2–3 best fits, queue
  more for later
- **2030:** *Queen of the Black Coast*, *Jewels of Gwahlur*,
  *Beyond the Black River* — naval, treasure-dungeon, frontier
  modules
- **2031:** ⭐ *The Hour of the Dragon* enters PD — finally
  unlocking **Acheron, Xaltotun, Heart of Ahriman, Python**.
  Reverse the temporary "Acheron → Thurian" substitution where
  appropriate; ship a major Hour-of-the-Dragon-derived module.

Treat each PD unlock as a deliberate design event, not an
automatic batch import. Pick the best 2–3 newly-unlocked stories
per year for full module conversion; let the rest inform
worldbuilding without becoming separate modules.

---

## 10. Summary — The Standing Rule

> **Every module = one PD story + Living Eamon systems +
> Howard's voice + PD-verified naming.**

Anything outside that frame is a worldbuilding doc, not a
module. Anything inside it is queued for production.
