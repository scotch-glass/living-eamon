# DOC_MAP — Living Eamon documentation index

**This is the master spine for every documentation artifact in the repo.** It declares what each doc owns, who can see it, and what state it's in. Loaded into Claude hydration after `MEMORY.md`. Read by the `/library` wiki to build its sidebar and filter visibility.

When a new doc is added, it MUST get a row in this file. When a doc's role / visibility / status changes, this file is updated in the same commit.

---

## Schema

Every entry conforms to this shape:

```yaml
- id: <slug>                     # url-safe id; used as wiki route segment
  path: <repo-relative path>     # source file location
  title: <Display Title>         # human-readable name
  role: <one of: design-canon | sprint-plan | session-log | reference-generated | lore-artifact | legal | dev-process>
  canonical_for: [<topic>, ...]  # what this doc owns; one or more domain tags
  visibility: <internal | creator>
  status: <active | draft | deferred | approved | rolling | historical>
  last_updated: <YYYY-MM-DD>
  cross_refs: [<path>, ...]      # optional: docs/code this points at or is pointed at by
```

### Role values

- **`design-canon`** — single source of truth for a domain. Hand-maintained prose. Examples: `GAME_DESIGN.md`, `KARMA_SYSTEM.md`, `lore/pantheon/PANTHEON.md`, `SORCERY.md`.
- **`sprint-plan`** — a roadmap describing future work. Internal by default. Examples: `KARMA_IMPLEMENTATION_PLAN.md`, `ADVENTURE_MODULES_PLAN.md`, `lore/hyborian-pd/MODULE_PLAN.md`.
- **`session-log`** — rolling snapshot of recent work + next-session hand-off. Decays fast; pin the date. Internal. Examples: `HYDRATE_NEXT_SESSION.md`, `SESSION_001_VAST_R2_SETUP.md`.
- **`reference-generated`** — auto-derived from code. **Never hand-edited.** Examples: `docs/quest-registry.md` (from `lib/quests/engine.ts`).
- **`lore-artifact`** — in-world fictional text the player or Jane may surface in narration. Often runtime-loaded by code (Scrolls of Thoth, Stobaean fragments). Examples: `lore/scrolls-of-thoth/scroll-1-the-way.md`.
- **`legal`** — authoritative IP / public-domain framework. Treat changes as load-bearing; never trim casually. Example: `Public_Domain_Rules.md`.
- **`dev-process`** — bootstrap, conventions, infra notes for Claude or future contributors. Examples: `CLAUDE.md`, `CLAUDE_CONTEXT.md`, `AGENTS.md`, `TECH.md`.

### Visibility values

- **`internal`** — Scotch + Claude only. Sprint plans, hydration snapshots, the implementation plan, anything with active design debate or unreviewed claims. Hidden from the `/library` wiki for non-admin users.
- **`creator`** — logged-in Ink-module authors. The reference surface needed to write modules: pantheon, world locations, PICSSI defs, Ink contract, lore artifacts, generated registries, PD rules.

A `public` tier is reserved for a future fan-wiki and is not used in v1.

### Status values

- **`active`** — current canon; trustworthy.
- **`draft`** — being written; values may shift.
- **`approved`** — explicitly ratified (with date); load-bearing.
- **`deferred`** — planned but waiting on a gate / earlier sprint.
- **`rolling`** — overwritten every session; expect it to be stale a day after the date stamp.
- **`historical`** — preserved for context; not currently load-bearing. Don't act on it without confirming.

---

## Root design docs

```yaml
- id: game_design
  path: GAME_DESIGN.md
  title: Game Design Document
  role: design-canon
  canonical_for: [game-design, thurian-age-lore, picssi-virtue-defs, brothels-vd]
  visibility: creator
  status: approved
  last_updated: 2026-04-30
  cross_refs: [Public_Domain_Rules.md, KARMA_SYSTEM.md, SORCERY.md, MODULE_SYSTEM.md, ADVENTURE_MODULES_PLAN.md]

- id: karma_system
  path: KARMA_SYSTEM.md
  title: Karma System
  role: design-canon
  canonical_for: [picssi-math, virtue-activity-table, combat-picssi-deltas, ordered-retreat-mechanic, triple-penalty-rule]
  visibility: creator
  status: draft
  last_updated: 2026-05-09
  cross_refs: [GAME_DESIGN.md, SORCERY.md, KARMA_IMPLEMENTATION_PLAN.md, MODULE_SYSTEM.md]

- id: karma_implementation_plan
  path: KARMA_IMPLEMENTATION_PLAN.md
  title: Karma Implementation Plan
  role: sprint-plan
  canonical_for: [karma-sprint-roadmap-s0-s7]
  visibility: internal
  status: deferred
  last_updated: 2026-04-30
  cross_refs: [KARMA_SYSTEM.md, HYDRATE_NEXT_SESSION.md]

- id: module_system
  path: MODULE_SYSTEM.md
  title: Module System (Ink + GPE)
  role: design-canon
  canonical_for: [ink-external-functions, gpe-magnitude-bands, combat-picssi-hook-points, runtime-adapter-spec]
  visibility: creator
  status: draft
  last_updated: 2026-04-30
  cross_refs: [KARMA_SYSTEM.md, GAME_DESIGN.md, lore/hyborian-pd/MODULE_PLAN.md]

- id: adventure_modules_plan
  path: ADVENTURE_MODULES_PLAN.md
  title: Adventure Modules Plan
  role: sprint-plan
  canonical_for: [eighteen-module-roadmap, scroll-fragment-seeding]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [Public_Domain_Rules.md, GAME_DESIGN.md, KARMA_SYSTEM.md, lore/hyborian-pd/MODULE_PLAN.md]

- id: sorcery
  path: SORCERY.md
  title: Sorcery (Guild CAST + Occult INVOKE)
  role: design-canon
  canonical_for: [magic-systems, eight-circles, reagents, the-order, illumination-cost]
  visibility: creator
  status: active
  last_updated: 2026-04-29
  cross_refs: [GAME_DESIGN.md, lore/pantheon/PANTHEON.md]

- id: public_domain_rules
  path: Public_Domain_Rules.md
  title: Public Domain Rules
  role: legal
  canonical_for: [ip-framework, safe-harbor-strategy, howard-pd-timeline, trademark-restrictions, always-safe-corpus]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [GAME_DESIGN.md, lore/hyborian-pd/MODULE_PLAN.md]

- id: edge_vectors
  path: EDGE_VECTORS.md
  title: Edge Vectors — Open Questions Across the Canon
  role: design-canon
  canonical_for: [open-questions, design-uncertainty, cross-doc-edges]
  visibility: creator
  status: rolling
  last_updated: 2026-05-09
  cross_refs: [DOC_MAP.md]
```

## Dev / process docs

```yaml
- id: claude_md
  path: CLAUDE.md
  title: Claude Session Bootstrap
  role: dev-process
  canonical_for: [claude-session-rules, behavioral-guidelines, project-constraints]
  visibility: internal
  status: active
  last_updated: 2026-05-09
  cross_refs: [CLAUDE_CONTEXT.md, AGENTS.md, DOC_MAP.md]

- id: claude_context
  path: CLAUDE_CONTEXT.md
  title: Claude Project Context
  role: dev-process
  canonical_for: [project-overview, architecture, rehydration-stack, file-map]
  visibility: internal
  status: active
  last_updated: 2026-05-09
  cross_refs: [CLAUDE.md, MEMORY.md, DOC_MAP.md]

- id: hydrate_next_session
  path: HYDRATE_NEXT_SESSION.md
  title: Hydrate Next Session
  role: session-log
  canonical_for: [session-end-snapshot, next-session-prompt]
  visibility: internal
  status: rolling
  last_updated: 2026-05-09
  cross_refs: [CLAUDE_CONTEXT.md]

- id: agents_md
  path: AGENTS.md
  title: Next.js 16 Conventions Warning
  role: dev-process
  canonical_for: [nextjs-16-conventions, proxy-vs-middleware]
  visibility: internal
  status: active
  last_updated: 2026-04-25
  cross_refs: [CLAUDE.md]

- id: tech_md
  path: TECH.md
  title: Tech Stack + Ops Notes
  role: dev-process
  canonical_for: [tech-stack, infra-notes]
  visibility: internal
  status: active
  last_updated: 2026-04-25
  cross_refs: [CLAUDE_CONTEXT.md]

- id: readme
  path: README.md
  title: Repo README
  role: dev-process
  canonical_for: [repo-intro]
  visibility: creator
  status: active
  last_updated: 2026-04-25
  cross_refs: []

- id: session_001_vast_r2_setup
  path: SESSION_001_VAST_R2_SETUP.md
  title: Session 001 — Vast/R2 LoRA Setup
  role: session-log
  canonical_for: [vast-ai-setup, cloudflare-r2-setup, ai-toolkit-bootstrap]
  visibility: internal
  status: historical
  last_updated: 2026-04-26
  cross_refs: []

- id: doc_map
  path: DOC_MAP.md
  title: Documentation Index (this file)
  role: dev-process
  canonical_for: [doc-orchestration, visibility-tiers, role-classes]
  visibility: internal
  status: active
  last_updated: 2026-05-09
  cross_refs: [CLAUDE.md, CLAUDE_CONTEXT.md]
```

## Lore

```yaml
- id: pantheon
  path: lore/pantheon/PANTHEON.md
  title: Pantheon — Living Eamon canonical deities
  role: design-canon
  canonical_for: [god-roster, thurian-aliases, valkyrie-host, dual-aspect-mapping, deity-room-tag-resolution]
  visibility: creator
  status: active
  last_updated: 2026-05-09
  cross_refs: [SORCERY.md, GAME_DESIGN.md, Public_Domain_Rules.md]

- id: world_locations
  path: lore/thurian-cartography/WORLD_LOCATIONS.md
  title: World Locations — Thurian Cartography
  role: design-canon
  canonical_for: [travel-node-registry, nation-roster, loot-zone-ids]
  visibility: creator
  status: active
  last_updated: 2026-05-03
  cross_refs: [GAME_DESIGN.md]

- id: travel_matrix
  path: lore/thurian-cartography/TRAVEL_MATRIX.md
  title: Travel Cost Matrix
  role: design-canon
  canonical_for: [travel-cost-matrix, travel-mode-table]
  visibility: creator
  status: active
  last_updated: 2026-05-03
  cross_refs: [lore/thurian-cartography/WORLD_LOCATIONS.md]

- id: loot_tables
  path: lore/thurian-cartography/LOOT_TABLES.md
  title: Loot Tables — per-zone distribution
  role: design-canon
  canonical_for: [loot-tables, per-zone-distribution]
  visibility: creator
  status: active
  last_updated: 2026-05-03
  cross_refs: [lore/thurian-cartography/WORLD_LOCATIONS.md]

- id: hyborian_pd_module_plan
  path: lore/hyborian-pd/MODULE_PLAN.md
  title: Hyborian-PD Module Plan
  role: sprint-plan
  canonical_for: [pd-module-methodology, pd-first-design-rules]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [Public_Domain_Rules.md, ADVENTURE_MODULES_PLAN.md, GAME_DESIGN.md]

- id: hyborian_pd_readme
  path: lore/hyborian-pd/README.md
  title: Hyborian-PD Subdir README
  role: dev-process
  canonical_for: [pd-research-consolidation-note]
  visibility: creator
  status: historical
  last_updated: 2026-04-19
  cross_refs: [Public_Domain_Rules.md]

- id: scrolls_of_thoth_index
  path: lore/scrolls-of-thoth/INDEX.md
  title: Scrolls of Thoth — Registry
  role: design-canon
  canonical_for: [scroll-registry, riddle-schema, illumination-delta-table]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [KARMA_SYSTEM.md, lib/karma/scrolls.ts]

- id: scrolls_of_thoth_corpus
  path: lore/scrolls-of-thoth/scroll-*.md
  title: Scrolls of Thoth — 15 scroll files
  role: lore-artifact
  canonical_for: [scroll-content, kybalion-thoth-substitution, illumination-quest-rewards]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [lore/scrolls-of-thoth/INDEX.md, lib/karma/scrolls.ts]

- id: stobaean_fragments_index
  path: lore/stobaean-fragments/INDEX.md
  title: Stobaean Fragments — Registry
  role: design-canon
  canonical_for: [fragment-pacing-map, mentor-assignments]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [docs/quest-registry.md]

- id: stobaean_fragments_corpus
  path: lore/stobaean-fragments/SH-*.md
  title: Stobaean Fragments — 14 fragment files
  role: lore-artifact
  canonical_for: [stobaean-hermetica, mentor-delivered-wisdom]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [lore/stobaean-fragments/INDEX.md, docs/quest-registry.md]

- id: maatic_library
  path: lore/maatic-library/*.md
  title: Maatic Library — Order doctrines
  role: lore-artifact
  canonical_for: [order-textbooks, math-mysticism, oaths-of-maat, 42-oaths]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [lore/pantheon/PANTHEON.md, GAME_DESIGN.md]

- id: logos_teleios
  path: lore/logos-teleios/
  title: Logos Teleios — Pre-Thurian vault artifact
  role: lore-artifact
  canonical_for: [hermetic-lament, vault-discovery-text]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [lore/scrolls-of-thoth/INDEX.md]

- id: standing_creeds
  path: lore/standing-creeds/the-conquerors-question.md
  title: The Conqueror's Question — Pictish warrior code
  role: lore-artifact
  canonical_for: [standing-virtue-catechism, pictish-creed]
  visibility: creator
  status: active
  last_updated: 2026-04-29
  cross_refs: [GAME_DESIGN.md, KARMA_SYSTEM.md]
```

## Generated registries

```yaml
- id: quest_registry_dump
  path: docs/quest-registry.md
  title: Quest + Dialogue Registry (generated)
  role: reference-generated
  canonical_for: [quest-catalogue-derived-view, dialogue-branch-derived-view]
  visibility: creator
  status: active
  last_updated: rebuilt-on-demand
  cross_refs: [lib/quests/engine.ts, lib/quests/dialogue.ts]
  generated_by: scripts/dump-quest-registry.ts
  npm_script: registry:dump

- id: affect_axes_dump
  path: docs/affect-axes.md
  title: AffectVector — neuro-emotional mapping
  role: reference-generated
  canonical_for: [affect-vector-axes, neuro-emotional-mapping]
  visibility: creator
  status: active
  last_updated: 2026-04-30
  cross_refs: [lib/quests/types.ts]
```

---

## What goes WHERE — quick lookup

When you need to know which doc owns a topic:

| Topic | Canonical doc | Section |
|---|---|---|
| PICSSI virtue definitions (lore) | GAME_DESIGN.md | §11 |
| PICSSI math + activity table + magnitudes | KARMA_SYSTEM.md | §2.5–§2.10, §4 |
| Combat-PICSSI delta table | KARMA_SYSTEM.md | §4c |
| Ordered-retreat + triple-penalty mechanic | KARMA_SYSTEM.md | §2.7–§2.8 |
| Ink EXTERNAL function contract | MODULE_SYSTEM.md | §3, §5 |
| Combat-PICSSI hook-point integration code | MODULE_SYSTEM.md | §6 |
| Growth Path Equalizer (GPE) bands | MODULE_SYSTEM.md | §2 |
| Magic systems (CAST + INVOKE) + Eight Circles | SORCERY.md | full |
| God roster + alignment + Thurian aliases | lore/pantheon/PANTHEON.md | full |
| Travel nodes + nations + loot zones | lore/thurian-cartography/WORLD_LOCATIONS.md | full |
| 18-module adventure roadmap | ADVENTURE_MODULES_PLAN.md | full |
| PD safety / IP framework | Public_Domain_Rules.md | full |
| Karma sprint roadmap (S0–S7) | KARMA_IMPLEMENTATION_PLAN.md | full |
| 42 Oaths of Ma'at | lore/maatic-library/oaths-of-maat.md | full |
| 15 Scrolls of Thoth (Kybalion-derived) | lore/scrolls-of-thoth/ | full |
| 14 Stobaean fragments | lore/stobaean-fragments/ | full |
| Quest catalogue (derived) | docs/quest-registry.md (generated) | full |

---

## Maintenance rules

1. **Adding a new doc:** add a row here in the same commit.
2. **Changing a doc's role / visibility / status:** update this file in the same commit.
3. **Generating new derived docs:** add a row with `role: reference-generated` and the `generated_by` + `npm_script` fields.
4. **Renaming a doc:** update the `path` here and in any `cross_refs` arrays that point at it.
5. **Deferring a doc:** flip status to `deferred` and add a note in the doc itself explaining the gate.
6. **Promoting a doc:** flip status from `draft` → `approved` (with the approval date) only after explicit Scotch sign-off.
