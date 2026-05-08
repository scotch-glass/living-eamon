// ========================================================================
// LIVING EAMON — Vivian pose forge (LoRA training set generator)
//
// Generates training-set images for the Vivian Pony LoRA. Each call uses
// xAI's image-to-image edit endpoint with the LOCKED MASTER (vivian_master_v1.png)
// as the identity reference + a pose-specific prompt overlay. Output goes
// straight into scripts/lora/vivian/training-set/ ready for kohya training.
//
// Each output PNG also gets a sibling .txt caption file in the booru-tag
// schema documented at scripts/lora/vivian/CAPTIONS.md.
//
// Important: NO rembg pass — training images keep their white backgrounds.
// "simple background" is one of the captioned tags.
//
// Usage:
//   npx tsx scripts/forge-vivian-poses.ts                # all 50 poses
//   npx tsx scripts/forge-vivian-poses.ts --limit=1      # test one
//   npx tsx scripts/forge-vivian-poses.ts --start=10     # resume from #10
//   npx tsx scripts/forge-vivian-poses.ts --only=3,7,12  # specific ids
//   npx tsx scripts/forge-vivian-poses.ts --force        # overwrite existing
//
// Cost: ~$0.07 per pose (grok-imagine-image-pro via /v1/images/edits).
//       50 poses ≈ $3.50.
// ========================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const MASTER_PATH = path.join(root, "public", "art", "npcs", "vivian", "master", "vivian_master_v1.png");
const OUT_DIR = path.join(root, "scripts", "lora", "vivian", "training-set");

if (!fs.existsSync(MASTER_PATH)) {
  console.error(`ERROR: locked master not found at ${MASTER_PATH}`);
  console.error("Lock the master first (e.g. cp public/art/npcs/vivian/master/v6.png public/art/npcs/vivian/master/vivian_master_v1.png)");
  process.exit(1);
}

// ── CLI ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const force = args.includes("--force");
const limitArg = args.find((a) => a.startsWith("--limit="));
const startArg = args.find((a) => a.startsWith("--start="));
const onlyArg = args.find((a) => a.startsWith("--only="));

const limit = limitArg ? parseInt(limitArg.slice("--limit=".length), 10) : Infinity;
const start = startArg ? parseInt(startArg.slice("--start=".length), 10) : 1;
const onlySet = onlyArg
  ? new Set(onlyArg.slice("--only=".length).split(",").map((s) => parseInt(s, 10)))
  : null;

// ── Locked identity / costume / framing — extracted from the master prompt
//    so every pose generation includes the canonical anchors. ───────────

const LOCKED_STYLE = [
  "OIL PAINTING in the classic oil-painted fantasy-illustration style of",
  "Frank Frazetta, Gerald Brom, Boris Vallejo — visible painterly brush",
  "texture, warm romantic lighting, painted edges. NOT photographic, NOT",
  "3D render, NOT cartoon, NOT cel-shaded, NOT anime, NOT comic-book.",
].join(" ");

const LOCKED_IDENTITY = [
  "Subject: Vivian — a 20-year-old young adult woman, petite (5'2\"),",
  "athletic dancer-acrobat build with subtle visible muscle tone (toned",
  "bare arms with deltoid and bicep definition, faint flat-abdomen tone,",
  "defined calves and gluteal tone), narrow waist, narrow but feminine",
  "hips, small perky breasts (small/high/pert — NOT large, NOT busty).",
  "Fair pale skin with the faintest warm undertone (NOT ashen, NOT olive,",
  "NOT tan). Chestnut-auburn hair (warm brown with subtle copper-red glints)",
  "pulled back into a TIGHT HIGH PONYTAIL secured at the crown with a thin",
  "black leather cord, the bound length falling between her shoulder blades.",
  "Hair smooth and clean off her face — NO loose strands, NO bangs, NO wisps.",
  "Bright green almond-shaped eyes slightly upturned at the outer corners.",
  "Simple small silver ear studs. NO tattoos, NO moles, NO freckles, NO",
  "birthmarks, NO scars — clean unblemished skin. At her throat a fine",
  "silver chain holding a small closed silver locket.",
].join(" ");

const LOCKED_COSTUME = [
  "She wears tight black-leather thief's clothing: (1) sleeveless black-leather",
  "VEST with a deep V-neck running from her collarbones down between her small",
  "breasts, bare shoulders and arms exposed, the silver locket visible against",
  "bare skin within the V; (2) tight full-length black LEATHER PANTS reaching",
  "to her ankles (NOT shorts, NOT cropped, NOT a skirt); (3) BLACK LEATHER",
  "MOCCASINS — soft kid-leather slipper-like ankle-coverings with NO heels and",
  "NO hard sole, the drawstring laces tucked cleanly under the top edge. A",
  "PAIRED belt rig of dark-brown leather (one narrow at the waist, one wider",
  "slung lower across her hips) with a short sword in a plain dark-leather",
  "scabbard at her LEFT hip and several small dark-leather pouches at varying",
  "heights around her hips. NO armor, NO cloak, NO hood.",
].join(" ");

const LOCKED_FRAMING = [
  "Pose orientation: her body is angled three-quarters toward screen-RIGHT",
  "(ALLY orientation, the same direction the hero faces), feet planted",
  "comfortably. 3:4 vertical portrait. Pure clean opaque white (#FFFFFF)",
  "studio backdrop filling the entire frame. Full body visible from head to",
  "feet, the figure filling 80-87% of the frame vertically with feet at the",
  "bottom edge and modest empty white space above her head. Even soft warm",
  "studio lighting from the upper-left, no harsh shadows. NO scenery, NO",
  "floor, NO ground line, NO shadow, NO border, NO text, NO other figures.",
].join(" ");

// ── Pose specs ──────────────────────────────────────────────────────
//
// 50 perky casual poses. Each spec drives both the prompt (the
// pose-specific scene description) and the caption (booru tags
// matching the pose). All poses face 3/4 screen-right.

interface PoseSpec {
  id: number;                  // 1..50, used in filename v01..v50
  slug: string;                // short kebab-case id for the caption filename
  promptPose: string;          // pose-specific description for the Grok prompt
  promptExpression: string;    // expression description
  captionPose: string;         // booru pose tag(s)
  captionExpression: string;   // booru expression tag(s)
  captionAction?: string;      // optional booru action tag(s)
}

const POSES: PoseSpec[] = [
  { id: 1, slug: "hands-on-hips-smirk",
    promptPose: "She stands relaxed, weight on her right leg, both hands resting on her hips, looking back over her near (left) shoulder toward the viewer.",
    promptExpression: "A confident knowing smirk, eyes glinting, head turned slightly back toward the viewer.",
    captionPose: "standing, hand on hip, both hands on hips",
    captionExpression: "smirk, looking back, looking at viewer" },
  { id: 2, slug: "midstride-walking-back-glance",
    promptPose: "Captured mid-stride walking forward (toward screen-right), her right leg forward and weight shifting onto it, head turned back over her near shoulder toward the viewer.",
    promptExpression: "A flirty over-the-shoulder smile, eyes locked on the viewer.",
    captionPose: "walking, mid-stride",
    captionExpression: "looking back, looking at viewer, smile" },
  { id: 3, slug: "leaning-wall-ankles-crossed",
    promptPose: "Standing relaxed against an invisible wall (back resting where a wall would be), ankles crossed, weight back, hands hanging loose at her sides.",
    promptExpression: "A small calm smile, eyes meeting the viewer evenly.",
    captionPose: "leaning, leaning back, crossed legs, standing",
    captionExpression: "looking at viewer, slight smile" },
  { id: 4, slug: "crouched-scout",
    promptPose: "Crouched low on the balls of her feet, both knees bent, her right hand resting lightly on the ground for balance, left hand on her thigh, head tilted up scanning ahead toward screen-right.",
    promptExpression: "Alert focus, lips slightly parted, eyes narrow with concentration.",
    captionPose: "squatting, crouching",
    captionExpression: "serious, looking to the side, parted lips" },
  { id: 5, slug: "reaching-up-tiptoe",
    promptPose: "On the tips of her toes, stretched up to her full reach, her right arm extended high overhead toward an unseen handhold above her, left arm at her side for balance.",
    promptExpression: "Lips parted with effort, eyes upward toward her hand.",
    captionPose: "standing on tiptoes, reaching out, arm up, stretching",
    captionExpression: "looking up, parted lips" },
  { id: 6, slug: "hand-on-sword-hilt-alert",
    promptPose: "Standing with her right hand resting on the hilt of the short sword at her left hip (cross-draw grip), left arm relaxed at her side, weight forward.",
    promptExpression: "Calm but ready, jaw set, eyes scanning ahead.",
    captionPose: "standing, hand on hilt",
    captionExpression: "serious, looking to the side, closed mouth" },
  { id: 7, slug: "tossing-coin",
    promptPose: "Standing relaxed, right hand raised at chest height tossing a single small gold coin a few inches into the air, head tilted up watching the coin.",
    promptExpression: "Playful concentration, slight smile, eyes tracking the coin upward.",
    captionPose: "standing, holding coin, throwing",
    captionExpression: "looking up, slight smile" },
  { id: 8, slug: "counting-coins",
    promptPose: "Standing, head tilted down, both hands held cupped together in front of her at waist height, counting a small handful of mixed coins.",
    promptExpression: "Quiet absorbed concentration, lips slightly pursed.",
    captionPose: "standing, holding coin, counting",
    captionExpression: "looking down, closed mouth" },
  { id: 9, slug: "picking-lock",
    promptPose: "Standing slightly bent forward at the waist, both hands raised to invisible lock at chest height, working a thin lockpick between her thumb and forefinger.",
    promptExpression: "Deep focus, tongue tip just visible at the corner of her lips, eyes fixed on her hands.",
    captionPose: "standing, leaning forward",
    captionExpression: "looking down, parted lips, concentrating" },
  { id: 10, slug: "peeking-corner-shh",
    promptPose: "Standing pressed against an invisible corner, leaning her near shoulder forward to peek around it, right index finger pressed vertically against her lips.",
    promptExpression: "Conspiratorial wide-eyed smile, finger to lips in a 'shh' gesture.",
    captionPose: "standing, leaning forward, peeking",
    captionExpression: "shushing, finger to mouth, smile, looking to the side" },
  { id: 11, slug: "drawing-sword-mid-draw",
    promptPose: "Mid-draw of her short sword: right hand gripping the hilt and pulling the blade halfway out of the scabbard at her left hip, the steel half-revealed.",
    promptExpression: "A quick excited grin, eyes alight.",
    captionPose: "standing, holding sword, drawing weapon, unsheathing",
    captionExpression: "smile, grin, excited" },
  { id: 12, slug: "stretching-arms-overhead",
    promptPose: "Standing relaxed with both arms stretched high overhead, fingers loosely interlocked, back slightly arched, weight even on both feet.",
    promptExpression: "Eyes closed, content small smile, peaceful.",
    captionPose: "standing, arms up, stretching, both arms up",
    captionExpression: "closed eyes, slight smile" },
  { id: 13, slug: "sitting-barrel-knee-up",
    promptPose: "Sitting on an invisible low barrel or crate, her right foot flat on the ground, left knee drawn up with her foot resting on the seat, left forearm resting across her left knee.",
    promptExpression: "Relaxed small smile, eyes meeting the viewer's evenly.",
    captionPose: "sitting, knee up",
    captionExpression: "looking at viewer, slight smile" },
  { id: 14, slug: "examining-jewel",
    promptPose: "Standing, holding a small cut gemstone between the thumb and forefinger of her right hand, raised at eye level in front of her face, examining it.",
    promptExpression: "Curiosity, slightly raised eyebrow, lips parted.",
    captionPose: "standing, holding gem",
    captionExpression: "looking at object, parted lips" },
  { id: 15, slug: "telling-secret",
    promptPose: "Standing, leaning slightly toward the viewer, right hand cupped at the side of her mouth as if telling a secret.",
    promptExpression: "Mischievous grin, eyes wide and bright.",
    captionPose: "standing, leaning forward, hand to mouth",
    captionExpression: "grin, looking at viewer" },
  { id: 16, slug: "reaching-pouch",
    promptPose: "Standing, her right hand reaching down and back into one of the dark-leather pouches at her right hip, fingers slipping inside.",
    promptExpression: "Sideways flirt-glance at the viewer, slight smile, one eyebrow raised.",
    captionPose: "standing",
    captionExpression: "looking at viewer, smirk" },
  { id: 17, slug: "tying-ponytail",
    promptPose: "Standing, both arms raised behind her head, her hands working to retie the leather cord on her tight high ponytail.",
    promptExpression: "Casual concentration, lips slightly parted.",
    captionPose: "standing, arms up, hands in hair, adjusting hair",
    captionExpression: "parted lips, looking to the side" },
  { id: 18, slug: "eating-apple",
    promptPose: "Standing relaxed, holding a single round red apple at her mouth in her right hand, mid-bite, teeth pressed into the fruit.",
    promptExpression: "A small playful smile around the bite, eyes meeting the viewer.",
    captionPose: "standing, holding fruit, eating, holding food",
    captionExpression: "looking at viewer, eating" },
  { id: 19, slug: "arms-crossed-judging",
    promptPose: "Standing, weight on her right hip jutted out, both arms folded across her chest under her breasts.",
    promptExpression: "An amused 'I'm waiting' smirk, eyebrow slightly raised.",
    captionPose: "standing, crossed arms",
    captionExpression: "smirk, looking at viewer" },
  { id: 20, slug: "hand-on-locket",
    promptPose: "Standing relaxed, the fingertips of her right hand resting lightly on the small silver locket at her throat.",
    promptExpression: "Quiet soft smile, distant warm look in her eyes.",
    captionPose: "standing, hand on chest, jewelry",
    captionExpression: "looking to the side, slight smile" },
  { id: 21, slug: "sitting-crosslegged-listening",
    promptPose: "Sitting cross-legged on the ground, her right hand under her chin propping up her head with her elbow on her knee, listening intently.",
    promptExpression: "Curious attentive smile, head tilted slightly.",
    captionPose: "sitting, indian style, hand on chin",
    captionExpression: "looking at viewer, slight smile" },
  { id: 22, slug: "balanced-narrow-ledge",
    promptPose: "Standing on an invisible narrow surface (one foot directly in front of the other, balanced like on a tightrope), arms held out slightly to either side for balance.",
    promptExpression: "Calm focused breath, slight smile of concentration.",
    captionPose: "standing, balancing, walking",
    captionExpression: "looking to the side, slight smile, closed mouth" },
  { id: 23, slug: "shrug-palms-up",
    promptPose: "Standing, both arms bent at the elbows held out to her sides at hip height, palms up in a 'what do you want from me' shrug.",
    promptExpression: "Wry grin, eyebrows up.",
    captionPose: "standing, shrugging, hands up",
    captionExpression: "grin, looking at viewer" },
  { id: 24, slug: "spinning-dagger",
    promptPose: "Standing relaxed, twirling a thin dagger between the fingers of her right hand at hip height, the steel a blur.",
    promptExpression: "A confident half-smile, eyes on the spinning blade.",
    captionPose: "standing, holding weapon, holding knife",
    captionExpression: "looking down, smirk" },
  { id: 25, slug: "pointing-forward",
    promptPose: "Standing, her right arm extended forward (toward screen-right) at shoulder height, index finger pointing at something off-frame.",
    promptExpression: "Excited bright-eyed look, mouth open in a quick 'there!'",
    captionPose: "standing, pointing, arm out",
    captionExpression: "open mouth, looking to the side, surprised" },
  { id: 26, slug: "looking-up-window",
    promptPose: "Standing with both hands on her hips, head tilted back looking up and slightly to her right at an unseen high window or rooftop.",
    promptExpression: "Calculating focus, lips pressed together slightly, eyes narrowed.",
    captionPose: "standing, hand on hip, both hands on hips",
    captionExpression: "looking up, closed mouth" },
  { id: 27, slug: "climbing-rope",
    promptPose: "Mid-climb on an invisible vertical rope: her right arm raised gripping high overhead, left arm pulling at chest height, knees slightly bent and feet planted as if pushing off a wall.",
    promptExpression: "Lips parted with effort, focused upward gaze.",
    captionPose: "climbing, arm up, both arms up",
    captionExpression: "looking up, parted lips" },
  { id: 28, slug: "sitting-stairs-elbows-knees",
    promptPose: "Sitting on an invisible stair, knees bent and feet flat on a lower step, her elbows resting on her knees and her hands loosely clasped.",
    promptExpression: "Tired but content small smile, eyes meeting the viewer.",
    captionPose: "sitting, knees together, leaning forward",
    captionExpression: "looking at viewer, slight smile" },
  { id: 29, slug: "catching-bag-midair",
    promptPose: "Standing, her right arm raised and outstretched catching a small leather coin-pouch tossed from off-frame, fingers just closing around it.",
    promptExpression: "Quick alert grin, eyes locked on the catch.",
    captionPose: "standing, arm up, catching, holding bag",
    captionExpression: "grin, looking up" },
  { id: 30, slug: "sliding-coin",
    promptPose: "Standing slightly bent forward, her right hand sliding a single coin across an invisible counter or table at waist height.",
    promptExpression: "Smooth confident half-smile, eyes meeting the viewer over her sliding hand.",
    captionPose: "standing, leaning forward, holding coin",
    captionExpression: "smirk, looking at viewer" },
  { id: 31, slug: "hand-to-chin-thinking",
    promptPose: "Standing relaxed, her right hand raised with thumb under her chin and index finger curled across her lips, thinking.",
    promptExpression: "Curious thoughtful expression, eyes looking up and to her left.",
    captionPose: "standing, hand on chin",
    captionExpression: "looking up, thinking, parted lips" },
  { id: 32, slug: "ducking-low-beam",
    promptPose: "Stooped over with knees slightly bent, head ducked low and tucked toward her chest, both hands raised slightly as if avoiding an invisible low beam overhead.",
    promptExpression: "Eyes squinted up at the imaginary obstacle, lips drawn back in a slight wince-grin.",
    captionPose: "bent over, walking, ducking",
    captionExpression: "looking up, grin, parted lips" },
  { id: 33, slug: "listening-at-door",
    promptPose: "Standing pressed against an invisible door, her near (left) ear pressed to the surface, both palms flat on the door at shoulder height, body leaned in.",
    promptExpression: "Ear cocked, eyes wide and intent on the unseen sound, lips parted.",
    captionPose: "standing, leaning forward, hands up",
    captionExpression: "looking to the side, parted lips, concentrating" },
  { id: 34, slug: "inspecting-fingernails",
    promptPose: "Standing relaxed, her right hand raised in front of her at chest height, fingers held outward as she inspects her fingernails, her left hand on her hip.",
    promptExpression: "Bored amused half-smile, head tilted slightly.",
    captionPose: "standing, hand on hip, looking at hand",
    captionExpression: "smirk, looking down" },
  { id: 35, slug: "yawning-hand-mouth",
    promptPose: "Standing relaxed, her right hand raised to her mouth covering a wide yawn, left arm hanging loose at her side, slight back-arch.",
    promptExpression: "Closed eyes, mouth open in a yawn behind her hand.",
    captionPose: "standing, hand to mouth, arching back",
    captionExpression: "yawning, closed eyes, open mouth" },
  { id: 36, slug: "looking-up-sky",
    promptPose: "Standing relaxed, head tilted back looking straight up at an invisible sky, both arms loose at her sides.",
    promptExpression: "Soft happy smile, eyes half-closed against unseen sun.",
    captionPose: "standing, looking up",
    captionExpression: "looking up, smile, half-closed eyes" },
  { id: 37, slug: "counting-on-fingers",
    promptPose: "Standing, both hands held up in front of her at chest height, calculating on her fingers, the index finger of her right hand touching the fingertips of her left.",
    promptExpression: "Lips moving in silent count, brow lightly furrowed in concentration.",
    captionPose: "standing, counting, hands up",
    captionExpression: "looking down, counting, parted lips" },
  { id: 38, slug: "holding-scroll",
    promptPose: "Standing, holding an unrolled length of parchment in both hands at chest height, head bent reading.",
    promptExpression: "Focused reading expression, lips parted.",
    captionPose: "standing, holding paper, reading",
    captionExpression: "looking down, parted lips, reading" },
  { id: 39, slug: "tying-leather-knot",
    promptPose: "Standing relaxed, both hands held in front of her at chest height tying a complex knot in a thin leather thong.",
    promptExpression: "Quiet focus, head tilted, lips slightly pursed.",
    captionPose: "standing, holding object",
    captionExpression: "looking down, closed mouth" },
  { id: 40, slug: "sitting-low-wall-feet-swing",
    promptPose: "Sitting on an invisible low wall at hip-height, both feet hanging and swung slightly forward, both hands gripping the edge beside her hips.",
    promptExpression: "Relaxed easy smile, eyes meeting the viewer brightly.",
    captionPose: "sitting, feet up, dangling legs",
    captionExpression: "looking at viewer, smile" },
  { id: 41, slug: "looking-over-shoulder-walking",
    promptPose: "Mid-step walking away (body angled toward screen-right), head turned back over her near shoulder to look at the viewer, right hand brushing along her hip.",
    promptExpression: "Coy small smile, eyebrow slightly raised in invitation.",
    captionPose: "walking, looking back",
    captionExpression: "looking at viewer, smirk, looking back" },
  { id: 42, slug: "carrying-loot-bag",
    promptPose: "Standing relaxed, a small leather drawstring loot-bag slung over her right shoulder, her right hand gripping the bag's neck behind her shoulder.",
    promptExpression: "Pleased self-satisfied half-smile, eyes meeting the viewer.",
    captionPose: "standing, holding bag, carrying",
    captionExpression: "looking at viewer, smirk" },
  { id: 43, slug: "arms-around-knees-sitting",
    promptPose: "Sitting on the ground, knees drawn up to her chest, both arms wrapped around her knees, chin resting on top of her knees.",
    promptExpression: "Quiet thoughtful look, eyes meeting the viewer evenly.",
    captionPose: "sitting, hugging legs, knees together, knees up",
    captionExpression: "looking at viewer, closed mouth" },
  { id: 44, slug: "thumbing-self-me",
    promptPose: "Standing, her right hand raised with the thumb pointing back at her own chest, head tilted slightly in a 'who, me?' gesture.",
    promptExpression: "Innocent wide-eyed grin, eyebrows raised.",
    captionPose: "standing, hand up, pointing at self",
    captionExpression: "grin, looking at viewer, surprised" },
  { id: 45, slug: "outstretched-palm",
    promptPose: "Standing, her right arm extended forward at chest height with her palm turned up, asking for something.",
    promptExpression: "Patient half-smile, eyes meeting the viewer expectantly.",
    captionPose: "standing, arm out, hand out, palm out",
    captionExpression: "looking at viewer, slight smile" },
  { id: 46, slug: "raising-flask-toast",
    promptPose: "Standing, her right hand raised at chin height holding a small leather-wrapped flask in a toast.",
    promptExpression: "A warm bright smile, head tilted, eyes meeting the viewer.",
    captionPose: "standing, holding flask, arm up, toasting",
    captionExpression: "smile, looking at viewer, holding bottle" },
  { id: 47, slug: "brushing-hair-back",
    promptPose: "Standing, her right hand raised to the side of her face, fingers brushing a stray fingertip's worth of hair back behind her right ear (the ponytail itself remains tight).",
    promptExpression: "Soft slight smile, eyes meeting the viewer's gaze.",
    captionPose: "standing, hand in hair, adjusting hair",
    captionExpression: "looking at viewer, slight smile" },
  { id: 48, slug: "spinning-look-back",
    promptPose: "Mid-spin: her body and ponytail sweeping in motion, weight on her right foot pivoting, head turned back over her near shoulder toward the viewer, the ponytail tip caught in motion behind her.",
    promptExpression: "Bright laughing smile, eyes wide with motion.",
    captionPose: "standing, motion lines, dancing, twirling",
    captionExpression: "smile, looking back, looking at viewer" },
  { id: 49, slug: "balance-one-leg",
    promptPose: "Standing on her right leg, her left knee raised high in front of her with the foot pulled back, both arms held out slightly to her sides for balance.",
    promptExpression: "Bright focused smile, eyes meeting the viewer.",
    captionPose: "standing, standing on one leg, balancing, leg up",
    captionExpression: "smile, looking at viewer" },
  { id: 50, slug: "kneeling-checking-pouch",
    promptPose: "Kneeling on her right knee, left foot flat ahead, both hands on her left thigh as she reaches into one of the hip-pouches.",
    promptExpression: "Quiet absorbed concentration, lips slightly parted.",
    captionPose: "kneeling, on one knee",
    captionExpression: "looking down, parted lips" },
  // Sprint C7 — combat-stance pose for the multi-combatant fight UI.
  // Vivian's canonical weapon is the short sword (per LOCKED_COSTUME).
  // Stance: middle guard, lunge-or-parry ready. Feet planted, weight low,
  // weapon committed to a guard — never casual, never on-shoulder.
  { id: 51, slug: "combat-stance-shortsword-middle-guard",
    promptPose: "She is in active COMBAT STANCE — feet planted shoulder-width apart with both knees soft and bent, weight low and centered, body bladed at a 45-degree angle to the viewer with her right shoulder leading. Her short sword is DRAWN and held forward in a two-handed middle guard at chest height, the blade angled forward toward an unseen opponent ahead of her, the leather-wrapped grip held firmly with her right hand at the hilt and her left hand bracing the pommel. Her eyes are locked on the threat ahead, ready to lunge or parry. This is NOT casual, NOT a portrait, NOT a sword resting on her shoulder, NOT a sword pointed at the ground — she is mid-fight, weapon committed to a guard, ready to strike or defend on the next breath. The short-sword blade is BURNISHED DARK STEEL — a deep oiled grey-blue tone, with a streak of fresh red blood along one edge and small smears of dried blood on the flat. The blade is VISIBLY DARKER than the white studio backdrop so it survives the alpha cut — never mirror-bright, never silver-white, never chromed.",
    promptExpression: "Hard focused intensity, jaw set, brows lowered, eyes narrow and locked on the threat ahead, mouth a firm line.",
    captionPose: "standing, combat stance, holding sword, weapon in hands",
    captionExpression: "serious, looking to the side, closed mouth" },
];

if (POSES.length !== 51) {
  console.error(`ERROR: pose list has ${POSES.length} entries, expected 51`);
  process.exit(1);
}

// ── Caption builder (booru-style per scripts/lora/vivian/CAPTIONS.md) ───

const TRIGGER = "vivian1";
const CHAR_BASE = "1girl, solo";
const QUALITY = "score_9, score_8_up, score_7_up";
const SOURCE = "source_realistic"; // never tag painterly — Pony fluid-artifact gotcha
const HAIR = "long hair, brown hair, ponytail, high ponytail, single ponytail";
const EYE = "green eyes";
const FRAMING = "full body";
const LIGHTING = "soft lighting, even lighting, studio lighting";
const BACKGROUND = "simple background, white background";

function buildCaption(pose: PoseSpec): string {
  const parts = [
    TRIGGER,
    CHAR_BASE,
    QUALITY,
    SOURCE,
    HAIR,
    EYE,
    pose.captionExpression,
    pose.captionPose,
    FRAMING,
    pose.captionAction ?? "",
    LIGHTING,
    BACKGROUND,
  ].filter(Boolean);
  return parts.join(", ");
}

// ── Prompt builder ──────────────────────────────────────────────────

function buildPrompt(pose: PoseSpec): string {
  return [
    LOCKED_STYLE,
    "",
    LOCKED_IDENTITY,
    "",
    LOCKED_COSTUME,
    "",
    `Pose: ${pose.promptPose}`,
    "",
    `Expression: ${pose.promptExpression}`,
    "",
    LOCKED_FRAMING,
  ].join("\n");
}

// ── xAI image-to-image call ─────────────────────────────────────────

const MASTER_BASE64_DATA_URL = (() => {
  const buf = fs.readFileSync(MASTER_PATH);
  return `data:image/png;base64,${buf.toString("base64")}`;
})();

interface XaiImageResponse {
  data?: { b64_json?: string; url?: string }[];
  error?: { message?: string };
}

async function callXaiImageEdit(prompt: string): Promise<Buffer> {
  // xAI's /v1/images/edits endpoint accepts an image_url field with a public
  // URL or a base64-encoded data URI. Schema based on docs.x.ai (2026-04).
  // We pass the locked master as a data URI so we don't need a public host.
  const body = {
    model: "grok-imagine-image-pro",
    prompt,
    response_format: "b64_json",
    aspect_ratio: "3:4",
    resolution: "2k",
    image: {
      url: MASTER_BASE64_DATA_URL,
      type: "image_url",
    },
  };

  const res = await fetch("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as XaiImageResponse;
  if (!res.ok) {
    const errMsg = json.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`xAI /images/edits failed: ${errMsg}`);
  }
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("xAI /images/edits returned no image data");
  return Buffer.from(b64, "base64");
}

// ── Main ────────────────────────────────────────────────────────────

async function forgePose(pose: PoseSpec): Promise<void> {
  const idStr = String(pose.id).padStart(2, "0");
  const pngPath = path.join(OUT_DIR, `v${idStr}.png`);
  const txtPath = path.join(OUT_DIR, `v${idStr}.txt`);

  if (fs.existsSync(pngPath) && !force) {
    console.log(`  skip v${idStr} ${pose.slug} (already exists; --force to regenerate)`);
    return;
  }

  console.log(`  generating v${idStr} ${pose.slug}…`);
  const buf = await callXaiImageEdit(buildPrompt(pose));

  fs.writeFileSync(pngPath, buf);
  fs.writeFileSync(txtPath, buildCaption(pose) + "\n");
  const sizeKb = Math.round(fs.statSync(pngPath).size / 1024);
  console.log(`  ✓ wrote v${idStr}.png (${sizeKb} KB) + v${idStr}.txt`);
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Filter pose list to the requested subset.
  let toRun = POSES.filter((p) => p.id >= start);
  if (onlySet) toRun = toRun.filter((p) => onlySet.has(p.id));
  if (Number.isFinite(limit)) toRun = toRun.slice(0, limit);

  console.log(`Vivian pose forge — generating ${toRun.length} pose${toRun.length === 1 ? "" : "s"}`);
  console.log(`Output dir: ${OUT_DIR}`);
  console.log(`Master ref: ${path.relative(root, MASTER_PATH)}`);
  console.log(`Model: grok-imagine-image-pro via /v1/images/edits`);
  console.log(`Cost:  ~$${(toRun.length * 0.07).toFixed(2)} total`);
  console.log("");

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const pose of toRun) {
    const before = fs.existsSync(path.join(OUT_DIR, `v${String(pose.id).padStart(2, "0")}.png`));
    try {
      await forgePose(pose);
      const after = fs.existsSync(path.join(OUT_DIR, `v${String(pose.id).padStart(2, "0")}.png`));
      if (before && !force) skipped++;
      else if (after) generated++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ v${String(pose.id).padStart(2, "0")} ${pose.slug} FAILED: ${msg}`);
    }
  }

  console.log("");
  console.log("─── Summary ───");
  console.log(`Generated: ${generated}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Failed:    ${failed}`);
  if (generated > 0) {
    console.log(`Approx cost this run: $${(generated * 0.07).toFixed(2)}`);
    console.log("");
    console.log("Each PNG has a sibling .txt caption ready for kohya training.");
    console.log("After review, the training set is at scripts/lora/vivian/training-set/.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
