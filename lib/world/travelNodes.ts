// ============================================================
// TRAVEL NODE REGISTRY
// All map nodes a player can travel to, with pixel coordinates
// over the living-eamon-map.png (2092×1382).
//
// Origin (0,0) = top-left corner of the image.
// These coordinates drive the hero marker position in the S4c
// WorldMap component.
//
// Coordinates hand-placed 2026-05-03 by dragging pins in the
// WorldMap PLACE PINS tool. Values are raw source-pixel coords
// as reported by the tool (display_px / SCALE).
// ============================================================

export type NodeType = "origin" | "city" | "landmark" | "nation_hub" | "wilderness";

export type TravelMode = "walk" | "horse" | "ship" | "air" | "gate";

export interface TravelNode {
  id: string;
  name: string;
  type: NodeType;
  /** Pixel coordinates on living-eamon-map.png (2092×1382). */
  x: number;
  y: number;
  /** Travel modes available at or from this node. Defaults to all land modes. */
  availableModes?: TravelMode[];
  /** One-line lore note for UI tooltip. */
  lore?: string;
}

export const TRAVEL_NODES: Record<string, TravelNode> = {
  valus: {
    id: "valus",
    name: "Valus, the City of Wonders",
    type: "origin",
    x: 980,
    y: 800,
    availableModes: ["walk", "horse", "ship", "gate"],
    lore: "The Guild of Free Adventurers — capital of Valusia, hub of all roads.",
  },
  city_vanara: {
    id: "city_vanara",
    name: "Vanara",
    type: "city",
    x: 790,
    y: 522,
    availableModes: ["walk", "horse"],
    lore: "Western Valusian city; gateway to the northern road.",
  },
  city_kamula: {
    id: "city_kamula",
    name: "Kamula",
    type: "city",
    x: 1006,
    y: 592,
    availableModes: ["walk", "horse"],
    lore: "Central Valusian trade city, near the Mirrors.",
  },
  city_talunia: {
    id: "city_talunia",
    name: "Talunia",
    type: "city",
    x: 1372,
    y: 787,
    availableModes: ["walk", "horse", "ship"],
    lore: "Eastern trade hub where Grondarite iron meets western gold.",
  },
  city_blaal: {
    id: "city_blaal",
    name: "Blaal",
    type: "city",
    x: 1000,
    y: 996,
    availableModes: ["walk", "horse"],
    lore: "Thuranian river city; last safe stop before the Lost Lands.",
  },
  city_stagus: {
    id: "city_stagus",
    name: "Stagus",
    type: "city",
    x: 1690,
    y: 794,
    availableModes: ["walk", "horse", "ship"],
    lore: "River frontier city at the mouth of the Stagus. The road ends here.",
  },
  poi_skull_of_silence: {
    id: "poi_skull_of_silence",
    name: "Skull of Silence",
    type: "landmark",
    x: 1182,
    y: 358,
    availableModes: ["walk", "horse"],
    lore: "Black-stone castle in the Zalgara heights. The Silence is imprisoned within.",
  },
  poi_lake_of_visions: {
    id: "poi_lake_of_visions",
    name: "Lake of Visions",
    type: "landmark",
    x: 746,
    y: 772,
    availableModes: ["walk", "horse"],
    lore: "Mystical lake in central Valusia. Oracle and Outer Dark whispers.",
  },
  poi_accursed_gardens: {
    id: "poi_accursed_gardens",
    name: "Accursed Gardens",
    type: "landmark",
    x: 1002,
    y: 816,
    availableModes: ["walk", "horse"],
    lore: "Ruined noble estate two miles east of Valus. Cursed flora.",
  },
  poi_forbidden_lake: {
    id: "poi_forbidden_lake",
    name: "Forbidden Lake",
    type: "landmark",
    x: 954,
    y: 868,
    availableModes: ["walk", "horse"],
    lore: "On the Valusia/Farsun border. Farsunians will not speak of it.",
  },
  poi_tiger_valley: {
    id: "poi_tiger_valley",
    name: "Tiger Valley",
    type: "landmark",
    x: 506,
    y: 327,
    availableModes: ["walk", "horse"],
    lore: "Deep in Atlantis. Predator wilderness; hunting and survival.",
  },
  nation_thule: {
    id: "nation_thule",
    name: "Thule",
    type: "nation_hub",
    x: 760,
    y: 236,
    availableModes: ["walk", "horse", "ship"],
    lore: "Cold northern kingdom of tall, gray-eyed warriors. Ancient sea traders.",
  },
  nation_commoria: {
    id: "nation_commoria",
    name: "Commoria",
    type: "nation_hub",
    x: 1278,
    y: 281,
    availableModes: ["walk", "horse"],
    lore: "Fortress-citadels carved into mountainsides. Court of assassins and whisper-brokers.",
  },
  nation_lemuria: {
    id: "nation_lemuria",
    name: "Lemuria",
    type: "nation_hub",
    x: 1810,
    y: 236,
    availableModes: ["ship"],
    lore: "Eastern sea-coast nation of golden-eyed scholars and fierce warriors.",
  },
  nation_atlantis: {
    id: "nation_atlantis",
    name: "Atlantis",
    type: "nation_hub",
    x: 398,
    y: 273,
    availableModes: ["ship"],
    lore: "Island nation of wonders. Blue-eyed Celtic raiders and ancient science.",
  },
  geo_lost_lands: {
    id: "geo_lost_lands",
    name: "Lost Lands",
    type: "wilderness",
    x: 1234,
    y: 1119,
    availableModes: ["walk", "horse"],
    lore: "Unmapped southern reaches. Eldar, Dwarves, and older things.",
  },
  geo_worlds_end: {
    id: "geo_worlds_end",
    name: "World's End",
    type: "wilderness",
    x: 1758,
    y: 854,
    availableModes: ["walk", "horse"],
    lore: "Past Stagus, the road simply stops. Nothing is mapped beyond.",
  },
  nation_farsun: {
    id: "nation_farsun",
    name: "Farsun",
    type: "nation_hub",
    x: 384,
    y: 1013,
    availableModes: ["walk", "horse"],
    lore: "Southwestern plains nation. Caravan crossroads; every road passes through Farsun.",
  },
  // --- nodes below are estimated; drag to correct via PLACE PINS mode ---
  geo_red_isles: {
    id: "geo_red_isles",
    name: "Red Isles",
    type: "wilderness",
    x: 174,
    y: 664,
    availableModes: ["ship"],
    lore: "Far western islands — blood-red stone cliffs, rumored mineral wealth.",
  },
  geo_tathel_isle: {
    id: "geo_tathel_isle",
    name: "Tathel Isle",
    type: "wilderness",
    x: 166,
    y: 360,
    availableModes: ["ship"],
    lore: "Remote western island. Sea crossing required. Isolation and strange rites.",
  },
  nation_kamelia: {
    id: "nation_kamelia",
    name: "Kamelia",
    type: "nation_hub",
    x: 906,
    y: 394,
    availableModes: ["walk", "horse"],
    lore: "Kingdom between Thule and Valusia. Home of the Mirrors of Tuzun Thune.",
  },
  geo_mu: {
    id: "geo_mu",
    name: "Mu",
    type: "wilderness",
    x: 1712,
    y: 353,
    availableModes: ["ship"],
    lore: "Legendary sunken continent of the far southwest. Ruins beneath the waves.",
  },
  nation_thurania: {
    id: "nation_thurania",
    name: "Thurania",
    type: "nation_hub",
    x: 726,
    y: 1034,
    availableModes: ["walk", "horse"],
    lore: "Southern transit kingdom. Stone circles, shamanic rites, and the road to the Lost Lands.",
  },
  geo_camoonian_desert: {
    id: "geo_camoonian_desert",
    name: "Camoonian Desert",
    type: "wilderness",
    x: 1076,
    y: 710,
    availableModes: ["walk", "horse"],
    lore: "Arid waste between Zarfhaana and the Zalgara Mountains. Sandstorms and buried ruins.",
  },
  geo_zalgara_mts: {
    id: "geo_zalgara_mts",
    name: "Zalgara Mountains",
    type: "wilderness",
    x: 1168,
    y: 499,
    availableModes: ["walk", "horse"],
    lore: "The great central spine. Mountain passes, avalanche, and the Skull of Silence in its heights.",
  },
  geo_jungles: {
    id: "geo_jungles",
    name: "Thurian Deep Jungle",
    type: "wilderness",
    x: 1936,
    y: 1170,
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
