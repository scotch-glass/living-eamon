# The Scrolls of Thoth — Index

Fifteen scrolls modeled on *The Kybalion* (1908/1912, Three Initiates), with all "Hermes" and "Hermetic" references substituted for "Thoth" and "Thothian" respectively, fitting the Thurian-Age setting (Thoth the Egyptian/Pre-Thurian patron of wisdom is the canonical analog of Hermes Trismegistus). The Kybalion is firmly in U.S. public domain.

In Living Eamon, the Scrolls are quest-rewarded loot. Reading a scroll for the first time, and proving comprehension by answering the gate-riddle in its frontmatter, awards **+Illumination toward the Light** (proposed +3 Notable per scroll, tunable). Subsequent reads do not re-award Illumination.

See **KARMA_SYSTEM.md §2.10 (Illumination)** and the project memory **`project_scroll_riddle_verification.md`** for the full design pattern.

| # | Roman | Title | File |
|---|-------|-------|------|
| 1 | I | The Way of Thoth (a.k.a. "The Way") | [scroll-1-the-way.md](./scroll-1-the-way.md) |
| 2 | II | The Seven Principles of Thoth | [scroll-2-seven-principles.md](./scroll-2-seven-principles.md) |
| 3 | III | Mental Transmutation | [scroll-3-mental-transmutation.md](./scroll-3-mental-transmutation.md) |
| 4 | IV | The All | [scroll-4-the-all.md](./scroll-4-the-all.md) |
| 5 | V | The Mental Universe | [scroll-5-mental-universe.md](./scroll-5-mental-universe.md) |
| 6 | VI | The Divine Paradox | [scroll-6-divine-paradox.md](./scroll-6-divine-paradox.md) |
| 7 | VII | "The All" in All | [scroll-7-all-in-all.md](./scroll-7-all-in-all.md) |
| 8 | VIII | Planes of Correspondence | [scroll-8-planes-of-correspondence.md](./scroll-8-planes-of-correspondence.md) |
| 9 | IX | Vibration | [scroll-9-vibration.md](./scroll-9-vibration.md) |
| 10 | X | Polarity | [scroll-10-polarity.md](./scroll-10-polarity.md) |
| 11 | XI | Rhythm | [scroll-11-rhythm.md](./scroll-11-rhythm.md) |
| 12 | XII | Causation | [scroll-12-causation.md](./scroll-12-causation.md) |
| 13 | XIII | Gender | [scroll-13-gender.md](./scroll-13-gender.md) |
| 14 | XIV | Mental Gender | [scroll-14-mental-gender.md](./scroll-14-mental-gender.md) |
| 15 | XV | Thothian Axioms | [scroll-15-axioms.md](./scroll-15-axioms.md) |

## Frontmatter schema

Each scroll file begins with YAML frontmatter:

```yaml
---
scroll: I              # Roman numeral
scrollNumber: 1        # Arabic numeral
title: "..."           # Display title
source: "The Kybalion..."   # Provenance line for auditing
publicDomain: true
illuminationDelta: 3   # +Illumination toward Light on first verified read
riddles:
  - prompt: "The lips of wisdom are closed, except to the ears of _____."
    answer: "Understanding"
---
```

## Riddle-verification mechanism (see KARMA_SYSTEM.md §2.10)

When the player reads a scroll, an immediate or deferred riddle gate fires, drawn from the scroll's `riddles` array. On correct answer, `scrollsRead[scrollId].riddlesPassed` is updated and Illumination is awarded **once** per scroll. Subsequent reads or re-answers do nothing.

Quest gates and NPC dialogue can also trigger scroll-riddles ("Tell me, traveler, what doth The Scrolls of Thoth say of Polarity?") to test whether the player has ACTUALLY read a scroll vs merely possessed it.

## Substitution rules applied

The mechanical substitution applied to each chapter (case-preserving):

| From | To |
|------|-----|
| Hermes Trismegistus | Thoth |
| Trismegistus | Thoth |
| Hermes | Thoth |
| Hermetic | Thothian |
| Hermetism | Thothism |
| Hermetist / Hermetists | Thothian / Thothians |

Original copy is preserved at `/tmp/kybalion.txt` during the build (Project Gutenberg eBook #14209). Not committed to git — the substituted scroll files are the canonical Living Eamon artifacts.

## Riddle list (current first-pass)

| Scroll | Riddle prompt | Answer |
|--------|---------------|--------|
| I | "The lips of wisdom are closed, except to the ears of _____." | Understanding |
| II | "The Seven Thothian Principles are: Mentalism, Correspondence, Vibration, Polarity, Rhythm, Cause and Effect, and _____." | Gender |
| III | "Mental Transmutation is the art of changing one mental state into _____." | another |
| IV | "Under, and back of, the Universe of Time, Space and Change, is ever to be found The Substantial Reality—the Fundamental _____." | Truth |
| V | "THE ALL is _____; the Universe is Mental." | Mind |
| VI | "The half-wise, recognizing the comparative unreality of the Universe, imagine that they may defy its Laws—such are vain and presumptuous _____." | fools |
| VII | "While All is in THE ALL, it is equally true that THE ALL is in _____." | All |
| VIII | "As above, so _____; as below, so above." | below |
| IX | "Nothing rests; everything moves; everything _____." | vibrates |
| X | "Everything is dual; everything has poles; everything has its pair of _____." | opposites |
| XI | "Everything flows, out and in; everything has its _____; all things rise and fall." | tides |
| XII | "Every Cause has its Effect; every Effect has its _____." | Cause |
| XIII | "Gender is in everything; everything has its Masculine and _____ Principles." | Feminine |
| XIV | "Mental Gender exists on all the planes of mental activity. The Masculine Principle has the inherent quality of generating new _____." | ideas |
| XV | "When the ears of the student are ready to hear, then cometh the lips to fill them with _____." | Wisdom |

These are first-pass riddles. Each scroll's text supports many more memorable lines — additional riddles can be appended to the `riddles` array in each frontmatter as quest content matures. The runtime should pick a random unanswered riddle from a scroll's array when a gate fires.
