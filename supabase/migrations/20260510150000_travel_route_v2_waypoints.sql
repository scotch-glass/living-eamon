-- TravelRoute JSONB schema v2 (2026-05-10) — multi-hop routing support
--
-- NO SCHEMA CHANGE — the players.travel_route column is already JSONB and flexible.
-- This migration is documentation-only. Existing routes with neither waypoints[]
-- nor currentLegIndex are treated as direct routes (empty waypoints, currentLegIndex=0)
-- when read by TypeScript code.
--
-- New field meanings:
--   waypoints: string[]     — intermediate node ids (empty [] for direct routes)
--   currentLegIndex: number — which leg the player is currently on (default 0)
--
-- Example v2 route (multi-hop Valus → Atlantis via intermediate leg):
--   {
--     "originNodeId": "valus",
--     "destinationNodeId": "nation_atlantis",
--     "totalDays": 6,
--     "daysElapsed": 2,
--     "mode": "horse",
--     "zones": ["civilization", "plains", "coastal_sea"],
--     "dangerRating": "dangerous",
--     "waypoints": ["city_vanara", "nation_atlantis"],
--     "currentLegIndex": 1
--   }
--
-- Backward compatibility: reads of v1 routes default waypoints=[], currentLegIndex=0.
-- New routes always set both fields explicitly.

COMMENT ON COLUMN players.travel_route IS
  'TravelRoute JSONB schema v2 (2026-05-10): adds waypoints[] + currentLegIndex for multi-hop pathfinding. Existing routes treated as direct (empty waypoints, currentLegIndex=0).';
