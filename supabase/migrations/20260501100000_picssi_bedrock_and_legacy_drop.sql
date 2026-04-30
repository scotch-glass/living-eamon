-- ── KARMA Sprint 2 — PICSSI bedrock + legacy 10-virtue cold-delete ──
--
-- Per KARMA_IMPLEMENTATION_PLAN.md Sprint 2 + KARMA_SYSTEM.md §2 / §4a.
-- Standing was already added by 20260429210000_picssi_standing_bridge.sql,
-- so this migration adds the remaining 5 PICSSI columns and drops the
-- entire legacy 10-virtue ledger in one transaction.
--
-- PICSSI scale:
--   passion / integrity / courage / spirituality  → 0..100 (unipolar)
--   illumination                                  → -100..+100 (bipolar)
--
-- The legacy ledger (honesty / compassion / valor / justice / sacrifice /
-- honor / spirituality / humility / grace / mercy) was deprecated on
-- 2026-04-29 and replaced by PICSSI. None of these axes maps cleanly to
-- PICSSI — see KARMA_SYSTEM.md §3 — so existing values are NOT migrated
-- forward. Live players reset to a 0-midline PICSSI on first load.
--
-- Honor's runtime mutations were already rewired to picssi_standing in
-- the bridge migration; this migration is the cold-delete itself.

-- ── Add the remaining 5 PICSSI cols (standing already exists) ─────
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS picssi_passion       smallint NOT NULL DEFAULT 0
    CHECK (picssi_passion       BETWEEN 0    AND 100),
  ADD COLUMN IF NOT EXISTS picssi_integrity     smallint NOT NULL DEFAULT 0
    CHECK (picssi_integrity     BETWEEN 0    AND 100),
  ADD COLUMN IF NOT EXISTS picssi_courage       smallint NOT NULL DEFAULT 0
    CHECK (picssi_courage       BETWEEN 0    AND 100),
  ADD COLUMN IF NOT EXISTS picssi_spirituality  smallint NOT NULL DEFAULT 0
    CHECK (picssi_spirituality  BETWEEN 0    AND 100),
  ADD COLUMN IF NOT EXISTS picssi_illumination  smallint NOT NULL DEFAULT 0
    CHECK (picssi_illumination  BETWEEN -100 AND 100);

-- ── Combat-victory counter (drives maxMana via PICSSI formula) ────
-- KARMA_SYSTEM.md §2.2: maxMana = 10 + floor(|Illumination|/2) + combatVictories.
-- Was incremented as maxMana++ directly; now lives as its own counter so
-- recomputeDerivedStats can re-derive maxMana on every load without
-- losing the historical mana growth.
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS combat_victories smallint NOT NULL DEFAULT 0
    CHECK (combat_victories >= 0);

-- Backfill: existing players' historical mana growth (max_mana - 10)
-- becomes their new combat_victories count, so recomputeDerivedStats
-- produces the same maxMana value on first post-migration load.
-- Floored at 0 so anyone whose pool somehow dipped below 10 doesn't go negative.
UPDATE players
   SET combat_victories = GREATEST(0, COALESCE(max_mana, 10) - 10)
 WHERE combat_victories = 0;

-- ── Drop legacy 10-virtue ledger ─────────────────────────────────
-- The ledger lives in `players.virtues` (jsonb). Drop the column entirely.
ALTER TABLE players DROP COLUMN IF EXISTS virtues;
