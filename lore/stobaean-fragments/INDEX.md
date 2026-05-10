---
id: stobaean_fragments_index
title: Stobaean Fragments — Registry
role: design-canon
canonical_for: [fragment-pacing-map, mentor-assignments]
visibility: creator
status: active
last_updated: 2026-04-30
cross_refs: [docs/quest-registry.md, lore/scrolls-of-thoth/INDEX.md, EDGE_VECTORS.md]
questions_total: 6
questions_answered: 6
questions_open: 0
edge_vector_ids: []
---

## Questions answered by this document

> Answers are tagged by category and confidence (`[high]` / `[medium]` / `[low]` / `[open]`).
> Non-`[high]` answers are mirrored in [`EDGE_VECTORS.md`](EDGE_VECTORS.md) under their `EV-` id.

### [LORE]

**Q:** What are the Stobaean Hermetic Fragments and what's their canonical reference scheme?
**A:** Fourteen short philosophical fragments, each carrying one thread of the broader Hermetic tradition, scattered across the Way of Thoth quest line as supplementary teachings delivered by 14 mentors carrying 15 scrolls. The numbering scheme `SH N.M` (e.g. `SH 2.1`, `SH 11.2`) follows the **canonical reference numbering of the Stobaean Hermetica** — fragments preserved in **Stobaeus's *Anthology* (5th century CE)** of Hermetic-tradition Greek texts (~100–300 CE). The philosophical content is genuinely ancient PD (~1800+ years). **The prose in these files is original Living Eamon writing**, composed to carry each fragment's philosophical meaning into the game's voice; no modern translator's text is reproduced. Frontmatter cites the canonical reference and notes available scholarly readings (Walter Scott 1924, G.R.S. Mead 1906 — both US-PD) for traceability. `[high]`
↔ relates to: §Pacing, §Map (14-fragment table), §Frontmatter schema, lore/scrolls-of-thoth/INDEX.md (canonical companion)

### [PD-SAFETY]

**Q:** Why is the original-prose-on-PD-ideas approach safe — and how does it differ from the Scrolls' substitution approach?
**A:** Two complementary methods serving the same PD-safety goal. **Scrolls of Thoth:** mechanical Hermes→Thoth substitution applied to The Kybalion (1908, US-PD); the textual basis is the PD source verbatim with proper-noun substitution. **Stobaean fragments:** the **ideas** are PD by antiquity (~1800 years — Greek-language texts ~100–300 CE preserved in Stobaeus's *Anthology* 5th century CE), but the **prose** is original Living Eamon writing composed to carry each fragment's philosophical meaning into the game voice. No modern translator's text is reproduced — Walter Scott (1924) and G.R.S. Mead (1906) are cited as scholarly references for traceability, but their actual sentences are never quoted. This sidesteps the modern-translator-copyright trap that affects Greek/Latin classics; the underlying philosophy is in the public domain by virtue of being eighteen centuries old, and the game's prose is freshly authored. `[high]`
↔ relates to: §Frontmatter schema (`note` field documenting the methodology), Public_Domain_Rules.md, lore/scrolls-of-thoth/INDEX.md (companion approach)

### [INK-AUTHORING]

**Q:** How do fragments map to mentors, quest steps, and delivery vectors?
**A:** **14 fragments × 14 mentors × 14 steps × 6 delivery vectors.** The §Map table assigns each `SH N.M` to one wandering-NPC mentor (Old Bram, Sister Hela, Vivian, Aldric, Hokas, Maelis, Cassian, Tavren, Yssa, Master Orin, Rhonen, Tava, Brother Inan, Mother Khe-Anun) and one Way-of-Thoth quest step (`scroll-2` through `scroll-15` — no fragment lands on `scroll-1` because Scroll I is the entry-quest acceptance). Each fragment fires only when the player is on the matching `scroll-N` step, regardless of which adventure they were in when the prerequisite scroll was acquired (per ADVENTURE_MODULES_PLAN.md §5 Scroll & SH-fragment seeding map note). **Six delivery vectors:** spoken-aloud, mosaic engraving, pillow note, sword pommel, drinking-song verse, sung dream, gravestone, helm interior, healing-rite recitation, book-spine etching, reagent-chest lid, body tattoo, codex flyleaf, prophecy preamble. Each vector authors the moment the fragment is delivered — physical inscription / dialogue / song / dream / etc. — making the same philosophical text feel newly discovered in each playthrough. `[high]`
↔ relates to: §Pacing, §Map (full 14-fragment table), ADVENTURE_MODULES_PLAN.md §5 Scroll & SH-fragment seeding map, docs/quest-registry.md

### [WIRING]

**Q:** What's the per-fragment frontmatter schema?
**A:** Eight fields per fragment file. **`fragment`** (canonical reference, e.g. `SH 2.1`), **`title`** (display title, e.g. `"On Virtue"`), **`sourceTradition`** (multi-line provenance citation — Greek source date range, Stobaeus's Anthology preservation, modern scholarly readings cited but not reproduced), **`publicDomain: true`**, **`note`** (multi-line PD methodology disclaimer — explicitly states the LE prose is original and ancient ideas are PD by antiquity, no modern translator's text reproduced), **`deliveryNpc`** (e.g. `old_bram`), **`deliveryStep`** (e.g. `scroll-2`), **`deliveryVector`** (e.g. `spoken-aloud`), **`themes`** (array, e.g. `[virtue, recognition-of-debt]`), **`illuminationDelta`** (default `1` — Trivial-tier per fragment delivery; **see EV-stobaean_fragments_index-001**). The `deliveryNpc` + `deliveryStep` pair drives the QuestNPCDialogue branch firing condition; the `deliveryVector` drives the in-fiction prose around the moment. `[high]`
↔ relates to: §Frontmatter schema, lib/quests/lines/way-of-thoth.ts, lib/quests/dialogue.ts (QuestNPCDialogue branches)

### [LORE]

**Q:** What's the three-stage pacing structure across the 14 fragments?
**A:** §Pacing groups fragments into three escalating stages. **Stage 1 — Wisdom flavor (palatable as moral instruction):** SH 2.1 (Virtue), 11.2 (Lamp), 18.3 (Soul's Doors), 1.1 (Standing Firm). Themes: virtue, light, soul-doors, standing-firm. Aimed at early-quest players still learning the Way's vocabulary; reads as gentle moral-philosophy aphorism. **Stage 2 — Soul architecture (daimons, descent, bondage):** SH 19.7 (Forgetfulness), 25.8 (Dreams), 23.5 (Body as Tomb), 7.4 (Three That Weave). Themes: forgetfulness, dreams, body-as-tomb, fate. Mid-quest stage — the player learns the soul has structure, descends through realms, can be bound by daimons. **Stage 3 — Cosmology + Word + warning:** SH 24.2 (Soul-Fashioning), 21.6 (All as One), 11.4 (Word), 26.5 (What Waits Beneath), 3.3 (Strange-Season), 27.1 (Calling-Home). Themes: soul-fashioning, the One, the Word, what-waits, rending, consummation. Late-quest culmination — the player learns the Word is generative, that something waits beneath, that a Calling-Home is coming. The capstone fragment SH 27.1 is read by Mother Khe-Anun at the lighthouse on the player's return from M-13 Red Nails of Xuchotl per ADVENTURE_MODULES_PLAN.md §5. `[high]`
↔ relates to: §Pacing, §Map (full 14-fragment delivery table), ADVENTURE_MODULES_PLAN.md §5, lib/quests/lines/way-of-thoth.ts

### [PICSSI-BALANCE]

**Q:** Is the default `illuminationDelta: 1` calibrated across the 14-fragment corpus, or is it an opening parameter?
**A:** Opening parameter. Keep flat at `+1 Trivial` per fragment (`14 × +1 = +14 Illumination`). Combined with Scrolls' proposed `+45`, the Way-of-Thoth Light-path totals `+59 of the +100 max` (Scrolls 76% / Fragments 24% split). Tuning happens in parallel with Scrolls tuning via (1) simulation of full-quest playthroughs, (2) player testing feedback. Likely tuning lever: **stage-weighted deltas** — if early/late quests show imbalance in Illumination pacing, adjust Fragments to deliver `+1 / +2 / +3` across the three stages (total `+30`) to mirror Scrolls' significance distribution. Document tuning decisions in a new §Tuning History section. `[high]`
↔ relates to: §Frontmatter schema (illuminationDelta field), KARMA_SYSTEM.md §2.10 Illumination, EV-scrolls_of_thoth_index-001 (parallel scroll-tuning EV)

---

# Stobaean Hermetic Fragments — Index

Fourteen short fragments, each carrying one philosophical thread of the broader Hermetic tradition. They are scattered across the Way of Thoth quest line as supplementary teachings — delivered by the fifteen mentors who carry the scrolls.

The numbering scheme (`SH 2.1`, `SH 11.2`, etc.) follows the canonical reference numbering of the Stobaean Hermetica — fragments preserved in Stobaeus's *Anthology* (5th century CE) of Hermetic-tradition Greek texts (~100–300 CE). The philosophical content itself is genuinely ancient public domain. **The prose in these files is original Living Eamon writing**, composed to carry each fragment's philosophical meaning into the game's voice. No modern translator's text is reproduced.

For traceability, frontmatter cites the canonical reference and notes the available scholarly readings (Walter Scott 1924, G.R.S. Mead 1906 — both US-PD).

## Pacing

| Stage | Theme | Fragments |
|-------|-------|-----------|
| Wisdom flavor (palatable as moral instruction) | virtue, light, soul-doors, standing-firm | SH 2.1, 11.2, 18.3, 1.1 |
| Soul architecture (daimons, descent, bondage) | forgetfulness, dreams, body-as-tomb, fate | SH 19.7, 25.8, 23.5, 7.4 |
| Cosmology + Word + warning | soul-fashioning, the One, the Word, what-waits, rending, consummation | SH 24.2, 21.6, 11.4, 26.5, 3.3, 27.1 |

## Map

| # | Fragment | Theme | Delivered by | At step | Vector |
|---|----------|-------|--------------|---------|--------|
| 1 | [SH 2.1](./SH-2.1.md) | On Virtue | Old Bram | scroll-2 | Spoken aloud |
| 2 | [SH 11.2](./SH-11.2.md) | On the Lamp | Sister Hela | scroll-3 | Mosaic engraving |
| 3 | [SH 18.3](./SH-18.3.md) | On the Soul's Doors | Vivian | scroll-4 | Pillow note |
| 4 | [SH 1.1](./SH-1.1.md) | On Standing Firm | Aldric | scroll-5 | Sword pommel |
| 5 | [SH 19.7](./SH-19.7.md) | On Forgetfulness | Hokas | scroll-6 | Drinking-song verse |
| 6 | [SH 25.8](./SH-25.8.md) | On Dreams | Maelis | scroll-7 | Sung dream |
| 7 | [SH 23.5](./SH-23.5.md) | On the Body as Tomb | Cassian | scroll-8 | Gravestone |
| 8 | [SH 7.4](./SH-7.4.md) | On Three That Weave | Tavren | scroll-9 | Helm interior |
| 9 | [SH 24.2](./SH-24.2.md) | On Soul-Fashioning | Yssa | scroll-10 | Healing-rite recitation |
| 10 | [SH 21.6](./SH-21.6.md) | On the All as One | Master Orin | scroll-11 | Book-spine etching |
| 11 | [SH 11.4](./SH-11.4.md) | On the Word | Rhonen | scroll-12 | Reagent-chest lid |
| 12 | [SH 26.5](./SH-26.5.md) | On What Waits Beneath | Tava | scroll-13 | Body tattoo |
| 13 | [SH 3.3](./SH-3.3.md) | On the Strange-Season | Brother Inan | scroll-14 | Codex flyleaf |
| 14 | [SH 27.1](./SH-27.1.md) | On the Calling-Home | Mother Khe-Anun | scroll-15 | Prophecy preamble |

## Frontmatter schema

```yaml
---
fragment: SH 2.1                    # canonical Stobaean reference
title: "On Virtue"
sourceTradition: |                  # source-of-meaning, not source-of-text
  Stobaean Hermetica fragment 2.1.
  Greek source c. 100–300 CE; preserved in Stobaeus's Anthology.
  Modern scholarly readings: Walter Scott Hermetica Vol. III (1924, US-PD);
  G.R.S. Mead Thrice-Greatest Hermes (1906, US-PD).
publicDomain: true
note: |
  Original Living Eamon prose. The ancient Hermetic ideas are
  themselves in the public domain by antiquity (~1800+ years).
  No modern translator's text is reproduced.
deliveryNpc: old_bram               # NPC who carries the fragment
deliveryStep: scroll-2              # Way-of-Thoth step it fires on
deliveryVector: spoken-aloud
themes: [virtue, recognition-of-debt]
illuminationDelta: 1                # +Illumination on first delivery
---
```
