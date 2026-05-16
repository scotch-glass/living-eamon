-- Sprint S4d: travel execution state
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_traveling boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS travel_route jsonb DEFAULT NULL;
