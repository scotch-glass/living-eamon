// ============================================================
// ADVENTURE MODULE: The Guild Hall (Starting Area)
// Located in OSTAVAR — a city in the Hyborian world, styled
// after Aquilonia (Howard's Conan). Marble colonnades, broad
// avenues, gilt towers, iron-gated gardens, Roman grandeur.
//
// This is not a standalone adventure — it is the persistent
// hub that all adventures connect back to. It contains the
// Church of Perpetual Life (spawn/respawn), the Main Hall,
// the Guild Bank, the Armory, and the Courtyard.
//
// WRITERS: Add new starting-area rooms here.
// Each room owns its own description, scene data, exits,
// NPCs, items, and (for spawn rooms) its cold open.
// ============================================================

import type { AdventureModule, Room } from "../roomTypes";
import { GUILD_HALL_NPC_SCRIPTS } from "./guild-hall-npcs";

const CHURCH_ATMOSPHERE_OVERRIDE =
  "Sourceless white light emanating from everywhere and nowhere. Clinical, cold, white-themed. No shadows. No warmth. The white is not peaceful — it is the white of pure mind and math that predates life and is therefore not biological and also aware but not alive.";

const rooms: Record<string, Room> = {

  // ── Church of Perpetual Life ────────────────────────────────
  church_of_perpetual_life: {
    id: "church_of_perpetual_life",
    name: "The Church of Perpetual Life",
    description:
      "Everything here is white. The walls are white. The floor is cold white stone, smooth and faintly warm from some source you cannot identify. The priests move through the silence in white robes, their pale faces carrying no expression you can read. There is no art. There are no windows. There is nothing to look at except the altar — a plain white stone block — and the rack of gray robes near the door, ready for the next arrival. The silence is complete. Even your footsteps seem reluctant to disturb it.",
    look: "A white stone chamber, featureless and cold. Priests drift through the silence. A plain altar stands at the center. Gray robes hang by the door. The only exit is east.",
    glance: "The white stone church. Silent priests, cold altar, gray robes by the door.",
    exits: { east: "guild_courtyard" },
    stateModifiers: {},
    npcs: ["priest_of_perpetual_life"],
    items: [],
    examinableObjects: [
      { id: "white_altar", label: "The altar" },
      { id: "robe_rack", label: "The robe rack" },
      { id: "stone_floor", label: "The stone floor" },
    ],
    // Scene image
    visualDescription:
      "A vast chamber of white marble so pale it appears to emit light rather than reflect it — no torch, no window, no flame, yet every surface is equally, coldly illuminated. Floor, walls, vaulted ceiling, altar: all the same unblemished white. The surfaces are neither rough nor smooth. The corners are neither sharp nor truly rounded — as though the room was formed rather than built. Robed figures stand motionless at intervals along the walls, white robes, white hands folded, faces the color of porcelain with flat gray eyes. The silence. Silence is the absence of sound. Yet, here it is more like a presence.",
    sceneTone: "grimdark",
    sceneAtmosphereOverride: CHURCH_ATMOSPHERE_OVERRIDE,

    // ── Cold Open ─────────────────────────────────────────────
    coldOpen: {
      newGame: [
        "White.",
        "",
        "That is the first thing. Not darkness — white. A white so complete and sourceless it takes several seconds to understand that your eyes are open. There is no lamp, no window, no torch. The light simply exists, emanating from everywhere equally, pressing against every surface with cold indifference.",
        "",
        "The floor beneath your cheek is marble. You know the word for it without knowing how you know. It is perfectly smooth, neither warm nor cold in the way stone should be cold — it is something else. Something that has been this temperature for longer than temperature is supposed to last.",
        "",
        "You sit up.",
        "",
        "The room is vast. White walls rise to a white vaulted ceiling that may or may not have an apex — the light makes it impossible to tell where the stone ends and the air begins. A white altar stands at the far end bearing nothing: no symbol, no scripture, no offering, no shadow. The angles of this room are not quite sharp, not quite rounded. Like something that was thought into existence by something that had seen rooms, but never stood inside one.",
        "",
        "There are figures at the walls.",
        "",
        "White robes. White hands folded at the waist. Faces the color of old paper — flat gray eyes that do not move, do not track, do not blink at a rate you can catch. They are not looking at you. They may not be capable of looking. They stand with the absolute stillness of things that do not need to breathe between moments.",
        "",
        "You become aware, slowly, that you are also wearing a robe. Gray. Thin as an apology. It feels borrowed. Everything feels borrowed.",
        "",
        "You reach for your name.",
        "",
        "The place where it should be is smooth and unbroken — like the floor, like the walls, like the altar. You press at it. Nothing gives. There is no pain in the absence. That is the strangest part. There is simply nothing there, the way a room has nothing in a corner that has always been empty.",
        "",
        "You look at your hands. They are yours. You are certain of this and uncertain of almost everything else.",
        "",
        "A thought surfaces from somewhere beneath the blankness — not a memory, more like the outline of one:",
        "",
        "*...have I been here before?*",
        "",
        "__YESNO__",
      ],

      yesResponse: [
        "A flicker. Not quite a memory — more like the ghost of one. The smell of this place. The weight of the air. Something in the muscle of your hand that knows, without being told, how to make a fist.",
        "",
        "You have been here before.",
        "",
        "You stand. Your legs find the floor without hesitation. Whatever you have lost, your body remembers the rest. The door ahead leads out. Beyond it: noise, firelight, the smell of ale and iron.",
        "",
        "You know what to do.",
      ],

      noResponse: [
        "Nothing. The fog holds.",
        "",
        "You stand anyway — slowly, testing each joint — and take stock of what your body knows even when your mind does not.",
        "",
        "Your eyes move before you decide to move them, cataloguing the room, finding the exits. __CMD:LOOK AROUND__ — something in you understands. Not a thought. A reflex. North wall. One door. Light under it. Warmth.",
        "",
        "You look down at yourself. A gray robe, thin as an apology. You pat your sides without thinking — __CMD:I__ — and find nothing. No coin. No blade. No anything. Whatever you had, you do not have it now.",
        "",
        "The body knows things the mind does not. You can feel your own condition without searching for it — a quiet inner census, like a sailor checking the ship before leaving port. __CMD:HEALTH__ will show you what the realm knows about your physical state. What it reports now: intact. Whole. Unremarkably alive.",
        "",
        "You take a step toward the door. Then another. __CMD:GO EAST__ — your feet already know.",
        "",
        "Beyond this room is a place called the Main Hall. Beyond that: everything else.",
        "",
        "Whatever answers exist about who you are — they are not in here. The figures at the walls will not tell you. The light will not answer.",
        "",
        "You push open the door.",
      ],

      respawn: [
        "Stone again.",
        "",
        "The same white. The same sourceless cold light pressing against every surface with its total indifference. The same figures at the walls — white robes, gray eyes, hands folded, utterly still.",
        "",
        "You open your eyes and you know exactly where you are. You have been here before. You remember how this ends: you stand up, you walk out the door, you start again.",
        "",
        "What you had is gone. Carried gold. Everything you were wearing. Everything in your pack. The banked gold waits untouched. What is locked away safely waits. Everything else is gone, as completely as if it never existed.",
        "",
        "The figures do not acknowledge you. They never do.",
        "",
        "You stand.",
      ],
    },
  },

  // ── Guild Courtyard ─────────────────────────────────────────
  guild_courtyard: {
    id: "guild_courtyard",
    name: "The Guild Courtyard",
    description:
      "A broad courtyard open to the sky. The Church of Perpetual Life stands to the west, its white walls featureless and cold. The Main Hall entrance is to the east, warm light and noise spilling through its open doors. To the north, a narrow shopfront — Sam's Sharps — has a wooden sign above the door bearing a painted sword crossed over a shield. To the south, a modest stone doorway is set into the courtyard wall. Above it, a wooden sign bears a painted red potion bottle — nothing else, no words. A faint hum comes from beyond the doorway. Not a sound, exactly. More like a vibration you feel with your soul.",
    look: "An open courtyard under the sky. Church to the west, Main Hall to the east, Sam's shop to the north. To the south, a doorway with a red potion bottle sign hums faintly.",
    glance: "The courtyard. Church west, Main Hall east, Sam's north, potion shop south.",
    exits: {
      east: "main_hall",
      west: "church_of_perpetual_life",
      north: "sams_sharps",
      south: "mage_school",
      southeast: "shrine_of_maat",
    },
    stateModifiers: {},
    npcs: ["training_dummy"],
    items: [],
    examinableObjects: [
      { id: "cobblestones", label: "The cobblestones" },
      { id: "church_door", label: "The church door" },
      { id: "main_hall_entrance", label: "The Main Hall entrance" },
      { id: "sams_sign", label: "Sam's sign (sword and shield)" },
      { id: "potion_sign", label: "The potion bottle sign" },
      { id: "training_dummies", label: "The training dummies" },
    ],
    visualDescription:
      "A broad sunlit marble-flagged courtyard enclosed by colonnaded walls of pale stone. Weathered wooden training dummies stand in a row along one wall. A stone fountain in the centre. A guild banner hangs from an arched iron gate. To the north, a narrow shopfront doorway with a small wooden sign above it showing ONLY a painted image of a sword crossed over a shield — no words, no text, no letters. To the south, a modest stone doorway with a small wooden sign above it showing ONLY a painted image of a red potion bottle — no words, no text, no letters, just the red bottle image. Warm afternoon sun, blue sky. No people visible. No text anywhere on any sign. Aquilonian grandeur.",
    sceneTone: "aquilonian",
  },

  // ── Sam's Sharps ───────────────────────────────────────────
  sams_sharps: {
    id: "sams_sharps",
    name: "Sam's Sharps",
    description:
      "A narrow shopfront that smells of oil, leather, and steel. A row of swords hangs from iron hooks on the stone wall behind the counter — short, long, and great two-handers, each oiled and gleaming. A heavy wooden cabinet with iron hinges displays a few short blades on dark velvet. Behind the counter, Sam Slicker sits on a tall stool, one eye closed, examining the edge of something with a jeweler's loupe. A hand-painted sign behind him reads: ALL SALES FINAL. NO REFUNDS. NO EXCEPTIONS. ESPECIALLY YOU.",
    look: "A narrow sword shop smelling of oil and steel. Blades hang on the wall behind the counter. Sam Slicker sits behind it. A sign reads: NO REFUNDS.",
    glance: "Sam's sword shop. Steel on the walls, Sam behind the counter.",
    exits: { south: "guild_courtyard" },
    stateModifiers: {},
    npcs: ["sam_slicker"],
    items: [],
    examinableObjects: [
      { id: "wall_weapons", label: "The swords on the wall" },
      { id: "wooden_cabinet", label: "The wooden display cabinet" },
      { id: "no_refunds_sign", label: "The NO REFUNDS sign" },
    ],
    visualDescription:
      "INTERIOR scene — inside a small stone room, NOT outdoors. Low vaulted stone ceiling, pale stone walls, no windows. Three swords — a short sword, a long sword, and a great two-handed sword — hang from iron hooks on the back wall. A sturdy wooden workbench in the centre with oilcloths, a whetstone, and tools. A wooden counter near the arched doorway. A single bronze lamp casts warm amber light. Empty room — no people. Only stone walls, swords, the workbench, and warm lamplight.",
    sceneTone: "aquilonian",
  },

  // ── Main Hall ───────────────────────────────────────────────
  main_hall: {
    id: "main_hall",
    name: "The Main Hall",
    description: `The Main Hall of the Guild of Free Adventurers is a vast, warm chamber that smells of woodsmoke, roasted meat, and the particular mustiness of people who spend more time in dungeons than in baths. Scarred oak tables fill the center of the room, surrounded by mismatched chairs occupied by adventurers in various states of celebration or despair. A massive stone fireplace dominates the far wall, its mantle crowded with trophies — a troll's skull, a dragon scale the size of a shield, and what appears to be a mummified hand of uncertain origin. Behind the bar stands Hokas Tokas, the innkeeper, his silver-belled beard catching the firelight. Barmaids weave between the tables carrying tankards and platters — Lira, quick and light on her feet; Mavia, drawing every eye she passes; Seraine, tall and unhurried. In a corner booth, Aldric the Veteran nurses an ale alone, watching the room with the quiet patience of a man who has survived everything. Notice boards paper the eastern wall — three Guild postings hang there now, each one an open contract waiting for a fool brave enough to take it. Head east to read them. Near the south wall sit two barrels. A hand-lettered sign on the first reads: CLOTHES FOR THE POOR. A brass plate on the second reads: USED GOWNS ONLY — DO NOT PUT FOOD IN HERE.`,
    look: "A vast warm hall that smells of woodsmoke and roasted meat. Adventurers crowd the scarred oak tables. Hokas Tokas tends bar, barmaids weave between tables, and Aldric the Veteran sits alone in his corner booth. The courtyard lies west, the notice board east, the armory north, and the bank below.",
    glance: "The Main Hall. Warm, loud, crowded. Hokas behind the bar, Aldric in his corner.",
    exits: {
      north: "armory",
      east: "notice_board",
      west: "guild_courtyard",
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
        npcMoodShift: "Everyone is uneasy. The barmaids stay behind the bar, whispering.",
        dangerLevel: 1,
      },
    },
    npcs: ["hokas_tokas", "old_mercenary", "lira", "mavia", "seraine"],
    items: ["notice_board_key"],
    examinableObjects: [
      { id: "notice_board", label: "Notice board" },
      { id: "charity_barrel", label: "Barrel 1 — Clothes for the Poor" },
      { id: "gown_barrel", label: "Barrel 2 — Used Gowns Only" },
      { id: "great_fireplace", label: "The great fireplace" },
      { id: "the_bar", label: "The bar" },
      { id: "members_chest", label: "A row of small iron chests" },
    ],
    visualDescription:
      "A vast warm hall of pale Aquilonian marble with high vaulted ceilings supported by fluted columns. Long oak tables with tankards, plates, and candles — a place of food and drink, not combat. A long wooden bar along one wall with barrels and bottles behind it. A notice board covered in pinned parchment in one corner. A massive stone fireplace with a bright, friendly crackling fire casting warm orange light across the room. Iron-and-bronze chandeliers overhead. Empty room — no people, no figures, no statues, no carvings of humans. Only architecture, furniture, firelight, and warmth.",
    sceneTone: "aquilonian",
  },

  // ── Notice Board ────────────────────────────────────────────
  notice_board: {
    id: "notice_board",
    name: "The Notice Board",
    description: `A wall covered floor-to-ceiling in pinned notices. Most are routine — bounty postings, escort contracts, wanted posters for people who are almost certainly dead. Three notices stand out, posted on official Guild parchment with the seal of the Free Adventurers:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GUILD POSTINGS — OPEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] THE MIRRORS OF TUZUN THUNE
    A sealed wizard's tower in the western wilderness.
    Investigation, light combat. Novice difficulty.
    → Type: ENTER THE MIRRORS OF TUZUN THUNE

[2] THE SERPENT IN THE COURT
    A noble court two days north has gone wrong.
    Investigation, intrigue, sudden combat. Moderate.
    → Type: ENTER THE SERPENT IN THE COURT

[3] THE PICTISH TIME-TOMB
    A shaman in the western wild is opening something old.
    Deadly. Trained heroes only.
    → Type: ENTER THE PICTISH TIME-TOMB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return to the Main Hall (GO WEST) to prepare before entering any adventure.`,
    look: "A wall of pinned notices. Three stand out on official Guild parchment — the Mirrors of Tuzun Thune, the Serpent in the Court, and the Pictish Time-Tomb. Each has entry instructions.",
    glance: "The notice board. Three Guild postings pinned on official parchment.",
    exits: { west: "main_hall" },
    stateModifiers: {},
    npcs: [],
    items: [],
    examinableObjects: [
      { id: "mirrors_notice", label: "Mirrors of Tuzun Thune notice" },
      { id: "serpent_notice", label: "Serpent in the Court notice" },
      { id: "pictish_tomb_notice", label: "Pictish Time-Tomb notice" },
      { id: "treasure_maps", label: "Dubious treasure maps" },
      { id: "wanted_posters", label: "Wanted posters" },
    ],
    visualDescription:
      "A marble alcove off the Main Hall, its walls covered floor-to-ceiling in layered parchment notices pinned to cork boards framed in dark wood — bounty postings, hand-drawn maps, wanted portraits, contract seals stamped in red wax. Three large official guild notices on heavy vellum stand out in the centre. Bronze lamp brackets cast warm light that makes the older papers curl at the edges.",
    sceneTone: "aquilonian",
  },

  // ── Guild Armory ────────────────────────────────────────────
  armory: {
    id: "armory",
    name: "The Guild Armory",
    description: `A long narrow room lined with armor stands. The Guild maintains a basic selection of well-worn protective gear for members who need to suit up quickly — patched leather cuirasses, dented iron helms, scuffed leather neckguards, and battered round shields. A bored-looking attendant sits at a small desk near the door, occasionally polishing a helmet that doesn't need polishing.`,
    look: "A narrow room lined with armor stands — old leather cuirasses, iron helms, leather neckguards, and round wooden shields. A young attendant named Pip sits at a desk near the door.",
    glance: "The armory. Stands of well-worn armor, the attendant at his desk.",
    exits: { south: "main_hall" },
    stateModifiers: {},
    npcs: ["armory_attendant"],
    items: [],
    examinableObjects: [
      { id: "armor_stands", label: "Armor stands" },
      { id: "shield_rack", label: "The shield rack" },
      { id: "armory_desk", label: "The attendant's desk" },
    ],
    visualDescription:
      "A long vaulted chamber of pale stone with iron armor stands and racks lining both walls — battered leather cuirasses, dented open-faced iron helms, stiff leather neckguards, and round iron-rimmed wooden shields, all of every condition from heavily-used to nearly retired. A grindstone sits in one corner beside a bucket of water gone rust-brown. Bronze lamp brackets throw warm amber light along the rows of leather and steel. The floor is flagstone, worn smooth by generations of armored boots.",
    sceneTone: "aquilonian",
  },

  // ── Guild Bank ──────────────────────────────────────────────
  guild_vault: {
    id: "guild_vault",
    name: "The Guild Bank",
    description: `A low-ceilinged stone room beneath the Main Hall. Iron strongboxes line the walls, each bearing a personal lock. A heavyset dwarf named Brunt manages the bank with meticulous suspicion. This is where adventurers bank their gold between adventures — death in the field only takes what you carry.`,
    look: "A low stone room beneath the hall. Iron strongboxes line the walls. Brunt the dwarf manages deposits and withdrawals. Bank your gold here — death only takes what you carry.",
    glance: "The Guild Bank. Strongboxes and stone. Brunt watches you from behind his counter.",
    exits: { up: "main_hall" },
    stateModifiers: {},
    npcs: ["brunt_the_banker"],
    items: [],
    examinableObjects: [
      { id: "iron_strongboxes", label: "Iron strongboxes" },
      { id: "vault_counter", label: "Brunt's counter" },
    ],
    visualDescription:
      "A low vaulted cellar of heavy Aquilonian stonework, the walls thick and windowless. A single iron-banded door guards the entrance. A scarred oak counter sits before rows of iron strongboxes lining the far wall, each padlocked and marked with a brass numeral. Ledgers tower in unstable columns behind the counter. A single bronze oil lamp provides the only light. The smell is dust, old coin, and cold stone.",
    sceneTone: "aquilonian",
  },

  // ── Pots & Bobbles (Mage School) ─────────────────────────────
  mage_school: {
    id: "mage_school",
    name: "Pots & Bobbles",
    description:
      `The doorway from the courtyard was narrow. The room behind it is not. Pots & Bobbles opens into a space that should not fit inside the building you entered — a high-vaulted chamber of dark stone and polished wood that stretches far deeper and wider than the modest exterior suggests. The air hums. Not a sound — a vibration you feel in your sternum and behind your eyes, as though the building itself is quietly breathing.\n\nShelves line the walls from floor to distant ceiling, crammed with bottles, jars, bound scrolls, and objects that defy casual description. Some glow faintly. One appears to be a jar of preserved lightning. Another contains something that is definitely looking back at you.\n\nA long glass-topped counter displays potions in neat rows — healing draughts, stamina brews, antidotes in colour-coded bottles, and a few items with handwritten labels that say only DO NOT TOUCH. Behind the counter, a tall, gangly young wizard sits on a stool that's too short for him, simultaneously reading three books and scratching notes in a fourth.\n\nA hand-lettered sign on the wall reads: IDENTIFICATION SERVICES · MAGICAL TRAINING · POTIONS & REAGENTS · WE BUY HERBS AND CURIOSITIES.`,
    look:
      "A chamber much larger inside than out. Shelves of potions, scrolls, and strange objects. A glass counter displays healing draughts and antidotes. A gangly young wizard named Zim sits behind it, reading three books at once. The air hums.",
    glance: "Pots & Bobbles. Potions, scrolls, and Zim behind the counter.",
    exits: { north: "guild_courtyard" },
    stateModifiers: {},
    npcs: ["zim_the_wizard"],
    items: [],
    examinableObjects: [
      { id: "potion_display", label: "The potion display" },
      { id: "scroll_shelves", label: "The scroll shelves" },
      { id: "strange_jars", label: "The strange jars" },
      { id: "zim_books", label: "Zim's books" },
      { id: "identification_sign", label: "The services sign" },
    ],
    visualDescription:
      "An impossibly large chamber of dark polished stone and warm wood, far deeper than the exterior suggests. Floor-to-ceiling shelves crammed with glass bottles, leather-bound scrolls, and mysterious objects — some faintly glowing. A long glass-topped counter with neat rows of colourful potions. Bronze astrolabes and crystal spheres on high shelves. Warm amber light from no visible source. Dust motes suspended in air that hums with unseen energy. Ancient Aquilonian architecture crossed with an alchemist's workshop. No people visible.",
    sceneTone: "aquilonian",
  },

  // ── Shrine of Ma'at ─────────────────────────────────────────
  // Sprint 7b.B — first consecrated room in the game. Provides the
  // temple modification for Bless (longer duration, reagents waived).
  shrine_of_maat: {
    id: "shrine_of_maat",
    name: "The Shrine of Ma'at",
    description:
      "A small alcove off the guild courtyard, set into the stone as though the building folded itself inward to make room for it. The floor is swept clean. A low stone plinth holds a brass scale — one pan empty, one pan bearing a white feather that never moves despite the draft from the courtyard. The walls are carved with the 42 Oaths in tight columns, each glyph precise and unhurried. No lamp burns here, yet the stone seems to hold light from some earlier hour. Adventurers stop here before heading out — not the pious ones necessarily, just the serious ones.",
    look: "A small stone alcove. A brass scale with a white feather on one pan. The 42 Oaths carved on every wall. No lamp, yet the stone holds light.",
    glance: "The Shrine of Ma'at. Brass scale, feather, carved oaths.",
    exits: { north: "guild_courtyard" },
    stateModifiers: {},
    npcs: [],
    items: [],
    examinableObjects: [
      { id: "brass_scale", label: "The brass scale" },
      { id: "white_feather", label: "The white feather" },
      { id: "carved_oaths", label: "The carved Oaths" },
    ],
    visualDescription:
      "A small stone alcove room with low vaulted ceiling. Smooth pale stone walls carved floor-to-ceiling with dense columns of hieroglyphic-style glyphs — 42 oaths, each rendered in careful relief. At the center, a low stone plinth supports an ancient brass balance scale. One pan holds a single white feather, perfectly still. The room glows with sourceless soft warm gold light — not torch light, something older. Clean swept stone floor. No shadows. Sacred stillness.",
    sceneTone: "civilized",
    consecrated: true,
    deity: "maat",
  },

};

// ── Brunt the Banker — Tier-based greeting pools ────────────
// Brunt's reaction when you enter the Guild Bank depends on how
// much gold you have banked. 4 tiers, 20 responses each.

export const BRUNT_GREETINGS: Record<string, string[]> = {
  poor: [
    `"Ah. You." He doesn't open the ledger.`,
    `He glances at your box number and almost smiles. Almost.`,
    `"Back again. Bold of you."`,
    `He looks up. Looks back down. The silence says everything.`,
    `"I'd ask your business but I suspect it would be brief."`,
    `He breathes through his nose. Loudly.`,
    `"The box is where you left it. So is everything in it. Which is to say."`,
    `"You know where the door is. You also know where the bank is. Pick one."`,
    `He taps the counter once. Waits. Does not tap again.`,
    `"I've seen fuller coin purses on dead men."`,
    `"Name." He already knows it. This is a power move.`,
    `He sets the ledger down with slightly more force than necessary.`,
    `"Deposits go in the box. Withdrawals come out. At present, I see no reason for either."`,
    `"Still here? I assumed you were passing through."`,
    `He stares at a point six inches above your head. Professional disinterest.`,
    `"The bank is for savings. You'd need savings first."`,
    `"Come back when you have something to deposit. Or don't. Either way."`,
    `He doesn't look up. You get the sense this is normal for accounts like yours.`,
    `"I remember you. I wish that were a compliment."`,
    `"If it helps, you're not the worst account I manage. Close, though."`,
  ],
  modest: [
    `"You're alive. That's already better than your last visit suggested."`,
    `He opens the ledger without complaint. A promotion of sorts.`,
    `"Hm. You've been busy. Somewhat."`,
    `"I see you've discovered the concept of not dying. Well done."`,
    `He pulls your box without being asked. Progress.`,
    `"Business?" One word. But a respectful word.`,
    `"Your account is... functional. I've said worse."`,
    `He gives a single nod. The dwarvish equivalent of a standing ovation.`,
    `"You're building something. Slowly. But building."`,
    `"I don't need to check the ledger for you anymore. That means something."`,
    `He sets your box on the counter with what might be care.`,
    `"Still breathing, still banking. The system works."`,
    `"You're in the middle of the book now. Not the front. Not the back. Middle is fine."`,
    `He acknowledges you with a grunt. A warm grunt, by Brunt standards.`,
    `"I see you've been working. The numbers agree."`,
    `"Your box has moved past the 'embarrassing' section of the bank. Congratulations."`,
    `"Consistent deposits. I notice these things. I notice everything."`,
    `He slides the ledger toward you without being asked. Trust.`,
    `"The account is in order. As it should be."`,
    `"You're doing better than most. That's not a compliment — most do terribly."`,
  ],
  solid: [
    `"Good day." Two words. From Brunt, that's practically a hug.`,
    `He nods. Actually nods. Something is different about today.`,
    `"Your box is getting heavy. I approve of heavy."`,
    `He brings your box to the counter before you ask. First time for everything.`,
    `"I was just thinking about your account. That has never happened before."`,
    `"Solid account. I've moved you to a reinforced box. Don't read into it."`,
    `He pours you a thimble of something brown. Doesn't explain.`,
    `"You'll want a second box soon. I've set one aside. No reason."`,
    `"The hinges on your box are complaining. That's the sound of success."`,
    `He almost makes eye contact. A milestone.`,
    `"I've upgraded your lock. Better security for better clients. You qualify now."`,
    `"Your balance is... respectable." He says this like it physically hurts him.`,
    `"I may have mentioned your account to the other bank keepers. Favorably."`,
    `He brushes a speck of dust off your box before setting it down. Tenderness.`,
    `"You're in the top quarter of accounts now. Act accordingly."`,
    `"When you come in, I stop what I'm doing. That's new."`,
    `"Your ledger entry takes two lines now. I had to adjust the columns."`,
    `He retrieves your box with both hands. Reverently.`,
    `"I've stopped assuming each visit is your last. High praise."`,
    `"If something happens to you out there — and I hope it doesn't — your account would be worth fighting over."`,
  ],
  distinguished: [
    `Brunt stands when you enter. He has never stood for anyone.`,
    `"Ah. My favorite account." He freezes. Clears his throat. Pretends he didn't say that.`,
    `"I took the liberty of polishing your box. The gold deserves better than dust."`,
    `He produces a chair. You didn't know there was a chair down here.`,
    `"I've been thinking about your portfolio. At night. This concerns me."`,
    `"Your account has its own page in the ledger now. Most get a line. You get a page."`,
    `He pours two thimbles. Keeps one. Raises it in your direction. Says nothing.`,
    `"I've reinforced the wall behind your box. Precautionary. Don't ask what it cost me."`,
    `"If the Guild ever falls — and it won't — I would carry your box out personally."`,
    `"I've stopped counting your balance in gold and started counting it in weight. Kilograms."`,
    `He places a small cloth on the counter before setting your box down. Like a jeweler.`,
    `"You've exceeded every account I've managed in forty years of bank keeping. I'm not emotional about this. My eyes are dusty."`,
    `"I had a dream about your account. It was... satisfying. We will never speak of this."`,
    `He greets you at the stairs before you reach the counter. Unprecedented.`,
    `"I've moved your holdings to the back room. The secure one. The one with the traps."`,
    `"Your name is in the ledger of distinction. There are three names in it. Two are dead kings."`,
    `He offers you a handshake. His grip could crush stone. He is gentle.`,
    `"I find myself... looking forward to your visits. This is deeply uncomfortable for me."`,
    `"If you need anything — and I mean anything — from this bank, you need only ask. I have never said that to a living person."`,
    `"You've earned something I give to no one." He pauses. "Benefit of the doubt."`,
  ],
};

export function getBruntTier(bankedGold: number): string {
  if (bankedGold <= 10) return "poor";
  if (bankedGold <= 50) return "modest";
  if (bankedGold <= 1000) return "solid";
  return "distinguished";
}

export const GUILD_HALL: AdventureModule = {
  id: "guild_hall",
  name: "The Guild Hall, Ostavar",
  description: "The Guild of Free Adventurers in Ostavar, jewel of the Hyborian kingdoms — the hub all roads lead back to.",
  entryRoom: "church_of_perpetual_life",
  rooms,
  npcScripts: GUILD_HALL_NPC_SCRIPTS,
};
