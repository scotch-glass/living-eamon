// ============================================================
// LIVING EAMON — Zone-Specific Combat Narration
// Extends combatNarrationPools.ts with body-zone body-zone awareness.
// Template vars: {attacker}, {defender}, {weapon}, {damage}, {zone}
// ============================================================

import type { BodyZone, StatusEffectType, StrikeResolution, InterruptReason, Gender } from "./types";
import { pronounsFor } from "./types";
import type { WeaponCategory, WoundTier } from "./narrationPools";

// ── Helpers ─────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key as string] ?? key);
}

// ── Zone Damage Tier ────────────────────────────────────────
// Converts raw damage into wound tier relative to defender max HP.

export function getZoneWoundTier(damage: number, maxHp: number): WoundTier {
  const pct = damage / Math.max(1, maxHp);
  if (pct <= 0.12) return "glancing";
  if (pct <= 0.3) return "solid";
  return "devastating";
}

// ── EVASION NARRATION (by zone) ─────────────────────────────

const EVASION_POOLS: Record<BodyZone, string[]> = {
  head: [
    "{defender} ducks and the blow sails over.",
    "{defender} jerks aside — the strike cuts nothing but air where the skull was.",
    "{defender} twists away from the head strike at the last instant.",
  ],
  neck: [
    "{defender} pulls back and the blade hisses past the throat.",
    "{defender} drops a shoulder — the neck strike finds nothing.",
    "The strike aimed at the throat goes wide as {defender} sways aside.",
  ],
  torso: [
    "{defender} sidesteps the body blow.",
    "{defender} pivots — the torso strike catches only cloth.",
    "A quick half-step and {defender} avoids the torso strike entirely.",
  ],
  limbs: [
    "{defender} pulls the arm back in time.",
    "{defender} hops aside — the limb strike whiffs.",
    "The strike aimed at the limbs finds empty space where {defender} was standing.",
  ],
};

// ── SHIELD BLOCK NARRATION (by zone) ────────────────────────

const SHIELD_BLOCK_POOLS: Record<BodyZone, string[]> = {
  head: [
    "{defender}'s shield snaps up — the head strike clangs off the boss.",
    "The shield catches the blow aimed at {defender}'s skull.",
  ],
  neck: [
    "{defender} gets the shield edge up and catches the throat strike.",
    "The shield deflects the strike aimed at the neck.",
  ],
  torso: [
    "{defender} brings the shield across and absorbs the body blow.",
    "The torso strike hammers into {defender}'s shield.",
  ],
  limbs: [
    "{defender} drops the shield low and blocks the limb strike.",
    "The strike at the limbs rings off {defender}'s shield.",
  ],
};

const SHIELD_BROKEN_POOLS: Record<BodyZone, string[]> = {
  head: ["{defender}'s shield catches the head blow — and splinters apart!"],
  neck: ["{defender}'s shield stops the throat strike — but cracks to pieces!"],
  torso: ["{defender}'s shield absorbs the body blow — and shatters!"],
  limbs: ["{defender}'s shield blocks the limb strike — and falls apart!"],
};

// ── ARMOR STOP NARRATION (by zone) ──────────────────────────

const ARMOR_STOP_POOLS: Record<BodyZone, string[]> = {
  head: [
    "The strike glances off {defender}'s helm.",
    "{attacker}'s blow rings off the helmet and does no harm.",
    "The headpiece holds — the strike slides off without penetrating.",
  ],
  neck: [
    "The gorget catches the blow at the throat.",
    "{attacker}'s strike scrapes across the neck guard without finding flesh.",
    "The throat armor turns the blade aside.",
  ],
  torso: [
    "{attacker}'s strike skids across {defender}'s chest armor.",
    "The body armor absorbs the blow without yielding.",
    "A solid hit — but the torso plate holds.",
  ],
  limbs: [
    "The greaves catch the strike before it can bite.",
    "{attacker}'s blow bounces off the limb armor.",
    "The limb guard deflects the blow.",
  ],
};

const ARMOR_BROKEN_POOLS: Record<BodyZone, string[]> = {
  head: [
    "The helm absorbs one last blow — and cracks apart. {defender}'s head is exposed.",
    "{attacker}'s strike shatters the headpiece. The fragments fall away.",
  ],
  neck: [
    "The gorget stops the strike — but crumples. The throat is unprotected now.",
    "The neck guard catches the blow and tears free, leaving {defender}'s throat bare.",
  ],
  torso: [
    "The chest armor holds against the strike — barely. The plate buckles and falls away in pieces.",
    "One hit too many. The body armor cracks apart and clatters to the ground.",
  ],
  limbs: [
    "The limb guard catches the blow and splits. {defender}'s limbs are unarmored now.",
    "The greaves shatter under the strike, leaving the limbs exposed.",
  ],
};

// ── HIT NARRATION — PLAYER STRIKES ENEMY (zone × weapon × tier) ──

type ZoneHitPool = Record<BodyZone, Record<WeaponCategory, Record<WoundTier, string[]>>>;

const PLAYER_ZONE_HIT: ZoneHitPool = {
  head: {
    slash: {
      glancing: [
        "Your {weapon} clips the {enemy}'s skull — a shallow cut above the brow. ({damage} damage)",
        "A glancing slash across the {enemy}'s temple. Blood but no real depth. ({damage} damage)",
        "Your {weapon} catches the {enemy}'s ear. A nick, nothing more. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} bites into the {enemy}'s head, splitting scalp to bone. ({damage} damage)",
        "A vicious cut opens the {enemy}'s forehead. Blood sheets into its eyes. ({damage} damage)",
        "Your {weapon} carves a deep line across the {enemy}'s skull. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} cleaves into the {enemy}'s skull with terrible force. ({damage} damage)",
        "The {enemy}'s head opens under your {weapon}. The blow is catastrophic. ({damage} damage)",
        "A skull-splitting blow. Your {weapon} buries itself in the {enemy}'s head. ({damage} damage)",
      ],
    },
    pierce: {
      glancing: [
        "Your {weapon} scores a shallow gash across the {enemy}'s scalp. ({damage} damage)",
        "The point grazes the {enemy}'s temple. A thin line of blood. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} punches through the {enemy}'s cheek. ({damage} damage)",
        "A clean thrust into the {enemy}'s face. The point finds bone. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} drives into the {enemy}'s eye socket. ({damage} damage)",
        "The point sinks deep into the {enemy}'s skull. ({damage} damage)",
      ],
    },
    blunt: {
      glancing: [
        "Your {weapon} clips the {enemy}'s jaw. The head snaps sideways. ({damage} damage)",
        "A glancing blow to the {enemy}'s temple. Enough to rattle, not enough to drop. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} crunches into the {enemy}'s skull. Something gives. ({damage} damage)",
        "A solid blow to the head. The {enemy} staggers, eyes unfocused. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} caves in the side of the {enemy}'s skull. ({damage} damage)",
        "The {enemy}'s head deforms under the impact. The sound is wet and final. ({damage} damage)",
      ],
    },
    ranged: {
      glancing: ["Your shot nicks the {enemy}'s head. ({damage} damage)"],
      solid: ["Your shot punches into the {enemy}'s face. ({damage} damage)"],
      devastating: ["Your shot takes the {enemy} clean through the skull. ({damage} damage)"],
    },
  },
  neck: {
    slash: {
      glancing: [
        "Your {weapon} grazes the {enemy}'s throat. A thin red line appears. ({damage} damage)",
        "A shallow cut across the {enemy}'s neck. Close to something vital. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} bites deep into the {enemy}'s neck. Blood sprays. ({damage} damage)",
        "A vicious slash opens the {enemy}'s throat halfway. ({damage} damage)",
        "Your {weapon} catches the {enemy} across the side of the neck. The wound is ugly. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} hews through the {enemy}'s neck with butcher-shop finality. ({damage} damage)",
        "The {enemy}'s throat opens from ear to ear under your {weapon}. ({damage} damage)",
        "A devastating stroke. The {weapon} finds the neck and bites deep. ({damage} damage)",
      ],
    },
    pierce: {
      glancing: [
        "Your {weapon} pricks the {enemy}'s throat. A warning shot. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} punches into the {enemy}'s neck. Blood wells fast. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} drives clean through the {enemy}'s throat. ({damage} damage)",
      ],
    },
    blunt: {
      glancing: [
        "Your {weapon} clips the {enemy}'s throat. It chokes and stumbles. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} crushes into the {enemy}'s neck. The windpipe compresses. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} shatters the {enemy}'s throat. The sound is like snapping branches. ({damage} damage)",
      ],
    },
    ranged: {
      glancing: ["Your shot grazes the {enemy}'s neck. ({damage} damage)"],
      solid: ["Your shot buries itself in the {enemy}'s throat. ({damage} damage)"],
      devastating: ["Your shot tears through the {enemy}'s neck. ({damage} damage)"],
    },
  },
  torso: {
    slash: {
      glancing: [
        "Your {weapon} opens a shallow cut across the {enemy}'s ribs. ({damage} damage)",
        "A grazing slash across the {enemy}'s chest. More shirt than skin. ({damage} damage)",
        "Your {weapon} scores the {enemy}'s flank. A surface wound. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} bites into the {enemy}'s chest. Ribs crack under the edge. ({damage} damage)",
        "A deep slash opens the {enemy}'s belly. The wound is serious. ({damage} damage)",
        "Your {weapon} carves a long gash across the {enemy}'s torso. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} cleaves into the {enemy}'s chest with terrible force. ({damage} damage)",
        "The {enemy}'s ribcage opens under your {weapon}. ({damage} damage)",
        "Your {weapon} nearly cuts the {enemy} in half at the waist. ({damage} damage)",
      ],
    },
    pierce: {
      glancing: [
        "Your {weapon} pokes through the {enemy}'s side. Shallow but bleeding. ({damage} damage)",
        "The point scores the {enemy}'s ribs. A surface wound. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} punches through the {enemy}'s chest. ({damage} damage)",
        "A clean thrust into the {enemy}'s belly. The point finds something soft. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} drives hilt-deep into the {enemy}'s chest. ({damage} damage)",
        "The point finds the {enemy}'s heart. Or close enough. ({damage} damage)",
      ],
    },
    blunt: {
      glancing: [
        "Your {weapon} thumps the {enemy}'s ribs. It grunts but holds. ({damage} damage)",
        "A body blow that lands without full force. The {enemy} winces. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} crunches into the {enemy}'s ribs. Something breaks. ({damage} damage)",
        "A solid blow to the chest. The {enemy} doubles over, wheezing. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} caves in the {enemy}'s chest. The ribcage folds. ({damage} damage)",
        "The {enemy}'s torso crumples under the impact. Internal damage, without question. ({damage} damage)",
      ],
    },
    ranged: {
      glancing: ["Your shot grazes the {enemy}'s side. ({damage} damage)"],
      solid: ["Your shot punches into the {enemy}'s chest. ({damage} damage)"],
      devastating: ["Your shot tears clean through the {enemy}'s torso. ({damage} damage)"],
    },
  },
  limbs: {
    slash: {
      glancing: [
        "Your {weapon} nicks the {enemy}'s arm. A scratch. ({damage} damage)",
        "A shallow cut along the {enemy}'s forearm. Blood but no depth. ({damage} damage)",
        "Your {weapon} grazes the {enemy}'s leg. It stumbles but recovers. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} bites deep into the {enemy}'s arm. The limb goes slack. ({damage} damage)",
        "A solid cut opens the {enemy}'s thigh. Blood runs freely. ({damage} damage)",
        "Your {weapon} chops into the {enemy}'s leg. It buckles. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} hews through the {enemy}'s arm. Bone shows white. ({damage} damage)",
        "The {enemy}'s leg folds under a devastating slash. ({damage} damage)",
        "Your {weapon} nearly severs the {enemy}'s limb. ({damage} damage)",
      ],
    },
    pierce: {
      glancing: [
        "Your {weapon} pricks the {enemy}'s hand. It flinches. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} punches through the {enemy}'s forearm. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} pins the {enemy}'s arm to its own body. ({damage} damage)",
      ],
    },
    blunt: {
      glancing: [
        "Your {weapon} clips the {enemy}'s elbow. It shakes the arm out. ({damage} damage)",
      ],
      solid: [
        "Your {weapon} cracks into the {enemy}'s shin. Something snaps. ({damage} damage)",
      ],
      devastating: [
        "Your {weapon} shatters the {enemy}'s knee. The leg bends the wrong way. ({damage} damage)",
      ],
    },
    ranged: {
      glancing: ["Your shot grazes the {enemy}'s arm. ({damage} damage)"],
      solid: ["Your shot punches through the {enemy}'s leg. ({damage} damage)"],
      devastating: ["Your shot shatters the {enemy}'s limb. ({damage} damage)"],
    },
  },
};

// ── HIT NARRATION — ENEMY STRIKES PLAYER (zone × tier) ─────

type ZoneEnemyHitPool = Record<BodyZone, Record<WoundTier, string[]>>;

const ENEMY_ZONE_HIT: ZoneEnemyHitPool = {
  head: {
    glancing: [
      "The {enemy} clips your skull. Stars bloom behind your eyes. ({damage} damage)",
      "A glancing blow to the head from the {enemy}. Your ears ring. ({damage} damage)",
    ],
    solid: [
      "The {enemy} cracks you across the skull. Blood streams down your face. ({damage} damage)",
      "A solid blow to your head. Your vision blurs. ({damage} damage)",
    ],
    devastating: [
      "The {enemy} drives a devastating blow into your skull. The world goes white. ({damage} damage)",
      "Your head snaps sideways under the {enemy}'s strike. ({damage} damage)",
    ],
  },
  neck: {
    glancing: [
      "The {enemy} catches your throat — a graze, but close. ({damage} damage)",
      "A nick across your neck from the {enemy}. Warm blood trickles down your collar. ({damage} damage)",
    ],
    solid: [
      "The {enemy} strikes your neck. The pain is blinding. ({damage} damage)",
      "A vicious blow to your throat. You choke, gasping. ({damage} damage)",
    ],
    devastating: [
      "The {enemy} hacks into your neck. Blood sprays. ({damage} damage)",
      "A savage blow to your throat from the {enemy}. You can feel your pulse in the wound. ({damage} damage)",
    ],
  },
  torso: {
    glancing: [
      "The {enemy} grazes your ribs. A shallow cut. ({damage} damage)",
      "A glancing blow to your chest. You barely feel it through the adrenaline. ({damage} damage)",
    ],
    solid: [
      "The {enemy} drives into your chest. Ribs protest. ({damage} damage)",
      "A solid body blow from the {enemy}. The breath goes out of you. ({damage} damage)",
    ],
    devastating: [
      "The {enemy} buries its weapon in your chest. The pain is absolute. ({damage} damage)",
      "A devastating blow to your torso. Something inside shifts. ({damage} damage)",
    ],
  },
  limbs: {
    glancing: [
      "The {enemy} nicks your arm. A surface wound. ({damage} damage)",
      "A glancing strike across your leg from the {enemy}. ({damage} damage)",
    ],
    solid: [
      "The {enemy} chops into your arm. The limb goes numb. ({damage} damage)",
      "A solid hit to your leg. You stagger. ({damage} damage)",
    ],
    devastating: [
      "The {enemy} smashes into your arm. Bone grinds. ({damage} damage)",
      "Your leg buckles under the {enemy}'s devastating blow. ({damage} damage)",
    ],
  },
};

// ── INJURY NARRATION ────────────────────────────────────────

// Partial record — spell-driven status effects (haste, shield_aura, etc.)
// don't have injury narration; combat spells produce their own narration
// in combatEngine.resolveCombatSpell.
const INJURY_NARRATION: Partial<Record<StatusEffectType, string[]>> = {
  bleed: [
    "Blood flows freely from the {zone} wound.",
    "The {zone} wound opens — bright blood starts to seep.",
  ],
  poison: [
    "The {zone} wound darkens. Black veins spider out from the cut.",
    "A chill spreads from the {zone}. The blood there runs sluggish and wrong.",
  ],
  concussion: [
    "The blow rattles {defender}'s brain. Eyes glaze. Concussion.",
    "{defender}'s head rocks. The lights are on but nobody's home.",
  ],
  damaged_eye: [
    "Blood fills {defender}'s eye. Vision halves in an instant.",
    "The strike catches {defender}'s eye. A ruined mess.",
  ],
  severed_artery: [
    "An artery opens. Blood jets in rhythmic pulses from {defender}'s {zone}.",
    "Bright arterial blood sprays from {defender}'s {zone}. This is bad.",
  ],
  crushed_windpipe: [
    "{defender}'s throat collapses. Breathing becomes a wet, failing enterprise.",
    "The windpipe buckles. {defender} gasps for air that won't come.",
  ],
  pierced_lung: [
    "The blow punctures a lung. {defender} coughs pink froth.",
    "Air whistles through the torso wound. {defender}'s breathing turns shallow and bubbly.",
  ],
  cracked_ribs: [
    "Ribs crack. {defender} flinches at every breath.",
    "Something snaps in {defender}'s chest. Every movement is a fresh knife of pain.",
  ],
  broken_arm: [
    "{defender}'s arm breaks with an audible snap. The weapon hand falters.",
    "The arm gives way. {defender} can barely grip the weapon now.",
  ],
  broken_leg: [
    "{defender}'s leg buckles and bends wrong. No running from this.",
    "A sickening crack. {defender}'s leg folds beneath the weight.",
  ],
};

// ── CRITICAL HIT PREFIXES ───────────────────────────────────

const CRITICAL_PREFIXES: Record<BodyZone, string[]> = {
  head: [
    "A perfect strike to the skull!",
    "CRITICAL — the head blow lands with terrible precision!",
    "The skull rings like a bell beneath the impact!",
    "A shattering blow to the brow!",
    "The temple gives way — the strike lands clean!",
    "Steel meets bone — the crown of {defender}'s head buckles!",
    "A perfect arc — the blade finds the soft place above the ear!",
    "{defender}'s helm splits — what's beneath fares no better!",
    "The skull cracks under a blow that would fell an ox!",
    "A devastating overhand — {defender}'s head snaps sideways under the weight!",
  ],
  neck: [
    "The throat is wide open!",
    "CRITICAL — the neck strike finds its mark exactly!",
    "The blade slides past guard and finds the throat!",
    "A surgeon's strike — the neck parts where the great vein runs!",
    "{defender}'s collar fails — the cut goes deep into the windpipe!",
    "The throat gapes — {defender} cannot draw breath!",
    "A vicious line — the strike opens {defender}'s neck to the bone!",
    "The blow catches the hollow of the throat — perfect, terrible!",
    "{defender}'s gorget might as well be paper!",
    "Steel parts the great vessels of the neck!",
  ],
  torso: [
    "Dead center!",
    "CRITICAL — the body blow lands with full force!",
    "The blade buries itself between the ribs!",
    "A heart-strike — clean and certain!",
    "The breastbone splits beneath the blow!",
    "{defender}'s armor folds under the impact like wet leather!",
    "The strike drives deep — {defender}'s breath leaves in a single shocked gasp!",
    "A driving thrust — the point goes in and does not stop!",
    "The blow hammers home in the soft place beneath the sternum!",
    "{defender}'s chest concaves — something inside gives way!",
  ],
  limbs: [
    "The limb is fully exposed!",
    "CRITICAL — a clean, devastating hit to the limb!",
    "The blow strikes the joint — bone gives, then tendon!",
    "A maiming cut — {defender}'s limb hangs by sinew alone!",
    "The strike finds the elbow's hinge — the arm folds wrong!",
    "{defender}'s knee buckles backward under the impact!",
    "Steel bites flesh and grates against bone!",
    "A crippling blow — {defender}'s weapon hand fails utterly!",
    "The cut goes deep into muscle — {defender} reels and nearly drops!",
    "{defender}'s shoulder shatters under the weight of the strike!",
  ],
};

// ── CRITICAL FAIL NARRATION ─────────────────────────────────

/** Fumble without weapon drop — just a clumsy miss. */
const CRITICAL_FAIL_STUMBLE: string[] = [
  "{attacker} overcommits — the swing goes wide and leaves them staggering.",
  "{attacker}'s footing fails. A wild, clumsy swing at nothing.",
  "A terrible swing. {attacker} nearly trips over their own feet.",
  "{attacker} misjudges the distance badly — the strike whistles past {defender}'s ear and throws {attacker} off-balance.",
];

/** Fumble WITH weapon drop. */
const CRITICAL_FAIL_DROP: string[] = [
  "FUMBLE! {attacker}'s {weapon} slips from sweaty hands and clatters to the ground!",
  "FUMBLE! The grip fails — {attacker}'s {weapon} spins away across the floor!",
  "FUMBLE! {attacker}'s fingers lose the {weapon}. It hits the ground with a ring of iron. {attacker} is unarmed!",
  "FUMBLE! A miserable swing — {attacker}'s {weapon} flies from their hand and skids across the stone!",
];

// ── NARRATIVE BUILDER ───────────────────────────────────────
// Replaces the simple string in resolveStrike() with rich zone narration.

// ── DUFUS POOLS — humorous narration for the training dummy ─

/** Player misses Dufus. He never moves. He just judges. */
const DUFUS_MISS_POOL: string[] = [
  "Dufus stands perfectly still and you somehow miss him entirely.",
  "Dufus looks at you like you're the dummy.",
  "Your strike whiffs past Dufus. He has not moved. He never moves.",
  "You miss a wooden post that does not move. Aldric coughs somewhere.",
  "Dufus's painted-on face manages to look disappointed.",
  "The blade sails wide. Dufus would shake his head if he had a neck that worked.",
  "You swing. Dufus does not. Dufus wins this round morally.",
  "The strike misses. Dufus's permanent expression of resigned disappointment somehow deepens.",
  "Even Dufus seems embarrassed for you, and Dufus is a sack of straw.",
  "Wide miss. Somewhere, a real enemy is laughing.",
];

/** Player hits Dufus. He takes it. He always takes it. */
const DUFUS_HIT_POOL: string[] = [
  "Dufus takes the hit like a champ.",
  "Dufus just stands there like a dummy. The blow lands square.",
  "You strike Dufus. Dufus accepts this, as he accepts all things.",
  "The blow connects. Straw puffs out. Dufus is unbothered.",
  "Solid hit. Dufus says nothing. Dufus has never said anything.",
  "Your weapon bites into the wood. Dufus has been here longer than you. He will outlast this too.",
  "Clean strike. A small chip of Dufus joins the pile of older Dufus on the ground.",
  "You land a good one. Dufus sways slightly, then settles back into resignation.",
  "The hit lands. Aldric was right — Dufus does not complain.",
  "Strike connects. The DUFUS carved into his forehead remains legible.",
  "Direct hit. Dufus's charcoal frown does not change. It never changes.",
  "Wood thunks. Straw drifts. Dufus endures.",
  "You strike true. The dummy creaks once and goes silent again.",
  "The blow lands. Somewhere, the carpenter who patches Dufus sighs.",
  "Solid contact. Dufus has been hit harder by smaller heroes. He remembers all of them.",
];

// ── Blood splatter narration — zone-specific gore lines ──
// Appended after a successful hit lands. Tier-gated: glancing = nothing,
// solid = short, devastating/crit = vivid.

const BLOOD_SPLATTER: Record<BodyZone, { solid: string[]; devastating: string[] }> = {
  head: {
    solid: [
      "Blood runs from the wound, streaking down {defender}'s face.",
      "A red line opens across {defender}'s brow. Blood wells fast.",
      "The cut weeps crimson down {defender}'s cheek.",
    ],
    devastating: [
      "Blood sprays from {defender}'s skull in a hot arc. Bone shows white beneath.",
      "The blow splits {defender}'s scalp wide. Blood sheets down, blinding one eye.",
      "{defender}'s head snaps sideways and a curtain of blood follows.",
      "A red mist hangs where {defender}'s head was a moment ago.",
    ],
  },
  neck: {
    solid: [
      "A red line opens across {defender}'s throat. Blood beads along it.",
      "The blade draws a wet streak across {defender}'s neck.",
      "Blood seeps from the wound, staining {defender}'s collar dark.",
    ],
    devastating: [
      "Blood erupts from {defender}'s neck in a pressurized gout.",
      "The strike opens {defender}'s throat. Blood pumps in rhythm with a dying heartbeat.",
      "{defender}'s neck parts like meat on a butcher's block. Arterial spray paints the ground.",
      "A hot red sheet pours from {defender}'s opened throat.",
    ],
  },
  torso: {
    solid: [
      "The wound opens and blood darkens {defender}'s clothing.",
      "A wet stain spreads across {defender}'s midsection.",
      "Blood seeps from the gash, soaking into {defender}'s gear.",
    ],
    devastating: [
      "The blow cleaves through muscle. Blood splashes across the stone in a wide fan.",
      "{defender}'s torso opens like a split melon. Something inside glistens.",
      "A gout of hot blood sprays from {defender}'s chest. Ribs show through the ruin.",
      "The wound is terrible. Blood pours freely, pooling at {defender}'s feet.",
    ],
  },
  limbs: {
    solid: [
      "Blood runs down {defender}'s arm, dripping from the fingertips.",
      "The wound weeps. {defender}'s leg darkens with spreading blood.",
      "A red line opens along {defender}'s forearm. Blood wells immediately.",
    ],
    devastating: [
      "The limb splits open to the bone. Blood sprays in a wide arc across the ground.",
      "{defender}'s arm hangs at a wrong angle, blood pouring from the wound like a tap.",
      "The strike nearly severs the limb. Arterial blood jets in rhythmic spurts.",
      "Meat and muscle part. {defender}'s blood splatters across {attacker}'s face and arms.",
    ],
  },
};

/** Crit-specific gore — attacker gets splattered. */
const CRIT_ATTACKER_GORE: Record<BodyZone, string[]> = {
  head:  [
    "Hot blood spatters across {attacker}'s face and chest.",
    "{attacker} tastes copper. {defender}'s blood is everywhere.",
    "A fine red mist hangs in the air between them.",
    "{attacker}'s brow drips — not their own blood.",
    "Flecks of bone and worse cling to {attacker}'s sleeve.",
    "{attacker} blinks blood from their lashes and finds the world gone red.",
    "The hot spray reaches {attacker}'s teeth before they can close their mouth.",
    "{attacker}'s hair is matted with what came out of {defender}'s skull.",
    "A wet warmth soaks down {attacker}'s collar.",
    "{attacker} wears {defender}'s blood like a mask.",
  ],
  neck:  [
    "Arterial spray catches {attacker} full in the face. Vision goes red.",
    "The gout drenches {attacker}'s weapon arm to the elbow.",
    "Hot pulses of blood paint {attacker}'s breastplate in dying rhythm.",
    "{attacker} is washed in a sheet of crimson before they can step back.",
    "The blade comes away red — and so does {attacker}'s hand to the wrist.",
    "{attacker}'s cloak is ruined; the dye will not lift this stain.",
    "A fountain of blood rises — {attacker} stands directly beneath it.",
    "{attacker} feels the heat of {defender}'s pulse against their skin.",
    "Rivulets of blood run down {attacker}'s vambraces and pool at the cuff.",
    "The spray flecks {attacker}'s lips. They taste salt and iron.",
  ],
  torso: [
    "{attacker}'s arms are slick to the shoulder with {defender}'s blood.",
    "The spray catches {attacker} across the chest. Warmth soaks through.",
    "Blood beads on the metal of {attacker}'s pauldron and runs in lines.",
    "{attacker}'s gloves are wet through; the grip slides on the haft.",
    "A long red spatter dapples {attacker}'s belt and breeches.",
    "{attacker}'s tunic is sodden where {defender}'s wound emptied itself.",
    "The blood is hotter than {attacker} expected. It always is.",
    "Wet flecks land on {attacker}'s cheek and slide down toward the jaw.",
    "{attacker}'s sword hand drips — droplets pattering on the stone.",
    "A heavy red stain spreads down {attacker}'s thigh from the spray.",
  ],
  limbs: [
    "Blood flecks spatter across {attacker}'s hands and forearms.",
    "{attacker} is painted red from the spray. It will not wash easily.",
    "{defender}'s blood drips from the edge of {attacker}'s blade in fat beads.",
    "{attacker}'s wrist is bracelet-bright with the wound's spray.",
    "A stripe of red runs from {attacker}'s elbow to the heel of the hand.",
    "{attacker}'s fingers are tacky with cooling blood.",
    "The cut throws blood in a wide low arc — {attacker}'s greaves catch it.",
    "{attacker} feels the patter of blood on their boot leather.",
    "A red film clings to the back of {attacker}'s sword hand.",
    "{attacker}'s knuckles are wet — not their own.",
  ],
};

export function buildZoneStrikeNarrative(
  strike: StrikeResolution,
  attackerName: string,
  defenderName: string,
  weaponName: string,
  weaponCategory: WeaponCategory,
  defenderMaxHp: number,
  isPlayerAttacking: boolean
): string {
  const zone = strike.targetZone;
  const vars: Record<string, string> = {
    attacker: attackerName,
    defender: defenderName,
    weapon: weaponName,
    enemy: isPlayerAttacking ? defenderName : attackerName,
    damage: String(strike.damageDealt),
    zone,
  };

  // ── Dufus override — humorous flat narration regardless of zone/weapon ──
  // Only fires when the player is attacking Dufus (not the other way around,
  // since Dufus never strikes back). Bypasses normal hit/miss prose.
  if (isPlayerAttacking && defenderName === "Dufus") {
    if (strike.evaded || strike.armorStopped || strike.blocked) {
      return pick(DUFUS_MISS_POOL);
    }
    return pick(DUFUS_HIT_POOL);
  }

  // Evasion (possibly with critical fail)
  if (strike.evaded) {
    if (strike.isCriticalFail) {
      const pool = strike.weaponDropped ? CRITICAL_FAIL_DROP : CRITICAL_FAIL_STUMBLE;
      return fill(pick(EVASION_POOLS[zone]), vars) + " " + fill(pick(pool), vars);
    }
    return fill(pick(EVASION_POOLS[zone]), vars);
  }

  // Shield block
  if (strike.blocked) {
    const pool = strike.armorBroken ? SHIELD_BROKEN_POOLS[zone] : SHIELD_BLOCK_POOLS[zone];
    return fill(pick(pool), vars);
  }

  // Armor stop
  if (strike.armorStopped) {
    const pool = strike.armorBroken ? ARMOR_BROKEN_POOLS[zone] : ARMOR_STOP_POOLS[zone];
    return fill(pick(pool), vars);
  }

  // Hit lands — build full narrative
  const parts: string[] = [];

  // Critical prefix
  if (strike.isCritical) {
    parts.push(pick(CRITICAL_PREFIXES[zone]));
  }

  // Hit narration
  const tier = getZoneWoundTier(strike.damageDealt, defenderMaxHp);
  if (isPlayerAttacking) {
    const hitLine = pick(PLAYER_ZONE_HIT[zone][weaponCategory][tier]);
    parts.push(fill(hitLine, vars));
  } else {
    const hitLine = pick(ENEMY_ZONE_HIT[zone][tier]);
    parts.push(fill(hitLine, vars));
  }

  // Armor durability damage (penetrating hit)
  if (strike.armorDamaged > 0 && strike.armorBroken) {
    parts.push(fill(pick(ARMOR_BROKEN_POOLS[zone]), vars));
  }

  // Injury inflicted
  if (strike.injuryInflicted) {
    const injuryPool = INJURY_NARRATION[strike.injuryInflicted];
    if (injuryPool) {
      parts.push(fill(pick(injuryPool), vars));
    }
  }

  // Blood splatter narration — solid and devastating hits get gore lines.
  // Crits additionally describe blood hitting the attacker.
  if (tier !== "glancing") {
    const bloodTier = tier === "devastating" || strike.isCritical ? "devastating" : "solid";
    const bloodPool = BLOOD_SPLATTER[zone]?.[bloodTier];
    if (bloodPool) {
      parts.push(fill(pick(bloodPool), vars));
    }
    if (strike.isCritical) {
      const critGore = CRIT_ATTACKER_GORE[zone];
      if (critGore) {
        parts.push(fill(pick(critGore), vars));
      }
    }
  }

  return parts.join(" ");
}

// ════════════════════════════════════════════════════════════
// Sprint C8 — Third-person multi-combatant strike narrative
// ════════════════════════════════════════════════════════════
// `buildZoneStrikeNarrative` above was written second-person ("Your weapon
// bites...") for the 1v1 player-vs-NPC fight. In a 3v3 fight where any
// combatant can be the attacker (Vivian, Brand, Korm, Sela, …), that POV
// breaks down — "Your blade" reads strangely when Vivian is striking.
//
// `buildMultiStrikeNarrative` produces clean third-person prose with an
// explicit attack-description preamble, e.g.:
//   "Vivian thrusts her short sword at Korm's torso. Her blade bites
//    deep into the chest. (8 damage)"
// or:
//   "Korm swings the great-sword at Gaius's head. Gaius ducks and the
//    blow sails over."

const ATTACK_VERBS: Record<WeaponCategory, string> = {
  slash:  "swings",
  pierce: "thrusts with",
  blunt:  "drives",
  ranged: "looses an arrow at",
};

function attackPreamble(
  attacker: string,
  defender: string,
  weapon: string,
  weaponCategory: WeaponCategory,
  zone: BodyZone,
): string {
  if (weaponCategory === "ranged") {
    return `${attacker} looses an arrow at ${defender}'s ${zone}.`;
  }
  const verb = ATTACK_VERBS[weaponCategory] ?? "strikes at";
  return `${attacker} ${verb} ${weapon} at ${defender}'s ${zone}.`;
}

const MULTI_EVADE: Record<BodyZone, string[]> = {
  head:  ["{defender} ducks and the blow sails over.", "{defender} jerks aside — the strike cuts only air.", "{defender} twists away at the last instant."],
  neck:  ["{defender} pulls back and the blade hisses past the throat.", "{defender} drops a shoulder — the strike finds nothing.", "{defender} sways aside; the throat strike goes wide."],
  torso: ["{defender} sidesteps the body blow.", "{defender} pivots — the strike catches only cloth.", "A quick half-step and {defender} avoids the strike entirely."],
  limbs: ["{defender} pulls the limb back in time.", "{defender} hops aside — the strike whiffs.", "The strike finds empty space where {defender} was standing."],
};

const MULTI_HIT: Record<BodyZone, Record<WoundTier, string[]>> = {
  head: {
    glancing:    ["The blow clips {defender}'s skull — a shallow cut. ({damage} damage)", "A glancing slash across {defender}'s temple. ({damage} damage)"],
    solid:       ["The weapon bites into {defender}'s head, splitting scalp to bone. ({damage} damage)", "A vicious cut opens {defender}'s forehead. ({damage} damage)"],
    devastating: ["The weapon cleaves into {defender}'s skull with terrible force. ({damage} damage)", "{defender}'s head opens under the blow. ({damage} damage)"],
  },
  neck: {
    glancing:    ["The blade nicks {defender}'s throat — close. ({damage} damage)", "A graze across {defender}'s neck. ({damage} damage)"],
    solid:       ["The blade bites into {defender}'s neck. Blood wells. ({damage} damage)", "{defender}'s throat takes the blow; the breath gurgles. ({damage} damage)"],
    devastating: ["The blade hacks deep into {defender}'s neck. Blood sprays. ({damage} damage)", "A savage blow to {defender}'s throat. ({damage} damage)"],
  },
  torso: {
    glancing:    ["The blade grazes {defender}'s ribs — a shallow cut. ({damage} damage)", "A glancing blow to {defender}'s chest. ({damage} damage)"],
    solid:       ["The weapon drives into {defender}'s chest. Ribs protest. ({damage} damage)", "A solid body blow lands. {defender} grunts and reels back. ({damage} damage)"],
    devastating: ["The weapon buries itself in {defender}'s chest. {defender} folds. ({damage} damage)", "A devastating blow to the body — {defender} staggers, eyes wide. ({damage} damage)"],
  },
  limbs: {
    glancing:    ["The blade nicks {defender}'s arm. ({damage} damage)", "A glancing cut to {defender}'s leg. ({damage} damage)"],
    solid:       ["The blade bites into {defender}'s arm. ({damage} damage)", "A solid blow to {defender}'s leg — the limb buckles. ({damage} damage)"],
    devastating: ["The blade nearly severs {defender}'s arm. ({damage} damage)", "{defender}'s leg gives way under the blow — bone splinters. ({damage} damage)"],
  },
};

const MULTI_BLOCK: Record<BodyZone, string> = {
  head:  "{defender}'s shield snaps up — the head strike clangs off the boss.",
  neck:  "{defender} catches the throat strike on the shield's edge.",
  torso: "{defender}'s shield turns the body blow aside.",
  limbs: "{defender} catches the strike on the shield's rim.",
};

// Armor sits OVER the body and gambeson — never beneath clothes. Lines
// describe the strike meeting the outermost layer (helm, gorget, mail,
// vambrace) and being turned. See `feedback_armor_layering` memory.
const MULTI_ARMOR_STOP: Record<BodyZone, string> = {
  head:  "The blow rings off {defender}'s helm.",
  neck:  "{defender}'s gorget turns the throat strike aside.",
  torso: "The blade skates across {defender}'s mail; the links hold and the steel finds no purchase.",
  limbs: "The vambrace catches the blow; {defender} barely feels it.",
};

// Crit prefixes describe SEVERITY only — never claim the kill, since a
// crit can land without dropping the defender. The actual "X dies"
// language belongs to the death-reaction pool, which is keyed off the
// post-strike HP transition, not on whether the strike crit.
const MULTI_CRIT_PREFIX: Record<BodyZone, string[]> = {
  head: [
    "A perfect cut — ",
    "A skull-splitting strike — ",
    "Steel finds bone — ",
  ],
  neck: [
    "A vicious cut — ",
    "Steel kisses the throat — ",
    "A throat-line strike — ",
  ],
  torso: [
    "A brutal blow — ",
    "A devastating strike — ",
    "Steel drives home — ",
  ],
  limbs: [
    "A precise stroke — ",
    "Steel finds the joint — ",
    "A crippling cut — ",
  ],
};

const MULTI_INJURY: Partial<Record<StatusEffectType, string>> = {
  bleed:           "The wound bleeds freely.",
  severed_artery:  "Blood pumps from the cut artery — {defender} is dying.",
  crushed_windpipe: "{defender}'s throat collapses; the breath rattles.",
  broken_arm:      "The arm hangs at a wrong angle.",
  broken_leg:      "{defender} drops to one knee — the leg will not hold.",
  concussion:      "{defender}'s eyes lose focus.",
  poison:          "The blade was poisoned; the venom spreads.",
};

/**
 * Sprint C8 — third-person strike narrative for the multi-combatant
 * fight. Always emits attack preamble + outcome line(s). Replaces
 * `buildZoneStrikeNarrative` for the new ACT/AI_TURN code path.
 */
export function buildMultiStrikeNarrative(
  strike: StrikeResolution,
  attackerName: string,
  defenderName: string,
  weaponName: string,
  weaponCategory: WeaponCategory,
  defenderMaxHp: number,
): string {
  const vars: Record<string, string> = {
    attacker: attackerName,
    defender: defenderName,
    weapon: weaponName,
    damage: String(strike.damageDealt),
    zone: strike.targetZone,
  };
  const preamble = attackPreamble(attackerName, defenderName, weaponName, weaponCategory, strike.targetZone);
  const lines: string[] = [preamble];

  if (strike.evaded) {
    lines.push(fill(pick(MULTI_EVADE[strike.targetZone]), vars));
    if (strike.isCriticalFail) {
      lines.push(strike.weaponDropped
        ? `${attackerName} stumbles — the ${weaponName} clatters from ${attackerName}'s grip.`
        : `${attackerName} overextends and stumbles forward, off-balance.`);
    }
    return lines.join(" ");
  }
  if (strike.blocked) {
    const blockLine = strike.armorBroken
      ? `${defenderName}'s shield splinters under the blow.`
      : MULTI_BLOCK[strike.targetZone];
    lines.push(fill(blockLine, vars));
    return lines.join(" ");
  }
  if (strike.armorStopped) {
    const armorLine = strike.armorBroken
      ? `${defenderName}'s armor cracks under the blow — a piece falls away.`
      : MULTI_ARMOR_STOP[strike.targetZone];
    lines.push(fill(armorLine, vars));
    return lines.join(" ");
  }

  // Hit lands
  const tier = getZoneWoundTier(strike.damageDealt, defenderMaxHp);
  if (strike.isCritical) {
    lines.push(pick(MULTI_CRIT_PREFIX[strike.targetZone]));
  }
  lines.push(fill(pick(MULTI_HIT[strike.targetZone][tier]), vars));

  if (strike.injuryInflicted) {
    const injuryLine = MULTI_INJURY[strike.injuryInflicted];
    if (injuryLine) lines.push(fill(injuryLine, vars));
  }

  return lines.join(" ");
}

// ════════════════════════════════════════════════════════════
// Ally death reactions — pre-scripted last-moment lines
// ════════════════════════════════════════════════════════════
// When a hero or hireable ally drops to hp <= 0, combat narrative emits
// one of these as a final beat — voice of the dying character, the
// emotional register varying line-to-line. Howard-canon: gendered
// pronouns are real; the {Subject} / {possessive} / {object} /
// {reflexive} tokens fill from `pronounsFor(c.gender)`. Token {name} is
// the player-facing combatant name (never the npcId).
//
// Enemies get a separate, terser pool — players root against them, so a
// 20-line emotional aria for every dead bandit reads wrong.

const ALLY_DEATH_REACTIONS: string[] = [
  // Shock
  "{name} stares down at the wound, eyes wide. \"...this isn't—\" {Subject} falls.",
  "{name} touches the wound, looks at {possessive} red palm. The legs give way. {Subject} is gone.",
  // Confusion
  "\"Why is the sky so close?\" {name} whispers. {Subject} does not see the sky.",
  "{name} blinks, slow, as if trying to remember a word. The breath stops mid-thought.",
  // Acceptance
  "\"Tell my mother...\" {name} starts. The breath leaves before the words come. {Subject} is still.",
  "{name} nods, once, as if accepting a verdict {subject} has been expecting. {Subject} sits down against the wall and is gone.",
  // Defiance
  "\"Not yet — not yet—\" but {name}'s strength is leaving {object}. {Subject} sinks down with curses on {possessive} lips.",
  "\"I will not — go quiet—\" {name} grits, but {subject} goes anyway, biting on the unfinished oath.",
  // Fear
  "{name} grabs for someone, anyone. \"I don't want to—\" The grip slackens. {Subject} is gone.",
  // Peace
  "{name} smiles, faintly. \"It is enough.\" {Subject} closes {possessive} eyes.",
  // Prayer
  "\"Mithras...\" {name} breathes. \"...let it be light.\" The Word cuts off.",
  // Regret
  "\"I should have...\" {name} cannot finish. The thought falls with {object}.",
  // Pride
  "{name} sets {possessive} jaw against the dark. \"I held the line.\" It is the last thing {subject} says.",
  // Love
  "{name} whispers a name no one in this room knows, and {possessive} eyes glaze on the second syllable.",
  // Despair
  "{name} weeps, suddenly, like a child. The tears fall onto a face already going still.",
  // Rage
  "\"Damn you,\" {name} snarls at the killer, blood at the corner of {possessive} mouth. \"Damn you to the Outer Dark.\" {Subject} is gone.",
  // Wonder
  "{name} looks up at the rafters, the pale dust in the air. \"Beautiful,\" {subject} says. And dies.",
  // Last orders
  "\"Hold the line — the line—\" {name} says, and falls forward over the words.",
  // Confession
  "\"I lied to her,\" {name} murmurs. \"Tell her — I lied.\" The breath stops on the second word.",
  // Dignity
  "{name} straightens, even as {subject} sinks. The blade is set down deliberately. Then {subject} is gone.",
];

if (ALLY_DEATH_REACTIONS.length !== 20) {
  // Compile-time sanity. Bump this assertion if the pool grows.
  throw new Error(`ALLY_DEATH_REACTIONS must have 20 entries, has ${ALLY_DEATH_REACTIONS.length}`);
}

/**
 * Returns a death-reaction line for a fallen ally, with name + pronouns
 * filled in. Caller appends to the round's narrative.
 *
 * `c.gender` selects the pronoun set; `c.name` is the player-facing
 * display name. NEVER pass the npcId here — the rule (see
 * `feedback_real_gendered_pronouns`) is that programmatic ids never
 * surface in user-facing prose.
 */
// Sentinel prefix on every death-line return value. The dev log + the
// in-game CombatScreen detect this prefix and (a) classify the line as
// `kind: "death"` and (b) strip the marker before rendering. Using a
// sentinel rather than prose-pattern matching means the classifier
// works for all 20 ally lines + every enemy line + any future addition,
// regardless of which phrase ends the sentence.
export const DEATH_LINE_PREFIX = "[DEATH] ";

/** True when a string starts with the death-line sentinel. */
export function isDeathLine(line: string): boolean {
  return line.startsWith(DEATH_LINE_PREFIX);
}

/** Strip the sentinel prefix before rendering. Idempotent on non-death lines. */
export function stripDeathPrefix(line: string): string {
  return line.startsWith(DEATH_LINE_PREFIX) ? line.slice(DEATH_LINE_PREFIX.length) : line;
}

export function pickAllyDeathReaction(c: {
  name: string;
  gender: "male" | "female";
}): string {
  const template = pick(ALLY_DEATH_REACTIONS);
  const isFemale = c.gender === "female";
  const vars: Record<string, string> = {
    name: c.name,
    Subject: isFemale ? "She" : "He",
    subject: isFemale ? "she" : "he",
    object: isFemale ? "her" : "him",
    possessive: isFemale ? "her" : "his",
    reflexive: isFemale ? "herself" : "himself",
  };
  return DEATH_LINE_PREFIX + fill(template, vars);
}

/**
 * Terse death line for a fallen enemy — players root against them, so a
 * full emotional arc reads wrong here. Single sentence, third-person.
 */
export function enemyDeathLine(c: { name: string }): string {
  const pool = [
    `${c.name} sags and falls. The fight goes out of the body.`,
    `${c.name} drops, weapon ringing on the stone.`,
    `${c.name} is gone before the body knows it.`,
    `${c.name} folds at the knees and does not rise.`,
    `${c.name} pitches forward, still, the eyes already empty.`,
  ];
  return DEATH_LINE_PREFIX + pick(pool);
}

// ════════════════════════════════════════════════════════════
// Interrupt-fizzle narrative — one source for CAST + INVOKE
// ════════════════════════════════════════════════════════════
// CAST (guild magic, third-person — any combatant) and INVOKE (occult
// sorcery, second-person — player only) follow the same interruption
// rules: a critical / severed_artery / crushed_windpipe / silenced
// just-suffered hit blocks the cast for one turn. Mana stays with the
// caster either way; reagents (INVOKE only) likewise. Both narratives
// flow through this single formatter so the prose can't drift.

/** Build the "due to X" reason clause for a fizzle/shatter narrative.
 *  Perspective controls whether the wound is described in possessive-
 *  agnostic terms ("the head", "the throat") for third-person prose
 *  about a named combatant, or in second-person ("your head", "your
 *  throat") when the caster IS the addressee. */
function reasonClauseFor(
  reason: InterruptReason,
  perspective: "third" | "second",
  pron: { object: "him" | "her" | "you" },
): string {
  const yours = perspective === "second" ? "your" : "the";
  switch (reason.kind) {
    case "critical_hit": {
      const part =
        reason.zone === "head"  ? "head" :
        reason.zone === "neck"  ? "neck" :
        reason.zone === "torso" ? "body" :
                                  "limb";
      return `the brutal wound to ${yours} ${part}`;
    }
    case "severed_artery":
      return `the gash at ${yours} throat`;
    case "crushed_windpipe":
      return `the crush of ${perspective === "second" ? "your" : "a"} closing throat`;
    case "silenced":
      return `the silencing weave laid upon ${pron.object}`;
  }
}

export interface InterruptFizzleOpts {
  /** Display name of the caster — player-facing, never an npcId.
   *  Used only in third-person; the second-person branch addresses
   *  the caster as "you" and ignores this field. */
  casterName: string;
  /** Caster gender — drives third-person possessive selection. Only
   *  read in the "third" perspective branch; INVOKE callers (always
   *  second-person) may omit it. */
  casterGender?: Gender;
  /** Display name of the spell. CAST conventionally passes the
   *  uppercase canonical name ("BLAST"); INVOKE passes the
   *  registry's spell.name ("Fire Bolt"). The helper trusts the input. */
  spellLabel: string;
  /** What broke the cast — captured at strike-time on the combatant. */
  reason: InterruptReason;
  /** "third" — third-person narration about a named combatant; CAST.
   *  "second" — addresses the caster as "you"; INVOKE.              */
  perspective: "third" | "second";
  /** "fizzle" (default): a brand-new cast attempt fails before the
   *  Words form — actor still has the turn (no mana spent).
   *  "channel-shatter": an in-flight multi-turn channel breaks
   *  mid-cast — mana already committed and is forfeit. */
  mode?: "fizzle" | "channel-shatter";
}

/**
 * Single source of truth for cast-interrupt narration. Used by:
 *   - `lib/combat/engine.ts` → `resolveAction` cast branch (CAST fizzle)
 *   - `lib/combat/engine.ts` → `resolveChannelStep` (channel shatter)
 *   - `lib/sorcery/invoke.ts` → `composeInvokeResponse` (INVOKE fizzle)
 *
 * Reagents are preserved on every fizzle/shatter path; this helper
 * deliberately does NOT mention them — the caller's surrounding
 * narrative tone handles flavor. The shared template stays focused on
 * the cause + the broken cast.
 */
export function formatInterruptFizzle(opts: InterruptFizzleOpts): string {
  const { casterName, casterGender, spellLabel, reason, perspective, mode = "fizzle" } = opts;
  const isSecond = perspective === "second";
  // casterGender is third-person-only; default to "male" for the
  // second-person branch (pronouns are unused there). When perspective
  // is "third", caller MUST pass casterGender — defaulting silently
  // would mis-pronoun a female combatant.
  if (!isSecond && !casterGender) {
    throw new Error("formatInterruptFizzle: casterGender is required when perspective='third'");
  }
  const pron = pronounsFor(casterGender ?? "male");
  const objectPron = (isSecond ? "you" : pron.object) as "him" | "her" | "you";
  const why = reasonClauseFor(reason, perspective, { object: objectPron });

  if (mode === "channel-shatter") {
    return isSecond
      ? `Your concentration breaks under ${why}; the spell shatters in the air!`
      : `${casterName}'s concentration breaks under ${why}; the spell shatters in the air!`;
  }

  // fizzle — brand-new cast attempt cut short before the Words form.
  return isSecond
    ? `Your voice cracks due to ${why}; ${spellLabel} dies on your lips.`
    : `${casterName}'s voice cracks due to ${why}; the Word of ${spellLabel} dies on ${pron.possessive} lips.`;
}
