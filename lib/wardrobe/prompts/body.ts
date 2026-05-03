// ============================================================
// LIVING EAMON — Wardrobe V2 · body-combo framing
//
// Single source of truth for the (equipment × weapon × stance)
// prompt fragments that drive full-body hero generation. Previously
// duplicated in two places — app/api/hero-equipment-sprite/route.ts
// (legacy runtime pipeline) and scripts/forge-hero-equipment-variant.ts
// (legacy offline pipeline) — and both imported from the same source
// is now the only source of truth.
//
// Consumers:
//   - scripts/wardrobe/forge-body.ts  (V2 offline body-combo generator)
//   - lib/wardrobe/api.ts             (V2 runtime — via metadata only)
//   - app/api/hero-equipment-sprite/route.ts (legacy, during feature-flag rollout)
//   - scripts/forge-hero-equipment-variant.ts (legacy)
//
// The legacy consumers get retired in Sprint 4d once V2 ships behind a
// hard cutover. Until then, ALL callers import from here so drift can't
// creep back in.
// ============================================================

export type Equipment =
  | "loincloth"
  | "gray_robe"
  | "common_clothes"
  | "leather_armor"
  | "chain_mail"
  | "plate_armor";

export type Stance = "casual" | "combat";

export type WeaponCarry =
  | "unarmed"
  | "hip_short_blade"
  | "hip_long_blade"
  | "back_two_hander";

export const EQUIPMENT_FRAMING: Record<Equipment, string> = {
  loincloth:
    "Clothed only in a dark leather loincloth, bare-chested and fully barefoot, torso and limbs exposed.",
  gray_robe: [
    "Dressed only in a coarse gray sackcloth robe of the Church of",
    "Perpetual Life — a thin, ill-fitting hospital-gown-style garment",
    "that ties loosely at the nape of the neck and falls just above the",
    "knee. The robe covers the front and sides but is open at the back,",
    "held together only by a single thin tie; the gap exposes the hero's",
    "bare muscled spine, shoulder blades, and the small of his back. His",
    "bare legs are visible below the knee. The garment is barely long",
    "enough to be decent — a shameful and humbling vestment given to the",
    "freshly-rebirthed.",
  ].join(" "),
  common_clothes: [
    "Dressed in a CLEAN, WHOLE, NEW-LOOKING set of plain commoner's",
    "clothes (the garments are intact, unripped, untorn, unworn, in",
    "excellent repair — NOT rags, NOT tattered, NOT open-fronted, NOT",
    "ripped, NOT torn, NOT distressed, NOT a vest, NOT a loincloth):",
    "(1) a well-made WARM CREAM-COLORED linen shirt (a clearly tinted",
    "    oatmeal / soft ecru tone — NOT white, NOT near-white, NOT off-",
    "    white — so the fabric reads as distinctly darker than the",
    "    pure-white backdrop and does NOT blend into it), CLOSED and",
    "    SOLID across the front, that FULLY COVERS THE ENTIRE TORSO",
    "    AND BOTH ARMS —",
    "    long sleeves that reach ALL THE WAY DOWN TO THE WRISTS with",
    "    NO bare upper arms, NO bare forearms, NO short sleeves, NO",
    "    sleeveless cut, NO rolled-up sleeves. The shirt is a CLOSED",
    "    PULLOVER TUNIC that covers the chest, abdomen, AND shoulders",
    "    as a SOLID UNBROKEN PANEL OF LINEN FABRIC across the entire",
    "    front with NO bare midriff, NO exposed stomach, NO crop-top",
    "    gap, NO open vest, NO bare pectorals, NO visible chest, NO",
    "    plunging neckline, NO unlaced front — the chest is ENTIRELY",
    "    COVERED by the shirt fabric. A small round neck-hole at the",
    "    throat with a short laced placket is the ONLY opening. The",
    "    shirt is loose-fitting, hem falling to mid-thigh over the",
    "    trousers;",
    "(2) FULL-LENGTH loose wool trousers in a muted brown-gray tone,",
    "    extending ALL THE WAY DOWN TO THE ANKLES (these are long",
    "    trousers, NOT shorts, NOT breeches, NOT cropped, NOT rolled",
    "    up), tucked into the boots below;",
    "(3) a wide plain deep-brown leather belt at the waist, cinching",
    "    the shirt, with a simple iron buckle;",
    "(4) deep-brown leather boots — the color of old, well-oiled",
    "    saddle leather — rising to MID-SHIN, fully enclosing the feet",
    "    and lower calves (these are boots — NOT shoes, NOT sandals,",
    "    NOT barefoot — the uppers reach roughly halfway up the shin;",
    "    NOT tan, NOT light, NOT beige).",
    "No armor, no mail, no cloak, no hood. The clothes are simple but",
    "well-made and in good repair — a sturdy traveler's everyday kit.",
  ].join(" "),
  leather_armor: [
    "Equipped in a boiled leather cuirass — the DEEP BROWN color of old,",
    "well-oiled saddle leather (NOT tan, NOT light, NOT beige, NOT",
    "black), hardened and fitted snugly over the ENTIRE TORSO. The",
    "cuirass is a FULL chest-and-abdomen cuirass, NOT a harness, NOT a",
    "halter, NOT a bustier, NOT a crop-top, NOT a chest-strap-only",
    "rig — it covers the chest AND the abdomen from the clavicles all",
    "the way down to the waistline as a SINGLE SOLID PANEL of leather",
    "with NO bare midriff, NO exposed stomach, NO crop-top gap, NO",
    "visible navel, NO visible ribs, NO gap between chest plate and",
    "belt. The torso is FULLY COVERED front and back. Thick riveted",
    "deep-brown leather straps seal the cuirass at the shoulders and",
    "along the flanks. Deep-brown leather bracers strapped over the",
    "forearms, a wide deep-brown leather sword-belt at the waist, heavy",
    "deep-brown leather greaves strapped over the shins. Deep-brown",
    "leather boots — the color of old, well-oiled saddle leather —",
    "rising to MID-SHIN, worn beneath the greaves. Upper arms,",
    "shoulders, and throat remain bare; the face and head are fully",
    "uncovered. A mercenary's working armor, lived-in and lightly",
    "scuffed. All leather elements are the SAME deep brown tone.",
  ].join(" "),
  chain_mail: [
    "Equipped in a long steel chainmail hauberk that falls to mid-thigh",
    "and FULLY ENCLOSES the torso — chest, abdomen, flanks, and back",
    "are COMPLETELY COVERED with NO bare midriff, NO exposed stomach,",
    "NO crop-top gap. The chainmail is SEWN DIRECTLY ONTO a thick",
    "SOLID BLACK COTTON INNER LINER that backs every ring — the liner",
    "forms a continuous opaque black fabric backdrop BEHIND the",
    "chainmail rings so that NO light shows through the gaps between",
    "rings, NO background color is visible through the mail, and the",
    "negative space between rings appears SOLID BLACK, never white,",
    "never gray, never transparent. The chainmail also covers the",
    "shoulders and upper arms; short chain sleeves stop at the elbow",
    "(the black liner continues beneath the sleeves). NO coif, NO",
    "hood, NO chainmail around the neck or head — the head and neck",
    "are ENTIRELY BARE above the hauberk's collar, and the face and",
    "head are fully uncovered. Wide deep-brown leather sword-belt",
    "cinched at the waist, deep-brown leather bracers over the",
    "forearms, deep-brown leather boots — the color of old, well-oiled",
    "saddle leather — rising to MID-SHIN (NOT tan, NOT light, NOT",
    "beige, NOT black; ALL leather elements the SAME deep brown tone).",
    "Weighty, battle-ready, the rings catching dull iron light against",
    "the black cotton beneath.",
  ].join(" "),
  plate_armor: [
    "Equipped in articulated steel plate: a hammered Aquilonian-style",
    "cuirass of breastplate and backplate, shaped pauldrons at the",
    "shoulders, vambraces over the forearms, and heavy greaves over the",
    "shins. A chainmail undershirt shows at the neck and under the",
    "pauldrons. Wide deep-brown leather sword-belt at the waist,",
    "steel-capped deep-brown leather boots. The head and face remain",
    "fully uncovered — no helm in this portrait. Kingly, war-grade",
    "plate, polished to a cold gleam.",
  ].join(" "),
};

export const WEAPON_CARRY_FRAMING: Record<WeaponCarry, string> = {
  unarmed: "",
  hip_short_blade: [
    "A short blade is sheathed at the left hip in a plain deep-brown leather",
    "scabbard attached to a sword-belt, hilt angled forward for a",
    "right-handed draw. The blade is worn but not drawn.",
  ].join(" "),
  hip_long_blade: [
    "A long sword is sheathed at the left hip in a long deep-brown leather",
    "scabbard attached to a sword-belt, the scabbard running most of the",
    "length of the left thigh, the hilt riding high near the ribs and",
    "angled forward for a right-handed draw. The weapon is worn but not",
    "drawn.",
  ].join(" "),
  back_two_hander: [
    "A massive two-handed great-sword is strapped diagonally across the",
    "back by a wide deep-brown leather baldric running from the left hip",
    "over the right shoulder. The hilt and pommel of the great-sword jut",
    "above the right shoulder, visible behind the hero. The weapon is",
    "worn but not drawn.",
  ].join(" "),
};

export const STANCE_FRAMING: Record<Stance, string> = {
  casual: [
    "Casual standing pose, three-quarter angle facing the camera, feet",
    "shoulder-width apart, arms relaxed at the sides, weight balanced,",
    "expression stoic. Not ready for combat — simply standing.",
  ].join(" "),
  combat: [
    "Combat-ready stance, three-quarter angle facing the camera, feet",
    "braced in a fighter's guard, weight low and balanced, arms raised",
    "ready to strike or defend, jaw set, eyes hard. Coiled to move.",
  ].join(" "),
};

export const FRESH_REBIRTH_FRAMING = [
  "Fresh-rebirth state: unscarred smooth skin, no battle marks, no",
  "blood, no dirt or grime, no tan lines or sunburn, no visible wounds,",
  "no bandages, no eye patches, no brands.",
].join(" ");

/**
 * The V2 pilot scope — which (equipment × weapon × stance) triples we
 * pregenerate. 4 weapons × 5 equipment types (NO plate_armor) × casual
 * only = 20 body combos. plate_armor is deferred until horses ship.
 */
export const PILOT_EQUIPMENT: ReadonlyArray<Equipment> = [
  "loincloth",
  "gray_robe",
  "common_clothes",
  "leather_armor",
  "chain_mail",
];

export const PILOT_WEAPONS: ReadonlyArray<WeaponCarry> = [
  "unarmed",
  "hip_short_blade",
  "hip_long_blade",
  "back_two_hander",
];

export const PILOT_STANCES: ReadonlyArray<Stance> = ["casual"];
