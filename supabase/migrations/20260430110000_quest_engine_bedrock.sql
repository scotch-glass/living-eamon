-- ── KARMA Sprint 8a — Quest Engine bedrock ─────────────────────
--
-- Two tables, one role each:
--
--   players.quests (jsonb)
--     Per-player Record<questId, QuestState> with each quest's
--     status, currentStep, completedSteps, scratch, acceptedAt.
--     Replaces the inert `active_quests` text[] column.
--
--   quest_definitions
--     Shared registry mirroring lib/quests/lines/* TypeScript
--     definitions. Synced at deploy time via
--     scripts/sync-quest-definitions.ts. Not read at runtime —
--     the engine reads from the TS registry. This table exists
--     for tooling, analytics, and future Creator-Forge editing.

-- Per-player quest state
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS quests jsonb NOT NULL DEFAULT '{}';

-- Drop the inert string-array column from the original schema
ALTER TABLE players DROP COLUMN IF EXISTS active_quests;

-- Shared quest registry
CREATE TABLE IF NOT EXISTS quest_definitions (
  id              text PRIMARY KEY,
  title           text NOT NULL,
  blurb           text NOT NULL,
  scope           text NOT NULL CHECK (scope IN ('life', 'legacy')),
  step_count      smallint NOT NULL,
  reward_summary  text,
  start_step      text NOT NULL,
  steps           jsonb NOT NULL,
  version         smallint NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
