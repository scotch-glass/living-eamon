-- ── Sprint S3 — The Word system ──────────────────────────────
--
-- Every quest acceptance generates a Word. Persists across rebirth
-- (the Perpetual Hero must return to honor his Word).
-- Schema: Word[] — see lib/quests/words.ts for shape.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS given_words jsonb NOT NULL DEFAULT '[]';
