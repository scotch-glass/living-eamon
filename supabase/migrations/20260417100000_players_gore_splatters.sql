-- Add gore_splatters column for persistent hero blood overlay state.
-- Purely visual data — serialized splatter positions, cleared on death/wash.
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS gore_splatters jsonb DEFAULT '[]' NOT NULL;
