-- Current mana points for the hero. Max mana = expertise (the pool size).
-- Spent by INVOKE/CAST when mana costs land; regenerates each turn via
-- tickWorldState. Default 10 matches the new starting expertise pool.
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_mana integer DEFAULT 10;

-- Backfill any existing rows where current_mana is NULL — set them to
-- their current expertise pool so existing heroes start full.
UPDATE players SET current_mana = COALESCE(expertise, 10) WHERE current_mana IS NULL;
