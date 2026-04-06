export type SceneTone = "pastoral" | "civilized" | "grimdark";
export type SceneState = "normal" | "damaged" | "ruined";

export interface SceneDefinition {
  displayName: string;
  defaultTone: SceneTone;
  visualDescription: string;
}

export const SCENE_DATA: Record<string, SceneDefinition> = {
  main_hall: {
    displayName: "The Main Hall",
    defaultTone: "civilized",
    visualDescription:
      "A vast stone adventurers' hall with vaulted ceilings lost in shadow, long oak tables scarred by generations of weapons and tankards, iron chandeliers holding guttering candles. Trophy heads of impossible creatures line the walls between faded guild banners. The air smells of woodsmoke, tallow, and old leather.",
  },
  guild_courtyard: {
    displayName: "The Guild Courtyard",
    defaultTone: "civilized",
    visualDescription:
      "An open cobblestone yard enclosed by stone walls topped with iron spikes, weathered training dummies arranged in rough rows, a well at the centre with a rusted iron bucket. The guild's cracked banner hangs above the arched gate. Clouds move fast overhead.",
  },
  hokas_shop: {
    displayName: "Hokas's Shop",
    defaultTone: "civilized",
    visualDescription:
      "A cramped merchant's stall overflowing with weapons on pegs, potions in mismatched bottles, armour stacked in corners, and curiosities dangling from the rafters on leather cords. A single oil lamp casts amber light over everything. The counter is dark wood worn smooth by ten thousand transactions.",
  },
  sams_stall: {
    displayName: "Sam's Stall",
    defaultTone: "civilized",
    visualDescription:
      "A narrow stall pressed against the Main Hall wall, bolts of cloth and ready-made garments folded on shelves, a tailor's dummy wearing a grey guild robe. Sam's measuring tape and shears hang on a hook beside a cracked mirror.",
  },
  bank: {
    displayName: "The Hall Vault",
    defaultTone: "civilized",
    visualDescription:
      "A low stone room with a heavy iron-banded door, a single barred window, and a scarred wooden counter behind which ledgers tower in unstable columns. Iron strongboxes line the far wall, each padlocked. The smell is dust and old coin.",
  },
  church_of_perpetual_life: {
    displayName: "Church of Perpetual Life",
    defaultTone: "grimdark",
    visualDescription:
      "A cold stone nave lit only by guttering black candles arranged in concentric rings on the floor, a plain altar of dark stone at the far end bearing no symbol. Silent priests in black robes stand utterly still at the walls, faces obscured by deep hoods. The air is thick with incense and something older — something that predates fire.",
  },
  armoury: {
    displayName: "The Armoury",
    defaultTone: "civilized",
    visualDescription:
      "Stone racks holding spears, axes, swords and shields of every condition from battered to nearly new. A grindstone sits in one corner beside a bucket of water gone rust-brown. Torchlight catches the edges of steel and iron throughout the low-ceilinged room.",
  },
  pit: {
    displayName: "The Pit",
    defaultTone: "grimdark",
    visualDescription:
      "A circular fighting pit sunk into the stone floor, the walls around it gouged and bloodstained at knee height. Iron railings ring the edge above. Sand on the floor has absorbed so much over the years it is almost black. Torches in wall sconces throw harsh orange light downward.",
  },
};

export const TONE_MODIFIERS: Record<SceneTone, string> = {
  pastoral:
    "Warm golden afternoon light, soft shadows, green hills visible through any opening, the feeling of absolute safety and ancient peace. Soft focus on edges.",
  civilized:
    "Torchlight and candlelight casting deep amber shadows, stone and timber architecture, the hum of human activity nearby. Weight of history in every surface.",
  grimdark:
    "Harsh directional torchlight leaving most of the scene in deep shadow, sulfurous undertones in the air suggested by colour, oppressive low ceilings or vast cold spaces, the feeling that something terrible has happened here or is about to.",
};

export const STATE_MODIFIERS: Record<SceneState, string> = {
  normal: "Intact. Worn by time and use but structurally whole.",
  damaged:
    "Partially destroyed. Collapsed sections, scorch marks, debris on the floor, broken furniture. Still recognisable but visibly wounded.",
  ruined:
    "Catastrophically destroyed. Roofless or collapsed walls, charred timbers, rubble covering the floor, nothing standing above chest height. Sulfur traces on the stone.",
};

function buildBasePromptLines(
  roomId: string,
  tone: SceneTone,
  state: SceneState
): string[] {
  const scene = SCENE_DATA[roomId];
  if (!scene) {
    return [
      `Cinematic photorealistic establishing shot of a ${tone} fantasy location.`,
      "Tolkienian-GrimDark style. Extremely high definition, gritty, hyper-detailed.",
      "No text, no watermarks, no foreground characters.",
      `${TONE_MODIFIERS[tone]} ${STATE_MODIFIERS[state]}`,
    ];
  }
  return [
    "Cinematic photorealistic establishing shot. Tolkienian-GrimDark fantasy art style.",
    "Extremely high definition, gritty, hyper-detailed surface textures.",
    "Natural subsurface scattering. Film grain. Dramatic directional lighting. Deep shadow and highlight contrast.",
    "No text. No watermarks. No foreground characters — scene-setting background illustration, like a chapter illustration in a novel.",
    "",
    `Location: ${scene.displayName}`,
    `Visual: ${scene.visualDescription}`,
    `Atmosphere: ${TONE_MODIFIERS[tone]}`,
    `Condition: ${STATE_MODIFIERS[state]}`,
    "",
    "Style reference: Tolkien's Middle-earth concept art crossed with Warhammer Fantasy grimness.",
    "The weight of ancient history in every stone. Every surface tells a story of use, age, and consequence.",
  ];
}

// Standard prompt
export function buildScenePrompt(
  roomId: string,
  tone: SceneTone,
  state: SceneState
): string {
  return buildBasePromptLines(roomId, tone, state).join("\n");
}

// Sanitized prompt — used on censorship retry.
// Strips any potentially flagged language and anchors the prompt
// firmly in architectural/environmental description only.
export function buildScenePromptSanitized(
  roomId: string,
  tone: SceneTone,
  state: SceneState
): string {
  const scene = SCENE_DATA[roomId];
  const base = scene
    ? `${scene.displayName}: ${scene.visualDescription}`
    : `A ${tone} fantasy interior location`;

  return [
    "Cinematic fantasy environment concept art. Architectural establishing shot.",
    "Photorealistic digital painting style. High detail. Dramatic lighting.",
    "Empty interior — no people, no creatures, no figures of any kind.",
    "No text, no logos, no watermarks.",
    "",
    `Setting: ${base}`,
    `Lighting style: ${TONE_MODIFIERS[tone]}`,
    `Structural condition: ${STATE_MODIFIERS[state]}`,
    "",
    "Focus entirely on architecture, materials, light, and atmosphere.",
    "Safe for all audiences. Environmental art only.",
  ].join("\n");
}
