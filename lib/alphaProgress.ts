export const LAST_UPDATED = "April 30, 2026";

export interface ProgressItem {
  label: string;
  status: "done" | "active" | "planned";
}

export interface ProgressCategory {
  id: string;
  label: string;
  items: ProgressItem[];
}

export const PROGRESS_CATEGORIES: ProgressCategory[] = [
  {
    id: "auth",
    label: "Authentication & Accounts",
    items: [
      { label: "Email/password registration & login", status: "done" },
      { label: "Google SSO (OAuth)", status: "done" },
      { label: "Email verification via magic link", status: "done" },
      { label: "Persistent hero profiles", status: "done" },
      { label: "Player stat persistence across sessions", status: "done" },
      { label: "Character creation wizard (multi-step, 20-hero library, prescripted memories)", status: "done" },
      { label: "Hero portrait visible on every non-combat screen (gray-robe variant)", status: "done" },
    ],
  },
  {
    id: "combat",
    label: "Combat System (Body-Part Targeting)",
    items: [
      { label: "Body-part targeting system (4 hit zones: head, neck, torso, limbs)", status: "done" },
      { label: "Critical hit mechanics + gore narration", status: "done" },
      { label: "Bleed & poison status effects", status: "done" },
      { label: "Combat skill progression (Melee + Magic)", status: "done" },
      { label: "Spell casting in combat (CAST system)", status: "done" },
      { label: "Visual combat animations & blood effects", status: "done" },
      { label: "Stamina + fatigue tier system (5 tiers; tier-4 exhaustion blocks the player's turn)", status: "done" },
      { label: "Combat-PICSSI deltas \u2014 routine kill +Passion; dark-being kill +Illumination; stand-and-lose +Courage; flee \u2212Courage/\u2212Standing", status: "done" },
      { label: "NPC karma tags (dark/undead/daemon/sorceror/innocent/friendly/serpent) drive Illumination shifts on kill", status: "done" },
      { label: "Armor damage reduction + durability tracking", status: "planned" },
      { label: "Combat AI behavior (enemy tactics & formations)", status: "planned" },
      { label: "Companion/party system (fighting alongside allies)", status: "planned" },
      { label: "Environmental combat (using terrain, collapsing structures)", status: "planned" },
      { label: "Morale & fear mechanics (enemies rout when terrified)", status: "planned" },
    ],
  },
  {
    id: "magic",
    label: "Magic Systems (Guild & Occult)",
    items: [
      { label: "Guild Magic (4 legal spells: BLAST, HEAL, LIGHT, SPEED)", status: "done" },
      { label: "Occult Magic (reagent-based, forbidden)", status: "done" },
      { label: "Mana system + mana pool", status: "done" },
      { label: "Reagent system (8 classic items)", status: "done" },
      { label: "Magic training & skill advancement", status: "planned" },
      { label: "The Order faction (magic police, investigations, purges)", status: "planned" },
    ],
  },
  {
    id: "economy",
    label: "Economy & Commerce",
    items: [
      { label: "Banking system (Account, Savings, Security)", status: "done" },
      { label: "Static merchant inventory", status: "done" },
      { label: "Universal SELL command (single & bulk sell)", status: "done" },
      { label: "Vendor temporary inventory (72-hour buyback window)", status: "done" },
      { label: "Item identification (Identify skill)", status: "done" },
      { label: "Dynamic pricing (supply/demand, haggling)", status: "planned" },
      { label: "Fencing stolen goods (black market merchants)", status: "planned" },
      { label: "Guild memberships & rank progression", status: "planned" },
    ],
  },
  {
    id: "world",
    label: "Living World Engine & City",
    items: [
      { label: "Static world architecture (rooms, NPCs, objects)", status: "done" },
      { label: "Persistent world cache (save Jane's creativity)", status: "done" },
      { label: "NPC agenda system (daily routines & schedules)", status: "done" },
      { label: "Consequence engine (burnt rooms, NPC memory, vendetta)", status: "done" },
      { label: "PICSSI Virtue System — six-dimensional character scoring (Passion, Integrity, Courage, Standing, Spirituality, Illumination)", status: "done" },
      { label: "PICSSI \u2192 derived stats (STR/DEX/CHA effective; Integrity \u2192 maxHP; Illumination \u2192 maxMana; Spirituality \u2192 HEAL multiplier)", status: "done" },
      { label: "Bounty & reputation system", status: "active" },
      { label: "Aurelion main city fully mapped & populated", status: "planned" },
      { label: "Surrounding wilderness & dungeon entrances", status: "planned" },
      { label: "Day/night cycles & lighting changes", status: "planned" },
      { label: "Weather system (affects travel, combat, visibility)", status: "planned" },
      { label: "Procedural dungeon generation", status: "planned" },
      { label: "NPC romance & seduction mechanics", status: "planned" },
      { label: "NPC betrayal & treachery (quest hooks)", status: "planned" },
      { label: "Faction reputation (different factions, conflicting goals)", status: "planned" },
    ],
  },
  {
    id: "adventures",
    label: "Adventure Modules (Per PD Story)",
    items: [
      { label: "Module A: Shadow Kingdom (Kull, serpent-men)", status: "planned" },
      { label: "Module B: Mirrors of Tuzun Thune (wizard's tower, reality rifts)", status: "planned" },
      { label: "Module C: Kings of the Night (time-crossed battles, Picts vs Rome)", status: "planned" },
      { label: "Procedural adventure generation (post-Alpha)", status: "planned" },
      { label: "Dynamic quest hooks (based on player actions & virtue)", status: "planned" },
      { label: "Multi-arc storylines (quests that unlock other quests)", status: "planned" },
    ],
  },
  {
    id: "lore",
    label: "Lore & Storytelling",
    items: [
      { label: "Thurian Age history & mythology", status: "done" },
      { label: "Detailed NPC backstories & secrets", status: "planned" },
      { label: "Ancient artifacts & their legends", status: "planned" },
      { label: "The Order's history & dark purposes", status: "planned" },
      { label: "Lost civilizations & ruins", status: "planned" },
    ],
  },
  {
    id: "systems",
    label: "Core Game Systems",
    items: [
      { label: "Command parser (LOOK, ATTACK, CAST, DRINK, etc.)", status: "done" },
      { label: "Inventory & equipment system (12 slots, compare popup)", status: "done" },
      { label: "Item inspection (two visual styles)", status: "done" },
      { label: "PICSSI sidebar panel \u2014 5 unipolar bars + bipolar Illumination meter", status: "done" },
      { label: "Affection sidebar panel \u2014 hidden 0..100 meter per met NPC", status: "done" },
      { label: "Karma history log \u2014 last 50 PICSSI shifts with source tags, surfaced in STATS panel", status: "done" },
      { label: "PICSSI dimension shifts + narrative notifications", status: "active" },
      { label: "Per-life virtue reset on rebirth at the Church of Perpetual Life", status: "done" },
      { label: "Per-adventure action budget (20/25/30 by tier)", status: "active" },
      { label: "Activity dispatcher (REST/PRAY/DRINK/BROTHEL/BATHE/DONATE/MORTIFY)", status: "done" },
      { label: "Scrolls of Thoth \u2014 read-verification riddle gate (15 scrolls; +Illumination on first comprehension)", status: "done" },
      { label: "Brothel + fertility-temple + VD mechanics (HEAL / fertility-temple / temple-PRAY cure)", status: "done" },
      { label: "Encounter atom system \u2014 7 authored atoms fire on enter-room / talk-to-npc with PICSSI / affection / flag deltas", status: "done" },
      { label: "Per-NPC affection meter (0..100) drives recurring encounters and grief reach", status: "done" },
      { label: "Life-scope vs legacy-scope flags (legacy survives rebirth; life wipes on death)", status: "done" },
      { label: "Quest Engine bedrock \u2014 generic quest registry, lifecycle helpers, event hooks (foundation for all quest lines)", status: "done" },
      { label: "Quest event emission wired \u2014 enter-room / talk-to-npc / scroll-read / combat-end / item-acquired / command + QUESTS / QUESTS LOG commands", status: "done" },
      { label: "Stamina system (per-swing drain + 5 fatigue tiers + activity-based recovery)", status: "done" },
      { label: "Skill/stat advancement (learning from doing)", status: "planned" },
      { label: "Injury & scarring system (permanent marks from battles)", status: "planned" },
      { label: "Disease & poison tracking (long-term effects)", status: "planned" },
      { label: "Travel system (journeys between locations)", status: "planned" },
      { label: "Rest & recovery (healing, mana restoration)", status: "planned" },
    ],
  },
  {
    id: "community",
    label: "Community & Public Suite",
    items: [
      { label: "Community bulletin board (phpBB-style)", status: "active" },
      { label: "Development tracker & feature roadmap", status: "active" },
      { label: "Copyright & legal disclaimer page", status: "done" },
      { label: "AAA-quality landing page with hero art", status: "active" },
      { label: "Game logo", status: "done" },
      { label: "Early access waitlist system", status: "planned" },
      { label: "Player story submissions & hall of fame", status: "planned" },
      { label: "Patch notes & changelog", status: "planned" },
    ],
  },
];

export function countSystems(): { done: number; active: number; planned: number } {
  let done = 0;
  let active = 0;
  let planned = 0;

  PROGRESS_CATEGORIES.forEach((cat) => {
    cat.items.forEach((item) => {
      if (item.status === "done") done++;
      else if (item.status === "active") active++;
      else if (item.status === "planned") planned++;
    });
  });

  return { done, active, planned };
}
