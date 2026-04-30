-- ── KARMA Sprint 4 — encounter atom world state ───────────────
--
-- Per KARMA_IMPLEMENTATION_PLAN.md Sprint 4. Adds the runtime
-- state needed for the encounter-atom system at
-- scripts/balance/library/*.json:
--
--   npc_affection  — Record<npcId, 0..100>. Hidden affection meter
--                    per recurring NPC. Drives gift-giving, recurring
--                    encounter unlocks, eros progression, grief reach
--                    on NPC death. Independent of PICSSI virtues.
--   flags_life     — Record<key, true>. Per-life narrative flags
--                    consumed by atom prerequisites and quest steps.
--                    Wiped on rebirth at the Church.
--   flags_legacy   — Record<key, true>. Legacy flags that survive
--                    death; used for "you've done this before" gates
--                    in future-life encounters.
--   pending_atom   — { atomId, presentedAt } | null. Open atom that
--                    has been presented to the player and is awaiting
--                    a numbered choice. Persisted so a page refresh
--                    doesn't lose the prompt.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS npc_affection jsonb   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS flags_life    jsonb   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS flags_legacy  jsonb   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pending_atom  jsonb;
