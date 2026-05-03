-- Sprint G5 — room residue persistence
--
-- room_residue: JSONB snapshot of active environmental residues per room.
-- Shape: { [roomId]: ResidueEntry[] }
-- Only rooms with active residue appear in the object (sparse).
-- Populated by the spell/combat dispatcher; decayed by tickRealTime.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS room_residue JSONB;
