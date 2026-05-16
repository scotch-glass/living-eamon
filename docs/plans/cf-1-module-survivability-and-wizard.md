# Sprint CF-1 — Module survivability simulator, synthetic enemy tiers, and the multiple-choice wizard

## Context

CF-0 shipped the foundation. CF-1 is the wizard that authors a module skeleton. But the math underneath was hand-wavy and I was anchoring on the combat-arena test fixtures (Rurik / Sela / Korm) which are not canonical content — they exist to test the combat UI and will be replaced. This rewrite throws that anchor out.

The corrected framing:

> **A module is a sequence of encounters and atoms with optional rest opportunities. The Creator stocks each room with an abstract encounter pattern, not named enemies. The simulator walks the whole module — attrition, recovery, atom checks, gear gates — and reports P(complete) across N trials. That P drives pre-travel warnings, module recommendations, and Courage reward magnitude. Real NPCs (CF-4) later get tagged with a synthetic tier; the simulator's math doesn't change when they do.**

CF-1 owns:
1. **A synthetic enemy tier table.** Tier 1 grunt → Tier 4 boss. Each tier has a canonical HP / armor / DPR / stamina / spell-budget template. This table is the unit of combat load. CF-4 will later author named NPCs declaring which tier they fit; the simulator math is unchanged.
2. **A wizard that stocks rooms with encounter patterns.** Per room: "none / single tier-1 / patrol-of-three / veteran + grunts / elite solo / boss-with-entourage" etc. Plus atom severity, gear gates, REST availability.
3. **The module survivability simulator** in `lib/difficulty/`. Pure functions. Public so future surfaces (pre-travel warn, recommendation API) consume them.
4. **P(complete) computation per axis** (combat / moral / gear / exploration) with logistic aggregation and a min-of-axes overall.
5. **Courage reward formula** tied to (1 − P)².

What CF-1 does NOT do: name individual NPCs (CF-4), write prose (CF-2), generate maps (CF-3), produce art (CF-5), commit to Ink (CF-6), validate balance per GPE (CF-8).

---

## Prior art reviewed

1. **Pathfinder 2e XP Budget** ([Archives of Nethys](https://2e.aonprd.com/Rules.aspx?ID=498)). Each creature priced as XP relative to party-level. Sum of XP → encounter difficulty tier. We adopt the "creature priced in baseline units, then summed with synergy multipliers" pattern — applied to synthetic tiers.
2. **D&D 5e Adventuring Day attrition math** ([DM's Workshop](https://dmdave.com/encounter-building-math/)). A party can survive 6–8 medium encounters per long rest; each encounter further into a day is ~15% deadlier than the previous. We adopt the attrition_multiplier.
3. **Disco Elysium / Wasteland 3 surfaced probability** ([Gabriel Chauri analysis](https://www.gabrielchauri.com/disco-elysium-rpg-system-analysis/)). Show the percent before the player commits. We adopt this for both wizard preview AND pre-travel warning UI.
4. **Monte Carlo at 1k–10k trials for RPG balance** ([Boards and Barley](https://boardsandbarley.com/2013/09/17/monte-carlo-simulations-for-game-design/), [GDC: Balancing Your Game](https://gdcvault.com/play/1023865/Balancing-Your-Game-A-Formula)). Industry standard. 1k for design-time previews, 10k for calibration. We use 1k server-side per pre-travel call (cached), 10k for offline calibration.
5. **Glicko-2 logistic curve** ([Glickman spec](https://glicko.net/glicko/glicko2.pdf)). P(win) = `1 / (1 + exp(-k·(capability − load)))`. Adaptive rating (volatility update) deferred until we have multi-player data.

Explicitly rejected: D&D 5e CR formula (25% accurate per [Blog of Holding](https://www.blogofholding.com/?p=7283)); OSR hit-dice heuristics (too loose); MMO gear-score systems (arms-race breakdown).

---

## §1. Synthetic enemy tier table

Four tiers. Each is a stat template the simulator uses; CF-4 later writes real NPCs declaring `tier: 2`, etc. The tier templates are committed to `lib/difficulty/enemyTiers.ts`. Stats are **proposals to be tuned by §6 calibration** before being committed.

| Tier | Label | HP | Armor | Weapon avg dmg | Stamina | Mana / spells | Action econ | Unit value |
|------|-------|----|-------|----------------|---------|---------------|-------------|------------|
| **1** | Grunt | 30 | 2 | 1d6+1 (4.5) | 40 | 0 / none | 1 action/round | **1.0** |
| **2** | Veteran | 55 | 4 | 1d8+3 (7.5) | 60 | 6 / 1 minor spell (HEAL or DEBUFF) | 1 action/round | **2.0** |
| **3** | Elite | 90 | 6 | 2d6+4 (11) | 90 | 15 / 2 mid spells | 1 action/round + 1 reaction | **4.0** |
| **4** | Boss | 160 | 8 | 2d10+5 (16) | 130 | 30 / 2 defining spells | 2 actions/round OR phase-shift at <50% HP | **8.0** |

The doubling progression (1 → 2 → 4 → 8) is borrowed from PF2e level-vs-XP scaling (level −1 = 40 XP, level 0 = 60 XP, level +1 = 80 XP — roughly doubling per two levels). It gives clean "this encounter is 4 grunts worth" intuition for Creators.

**Encounter pattern catalogue** (what the wizard exposes per room):

| Pattern ID | Composition | Combat load |
|------------|-------------|-------------|
| `none` | No combat | 0.0 |
| `single-grunt` | 1× T1 | 1.0 |
| `pair-grunts` | 2× T1 | 2.2 (×1.1 synergy) |
| `patrol-grunts` | 3× T1 | 3.75 (×1.25 synergy) |
| `pack-grunts` | 4× T1 | 6.0 (×1.5 synergy) |
| `vet-solo` | 1× T2 | 2.0 |
| `vet-and-grunt` | 1× T2 + 1× T1 | 3.3 (×1.1 synergy) |
| `vet-and-pair` | 1× T2 + 2× T1 | 5.0 (×1.25 synergy) |
| `vet-pair` | 2× T2 | 4.4 (×1.1) |
| `elite-solo` | 1× T3 | 4.0 |
| `elite-and-vet` | 1× T3 + 1× T2 | 6.6 (×1.1) |
| `elite-and-grunts` | 1× T3 + 3× T1 | 9.4 (×1.25) |
| `boss-solo` | 1× T4 | 8.0 |
| `boss-and-entourage` | 1× T4 + 2× T2 | 15.0 (×1.25) |

Patterns ≤ 4.0 are novice-tier. 4.0–8.0 moderate. 8.0+ deadly. These bins are *labels for player-facing UI only*; the wizard never asks the Creator to pick a tier — they pick patterns, the engine reports load.

**Synergy multipliers** (× total) by enemy count: 1=×1.0, 2=×1.1, 3=×1.25, 4=×1.5, 5+=×1.7. From PF2e encounter math.

---

## §2. Module combat-load formula

```
total_combat_load(module) = Σ over rooms [ encounter_load(room) · attrition_multiplier(room_index) ]

attrition_multiplier(i) = 1 + 0.15 · count_combat_rooms_before_i_without_rest
                          (capped at 1.6)
```

The attrition multiplier resets on any room with `rest_available: true`. If the Creator places a REST point after every two combat rooms, the multiplier never exceeds 1.30. If combat is wall-to-wall with no REST, it cliffs up to 1.6× by encounter 5+.

**Worked example — small module:**
3 rooms: room 1 = `pair-grunts`, room 2 = `none` (REST available), room 3 = `vet-solo`.

```
room_1 load = 2.2 · 1.0 (first combat)     = 2.20
room_2 load = 0 (no combat; resets attrition counter)
room_3 load = 2.0 · 1.0 (first combat after REST) = 2.00
total combat_load = 4.20 grunt-units
```

**Worked example — deadly module:**
5 rooms: room 1 = `patrol-grunts`, room 2 = `vet-and-grunt`, room 3 = `elite-solo`, room 4 = `none` (REST), room 5 = `boss-solo`.

```
room_1 load = 3.75 · 1.0          = 3.75
room_2 load = 3.3  · 1.15 (2nd in a row)  = 3.80
room_3 load = 4.0  · 1.30 (3rd in a row)  = 5.20
room_4 = REST; attrition resets
room_5 load = 8.0  · 1.0          = 8.00
total combat_load = 20.75 grunt-units
```

---

## §3. Party combat-capability formula

The capability formula has the same shape as before but **the calibration anchor changes**: a single Tier-1 Grunt against the canonical Fresh Hero Party yields P(win) = 50% over 10k trials.

**Canonical Fresh Hero Party** (the reference point):
- 1 hero, PICSSI all 0
- STR 10 / DEX 10 / CHA 10 (base)
- Weapon: short_sword (1d12+2 dmg, 10 stamina/swing)
- Armor: none (zone armor 0 everywhere)
- Inventory: empty
- HP 50, maxStamina 55, actionBudget 25, mana 10

By definition this party = **1.0 combat-capability units**. A Tier-1 Grunt = 1.0 combat-load units. They tie.

**Capability formula:**

```
hero_capability = hp_factor × dpr_factor × evasion_factor × stamina_factor × gear_factor

  hp_factor      = maxHP / 50
  dpr_factor     = expected_dpr / 4.5   // ratio vs Tier-1 grunt's DPR
  evasion_factor = (100 − tier1_grunt_evasion) / (100 − hero_evasion)
                   ≈ proxy for "how often the hero gets hit"
  stamina_factor = (maxStamina / weaponStaminaCost) / 5.5
                   // 5.5 swings = fresh hero baseline; <1 means fatigues mid-fight
  gear_factor    = 1 + 0.05 · armorTotal + 0.10 · (shield ? 1 : 0)

party_capability = hero_capability
                 + 0.6 · henchman_1_capability
                 + 0.5 · henchman_2_capability
```

Henchman discounts (0.6, 0.5) reflect (a) simplified AI policy, (b) shared target selection, (c) friendly-fire avoidance overhead. Calibrated in §6.

The five factors **multiply** because each gates combat survival independently (no HP → instant death; no DPR → infinite TTK; no stamina → action lockout via fatigue tier 4; no gear → high incoming damage; no evasion → high crit-incidence).

**Worked example — fresh hero**: by anchor, 1.00.

**Worked example — mid-progression hero** (PICSSI all 30, base stats 10/10/10, long_sword, leather armor=3, no shield):
```
maxHP = 50 + 60 = 110           → hp_factor = 2.20
STR_eff = 10 + 3 = 13           → strMod = 1.075
long_sword damage = 1d12+4 = 10.5 avg
expected_dpr = 10.5 · 1.075 · 1.0 (torso) · (95% hit) ≈ 10.7
  − tier-1 armor reduction (~2) → 8.7 net per swing
                                  → dpr_factor = 8.7/4.5 = 1.93
DEX_eff = 13                    → evasion_factor ≈ 1.10
maxStamina = 35 + 26 = 61, long_sword cost 13 → 4.7 swings
                                  → stamina_factor = 0.85 (fatigues by round 5)
gear_factor = 1 + 0.15 = 1.15

hero_capability = 2.20 × 1.93 × 1.10 × 0.85 × 1.15 = 4.57
```

**Worked example — endgame hero with henchman** (PICSSI all 75, full gear armor=6 + shield, 1 mid-tier henchman):
```
hp_factor      = (50 + 150) / 50          = 4.0
dpr_factor     = long_sword + STR 17 mod  ≈ 2.8
evasion_factor ≈ 1.20
stamina_factor ≈ 1.05
gear_factor    = 1 + 0.30 + 0.10           = 1.40

hero_capability = 4.0 × 2.8 × 1.20 × 1.05 × 1.40 = 19.75

party_capability = 19.75 + 0.6 × (henchman ≈ 4.5) = 22.45
```

This party can take on a `boss-and-entourage` encounter (load 15.0) at par, or a multi-encounter deadly module (total load 20+) with attrition.

---

## §4. P(success) per axis — the logistic model

```
P(axis_success) = 1 / (1 + exp(−k · (capability_axis − load_axis)))
```

`k = 1.5` (slope). At k = 1.5:

| capability − load | P(axis_success) |
|---|---|
| −2.0 | 5% |
| −1.0 | 18% |
| 0.0 | 50% |
| +1.0 | 82% |
| +2.0 | 95% |

**Overall P(module_complete) = min(P_combat, P_moral, P_gear, P_exploration).**

We use `min` not `geomean` because gating axes (gear especially) genuinely act as hard cliffs. A party with 95% combat / 20% gear can't get past a locked door; combat doesn't help. The min is honest. Surface "this module is bottlenecked by gear" as design feedback to the Creator.

The other three axes mirror the combat axis structure:

**Moral axis**
- `moral_load` = Σ |atom_picssi_target| · severity_weight (atom_count × tier_weight). Severity tiers from KARMA_SYSTEM magnitude bands: trivial ±1 → weight 0.5, notable ±3 → 1.0, major ±5 → 2.0, defining ±10 → 4.0.
- `moral_capability` = (integrity + courage) / 2 + max(0, illumination/4) + standing/8. Calibrated against P=50% when a party of mid PICSSI faces an atom-heavy module.

**Gear axis**
- `gear_load` = Σ over rooms (gear_gate_present ? gate_difficulty : 0). gate_difficulty ∈ {5 (common), 10 (uncommon), 15 (rare), 25 (legendary)}.
- `gear_capability` = inventory_score(equipped + carried). Pure inventory tag sum, normalized.

**Exploration axis**
- `exploration_load` = 0.5·room_count + 0.3·atom_count + 1.0·quest_branches. Cognitive + action-budget load.
- `exploration_capability` = (action_budget / 25) · 10 + passion/4 + henchman_count · 3.

---

## §5. Atom resolution mechanic

Atoms are checks the party faces in-room: a moral fork, a Bluff vs Authority confrontation, a Spirituality test before an oracle.

**Resolution**: `success_if (virtue + d100 ≥ threshold)`. Uses percentile rolls to stay consistent with the engine's combat math (which uses 0–100 evasion / hit / armor rolls everywhere). Thresholds:
- Trivial atom: threshold = 20 (success rate ≈ 80%+ for any non-zero virtue)
- Notable: threshold = 50
- Major: threshold = 80
- Defining: threshold = 110 (requires virtue ≥ 10 even to have a non-zero chance)

The simulator rolls each atom check `trials` times and tracks pass/fail. Failed atoms typically (per the atom's content, defined in CF-2): consume HP, lose virtue, or spawn an additional encounter — all of which feed back into other axes' load.

---

## §6. The Monte Carlo simulator

```typescript
// lib/difficulty/simulate.ts
export interface PartySnapshot {
  hero: HeroStats;
  henchmen: HeroStats[];   // 0–2
}

export interface ModuleSkeleton {
  rooms: SkeletonRoom[];
  // ... other skeleton fields
}

export interface SkeletonRoom {
  encounterPattern: EncounterPatternId | "none";
  atomCount: number;
  atomSeverity: "trivial" | "notable" | "major" | "defining";
  gearGate?: { difficulty: number; itemTag: string };
  restAvailable: boolean;
}

export interface SimulationResult {
  trials: number;
  pComplete: number;        // overall
  pPerAxis: { combat: number; moral: number; gear: number; exploration: number };
  ci95: [number, number];
  avgHpRemaining: number;
  avgStaminaUsed: number;
  avgActionBudgetSpent: number;
  failureMode: { combat: number; atom: number; gate: number; budget: number };
  perRoomDistribution: Array<{ roomIdx: number; avgHpLost: number; avgRoundsTaken: number }>;
}

export function simulateModule(
  party: PartySnapshot,
  module: ModuleSkeleton,
  opts?: { trials?: number; seed?: number }
): SimulationResult;
```

**Per trial:**
1. Initialize party state (hp, maxHp, stamina, actionBudget, virtues, inventory).
2. For each room in order:
   - If `gearGate` is set and party doesn't carry the item → trial fails (failureMode.gate++); break.
   - If `encounterPattern !== "none"`: instantiate combatants from the tier templates; resolve combat using ported pure functions from [lib/combat/engine.ts](lib/combat/engine.ts). Round loop until one side is dead or all party hp = 0. Track hp/stamina/action consumed.
   - For each atom: roll `virtue + d100 ≥ threshold`. On fail, apply per-atom consequence (default: −2 hp, −1 virtue point, or spawn a single Tier-1 grunt encounter — calibrated per atomSeverity).
   - If `restAvailable: true`: full stamina, fatigue pool −50%, costs 1 action_budget point.
3. End-of-trial: trial succeeds if hp > 0 AND action_budget ≥ 0 AND all gates passed.
4. After N trials: tally win rate, axis-specific failure modes, distributions.

**Combat resolution per round** (pure functions in `lib/difficulty/combatSim.ts`, ported from [lib/combat/engine.ts](lib/combat/engine.ts)):
- Roll initiative (DEX-based).
- Each combatant in order: pick body zone (AI policy biased toward torso for grunts, head for elites), roll evasion (engine formula §0), roll hit/miss, roll armor stop, roll damage, apply, deduct stamina.
- Apply between-round effects: bleed ticks, fatigue tier transitions.
- Repeat.

**RNG**: `mulberry32(seed)` — 32-bit period, sufficient for 10k trials. Tests pin seed; production seeds with Date.now() XOR module-id-hash.

**Bootstrap CI**: After N trials, resample with replacement 200× to compute 95% CI on `pComplete`. If width > 0.10 at N=1000 and `seed` is unfixed, bump to 5000.

**Performance**: 1k trials of an 8-room module ≈ 30–50 ms server-side Node. Cache `(partyHash, moduleId)` for 5 min.

---

## §7. Calibration

The constants in §1 (tier templates) and §3 (capability factor weights) and §4 (slope k) are tuned against anchors:

**Anchor A**: Fresh Hero Party vs single Tier-1 Grunt (encounter pattern `single-grunt`) → P(win) = 50% ± 3% over 10k trials. Tunes Tier-1 stats.

**Anchor B**: Fresh Hero Party vs `vet-solo` (Tier 2) → P(win) ≈ 22%. Tunes Tier-2 stats so a vet is a 2× threat to fresh hero.

**Anchor C**: Fresh Hero Party vs `elite-solo` (Tier 3) → P(win) ≈ 7%. Tunes Tier 3.

**Anchor D**: Fresh Hero Party vs `boss-solo` (Tier 4) → P(win) ≈ 1%. Tunes Tier 4.

**Anchor E**: Mid-Progression Party (PICSSI 30, basic gear) vs vet-solo → P(win) ≈ 50% (the design intent: "moderate" modules are 50/50 for mid heroes).

**Anchor F**: Endgame Party vs deadly module (multi-encounter, total load 20+) → P(complete) ≈ 50%.

**Process**:
1. Lock tier templates with the proposed stats from §1.
2. Run 10k trials per anchor scenario.
3. If observed P deviates more than 3% from target, adjust the affected variable (Tier-N HP or DPR; the slope k for cross-anchor consistency).
4. Iterate until all six anchors fall within tolerance.
5. Run sensitivity analysis: vary each variable ±20%, record P shift. High-sensitivity variables get pinned tight; low-sensitivity ones get loose defaults.
6. Commit constants to `lib/difficulty/constants.ts` with provenance header (date, commit SHA, anchor outputs).

**Calibration script**: `scripts/difficulty/calibrate.ts`. Runs the anchors, prints a sensitivity table, optionally writes constants. Run once per balance pass.

---

## §8. Courage reward function

User-specified: "lower P → higher Courage reward on win or honourable death."

```
courage_on_module_complete(P) = base_complete · (1 − P)²
courage_on_honourable_death(P) = base_death     · (1 − P)² · 1.5
courage_on_flee(P)              = −base_flee_penalty · (1 − P)^0.5
```

With `base_complete = 5`, `base_death = 10`, `base_flee_penalty = 3`. Rounded to KARMA magnitude bands {0, ±1, ±3, ±5, ±10}.

| P(complete) | On win | On heroic death | On flee |
|---|---|---|---|
| 0.95 (trivial) | 0 | 0 | −3 |
| 0.80 | 0 | +1 | −3 |
| 0.50 | +1 | +4 | −2 |
| 0.30 | +2 | +7 | −2 |
| 0.10 | +4 | +10 (capped) | −3 |

Heroic death gets 1.5× because dying in a hopeless fight is more story than dying in a fair fight. Flee penalty is mild on hopeless modules (`^0.5` flattens the curve at low P), harsher on easy ones — fleeing a 95% fight is shameful.

---

## §9. The 18-question wizard

Wizard asks about content; algorithm computes loads. Creator never picks a tier directly.

**Section A — Setting (4 questions)**: PD anchor (8–10 Howard stories from `lore/hyborian-pd/` and `lore/thurian-pd/`), biome, civilization status, travel-anchor `locationId`.

**Section B — Conflict shape (4 questions)**: conflict pattern, moral palette, Illumination tilt, faction count.

**Section C — Mechanics (6 questions)**: enemy composition (drives encounter pattern selection per room), combat density (drives how many rooms have combat), henchman availability, gear gates, atom severity, scroll/fragment seeding.

**Section D — Shape (4 questions)**: length, quest branching, pace (drives `affectCurveTarget`), reward shape.

**Step 5 — Preview & Tweak.** The wizard runs `simulateModule(default_party_snapshot, draft_skeleton, trials=1000)` against three reference parties:
- Fresh Hero Party (P=0 PICSSI, no gear)
- Mid Hero Party (P=30 PICSSI, basic gear, 1 henchman)
- Endgame Party (P=75 PICSSI, full gear, 2 henchmen)

And displays:
```
┌─────────────────────────────────────────────────────────┐
│  Total combat load:    8.40 grunt-units                 │
│  Moral load:           3.0 (notable severity, 3 atoms)  │
│  Gear load:            10 (1 uncommon gate)              │
│  Exploration load:     5.4                              │
│                                                          │
│  Fresh hero:    P(complete) = 4%   bottleneck: combat   │
│  Mid hero:      P(complete) = 41%  bottleneck: combat   │
│  Endgame:       P(complete) = 87%                       │
│                                                          │
│  Courage reward on win  (mid hero): +2 (notable)         │
│  Courage reward on death (mid hero): +5 (major)          │
└─────────────────────────────────────────────────────────┘
```

Creator can tweak any structural field via inline number inputs (room count, hostile-NPC pattern per room, gear gates). Simulation re-runs on each change. On Save → POST `/api/creator/modules/{id}` → land on `/creator-forge/{id}` (placeholder editor; CF-2 wires this).

---

## §10. Self-questioning (open uncertainties)

1. **Tier stats are proposals, not gospel.** §6 calibration will move them. The plan asserts the *shape* (4 tiers, doubling unit-values, multiplier table), not the exact HP/DPR numbers.
2. **Henchman discount (0.6 / 0.5) is calibration-derived.** Could shift to 0.7 / 0.6 if MC shows they pull harder weight in actual fights.
3. **Synergy multipliers borrowed from PF2e.** Living Eamon's body-zone targeting might warrant different ratios — calibration tells us.
4. **Slope k = 1.5.** Steeper = harsher cliffs; gentler = more variance-driven. Defensible at 1.5 by Glicko convention; tunable.
5. **min() vs geomean for overall P.** I picked min for honesty about hard gates. If playtest shows it's too punishing, switch to geomean.
6. **Atom resolution = d100 + virtue ≥ threshold.** Matches engine's percentile mechanic. Open if Scotch prefers d20.
7. **Failure-on-budget vs failure-on-death.** Currently I count both as module fail. Could differentiate so "ran out of action budget" is a "forced retreat" with reduced rewards but not a true loss.
8. **Quadratic Courage curve.** The (1−P)² shape steepens at low P. Could be (1−P)^1.5 for gentler underdog scaling.
9. **What about Spirituality (HEAL) in capability?** Currently §3 ignores it. Once a hero knows HEAL, their effective capability spikes mid-fight. Need to factor in `spell_known ? expected_heal_per_round : 0` to dpr_factor.
10. **Multi-module attrition.** A player who barely scrapes through Module A and immediately enters Module B is at low HP. Should pre-travel warnings account for current state, not just maxHP? Yes — that's exactly what the pre-travel surface does. CF-1 ships the math; the UI integration is a follow-up sprint.

---

## §11. Concrete worked scenarios

### Scenario A — Mid Hero Party, novice 3-room module

**Module**: 3 rooms.
- Room 1: `single-grunt`, no atoms.
- Room 2: `none`, REST available.
- Room 3: `pair-grunts`, 1 notable-severity atom (Integrity threshold 50).

```
combat_load:
  room_1: 1.00 · 1.0     = 1.00
  room_2: REST (resets attrition)
  room_3: 2.20 · 1.0     = 2.20
  total                  = 3.20

moral_load: 1 atom · 1.0 (notable) = 3.0 effective threshold
gear_load:  0
exploration_load: 0.5·3 + 0.3·1 = 1.8

Mid Hero capability:
  combat       = 4.57 (from §3 worked example)
  moral        = (30+30)/2 + 0 + 30/8 = 33.75
  gear         = basic kit ≈ 5
  exploration  = (25/25)·10 + 30/4 + 1·3 = 20.5

P_combat       = 1/(1+exp(-1.5·(4.57−3.20)))  = 89%
P_moral_atom   = P(integrity 30 + d100 ≥ 50)  = 80% (need d100 ≥ 20)
P_gear         = 100%
P_exploration  = 100%

P_complete = min(89%, 80%, 100%, 100%) = 80%
```

**Mid hero clears this module 80% of the time.** Courage reward: `5·(1−0.80)² = 0.20 → 0 (trivial)` on win. The module is a warm-up — Creator should either add a hostile room or raise the atom severity if they want it to feel meaningful.

### Scenario B — Fresh Hero Party, deadly module (the warband)

**Module**: 5 rooms (from §2 worked example), total combat_load 20.75, plus 2 major atoms (severity 2.0) and 1 uncommon gear gate.

```
combat_load = 20.75
moral_load  = 2 · 2.0 = 4.0 effective magnitude (high)
gear_load   = 10 (uncommon gate)
exploration_load = 0.5·5 + 0.3·2 = 3.1

Fresh Hero capability:
  combat       = 1.00 (by anchor)
  moral        = 0 + 0 + 0 = 0
  gear         = 0 (no inventory)
  exploration  = 10.0

P_combat       = 1/(1+exp(-1.5·(1.00−20.75)))  ≈ 0%
P_moral        = ≈ 0% (atom magnitude 4, capability 0)
P_gear         = ≈ 0% (load 10, capability 0)
P_exploration  = 100%

P_complete = 0%
```

**Suicide mission.** Courage on heroic death: `10·(1−0)²·1.5 = 15 → capped at 10 (defining)`. Wizard previews this: "This module is unsurvivable for a fresh hero. Mid heroes ~3%; endgame ~52%. Suggest combat-load 8.0 or below for novice positioning."

### Scenario C — Endgame Party, mystery-flavored module (12 rooms, low combat, heavy atoms)

**Module**: 12 rooms. 1 combat room (`elite-and-vet`, load 6.6). 6 atoms — 2 defining-severity (Integrity threshold 110), 3 major (threshold 80), 1 notable (threshold 50). 2 uncommon gear gates (silver weapon + holy symbol). 3 quest branches.

```
combat_load = 6.6 · 1.0 = 6.6  (single encounter, no attrition stacking)
moral_load  = 2·4.0 + 3·2.0 + 1·1.0 = 15.0
gear_load   = 2 · 10 = 20
exploration_load = 0.5·12 + 0.3·6 + 1·3 = 10.8

Endgame Party capability (PICSSI 75, full kit, 2 henchmen):
  combat       = 19.75 + 0.6·5 + 0.5·5 = 25.25
  moral        = (75+75)/2 + 75/4 + 75/8 = 102.7 → clamp 100
  gear         = full kit + ritual items ≈ 70
  exploration  = (25/25)·10 + 75/4 + 2·3 = 34.75

P_combat       = 1/(1+exp(-1.5·18.65))  ≈ 100%
P_moral_each   = each defining: P(virtue 75 + d100 ≥ 110) = 65%
                 worst-case 2 chained defining: 0.65² = 42%
P_moral_overall= ~42% (limited by chained defining atoms)
P_gear         = ≈ 100%
P_exploration  = ≈ 100%

P_complete = 42%
```

**Tight — exactly the design intent for endgame mystery.** Courage reward: `5·(1−0.42)² = 1.68 → +2 (notable)`. Honest payoff for a 42% module.

---

## Files

**Created — difficulty engine (`lib/difficulty/`):**
- `lib/difficulty/types.ts` — `ModuleLoads`, `PartyCapability`, `PartySnapshot`, `EnemyTier`, `EncounterPattern`, `SimulationResult`
- `lib/difficulty/enemyTiers.ts` — 4-tier stat templates from §1
- `lib/difficulty/encounterPatterns.ts` — pattern catalog from §1
- `lib/difficulty/constants.ts` — k, synergy multipliers, henchman discounts, severity weights (calibration-derived)
- `lib/difficulty/computeLoads.ts` — pure functions per axis
- `lib/difficulty/computeCapability.ts` — pure function from `PartySnapshot`
- `lib/difficulty/probability.ts` — `pSuccess(capability, load): number`; overall = min
- `lib/difficulty/courageReward.ts` — quadratic curves from §8
- `lib/difficulty/combatSim.ts` — ported pure functions: evasion, damage, fatigue, stamina; uses tier templates as combatants
- `lib/difficulty/atomSim.ts` — virtue + d100 ≥ threshold
- `lib/difficulty/simulate.ts` — `simulateModule()` with bootstrap CI

**Created — calibration:**
- `scripts/difficulty/calibrate.ts` — runs §7 anchors A–F, prints sensitivity table, optionally writes constants
- `scripts/difficulty/golden-cases.json` — fixtures for tests

**Created — wizard:**
- `lib/creator/skeletonTypes.ts` — `ModuleSkeleton` (now per-room `encounterPattern` + `loads` + `pComplete[]`)
- `lib/creator/questionnaire.ts` — 18-question registry with WeightContribution per option
- `lib/creator/generateSkeleton.ts` — pure deterministic generator (mirrors [lib/identityBlock.ts](lib/identityBlock.ts) pattern)
- `lib/creator/pdAnchors.ts` — 8–10 Howard PD stories with safe naming defaults + AffectVector biases
- `app/creator-forge/new/page.tsx` — 5-step wizard shell
- `app/creator-forge/new/WizardSection.tsx`
- `app/creator-forge/new/Preview.tsx` — calls `simulateModule` for 3 reference parties + renders the §9 panel
- `app/api/creator/skeleton/route.ts` — POST endpoint runs algorithm server-side

**Created — tests:**
- `lib/difficulty/combatSim.test.ts` — Anchor A passes (50% ± 3%)
- `lib/difficulty/probability.test.ts` — logistic boundaries
- `lib/difficulty/courageReward.test.ts` — band rounding
- `lib/difficulty/simulate.test.ts` — Scenarios A/B/C from §11 reproduce within ±2%
- `lib/creator/generateSkeleton.test.ts` — determinism (byte-identical)

**Modified:**
- `lib/roomTypes.ts` — add `loads?: ModuleLoads`, `pCompletePerArchetype?: { fresh, mid, endgame }`, `intentionallySkewed?: PicssiVirtue[]`. 3-tier `difficulty` enum stays as legacy display label.
- `lib/creator/storage.ts` — extend manifest schema
- `app/creator-forge/page.tsx` — "+ New Module" → `/creator-forge/new` for real

**Reused (unchanged):**
- [lib/karma/atom-types.ts](lib/karma/atom-types.ts), [lib/karma/types.ts](lib/karma/types.ts), [lib/karma/recompute.ts](lib/karma/recompute.ts)
- [lib/combat/engine.ts](lib/combat/engine.ts) — pure functions ported into `combatSim.ts`; live engine unchanged
- [lib/world/travelMatrix.ts](lib/world/travelMatrix.ts) — `ZoneType` vocabulary
- [lib/identityBlock.ts](lib/identityBlock.ts) — deterministic-template pattern reference

---

## Hard rules

1. **No anchoring on combat-arena fixtures.** The existing Rurik/Sela/Korm test NPCs are not referenced anywhere in the difficulty engine. Synthetic tier templates own the math.
2. **The Fresh Hero Party and the Tier-1 Grunt are the only calibration anchors.** All other tiers float relative to those two via §7 calibration.
3. **Loads are computed from content, never input.** Wizard asks about content; never about "tier."
4. **Overall P = min across axes** in v1. Weakest axis is the bottleneck.
5. **Simulator is pure functions with seeded RNG.** No Date.now / Math.random outside the seeded layer.
6. **Surface the percent.** Wizard preview + pre-travel screen + recommendation UI all show P.
7. **Courage reward rounds to KARMA bands** {0, ±1, ±3, ±5, ±10}.
8. **CF-1 ships ZERO LLM calls.** Pure deterministic math + UI. Cost: $0.
9. **Constants live in `lib/difficulty/constants.ts`** with calibration-script provenance header.
10. **CF-1 owns synthetic tier templates and encounter patterns.** CF-4 will later map real-NPC IDs to tiers; the simulator math doesn't change when it does.

---

## Verification

1. **Unit tests pass.** `npx vitest run lib/difficulty/ lib/creator/`. Anchor A (Fresh Hero vs Tier-1 Grunt) yields 50% ± 3% over 10k trials.
2. **Calibration script idempotent.** Running it twice produces byte-identical `constants.ts`.
3. **`npx tsc --noEmit` clean** for all CF-1 files.
4. **Wizard end-to-end** (manual, admin): walk 18 questions; preview panel shows per-axis loads + 3-archetype P + Courage baseline; tweak fields → simulation re-runs within 200 ms; save → `module.json` lands in Supabase Storage with all fields populated.
5. **Golden-case fixtures from §11** reproduce in CI within ±2% (allows for MC variance at 1k trials).
6. **Cost guard**: zero LLM, zero Grok. Server-side compute only.
