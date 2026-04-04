# Living Eamon — Game Design

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

## 12. Planned Core Systems *(Phase 2 unless noted)*

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
