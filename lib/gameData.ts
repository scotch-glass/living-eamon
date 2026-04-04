// ============================================================
// LIVING EAMON — STATIC GAME DATA
// All room descriptions, NPCs, items, adventures, and combat
// stats live here. No API calls needed for any of this data.
// Dynamic (API) content is triggered by the game engine only
// when genuine intelligence or personalization is needed.
// ============================================================

import type { NPCBodyType } from "./npcBodyType";

export type { NPCBodyType };

export type RoomState = "normal" | "burnt" | "flooded" | "dark" | "ransacked";

export interface RoomStateModifier {
  description: string;       // Replaces or appends to base description
  npcMoodShift?: string;     // How NPCs react differently in this state
  dangerLevel?: number;      // 0-3, affects random encounters
}

export interface Room {
  id: string;
  name: string;
  description: string;       // Base static description
  exits: Record<string, string>; // direction -> room id
  stateModifiers: Partial<Record<RoomState, RoomStateModifier>>;
  npcs: string[];            // NPC ids present in this room
  items: string[];           // Item ids present by default
  /** Fixed features the player can examine (engine / Jane object keys) */
  examinableObjects?: { id: string; label: string }[];
  isAdventureEntrance?: string; // Adventure id if this room leads to one
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  greeting: string;          // Static first greeting — no API needed
  personality: string;       // Injected into Jane when dynamic convo needed
  isHostile: boolean;
  /** Combat narration; omit for humanoid (default) */
  bodyType?: NPCBodyType;
  stats: { hp: number; armor: number; damage: string };
  merchant?: {
    inventory: string[];     // Item ids for sale
    haggleModifier: number;  // -1 easy to haggle, +1 hard
  };
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: "weapon" | "armor" | "clothing" | "spell" | "consumable" | "treasure" | "key";
  value: number;             // Gold value
  stats?: {
    damage?: string;         // e.g. "1d6+2"
    armorClass?: number;
    healAmount?: number;
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

export const MAIN_HALL_ROOMS: Record<string, Room> = {
  main_hall: {
    id: "main_hall",
    name: "The Main Hall",
    description: `The Main Hall of the Guild of Free Adventurers is a vast, warm chamber that smells of woodsmoke, roasted meat, and the particular mustiness of people who spend more time in dungeons than in baths. Scarred oak tables fill the center of the room, surrounded by mismatched chairs occupied by adventurers in various states of celebration or despair. A massive stone fireplace dominates the far wall, its mantle crowded with trophies — a troll's skull, a dragon scale the size of a shield, and what appears to be a mummified hand of uncertain origin. Behind the bar stands Hokas Tokas, the innkeeper, his silver-belled beard catching the firelight. In a shadowy corner, Sam Slicker spreads his wares across black velvet. Notice boards paper the eastern wall — three Guild postings hang there now, each one an open contract waiting for a fool brave enough to take it. Head east to read them. Near the south wall sit two barrels. A hand-lettered sign on the first reads: CLOTHES FOR THE POOR. A brass plate on the second reads: USED GOWNS ONLY — DO NOT PUT FOOD IN HERE.`,
    exits: {
      north: "armory",
      east: "notice_board",
      south: "main_hall_exit",
      down: "guild_vault",
    },
    stateModifiers: {
      burnt: {
        description: `The Main Hall is a sorry sight. Scorch marks blacken the oak beams overhead, and the smell of char has replaced the usual warm woodsmoke. Several tables are reduced to cinders. Hokas Tokas shoots daggers with his eyes at anyone who enters, his normally jovial manner replaced with barely contained fury. The other adventurers sit in uncomfortable silence.`,
        npcMoodShift: "Hokas is furious and barely civil. He will not serve drinks until repairs are paid for (50 gold).",
        dangerLevel: 0,
      },
      ransacked: {
        description: `The Main Hall has been torn apart. Tables overturned, bottles smashed, tapestries ripped from the walls. Whatever came through here was looking for something — or simply wanted to cause chaos. Hokas tends to a black eye behind the bar.`,
        npcMoodShift: "Hokas is shaken and will share information freely — he wants whoever did this found.",
        dangerLevel: 1,
      },
      dark: {
        description: `The fire has gone out and no one has bothered to relight it. The Main Hall sits in an uncomfortable gloom, faces lit only by candles guttering in drafts from somewhere. Shapes move in corners. The usual noise is muted, as if everyone is listening for something.`,
        npcMoodShift: "Everyone is uneasy. Sam Slicker is nowhere to be seen.",
        dangerLevel: 1,
      },
    },
    npcs: ["hokas_tokas", "sam_slicker", "old_mercenary"],
    items: ["notice_board_key"],
    examinableObjects: [
      { id: "notice_board", label: "Notice board" },
      { id: "charity_barrel", label: "Barrel 1 — Clothes for the Poor" },
      { id: "gown_barrel", label: "Barrel 2 — Used Gowns Only" },
      { id: "sams_display", label: "Sam's display" },
      { id: "great_fireplace", label: "The great fireplace" },
    ],
  },

  armory: {
    id: "armory",
    name: "The Guild Armory",
    description: `A long narrow room lined with weapon racks and armor stands. The Guild maintains a basic selection of equipment for members who need to gear up quickly. A bored-looking attendant sits at a small desk near the door, occasionally polishing a helmet that doesn't need polishing.`,
    exits: { south: "main_hall" },
    stateModifiers: {},
    npcs: ["armory_attendant"],
    items: ["short_sword", "leather_armor", "torch", "rope"],
    examinableObjects: [
      { id: "weapon_racks", label: "Weapon racks" },
      { id: "armor_stands", label: "Armor stands" },
      { id: "armory_desk", label: "The attendant's desk" },
    ],
  },

  notice_board: {
    id: "notice_board",
    name: "The Notice Board",
    description: `A wall covered floor-to-ceiling in pinned notices. Most are routine — bounty postings, escort contracts, wanted posters for people who are almost certainly dead. Three notices stand out, posted on official Guild parchment with the seal of the Free Adventurers:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GUILD POSTINGS — OPEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] THE BEGINNER'S CAVE
    Goblin infestation, north of the city.
    Bounty paid on goblin ears. Novice difficulty.
    → Type: ENTER THE BEGINNER'S CAVE

[2] THE THIEVES GUILD
    Social infiltration of the criminal underworld.
    Moderate difficulty. Wit over strength.
    → Type: ENTER THE THIEVES GUILD

[3] THE HAUNTED MANOR
    Something is wrong at the Blackwood estate.
    Moderate to deadly. Not for the faint of heart.
    → Type: ENTER THE HAUNTED MANOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return to the Main Hall (GO WEST) to prepare before entering any adventure.`,
    exits: { west: "main_hall" },
    stateModifiers: {},
    npcs: [],
    items: [],
    examinableObjects: [
      { id: "beginners_cave_notice", label: "Beginner's Cave notice" },
      { id: "thieves_guild_notice", label: "Thieves Guild notice" },
      { id: "haunted_manor_notice", label: "Haunted Manor notice" },
      { id: "treasure_maps", label: "Dubious treasure maps" },
      { id: "wanted_posters", label: "Wanted posters" },
    ],
  },

  main_hall_exit: {
    id: "main_hall_exit",
    name: "The Guild Entrance",
    description: `Heavy oak doors bound with iron lead out to the cobblestoned street beyond. Through the small window beside the door, you can see the city going about its business — merchants, beggars, city guards, and the occasional flash of a robe that suggests a wizard. The door is always unlocked. The Guild never closes.`,
    exits: { north: "main_hall", west: "guild_courtyard" },
    stateModifiers: {},
    npcs: ["door_guard"],
    items: [],
    examinableObjects: [
      { id: "oak_doors", label: "The oak doors" },
      { id: "street_window", label: "The street window" },
    ],
  },

  guild_courtyard: {
    id: "guild_courtyard",
    name: "The Guild Courtyard",
    description:
      "A cobblestoned courtyard open to the sky, caught between the Church of Perpetual Life to the west and the Main Hall entrance to the east.",
    exits: {
      east: "main_hall_exit",
      west: "church_of_perpetual_life",
    },
    stateModifiers: {},
    npcs: [],
    items: [],
    examinableObjects: [
      { id: "cobblestones", label: "The cobblestones" },
      { id: "church_door", label: "The church door" },
      { id: "main_hall_entrance", label: "The Main Hall entrance" },
    ],
  },

  church_of_perpetual_life: {
    id: "church_of_perpetual_life",
    name: "The Church of Perpetual Life",
    description:
      "Everything here is white. The walls are white. The floor is cold white stone, smooth and faintly warm from some source you cannot identify. The priests move through the silence in white robes, their pale faces carrying no expression you can read. There is no art. There are no windows. There is nothing to look at except the altar — a plain white stone block — and the rack of gray robes near the door, ready for the next arrival. The silence is complete. Even your footsteps seem reluctant to disturb it.",
    exits: {
      east: "guild_courtyard",
    },
    stateModifiers: {},
    npcs: ["priest_of_perpetual_life"],
    items: [],
    examinableObjects: [
      { id: "white_altar", label: "The altar" },
      { id: "robe_rack", label: "The robe rack" },
      { id: "stone_floor", label: "The stone floor" },
    ],
  },

  guild_vault: {
    id: "guild_vault",
    name: "The Guild Vault",
    description: `A low-ceilinged stone room beneath the Main Hall. Iron strongboxes line the walls, each bearing a personal lock. A heavyset dwarf named Brunt manages the vault with meticulous suspicion. This is where adventurers bank their gold between adventures — death in the field only takes what you carry.`,
    exits: { up: "main_hall" },
    stateModifiers: {},
    npcs: ["brunt_the_banker"],
    items: [],
    examinableObjects: [
      { id: "iron_strongboxes", label: "Iron strongboxes" },
      { id: "vault_counter", label: "Brunt's counter" },
    ],
  },
};

// ============================================================
// NPCS
// ============================================================

export const NPCS: Record<string, NPC> = {
  hokas_tokas: {
    id: "hokas_tokas",
    name: "Hokas Tokas",
    description: "A rotund, cheerful man whose braided beard is threaded with small silver bells that chime when he moves. His eyes are sharp despite his jovial manner — he's seen thirty years of adventurers come and go.",
    greeting: `"Welcome, welcome!" The silver bells in his beard chime as Hokas spreads his arms in greeting. "What'll it be, friend? Ale, information, or both? Both is the popular choice, I find."`,
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
    greeting: `Sam glances up from a dagger he's been examining, his smile sharp as the blade. "Fresh blood. Good. I've got things that need buying, and you look like someone who needs things." He spreads his hands over the velvet. "What's your pleasure?"`,
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
    greeting: `Aldric glances over as you enter. He takes in the whole situation in about two seconds.\n\n"Sit down," he says. Not unkindly. "There are things you should know before you get yourself killed."\n\nHe nods at the chair across from him. "Ask me anything. I've been here long enough."`,
    personality: `Aldric the Veteran is a retired adventurer who genuinely wants new players to survive. He is warm but direct, never condescending. He is the Main Hall's living tutorial — he knows the rules, the secrets, the dangers, and the shortcuts. He notices the gray robe immediately and points toward the charity barrel without drama. He recommends buying him an ale for deeper conversation. He offers formal weapon training in the courtyard for gold. When both parties have ale he is more forthcoming. He speaks in plain Universal Common. He is the most reliably useful person in the Main Hall. He proactively offers his topic list whenever a player seems lost or new.`,
    isHostile: false,
    stats: { hp: 60, armor: 3, damage: "1d8+2" },
  },

  brunt_the_banker: {
    id: "brunt_the_banker",
    name: "Brunt",
    description: "A dwarf of few words and maximum suspicion. His handshake could crush stone.",
    greeting: `"Name. Account number. Business." He doesn't look up from his ledger.`,
    personality: "Brunt is a dwarf banker of absolute honesty and zero warmth. He handles all banking transactions — deposits, withdrawals, account creation. He speaks in clipped Universal Common. He cannot be bribed, charmed, or intimidated. He has seen it all.",
    isHostile: false,
    stats: { hp: 50, armor: 5, damage: "1d10+3" },
  },

  armory_attendant: {
    id: "armory_attendant",
    name: "Pip",
    description: "A young guild apprentice assigned to armory duty as punishment for something they won't discuss.",
    greeting: `Pip sets down the helmet they were polishing and stands up straight. "Guild members get the standard rate. Non-members pay double. You look like a member. Probably."`,
    personality: "Pip is young, slightly nervous, and desperately wants to be an adventurer themselves. They will chatter about the available adventures and offer genuine if naive advice. Speaks in Universal Common with occasional modern slip-ups they immediately correct.",
    isHostile: false,
    stats: { hp: 15, armor: 1, damage: "1d4" },
    merchant: {
      inventory: ["short_sword", "leather_armor", "buckler", "torch", "rope", "rations"],
      haggleModifier: -1,
    },
  },

  door_guard: {
    id: "door_guard",
    name: "The Door Guard",
    description: "A large person in Guild livery who manages foot traffic in and out of the hall.",
    greeting: `"In or out. Make up your mind."`,
    personality: "The door guard is efficient, humorless, and not interested in conversation. They know nothing useful and will say so.",
    isHostile: false,
    stats: { hp: 30, armor: 4, damage: "1d8" },
  },

  priest_of_perpetual_life: {
    id: "priest_of_perpetual_life",
    name: "A Priest of Perpetual Life",
    description:
      "Pale, unhurried, dressed in white. Their eyes are open and aware but carry no warmth and no hostility. Simply present.",
    greeting:
      "The priest turns toward you and raises one finger slowly to their lips.",
    personality:
      "Completely silent. Never speaks. Never hostile. Never warm. Responds to all attempts at conversation with a varied silent gesture. Do not generate dialogue for this NPC under any circumstances.",
    isHostile: false,
    stats: { hp: 999, armor: 10, damage: "0" },
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
  `"Pull up a chair," Aldric says. "I've been waiting for someone worth talking to."\n\nHe eyes you steadily. "I know this world better than most. Ask me about:\n\n  TELL Aldric survival    — start here if you're new or reborn\n  TELL Aldric combat      — before you get into a fight\n  TELL Aldric training    — I work in the courtyard, for gold\n  TELL Aldric skills      — important rules your body follows\n  TELL Aldric adventures  — the three postings on the board\n  TELL Aldric world       — the Guild, the Church, and more\n  TELL Aldric magic       — what you can learn openly\n  TELL Aldric secrets     — ale required. Non-negotiable."`,
];

export const ALDRIC_TOPIC_RESPONSES: Record<string, string[]> = {
  survival: [
    `"First things first," Aldric says. "If you're wearing that gray robe, go to the charity barrel by the south wall. Take the clothes. The robe tears off — that's normal, it's designed to — and goes in the gown barrel. Then you're dressed.\n\nSecond: if you have no weapon, say BEG SAM. Sam will give you a rusty short sword. Say BEG HOKAS and he'll give you a butcher knife. Either works for now.\n\nThird: bank your gold before you go anywhere dangerous. GO DOWN to the vault. Talk to Brunt. DEPOSIT every coin you're not willing to lose. What's in your pockets dies with you; what's in the vault doesn't."\n\nHe taps the table. "That's the short version."`,
    `"Die once and you'll learn this the hard way," Aldric mutters. "Barrel for clothes. BEG for steel. Vault for gold. The Church brings you back — it does not bring back your purse."\n\nHe points toward the south wall without looking. "Charity barrel. Gown barrel. Not complicated. Staying broke and naked is optional."`,
  ],
  combat: [
    `"Fighting here isn't theatre," Aldric says. "You ATTACK with what you're wielding. Initiative is rolled each round — weapon speed and your reflexes matter. If you connect, damage comes from the weapon, your strength, and a little battlefield sense we call expertise.\n\nArmor and shields eat raw damage before it touches your hide. Sometimes they eat all of it. Sometimes not enough.\n\nCritical hits happen — not often, but when they do you'll know. If it's going badly, FLEE picks a random exit and runs. Your enemy remembers how hurt it was; walking away doesn't heal them."\n\nHe shrugs. "Misses happen too. Occasionally you'll fumble like a recruit. It passes."`,
    `"Hit chance scales with your weapon skill — the guild tracks it per discipline — and the foe's skill. Better skill, cleaner odds. Worse skill, more praying.\n\nUnarmed against something armed is a bad idea. The engine won't let you swing empty hands like a hero from a ballad — get a blade first."\n\nAldric knocks wood with his prosthetic. "FLEE is not shame. Dead is shame."`,
  ],
  training: [
    `"Right here in the Main Hall," Aldric says, "where you can find me most days — bring gold and say TRAIN followed by the skill you want: SWORDSMANSHIP, MACE, FENCING, ARCHERY, ARMOR, SHIELD, and a few others if you're serious.\n\nTwenty-five gold buys a focused lesson. I push three points into the skill you name. If your total across all skills is riding the cap, the weakest skill you aren't training bleeds a point to make room — that's how the body keeps score."\n\nHe almost smiles. "Gold. TRAIN. Repeat until you're dangerous. When the weather's fine I spar in the courtyard — but the paid drills happen where I'm sitting."`,
    `"Formal lessons cost 25 gold and buy real progress — three points in one sitting," Aldric says. "Command is TRAIN <skill> while I'm in the hall."\n\n"If you're broke, fight weaker things and land hits. Your weapon discipline ticks up a little each time you earn it. Slower than my lessons. Cheaper."`,
  ],
  skills: [
    `"Nine tracks," Aldric says, ticking them on his fingers. "Swordsmanship, Mace Fighting, Fencing, Archery, Armor Expertise, Shield Expertise, Stealth, Lockpicking, Magery — the guild logs all of it.\n\nTotal across everything caps at seven hundred. Push past that and something else has to give; usually your lowest skill drops a point so the new growth has somewhere to go. The cap is merciless but fair."\n\nHe meets your eyes. "STATS shows your sheet. TRAIN moves numbers on purpose. Fighting moves them slowly, on victory."`,
    `"Think of seven hundred as the maximum attention your body can hold," Aldric says. "Overflow doesn't vanish — it shoves another skill down a notch. Watch your totals if you're juggling magery with steel."\n\n"Decay only happens at the cap, and only to make room. Nothing rots while you're under the ceiling."`,
  ],
  adventures: [
    `"Three contracts on the east-wall board right now," Aldric says. "Beginner's Cave for people who still flinch at rats. Thieves Guild if you fancy knives in the dark — harder. Haunted Manor if you've said goodbye to everyone you love."\n\n"READ the board in that room. ENTER THE BEGINNER'S CAVE — or the others — when you're ready. Word match matters; spell it like the posting."\n\nHe leans in. "Start easy unless you enjoy being a cautionary tale."`,
    `"The board lists names and difficulties," Aldric says. "Novice, moderate, deadly — believe the labels. ENTER pulls you into the adventure proper once the engine recognizes what you typed."\n\n"If you're fresh from the Church, do not skip straight to the Manor. I am not joking."`,
  ],
  world: [
    `"You're in the Guild of Free Adventurers — Main Hall for company, Notice Board for work, Vault downstairs for money, Courtyard for air and weather," Aldric says. "Hokas runs the bar; buy food and drink from him. Sam sells steel on the velvet — sharp tongue, sharper prices."\n\n"The Church of Perpetual Life brings you back when you die. West from the hall's exit, through the courtyard. You'll learn that path whether you want to or not."\n\nHe pauses. "The city outside is a conversation for another day."`,
    `"Guild first. Everything else second," Aldric says. "Brunt in the vault doesn't chat — he banks. Door guard doesn't gossip. Priests don't speak at all, which is its own kind of theology."\n\n"Treat Hokas well. He remembers."`,
  ],
  magic: [
    `"Guild-sanctioned magic is CAST — BLAST, HEAL, LIGHT, SPEED once you know them," Aldric says. "That's the safe, documented kind. PRAY reaches gods whose names you earn in play; don't embarrass yourself with empty invocations."\n\n"What you must not shout about in here is INVOKE — occult, rare, and none of my business in public."\n\nHe spreads his hands. "Stay inside CAST until you know what you're doing."`,
    `"Magery as a skill exists," Aldric says, "but the spells you can actually CAST are listed on your character. Don't assume every syllable you invent will work."\n\n"If it isn't guild curriculum, assume it will get you stared at — or worse."`,
  ],
  secrets: [
    `"Secrets cost wetware and wheat," Aldric says mildly, raising his empty tankard. "Buy me an ale from Hokas, sit like you mean it, and ask again. Some answers are too long for a free sentence."\n\n*You might: BUY ALE from Hokas, then TELL Aldric secrets again.*`,
    `"I'm not a library with a broken lock," Aldric says. "I'm a person who charges admission in barley and hops. Ale first. Then we talk about the things that don't go on the board."\n\n*You might: purchase an ale and return.*`,
  ],
  order: [
    `Aldric's voice drops until you're leaning in. "The Order — lower case when you speak it aloud. They don't recruit from shouting."\n\n"If you need them, you'll be pointed. Until then, practice looking like you belong here and nowhere else."\n\nHe sits back, volume normal. "That's all you get without clearance."`,
    `"Whispered business," Aldric breathes. "Not for the hall at full voice. If you don't know whether you should be asking, you shouldn't."\n\nHe taps his nose. "Patience. Proof. Then someone finds you."`,
  ],
};

// ============================================================
// ITEMS
// ============================================================

export const ITEMS: Record<string, Item> = {
  short_sword: {
    id: "short_sword",
    name: "Short Sword",
    description: "A reliable blade, well-balanced and easy to carry. The choice of sensible adventurers everywhere.",
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
    value: 0,
    isCarryable: true,
  },
  moth_eaten_woolen_shirt: {
    id: "moth_eaten_woolen_shirt",
    name: "Moth-Eaten Woolen Shirt",
    description:
      "A grey woolen shirt with several moth holes that let in more air than is comfortable. It smells of cedar and long storage.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  threadbare_linen_shirt: {
    id: "threadbare_linen_shirt",
    name: "Threadbare Linen Shirt",
    description: "A linen shirt worn so thin in places you can read through it. Still, it covers.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  stained_canvas_tunic: {
    id: "stained_canvas_tunic",
    name: "Stained Canvas Tunic",
    description:
      "A heavy canvas tunic with stains of uncertain origin and a drawstring that has been retied so many times the knot is now structural.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  homespun_pants: {
    id: "homespun_pants",
    name: "Homespun Pants",
    description: "Rough homespun trousers, undyed, slightly too short. Functional.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  patched_wool_breeches: {
    id: "patched_wool_breeches",
    name: "Patched Wool Breeches",
    description: "Wool breeches with patches on the patches. Someone put real effort into keeping these alive.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  rough_canvas_trousers: {
    id: "rough_canvas_trousers",
    name: "Rough Canvas Trousers",
    description: "Canvas trousers stiff enough to stand up on their own. They will soften eventually. Probably.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  cloth_shoes: {
    id: "cloth_shoes",
    name: "Cloth Shoes",
    description:
      "Soft-soled cloth shoes, the kind worn by people who are mostly indoors. Outdoors they are optimistic.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  worn_leather_sandals: {
    id: "worn_leather_sandals",
    name: "Worn Leather Sandals",
    description:
      "Leather sandals that have walked a long way and show it. The straps have been mended with twine.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  mismatched_boots: {
    id: "mismatched_boots",
    name: "Mismatched Boots",
    description:
      "Two boots. They are both boots. That is where the agreement ends — different heights, different leather, different opinions about your left foot.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  worn_leather_belt: {
    id: "worn_leather_belt",
    name: "Worn Leather Belt",
    description: "A leather belt creased in three places from years of use. It works.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  fraying_rope_belt: {
    id: "fraying_rope_belt",
    name: "Fraying Rope Belt",
    description:
      "A length of rope repurposed as a belt. The fraying ends have been knotted to slow the entropy.",
    type: "clothing",
    value: 0,
    isCarryable: true,
  },
  cracked_hide_strap: {
    id: "cracked_hide_strap",
    name: "Cracked Hide Strap",
    description:
      "A wide strap of hide, cracked from drying out too many times. Still holds trousers up, which is the job.",
    type: "clothing",
    value: 0,
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
    stats: { armorClass: 2 },
    isCarryable: true,
  },
  chain_mail: {
    id: "chain_mail",
    name: "Chain Mail",
    description: "Interlocking iron rings that stop blades and arrows alike. Heavy, but worth it.",
    type: "armor",
    value: 60,
    stats: { armorClass: 4 },
    isCarryable: true,
  },
  buckler: {
    id: "buckler",
    name: "Buckler",
    description: "A small steel buckler, light enough to parry and turn a blade without tiring the arm.",
    type: "armor",
    value: 30,
    stats: { armorClass: 1 },
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
      },
      {
        id: "goblin_warrior",
        name: "Goblin Warrior",
        description: "A stockier goblin in scavenged leather armor, carrying a short sword that's too big for it.",
        greeting: "The goblin warrior snarls and charges.",
        personality: "Aggressive but not clever. Fights until dead.",
        isHostile: true,
        stats: { hp: 12, armor: 1, damage: "1d6" },
      },
      {
        id: "goblin_warrior_2",
        name: "Goblin Warrior",
        description: "Another goblin warrior, identical to its companion except for a notch in its ear.",
        greeting: "The goblin bares its teeth.",
        personality: "Fights alongside its companion. Flees if companion dies.",
        isHostile: true,
        stats: { hp: 12, armor: 1, damage: "1d6" },
      },
      {
        id: "goblin_shaman",
        name: "Goblin Shaman",
        description: "A goblin draped in bones and feathers, muttering something under its breath.",
        greeting: `The shaman points a bony finger at you and shrieks "Interloper!"`,
        personality: "Casts minor curses (-1 to player rolls) and heals other goblins. Cowardly, stays at range.",
        isHostile: true,
        stats: { hp: 10, armor: 0, damage: "1d4+curse" },
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