// ============================================================
// Sprint G2 — time-of-day atmospheric descriptions
//
// Called by buildRoomDescription() in gameEngine.ts.
// Returns a short Howard-canon atmospheric sentence appended to
// the room description. Returns null for "indoor" rooms.
//
// Pool selection rotates by worldTurn so it varies across sessions
// without needing random state.
// ============================================================

import type { RoomTimeOfDay, SceneTone } from "../roomTypes";

type Pool = readonly string[];

type TimeOfDayMap = {
  indoor: Pool;
  day: Partial<Record<SceneTone, Pool>>;
  night: Partial<Record<SceneTone, Pool>>;
  dawn: Partial<Record<SceneTone, Pool>>;
  dusk: Partial<Record<SceneTone, Pool>>;
};

const DESCRIPTIONS: TimeOfDayMap = {
  indoor: [],

  day: {
    pastoral: [
      "The sun rides high, burning off the last of the morning dew.",
      "Midday light flattens the shadows to nothing; the heat presses down.",
      "A pale sun hangs overhead, the air still and bright.",
    ],
    civilized: [
      "The market clamor rises through the streets; the city is fully awake.",
      "Afternoon light slants hard across the cobblestones.",
      "Dust hangs in the still air; the day is at its height.",
    ],
    aquilonian: [
      "Afternoon light slants across pale stone, throwing long shadows through the colonnade.",
      "The sun is high and unsparing; the marble gleams white where it falls.",
      "Warm afternoon sun fills the courtyard, the shadows gathered close beneath the eaves.",
    ],
    grimdark: [
      "Harsh daylight exposes every crack and stain in the ancient stone.",
      "The sun finds no purchase here; what light enters only sharpens the ruin.",
      "Daylight makes the place no less grim — only more honest about it.",
    ],
  },

  night: {
    pastoral: [
      "The stars are thick overhead; insects sing in the dark beyond the path.",
      "Moonlight silvers the grass and sets every shadow moving.",
      "The night is deep out here — nothing human between you and the dark.",
    ],
    civilized: [
      "Torchlight bleeds from a few upper windows; the streets below are empty.",
      "The city keeps its own watch; the sound of boots on stone drifts from somewhere close.",
      "Night has cleared the streets. The few who remain out at this hour have their reasons.",
    ],
    aquilonian: [
      "Moonlight floods the courtyard; the pale stone glows cold under a high, hard sky.",
      "The torches along the colonnade have guttered low; guards move in the shadows beyond.",
      "Night has settled over the stone. The city breathes slowly, watchful.",
    ],
    grimdark: [
      "Darkness here is absolute — a weight, not merely an absence of light.",
      "Whatever lives in these stones stirs after dark. You feel it before you hear it.",
      "The night seals this place shut. Even the rats have retreated.",
    ],
  },

  dawn: {
    pastoral: [
      "A gray light is spreading low in the east; mist clings to the hollows.",
      "The birds have begun but the sun has not yet shown itself.",
      "Dawn comes slowly here — the dark thins rather than breaks.",
    ],
    civilized: [
      "Cart wheels on stone; bakers already at work. The city wakes grudgingly.",
      "Cold gray light and the smell of woodsmoke from early fires.",
      "The watch changes at dawn; you can hear the tramp of boots somewhere near.",
    ],
    aquilonian: [
      "The first color bleeds into the eastern sky — orange on pale stone, then gold.",
      "Dawn light catches the tops of the columns; the courtyard below is still in shadow.",
      "The guards on the wall are silhouettes against a brightening sky.",
    ],
    grimdark: [
      "Gray dawn changes nothing here — the ruin looks worse in the cold morning light.",
      "The light comes in thin and cheerless; it finds no comfort in these stones.",
      "Dawn. The night's work lies plain in the first flat light.",
    ],
  },

  dusk: {
    pastoral: [
      "Long shadows run across the ground as the sun goes red at the horizon.",
      "The light is dying; cattle are lowing somewhere in the distance.",
      "The air cools fast as the sun drops. The brief dusk of the open country.",
    ],
    civilized: [
      "Lamplighters are working the main streets; the side alleys fall into shadow.",
      "The last commerce of the day winding down; shutters going up, bolts thrown.",
      "Dusk in the city is the hour thieves know best. The light changes things.",
    ],
    aquilonian: [
      "The last light turns the stonework amber, then goes out. Torches are being lit.",
      "Dusk settles over the colonnades; the carved stone loses its detail in the fading light.",
      "The colors die off the high walls; a guard lights the gate-torch against the coming dark.",
    ],
    grimdark: [
      "Dusk is the hour when the shadows here stop being metaphors.",
      "The light retreats quickly from places like this. Something about how the dark waits here.",
      "Shapes that were merely unpleasant in daylight become ambiguous in the dusk.",
    ],
  },
};

/**
 * Returns a short atmospheric sentence for the given time-of-day and scene tone,
 * rotating through the pool by worldTurn. Returns null for "indoor" rooms.
 */
export function getTimeOfDayLine(
  timeOfDay: RoomTimeOfDay,
  sceneTone: SceneTone = "civilized",
  worldTurn = 0
): string | null {
  if (timeOfDay === "indoor") return null;
  const toneMap = DESCRIPTIONS[timeOfDay];
  const tonePool = toneMap[sceneTone];
  const pool: Pool = tonePool?.length ? tonePool : toneMap.civilized ?? [];
  if (!pool.length) return null;
  return pool[worldTurn % pool.length] ?? null;
}
