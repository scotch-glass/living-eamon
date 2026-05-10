// ============================================================
// TRAVEL ENCOUNTERS
// Encounter pools keyed by zone type and danger rating.
// Resolver picks encounters via d100 roll on appropriate pool.
//
// Source: lore/thurian-cartography/TRAVEL_MATRIX.md §Encounter Roll Mechanics
// Usage: pickEncounter(zoneType, dangerRating) → TravelEncounter | null
// ============================================================

import type { ZoneType, DangerRating } from "./travelMatrix";

export type EncounterKind = "combat" | "event";

export interface TravelEncounter {
  id: string;
  kind: EncounterKind;
  /** Combat: enemy group id from COMBAT_TEMPLATES */
  enemyGroup?: string;
  /** Event: narrative text for the encounter */
  eventText?: string;
  /** Optional: atom id to present after narrative (e.g., a karma choice) */
  karmaAtom?: string;
}

// ── Encounter pools by zone type ────────────────────────────

const COMBAT_BANDITS: TravelEncounter = {
  id: "bandits_road",
  kind: "combat",
  enemyGroup: "bandits",
};

const COMBAT_WOLVES: TravelEncounter = {
  id: "wolves_pack",
  kind: "combat",
  enemyGroup: "wolf_pack",
};

const COMBAT_SERPENT_MEN: TravelEncounter = {
  id: "serpent_men",
  kind: "combat",
  enemyGroup: "serpent_men",
};

const COMBAT_PIRATES: TravelEncounter = {
  id: "pirates",
  kind: "combat",
  enemyGroup: "pirates",
};

const EVENT_HERMIT: TravelEncounter = {
  id: "hermit_encounter",
  kind: "event",
  eventText:
    "A weathered hermit emerges from the trees, offering warnings of dangers ahead... or is he trying to lure you into a trap?",
};

const EVENT_STORM: TravelEncounter = {
  id: "thunderstorm",
  kind: "event",
  eventText:
    "Black clouds gather overhead. Thunder rumbles across the landscape as you hurry to find shelter.",
};

const EVENT_RUIN: TravelEncounter = {
  id: "ancient_ruin",
  kind: "event",
  eventText:
    "Crumbling stone foundations jut from the earth — the remnants of a civilization older than memory. Do you dare to investigate?",
};

const EVENT_CARAVAN: TravelEncounter = {
  id: "merchant_caravan",
  kind: "event",
  eventText:
    "A merchant caravan approaches from the distance, colorful banners fluttering. The merchants eye you with cautious interest.",
};

// Civilization zone (safe, infrequent encounters)
const ENCOUNTERS_CIVILIZATION: TravelEncounter[] = [
  COMBAT_BANDITS,
  EVENT_HERMIT,
  EVENT_CARAVAN,
  {
    id: "lost_traveler",
    kind: "event",
    eventText: "A frightened traveler approaches, begging for directions to the nearest town.",
  },
];

// Plains zone (moderate danger, mixed encounters)
const ENCOUNTERS_PLAINS: TravelEncounter[] = [
  COMBAT_BANDITS,
  COMBAT_WOLVES,
  EVENT_STORM,
  EVENT_CARAVAN,
  {
    id: "deer_herd",
    kind: "event",
    eventText: "A herd of deer bounds across the plains, startled by your passage.",
  },
];

// Forest/valley zone
const ENCOUNTERS_FOREST: TravelEncounter[] = [
  COMBAT_BANDITS,
  COMBAT_WOLVES,
  EVENT_HERMIT,
  EVENT_RUIN,
  {
    id: "forest_sprite",
    kind: "event",
    eventText: "A faint, ethereal voice echoes through the trees. A will-o'-the-wisp dances before you.",
  },
];

// Mountain zone (dangerous, hazardous encounters)
const ENCOUNTERS_MOUNTAIN: TravelEncounter[] = [
  COMBAT_BANDITS,
  EVENT_STORM,
  EVENT_RUIN,
  {
    id: "rockfall",
    kind: "event",
    eventText: "A rockslide tumbles down the mountainside, forcing you to scramble for safety.",
  },
  {
    id: "mountain_hermit",
    kind: "event",
    eventText: "A robed figure guards a narrow pass, demanding toll or combat.",
  },
];

// Cold north zone (dangerous, harsh encounters)
const ENCOUNTERS_COLD_NORTH: TravelEncounter[] = [
  COMBAT_BANDITS,
  {
    id: "ice_storm",
    kind: "event",
    eventText: "Howling winds and blinding snow make travel treacherous. You must find shelter soon.",
  },
  {
    id: "frost_giant",
    kind: "combat",
    enemyGroup: "frost_giant",
  },
  EVENT_RUIN,
];

// Desert zone (dangerous, environmental hazards)
const ENCOUNTERS_DESERT: TravelEncounter[] = [
  COMBAT_BANDITS,
  {
    id: "scorpion_swarm",
    kind: "event",
    eventText: "The ground beneath your feet suddenly writhes with scorpions. You sprint away, boots crunching.",
  },
  {
    id: "dust_storm",
    kind: "event",
    eventText: "A massive dust storm rolls across the desert, reducing visibility to mere feet.",
  },
  {
    id: "mirage",
    kind: "event",
    eventText: "A shimmering oasis appears in the distance... but as you approach, it fades like a dream.",
  },
];

// Coastal/sea zone (dangerous, maritime hazards)
const ENCOUNTERS_COASTAL: TravelEncounter[] = [
  COMBAT_PIRATES,
  {
    id: "sea_creature",
    kind: "combat",
    enemyGroup: "sea_creature",
  },
  {
    id: "shipwreck",
    kind: "event",
    eventText: "The splintered remains of a ship wash ashore. Survivors beckon from the rocks.",
  },
  EVENT_CARAVAN,
];

// River zone (moderate danger)
const ENCOUNTERS_RIVER: TravelEncounter[] = [
  COMBAT_BANDITS,
  {
    id: "river_crossing",
    kind: "event",
    eventText: "The river is swollen with recent rains, making the crossing treacherous.",
  },
  {
    id: "river_hermit",
    kind: "event",
    eventText: "An old ferryman waits by the river, offering passage... for a price.",
  },
];

// Hostile tribal zone (dangerous, tribal encounters)
const ENCOUNTERS_HOSTILE_TRIBAL: TravelEncounter[] = [
  {
    id: "tribal_warriors",
    kind: "combat",
    enemyGroup: "tribal_warriors",
  },
  COMBAT_BANDITS,
  EVENT_RUIN,
  {
    id: "tribal_ritual",
    kind: "event",
    eventText:
      "You stumble upon a tribal ritual in progress. The warriors stop and stare at you with hostile intent.",
  },
];

// Jungle fringe zone (dangerous, transitional)
const ENCOUNTERS_JUNGLE_FRINGE: TravelEncounter[] = [
  COMBAT_WOLVES,
  COMBAT_SERPENT_MEN,
  {
    id: "giant_spider",
    kind: "combat",
    enemyGroup: "giant_spider",
  },
  {
    id: "jungle_vines",
    kind: "event",
    eventText: "Thick, strangling vines block the path. Cutting through them takes precious time.",
  },
];

// Deep jungle zone (extreme danger)
const ENCOUNTERS_DEEP_JUNGLE: TravelEncounter[] = [
  COMBAT_SERPENT_MEN,
  {
    id: "giant_spider",
    kind: "combat",
    enemyGroup: "giant_spider",
  },
  {
    id: "jungle_disease",
    kind: "event",
    eventText: "You develop a burning fever. Malaria? Jungle plague? You press on despite the sickness.",
  },
  {
    id: "lost_city",
    kind: "event",
    eventText: "Stone pyramids emerge from the jungle canopy — an entire city swallowed by vines and time.",
  },
];

// Frontier zone (extreme danger)
const ENCOUNTERS_FRONTIER: TravelEncounter[] = [
  COMBAT_BANDITS,
  {
    id: "frontier_outlaws",
    kind: "combat",
    enemyGroup: "outlaw_gang",
  },
  EVENT_RUIN,
  {
    id: "frontier_madness",
    kind: "event",
    eventText: "The isolation of the frontier seems to weigh on you. Strange whispers echo in the wind.",
  },
];

// Lost Lands zone (extreme danger, otherworldly)
const ENCOUNTERS_LOST_LANDS: TravelEncounter[] = [
  {
    id: "ancient_guardian",
    kind: "combat",
    enemyGroup: "ancient_guardian",
  },
  {
    id: "lost_city_ruins",
    kind: "event",
    eventText: "Impossibly ancient ruins litter the landscape — geometry and architecture that defy reason.",
  },
  {
    id: "shadow_creature",
    kind: "event",
    eventText: "Something moves in the shadows, neither beast nor human. You grip your weapon tightly.",
  },
];

// Zone groupings
const ENCOUNTERS_BY_ZONE: Record<ZoneType, TravelEncounter[]> = {
  civilization: ENCOUNTERS_CIVILIZATION,
  plains: ENCOUNTERS_PLAINS,
  forest_valley: ENCOUNTERS_FOREST,
  mountain: ENCOUNTERS_MOUNTAIN,
  cold_north: ENCOUNTERS_COLD_NORTH,
  desert: ENCOUNTERS_DESERT,
  coastal_sea: ENCOUNTERS_COASTAL,
  river: ENCOUNTERS_RIVER,
  hostile_tribal: ENCOUNTERS_HOSTILE_TRIBAL,
  jungle_fringe: ENCOUNTERS_JUNGLE_FRINGE,
  deep_jungle: ENCOUNTERS_DEEP_JUNGLE,
  frontier: ENCOUNTERS_FRONTIER,
  lost_lands: ENCOUNTERS_LOST_LANDS,
  thurania_hills: ENCOUNTERS_PLAINS, // Fallback to plains
  grondar_plains: ENCOUNTERS_PLAINS, // Fallback to plains
};

// ── Public API ──────────────────────────────────────────────

/**
 * Pick an encounter for a zone. Returns null if the zone type
 * is unknown or has no encounters defined.
 */
export function pickEncounter(zoneType: ZoneType, _dangerRating: DangerRating): TravelEncounter | null {
  const pool = ENCOUNTERS_BY_ZONE[zoneType];
  if (!pool || pool.length === 0) return null;

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Get all encounters for a zone (for balance checking, GPE analysis, etc.)
 */
export function getEncountersForZone(zoneType: ZoneType): TravelEncounter[] {
  return ENCOUNTERS_BY_ZONE[zoneType] ?? [];
}
