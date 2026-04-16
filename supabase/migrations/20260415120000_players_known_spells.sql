-- Persist learned spells (CAST autocomplete + combat spell-icon row).
-- Mirrors the in-memory `PlayerState.knownSpells` field.
-- Stored as a jsonb array of uppercase spell names (e.g. ["HEAL","BLAST"]).
ALTER TABLE players ADD COLUMN IF NOT EXISTS known_spells jsonb
  DEFAULT '[]'::jsonb NOT NULL;

-- Companion column for divine names learned via PRAY.
ALTER TABLE players ADD COLUMN IF NOT EXISTS known_deities jsonb
  DEFAULT '[]'::jsonb NOT NULL;
