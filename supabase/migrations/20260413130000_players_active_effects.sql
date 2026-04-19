-- Status effects (bleed, poison, broken_leg, etc.) carried out of combat.
-- Ticked once per player turn by tickWorldState. Transferred in/out of
-- the playerCombatant when combat starts/ends.
ALTER TABLE players ADD COLUMN IF NOT EXISTS active_effects jsonb DEFAULT '[]'::jsonb NOT NULL;
