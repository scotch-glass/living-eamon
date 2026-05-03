-- Sprint G1: real-time clock fields on the players table.
-- realTimeMs: elapsed in-game time in ms since world creation (1:1 real time).
-- lastTickAt: unix ms of the last server tick; delta = Date.now() - lastTickAt.
-- DEFAULT 0 means pre-G1 rows will be initialized to epoch; the first tick
-- will set both correctly since no real users exist yet (dev-mode).

ALTER TABLE players ADD COLUMN IF NOT EXISTS real_time_ms BIGINT NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_tick_at BIGINT NOT NULL DEFAULT 0;
