// ============================================================
// Howard public-domain anchor registry for the Creator Forge
// wizard.
//
// PD safety: every story in this list is verified as Bucket A
// (US public domain, non-renewal confirmed) per
// Public_Domain_Rules.md §1.2. Trademark-radioactive terms
// (Conan, Cimmerian, Hyboria, Hyborian) are scrubbed from any
// player-facing string; the wizard's "inspired by" framing keeps
// the protagonist as the player, not Howard's named character.
//
// Each anchor provides:
//   - Naming defaults + AffectVector biases
//   - A `defaults` map giving the wizard a pre-filled answer for
//     each of the other 16 questions. Most defaults use "other"
//     with story-specific customText so the Creator sees a rich,
//     module-flavored sentence in the textarea (which they can
//     edit or override).
//   - A sourceUrl pointing to the canonical public-domain text.
// ============================================================

import type { AffectAxis } from "../karma/atom-types";

export interface PdAnchorDefault {
  /** Which option to select (preset id, or "other" for fill-in). */
  optionId: string;
  /** If optionId === "other", the AI-supplied story-specific text. */
  customText?: string;
}

export interface PdAnchor {
  id: string;
  title: string;
  era: "thurian" | "early-hyborian" | "late-hyborian" | "post-cataclysm";
  affectBias: Partial<Record<AffectAxis, number>>;
  blurb: string;
  /** Pre-filled answers to the other 16 wizard questions. */
  defaults?: Record<string, PdAnchorDefault>;
  /** Canonical public-domain text. Surfaced under the button. */
  sourceUrl?: string;
  /** Bucket A (PD-safe) provenance line. Shown under the button. */
  pdNotice?: string;
}

export const PD_ANCHORS: PdAnchor[] = [
  // ──────────────────────────────────────────────────────────
  {
    id: "mirrors-of-tuzun-thune",
    title: "Mirrors of Tuzun Thune",
    era: "thurian",
    blurb: "Twelve-thousand-year-old mirror-maze; reflections that lie.",
    affectBias: { wonder: 0.4, dread: 0.3, melancholy: 0.2 },
    sourceUrl: "https://en.wikisource.org/wiki/The_Mirrors_of_Tuzun_Thune",
    pdNotice: "Kull tale, Weird Tales Sep 1929 · Bucket A (non-renewal verified)",
    defaults: {
      biome: { optionId: "civilization" },
      "civilization-status": {
        optionId: "other",
        customText: "A half-forgotten sorcerer's tower in the middle of a living capital — neighbors don't quite remember who built it or what walks its halls.",
      },
      "location-anchor": { optionId: "valus" },
      "conflict-pattern": {
        optionId: "other",
        customText: "A king walks into a wizard's tower out of curiosity. The wizard does not attack him; the mirrors do.",
      },
      "moral-palette": {
        optionId: "other",
        customText: "Not good vs evil — selfhood vs dissolution. The pull is to step through the glass, and the cost is everything you were.",
      },
      "illumination-tilt": { optionId: "toward-dark" },
      "faction-count": {
        optionId: "other",
        customText: "One ancient sorcerer, his mirrors, and the dream-reflections that crowd behind the silver. No politics.",
      },
      "enemy-composition": {
        optionId: "other",
        customText: "A single elder sorcerer of vast psychic power, plus the silent reflections he calls forth from his mirrors.",
      },
      "combat-density": {
        optionId: "other",
        customText: "Combat is almost absent — the threat is metaphysical. One climactic confrontation, optional.",
      },
      "henchman-availability": { optionId: "none" },
      "gear-gates": { optionId: "open" },
      "atom-severity": {
        optionId: "other",
        customText: "Each mirror offers a different self. Choosing one defines the soul; choosing badly costs identity.",
      },
      "scroll-seeding": { optionId: "one-thoth" },
      length: { optionId: "short" },
      "quest-branching": { optionId: "single" },
      pace: {
        optionId: "other",
        customText: "Dreamlike, slow, contemplative. The tension is psychological — every chamber lingers.",
      },
      "reward-shape": {
        optionId: "other",
        customText: "Metaphysical insight rather than treasure. A scroll, a fragment of cosmic understanding, a permanent virtue shift.",
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  {
    id: "the-shadow-kingdom",
    title: "The Shadow Kingdom",
    era: "thurian",
    blurb: "Serpent-folk hidden in noble court; trust dissolved.",
    affectBias: { dread: 0.5, fear: 0.3, excitement: 0.2 },
    sourceUrl: "https://en.wikisource.org/wiki/The_Shadow_Kingdom",
    pdNotice: "Kull tale, Weird Tales Aug 1929 · Bucket A (non-renewal verified)",
    defaults: {
      biome: { optionId: "civilization" },
      "civilization-status": {
        optionId: "bustling",
      },
      "location-anchor": { optionId: "valus" },
      "conflict-pattern": {
        optionId: "other",
        customText: "An infiltration mystery — serpent-folk have replaced noble courtiers and council members. The player must learn to tell them apart before the council convenes and the strike falls.",
      },
      "moral-palette": {
        optionId: "other",
        customText: "Every ally is a possible enemy. Trust becomes a kind of test the player keeps failing and passing.",
      },
      "illumination-tilt": { optionId: "neutral" },
      "faction-count": {
        optionId: "other",
        customText: "Two clashing factions hidden in the same court: human nobles loyal to the throne, and serpent-folk wearing those nobles' faces.",
      },
      "enemy-composition": {
        optionId: "other",
        customText: "Disciplined serpent-folk infiltrators with shape-changing glamour — fewer in number, deadlier in skill than common bandits.",
      },
      "combat-density": { optionId: "occasional" },
      "henchman-availability": {
        optionId: "other",
        customText: "One canonical loyal companion — the warrior whose blade is true. (In Howard, he is Brule the Spearslayer; rename to taste.)",
      },
      "gear-gates": {
        optionId: "other",
        customText: "One uncommon gate: a relic that can pierce serpent-folk glamour — a silver weapon, a mirror, an ancient sigil.",
      },
      "atom-severity": {
        optionId: "other",
        customText: "Heavy moral weight: kill the wrong courtier and you've killed a friend; trust the wrong one and the throne falls.",
      },
      "scroll-seeding": { optionId: "none" },
      length: { optionId: "medium" },
      "quest-branching": { optionId: "one-branch" },
      pace: {
        optionId: "other",
        customText: "Sawtooth — court intrigue and slow paranoia building to a sudden, violent revelation in the throne room.",
      },
      "reward-shape": {
        optionId: "other",
        customText: "Integrity reward for unmasking deception, Standing reward for restoring the legitimate court.",
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  {
    id: "kings-of-the-night",
    title: "Kings of the Night",
    era: "thurian",
    blurb: "Pictish tomb-opening; ancient king summoned to fight.",
    affectBias: { awe: 0.4, dread: 0.3, excitement: 0.3 },
    sourceUrl: "https://en.wikisource.org/wiki/Kings_of_the_Night",
    pdNotice: "Bran Mak Morn / Kull, Weird Tales Nov 1930 · Bucket A",
    defaults: {
      biome: { optionId: "wilderness-temperate" },
      "civilization-status": {
        optionId: "other",
        customText: "Borderland Pictish wilds — heather and moor, ancient cairns half-sunken in the earth, no city in sight.",
      },
      "location-anchor": { optionId: "poi-skull-of-silence" },
      "conflict-pattern": {
        optionId: "other",
        customText: "Open war — the player and their warband call up a long-dead king to lead the tribes against an organized invader.",
      },
      "moral-palette": { optionId: "heroic" },
      "illumination-tilt": { optionId: "toward-light" },
      "faction-count": {
        optionId: "other",
        customText: "Two clashing forces: the tribal defenders (with the summoned king as ally) versus a disciplined imperial column.",
      },
      "enemy-composition": {
        optionId: "other",
        customText: "Veteran soldiers in tight formation — shield-walls, archery, a thinking commander. Not grunts.",
      },
      "combat-density": { optionId: "steady" },
      "henchman-availability": {
        optionId: "other",
        customText: "Rotating cast — tribal chieftains, scouts, and the summoned ancient king himself as a phase-of-the-arc companion.",
      },
      "gear-gates": {
        optionId: "other",
        customText: "One uncommon gate: a ritual relic required to call the dead king from his cairn — a horn, a blade, a sigil-stone.",
      },
      "atom-severity": {
        optionId: "other",
        customText: "Heavy — the rite carries cost. Calling the king demands a sacrifice the player must choose how to give.",
      },
      "scroll-seeding": { optionId: "one-stobaean" },
      length: { optionId: "medium" },
      "quest-branching": { optionId: "one-branch" },
      pace: {
        optionId: "other",
        customText: "Sawtooth — ritual preparation, then the battle's slow tightening, then the climactic charge of the king's return.",
      },
      "reward-shape": {
        optionId: "other",
        customText: "Courage + Standing virtue growth. A relic of the ancient king as keepsake.",
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  {
    id: "the-haunter-of-the-ring",
    title: "The Haunter of the Ring",
    era: "early-hyborian",
    blurb: "Occult investigation — a cursed ring drives a woman to murder her husband.",
    affectBias: { dread: 0.5, fear: 0.4, melancholy: 0.2 },
    sourceUrl: "https://en.wikisource.org/wiki/The_Haunter_of_the_Ring",
    pdNotice: "Conrad & Kirowan occult, Weird Tales Jun 1934 · Bucket A",
    defaults: {
      biome: { optionId: "civilization" },
      "civilization-status": {
        optionId: "other",
        customText: "A respectable household with one quiet room where the antique cabinet hides a thing that was never meant to be a wedding gift.",
      },
      "location-anchor": { optionId: "valus" },
      "conflict-pattern": {
        optionId: "other",
        customText: "Occult investigation — a friend's wife has tried twice to kill him; the player must find what is wearing her and break its grip.",
      },
      "moral-palette": {
        optionId: "other",
        customText: "The afflicted is innocent. The malice belongs to a long-dead sorcerer reaching across years through the ring on her finger.",
      },
      "illumination-tilt": { optionId: "toward-light" },
      "faction-count": { optionId: "solitary" },
      "enemy-composition": {
        optionId: "other",
        customText: "One ancient occult presence bound to a small object. Defeating it means breaking the binding, not winning a sword fight.",
      },
      "combat-density": { optionId: "rare" },
      "henchman-availability": {
        optionId: "other",
        customText: "One trusted occult-scholar companion (in Howard: Kirowan) who reads the signs the player would otherwise miss.",
      },
      "gear-gates": {
        optionId: "other",
        customText: "One uncommon gate: a counter-rite or talisman that can sever the binding — a saint's relic, a ward-sigil, salt and silver.",
      },
      "atom-severity": {
        optionId: "other",
        customText: "Major — the ritual to break the binding may cost the victim her sanity or the player a permanent virtue point.",
      },
      "scroll-seeding": { optionId: "one-stobaean" },
      length: { optionId: "short" },
      "quest-branching": { optionId: "single" },
      pace: {
        optionId: "other",
        customText: "Slow investigation that climbs to one charged ritual scene; the tension is being right in time, not winning a fight.",
      },
      "reward-shape": { optionId: "lore-heavy" },
    },
  },

  // ──────────────────────────────────────────────────────────
  {
    id: "iron-shadows-in-the-moon",
    title: "Iron Shadows in the Moon",
    era: "early-hyborian",
    blurb: "Shipwrecked on a haunted island; iron statues that move at moonrise.",
    affectBias: { dread: 0.4, wonder: 0.3, fear: 0.3 },
    sourceUrl: "https://en.wikisource.org/wiki/Iron_Shadows_in_the_Moon",
    pdNotice: "Howard sea-adventure, Weird Tales Apr 1934 · Bucket A",
    defaults: {
      biome: { optionId: "jungle-or-lost" },
      "civilization-status": {
        optionId: "other",
        customText: "An uncharted island in the Vilayet-equivalent inland sea — ruined courts choked by jungle, a colonnade of black iron statues no one made.",
      },
      "location-anchor": { optionId: "geo-tiger-valley" },
      "conflict-pattern": {
        optionId: "other",
        customText: "Survival mystery — shipwrecked, hunted across the island by pirates, then by the iron statues that walk when the moon rises.",
      },
      "moral-palette": { optionId: "morally-gray" },
      "illumination-tilt": { optionId: "toward-dark" },
      "faction-count": {
        optionId: "other",
        customText: "Two predators on the same island — the human pirate crew, and the metal sentinels of whatever ruled here in elder ages.",
      },
      "enemy-composition": {
        optionId: "other",
        customText: "Mixed — a captain and his pirates (lower-tier, many) plus the iron-shadow guardians (one elite-tier antagonist at moonrise).",
      },
      "combat-density": { optionId: "steady" },
      "henchman-availability": {
        optionId: "other",
        customText: "One rescued captive willing to fight beside the player — the canonical Olivia figure in Howard; rename to taste.",
      },
      "gear-gates": { optionId: "open" },
      "atom-severity": {
        optionId: "other",
        customText: "Heavy — protecting the rescued captive vs going alone, with real cost either way.",
      },
      "scroll-seeding": { optionId: "none" },
      length: { optionId: "medium" },
      "quest-branching": { optionId: "one-branch" },
      pace: {
        optionId: "other",
        customText: "Sawtooth — daylight chase by the pirates, then the moonrise crescendo when the statues walk.",
      },
      "reward-shape": { optionId: "loot-heavy" },
    },
  },

  // ──────────────────────────────────────────────────────────
  {
    id: "beyond-the-black-river",
    title: "Beyond the Black River",
    era: "early-hyborian",
    blurb: "Frontier war between civilized colony and forest-dwelling tribes.",
    affectBias: { fear: 0.3, excitement: 0.4, melancholy: 0.2 },
    sourceUrl: "https://en.wikisource.org/wiki/Beyond_the_Black_River",
    pdNotice: "Howard frontier story, Weird Tales May–Jun 1935 · Bucket A",
    defaults: {
      biome: { optionId: "wilderness-temperate" },
      "civilization-status": {
        optionId: "other",
        customText: "A colonial frontier — palisade forts and clearings ringed by an old forest the colonists barely scratched. The wilderness is winning.",
      },
      "location-anchor": { optionId: "geo-lost-lands" },
      "conflict-pattern": {
        optionId: "other",
        customText: "Open war — Pictish-equivalent forest warriors are picking off frontier outposts; the player rides scout for an under-supplied garrison.",
      },
      "moral-palette": {
        optionId: "other",
        customText: "Civilization vs barbarism, with the meditation that the line is thinner than the colonists pretend. Neither side is clean.",
      },
      "illumination-tilt": { optionId: "neutral" },
      "faction-count": { optionId: "two-clashing" },
      "enemy-composition": {
        optionId: "other",
        customText: "Pictish-style warbands — many grunts with a shaman at the back. Ambushes and forest cover, not pitched battle.",
      },
      "combat-density": { optionId: "steady" },
      "henchman-availability": {
        optionId: "other",
        customText: "Rotating frontier scouts — one or two ride with the player at any time; some die, some break and run, some prove unkillable.",
      },
      "gear-gates": {
        optionId: "other",
        customText: "One common gate — a torch, a length of rope, or a marked trail-stick. Forest navigation is the choke point.",
      },
      "atom-severity": {
        optionId: "other",
        customText: "Heavy — leaving a wounded scout, burning a Pictish village, sparing a captured warrior. Real choices that mark Integrity.",
      },
      "scroll-seeding": { optionId: "none" },
      length: { optionId: "medium" },
      "quest-branching": { optionId: "one-branch" },
      pace: {
        optionId: "other",
        customText: "Sawtooth — long quiet patrol stretches punctuated by sharp, fatal ambushes.",
      },
      "reward-shape": { optionId: "loot-heavy" },
    },
  },

  // ──────────────────────────────────────────────────────────
  {
    id: "queen-of-the-black-coast",
    title: "Queen of the Black Coast",
    era: "early-hyborian",
    blurb: "Pirate love, ancient ape-god, jungle ruin upriver.",
    affectBias: { eros: 0.3, dread: 0.3, melancholy: 0.4 },
    sourceUrl: "https://en.wikisource.org/wiki/Queen_of_the_Black_Coast",
    pdNotice: "Howard sea/jungle epic, Weird Tales May 1934 · Bucket A",
    defaults: {
      biome: { optionId: "jungle-or-lost" },
      "civilization-status": {
        optionId: "other",
        customText: "A black-stone city deep in the jungle, ruled once by something not human and abandoned for a reason the survivors no longer say.",
      },
      "location-anchor": { optionId: "geo-lost-lands" },
      "conflict-pattern": {
        optionId: "other",
        customText: "A romantic raid up an uncharted river — pirate love, then the discovery that what lives in the ruin is older than the city around it.",
      },
      "moral-palette": { optionId: "morally-gray" },
      "illumination-tilt": { optionId: "neutral" },
      "faction-count": {
        optionId: "other",
        customText: "Two clashing presences: the human pirate crew (the player's people) and the ancient ape-god that owns the upriver ruin.",
      },
      "enemy-composition": {
        optionId: "other",
        customText: "An elite-tier antagonist — the ape-god itself — preceded by lower-tier degenerate descendants serving as its hands.",
      },
      "combat-density": { optionId: "steady" },
      "henchman-availability": {
        optionId: "other",
        customText: "An always-with-party companion — the pirate captain who is the player's lover. Loss of her is the engine of the story.",
      },
      "gear-gates": { optionId: "open" },
      "atom-severity": {
        optionId: "other",
        customText: "Heavy — loyalty, jealousy, grief. The cost of choosing the raid over the safe voyage. The cost of staying when she falls.",
      },
      "scroll-seeding": { optionId: "none" },
      length: { optionId: "long" },
      "quest-branching": { optionId: "one-branch" },
      pace: {
        optionId: "other",
        customText: "Sawtooth — courtship and voyage in the first half, jungle horror crescendo in the second.",
      },
      "reward-shape": {
        optionId: "other",
        customText: "Passion + Spirituality growth, plus a legacy chronicle entry. Treasure exists but is secondary to the emotional weight.",
      },
    },
  },

  // ──────────────────────────────────────────────────────────
  {
    id: "the-fire-of-asshurbanipal",
    title: "The Fire of Asshurbanipal",
    era: "early-hyborian",
    blurb: "Lovecraftian desert ruin — a black gem guarded by what should never have been awakened.",
    affectBias: { dread: 0.5, wonder: 0.3, fear: 0.3 },
    sourceUrl: "https://en.wikisource.org/wiki/The_Fire_of_Asshurbanipal",
    pdNotice: "Howard Lovecraftian desert tale, Weird Tales Dec 1936 · Bucket A",
    defaults: {
      biome: { optionId: "mountain-or-desert" },
      "civilization-status": {
        optionId: "other",
        customText: "A buried ziggurat in the deep desert — wind-carved, half-swallowed by dunes, with one perfectly preserved black-stone throne room at the center.",
      },
      "location-anchor": { optionId: "poi-skull-of-silence" },
      "conflict-pattern": {
        optionId: "other",
        customText: "A treasure-hunt that becomes a horror — the player and a companion cross the desert to claim a famed black gem and learn what kept it from being taken before.",
      },
      "moral-palette": { optionId: "damned-by-design" },
      "illumination-tilt": { optionId: "toward-dark" },
      "faction-count": {
        optionId: "other",
        customText: "Two threats — human raiders pursuing the same gem, and the elder thing in the throne room that no living tribe will name.",
      },
      "enemy-composition": {
        optionId: "other",
        customText: "Mixed — pursuing raiders (lower-tier, persistent) and one cosmic-horror antagonist that wakes at the climax.",
      },
      "combat-density": { optionId: "climactic-only" },
      "henchman-availability": {
        optionId: "other",
        customText: "One desert-scholar companion — the only one who knows what the inscription means, and the only one who urges turning back.",
      },
      "gear-gates": {
        optionId: "other",
        customText: "One uncommon gate — desert provisions, a guide-stone, or a translation key. The desert kills the unprepared before the temple does.",
      },
      "atom-severity": {
        optionId: "other",
        customText: "Defining — pick up the gem and the world shifts; leave it and the companion may be lost. No clean exit.",
      },
      "scroll-seeding": { optionId: "one-thoth" },
      length: { optionId: "short" },
      "quest-branching": { optionId: "single" },
      pace: {
        optionId: "other",
        customText: "Slow desert dread building to a single sustained climactic encounter in the throne room.",
      },
      "reward-shape": { optionId: "lore-heavy" },
    },
  },

  // ──────────────────────────────────────────────────────────
  {
    id: "original",
    title: "Original / no specific anchor",
    era: "thurian",
    blurb: "No PD inspiration. Pure Creator authorship.",
    affectBias: {},
    pdNotice: "No PD source — Creator originates everything.",
    // intentionally no defaults
  },
];

export function getPdAnchor(id: string | null): PdAnchor | null {
  if (!id) return null;
  return PD_ANCHORS.find((a) => a.id === id) ?? null;
}
