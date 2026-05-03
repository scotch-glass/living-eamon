// ========================================================================
// LIVING EAMON — Style-LoRA reference generator (Grok Imagine Pro)
//
// Generates 100 Thurian-Age sword-and-sorcery scene images in the painted-
// realism style of Frank Frazetta, Boris Vallejo, Ken Kelly, and Frank
// Brunner — the locked four-painter canon. These become the training corpus
// for a Scenario.gg style LoRA on Flux 2 Dev (~$7 + ~53 min).
//
// **THIS FILE IS THE CANONICAL PROMPT LIBRARY** for the style LoRA training
// run. Per Scotch's directive 2026-04-26, all Grok prompts get saved in
// the codebase so we accumulate institutional knowledge of what prompt
// language works. Never delete prompts from this file — only add to it
// or annotate FAILED ones in comments.
//
// Three subject categories (Scotch's spec):
//   A. Barbarian warrior vs black-haired savages (40 prompts)
//   B. Barbarian warrior vs orc horde         (30 prompts)
//   C. Barbarian warrior vs dark sorcerer     (30 prompts)
//
// Each prompt = single locked style anchor + per-image narrative subject +
// locked closer (no text, no borders, full-bleed).
//
// Usage:
//   npx tsx scripts/scenario/forge-style-refs.ts            # generate all missing
//   npx tsx scripts/scenario/forge-style-refs.ts --force    # regenerate all
//   npx tsx scripts/scenario/forge-style-refs.ts --slugs=savages-01,orcs-12  # specific
//   npx tsx scripts/scenario/forge-style-refs.ts --dry-run  # print prompts and exit
//
// Output: public/art/painter-curation/manual/grok-style/{slug}.jpg
// Cost: ~$0.07/image. 100 images = ~$7.00.
// Rate: Pro RPS=1, sleep 2s between calls.
// Resumable: existing files are skipped unless --force.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

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

// ── Locked prompt scaffolding (don't edit without re-discussing with Scotch) ──
//
// Style anchor: leads every prompt. Locked four-painter canon.
const STYLE_ANCHOR =
  "Painted-realism scene in the spirit of Frank Frazetta, Boris Vallejo, " +
  "Ken Kelly, and Frank Brunner.";

// Setting frame: locks the era so Grok doesn't drift to modern fantasy.
const SETTING_FRAME =
  "Thurian Age sword-and-sorcery setting — pre-Hyborian, primal, raw, mythic.";

// Mood + technical closer: every prompt closes with these constants. Heavy
// chiaroscuro is what gives Frazetta/Vallejo paintings their trademark
// dramatic depth.
const CLOSER =
  "Cinematic composition with heavy chiaroscuro lighting and painterly " +
  "brushwork. Muted earth-tone palette with dramatic warm/cool contrast. " +
  "No text, no borders, no watermarks, no logos. Full-bleed.";

export interface Subject {
  slug: string;
  aspect: "3:4" | "16:9";
  subject: string;
}

// ── 100 narrative subjects ─────────────────────────────────────────────
//
// PROMPT-LANGUAGE NOTES (2026-04-26):
// - Lean mid-action OR post-combat — avoid explicit gore (Grok content
//   moderation rejects "decapitated," "severed," etc.).
// - "black-haired savages" not "dark-skinned" — Howard canon palette is
//   99% European/Mediterranean per feedback_howard_skin_palette memory.
// - Orcs are NOT Howard-canon but are within Frazetta/Vallejo's painted
//   subject range (Goblin Reaver, etc.) — fine for STYLE training.
// - Each subject ~30-50 words; specific narrative moment + setting +
//   atmospheric detail.
export const SUBJECTS: Subject[] = [
  // ── A. Barbarian vs black-haired savages (40 prompts) ───────────────
  { slug: "savages-01", aspect: "3:4", subject: "Olive-skinned barbarian warrior, sword raised mid-stride, charging a black-haired Atlantean raider whose flint spear has just splintered against the warrior's iron-rimmed shield; jungle ferns shaking around them; emerald light filtering through canopy." },
  { slug: "savages-02", aspect: "16:9", subject: "Lone barbarian on a windswept cliff edge, axe in each hand, standing over the bodies of three black-haired tribal raiders; storm-darkened sea below; longships of more raiders approaching the rocks." },
  { slug: "savages-03", aspect: "3:4", subject: "Barbarian, blood streaming from a temple wound, parries a flint-tipped spear from a snarling raven-haired savage in the mouth of a basalt cave; two more savages emerging from deeper shadow behind." },
  { slug: "savages-04", aspect: "16:9", subject: "Barbarian astride the broken statue of a forgotten serpent god, sword high; black-haired tribal warriors attempt to climb the rubble pile from all sides; lightning forking the dawn sky above." },
  { slug: "savages-05", aspect: "3:4", subject: "Barbarian knee-deep in a moonlit tide pool, locked grip-to-grip with a black-haired sea-raider whose obsidian dagger inches toward his throat; foam-edged surf, distant longships on horizon." },
  { slug: "savages-06", aspect: "3:4", subject: "Barbarian, his fur cloak smoldering, drives a sword through the painted shield of a tattooed black-haired berserker in a smoking longhouse; roof timbers collapsing, full moon framed in collapsing thatch." },
  { slug: "savages-07", aspect: "16:9", subject: "Barbarian crouched on a swaying rope bridge over a deep gorge, flint arrows from black-haired hunters whistling past; the bridge half-cut behind him, mist rising from the river below." },
  { slug: "savages-08", aspect: "3:4", subject: "Barbarian in mid-leap from one rocky ledge to another, sword extended for the strike on a charging savage warlord; far below, a torchlit war-camp of black-haired raiders." },
  { slug: "savages-09", aspect: "16:9", subject: "Barbarian standing alone on a snowfield among the strewn bodies of seven slain raven-haired raiders, chest heaving, breath visible in cold air; vultures circling against pale dawn." },
  { slug: "savages-10", aspect: "3:4", subject: "Barbarian protecting a bare-breasted kneeling woman in a torn silken robe behind him, broadsword raised against three approaching black-haired Atlantean raiders; ruined marble columns of a fallen civilization at sunset." },
  { slug: "savages-11", aspect: "3:4", subject: "Barbarian wading thigh-deep across a black-water river, sword held high, pursued by three swimming black-haired raiders; reeds along the bank, rain falling slantwise." },
  { slug: "savages-12", aspect: "16:9", subject: "Barbarian on the deck of a captured longship, axe sweeping back, black-haired sea-raiders falling into the surf around the prow; storm clouds, breaking dawn behind." },
  { slug: "savages-13", aspect: "3:4", subject: "Barbarian backed against the wall of a basalt watchtower, sword and shield raised against four black-haired tribesmen converging from a narrow stone stairwell; torchlight only." },
  { slug: "savages-14", aspect: "16:9", subject: "Barbarian charging on horseback through a war-camp of black-haired raiders at midnight, sword cleaving through the air; tents burning, raiders scattering, sparks lifting on the wind." },
  { slug: "savages-15", aspect: "3:4", subject: "Barbarian in a swamp, calf-deep in green water, sword crossing the spear of a black-haired marsh-tribesman; mist coiling between cypress roots, distant croak of unseen reptiles." },
  { slug: "savages-16", aspect: "3:4", subject: "Barbarian crouched behind a broken wagon on a dusty road, listening; black-haired bandit silhouettes visible at the road's bend, just before he springs his ambush; midday shadow." },
  { slug: "savages-17", aspect: "16:9", subject: "Barbarian and a single black-haired savage warlord, both bloodied, locked in single combat on a stone dueling-circle ringed by silent black-haired tribesmen and torch-bearers." },
  { slug: "savages-18", aspect: "3:4", subject: "Barbarian dragging the unconscious body of a fallen comrade out of a burning hut, sword clenched in one hand to ward off a black-haired raider closing through the smoke." },
  { slug: "savages-19", aspect: "16:9", subject: "Barbarian on a high mountain pass at sunrise, two black-haired scouts already dead at his feet in the snow; a column of more raiders winding up the path far below." },
  { slug: "savages-20", aspect: "3:4", subject: "Barbarian in a hidden grove sharpening his sword on a flat stone, two black-haired hunters approaching unseen behind him through the ferns; afternoon light through canopy." },
  { slug: "savages-21", aspect: "3:4", subject: "Barbarian wading from a beach pulling a bare-breasted wounded woman in tattered silks on a rope behind him; black-haired raiders pursuing along the shoreline; moonlit surf and burning ship behind." },
  { slug: "savages-22", aspect: "16:9", subject: "Barbarian on the parapet of a primitive stone fortress, sword raised, calling defiance at a horde of black-haired raiders massing on the plain below; banners snapping in storm wind." },
  { slug: "savages-23", aspect: "3:4", subject: "Barbarian deflecting a thrown axe with his shield mid-stride, the black-haired thrower recoiling with empty hands; ruined temple courtyard littered with bodies; afternoon dust in the air." },
  { slug: "savages-24", aspect: "16:9", subject: "Barbarian fighting back-to-back with a bare-breasted tattooed female warrior in a leather loinwrap, both wielding swords against a half-circle of black-haired raiders in a forest clearing at twilight." },
  { slug: "savages-25", aspect: "3:4", subject: "Barbarian climbing a sheer cliff face one-handed, sword in his teeth, two black-haired pursuers below firing arrows at him; surf hammering the rocks." },
  { slug: "savages-26", aspect: "3:4", subject: "Barbarian crouched over the body of a slain great cat, head turning sharply as black-haired raiders emerge from trees behind him; jungle clearing, falling rain." },
  { slug: "savages-27", aspect: "16:9", subject: "Barbarian leading a small band of fellow warriors in a charge across a frozen lake, ice cracking beneath them, a much larger force of black-haired raiders rallying on the far shore." },
  { slug: "savages-28", aspect: "3:4", subject: "Barbarian in mid-throw of a heavy javelin at a black-haired chief on a war-totem; the chief's followers freezing in shock; ceremonial bonfires casting firelight." },
  { slug: "savages-29", aspect: "16:9", subject: "Barbarian and a black-haired raider warlord locked in combat atop a swaying war-elephant, mahout already fallen; battle on the plain below smaller in scale but just visible." },
  { slug: "savages-30", aspect: "3:4", subject: "Barbarian crawling from a crevasse, hand gripping a stone idol, black-haired tribesmen searching with torches in the canyon below; moonlight on snowy peaks." },
  { slug: "savages-31", aspect: "3:4", subject: "Barbarian standing in a circular stone arena under a ringed sky, taunting two black-haired champions who circle him with curved blades; crowd in shadow." },
  { slug: "savages-32", aspect: "16:9", subject: "Barbarian charging on foot toward a black-haired raider's chariot at the moment the chariot's wheel snaps; horses panicking, dust and arrows in the air." },
  { slug: "savages-33", aspect: "3:4", subject: "Barbarian wading out of a foaming sea cave with a stolen idol in one arm, sword in the other hand, black-haired pirate raiders silhouetted on rocks above." },
  { slug: "savages-34", aspect: "16:9", subject: "Barbarian holding a narrow stone bridge against a press of black-haired tribal warriors; the bridge cracking under their weight; below, a chasm filled with churning fog." },
  { slug: "savages-35", aspect: "3:4", subject: "Barbarian in a slave-pen, having just broken his chain on the post-iron, turning toward an entering black-haired guard whose torch lights the doorway; other captives crouched in shadow." },
  { slug: "savages-36", aspect: "3:4", subject: "Barbarian crouched low at the lip of a basalt rooftop, watching a torchlit procession of black-haired priests below carrying an unconscious bare-breasted noblewoman in torn ceremonial silks to an altar." },
  { slug: "savages-37", aspect: "16:9", subject: "Barbarian leading a charge of horsed warriors across the broken courtyard of a sacked palace; black-haired raiders fleeing through smoke and toppled statues; sunset palette." },
  { slug: "savages-38", aspect: "3:4", subject: "Barbarian standing chest-deep in a ritual pool, sword pointed at a bare-breasted black-haired witch in scant ceremonial drapes on the rim, her ceremonial fire dying behind her; algae and lotus on the water surface." },
  { slug: "savages-39", aspect: "3:4", subject: "Barbarian crouched in tall yellow grass watching a black-haired hunting party pass; one of them turning, sensing him; warm late-afternoon savanna light." },
  { slug: "savages-40", aspect: "16:9", subject: "Barbarian on the prow of a war-canoe gliding into mist toward a tribal village; black-haired villagers visible on the docks just beginning to react; gray dawn, no wind." },

  // ── B. Barbarian vs orc horde (30 prompts) ──────────────────────────
  { slug: "orcs-01", aspect: "16:9", subject: "Barbarian warrior alone on a rocky outcrop, sword raised, holding back a tide of green-skinned orcs surging up the slope below; storm sky cracking above; banners on broken spears among the dead." },
  { slug: "orcs-02", aspect: "3:4", subject: "Barbarian mid-swing of a two-handed axe through the press of grey-skinned orcs, blade trailing motion blur; broken palisade burning behind him; midnight scene lit only by burning timbers." },
  { slug: "orcs-03", aspect: "16:9", subject: "Barbarian on horseback at the head of a small mounted band, charging a vast horde of pig-faced orcs across a windswept plain at dawn; dust kicked up, sun low and red on the horizon." },
  { slug: "orcs-04", aspect: "3:4", subject: "Barbarian backed against the great iron-bound gate of a primitive stone fortress, sword and shield raised against a wedge of green-skinned orcs charging through the broken portcullis; arrows in his shield." },
  { slug: "orcs-05", aspect: "16:9", subject: "Barbarian standing on a fallen statue's torso in a ruined plaza, fighting two orc-chiefs at once while smaller orcs scatter; ancient columns toppled, fire-glow from a burning temple." },
  { slug: "orcs-06", aspect: "3:4", subject: "Barbarian dragging a wounded comrade away from a burning watchtower while a knot of grey-skinned orcs pursue with torches; cold rain, churned mud underfoot." },
  { slug: "orcs-07", aspect: "16:9", subject: "Barbarian on a high stone bridge, holding the narrow span single-handed against a press of orcs from one end while villagers flee across the other; valley fog obscuring whatever waits below." },
  { slug: "orcs-08", aspect: "3:4", subject: "Barbarian leaping from a rocky shelf onto the back of a massive orc warlord on a raised war-totem; smaller orcs scattering at the impact; ritual fires guttering in the wind." },
  { slug: "orcs-09", aspect: "16:9", subject: "Barbarian mounted on a war-stallion charging through a burning orc encampment; tents collapsing, orcs scrambling for weapons; sparks rising in the night sky toward distant peaks." },
  { slug: "orcs-10", aspect: "3:4", subject: "Barbarian in a frozen mountain pass, breath misting, sword raised, surrounded on three sides by green-skinned mountain orcs; blood already on the snow; ridgelines stark against a winter sky." },
  { slug: "orcs-11", aspect: "16:9", subject: "Barbarian holding the steps of a stepped pyramid against orcs climbing from below; priests at the top of the pyramid frozen mid-ritual; full moon halved by storm clouds." },
  { slug: "orcs-12", aspect: "3:4", subject: "Barbarian with a notched broadsword, post-combat, standing knee-deep in fallen orcs in a torchlit cave; one wounded orc still crawling away; eyes of more orcs glinting in deeper shadow." },
  { slug: "orcs-13", aspect: "16:9", subject: "Barbarian leading a small band on a forced retreat through a burning forest, an orc horde visible in the distance through smoke; the band's banner ragged and singed." },
  { slug: "orcs-14", aspect: "3:4", subject: "Barbarian in mid-fall from a collapsing rope bridge, sword still in hand, an orc archer on the far cliff drawing another arrow; gorge below filled with mist." },
  { slug: "orcs-15", aspect: "16:9", subject: "Barbarian commanding a rallying line of warriors in front of a stone village, a wave of orcs cresting the hill behind; villagers behind the line raising bows; gray storm light." },
  { slug: "orcs-16", aspect: "3:4", subject: "Barbarian crouched on a beam of a partially collapsed temple roof, blade ready, listening to orc voices below as torchlight moves through the rubble; full moon through broken dome." },
  { slug: "orcs-17", aspect: "16:9", subject: "Barbarian and a small band defending the entrance of a sea cave at high tide as orc-rowers pull boats toward the cave mouth; surf already breaking on the boats, lanterns swinging." },
  { slug: "orcs-18", aspect: "3:4", subject: "Barbarian wrestling a hulking grey-skinned orc berserker over the edge of a cliff, both teetering on the brink; far below, an orc encampment with a hundred small fires." },
  { slug: "orcs-19", aspect: "16:9", subject: "Barbarian wading across a shallow river crossing while orcs on horseback approach from the far bank; his comrades already on the near bank readying spears; willows hanging over the water." },
  { slug: "orcs-20", aspect: "3:4", subject: "Barbarian, sword raised in salute over the body of a fallen orc chieftain on a hilltop battlefield, smaller orcs already fleeing in the valley; banners of victory being raised behind him." },
  { slug: "orcs-21", aspect: "16:9", subject: "Barbarian on the deck of a longship boarding action against an orc raiding vessel, both ships locked together in heavy seas; orc archers on the rigging; lightning flickering overhead." },
  { slug: "orcs-22", aspect: "3:4", subject: "Barbarian collapsing against a moss-grown standing stone after combat, sword across his knees, orc bodies scattered around; two crows watching from the stone's top; gray afternoon light." },
  { slug: "orcs-23", aspect: "16:9", subject: "Barbarian scaling the outer wall of an orc fortress at night, knife in his teeth, two orc sentries silhouetted against torchlight on the wall above; moonlight glinting off the climbing rope." },
  { slug: "orcs-24", aspect: "3:4", subject: "Barbarian in a torchlit dungeon corridor, having just smashed open a cell door, a chained captive blinking in the sudden light; orc sounds approaching from the far end of the corridor." },
  { slug: "orcs-25", aspect: "16:9", subject: "Barbarian and his warband cresting a ridge to discover an entire orc war-camp spread across the valley below; campfires by the thousand; the band's leader raising a hand for silence." },
  { slug: "orcs-26", aspect: "3:4", subject: "Barbarian fighting in flooded ruins, knee-deep in rain-water, a green-skinned orc shaman raising a staff at him from a crumbled altar; reflection of lightning in the standing water." },
  { slug: "orcs-27", aspect: "16:9", subject: "Barbarian leading a raid on an orc supply train, wagons burning, draught beasts panicking, orc teamsters fleeing; smoke rolling across a dry plain at midday." },
  { slug: "orcs-28", aspect: "3:4", subject: "Barbarian crouched on a high rock outcrop sniping with a bow at orcs marching below; quiver nearly empty; ravens circling against pale sky." },
  { slug: "orcs-29", aspect: "16:9", subject: "Barbarian and a hooded ally meeting in a snowy clearing at midnight to plan, an orc patrol's torches visible through trees in the middle distance; breath misting in cold air." },
  { slug: "orcs-30", aspect: "3:4", subject: "Barbarian, both hands on his sword, standing alone in a circle of dead orcs at dawn on the lip of a primitive stone amphitheater; mist rising from the killing ground; new sun cutting horizontal across the scene." },

  // ── C. Barbarian vs dark sorcerer (30 prompts) ──────────────────────
  { slug: "sorcerer-01", aspect: "3:4", subject: "Barbarian leaping through a sheet of conjured green flame to drive his sword toward a dark sorcerer at a black stone altar; the sorcerer's hands raised in counter-spell, eyes glowing white." },
  { slug: "sorcerer-02", aspect: "16:9", subject: "Barbarian on the steps of a basalt ziggurat, sword raised, while a dark sorcerer at the apex summons a tentacled shadow from a smoking pit; lightning along the horizon." },
  { slug: "sorcerer-03", aspect: "3:4", subject: "Barbarian shoulder-checking a dark sorcerer mid-incantation, the sorcerer's grimoire spilling across an obsidian floor; conjured smoke-figures dissipating in midair; rune-light fading." },
  { slug: "sorcerer-04", aspect: "16:9", subject: "Barbarian and a robed dark sorcerer locked in close combat at the rim of a vast crystal-lit cavern; the sorcerer's staff smoking, the barbarian's blade gleaming under cold blue light." },
  { slug: "sorcerer-05", aspect: "3:4", subject: "Barbarian stepping through smoke into a torchlit ritual chamber as a dark sorcerer recoils mid-summoning; a half-formed demon dispersing back into shadow; bare-breasted female captive in torn silks chained to the altar." },
  { slug: "sorcerer-06", aspect: "16:9", subject: "Barbarian charging on horseback up a winding tower stair (cutaway view), a dark sorcerer at the top of the spire raising a hand to call down lightning; storm sky overhead." },
  { slug: "sorcerer-07", aspect: "3:4", subject: "Barbarian deflecting a bolt of crackling sorcery with the flat of his shield, the dark sorcerer's eyes wide in shock, ritual circle of glowing runes between them on temple flagstones." },
  { slug: "sorcerer-08", aspect: "16:9", subject: "Barbarian striding across a frozen lake under a green aurora toward a dark sorcerer's ice-tower silhouette; conjured wraiths drifting between the warrior and the tower." },
  { slug: "sorcerer-09", aspect: "3:4", subject: "Barbarian crouched behind a fallen stone pillar in a temple courtyard, a dark sorcerer's scrying flame searching for him from the altar; blue ghost-light playing across his face." },
  { slug: "sorcerer-10", aspect: "16:9", subject: "Barbarian and a dark sorcerer at opposite ends of a narrow stone bridge over a chasm of red sorcerous fire; the sorcerer's robes whipping in the updraft of flame." },
  { slug: "sorcerer-11", aspect: "3:4", subject: "Barbarian smashing a glowing crystal sphere with a thrown sword, the dark sorcerer beyond it reeling as the bound demon inside dissipates; underground laboratory of bottles and tomes." },
  { slug: "sorcerer-12", aspect: "16:9", subject: "Barbarian climbing the rope of a chain-supported brazier toward a dark sorcerer's high gallery; the sorcerer leaning over the railing, summoning a flock of shadow-bats from his sleeves." },
  { slug: "sorcerer-13", aspect: "3:4", subject: "Barbarian, scorched and bloodied, dragging a captured dark sorcerer down a temple stair by the collar of his robe; the sorcerer's followers fleeing in disarray; smoke and ember light." },
  { slug: "sorcerer-14", aspect: "16:9", subject: "Barbarian on the parapet of a sea-cliff temple, sword pointed at a dark sorcerer hovering several feet above the floor in a column of black wind; ocean storm raging beyond the cliff." },
  { slug: "sorcerer-15", aspect: "3:4", subject: "Barbarian in mid-stride through a grand library of forbidden tomes, dark sorcerer at the far end raising a glowing relic; books flying off shelves in the magical wake; candles guttering." },
  { slug: "sorcerer-16", aspect: "16:9", subject: "Barbarian leading a small band into the open ritual circle of a swamp-cult; the dark sorcerer presiding from a torchlit dais; cult acolytes turning in shock; cypress trees and mist." },
  { slug: "sorcerer-17", aspect: "3:4", subject: "Barbarian wrestling a dark sorcerer's bone-clawed familiar, both of them rolling across the flagstones of a desecrated temple; the sorcerer in the background calling on a fading rune-light." },
  { slug: "sorcerer-18", aspect: "16:9", subject: "Barbarian on the deck of a war-galley as a dark sorcerer on an opposing ship calls a wall of black water from the sea; rowers panicking, sails ripping in the unnatural wind." },
  { slug: "sorcerer-19", aspect: "3:4", subject: "Barbarian standing knee-deep in the corpses of a slain cult, sword across his shoulders, dark sorcerer fleeing on a broken stairway behind him; firelight dimming; rune-circle erased." },
  { slug: "sorcerer-20", aspect: "16:9", subject: "Barbarian and a dark sorcerer riding war-beasts toward each other across a salt-pan; the sorcerer's beast a six-legged reptile, the barbarian's a black warhorse; sun directly overhead, no shadow." },
  { slug: "sorcerer-21", aspect: "3:4", subject: "Barbarian rappelling down the inside of a cylindrical tower, dark sorcerer at the bottom looking up in fury as the warrior cuts a brazier's chain to drop fire on the ritual circle." },
  { slug: "sorcerer-22", aspect: "16:9", subject: "Barbarian and a dark sorcerer atop the back of a slain dragon-beast, blades crossed, the dragon's last breath rising in steam; battlefield around them strewn with cult and warband alike." },
  { slug: "sorcerer-23", aspect: "3:4", subject: "Barbarian backed into the corner of a torchlit crypt, a dark sorcerer raising the dead from sarcophagi around them; skeletal warriors rising at the sorcerer's gesture; cold stone, dust." },
  { slug: "sorcerer-24", aspect: "16:9", subject: "Barbarian leading a freed slave-revolt through a burning sorcerer's temple complex, the dark sorcerer escaping into a portal of liquid shadow at the far end of the hall." },
  { slug: "sorcerer-25", aspect: "3:4", subject: "Barbarian breaking down a heavy iron-bound door with a single blow, revealing a dark sorcerer mid-ritual over a bare-breasted female captive in torn silks on a basalt slab; the sorcerer's familiar leaping toward the warrior." },
  { slug: "sorcerer-26", aspect: "16:9", subject: "Barbarian crossing a salt flat at midnight under twin moons toward the silhouette of a dark sorcerer's tower; the tower's apex flickering with green sorcery; warrior's cloak whipping in cold wind." },
  { slug: "sorcerer-27", aspect: "3:4", subject: "Barbarian, kneeling and dazed, sword half-raised, as a dark sorcerer leans over him, palm open with a glowing sigil hovering above it; the moment frozen before contact; lit only by the sigil." },
  { slug: "sorcerer-28", aspect: "16:9", subject: "Barbarian commanding a charge across a stone causeway toward an island ziggurat where a dark sorcerer raises a leviathan from black water; troops scattering as the leviathan breaches." },
  { slug: "sorcerer-29", aspect: "3:4", subject: "Barbarian, post-victory, standing with a foot on the chest of an unconscious dark sorcerer in a destroyed ritual chamber; broken altar, spilled grimoire, runes fading on the floor; one torch surviving." },
  { slug: "sorcerer-30", aspect: "16:9", subject: "Barbarian and a dark sorcerer high on the parapet of a desert ziggurat, the sorcerer levitating a half-formed sand-djinn between them; the warrior's blade slashing toward the djinn's core." },

  // ── D. Barbarian rescuing bare-breasted damsels (10 prompts) ────────
  // Added 2026-04-26 per Scotch's direction: the four-painter canon
  // (Frazetta + Vallejo especially) is bare-breasted-damsel-heavy and the
  // first 100 under-represented this. Vary anatomy explicitly per the
  // brief: small/perky, pointy/puffy, full/upturned, etc. Howard skin
  // palette per memory (mostly European/Mediterranean).
  { slug: "damsel-01", aspect: "3:4", subject: "Barbarian smashing through the doors of a sacrificial chamber where a bare-breasted blonde damsel with small perky breasts is bound spread-eagle on a basalt altar; black-robed cult priests recoiling in shock; torch-light, curling incense smoke; her tattered silken sash still around her hips." },
  { slug: "damsel-02", aspect: "3:4", subject: "Barbarian carrying an unconscious bare-breasted dark-haired damsel with full pointy breasts out of a burning sorcerer's tower; his fur cloak wrapped half-around her hips; flames roaring behind, stairway collapsing into the courtyard below." },
  { slug: "damsel-03", aspect: "16:9", subject: "Barbarian mid-charge across a temple plaza toward a bare-breasted red-haired damsel with puffy upturned breasts who has just shaken loose her bonds at a sacrificial pillar; a hulking demon already reaching for her with clawed hands." },
  { slug: "damsel-04", aspect: "3:4", subject: "Barbarian standing astride a fallen serpent-priest, a bare-breasted olive-skinned damsel with small high breasts crouched behind him gripping his thigh in relief; basalt obelisks, moonlight, ritual fires guttering out around them." },
  { slug: "damsel-05", aspect: "16:9", subject: "Barbarian pulling a bare-breasted dark-haired damsel with pointy youthful breasts out of a slave-pen iron cage; torchlit dungeon corridor, orc guards' bodies crumpled at the cage door, key-ring still in the warrior's hand." },
  { slug: "damsel-06", aspect: "3:4", subject: "Barbarian severing the ropes binding a bare-breasted blonde damsel with full puffy breasts strung up between two jungle trees as a great cat circles below; the damsel's eyes meeting the warrior's; rain-slick foliage; sword arcing through the rope." },
  { slug: "damsel-07", aspect: "16:9", subject: "Barbarian on the deck of a longship, having just thrown a black-haired raider overboard, helping a bare-breasted captive woman with small perky breasts to her feet; her tattered silken garments hanging at the waist; dawn breaking over choppy gray seas." },
  { slug: "damsel-08", aspect: "3:4", subject: "Barbarian smashing his shoulder through a heavy oaken door into a sorcerer's bedchamber, where a bare-breasted dark-haired damsel with high pointy breasts is chained at the wrists to a bedpost; the sorcerer fleeing through a far doorway, robes flapping behind him." },
  { slug: "damsel-09", aspect: "16:9", subject: "Barbarian scaling the side of a sacrificial step-pyramid at midnight, sword in his teeth, reaching up to free a bare-breasted blonde damsel with full puffy breasts bound at the wrists at the top of the steps; a black-robed priest mid-incantation just behind her." },
  { slug: "damsel-10", aspect: "3:4", subject: "Barbarian wading through a moonlit jungle stream carrying a bare-breasted bronze-skinned damsel with small perky breasts away from a burning village; her arms around his neck, his sword still bloody in his free hand; fireflies, distant flames behind." },
];

// ── CLI parsing (only when invoked as a script) ────────────────────────

const args = process.argv.slice(2);
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");
const slugsArg = args.find((a) => a.startsWith("--slugs="))?.slice("--slugs=".length);
const filterSlugs = slugsArg ? new Set(slugsArg.split(",").map((s) => s.trim())) : null;

const targets = filterSlugs
  ? SUBJECTS.filter((s) => filterSlugs.has(s.slug))
  : SUBJECTS;

if (filterSlugs && targets.length === 0) {
  console.error(`ERROR: --slugs filter matched zero subjects. Available slugs: ${SUBJECTS.map((s) => s.slug).join(", ").slice(0, 200)}…`);
  process.exit(1);
}

// ── Prompt builder ─────────────────────────────────────────────────────

function buildPrompt(subject: Subject): string {
  return [STYLE_ANCHOR, SETTING_FRAME, subject.subject, CLOSER]
    .map((s) => s.trim())
    .join(" ");
}

// ── Generation ─────────────────────────────────────────────────────────

const outDir = path.join(root, "public", "art", "painter-curation", "manual", "grok-style");

async function callGrok(prompt: string, aspect: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = await grok.images.generate({
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: aspect,
  } as any);
  const b64 = (resp as { data?: { b64_json?: string }[] }).data?.[0]?.b64_json;
  if (!b64) throw new Error("Grok returned no image data");
  return b64;
}

async function forgeOne(subject: Subject): Promise<"generated" | "skipped" | "failed"> {
  const outPath = path.join(outDir, `${subject.slug}.jpg`);
  if (fs.existsSync(outPath) && !force) {
    return "skipped";
  }
  const prompt = buildPrompt(subject);
  if (dryRun) {
    console.log(`\n  [DRY] ${subject.slug} (${subject.aspect}):`);
    console.log(`    ${prompt.slice(0, 250)}…`);
    return "skipped";
  }
  try {
    const b64 = await callGrok(prompt, subject.aspect);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
    const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  ✓ ${subject.slug.padEnd(14)} ${subject.aspect}  ${sizeKb} KB`);
    return "generated";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ ${subject.slug.padEnd(14)} ${subject.aspect}  FAILED: ${msg}`);
    return "failed";
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`── style-LoRA reference forge ──`);
  console.log(`  total subjects: ${SUBJECTS.length}`);
  console.log(`  targeting:      ${targets.length}`);
  console.log(`  output dir:     ${path.relative(root, outDir)}`);
  console.log(`  cost estimate:  $${(targets.length * 0.07).toFixed(2)}`);
  console.log(`  wall estimate:  ~${Math.ceil((targets.length * 32) / 60)} min`);
  if (force) console.log(`  --force: regenerating existing files`);
  if (dryRun) console.log(`  --dry-run: prompts only, no API calls`);
  console.log("");

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const subject = targets[i];
    process.stdout.write(`  [${(i + 1).toString().padStart(3)}/${targets.length}] `);
    const result = await forgeOne(subject);
    if (result === "generated") generated++;
    else if (result === "skipped") skipped++;
    else failed++;

    // Pro RPS=1 → 2s sleep between calls (skip sleep on the last item).
    if (i < targets.length - 1 && !dryRun && result === "generated") {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log("");
  console.log("─── Summary ───");
  console.log(`  Generated: ${generated}`);
  console.log(`  Skipped:   ${skipped}  (already existed; use --force to regenerate)`);
  console.log(`  Failed:    ${failed}`);
  if (generated > 0) {
    console.log(`  Approx cost this run: $${(generated * 0.07).toFixed(2)}`);
    console.log("");
    console.log(`  Next: run \`npm run painter:scan\` to add these to the curation manifest,`);
    console.log(`  then reload http://localhost:3000/art/painter-curation/qa.html and curate.`);
  }
}

// Only run main() when invoked as a script (not when imported from another
// module — e.g., train-style-lora.ts imports SUBJECTS without firing the
// generator).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
