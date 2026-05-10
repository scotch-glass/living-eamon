---
id: scrolls_of_thoth_index
title: Scrolls of Thoth — Registry
role: design-canon
canonical_for: [scroll-registry, riddle-schema, illumination-delta-table]
visibility: creator
status: active
last_updated: 2026-04-30
cross_refs: [KARMA_SYSTEM.md, lib/karma/scrolls.ts, EDGE_VECTORS.md]
questions_total: 6
questions_answered: 6
questions_open: 0
edge_vector_ids: []
---

## Questions answered by this document

> Answers are tagged by category and confidence (`[high]` / `[medium]` / `[low]` / `[open]`).
> Non-`[high]` answers are mirrored in [`EDGE_VECTORS.md`](EDGE_VECTORS.md) under their `EV-` id.

### [LORE]

**Q:** What is the Scrolls of Thoth corpus and what's the source-substitution methodology?
**A:** Fifteen scrolls modeled chapter-by-chapter on **The Kybalion** (1908/1912, Three Initiates) — the foundational modern hermetic primer presenting Hermes Trismegistus's seven principles. Each scroll = one Kybalion chapter with mechanical case-preserving substitution applied: **Hermes Trismegistus → Thoth**, **Trismegistus → Thoth**, **Hermes → Thoth**, **Hermetic → Thothian**, **Hermetism → Thothism**, **Hermetist/Hermetists → Thothian/Thothians**. The substitution is purely textual; the philosophical content is preserved verbatim. The Kybalion is firmly in U.S. public domain. The Living Eamon canonical artifact is the **substituted scroll files** at `lore/scrolls-of-thoth/scroll-1-the-way.md` through `scroll-15-axioms.md`; the original Kybalion is staged at `/tmp/kybalion.txt` during build (Project Gutenberg eBook #14209) but never committed. `[high]`
↔ relates to: §Substitution rules applied, §15-scroll table, Public_Domain_Rules.md (Kybalion PD status), project_scroll_riddle_verification.md

### [WIRING]

**Q:** How does the riddle-verification mechanism gate Illumination awards?
**A:** Reading a scroll for the first time fires an immediate or deferred riddle gate drawn from the scroll's `riddles` frontmatter array. On correct answer, `scrollsRead[scrollId].riddlesPassed` is updated and `+illuminationDelta` is awarded **once per scroll** — subsequent reads or re-answers do nothing. Quest gates and NPC dialogue can also trigger scroll-riddles ("Tell me, traveler, what doth The Scrolls of Thoth say of Polarity?") to test whether the player has ACTUALLY read a scroll vs merely possessed it. The runtime picks a random unanswered riddle from a scroll's `riddles` array when a gate fires — supports multiple riddles per scroll for replay value. The gate fires through the chat-stream `__RIDDLE__` token in v1 (per KARMA_IMPLEMENTATION_PLAN.md Sprint 3); the S6 modal upgrade is the medium-confidence open question on that doc (EV-karma_implementation_plan-002). `[high]`
↔ relates to: §Riddle-verification mechanism, KARMA_SYSTEM.md §2.10 Illumination, KARMA_IMPLEMENTATION_PLAN.md §Sprint 3 Scrolls of Thoth, project_scroll_riddle_verification.md

### [INK-AUTHORING]

**Q:** What's the per-scroll frontmatter schema?
**A:** Each scroll begins with YAML frontmatter declaring six fields: `scroll` (Roman numeral, e.g. `I`), `scrollNumber` (Arabic, e.g. `1`), `title` (display title), `source` (provenance line for auditing — e.g. "The Kybalion, Chapter 1"), `publicDomain: true`, `illuminationDelta` (proposed `+3` Notable per scroll on first verified read), and a `riddles` array of `{prompt, answer}` tuples. The `riddles` array starts with one first-pass riddle per scroll (15 documented in §Riddle list); additional riddles can be appended over time as quest content matures, and the runtime picks a random unanswered one when a gate fires. **Schema example:** `prompt: "The lips of wisdom are closed, except to the ears of _____."; answer: "Understanding"`. The 15 first-pass riddles cover one canonical line per scroll — Mentalism (Scroll V "Mind"), Correspondence (Scroll VIII "below"), Vibration (IX "vibrates"), Polarity (X "opposites"), Rhythm (XI "tides"), Cause-and-Effect (XII "Cause"), Gender (XIII "Feminine"). `[high]`
↔ relates to: §Frontmatter schema, §Riddle list (current first-pass), lib/karma/scrolls.ts (planned runtime parser)

### [PD-SAFETY]

**Q:** Why is the substitution-only approach PD-safe — and is it bulletproof?
**A:** The Kybalion (1908 first edition / 1912 second edition, Three Initiates pseudonym) is **firmly in U.S. public domain** by both publication-date rule (pre-1923 absolute PD pre-Berne) and lack of renewal under the 1909 Copyright Act. Project Gutenberg hosts the full text (#14209). The Hermes/Thoth substitution is **mechanical and case-preserving**, not interpretive — no original commentary, no creative rewrites, no modern translator's text. The substitution maps Greek-Egyptian-Greek (Hermes Trismegistus = the Greek form of Egyptian Thoth via interpretatio graeca) so the doctrinal content is unchanged; only the proper-noun anchor moves. Risk surface: very thin, but a future audit could verify (a) the 1908 first edition specifically (not a later reprint with a fresh foreword) is the source, (b) no derivative works' material accidentally crept into the substituted files, and (c) the Project Gutenberg etext's editorial notes are stripped before substitution. As-shipped today: ✓ safe. `[high]`
↔ relates to: §Substitution rules applied, Public_Domain_Rules.md §1.2 + §5 Always-Safe Corpus, project_scroll_riddle_verification.md

### [INK-AUTHORING]

**Q:** How are additional riddles appended to scrolls over time, and what's the runtime selection rule?
**A:** Each scroll's `riddles` array is **append-only**: as quest content matures, authors add `{prompt, answer}` tuples drawn from the scroll's text. The runtime picks a **random unanswered** riddle from the array when a gate fires — `riddlesPassed` tracks which prompts the player has already solved per scroll, so re-encountering a scroll-gated NPC may surface a different riddle the second time. This supports replay value: a player who reads Scroll IV multiple times across lives will encounter different gate prompts, all drawn from the same canonical text. **Authoring discipline:** every appended riddle's `answer` must be a single token or short phrase that's verifiable via case-insensitive string compare; multi-word answers should use the canonical capitalization shown in §Riddle list. The 15 first-pass riddles use the most memorable phrase from each scroll; subsequent riddles can target less-iconic but still distinctive lines (e.g., Scroll IX's "all forms of Force are not 'forms of force,' but only forms of Vibration" gives a second Vibration prompt). `[high]`
↔ relates to: §Riddle list (current first-pass), §Frontmatter schema (riddles array), KARMA_IMPLEMENTATION_PLAN.md §Sprint 3 (riddle-gate runtime)

### [PICSSI-BALANCE]

**Q:** Is the proposed `+3 Notable` Illumination delta per scroll calibrated for the 15-scroll corpus, or is it an opening parameter?
**A:** Opening parameter. The `+3 Notable` per scroll is a best guess (`15 scrolls × +3 = +45 Illumination toward Light`, 45% of the +100 max). Tuning happens via (1) simulation of full-quest playthroughs generating realistic Illumination distributions, and (2) player testing feedback once the game is functional. Likely tuning surfaces remain valid: stage-weighting (later scrolls deliver more), total Way-of-Thoth contribution cap, PICSSI-Spirituality multipliers. Tuning pass records results in a new §Tuning History section. `[high]`
↔ relates to: §Riddle-verification mechanism, KARMA_SYSTEM.md §2.10 Illumination, EV-karma_system-002 (parallel KARMA tuning EV)

---

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
