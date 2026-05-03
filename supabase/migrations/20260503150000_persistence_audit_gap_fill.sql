-- ── Sprint A — persistence audit gap-fill (2026-05-03) ──────────
--
-- Adds columns for PlayerState / WorldState fields that the engine
-- reads-and-writes but the persistence layer never round-tripped.
-- Gaps surfaced by the 2026-05-03 code review:
--
-- Player-scoped:
--   known_circles            — Sorcery INVOKE access (Sprint 7)
--   temp_modifiers           — Bless / Cunning / Feeblemind buffs
--   current_plane            — Gate Travel cross-plane state
--   previous_room            — "go back" semantics
--   prison_turns_remaining   — jail timer survives refresh
--   last_action              — repeat-action pattern
--
-- World-scoped (per-player since each player has their own world):
--   world_turn               — drives day/night, corpse exposure ticks
--   corpses                  — Sprint 7b.R corpse system
--   vendor_temp_stock        — items sold to vendors (72h buy-back)
--   active_events            — world events (sheriff hunting, fires, etc.)

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS known_circles jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS temp_modifiers jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS current_plane text NOT NULL DEFAULT 'thurian',
  ADD COLUMN IF NOT EXISTS previous_room text,
  ADD COLUMN IF NOT EXISTS prison_turns_remaining int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_action text,
  ADD COLUMN IF NOT EXISTS world_turn int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corpses jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vendor_temp_stock jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS active_events jsonb NOT NULL DEFAULT '[]';
