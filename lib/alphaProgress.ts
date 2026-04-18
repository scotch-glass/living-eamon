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
    ],
  },
  {
    id: "combat",
    label: "Combat System (HWRR)",
    items: [
      { label: "Body-part targeting system (6 hit zones)", status: "done" },
      { label: "Critical hit mechanics + gore narration", status: "done" },
      { label: "Bleed & poison status effects", status: "done" },
      { label: "Weapon skill progression (Melee/Ranged/Magic)", status: "done" },
      { label: "Armor damage reduction + durability tracking", status: "planned" },
      { label: "Spell casting in combat (CAST system)", status: "done" },
      { label: "Visual combat animations & blood effects", status: "done" },
      { label: "Combat AI behavior (enemy tactics)", status: "planned" },
    ],
  },
  {
    id: "magic",
    label: "Magic Systems",
    items: [
      { label: "Guild Magic (4 legal spells: BLAST, HEAL, LIGHT, SPEED)", status: "done" },
      { label: "Occult Magic (reagent-based, forbidden)", status: "done" },
      { label: "Mana system + mana pool", status: "done" },
      { label: "Reagent system (8 classic items)", status: "done" },
      { label: "Spell failure & consequences", status: "planned" },
      { label: "The Order faction investigations", status: "planned" },
    ],
  },
  {
    id: "economy",
    label: "Economy & Commerce",
    items: [
      { label: "Banking system (Account, Savings, Security)", status: "done" },
      { label: "Static merchant inventory", status: "done" },
      { label: "Universal SELL command", status: "done" },
      { label: "Item identification (Identify skill)", status: "done" },
      { label: "Potion brewing (Alchemy)", status: "planned" },
      { label: "Dynamic pricing based on supply/demand", status: "planned" },
    ],
  },
  {
    id: "world",
    label: "Living World Engine",
    items: [
      { label: "Static world architecture (rooms, NPCs, objects)", status: "done" },
      { label: "Persistent world cache (save Jane's creativity)", status: "done" },
      { label: "NPC agenda system (daily routines)", status: "done" },
      { label: "Consequence engine (burnt rooms, NPC memory)", status: "done" },
      { label: "Virtue tracking (10-virtue moral system)", status: "done" },
      { label: "Bounty & reputation system", status: "active" },
      { label: "Dynamic lighting & day/night cycles", status: "planned" },
      { label: "Procedural dungeon generation", status: "planned" },
    ],
  },
  {
    id: "community",
    label: "Community & Public",
    items: [
      { label: "Community bulletin board (phpBB-style)", status: "active" },
      { label: "Alpha progress tracker (this page)", status: "active" },
      { label: "Copyright & legal disclaimer page", status: "active" },
      { label: "AAA-quality landing page", status: "active" },
      { label: "Early access waitlist system", status: "planned" },
      { label: "Player story submissions & archives", status: "planned" },
      { label: "Multiplayer integration (Phase 3)", status: "planned" },
    ],
  },
];

export function calculateTotalProgress(): { done: number; total: number; percent: number } {
  let done = 0;
  let total = 0;

  PROGRESS_CATEGORIES.forEach((cat) => {
    cat.items.forEach((item) => {
      total++;
      if (item.status === "done") done++;
    });
  });

  const percent = Math.round((done / total) * 100);
  return { done, total, percent };
}
