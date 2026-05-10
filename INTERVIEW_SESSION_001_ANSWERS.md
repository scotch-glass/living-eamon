---
session: interview_001
date: 2026-05-10
interviewer: Haiku (Claude Code)
interviewee: Scotch (Living Eamon founder)
status: complete
questions_answered: 11
questions_remaining: 12
---

# Interview Session 001 — Locked Design Answers

**Purpose:** Parallel coder hydration. All answers below are [high] confidence, locked into design canon, and reflected in source docs.

---

## Answered Questions (11) — LOCKED

### 1. EV-karma_implementation_plan-001 | Atom Priority Resolution
**Question:** When multiple atoms match the same trigger event, what's the priority resolution rule?

**Answer:** Three-class semantic priority system:
1. **Scroll-quest atoms** (highest) — atoms central to the Scroll quest line
2. **Quest-related atoms** — atoms directly tied to quests but not Scroll-central
3. **AffectVector atoms** — atoms primarily driven by emotional/psychological resonance

**Tie-breaking:** Call an agent to break ties within the same class.

**Source:** KARMA_IMPLEMENTATION_PLAN.md §Wiring Q2
**Status:** [high] confidence, locked
**Coder notes:** Implement during Sprint 4 atom loading; add `priorityClass` field to `Atom` type.

---

### 2. EV-karma_system-001 | EXTERNAL apply_karma Signature
**Question:** How will Ink module authors apply PICSSI deltas inside an .ink file?

**Answer:** Single EXTERNAL function `apply_karma(virtue_id, magnitude_band)` with **signed band tokens**.

**Signature:**
```typescript
apply_karma(virtue_id: 'passion'|'integrity'|'courage'|'standing'|'spirituality'|'illumination',
            magnitude_band: 'trivial'|'trivial_loss'|'notable'|'notable_loss'|'major'|'major_loss'|'defining'|'defining_loss')
```

**Example usage in .ink:** `apply_karma("standing", "defining_loss")` or `apply_karma("integrity", "notable")`

**Rationale:** Single function with signed tokens is simpler than dual `apply_karma` / `apply_karma_loss` functions. Runtime owns canonical numbers; balance changes don't require module rewrites.

**Source:** KARMA_SYSTEM.md §INK-AUTHORING Q5
**Status:** [high] confidence, locked
**Coder notes:** Wire in Sprint 4 atom dispatcher + MODULE_SYSTEM.md Stage I.

---

### 3. EV-loot_tables-001 | Loot Tier Ratios & PICSSI Deltas
**Question:** Are the loot tier ratios (45/27/18/9/1), enemy modifiers (−10 to +40), and PICSSI deltas tuned for end-game balance, or are they opening parameters?

**Answer:** **Opening parameters.** Tuned via (1) simulation of 30+ play-loops, (2) player testing feedback once game is functional.

**Current values:**
- Tier ratios: Common 45% / Uncommon 27% / Rare 18% / Legendary 9% / Special 1%
- Enemy modifiers: −10 to +40
- PICSSI deltas on loot actions: per KARMA_SYSTEM.md §2.5–§2.10

**Source:** lore/thurian-cartography/LOOT_TABLES.md §PICSSI-BALANCE Q6
**Status:** [high] confidence, locked as opening parameters
**Coder notes:** Record tuning decisions in §Tuning History once simulation runs.

---

### 4. EV-pantheon-001 | Ink Deity Reference EXTERNAL
**Question:** How will Ink module authors reference deities when writing modules?

**Answer:** EXTERNAL function `pray_to(deity_id)` that mutates `divineFavor` + maybe `picssi_spirituality` per the deity's `acceptsActs` / `rejectsActs` table (defined in future god registry). Module authors also use deity-keyed flags in atom choices (e.g., `flag_set("witnessed_anubis_rite")`).

**Implementation requirement:** Provide **controls/UI to make it easy for authors** to work with deity mechanics — likely a deity reference panel or linter helper showing per-deity acceptsActs/rejectsActs at authoring time.

**Source:** lore/pantheon/PANTHEON.md §INK-AUTHORING Q6
**Status:** [high] confidence, locked
**Coder notes:** Wire in PRAY+Divinity v1 sprint (`lib/gods/registry.ts` + `lib/karma/pray.ts`).

---

### 5. EV-pantheon-002 | Deity AffectVector Axes
**Question:** What neuro-emotional axes does invoking each deity surface?

**Answer:** Six AffectVector axes map to deities:
- **awe** (high-tier ritual, Solar Barque ascension)
- **dread** (Set, Sekhmet's Helfara face, Outer Dark proximity)
- **wonder** (Mandjet Day Barque, Thoth's mathematics, Mirror of Endless Form)
- **courage** (Active-Crom, Honen prior to the Cataclysm)
- **reverence** (Ma'at's feather-weighing, Anubis's threshold rites)
- **eros** (Isis as goddess of fertility)

**Source:** lore/pantheon/PANTHEON.md §AFFECT-VECTOR Q8
**Status:** [high] confidence, locked
**Coder notes:** Validate by sampling 20+ atoms tagged for divine encounters; compare AffectVector deltas against this map.

---

### 6. EV-public_domain_rules-001 | PD Linter Script
**Question:** Is there an automated check that flags PD-violation candidates in module prose before commit?

**Answer:** **Yes — `tools/pd-lint/` script.** Walks all `.ink` files + `module.json` + module READMEs and scans for:
- §2.1 trademark list (Conan / Cimmerian / Hyborian / Cimmeria / Hyboria)
- Bucket B character lookup table

**Execution:** Runs in `prebuild` alongside `validate-modules` + `gpe:all --strict`.

**Implementation details** (deferred): Aquilonia handling, per-rule allowlists, marketing-vs-prose context tagging.

**Source:** Public_Domain_Rules.md §INK-AUTHORING Q9
**Status:** [high] confidence, locked
**Coder notes:** Build script in MODULE_SYSTEM.md Stage I + tooling sprint.

---

### 7. EV-scrolls_of_thoth_index-001 | Scroll Illumination Delta
**Question:** Is the proposed `+3 Notable` Illumination delta per scroll calibrated for the 15-scroll corpus, or is it an opening parameter?

**Answer:** **Opening parameter.** Current `+3 per scroll × 15 = +45 Illumination` is a best guess (45% of the +100 max).

**Tuning approach:** Via (1) simulation of full-quest playthroughs, (2) player testing feedback once game is functional.

**Likely tuning lever:** Stage-weighted deltas if simulation shows Scrolls over/undervalue early or late content.

**Source:** lore/scrolls-of-thoth/INDEX.md §PICSSI-BALANCE Q6
**Status:** [high] confidence, locked as opening parameter
**Coder notes:** Tune alongside Stobaean Fragments so both share same calibration philosophy. Record in §Tuning History.

---

### 8. EV-sorcery-002 | CAST vs INVOKE Wiring Status
**Question:** Which Circles are actually wired in production code today, and what infrastructure is the Resurrection sun/moon corpse model still missing?

**Answer:**
- **Guild CAST Circles 1+2:** Most spells registered and functionally wired in `lib/combat/engine.ts` (HEAL, GREATER-HEAL, FIREBOLT, HASTE, WARD, STEELSKIN, SILENCE, RESIST, CLEANSE, etc.)
- **Circles 3–8:** Registered but handlers stubbed (effectKind only; no numeric resolution)
- **Occult INVOKE:** Zero spells wired to combat; parser exists but no dispatch handlers

**Resurrection corpse model:** Design-only, no code yet. Missing: sun/moon exposure flags, burial mechanics, mortal/immortal classification, undead-likelihood roll, necromancy variants.

**Action:** Add `mortalOrImmortal` NPC tag before Resurrection wiring sprint.

**Source:** SORCERY.md §WIRING Q10
**Status:** [high] confidence, locked
**Coder notes:** Circles 3–8 stub handlers can dispatch to effects during later sprints.

---

### 9. EV-stobaean_fragments_index-001 | Fragment Illumination Delta
**Question:** Is the default `illuminationDelta: 1` per fragment calibrated across the 14-fragment corpus, or is it an opening parameter?

**Answer:** **Opening parameter.** Keep flat at `+1 Trivial` per fragment (`14 × +1 = +14 Illumination`).

**Combined Light path:** Scrolls `+45` + Fragments `+14` = `+59 of the +100 max` (Scrolls 76% / Fragments 24% split).

**Tuning approach:** Via (1) simulation, (2) player testing. Likely lever: **stage-weighted deltas** (`+1 / +2 / +3` across three stages) if early/late pacing shows imbalance.

**Source:** lore/stobaean-fragments/INDEX.md §PICSSI-BALANCE Q6
**Status:** [high] confidence, locked as opening parameter
**Coder notes:** Tune in parallel with Scrolls tuning.

---

### 10. EV-travel_matrix-001 | Travel Day-Counts
**Question:** Are the matrix's per-route day-counts and danger ratings empirically tuned, or are they opening parameters?

**Answer:** **Opening parameters.** Current day-counts are **too short** and need recalibration upward.

**Recalibration basis:** Historical pre-modern travel rates (~20 miles/day on foot).

**Current vs. corrected:**
- Horse divisor: Current 2× → Correct to 3× (short) / 1.5× (sustained)
- Sea crossings: Add explicit `seaOnly: boolean` flag

**Tuning approach:** During S4 playtest routes via exact map-pixel-to-mileage conversion + zone-type speed modifiers.

**Source:** lore/thurian-cartography/TRAVEL_MATRIX.md §NAV-MAP Q6
**Status:** [high] confidence, locked
**Coder notes:** Record recalibrated values + methodology in §Tuning History.

---

### 11. EV-world_locations-001 | Lore-on-Map References
**Question:** Which of the 34 nodes are actually travel destinations vs lore-on-map references?

**Answer:** **18 nodes are lore-on-map references** for narrative texture (8 nations + 10 wilderness areas). Traversed as zones during travel but not direct click targets in v1.

**Infrastructure requirement:** Each lore-only node needs:
- Regional descriptions
- Peoples / dominant cultures
- Dominant gods

**Future unlock:** Future sprints can add specific adventures and convert lore-only nodes to travel destinations as needed.

**Implementation:** Add `nodeKind: 'destination' | 'lore-only'` field to WORLD_LOCATIONS entries so travel UI filters click-targets without ambiguity.

**Source:** lore/thurian-cartography/WORLD_LOCATIONS.md §NAV-MAP Q6
**Status:** [high] confidence, locked
**Coder notes:** Make lore-only node data available to Ink authors for adventure settings.

---

## Remaining Questions (12) — AWAITS_ANSWER

### Priority 2 (Mid-Tier Design)
1. **EV-adventure_modules_plan-001** — Per-module Growth Path Equalizer balance-score targets + intentionallySkewed declarations
2. **EV-game_design-001** — PICSSI ↔ AffectVector axes correlation matrix
3. **EV-game_design-002** — Can PD-safety + PICSSI-balance + single-archetype focus coexist?
4. **EV-sorcery-002** — (Note: May be stale; verify in EDGE_VECTORS.md)
5. **EV-hyborian_pd_module_plan-001** — Is §9 PD calendar still accurate post-2026-04-30 audit?
6. **EV-hyborian_pd_module_plan-002** — Canonical division of ownership between MODULE_PLAN.md and ADVENTURE_MODULES_PLAN.md

### Priority 0 (Deferred / Post-Launch)
7. **EV-module_system-001** — How will `tag_atom()` GPE-trace events be ingested in production?
8. **EV-module_system-002** — Breaking change migration path for EXTERNAL contract (1.0 → 2.0)?
9. **EV-public_domain_rules-002** — What does the 2027 non-renewal audit for *Weird Tales* 1932–1933 entail?
10. **EV-karma_implementation_plan-002** — Scroll-of-Thoth riddle UI evolution (v1 chat-stream → S6 modal)?
11-12. **2 others** (check EDGE_VECTORS.md for full list)

---

## Key Design Decisions Now Locked

- ✅ Atom priority is semantic (3-class), not numeric
- ✅ Ink PICSSI deltas use signed band tokens, not separate functions
- ✅ All major balance parameters (loot, scrolls, fragments, travel) are opening parameters to be tuned via simulation + playtesting
- ✅ Deity interaction uses `pray_to()` EXTERNAL with author support infrastructure required
- ✅ Deity AffectVector mapping is fixed (awe, dread, wonder, courage, reverence, eros)
- ✅ PD linting is automated via `tools/pd-lint/` script
- ✅ CAST most-wired, INVOKE not-wired, Resurrection design-only
- ✅ 18 world nodes are lore-on-map (need author-facing regional data), 16 are travel destinations
- ✅ Travel day-counts need upward recalibration based on realistic pre-modern rates

---

## Next Session Prep

**For parallel coder:** All 11 answers above are reflected in source docs (KARMA_SYSTEM.md, PANTHEON.md, SORCERY.md, etc.). No conflicting guidance remains.

**For next interview session:** Start with Priority 2 questions (EV-adventure_modules_plan-001 onward) when ready.

