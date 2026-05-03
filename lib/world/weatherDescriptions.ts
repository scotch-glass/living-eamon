// ============================================================
// Sprint G3 — Eivissa weather descriptions
//
// Called by buildRoomDescription() for outdoor rooms.
// Returns a short Howard-canon atmospheric sentence appended to
// the room description. Returns null for non-outdoor rooms.
//
// Pool selection rotates by worldTurn so it varies across sessions.
// ============================================================

import type { SceneTone } from "../roomTypes";

export type WeatherKind =
  | "sunny"
  | "cloudy"
  | "overcast"
  | "rain"
  | "heavy-rain"
  | "fog"
  | "wind";

type Pool = readonly string[];

type WeatherToneMap = Partial<Record<SceneTone, Pool>>;
type WeatherDescMap = Record<WeatherKind, WeatherToneMap>;

const DESCRIPTIONS: WeatherDescMap = {
  sunny: {
    pastoral: [
      "The sun beats down without mercy; the open ground offers no shade.",
      "Clear sky from horizon to horizon — nothing overhead but hard blue and heat.",
      "Heat shimmers off the earth; the air is still and dry.",
    ],
    civilized: [
      "The sun is out and the square is busy for it.",
      "Clear weather has brought the merchants out; the street hums with commerce.",
      "A fine day — which in a city means twice the beggars and twice the noise.",
    ],
    aquilonian: [
      "The sun falls bright across pale stone; the courtyard is warm, the shadows sharp.",
      "Clear afternoon light bathes the colonnade; every carved surface stands in relief.",
      "The sky is cloudless and merciless overhead; the stone radiates warmth underfoot.",
    ],
    grimdark: [
      "Even the sun finds little worth illuminating here.",
      "The light is flat and unsparing; nowhere to hide from it or from what it shows.",
      "Clear weather only makes the ruin more legible.",
    ],
  },

  cloudy: {
    pastoral: [
      "High white clouds are moving in from the west; the light is soft and shifting.",
      "The sky is mostly cloud now, the heat of the day cut to something bearable.",
      "Patches of sun and shade chase each other across the open ground.",
    ],
    civilized: [
      "Clouds are piling up; the awnings have come out over the market stalls.",
      "The light is gray and even — good weather for neither farmers nor pickpockets.",
      "A few drops fell earlier; the sky hasn't decided what it wants to do yet.",
    ],
    aquilonian: [
      "High cloud has softened the light; the stone looks grey rather than gold.",
      "The sun is in and out; the courtyard shifts between warmth and cool shadow.",
      "Cloud moves across the sky above the colonnade, breaking the heat at intervals.",
    ],
    grimdark: [
      "The sky has gone heavy; it suits the place better than sunlight did.",
      "Clouds have rolled in — the light is worse but the atmosphere improves.",
      "The overcast suits this place. Ruin looks better in flat light.",
    ],
  },

  overcast: {
    pastoral: [
      "The sky is a single flat grey from edge to edge; rain is coming.",
      "The clouds have thickened and settled low; the air smells of it.",
      "Heavy overcast presses down on the open ground; the birds have gone quiet.",
    ],
    civilized: [
      "The sky is shut tight; the street lamps will need lighting before long.",
      "A grey lid over the city — no wind, no brightness, no warmth.",
      "The kind of overcast that turns mid-afternoon into something resembling dusk.",
    ],
    aquilonian: [
      "Flat grey light across the courtyard; the carved stonework loses all its depth.",
      "Heavy cloud has killed the shadows; the colonnade looks pale and indistinct.",
      "The sky is sealed; no sun reaches the flagstones today.",
    ],
    grimdark: [
      "The overcast has settled in. Even the sky wants nothing to do with this place.",
      "No light, no shadow, no definition — the ruin exists in its own grey medium.",
      "The cloud is low and permanent-looking. The place feels more sealed than usual.",
    ],
  },

  rain: {
    pastoral: [
      "Rain is falling steadily; the ground softens under it.",
      "A grey rain has set in — the kind that lasts all day.",
      "The rain falls straight and quiet; nothing moves that doesn't have to.",
    ],
    civilized: [
      "Rain on the cobblestones; the foot traffic has thinned to those with business.",
      "The street has emptied. Rain keeps honest people indoors.",
      "Water runs in channels along the gutter; the city sounds different in the rain.",
    ],
    aquilonian: [
      "Rain falls on the flagstones; the colonnade offers shelter but the courtyard is exposed.",
      "Steady rain has cleared the open space; only the guards remain at their posts.",
      "The carved stone is dark with rain, the carved faces streaming.",
    ],
    grimdark: [
      "Rain. Of course it is. It would be.",
      "The rain finds every crack and does its slow work on the stone.",
      "Water seeps through the ruin; the rain here sounds hollow.",
    ],
  },

  "heavy-rain": {
    pastoral: [
      "The rain is heavy and serious; the ground is already running with it.",
      "A hard rain is driving in from the west; visibility is down to nothing past the treeline.",
      "Rain hammers the earth; travel in this would be misery.",
    ],
    civilized: [
      "The rain is coming down hard; even the rats have retreated.",
      "A downpour has cleared the streets completely. Only the desperate are still out.",
      "Water sheets off the eaves and runs in rivers along the gutters.",
    ],
    aquilonian: [
      "Heavy rain hammers the flagstones; the colonnades stream with runoff.",
      "The courtyard is a running sheet of water; the guards have pulled back under cover.",
      "Rain drives hard against the stone; the drainage channels are overwhelmed.",
    ],
    grimdark: [
      "The rain is heavy enough to drown conversation — not that there was any.",
      "Hard rain on stone. The sound fills everything else out.",
      "The downpour has turned the floor slick; what was merely unpleasant is now dangerous.",
    ],
  },

  fog: {
    pastoral: [
      "Fog has settled low across the open ground; landmarks blur at fifty paces.",
      "A thick mist rolls in from somewhere; visibility collapses to arm's length.",
      "The fog is dense and still; sound carries strangely through it.",
    ],
    civilized: [
      "Fog lies heavy in the streets; the lanterns glow but do little.",
      "The city is muffled — shapes resolve out of the fog a step before you'd expect them.",
      "Fog has turned familiar streets strange; the sound of footsteps comes from everywhere.",
    ],
    aquilonian: [
      "Fog moves through the colonnade in slow drifts; the far end is invisible.",
      "A thick mist fills the courtyard; the carved figures emerge and vanish as it shifts.",
      "Fog presses in from outside the walls; the torches burn but don't reach far.",
    ],
    grimdark: [
      "The fog is welcome here — it hides what the light would show.",
      "Mist fills the space between the stones; shapes at the far end are uncertain.",
      "The fog is thick enough that you could walk into something before you saw it. Something could walk into you.",
    ],
  },

  wind: {
    pastoral: [
      "A hard wind is up; it tears at clothing and drives grit into the eyes.",
      "The wind comes in gusts; nothing in the open is stable.",
      "It's blowing hard from the east; the air smells clean and dry.",
    ],
    civilized: [
      "Wind rattles the shutters and sends papers skittering across the cobblestones.",
      "A stiff wind has come up; the market stall canvas snaps and strains.",
      "The wind cuts through the street; it carries the smell of rain that hasn't arrived yet.",
    ],
    aquilonian: [
      "Wind drives across the open courtyard with nothing to break it.",
      "A hard wind has come up; the torches gutter and the guards lean into it.",
      "The wind off the open ground is cold; even in the colonnades it finds its way through.",
    ],
    grimdark: [
      "The wind moves through this place and makes sounds in it.",
      "Cold air pushes through the gaps in the stone; the place breathes.",
      "Wind. Always wind here. It finds every opening.",
    ],
  },
};

/**
 * Returns a short atmospheric weather sentence for the given kind and scene tone,
 * rotating through the pool by worldTurn. Returns null if no pool is found.
 */
export function getWeatherLine(
  kind: WeatherKind,
  sceneTone: SceneTone = "civilized",
  worldTurn = 0
): string | null {
  const toneMap = DESCRIPTIONS[kind];
  const pool = toneMap[sceneTone] ?? toneMap.civilized;
  if (!pool?.length) return null;
  return pool[worldTurn % pool.length] ?? null;
}

/**
 * Maps an Open-Meteo WMO weather code to a WeatherKind.
 * Ref: https://open-meteo.com/en/docs#weathervariables (WMO Weather interpretation codes)
 */
export function wmoCodeToWeatherKind(
  code: number,
  windSpeedKmh = 0
): WeatherKind {
  if (code === 0 || code === 1) return windSpeedKmh >= 30 ? "wind" : "sunny";
  if (code === 2) return windSpeedKmh >= 30 ? "wind" : "cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "rain";
  if (code >= 61 && code <= 63) return "rain";
  if (code === 65 || code === 66 || code === 67) return "heavy-rain";
  if (code >= 71 && code <= 77) return "overcast"; // snow — rare in Eivissa, treat as thick overcast
  if (code === 80 || code === 81) return "rain";
  if (code === 82) return "heavy-rain";
  if (code === 85 || code === 86) return "heavy-rain";
  if (code >= 95) return "heavy-rain"; // thunderstorm
  // Fallback
  return windSpeedKmh >= 30 ? "wind" : "cloudy";
}
