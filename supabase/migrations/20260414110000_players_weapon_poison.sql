-- Weapon poison coating: charges remaining + severity of the poison.
-- Applied via APPLY [poison] TO WEAPON; decremented per combat hit.
ALTER TABLE players ADD COLUMN IF NOT EXISTS weapon_poison_charges integer DEFAULT 0 NOT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS weapon_poison_severity integer DEFAULT 0 NOT NULL;
