-- ── KARMA Sprint 6 — karma history log ────────────────────────
--
-- Tail-buffer of recent PICSSI deltas for the karma history view.
-- Each entry: { at: ISO8601, delta: KarmaDelta, source: string }
-- Trimmed to the last KARMA_LOG_MAX entries (50 by default) — old
-- entries fall off the end as new ones land.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS karma_log jsonb NOT NULL DEFAULT '[]';
