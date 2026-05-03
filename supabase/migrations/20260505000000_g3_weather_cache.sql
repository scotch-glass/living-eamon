-- Sprint G3 — Eivissa weather cache table + per-player current_weather column
--
-- weather_cache: one shared row (id = 1) holds the latest Open-Meteo fetch.
--   Refreshed server-side whenever the cached fetch is >30 minutes old.
--   All players read from this shared cache; no per-player weather fetch.
--
-- players.current_weather: JSONB snapshot of the weather at last player load.
--   Shape: { kind: string, temp: number, fetchedAt: number }
--   Populated from weather_cache on every chat request.

CREATE TABLE IF NOT EXISTS weather_cache (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  kind        TEXT    NOT NULL DEFAULT 'sunny',
  temp        NUMERIC NOT NULL DEFAULT 20,
  fetched_at  BIGINT  NOT NULL DEFAULT 0,
  CONSTRAINT  weather_cache_single_row CHECK (id = 1)
);

-- Seed the single row so upsert always has a target.
INSERT INTO weather_cache (id, kind, temp, fetched_at)
VALUES (1, 'sunny', 20, 0)
ON CONFLICT (id) DO NOTHING;

-- Per-player weather snapshot (JSONB for schema flexibility).
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS current_weather JSONB;
