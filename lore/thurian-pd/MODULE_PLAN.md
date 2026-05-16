---
id: thurian_pd_module_plan
title: Thurian-Age Module Methodology
role: sprint-plan
canonical_for: [pd-module-methodology, pd-first-design-rules]
visibility: creator
status: active
last_updated: 2026-05-10
cross_refs: [Public_Domain_Rules.md, ADVENTURE_MODULES_SYSTEM.md, GAME_DESIGN.md, EDGE_VECTORS.md]
questions_total: 8
questions_answered: 8
questions_open: 0
edge_vector_ids: []
---

## Questions answered by this document

> Answers are tagged by category and confidence (`[high]` / `[medium]` / `[low]` / `[open]`).
> Non-`[high]` answers are mirrored in [`EDGE_VECTORS.md`](EDGE_VECTORS.md) under their `EV-` id.

### [INK-AUTHORING]

**Q:** What is the PD-First Design Rule and the four-step PD test for any new module element?
**A:** Every adventure module must trace its named elements (characters, places, magical phenomena, races) to a PD-confirmed Howard source verified in `Public_Domain_Rules.md`. Generic or invented elements are fine; using a copyrighted name is not. The four-step PD test for any new element: (1) Is this name from the *Hyborian Age* essay (1936, PD)? → safe. (2) Is this name from one of the three Thurian-Age PD short stories (*Shadow Kingdom* 1929, *Mirrors of Tuzun Thune* 1929, *Kings of the Night* 1930)? → safe. (3) Is this name a Howard invention from a copyrighted Conan story? → wait until PD entry (mostly 2028–2031, with the 2026-04-30 non-renewal audit having already moved 15 stories to Bucket A — see EV-hyborian_pd_module_plan-001). (4) Is this name freshly invented in Howard-voice with no external IP claim? → safe (mark in source notes). When in doubt, swap for a PD-safe equivalent. `[high]`
↔ relates to: §1 The PD-First Design Rule, Public_Domain_Rules.md §1.2 + §6, GAME_DESIGN.md top-of-file Safe Harbor / Radioactive tables

### [INK-AUTHORING]

**Q:** What is the "one short story = one module" simplification, and why is it the core methodology?
**A:** Howard's PD short stories run 6,000–10,000 words — short enough that a single Living Eamon module can adapt the **whole** story, not a fragment. Each module corresponds to one PD source story, extended with: a small original framing (what brings the player to this place in this era?); body-zone combat encounters where Howard's prose summarizes a battle in a sentence; profile-driven branches where Howard's protagonist had a single fixed reaction; Living Eamon system integrations (mana costs, virtue triggers, Chronicle entries, Order detection, charity-system moral choices); and a Hyborian-era frame — even though the PD source is set in the Thurian Age, the player explores the ruin in the Hyborian present (the Thurian event happened thousands of years ago; what remains is the dungeon, the artifact, and the lingering enchantment). `[high]`
↔ relates to: §2 The "One Short Story = One Module" Simplification, ADVENTURE_MODULES_PLAN.md §3 (per-module customization), KARMA_SYSTEM.md §5 (system integration)

### [INK-AUTHORING]

**Q:** What does the module template structure look like under `lib/adventures/`?
**A:** Seven files per module folder: `rooms.ts` (room definitions, descriptions, exits, scene tones), `npcs.ts` (module-specific NPCs + scripts), `items.ts` (loot, key items, artifact), `encounters.ts` (combat encounter setup, NPC combat profiles), `cold-open.ts` (entry sequence with text + image prompt), `module.ts` (registration, completion criteria, Chronicle entries), `README.md` (source story attribution + PD verification). The module file registers via `lib/adventures/registry.ts` — same machinery as the guild-hall hub. The README must include source story title, PD-status verification date, difficulty tier, recommended hero level, plot summary, adaptation notes, PD elements used (each cited), and original elements (not from Howard). `[high]`
↔ relates to: §3 Module Template Structure, lib/adventures/registry.ts, lib/adventures/guild-hall.ts (the canonical reference pattern)

### [INK-AUTHORING]

**Q:** What stays verbatim, what mutates, what is invented, and what is forbidden in source-to-module conversion?
**A:** **Stays verbatim:** named PD elements (Tuzun Thune, his mirrors, Valusian stonework, Bran Mak Morn, Serpent-Men, the *"Ka nama kaa lajerama"* phrase); short Howard quotes (≤200 words per module) as room descriptions / item inscriptions / Chronicle entries with cited source; characters' core nature (Tuzun Thune is a wizard who built mirror portals — don't invert this). **Mutates:** setting from Thurian present to Thurian ruin in Hyborian present (12,000 years later, mirrors dusty, throne room collapsed); plot from single fixed protagonist arc to branching player arc per Reader's Mirror profile; villain/enemy substitution where source uses an out-of-setting force (Roman legions in *Kings of the Night* swapped for Stygian raiders); outcome plurality (Howard's one ending becomes 2–4 ending paths recorded in Chronicle). **Invented (carefully):** filler rooms between key scenes in Howard's voice; combat encounters expanded from Howard's one-sentence summaries; modern-system loot (potions Zim sells, weapons Sam sells); the cold open. **Forbidden:** any name from a copyrighted Conan story; generic D&D-style flavor that breaks Howard's voice; plot armor for the player (death is permanent, respawn resets gold + inventory, Chronicle is forever). `[high]`
↔ relates to: §4 Source-Story Module Conversion Methodology, Public_Domain_Rules.md §4.4 (parallel "inspired by" customization rules), ADVENTURE_MODULES_PLAN.md §1.3

### [WIRING]

**Q:** What is the seven-section Living Eamon system integration checklist every module must satisfy?
**A:** (1) **body-zone combat:** define `combatProfile` for every hostile NPC (agility, weapon skill, per-zone armor, shield); specify which body zones armor covers; set `combatProfile.poisonOnHit: { severity, chance }` for poison-using enemies; confirm at least one combat encounter survivable with starting equipment for novice modules. (2) **Virtue triggers:** list 2–4 moral choice points per module with which virtue moves and how much (note: doc still references the 10-virtue ledger — KARMA_SYSTEM cold-deletes that for PICSSI, so this section needs update once Sprint 2 lands). (3) **Chronicle entries:** identify 3–6 key events worthy of terse annalist-voice records. (4) **Mana / Occult costs:** specify mana costs by circle if the module exposes Occult; document Thurian-artifact CAST/INVOKE buffs; Order detection probability per use. (5) **Bleed/Poison sources:** wire bleed-causing weapons + poison sources where appropriate. (6) **Charity-barrel-style moral choices:** small specific module-local moral choice that costs a virtue point if taken. (7) **Order detection wiring:** public Occult use → Order witness probability; sulfur-trace residue from spent reagents; reagent stockpiling → investigation flag. Plus a difficulty tier (novice/moderate/deadly) + recommended hero level. `[high]`
↔ relates to: §5 Living Eamon System Integration Checklist, SORCERY.md §4 The Order, KARMA_SYSTEM.md §2.5–§2.10 (virtue trigger replacement)

### [INK-AUTHORING]

**Q:** Why are the first three modules built in the order Mirrors → Serpent → Pictish Time-Tomb?
**A:** Each demonstrates a different module type while progressively raising combat tier. **M-1 Mirrors of Tuzun Thune (novice):** low combat (1–2 small fights), heavy on exploration + dynamic Grok-generated visions; demonstrates module template, cold-open system, legacy-artifact mechanic without requiring all subsystems at once. **M-2 The Serpent in the Court (moderate):** investigation + combat + social play; demonstrates NPC interrogation, deduction mechanics, and provides combat to advance weapon skills + earn gold for training before M-3; the canonical *"Ka nama kaa lajerama"* exposure mechanic is central. **M-3 Pictish Time-Tomb (deadly):** battle climax module; demonstrates large-scale body-zone combat, time-bridge mechanic (player briefly fights alongside or against a summoned Thurian warrior), and substantial legacy-flag consequence (the Stygian raiders' employer takes notice). M-3 assumes the player has trained up via M-2's gold + skill rewards; punishingly hard without ~100 weapon skill, full zone armor, and a stack of cures. `[high]`
↔ relates to: §8 The First Three Modules, ADVENTURE_MODULES_PLAN.md §4 (build order — M-1 / M-2 / M-3 are the same Tier-0 modules)

### [PD-SAFETY]

**Q:** Is the §9 public-domain calendar still accurate after the 2026-04-30 non-renewal audit moved 15 *Weird Tales* 1934–1936 stories to Bucket A?
**A:** §9 has been rewritten (2026-05-10) to reflect the post-audit public-domain status. The stale calendar entries for *Queen of the Black Coast*, *Jewels of Gwahlur*, *Beyond the Black River*, and *Hour of the Dragon* — which were previously listed as 2030/2031 unlocks — have been removed. All four stories are now in Bucket A per Public_Domain_Rules.md §1.2. Their named elements (Bêlit, Acheron, Xaltotun, Heart of Ahriman, Python) are usable now with the customization discipline. §9 now points to ADVENTURE_MODULES_PLAN.md §3 as the authoritative 18-module roster and explains the remaining future-PD timeline (2027 audit, 2028 unlocks, etc.). `[high]`
↔ relates to: §9 After The First Three — The PD Calendar (post-audit rewrite), Public_Domain_Rules.md §1.2 + §8 (current calendar), ADVENTURE_MODULES_PLAN.md §3 (post-audit module roster)

### [INK-AUTHORING]

**Q:** What's the canonical division of ownership between this doc and ADVENTURE_MODULES_PLAN.md?
**A:** This doc owns the **methodology and template for building any module** — PD-First Design Rule, one-short-story-one-module simplification, module template structure, source-to-module conversion rules (stays/mutates/invents/forbids), system integration checklist, profile-driven branching, cold open + scene image prompt template, and the first-three modules' detailed authoring reference. Note: This doc's title references "Hyborian" but the methodology applies universally; the game is set in the Thurian Age. ADVENTURE_MODULES_PLAN.md owns the **overall strategic plan for the entire module system** — the 18-module roster, scroll/SH-fragment seeding map, cross-roster build order, and per-module customization (Atlantean wonder-tech accents, etc.). **Individual module implementations** (M-1, M-2, M-3, etc.) each own their own short story source, module template code, world travel requirements, room map, NPCs, items, and encounters. `[high]`
↔ relates to: §1–8 (methodology and template), ADVENTURE_MODULES_PLAN.md §3 (18-module roster), lib/adventures/ (individual module implementations)

---

# Thurian-Age Module Methodology — Building Modules from Public Domain Howard

> **Read `Public_Domain_Rules.md` first** (the consolidated PD-safety
> doc at the repo root). This document presumes you know what is and
> isn't currently PD. The single most important rule:
> **only build modules from PD-confirmed source material.**
> 
> **Note:** This document describes the methodology and template for building any module in the Thurian-Age setting. The overall strategic plan for the 18-module system is in [`ADVENTURE_MODULES_SYSTEM.md`](../../ADVENTURE_MODULES_SYSTEM.md).

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
  and decide to go? Usually a tip from an Valus NPC, a posted
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

**Pitch:** A traveling scholar in Valus tells the player of a
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
north of Valus) is host to a serpent-cult infiltration. The
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

## 9. After The First Three — The PD Calendar (Post-Audit)

**2026-04-30 update:** The non-renewal audit in `Public_Domain_Rules.md` 
§1.2 moved 15 additional *Weird Tales* 1934–1936 Howard stories 
from the future-PD calendar into the **current Bucket A** (usable now). 
This includes *Queen of the Black Coast*, *Jewels of Gwahlur*, 
*Beyond the Black River*, and *The Hour of the Dragon* — along with 
all their named elements (Bêlit, Acheron, Xaltotun, Heart of Ahriman, 
Python, etc.).

**Authoritative roster:** [`ADVENTURE_MODULES_PLAN.md` §3](../../ADVENTURE_MODULES_PLAN.md) 
lists the full 18-module roadmap with customization details. That 
document is the single source of truth for module build order, per-module 
PD-safety, and scroll/fragment seeding.

**Remaining future-PD timeline:**

- **2027 (planned audit):** Non-renewal audit for 1932–1933 *Weird Tales* 
  Conan stories (*The Phoenix on the Sword*, *The Scarlet Citadel*, etc.). 
  Today they remain Bucket B; the 2027 audit may move some/all to Bucket A.
  See `Public_Domain_Rules.md` §8 for methodology.
- **2028:** If the 2027 audit confirms non-renewal, Conan-era modules 
  become possible. Otherwise, the 95-year clock still requires waiting 
  until 2027–2029.
- **2029–2032:** Per the historical pattern, subsequent cohorts of 1930s 
  *Weird Tales* stories unlock as the 95-year window slides forward.

**Design philosophy:** Treat each PD event as a deliberate design moment, 
not an automatic batch import. The existing 18-module roster in 
`ADVENTURE_MODULES_PLAN.md` represents the best-fit selections from the 
current Bucket A. As future audits and unlocks land, evaluate the new 
corpus and deliberately choose which stories warrant full module treatment 
vs. which inform worldbuilding without becoming separate modules.

---

## 10. Summary — The Standing Rule

> **Every module = one PD story + Living Eamon systems +
> Howard's voice + PD-verified naming.**

Anything outside that frame is a worldbuilding doc, not a
module. Anything inside it is queued for production.
