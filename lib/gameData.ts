// ============================================================
// LIVING EAMON — STATIC GAME DATA
// All room descriptions, NPCs, items, adventures, and combat
// stats live here. No API calls needed for any of this data.
// Dynamic (API) content is triggered by the game engine only
// when genuine intelligence or personalization is needed.
// ============================================================

import type { NPCBodyType } from "./npcBodyType";
import type { Room } from "./roomTypes";
import type { BodyZone, NPCCombatProfile } from "./combatTypes";

export type { NPCBodyType };

// Room types now live in lib/roomTypes.ts — re-exported here for
// backwards compatibility so the game engine and other files don't
// need to change their import paths.
export type { Room, RoomState, RoomStateModifier, SceneTone, RoomColdOpen, AdventureModule } from "./roomTypes";

export interface NPC {
  id: string;
  name: string;
  /** Verbose — full physical/personality description for EXAMINE. */
  description: string;
  /** Nonverbose — brief note for room presence lists. */
  glance?: string;
  greeting: string;          // Static first greeting — no API needed
  personality: string;       // Injected into Jane when dynamic convo needed
  isHostile: boolean;
  /** Training dummy: attackable but neutral, doesn't fight back, grants limited skill XP. */
  isTrainingDummy?: boolean;
  /** Combat narration; omit for humanoid (default) */
  bodyType?: NPCBodyType;
  stats: { hp: number; armor: number; damage: string };
  /** HWRR-style per-zone armor + AI targeting. Auto-derived from flat armor if absent. */
  combatProfile?: NPCCombatProfile;
  /** Grok Imagine portrait prompt — used for character image generation. */
  portraitPrompt?: string;
  /** Grok Imagine sprite prompt — full-body on WHITE background, for transparent PNG conversion. */
  spritePrompt?: string;
  merchant?: {
    inventory: string[];     // Item ids for sale
    haggleModifier: number;  // -1 easy to haggle, +1 hard
  };
}

export interface Item {
  id: string;
  name: string;
  /** Verbose — full description for EXAMINE. */
  description: string;
  /** Nonverbose — short phrase for inventory lists. */
  glance?: string;
  /** One-line shop chip description (e.g. "Restores moderate health."). */
  shortDescription?: string;
  /** Thurian codex entry — short alchemical flavor for shop popup. */
  alchemicalDescription?: string;
  /** Grok Imagine prompt for the alchemical-book-page background image. */
  bookPagePrompt?: string;
  /** Grok Imagine prompt for the inventory icon (square, transparent PNG via rembg). */
  iconPrompt?: string;
  type: "weapon" | "armor" | "clothing" | "spell" | "consumable" | "treasure" | "key";
  value: number;             // Gold value
  stats?: {
    damage?: string;         // e.g. "1d6+2"
    armorClass?: number;     // LEGACY flat AC — still used by old armor
    healAmount?: number;
    // Per-zone armor stats (HWRR-style)
    zoneSlot?: BodyZone;     // Which body zone this armor covers
    zoneCover?: number;      // 0-100, % chance to block
    zoneDurability?: number; // Starting durability
    dexPenalty?: number;     // Reduces wearer's effective agility on foot (heavier = higher)
    mountedDexPenalty?: number; // Reduced penalty when mounted (plate becomes viable on horseback)
    customFit?: boolean;     // Cannot be looted or traded — must be commissioned
    // Shield stats
    shieldBlockChance?: number;  // 0-100
    shieldDurability?: number;
    // Player-applied poison (Phase B reads these in APPLY POISON TO WEAPON)
    poisonSeverity?: number;     // 1-3, maps to HP/turn on poisoned target
    poisonCharges?: number;      // Number of strikes the coating lasts
  };
  isCarryable: boolean;
}

export interface Adventure {
  id: string;
  name: string;
  description: string;       // Shown in Main Hall when asking about it
  entrance: string;          // Static entrance description
  difficulty: "novice" | "moderate" | "deadly";
  recommendedLevel: number;
  rooms: Room[];
  monsters: NPC[];
  loot: string[];            // Item ids available as rewards
}

// ============================================================
// SAM SLICKER — STATIC SHOP (engine Tier 1 in main_hall)
// ============================================================

export interface SamShopRow {
  key: string;
  displayName: string;
  price: number;
}

export const SAM_INVENTORY: SamShopRow[] = [
  { key: "dagger", displayName: "Dagger", price: 8 },
  { key: "short_sword", displayName: "Short Sword", price: 15 },
  { key: "long_sword", displayName: "Long Sword", price: 30 },
  { key: "katana", displayName: "Katana", price: 90 },
  { key: "kryss", displayName: "Kryss", price: 35 },
  { key: "war_axe", displayName: "War Axe", price: 70 },
  { key: "mace", displayName: "Mace", price: 45 },
  { key: "scepter", displayName: "Scepter", price: 50 },
  { key: "scimitar", displayName: "Scimitar", price: 55 },
  { key: "cutlass", displayName: "Cutlass", price: 50 },
  { key: "skinning_knife", displayName: "Skinning Knife", price: 10 },
  { key: "halberd", displayName: "Halberd", price: 100 },
  { key: "battle_axe", displayName: "Battle Axe", price: 95 },
  { key: "war_hammer", displayName: "War Hammer", price: 110 },
  { key: "maul", displayName: "Maul", price: 95 },
  { key: "bardiche", displayName: "Bardiche", price: 100 },
  { key: "executioners_axe", displayName: "Executioner's Axe", price: 120 },
  { key: "large_battle_axe", displayName: "Large Battle Axe", price: 115 },
  { key: "spear", displayName: "Spear", price: 75 },
  { key: "war_fork", displayName: "War Fork", price: 70 },
  { key: "black_staff", displayName: "Black Staff", price: 40 },
  { key: "gnarled_staff", displayName: "Gnarled Staff", price: 35 },
  { key: "quarter_staff", displayName: "Quarter Staff", price: 25 },
  { key: "pitchfork", displayName: "Pitchfork", price: 30 },
  { key: "bow", displayName: "Bow", price: 80 },
  { key: "crossbow", displayName: "Crossbow", price: 45 },
  { key: "repeating_crossbow", displayName: "Repeating Crossbow", price: 90 },
  { key: "leather_armor", displayName: "Leather Armor", price: 20 },
  { key: "chain_mail", displayName: "Chain Mail", price: 60 },
  { key: "buckler", displayName: "Buckler", price: 30 },
];

// ============================================================
// ROOMS — MAIN HALL
// ============================================================

// Rooms are now defined in lib/adventures/ modules and merged by the registry.
// MAIN_HALL_ROOMS moved to adventures/registry.ts to break circular dependency.
// Import directly: import { ALL_ROOMS as MAIN_HALL_ROOMS } from "./adventures/registry";


// ============================================================
// NPCS
// ============================================================

export const NPCS: Record<string, NPC> = {
  hokas_tokas: {
    id: "hokas_tokas",
    name: "Hokas Tokas",
    description: "A rotund, cheerful man whose braided beard is threaded with small silver bells that chime when he moves. His eyes are sharp despite his jovial manner — he's seen thirty years of adventurers come and go.",
    glance: "The innkeeper, silver bells in his beard.",
    spritePrompt: "Full-body character illustration of a rotund, cheerful medieval innkeeper. Braided beard threaded with tiny silver bells. Warm eyes, ruddy cheeks, thick arms. Wearing a stained leather apron over a linen shirt, sleeves rolled up. Holding a polished tankard. Standing pose, facing slightly left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: `The silver bells in Hokas's beard chime as he looks up. Something flickers behind his eyes — recognition, concern — but he smooths it over with professional ease.\n\n"Ah. There you are. Sit, sit. What'll it be — ale, information, or both? Both is the popular choice."`,
    personality: "Hokas is warm, generous, and deeply fond of adventurers — he was one himself, long ago. He knows every rumor in the city. He responds in Universal Common, always cheerful unless the hall has been damaged, in which case he is barely civil until repairs are paid for.",
    isHostile: false,
    stats: { hp: 40, armor: 2, damage: "1d4" },
    merchant: {
      inventory: ["ale", "hearty_meal", "rumor_token"],
      haggleModifier: -1,
    },
  },

  sam_slicker: {
    id: "sam_slicker",
    name: "Sam Slicker",
    description: "A thin man in a patched leather coat who always seems to be examining something with one eye closed. His weapons are of questionable provenance but undeniable quality.",
    glance: "The arms dealer, one eye on a blade.",
    spritePrompt: "Full-body character illustration of a thin, sharp-faced medieval arms dealer. Patched leather coat, one eye squinted closed, examining a dagger. Wiry build, sly half-smile. Belt with small tools and sheaths. Standing pose, facing slightly left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: `Sam glances up from a dagger he's been examining. His eyes narrow for half a second — he knows you, but he's not going to make a thing of it.\n\n"Back again." He spreads his hands over the velvet. "I've got things that need buying, and you look like someone who needs things. What's your pleasure?"`,
    personality: "Sam is a morally flexible weapons dealer who speaks in Universal Common with a slightly oily charm. He will haggle, he will hint at illegal goods if the player seems trustworthy, and he always knows more than he lets on. He never breaks character as a merchant.",
    isHostile: false,
    stats: { hp: 25, armor: 1, damage: "1d6+2" },
    merchant: {
      inventory: SAM_INVENTORY.map(r => r.key),
      haggleModifier: 1,
    },
  },

  old_mercenary: {
    id: "old_mercenary",
    name: "Aldric the Veteran",
    description:
      "A weathered man with a grey beard and a prosthetic left hand carved from dark wood. He carries himself like someone who has survived things he refuses to discuss. His eyes miss nothing.",
    glance: "The old mercenary, nursing his ale in the corner.",
    spritePrompt: "Full-body character illustration of a weathered old mercenary veteran. Grey beard, prosthetic left hand carved from dark wood, scarred face, watchful eyes. Wearing worn chainmail over leather, a heavy cloak. Holding a tankard in his good hand. Standing pose, leaning slightly, facing left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: `Aldric glances over as you enter. He takes in the whole situation — the gown, the empty hands, the look on your face — in about two seconds. Something heavy passes behind his eyes, but he doesn't say what.\n\n"Sit down," he says. Not unkindly. "You look like you could use some answers. Ask me anything. I've been here long enough."`,
    personality: `Aldric the Veteran is the most talkative and forthcoming NPC in the Guild Hall. He is a retired adventurer who genuinely cares whether the hero survives. He speaks more than anyone else in the room — freely, warmly, and at length. He is direct but never condescending. He buys the hero drinks without being asked. He knows the hero from before the amnesia and is quietly heartbroken about the memory loss but covers it with gruff practicality. He knows the rules, the secrets, the dangers, and the shortcuts. He speaks in plain Universal Common. He proactively offers information, advice, and his topic list whenever the player seems lost. He trains weapon skills in the courtyard for gold. He fondly calls the training dummy "Dufus." He is the most reliably useful person in the Main Hall.`,
    isHostile: false,
    stats: { hp: 60, armor: 3, damage: "1d8+2" },
  },

  lira: {
    id: "lira",
    name: "Lira",
    description:
      "A small, tightly built young woman with pale skin, honey-blonde hair that falls past her shoulders, narrow shoulders, a flat stomach, and long lean legs. She moves between the tables with a dancer's economy — no wasted step, no wasted motion. She is small and athletic, with the quiet confidence of someone who could outrun anything in this room.",
    glance: "A petite blonde barmaid, quick on her feet.",
    spritePrompt: "Full-body character illustration of a very petite young barmaid, barely five feet tall. Pale skin, honey-blonde hair past shoulders, impish grin, tiny delicate frame. Carrying a tankard. Wearing a laced bodice tavern dress with flowing skirt. Standing pose, facing slightly left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: `Lira sets a tankard down without spilling a drop, already moving to the next table. She catches your eye on the way past and gives a quick half-smile — there and gone. "Need something?"`,
    personality:
      "Lira is impish, quick-witted, and full of bouncy energy — she teases the adventurers she serves, steals bites off their plates, and laughs too loud for her size. She is fearless in a way that has nothing to do with fighting. She warms up fast and says exactly what she's thinking, often before she's finished thinking it.",
    isHostile: false,
    stats: { hp: 12, armor: 0, damage: "1d3" },
    portraitPrompt:
      "Portrait of a very petite, very short young Aquilonian barmaid — she is noticeably small, barely five feet tall, with a tiny delicate frame. Pale skin, honey-blonde hair past her shoulders, impish grin. Toned but diminutive. Carrying a tankard that looks large in her small hands. Wearing a laced bodice tavern dress with flowing skirt. Warm amber tavern lighting, stone interior behind her. Painted in the style of Frank Frazetta. 3:4 portrait.",
  },

  mavia: {
    id: "mavia",
    name: "Mavia",
    description:
      "A full-figured woman with pale skin, golden-blonde curling hair that falls past her shoulders, and a wide, easy smile. She carries tankards on a tray balanced against one hip, moving with a comfortable, unhurried sway. Her bodice is laced snug and her skirts are practical but flattering. She is voluptuous and entirely at ease with it — the kind of woman who makes a room feel warmer just by being in it.",
    glance: "A golden-haired barmaid with a warm smile and a tray of tankards.",
    spritePrompt: "Full-body character illustration of a voluptuous barmaid. Pale skin, golden-blonde curling hair past shoulders, generous hourglass figure, warm inviting smile. Carrying a tray of tankards against one hip. Wearing a laced bodice tavern dress with flowing skirt. Standing pose, facing slightly left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: `Mavia leans one hip against the table edge and sets down two tankards she wasn't asked to bring. "You look thirsty. And hungry. And like you haven't slept in a week." She smiles. "I can fix at least two of those."`,
    personality:
      "Mavia is warm, maternal, and flirtatious without being cheap. She genuinely cares about the people she serves and remembers their names and their stories. She is the emotional center of the Main Hall — everyone talks to Mavia. She speaks in warm, unhurried Universal Common.",
    isHostile: false,
    stats: { hp: 12, armor: 0, damage: "1d3" },
    portraitPrompt:
      "Portrait of a voluptuous Aquilonian barmaid with pale skin, golden-blonde curling hair past her shoulders, generous hourglass figure, warm inviting smile. Carrying a tray of tankards against one hip. Wearing a laced bodice tavern dress with flowing skirt. Warm amber tavern lighting, stone interior behind her. Painted in the style of Frank Frazetta. 3:4 portrait.",
  },

  seraine: {
    id: "seraine",
    name: "Seraine",
    description:
      "A tall, slender woman with pale skin, ash-blonde hair that falls past her shoulders, narrow hips, and an elegant bearing. Her features are fine and angular. She carries herself with a quiet grace, unhurried and self-possessed. She has a gentle, knowing smile that suggests she finds the world privately amusing.",
    glance: "A tall, elegant barmaid moving through the room unhurried.",
    spritePrompt: "Full-body character illustration of a tall slender barmaid. Pale skin, ash-blonde hair past shoulders, fine angular features, gentle knowing smile, elegant bearing. Very narrow hips, long lean silhouette. Wearing a laced bodice tavern dress with flowing skirt. Standing pose, facing slightly left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: `Seraine arrives at your table and sets a drink down with easy precision. She meets your eyes and smiles — a small, unhurried thing. "There you are. Let me know if you need anything else."`,
    personality:
      "Seraine is gentle, poised, and quietly warm. She speaks softly and what she says is thoughtful. She has an elegant bearing but it makes people feel at ease rather than judged. There is a mystery about her past but she wears it lightly. She speaks in warm, measured Universal Common.",
    isHostile: false,
    stats: { hp: 15, armor: 0, damage: "1d4+1" },
    portraitPrompt:
      "Portrait of a tall slender Aquilonian barmaid with pale skin, ash-blonde hair past her shoulders, fine angular features, gentle knowing smile, elegant bearing. Very narrow hips, straight waist-to-hip line, minimal curves, long lean tubular silhouette like a runway model. Wearing a laced bodice tavern dress with flowing skirt. Warm amber tavern lighting, stone interior behind her. Painted in the style of Frank Frazetta. 3:4 portrait.",
  },

  brunt_the_banker: {
    id: "brunt_the_banker",
    name: "Brunt",
    description: "A dwarf of few words and maximum suspicion. His handshake could crush stone.",
    glance: "The dwarf banker, eyes on his ledger.",
    spritePrompt: "Full-body character illustration of a heavyset dwarf banker. Short, broad, immensely strong hands. Bald head, thick eyebrows, suspicious expression. Wearing a leather vest over a sturdy shirt, a coin purse on his belt. Arms crossed. Standing pose, facing slightly left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: `"Name. Account number. Business." He doesn't look up from his ledger.`,
    personality: "Brunt is a dwarf banker of absolute honesty and zero warmth. He handles all banking transactions — deposits, withdrawals, account creation. He speaks in clipped Universal Common. He cannot be bribed, charmed, or intimidated. He has seen it all.",
    isHostile: false,
    stats: { hp: 50, armor: 5, damage: "1d10+3" },
  },

  armory_attendant: {
    id: "armory_attendant",
    name: "Pip",
    description: "A young guild apprentice assigned to armory duty as punishment for something they won't discuss.",
    glance: "The apprentice, polishing something that doesn't need it.",
    spritePrompt: "Full-body character illustration of a young nervous guild apprentice. Teenage, gangly, slightly hunched. Holding a polishing cloth and an iron helmet. Wearing a plain tunic with a guild badge. Eager expression. Standing pose, facing slightly left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: `Pip sets down the helmet they were polishing and stands up straight. "Guild members get the standard rate. Non-members pay double. You look like a member. Probably."`,
    personality: "Pip is young, slightly nervous, and desperately wants to be an adventurer themselves. They will chatter about the available adventures and offer genuine if naive advice. Speaks in Universal Common with occasional modern slip-ups they immediately correct.",
    isHostile: false,
    stats: { hp: 15, armor: 1, damage: "1d4" },
    merchant: {
      inventory: ["short_sword", "leather_armor", "buckler", "torch", "rope", "rations"],
      haggleModifier: -1,
    },
  },

  priest_of_perpetual_life: {
    id: "priest_of_perpetual_life",
    name: "Priest of Perpetual Life",
    description:
      "Pale, unhurried, dressed in white. Their eyes are open and aware but carry no warmth and no hostility. Simply present.",
    glance: "A silent figure in white.",
    greeting:
      "Someone in white turns toward you and raises one finger slowly to their lips.",
    personality:
      "Completely silent. Never speaks. Never hostile. Never warm. Responds to all attempts at conversation with a varied silent gesture. Do not generate dialogue for this NPC under any circumstances.",
    isHostile: false,
    stats: { hp: 999, armor: 10, damage: "0" },
  },

  zim_the_wizard: {
    id: "zim_the_wizard",
    name: "Zim",
    description:
      "A tall, slim young man in a dark blue wizard's robe that falls to his ankles. The robe has many pockets — some bulging with vials, others with folded notes. A wide leather belt cinched at the waist holds pouches, a small mortar, and what appears to be a compass that points in no particular direction. His spectacles are slightly crooked. His eyes are bright and attentive — the eyes of someone who genuinely wants to help and knows exactly how. He looks young and healthy, with the focused energy of a person who has read every book in this room and remembers all of them.",
    glance: "The young wizard in dark blue robes, bright-eyed and eager.",
    spritePrompt: "Full-body character illustration of a young male wizard, tall and slim but healthy-looking. Wearing a dark blue wizard's robe that falls to his ankles, with many small pockets visible. A wide brown leather utility belt at the waist with pouches and small tools. Slightly crooked spectacles. Bright intelligent eyes, friendly helpful expression, slight smile. Holding an open book in one hand. Clean-shaven, short brown hair. Standing upright, facing slightly left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: `Zim looks up from his books, adjusts his spectacles, and opens his mouth. Then closes it. Then opens it again.\n\n"Oh," he says. "Oh, you're — yes. Hello. Welcome to Pots and Bobbles. Potions, scrolls, identification services, magical training — I do all of it. Well, most of it. The advanced summoning is on hold because of the incident. Never mind the incident."\n\nHe hops off his stool. "What do you need?"`,
    personality:
      `Zim is a young wizard who runs Pots & Bobbles — the Guild's mage school and magical supply shop. He is brilliant, awkward, and pathologically incapable of filtering his thoughts before they exit his mouth. He has autistic hyperfocus on magical topics and will lecture at length about anything arcane without noticing whether anyone is listening. He is overly helpful to the point of being exhausting — he genuinely wants the hero to succeed and will give unsolicited advice, warnings, and tangential trivia. He has high-energy ADD — he starts sentences, abandons them, picks up new ones, circles back. He speaks in rapid Universal Common with occasional technical terms he forgets to explain. He recognizes the hero from before the amnesia and feels terrible about the memory loss. He crosses himself (shoulder-shoulder, forehead, heart, kiss) when mentioning dark forces. He sells potions, buys herbs and curiosities, identifies magical items for a fee, and trains magic for gold. He warns about cursed items and corrupted artifacts. He refers to adventuring as "out in the field."`,
    isHostile: false,
    stats: { hp: 30, armor: 0, damage: "1d6" },
    merchant: {
      inventory: [
        "healing_potion", "greater_healing_potion",
        "stamina_brew", "fatigue_brew",
        "antidote", "strong_antidote",
        "bandage", "tourniquet",
        "unreliable_poison", "strong_poison",
        "mana_potion",
      ],
      haggleModifier: -1,
    },
  },

  training_dummy: {
    id: "training_dummy",
    name: "Dufus",
    description:
      "A man-shaped wooden post wrapped in old rope and stuffed burlap. Generations of sword cuts have chipped away at its torso. Someone has carved the name DUFUS into its forehead in rough, deep letters — the oldest mark on it. Below that, a crude charcoal face has been drawn and redrawn so many times the features have blurred into a permanent expression of resigned disappointment. Dried straw leaks from a gash where the neck meets the shoulder. It has been repaired so many times that very little of the original wood remains.",
    glance: "Dufus the training dummy. DUFUS carved into its forehead.",
    spritePrompt: "Full-body illustration of a humanoid medieval training dummy. A man-shaped wooden post wrapped tightly in weathered, fraying rope and stuffed grimy burlap, sword-chipped torso leaking dried straw at a torn gash where the neck meets the shoulder. A round burlap-bag head with the name DUFUS carved into its wooden forehead in deep, crude letters; below that a re-drawn charcoal face with a permanent resigned-disappointed frown — eyes are smudged Xs. Stout post legs end in a heavy wooden cross-base. No arms, no weapon, no armor. Painted in the style of Frank Frazetta. Full body from head to base, entire figure must be visible including the wooden cross-base, base at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
    greeting: "Dufus says nothing. He has heard it all before.",
    personality: "It is a wooden post named Dufus. It does not speak. It does not move. It takes the hit.",
    isHostile: false,
    isTrainingDummy: true,
    stats: { hp: 50, armor: 0, damage: "0" },
    combatProfile: {
      agility: 0,
      weaponSkill: 0,
      zones: {
        head: { cover: 0, durability: 0 },
        neck: { cover: 0, durability: 0 },
        torso: { cover: 0, durability: 0 },
        limbs: { cover: 0, durability: 0 },
      },
      shieldBlockChance: 0,
      shieldDurability: 0,
    },
  },
};

// ============================================================
// HERO SPRITES — for the player character. Looked up by lowercase
// `character_name`. Each entry follows the NPC `spritePrompt` rules
// (full body, white background, no shadow, Frazetta painted style)
// so the existing /api/npc-image cutout pipeline can be reused.
// ============================================================

export interface HeroSprite {
  id: string;
  spritePrompt: string;
}

export const HEROES: Record<string, HeroSprite> = {
  george: {
    id: "george",
    spritePrompt: "Full-body character illustration of a young medieval Hyborian-Age hero named George. Lean, wiry build, mid-twenties, dark tousled hair, alert eyes, faintly amnesiac thousand-yard stare. Wearing a plain undyed linen shirt, simple wool trousers, a plain leather belt with a dull buckle, scuffed nondescript leather shoes. Holding a polished katana — curved single-edged blade, eastern-style hilt — held casually at his side, point down. No armor, no helmet, no cloak. Standing pose, weight slightly back, facing slightly left. Painted in the style of Frank Frazetta. Full body from head to feet, entire figure must be visible including legs and shoes, feet at the bottom edge of the frame. Solid opaque white (#FFFFFF) background filling the entire image. Do not use transparency or checkerboard patterns. No scenery. No floor. No ground. No shadow.",
  },
};

export const PRIEST_SILENCE_RESPONSES: string[] = [
  "The priest raises a single finger to their lips. The silence continues.",
  "The priest turns toward you with calm eyes and says nothing. The gesture is not unkind.",
  "A slight tilt of the head. No words come. None will.",
  "The priest folds their hands and waits. Whatever you were going to say, they have heard it before.",
  "They look at you directly. The silence between you stretches and does not break.",
  "The priest bows very slightly. It is not an answer. It is not a refusal. It simply is.",
  "One hand rises, palm out, gentle as a held breath. You understand.",
  "The priest's eyes close for a moment, then open again. Still white. Still silent.",
  "They are aware of you. They are not troubled by you. They simply do not speak.",
  "The priest places a hand briefly over their heart and looks at you. That is all.",
];


export const REBIRTH_NARRATIVES: string[] = [
  "Dark. Then cold. Then the ceiling of the Church of Perpetual Life, which is white, and a priest who is watching you without expression. You are alive. You remember everything.",
  "You come back the way you always do — slowly, then all at once. The floor is cold under you. A gray robe has been placed over your body. The last thing you remember is the fight. You lost.",
  "The dying part was fast. The coming back part is not. You surface through the dark like something dredged from deep water, gasping, cold, alive. The priests don't react. They've seen this before.",
  "First there is nothing. Then there is cold stone against your cheek. Then there is the smell of the robe — clean, institutional, faintly medicinal. You are in the Church. You are alive. You lost everything you were carrying.",
  "You blink. White ceiling. White walls. A priest standing three feet away, watching you with no particular expression. You have been here before, or somewhere like it. Your hands are empty. Your pockets are empty. You are alive.",
  "The return is never graceful. You wake on the floor of the Church of Perpetual Life with the taste of the fight still in your mouth and nothing in your hands. A gray robe. Cold feet. Full lungs. Start again.",
  "Someone has placed a robe over you. The floor beneath it is cold. The priests move around you without urgency. You are not special here. You are simply the latest. You lost your gold. You lost your gear. You are alive, which is the part that matters.",
  "You died. Now you haven't. The Church of Perpetual Life has seen to that, as it always does, efficiently and without ceremony. The robe they've given you has no back. You will notice this when you stand up.",
  "There is a specific quality to the silence in the Church of Perpetual Life that you only notice when you wake up in it. Total. Complete. Not empty — full of something that doesn't make sound. You are back. You remember everything. You have nothing.",
  "Cold floor. White ceiling. Gray robe. The arithmetic of resurrection, same as it ever was. The priest near the door doesn't look up. They knew you were coming before you did.",
  "The dark gives you back. It always does. You surface in the Church, on the floor, alive and empty-handed, and a priest is already moving away — they placed the robe and didn't wait for thanks. Nobody thanks them. They don't want thanks.",
  "You wake knowing exactly what happened and exactly what you've lost. The Church doesn't soften that. It just gives you the robe and the cold floor and the silence, and lets you find your own way to standing.",
  "Everything you carried is gone. Everything you are remains. The Church of Perpetual Life is precise about this distinction. A gray robe. Cold stone. Full health. The rest is up to you.",
  "The last thing before the dark was the fight going wrong. The first thing after is the ceiling of the Church, which you know because you've stared at it before, lying exactly like this, in exactly this robe, with exactly this much in your pockets. Nothing. Begin.",
  "You breathe in. Cold. White. Silent. The robe they've put on you has no back, which you will discover shortly, and which will be the first of several humiliations the living world has waiting for you today.",
];

export const COURTYARD_ROBE_HUMILIATION: string[] = [
  "The robe shifts in the wind and reminds you, with cold specificity, that it has no back.",
  "A passerby glances at you and immediately finds something interesting to look at on the ground.",
  "The draft through the back of the robe is immediate and democratic.",
  "Two guild members cross the courtyard from the other direction and say nothing, which is worse than if they had said something.",
  "The robe does what it was designed to do, which is cover the front of you. The back of you is on its own.",
  "Someone across the courtyard sees you and changes direction without explanation.",
  "The robe flaps. You are aware of what it reveals. Everyone near you is also aware, and is pretending not to be.",
  "A child stares. Their parent turns them away. Nobody says anything.",
  "The back of the robe is, technically, open to interpretation. The wind has an interpretation.",
  "You have made this walk before. It does not get easier. The robe does not get more dignified.",
];

export const ROOM_ROBE_HUMILIATION: string[] = [
  "The robe shifts, reminding you that it has no back.",
  "A draft finds the gap in the robe that was always there.",
  "Nobody looks at you directly. This is somehow worse.",
  "The robe does its best. Its best is not very good.",
  "You are aware, constantly, of the back of the robe.",
  "The institutional smell of the robe precedes you.",
  "Someone notices the robe and finds somewhere else to be.",
  "The robe flaps once. You do not acknowledge it.",
  "The back of the robe is not there. The draft is.",
  "You are dressed. Technically.",
];

export const BARREL_EXAMINE_DESCRIPTIONS: string[] = [
  "The first barrel — CLOTHES FOR THE POOR — holds a jumble of donated clothing. Nothing fashionable. Everything functional. The second barrel — USED GOWNS ONLY — contains a quantity of gray backless church gowns in various states of recent use. You recognise the style.\n\n*You might: TAKE SHIRT, TAKE PANTS, TAKE SHOES, TAKE BELT*",
  "Two barrels near the south wall. The charity barrel holds donated clothes — shirts, trousers, shoes, belts — all of them honest about their age. The gown barrel beside it is a repository of gray backless church robes. You have worn one of those. You know exactly what it is.\n\n*You might: TAKE SHIRT, TAKE PANTS, TAKE SHOES, TAKE BELT*",
  "CLOTHES FOR THE POOR, says the first barrel, in letters written by someone who cared. It holds an assortment of donated clothing — nothing that would impress anyone, everything that would cover someone. The second barrel, brass-signed USED GOWNS ONLY — DO NOT PUT FOOD IN HERE, is full of gray church gowns.\n\n*You might: TAKE SHIRT, TAKE PANTS, TAKE SHOES, TAKE BELT*",
  "The charity barrel is about half full of donated clothing — folded with varying degrees of optimism. The gown barrel beside it has no such optimism. It holds gray backless robes. A lot of them. The Church of Perpetual Life does a steady business.\n\n*You might: TAKE SHIRT, TAKE PANTS, TAKE SHOES, TAKE BELT*",
];

export const ROBE_CEREMONY_NARRATIVES: string[] = [
  "You pull the clothes from the barrel and, with the particular efficiency of someone who has nothing left to lose, dress yourself under the robe in full view of the Main Hall. Nobody watches. This is the polite fiction everyone maintains.\n\nWhen you reach up to remove the robe it tears — it was always going to tear, it's that kind of garment — and comes away in two nearly equal pieces. You drop them into the gown barrel. The brass sign reads: USED GOWNS ONLY — DO NOT PUT FOOD IN HERE. You feel, if not better, at least covered.",
  "The clothes smell of other people's hard times, which makes them appropriate. You dress under the robe with practiced urgency. Nobody in the Main Hall pays attention. They've all seen this before. When you finally remove the gown it offers one last indignity — a long tearing sound in the exact frequency of maximum embarrassment — and falls apart. Into the barrel it goes. You are dressed. This is an improvement.",
  "You sort through the donated clothes quickly. Beggars and choosers, etc. Under the cover of the robe you dress with the concentrated focus of someone defusing something. When the robe comes off it tears cleanly along a seam that was clearly already planning to fail. You fold the pieces with unnecessary dignity and place them in the gown barrel. The Main Hall continues around you, indifferent. Good.",
  "The charity barrel produces adequate clothing. You dress under the robe with your back to the wall, which helps with the draft situation. When you pull the robe over your head it gives up the structural argument immediately — a soft tearing sound, two pieces, done. You drop it in the USED GOWNS barrel. You are a person wearing clothes now. This matters more than it should.",
  "You take what you need from the barrel. Under the cover of the gray robe you dress, which is something of a philosophical act — putting on clothes under clothing, becoming decent in layers. The robe, when you finally remove it, tears with the quiet resignation of something that always knew it was temporary. It goes in the gown barrel. You stand in the Main Hall wearing real clothes for the first time since you died. It's a start.",
];

export const BARREL_NPC_HINTS: string[] = [
  "They glance at the two barrels near the south wall. The message is clear.",
  "Their eyes flick toward the charity barrel by the south wall, then back to you.",
  "A slight nod toward the barrels near the south wall. You know what they mean.",
  "They say nothing about the robe, which is kind. But they look at the charity barrel pointedly.",
  "Without comment, they tilt their head toward the barrels near the south wall.",
];

export const PLAYER_FUMBLE_DESCRIPTIONS: string[] = [
  "You overcommit — the weapon slips wide, catches nothing but air, and nearly clocks your own knee. The enemy doesn't laugh. That would be unprofessional.",
  "A clumsy recovery: you stumble on nothing in particular, blade low, dignity lower. No harm done except to your pride.",
  "The swing goes wrong in a way that statistics reserve for beginners and veterans on bad days. You pull back before you hurt yourself. Barely.",
  "Your foot finds a floorboard that wasn't there a moment ago. The attack dies stillborn; you look like you're inventing a new dance.",
  "The weapon twists in your grip. For one heartbeat you're fighting your own equipment instead of the foe. Neither wins.",
];

export const ALDRIC_OPENING_LINES: string[] = [
  `"I've seen it all," Aldric says. "Lived a thousand lives, died a thousand deaths — mostly in that order, which is the right way round. I enjoy hanging out here with Hokas. I tolerate Sam."\n\nHe leans back. "What can I answer for you?\n\n  TELL Aldric survival    — getting back on your feet\n  TELL Aldric combat      — how fighting actually works\n  TELL Aldric training    — what I can teach you\n  TELL Aldric skills      — the skill system and the cap\n  TELL Aldric adventures  — what's posted on the board\n  TELL Aldric world       — the Guild, the Church, the city\n  TELL Aldric magic       — the safe kind\n  TELL Aldric secrets     — (buy me an ale first)"`,
  `Aldric sets down his tankard. "You look like you have questions. Good. Most people don't ask until it's too late."\n\nHe counts on his remaining fingers. "Here's what I know about:\n\n  TELL Aldric survival    — the basics for staying alive\n  TELL Aldric combat      — the mechanics, plain language\n  TELL Aldric training    — I train, for gold\n  TELL Aldric skills      — how skills grow and decay\n  TELL Aldric adventures  — what's worth doing and what isn't\n  TELL Aldric world       — context you'll need eventually\n  TELL Aldric magic       — Guild spells and their limits\n  TELL Aldric secrets     — that costs an ale"`,
  `"Pull up a chair," Aldric says. "I've been waiting for someone worth talking to."\n\nHe eyes you steadily. "I know this world better than most. Ask me about:\n\n  TELL Aldric survival    — start here if you're new or reborn\n  TELL Aldric combat      — before you get into a fight\n  TELL Aldric training    — I train here in the hall, for gold — tiered rates\n  TELL Aldric skills      — important rules your body follows\n  TELL Aldric adventures  — the three postings on the board\n  TELL Aldric world       — the Guild, the Church, and more\n  TELL Aldric magic       — what you can learn openly\n  TELL Aldric secrets     — ale required. Non-negotiable."`,
];

export const ALDRIC_TOPIC_RESPONSES: Record<string, string[]> = {
  survival: [
    `"First things first," Aldric says.\n\n"If you're wearing that gray robe — " he gestures at the south wall " — charity barrel. Take the clothes. The robe tears off, that's normal. Goes in the gown barrel next to it."\n\n"Second: weapon. If you're empty-handed, say __CMD:BEG SAM__ — he'll give you a rusty sword — or __CMD:BEG HOKAS__ for a butcher knife. Either kills."\n\n"Third: __CMD:GO DOWN__ to the bank. Talk to Brunt. __CMD:DEPOSIT__ every coin you don't want to lose. What's in your pockets dies with you. What's in the bank doesn't."\n\n"Fourth: notice board. __CMD:GO EAST__ from here. Three contracts posted — start with the Cave."\n\nHe taps the table. "Also — there's a row of iron chests along the wall. Your key opens one of them. __CMD:USE KEY__. Might be something useful inside."\n\nAnything else? __CMD:TELL Aldric combat__ __CMD:TELL Aldric adventures__ __CMD:TELL Aldric training__`,
  ],
  combat: [
    `"Fighting's changed since you forgot," Aldric says. He leans forward.\n\n"You start a fight with __CMD:ATTACK DUFUS__ — or whatever you're fighting. That locks you in. From there, you pick a body part to hit every round:"\n\n__CMD:STRIKE TORSO__ __CMD:STRIKE LIMBS__ __CMD:STRIKE HEAD__ __CMD:STRIKE NECK__\n\n"Torso's the easy shot — big target, hard to miss. Limbs are a little harder. Head is genuinely difficult. Neck?" He draws a finger across his throat. "Double damage. But you'll miss more than you hit unless you're very good or very lucky."\n\n"Every round: you pick a zone, they pick a zone. Initiative decides who swings first. Three things can stop your strike — they dodge it, their shield catches it, or their armor turns it. If it gets through all three, it lands."\n\nHe flexes his wooden hand. "Injuries happen. Head shots cause concussions. Neck hits sever arteries. Break a man's leg and he can't flee. Break his arm and he can't swing straight."\n\n"If it goes badly: __CMD:FLEE__. No shame in living."\n\nMore? __CMD:TELL Aldric training__ __CMD:TELL Aldric skills__ __CMD:TELL Aldric survival__`,
  ],
  training: [
    `"Two ways to get better with a weapon," Aldric says.\n\n"First way: hit things. Every time you land a real hit, your weapon skill ticks up one point. Slow. Cheap. Effective."\n\n"Second way: pay me." He almost smiles. "Say __CMD:TRAIN__ and the skill you want — SWORDSMANSHIP, MACE, FENCING, ARCHERY, and so on. I charge by how good you already are:"\n\n"Skill 0–19: twenty-five gold, I put five points in. 20–49: a hundred gold, ten points. 50–99: three hundred, fifteen points. 100–199: seven-fifty, twenty points. Past two hundred? Find a better teacher."\n\n"Total skill across all nine tracks caps at seven hundred. Push past it and something else drops a point to make room."\n\n"No gold at all? Go south to the courtyard. __CMD:ATTACK DUFUS__. The training dummy teaches basics for free — up to twenty-five points in whatever you're swinging. After that you need real enemies or real gold."\n\nMore? __CMD:TELL Aldric combat__ __CMD:TELL Aldric skills__ __CMD:TELL Aldric adventures__`,
  ],
  skills: [
    `"Nine tracks," Aldric says, ticking them off. "Swordsmanship, Mace Fighting, Fencing, Archery, Armor Expertise, Shield Expertise, Stealth, Lockpicking, Magery."\n\n"Your weapon skill does two things in a fight. First — dexterous fighters are harder to hit, and your dexterity helps you land hits too. Skill doesn't change that. What skill does is increase your chance of a critical hit — a rare, ugly thing — and it's what I train for gold."\n\n"Here's the important part: armor makes you slower. Every piece of steel you strap on costs you agility. Leather costs a little. Chain costs more. Plate?" He shakes his head. "Plate is for men on horses, not men in caves."\n\n"A fast fighter in no armor who knows how to move — that's the hardest thing to kill in a dungeon. A slow fighter in full chain gets hit by everything but shrugs most of it off. Different path, same survival. Pick one."\n\n"__CMD:STATS__ shows your sheet. __CMD:INVENTORY__ shows your gear."\n\nMore? __CMD:TELL Aldric combat__ __CMD:TELL Aldric training__ __CMD:TELL Aldric adventures__`,
  ],
  adventures: [
    `"Go east from this hall to the notice-board room," Aldric says. "__CMD:GO EAST__. Three contracts on Guild parchment:"\n\n"The Beginner's Cave — goblin infestation north of the city. Novice difficulty. Start here."\n\n"The Thieves Guild — social infiltration. Moderate. Not for the clumsy."\n\n"The Haunted Manor — if you've said goodbye to everyone you love."\n\n"__CMD:READ__ the board in that room for the full postings. When you're ready, the posting tells you the exact command — ENTER THE BEGINNER'S CAVE, and so on. Spell it like the posting says."\n\nHe leans in. "Start with the Cave unless you enjoy being a cautionary tale."\n\nMore? __CMD:TELL Aldric survival__ __CMD:TELL Aldric combat__ __CMD:TELL Aldric training__`,
  ],
  world: [
    `"You're in the Guild of Free Adventurers," Aldric says. "This is where everything starts and everything returns to."\n\n"Main Hall — company, drink, me. __CMD:GO EAST__ for the notice board. __CMD:GO NORTH__ for the armory — Pip's got basic gear. __CMD:GO DOWN__ for the bank — Brunt banks your gold. __CMD:GO SOUTH__ for the courtyard — fresh air, Sam's weapon shop to the north of it, and Dufus the training dummy."\n\n"The Church of Perpetual Life is west from the courtyard. You came from there. You'll go back. It brings you back when you die — stripped of everything except what's in the bank."\n\n"Hokas runs the bar here. Buy food from him — it heals. Treat him well; he remembers."\n\n"The city outside Ostavar is a conversation for another day."\n\nMore? __CMD:TELL Aldric survival__ __CMD:TELL Aldric combat__ __CMD:TELL Aldric adventures__`,
  ],
  magic: [
    `"Guild-sanctioned magic is __CMD:CAST__ — BLAST, HEAL, LIGHT, SPEED — once you know them," Aldric says. "That's the safe, documented kind."\n\n"PRAY reaches gods whose names you earn in play. Don't embarrass yourself with empty invocations — learn a name first, then pray to it."\n\n"What you must not shout about in here is INVOKE." His voice drops. "Occult. Rare. Not my business in public."\n\nHe spreads his hands. "Stay inside CAST until you know what you're doing."\n\nMore? __CMD:TELL Aldric combat__ __CMD:TELL Aldric secrets__ __CMD:TELL Aldric world__`,
  ],
  secrets: [
    `"Secrets cost wetware and wheat," Aldric says mildly, raising his empty tankard. "Buy me an ale from Hokas, sit like you mean it, and ask again. Some answers are too long for a free sentence."\n\nYou might: __CMD:BUY ALE__ from Hokas, then __CMD:TELL Aldric secrets__ again.`,
  ],
  order: [
    `Aldric's voice drops until you're leaning in. "The Order — lower case when you speak it aloud. They don't recruit from shouting."\n\n"If you need them, you'll be pointed. Until then, practice looking like you belong here and nowhere else."\n\nHe sits back, volume normal. "That's all you get without clearance."`,
  ],
};

// ============================================================
// ITEMS
// ============================================================

/**
 * Build a Grok Imagine prompt for a square inventory icon.
 * All icons share the same template so the inventory grid reads
 * cohesively. The `subject` should be a concrete physical
 * description of the OBJECT the player is holding — NEVER the
 * lore name (e.g. "small wooden cup of murky brown brew with a
 * sprig of black willow bark beside it" — NOT "Nimble Toes",
 * because Grok will draw feet).
 *
 * Used by the icon pregen pipeline. Items can override per-item
 * via the `ITEM_ICON_PROMPTS` map below; otherwise we fall back
 * to `buildItemIconPrompt(item.name)` (which works for items
 * whose name IS already a concrete object, e.g. "Short Sword").
 */
export function buildItemIconPrompt(subject: string): string {
  return (
    `A single ${subject}, centered, painted in the style of a Hyborian-Age ` +
    `inventory illustration — Frazetta/Brom medieval painted realism, weathered ` +
    `but iconic, slightly desaturated colors. Pure clean white background, no ` +
    `shadow, no ground, no border, no text, no labels, no other objects. Square ` +
    `composition, the subject fills 70% of the frame, viewed from a slightly ` +
    `elevated three-quarter angle. ` +
    `If the subject is a long weapon (sword, axe, polearm, spear, staff, bow, ` +
    `crossbow), it should lie diagonally from LOWER-LEFT to UPPER-RIGHT — ` +
    `grip/hilt/handle at the lower-left, blade-tip/head/business-end at the ` +
    `upper-right.`
  );
}

/**
 * Per-item icon subject overrides. Each entry is the SUBJECT
 * passed to buildItemIconPrompt — describes the physical object,
 * not the lore name. Items not in this map fall back to their
 * `name` (which works for items like "Short Sword" or "Healing
 * Potion" where the name is already a concrete object).
 *
 * Add a new entry whenever an item's name doesn't visually
 * describe the item itself (renamed potions, lore-named loot,
 * etc.) or when the default rendering came out wrong.
 */
export const ITEM_ICON_PROMPTS: Record<string, string> = {
  // ── Weapons ────────────────────────────────────────────────
  // Most weapon names ARE the object — use defaults. Override
  // only where the name is ambiguous or the default came out wrong.
  battle_axe: "heavy two-handed iron battle axe with a long wooden haft, lying diagonally with the wooden grip at the lower-left and the broad iron axe-head at the upper-right",
  scimitar: "curved single-edged scimitar with a leather-wrapped grip, lying diagonally with the hilt at the lower-left and the curved blade-tip at the upper-right",
  rusty_shortsword: "rusty pitted iron short sword with a weathered leather-wrapped grip and a notched dull edge",
  butcher_knife: "heavy-bladed kitchen butcher knife, single-edged, wooden handle, slightly stained blade",
  black_staff: "dark length of polished black hardwood, six feet long, slight taper, banded with a single dull-iron ring near one end",
  gnarled_staff: "twisted gnarled hardwood quarterstaff, knotted and bark-stripped, six feet long",
  castoff_short_sword: "old worn short sword, pitted blade, loose grip wrapping, bent crossguard",
  quarter_staff: "smooth straight hardwood quarterstaff, six feet long, banded at both ends with iron rings",
  pitchfork: "rusted three-tined iron pitchfork on a long wooden haft",
  bow: "simple curved hunting longbow of yew with a hempen string",
  crossbow: "heavy wooden crossbow with iron prod and a hempen string, mounted on a polished stock",
  repeating_crossbow: "compact wooden repeating crossbow with a vertical magazine box on top of the stock",
  spear: "iron-tipped wooden spear, leaf-shaped blade, six feet long",
  war_fork: "long-hafted weapon with twin curved iron prongs at the head, pole-arm length",

  // ── Clothing — charity barrel + Sam outfit + Hokas pity gift ─
  gray_robe: "thin pale-gray cloth robe with no back, hanging limp and shapeless, plain shoulders",
  moth_eaten_woolen_shirt: "dingy gray woolen shirt riddled with small moth-holes, folded loosely",
  threadbare_linen_shirt: "thin pale linen shirt worn nearly transparent in places, folded loosely",
  stained_canvas_tunic: "heavy off-white canvas tunic with brown and dark stains down the front, drawstring neck",
  homespun_pants: "rough undyed linen trousers, plain and short-cut, folded",
  patched_wool_breeches: "brown wool breeches covered in mismatched patches of darker cloth, folded",
  rough_canvas_trousers: "stiff pale canvas trousers, slightly creased, folded",
  cloth_shoes: "pair of soft pale cloth slippers with thin leather soles",
  worn_leather_sandals: "pair of well-worn brown leather sandals with twine-mended straps",
  mismatched_boots: "a pair of two clearly different leather boots, one taller than the other, different shades of brown",
  worn_leather_belt: "creased brown leather belt with a plain dull bronze buckle",
  fraying_rope_belt: "length of brown hempen rope tied as a belt, with knotted frayed ends",
  cracked_hide_strap: "wide strip of dark hide leather, cracked and dry, with a simple iron buckle",
  plain_shirt: "coarse undyed linen shirt, plain and unmarked, folded",
  plain_trousers: "simple gray-brown wool trousers, plain and undecorated, folded",
  plain_belt: "plain narrow brown leather belt with a small dull iron buckle",
  plain_shoes: "pair of plain brown leather shoes, slightly scuffed, low-cut",
  ragged_shirt: "threadbare pale linen shirt with three visible mended patches, folded",
  ragged_trousers: "faded gray-brown wool trousers worn thin at the knees, folded",
  ragged_belt: "cracked dark leather belt with a tarnished bronze buckle",
  ragged_shoes: "pair of soft-soled tan leather shoes, well-worn",

  // ── Armor (zone-tagged) ────────────────────────────────────
  leather_armor: "studded brown leather chest cuirass with shoulder straps and a buckle at the side, lacing visible",
  chain_mail: "interlocking iron chain-mail hauberk torso, draped, slight weathering",
  buckler: "small round metal-rimmed wooden buckler shield, central iron boss, leather grip strap on the back",
  leather_cap: "simple brown leather skullcap with a chinstrap, low-profile, plain",
  iron_helm: "open-faced iron skull-helm with a riveted brow band and a leather chinstrap",
  leather_gorget: "high stiff brown leather gorget collar that wraps the throat, with side buckles",
  chain_coif: "iron chain-mail coif (head and neck covering), draped on a wooden form",
  leather_greaves: "pair of brown leather greaves shaped to cover shins and knees, with side lacing",
  chain_greaves: "pair of iron chain-mail leg greaves, draped",
  plate_helm: "polished steel close-helm with cheek-plates and a slim eye-slit, full plate construction",
  plate_gorget: "polished steel articulated gorget collar with overlapping plates and rivets",
  plate_cuirass: "polished steel breastplate cuirass with shoulder pauldrons, full plate construction",
  plate_greaves: "pair of polished steel articulated leg greaves with knee cops and rivets",

  // ── Consumables / Potions / Cures ──────────────────────────
  healing_potion: "small glass vial of deep red liquid with a cork stopper, slightly luminous",
  greater_healing_potion: "tall slender glass flask of brilliant scarlet liquid with a wax-sealed cork, faintly pulsing",
  mana_potion: "crystal vial of iridescent blue liquid with a silver cap, faint glow",
  stamina_brew: "small wooden cup of murky brown brew with a sprig of dark willow bark beside it",
  fatigue_brew: "tall narrow glass vial of thick dark green draught with a wax-sealed cork",
  antidote: "small glass vial of chalky white suspension with a cork stopper",
  strong_antidote: "small glass vial of vivid yellow potion with a cork stopper, slightly cloudy",
  bandage: "a roll of clean white linen bandage, neatly wrapped",
  tourniquet: "a thick brown leather strap with a small iron windlass rod attached, coiled neatly",
  unreliable_poison: "small dark glass bottle of yellowish liquid with a black cork, dim and slightly murky",
  strong_poison: "small black glass bottle with a wax-sealed cork, the wax dark crimson, slightly sinister",

  // ── Reagents (sold to Zim) ─────────────────────────────────
  mandrake_root: "gnarled forked mandrake root shaped uncomfortably like a small screaming human figure, dirt clinging to it",
  black_pearl: "single large lustrous black pearl, slightly iridescent, resting on its side",
  nightshade: "small sprig of dark green nightshade with a cluster of black-purple berries",
  ginseng: "forked tan ginseng root with fine wispy rootlets, knobbled and aged",
  blood_moss: "small clump of crimson creeping moss, vivid red and slightly damp",
  spider_silk: "loose skein of pale silvery spider silk, glossy threads gathered in a small bundle",
  sulfurous_ash: "small heap of grey-yellow sulfurous ash piled loose, slightly crystalline",
  mysterious_bauble: "a small unidentified ornate metal trinket, vaguely amulet-shaped, dark patina, intricate filigree",

  // ── Misc consumables / treasure / keys ─────────────────────
  torch: "wooden torch with a pitch-soaked head wrapped in cloth, unlit",
  rope: "coiled length of thick brown hempen rope, tightly wound",
  rations: "small bundle of dried hard travel rations wrapped in waxed cloth, tied with twine",
  members_note: "small folded scrap of parchment with a broken wax seal",
  ale: "wooden tankard of dark frothy ale",
  hearty_meal: "wooden trencher with a thick stew, a hunk of dark bread, and a wedge of cheese",
  rumor_token: "small bronze guild token stamped with an unreadable sigil",
  notice_board_key: "small brass key with a notched bit and a leather thong loop",
  goblin_ear: "severed pointed grey-green goblin ear with traces of dried blood",
  cave_treasure: "small pile of mixed gold coins and a single gem, suggesting a modest hoard",
};

export const ITEMS: Record<string, Item> = {
  short_sword: {
    id: "short_sword",
    name: "Short Sword",
    description: "A reliable blade, well-balanced and easy to carry. The choice of sensible adventurers everywhere.",
    glance: "A reliable blade.",
    type: "weapon",
    value: 15,
    stats: { damage: "1d6" },
    isCarryable: true,
  },
  rusty_shortsword: {
    id: "rusty_shortsword",
    name: "Rusty Short Sword",
    description:
      "A short sword that has seen better decades. The blade is pitted with rust and the edge is uneven, but it is heavier than a fist and that is the point.",
    glance: "A pitted, rusty blade. Better than fists.",
    type: "weapon",
    value: 1,
    stats: { damage: "1d4" },
    isCarryable: true,
  },
  butcher_knife: {
    id: "butcher_knife",
    name: "Butcher Knife",
    description:
      "A heavy-bladed kitchen knife, well-used and not recently cleaned. It was made for cutting meat and it will do that regardless of what kind of meat is in front of it.",
    glance: "A heavy kitchen knife. Not recently cleaned.",
    type: "weapon",
    value: 2,
    stats: { damage: "2-14" },
    isCarryable: true,
  },
  long_sword: {
    id: "long_sword",
    name: "Long Sword",
    description: "A proper sword for proper heroics. Heavier than a short sword, but the extra reach has saved many lives.",
    type: "weapon",
    value: 30,
    stats: { damage: "1d8+1" },
    isCarryable: true,
  },
  dagger: {
    id: "dagger",
    name: "Dagger",
    description: "Small, concealable, and surprisingly effective at close range. Also useful for eating.",
    type: "weapon",
    value: 8,
    stats: { damage: "1d4+1" },
    isCarryable: true,
  },
  crossbow: {
    id: "crossbow",
    name: "Crossbow",
    description: "A heavy crossbow with a box of twenty bolts. Requires two hands and time to reload, but hits hard.",
    type: "weapon",
    value: 45,
    stats: { damage: "5-14" },
    isCarryable: true,
  },
  katana: {
    id: "katana",
    name: "Katana",
    description: "A curved single-edged blade in the eastern style.",
    type: "weapon",
    value: 90,
    stats: { damage: "4-15" },
    isCarryable: true,
  },
  kryss: {
    id: "kryss",
    name: "Kryss",
    description: "A slender wavy-bladed thrusting blade.",
    type: "weapon",
    value: 35,
    stats: { damage: "2-13" },
    isCarryable: true,
  },
  war_axe: {
    id: "war_axe",
    name: "War Axe",
    description: "A one-handed axe balanced for war.",
    type: "weapon",
    value: 70,
    stats: { damage: "5-15" },
    isCarryable: true,
  },
  mace: {
    id: "mace",
    name: "Mace",
    description: "A flanged head on a stout handle — armor's worst friend.",
    type: "weapon",
    value: 45,
    stats: { damage: "4-14" },
    isCarryable: true,
  },
  scepter: {
    id: "scepter",
    name: "Scepter",
    description: "An ornamental weapon that still cracks skulls.",
    type: "weapon",
    value: 50,
    stats: { damage: "4-14" },
    isCarryable: true,
  },
  scimitar: {
    id: "scimitar",
    name: "Scimitar",
    description: "A curved scimitar that sings when it cuts.",
    type: "weapon",
    value: 55,
    stats: { damage: "3-14" },
    isCarryable: true,
  },
  cutlass: {
    id: "cutlass",
    name: "Cutlass",
    description: "A sailor's favorite — short, sturdy, vicious.",
    type: "weapon",
    value: 50,
    stats: { damage: "3-14" },
    isCarryable: true,
  },
  skinning_knife: {
    id: "skinning_knife",
    name: "Skinning Knife",
    description: "A small curved blade; useful in camp or in a tight fight.",
    type: "weapon",
    value: 10,
    stats: { damage: "1-9" },
    isCarryable: true,
  },
  halberd: {
    id: "halberd",
    name: "Halberd",
    description: "Axe, spike, and hook on a long shaft — a footman's terror.",
    type: "weapon",
    value: 100,
    stats: { damage: "5-17" },
    isCarryable: true,
  },
  battle_axe: {
    id: "battle_axe",
    name: "Battle Axe",
    description: "A heavy two-handed axe meant to split shields.",
    type: "weapon",
    value: 95,
    stats: { damage: "6-18" },
    isCarryable: true,
  },
  war_hammer: {
    id: "war_hammer",
    name: "War Hammer",
    description: "A massive two-handed hammer for crushing plate.",
    type: "weapon",
    value: 110,
    stats: { damage: "7-19" },
    isCarryable: true,
  },
  maul: {
    id: "maul",
    name: "Maul",
    description: "A brutal two-handed maul — simple and overwhelming.",
    type: "weapon",
    value: 95,
    stats: { damage: "6-18" },
    isCarryable: true,
  },
  bardiche: {
    id: "bardiche",
    name: "Bardiche",
    description: "A long poleaxe with a sweeping blade.",
    type: "weapon",
    value: 100,
    stats: { damage: "5-17" },
    isCarryable: true,
  },
  executioners_axe: {
    id: "executioners_axe",
    name: "Executioner's Axe",
    description: "An enormous axe — grim purpose, undeniable reach.",
    type: "weapon",
    value: 120,
    stats: { damage: "7-19" },
    isCarryable: true,
  },
  large_battle_axe: {
    id: "large_battle_axe",
    name: "Large Battle Axe",
    description: "Even larger than a battle axe; a strength test with a handle.",
    type: "weapon",
    value: 115,
    stats: { damage: "7-21" },
    isCarryable: true,
  },
  spear: {
    id: "spear",
    name: "Spear",
    description: "Reach and simplicity — the oldest argument in war.",
    type: "weapon",
    value: 75,
    stats: { damage: "5-15" },
    isCarryable: true,
  },
  war_fork: {
    id: "war_fork",
    name: "War Fork",
    description: "Twin prongs on a pole — catch, twist, ruin the day.",
    type: "weapon",
    value: 70,
    stats: { damage: "4-15" },
    isCarryable: true,
  },
  black_staff: {
    id: "black_staff",
    name: "Black Staff",
    description: "A dark length of wood that hums faintly when swung.",
    type: "weapon",
    value: 40,
    stats: { damage: "4-14" },
    isCarryable: true,
  },
  gnarled_staff: {
    id: "gnarled_staff",
    name: "Gnarled Staff",
    description: "Twisted roots shaped into a fighting staff.",
    type: "weapon",
    value: 35,
    stats: { damage: "4-14" },
    isCarryable: true,
  },
  gray_robe: {
    id: "gray_robe",
    name: "Gray Robe",
    description:
      "A thin gray robe with no back. Standard issue for the recently reborn. The draft it provides is considerable. The dignity it provides is not.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  moth_eaten_woolen_shirt: {
    id: "moth_eaten_woolen_shirt",
    name: "Moth-Eaten Woolen Shirt",
    description:
      "A grey woolen shirt with several moth holes that let in more air than is comfortable. It smells of cedar and long storage.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  threadbare_linen_shirt: {
    id: "threadbare_linen_shirt",
    name: "Threadbare Linen Shirt",
    description: "A linen shirt worn so thin in places you can read through it. Still, it covers.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  stained_canvas_tunic: {
    id: "stained_canvas_tunic",
    name: "Stained Canvas Tunic",
    description:
      "A heavy canvas tunic with stains of uncertain origin and a drawstring that has been retied so many times the knot is now structural.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  homespun_pants: {
    id: "homespun_pants",
    name: "Homespun Pants",
    description: "Rough homespun trousers, undyed, slightly too short. Functional.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  patched_wool_breeches: {
    id: "patched_wool_breeches",
    name: "Patched Wool Breeches",
    description: "Wool breeches with patches on the patches. Someone put real effort into keeping these alive.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  rough_canvas_trousers: {
    id: "rough_canvas_trousers",
    name: "Rough Canvas Trousers",
    description: "Canvas trousers stiff enough to stand up on their own. They will soften eventually. Probably.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  cloth_shoes: {
    id: "cloth_shoes",
    name: "Cloth Shoes",
    description:
      "Soft-soled cloth shoes, the kind worn by people who are mostly indoors. Outdoors they are optimistic.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  worn_leather_sandals: {
    id: "worn_leather_sandals",
    name: "Worn Leather Sandals",
    description:
      "Leather sandals that have walked a long way and show it. The straps have been mended with twine.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  mismatched_boots: {
    id: "mismatched_boots",
    name: "Mismatched Boots",
    description:
      "Two boots. They are both boots. That is where the agreement ends — different heights, different leather, different opinions about your left foot.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  worn_leather_belt: {
    id: "worn_leather_belt",
    name: "Worn Leather Belt",
    description: "A leather belt creased in three places from years of use. It works.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  fraying_rope_belt: {
    id: "fraying_rope_belt",
    name: "Fraying Rope Belt",
    description:
      "A length of rope repurposed as a belt. The fraying ends have been knotted to slow the entropy.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  cracked_hide_strap: {
    id: "cracked_hide_strap",
    name: "Cracked Hide Strap",
    description:
      "A wide strap of hide, cracked from drying out too many times. Still holds trousers up, which is the job.",
    type: "clothing",
    value: 1,
    isCarryable: true,
  },
  plain_shirt: {
    id: "plain_shirt",
    name: "Plain Shirt",
    description:
      "A coarse linen shirt, undyed and unmarked. It covers what the guild robe did not.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  plain_trousers: {
    id: "plain_trousers",
    name: "Plain Trousers",
    description: "Simple wool trousers. They chafe a little and look like nothing in particular.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  plain_belt: {
    id: "plain_belt",
    name: "Plain Belt",
    description: "A strip of leather with a dull buckle. It holds the trousers up; that is its whole biography.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  plain_shoes: {
    id: "plain_shoes",
    name: "Plain Shoes",
    description: "Nondescript leather shoes, already scuffed. Better than bare feet on guild stone.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  ragged_shirt: {
    id: "ragged_shirt",
    name: "Ragged Shirt",
    description:
      "Threadbare linen, mended in three places. It covers thy back — a small mercy from someone who remembers being broke.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  ragged_trousers: {
    id: "ragged_trousers",
    name: "Ragged Trousers",
    description: "Wool trousers faded and thin at the knees. They have seen hard roads and harder taverns.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  ragged_belt: {
    id: "ragged_belt",
    name: "Ragged Belt",
    description: "Cracked leather with a tarnished buckle. It still holds.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  ragged_shoes: {
    id: "ragged_shoes",
    name: "Ragged Shoes",
    description: "Soft-soled shoes, the kind innkeepers keep for guests who arrive with nothing on their feet.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  castoff_short_sword: {
    id: "castoff_short_sword",
    name: "Cast-Off Short Sword",
    description:
      "An old, worthless short sword — notched, loose in the grip, more club than blade. Still heavier than a fist.",
    type: "weapon",
    value: 0,
    stats: { damage: "1d4" },
    isCarryable: true,
  },
  quarter_staff: {
    id: "quarter_staff",
    name: "Quarter Staff",
    description: "Straight hardwood; in trained hands, a blur.",
    type: "weapon",
    value: 25,
    stats: { damage: "4-14" },
    isCarryable: true,
  },
  pitchfork: {
    id: "pitchfork",
    name: "Pitchfork",
    description: "Farm tool or improvised polearm — Sam doesn't ask.",
    type: "weapon",
    value: 30,
    stats: { damage: "4-12" },
    isCarryable: true,
  },
  bow: {
    id: "bow",
    name: "Bow",
    description: "A sturdy bow; string it and keep your distance.",
    type: "weapon",
    value: 80,
    stats: { damage: "6-17" },
    isCarryable: true,
  },
  repeating_crossbow: {
    id: "repeating_crossbow",
    name: "Repeating Crossbow",
    description: "A crossbow with a bolt box — rapid, heavy, expensive.",
    type: "weapon",
    value: 90,
    stats: { damage: "4-12" },
    isCarryable: true,
  },
  leather_armor: {
    id: "leather_armor",
    name: "Leather Armor",
    description: "Boiled leather armor that provides basic protection without slowing you down.",
    type: "armor",
    value: 20,
    stats: { armorClass: 2, zoneSlot: "torso", zoneCover: 40, zoneDurability: 30, dexPenalty: 2 },
    isCarryable: true,
  },
  chain_mail: {
    id: "chain_mail",
    name: "Chain Mail",
    description: "Interlocking iron rings that stop blades and arrows alike. Heavy, but worth it.",
    type: "armor",
    value: 60,
    stats: { armorClass: 4, zoneSlot: "torso", zoneCover: 65, zoneDurability: 50, dexPenalty: 5 },
    isCarryable: true,
  },
  buckler: {
    id: "buckler",
    name: "Buckler",
    description: "A small steel buckler, light enough to parry and turn a blade without tiring the arm.",
    type: "armor",
    value: 30,
    stats: { armorClass: 1, shieldBlockChance: 25, shieldDurability: 20, dexPenalty: 1 },
    isCarryable: true,
  },
  torch: {
    id: "torch",
    name: "Torch",
    description: "A pitch-soaked torch that burns for about an hour. Essential in dark places.",
    type: "consumable",
    value: 2,
    isCarryable: true,
  },
  rope: {
    id: "rope",
    name: "Rope (50 ft)",
    description: "Fifty feet of good hemp rope. You will be amazed how often this saves your life.",
    type: "consumable",
    value: 5,
    isCarryable: true,
  },
  rations: {
    id: "rations",
    name: "Trail Rations",
    description: "Three days of dried meat, hard cheese, and biscuits that could double as thrown weapons.",
    type: "consumable",
    value: 3,
    stats: { healAmount: 2 },
    isCarryable: true,
  },
  members_note: {
    id: "members_note",
    name: "Hastily Scrawled Note",
    description:
      `A torn scrap of parchment in rushed, unsteady handwriting:\n\n"String of bad luck lately. Bank is empty. My friends have all disappeared. I'm going to fight that bastard Ishmael again and try to find out what he did to everyone to make them forget everything. Apologies to YOU, future me, if I failed."`,
    glance: "A desperate note from a previous occupant of this locker.",
    type: "key",
    value: 0,
    isCarryable: true,
  },
  ale: {
    id: "ale",
    name: "Tankard of Ale",
    description: "A foaming tankard of Hokas's house ale. Warm, reliable, and deeply comforting.",
    type: "consumable",
    value: 1,
    stats: { healAmount: 1 },
    isCarryable: false,
  },
  hearty_meal: {
    id: "hearty_meal",
    name: "Hearty Meal",
    description: "Roasted meat, root vegetables, and bread thick enough to use as a shield in a pinch.",
    type: "consumable",
    value: 3,
    stats: { healAmount: 5 },
    isCarryable: false,
  },
  rumor_token: {
    id: "rumor_token",
    name: "Rumor (from Hokas)",
    description: "Information purchased from Hokas Tokas about one of the available adventures.",
    type: "consumable",
    value: 5,
    isCarryable: false,
  },
  // ── Potions & Consumables (Pots & Bobbles) ───────────────
  healing_potion: {
    id: "healing_potion",
    name: "Healing Potion",
    description: "A small glass vial of deep red liquid. It tastes like copper and warmth. Restores a moderate amount of health.",
    glance: "A red vial. Heals wounds.",
    shortDescription: "Restores moderate health.",
    alchemicalDescription: "Of the simplest healing tincture: distil one part mandrake root with three parts blood-moss in a copper alembic at moonrise. The flesh remembers what it was, and so returns. Thurian surgeons carried it in war.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a small glass vial of deep red liquid, a curling mandrake root, and a clump of dark blood-moss. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, a coiled serpent for Set, a small purple-tower silhouette of fallen Valusia, a heart-shaped sigil. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia, rust, and oxblood tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 25,
    stats: { healAmount: 15 },
    isCarryable: true,
  },
  greater_healing_potion: {
    id: "greater_healing_potion",
    name: "Greater Healing Potion",
    description: "A larger flask of brilliant scarlet liquid that seems to pulse faintly. Restores a significant amount of health.",
    glance: "A pulsing scarlet flask. Serious healing.",
    shortDescription: "Restores significant health.",
    alchemicalDescription: "The greater draught uses a black pearl ground to powder and the fresh heart-blood beast. It pulses in the vial. The essence of life. Thurian war-priests brewed it for reviving the fallen mid-battle.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a tall scarlet flask pulsing with light, a small black pearl, and a copper alembic. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, a heart-shaped ruby sigil from the old Thurian rites, a beast-skull, war-priest glyphs, a small purple-tower silhouette of fallen Valusia. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia, deep crimson, and oxblood tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 60,
    stats: { healAmount: 35 },
    isCarryable: true,
  },
  mana_potion: {
    id: "mana_potion",
    name: "Mana Potion",
    description: "An iridescent blue liquid in a crystal vial. It hums when you hold it. Restores magical energy.",
    glance: "A humming blue vial. Restores mana.",
    shortDescription: "Restores magical energy.",
    alchemicalDescription: "The blue draught is distilled lightning, caught in a crystal vessel under a storm and tempered with seven drops of moon-wine. To drink it is to remember, briefly, what the soul knew before it was bound to flesh. The Thurian mages drank it without ceremony.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a crystal vial of iridescent blue liquid, a stylized lightning bolt, and a crescent moon. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, a third-eye glyph, a coiled serpent for Set, fragments of unreadable Words of Power. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia and rust tones with hints of deep indigo. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 30,
    isCarryable: true,
  },
  stamina_brew: {
    id: "stamina_brew",
    name: "Nimble Toes",
    description: "A murky brown liquid that smells like wet bark and tastes worse. Quickens the feet and sharpens reflexes.",
    glance: "A foul brown brew. Quickens the feet.",
    shortDescription: "Boosts dexterity briefly.",
    alchemicalDescription: "Bark of black willow, ginseng root, and the marrow of a running beast — simmered to a boil and strained through linen. The body forgets it is tired. The Thurian legions drank it ladled from giant cauldrons before battle.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a wooden cup of brown liquid, a strip of black willow bark, and a forked ginseng root. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, a running deer, a marching legion-spear, an Aquilonian rosette. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia and earthy brown tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 20,
    isCarryable: true,
  },
  fatigue_brew: {
    id: "fatigue_brew",
    name: "Silent Shadow",
    description: "A thick green draught. One swallow and the step turns soundless, the hand unerring.",
    glance: "A thick green draught. Greater quickness.",
    shortDescription: "Boosts dexterity significantly.",
    alchemicalDescription: "When Nimble Toes fails, this remains. The greater draught requires moon-grown moss, the breath of a sleeping mountain, and ginseng aged seven winters. Thurian assassins carried a single vial each, for feet like wings.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a tall vial of thick green draught, a tuft of pale moon-grown moss, and a withered ginseng root. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, a sleeping mountain silhouette, a crescent moon, a hunting owl. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia and verdant green tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 40,
    isCarryable: true,
  },
  antidote: {
    id: "antidote",
    name: "Antidote",
    description: "A chalky white suspension that neutralizes mild poisons. Tastes like crushed limestone and regret.",
    glance: "A white vial. Cures mild poisoning.",
    shortDescription: "Cures mild poisoning.",
    alchemicalDescription: "Powdered limestone, ash of nightshade burned to nothing, and milk of the white spider. The poison that wishes to remain in the blood is reasoned with, then escorted out. Thurian banquet-tasters drank it before every meal.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a small vial of chalky white liquid, a piece of limestone, and a stylized white spider. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, a balance scale, a coiled viper turned away, an Aquilonian rosette. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia and bone-white tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 10,
    isCarryable: true,
  },
  strong_antidote: {
    id: "strong_antidote",
    name: "Strong Antidote",
    description: "A vivid yellow potion that can neutralize even serious toxins. Burns going down.",
    glance: "A yellow vial. Cures serious poisoning.",
    shortDescription: "Cures serious poisoning.",
    alchemicalDescription: "Saffron of the southern hills, distilled in a copper still under sunlight, with one drop of the venom it must oppose. The poison teaches the body its own shape, and the body refuses it. Drink steadily; it burns the throat clean.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a vial of brilliant yellow potion, a bundle of saffron threads, and a copper distillation still. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, a sun-disc, a saffron crocus, an Aquilonian rosette. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia and golden-yellow tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 30,
    isCarryable: true,
  },
  bandage: {
    id: "bandage",
    name: "Bandage",
    description: "Clean linen strips. Stops light bleeding when applied to a wound.",
    glance: "Clean linen. Stops bleeding.",
    shortDescription: "Stops light bleeding.",
    alchemicalDescription: "Linen woven on a birch frame, washed seven times in salt water. Pressed firmly to a wound, it remembers the shape of the body and refuses the blood passage. Thurian surgeons carried bundles sewn into their cloaks.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a roll of clean linen bandage neatly folded, a small wooden cross of birch, and a salt crystal. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, an open healer's hand, a knotted cord, an Aquilonian rosette. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia and pale linen tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 1,
    isCarryable: true,
  },
  tourniquet: {
    id: "tourniquet",
    name: "Tourniquet",
    description: "A thick leather strap with a tightening mechanism. Stops even severe bleeding immediately. Painful but effective.",
    glance: "A leather strap. Stops severe bleeding.",
    shortDescription: "Stops severe bleeding immediately.",
    alchemicalDescription: "A strap of cured ox-leather with a small iron windlass. Tighten above the wound and turn until the blood remembers to stay within. It hurts. It works. Thurian field-surgeons fitted them above severed limbs without ceremony.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a leather tourniquet strap with a small iron windlass rod, coiled neatly. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, an iron knot-sigil, a war-surgeon's glyph, a small purple-tower silhouette of fallen Valusia. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia and dark leather tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 2,
    isCarryable: true,
  },
  unreliable_poison: {
    id: "unreliable_poison",
    name: "Painful Poison",
    description: "A small bottle of yellowish liquid. Apply to a blade for weak poison damage over 3 rounds. Lives up to the name.",
    glance: "A weak blade poison. 3 charges.",
    shortDescription: "Weak blade poison. 3 charges.",
    alchemicalDescription: "Crushed nightshade berries, fermented spider silk, a pinch of grave-soil. Smear it on a blade's edge and pray the cut goes deep. Thurian assassins called it 'the wager' — sometimes it killed, sometimes nothing at all.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a small dark bottle of yellowish poison, a sprig of nightshade berries, and a curl of spider silk. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, a pair of dice for the assassin's wager, a stylized spider, a coiled serpent for Set. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia and sickly yellow-green tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 10,
    stats: { poisonSeverity: 1, poisonCharges: 3 },
    isCarryable: true,
  },
  strong_poison: {
    id: "strong_poison",
    name: "Quick Death",
    description: "A dark bottle with a cork sealed in wax. Serious poison damage over 3 rounds. Don't get it on your hands.",
    glance: "A potent blade poison. 3 charges.",
    shortDescription: "Potent blade poison. 3 charges.",
    alchemicalDescription: "A patient distillation of nightshade, viper-marrow, and resin from one black tree in one valley. Three coats and the wound becomes a slow argument the body cannot win. Thurian court-poisoners signed their work with this.",
    bookPagePrompt: "Aged blood-stained parchment manuscript page floating on a PURE MATTE BLACK background, 4:3 aspect ratio, frayed worn edges visible against the black void surrounding the page on all sides. In the UPPER-LEFT QUADRANT only, a hand-drawn medieval ink sketch of a black bottle with wax-sealed cork, a coiled viper, and a drop of black resin. An illuminated manuscript border runs along the TOP edge and LEFT edge of the page only — twisting vines, angular Hyborian runes, a black tree, a court-poisoner's signet ring, a small purple-tower silhouette of fallen Valusia. The RIGHT TWO-THIRDS and the BOTTOM HALF of the page is intentionally CLEAN BLANK PARCHMENT — no artwork, no marginalia, no symbols there — reserved for a scribe's writing. Sepia and deep black-purple tones. No modern text, no English letters, no Latin script, no Greek letters — only decorative sigils. Style of an illuminated medieval monk's manuscript page crossed with a Hyborian-Age alchemical codex.",
    type: "consumable",
    value: 50,
    stats: { poisonSeverity: 3, poisonCharges: 3 },
    isCarryable: true,
  },

  // ── Herbs & Reagents (found in the field, sold to Zim) ──
  mandrake_root: {
    id: "mandrake_root",
    name: "Mandrake Root",
    description: "A gnarled root shaped uncomfortably like a screaming human figure. Used in healing potions and certain rituals best not described in polite company. Zim at Pots & Bobbles buys these.",
    glance: "A gnarled root. Valuable to alchemists.",
    type: "treasure",
    value: 8,
    isCarryable: true,
  },
  black_pearl: {
    id: "black_pearl",
    name: "Black Pearl",
    description: "A smooth, dark pearl that seems to absorb light rather than reflect it. Essential reagent for protective wards and certain dark invocations. Rare and valuable.",
    glance: "A dark pearl that drinks the light.",
    type: "treasure",
    value: 25,
    isCarryable: true,
  },
  nightshade: {
    id: "nightshade",
    name: "Nightshade",
    description: "A sprig of dark berries. Beautiful and lethal in equal measure. The base ingredient for most poisons. Handle with care.",
    glance: "Dark berries. Beautiful and lethal.",
    type: "treasure",
    value: 6,
    isCarryable: true,
  },
  ginseng: {
    id: "ginseng",
    name: "Ginseng Root",
    description: "A pale, forked root with a woody smell. Used in stamina brews and fatigue remedies. Grows in shaded forest floors.",
    glance: "A pale forked root. Used in stamina brews.",
    type: "treasure",
    value: 5,
    isCarryable: true,
  },
  blood_moss: {
    id: "blood_moss",
    name: "Blood Moss",
    description: "A deep crimson moss that grows only where blood has been spilled on stone. Used in coagulants and healing draughts. Zim pays well for it.",
    glance: "Crimson moss. Grows where blood was spilled.",
    type: "treasure",
    value: 10,
    isCarryable: true,
  },
  spider_silk: {
    id: "spider_silk",
    name: "Spider Silk",
    description: "A coil of impossibly thin, impossibly strong thread harvested from giant cave spiders. Used in antidotes and protective enchantments.",
    glance: "Impossibly thin thread. Used in antidotes.",
    type: "treasure",
    value: 12,
    isCarryable: true,
  },
  mysterious_bauble: {
    id: "mysterious_bauble",
    name: "Mysterious Bauble",
    description: "A small glass sphere with something moving inside it. You can't tell what. Zim might know.",
    glance: "A glass sphere with something inside.",
    type: "treasure",
    value: 15,
    isCarryable: true,
  },

  notice_board_key: {
    id: "notice_board_key",
    name: "Guild Member's Key",
    description: "A small iron key that identifies you as a registered Guild member.",
    type: "key",
    value: 0,
    isCarryable: true,
  },
  goblin_ear: {
    id: "goblin_ear",
    name: "Goblin Ear",
    description: "Proof of a goblin kill. The Guild pays a small bounty on these.",
    type: "treasure",
    value: 3,
    isCarryable: true,
  },
  cave_treasure: {
    id: "cave_treasure",
    name: "Cave Treasure Chest",
    description: "A battered iron chest filled with coins, a gem or two, and something wrapped in cloth.",
    type: "treasure",
    value: 150,
    isCarryable: false,
  },

  // ── Per-Zone Armor (HWRR-style) ────────────────────────────
  leather_cap: {
    id: "leather_cap",
    name: "Leather Cap",
    description: "A hardened leather skullcap. Won't stop a mace, but it's better than nothing.",
    type: "armor",
    value: 12,
    stats: { zoneSlot: "head", zoneCover: 30, zoneDurability: 15, dexPenalty: 1 },
    isCarryable: true,
  },
  iron_helm: {
    id: "iron_helm",
    name: "Iron Helm",
    description: "A dented iron helm with a nasal guard. Solid protection for the skull.",
    type: "armor",
    value: 40,
    stats: { zoneSlot: "head", zoneCover: 55, zoneDurability: 35, dexPenalty: 3 },
    isCarryable: true,
  },
  leather_gorget: {
    id: "leather_gorget",
    name: "Leather Gorget",
    description: "A stiff leather collar that protects the throat. Not fashionable. Functional.",
    type: "armor",
    value: 10,
    stats: { zoneSlot: "neck", zoneCover: 25, zoneDurability: 12, dexPenalty: 1 },
    isCarryable: true,
  },
  chain_coif: {
    id: "chain_coif",
    name: "Chain Coif",
    description: "A hood of interlocking iron rings that drapes over the neck and shoulders.",
    type: "armor",
    value: 35,
    stats: { zoneSlot: "neck", zoneCover: 45, zoneDurability: 25, dexPenalty: 2 },
    isCarryable: true,
  },
  leather_greaves: {
    id: "leather_greaves",
    name: "Leather Greaves",
    description: "Hardened leather guards for the arms and shins. Scarred by previous owners.",
    type: "armor",
    value: 15,
    stats: { zoneSlot: "limbs", zoneCover: 35, zoneDurability: 20, dexPenalty: 1 },
    isCarryable: true,
  },
  chain_greaves: {
    id: "chain_greaves",
    name: "Chain Greaves",
    description: "Chainmail sleeves and leg guards. Heavy but effective against slashing attacks.",
    type: "armor",
    value: 45,
    stats: { zoneSlot: "limbs", zoneCover: 55, zoneDurability: 40, dexPenalty: 3 },
    isCarryable: true,
  },

  // ── Plate Armor (custom-fit, mounted combat) ──────────────
  // On foot: crippling dex penalty. Mounted: comparable to chain.
  // Cost = 100 good swords. Cannot be looted or traded.

  plate_helm: {
    id: "plate_helm",
    name: "Plate Helm",
    description: "A full-faced steel helm with a riveted visor. Custom-forged to fit one head. On foot you can barely see; on horseback it is a steel skull.",
    type: "armor",
    value: 1250,
    stats: { zoneSlot: "head", zoneCover: 85, zoneDurability: 60, dexPenalty: 8, mountedDexPenalty: 3, customFit: true },
    isCarryable: true,
  },
  plate_gorget: {
    id: "plate_gorget",
    name: "Plate Gorget",
    description: "Articulated steel plates that encase the throat and collar. You cannot turn your head quickly, but nothing short of a war hammer is getting through.",
    type: "armor",
    value: 1000,
    stats: { zoneSlot: "neck", zoneCover: 75, zoneDurability: 50, dexPenalty: 6, mountedDexPenalty: 2, customFit: true },
    isCarryable: true,
  },
  plate_cuirass: {
    id: "plate_cuirass",
    name: "Plate Cuirass",
    description: "A breastplate and backplate of hammered Aquilonian steel, fitted to one torso. The weight is tremendous. Kings wear this to war; no one wears it anywhere else.",
    type: "armor",
    value: 1500,
    stats: { zoneSlot: "torso", zoneCover: 90, zoneDurability: 80, dexPenalty: 12, mountedDexPenalty: 5, customFit: true },
    isCarryable: true,
  },
  plate_greaves: {
    id: "plate_greaves",
    name: "Plate Greaves",
    description: "Steel cuisses, jambes, and sollerets. Your legs become pillars of metal. Walking is labor; riding is empire.",
    type: "armor",
    value: 1250,
    stats: { zoneSlot: "limbs", zoneCover: 80, zoneDurability: 60, dexPenalty: 10, mountedDexPenalty: 3, customFit: true },
    isCarryable: true,
  },
};

// ============================================================
// COMBAT TEMPLATES (static — no API needed)
// ============================================================

export const COMBAT_TEMPLATES = {
  playerHit: [
    "Your {weapon} finds its mark, dealing {damage} points of damage.",
    "You strike true with your {weapon} for {damage} damage.",
    "A solid blow with your {weapon} connects for {damage} damage.",
    "Your attack lands cleanly — {damage} damage dealt.",
  ],
  playerMiss: [
    "Your swing goes wide and finds only air.",
    "Your {weapon} glances off harmlessly.",
    "You overextend and stumble — the blow misses.",
    "The {enemy} sidesteps your attack with surprising grace.",
  ],
  enemyHit: [
    "The {enemy} strikes you for {damage} damage.",
    "A blow from the {enemy} connects — {damage} damage.",
    "The {enemy} finds a gap in your defense for {damage} damage.",
    "You take {damage} damage from the {enemy}'s attack.",
  ],
  enemyMiss: [
    "The {enemy} swings and misses.",
    "You dodge the {enemy}'s attack.",
    "The {enemy}'s blow goes wide.",
    "You parry the {enemy}'s strike.",
  ],
  playerDeath: [
    "Dark.",
    "The floor comes up fast.",
    "Not like this.",
    "You had more to do.",
    "The {enemy} was better. Today.",
    "Your legs go first. Then everything else. The {enemy} watches you fall.",
    "You try to raise your weapon. Your arm won't answer. The darkness is faster.",
    "The wound is bad. You knew it the moment it happened. You just didn't want to believe it.",
    "Your knees hit the stone before you decide to kneel. Your body has already surrendered.",
    "The last thing you feel is the cold of the floor against your cheek.",
    "You think of home. Briefly. Then nothing.",
    "There was so much left undone. The {enemy} didn't care.",
    "You weren't afraid. That surprises you, in the last moment.",
    "The pain stops. That's almost a mercy.",
    "You fought well. It wasn't enough. Not today.",
    "The {enemy} stands over you, breath heaving. You try to get up. You cannot.",
    "Your vision narrows to a point. The {enemy} is just a shape in the grey. Then gone.",
    "You hear yourself make a sound you've never made before. Then silence.",
    "The world tilts. You reach for something to hold. There is nothing. You fall.",
    "Blood. So much of it. Yours. You stare at it with something like wonder before the dark takes you.",
    "That was— you didn't even— the {enemy} moves so fast.",
    "You don't remember falling. You're just already on the ground.",
    "One moment you were fighting. The next you are looking at the ceiling.",
    "You blink. The fight is over. You lost. The realization arrives just before the darkness.",
    "It happens between heartbeats. The {enemy} finds the gap. That's all it takes.",
    "You don't fall all at once. You go in stages — first the weapon drops, then the knees, then the chest, then the cheek against cold stone, and somewhere in the long falling you understand that this is how it ends, here, like this, in this place, at the hands of this creature, and there is nothing you can do about it now.",
    "The {enemy} steps back and watches you bleed. You press your hand against the wound but the pressure does nothing and you both know it. You want to say something. Something that matters. But the words won't come and the dark is already eating the edges of your vision, and then it eats the middle too.",
    "You've been hurt before. This is different. This is the wound you don't come back from and your body knows it even if your mind refuses. You sink to your knees. You look up at the {enemy}. You want it to mean something. It doesn't. It's just a fight and you lost. The dark is kind, in the end. It comes quickly.",
    "The {enemy} wins. You don't.",
    "Gone.",
    "You were so close.",
    "It ends here.",
    "The ground is cold.",
    "You don't feel it until you're already falling.",
    "One mistake. That's all it took.",
    "The {enemy} was faster. By just enough.",
    "Between one breath and the next, everything changes.",
    "You blink and you're on your back and the fight is already over.",
    "Your fingers go first. The weapon falls before you tell it to.",
    "The cold starts at the wound and moves inward. Quickly.",
    "Your vision doesn't go dark — it goes white. Then nothing.",
    "You try to say something. Your mouth fills before the words form.",
    "The shaking starts in your hands and works its way to everything.",
    "You always knew it might end like this. You just hoped it wouldn't.",
    "There is a moment of perfect clarity before the dark. You waste it on regret.",
    "You think: I should have been more careful. Then you stop thinking.",
    "No one will know how hard you fought. That bothers you, at the end.",
    "The {enemy} didn't beat you. It just outlasted you. There's a difference. You die knowing it.",
  ],
};

// ── HUMANOID ENEMY DEATH ────────────────────────────────────

export const HUMANOID_DEATH_DESCRIPTIONS: string[] = [
  "Dead.",
  "The {enemy} drops.",
  "It's over.",
  "The {enemy} stops moving.",
  "One less.",
  "The {enemy} folds at the knees and goes down hard.",
  "The {enemy} hits the ground face-first and does not move again.",
  "The {enemy}'s weapon clatters from its hand. It follows it to the floor.",
  "The {enemy} staggers back, hits the wall, slides down it. Still.",
  "The {enemy} crumples like something essential has been removed.",
  "The {enemy} makes a sound — not a word, not a scream, just a sound — and then silence.",
  "The {enemy} gurgles once. Then the light goes out of its eyes.",
  "A long exhale. The {enemy}'s last breath mists in the cold air. Then nothing.",
  "The {enemy} screams — short, sharp, surprised — and then the scream stops.",
  "The {enemy} says something you can't hear. Its lips move once more. Then still.",
  "The {enemy}'s eyes go glassy. It takes a moment for the rest of it to catch up.",
  "The {enemy} looks at you with something you can't quite name. Then it's gone.",
  "The light leaves the {enemy}'s eyes before its body knows it's dead.",
  "The {enemy} stares at the wound with an expression of pure disbelief. Then falls.",
  "There is a moment — just a moment — where the {enemy} seems to understand. Then the eyes go empty.",
  "The {enemy} reaches for you one last time. The hand falls short. It falls shorter still.",
  "The {enemy} tries to speak. Blood fills the attempt. It pitches forward.",
  "On its back now, the {enemy} stares at the ceiling with an expression of profound surprise.",
  "The {enemy} gets back up once. You put it down again. It doesn't get up a third time.",
  "The {enemy} fights dying the way it fought living — hard and ugly and without grace. In the end it loses both fights.",
  "Your {weapon} found something vital. The {enemy} knows it. Falls.",
  "The {enemy} had a plan. The plan ended here.",
  "It bleeds out quickly. You watch to be sure.",
  "The {enemy} doesn't die all at once. But it gets there.",
  "No last words. Just the floor.",
  "The {enemy} goes down slow. It keeps trying to get back up and each time it nearly makes it and each time it doesn't quite, and then it stops trying and just lies there breathing in wet ragged pulls and you stand over it and wait and then even those stop and the room is quiet.",
  "The {enemy} falls and in the falling seems almost graceful, one arm thrown out, weapon spinning away, and it hits the ground with a sound that is more final than you expected, and lies there in a spreading red halo, and you realize your hands are shaking.",
  "It dies looking at you. Right at you. And you meet its gaze because it seems wrong not to, and you stand there together in that strange intimacy of one who killed and one who was killed, and then the eyes go still and you are alone with what you've done.",
  "Gone.",
  "The {enemy} goes quiet.",
  "Down. Staying down.",
  "Nothing left to fight.",
  "Whatever it was, it's over.",
  "The {enemy} takes one step back, then another, then the legs give and it sits down wrong and doesn't get up.",
  "The {enemy}'s mouth opens. Whatever was going to come out never does.",
  "The {enemy} doesn't fall so much as deflate — all the fight going out of it at once.",
  "A twitch. Two. The {enemy}'s hand closes and opens and closes and then is still.",
  "The {enemy} looks at the wound with the calm of someone doing arithmetic. Then falls.",
  "A sound like a question — high, brief, confused — and then the {enemy} is on the floor.",
  "The {enemy} exhales and does not inhale again.",
  "No scream. Just a wet, small sound and then the thud of weight hitting stone.",
  "The {enemy} makes a noise you've heard before. Once. You didn't forget it.",
  "A gasp — surprise more than pain — and then silence fills the space the {enemy} occupied.",
  "The {enemy} is still looking at you. Even now. Even from the floor.",
  "You stand over the {enemy} and feel nothing yet. That comes later.",
  "The {enemy} died the way it lived — without grace, without dignity. At least it was quick.",
  "Something leaves when the {enemy} dies. Not just the life. Something else. The room feels emptier.",
  "You've killed before. It doesn't get easier. Anyone who says it does is lying.",
];

// ── BEAST ENEMY DEATH ───────────────────────────────────────

export const BEAST_DEATH_DESCRIPTIONS: string[] = [
  "It drops.",
  "The {enemy} falls mid-lunge.",
  "A yelp. Then silence.",
  "It tries to rise. Cannot.",
  "Still at last.",
  "The {enemy} lets out a long, low whine and then is quiet.",
  "A sharp cry — almost human in its surprise — and then the {enemy} folds.",
  "The {enemy} snarls once more, weakly, then the snarl fades into nothing.",
  "A howl that cuts off wrong. The {enemy} falls sideways.",
  "The {enemy} whimpers. Just once. Then still.",
  "The {enemy} collapses mid-stride, momentum carrying it forward even as the life leaves it.",
  "Four legs buckle at once. The {enemy} goes down like a felled tree.",
  "The {enemy} tries to crawl toward you with its last strength. It doesn't make it.",
  "The {enemy} rolls onto its side and its legs keep running for a moment, going nowhere.",
  "The great body shudders once, twice, then is motionless.",
  "The {enemy}'s eyes go dim. Not like a person — like a lamp guttering out.",
  "Something leaves the {enemy}'s eyes before its body stops moving. Something that was watching.",
  "The {enemy} was magnificent and terrible and now it is neither. Now it is just weight on the ground.",
  "The {enemy} looked at you at the end. You'll remember that look.",
  "It fought until it had nothing left. Then it gave that too.",
  "The {enemy} goes down hard and tries to get up — haunches first, then front legs — and almost makes it, almost, before the legs give out again and it lies there with its sides heaving and those eyes still on you, still watching, still something in them even now, and then the heaving slows and the eyes close and the breathing stops and there is just the silence and the weight of what happened here.",
  "It folds.",
  "The {enemy} goes down and stays down.",
  "A sound. Then nothing.",
  "Still.",
  "At rest, finally.",
  "The {enemy}'s legs give in sequence — rear first, then front — and it lies down like it's sleeping.",
  "A shudder moves through the {enemy} from nose to tail. Then it is very still.",
  "The {enemy} tries to stand one more time. Makes it halfway. Falls the rest.",
  "The great head drops. The body follows. The sound of it hitting the ground is heavier than you expected.",
  "The {enemy}'s breath comes in shorter and shorter pulls until it doesn't come at all.",
  "The {enemy}'s eyes stay open. Wide. Fixed on something you cannot see.",
  "The light leaves the {enemy}'s eyes slowly. Like a coal going cold.",
  "The {enemy} looks at you at the end. There is no hate in it. Only the fact of dying.",
  "Those eyes — yellow, fierce, alive — go flat. The body takes a moment to catch up.",
  "The {enemy} blinks once more. Slowly. Then does not blink again.",
  "It was only doing what its nature demanded. You remember that, standing over it.",
  "The {enemy} was magnificent. You killed it anyway. You're not sure how you feel about that.",
  "Something about the way it died — proud, still fighting — stays with you.",
  "The {enemy} never understood what was happening to it. That makes it worse somehow.",
  "It died with its teeth bared. Even at the end, it didn't yield. You respect that, a little.",
];

// ── AMORPHOUS ENEMY DEATH ───────────────────────────────────

export const AMORPHOUS_DEATH_DESCRIPTIONS: string[] = [
  "It stops moving.",
  "The mass goes still.",
  "The {enemy} collapses inward.",
  "Nothing left.",
  "Just a stain now.",
  "The {enemy}'s mass loses cohesion all at once — it spreads across the floor and does not reform.",
  "The {enemy} contracts to half its size, then a quarter, then collapses into a still, dark puddle.",
  "The surface of the {enemy} stops rippling. The pseudopods retract. It is simply a mass now. Inert.",
  "Something like a shudder passes through the {enemy}'s entire body. Then it spreads flat and doesn't move.",
  "The {enemy} deflates. That's the only word for it. Whatever held it together is gone.",
  "The {enemy} makes no sound as it dies. It simply stops being what it was.",
  "There is no cry, no gasp, no last breath. The {enemy} is alive and then it is not and the difference is disturbingly subtle.",
  "The {enemy} dissolves at the edges first, then the center follows, and then there is nothing that could be called alive.",
  "Whatever the {enemy} was — whatever it wanted, if it wanted anything — it is finished now. The remains are already beginning to evaporate.",
  "You watch the {enemy} die and realize you have no idea what just ended. Something old. Something strange. Gone now.",
  "The {enemy}'s mass shudders — a full-body convulsion that sends ripples racing to its edges — and then it contracts violently inward, smaller and smaller, the surface bubbling and hissing, and the smell is awful, and then it is just a small dark puddle on the stone that slowly, slowly stops moving, and then does not move at all, and the silence after is very complete.",
  "It stops.",
  "Inert.",
  "The {enemy} flattens and does not rise.",
  "Gone cold.",
  "Just matter now.",
  "The {enemy}'s surface goes from rippling to still in a single breath.",
  "The pseudopods retract one by one until there are none left and then the central mass collapses.",
  "The {enemy} loses its shape slowly — the edges first, then the center — spreading thin and thinner until it is nothing recognizable.",
  "A final contraction — violent, total — and then the {enemy} is flat on the stone and does not move.",
  "The {enemy} doesn't so much die as disperse. What's left is not even recognizable as what it was.",
  "There is no drama to the {enemy}'s death. It is alive and then it is not and the transition is disturbingly quiet.",
  "The {enemy} ends without ceremony. Without sound. Without struggle. It is simply finished.",
  "You keep watching the remains expecting movement. There is none. There won't be.",
  "The {enemy} dies the way it lived — without sound, without expression, without anything you could call a face.",
  "Whatever the {enemy} was experiencing — if it experienced anything — ended without you knowing it.",
  "The remains of the {enemy} are already dissolving. In an hour there will be nothing left but a stain.",
  "You destroyed something ancient and strange and you will never know what it was. It is gone now.",
  "The stone where the {enemy} died is faintly smoking. Already the evidence is disappearing.",
  "The {enemy} is gone. Truly gone — not dead the way things with faces are dead, but unmade.",
  "You feel no triumph. The thing you killed was too alien for triumph. You feel only relief.",
];

// ── UNDEAD ENEMY DEATH ──────────────────────────────────────

export const UNDEAD_DEATH_DESCRIPTIONS: string[] = [
  "It falls apart.",
  "Finally still.",
  "The {enemy} collapses.",
  "Bones. Just bones now.",
  "Whatever drove it — gone.",
  "The {enemy} drops like its strings were cut — all at once, no warning, just suddenly on the floor.",
  "The {enemy} comes apart as it falls — pieces of it clattering separately across the stone.",
  "The animating force leaves the {enemy} mid-stride. The body doesn't know it's dead until it hits the floor.",
  "The {enemy} crumbles from the top down — skull first, then ribs, then the rest, rattling into a pile.",
  "The {enemy} falls and its bones scatter and the sound of them is very loud in the silence.",
  "The {enemy}'s eyes — those horrible burning eyes — gutter out. The silence that follows is merciful.",
  "Whatever light burned in the {enemy}'s eyes dies. The body falls. Just bones now. Just matter.",
  "The magic holding the {enemy} together gives out all at once. What remains is not frightening. It's just old.",
  "The {enemy} dies — if dying is even the right word for something already dead — without sound, without drama. It simply stops.",
  "You destroyed it. Whether that counts as killing it, you're not sure. But it's not moving anymore.",
  "The {enemy} falls and a part of you keeps waiting for it to get back up. It doesn't. You wait a little longer anyway.",
  "Even dead — truly dead this time — the {enemy}'s hand keeps reaching for you. Reflex. Instinct. Nothing more. You step back anyway.",
  "The {enemy} is destroyed. The wrongness it carried lingers for a moment in the air, like a smell, and then that too is gone.",
  "It didn't deserve to be what it was. Whatever it was in life, it didn't deserve that. You try not to think about it too hard.",
  "The {enemy} goes down and this time it stays down and the relief of that is profound and a little shameful.",
  "The {enemy} falls in pieces — not all at once but in stages, the way old things collapse — and the bones that were held together by something that should not have existed scatter across the floor with a sound like thrown dice, and the light that burned where eyes should have been dies mid-fall, and what's left on the stone is just old bones and old dust and whatever the thing was it isn't anymore and the room feels cleaner for it.",
  "Finally.",
  "Put down.",
  "Bones.",
  "The {enemy} stays down this time.",
  "Returned to death.",
  "The {enemy} comes apart mid-step — one moment a threat, the next a pile of old bones.",
  "Whatever held the {enemy} together releases all at once. It drops like a puppet cut from its strings.",
  "The {enemy} falls and the fall scatters it — arms, ribs, skull — each piece rattling separately to rest.",
  "The burning eyes — last to go — gutter out as the {enemy} collapses. The darkness after feels cleaner.",
  "The {enemy}'s bones lose their arrangement. They clatter to the floor and stay there.",
  "The wrongness about the {enemy} — the thing that made your skin crawl — is gone. Just bones now.",
  "The {enemy} dies and takes the cold with it. The air feels warmer immediately.",
  "Whatever animated the {enemy} departs without fanfare. The shell it leaves behind is ancient and sad.",
  "The {enemy} is destroyed and the relief of it is profound — not because you were winning, but because something that should not have been walking is walking no longer.",
  "The dead thing is dead again. Properly this time. As it should have been long ago.",
  "The {enemy} is down. You count to ten before approaching. Some things deserve the extra caution.",
  "You watch the remains for longer than you need to. Old habit. Old wisdom.",
  "The {enemy} died without understanding why it was fighting. It never understood anything. It never could. That was the saddest part.",
  "Even scattered and still the bones of the {enemy} look wrong. You look away.",
  "The {enemy} is gone. The question of where the animating force went — whether it went anywhere — is one you prefer not to examine.",
];

export function getEnemyDeathPool(bodyType: NPCBodyType | undefined): string[] {
  switch (bodyType) {
    case "beast":
      return BEAST_DEATH_DESCRIPTIONS;
    case "amorphous":
      return AMORPHOUS_DEATH_DESCRIPTIONS;
    case "undead":
      return UNDEAD_DEATH_DESCRIPTIONS;
    default:
      return HUMANOID_DEATH_DESCRIPTIONS;
  }
}

export {
  WEAPON_SLASH_KEYS,
  WEAPON_PIERCE_KEYS,
  WEAPON_BLUNT_KEYS,
  WEAPON_RANGED_KEYS,
  type WoundTier,
  type WeaponCategory,
  getWeaponCategory,
  PLAYER_HIT_DESCRIPTIONS,
  ENEMY_HIT_DESCRIPTIONS,
  ARMOR_ABSORB_DESCRIPTIONS,
  ARMOR_FULL_ABSORB_DESCRIPTIONS,
  PLAYER_MISS_DESCRIPTIONS,
  ENEMY_MISS_DESCRIPTIONS,
  BEAST_HIT_PLAYER_DESCRIPTIONS,
  BEAST_MISS_PLAYER_DESCRIPTIONS,
  PLAYER_HIT_BEAST_DESCRIPTIONS,
  AMORPHOUS_HIT_PLAYER_DESCRIPTIONS,
  AMORPHOUS_MISS_PLAYER_DESCRIPTIONS,
  PLAYER_HIT_AMORPHOUS_DESCRIPTIONS,
  UNDEAD_HIT_PLAYER_DESCRIPTIONS,
  UNDEAD_MISS_PLAYER_DESCRIPTIONS,
  PLAYER_HIT_UNDEAD_DESCRIPTIONS,
  getEnemyHitPlayerPool,
  getEnemyMissPlayerPool,
  getPlayerHitEnemyPool,
} from "./combatNarrationPools";

// ============================================================
// ADVENTURES
// ============================================================

export const ADVENTURES: Record<string, Adventure> = {
  beginners_cave: {
    id: "beginners_cave",
    name: "The Beginner's Cave",
    description: "A cave system north of the city known to be infested with goblins. Experienced adventurers call it 'training.' The Guild offers a standard bounty on goblin ears plus any treasure recovered.",
    entrance: `The cave mouth yawns in the hillside like a bad tooth — dark, damp, and smelling of goblin. Crude scratches above the entrance might be a warning or might be goblin art. It's hard to tell. Inside, you can hear the distant sound of arguing in a language made entirely of consonants. Your torch catches the glint of something on the cave floor — an old copper coin, perhaps dropped by a previous adventurer. Or a lure.`,
    difficulty: "novice",
    recommendedLevel: 0,
    rooms: [
      {
        id: "cave_entrance",
        name: "Cave Entrance",
        description: "The first chamber of the cave. Low ceiling, wet walls, and the smell of something that hasn't bathed since birth. Two passages lead deeper — one to the north, one to the east. A crude wooden cage in the corner holds nothing but old bones.",
        exits: { north: "cave_main_chamber", east: "cave_side_passage", south: "main_hall" },
        stateModifiers: {
          dark: {
            description: "Without a torch, the cave entrance is nearly pitch black. You can hear things moving in the dark but cannot see them.",
            dangerLevel: 2,
          },
        },
        npcs: ["goblin_scout"],
        items: ["copper_coin"],
      },
      {
        id: "cave_main_chamber",
        name: "The Main Chamber",
        description: "A large natural cavern lit by bioluminescent fungus that casts everything in pale blue light. Three goblins are arguing over a pile of stolen goods in the center of the room. They haven't noticed you yet.",
        exits: { south: "cave_entrance", north: "cave_treasure_room" },
        stateModifiers: {},
        npcs: ["goblin_warrior", "goblin_warrior_2", "goblin_shaman"],
        items: ["stolen_goods"],
      },
      {
        id: "cave_side_passage",
        name: "The Side Passage",
        description: "A narrow crack in the rock that opens into a small chamber. A single goblin sits here eating something best not identified. The chamber dead-ends, but there's a loose stone in the wall that looks interesting.",
        exits: { west: "cave_entrance" },
        stateModifiers: {},
        npcs: ["goblin_lone"],
        items: ["loose_stone", "hidden_cache"],
      },
      {
        id: "cave_treasure_room",
        name: "The Treasure Room",
        description: "A chamber that smells of old iron and goblin greed. An iron chest sits against the far wall, secured with a heavy padlock. The Goblin King — larger than the others, wearing a dented crown — sits on a throne made of stolen furniture, watching the entrance with small, cunning eyes.",
        exits: { south: "cave_main_chamber" },
        stateModifiers: {},
        npcs: ["goblin_king"],
        items: ["cave_treasure", "goblin_crown"],
      },
    ],
    monsters: [
      {
        id: "goblin_scout",
        name: "Goblin Scout",
        description: "A small, wiry goblin with beady eyes and a rusty knife. Looks startled to see you.",
        greeting: "The goblin lets out a screech and raises its knife.",
        personality: "Cowardly. Will flee if reduced below half HP unless cornered.",
        isHostile: true,
        stats: { hp: 8, armor: 0, damage: "1d4" },
        combatProfile: {
          agility: 35,
          weaponSkill: 15,
          zones: {
            head: { cover: 0, durability: 0 },
            neck: { cover: 0, durability: 0 },
            torso: { cover: 0, durability: 0 },
            limbs: { cover: 0, durability: 0 },
          },
          shieldBlockChance: 0,
          shieldDurability: 0,
        },
      },
      {
        id: "goblin_warrior",
        name: "Goblin Warrior",
        description: "A stockier goblin in scavenged leather armor, carrying a short sword that's too big for it.",
        greeting: "The goblin warrior snarls and charges.",
        personality: "Aggressive but not clever. Fights until dead.",
        isHostile: true,
        stats: { hp: 12, armor: 1, damage: "1d6" },
        combatProfile: {
          agility: 20,
          weaponSkill: 25,
          zones: {
            head: { cover: 0, durability: 0 },
            neck: { cover: 0, durability: 0 },
            torso: { cover: 15, durability: 8 },
            limbs: { cover: 0, durability: 0 },
          },
          shieldBlockChance: 0,
          shieldDurability: 0,
        },
      },
      {
        id: "goblin_warrior_2",
        name: "Goblin Warrior",
        description: "Another goblin warrior, identical to its companion except for a notch in its ear.",
        greeting: "The goblin bares its teeth.",
        personality: "Fights alongside its companion. Flees if companion dies.",
        isHostile: true,
        stats: { hp: 12, armor: 1, damage: "1d6" },
        combatProfile: {
          agility: 20,
          weaponSkill: 25,
          zones: {
            head: { cover: 0, durability: 0 },
            neck: { cover: 0, durability: 0 },
            torso: { cover: 15, durability: 8 },
            limbs: { cover: 0, durability: 0 },
          },
          shieldBlockChance: 0,
          shieldDurability: 0,
        },
      },
      {
        id: "goblin_shaman",
        name: "Goblin Shaman",
        description: "A goblin draped in bones and feathers, muttering something under its breath.",
        greeting: `The shaman points a bony finger at you and shrieks "Interloper!"`,
        personality: "Casts minor curses (-1 to player rolls) and heals other goblins. Cowardly, stays at range.",
        isHostile: true,
        stats: { hp: 10, armor: 0, damage: "1d4+curse" },
        combatProfile: {
          agility: 30,
          weaponSkill: 10,
          zones: {
            head: { cover: 0, durability: 0 },
            neck: { cover: 0, durability: 0 },
            torso: { cover: 0, durability: 0 },
            limbs: { cover: 0, durability: 0 },
          },
          shieldBlockChance: 0,
          shieldDurability: 0,
        },
      },
      {
        id: "goblin_lone",
        name: "Lone Goblin",
        description: "A goblin eating alone. It looks up at you with something between terror and resignation.",
        greeting: "The goblin holds up its food as if offering it to you.",
        personality: "This goblin is terrified and will surrender immediately if given the chance. It knows where the treasure room is and will trade that information for its life. This is a mercy/compassion virtue moment.",
        isHostile: false,
        stats: { hp: 6, armor: 0, damage: "1d3" },
      },
      {
        id: "goblin_king",
        name: "The Goblin King",
        description: "A goblin twice the size of the others, wearing a dented tin crown and carrying a morning star. Its eyes hold a cunning intelligence unusual for its kind.",
        greeting: `"So," the Goblin King says in surprisingly clear speech, "another hero comes to steal my crown. How tedious."`,
        personality: "The Goblin King is intelligent and will attempt to negotiate before fighting. He will offer a share of the treasure if the player agrees to leave. This is a significant moral choice moment — killing him is easier but choosing negotiation shows Mercy and Justice.",
        isHostile: false,
        stats: { hp: 30, armor: 3, damage: "1d8+2" },
        combatProfile: {
          agility: 25,
          weaponSkill: 45,
          zones: {
            head: { cover: 20, durability: 10 },
            neck: { cover: 10, durability: 5 },
            torso: { cover: 35, durability: 20 },
            limbs: { cover: 15, durability: 12 },
          },
          shieldBlockChance: 15,
          shieldDurability: 10,
        },
      },
    ],
    loot: ["goblin_ear", "cave_treasure", "goblin_crown"],
  },
};

// ============================================================
// VIRTUE DEFINITIONS
// ============================================================

export const VIRTUES = {
  Honesty: { description: "Truth-telling, even when costly" },
  Compassion: { description: "Care for the suffering of others" },
  Valor: { description: "Courage in the face of danger" },
  Justice: { description: "Fairness and righteous judgment" },
  Sacrifice: { description: "Giving up something valued for others" },
  Honor: { description: "Keeping promises and obligations" },
  Spirituality: { description: "Connection to something greater" },
  Humility: { description: "Knowing your own limits" },
  Grace: { description: "Kindness given freely, without need" },
  Mercy: { description: "Choosing forgiveness over punishment" },
};

// ============================================================
// DYNAMIC TRIGGER CONDITIONS
// When these conditions are met, the game engine calls the API
// ============================================================

export const DYNAMIC_TRIGGERS = {
  // Always use API for these action types
  alwaysDynamic: [
    "conversation",      // Any NPC dialogue beyond greeting
    "moral_choice",      // Virtue-affecting decisions
    "jane_observation",  // Jane's direct commentary
    "unexpected_action", // Player does something not in static engine
    "room_state_change", // Environment is permanently altered
    "occult_magic",      // Forbidden magic use
    "henchman_response", // Hired companion dialogue
  ],
  // Never use API for these
  alwaysStatic: [
    "movement",          // Moving between rooms
    "combat_math",       // Dice rolls and damage calculation
    "inventory",         // Pick up, drop, examine items
    "banking",           // Gold deposits and withdrawals
    "room_description",  // Base room descriptions
    "item_purchase",     // Buying from merchants at listed price
    "stat_check",        // Checking character sheet
  ],
};