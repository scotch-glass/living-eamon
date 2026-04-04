// ============================================================
// LIVING EAMON — STATIC GAME DATA
// All room descriptions, NPCs, items, adventures, and combat
// stats live here. No API calls needed for any of this data.
// Dynamic (API) content is triggered by the game engine only
// when genuine intelligence or personalization is needed.
// ============================================================

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
  type: "weapon" | "armor" | "spell" | "consumable" | "treasure" | "key";
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
// ROOMS — MAIN HALL
// ============================================================

export const MAIN_HALL_ROOMS: Record<string, Room> = {
  main_hall: {
    id: "main_hall",
    name: "The Main Hall",
    description: `The Main Hall of the Guild of Free Adventurers is a vast, warm chamber that smells of woodsmoke, roasted meat, and the particular mustiness of people who spend more time in dungeons than in baths. Scarred oak tables fill the center of the room, surrounded by mismatched chairs occupied by adventurers in various states of celebration or despair. A massive stone fireplace dominates the far wall, its mantle crowded with trophies — a troll's skull, a dragon scale the size of a shield, and what appears to be a mummified hand of uncertain origin. Behind the bar stands Hokas Tokas, the innkeeper, his silver-belled beard catching the firelight. In a shadowy corner, Sam Slicker spreads his wares across black velvet. Notice boards paper the eastern wall, bristling with job postings and treasure maps of dubious authenticity.`,
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
    description: `A wall covered floor-to-ceiling in pinned notices, contracts, bounty postings, and hand-drawn maps. Most are legitimate — dungeon clearance requests, escort jobs, monster extermination contracts. A few are clearly traps written by people who've never been in a dungeon. The most prominent notices advertise three adventures currently available to Guild members.`,
    exits: { west: "main_hall" },
    stateModifiers: {},
    npcs: [],
    items: [],
    examinableObjects: [
      { id: "posted_notices", label: "Posted notices" },
      { id: "treasure_maps", label: "Dubious treasure maps" },
    ],
  },

  main_hall_exit: {
    id: "main_hall_exit",
    name: "The Guild Entrance",
    description: `Heavy oak doors bound with iron lead out to the cobblestoned street beyond. Through the small window beside the door, you can see the city going about its business — merchants, beggars, city guards, and the occasional flash of a robe that suggests a wizard. The door is always unlocked. The Guild never closes.`,
    exits: { north: "main_hall" },
    stateModifiers: {},
    npcs: ["door_guard"],
    items: [],
    examinableObjects: [
      { id: "oak_doors", label: "The oak doors" },
      { id: "street_window", label: "The street window" },
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
      inventory: ["short_sword", "long_sword", "dagger", "crossbow", "leather_armor", "chain_mail"],
      haggleModifier: 1,
    },
  },

  old_mercenary: {
    id: "old_mercenary",
    name: "Aldric the Old",
    description: "A weathered man with a grey beard and a prosthetic left hand carved from dark wood. He nurses the same ale he's been nursing for two hours.",
    greeting: `The old man looks you over with one good eye. "Sit down if you like. Or don't. I'm not your mother." He takes a slow sip of ale. "You've got the look of someone about to do something foolish. I used to have that look."`,
    personality: "Aldric is a retired adventurer with decades of hard-won wisdom. He speaks plainly, offers advice only when asked, and has a deep weariness that occasionally breaks into unexpected warmth. He knows the three available adventures well and will warn players about their dangers honestly.",
    isHostile: false,
    stats: { hp: 35, armor: 3, damage: "1d8+1" },
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
    stats: { damage: "1d10" },
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
    value: 12,
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
  enemyDeath: [
    "The {enemy} collapses, defeated.",
    "The {enemy} falls to the ground and moves no more.",
    "With a final cry, the {enemy} is vanquished.",
    "The {enemy} crumbles — the fight is over.",
  ],
  playerDeath: [
    "Your vision darkens. The {enemy} has bested you this day.",
    "You fall, defeated. The darkness takes you.",
    "The {enemy} stands over your fallen form.",
  ],
};

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