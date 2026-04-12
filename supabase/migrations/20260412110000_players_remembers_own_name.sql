-- Track whether an NPC has spoken the hero's name, triggering the name-revelation moment
ALTER TABLE players ADD COLUMN IF NOT EXISTS remembers_own_name boolean DEFAULT false;
