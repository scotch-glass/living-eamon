// Cinematic combat narration pools (imported/re-exported from gameData).

import type { NPCBodyType } from "./npcBodyType";

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
      "Your {weapon} traces a red line across the {enemy}'s forearm. ({damage} damage)",
      "A whipping backslash opens a shallow wound along the {enemy}'s ribs. ({damage} damage)",
      "You drag your {weapon} across the {enemy}'s shoulder — not deep, but stinging. ({damage} damage)",
      "The {enemy} flinches as your {weapon} opens a thin cut across its cheek. ({damage} damage)",
      "A flicking wrist cut from your {weapon} splits the {enemy}'s knuckles. ({damage} damage)",
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
      "Your {weapon} carves into the {enemy}'s thigh — it stumbles on the wounded leg. ({damage} damage)",
      "A diagonal cut from your {weapon} opens the {enemy}'s shoulder to the bone. ({damage} damage)",
      "The {enemy} clutches at the wound your {weapon} opened in its gut. ({damage} damage)",
      "Your {weapon} finds the gap between neck and shoulder — a wound that bleeds heavily. ({damage} damage)",
      "A sweeping cut from your {weapon} sends the {enemy} staggering sideways. ({damage} damage)",
    ],
    devastating: [
      "Your {weapon} tears through the {enemy} in a spray of dark blood — a wound that will not close easily. ({damage} damage)",
      "The {enemy} screams as your {weapon} opens it to the bone. ({damage} damage)",
      "A savage stroke from your {weapon} nearly severs the {enemy}'s sword arm. ({damage} damage)",
      "Your {weapon} drives through the {enemy}'s guard and into something vital. ({damage} damage)",
      "The {enemy} collapses to one knee, your {weapon} having opened a wound that gushes freely. ({damage} damage)",
      "A crushing diagonal blow from your {weapon} leaves the {enemy} barely standing. ({damage} damage)",
      "Your {weapon} drives through the {enemy}'s collar and deep into the chest — a mortal wound if not treated. ({damage} damage)",
      "The {enemy} shrieks as your {weapon} opens a gaping wound across its torso. ({damage} damage)",
      "A full-force swing from your {weapon} nearly takes the {enemy}'s head — it drops to its knees. ({damage} damage)",
      "Your {weapon} finds the femoral region — the {enemy} crumples, unable to stand. ({damage} damage)",
      "The {enemy} staggers three steps before its legs fail — your {weapon} has done terrible work. ({damage} damage)",
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
      "A shallow poke from your {weapon} draws a bead of blood from the {enemy}'s arm. ({damage} damage)",
      "Your {weapon} skims the {enemy}'s side — more insult than injury. ({damage} damage)",
      "A darting thrust leaves a shallow nick on the {enemy}'s shoulder. ({damage} damage)",
      "The tip of your {weapon} kisses the {enemy}'s forearm, drawing a thin trickle. ({damage} damage)",
      "Your {weapon} flicks out and opens a small puncture on the {enemy}'s hand. ({damage} damage)",
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
      "Your {weapon} buries itself in the {enemy}'s shoulder and you yank it free — it howls. ({damage} damage)",
      "A low thrust drives your {weapon} into the {enemy}'s thigh, lodging briefly in muscle. ({damage} damage)",
      "You drive your {weapon} under the {enemy}'s guard and into its side — it staggers. ({damage} damage)",
      "Your {weapon} punches into the {enemy}'s bicep — its weapon arm weakens. ({damage} damage)",
      "A rising thrust from your {weapon} catches the {enemy} under the ribs. ({damage} damage)",
    ],
    devastating: [
      "Your {weapon} punches clean through the {enemy}, the point emerging from the other side. ({damage} damage)",
      "A vicious thrust buries your {weapon} to the hilt in the {enemy}'s abdomen. ({damage} damage)",
      "The {enemy} shrieks as your {weapon} drives up under its ribs into something critical. ({damage} damage)",
      "Your {weapon} pierces the {enemy} through and through — dark blood follows the blade out. ({damage} damage)",
      "A perfectly placed thrust punches through the {enemy}'s guard and deep into its chest. ({damage} damage)",
      "The {enemy} staggers and nearly falls, your {weapon} buried deep in its torso. ({damage} damage)",
      "Your {weapon} punches through the {enemy}'s chest wall — you feel the resistance give. ({damage} damage)",
      "A full-extension thrust drives your {weapon} through the {enemy}'s shoulder joint, shattering it. ({damage} damage)",
      "Your {weapon} enters the {enemy}'s gut and exits the other side — a wound it cannot fight through. ({damage} damage)",
      "The {enemy} freezes as your {weapon} finds something vital deep in its torso. ({damage} damage)",
      "Your {weapon} drives upward through the {enemy}'s jaw — it drops without a sound. ({damage} damage)",
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
      "Your {weapon} grazes the {enemy}'s elbow — painful, but not disabling. ({damage} damage)",
      "A half-swing from your {weapon} clips the {enemy}'s temple. It blinks, dazed. ({damage} damage)",
      "You catch the {enemy} with a glancing blow to the collarbone — it winces. ({damage} damage)",
      "Your {weapon} clips the {enemy}'s weapon hand — fingers go briefly numb. ({damage} damage)",
      "A short snap of your {weapon} finds the {enemy}'s kneecap — it limps for a moment. ({damage} damage)",
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
      "Your {weapon} drives into the {enemy}'s sternum — it wheezes, trying to breathe. ({damage} damage)",
      "A powerful blow from your {weapon} connects with the {enemy}'s temple — it staggers. ({damage} damage)",
      "You swing your {weapon} low and catch the {enemy} across the shin — bone cracks. ({damage} damage)",
      "Your {weapon} hammers into the {enemy}'s weapon arm — it nearly drops its weapon. ({damage} damage)",
      "The {enemy} walks into your {weapon}'s arc — the impact snaps its head back. ({damage} damage)",
    ],
    devastating: [
      "Your {weapon} connects with the full weight of your body behind it — something in the {enemy} breaks. ({damage} damage)",
      "A crushing overhead blow from your {weapon} drives the {enemy} to its knees. ({damage} damage)",
      "The {enemy}'s arm hangs wrong after your {weapon} connects — you've broken something. ({damage} damage)",
      "Your {weapon} caves in the {enemy}'s guard and strikes its skull with a sound like a dropped melon. ({damage} damage)",
      "A devastating sweep from your {weapon} takes the {enemy}'s legs out from under it. ({damage} damage)",
      "The {enemy} barely registers the second blow before collapsing under the weight of your {weapon}. ({damage} damage)",
      "Your {weapon} strikes the {enemy}'s skull with a sound like a cracking log — it goes to its knees. ({damage} damage)",
      "A full overhead swing drives your {weapon} into the {enemy}'s shoulder — the joint gives way entirely. ({damage} damage)",
      "Your {weapon} connects with the {enemy}'s ribs — several of them give at once. ({damage} damage)",
      "The {enemy}'s legs fold as your {weapon} hammers the back of its knee. ({damage} damage)",
      "A sweeping blow from your {weapon} takes the {enemy} across the jaw — teeth scatter. ({damage} damage)",
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
      "Your shot clips the {enemy}'s ear — it screams and clutches at the side of its head. ({damage} damage)",
      "An arrow grazes the {enemy}'s neck, drawing a thin red line. ({damage} damage)",
      "Your bolt skims across the {enemy}'s shoulder, leaving a shallow burn. ({damage} damage)",
      "A near-miss catches the {enemy}'s forearm — the bolt scores a shallow trench. ({damage} damage)",
      "Your shot clips the {enemy}'s chin, snapping its head to one side. ({damage} damage)",
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
      "Your arrow punches into the {enemy}'s calf — it slows immediately, limping. ({damage} damage)",
      "A bolt from your {weapon} lodges in the {enemy}'s shoulder blade. ({damage} damage)",
      "Your shot takes the {enemy} in the hand — it drops whatever it was holding. ({damage} damage)",
      "The {enemy} looks down at the shaft protruding from its side with something like surprise. ({damage} damage)",
      "Your bolt buries itself in the {enemy}'s hip. It lists to one side. ({damage} damage)",
    ],
    devastating: [
      "Your bolt punches completely through the {enemy}'s shoulder in a spray of blood. ({damage} damage)",
      "A perfectly placed shot drives your arrow into the {enemy}'s chest to the fletching. ({damage} damage)",
      "The {enemy} spins as your bolt takes it in the throat — dark blood runs freely. ({damage} damage)",
      "Your shot finds the {enemy}'s eye socket — it screams. ({damage} damage)",
      "A devastating shot drives your arrow through the {enemy}'s ribs into something vital. ({damage} damage)",
      "The {enemy} collapses as your bolt pins its leg to the ground. ({damage} damage)",
      "Your bolt takes the {enemy} in the chest with a wet crack — it crumples immediately. ({damage} damage)",
      "A perfect shot drives your arrow through the {enemy}'s jaw and out the other side. ({damage} damage)",
      "Your bolt punches through the {enemy}'s shoulder in a spray of red mist. ({damage} damage)",
      "The {enemy} clutches at the arrow buried deep in its gut, unable to process what happened. ({damage} damage)",
      "Your shot pins the {enemy}'s weapon arm to its side — it cannot raise its weapon. ({damage} damage)",
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
    "The {enemy} clips you with a wild swing — more of a push than a hit. ({damage} damage)",
    "You catch a grazing blow from the {enemy} across the back of your hand. ({damage} damage)",
    "The {enemy} catches your ribs with a glancing strike — it stings but doesn't slow you. ({damage} damage)",
    "A poorly aimed blow from the {enemy} skims your forearm. ({damage} damage)",
    "The {enemy} catches you with the edge of its attack — barely, but enough to draw blood. ({damage} damage)",
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
    "The {enemy} drives a solid strike into your kidney — you gasp and nearly double over. ({damage} damage)",
    "A heavy blow from the {enemy} connects with your temple — your vision blurs briefly. ({damage} damage)",
    "The {enemy} catches you across the thigh — the leg buckles momentarily. ({damage} damage)",
    "A powerful hit from the {enemy} opens a cut above your eye — blood runs freely. ({damage} damage)",
    "The {enemy} drives into your shoulder with full force — your arm goes numb. ({damage} damage)",
  ],
  devastating: [
    "The {enemy} tears into you savagely — a wound that will leave a scar. ({damage} damage)",
    "A devastating blow from the {enemy} drives you to one knee. ({damage} damage)",
    "The {enemy} connects with crushing force — your vision whites out momentarily. ({damage} damage)",
    "The {enemy} opens you up badly — blood flows freely and your movements slow. ({damage} damage)",
    "A brutal strike from the {enemy} nearly takes you off your feet. ({damage} damage)",
    "The {enemy} hammers through your guard with terrifying force. ({damage} damage)",
    "The {enemy} drives you into the wall with a single crushing blow. ({damage} damage)",
    "A devastating strike from the {enemy} opens a deep wound across your chest. ({damage} damage)",
    "The {enemy} hammers you so hard your knees buckle — you taste blood. ({damage} damage)",
    "A savage blow from the {enemy} sends you spinning — you barely keep your footing. ({damage} damage)",
    "The {enemy} hits you with everything it has — you stagger and nearly fall. ({damage} damage)",
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
  "Your {weapon} cuts only smoke — the {enemy} was never where you aimed.",
  "A poorly timed swing from your {weapon} finds nothing but air.",
  "The {enemy} leans back just enough — your {weapon} passes a finger's width from its face.",
  "You swing hard but your footing betrays you — the blow goes wide.",
  "Your {weapon} meets only the space the {enemy} occupied a moment ago.",
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
  "The {enemy}'s attack passes harmlessly over your head as you duck.",
  "You roll away from the {enemy}'s blow — it strikes nothing but empty air.",
  "The {enemy} commits too hard and stumbles past you.",
  "A wild haymaker from the {enemy} misses by a full foot.",
  "The {enemy}'s attack goes wide — it nearly loses its balance.",
];

// ── CREATURE BODY TYPE (pools keyed by NPC.bodyType; default humanoid) ──

export const BEAST_HIT_PLAYER_DESCRIPTIONS: Record<WoundTier, string[]> = {
  glancing: [
    "The {enemy} rakes a claw across your forearm — shallow but stinging. ({damage} damage)",
    "A snapping bite from the {enemy} catches your sleeve and grazes skin. ({damage} damage)",
    "The {enemy} clips you with a glancing paw strike. ({damage} damage)",
    "A swiping claw from the {enemy} opens a thin red line across your wrist. ({damage} damage)",
    "The {enemy} lunges and its fang catches your shoulder — a graze, nothing more. ({damage} damage)",
    "A raking claw from the {enemy} tears a shallow wound across your thigh. ({damage} damage)",
    "The {enemy} clips you with its paw as it rushes past. ({damage} damage)",
    "A glancing bite from the {enemy} draws blood from your forearm. ({damage} damage)",
  ],
  solid: [
    "The {enemy} rakes a claw deep across your chest — four parallel wounds bleed freely. ({damage} damage)",
    "A snapping bite from the {enemy} closes on your arm — you feel the bones flex. ({damage} damage)",
    "The {enemy} lunges and its weight drives you backward, claws raking. ({damage} damage)",
    "A savage claw swipe from the {enemy} opens your shoulder. ({damage} damage)",
    "The {enemy}'s fangs sink into your leg — you wrench free but the wound is deep. ({damage} damage)",
    "A raking strike from the {enemy} tears through your clothing and into flesh. ({damage} damage)",
    "The {enemy} barrels into you, claws finding purchase on your side. ({damage} damage)",
    "A powerful paw strike from the {enemy} knocks you sideways and leaves claw marks. ({damage} damage)",
  ],
  devastating: [
    "The {enemy} bears you to the ground, claws raking — you tear free but you're badly hurt. ({damage} damage)",
    "A massive bite from the {enemy} closes on your shoulder — you can feel teeth against bone. ({damage} damage)",
    "The {enemy} rakes across your face and chest with terrifying force. ({damage} damage)",
    "Claws and weight combine as the {enemy} drives you down — you barely get back up. ({damage} damage)",
    "The {enemy}'s jaws close on your weapon arm — you wrench free, leaving skin behind. ({damage} damage)",
    "A full-weight tackle from the {enemy} drives you into the ground, claws working. ({damage} damage)",
  ],
};

export const BEAST_MISS_PLAYER_DESCRIPTIONS: string[] = [
  "The {enemy} lunges but you sidestep — it sails past, snapping air.",
  "A claw swipe from the {enemy} fans your cheek but finds nothing.",
  "The {enemy} snaps at your leg — you pull it back just in time.",
  "You vault over the {enemy}'s charge — it crashes past.",
  "The {enemy}'s bite closes on empty air as you twist away.",
  "A raking paw from the {enemy} misses by inches.",
  "The {enemy} rushes you but you step aside — it stumbles.",
  "Claws rake the air where you were standing a moment ago.",
];

export const PLAYER_HIT_BEAST_DESCRIPTIONS: Record<WoundTier, string[]> = {
  glancing: [
    "Your {weapon} grazes the {enemy}'s flank — fur parts, a thin line of blood. ({damage} damage)",
    "A glancing blow from your {weapon} clips the {enemy}'s haunch. ({damage} damage)",
    "Your {weapon} catches the {enemy}'s shoulder as it twists away. ({damage} damage)",
    "A quick strike opens a shallow wound on the {enemy}'s muzzle. ({damage} damage)",
    "Your {weapon} nicks the {enemy}'s ear — it shakes its head in pain. ({damage} damage)",
  ],
  solid: [
    "Your {weapon} bites deep into the {enemy}'s haunch — it yelps and stumbles. ({damage} damage)",
    "A solid blow from your {weapon} connects with the {enemy}'s skull — it staggers. ({damage} damage)",
    "Your {weapon} drives into the {enemy}'s shoulder — the leg buckles under it. ({damage} damage)",
    "A well-placed strike opens a deep wound along the {enemy}'s ribcage. ({damage} damage)",
    "Your {weapon} connects with the {enemy}'s spine — it shudders with the impact. ({damage} damage)",
  ],
  devastating: [
    "Your {weapon} drives deep into the {enemy}'s flank — it collapses briefly before rising. ({damage} damage)",
    "A savage blow from your {weapon} connects with the {enemy}'s skull — it drops. ({damage} damage)",
    "Your {weapon} finds the {enemy}'s neck — a terrible wound that spurts dark blood. ({damage} damage)",
    "You drive your {weapon} into the {enemy}'s chest with full force — ribs crack. ({damage} damage)",
    "A devastating strike from your {weapon} breaks the {enemy}'s foreleg entirely. ({damage} damage)",
  ],
};

export const AMORPHOUS_HIT_PLAYER_DESCRIPTIONS: Record<WoundTier, string[]> = {
  glancing: [
    "A pseudopod of the {enemy} brushes your arm — the acid burns a shallow welt. ({damage} damage)",
    "The {enemy} surges and a tendril of its mass catches your leg — it stings. ({damage} damage)",
    "A ripple of the {enemy} splashes across your boot — the leather smokes slightly. ({damage} damage)",
    "The {enemy} flows against your foot, its acid surface blistering the skin. ({damage} damage)",
    "A tendril of the {enemy} whips across your wrist — the contact burns. ({damage} damage)",
  ],
  solid: [
    "The {enemy} engulfs your arm momentarily — the acid burns deep before you tear free. ({damage} damage)",
    "A surge of the {enemy}'s mass flows over your leg — your skin blisters badly. ({damage} damage)",
    "The {enemy} launches itself at your chest — the acid contact is agonizing. ({damage} damage)",
    "A wave of the {enemy} washes over your weapon hand — the burning is immediate and severe. ({damage} damage)",
    "The {enemy} flows up your leg with terrifying speed, the acid eating through cloth and skin. ({damage} damage)",
  ],
  devastating: [
    "The {enemy} engulfs your torso — the acid is overwhelming before you tear yourself free. ({damage} damage)",
    "You are briefly submerged in the {enemy}'s mass — the burns across your body are severe. ({damage} damage)",
    "The {enemy} surges over you completely — you drag yourself free, skin raw and blistered. ({damage} damage)",
    "A full surge from the {enemy} engulfs your upper body — the acid damage is catastrophic. ({damage} damage)",
    "The {enemy} flows around you and begins dissolving — you rip free barely in time. ({damage} damage)",
  ],
};

export const AMORPHOUS_MISS_PLAYER_DESCRIPTIONS: string[] = [
  "The {enemy} surges toward you but you leap back — the acid mass crashes where you stood.",
  "A pseudopod from the {enemy} whips at your face — you duck under it.",
  "The {enemy} lunges and you sidestep — it flows past you across the floor.",
  "You scramble backward as the {enemy} surges — its mass falls short.",
  "A tendril of the {enemy} reaches for you but you're already moving.",
];

export const PLAYER_HIT_AMORPHOUS_DESCRIPTIONS: Record<WoundTier, string[]> = {
  glancing: [
    "Your {weapon} passes through the {enemy}'s mass — it ripples but reforms. ({damage} damage)",
    "A glancing blow from your {weapon} splashes a chunk of the {enemy} away — it slowly rejoins. ({damage} damage)",
    "Your {weapon} cuts a divot in the {enemy}'s surface — it fills back in, but slower. ({damage} damage)",
    "Your strike disturbs the {enemy}'s mass — it recoils slightly. ({damage} damage)",
    "Your {weapon} separates a small tendril — it dissolves before rejoining. ({damage} damage)",
  ],
  solid: [
    "Your {weapon} drives deep into the {enemy}'s mass, scattering a significant portion. ({damage} damage)",
    "A solid strike from your {weapon} disrupts the {enemy}'s cohesion — it struggles to reform. ({damage} damage)",
    "Your {weapon} tears through the {enemy}'s center — it contracts in what might be pain. ({damage} damage)",
    "A powerful blow splits the {enemy} — both halves twitch before sluggishly rejoining. ({damage} damage)",
    "Your {weapon} drives through the {enemy}'s core — the mass ripples with the impact. ({damage} damage)",
  ],
  devastating: [
    "Your {weapon} tears the {enemy} into three separate masses — they struggle to reunite. ({damage} damage)",
    "A devastating blow drives your {weapon} through the {enemy}'s core — it convulses violently. ({damage} damage)",
    "You drive your {weapon} through the {enemy} with full force — the mass collapses inward. ({damage} damage)",
    "Your {weapon} tears half the {enemy}'s mass free — the separated portion writhes uselessly. ({damage} damage)",
    "A crushing blow from your {weapon} compresses the {enemy} to a fraction of its size — it quivers. ({damage} damage)",
  ],
};

export const UNDEAD_HIT_PLAYER_DESCRIPTIONS: Record<WoundTier, string[]> = {
  glancing: [
    "A skeletal hand rakes across your arm — the bone fingers leave shallow furrows. ({damage} damage)",
    "The {enemy} catches you with a rotting fist — you feel it even through the revulsion. ({damage} damage)",
    "A glancing blow from the {enemy}'s bony arm clips your shoulder. ({damage} damage)",
    "The {enemy} lurches into you — more collision than attack, but it still hurts. ({damage} damage)",
    "A raking claw from the {enemy} opens a shallow wound — the cold of it lingers. ({damage} damage)",
  ],
  solid: [
    "The {enemy} drives a bony fist into your ribs — the cold impact is unlike anything living. ({damage} damage)",
    "A rotting hand closes on your arm — the grip is surprisingly powerful. ({damage} damage)",
    "The {enemy} slams into you with the weight of the grave — you stagger. ({damage} damage)",
    "A heavy blow from the {enemy}'s skeletal arm connects with your jaw. ({damage} damage)",
    "The {enemy} tears at your shoulder with dead fingers — the wound is ragged and cold. ({damage} damage)",
  ],
  devastating: [
    "The {enemy} seizes you with both hands — the cold spreads from where it grips. ({damage} damage)",
    "A terrible blow from the {enemy} connects — you feel something wrong beyond the pain. ({damage} damage)",
    "The {enemy} tears at you with the mindless fury of the undead — the damage is severe. ({damage} damage)",
    "The {enemy} drives you down with its full undead weight — you barely drag yourself free. ({damage} damage)",
    "A devastating strike from the {enemy} leaves you shaking — not just from the pain. ({damage} damage)",
  ],
};

export const UNDEAD_MISS_PLAYER_DESCRIPTIONS: string[] = [
  "The {enemy} reaches for you with dead hands — you step back and they close on air.",
  "A shambling lunge from the {enemy} misses as you sidestep.",
  "The {enemy}'s attack is telegraphed by its jerky movements — you avoid it easily.",
  "You duck the {enemy}'s swing — bony fingers click shut above your head.",
  "The {enemy} lurches forward but you're no longer there.",
];

export const PLAYER_HIT_UNDEAD_DESCRIPTIONS: Record<WoundTier, string[]> = {
  glancing: [
    "Your {weapon} clips a rib — bone chips fly but the {enemy} keeps moving. ({damage} damage)",
    "A glancing blow from your {weapon} sends a piece of the {enemy} clattering away. ({damage} damage)",
    "Your {weapon} scores across the {enemy}'s skull — a divot, nothing more. ({damage} damage)",
    "You catch the {enemy} with the edge of your {weapon} — bone splinters. ({damage} damage)",
    "Your {weapon} grazes the {enemy}'s spine — it staggers but recovers. ({damage} damage)",
  ],
  solid: [
    "Your {weapon} drives through the {enemy}'s ribcage — bone shatters around the impact. ({damage} damage)",
    "A solid blow from your {weapon} takes the {enemy}'s arm at the elbow — it falls but still advances. ({damage} damage)",
    "Your {weapon} connects with the {enemy}'s skull — it cracks down the center. ({damage} damage)",
    "A powerful strike from your {weapon} caves in the {enemy}'s chest cavity. ({damage} damage)",
    "Your {weapon} drives through the {enemy}'s hip — it lists badly to one side. ({damage} damage)",
  ],
  devastating: [
    "Your {weapon} shatters the {enemy}'s spine — it collapses but its hands keep moving. ({damage} damage)",
    "A devastating blow takes the {enemy}'s head — it bounces away, but the body still reaches for you. ({damage} damage)",
    "Your {weapon} drives through the {enemy}'s sternum and out the other side — it staggers. ({damage} damage)",
    "You destroy half the {enemy}'s ribcage with a single blow — it crumples to its knees. ({damage} damage)",
    "Your {weapon} strikes the {enemy} with full force — bones explode outward from the impact. ({damage} damage)",
  ],
};

export function getEnemyHitPlayerPool(
  bodyType: NPCBodyType | undefined,
  tier: WoundTier
): string[] {
  switch (bodyType) {
    case "beast":
      return BEAST_HIT_PLAYER_DESCRIPTIONS[tier];
    case "amorphous":
      return AMORPHOUS_HIT_PLAYER_DESCRIPTIONS[tier];
    case "undead":
      return UNDEAD_HIT_PLAYER_DESCRIPTIONS[tier];
    default:
      return ENEMY_HIT_DESCRIPTIONS[tier];
  }
}

export function getEnemyMissPlayerPool(
  bodyType: NPCBodyType | undefined
): string[] {
  switch (bodyType) {
    case "beast":
      return BEAST_MISS_PLAYER_DESCRIPTIONS;
    case "amorphous":
      return AMORPHOUS_MISS_PLAYER_DESCRIPTIONS;
    case "undead":
      return UNDEAD_MISS_PLAYER_DESCRIPTIONS;
    default:
      return ENEMY_MISS_DESCRIPTIONS;
  }
}

export function getPlayerHitEnemyPool(
  bodyType: NPCBodyType | undefined,
  category: WeaponCategory,
  tier: WoundTier
): string[] {
  switch (bodyType) {
    case "beast":
      return PLAYER_HIT_BEAST_DESCRIPTIONS[tier];
    case "amorphous":
      return PLAYER_HIT_AMORPHOUS_DESCRIPTIONS[tier];
    case "undead":
      return PLAYER_HIT_UNDEAD_DESCRIPTIONS[tier];
    default:
      return PLAYER_HIT_DESCRIPTIONS[category][tier];
  }
}
