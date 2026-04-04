// Warsaw coordinates
const WARSAW_LAT = 52.2297;
const WARSAW_LON = 21.0122;

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "rain"
  | "heavy_rain"
  | "snow"
  | "fog";

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export interface CourtyardWeather {
  condition: WeatherCondition;
  timeOfDay: TimeOfDay;
  weatherLine: string;
}

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 18) return "day";
  if (hour >= 18 && hour < 21) return "dusk";
  return "night";
}

/**
 * Maps Open-Meteo WMO weather code to our 6 conditions.
 * https://open-meteo.com/en/docs#weathervariables
 */
function mapWeatherCode(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code <= 2) return "cloudy";
  if (code === 3) return "cloudy";
  if (code >= 45 && code <= 48) return "fog";
  if (code >= 51 && code <= 55) return "rain";
  if (code >= 56 && code <= 57) return "rain";
  if (code >= 61 && code <= 65) return "rain";
  if (code >= 66 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain";
  if (code === 95) return "heavy_rain";
  if (code >= 96 && code <= 99) return "heavy_rain";
  return "cloudy";
}

const WEATHER_LINES: Record<TimeOfDay, Record<WeatherCondition, string>> = {
  dawn: {
    clear:
      "The sky above the courtyard has just started to pale at the edges. A crow is working at something in the gap between two cobblestones, unhurried. The air smells of dew and coal smoke from somewhere across the city.",
    cloudy:
      "The dawn is grey and soft, clouds sitting low over the rooftops. No wind. The courtyard lies still, the cobblestones dark with overnight damp.",
    rain:
      "Rain falls steadily through the grey dawn light, tapping against the cobblestones in an even rhythm. The gutters along the Main Hall wall are running.",
    heavy_rain:
      "The rain is hard and cold, hammering the courtyard cobblestones and bouncing up in a thin mist. The windows of the Main Hall rattle with each gust.",
    snow:
      "Snow is falling through the pale dawn, slow and deliberate, settling on the courtyard stones and on the Church windowsills and on the crow who appears to find the whole situation unremarkable.",
    fog:
      "A heavy fog has settled over the courtyard in the night and not yet decided to leave. The Church of Perpetual Life is a white shape in the white air. The Main Hall entrance is a glow.",
  },
  day: {
    clear:
      "The courtyard is in full daylight, the cobblestones dry and pale grey under an open sky. A leaf skitters across from somewhere near the church wall and disappears under the eastern arch. Guild members cross without looking at you.",
    cloudy:
      "Flat grey light fills the courtyard, the kind that makes everything look the same distance away. The city sounds are muffled. Someone has left a bucket near the church wall and the wind is moving it slowly.",
    rain:
      "Rain falls on the courtyard in a steady curtain. The cobblestones are dark and gleaming. You can hear the rain hammering on the windows of the Main Hall to the east.",
    heavy_rain:
      "The rain comes down in sheets, driven by a wind that finds every gap in your clothing. The courtyard cobblestones are running with water. The sound of the Main Hall windows under the rain is constant and indifferent.",
    snow:
      "Snow is falling on the courtyard, covering the cobblestones in a thin uneven white. Footprints cross it in two or three directions. The city beyond is quieter than usual.",
    fog:
      "A dense fog sits over the courtyard, cutting visibility to a few yards. The outline of the Church is to the west. The glow of the Main Hall is to the east. Everything between is grey.",
  },
  dusk: {
    clear:
      "The sky above the courtyard is burning orange and violet along the western edge, behind the white tower of the Church. The first lamps are being lit in the Main Hall. A crow watches you from the church roof and says nothing.",
    cloudy:
      "Dusk comes as a darkening of the grey, not a color change. The courtyard lantern has just been lit. The cobblestones reflect it in small wet patches.",
    rain:
      "The rain at dusk is cold and steady, lit orange by the lantern above the Main Hall entrance. It hisses on the cobblestones. The Church to the west shows no light at all.",
    heavy_rain:
      "The storm at dusk is near dark already, the rain turning the courtyard into a sound — constant, heavy, surrounding. The lantern above the Main Hall swings on its hook. The light swings with it.",
    snow:
      "Snow falls through the dusk into the glow of the courtyard lantern, each flake visible for a moment before it hits the cobblestones. The Church of Perpetual Life to the west has gone grey-white in the failing light.",
    fog:
      "The fog thickens at dusk. The courtyard lantern creates a small sphere of amber light in the grey. The Church is invisible. The Main Hall is a warm shape in the murk.",
  },
  night: {
    clear:
      "The courtyard is lit only by the lantern over the Main Hall entrance and a hard scatter of stars above. The cobblestones are cold underfoot. The Church of Perpetual Life to the west is a white shape in the darkness, its windows faintly luminous for no obvious reason.",
    cloudy:
      "A cloudy night in the courtyard, the lantern above the eastern entrance pushing a small circle of orange light into the dark. Beyond it: nothing much. The Church is a pale shape. The wind moves through without stopping.",
    rain:
      "Rain at night in the courtyard. The lantern above the Main Hall sputters in the wind. The cobblestones are black and running. The sound of the rain on the Church's roof comes down to you faintly from the dark.",
    heavy_rain:
      "The storm is at its worst in the dark. Rain hammers the courtyard with no interest in you specifically but with impressive thoroughness. The Main Hall lantern is barely visible through the water. The Church windows give off their faint light as if nothing is happening.",
    snow:
      "Snow falls through the dark and into the lantern light, slow and strange. The courtyard cobblestones are white now. The Church is whiter. The city beyond the walls has gone completely quiet.",
    fog:
      "The fog at night swallows everything. The lantern is a smear of orange. The Church of Perpetual Life is gone. The Main Hall is gone. You are alone in a very small circle of visible world.",
  },
};

export async function getCourtyardWeather(): Promise<CourtyardWeather> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${WARSAW_LAT}` +
      `&longitude=${WARSAW_LON}&current=weather_code` +
      `&timezone=Europe%2FWarsaw`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather fetch failed");

    const data = (await res.json()) as {
      current: { weather_code: number; time: string };
    };

    const code = data.current.weather_code;
    const condition = mapWeatherCode(code);

    // CET/CEST hour from server time
    const now = new Date();
    const cetHour = new Date(
      now.toLocaleString("en-US", { timeZone: "Europe/Warsaw" })
    ).getHours();
    const timeOfDay = getTimeOfDay(cetHour);

    const weatherLine = WEATHER_LINES[timeOfDay][condition];

    return { condition, timeOfDay, weatherLine };
  } catch {
    // Fallback if API is unreachable
    const now = new Date();
    const hour = new Date(
      now.toLocaleString("en-US", { timeZone: "Europe/Warsaw" })
    ).getHours();
    const timeOfDay = getTimeOfDay(hour);
    return {
      condition: "cloudy",
      timeOfDay,
      weatherLine:
        "The courtyard is quiet. The sky above it is undecided.",
    };
  }
}
