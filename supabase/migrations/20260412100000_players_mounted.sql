-- Add mounted boolean for mounted/dismounted combat state
ALTER TABLE players ADD COLUMN IF NOT EXISTS mounted boolean DEFAULT false;
