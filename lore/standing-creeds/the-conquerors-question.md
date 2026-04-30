---
slug: the-conquerors-question
type: standing-creed
title: "The Conqueror's Question"
picssiAlignment: standing
publicDomain: true
sources:
  - "Rashid al-Din, Jami al-Tawarikh (early 14th c. Persian chronicle of the Mongol khans). Long-PD."
  - "Harold Lamb, Genghis Khan: The Emperor of All Men (1927) — first widely-circulated English translation; pre-1929 = US PD."
  - "Living Eamon original phrasing (Scotch, 2026-04-29 chat) — derived from PD source; in-fiction attributed to a Thurian warlord."
inFictionAttribution: "An ancient Pictish war-chieftain's catechism, recorded by his shield-bearer and sung at warrior-gatherings ever since. Thurian-Age canon: this is the creed of the warrior who lives by Standing alone."
---

# The Conqueror's Question

The chieftain asks. The young warrior answers.

> **"What is best in life?"**
>
> *"To crush your enemies, to see them fall at your feet — to take their goods and hear the lamentation of their women."*

This is the essence of **Standing** (per Scotch 2026-04-29). It is not the essence of every PICSSI virtue — a hero of high Integrity would refuse the catechism; a hero of high Spirituality would weep at it; a hero of high Illumination would see the cataclysm-shadow gathering behind it. But for Standing, it is the unalloyed root: visible victory, public domination, the wealth and glory that follows the strong.

## In-game uses

This text is canon-content for use in:

1. **Atoms (Sprint 4):** A "Conqueror's Question" atom fires in tavern / mead-hall scenes when a high-Standing NPC (or a Pictish chieftain ghost in a Thurian dungeon) poses the question to the hero. Choices:
   - "To crush my enemies, to see them fall at my feet, to take their goods and hear the lamentation of their women." → **+5 Standing** (Major), small +Passion. NPCs of high Standing and Passion approve. NPCs of high Integrity / Spirituality / Illumination disapprove.
   - "To honor my word and protect my friends." → **+3 Integrity**, no Standing.
   - "To know the truth of the world." → **+3 Illumination toward Light**, no Standing.
   - "To love deeply and feast greatly." → **+3 Passion**, small Standing-via-Passion.
   - Refuse to answer → no delta.

2. **NPC dialogue:** Aldric (the veteran) might quote it sardonically when drunk. A Pictish ghost-chieftain in a Thurian dungeon might pose it as a barrier riddle (correct answer = passage; wrong answer = combat).

3. **Tavern wall inscription:** The Hokas tavern in Ostavar has it carved into a roof beam. Players who LOOK UP in the bar see it. Reading it does not award PICSSI — it's atmosphere.

4. **Scrolls/books (Phase 2):** A Pictish "Conqueror's Catechism" scroll, paralleling the Scrolls of Thoth (which are Illumination-aligned). Reading it + a riddle gate would award **+Standing** instead of Illumination.

## PD provenance

The "what is best in life?" / "lamentation of their women" question-and-answer enters English-language cultural circulation through Harold Lamb's 1927 *Genghis Khan: The Emperor of All Men* (US PD: any work pre-1929 is in the public domain), translating older Persian and Mongol sources (Rashid al-Din, ~1300, also PD). The 1982 *Conan the Barbarian* film popularized a variant that is **trademark-radioactive territory for Living Eamon** (Conan brand is permanently avoided per `Public_Domain_Rules.md`). Living Eamon **does not quote the film line** — Scotch's 2026-04-29 phrasing draws from the older PD chain and is original Living Eamon content.

The in-fiction attribution is a **Pictish war-chieftain** (Picts are Thurian-Age PD canon per GAME_DESIGN.md §10), not Genghis Khan (anachronistic in the Thurian setting). The Mongol/Persian provenance is design-time research only.

## Implementation notes

- Stub — not yet wired to runtime. Sprint 4 (encounter loader + trigger matcher) is the wiring target.
- Cross-link from KARMA_SYSTEM.md §2.8 Standing epigraph.
- File location `lore/standing-creeds/` is provisional; if more Standing-themed lore accumulates, this directory becomes the natural home (parallel to `lore/scrolls-of-thoth/` for Illumination).
