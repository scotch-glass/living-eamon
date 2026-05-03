// ============================================================
// TRAVEL MATRIX
// All authored travel legs between nodes, with zone types,
// danger ratings, and day counts.
//
// Source of truth: lore/thurian-cartography/TRAVEL_MATRIX.md
//
// Usage:
//   - getLegsFrom(nodeId) — outbound legs from a node
//   - getLeg(from, to) — specific leg (checks both directions)
//   - getRouteZones(from, to) — zone list for encounter rolls
// ============================================================

export type ZoneType =
  | "civilization"
  | "plains"
  | "forest_valley"
  | "mountain"
  | "cold_north"
  | "desert"
  | "coastal_sea"
  | "river"
  | "jungle_fringe"
  | "deep_jungle"
  | "frontier"
  | "lost_lands"
  | "hostile_tribal"
  | "thurania_hills"
  | "grondar_plains";

export type DangerRating = "safe" | "moderate" | "dangerous" | "extreme";

export interface TravelLeg {
  from: string;
  to: string;
  /** Days on foot. null = land travel not available (ship-only route). */
  daysFoot: number | null;
  /** Days on horseback. null = land travel not available. */
  daysHorse: number | null;
  /** Days by ship. null = no sea route. */
  daysShip: number | null;
  /** Geographic zones crossed in order. Drives encounter table selection. */
  zones: ZoneType[];
  /** Highest danger zone on this leg. */
  dangerRating: DangerRating;
  /** Total encounter roll count (one per day of the dominant travel time). */
  encounterRolls: number;
}

// ============================================================
// All travel legs
// Legs are stored unidirectionally (from → to).
// getLeg() checks both directions for convenience.
// ============================================================
export const TRAVEL_LEGS: TravelLeg[] = [
  // ── From Valus ────────────────────────────────────────────
  {
    from: "valus",
    to: "poi_lake_of_visions",
    daysFoot: 1,
    daysHorse: 1,
    daysShip: null,
    zones: ["civilization"],
    dangerRating: "safe",
    encounterRolls: 1,
  },
  {
    from: "valus",
    to: "poi_accursed_gardens",
    daysFoot: 1,
    daysHorse: 1,
    daysShip: null,
    zones: ["civilization"],
    dangerRating: "safe",
    encounterRolls: 1,
  },
  {
    from: "valus",
    to: "city_kamula",
    daysFoot: 1,
    daysHorse: 1,
    daysShip: null,
    zones: ["civilization"],
    dangerRating: "safe",
    encounterRolls: 1,
  },
  {
    from: "valus",
    to: "city_vanara",
    daysFoot: 2,
    daysHorse: 1,
    daysShip: null,
    zones: ["civilization", "forest_valley"],
    dangerRating: "moderate",
    encounterRolls: 2,
  },
  {
    from: "valus",
    to: "poi_forbidden_lake",
    daysFoot: 2,
    daysHorse: 1,
    daysShip: null,
    zones: ["civilization", "plains"],
    dangerRating: "moderate",
    encounterRolls: 2,
  },
  {
    from: "valus",
    to: "city_blaal",
    daysFoot: 4,
    daysHorse: 2,
    daysShip: null,
    zones: ["civilization", "plains", "thurania_hills"],
    dangerRating: "moderate",
    encounterRolls: 4,
  },
  {
    from: "valus",
    to: "poi_skull_of_silence",
    daysFoot: 7,
    daysHorse: 4,
    daysShip: null,
    zones: ["civilization", "forest_valley", "mountain"],
    dangerRating: "dangerous",
    encounterRolls: 7,
  },
  {
    from: "valus",
    to: "nation_thule",
    daysFoot: 6,
    daysHorse: 3,
    daysShip: null,
    zones: ["civilization", "forest_valley", "cold_north"],
    dangerRating: "dangerous",
    encounterRolls: 6,
  },
  {
    from: "valus",
    to: "city_talunia",
    daysFoot: 7,
    daysHorse: 4,
    daysShip: null,
    zones: ["civilization", "desert", "forest_valley"],
    dangerRating: "dangerous",
    encounterRolls: 7,
  },
  {
    from: "valus",
    to: "city_stagus",
    daysFoot: 11,
    daysHorse: 6,
    daysShip: null,
    zones: ["civilization", "thurania_hills", "grondar_plains", "jungle_fringe", "river"],
    dangerRating: "dangerous",
    encounterRolls: 11,
  },
  {
    from: "valus",
    to: "nation_commoria",
    daysFoot: 9,
    daysHorse: 5,
    daysShip: null,
    zones: ["civilization", "forest_valley", "mountain", "cold_north"],
    dangerRating: "dangerous",
    encounterRolls: 9,
  },
  {
    // Ship-only: 3 days at sea
    from: "valus",
    to: "nation_atlantis",
    daysFoot: null,
    daysHorse: null,
    daysShip: 3,
    zones: ["coastal_sea"],
    dangerRating: "dangerous",
    encounterRolls: 3,
  },
  {
    // Ship-only: 7 days at sea
    from: "valus",
    to: "nation_lemuria",
    daysFoot: null,
    daysHorse: null,
    daysShip: 7,
    zones: ["coastal_sea"],
    dangerRating: "dangerous",
    encounterRolls: 7,
  },
  {
    from: "valus",
    to: "geo_lost_lands",
    daysFoot: 8,
    daysHorse: 5,
    daysShip: null,
    zones: ["civilization", "thurania_hills", "lost_lands"],
    dangerRating: "extreme",
    encounterRolls: 8,
  },
  {
    // Sea crossing (3d) + overland (2d) on Atlantis
    from: "valus",
    to: "poi_tiger_valley",
    daysFoot: null,
    daysHorse: null,
    daysShip: 3,
    zones: ["coastal_sea", "plains"],
    dangerRating: "dangerous",
    encounterRolls: 5,
  },

  // ── Between destinations ───────────────────────────────────
  {
    from: "city_vanara",
    to: "nation_thule",
    daysFoot: 4,
    daysHorse: 2,
    daysShip: null,
    zones: ["forest_valley", "cold_north"],
    dangerRating: "dangerous",
    encounterRolls: 4,
  },
  {
    from: "city_vanara",
    to: "poi_skull_of_silence",
    daysFoot: 5,
    daysHorse: 3,
    daysShip: null,
    zones: ["forest_valley", "mountain"],
    dangerRating: "dangerous",
    encounterRolls: 5,
  },
  {
    from: "poi_skull_of_silence",
    to: "nation_commoria",
    daysFoot: 2,
    daysHorse: 1,
    daysShip: null,
    zones: ["mountain"],
    dangerRating: "dangerous",
    encounterRolls: 2,
  },
  {
    from: "poi_skull_of_silence",
    to: "city_talunia",
    daysFoot: 4,
    daysHorse: 2,
    daysShip: null,
    zones: ["mountain", "forest_valley"],
    dangerRating: "dangerous",
    encounterRolls: 4,
  },
  {
    from: "city_talunia",
    to: "city_stagus",
    daysFoot: 4,
    daysHorse: 2,
    daysShip: null,
    zones: ["grondar_plains", "river", "coastal_sea"],
    dangerRating: "moderate",
    encounterRolls: 4,
  },
  {
    from: "city_talunia",
    to: "nation_lemuria",
    daysFoot: null,
    daysHorse: null,
    daysShip: 5,
    zones: ["coastal_sea"],
    dangerRating: "dangerous",
    encounterRolls: 5,
  },
  {
    from: "city_blaal",
    to: "city_stagus",
    daysFoot: 7,
    daysHorse: 4,
    daysShip: null,
    zones: ["thurania_hills", "jungle_fringe", "river"],
    dangerRating: "dangerous",
    encounterRolls: 7,
  },
  {
    from: "city_blaal",
    to: "geo_lost_lands",
    daysFoot: 4,
    daysHorse: 2,
    daysShip: null,
    zones: ["thurania_hills", "lost_lands"],
    dangerRating: "extreme",
    encounterRolls: 4,
  },
  {
    from: "city_stagus",
    to: "geo_worlds_end",
    daysFoot: 5,
    daysHorse: 3,
    daysShip: null,
    zones: ["jungle_fringe", "frontier"],
    dangerRating: "extreme",
    encounterRolls: 5,
  },
  {
    from: "city_stagus",
    to: "geo_jungles",
    daysFoot: 3,
    daysHorse: 2,
    daysShip: null,
    zones: ["jungle_fringe", "deep_jungle"],
    dangerRating: "extreme",
    encounterRolls: 3,
  },
  {
    from: "nation_atlantis",
    to: "poi_tiger_valley",
    daysFoot: 2,
    daysHorse: 1,
    daysShip: null,
    zones: ["plains"],
    dangerRating: "moderate",
    encounterRolls: 2,
  },
  {
    from: "nation_thule",
    to: "nation_commoria",
    daysFoot: 3,
    daysHorse: 2,
    daysShip: null,
    zones: ["cold_north", "mountain"],
    dangerRating: "dangerous",
    encounterRolls: 3,
  },
];

// ── Lookup helpers ─────────────────────────────────────────

/** All legs departing from a given node (directional). */
export function getLegsFrom(nodeId: string): TravelLeg[] {
  return TRAVEL_LEGS.filter((l) => l.from === nodeId);
}

/**
 * Find the leg between two nodes.
 * Checks both from→to and to→from since legs are stored unidirectionally.
 */
export function getLeg(from: string, to: string): TravelLeg | undefined {
  return TRAVEL_LEGS.find(
    (l) => (l.from === from && l.to === to) || (l.from === to && l.to === from)
  );
}

/** Zone list for a route, used to build encounter roll tables. */
export function getRouteZones(from: string, to: string): ZoneType[] {
  return getLeg(from, to)?.zones ?? [];
}

/**
 * Scene background ID for a zone type and time of day.
 * Day: worldTurn % 24 in [6,18]. Night: otherwise.
 */
export function sceneIdForZone(zone: ZoneType, isDay: boolean): string {
  const map: Record<ZoneType, [string, string]> = {
    civilization:    ["scene_valusia_road_day",     "scene_valusia_road_night"],
    plains:          ["scene_plains_day",            "scene_plains_night"],
    forest_valley:   ["scene_forest_valley_day",     "scene_forest_valley_night"],
    mountain:        ["scene_mountain_pass_day",     "scene_mountain_pass_night"],
    cold_north:      ["scene_cold_north_day",        "scene_cold_north_night"],
    desert:          ["scene_desert_day",            "scene_desert_night"],
    coastal_sea:     ["scene_sea_day",               "scene_sea_night"],
    river:           ["scene_river_stagus_day",      "scene_river_stagus_day"],
    jungle_fringe:   ["scene_jungle_fringe_day",     "scene_deep_jungle_night"],
    deep_jungle:     ["scene_deep_jungle_day",       "scene_deep_jungle_night"],
    frontier:        ["scene_frontier_day",          "scene_frontier_night"],
    lost_lands:      ["scene_lost_lands_day",        "scene_frontier_night"],
    hostile_tribal:  ["scene_plains_day",            "scene_plains_night"],
    thurania_hills:  ["scene_thurania_hills_day",    "scene_plains_night"],
    grondar_plains:  ["scene_grondar_plains_day",    "scene_plains_night"],
  };
  const [day, night] = map[zone];
  return isDay ? day : night;
}
