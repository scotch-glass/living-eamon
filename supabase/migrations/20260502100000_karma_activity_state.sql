-- ── KARMA Sprint 3 — activity dispatcher state ──────────────────
--
-- Per KARMA_IMPLEMENTATION_PLAN.md Sprint 3:
--   vd_active        — venereal disease flag (KARMA_SYSTEM.md §2.13a /
--                      GAME_DESIGN.md §12). Set by the brothel side
--                      effect; cleared by HEAL spell, fertility-temple
--                      cure, or generic temple cure (Spirituality-scaled).
--   scrolls_read     — { [scrollId]: { firstReadAt, riddlesPassed[] } }.
--                      Drives the read-verification gate for the
--                      Fifteen Scrolls of Thoth (KARMA_SYSTEM.md §2.10).
--                      Per-life: cleared on rebirth at the Church.
--   pending_riddle   — { scrollId, riddleIdx, prompt } | null. Set when
--                      a scroll is read; the player's NEXT command is
--                      taken as the riddle answer. Persists across
--                      page-refresh so the prompt isn't lost.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS vd_active      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scrolls_read   jsonb   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pending_riddle jsonb;
