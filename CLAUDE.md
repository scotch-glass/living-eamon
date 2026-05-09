---
id: claude_md
title: Claude Session Bootstrap
role: dev-process
canonical_for: [claude-session-rules, behavioral-guidelines, project-constraints]
visibility: internal
status: active
last_updated: 2026-05-09
cross_refs: [CLAUDE_CONTEXT.md, AGENTS.md, DOC_MAP.md]
---

# Living Eamon — Claude Instructions

**Doc index:** [`DOC_MAP.md`](./DOC_MAP.md) is the master spine — every doc has a row declaring its role (`design-canon` / `sprint-plan` / `session-log` / `reference-generated` / `lore-artifact` / `legal` / `dev-process`), canonical scope, visibility tier (`internal` / `creator`), and status. Consult it when you need to know which doc owns a topic, or what's safe to surface to Creators in the `/library` wiki. **Adding/moving/role-changing any doc must be reflected in `DOC_MAP.md` in the same commit.**

**Before starting work, read this stack in order:**

0. [**DOC_MAP.md**](./DOC_MAP.md) — index of every doc in the repo (~30 sec scan)
1. [**CLAUDE_CONTEXT.md**](./CLAUDE_CONTEXT.md) — project overview, architecture, current status, file map, player state, world state, art system
2. [**GAME_DESIGN.md**](./GAME_DESIGN.md) — full game design document (§10 Thurian Age Lore is canonical for setting; §11 PICSSI is the canonical virtue model)
3. [**SORCERY.md**](./SORCERY.md) — canonical for both magic systems (Guild CAST + Occult INVOKE), Eight Circles, reagents, The Order, per-circle Illumination cost. Extracted from GAME_DESIGN.md §9 on 2026-04-29.
4. [**KARMA_SYSTEM.md**](./KARMA_SYSTEM.md) — canonical stock-and-flow design for PICSSI virtues, attributes, consumables (HP / mana / stamina+fatiguePool), atoms, NPC affection, flags. **Single source of truth for design values.**
5. [**KARMA_IMPLEMENTATION_PLAN.md**](./KARMA_IMPLEMENTATION_PLAN.md) — sprint-by-sprint wiring plan for KARMA_SYSTEM.md (file/function-level detail). Loads alongside KARMA_SYSTEM.md when implementing. Sprint 0 → 7.
5. [**Public_Domain_Rules.md**](./Public_Domain_Rules.md) — **CRITICAL, authoritative**: consolidated IP legal framework, Howard PD timeline, trademark restrictions, Always-Safe Corpus, future PD calendar, Safe Harbor strategy. (Supersedes and replaces the former `lore/hyborian-pd/PD_RESEARCH.md`, which was deleted April 19, 2026.)
6. [**GAME_DESIGN.md**](./GAME_DESIGN.md) top-of-file tables — name-by-name Safe Harbor / Radioactive lookup. Supersedes any other doc on individual term status.
7. [**lore/hyborian-pd/MODULE_PLAN.md**](./lore/hyborian-pd/MODULE_PLAN.md) — methodology for converting PD stories into adventure modules

**User profile:** Scotch — non-developer founder/designer. All technical instructions must be explicit step-by-step or exact Cursor prompts. No vague guidance.

**Key constraints:**
- Next.js 16 (breaking changes from standard Next.js — read `node_modules/next/dist/docs/` for conventions)
- Route protection uses `proxy.ts`, NOT `middleware.ts`
- Never hard-reset browser without asking
- Only regenerate images explicitly requested (see **Image Cache Safety** below)
- Keep CLAUDE_CONTEXT.md updated after every significant system change

**Scoped contexts (load INSTEAD of the root context when working in these areas):**
- Wardrobe Engine / paperdoll UI / per-slot layering → [lib/wardrobe/CLAUDE_CONTEXT.md](./lib/wardrobe/CLAUDE_CONTEXT.md)

**Image Cache Safety:**
- Soft-delete images via `deleted_at` column (never harddelete)
- Only clear rooms explicitly asked to regenerate
- **Image pipeline rules (critical):**
  - Sprites/logos: white background → rembg → transparent PNG
  - Scene backgrounds: upload directly as JPEG (never rembg)

---

## Behavioral Guidelines

Imported 2026-04-25 from [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md). Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

@AGENTS.md
