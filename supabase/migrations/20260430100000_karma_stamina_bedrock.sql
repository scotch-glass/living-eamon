-- ── KARMA Sprint 1 — Stamina + fatiguePool + actionBudget bedrock ─────
--
-- body-zone-derived dual-pool stamina model per KARMA_SYSTEM.md §2.3 / §4a.
--   stamina        = current pool, drains per swing in combat,
--                    resets to maxStamina at fight-end.
--   max_stamina    = 35 + 2·STR  (default STR 10 → 55).
--   fatigue_pool   = persistent accumulator. Negative values divide
--                    into 4 tiers per the source combat model; tier 4
--                    blocks the player's turn entirely.
--   action_budget  = per-adventure activity counter. Sprint 3's
--                    activity dispatcher decrements; tier scales it
--                    20/25/30 by adventure tier.
--
-- See KARMA_IMPLEMENTATION_PLAN.md Sprint 1.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS stamina        smallint NOT NULL DEFAULT 55,
  ADD COLUMN IF NOT EXISTS max_stamina    smallint NOT NULL DEFAULT 55,
  ADD COLUMN IF NOT EXISTS fatigue_pool   smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS action_budget  smallint NOT NULL DEFAULT 25;
