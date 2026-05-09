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

#### EV-sorcery-001  `[INK-AUTHORING]`
- **Source:** [SORCERY.md](/library/sorcery)
- **Question:** How will an Ink module author force a sorcery effect on the player — e.g., an NPC sorcerer casting Circle-7 mid-atom, or an atom granting a custom invocation rune?
- **Best guess:** Either (a) two new EXTERNALs — `npc_invoke(npc_id, spell_id, target_id)` routing through the existing Force-0 combat-engine path, plus `add_invocation(spell_id)` for the known-Words registry on PlayerState — or (b) keep NPC sorcery scripted in `lib/encounters/<id>.ts` and only expose `add_invocation` to Ink. Decision deferred until the first module needs an enemy sorcerer beat.
- **Confidence:** open
- **Affects:** [MODULE_SYSTEM.md §4.2](/library/module_system) (EXTERNAL contract), `lib/encounters/<id>.ts` (planned NPC sorcery records), [KARMA_SYSTEM.md §2.10](/library/karma_system) (Illumination on player-caused vs NPC-caused sorcery)
- **Resolution path:** when the first PD module with a named sorcerer antagonist enters scoping, design the minimal EXTERNAL surface (probably `add_invocation` first, `npc_invoke` only if scripted encounters prove insufficient). Document the chosen contract in MODULE_SYSTEM.md §4.2 with worked examples. Promote to `[high]` once a module exercises both paths through a real Ink-driven encounter.

#### EV-sorcery-002  `[WIRING]`
- **Source:** [SORCERY.md](/library/sorcery)
- **Question:** Which Circles are actually wired in production code, and what infrastructure does the Resurrection sun/moon corpse model still need?
- **Best guess:** Production today: Guild CAST Circles 1+2 (13 real spells, Sprint C6.1); INVOKE pipeline not wired to combat; Circles 4–8 deferred. Resurrection corpse model — sun/moon exposure flags, world-tick exposure updates, burial mechanic, mortal/immortal classification, hero-death short-circuit, undead-likelihood roll, necromancy variant — is design-only. The mortal/immortal NPC tag is a no-cost addition that should land **before** any Resurrection wiring sprint to avoid retro-tagging every NPC kind.
- **Confidence:** medium
- **Affects:** [SORCERY.md §9.3](/library/sorcery) (Resurrection implementation entailments), `project_corpse_loot_burial_deferred.md`, `project_occult_sorcery_deferred.md`, [KARMA_IMPLEMENTATION_PLAN.md](/library/karma_implementation_plan) Sprint 7 (deferred Sorcery sprint)
- **Resolution path:** add `mortalOrImmortal: 'mortal' | 'immortal'` to every NPC kind during the next NPC-data sweep (cheap, no-state). When the corpse-loot/burial sprint lands per `project_corpse_loot_burial_deferred.md`, extend the corpse model with `sunExposed` + `moonExposed` flags + a `locationContext: 'surface' | 'buried' | 'underground'` enum, and tick the celestial flags in `tickWorldState`. Promote to `[high]` once a Resurrection cast in test exercises a buried corpse vs a sun-and-moon-exposed corpse and produces the documented outcomes.

### [Public_Domain_Rules.md](/library/public_domain_rules)

#### EV-public_domain_rules-001  `[INK-AUTHORING]`
- **Source:** [Public_Domain_Rules.md](/library/public_domain_rules)
- **Question:** Is there an automated check that flags PD-violation candidates in module prose before commit?
- **Best guess:** A `tools/pd-lint/` script that walks all `.ink` files + `module.json` + module READMEs and scans for the §2.1 trademark list (Conan / Cimmerian / Hyborian / Cimmeria / Hyboria) plus the Bucket B character lookup. Runs in `prebuild` alongside `validate-modules` and `gpe:all --strict`. Ambiguity: Aquilonia is allowed in narrative but forbidden in marketing — the linter needs conservative defaults plus per-rule allowlist + per-string surface-context tags from authors.
- **Confidence:** open
- **Affects:** [MODULE_SYSTEM.md §3](/library/module_system) (prebuild hooks), `tools/pd-lint/` (planned), `GAME_DESIGN.md` top-of-file Safe Harbor / Radioactive tables (lookup data source)
- **Resolution path:** unblock when (a) `MODULE_SYSTEM.md` Stage I lands and (b) the first community-authored module attempts a commit. Author the linter with the §2.1 trademark list as a hard-fail rule, the Bucket B character list as a warning-with-justification rule, and a per-string surface-context tag (`# context: marketing` vs `# context: prose`) so the GAME_DESIGN.md "Aquilonia OK in prose, forbidden in marketing" rule can resolve. Promote to `[high]` once the linter ships and at least one PR has surfaced a real catch.

#### EV-public_domain_rules-002  `[PD-SAFETY]`
- **Source:** [Public_Domain_Rules.md](/library/public_domain_rules)
- **Question:** What does the 2027 non-renewal audit for *Weird Tales* 1932–1933 issues entail — methodology, sources, who runs it, what triggers an early Bucket A migration?
- **Best guess:** Same approach as the 2026-04-30 audit that moved 1934–1936 stories. Sources: U.S. Copyright Office renewal records (Catalog of Copyright Entries 1959–1962 windows for 1932–1933 first-publications), Project Gutenberg Howard research notes, scholarly consensus on *Weird Tales* renewal practices. Verifies both (a) magazine issue not issue-renewed AND (b) Howard's individual contributions not separately renewed. Recommendation: schedule in LAUNCH_CRITERIA.md Tier 2 with a 2027-Q1 calendar trigger; results go into a new §11 entry plus Bucket A migration.
- **Confidence:** medium
- **Affects:** [Public_Domain_Rules.md §3.2 + §8 + §11](/library/public_domain_rules), `LAUNCH_CRITERIA.md` Tier 2 (planned 2027 audit item), `ADVENTURE_MODULES_PLAN.md` (1932–1933 modules currently deferred to 2028–2029 unlock)
- **Resolution path:** add a 2027-Q1 audit item to LAUNCH_CRITERIA.md Tier 2 with the methodology pinned. Run the audit. Document results in §11 Document History. Move stories to Bucket A if confirmed; otherwise leave them for the 2028 / 2029 95-year unlock. Promote to `[high]` once the audit completes and §11 records the outcome.

### [ADVENTURE_MODULES_PLAN.md](/library/adventure_modules_plan)

#### EV-adventure_modules_plan-001  `[PICSSI-BALANCE]`
- **Source:** [ADVENTURE_MODULES_PLAN.md](/library/adventure_modules_plan)
- **Question:** What's the per-module GPE balance-score target band and `intentionallySkewed` declaration set for each of the 18 modules?
- **Best guess:** Capstone modules (M-10, M-12, M-13) target balanced (≥80) on the four engaged virtues with explicit `intentionallySkewed` covering the unengaged two. Novice/moderate modules (M-1, M-9, M-15) accept tilted (50–79). Atlantean wonder-tech showcases (M-18, M-13) accept skewed (20–49) when focus is genre-tonal. Per-module declaration locks during authoring; calibrate from real GPE data on the first module.
- **Confidence:** open
- **Affects:** [MODULE_SYSTEM.md §7.4 Verdict tiers + §4.5 module.json](/library/module_system), [KARMA_SYSTEM.md §2.5–§2.10](/library/karma_system) PICSSI magnitudes, all 18 modules in §3 roster
- **Resolution path:** unblock when (a) GPE ships per MODULE_SYSTEM Stage I and (b) M-1 Mirror Tower is GPE-scored. Backfill an `intentionallySkewed` + `targetVerdict` field on every roster entry in §3. Promote to `[high]` once 3+ modules have shipped and their GPE scores have been compared against authored intent.

#### EV-adventure_modules_plan-002  `[LORE]`
- **Source:** [ADVENTURE_MODULES_PLAN.md](/library/adventure_modules_plan)
- **Question:** Tier 2 modules (M-14 through M-18) are framed as either "Atlantean wonder-age past" or "cross-genre present-day excursion" — when does each option apply, and does the player notice the framing change?
- **Best guess:** A per-module decision recorded at authoring time as `framing: "deep-time-ruin" | "cross-genre-present"` on `module.json`. Player notices tonal shift but not jarring genre rupture — Eamon's "anything goes" precedent applies but Howard's voice register is the consistent envelope. M-18 is explicitly deep-time-ruin (Atlantean reactor); M-14 leans cross-genre-present (steam-and-occult Valus); M-15/M-16/M-17 reuse the Salt-Marsh region and read as cross-genre.
- **Confidence:** medium
- **Affects:** [ADVENTURE_MODULES_PLAN.md §3 Tier 2 introduction + entries M-14..M-18](/library/adventure_modules_plan), [MODULE_SYSTEM.md §4.5 module.json](/library/module_system) (planned framing field), feedback_no_hyborian_in_marketing.md
- **Resolution path:** when the first Tier 2 module enters scoping, decide its `framing` value and lock the convention. Document the per-module choice in §3 Tier 2 entries. Promote to `[high]` once 2+ Tier 2 modules ship and player tonal-feedback is collected.

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
