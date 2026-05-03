// ============================================================
// TRAVEL NODE REGISTRY
// All map nodes a player can travel to, with pixel coordinates
// over the living-eamon-map.png (2560×1693).
//
// Origin (0,0) = top-left corner of the image.
// These coordinates drive the hero marker position in the S4c
// WorldMap component.
// ============================================================

export type NodeType = "origin" | "city" | "landmark" | "nation_hub" | "wilderness";

export type TravelMode = "walk" | "horse" | "ship" | "air" | "gate";

export interface TravelNode {
  id: string;
  name: string;
  type: NodeType;
  /** Pixel coordinates on living-eamon-map.png (2560×1693). */
  x: number;
  y: number;
  /** Travel modes available at or from this node. Defaults to all land modes. */
  availableModes?: TravelMode[];
  /** One-line lore note for UI tooltip. */
  lore?: string;
}

export const TRAVEL_NODES: Record<string, TravelNode> = {
  ostavar: {
    id: "ostavar",
    name: "Ostavar",
    type: "origin",
    x: 595,
    y: 525,
    availableModes: ["walk", "horse", "ship", "gate"],
    lore: "The Guild of Free Adventurers — hub of all roads.",
  },
  city_of_wonders: {
    id: "city_of_wonders",
    name: "City of Wonders",
    type: "city",
    x: 605,
    y: 540,
    availableModes: ["walk", "horse", "ship", "gate"],
    lore: "Kull's capital. Greatest city of the Thurian Age.",
  },
  city_vanara: {
    id: "city_vanara",
    name: "Vanara",
    type: "city",
    x: 490,
    y: 380,
    availableModes: ["walk", "horse"],
    lore: "Western Valusian city; gateway to the northern road.",
  },
  city_kamula: {
    id: "city_kamula",
    name: "Kamula",
    type: "city",
    x: 620,
    y: 420,
    availableModes: ["walk", "horse"],
    lore: "Central Valusian trade city, near the Mirrors.",
  },
  city_talunia: {
    id: "city_talunia",
    name: "Talunia",
    type: "city",
    x: 1160,
    y: 560,
    availableModes: ["walk", "horse", "ship"],
    lore: "Eastern trade hub where Grondarite iron meets western gold.",
  },
  city_blaal: {
    id: "city_blaal",
    name: "Blaal",
    type: "city",
    x: 820,
    y: 690,
    availableModes: ["walk", "horse"],
    lore: "Thuranian river city; last safe stop before the Lost Lands.",
  },
  city_stagus: {
    id: "city_stagus",
    name: "Stagus",
    type: "city",
    x: 1540,
    y: 650,
    availableModes: ["walk", "horse", "ship"],
    lore: "River frontier city at the mouth of the Stagus. The road ends here.",
  },
  poi_skull_of_silence: {
    id: "poi_skull_of_silence",
    name: "Skull of Silence",
    type: "landmark",
    x: 980,
    y: 230,
    availableModes: ["walk", "horse"],
    lore: "Black-stone castle in the Zalgara heights. The Silence is imprisoned within.",
  },
  poi_lake_of_visions: {
    id: "poi_lake_of_visions",
    name: "Lake of Visions",
    type: "landmark",
    x: 500,
    y: 510,
    availableModes: ["walk", "horse"],
    lore: "Mystical lake in central Valusia. Oracle and Outer Dark whispers.",
  },
  poi_accursed_gardens: {
    id: "poi_accursed_gardens",
    name: "Accursed Gardens",
    type: "landmark",
    x: 640,
    y: 565,
    availableModes: ["walk", "horse"],
    lore: "Ruined noble estate two miles east of the City of Wonders. Cursed flora.",
  },
  poi_forbidden_lake: {
    id: "poi_forbidden_lake",
    name: "Forbidden Lake",
    type: "landmark",
    x: 510,
    y: 640,
    availableModes: ["walk", "horse"],
    lore: "On the Valusia/Farsun border. Farsunians will not speak of it.",
  },
  poi_tiger_valley: {
    id: "poi_tiger_valley",
    name: "Tiger Valley",
    type: "landmark",
    x: 320,
    y: 245,
    availableModes: ["walk", "horse"],
    lore: "Deep in Atlantis. Predator wilderness; hunting and survival.",
  },
  nation_thule: {
    id: "nation_thule",
    name: "Thule",
    type: "nation_hub",
    x: 680,
    y: 130,
    availableModes: ["walk", "horse", "ship"],
    lore: "Cold northern kingdom of tall, gray-eyed warriors. Ancient sea traders.",
  },
  nation_commoria: {
    id: "nation_commoria",
    name: "Commoria",
    type: "nation_hub",
    x: 1050,
    y: 175,
    availableModes: ["walk", "horse"],
    lore: "Fortress-citadels carved into mountainsides. Court of assassins and whisper-brokers.",
  },
  nation_lemuria: {
    id: "nation_lemuria",
    name: "Lemuria",
    type: "nation_hub",
    x: 1820,
    y: 400,
    availableModes: ["ship"],
    lore: "Eastern sea-coast nation of golden-eyed scholars and fierce warriors.",
  },
  nation_atlantis: {
    id: "nation_atlantis",
    name: "Atlantis",
    type: "nation_hub",
    x: 210,
    y: 200,
    availableModes: ["ship"],
    lore: "Island nation of wonders. Blue-eyed Celtic raiders and ancient science.",
  },
  geo_lost_lands: {
    id: "geo_lost_lands",
    name: "Lost Lands",
    type: "wilderness",
    x: 900,
    y: 1100,
    availableModes: ["walk", "horse"],
    lore: "Unmapped southern reaches. Eldar, Dwarves, and older things.",
  },
  geo_worlds_end: {
    id: "geo_worlds_end",
    name: "World's End",
    type: "wilderness",
    x: 2000,
    y: 700,
    availableModes: ["walk", "horse"],
    lore: "Past Stagus, the road simply stops. Nothing is mapped beyond.",
  },
  geo_jungles: {
    id: "geo_jungles",
    name: "Thurian Deep Jungle",
    type: "wilderness",
    x: 1650,
    y: 1050,
    availableModes: ["walk"],
    lore: "Serpent-Man temple complexes hidden in vine-choked ancient ruins.",
  },
};

/** Look up a node by id. Returns undefined if not registered. */
export function getTravelNode(id: string): TravelNode | undefined {
  return TRAVEL_NODES[id];
}

/** All registered node ids. */
export function getTravelNodeIds(): string[] {
  return Object.keys(TRAVEL_NODES);
}
