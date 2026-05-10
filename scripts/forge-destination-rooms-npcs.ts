// ========================================================================
// LIVING EAMON — Destination room exotic NPCs (Session 001)
//
// Forges 25 exotic NPC sprites for destination stub rooms.
// Each NPC is a memorable character that hints at the place's nature.
// NPCs are portrait sprites (3:4 ratio), white background, rembg → transparent PNG.
//
// Allies are shown in casual/portrait stance, facing screen-RIGHT (hero's right).
// Hostile NPCs (bandits, cultists, etc) get UGLY_MEAN_OVERLAY and face LEFT.
//
// Categories:
//   - Cities (5 NPCs): merchants, travelers, guides
//   - Landmarks (5 NPCs): hermits, mystics, scholars
//   - Nations (7 NPCs): nobles, warriors, seafarers
//   - Wilderness (8 NPCs): explorers, outcasts, monks
//
// Output:
//   public/art/npcs/{npc_id}/master/v{N}.png
//
// Usage:
//   npx tsx scripts/forge-destination-rooms-npcs.ts                 # 2 each (50 total)
//   npx tsx scripts/forge-destination-rooms-npcs.ts --count=3       # 3 each (75 total)
//   npx tsx scripts/forge-destination-rooms-npcs.ts --only=karesh_valdor --count=4
//
// Cost: ~$0.07 per image. 25 NPCs × 2 candidates = 50 calls ≈ $3.50.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";
import { grokImageToTransparentPng } from "../lib/imageProcessing";
import { recordPromptForSprite } from "../lib/art/recordPromptForSprite";
import { loadStandingRules } from "../lib/art/promptRules";

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

// ── Style anchor (shared across all NPCs) ───────────────────────────

const STYLE_ANCHOR = [
  "Full-body OIL PAINTING in the classic 1970s-1980s sword-and-sorcery",
  "cover style of Frank Frazetta and Gerald Brom — visible painterly",
  "brushwork, warm romantic lighting, soft modeling of form, painted",
  "edges (NOT crisp lines). The medium is OIL PAINT ON CANVAS — visible",
  "brush texture. NOT a photograph, NOT photoreal, NOT a 3D render, NOT",
  "CGI, NOT cartoon, NOT cel-shaded, NOT anime, NOT manga, NOT comic-book",
  "line-art, NOT vector art.",
].join(" ");

// Portrait framing for NPCs (white background, 3:4 ratio, facing RIGHT for allies)
const FRAMING_ALLY = [
  "3:4 vertical portrait. Pure clean opaque white (#FFFFFF) studio backdrop",
  "filling the entire frame. Full body visible from head to feet, the",
  "figure filling 80-87% of the frame vertically with feet at the bottom",
  "edge and modest empty white space above the head. Body angled three-",
  "quarters toward screen-RIGHT (ALLY orientation). Even soft warm studio",
  "lighting from the upper-left, no harsh shadows. NO scenery, NO floor,",
  "NO ground line, NO shadow under the feet, NO border, NO text, NO other",
  "figures.",
].join(" ");

// ── Per-NPC prompts ────────────────────────────────────────────────

interface NpcSpec {
  id: string;           // npcId for output directory
  name: string;         // display name
  description: string;  // identity, costume, and pose
  isHostile: boolean;   // if true, add UGLY_MEAN_OVERLAY and reverse orientation
}

// NOTE: Allies face screen-RIGHT; hostiles face screen-LEFT. All are in
// portrait/casual pose (not combat stance, unlike bandits).

const DESTINATION_NPCS: NpcSpec[] = [
  // ════════════════════════════════════════════════════════════════
  // CITIES (5 NPCs)
  // ════════════════════════════════════════════════════════════════

  {
    id: "karesh_valdor",
    name: "Karesh Valdor",
    description: [
      "A ZARFHAANI MOUNTAIN MERCHANT in his mid-forties, weathered and",
      "shrewd. Approximately 5'8\", lean-muscled, the body of a man who has",
      "climbed high passes his entire life. Mahogany-dark skin from decades of",
      "mountain sun (NOT tan in the sunburned sense — burned-dark, permanent).",
      "Black hair receding at the temples, with a full beard streaked with",
      "grey. Sharp, intelligent dark eyes. A long scar runs from his",
      "cheekbone to jaw — a burn-scar, old and pale. His expression is one of",
      "sharp calculation and amusement — he is appraising you, pricing you.",
      "",
      "He wears the traditional dress of Zarfhaani mountain traders: layered",
      "wool robes in rust and indigo, wrapped with deliberate precision. Over",
      "them, a fine-embroidered vest of deep crimson with gold thread. His",
      "turban is rust-colored linen, wrapped in the style of high-altitude",
      "peoples (the wrapping protects against cold and sun). At his waist, a",
      "leather belt with small pouches (trade samples — spices, dyes, rare",
      "fibers). Worn leather boots to mid-calf, scuffed from mountain roads.",
      "",
      "POSE: He stands in a relaxed, three-quarters view, one hand gesturing",
      "as if mid-negotiation, the other resting on his hip. His expression is",
      "confident and slightly amused — the posture of someone who expects to",
      "win any bargain. NOT defensive, NOT aggressive, NOT humble — he is a",
      "merchant confident in the value of what he sells. His gaze is sharp,",
      "appraising, calculating.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "marin_cartographer",
    name: "Marin the Cartographer",
    description: [
      "AN AGING EXPLORER and mapmaker in his seventies, weathered by decades",
      "of travel and scholarship. Approximately 5'10\", lean and bent with age,",
      "the body of someone who was once stronger and has slowly been worn down",
      "by time. Pale weathered skin, creased and scored by sun-exposure. White",
      "hair, thin and wispy. His left eye is clouded white with an old scar",
      "running from forehead to cheekbone (a sharp wound, long-healed). His",
      "remaining eye is startlingly clear and blue, the blue of high mountain",
      "sky — it reads as younger than the rest of his face. His expression is",
      "distant and slightly sad, as if he remembers more about the world than",
      "he wishes. His mouth is set in a thin line.",
      "",
      "He wears the practical dress of an explorer and scholar: a long",
      "traveler's coat of dark leather, faded and stained with years of use.",
      "The coat is covered in patches where it has been repaired. Over it, a",
      "stained leather vest with dozens of pockets and loops, filled with",
      "rolled parchment, writing implements, compass-pieces, measuring tools.",
      "His fingers are stained with centuries of ink — blue, red, black, all",
      "mixed together. Around his neck, on a leather cord, hangs an ancient",
      "compass (possibly nonfunctional, possibly precious). Dark breeches and",
      "worn boots complete the look.",
      "",
      "POSE: He stands three-quarters to screen-right, leaning slightly on a",
      "carved walking-staff (a piece of excellent craftsmanship, worn smooth by",
      "decades of use). His expression is contemplative, looking toward the",
      "middle distance. One hand rests on the staff, the other hangs at his",
      "side. His posture is that of someone who has traveled far and sees",
      "things in the landscape that others miss. NOT weary, NOT defeated — he",
      "maintains a quiet dignity despite his age.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "sarek_caravan",
    name: "Sarek the Caravan Master",
    description: [
      "A WEATHERED DESERT MERCHANT and caravan master in his fifties, hardened",
      "by years crossing harsh landscapes. Approximately 6'0\", massive-framed",
      "and powerfully built, with the kind of strength that comes from decades",
      "of physical labor in brutal conditions. His skin is burned nearly black",
      "from desert sun (NOT tan — burned, permanent, dark as mahogany). His",
      "scalp is shaved or balding; the exposed skin is darker still. A short",
      "dark beard, greying at the edges. His eyes are the color of scorched",
      "earth — brown-gold, intense, with crow's feet from squinting into sun.",
      "His face is carved by wind and weather, every line telling a story of",
      "survival. The bearing is that of a man who does not fear much, having",
      "already survived the unsurvivable.",
      "",
      "He wears the dress of desert nomads: an indigo-dyed wool robe (the color",
      "faded pale in places, stained with salt and sweat). Over it, a leather",
      "belt wide enough to support heavy loads. At his waist, a curved sword in",
      "a simple leather scabbard (the blade worn and battle-marked). His hands",
      "are callused and scarred — two fingernails are missing entirely, leaving",
      "smooth scar tissue. He wears simple leather sandals, feet toughened by",
      "desert miles. A length of indigo cloth is wrapped around his waist as a",
      "sash, in the style of caravan-masters.",
      "",
      "POSE: He stands three-quarters to screen-right, weight balanced on both",
      "feet, one hand resting on the pommel of his sword, the other hanging at",
      "his side. His expression is calm and watchful, the posture of someone",
      "who is always ready for threat but does not anticipate it immediately.",
      "His gaze is level, measuring. NOT aggressive, NOT weary — he is",
      "perpetually alert, a state that has become his baseline. The overall",
      "bearing is one of quiet authority and earned respect.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "torven_pilot",
    name: "Torven the Pilot",
    description: [
      "A SCARRED RIVER GUIDE in his sixties, bound to the water by ritual and",
      "choice. Approximately 5'11\", muscular-lean with broad shoulders, built",
      "more for water-strength than land-strength. His skin is rich brown,",
      "weathered by decades of spray and sun. His face is weathered to the",
      "texture of old leather, deeply lined, with intensity that reads from",
      "across a room. His eyes are grey, the color of storm-clouds, and seem to",
      "look *through* things rather than at them. His hair is long (unusually",
      "for a working man), black streaked with silver, braided down the back of",
      "his skull. He is missing two fingers on his left hand — the ring and",
      "middle fingers gone, leaving smooth scar tissue. His remaining fingers",
      "are powerful and capable, fully compensating for the loss.",
      "",
      "His body is marked with ritualistic scarification — parallel lines",
      "running down both arms, concentric circles on his chest, symbols that",
      "might be language or might be pure design. The scars are pale against his",
      "dark skin, telling a story of initiation into water-knowledge. He wears",
      "minimal clothing: loose canvas breeches and nothing above the waist (the",
      "scars are meant to be seen). Around his neck, on a cord of twisted vine,",
      "hangs a stone amulet (shape unclear, clearly important). Around his",
      "wrists and ankles, cords of natural fiber — perhaps binding vows.",
      "",
      "POSE: He stands three-quarters to screen-right, weight relaxed,",
      "balanced, the stance of someone completely at ease with his own body.",
      "One hand rests at his side, the other held open at waist-height (perhaps",
      "a gesture of peace or ritual significance). His expression is calm and",
      "distant, as if even standing in one place his mind is elsewhere (on the",
      "river, listening to water). His gaze is unfocused, looking beyond the",
      "immediate moment. The overall bearing is one of spiritual presence and",
      "separation from ordinary concerns.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "okeene_guide",
    name: "Okeene the Jungle Guide",
    description: [
      "A SCARRED JUNGLE GUIDE in his forties, hardened by decades navigating",
      "impossible terrain. Approximately 5'9\", lean and wiry with the efficient",
      "musculature of someone who conserves energy and moves precisely. His",
      "skin is rich brown-black, darkened further by jungle sun. His face is",
      "sharp and intense, weathered by heat and humidity. His left eye is",
      "clouded milky-white from some old poison or toxin — the eyelid is",
      "slightly sealed, giving him an appearance of permanent squinting. His",
      "remaining eye is dark and sharp, missing nothing. Ritual scars mark his",
      "forearms in distinctive parallel patterns, symbols of jungle-tribe",
      "initiation.",
      "",
      "He wears almost nothing by civilized standards: loose canvas breeches",
      "hanging from sharp hip-bones, nothing above the waist (the ritual scars",
      "displayed deliberately). Around his chest, a cord of twisted vine from",
      "which hangs a leather pouch and a stone amulet carved in a shape that",
      "might be spiritual or might be purely functional (hard to say). His feet",
      "are bare, the soles scarred and thick as leather from decades of jungle",
      "walking barefoot. He carries a machete at his hip — the blade is notched",
      "and stained, clearly much-used, the handle worn smooth by his grip.",
      "",
      "POSE: He stands three-quarters to screen-right, weight balanced low, the",
      "stance of someone prepared for quick movement in difficult terrain. One",
      "hand rests on the machete hilt, the other hanging at his side. His",
      "expression is calm and assessing, the look of someone reading the world",
      "through senses that go beyond ordinary human perception. His visible eye",
      "is alert but not aggressive. The overall bearing is one of alien",
      "competence — he belongs to the jungle in ways that civilization has made",
      "humans forget they could.",
    ].join("\n"),
    isHostile: false,
  },

  // ════════════════════════════════════════════════════════════════
  // LANDMARKS (5 NPCs)
  // ════════════════════════════════════════════════════════════════

  {
    id: "hermit_skull_silence",
    name: "The Mountain Hermit",
    description: [
      "AN AGED MOUNTAIN HERMIT in his seventies or eighties — age is impossible",
      "to determine precisely, worn by altitude and isolation. Approximately",
      "5'7\", thin and ascetic, with the lean body of someone who eats only what",
      "is necessary for survival. His skin is pale weathered, creased deeply by",
      "decades of mountain wind and sun. His hair is long and white, untended,",
      "falling to his shoulders in a matted, almost dreadlock appearance. His",
      "eyes are pale blue, sharp and clear, with the quality of someone who has",
      "spent decades in meditation. His expression is distant and serene, as if",
      "he is perpetually looking inward.",
      "",
      "He wears simple robes of undyed wool, grey with age and wear, rough-",
      "woven and patched. The robes are stained with mountain dust and the",
      "residue of decades of life outdoors. Around his waist, a cord of braided",
      "plant-fiber, from which hangs a wooden prayer-bead necklace (roughly",
      "carved, clearly hand-made). On his feet, simple sandals worn nearly",
      "through, held together by prayer and stubbornness. He carries a carved",
      "wooden staff, weathered smooth by decades of use, its surface inscribed",
      "with symbols or runes (meaning unclear).",
      "",
      "POSE: He stands three-quarters to screen-right, leaning on his staff, the",
      "weight of his body slightly relaxed into the wood. His expression is one",
      "of serene contemplation, his gaze looking beyond the moment into some",
      "deeper understanding. His free hand is raised in a gesture that might be",
      "blessing or might be simple gesture of acknowledgment. His stance is",
      "dignified despite his age and asceticism. The overall bearing is one of",
      "spiritual depth and disconnection from worldly concerns.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "mystic_visions",
    name: "The Water-Gazer",
    description: [
      "A MYSTIC OR SHAMAN in indeterminate age (could be thirty or seventy —",
      "something timeless in the bearing). Approximately 5'6\", slender and",
      "graceful, moving with an otherworldly quality. Gender is ambiguous,",
      "intentionally so — neither strictly male nor female, as if they exist",
      "outside such categories. Their skin is pale and luminous, almost",
      "translucent in certain light. Their hair is long and elaborately braided",
      "with strange fibers (grasses? shells? impossible to say), small bells or",
      "charms hanging from the braids. Their eyes are unusual — pupils dilated",
      "wide, as if constantly in dim light or in trance, the irises a pale",
      "almost-colorless blue.",
      "",
      "They wear robes of indigo and grey linen, simple in cut but elaborately",
      "embroidered with symbols (astrological? magical? personal? unclear). The",
      "robes are layered and draped in a way that makes the body indistinct. On",
      "their arms, above the elbows, spiral tattoos (or ritual scarification) in",
      "patterns that make the eye dizzy to follow. Around their neck, multiple",
      "necklaces of bone, shell, carved stone, and precious metals, each with",
      "apparent significance. Their feet are bare, the soles stained with",
      "something (dye? henna? something ritual). They carry a carved wand or",
      "staff of polished bone and dark wood.",
      "",
      "POSE: They stand three-quarters to screen-right, but their posture is",
      "unusual — slightly twisted, as if not entirely present in physical space.",
      "Their hands are raised in a ritual gesture, the fingers trailing as if",
      "conducting unseen forces. Their expression is serene and distant, their",
      "gaze focused on something beyond normal sight. There is an otherworldly",
      "quality to their presence, as if they inhabit a different reality than",
      "ordinary humans. The overall bearing is one of spiritual presence and",
      "communion with forces beyond the mundane.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "archaeologist_gardens",
    name: "The Artifact Collector",
    description: [
      "AN OBSESSED ARCHAEOLOGIST or curse-breaker in his fifties, consumed by",
      "decades of chasing ancient knowledge. Approximately 5'9\", heavyset from",
      "years of sedentary scholarly work, with the pallor of someone who spends",
      "more time indoors with texts than outdoors. His skin is pale and slightly",
      "sun-burned (indicating recent travel despite his scholar appearance). His",
      "hair is dark streaked with grey, thinning at the crown, usually tied back",
      "with a leather cord. His eyes are dark and intense, sharp with obsessive",
      "intelligence. His hands are ink-stained (from constant writing and",
      "documentation), and nervous in their movements. His expression is one of",
      "barely-contained excitement mixed with paranoia — he has discovered",
      "things that have changed him.",
      "",
      "He wears the practical dress of an explorer-scholar: a heavy linen coat",
      "with multiple pockets (all filled with tablets, fragments, notes, sketches",
      "of runic translations). Beneath it, a wool vest over a linen shirt. At",
      "his belt, a collection of tools: brushes, chisels, a measuring tape, a",
      "journal or two. Around his neck, on leather cords, several pendants or",
      "amulets (unclear if protective charms or just collected artifacts). Dark",
      "breeches and worn leather boots complete the ensemble. A canvas satchel",
      "hangs at his side, bulging with journals and artifact-samples.",
      "",
      "POSE: He stands three-quarters to screen-right, weight slightly forward,",
      "the posture of someone intense and engaged. One hand gestures as if in",
      "mid-explanation, the other touching one of his amulets or pockets. His",
      "expression is one of barely-contained excitement and fervent belief. His",
      "eyes are bright with the light of obsession. The overall bearing is one of",
      "scholarly intensity and slight dangerous madness — he has seen things",
      "that have warped his perception.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "exile_forbidden",
    name: "The Hollow-Eyed Exile",
    description: [
      "A BROKEN EXILE or outcast in indeterminate age (worn by suffering, could",
      "be thirty or fifty). Approximately 5'8\", thin to the point of gauntness,",
      "the body of someone who has forgotten how to eat or sleep properly. Their",
      "skin is grey-pale, the color of someone who has not seen sunlight for",
      "years (or whose hope has been burned out). Their eyes are hollow, haunted,",
      "with dark circles suggesting years of sleeplessness or torment. Their",
      "hair is long and matted, unkempt to the point of being wild. They carry",
      "visible marks of suffering: old scars, signs of self-harm or persecution,",
      "a quality of deep trauma written on their frame.",
      "",
      "Their clothing is ragged and patched beyond the point of functionality —",
      "layers of grey and black cloth, tattered, held together more by habit than",
      "design. At their wrists and neck, marks as if they have worn chains or",
      "bindings. They carry nothing but a water-skin and a small carved object",
      "(a charm, or a reminder of someone lost). Their feet are bare and marked",
      "with old calluses and fresh wounds. The overall appearance is of someone",
      "who has been broken and is slowly learning to be human again (or has given",
      "up the attempt).",
      "",
      "POSE: They sit or crouch three-quarters to screen-right, their posture",
      "collapsed and withdrawn, as if holding themselves is a constant effort.",
      "Their hands are drawn inward, protective. Their expression is distant and",
      "sorrowful, looking at nothing. Their eyes, though hollow, hold a depths of",
      "anguish. The bearing is one of profound trauma and isolation — they are",
      "present in body but absent in spirit, haunted by things that have broken",
      "their grip on ordinary reality.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "elder_atlantis",
    name: "The Atlantean Elder",
    description: [
      "AN ANCIENT ATLANTEAN SCHOLAR or priestess in their eighties or nineties,",
      "a living remnant of lost civilization. Approximately 5'4\", slight and",
      "aged, moving with careful deliberation. Their skin is pale and thin,",
      "revealing the network of veins beneath, marked with ritual tattoos or",
      "scarification in styles predating modern human society. Their hair is",
      "long and silver, braided with threads of gold or precious metals. Their",
      "eyes are pale and luminous, the eyes of someone who has read the secrets",
      "of lost ages. Their expression is one of profound sadness and acceptance",
      "— they are the last bearer of a dead world.",
      "",
      "They wear robes of fine linen in deep indigo and crimson, elaborately",
      "embroidered with symbols (astrological? mathematical? the meaning lost to",
      "time). Over the robes, a cloak of deep purple with borders of gold. On",
      "their fingers, multiple rings of strange metal (not silver, not gold,",
      "something older). Around their neck, a pendant of crystalline stone",
      "(mineral, not gem, perhaps anciently magical). At their feet, simple",
      "sandals of unknown leather. They carry a staff of dark wood topped with a",
      "carved stone that seems to catch light oddly.",
      "",
      "POSE: They stand three-quarters to screen-right, but with the stillness of",
      "someone who has learned to inhabit their body carefully. Their weight is",
      "balanced on both feet, one hand resting on their staff, the other hanging",
      "at their side. Their expression is serene and distant, their gaze looking",
      "into some deep time beyond the present moment. Their bearing is one of",
      "dignity preserved against impossible odds, the dignity of the last survivor",
      "of a vanished world.",
    ].join("\n"),
    isHostile: false,
  },

  // ════════════════════════════════════════════════════════════════
  // NATIONS (7 NPCs)
  // ════════════════════════════════════════════════════════════════

  {
    id: "priestess_atlantis",
    name: "The Atlantean Priestess",
    description: [
      "A PRIESTESS-KEEPER OF THE SACRED RUNES, the oldest alphabet in the world —",
      "a gift from the Elder Races themselves, given to Atlantis for standing",
      "against the Lizard Men in ancient wars. She is middle-aged and radiates",
      "authority born of custodianship over knowledge that predates kingdoms.",
      "Approximately 5'7\", graceful and poised, with the bearing of someone",
      "trained from birth in ritual and the preservation of elder mysteries. Her",
      "skin is Mediterranean in tone, pale from years spent reading scrolls and",
      "tablets. Her hair is dark and elaborately styled, adorned with threads of",
      "gold and small carved amulets (each representing a rune of power). Her eyes",
      "are dark and piercing, missing nothing, the eyes of a scholar and a",
      "priestess. Her expression is calm and knowing — she carries secrets older",
      "than most nations.",
      "",
      "She wears ceremonial garb that speaks to Atlantean maritime dominance and",
      "sacred knowledge: a long linen dress in the FAMED TYRIAN PURPLE (the color",
      "itself a mark of Atlantean identity and wealth), pleated and falling to",
      "sandaled feet. Over it, a richly embroidered surcoat in deep blue and gold,",
      "depicting not mere geometric patterns but RUNES AND ELDER SCRIPT — the",
      "sacred alphabet given by the Elder Races. These runes are worked in gold",
      "thread or precious metals, creating a garment that is both ceremonial dress",
      "and a CHRONICLE OF SACRED KNOWLEDGE. At her waist, a belt of worked metal",
      "carved with more runes. On her hands, rings of silver and something older",
      "(possibly Elder-Races crafting, possibly something given by them). Around",
      "her neck, a prominent pendant: a carved stone or crystal inscribed with",
      "RUNES that seems to glow faintly in certain light (perhaps it absorbs and",
      "releases elder-magic, or perhaps it is simply very old and precious). Her",
      "feet are shod in sandals of fine leather marked with ritual runes. She",
      "carries a staff topped with a crystal carved in the shape of elder-script,",
      "symbols of power and knowledge.",
      "",
      "POSE: She stands three-quarters to screen-right, her posture dignified and",
      "purposeful, the bearing of a woman who preserves and interprets sacred",
      "knowledge. One hand rests on her staff, the other is raised as if in",
      "benediction or as if reading something written in the air (reading the",
      "runes themselves, perhaps). Her expression is serene and authoritative, her",
      "gaze slightly raised, as if looking toward the Elder Races themselves. Her",
      "bearing is one of spiritual authority and the weight of custodianship — she",
      "is not merely a priestess but a KEEPER OF THE OLDEST ALPHABET, a guardian",
      "of knowledge granted in exchange for ancient valor.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "warrior_thule",
    name: "The Thulean Warrior Woman",
    description: [
      "A THULEAN WARRIOR WOMAN in her fifties, scarred and hardened by decades",
      "of combat. Approximately 5'11\", tall and powerfully muscled, with the",
      "physique of someone who has trained in arms since childhood. Her skin is",
      "pale Scandinavian-white, weathered by cold northern wind. Her hair is",
      "long and silver-blonde, braided with leather cords and small metal talons.",
      "Her eyes are pale grey-blue, cold and intelligent, the eyes of a predator",
      "assessing prey. Her face is scarred (a long scar across her right temple,",
      "a notch missing from her left ear), and her expression is one of calm",
      "competence and readiness. She drinks from a carved horn and sees the",
      "world through the lens of honor and combat.",
      "",
      "She wears the armor of a Thulean warrior: a short-sleeved hauberk of",
      "well-maintained chainmail over a black quilted gambeson. Over the mail, a",
      "sleeveless surcoat of deep blue linen, embroidered with runes or symbols",
      "of her lineage. At her waist, a wide leather belt supporting the weight",
      "of a sword and seax (short-knife). Her legs are sheathed in dark leather",
      "breeches, and her feet are shod in leather boots scuffed from travel.",
      "Around her neck, a silver torc (neck-ring) marking her warrior status.",
      "On her wrists, leather wraps with metal studs. She carries a drinking-horn",
      "(carved and decorated, a mark of honor).",
      "",
      "POSE: She stands three-quarters to screen-right, her weight balanced and",
      "ready. One hand holds the drinking-horn at her side, the other hangs free,",
      "capable of reaching a weapon instantly. Her expression is calm and cool,",
      "perhaps with the hint of a smile — she finds amusement in danger. Her",
      "gaze is level, assessing, respecting equal strength. The bearing is one of",
      "pure martial confidence and the ease of someone who has survived countless",
      "battles.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "guard_commoria",
    name: "The Commonian Guard",
    description: [
      "A COMMONIAN CITADEL GUARD or soldier in his forties, built for mountain",
      "fortress service. Approximately 5'10\", broad-shouldered and heavily",
      "muscled, with the physique of someone trained in heavy armor and mounted",
      "combat. His skin is pale mountain-white, weathered but not darkly so. His",
      "hair is dark, cut short in military fashion. His eyes are dark and sharp,",
      "alert, the eyes of someone trained to spot threats. His face is angular",
      "and stern, with the bearing of someone who has taken numerous oaths of",
      "service. His expression is professional and measured, neither hostile nor",
      "welcoming.",
      "",
      "He wears the armor of a Commonian fortress-guard: heavy plate armor in",
      "blackened steel, custom-fitted to his frame. The armor is well-maintained,",
      "showing care and respect for the craft. A surcoat of deep grey wool bears",
      "the heraldry of his fortress (a carved stone or mountain symbol). Beneath",
      "the breastplate, a padded gambeson is visible at the neck and cuffs. At",
      "his waist, a sword (longsword, serviceable and well-used) and a dagger.",
      "His feet are shod in heavy leather boots with iron reinforcement. On his",
      "head (currently removed or held), a blackened iron helm suited to fortress",
      "duty. A dark cloak hangs from his shoulders, marking his rank.",
      "",
      "POSE: He stands three-quarters to screen-right, in a formal stance, weight",
      "balanced on both feet as if on permanent guard duty. One hand rests on his",
      "sword pommel, the other hangs at his side. His expression is professional",
      "and alert, his gaze steady and evaluating. His bearing is one of military",
      "discipline and duty to command — he is reliable, competent, and completely",
      "committed to the service of his fortress-king.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "captain_lemuria",
    name: "The Distant Port Captain",
    description: [
      "A SHIP CAPTAIN OR MARITIME MERCHANT from far eastern ports, in his",
      "fifties, sun-worn and seafaring. Approximately 5'9\", wiry and strong",
      "despite his age, with the lean strength of a lifetime at sea. His skin is",
      "burned deep bronze or mahogany by decades of sun-exposure, marked with",
      "salt-line stains and weathering. His hair is dark with grey strands, worn",
      "long and secured with a leather cord or bandana. His eyes are dark and",
      "shrewd, with crow's feet from squinting into sun-glare and sea-horizon.",
      "His beard is full and kept neat, a mark of a captain's pride. His hands",
      "are scarred and calloused, missing the tip of one finger (old maritime",
      "accident). His expression is confident and slightly distant, the look of",
      "someone more comfortable on water than land.",
      "",
      "He wears the practical dress of a maritime trader: a linen shirt of pale",
      "cream or white, open at the chest (showing a tattoo or ritual scars),",
      "worn loose and sea-stained. Over it, a leather vest reinforced with brass",
      "studs (practical, not ornamental). Dark breeches and boots of supple",
      "leather, marked with salt-stains and tar (impossible to fully clean). At",
      "his waist, a wide leather belt supporting a cutlass (curved, well-used",
      "blade) and a pair of long knives. Around his neck, a simple silver chain",
      "supporting a medallion (perhaps a mark of captaincy or protective charm).",
      "He carries a rolled map-case at his hip, made of oiled leather and marked",
      "with port symbols.",
      "",
      "POSE: He stands three-quarters to screen-right, with the relaxed confidence",
      "of someone completely at ease in his own frame. One hand rests on his",
      "sword pommel, the other holds a rolled map or points toward a distant",
      "horizon. His expression is calm and calculating, his eyes distant,",
      "perhaps already thinking of his next voyage. His bearing is one of",
      "seasoned maritime authority and the easy competence of a man who has",
      "survived the ocean's indifference multiple times over.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "merchant_farsun",
    name: "The Desert Merchant Master",
    description: [
      "A DESERT MERCHANT MASTER or nomadic tribe-leader in his sixties, darkened",
      "by endless sun. Approximately 5'7\", heavyset and strong, with the",
      "physique of someone who has lived hard and weathered hardship. His skin",
      "is burned near-black by decades in the Camoonian sun (NOT tan in the soft",
      "sense — burned dark, weathered, permanent). His hair is dark and thin,",
      "worn in the style of southern caravan-masters, with a turban of deep",
      "indigo linen wrapped with deliberate precision. His eyes are dark and",
      "intense, missing nothing, calculating every angle. His beard is full and",
      "greying, carefully trimmed and groomed despite the harsh environment. His",
      "expression is one of shrewd business intelligence and hard-won survival",
      "knowledge.",
      "",
      "He wears traditional southern merchant dress: a deep indigo robe wrapped",
      "in layers (practical against both sun and cold nights). The robe is fine",
      "wool, marked with dust and stain from desert travel. Over it, a",
      "embroidered vest in rich colors (rust, deep blue, touches of gold or",
      "silver). At his waist, a leather belt supporting various pouches and",
      "small weights (for calculating trade). Wrapped around his waist as a sash:",
      "a length of decorated cloth in the style of desert merchant-masters. His",
      "feet are shod in sturdy leather boots, dusty and well-worn. At his side, a",
      "curved sword in a simple leather scabbard (functional, not decorative).",
      "",
      "POSE: He stands three-quarters to screen-right, with the bearing of someone",
      "accustomed to negotiation and authority. One hand gestures as if mid-deal,",
      "the other rests on his hip, near his sword. His expression is confident",
      "and shrewd, his eyes calculating, assessing. His posture is one of relaxed",
      "authority — he does not need to prove himself, he simply *is* the master",
      "of his domain. The bearing is one of seasoned desert wisdom and the",
      "confidence of someone who has survived in places that kill the weak.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "shepherd_thurania",
    name: "The Highland Shepherd",
    description: [
      "A GRIZZLED HIGHLAND SHEPHERD in his sixties, hardened by decades of",
      "solitude and mountain weather. Approximately 5'8\", lean and wiry, with",
      "the strength of years spent herding in difficult terrain. His skin is",
      "weathered to the color and texture of old leather, deeply lined and",
      "bronzed. His hair is dark with grey strands, worn long and simple. His",
      "eyes are pale and shrewd, missing nothing, the eyes of someone who spends",
      "months in solitude with only goats and sky. A full beard, grey and",
      "unkempt, frames his face. His expression is one of quiet amusement and",
      "deep contentment — he has found peace in the hills that city folk can",
      "never understand.",
      "",
      "He wears the simple dress of a highland shepherd: a long woolen cloak",
      "dyed in deep greens or browns (designed to blend with the landscape). Over",
      "it, a vest of sheepskin, worn and stained (but warm). Beneath, simple",
      "woolen breeches and a linen shirt, both patched and repaired many times.",
      "His feet are shod in sturdy leather boots, broken in and comfortable. At",
      "his waist, a simple belt supporting a knife (shepherd's tool, not weapon).",
      "In one hand, he carries a wooden crook, hand-carved and worn smooth by",
      "decades of use, inscribed with marks or runes. Around his neck, a cord of",
      "braided grass or wool, from which hangs a carved bone whistle (for",
      "directing goats).",
      "",
      "POSE: He stands three-quarters to screen-right, leaning on his crook, the",
      "weight of his body relaxed into the staff. His expression is one of quiet",
      "contentment and amusement (perhaps at the foolishness of lowland folk). His",
      "gaze is calm and at-peace, looking toward the far hills. One hand rests on",
      "the crook, the other hangs at his side. His bearing is one of earned",
      "peace and deep connection to the land — he belongs to the mountains in",
      "ways that few understand.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "ranger_kamelia",
    name: "The Mountain Ranger",
    description: [
      "A MOUNTAIN RANGER OR BORDER GUARD in his fifties, skilled and cautious.",
      "Approximately 5'10\", lean-muscled and strong, with the physique of",
      "someone who hikes difficult terrain daily. His skin is pale mountain-white,",
      "weathered but not darkly so. His hair is dark with grey, worn short for",
      "practical reasons (less to grab in combat). His eyes are sharp and",
      "intelligent, the eyes of a tracker and hunter. His face is weathered and",
      "scarred (minor scars from wilderness encounters), and his expression is one",
      "of professional competence and quiet intelligence. He moves with the",
      "economy of motion of someone completely at home in wild terrain.",
      "",
      "He wears the practical dress of a mountain ranger: a fur-lined cloak in",
      "deep grey or brown, designed for high-altitude weather (warm, durable,",
      "muted color). Beneath it, leather armor or a studded jerkin, practical",
      "rather than ornamental. Dark breeches and sturdy leather boots, scuffed",
      "from mountain travel. At his waist, a sword (longsword, serviceable), a",
      "hunting knife, and various pouches. Over his back, a strung bow and a",
      "quiver of arrows, ready for use. On his wrist, a leather bracer marked",
      "with his ranger's badge or mark (symbolic, identifying him to other",
      "rangers). In his hand, he holds a hooded hawk or falcon (his companion, a",
      "mark of his ranger status).",
      "",
      "POSE: He stands three-quarters to screen-right, his weight balanced and",
      "ready. The hawk rests on his arm, held with practiced ease. His other hand",
      "rests on his sword pommel. His expression is calm and alert, his gaze",
      "sharp, evaluating. His bearing is one of quiet competence and deep",
      "knowledge of wild places — he is at home in the mountains in ways that",
      "most humans have forgotten.",
    ].join("\n"),
    isHostile: false,
  },

  // ════════════════════════════════════════════════════════════════
  // WILDERNESS (8 NPCs)
  // ════════════════════════════════════════════════════════════════

  {
    id: "archaeologist_lost",
    name: "The Obsessed Archaeologist",
    description: [
      "AN OBSESSED RUIN-EXPLORER or curse-breaker in his fifties, driven to the",
      "edge of madness by pursuit of lost knowledge. Approximately 5'9\"",
      "heavyset, with the pale bearing of someone who spends more time with",
      "books and ruins than sunlight. His skin is pale and covered with",
      "archaeological burns and sun-damage (showing his field work). His hair is",
      "dark, greying, usually bound back with a leather cord (for field work). His",
      "eyes are bright with obsessive intelligence, burning with the light of",
      "discovery. His hands are constantly moving, gesturing, pointing at",
      "artifacts or sketching in the air. His beard is thin and unkempt, as if",
      "grooming is irrelevant compared to his work. His expression is one of",
      "barely-contained mania — he has found something that has changed him.",
      "",
      "He wears the practical dress of a field archaeologist: a heavy canvas",
      "coat with multiple pockets (all filled with tools, tablets, rubbings, notes",
      "in various languages). Beneath it, a wool vest over a linen shirt. Dark",
      "breeches and worn leather boots, marked with ancient mud and dust. At his",
      "belt, measuring tools, brushes, chisels, various metal implements of",
      "unclear purpose. Around his neck, multiple protective charms or amulets",
      "(accumulated over decades, unclear if genuine magic or psychological",
      "comfort). In his hands, a leather-bound journal and a charcoal stick for",
      "sketching discoveries.",
      "",
      "POSE: He stands three-quarters to screen-right, but his posture is",
      "animated and tense, as if barely containing his excitement. One hand",
      "gestures as if explaining discoveries, the other holds his journal or",
      "points at something invisible to normal eyes. His expression is bright with",
      "obsessive intensity. His gaze is unfocused, looking inward at knowledge",
      "only he can see. The bearing is one of scholarly madness — the pursuit of",
      "secrets has rewired his mind.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "bedouin_desert",
    name: "The Bedouin Guide",
    description: [
      "A BEDOUIN DESERT GUIDE or sand-navigator in his forties, burned black by",
      "endless desert sun. Approximately 5'7\", lean and efficient-muscled, with",
      "the build of someone who conserves every ounce of energy in harsh",
      "environments. His skin is burned nearly black (NOT tan — burned, weathered,",
      "permanent). His face is sharp and weathered, every line telling a story of",
      "survival. His eyes are dark, intelligent, missing nothing. His hair is",
      "hidden beneath a turban of faded indigo, wrapped in the style of desert",
      "nomads. His beard is dark and kept neat despite the harsh environment.",
      "Ritual scars or tattoos mark his forearms (marks of his tribe or trade).",
      "His expression is calm and watchful, the bearing of someone completely at",
      "home in hostile terrain.",
      "",
      "He wears the traditional dress of Bedouin guides: a robe of indigo wool,",
      "wrapped in loose layers for protection against sun and cold nights. Over",
      "it, a fine leather vest decorated with small metals or shells (marks of",
      "his skill and experience). A length of rope serves as a belt, supporting",
      "various pouches and a curved sword in a simple sheath. At his side, a",
      "water-skin (precious in the desert), marked with ritual signs or owner-marks.",
      "His feet are shod in sandals made from camel-hide, designed for sand and",
      "heat. In his hand, he carries a compass made of brass and bone (beautiful",
      "and functional, clearly well-maintained). His bearing speaks to decades of",
      "desert navigation.",
      "",
      "POSE: He stands three-quarters to screen-right, weight balanced and ready.",
      "One hand holds his compass, examining it as if reading the sand itself.",
      "The other rests at his side, near his sword. His expression is calm and",
      "focused, his gaze level. His bearing is one of seasoned confidence and the",
      "deep knowledge of someone who has learned to read the desert like a book.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "survivor_jungle",
    name: "The Jungle Survivor",
    description: [
      "A JUNGLE SURVIVOR bearing serpent-cult scars or having escaped jungle",
      "thrall, in his thirties, marked and haunted. Approximately 5'9\", lean and",
      "wiry from jungle survival, with the hardness of someone who has lived on",
      "the edge of death. His skin is rich brown, darkened further by jungle sun.",
      "His body is covered with ritual scars (some fresh, some ancient) — parallel",
      "marks indicating either initiation into jungle tribes or marks of enslavement",
      "by the Serpent-cult. His eyes are intense and watchful, carrying the",
      "alertness of someone hunted. His hair is dark and worn long (jungle style),",
      "braided with small bones or shells. His expression is one of wariness and",
      "barely-contained violence — he has survived by being dangerous.",
      "",
      "He wears the practical dress of jungle survival: canvas breeches patched",
      "with whatever cloth could be salvaged, faded and stained with jungle",
      "moisture and decay. His chest is bare (showing the ritual scars), except",
      "for cord wrappings around his torso and upper arms (decoration or",
      "protection). His feet are bare, the soles tough and scarred. At his waist,",
      "a machete (well-used and sharp) and a pair of long knives. Around his neck,",
      "talismans (charms or warnings — unclear if protective or apotropaic) made",
      "of bone, wood, and woven fiber. A leather pouch at his hip (unknown",
      "contents, but carried carefully).",
      "",
      "POSE: He stands three-quarters to screen-right, but his stance is tense,",
      "ready to move in any direction. His hands are positioned near his weapons.",
      "His expression is watchful and guarded, his eyes missing nothing. His gaze",
      "carries the weight of things seen in the jungle. The bearing is one of",
      "dangerous competence and deep trauma — he has survived things that would",
      "break ordinary humans, and the survival has changed him fundamentally.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "scout_frontier",
    name: "The Frontier Scout",
    description: [
      "A CRAZED FRONTIER SCOUT or wilderness madman in his fifties, at the edge",
      "of sanity from too many years in the wild unknown. Approximately 5'10\",",
      "lean and strong, with the wiry build of someone who has crossed impossible",
      "terrain. His skin is burned and scarred, marked with old wounds and strange",
      "tattoos (meaning unclear, perhaps self-inflicted in moments of clarity or",
      "madness). His hair is long and wild, unkempt and matted, perhaps never",
      "properly groomed. His eyes are bright and unfocused, the eyes of someone",
      "whose mind is half in another reality. A wild beard frames his face,",
      "containing strange objects (twigs? small bones? unclear). His expression is",
      "one of agitated intensity and barely-contained madness — he has seen",
      "things that shattered his understanding of reality.",
      "",
      "He wears the remnants of civilized clothing, badly deteriorated: tattered",
      "breeches, the shreds of a shirt, leather armor that is more holes than",
      "material. Over it, a cloak woven from animal hides, stitched together with",
      "plant-fiber and sinew. Scattered across his body: talismans, charms,",
      "objects collected from the frontier (carved stones? strange metals? things",
      "that don't belong to any known culture). His feet are bare and marked with",
      "old frostbite and strange scars. In his hands, a spear or quarterstaff made",
      "from strange material, carved with symbols that hurt to look at.",
      "",
      "POSE: He stands three-quarters to screen-right, but his posture is erratic",
      "and tense, as if barely able to remain still. His eyes are wide and",
      "unfocused, looking at things beyond normal sight. His hands are clenched or",
      "gesturing at invisible threats. His expression is one of agitated intensity",
      "and fractured awareness. The bearing is one of someone who has ventured",
      "beyond the mapped world and returned broken, his mind scattered across",
      "realities.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "pirate_isles",
    name: "The Red Isles Pirate",
    description: [
      "A PIRATE CAPTAIN OR CORSAIR in his fifties, scarred and dangerous.",
      "Approximately 5'11\", powerfully built, with the physique of someone trained",
      "in combat and command. His skin is burned bronze by endless ocean sun",
      "(NOT tan in the gentle sense — burned by sun-glare and salt-spray). His",
      "hair is dark and long, worn in sailor fashion with small braids containing",
      "rings and charms (trophies or marks of rank, unclear). His eyes are dark",
      "and intense, sharp with predatory intelligence. A cruel scar runs from his",
      "right brow across his nose to his left cheek (old wound, badge of",
      "survival). He is missing an eye-tooth on his left side, visible when his",
      "lip curls (result of combat or disease). His expression is one of casual",
      "cruelty and complete confidence — he takes what he wants, and few dare",
      "resist.",
      "",
      "He wears the garb of a pirate commander: a linen shirt (bright red,",
      "salt-stained), open at the chest to the waist (showing a hairy, scarred",
      "chest marked with ritual tattoos). Over it, a leather coat (fine quality,",
      "taken as plunder) with blood-stains that don't quite wash out. At his",
      "waist, a wide leather belt supporting three weapons: a cutlass (curved,",
      "well-used), a pair of long knives, and possibly a flintlock pistol",
      "(visible weight, though the weapon is drawn for the portrait). Dark",
      "breeches of fine cloth (plundered) and boots of supple leather, scuffed by",
      "deck-work. On his wrists, silver bracelets (plundered, worn as trophies).",
      "",
      "POSE: He stands three-quarters to screen-right, with the relaxed confidence",
      "of a predator assessing prey. One hand rests on his sword pommel, the other",
      "holds a drinking-vessel (rum, probably). His expression is sardonic and",
      "cruel, his eyes calculating. His bearing is one of earned authority and the",
      "confidence of someone feared and respected by his crew. He is completely at",
      "ease with violence and command.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "scholar_sunken",
    name: "The Sunken City Scholar",
    description: [
      "A SCHOLAR OR SALVAGER studying sunken Mu ruins, in his sixties, obsessed",
      "with underwater secrets. Approximately 5'8\", lean and scholarly, with pale",
      "skin indicating years spent indoors with texts and underwater expeditions",
      "(protected from sun). His hair is white or very grey, worn long and tied",
      "back. His eyes are pale and intense, missing nothing, the eyes of someone",
      "who reads small details and understands their significance. His hands are",
      "stained with ink and salt-residue from examining ancient artifacts. His",
      "expression is one of scholarly intensity and the slight obsession of",
      "someone who has dedicated his life to understanding dead civilizations.",
      "",
      "He wears the practical dress of an ocean-going scholar: a fine linen coat",
      "of cream or pale blue (salt-stained and weathered), over a wool vest. Dark",
      "breeches and fine leather boots, both marked with salt-damage and careful",
      "maintenance (the salt damage resisted, cared for despite being inevitable).",
      "At his belt, various tools: measuring implements, magnifying glasses, small",
      "chisels and brushes (for examining artifacts). Around his neck, on leather",
      "cords, several small carved shells or stone artifacts (examples of his",
      "study, kept as reference). In his hands, a leather-bound journal and a",
      "piece of carved shell (from Mu, clearly precious to him).",
      "",
      "POSE: He stands three-quarters to screen-right, leaning slightly forward in",
      "an attitude of intense examination. One hand holds his artifact, the other",
      "gestures as if explaining its significance. His expression is rapt with the",
      "intensity of scholarly discovery. His gaze is focused inward, seeing",
      "implications only he understands. The bearing is one of devoted scholarship",
      "and the patience required to unlock the secrets of sunken worlds.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "monk_sanctuary",
    name: "The Temple Monk",
    description: [
      "A PEACEFUL MONK or spiritual seeker in his forties, radiant with inner",
      "peace. Approximately 5'6\", slight and graceful, with the bearing of someone",
      "who has learned to inhabit their body with full awareness. His skin is pale",
      "and smooth, showing care and protection from the sun. His hair is dark,",
      "worn in a simple style (perhaps shaved head or short-cropped, depending on",
      "tradition). His eyes are warm and clear, the eyes of someone at peace with",
      "themselves and the world. A calm smile plays at the corners of his mouth.",
      "His expression radiates a kind of serene joy — he has found what others",
      "spend lifetimes seeking.",
      "",
      "He wears the simple robes of a temple monk: undyed linen or wool, simple",
      "in cut, dyed or faded to pale grey or cream. The robes are immaculate but",
      "humble, neither ornate nor threadbare. Around his waist, a simple cord of",
      "braided natural fiber. On his feet, simple sandals or bare feet,",
      "intentionally unadorned. At his neck, perhaps a simple prayer-bead",
      "necklace (roughly carved from wood, hand-made by devotees). He carries",
      "nothing but a wooden staff (simple and gnarled), not for support but as a",
      "ritual object or walking-meditation tool.",
      "",
      "POSE: He stands three-quarters to screen-right, in a posture of relaxed",
      "grace. His weight is balanced, his body aligned with effortless grace. One",
      "hand rests on his staff, the other is raised in a gesture of blessing or",
      "greeting (open-palmed, offering rather than defending). His expression is",
      "one of genuine peace and compassion, his gaze warm and accepting. His",
      "bearing is one of achieved enlightenment or spiritual depth — he has",
      "transcended the struggles that torment most humans.",
    ].join("\n"),
    isHostile: false,
  },

  {
    id: "climber_zalgara",
    name: "The Frostbitten Climber",
    description: [
      "A FROSTBITTEN MOUNTAIN CLIMBER or high-altitude explorer in his fifties,",
      "bearing the marks of extreme altitude. Approximately 5'8\", lean and hard,",
      "with the physique of someone who has pushed the body to inhuman limits.",
      "His skin is burned and marked with frostbite scars (visible on his fingers,",
      "ears, nose — patches of pale scarred tissue where flesh was lost and",
      "regrew). His hair is dark and unkempt, worn long (perhaps as an offering or",
      "vow). His eyes are bright and slightly mad with the intensity of someone",
      "who has reached the edge of the world and returned. A wild beard frames his",
      "face, and his expression carries the light of someone who has touched the",
      "divine or the terrible. He laughs at danger because he has already",
      "conquered the strongest force in the world.",
      "",
      "He wears the practical dress of an extreme climber: heavy wool and leather,",
      "marked with ice-damage and the wear of serious mountaineering. Multiple",
      "layers (visible at the cuffs and neck) provide insulation for high-altitude",
      "cold. A fur-lined cloak or parka covers everything. Around his waist, a",
      "rope and climbing equipment. On his hands, leather gloves reinforced for",
      "climbing (frostbitten fingertips visible despite protection). On his feet,",
      "special climbing boots, worn from traversing ice and rock. At his side, an",
      "ice-axe (marked with use, well-maintained, clearly precious). On his back,",
      "a rucksack containing climbing gear and supplies. His bearing speaks to",
      "mastery of extreme conditions.",
      "",
      "POSE: He stands three-quarters to screen-right, but with an energy that",
      "suggests barely-contained movement. One hand grips his ice-axe, the other",
      "is raised in a gesture that might be greeting or celebration. His",
      "expression is bright with adrenaline and the wild joy of someone who has",
      "mastered impossible challenges. His gaze is unfocused, perhaps remembering",
      "the peaks. The bearing is one of extreme competence and the confidence of",
      "someone who laughs at danger because he has already conquered mountains.",
    ].join("\n"),
    isHostile: false,
  },
];

// ── Generation ──────────────────────────────────────────────────────

function buildPrompt(npc: NpcSpec): string {
  const framing = npc.isHostile ? FRAMING_LEFT : FRAMING_ALLY;
  const overlay = npc.isHostile ? ["\n", UGLY_MEAN_OVERLAY, ""] : [];
  return [STYLE_ANCHOR, "", npc.description, ...overlay, "", framing].join("\n");
}

async function callGrokImaginePro(prompt: string): Promise<string> {
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "3:4",
    resolution: "2k",
  } as Parameters<typeof grok.images.generate>[0] & {
    aspect_ratio: string;
    resolution: string;
  });
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok Imagine returned no image data");
  return b64;
}

// FRAMING_LEFT for hostile NPCs facing screen-LEFT
const FRAMING_LEFT = [
  "3:4 vertical portrait. Pure clean opaque white (#FFFFFF) studio backdrop",
  "filling the entire frame. Full body visible from head to feet, the figure",
  "filling 80-87% of the frame vertically with feet at the bottom edge and",
  "modest empty white space above the head. Body angled three-quarters toward",
  "screen-LEFT (HOSTILE orientation, opposing the ally right-facing).  Even soft",
  "warm studio lighting from the upper-left, no harsh shadows. NO scenery, NO",
  "floor, NO ground line, NO shadow under the feet, NO border, NO text, NO other",
  "figures.",
].join(" ");

const UGLY_MEAN_OVERLAY = [
  "UGLY-AND-MEAN OVERLAY: the face reads as visibly UNPLEASANT and HOSTILE.",
  "Add at least three of: a broken or off-center NOSE, YELLOWED/CHIPPED/SNAGGLE",
  "TEETH, a SCOWL or SNEER, deep facial SCARS or pockmarks, UNWASHED/GREASY",
  "appearance, a torn or notched EAR, sun-cracked LIPS, deep CROW'S-FEET in a",
  "hard frown. The expression is pure threat — no charm, no nobility, no softness.",
].join(" ");

function nextStartingIndex(outDir: string): number {
  if (!fs.existsSync(outDir)) return 1;
  const existing = fs
    .readdirSync(outDir)
    .map((name) => /^v(\d+)\.png$/.exec(name))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => parseInt(m[1]!, 10));
  if (existing.length === 0) return 1;
  return Math.max(...existing) + 1;
}

async function forgeNpc(
  npc: NpcSpec,
  snapshotId: string | undefined,
): Promise<{ generated: number; failed: number }> {
  const outDir = path.join(root, "public", "art", "npcs", npc.id, "master");
  fs.mkdirSync(outDir, { recursive: true });
  const prompt = buildPrompt(npc);

  const promptPath = path.join(outDir, "_prompt.txt");
  fs.writeFileSync(promptPath, prompt + "\n");

  const startIndex = nextStartingIndex(outDir);
  const endIndex = startIndex + candidateCount - 1;

  console.log("");
  console.log(`── ${npc.id}: ${npc.name} ──`);
  console.log(`  Output dir: ${outDir}`);
  console.log(`  Naming: v${startIndex}…v${endIndex}`);
  console.log(`  Cost this NPC: ~$${(candidateCount * 0.07).toFixed(2)}`);

  let generated = 0;
  let failed = 0;
  for (let i = startIndex; i <= endIndex; i++) {
    const outPath = path.join(outDir, `v${i}.png`);
    console.log(`  generating candidate v${i}…`);
    try {
      const b64 = await callGrokImaginePro(prompt);
      console.log(`    raw image received (${Math.round((b64.length * 0.75) / 1024)} KB)`);
      console.log(`    running rembg…`);
      const pngBuffer = await grokImageToTransparentPng(b64);
      fs.writeFileSync(outPath, pngBuffer);
      const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`  ✓ wrote ${outPath} (${sizeKb} KB)`);
      const relPath = `/${path.relative(path.join(root, "public"), outPath).split(path.sep).join("/")}`;
      await recordPromptForSprite({
        spritePath: relPath,
        prompt,
        promptRulesSnapshotId: snapshotId,
        defaultSizeClass: "C",
      });
      generated++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ v${i} FAILED: ${msg}`);
    }
  }
  return { generated, failed };
}

async function main(): Promise<void> {
  const targetIds = onlyArg
    ? new Set(onlyArg.slice("--only=".length).split(",").map((s) => s.trim()))
    : null;
  const npcs = targetIds
    ? DESTINATION_NPCS.filter((n) => targetIds.has(n.id))
    : DESTINATION_NPCS;
  if (npcs.length === 0) {
    console.error(`ERROR: --only filter matched no NPCs.`);
    process.exit(1);
  }

  console.log(`Forging ${npcs.length} destination room NPC sprite(s) × ${candidateCount} candidates each`);
  console.log(`Total estimated cost: ~$${(npcs.length * candidateCount * 0.07).toFixed(2)}`);

  let snapshotId: string | undefined;
  try {
    snapshotId = (await loadStandingRules()).snapshotId;
  } catch {
    snapshotId = undefined;
  }

  let totalGenerated = 0;
  let totalFailed = 0;
  for (const npc of npcs) {
    const r = await forgeNpc(npc, snapshotId);
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
    console.log("Review generated NPCs in public/art/npcs/{npc_id}/master/ directories.");
    console.log("Rename selected v{N}.png → master.png to set as primary for the NPC.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
