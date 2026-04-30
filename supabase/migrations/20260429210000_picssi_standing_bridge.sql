-- ── PICSSI Standing bridge migration (2026-04-29 evening) ──────────
--
-- Per Scotch's instruction, deprecate the legacy "Honor" virtue and
-- replace runtime mutations with PICSSI Standing. This migration adds
-- ONLY the picssi_standing column. The remaining 5 PICSSI columns
-- (passion / integrity / courage / spirituality / illumination) and
-- the cold-delete of all 10 legacy virtues land in Sprint 2.
--
-- See KARMA_SYSTEM.md §2.8 (Standing) and KARMA_IMPLEMENTATION_PLAN.md
-- Sprint 2 (revised: 5 new cols, not 6).

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS picssi_standing smallint NOT NULL DEFAULT 0
    CHECK (picssi_standing BETWEEN 0 AND 100);

-- Existing rows: default 0 (a fresh / migrating hero is morally neutral
-- per KARMA_SYSTEM.md §2.5). Honor data in the legacy `virtues` JSONB
-- is NOT migrated forward — Standing is a new axis, not isomorphic to
-- the old Honor.
