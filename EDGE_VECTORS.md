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

### [KARMA_SYSTEM.md](/library/karma_system)

#### EV-karma_system-002  `[PICSSI-BALANCE]`
- **Source:** [KARMA_SYSTEM.md](/library/karma_system)
- **Question:** Are the my-judgment magnitudes (action-budget 20/25/30 tiers, gear-Standing formula `floor(value/100)` capped +20, wealth tiers 1k/5k/25k/100k → +5/+10/+20/+30, per-circle Illumination 0/0/0/−2/−4/−8/−15/−30, fatigue penalty +15·tier evasion-vs-player) tuned for end-game balance, or are they opening parameters?
- **Best guess:** Opening parameters. Scotch's standing direction is "use your judgment, balance later via Machinations.io." Likely tuning targets: action-budget spread too narrow, gear-Standing jewelry doubling too generous, Circle 8's −30 too punishing for a single cast, Tier-4 fatigue lockout too binary.
- **Confidence:** medium
- **Affects:** [KARMA_IMPLEMENTATION_PLAN.md](/library/karma_implementation_plan) (tuning sprint deferred), [GAME_DESIGN.md §11](/library/game_design), [SORCERY.md §7](/library/sorcery) (per-circle Illumination cost)
- **Resolution path:** ship Sprint 2 PICSSI bedrock + Sprint 3 activity dispatcher → author the first 20 atoms → run Machinations simulations on the resulting state space → record tuned magnitudes in a follow-up `§4a (Tuned YYYY-MM-DD)` block. Promote to `[high]` once the tuning pass produces stable distributions across 100+ simulated playthroughs.

### [MODULE_SYSTEM.md](/library/module_system)

#### EV-module_system-001  `[WIRING]`
- **Source:** [MODULE_SYSTEM.md](/library/module_system)
- **Question:** How will `tag_atom()` GPE-trace events be ingested in production — beyond the dev-only `console.log`?
- **Best guess:** A thin telemetry endpoint (e.g. `app/api/atom-trace/route.ts`) that POSTs `{atom_id, tier, virtues, player_id, session_id, ts}` to a Supabase `atom_traces` table. Use cases: most-traversed atoms, choice-distribution per virtue, archetype-skew vs actual play patterns. Volume planning required (one trace per atom per choice per session adds up).
- **Confidence:** open
- **Affects:** [MODULE_SYSTEM.md §4.2 + §5.7](/library/module_system) (tag_atom EXTERNAL + binding), `app/api/atom-trace/route.ts` (planned), `KARMA_IMPLEMENTATION_PLAN.md` Sprint 4b (post-Solomon-Kane authoring analytics)
- **Resolution path:** unblock when (a) Sprint 4 Ink loader ships and (b) at least one module is in production producing traces. Then formalize the prod ingestion path in MODULE_SYSTEM.md §5.7 with the table schema, retention policy, and a sampling rate to keep volume bounded. Promote to `[high]` once Solomon Kane Whispering Woods has produced 30+ days of traces and a dashboard exists.

#### EV-module_system-002  `[INK-AUTHORING]`
- **Source:** [MODULE_SYSTEM.md](/library/module_system)
- **Question:** What concrete migration path supports a breaking change to the EXTERNAL contract (1.0 → 2.0)?
- **Best guess:** Loader inspects `module.json.contractVersion` and either (a) refuses to load 1.0 modules (hard-deprecation, fine while install base is Scotch + 1 author) or (b) routes through a 1.0-shim that re-binds renamed/removed EXTERNALs to no-ops with a deprecation warning. Cost of breaking 1.0 is currently zero — no community modules exist — but Steam Workshop / Itch.io uploads make this load-bearing.
- **Confidence:** medium
- **Affects:** [MODULE_SYSTEM.md §4 + §4.5](/library/module_system) (contract + module.json), `lib/karma/loader.ts` (planned shim point), future Steam Workshop / Itch.io ingestion
- **Resolution path:** document the chosen migration strategy as a new §4.6 in MODULE_SYSTEM.md with worked examples for both rename and removal cases. Promote to `[high]` once a real 2.0 contract lands, an auto-test exercises a 1.0-pinned module under 2.0 runtime, and the deprecation warning surfaces visibly in dev mode.

### [SORCERY.md](/library/sorcery)

### [Public_Domain_Rules.md](/library/public_domain_rules)

#### EV-public_domain_rules-002  `[PD-SAFETY]`
- **Source:** [Public_Domain_Rules.md](/library/public_domain_rules)
- **Question:** What does the 2027 non-renewal audit for *Weird Tales* 1932–1933 issues entail — methodology, sources, who runs it, what triggers an early Bucket A migration?
- **Best guess:** Same approach as the 2026-04-30 audit that moved 1934–1936 stories. Sources: U.S. Copyright Office renewal records (Catalog of Copyright Entries 1959–1962 windows for 1932–1933 first-publications), Project Gutenberg Howard research notes, scholarly consensus on *Weird Tales* renewal practices. Verifies both (a) magazine issue not issue-renewed AND (b) Howard's individual contributions not separately renewed. Recommendation: schedule in LAUNCH_CRITERIA.md Tier 2 with a 2027-Q1 calendar trigger; results go into a new §11 entry plus Bucket A migration.
- **Confidence:** medium
- **Affects:** [Public_Domain_Rules.md §3.2 + §8 + §11](/library/public_domain_rules), `LAUNCH_CRITERIA.md` Tier 2 (planned 2027 audit item), `ADVENTURE_MODULES_PLAN.md` (1932–1933 modules currently deferred to 2028–2029 unlock)
- **Resolution path:** add a 2027-Q1 audit item to LAUNCH_CRITERIA.md Tier 2 with the methodology pinned. Run the audit. Document results in §11 Document History. Move stories to Bucket A if confirmed; otherwise leave them for the 2028 / 2029 95-year unlock. Promote to `[high]` once the audit completes and §11 records the outcome.

### [ADVENTURE_MODULES_PLAN.md](/library/adventure_modules_plan)

### [KARMA_IMPLEMENTATION_PLAN.md](/library/karma_implementation_plan)

#### EV-karma_implementation_plan-002  `[WIRING]`
- **Source:** [KARMA_IMPLEMENTATION_PLAN.md](/library/karma_implementation_plan)
- **Question:** How does the Scroll-of-Thoth riddle UI evolve from v1 chat-stream token to S6 modal?
- **Best guess:** v1 emits `__RIDDLE__` token via the existing token-driven verb-completion flow (matches `__YESNO__`, `__BARMAID_SELECT__`). S6 modal upgrade open questions: (a) per-scroll attempt budget vs v1 silent-no-Illumination, (b) reveal canonical answer after N failures (the Hermes→Thoth substitution can confuse first-time players), (c) whether the chat-stream fallback survives for headless tests after the modal ships.
- **Confidence:** medium
- **Affects:** [KARMA_IMPLEMENTATION_PLAN.md §Sprint 3 + §Sprint 6](/library/karma_implementation_plan), [lib/karma/scrolls.ts](/) (planned S3 module), `project_scroll_riddle_verification.md`
- **Resolution path:** ship Sprint 3 with the chat-stream token; gather playtest feedback on attempt-budget desire and reveal-after-N-failures threshold; design the S6 modal with those defaults baked in. Promote to `[high]` once the modal ships and the chat-stream fallback is validated as a headless-test path.

### [lore/hyborian-pd/MODULE_PLAN.md](/library/hyborian_pd_module_plan)

### [lore/thurian-cartography/WORLD_LOCATIONS.md](/library/world_locations)

#### EV-world_locations-001  `[NAV-MAP]`
- **Source:** [WORLD_LOCATIONS.md](/library/world_locations)
- **Question:** Which of the 34 nodes (12 nations + 6 cities + 5 POIs + 11 wilderness areas) are actually travel destinations vs lore-on-map references?
- **Best guess:** TRAVEL_MATRIX.md §Travel Nodes lists only 16 destinations. The other 18 nodes (8 nations, 10 wilderness areas) appear here with map coords + lore but have no destination row in the matrix — likely lore-on-map references for narrative texture, traversed as zones during travel but not direct click targets in v1.
- **Confidence:** open
- **Affects:** [TRAVEL_MATRIX.md §Travel Nodes](/library/travel_matrix) (16-destination list), [WORLD_LOCATIONS.md §Adventure module location tagging](/library/world_locations), `~/.claude/plans/i-accidentally-submitted-the-misty-map.md` (S4 click-targets)
- **Resolution path:** Scotch decides per-node whether each lore-only node should become a travel destination. Update TRAVEL_MATRIX.md §Travel Nodes with the new destinations + matrix rows from `valus`. Add a `nodeKind: 'destination' | 'lore-only'` field to WORLD_LOCATIONS entries so the travel UI can filter click-targets without ambiguity. Promote to `[high]` once the registry is consistent and module `locationId` validation rejects lore-only ids.

### [lore/thurian-cartography/TRAVEL_MATRIX.md](/library/travel_matrix)

### [lore/thurian-cartography/LOOT_TABLES.md](/library/loot_tables)

### [lore/scrolls-of-thoth/INDEX.md](/library/scrolls_of_thoth_index)

### [lore/stobaean-fragments/INDEX.md](/library/stobaean_fragments_index)

### [GAME_DESIGN.md](/library/game_design)

---

## Resolved

_(empty until first entry resolves)_
