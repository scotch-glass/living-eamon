---
id: launch_criteria
title: Launch Criteria — Three-Tier Checklist
role: design-canon
canonical_for: [launch-readiness, tier-0-mvp-blockers, tier-1-polish, tier-2-post-launch]
visibility: creator
status: draft
last_updated: 2026-05-09
cross_refs: [DOC_MAP.md, ADVENTURE_MODULES_PLAN.md, KARMA_IMPLEMENTATION_PLAN.md, GAME_DESIGN.md]
---

## Questions answered by this document

> Answers are tagged by category and confidence (`[high]` / `[medium]` / `[low]` / `[open]`).
> Non-`[high]` answers are mirrored in [`EDGE_VECTORS.md`](EDGE_VECTORS.md) under their `EV-` id.

### [ARCHITECTURE]

**Q:** What is the canonical "ready to launch" definition for Living Eamon?
**A:** Three tiers. **Tier 0 = MVP-blockers** (cannot launch without). **Tier 1 = launch polish** (great launch needs). **Tier 2 = post-launch** (ships in updates). The launch-readiness report (`docs/launch-readiness.md`, auto-generated) consumes this doc + the doc graph to compute priority scores per item, surfacing what to authorize next. `[high]`
↔ relates to: docs/launch-readiness.md, scripts/launch-readiness.ts, DOC_MAP.md

### [ARCHITECTURE]

**Q:** How does this doc relate to sprint plans like KARMA_IMPLEMENTATION_PLAN, ADVENTURE_MODULES_PLAN, etc.?
**A:** Sprint plans say *how* to build a thing. This doc says *what must be built before launch*. Each Tier-0 / Tier-1 item names its sprint plan in the `source:` field. The launch-readiness report walks the dependency from this doc → sprint plan → open EVs to compute priority. `[high]`
↔ relates to: KARMA_IMPLEMENTATION_PLAN.md, ADVENTURE_MODULES_PLAN.md, MODULE_SYSTEM.md

### [WIRING]

**Q:** Who maintains this doc?
**A:** Drafted by Claude from existing context (sprint plans, splash page, project memory) on 2026-05-09. Reviewed and adjusted by Scotch. **Hand-maintained going forward.** Status fields update as items ship; new items get added when scope changes. The launch-readiness report regenerates automatically from this + the doc graph. `[high]`
↔ relates to: feedback_doc_map_discipline.md

---

# Launch Criteria — Three-Tier Checklist

This document is the canonical answer to: *what must be true for Living Eamon to ship a great launch?*

It exists because every other canonical doc describes a *system* (combat, magic, karma, modules) but no doc described what subset of those systems is **required to ship**. Without that target, "what's next?" defaulted to "every open question in the canon" — too broad to act on.

The three tiers narrow that:

- **Tier 0 (MVP-blockers)** — items the game cannot launch without. If any Tier-0 item is `not-started` or `blocked`, the launch date should not be set.
- **Tier 1 (launch polish)** — items that turn an MVP into a *great* launch. Tier 1 should be largely shipped before announcing publicly, but each item is independently negotiable.
- **Tier 2 (post-launch)** — items that explicitly ship after launch as content updates / feature updates. Tier 2 items are *intentionally deferred* — they are not on the critical path.

Each item declares: `id`, `title`, `tier`, `status`, `source`, `blockers`, `affects_docs`, and a `good_looks_like` description. The launch-readiness report (`docs/launch-readiness.md`) reads this file plus the doc graph and emits a prioritized blocker list.

---

## Tier 0 — MVP blockers

```yaml
- id: hero_registration
  title: "Hero registration + character creation flow"
  tier: 0
  status: in-progress
  source: app/forge-avatar/, lib/heroTypes.ts, project_payment_before_character_creation.md
  blockers: [stripe_payment_gate]
  affects_ev: []
  affects_docs: []
  good_looks_like: "New player visits /splash, registers email, pays via Stripe, builds a hero through the wizard, lands in the Church of Perpetual Life with a saved row in players. No bridge auth path."

- id: stripe_payment_gate
  title: "Stripe payment gate before character creation"
  tier: 0
  status: not-started
  source: project_payment_before_character_creation.md
  blockers: []
  affects_ev: []
  affects_docs: []
  good_looks_like: "Stripe Checkout integration; payment success unlocks the hero forge; failed payment redirects to retry. Bridge (email-confirm = payment success) replaced."

- id: karma_sprint_chain
  title: "KARMA Sprints 1–7 — PICSSI virtue system shipped end-to-end"
  tier: 0
  status: not-started
  source: KARMA_IMPLEMENTATION_PLAN.md
  blockers: ["KARMA_SYSTEM.md §6 approval", "Sprint 0 audit", "MODULE_SYSTEM.md Stage I approval"]
  affects_ev: [EV-game_design-001, EV-game_design-002]
  affects_docs: [game_design, module_system, adventure_modules_plan]
  good_looks_like: "PICSSI virtues update on every atom choice; combat-PICSSI deltas fire on kill/flee/abandon; ordered-retreat works; legacy 10-virtue cold-deleted; all magnitudes match KARMA_SYSTEM canon."

- id: first_launch_adventure
  title: "At least one launch adventure module shipped, end-to-end playable"
  tier: 0
  status: not-started
  source: ADVENTURE_MODULES_PLAN.md
  blockers: [karma_sprint_chain, module_system_ink_runtime]
  affects_ev: []
  affects_docs: [adventure_modules_plan, module_system]
  good_looks_like: "A new player can complete the full quest line of one launch saga (Mirrors of Tuzun Thune / Shadow Kingdom / Kings of the Night) with PICSSI consequences, scroll/fragment seeding, NPC affection, combat encounters, and a death-respawn cycle."

- id: module_system_ink_runtime
  title: "MODULE_SYSTEM Ink runtime + GPE authoring CLI"
  tier: 0
  status: not-started
  source: MODULE_SYSTEM.md
  blockers: ["MODULE_SYSTEM.md Stage I approval", karma_sprint_chain]
  affects_ev: [EV-pantheon-001, EV-game_design-002]
  affects_docs: [game_design, adventure_modules_plan]
  good_looks_like: "Ink module loads at runtime, EXTERNAL functions (apply_karma, apply_npc_affection, set_flag, trigger_combat, etc.) work; GPE CLI produces per-virtue balance scorecards for any .ink module."

- id: combat_system_stable
  title: "Combat system stable (body-zone + Combat Arena v2 FX)"
  tier: 0
  status: shipped
  source: components/CombatArena.tsx, lib/combat/engine.ts
  blockers: []
  affects_ev: []
  affects_docs: [game_design]
  good_looks_like: "Body-zone targeting (head/neck/torso/limbs), bleed/poison/wound effects, weapon damage rolls, Combat Arena v2 strike FX, all green tests. Shipped 2026-05-09 (commit ac875e4)."

- id: combat_arena_production_integration
  title: "Combat Arena v2 integrated into production game flow"
  tier: 0
  status: not-started
  source: components/CombatScreen.tsx (v1), components/CombatArena.tsx (v2)
  blockers: []
  affects_ev: []
  affects_docs: []
  good_looks_like: "Production game flow uses CombatArena, not CombatScreen. v1 retired or kept as fallback. All v1 features parity-tested in v2."

- id: world_map_travel
  title: "World map + travel system (S4d)"
  tier: 0
  status: shipped
  source: lore/thurian-cartography/WORLD_LOCATIONS.md, project_world_map_travel_system.md
  blockers: []
  affects_ev: []
  affects_docs: [world_locations]
  good_looks_like: "30 nodes, 5 travel modes, click-to-confirm UX, painted map background. Shipped (commit c05f3f5)."

- id: persistent_chronicle
  title: "Persistent hero with full Chronicle of Deeds"
  tier: 0
  status: shipped
  source: lib/persistence/playerRecord.ts, lib/gameState.ts
  blockers: []
  affects_ev: []
  affects_docs: []
  good_looks_like: "Hero state survives sessions; karma_log captures every consequential act; Chronicle is read by NPCs (memory + reputation)."

- id: death_respawn_flow
  title: "Death + respawn (Church of Perpetual Life)"
  tier: 0
  status: shipped
  source: lib/adventures/guild-hall.ts (Church spawn), KARMA_SYSTEM.md §2.6 (Integrity reset)
  blockers: []
  affects_ev: []
  affects_docs: []
  good_looks_like: "Death triggers Church respawn; gear lost; PICSSI virtues reset (per Tier-0 design); chronicle preserves the death."

- id: jane_ai_narrator
  title: "Jane AI narrator + streaming chat"
  tier: 0
  status: shipped
  source: app/api/chat/route.ts, lib/gameEngine.ts
  blockers: []
  affects_ev: []
  affects_docs: []
  good_looks_like: "Streaming character-by-character animation; Space to skip; static-with-state engine routes 90% of input free, 10% to Grok."

- id: living_world_db
  title: "Living-world database (cached room descriptions, NPC memory)"
  tier: 0
  status: shipped
  source: lib/gameEngine.ts, Supabase rooms + objects tables
  blockers: []
  affects_ev: []
  affects_docs: []
  good_looks_like: "Rooms generated once and cached forever; NPCs remember encounters across sessions; Sheriff alerts + bounties persist."

- id: image_generation_baseline
  title: "Image generation pipeline (heroes + scenes + NPCs)"
  tier: 0
  status: in-progress
  source: scripts/forge-*.ts, lib/scenePrompt.ts, project_pre_roll_image_architecture.md
  blockers: []
  affects_ev: []
  affects_docs: []
  good_looks_like: "Hero composite (head + body) shipped; scenes pre-rolled via Grok-Imagine-Pro; NPCs forged with UGLY_MEAN_OVERLAY for hostiles; rembg pipeline reliable."

- id: production_deploy
  title: "Production deploy on Vercel + main branch"
  tier: 0
  status: shipped
  source: vercel.json (implicit), project memory
  blockers: []
  affects_ev: []
  affects_docs: []
  good_looks_like: "main branch deploys to Vercel automatically; no broken builds on main; staging/preview flows work."
```

---

## Tier 1 — Launch polish (great launch needs)

```yaml
- id: three_launch_sagas
  title: "All 3 launch sagas complete (Mirrors of Tuzun Thune trilogy)"
  tier: 1
  status: not-started
  source: ADVENTURE_MODULES_PLAN.md, splash page LAUNCH_ADVENTURES list
  blockers: [first_launch_adventure, karma_sprint_chain]
  affects_ev: []
  affects_docs: []
  good_looks_like: "Mirrors of Tuzun Thune + The Shadow Kingdom + Kings of the Night all playable end-to-end with PICSSI consequences, distinct atmospheres (twelve-thousand-year-old ruin / serpent-noble court / Pictish tomb-opening)."

- id: pray_divinity_v1
  title: "PRAY + Divinity System v1"
  tier: 1
  status: not-started
  source: ~/.claude/plans/the-skull-and-pack-luminous-muffin.md, lore/pantheon/PANTHEON.md
  blockers: [karma_sprint_chain]
  affects_ev: [EV-pantheon-001, EV-pantheon-002]
  affects_docs: [pantheon, sorcery, karma_system]
  good_looks_like: "PRAY combat spell + out-of-combat verb work; per-(player, god) divineFavor track; per-god boon/blessing tables; sacred-site multipliers; 2 starter divine quests (Crom JUDGES + Mithras Honor-the-Contract)."

- id: library_wiki
  title: "/library wiki for creators (W2 shipped, W3 outstanding)"
  tier: 1
  status: in-progress
  source: app/library/, lib/library/, ~/.claude/plans/review-the-lore-and-floofy-hamming.md
  blockers: []
  affects_ev: []
  affects_docs: [doc_map]
  good_looks_like: "W2 wiki UI shipped (commit e0304a5). W3 deferred (registry dumps + drift detection). Q+A annotations expanding from 2 docs to 14 (pilot + batch)."

- id: qa_annotations_batch
  title: "Q+A annotations on remaining 12 design-canon docs"
  tier: 1
  status: not-started
  source: ~/.claude/plans/review-the-lore-and-floofy-hamming.md (Q+A pilot batch)
  blockers: []
  affects_ev: []
  affects_docs: [karma_system, module_system, sorcery, public_domain_rules, world_locations, travel_matrix, loot_tables, scrolls_of_thoth_index, stobaean_fragments_index, adventure_modules_plan, hyborian_pd_module_plan, karma_implementation_plan]
  good_looks_like: "Every design-canon and sprint-plan doc carries a Q+A block matching the PANTHEON / GAME_DESIGN pilot schema. Edge Vectors registry surfaces cross-canon open questions, not just per-pilot."

- id: scrolls_of_thoth_ui
  title: "15 Scrolls of Thoth — read-verification riddle UI"
  tier: 1
  status: not-started
  source: lore/scrolls-of-thoth/INDEX.md, KARMA_SYSTEM.md §2.10, project_scroll_riddle_verification.md
  blockers: [karma_sprint_chain]
  affects_ev: []
  affects_docs: [scrolls_of_thoth_index, karma_system]
  good_looks_like: "Player reads scroll → riddle prompt → correct answer awards Illumination delta; incorrect blocks the award until re-read. Wired through lib/karma/scrolls.ts."

- id: forty_two_oaths
  title: "42 Oaths of Ma'at surfaced in gameplay"
  tier: 1
  status: not-started
  source: lore/maatic-library/oaths-of-maat.md
  blockers: []
  affects_ev: []
  affects_docs: [pantheon]
  good_looks_like: "Oaths appear as Ma'atic priest dialogue, NPC consequences (Order alerts when oaths are broken), and post-mortem Hall-of-Two-Truths weighing prose."

- id: payment_success_email_flow
  title: "Post-payment email confirmation + welcome flow"
  tier: 1
  status: not-started
  source: project_payment_before_character_creation.md
  blockers: [stripe_payment_gate]
  affects_ev: []
  affects_docs: []
  good_looks_like: "Stripe webhook → confirmation email → onboarding email series with Living Eamon lore primer."

- id: brothel_temple_vd_content
  title: "Brothel + Fertility Temple + VD content (GAME_DESIGN §12)"
  tier: 1
  status: not-started
  source: GAME_DESIGN.md §12
  blockers: [karma_sprint_chain]
  affects_ev: []
  affects_docs: [game_design]
  good_looks_like: "Brothel atoms work in the hub city; Fertility Temple cure available; VD progression + treatment paths wired through PICSSI Passion + Spirituality."
```

---

## Tier 2 — Post-launch (ships in updates)

```yaml
- id: db_transition_sprint_8
  title: "Sprint 8 — DB transition for quests / NPC / dialogue / atoms"
  tier: 2
  status: deferred
  source: project_db_transition_deferred.md
  blockers: [karma_sprint_chain]
  affects_ev: []
  affects_docs: []
  good_looks_like: "TS quest registries shadow-migrate to Supabase; runtime stays code-canonical until full migration; eventually swaps to DB-canonical."

- id: invoke_circles_4_through_8
  title: "Occult INVOKE — Circles 4–8 (forbidden sorcery)"
  tier: 2
  status: deferred
  source: SORCERY.md, project_occult_sorcery_deferred.md
  blockers: [karma_sprint_chain]
  affects_ev: []
  affects_docs: [sorcery]
  good_looks_like: "Eight Circles of forbidden sorcery wired to combat; Order detection + inquisition mechanics; per-circle Illumination cost scaling."

- id: pegasus_telepathic_ally
  title: "Pegasus — intelligent telepathic ally"
  tier: 2
  status: deferred
  source: project_pegasus_intelligent_ally.md
  blockers: [pray_divinity_v1, karma_sprint_chain]
  affects_ev: []
  affects_docs: []
  good_looks_like: "Late-game ally; refuses immoral missions; closes air-mode travel routes when hero drifts toward Outer Dark."

- id: word_system
  title: "The Word system — quest oaths persist across rebirth"
  tier: 2
  status: in-progress
  source: project_word_system_seed.md
  blockers: []
  affects_ev: []
  affects_docs: []
  good_looks_like: "All quest acceptance generates a Word; persists across rebirth; Mithras-blessed Words ×2 stakes. S3 shipped persistence layer; UI deferred."

- id: crowd_qa_pipeline
  title: "Crowd-QA pipeline (SageMaker / Turk for asset QA)"
  tier: 2
  status: deferred
  source: project_crowd_qa_plan.md
  blockers: [first_launch_adventure]
  affects_ev: []
  affects_docs: []
  good_looks_like: "Pregenerated-asset QA via paid Turk + LLM-vision + community-volunteer tier. Player report-reasons wired."

- id: volunteer_qa_program
  title: "Community-volunteer QA program"
  tier: 2
  status: deferred
  source: project_volunteer_qa_plan.md
  blockers: [crowd_qa_pipeline]
  affects_ev: []
  affects_docs: []
  good_looks_like: "Trap-questions, reputation, reward caps below paid customers; legal review complete."

- id: creator_forge_admin
  title: "Creator Forge — in-app admin tool for hero/NPC/monster authoring"
  tier: 2
  status: deferred
  source: project_creator_forge_plan.md
  blockers: [library_wiki]
  affects_ev: []
  affects_docs: []
  good_looks_like: "Admin UI for image-prompt iteration + variation + approval; supersedes the current scripts/forge-*.ts pipeline for non-dev contributors."

- id: multiplayer_phase_3
  title: "Multiplayer (Phase 3)"
  tier: 2
  status: deferred
  source: GAME_DESIGN.md (multiplayer Phase 3 reference)
  blockers: [karma_sprint_chain, first_launch_adventure]
  affects_ev: []
  affects_docs: []
  good_looks_like: "Multiple heroes per realm; shared chronicle; faction-level karma; party invites. Far future."

- id: rest_of_18_module_roadmap
  title: "Modules 4–18 from the 18-module PD roadmap"
  tier: 2
  status: deferred
  source: ADVENTURE_MODULES_PLAN.md
  blockers: [first_launch_adventure, three_launch_sagas]
  affects_ev: []
  affects_docs: []
  good_looks_like: "All 18 PD-bucketed modules authored, with the first 3 (launch sagas) acting as the proven template."
```

---

## How to update this doc

- **When an item ships:** flip `status: not-started` → `status: shipped`. Update the `source:` field with the commit hash if useful.
- **When a new item is identified:** add a new entry under the appropriate tier with `status: not-started`. Update DOC_MAP.md if the item references new docs.
- **When the launch-readiness report misranks something:** the priority formula lives in `scripts/launch-readiness.ts` (`tier_weight + downstream_evs * 2 + downstream_sprints + criticality_flag`). Adjust by either adding a `criticality_flag: high` field to a Tier-0 item, or by re-tiering.
- **When a tier moves:** explicitly note the demotion/promotion in the commit message. Demoting Tier-0 → Tier-1 is a launch-scope decision and should not happen lightly.
