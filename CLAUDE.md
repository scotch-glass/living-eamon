# Living Eamon — Claude Instructions

**Before starting work, read this stack in order:**

1. [**CLAUDE_CONTEXT.md**](./CLAUDE_CONTEXT.md) — project overview, architecture, current status, file map, player state, world state, art system
2. [**GAME_DESIGN.md**](./GAME_DESIGN.md) — full game design document (§10 Hyborian Age Lore is canonical for all setting decisions)
3. [**Public_Domain_Rules.md**](./Public_Domain_Rules.md) — **CRITICAL, authoritative**: consolidated IP legal framework, Howard PD timeline, trademark restrictions, Always-Safe Corpus, future PD calendar, Safe Harbor strategy. (Supersedes and replaces the former `lore/hyborian-pd/PD_RESEARCH.md`, which was deleted April 19, 2026.)
4. [**GAME_DESIGN.md**](./GAME_DESIGN.md) top-of-file tables — name-by-name Safe Harbor / Radioactive lookup. Supersedes any other doc on individual term status.
5. [**lore/hyborian-pd/MODULE_PLAN.md**](./lore/hyborian-pd/MODULE_PLAN.md) — methodology for converting PD stories into adventure modules

**User profile:** Scotch — non-developer founder/designer. All technical instructions must be explicit step-by-step or exact Cursor prompts. No vague guidance.

**Key constraints:**
- Next.js 16 (breaking changes from standard Next.js — read `node_modules/next/dist/docs/` for conventions)
- Route protection uses `proxy.ts`, NOT `middleware.ts`
- Never hard-reset browser without asking
- Only regenerate images explicitly requested (see **Image Cache Safety** below)
- Keep CLAUDE_CONTEXT.md updated after every significant system change

**Image Cache Safety:**
- Soft-delete images via `deleted_at` column (never harddelete)
- Only clear rooms explicitly asked to regenerate
- **Image pipeline rules (critical):**
  - Sprites/logos: white background → rembg → transparent PNG
  - Scene backgrounds: upload directly as JPEG (never rembg)

---

@AGENTS.md
