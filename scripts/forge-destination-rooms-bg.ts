// ========================================================================
// LIVING EAMON — Destination room background scenes (Session 001)
//
// Forges 25 painterly background scene graphics for destination stub rooms.
// Each scene establishes the exotic character of the location: geography,
// climate, culture, atmosphere. Scenes are landscape JPEG (no rembg).
//
// Categories:
//   - Cities (5): Vanara, Kamula, Talunia, Blaal, Stagus
//   - Landmarks (5): Skull of Silence, Lake of Visions, Accursed Gardens,
//     Forbidden Lake, Tiger Valley
//   - Nations (7): Atlantis, Thule, Commoria, Lemuria, Farsun, Thurania, Kamelia
//   - Wilderness (8): Lost Lands, Camoonian Desert, Jungles, World's End,
//     Red Isles, Mu, Tathel Isle, Zalgara Mountains
//
// Output:
//   public/art/scenes/{room_node_id}/bg-v{N}.jpg
//
// Usage:
//   npx tsx scripts/forge-destination-rooms-bg.ts                 # 2 each (50 total)
//   npx tsx scripts/forge-destination-rooms-bg.ts --count=3       # 3 each (75 total)
//   npx tsx scripts/forge-destination-rooms-bg.ts --only=city_vanara --count=4
//
// Cost: ~$0.07 per image. 25 rooms × 2 candidates = 50 calls ≈ $3.50.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { grokImageToJpeg } from "../lib/imageProcessing";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function readEnv(key: string): string | null {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return null;
  return line.slice(`${key}=`.length).trim().replace(/^["']|["']$/g, "");
}

const XAI_KEY = readEnv("XAI_API_KEY") ?? readEnv("GROK_API_KEY");
if (!XAI_KEY) {
  console.error("ERROR: neither XAI_API_KEY nor GROK_API_KEY in .env.local");
  process.exit(1);
}
const grok = new OpenAI({ apiKey: XAI_KEY, baseURL: "https://api.x.ai/v1" });

const args = process.argv.slice(2);
const countArg = args.find((a) => a.startsWith("--count="));
const onlyArg = args.find((a) => a.startsWith("--only="));
const candidateCount = countArg ? parseInt(countArg.slice("--count=".length), 10) : 2;
if (!Number.isFinite(candidateCount) || candidateCount < 1 || candidateCount > 16) {
  console.error("ERROR: --count must be between 1 and 16");
  process.exit(1);
}

// ── Style anchor (shared across all scenes) ──────────────────────────

const STYLE_ANCHOR = [
  "Full-scene OIL PAINTING in the classic 1970s-1980s sword-and-sorcery",
  "cover style of Frank Frazetta and Gerald Brom — visible painterly",
  "brushwork, warm romantic lighting, rich saturated colors, soft modeling",
  "of form, painted edges (NOT crisp lines). The medium is OIL PAINT ON",
  "CANVAS — visible brush texture. NOT a photograph, NOT photoreal, NOT a",
  "3D render, NOT CGI, NOT cartoon, NOT cel-shaded, NOT anime, NOT manga,",
  "NOT comic-book line-art, NOT vector art.",
].join(" ");

// Framing for landscape background scenes (16:9 aspect ratio, hero-scale reference)
const SCENE_FRAMING = [
  "Horizontal landscape composition, 16:9 aspect ratio (1600×900 pixels or",
  "equivalent proportions). The scene fills the entire frame edge-to-edge",
  "with no borders or text. Atmospheric depth: foreground (ground level),",
  "mid-ground (middle distance), and background (sky/horizon) all visible.",
  "NO human figures in the frame — the location is empty of people, ready",
  "for the player to enter. The scene should feel INHABITED (signs of life,",
  "culture, recent activity) but CURRENTLY UNOCCUPIED.",
].join(" ");

// ── Per-room prompts ────────────────────────────────────────────────

interface RoomSceneSpec {
  id: string;
  nodeId: string;
  name: string;
  description: string;
}

const DESTINATION_ROOMS: RoomSceneSpec[] = [
  // ════════════════════════════════════════════════════════════════
  // CITIES (5)
  // ════════════════════════════════════════════════════════════════

  {
    id: "city_vanara",
    nodeId: "city_vanara",
    name: "Vanara — Western Gate",
    description: [
      "A TRADE GATE in the foothills, where mountain passes descend into",
      "civilized Valusia. The scene is a wide stone courtyard flanked by",
      "weathered gate-towers carved from pale grey limestone. Silk bolts and",
      "wooden crates are stacked in the foreground, dusted with cardamom and",
      "spice-powder. Zarfhaani merchant tents (striped indigo-and-rust canvas)",
      "cluster in the mid-ground. Beyond them, the marble customs house with",
      "its distinctive arched colonnades. In the distance, the mountain pass",
      "glimmers gold in afternoon light, and thin blue peaks rise into a clear",
      "sky. The light is warm and golden, casting long shadows. The air smells",
      "of spice, leather, and distant altitude. No people visible, but signs of",
      "recent commerce everywhere: scattered rope, spilled peppercorns, fresh",
      "horse-tracks in dust.",
    ].join(" "),
  },

  {
    id: "city_kamula",
    nodeId: "city_kamula",
    name: "Kamula — Road's End",
    description: [
      "A TRANSITIONAL TOWN at the edge of mapped lands. The square is",
      "shadowy, half-lit by afternoon sun filtering through makeshift canvas",
      "tents. Weathered stone buildings in the background are missing windows",
      "or doors — abandoned or long-inhabited. In the foreground, a wooden",
      "map-board pinned with torn parchments and strange symbols. Refugee",
      "bundles and travel-worn packs are scattered about. The ground is",
      "churned mud, dark and damp. A few twisted trees struggle to grow in",
      "poor soil. The sky is grey despite the visible sun — as if sorrow has",
      "dimmed the light itself. No living people, but signs of habitation:",
      "a cold fire-ring, a child's wooden toy left behind, cloth scraps",
      "fluttering from a tent-pole.",
    ].join(" "),
  },

  {
    id: "city_talunia",
    nodeId: "city_talunia",
    name: "Talunia — Iron Quay",
    description: [
      "A HARSH INDUSTRIAL PORT at the desert-sea confluence. The scene is",
      "dominated by a deep-water quay lined with stacked iron ingots, their",
      "surfaces rust-streaked and dull. A massive stone warehouse with smoke",
      "rising from furnace vents in the distance. The water beyond is deep",
      "olive-green, churning slowly against weathered dock pylons encrusted",
      "with salt. In the mid-ground, coils of rope, coral-encrusted anchors,",
      "and broken cart wheels lie scattered. The sky is a pale, heat-hazed",
      "blue-white, and the sun casts sharp, brutal shadows. The light is",
      "merciless — every surface is either glaring bright or deep shadow, no",
      "soft gradation. The ground is stained black with oil and rust dust.",
      "No people, but the place reads as actively *working* — recent metal-",
      "dust in the air, fresh soot on the warehouse, warm stone.",
    ].join(" "),
  },

  {
    id: "city_blaal",
    nodeId: "city_blaal",
    name: "Blaal — River Ferry Landing",
    description: [
      "A MUDDY RIVER CROSSING at dusk or dawn (twilit, filtered green light).",
      "The scene is dominated by a broad brown river churning past wooden",
      "docks in the foreground. The ferry — a flat-bottomed barge with a large",
      "steering wheel — is moored to massive rope-coils on the dock. The water",
      "reflects the dim sky, slightly silvery, slightly ominous. Dense,",
      "tangled vegetation banks the far shore — willows with drooping branches,",
      "dense reeds, undergrowth that obscures what lies beyond. The light is",
      "greenish and damp, filtering through constant mist rising from the",
      "water. The foreground dock is weathered wood, stained dark by years of",
      "moisture and mud. Scattered along the dock: barrels of pitch, coils of",
      "hemp rope, a worn wooden bucket. The sky is grey-green, twilit. No",
      "people visible, but the place feels *watched* — as if the river itself",
      "is aware of trespass.",
    ].join(" "),
  },

  {
    id: "city_stagus",
    nodeId: "city_stagus",
    name: "Stagus — River Gate",
    description: [
      "A HUMID RIVER STATION at the jungle's edge. The scene transitions from",
      "civilization to wilderness. In the foreground, a modest wooden dock and",
      "a few simple buildings (storage sheds, a customs house with a slate",
      "roof). The dock is stacked with machetes, bundles of jungle herbs tied",
      "in wicker, and rattan packs treated with wax. The river beyond is",
      "narrower here, darker, flowing swiftly eastward. Across the water, the",
      "jungle wall rises — an impenetrable mass of green so dense it looks",
      "almost like a solid wall of foliage. Massive trees with enormous leaves,",
      "vines thicker than rope, undergrowth that glows sickly-bright in the",
      "filtered light. The air is visibly humid — wisps of mist hang near the",
      "water. The light is greenish, dim, twilit even in midday, filtered",
      "through the jungle canopy. Exotic bird-calls are visible in the implied",
      "sound. The ground is packed earth, slightly damp. No people, but signs",
      "of recent expedition prep: open crates, discarded cloth, a sharpening",
      "stone.",
    ].join(" "),
  },

  // ════════════════════════════════════════════════════════════════
  // LANDMARKS (5)
  // ════════════════════════════════════════════════════════════════

  {
    id: "poi_skull_of_silence",
    nodeId: "poi_skull_of_silence",
    name: "Skull of Silence — Mountain Pass",
    description: [
      "A HIGH MOUNTAIN PASS where wind has carved stone monoliths into",
      "skull-like formations. The scene is dominated by weathered granite peaks",
      "rising into the frame, their surfaces marked with ancient carvings too",
      "worn to read clearly. Snow patches cling to north-facing slopes despite",
      "the warm season. The air is thin, the light brittle-clear and cold. In",
      "the foreground, a narrow flagstone trail winds between boulders the size",
      "of houses. Stone shrines (small cairns, prayer-flags now faded to grey)",
      "mark the path. The sky is deep blue, almost purple, with no clouds. The",
      "wind is visible in the way vegetation bends — stunted alpine grasses,",
      "twisted dwarf pines. In the mid-distance, a narrow passage between two",
      "massive stone faces narrows toward an unseen far side. The light is",
      "harsh and directional, casting long shadows from the boulders. The",
      "overall mood is one of isolation and age — this place has been crossed",
      "for millennia, but rarely with comfort. No people, but stone markers of",
      "pilgrims past: carved names, offerings left at cairns, a weathered",
      "walking-staff abandoned in a crevice.",
    ].join(" "),
  },

  {
    id: "poi_lake_of_visions",
    nodeId: "poi_lake_of_visions",
    name: "Lake of Visions — Shore",
    description: [
      "A SACRED LAKE shrouded in perpetual mist. The scene is twilit and",
      "surreal — a wide body of still, mirror-black water reflecting a sky so",
      "dim it is impossible to tell if it is dawn, dusk, or midday. Mist rises",
      "from the water's surface in visible wisps, swirling gently. The far",
      "shore is barely visible through the haze — dark shapes of ancient ruins",
      "or temple structures emerging from mist. In the foreground, a rocky",
      "shore covered with smooth, worn stones of strange colors (amethyst-",
      "purple, jade-green, pale moonstone). A stone platform extends into the",
      "water — perhaps an ancient altar or meditation place, weathered smooth",
      "by centuries. The light is sourceless and ethereal, as if coming from",
      "the mist itself. Colors are muted: pale greys, slate-blues, silvery-",
      "whites, with touches of lavender and seafoam-green in the mist. The",
      "overall feeling is dreamlike and slightly wrongly-real, as if the scene",
      "exists in waking sleep. No people, but signs of ritual: offerings of",
      "fruit and flowers left on the altar (wilted and strange), circles drawn",
      "in stone dust, footprints appearing and fading in the mist.",
    ].join(" "),
  },

  {
    id: "poi_accursed_gardens",
    nodeId: "poi_accursed_gardens",
    name: "Accursed Gardens — Entrance",
    description: [
      "OVERGROWN RUINS RECLAIMED by twisted vegetation. The scene is one of",
      "decay and unnatural growth. In the foreground, crumbling marble",
      "statuary — headless figures, broken columns, carved friezes so worn they",
      "are almost abstractions. Vines the thickness of rope climb the ruins,",
      "and strange plants with enormous leaves (some as large as shields) grow",
      "from impossible places: roots piercing solid stone, flowers blooming from",
      "skull-cavities of toppled statues. The plants have a sickly quality —",
      "colors that don't exist in nature: diseased-purple leaves, sap that",
      "glows faintly phosphorescent in shadows. The air is still — no wind, no",
      "bird-song, no insect-drone, just an unnatural silence. The light is",
      "amber-gold, filtered through the leaf-canopy, creating a perpetual",
      "late-afternoon atmosphere. The ground is deep moss and fallen leaves,",
      "hiding what lies beneath (unsettling). In the mid-distance, more ruins",
      "disappear into the creeping vegetation. The overall feeling is of a",
      "place that *wants* to stay hidden, where nature has turned hostile.",
      "No people, but signs of recent intrusion: discarded tools, burnt cloth,",
      "a journal half-buried in moss (pages illegible).",
    ].join(" "),
  },

  {
    id: "poi_forbidden_lake",
    nodeId: "poi_forbidden_lake",
    name: "Forbidden Lake — Shore",
    description: [
      "A STILL, FORBIDDEN BODY OF WATER that should not be approached. The",
      "scene is eerie and oppressive. A wide lake of absolutely still,",
      "mirror-black water — not a ripple, not a wave, the surface looking less",
      "like water and more like a dark mirror of obsidian. The shore is grey",
      "volcanic sand, devoid of the usual beach detritus (no shells, no",
      "seaweed, no driftwood). The far shore is visible but distant, just a",
      "dark line against a sky the color of old brass. The sky is wrong —",
      "lightless, airless, as if the sun has gone behind clouds but the clouds",
      "are invisible. There is NO BIRD-LIFE: no calls, no flight, no presence.",
      "The air feels thick and still, pressing down. The light is dim and",
      "sourceless. The water reflects nothing clearly — the reflection of the",
      "sky should be visible, but instead the water absorbs light. In the",
      "foreground, bleached white stones lie scattered (old bone-white, ancient",
      "appearance). Dead wood — skeletal trees that died long ago — stand at",
      "the water's edge, leafless and twisted. The overall feeling is of a",
      "place that is *wrong*, where the natural rules have been suspended or",
      "perverted. No people, no signs of recent activity. Even the air tastes",
      "wrong — dry, metallic, like tasting blood on the tongue.",
    ].join(" "),
  },

  {
    id: "poi_tiger_valley",
    nodeId: "poi_tiger_valley",
    name: "Tiger Valley — Atlantean Entrance",
    description: [
      "CYCLOPEAN RUINS OF ANCIENT ATLANTIS, partially reclaimed by jungle.",
      "The scene is one of fallen grandeur and primal reclamation. Enormous",
      "stone blocks (each the size of a house) lie scattered at impossible",
      "angles, some carved with incomprehensible symbols. The stones are",
      "weathered and cracked, their surfaces covered in lichen and fungus.",
      "Massive carved heads — portraits of forgotten Atlantean leaders or gods",
      "— peer from the overgrown vegetation, their expressions serene and",
      "incomprehensible. Jungle growth has wound through the architecture:",
      "roots the thickness of rope pierce blocks, vines drape like burial",
      "cloths, enormous trees grow from within the ruins. The light is",
      "filtered through jungle canopy, creating an eternal twilight. The air",
      "feels thick and humid. In the mid-distance, more architecture rises —",
      "perhaps a pyramid or stepped temple, its peak lost in the canopy. The",
      "colors are rich: terracotta stone, deep greens, mossy blacks, touches of",
      "gold where mineral deposits catch the light. The overall feeling is of",
      "visiting a graveyard of gods — impressive, ancient, utterly foreign to",
      "human timescales. No people, but signs of scholars: discarded sketches,",
      "measuring tools, a leather journal dropped and weather-sealed.",
    ].join(" "),
  },

  // ════════════════════════════════════════════════════════════════
  // NATIONS (7)
  // ════════════════════════════════════════════════════════════════

  {
    id: "nation_atlantis",
    nodeId: "nation_atlantis",
    name: "Atlantis — Blue Shore",
    description: [
      "ATLANTIS AT THE HEIGHT OF THE THURIAN AGE — a thriving merchant-",
      "metropolis built by a people who command the seas. The scene captures a",
      "magnificent harbor city where Phoenician-inspired maritime genius meets",
      "ancient power granted by the Elder Races themselves. In the foreground, a",
      "HARBOR THAT RULES THE WORLD: not crude docks but POLISHED STONE QUAYS",
      "carved with mathematical precision. Anchored: dozens of trading vessels of",
      "breathtaking design — sleek hulls of dark polished wood, sails of fine",
      "linen in THE FAMED TYRIAN PURPLE (a color so rich it seems to drink light),",
      "rigging of bronze and something stranger (materials from Elder-Races",
      "crafting?). The water is brilliant blue-green, alive with merchant activity",
      "— small boats ferrying cargo, dockhands moving with purpose, the sense of a",
      "civilization built on TRADE and KNOWLEDGE. Rising from the harbor: TERRACES",
      "of white marble rising tier by tier, buildings of sophisticated design (not",
      "cramped, not medieval, but elegant and purposeful). TOWERS pierce the sky",
      "— some are lighthouses guiding ships, others temple-towers or library-towers",
      "carved with SCRIPT and RUNES. The Atlantean ALPHABET is everywhere: carved",
      "into stone in graceful angular characters (the gift of the Elder Races,",
      "reward for standing with them against the Lizard Men in ages past), painted",
      "on merchant-house walls, inscribed on public monuments. GARDENS and WATER-",
      "FEATURES flow through the city — but these are FUNCTIONAL as well as",
      "beautiful, supporting the enormous population. The air itself carries the",
      "SMELL of the sea, of trade (spices, dyes, exotic woods), of incense from",
      "temples. The light is brilliant Mediterranean sun, catching on purple sails",
      "and white stone. The colors: brilliant whites and pale creams of marble,",
      "RICH TYRIAN PURPLES of the sails (Atlantean purple dye is legendary), deep",
      "blues of the sea, bronze-gold of architectural details, the angular black",
      "lines of the sacred RUNES. The atmosphere is one of MARITIME DOMINANCE and",
      "INTELLECTUAL ACHIEVEMENT — this is a civilization that COMMANDS trade routes",
      "and preserves the OLDEST ALPHABET, keeper of knowledge granted by the Elder",
      "Races themselves. The city BUSTLES with activity: ships loading and",
      "unloading, merchants negotiating, scribes recording transactions in the",
      "sacred runes, the sense of a culture at the height of its power.",
    ].join(" "),
  },

  {
    id: "nation_thule",
    nodeId: "nation_thule",
    name: "Thule — Capital Region",
    description: [
      "A COLD NORTHERN KINGDOM of mountains and ancient forests. The scene is",
      "dominated by dramatic, snow-capped peaks rising into a pale, cold sky.",
      "In the foreground, a wide river valley with coniferous forest — massive",
      "spruce and pine trees with dark needles. The ground is covered in",
      "evergreen growth and patches of snow (even in warm season, high-",
      "altitude snow persists). The light is pale and cold, the sun hanging at",
      "a low angle (even at midday, as if at high northern latitude). The",
      "colors are cool: pale greys, dark greens, pale blues, touches of violet",
      "in the distant mountains, white snow glowing almost blue in shadow. The",
      "air feels thin and cold. In the mid-distance, a modest wooden settlement",
      "(longhouses, smoke from cooking fires) sits nestled in the valley. In",
      "the far distance, a fortress or royal hall perched on a high peak. The",
      "overall mood is one of harsh beauty, a place where survival requires",
      "strength and endurance. The wind is implied in the way trees bow and",
      "snow-drifts form. No people in the foreground, but signs of habitation:",
      "a hunting-stand on a ridge, a cleared path through the forest, smoke",
      "rising from distant hearths.",
    ].join(" "),
  },

  {
    id: "nation_commoria",
    nodeId: "nation_commoria",
    name: "Commoria — Citadel Region",
    description: [
      "A MOUNTAIN FORTRESS KINGDOM carved from living rock. The scene is",
      "dominated by a massive fortress or citadel rising from a mountain peak,",
      "its walls appearing to be carved *from* the mountain itself rather than",
      "built *upon* it. Soaring stone walls, narrow windows cut into the rock,",
      "massive gates of blackened iron. The mountain is steep and severe, with",
      "switchback roads carved into the stone face. In the foreground, a",
      "mountain valley with distant grassland. The ground is bare stone and",
      "sparse grass — the high altitude keeps vegetation sparse. The light is",
      "brilliant and cold, the sun casting sharp shadows. The colors are cool:",
      "greys of exposed stone, pale greens of hardy grasses, dark iron of",
      "fortress gates and portcullises, touches of dark blue in deep shadows.",
      "The air feels thin and cold despite whatever season. In the mid-",
      "distance, the fortress dominates the skyline. Banners or flags may be",
      "visible on the walls (colors indistinct from distance). The overall",
      "feeling is one of impregnability and severity — this is a fortress built",
      "by people who expect siege and intend never to fall. No people visible,",
      "but the fortress itself implies constant vigilance: watch-fires lit",
      "periodically, armor visible on the walls, the fortress *alive* with",
      "readiness.",
    ].join(" "),
  },

  {
    id: "nation_lemuria",
    nodeId: "nation_lemuria",
    name: "Lemuria — Coastal Port",
    description: [
      "A DISTANT SEAPORT on the far eastern coast. The scene is a harbor full",
      "of exotic vessels. A busy port with multiple sailing ships (merchant",
      "ships, naval vessels, foreign traders) anchored or being loaded. The",
      "water is a deep rich blue-green, and wooden docks line the shore,",
      "weathered and stained with salt and tar. In the foreground, coils of",
      "rope as thick as a man's arm, wooden crates stenciled with foreign",
      "markings, barrels of supplies. The shore is paved with ancient stone,",
      "worn smooth by centuries of foot-traffic. Warehouses and trade-houses",
      "line the harbor — architecture styles slightly foreign to Valusia",
      "(different rooflines, different decorative elements). The light is warm",
      "and golden, the atmosphere rich with salt-smell and exotic spices. The",
      "sky is a pale blue, touched with sea-haze. Seabirds circle overhead.",
      "The colors are rich and saturated: deep blue water, warm stone,",
      "weathered wood the color of old leather, bright fabrics from foreign",
      "merchants' stalls, exotic plants in terracotta pots. The overall feeling",
      "is of cosmopolitan sophistication and international commerce. No people",
      "in immediate foreground, but the port bustles with implied activity:",
      "fresh salt-water stains on the dock, recently-unloaded cargo, the",
      "smell of human activity and exotic trade goods.",
    ].join(" "),
  },

  {
    id: "nation_farsun",
    nodeId: "nation_farsun",
    name: "Farsun — Caravan Road",
    description: [
      "A SOUTHERN DESERT CARAVAN ROUTE under intense heat and sunlight. The",
      "scene is dominated by an open plain of pale sand and scrub vegetation,",
      "stretching toward a heat-hazed horizon. In the foreground, a well-worn",
      "caravan road (visible as a darker path through the sand from centuries",
      "of traffic). Scattered along the road: camel bones (bleached white),",
      "broken cartwheel, a weathered merchant's marker (carved stone waypoint).",
      "A lone acacia tree provides sparse shade in the mid-distance. The sky is",
      "a pale, washed-out blue-white, the sun brutal and high. The light is",
      "merciless, creating sharp shadows and glaring highlights. Heat-shimmer",
      "distorts the distant horizon. The colors are muted by heat and light:",
      "pale sandy yellows, dull greens of sparse vegetation, the deep tan of",
      "weathered leather and rope. The air feels thick and still, the heat",
      "almost visible. In the far distance, perhaps a small settlement or",
      "caravanserai visible as a shimmer on the horizon. The overall feeling is",
      "one of emptiness and harsh endurance — this is a place where the land",
      "tries to kill you, and only the strong or the desperate pass through.",
      "No people visible, but the landscape bears marks of constant traffic:",
      "worn stones, broken equipment, the road itself a scar on the land.",
    ].join(" "),
  },

  {
    id: "nation_thurania",
    nodeId: "nation_thurania",
    name: "Thurania — Stone Road",
    description: [
      "A HIGHLAND KINGDOM of ancient stone roads and wind-scoured hills. The",
      "scene captures rolling highlands with sparse grass and exposed stone. In",
      "the foreground, an ancient paved road (Roman-style, fitted stones worn",
      "smooth by centuries) cuts across the landscape. The stone is pale grey,",
      "weathered to a soft finish. On either side of the road, sparse grass and",
      "hardy shrubs — vegetation struggling to grow in poor soil. The ground is",
      "mostly bare stone, with thin soil in crevices. In the mid-distance,",
      "rolling hills rise and fall. The sky is often cloudy or wind-torn (even",
      "on a clear day, clouds scud quickly across). The light is cool and",
      "diffuse, often with dramatic breaks of sunlight cutting through clouds.",
      "The colors are cool and muted: pale stone, dusty greens, grey skies,",
      "touches of warm light in sunbreaks. The wind is implied in the way",
      "grass bends and clouds move. Scattered along the road: ancient carved",
      "markers, standing stones (perhaps remnants of older civilization), cairns",
      "of offerings. The overall feeling is one of timelessness and endurance",
      "— this landscape has witnessed millennia of travelers. No people visible,",
      "but the road itself is the sign of humanity: an ancient artifact of",
      "purposeful construction, maintained through sheer stubbornness against",
      "the land's indifference.",
    ].join(" "),
  },

  {
    id: "nation_kamelia",
    nodeId: "nation_kamelia",
    name: "Kamelia — Northern Gate",
    description: [
      "A NORTHERN FOOTHILLS GATEWAY where mountains meet temperate forest. The",
      "scene is a transitional landscape: in the foreground, a mountain valley",
      "with a clear stream running over smooth stones, bordered by forest. The",
      "forest is mixed deciduous-and-conifer, with trees of mature size,",
      "creating a canopy with gaps showing blue sky. The stream is bright with",
      "meltwater from high peaks (visible in the distance). The ground is moss",
      "and humus, soft underfoot. The light is cool but golden, filtering",
      "through the forest canopy. The air is fresh and slightly cool,",
      "especially near the stream. The colors are rich: dark greens of forest,",
      "pale gold of moss, blue of stream and sky, grey of stone, touches of",
      "warmer tones in fallen leaves (autumn colors, though season may vary).",
      "In the mid-distance, mountains rise — still visible, but receding. There",
      "is a sense of sanctuary here: the forest shields from the wind, the",
      "stream provides water, the altitude is moderate and hospitable. Scattered",
      "about: ancient standing stones (perhaps older than the current forest),",
      "a very old shrine carved into a rock face, a maintained trail suggesting",
      "regular passage. The overall feeling is one of ancient peace and refuge.",
      "No people visible, but the place feels *used* — traversed for millennia,",
      "respected and preserved by those who pass through.",
    ].join(" "),
  },

  // ════════════════════════════════════════════════════════════════
  // WILDERNESS (8)
  // ════════════════════════════════════════════════════════════════

  {
    id: "geo_lost_lands",
    nodeId: "geo_lost_lands",
    name: "Lost Lands — Southern Fringe",
    description: [
      "ANCIENT RUINS SLOWLY BEING CONSUMED BY TIME AND EARTH. The scene is one",
      "of archaeological fascination and slow decay. Crumbling stone structures",
      "(temples? fortifications? purpose unclear) rise from overgrown terrain.",
      "The ruins are extensive but fragmentary — broken walls, toppled columns,",
      "carved blocks scattered without apparent order. Vines climb the ruins,",
      "and stone surfaces are covered in lichen and moss. The ground is hidden",
      "beneath layers of earth, fallen leaves, and vegetation. In the foreground,",
      "a cleared area where excavation has begun — displaced earth, exposed",
      "foundations, the marks of scholar-explorers. The light is amber-gold,",
      "filtered through the jungle-like vegetation that has grown over",
      "everything. The colors are earth-tones: rust, ochre, deep greens,",
      "blacks of deep shadow, pale gold of lichen, touches of warm orange where",
      "clay is exposed. The air feels old and heavy, thick with the weight of",
      "millennia. There is no bird-song (unusual), suggesting something*wrong*",
      "with the place. Scattered about: fragments of carved tablets (script",
      "unintelligible), broken statuary (faces worn beyond recognition), the",
      "detritus of a civilization that has been dead for so long no one",
      "remembers its name. The overall feeling is one of profound age and",
      "mystery. No people visible, but the site implies recent scholarly",
      "interest: notebooks, measuring tools, a campfire (cold but recent).",
    ].join(" "),
  },

  {
    id: "geo_camoonian_desert",
    nodeId: "geo_camoonian_desert",
    name: "Camoonian Desert — Sand Road",
    description: [
      "AN ENDLESS DESERT OF PALE SAND beneath a pitiless sky. The scene is one",
      "of emptiness and scale. A vast expanse of sand extends in all directions",
      "toward a heat-hazed horizon that seems impossibly distant. In the",
      "foreground, rippled sand dunes with minimal vegetation (sparse tufts of",
      "hardy grass, dead shrubs). A caravan road (barely visible, a slightly",
      "darker line of packed sand) cuts across the dunes. The sky is pale",
      "blue-white, bleached by heat and light. The sun casts sharp, brutal",
      "shadows. Heat-shimmer distorts the distance. The colors are limited:",
      "pale golds and yellows of sand, pale blue of sky, shadows in deep indigo",
      "or purple. The air is perfectly still (no wind, no cloud-movement). The",
      "light is merciless, teaching the landscape only harsh clarity. In the",
      "mid-distance, perhaps a distant oasis (shimmering mirage-like) or a rock",
      "outcropping. There is nothing soft about this place — it wants you dead.",
      "Scattered along the caravan path: bleached bones (camel? traveler?),",
      "broken water-jars, a faded merchant's tent fabric, grave-markers made of",
      "stone. The overall feeling is one of absolute hostility and immensity —",
      "the desert is vast enough that a human life is meaningless in its scale.",
      "No people visible, just the monuments to those who tried to cross.",
    ].join(" "),
  },

  {
    id: "geo_jungles",
    nodeId: "geo_jungles",
    name: "Thurian Jungle — Trail's End",
    description: [
      "AN IMPENETRABLE JUNGLE SO DENSE IT APPROACHES BEING A WALL. The scene is",
      "dominated by vertical mass: massive trees of impossible height, vines as",
      "thick as rope, understory so dense individual plants cannot be",
      "distinguished. The light is dim, filtered through layer upon layer of",
      "canopy, creating an eternal twilight with touches of strange greens and",
      "golds where isolated sunbreaks penetrate. In the foreground, a trail cuts",
      "through the jungle — barely cleared, already trying to reclaim itself,",
      "with fallen vegetation and creeping vines ready to strangle any who",
      "neglect it. The ground is hidden beneath meters of leaf-litter and moss.",
      "The air is visible — humidity so high it feels like breathing water. The",
      "colors are overwhelming in saturation: deep jungle greens (emerald,",
      "forest, olive), touches of deep reds and purples in flowering plants,",
      "blacks of deep shadow, occasional startling yellows or blues of exotic",
      "flowers. The sounds implied are overwhelming: insect-drone, bird-calls",
      "both beautiful and unsettling, the rustle of unseen creatures. The smell",
      "is rich and complex: rotting vegetation, damp earth, exotic flowers,",
      "something slightly sweet and dangerous underneath. Scattered about: signs",
      "of the jungle's indifference to human presence — tree-roots having",
      "reclaimed the trail, old carvings overgrown by moss, bones (recent?)",
      "scattered in the undergrowth. The overall feeling is of entering a realm",
      "where humans are *guests* and barely tolerated ones. The jungle is",
      "*alive* in ways that human civilization has forgotten.",
    ].join(" "),
  },

  {
    id: "geo_worlds_end",
    nodeId: "geo_worlds_end",
    name: "World's End — Eastern Frontier",
    description: [
      "THE ABSOLUTE EDGE OF MAPPED CIVILIZATION, where the known world ends.",
      "The scene captures a raw, untamed frontier. In the foreground, a steep",
      "cliff-edge where the land simply *ends*, dropping away into mist or",
      "clouds or something even more unknowable. The near side of the cliff is",
      "raw exposed stone, weathered and treacherous. Behind the cliff, a vast",
      "wilderness of jagged peaks, chasms, and impossible terrain stretches",
      "toward a horizon that might be mountain-range or might be the curvature",
      "of the world itself. The light is strange and sourceless — neither sun",
      "nor moon fully visible, but casting an ethereal illumination that makes",
      "depth impossible to judge. The colors are cool and unearthly: pale",
      "greys, deep purples, touches of eldritch blue, hints of colors that",
      "don't quite exist in the normal spectrum. The air feels thin and charged",
      "with something — ozone? danger? something fundamentally *wrong*. The",
      "wind is implied in the way clouds below move and stone is weathered.",
      "There is no comfortable vegetation, no sound of birds. The few plants",
      "visible are gnarled and twisted, as if shaped by winds that carry",
      "something poisonous. Scattered about: ancient weathered markers (purpose",
      "unknown), bones of large creatures (not identifiable), rusted artifacts",
      "of unknown origin. The overall feeling is one of standing at the edge of",
      "the world, looking out into the space beyond mapped reality. The human",
      "mind struggles to process what it sees. This place should not be visited.",
    ].join(" "),
  },

  {
    id: "geo_red_isles",
    nodeId: "geo_red_isles",
    name: "Red Isles — Red Dock",
    description: [
      "A PIRATE STRONGHOLD OF VOLCANIC ISLANDS with red lava-stone cliffs. The",
      "scene captures a harbor formed between red-rock islands. The foreground",
      "is a rough dock of dark wood, weathered by constant salt spray, stained",
      "with tar and blood. Anchored in the harbor: a handful of pirate vessels,",
      "lean and predatory, with patched sails and weathered hulls. The water is",
      "a deep blue-black, and the shore is red volcanic rock — sharp and",
      "forbidding. The rock rises steeply, forming natural fortress walls,",
      "scarred with cave-entrances and crevices. The air smells of salt, tar,",
      "blood, and something faintly burnt (sulfur from the volcanic geology).",
      "The light is harsh and direct, the sun filtered through perpetual haze",
      "from volcanic activity. The colors are striking: deep reds and blacks of",
      "the lava-stone, deep blues of the water, greys of weathered wood,",
      "touches of orange where iron oxidizes. Scattered about the dock: coils",
      "of rope, weapon-racks (many weapons), barrels of supplies (some marked",
      "with skull-symbols), the detritus of a military outpost. The overall",
      "feeling is one of danger and ruthlessness — this is a place built by",
      "people who take what they want and care nothing for the niceties of",
      "civilization. No people visible, but the dock is *ready* — weapons at",
      "hand, the vessels prepared to sail, the fortress on high alert against",
      "intruders.",
    ].join(" "),
  },

  {
    id: "geo_mu",
    nodeId: "geo_mu",
    name: "Mu — Ruin Shore",
    description: [
      "SUNKEN RUINS OF AN ANCIENT CIVILIZATION, partially submerged or barely",
      "above the waterline. The scene is eerie and mysterious. A shore of pale",
      "sand and smooth stones borders still, greenish-blue water. Rising from",
      "the water: fragments of monumental architecture — carved stone blocks",
      "the size of houses, broken columns, carved statuary emerging from the",
      "water as if the city sank only yesterday. The architecture is strange,",
      "following no known style, with curves and angles that feel *wrong* to",
      "human eyes. The stones are encrusted with centuries of sea-growth (salt",
      "deposits, barnacles, algae, coral creeping over the carved surface). The",
      "water is impossibly still, like glass, reflecting the sky perfectly. The",
      "light is dim and blue-green, filtered through water and atmosphere.",
      "The overall mood is one of drowning — as if the ruins are slowly sinking",
      "deeper into the water, being forgotten by the sea. The sky is pale and",
      "hazy. The colors are cool: pale greens, greys of old stone, deep blues of",
      "water, touches of brownish-green where algae grows thick. The air feels",
      "heavy and ancient, weighted with the presence of civilizations that have",
      "passed into myth. Scattered about: fragments of carved tablets (script",
      "indecipherable), shell-work and coral formations that might be decorative",
      "or might be natural, the detritus of a sinking world. The overall feeling",
      "is one of tragic beauty and the indifference of time — great works made",
      "small by the patience of the sea.",
    ].join(" "),
  },

  {
    id: "geo_tathel_isle",
    nodeId: "geo_tathel_isle",
    name: "Tathel Isle — Anchor Bay",
    description: [
      "A SACRED ISLAND MONASTERY SET IN PEACEFUL WATERS. The scene is one of",
      "spiritual sanctuary and natural beauty. In the foreground, a small bay",
      "with anchored boats and a simple dock of weathered wood and stone. The",
      "water is clear and calm, the color of pale jade. The shore is smooth",
      "river-stones and pale sand. Rising from the island: a modest monastery",
      "complex with temple buildings of whitewashed stone (or pale wood),",
      "simple in design but clearly ancient. A bell-tower rises above the",
      "buildings, visible even from the dock. Around the monastery: a simple",
      "garden with fruit trees, herb beds, walking paths of raked gravel.",
      "Everything is meticulously maintained but without ostentation —",
      "simplicity itself is the aesthetic. The light is golden and warm, the",
      "atmosphere peaceful. The sky is clear and pale blue. The colors are soft",
      "and harmonious: pale stone, soft greens of the garden, pale blues of sky",
      "and water, touches of warm gold in timber and shadows. The air is quiet",
      "— no harsh sounds, the peace implied by the maintained silence. Scattered",
      "about: simple stone benches for meditation, prayer-flags that move gently",
      "despite the still air, offerings of flowers and fruit (maintained,",
      "fresh). The overall feeling is one of profound peace and spiritual",
      "presence. This is a place where the external world's chaos cannot reach.",
      "The impression is of people who have chosen simplicity as a path to",
      "enlightenment.",
    ].join(" "),
  },

  {
    id: "geo_zalgara_mts",
    nodeId: "geo_zalgara_mts",
    name: "Zalgara Mountains — Lower Pass",
    description: [
      "HIGH MOUNTAIN PEAKS AND PASSES, with altitude that kills the unwary. The",
      "scene captures a narrow mountain pass between peaks so tall they pierce",
      "the clouds. The foreground is a switchback trail of bare rock and thin",
      "soil, barely wide enough for a single line of travelers. To the left and",
      "right: cliffs drop away into misty chasms — the depth is impossible to",
      "judge. The peaks above are sharp and severe, the rock exposed and raw.",
      "Snow patches persist even in warm season (especially on north-facing",
      "slopes). The light is harsh and clear, the air thin and cold. The colors",
      "are cool: pale greys of exposed rock, deep blues of sky, touches of white",
      "snow glowing almost blue in shadow, occasional darker bands of mineral",
      "deposits in the stone. The wind is constant and fierce — visible in the",
      "way clouds are torn apart and stone is weathered and grooved. The air",
      "tastes thin and metallic; breathing is slightly difficult. The quiet is",
      "eerie — at this altitude, sound carries strangely, and the normal ambient",
      "noise of the world is absent. Scattered about the trail: ancient stone",
      "markers indicating the path (some so old they are barely distinct from",
      "natural rock), prayer-cairns built by travelers seeking safe passage,",
      "weathered bones (whether beast or human, impossible to say). The overall",
      "feeling is one of being at the edge of livable space — one more thousand",
      "feet up and the air itself becomes lethal. This pass is traversed only by",
      "those with no other choice, and many do not survive the crossing.",
    ].join(" "),
  },
];

// ── Generation ──────────────────────────────────────────────────────

function buildPrompt(spec: RoomSceneSpec): string {
  return [STYLE_ANCHOR, "", spec.description, "", SCENE_FRAMING].join("\n");
}

async function callGrokImaginePro(prompt: string): Promise<string> {
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "16:9",
    resolution: "1600x900",
  } as Parameters<typeof grok.images.generate>[0] & {
    aspect_ratio: string;
    resolution: string;
  });
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok Imagine returned no image data");
  return b64;
}

function nextStartingIndex(outDir: string): number {
  if (!fs.existsSync(outDir)) return 1;
  const existing = fs
    .readdirSync(outDir)
    .map((name) => /^bg-v(\d+)\.jpg$/.exec(name))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => parseInt(m[1]!, 10));
  if (existing.length === 0) return 1;
  return Math.max(...existing) + 1;
}

async function forgeDestinationRoom(
  spec: RoomSceneSpec,
): Promise<{ generated: number; failed: number }> {
  const outDir = path.join(root, "public", "art", "scenes", spec.nodeId);
  fs.mkdirSync(outDir, { recursive: true });
  const prompt = buildPrompt(spec);

  const promptPath = path.join(outDir, "_prompt.txt");
  fs.writeFileSync(promptPath, prompt + "\n");

  const startIndex = nextStartingIndex(outDir);
  const endIndex = startIndex + candidateCount - 1;

  console.log("");
  console.log(`── ${spec.nodeId}: ${spec.name} ──`);
  console.log(`  Output dir: ${outDir}`);
  console.log(`  Naming: bg-v${startIndex}…bg-v${endIndex}`);
  console.log(`  Cost this room: ~$${(candidateCount * 0.07).toFixed(2)}`);

  let generated = 0;
  let failed = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    const outPath = path.join(outDir, `bg-v${i}.jpg`);
    console.log(`  generating candidate bg-v${i}…`);
    try {
      const b64 = await callGrokImaginePro(prompt);
      console.log(`    raw image received (${Math.round((b64.length * 0.75) / 1024)} KB)`);
      console.log(`    converting to JPEG…`);
      const jpegBuffer = await grokImageToJpeg(b64);
      fs.writeFileSync(outPath, jpegBuffer);
      const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`  ✓ wrote ${outPath} (${sizeKb} KB)`);
      generated++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ bg-v${i} FAILED: ${msg}`);
    }
  }
  return { generated, failed };
}

async function main(): Promise<void> {
  const targetIds = onlyArg
    ? new Set(onlyArg.slice("--only=".length).split(",").map((s) => s.trim()))
    : null;
  const rooms = targetIds
    ? DESTINATION_ROOMS.filter((r) => targetIds.has(r.nodeId))
    : DESTINATION_ROOMS;
  if (rooms.length === 0) {
    console.error(`ERROR: --only filter matched no rooms.`);
    process.exit(1);
  }

  console.log(`Forging ${rooms.length} destination room background scene(s) × ${candidateCount} candidates each`);
  console.log(`Total estimated cost: ~$${(rooms.length * candidateCount * 0.07).toFixed(2)}`);

  let totalGenerated = 0;
  let totalFailed = 0;
  for (const room of rooms) {
    const r = await forgeDestinationRoom(room);
    totalGenerated += r.generated;
    totalFailed += r.failed;
  }

  console.log("");
  console.log("─── Grand Summary ───");
  console.log(`Generated: ${totalGenerated}`);
  console.log(`Failed:    ${totalFailed}`);
  if (totalGenerated > 0) {
    console.log(`Approx cost this run: $${(totalGenerated * 0.07).toFixed(2)}`);
    console.log("");
    console.log("Review generated backgrounds in public/art/scenes/{node_id}/ directories.");
    console.log("Rename selected bg-v{N}.jpg → bg.jpg to set as primary for the room.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
