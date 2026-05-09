---
id: edge_vectors
title: Edge Vectors — Open Questions Across the Canon
role: design-canon
canonical_for: [open-questions, design-uncertainty, cross-doc-edges]
visibility: creator
status: rolling
last_updated: 2026-05-09
cross_refs: [DOC_MAP.md]
---

# Edge Vectors — Open Questions Across the Canon

The "open questions" backlog for Living Eamon. Every entry traces back to a source doc whose Q+A block (added by the doc-orchestration sprint, 2026-05-09) flagged it as `[medium]`, `[low]`, or `[open]` confidence. Resolving these is what moves the canon from *partially-articulated* to *fully-articulated*.

## How this file relates to the rest of the system

- **Source of truth for "what we haven't decided yet."** Every other canonical doc claims to be canonical *for what it owns*; this doc is canonical for *what nobody owns yet*.
- **The canonical inverse of per-doc Q+A blocks.** When a doc has frontmatter `edge_vector_ids: [EV-pantheon-001, EV-pantheon-002]`, both ids must have a matching `### EV-pantheon-001` and `### EV-pantheon-002` entry below.
- **A graph node, not a leaf.** Every entry's `Affects:` field is an edge — a future Mermaid renderer or Graphify pass will use these to surface where uncertainty bleeds across documents.

## Schema

Every entry conforms to:

```markdown
### EV-<doc-id>-NNN  `[CATEGORY]`
- **Source:** path/to/source-doc.md (link goes to /library/<source-id>)
- **Question:** the question, copied verbatim from the source doc Q+A block
- **Best guess:** the source doc's best-guess answer, or "no answer yet"
- **Confidence:** open | low | medium  (high never appears here — high goes only in the source doc)
- **Affects:** other docs and/or code paths that depend on resolving this
- **Resolution path:** what would have to happen for this to become `[high]`
```

**ID convention:** `EV-<doc-id-slug>-<3-digit-sequence>`. Slug matches the `id` field in DOC_MAP.md. Numbers are stable — we never re-number to fill gaps; we only delete when a question is fully resolved (and even then, prefer marking `[resolved YYYY-MM-DD]` and keeping the entry as a historical pointer).

## How to resolve an entry

1. Answer the question in conversation or in a session decision.
2. Update the source doc's Q+A block: change `[open]` → `[high]`, write the answer.
3. Decrement `questions_open`, increment `questions_answered`, remove the EV id from `edge_vector_ids` in the source doc's frontmatter.
4. Either delete the entry here, or annotate it with `**Resolved:** YYYY-MM-DD — see <source-doc>` and move it to the **Resolved** section below.

## How to add an entry

1. Author the question + best-guess answer in the source doc's Q+A block at confidence `[open]` / `[low]` / `[medium]`.
2. Assign the next sequential ID: `EV-<source-doc-id>-NNN`.
3. Add an entry here under the source doc's heading. Fill in all schema fields.
4. Update the source doc's frontmatter counts + `edge_vector_ids` array.

---

## Entries

### [lore/pantheon/PANTHEON.md](/library/pantheon)

#### EV-pantheon-001  `[INK-AUTHORING]`
- **Source:** [lore/pantheon/PANTHEON.md](/library/pantheon)
- **Question:** How will Ink module authors reference deities when writing modules?
- **Best guess:** An EXTERNAL function `pray_to(deity_id)` mutating `divineFavor` + maybe `picssi_spirituality` per the deity's `acceptsActs` / `rejectsActs` table (defined in the future god registry). Module authors would also use deity-keyed flags in atom choices (e.g., `flag_set("witnessed_anubis_rite")`).
- **Confidence:** open
- **Affects:** [MODULE_SYSTEM.md §3 (Ink EXTERNAL contract)](/library/module_system), `lib/gods/registry.ts` (planned)
- **Resolution path:** unblock when (a) `MODULE_SYSTEM.md` Stage I approval lands and (b) `lib/gods/` ships in the PRAY+Divinity v1 sprint (`~/.claude/plans/the-skull-and-pack-luminous-muffin.md`). Then formalize the deity-touching EXTERNAL functions in MODULE_SYSTEM.md §3 with examples; promote this to `[high]` once a creator-authored test module exercises them end-to-end.

#### EV-pantheon-002  `[AFFECT-VECTOR]`
- **Source:** [lore/pantheon/PANTHEON.md](/library/pantheon)
- **Question:** What neuro-emotional axes does invoking each deity surface?
- **Best guess:** awe (high-tier ritual, Solar Barque ascension); dread (Set, Sekhmet's Helfara face, Outer Dark proximity); wonder (Mandjet Day Barque, Thoth's mathematics, Mirror of Endless Form); melancholy (Crom-the-silent, Honen-after-the-Cataclysm); reverence (Ma'at's feather-weighing, Anubis's threshold rites). Not validated against the atom corpus.
- **Confidence:** open
- **Affects:** [docs/affect-axes.md](/library/affect_axes), [KARMA_SYSTEM.md](/library/karma_system)
- **Resolution path:** map each deity to a primary + secondary axis from the seven canonical (fear / excitement / eros / dread / awe / wonder / melancholy). Author the table in PANTHEON.md or as a new section in `docs/affect-axes.md`. Validate by sampling 20+ atoms tagged for divine encounters and comparing their AffectVector deltas to the proposed map.

### [KARMA_SYSTEM.md](/library/karma_system)

#### EV-karma_system-001  `[INK-AUTHORING]`
- **Source:** [KARMA_SYSTEM.md](/library/karma_system)
- **Question:** How will Ink module authors apply PICSSI deltas inside an .ink file?
- **Best guess:** An EXTERNAL function `apply_karma(virtue_id, magnitude_band)` taking the canonical band names (`trivial` / `notable` / `major` / `defining`) rather than raw integers — runtime owns the numbers so balance changes don't require module rewrites. Sign convention TBD: either a separate `apply_karma_loss` EXTERNAL or a signed band token like `notable_loss`.
- **Confidence:** open
- **Affects:** [MODULE_SYSTEM.md §3 (Ink EXTERNAL contract)](/library/module_system), `KARMA_IMPLEMENTATION_PLAN.md` Sprint 4 (atom-trigger hooks)
- **Resolution path:** unblock when `MODULE_SYSTEM.md` Stage I approval lands; formalize the apply_karma signature in MODULE_SYSTEM.md §3 with example .ink usage; promote to `[high]` once the first creator-authored module exercises both gain and loss paths end-to-end through GPE balance scoring.

#### EV-karma_system-002  `[PICSSI-BALANCE]`
- **Source:** [KARMA_SYSTEM.md](/library/karma_system)
- **Question:** Are the my-judgment magnitudes (action-budget 20/25/30 tiers, gear-Standing formula `floor(value/100)` capped +20, wealth tiers 1k/5k/25k/100k → +5/+10/+20/+30, per-circle Illumination 0/0/0/−2/−4/−8/−15/−30, fatigue penalty +15·tier evasion-vs-player) tuned for end-game balance, or are they opening parameters?
- **Best guess:** Opening parameters. Scotch's standing direction is "use your judgment, balance later via Machinations.io." Likely tuning targets: action-budget spread too narrow, gear-Standing jewelry doubling too generous, Circle 8's −30 too punishing for a single cast, Tier-4 fatigue lockout too binary.
- **Confidence:** medium
- **Affects:** [KARMA_IMPLEMENTATION_PLAN.md](/library/karma_implementation_plan) (tuning sprint deferred), [GAME_DESIGN.md §11](/library/game_design), [SORCERY.md §7](/library/sorcery) (per-circle Illumination cost)
- **Resolution path:** ship Sprint 2 PICSSI bedrock + Sprint 3 activity dispatcher → author the first 20 atoms → run Machinations simulations on the resulting state space → record tuned magnitudes in a follow-up `§4a (Tuned YYYY-MM-DD)` block. Promote to `[high]` once the tuning pass produces stable distributions across 100+ simulated playthroughs.

### [GAME_DESIGN.md](/library/game_design)

#### EV-game_design-001  `[AFFECT-VECTOR]`
- **Source:** [GAME_DESIGN.md](/library/game_design)
- **Question:** How do PICSSI virtues correlate with the seven AffectVector axes?
- **Best guess:** Likely correlated but unformalized. Examples: Passion ↔ eros + excitement; Courage ↔ fear (overcome) + dread (faced); Spirituality ↔ awe + wonder; Standing ↔ excitement + maybe dread (humiliation as anti-Standing). Not specified anywhere.
- **Confidence:** open
- **Affects:** [docs/affect-axes.md](/library/affect_axes), [KARMA_SYSTEM.md](/library/karma_system), [MODULE_SYSTEM.md §7 (GPE)](/library/module_system)
- **Resolution path:** author a virtue↔axis matrix as a new section in `docs/affect-axes.md` (or as §11.X of GAME_DESIGN.md). Cross-validate against the atom registry — do high-eros atoms typically have +Passion deltas? Once the matrix is locked, GPE can use it to score AffectVector balance per module alongside PICSSI balance.

#### EV-game_design-002  `[INK-AUTHORING]`
- **Source:** [GAME_DESIGN.md](/library/game_design)
- **Question:** Can a module simultaneously satisfy PD-safety AND PICSSI-balance AND a single-archetype focus (e.g., "Standing-pure")?
- **Best guess:** Probably yes for most archetype themes, but the constraint matrix isn't proven. A Standing-pure module would tend toward visible victory, conspicuous wealth, donations-for-show; that doesn't conflict with PD rules (Howard fiction is full of this) and is internally PICSSI-balanced if the spec says "intentionally archetype-focused modules can be unbalanced" (per KARMA_SYSTEM 2026-05-06 update). But edge cases: e.g., a Spirituality-pure module might struggle to ship a Courage "great odds" encounter without breaking archetype.
- **Confidence:** medium
- **Affects:** [MODULE_SYSTEM.md §2 (GPE)](/library/module_system), [MODULE_SYSTEM.md §7](/library/module_system), [KARMA_SYSTEM.md](/library/karma_system) (Courage robust paths rule)
- **Resolution path:** when the first creator authors a real "archetype-pure" module, run GPE on it and check whether the PICSSI-balance + PD-safety + archetype-purity all hold simultaneously. Document the resolution as either a "yes, all three are compatible" or as a list of incompatible archetype + balance combinations.

---

## Resolved

_(empty until first entry resolves)_
