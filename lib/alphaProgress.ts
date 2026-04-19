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
      { label: "TOTP MFA (2FA via Authenticator apps)", status: "active" },
      { label: "Persistent hero profiles", status: "done" },
      { label: "Player stat persistence across sessions", status: "done" },
      { label: "Character creation wizard", status: "planned" },
      { label: "Hero death & permadeath system", status: "planned" },
      { label: "Legacy/genealogy system (next hero inherits traits)", status: "planned" },
    ],
  },
  {
    id: "combat",
    label: "Combat System (HWRR Body-Part Targeting)",
    items: [
      { label: "Body-part targeting system (6 hit zones)", status: "done" },
      { label: "Critical hit mechanics + gore narration", status: "done" },
      { label: "Bleed & poison status effects", status: "done" },
      { label: "Weapon skill progression (Melee/Ranged/Magic)", status: "done" },
      { label: "Spell casting in combat (CAST system)", status: "done" },
      { label: "Visual combat animations & blood effects", status: "done" },
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
      { label: "Spell failure & consequences (backlash, madness)", status: "planned" },
      { label: "The Order faction (magic police, investigations, purges)", status: "planned" },
      { label: "Enchantment system (imbuing items with magic)", status: "planned" },
      { label: "Rituals & summoning (high-level magic)", status: "planned" },
      { label: "Demon bargains & pacts (irreversible consequences)", status: "planned" },
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
      { label: "Potion brewing & alchemy", status: "planned" },
      { label: "Crafting system (weapons, armor, items)", status: "planned" },
      { label: "Dynamic pricing (supply/demand, haggling)", status: "planned" },
      { label: "Fencing stolen goods (black market merchants)", status: "planned" },
      { label: "Taxes & tithe mechanics (religious/civic obligations)", status: "planned" },
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
      { label: "Virtue tracking (10-virtue moral system)", status: "done" },
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
      { label: "Demon lore & summoning traditions", status: "planned" },
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
      { label: "Virtue tracking & notifications", status: "active" },
      { label: "Skill/stat advancement (learning from doing)", status: "planned" },
      { label: "Injury & scarring system (permanent marks from battles)", status: "planned" },
      { label: "Sanity & mental health mechanics", status: "planned" },
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
      { label: "Game logo (dragon icon)", status: "planned" },
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
