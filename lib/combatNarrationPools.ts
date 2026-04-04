// Cinematic combat narration pools (imported/re-exported from gameData).

// ── WEAPON CATEGORIES ───────────────────────────────────────

export const WEAPON_SLASH_KEYS = new Set([
  "long_sword",
  "short_sword",
  "katana",
  "scimitar",
  "cutlass",
  "halberd",
  "bardiche",
  "battle_axe",
  "war_axe",
  "large_battle_axe",
  "executioners_axe",
]);

export const WEAPON_PIERCE_KEYS = new Set([
  "dagger",
  "kryss",
  "skinning_knife",
  "spear",
  "war_fork",
  "pitchfork",
]);

export const WEAPON_BLUNT_KEYS = new Set([
  "mace",
  "maul",
  "scepter",
  "black_staff",
  "gnarled_staff",
  "quarter_staff",
  "war_hammer",
]);

export const WEAPON_RANGED_KEYS = new Set(["bow", "crossbow", "repeating_crossbow"]);

export type WoundTier = "glancing" | "solid" | "devastating";
export type WeaponCategory = "slash" | "pierce" | "blunt" | "ranged";

export function getWeaponCategory(weaponKey: string): WeaponCategory {
  if (WEAPON_RANGED_KEYS.has(weaponKey)) return "ranged";
  if (WEAPON_PIERCE_KEYS.has(weaponKey)) return "pierce";
  if (WEAPON_BLUNT_KEYS.has(weaponKey)) return "blunt";
  return "slash";
}

// ── PLAYER HIT DESCRIPTIONS ─────────────────────────────────
// {weapon} {enemy} {damage} placeholders

export const PLAYER_HIT_DESCRIPTIONS: Record<
  WeaponCategory,
  Record<WoundTier, string[]>
> = {
  slash: {
    glancing: [
      "Your {weapon} grazes the {enemy}, opening a shallow cut across its arm. ({damage} damage)",
      "A glancing blow from your {weapon} draws a thin line of blood from the {enemy}. ({damage} damage)",
      "Your {weapon} catches the {enemy} with the edge — not deep, but it bleeds. ({damage} damage)",
      "The {enemy} half-turns away but your {weapon} still finds skin, leaving a red weal. ({damage} damage)",
      "A diagonal swipe leaves a shallow gash across the {enemy}'s side. ({damage} damage)",
      "Your {weapon} nicks the {enemy} — a small wound, but first blood is yours. ({damage} damage)",
      "The tip of your {weapon} traces a cut along the {enemy}'s shoulder. ({damage} damage)",
      "A quick slash leaves the {enemy} bleeding from a surface wound. ({damage} damage)",
    ],
    solid: [
      "Your {weapon} bites deep into the {enemy}'s side, drawing a thick rush of blood. ({damage} damage)",
      "A clean cut from your {weapon} opens a serious wound across the {enemy}'s chest. ({damage} damage)",
      "The {enemy} staggers as your {weapon} carves through flesh and strikes bone. ({damage} damage)",
      "Your {weapon} finds a gap and drives home — the {enemy} lets out a ragged cry. ({damage} damage)",
      "A powerful slash from your {weapon} leaves the {enemy} clutching a deep wound. ({damage} damage)",
      "Your {weapon} opens the {enemy} from shoulder to hip — not fatal, but serious. ({damage} damage)",
      "The {enemy} reels as your {weapon} connects with brutal force. ({damage} damage)",
      "A well-placed cut from your {weapon} sends the {enemy} stumbling backward. ({damage} damage)",
    ],
    devastating: [
      "Your {weapon} tears through the {enemy} in a spray of dark blood — a wound that will not close easily. ({damage} damage)",
      "The {enemy} screams as your {weapon} opens it to the bone. ({damage} damage)",
      "A savage stroke from your {weapon} nearly severs the {enemy}'s sword arm. ({damage} damage)",
      "Your {weapon} drives through the {enemy}'s guard and into something vital. ({damage} damage)",
      "The {enemy} collapses to one knee, your {weapon} having opened a wound that gushes freely. ({damage} damage)",
      "A crushing diagonal blow from your {weapon} leaves the {enemy} barely standing. ({damage} damage)",
    ],
  },
  pierce: {
    glancing: [
      "Your {weapon} skips off the {enemy}'s ribs, drawing a line of blood but little more. ({damage} damage)",
      "A quick thrust grazes the {enemy}'s flank — more sting than wound. ({damage} damage)",
      "Your {weapon} finds the edge of the {enemy} but fails to penetrate deeply. ({damage} damage)",
      "The tip of your {weapon} scores a shallow puncture in the {enemy}'s shoulder. ({damage} damage)",
      "Your thrust glances off the {enemy}'s movement, leaving a small weeping hole. ({damage} damage)",
      "A jabbing strike opens a small puncture wound on the {enemy}'s forearm. ({damage} damage)",
      "Your {weapon} pricks the {enemy} — enough to draw blood, not enough to stop it. ({damage} damage)",
      "A quick thrust nicks the {enemy} across the cheek. ({damage} damage)",
    ],
    solid: [
      "Your {weapon} punches through the {enemy}'s guard and into the meat of its thigh. ({damage} damage)",
      "A straight thrust buries your {weapon} several inches into the {enemy}'s torso. ({damage} damage)",
      "The {enemy} impales itself on your {weapon} as it lunges — the wound is deep. ({damage} damage)",
      "Your {weapon} finds a gap and drives home with a wet, hollow sound. ({damage} damage)",
      "A precise thrust from your {weapon} pierces the {enemy}'s shoulder clean through. ({damage} damage)",
      "Your {weapon} punches deep into the {enemy}'s gut — it doubles forward. ({damage} damage)",
      "The {enemy} gasps as your {weapon} slides between its ribs. ({damage} damage)",
      "A hard thrust drives your {weapon} into the {enemy}'s chest wall. ({damage} damage)",
    ],
    devastating: [
      "Your {weapon} punches clean through the {enemy}, the point emerging from the other side. ({damage} damage)",
      "A vicious thrust buries your {weapon} to the hilt in the {enemy}'s abdomen. ({damage} damage)",
      "The {enemy} shrieks as your {weapon} drives up under its ribs into something critical. ({damage} damage)",
      "Your {weapon} pierces the {enemy} through and through — dark blood follows the blade out. ({damage} damage)",
      "A perfectly placed thrust punches through the {enemy}'s guard and deep into its chest. ({damage} damage)",
      "The {enemy} staggers and nearly falls, your {weapon} buried deep in its torso. ({damage} damage)",
    ],
  },
  blunt: {
    glancing: [
      "Your {weapon} clips the {enemy} across the shoulder — a bruising blow, nothing more. ({damage} damage)",
      "A glancing strike from your {weapon} rattles the {enemy} but fails to connect fully. ({damage} damage)",
      "Your {weapon} grazes the {enemy}'s skull, staggering it slightly. ({damage} damage)",
      "A half-connected swing from your {weapon} leaves a welt on the {enemy}'s arm. ({damage} damage)",
      "Your {weapon} catches the {enemy} a glancing blow across the knee. ({damage} damage)",
      "The edge of your {weapon} strikes the {enemy}'s ribs — a painful bruise, no break. ({damage} damage)",
      "Your {weapon} skims the {enemy}'s temple, drawing a thin line of blood. ({damage} damage)",
      "A clumsy but effective clip from your {weapon} sends the {enemy} reeling slightly. ({damage} damage)",
    ],
    solid: [
      "Your {weapon} connects with a hollow crack against the {enemy}'s ribcage. ({damage} damage)",
      "A full swing from your {weapon} hammers into the {enemy}'s shoulder — bone creaks. ({damage} damage)",
      "The {enemy} grunts as your {weapon} drives the air from its lungs. ({damage} damage)",
      "Your {weapon} catches the {enemy} across the jaw with a sickening crack. ({damage} damage)",
      "A solid blow from your {weapon} staggers the {enemy} hard to one side. ({damage} damage)",
      "Your {weapon} smashes into the {enemy}'s hip — it stumbles, limping now. ({damage} damage)",
      "The {enemy}'s knee buckles as your {weapon} connects low and hard. ({damage} damage)",
      "Your {weapon} rings off the {enemy}'s skull — it shakes its head, dazed. ({damage} damage)",
    ],
    devastating: [
      "Your {weapon} connects with the full weight of your body behind it — something in the {enemy} breaks. ({damage} damage)",
      "A crushing overhead blow from your {weapon} drives the {enemy} to its knees. ({damage} damage)",
      "The {enemy}'s arm hangs wrong after your {weapon} connects — you've broken something. ({damage} damage)",
      "Your {weapon} caves in the {enemy}'s guard and strikes its skull with a sound like a dropped melon. ({damage} damage)",
      "A devastating sweep from your {weapon} takes the {enemy}'s legs out from under it. ({damage} damage)",
      "The {enemy} barely registers the second blow before collapsing under the weight of your {weapon}. ({damage} damage)",
    ],
  },
  ranged: {
    glancing: [
      "Your shot grazes the {enemy}'s arm — the bolt skips off and clatters away. ({damage} damage)",
      "An arrow clips the {enemy}'s shoulder and spins away. ({damage} damage)",
      "Your shot catches the {enemy} at an angle, opening a shallow furrow. ({damage} damage)",
      "The {enemy} twitches as your bolt skims past, drawing a thin line of blood. ({damage} damage)",
      "A near miss becomes a light hit — your shaft scores the {enemy}'s flank. ({damage} damage)",
      "Your bolt clips the {enemy}'s ear, drawing a yelp and a trickle of blood. ({damage} damage)",
      "A grazing shot from your {weapon} leaves the {enemy} bleeding but mobile. ({damage} damage)",
      "Your arrow catches the edge of the {enemy}'s forearm — a flesh wound. ({damage} damage)",
    ],
    solid: [
      "Your arrow punches into the {enemy}'s shoulder and sticks there, quivering. ({damage} damage)",
      "A bolt from your {weapon} drives into the {enemy}'s thigh — it slows immediately. ({damage} damage)",
      "Your shot takes the {enemy} in the chest, driving it back a step. ({damage} damage)",
      "The {enemy} staggers as your bolt buries itself in its upper arm. ({damage} damage)",
      "A solid hit — your arrow pins through the {enemy}'s side. ({damage} damage)",
      "Your bolt catches the {enemy} high in the chest. It clutches at the shaft. ({damage} damage)",
      "A well-aimed shot drives your arrow deep into the {enemy}'s torso. ({damage} damage)",
      "Your bolt takes the {enemy} in the knee — it goes down briefly before rising. ({damage} damage)",
    ],
    devastating: [
      "Your bolt punches completely through the {enemy}'s shoulder in a spray of blood. ({damage} damage)",
      "A perfectly placed shot drives your arrow into the {enemy}'s chest to the fletching. ({damage} damage)",
      "The {enemy} spins as your bolt takes it in the throat — dark blood runs freely. ({damage} damage)",
      "Your shot finds the {enemy}'s eye socket — it screams. ({damage} damage)",
      "A devastating shot drives your arrow through the {enemy}'s ribs into something vital. ({damage} damage)",
      "The {enemy} collapses as your bolt pins its leg to the ground. ({damage} damage)",
    ],
  },
};

// ── ENEMY HIT DESCRIPTIONS ──────────────────────────────────
// {enemy} {damage} placeholders

export const ENEMY_HIT_DESCRIPTIONS: Record<WoundTier, string[]> = {
  glancing: [
    "The {enemy} catches you with a glancing blow across the arm. ({damage} damage)",
    "A wild swing from the {enemy} clips your shoulder. ({damage} damage)",
    "The {enemy}'s attack grazes your side — more sting than wound. ({damage} damage)",
    "You partially pull away but the {enemy} still clips you across the ribs. ({damage} damage)",
    "The {enemy} scores a shallow cut along your forearm. ({damage} damage)",
    "A glancing strike from the {enemy} rattles your teeth. ({damage} damage)",
    "The {enemy} clips your hip in passing — bruising, nothing more. ({damage} damage)",
    "You almost evade entirely, but the {enemy}'s blow catches your shoulder. ({damage} damage)",
  ],
  solid: [
    "The {enemy} drives a solid blow into your side. You feel ribs flex. ({damage} damage)",
    "A hard strike from the {enemy} staggers you backward. ({damage} damage)",
    "The {enemy} connects with your shoulder — your arm goes briefly numb. ({damage} damage)",
    "The {enemy} hammers you across the chest — you stagger. ({damage} damage)",
    "A well-timed blow from the {enemy} catches you across the jaw. ({damage} damage)",
    "The {enemy} drives into you hard — a serious wound that bleeds freely. ({damage} damage)",
    "The {enemy} lands a punishing hit to your midsection, doubling you over briefly. ({damage} damage)",
    "A vicious strike from the {enemy} opens a deep gash along your side. ({damage} damage)",
  ],
  devastating: [
    "The {enemy} tears into you savagely — a wound that will leave a scar. ({damage} damage)",
    "A devastating blow from the {enemy} drives you to one knee. ({damage} damage)",
    "The {enemy} connects with crushing force — your vision whites out momentarily. ({damage} damage)",
    "The {enemy} opens you up badly — blood flows freely and your movements slow. ({damage} damage)",
    "A brutal strike from the {enemy} nearly takes you off your feet. ({damage} damage)",
    "The {enemy} hammers through your guard with terrifying force. ({damage} damage)",
  ],
};

// ── ARMOR ABSORB DESCRIPTIONS ───────────────────────────────
// UO model: armor absorbs damage, never causes a miss
// {enemy} {armor} placeholders

export const ARMOR_ABSORB_DESCRIPTIONS: Record<string, string[]> = {
  buckler: [
    "Your buckler takes the brunt of the {enemy}'s blow — your arm aches from the impact but the wound is nothing.",
    "The {enemy}'s weapon hammers into your buckler, the force traveling up your arm. The steel holds.",
    "Your buckler absorbs the {enemy}'s strike — you feel every ounce of it, but the metal takes the damage.",
    "The {enemy} drives into your buckler with full force. Your buckler wins.",
    "Your buckler soaks the {enemy}'s blow. Your arm is bruised. Your flesh is not.",
    "The {enemy}'s weapon buries itself in your buckler momentarily before you shove it away.",
  ],
  leather_armor: [
    "The {enemy}'s blow lands squarely on your leather armor — the boiled hide distributes the force across your torso.",
    "Your leather armor takes the {enemy}'s strike and gives a little, absorbing most of the damage into the hide.",
    "The {enemy} hits hard but your leather armor was made for this — it creaks and flexes, protecting the flesh beneath.",
    "Your leather pauldron catches the worst of the {enemy}'s blow, the thick hide compressing under the impact.",
    "The {enemy}'s attack lands on your leather armor — you feel it as pressure, not pain.",
    "Your leather armor absorbs the strike, the layers of treated hide doing their job.",
  ],
  chain_mail: [
    "The {enemy}'s weapon grinds across your chain mail — iron rings take the damage that your flesh does not.",
    "Your chain mail absorbs the {enemy}'s blow completely, the interlocked rings spreading force across your torso.",
    "The {enemy} strikes hard but your chain mail was designed for harder — the rings hold.",
    "Iron rings flex and compress under the {enemy}'s strike, absorbing the impact before it reaches skin.",
    "Your chain mail takes a direct hit from the {enemy} — you feel the weight of it but the links do not give.",
    "The {enemy}'s blow is largely eaten by your chain mail. You'll have a bruise. Nothing more.",
  ],
  default: [
    "Your armor absorbs the force of the {enemy}'s blow — you feel the impact but not the full wound.",
    "The {enemy} connects solidly but your protection takes most of what the attack had.",
    "Your equipment absorbs the {enemy}'s strike, the damage spent against steel and leather rather than flesh.",
    "The {enemy} hits you squarely but your armor was made for this — it holds.",
    "A solid blow from the {enemy} lands on your armor and loses most of its force.",
    "Your protection does its job — the {enemy}'s attack lands but does not wound deeply.",
  ],
};

export const ARMOR_FULL_ABSORB_DESCRIPTIONS: Record<string, string[]> = {
  buckler: [
    "The {enemy}'s full blow lands on your buckler — absorbed completely. Not a scratch reaches you.",
    "Your buckler takes everything the {enemy} had. Zero damage gets through.",
    "The {enemy} strikes your buckler with full force. Your buckler wins completely.",
  ],
  leather_armor: [
    "The {enemy}'s attack is swallowed entirely by your leather armor. The hide took it all.",
    "Full impact absorbed by your leather armor — the blow spent itself against treated hide.",
    "Your leather armor absorbs the {enemy}'s strike completely. Nothing reaches flesh.",
  ],
  chain_mail: [
    "Your chain mail absorbs the {enemy}'s blow entirely — every ring held, nothing got through.",
    "The {enemy} strikes your chain mail with full force. The rings eat it completely.",
    "Full absorption — your chain mail takes everything the {enemy} delivered.",
  ],
  default: [
    "Your armor absorbs the {enemy}'s attack completely — zero damage reaches you.",
    "The {enemy}'s blow is fully absorbed by your protection. Not a scratch.",
    "Complete absorption — your armor takes everything the {enemy} had.",
  ],
};

export const PLAYER_MISS_DESCRIPTIONS: string[] = [
  "Your {weapon} cuts only air as the {enemy} sidesteps.",
  "The {enemy} ducks and your {weapon} passes over its head.",
  "You overextend and stumble — your blow goes wide.",
  "Your attack telegraphs and the {enemy} isn't there when it arrives.",
  "A feint from the {enemy} pulls your guard and your swing misses clean.",
  "Your {weapon} glances off the {enemy}'s movement, connecting with nothing.",
  "The {enemy} twists aside with surprising agility — your blow finds only air.",
  "You lunge but the {enemy} steps inside your reach — too close for the blow to land.",
  "Your footing shifts on uneven ground and your strike goes wide.",
  "The {enemy} reads your swing and rolls away from it.",
  "A clumsy overswing pulls you off-balance — the {enemy} uses the opening.",
  "Your {weapon} whistles through empty air as the {enemy} retreats a step.",
];

export const ENEMY_MISS_DESCRIPTIONS: string[] = [
  "The {enemy} swings wide and you step away from the blow.",
  "You duck under the {enemy}'s attack — it passes close enough to ruffle your hair.",
  "The {enemy}'s strike goes high and you slip under it.",
  "You step back just enough — the {enemy}'s blow misses by inches.",
  "The {enemy} overcommits and you sidestep neatly.",
  "A wild swing from the {enemy} leaves it momentarily off-balance.",
  "You redirect the {enemy}'s blow past your ear with your forearm.",
  "The {enemy}'s attack is fast but predictable — you aren't where it expected.",
  "You circle left and the {enemy}'s strike finds nothing.",
  "The {enemy} telegraphs the blow — you've already moved.",
  "A stumble in the {enemy}'s footing throws off its aim.",
  "The {enemy} attacks but you're already backing away from the blow.",
];
