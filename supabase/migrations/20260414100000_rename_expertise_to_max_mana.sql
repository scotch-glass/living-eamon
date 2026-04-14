-- Rename the expertise column to max_mana. This field has always been the
-- mana pool size; the "expertise" name was a legacy holdover that confused
-- the game engine and UI code. No data loss — just a column rename.
ALTER TABLE players RENAME COLUMN expertise TO max_mana;

-- Backfill: any rows where max_mana is 0 (created before the mana system)
-- get bumped to the default starting value of 10, and current_mana set to match.
UPDATE players SET max_mana = 10, current_mana = 10 WHERE max_mana = 0;
