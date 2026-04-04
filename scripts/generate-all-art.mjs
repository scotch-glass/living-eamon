/**
 * Batch-generate UO-style inventory icons via xAI Grok image API.
 *
 * ID fixes (user list had duplicate art IDs):
 * - Hoe: 3890 (was duplicate of Sewing Kit 3720)
 * - Rope: 5362 (was duplicate of Key 3827)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

const envRaw = fs.readFileSync(envPath, "utf8");
const envLine = envRaw.split(/\r?\n/).find((l) => l.trim().startsWith("GROK_API_KEY="));
if (!envLine) {
  console.error("ERROR: GROK_API_KEY not found in .env.local");
  process.exit(1);
}
const GROK_API_KEY = envLine
  .slice("GROK_API_KEY=".length)
  .trim()
  .replace(/^["']|["']$/g, "");

if (!GROK_API_KEY) {
  console.error("ERROR: GROK_API_KEY is empty");
  process.exit(1);
}

const STYLE_BLOCK = `Classic Ultima Online 2D inventory icon sprite. Flat 2D pixel-art illustration style, NOT photorealistic, NOT 3D rendered. Pure true black background #000000, no gradients, no glow, no shadow cast. Hard pixel-clean edges, no anti-aliasing. Centered, filling 75% of frame. Hard flat shading: bright highlights upper-left, deep shadows lower-right. No text, no labels, no border, no frame. Game inventory icon — clean, isolated, readable at small sizes.`;

/** @type {{ id: number; name: string; description?: string; skip?: boolean }[]} */
const ITEMS = [
  { id: 5049, name: "Short Sword", description: "A short straight double-edged steel sword with a plain crossguard and leather-wrapped hilt. Blade is wider near the tip. Steel grey blade, brown hilt wrap, small silver crossguard." },
  { id: 3937, name: "Long Sword", description: "A straight double-edged longsword with a simple crossguard. Longer than a short sword, tapered to a point. Steel grey blade with a visible fuller groove down the center, brown leather hilt, silver pommel and crossguard." },
  { id: 5051, name: "Katana", description: "A slightly curved single-edged Japanese-style sword. Elegant curve, thin blade, lacquered black hilt with diamond wrap pattern, circular tsuba guard. Steel grey blade with subtle polish line." },
  { id: 5121, name: "Kryss", description: "A wavy-bladed stiletto dagger with a serpentine or flame-shaped blade. Very narrow, deeply wavy steel blade, small crossguard, short hilt. Like a wavy spike." },
  { id: 5053, name: "Dagger", description: "A short double-edged dagger. Very short blade, wide crossguard, stubby hilt with a round pommel. Plain steel blade, leather wrapped hilt." },
  { id: 5116, name: "War Axe", description: "A single-handed war axe with a wide crescent-shaped steel blade on one side and a short spike on the back. Long enough handle for one hand. Steel blade, wooden shaft." },
  { id: 5119, name: "Halberd", description: "A two-handed polearm with a large axe blade on one side, a spike on top, and a hook on the back. Very long wooden shaft. Oriented diagonally in frame. Steel blade with axe head and spike tip, dark oak shaft." },
  { id: 5055, name: "Bow", description: "A recurve bow, unstrung, curved gracefully. Wide arc shape filling most of the frame. Dark polished wood with string. No arrow. The bow curves toward the viewer slightly." },
  { id: 5057, name: "Crossbow", description: "A heavy crossbow with a wide wooden stock, steel prod (the bow part), and a stirrup at the front. The bow arm extends horizontally. Viewed from above at slight angle. Dark wood stock, steel prod, visible trigger mechanism." },
  { id: 5113, name: "Bardiche", description: "A long polearm with a large single-edged curved blade attached to a long wooden shaft. The blade is wide and sweeping. Oriented diagonally. Steel blade, dark wood shaft." },
  { id: 5115, name: "Battle Axe", description: "A two-handed battle axe with large symmetrical double blades on each side of the shaft. Wide double-crescent steel head, long wooden handle. Oriented near-vertically or slightly diagonal." },
  { id: 5117, name: "Broad Sword", description: "A wide flat double-edged broadsword, wider than a long sword. Slightly tapering blade with a wide fuller, simple crossguard, leather hilt. Steel grey, brown hilt." },
  { id: 5118, name: "Cutlass", description: "A slightly curved single-edged sword with a basket guard protecting the hand. The guard is a curved steel cage shape. Curved steel blade, complex basket hilt guard." },
  { id: 5120, name: "Executioner's Axe", description: "A large two-handed execution axe with a very wide single-sided curved blade, long wooden handle. The blade is massive and dominates the icon. Steel blade, dark wood." },
  { id: 5122, name: "Large Battle Axe", description: "A massive two-handed axe with very large symmetrical double blades. Even larger than a battle axe. Wide double crescent steel head, long shaft." },
  { id: 5123, name: "Long Sword (two handed)", description: "An extra-long two-handed sword with a longer grip and longer blade than a standard longsword. The grip is noticeably longer to accommodate two hands." },
  { id: 5124, name: "Mace", description: "A one-handed blunt weapon with a flanged steel head (4-6 flanges or fins radiating from a central ball) on a short wooden or metal handle. Steel head, dark handle." },
  { id: 5125, name: "Maul", description: "A large two-handed blunt weapon with a heavy cylindrical wooden or steel head on a long wooden shaft. Like a large hammer or mallet. Very heavy-looking head." },
  { id: 5126, name: "Pitchfork", description: "A farming pitchfork repurposed as a weapon. Two or three long steel tines on a long wooden handle. Oriented diagonally. Simple and rustic." },
  { id: 5127, name: "Scimitar", description: "A curved single-edged sword with a wide pronounced curve, wider near the tip. No complex guard. Gleaming curved steel blade, simple hilt." },
  { id: 5128, name: "Skinning Knife", description: "A small curved blade used for skinning animals. Short curved blade, no crossguard, simple wooden handle. Very small, utilitarian." },
  { id: 5040, name: "Spear", description: "A long wooden spear shaft with a steel leaf-shaped spearhead at the top. Oriented diagonally. Long dark wood shaft, gleaming steel tip." },
  { id: 5084, name: "Short Spear", description: "A shorter version of the spear. Steel leaf-shaped spearhead on a shorter wooden shaft. Oriented diagonally." },
  { id: 5085, name: "War Fork", description: "A polearm with a two-pronged fork head like a large tuning fork on a long wooden shaft. Two parallel steel prongs, long shaft. Oriented diagonally." },
  { id: 5086, name: "Black Staff", description: "A long magical black wooden staff. Straight, slightly gnarled, very dark black-brown wood. No ornament. Oriented near-vertically." },
  { id: 5087, name: "Gnarled Staff", description: "A gnarled twisted wooden staff, natural and irregular. Lighter brown wood with knots and curves. Oriented near-vertically." },
  { id: 5088, name: "Quarter Staff", description: "A plain long wooden fighting staff, straight and uniform. Medium brown wood. Oriented near-vertically or diagonal." },
  { id: 5089, name: "Hammer Pick", description: "A weapon combining a hammer head on one side and a pick spike on the other, on a medium handle. Steel head, wooden handle." },
  { id: 5090, name: "War Hammer", description: "A two-handed war hammer with a large heavy square steel head on a long wooden handle. Massive steel head, long dark handle." },
  { id: 5091, name: "Scepter", description: "An ornamental weapon shaped like a royal scepter. A decorated handle with a large ornate ball or flanged head at top. Gold or silver finish with gem accents." },
  { id: 5092, name: "War Mace", description: "A heavy flanged mace with more prominent flanges than a regular mace. Steel head with 6+ flanges, medium handle." },
  { id: 5093, name: "Club", description: "A simple wooden club. A thick piece of dark wood wider at the striking end than the handle end. Very primitive." },
  { id: 5095, name: "Butcher Knife", description: "A wide rectangular-bladed butcher's knife. Wide flat blade with a spine, wooden handle. Utilitarian kitchen/weapon item." },
  { id: 5096, name: "Cleaver", description: "A heavy rectangular cleaver blade, wider than a butcher knife, on a short wooden handle. Very wide flat steel blade." },
  { id: 5097, name: "Pickaxe", description: "A mining pickaxe with a curved pick head on a wooden handle. One pointed end, one blunt flat end on the pick head. Tool/weapon." },
  { id: 5098, name: "Bow (short bow)", description: "A simple shorter bow, less curved than a recurve. Straight limbs with slight curve. Lighter wood than the recurve bow." },
  { id: 5142, name: "Repeating Crossbow", description: "A crossbow with a magazine box on top for bolts. Heavier and more complex than a regular crossbow. Has a visible bolt magazine on the top of the stock." },

  { id: 5143, name: "Plate Tunic", skip: true },
  { id: 5138, name: "Plate Helm", description: "A full enclosed plate helm viewed from the front-side. Rounded dome shape with a T-shaped or slit visor opening. Steel grey with hard shading. Flat bottom with neck protection flare." },
  { id: 5139, name: "Plate Gorget", description: "A plate gorget (neck armor). A curved steel collar piece that protects the neck. Wide at the top, slightly narrower at the bottom, with overlap hinges on the sides. Steel grey, relatively flat and small." },
  { id: 5140, name: "Plate Gloves", description: "A pair of articulated plate gauntlets. Segmented steel finger plates, knuckle bar across the top, wider cuff at the wrist. Both gloves shown together overlapping or side by side." },
  { id: 5141, name: "Plate Arms", description: "Plate arm armor (rerebraces and vambraces). Cylindrical segmented steel sleeve showing both pieces — the upper arm and lower arm sections separated by an elbow cop. Steel grey with rivets." },
  { id: 5144, name: "Plate Skirt", description: "A plate skirt (fauld and tasset). Wide articulated steel plates forming a skirt-like shape below the waist. Multiple horizontal bands tapering to the bottom, wider than tall." },
  { id: 5145, name: "Plate Female Chest", description: "Female-specific plate chest armor with a more contoured shape than the male plate. Articulated bands, center seam, pauldron tabs. Steel grey. Visually similar to plate tunic but slightly different silhouette." },
  { id: 5146, name: "Plate Legs", description: "Plate leg armor. Two cylindrical leg pieces with knee cops visible. Articulated steel bands showing thigh and shin sections with round knee protection. Steel grey, viewed from front." },
  { id: 5101, name: "Plate Arms (variant)", description: "An alternate plate arm armor design. Slightly different arm plate shape showing articulated segments." },

  { id: 5129, name: "Chain Coif", description: "A chainmail coif (head covering). Shows a rounded hood of interlocking steel rings. The mesh texture of chainmail is visible — small interlocking rings. Steel grey with a blue-grey tint, visible ring texture." },
  { id: 5130, name: "Chain Legs", description: "Chainmail leggings. Two leg-shaped pieces of interlocking steel rings. The chainmail ring mesh texture is visible. Steel grey-blue tint." },
  { id: 5131, name: "Chain Tunic", description: "A chainmail shirt/hauberk. A torso piece made of interlocking steel rings. Shows the mesh texture of chainmail across a tunic shape. Steel grey-blue, ring mesh visible." },

  { id: 5103, name: "Ring Mail Chest", description: "Ring mail chest armor. A leather or padded torso with steel rings riveted across the surface in a pattern. Brown leather base with steel rings visible as a pattern of circles." },
  { id: 5104, name: "Ring Mail Gloves", description: "Ring mail gloves. Leather gloves with steel rings riveted over the back. Brown leather with steel ring pattern on the back of the hand." },
  { id: 5105, name: "Ring Mail Helm", description: "A ring mail helm. A leather or padded cap with steel rings, simpler than plate. Brown leather base with steel ring pattern." },
  { id: 5106, name: "Ring Mail Legs", description: "Ring mail leggings. Leather pants with steel rings riveted across them. Brown leather with steel ring pattern." },

  { id: 5107, name: "Studded Leather Chest", description: "Studded leather chest armor. A leather tunic with small metal studs (dome-shaped rivets) covering the surface in a pattern. Dark brown leather with rows of small silver dome studs." },
  { id: 5108, name: "Studded Leather Gloves", description: "Studded leather gloves. Dark brown leather gloves with silver dome studs across the knuckles and back of hand." },
  { id: 5109, name: "Studded Leather Gorget", description: "A studded leather neck guard. Dark brown leather collar with silver dome studs." },
  { id: 5110, name: "Studded Leather Helm", description: "A studded leather cap/helm. Dark brown leather cap with silver dome studs across it." },
  { id: 5111, name: "Studded Leather Arms", description: "Studded leather arm guards. Dark brown leather sleeves with silver dome studs along the outside." },
  { id: 5112, name: "Studded Leather Legs", description: "Studded leather leggings. Dark brown leather pants-shape with silver dome studs across them." },

  { id: 5066, name: "Leather Cap", description: "A simple leather cap. A round dome-shaped cap in medium brown leather. No studs, no metal. Simple stitching visible at the brim." },
  { id: 5067, name: "Leather Gorget", description: "A leather gorget. A curved leather neck piece in medium brown. Simple collar shape with no studs." },
  { id: 5068, name: "Leather Gloves", description: "Leather gloves. Plain medium brown leather gloves, both shown together. No studs, simple stitching." },
  { id: 5070, name: "Leather Arms", description: "Leather arm guards. Medium brown leather sleeve pieces for the arms. Simple and plain." },
  { id: 5072, name: "Leather Chest", description: "Leather chest armor. A medium brown leather vest/tunic shape. Simple, no studs, stitching at edges." },
  { id: 5074, name: "Leather Legs", description: "Leather leggings. Medium brown leather leg pieces. Simple and plain." },
  { id: 5075, name: "Leather Skirt", description: "A leather skirt/kilt-style armor piece. Medium brown leather, wider than tall, kilt or skirt shape." },
  { id: 5076, name: "Leather Shorts", description: "Leather shorts for armor. Medium brown leather, shorter than leggings." },
  { id: 5077, name: "Leather Bustier", description: "A female leather bustier chest piece. Form-fitting medium brown leather torso armor." },
  { id: 5078, name: "Leather Skirt (female)", description: "Female leather skirt armor. Medium brown leather, feminine silhouette." },

  { id: 5011, name: "Buckler", description: "A small round buckler shield. Small circular steel shield with a central boss (rounded dome protrusion). Steel grey with a darker rim and visible central boss." },
  { id: 5013, name: "Wooden Shield", description: "A classic kite-shaped wooden shield. Wide at top, tapering to a rounded point at the bottom. Wood grain texture, dark brown, with a central steel boss and steel rim edging." },
  { id: 5015, name: "Kite Shield", description: "A steel kite shield. Same kite shape as wooden shield but in steel. Steel grey, visible central boss, steel rim. May have a simple heraldic line division." },
  { id: 5017, name: "Heater Shield", description: "A heater-shaped shield (flat top, angled sides, rounded bottom point). Steel plate, steel grey, simple center ridge." },
  { id: 5019, name: "Chaos Shield", description: "A decorative shield with a chaos symbol or irregular shape. Dark steel with glowing blue or arcane markings." },
  { id: 5021, name: "Order Shield", description: "A decorative shield with an order/law symbol. Silver steel with gold markings or emblem." },
  { id: 5023, name: "Bronze Shield", description: "A round bronze-colored shield. Circular shape, bronze/copper colored metal, central boss." },
  { id: 5025, name: "Metal Shield", description: "A large round metal shield. Full circle, steel grey, central boss, visible rivets around rim." },
  { id: 5027, name: "Metal Kite Shield", description: "A large metal kite shield, heavier than the kite shield. Steel grey, kite shape, prominent central boss." },

  { id: 3703, name: "Backpack", description: "A classic leather adventurer's backpack. Brown leather with straps, buckles, and a front flap. Plump and full-looking. The iconic UO backpack shape — wide and rounded with visible strap hardware." },
  { id: 3701, name: "Pouch", description: "A small leather drawstring pouch. Brown leather bag gathered at the top with a drawstring cord tie. Small, round-bottomed." },
  { id: 3699, name: "Bag", description: "A cloth bag with a drawstring. Lighter colored than the leather pouch, slightly larger. Gathered at top with a tied string." },
  { id: 3650, name: "Wooden Chest", description: "A small wooden treasure chest. Rectangular with a rounded lid, metal hinges and latch, wood grain texture. Classic treasure chest shape. Dark brown wood, gold metal hardware." },
  { id: 3648, name: "Large Wooden Chest", description: "A larger wooden chest, same style as small chest but bigger and more prominent. Dark wood, gold hardware." },
  { id: 3713, name: "Metal Chest", description: "A metal strongbox/chest. Rectangular, flat-lidded or slightly rounded lid, steel grey metal, visible hinge and latch hardware." },

  { id: 3962, name: "Black Pearl", description: "A single large lustrous black pearl, or a small pile of black pearls. Round, glossy, deep black with a subtle iridescent highlight. Simple, small, centered on black background." },
  { id: 3963, name: "Bloodmoss", description: "A clump of deep red moss. Dark crimson-red organic moss with irregular edges. Slightly rough texture. Small pile or clump centered." },
  { id: 3972, name: "Garlic", description: "A garlic bulb. Classic round white garlic bulb with papery skin and a small stem at top. White with cream-yellow highlights, some purple tint at the base." },
  { id: 3974, name: "Ginseng", description: "A ginseng root. Pale tan forked root shape, like a small man-shaped root. Beige-tan, slightly gnarled." },
  { id: 3975, name: "Mandrake Root", description: "A mandrake root. Dark brown twisted root, slightly humanoid shape. Rough dark earth tones, gnarly texture." },
  { id: 3976, name: "Nightshade", description: "Nightshade berries on a small stem. Small cluster of dark purple-black round berries on a short green stem. Dark and slightly sinister looking." },
  { id: 3981, name: "Spider's Silk", description: "A ball of spider silk. A white or off-white fuzzy ball of spider web silk. Slightly translucent, fluffy appearance." },
  { id: 3980, name: "Sulfurous Ash", description: "A small pile of yellow-grey sulfurous ash powder. A mounded pile of ashy yellow-grey powder. Rough granular appearance." },

  { id: 3821, name: "Gold Coin", description: "A pile of gold coins. Multiple stacked and scattered gold coins. Bright golden yellow, circular coins with simple edge detail. Classic RPG gold pile appearance." },

  { id: 3851, name: "Heal Potion", description: "A small rounded glass potion bottle filled with bright red liquid. Round flask shape with a short neck and cork stopper. The liquid is vivid blood-red, glowing slightly. Glass highlights on the bottle surface." },
  { id: 3847, name: "Cure Potion", description: "A small rounded glass potion bottle filled with yellow-green liquid. Same bottle shape as heal potion. Vivid yellow-green, slightly murky." },
  { id: 3849, name: "Agility Potion", description: "A small rounded glass potion bottle filled with bright blue liquid. Same bottle shape. Vivid sky blue." },
  { id: 3853, name: "Strength Potion", description: "A small rounded glass potion bottle filled with orange-red liquid. Same bottle shape. Deep orange with red tints." },
  { id: 3843, name: "Explosion Potion", description: "A small rounded glass potion bottle filled with bright orange liquid with visible bubbles or sparks inside. Orange with yellow glowing highlights suggesting volatile contents." },
  { id: 3845, name: "Poison Potion", description: "A small rounded glass potion bottle filled with dark green murky liquid. Deep forest green, slightly opaque." },
  { id: 3841, name: "Refresh Potion", description: "A small rounded glass potion bottle filled with light blue-white liquid. Pale blue, clear, refreshing looking." },
  { id: 3852, name: "Mana Potion", description: "A small rounded glass potion bottle filled with bright blue liquid. Deep sapphire blue, slightly glowing." },
  { id: 3855, name: "Total Refresh Potion", description: "A small rounded glass potion bottle filled with bright white-blue liquid. Bright white-blue, very clear and luminous." },

  { id: 3617, name: "Bandage", description: "A rolled cloth bandage. White or off-white cloth bandage rolled into a cylinder. Simple white fabric." },
  { id: 3622, name: "Scissors", description: "A pair of tailor's scissors. Classic oval-ring handle scissors, steel blades, silver handle rings." },
  { id: 3720, name: "Sewing Kit", description: "A sewing kit with needles and thread. Small wooden spool or case with thread and needles visible." },
  { id: 3725, name: "Tinker's Tools", description: "A set of small tinkering tools. Various small metal tools — pliers, file, screwdriver — together in a bundle or small pouch." },
  { id: 3731, name: "Smith's Hammer", description: "A blacksmith's hammer. Heavy flat-headed metal hammer with wooden handle. Wider flat steel head, dark wood handle." },
  { id: 5359, name: "Lockpick", description: "A metal lockpick. A thin bent metal pick used for opening locks. Long thin steel pin with a curved hooked tip." },
  { id: 3827, name: "Key", description: "A small iron key. Classic skeleton key shape with a round hole bow and a simple notched blade. Iron grey." },
  { id: 3834, name: "Map", description: "A rolled parchment map. Scrolled up parchment paper tied with a red ribbon. Tan-beige parchment color." },
  { id: 3828, name: "Bottle", description: "An empty glass bottle. Clear glass rounded flask with cork. Transparent glass with subtle light refraction highlights." },

  { id: 1965, name: "Spell Scroll", description: "A rolled parchment spell scroll with magical runes. Partially unrolled showing arcane symbols. Cream parchment with glowing blue or gold ink runes." },
  { id: 1869, name: "Recall Rune", description: "A small carved stone rune. A flat oval or rounded stone with a glowing magical symbol carved into it. Dark grey stone with blue-glowing etched rune." },
  { id: 4011, name: "Spellbook", description: "A closed spellbook. A thick book with a dark blue or black leather cover and a brass clasp. Gold spine lettering or magical symbol on the cover." },
  { id: 3823, name: "Gate Crystal", description: "A glowing magical crystal. A faceted gem or crystal that glows with inner arcane light. Deep blue or purple with internal glow." },

  { id: 3999, name: "Fishing Pole", description: "A wooden fishing pole with a line. Long thin wooden rod with fishing line hanging from the tip. Simple and rustic." },
  { id: 3565, name: "Shovel", description: "A digging shovel. Classic spade-head metal shovel on a long wooden handle. Oriented diagonally. Steel blade, dark wood handle." },
  { id: 3890, name: "Hoe", description: "A garden hoe. Wide flat steel blade at right angles to a long wooden handle. Tool for farming." },
  { id: 3910, name: "Axe (lumberjack)", description: "A lumberjack's felling axe. Wide curved single-sided blade on a long wooden handle. Larger blade than a war axe, more practical working appearance." },
  { id: 3480, name: "Torch", description: "A lit torch. A wrapped cloth-and-wood torch with a bright orange-yellow flame at the top. The flame flickers and glows. Dark wrapped handle." },
  { id: 3532, name: "Candle", description: "A lit candle in a holder. Small wax candle with a yellow flame, in a simple metal or ceramic holder. Wax drips down the side." },
  { id: 5362, name: "Rope", description: "A coil of rope. A coiled loop of thick brown hemp rope." },

  { id: 5443, name: "Cloak", description: "A folded or displayed cloak. A flowing cloak shown front-on or slightly gathered. Deep red, blue or dark color, with a clasp at the neck." },
  { id: 5424, name: "Robe", description: "A full-length robe shown flat. Long garment, flowing shape, dark color (grey, brown, or dark blue). Simple hood optional at top." },
  { id: 5426, name: "Fancy Robe", description: "An ornate robe with decorative trim. Similar to plain robe but with visible gold or colored trim along the edges." },
  { id: 5048, name: "Monk's Robe", description: "A plain monk's robe in dark grey or dark brown. Austere, belted at the waist, long." },
  { id: 5402, name: "Shirt", description: "A plain cloth shirt. Simple linen tunic or shirt shape. Light cream or white, loose-fitting medieval style." },
  { id: 5399, name: "Pants", description: "A pair of cloth pants. Simple brown or grey medieval hose/pants." },
  { id: 5397, name: "Shoes", description: "A pair of leather shoes. Simple low medieval leather shoes, brown, viewed from the side." },
  { id: 5901, name: "Boots", description: "A pair of knee-high leather boots. Dark brown, showing the shaft of the boot and toe. Classic adventurer's boots." },
];

function buildPrompt(item) {
  const itemPart = `ITEM: ${item.name}\n\n${item.description}`;
  return `${STYLE_BLOCK}\n\n${itemPart}`;
}

const DELAY_MS = 600;
const outDir = path.join(root, "public", "uo-art", "items");

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateOne(item) {
  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: buildPrompt(item),
      n: 1,
      response_format: "b64_json",
    }),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response: ${text.slice(0, 500)}`);
  }

  if (!res.ok) {
    throw new Error(JSON.stringify(json, null, 2));
  }

  const b64 = json?.data?.[0]?.b64_json ?? null;
  if (!b64) {
    throw new Error(`No b64_json: ${JSON.stringify(json, null, 2)}`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${item.id}.png`);
  fs.writeFileSync(outFile, Buffer.from(b64, "base64"));
}

async function main() {
  let generated = 0;
  let skippedExists = 0;
  let skippedFlag = 0;
  let failed = 0;

  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
    if (item.skip) {
      skippedFlag++;
      continue;
    }
    if (!item.description) {
      console.warn(`Skipping ${item.name} (ID: ${item.id}) — no description`);
      skippedFlag++;
      continue;
    }

    const outFile = path.join(outDir, `${item.id}.png`);
    if (fs.existsSync(outFile)) {
      skippedExists++;
      continue;
    }

    process.stdout.write(`Generating ${item.name} (ID: ${item.id})... `);
    try {
      await generateOne(item);
      console.log("done");
      generated++;
    } catch (e) {
      console.log("FAILED");
      console.error(e.message || e);
      failed++;
    }

    await delay(DELAY_MS);
  }

  console.log("");
  console.log("--- Summary ---");
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (already exists): ${skippedExists}`);
  console.log(`Skipped (skip flag / no description): ${skippedFlag}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total items in list: ${ITEMS.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
