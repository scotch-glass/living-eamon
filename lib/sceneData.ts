import { getRoom } from "./adventures/registry";

export type SceneTone = "pastoral" | "civilized" | "aquilonian" | "grimdark";
export type SceneState = "normal" | "damaged" | "ruined";

export const TONE_MODIFIERS: Record<SceneTone, string> = {
  pastoral:
    "Warm golden afternoon light, soft shadows, green hills visible through any opening, the feeling of absolute safety and ancient peace. Soft focus on edges.",
  civilized:
    "Torchlight and candlelight casting deep amber shadows, stone and timber architecture, the hum of human activity nearby. Weight of history in every surface.",
  aquilonian:
    "The grandeur of Aquilonia — broad marble colonnades, fluted pillars with lion-and-eagle capitals, gilt-capped towers visible above rooftops, bronze lamp brackets casting warm amber light. Afternoon sun on pale stone, long clean shadows. Fountains, iron-gated gardens, war tapestries. The wealth and power of the greatest Hyborian kingdom — Roman grandeur crossed with high medieval splendor.",
  grimdark:
    "Harsh directional torchlight leaving most of the scene in deep shadow, sulfurous undertones in the air suggested by colour, oppressive low ceilings or vast cold spaces, the feeling that something terrible has happened here or is about to.",
};

const STYLE_REFERENCE: Record<SceneTone, string> = {
  pastoral:
    "Style reference: Frank Frazetta's pastoral backgrounds, warm and golden. Ancient peace.",
  civilized:
    "Style reference: Frazetta and Brom's tavern and fortress interiors. Lived-in, warm, dangerous.",
  aquilonian:
    "Style reference: Frank Frazetta's Conan paintings — the civilized courts and marble palaces of Aquilonia. Roman-Hyborian grandeur. Warm stone, bronze, gilt, silk banners. The architecture of a warrior-kingdom at the height of its power. Cross-reference with Brom's palatial interiors.",
  grimdark:
    "Style reference: Frazetta's darkest work crossed with Brom. Every shadow hides something. Ancient stone soaked in violence and consequence.",
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
  const room = getRoom(roomId);
  if (!room?.visualDescription) {
    return [
      `Cinematic photorealistic establishing shot of a ${tone} fantasy location.`,
      "Hyborian sword-and-sorcery style. Extremely high definition, gritty, hyper-detailed.",
      "No text, no watermarks, no foreground characters.",
      `${TONE_MODIFIERS[tone]} ${STATE_MODIFIERS[state]}`,
    ];
  }
  const atmosphere = room.sceneAtmosphereOverride ?? TONE_MODIFIERS[tone];
  return [
    "Cinematic photorealistic establishing shot. Hyborian sword-and-sorcery fantasy art style.",
    "Extremely high definition, hyper-detailed surface textures.",
    "Natural subsurface scattering. Film grain. Dramatic directional lighting. Deep shadow and highlight contrast.",
    "No text. No watermarks. No foreground characters — scene-setting background illustration, like a chapter illustration in a novel.",
    "",
    `Location: ${room.name}`,
    `Visual: ${room.visualDescription}`,
    `Atmosphere: ${atmosphere}`,
    `Condition: ${STATE_MODIFIERS[state]}`,
    "",
    STYLE_REFERENCE[tone] ?? STYLE_REFERENCE.civilized,
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
export function buildScenePromptSanitized(
  roomId: string,
  tone: SceneTone,
  state: SceneState
): string {
  const room = getRoom(roomId);
  const base = room?.visualDescription
    ? `${room.name}: ${room.visualDescription}`
    : `A ${tone} fantasy interior location`;
  const atmosphere = room?.sceneAtmosphereOverride ?? TONE_MODIFIERS[tone];

  return [
    "Cinematic fantasy environment concept art. Architectural establishing shot.",
    "Photorealistic digital painting style. High detail. Dramatic lighting.",
    "Empty interior — no people, no creatures, no figures of any kind.",
    "No text, no logos, no watermarks.",
    "",
    `Setting: ${base}`,
    `Lighting style: ${atmosphere}`,
    `Structural condition: ${STATE_MODIFIERS[state]}`,
    "",
    "Focus entirely on architecture, materials, light, and atmosphere.",
    "Safe for all audiences. Environmental art only.",
  ].join("\n");
}
