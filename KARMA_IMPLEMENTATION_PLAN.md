# KARMA_IMPLEMENTATION_PLAN.md — Wiring the Karma System

> **Companion to [KARMA_SYSTEM.md](./KARMA_SYSTEM.md), which is the single source of truth for design values.** This document does not redefine PICSSI math, formulas, or tables — it tells the engineer (or pairing AI) WHERE in the codebase to wire each part, in what order, with what types, and how to verify.
> **Status:** Stage III preparation. Sprint 0 is gated on Scotch's "begin Sprint 1" approval (see KARMA_SYSTEM.md §6).
> **Last updated:** 2026-04-29

---

## How to use this document

- **All design values** (e.g., "Integrity → maxHP via `+2·Integrity`") are in KARMA_SYSTEM.md. This file references them by section number, never duplicates.
- **All file paths** are repo-relative.
- **Sprint dependencies** are explicit. Don't skip ahead.
- **Definition of done** at the end of each sprint must pass before starting the next.

When implementing:
1. Check the prerequisite sprints are complete.
2. Re-read the relevant KARMA_SYSTEM.md section(s) for the values.
3. Follow the file-by-file checklist in this doc.
4. Run the tests listed under "Verify."
5. Mark sprint done in §6 of KARMA_SYSTEM.md.

---

## Architectural overview (one screen)

```
PlayerState (lib/gameState.ts)
├─ HP / maxHP                       — Integrity-driven (Sprint 2)
├─ currentMana / maxMana            — Illumination-driven (Sprint 2)
├─ stamina / maxStamina             — STR-driven (Sprint 1)  ← STR derives from Passion
├─ fatiguePool                      — accumulator (Sprint 1)
├─ actionBudget                     — per-adventure (Sprint 1)
├─ STR_base / DEX_base / CHA_base   — set at creation (existing)
├─ STR_eff / DEX_eff / CHA_eff      — derived (Sprint 2 — recomputeDerivedStats)
├─ picssi { passion, integrity, courage, standing, spirituality, illumination }  ← (Sprint 2)
├─ npc_affection: Record<slug, num> ← JSONB (Sprint 4)
├─ flags_life, flags_legacy         ← JSONB (Sprint 4)
├─ scrollsRead                      ← JSONB (Sprint 3)
├─ vdActive: boolean                ← (Sprint 3)
└─ scrollsRead.<id>.riddlesPassed   ← string[] (Sprint 3)

NEW MODULES (lib/karma/*)
├─ recompute.ts        — recomputeDerivedStats(state) → state'           (Sprint 1+2)
├─ activities.ts       — registry + applyActivity(state, id) → state'    (Sprint 3)
├─ loader.ts           — loadAtoms() → Atom[]                            (Sprint 4)
├─ triggers.ts         — matchTriggers(state, event) → Atom[]            (Sprint 4)
├─ resolve.ts          — applyChoice(state, atom, choice) → state'       (Sprint 4)
├─ combat-deltas.ts    — table + applyCombatPICSSI(state, event) → state'(Sprint 5)
├─ scrolls.ts          — readScroll, riddleGate                          (Sprint 3)
└─ types.ts            — PicssiState, KarmaDelta, etc.                   (Sprint 2)

EXISTING HOOKS (lib/gameEngine.ts, lib/combatEngine.ts)
├─ tickWorldState                   — gates regen on stamina>0 (Sprint 1)
├─ resolveStrike / resolveCombatRound — drains stamina/fatigue (Sprint 1)
├─ resolveCombatSpell               — Spirituality bonus on HEAL (Sprint 2)
├─ endCombat                        — fatiguePool recovery + PICSSI deltas (Sprint 5)
└─ updateVirtue + 4 mutation points — DELETED in Sprint 2

DB MIGRATIONS (supabase/migrations/*)
├─ Sprint 1 — add stamina/fatiguePool/actionBudget columns
├─ Sprint 2 — add 6 PICSSI cols + STR_base/DEX_base/CHA_base cols + drop 10 legacy cols
├─ Sprint 3 — add vd_active boolean + scrolls_read JSONB
└─ Sprint 4 — add npc_affection + flags_life + flags_legacy JSONB cols
```

---

# Sprint 0 — Preflight (½ day)

**Goal:** Lock the baseline before any production migration.

### Files to touch
- *(none directly; this sprint is audit-only)*

### Tasks
1. **Snapshot DB schema:** `supabase db dump --schema public > supabase/snapshots/pre_karma_2026-04-29.sql` so we can rollback if needed.
2. **Run baseline tests:** `npm run test` (or `npx tsc --noEmit` at minimum). Record passing baseline. Sprint 1+ must keep this green.
3. **Audit existing virtue mutation points** — confirm only 4 exist (per HYDRATE_NEXT_SESSION.md):
   ```bash
   grep -rn "updateVirtue\|virtue.*[+\-]=" lib app components scripts
   ```
   Expected: 4 hits in `gameState.ts` and `gameEngine.ts`. If more, surface them — they all get cold-deleted in Sprint 2.
4. **Verify body-zone install** (data source for Sprint 1):
   ```bash
   ls "/Applications/Heads Will Roll Reforged/game/script_2.rpy"
   ```
   We don't import code, but Sprint 1's stamina cost values are body-zone-derived; we may need to re-grep for clarifications.

### Verify
- [ ] DB snapshot file exists.
- [ ] `npx tsc --noEmit` passes.
- [ ] Mutation point audit matches HYDRATE_NEXT_SESSION.md count.

### Definition of done
Baseline is green and snapshotted. Sprint 1 can begin.

---

# Sprint 1 — Stamina + fatiguePool + actionBudget bedrock (~2–3 days)

**Goal:** Ship the dual-pool stamina system per KARMA_SYSTEM.md §2.3, with body-zone-derived combat penalties (KARMA_SYSTEM.md §4a). PICSSI multipliers do NOT activate yet — that's Sprint 2.

**Dependencies:** Sprint 0.

### DB migration

**File:** `supabase/migrations/20260430100000_karma_stamina_bedrock.sql`

```sql
ALTER TABLE players
  ADD COLUMN stamina         smallint NOT NULL DEFAULT 55,    -- 35 + 2*STR_base (10)
  ADD COLUMN max_stamina     smallint NOT NULL DEFAULT 55,
  ADD COLUMN fatigue_pool    smallint NOT NULL DEFAULT 0,
  ADD COLUMN action_budget   smallint NOT NULL DEFAULT 25;

-- Existing rows: no special migration needed (defaults match a fresh hero).
```

Apply via `./scripts/db-push.sh prod`.

### TypeScript types

**File:** `lib/gameState.ts` — extend `PlayerState`:

```typescript
export interface PlayerState {
  // ...existing fields...
  stamina: number;
  maxStamina: number;
  fatiguePool: number;       // can go negative
  actionBudget: number;      // 0..adventureMaxBudget
}
```

Update `loadPlayerStateFromRow()` (or equivalent) to read the four new columns; default if missing.
Update `savePlayerStateToRow()` to persist them.

### New constants

**File:** `lib/gameState.ts` (alongside HP_REGEN_PER_TURN):

```typescript
// Stamina + fatigue per KARMA_SYSTEM.md §2.3 (body-zone-derived)
export const STAMINA_BASE = 35;
export const STAMINA_PER_STR = 2;
export const ACTION_BUDGET_DEFAULT = 25;     // novice/moderate; tier scaling in Sprint 3
export const FATIGUE_TIER_EVASION_PENALTY = 15;  // the source combat model
```

### New helper module

**File:** `lib/karma/recompute.ts` (new, created this sprint with stamina-only logic; PICSSI added in Sprint 2):

```typescript
import type { PlayerState } from "../gameState";
import { STAMINA_BASE, STAMINA_PER_STR } from "../gameState";

/** Recompute derived stats. Currently STR-only; Sprint 2 extends with PICSSI. */
export function recomputeDerivedStats(p: PlayerState): PlayerState {
  const strEff = p.strength;  // pre-PICSSI; Sprint 2 layers Passion-add
  const newMaxStamina = STAMINA_BASE + STAMINA_PER_STR * strEff;
  return {
    ...p,
    maxStamina: newMaxStamina,
    // currentStamina stays flat per KARMA_SYSTEM.md §4a "caps raise, current stays flat"
    stamina: Math.min(p.stamina, newMaxStamina),
  };
}

/** Compute fatigue tier per the source body-zone combat model (KARMA_SYSTEM.md §2.3 / §4a) */
export function fatigueLevel(p: PlayerState): 0 | 1 | 2 | 3 | 4 {
  const m = p.maxStamina;
  if (p.fatiguePool <= -m * 4) return 4;
  if (p.fatiguePool <= -m * 3) return 3;
  if (p.fatiguePool <= -m * 2) return 2;
  if (p.fatiguePool <= -m * 1) return 1;
  return 0;
}
```

### Combat hook — strike drains stamina + fatiguePool

**File:** `lib/combatEngine.ts:resolveStrike` (around line 318 where damage is computed):

After successful strike resolution (whether hit or miss), drain:
```typescript
const stamCost = weaponStaminaCost(state.player.weapon);  // see KARMA_SYSTEM.md §2.3 weapon table
state.player.stamina = Math.max(0, state.player.stamina - stamCost);
state.player.fatiguePool -= stamCost;
```

Add `weaponStaminaCost(weaponId): number` helper. **Initial values:** use ~10 for short_sword, ~13 for long_sword, ~18 for great_sword (interpolated from the source body-zone combat model per-weapon table in §2.3). Tunable.

### Combat hook — Tier 4 blocks player turn

**File:** `lib/combatEngine.ts:resolveCombatRound` — at the top:

```typescript
if (fatigueLevel(state.player) === 4) {
  return {
    ...state,
    narration: "You are utterly exhausted. You cannot raise your arms. Rest, or die.",
    playerTurnSkipped: true,
  };
}
```

### Combat hook — fatigue evasion penalty against player

**File:** `lib/combatEngine.ts:resolveStrike` — when an enemy strikes the player, add `+15 × fatigueLevel(player)` to the enemy's hit chance (per the source body-zone combat model `script_2.rpy:11110`).

```typescript
const fatiguePenalty = fatigueLevel(defender) * FATIGUE_TIER_EVASION_PENALTY;
const enemyHitChance = baseHit + fatiguePenalty;
```

### Combat-end hook — fatiguePool partial recovery

**File:** `lib/combatEngine.ts:endCombat` (or wherever combat resolves):

```typescript
const enemiesKilled = combatLog.enemiesDefeated.length;
const recovery = enemiesKilled > 0
  ? enemiesKilled * state.player.maxStamina * 1.5
  : state.player.maxStamina * 0.5;
state.player.fatiguePool = Math.min(0, state.player.fatiguePool + recovery);
state.player.stamina = state.player.maxStamina;  // full restore at fight end
```

### tickWorldState hook — gate regen on stamina

**File:** `lib/gameState.ts:tickWorldState` (~line 1050):

```typescript
// Existing:
//   const nextHp = Math.min(p.maxHp, p.hp + HP_REGEN_PER_TURN);
// Modify to gate on stamina:
const regenActive = p.stamina > 0 && !state.activeCombat;
const nextHp = regenActive ? Math.min(p.maxHp, p.hp + HP_REGEN_PER_TURN) : p.hp;
const nextMana = regenActive ? Math.min(maxMana, p.currentMana + MANA_REGEN_PER_TURN) : p.currentMana;
```

### Adventure return hook — reset actionBudget

**File:** `lib/adventures/registry.ts` (or wherever the player returns to Ostavar):

When the player enters Ostavar (the hub), set `state.player.actionBudget = ACTION_BUDGET_DEFAULT` (Sprint 3 will replace with tier-aware value).

### UI surfacing (minimal — Sprint 6 polishes)

**File:** `app/page.tsx` STATS panel:

Add three lines:
- `Stamina: {p.stamina} / {p.maxStamina}`
- `Fatigue: tier {fatigueLevel(p)}` (with tooltip listing penalty)
- `Actions left: {p.actionBudget} / 25`

### Tests

**File:** `__tests__/karma/stamina.test.ts` (new):

- `recomputeDerivedStats` returns expected `maxStamina` for STR 6/10/15/20.
- `fatigueLevel` returns the right tier across boundary conditions.
- `tickWorldState` does NOT regen HP when stamina = 0.
- Combat strike drains stamina by weapon-specific cost.
- After-combat recovery formula (per kill × 1.5) populates `fatiguePool` correctly.
- Tier 4 blocks `resolveCombatRound`.

### Verify (Definition of Done)

- [ ] `npx tsc --noEmit` green.
- [ ] All new tests pass.
- [ ] Existing tests still pass.
- [ ] Manual playtest: enter combat, observe stamina ticking down with each strike; flee or kill; observe fatigue tier display; rest a few turns to confirm regen behavior.
- [ ] DB migration applied to dev; existing players load with stamina=55, fatiguePool=0, actionBudget=25.

---

# Sprint 2 — PICSSI bedrock + cold-delete of legacy 10-virtue (~2–3 days)

**Goal:** Add the six PICSSI virtue stocks, wire their derived effects per KARMA_SYSTEM.md §2.4–§2.10, and cold-delete the legacy 10-virtue ledger in the same PR.

**Dependencies:** Sprint 1.

### DB migration (one transaction)

**File:** `supabase/migrations/20260501100000_picssi_bedrock_and_legacy_drop.sql`

> **Note:** `picssi_standing` is **already added** by the bridge migration `20260429210000_picssi_standing_bridge.sql` (per Scotch's 2026-04-29 Honor → Standing deprecation). Sprint 2 adds the remaining **5** PICSSI columns.

```sql
-- ── Add the remaining 5 PICSSI cols (standing already exists) ──────
ALTER TABLE players
  ADD COLUMN picssi_passion        smallint NOT NULL DEFAULT 0 CHECK (picssi_passion        BETWEEN 0   AND 100),
  ADD COLUMN picssi_integrity      smallint NOT NULL DEFAULT 0 CHECK (picssi_integrity      BETWEEN 0   AND 100),
  ADD COLUMN picssi_courage        smallint NOT NULL DEFAULT 0 CHECK (picssi_courage        BETWEEN 0   AND 100),
  ADD COLUMN picssi_spirituality   smallint NOT NULL DEFAULT 0 CHECK (picssi_spirituality   BETWEEN 0   AND 100),
  ADD COLUMN picssi_illumination   smallint NOT NULL DEFAULT 0 CHECK (picssi_illumination   BETWEEN -100 AND 100);

-- ── Drop legacy 10-virtue ledger ────────────────────────────────────
ALTER TABLE players
  DROP COLUMN IF EXISTS honesty,
  DROP COLUMN IF EXISTS compassion,
  DROP COLUMN IF EXISTS valor,
  DROP COLUMN IF EXISTS justice,
  DROP COLUMN IF EXISTS sacrifice,
  DROP COLUMN IF EXISTS honor,
  DROP COLUMN IF EXISTS spirituality,    -- legacy 10-virtue spirituality (different from picssi_spirituality)
  DROP COLUMN IF EXISTS humility,
  DROP COLUMN IF EXISTS grace,
  DROP COLUMN IF EXISTS mercy;
```

If the legacy virtues live in a JSONB `virtues` column instead, drop that column instead. Verify before running with: `\d+ players` in psql.

### TypeScript types

**File:** `lib/karma/types.ts` (new):

```typescript
export type PicssiUnipolarVirtue = "passion" | "integrity" | "courage" | "standing" | "spirituality";
export type PicssiVirtue = PicssiUnipolarVirtue | "illumination";

export interface PicssiState {
  passion: number;       // 0..100
  integrity: number;     // 0..100
  courage: number;       // 0..100
  standing: number;      // 0..100
  spirituality: number;  // 0..100
  illumination: number;  // -100..+100
}

export type KarmaDelta = Partial<Record<PicssiVirtue, number>>;
```

**File:** `lib/gameState.ts` — modify `PlayerState`:

```typescript
export interface PlayerState {
  // ...existing fields, MINUS the 10 legacy virtue keys...
  picssi: PicssiState;
  strBase: number;       // renamed from `strength` for clarity (existing field repurposed)
  dexBase: number;
  chaBase: number;
  strEffective: number;  // computed; persisted for performance
  dexEffective: number;
  chaEffective: number;
}
```

Migration plan for `strength`/`dexterity`/`charisma`:
- Keep DB column names as-is (or rename in this same migration).
- TS field names: `strBase`, `dexBase`, `chaBase`. Map at load/save boundary.
- `strEffective` etc. computed on every save; do NOT persist to DB if pre/post-load is fast enough (recomputeDerivedStats runs on load).

Decision: **don't persist *_effective to DB**, recompute on load. Saves migration complexity.

### Helpers

**File:** `lib/karma/recompute.ts` — extend:

```typescript
import type { PlayerState } from "../gameState";
import type { PicssiState, KarmaDelta, PicssiVirtue } from "./types";

export function clampPicssi(virtue: PicssiVirtue, value: number): number {
  if (virtue === "illumination") return Math.max(-100, Math.min(100, value));
  return Math.max(0, Math.min(100, value));
}

export function applyKarma(p: PlayerState, delta: KarmaDelta): PlayerState {
  const newPicssi: PicssiState = { ...p.picssi };
  for (const [virtue, d] of Object.entries(delta)) {
    if (d === 0 || d === undefined) continue;
    const v = virtue as PicssiVirtue;
    newPicssi[v] = clampPicssi(v, newPicssi[v] + d);
  }
  return recomputeDerivedStats({ ...p, picssi: newPicssi });
}

export function recomputeDerivedStats(p: PlayerState): PlayerState {
  // KARMA_SYSTEM.md §4a: STR_eff = STR_base + min(10, floor(Passion/10))
  const strEff = p.strBase + Math.min(10, Math.floor(p.picssi.passion / 10));
  const dexEff = p.dexBase + Math.min(10, Math.floor(p.picssi.courage / 10));
  const chaEff = p.chaBase + Math.min(10, Math.floor(p.picssi.standing / 10));

  // KARMA_SYSTEM.md §2.1: maxHP = 50 + 2·Integrity
  const newMaxHp = 50 + 2 * p.picssi.integrity;
  // KARMA_SYSTEM.md §2.2: maxMana = 10 + |Illumination|/2 + combat-victory bonus
  const newMaxMana = 10 + Math.floor(Math.abs(p.picssi.illumination) / 2) + (p.combatVictories ?? 0);
  // KARMA_SYSTEM.md §2.3: maxStamina = 35 + 2·STR_eff
  const newMaxStamina = 35 + 2 * strEff;

  return {
    ...p,
    strEffective: strEff,
    dexEffective: dexEff,
    chaEffective: chaEff,
    maxHp: newMaxHp,
    maxMana: newMaxMana,
    maxStamina: newMaxStamina,
    // Caps raise; current values stay flat (KARMA_SYSTEM.md §4a recompute semantics)
    hp: Math.min(p.hp, newMaxHp),
    currentMana: Math.min(p.currentMana, newMaxMana),
    stamina: Math.min(p.stamina, newMaxStamina),
  };
}
```

Note: `combatVictories` may need to be added to PlayerState if not already there (it's the +1-per-kill maxMana grower). Check existing code.

### Cold-delete legacy virtue mutations

Search and remove:

```bash
grep -rn "updateVirtue\|updateVirtueLite" lib app components scripts
```

**Confirmed hits (from Sprint 0 audit, 2026-04-29 — see `supabase/snapshots/sprint_0_audit_2026-04-29.md`):**

Call sites (5, **not 4** as HYDRATE_NEXT_SESSION.md previously claimed):
- `lib/gameEngine.ts:4052` — Honor steal mutation → DELETE call
- `lib/gameEngine.ts:4215` — Honor garment mutation → DELETE call
- `lib/gameEngine.ts:4716` — Valor on victory → DELETE call (replaced by combat-deltas in Sprint 5)
- `lib/gameState.ts:1070` — Honor decay (gray robe) → DELETE call
- `lib/combatEngine.ts:994` — Honor (POWER spell "An Unwanted Vision" outcome) → DELETE call **(missed by prior session count; caught in Sprint 0 audit)**

Helper / import (3):
- `lib/gameState.ts:731` — `export function updateVirtue` → DELETE definition
- `lib/combatEngine.ts:1099` — `function updateVirtueLite` → DELETE definition
- `lib/gameEngine.ts:42` — `import { updateVirtue, ... }` → REMOVE from import list

Replace each call site with a `// TODO(Sprint 5/3): wire to PICSSI applyKarma()` comment so we don't lose the intent.

### combatEngine.ts changes — Spirituality boosts HEAL

**File:** `lib/combatEngine.ts:resolveCombatSpell` — HEAL branch (~line 1180):

```typescript
// Existing: const healAmount = randInt(18, 32);
const baseHeal = randInt(18, 32);
const spiritMultiplier = 1 + 0.005 * state.player.picssi.spirituality;  // KARMA_SYSTEM.md §2.1
const healAmount = Math.round(baseHeal * spiritMultiplier);
```

### Hooks — call recomputeDerivedStats

Every PlayerState load path must call `recomputeDerivedStats(p)` once after loading. Locations:
- `lib/gameState.ts` — load function (whichever reads from DB)
- `app/api/chat/route.ts` — anywhere PlayerState is reconstructed mid-request

Every karma mutation must go through `applyKarma()` (which internally calls recompute). NEVER mutate PICSSI fields directly.

### Tests

**File:** `__tests__/karma/picssi.test.ts`:

- `clampPicssi` clamps unipolar to 0..100, bipolar (illumination) to ±100.
- `applyKarma({ courage: 5 })` adds 5, clamps if past 100.
- `recomputeDerivedStats` produces correct STR_eff, DEX_eff, maxHP, maxMana, maxStamina at boundary virtue values.
- After applying karma that raises a cap, `currentHP` (etc.) stays flat — does NOT auto-fill.
- HEAL spell with Spirituality 100 outputs 1.5× base.

### Verify

- [ ] `npx tsc --noEmit` green.
- [ ] All Sprint 1 tests still pass.
- [ ] All Sprint 2 tests pass.
- [ ] `grep -rn "updateVirtue\|updateVirtueLite\|honesty\|valor\|honor.*[+\-]=" lib app` returns 0 hits.
- [ ] Existing players load post-migration with default-0 PICSSI; no crashes.
- [ ] Manual playtest: confirm PICSSI fields appear on PlayerState in dev console; karma changes via direct setState mutate maxHP/maxMana correctly.

---

# Sprint 3 — Activity dispatcher + Brothel/VD + Scrolls READ command (~3 days)

**Goal:** Wire the rest economy. Player commands like `PRAY`, `DRINK`, `BROTHEL`, `READ <scroll>` execute through one dispatcher that consumes `actionBudget`, restores stamina, applies PICSSI deltas, and triggers any side effects (VD, scroll-riddle gate, etc.).

**Dependencies:** Sprint 2.

### DB migration

**File:** `supabase/migrations/20260502100000_karma_activity_state.sql`

```sql
ALTER TABLE players
  ADD COLUMN vd_active     boolean NOT NULL DEFAULT false,
  ADD COLUMN scrolls_read  jsonb   NOT NULL DEFAULT '{}';

-- scrolls_read schema:
--   { "thoth-1": { "firstReadAt": "ISO-8601", "riddlesPassed": ["riddle-id-1", ...] }, ... }
```

### Activity registry

**File:** `lib/karma/activities.ts` (new):

```typescript
import type { PlayerState } from "../gameState";
import type { KarmaDelta } from "./types";
import { applyKarma } from "./recompute";

export interface Activity {
  id: string;
  command: string;          // e.g., "PRAY", "DRINK"
  actionCost: number;       // typically 1; bathhouse = 2
  goldCost?: number;
  requiresItem?: string;    // e.g., "ale" for DRINK
  staminaResult: "full" | "drain";
  fatiguePoolDelta: (p: PlayerState) => number;  // formula per activity
  picssiDelta: KarmaDelta;
  picssiLoss?: KarmaDelta;
  sideEffect?: (p: PlayerState) => PlayerState;  // VD roll, scroll gate, etc.
  availableInRoom?: (roomId: string) => boolean;
}

// Activities per KARMA_SYSTEM.md §2.3 recovery table.
// Stamina-restored values: body-zone combat-direct multipliers of maxStamina.
export const ACTIVITIES: Activity[] = [
  {
    id: "hang-around",
    command: "REST",
    actionCost: 1,
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 0.5),
    picssiDelta: {},
  },
  {
    id: "pray",
    command: "PRAY",
    actionCost: 1,
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 0.29),
    picssiDelta: { spirituality: 1 },
    availableInRoom: roomId => /temple|chapel|shrine/.test(roomId),
  },
  {
    id: "pray-fertility",
    command: "PRAY",  // same command; chosen if in fertility temple
    actionCost: 1,
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 0.29),
    picssiDelta: { spirituality: 1 },
    sideEffect: p => maybeFertilityCureVD(p),  // higher chance than other temples
    availableInRoom: roomId => roomId === "fertility-temple",
  },
  {
    id: "drink",
    command: "DRINK",
    actionCost: 1,
    requiresItem: "ale-or-wine",
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 2.0),
    picssiDelta: { passion: 1 },
  },
  {
    id: "drink-rounds",
    command: "DRINK",  // disambiguated by tavern + companions present
    actionCost: 1,
    requiresItem: "ale-or-wine",
    goldCost: 30,  // extra rounds
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 2.0),
    picssiDelta: { passion: 1, standing: 2 },  // generosity bonus
  },
  {
    id: "brothel",
    command: "BROTHEL",
    actionCost: 1,
    goldCost: 45,
    staminaResult: "full",
    fatiguePoolDelta: () => 0,  // full reset (per body-zone combat)
    picssiDelta: { passion: 3, courage: 1 },     // Notable Passion + minor Courage (real risk)
    picssiLoss: { spirituality: 3 },             // Notable −Spirituality
    sideEffect: p => maybeContractVD(p),
    availableInRoom: roomId => /brothel|fertility-temple/.test(roomId),
  },
  {
    id: "gamble",
    command: "GAMBLE",
    actionCost: 1,
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 0.67),
    picssiDelta: { passion: 1, courage: 1 },     // small risk-of-loss bonus
    sideEffect: p => resolveGamble(p),
  },
  {
    id: "hunt",
    command: "HUNT",
    actionCost: 1,
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 0.67),
    picssiDelta: { passion: 2 },
    sideEffect: p => resolveHunt(p),  // injury risk + game/hide loot
  },
  {
    id: "bathhouse",
    command: "BATHE",
    actionCost: 2,
    goldCost: 55,
    staminaResult: "full",
    fatiguePoolDelta: p => Math.floor(p.maxStamina * 2.0),
    picssiDelta: { standing: 2 },                // luxury association
    availableInRoom: roomId => roomId === "bathhouse",
  },
  {
    id: "donate-temple",
    command: "DONATE",
    actionCost: 1,
    goldCost: 50,                                 // configurable per donation amount
    staminaResult: "full",  // "rest activity" framing — quick break
    fatiguePoolDelta: () => 0,  // not really restorative
    picssiDelta: { standing: 2 },                // PER chat: temple donations grow Standing, NOT Spirituality (canonical irony)
    availableInRoom: roomId => /temple|chapel|shrine/.test(roomId),
  },
  {
    id: "mortify-flesh",
    command: "MORTIFY",
    actionCost: 1,
    staminaResult: "full",
    fatiguePoolDelta: p => p.maxStamina,          // 1.0×
    picssiDelta: { spirituality: 3 },             // Notable
    sideEffect: p => ({ ...p, hp: Math.max(1, p.hp - 5) }),  // self-harm
  },
];

export function applyActivity(state: WorldState, activityId: string): WorldState {
  const act = ACTIVITIES.find(a => a.id === activityId);
  if (!act) throw new Error(`Unknown activity ${activityId}`);
  const p = state.player;

  // Pre-checks
  if (p.actionBudget < act.actionCost) return rejectActivity(state, "Out of actions. Return to Ostavar.");
  if (act.goldCost && p.gold < act.goldCost) return rejectActivity(state, "Not enough gold.");
  if (act.requiresItem && !hasItem(p, act.requiresItem)) return rejectActivity(state, `You need a ${act.requiresItem}.`);

  // Apply
  let newP: PlayerState = { ...p };
  newP.actionBudget -= act.actionCost;
  if (act.goldCost) newP.gold -= act.goldCost;
  if (act.staminaResult === "full") newP.stamina = newP.maxStamina;
  newP.fatiguePool = Math.min(0, newP.fatiguePool + act.fatiguePoolDelta(newP));

  newP = applyKarma(newP, act.picssiDelta);
  if (act.picssiLoss) {
    const loss = Object.fromEntries(
      Object.entries(act.picssiLoss).map(([k, v]) => [k, -v])
    ) as KarmaDelta;
    newP = applyKarma(newP, loss);
  }

  if (act.sideEffect) newP = act.sideEffect(newP);

  return { ...state, player: newP };
}
```

### Brothel + VD helpers

**File:** `lib/karma/brothel.ts` (new):

```typescript
const VD_CONTRACT_CHANCE = 0.075;  // 7.5%; tunable per KARMA_SYSTEM.md §2.13a / GAME_DESIGN.md §13

export function maybeContractVD(p: PlayerState): PlayerState {
  if (p.vdActive) return p;  // already active, no stack
  if (Math.random() < VD_CONTRACT_CHANCE) return { ...p, vdActive: true };
  return p;
}

export function maybeFertilityCureVD(p: PlayerState): PlayerState {
  if (!p.vdActive) return p;
  // High base chance, scaled by Spirituality.
  const cureChance = 0.7 + 0.003 * p.picssi.spirituality;  // 70% base, +30% at Spirit 100
  if (Math.random() < cureChance) return { ...p, vdActive: false };
  return p;
}

export function maybeGenericTempleCureVD(p: PlayerState): PlayerState {
  if (!p.vdActive) return p;
  const cureChance = 0.15 + 0.005 * p.picssi.spirituality;  // lower; Spirit-scaled
  if (Math.random() < cureChance) return { ...p, vdActive: false };
  return p;
}

export function cureVDOnHeal(p: PlayerState): PlayerState {
  return { ...p, vdActive: false };
}
```

### Hook HEAL spell to cure VD

**File:** `lib/combatEngine.ts:resolveCombatSpell` — HEAL branch — after applying heal:
```typescript
state.player = cureVDOnHeal(state.player);
```

### VD STR penalty

**File:** `lib/karma/recompute.ts` — modify `recomputeDerivedStats`:

```typescript
const vdPenalty = p.vdActive ? 2 : 0;
const strEff = Math.max(6, p.strBase + Math.min(10, Math.floor(p.picssi.passion / 10)) - vdPenalty);
```

Floored at 6 to keep player playable.

### Scrolls of Thoth — READ command + riddle gate

**File:** `lib/karma/scrolls.ts` (new):

```typescript
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export interface Scroll {
  id: string;             // e.g., "thoth-1"
  scrollNumber: number;   // 1..15
  title: string;
  illuminationDelta: number;
  riddles: Array<{ prompt: string; answer: string }>;
  body: string;           // markdown body
}

const SCROLLS_DIR = path.join(process.cwd(), "lore", "scrolls-of-thoth");
let cached: Scroll[] | null = null;

export function loadScrolls(): Scroll[] {
  if (cached) return cached;
  const files = fs.readdirSync(SCROLLS_DIR).filter(f => f.startsWith("scroll-") && f.endsWith(".md"));
  cached = files.map(f => {
    const raw = fs.readFileSync(path.join(SCROLLS_DIR, f), "utf8");
    const [_, fmText, body] = raw.split(/^---\s*$/m, 3);
    const fm = yaml.load(fmText) as Omit<Scroll, "body" | "id"> & { scrollNumber: number };
    return {
      id: `thoth-${fm.scrollNumber}`,
      scrollNumber: fm.scrollNumber,
      title: fm.title,
      illuminationDelta: fm.illuminationDelta,
      riddles: fm.riddles,
      body: body.trim(),
    };
  });
  return cached;
}

export function readScroll(state: WorldState, scrollId: string): WorldState {
  const scroll = loadScrolls().find(s => s.id === scrollId);
  if (!scroll) return rejectActivity(state, "No such scroll.");

  const alreadyRead = state.player.scrollsRead?.[scrollId];
  if (alreadyRead && alreadyRead.riddlesPassed.length >= scroll.riddles.length) {
    return appendNarration(state, `You have already learned all you can from this scroll.`);
  }

  // Render scroll body as in-game text
  let newState = appendNarration(state, scroll.body);
  // Defer Illumination until riddle is passed — see riddleGate
  newState = setPendingRiddle(newState, scrollId, pickUnpassedRiddle(scroll, alreadyRead));
  return newState;
}

export function answerRiddle(state: WorldState, attempt: string): WorldState {
  const pending = state.pendingRiddle;
  if (!pending) return state;
  const scroll = loadScrolls().find(s => s.id === pending.scrollId)!;
  const riddle = scroll.riddles[pending.riddleIdx];
  const ok = fuzzyMatch(attempt, riddle.answer);
  if (!ok) return appendNarration(clearPendingRiddle(state), "That is not what the scroll teaches.");

  // Mark as passed, award Illumination
  let newP = { ...state.player };
  newP.scrollsRead = {
    ...newP.scrollsRead,
    [pending.scrollId]: {
      firstReadAt: newP.scrollsRead[pending.scrollId]?.firstReadAt ?? new Date().toISOString(),
      riddlesPassed: [...(newP.scrollsRead[pending.scrollId]?.riddlesPassed ?? []), riddle.answer.toLowerCase()],
    },
  };
  // Only award Illumination on first riddle pass per scroll
  const isFirstRiddleForScroll = (newP.scrollsRead[pending.scrollId].riddlesPassed.length === 1);
  if (isFirstRiddleForScroll) {
    newP = applyKarma(newP, { illumination: scroll.illuminationDelta });
  }
  return appendNarration(clearPendingRiddle({ ...state, player: newP }), `Wisdom flows. Your soul brightens.`);
}

function fuzzyMatch(attempt: string, expected: string): boolean {
  const norm = (s: string) => s.toLowerCase().trim().replace(/^(the|a|an)\s+/, "");
  return norm(attempt) === norm(expected);
}
```

Add `js-yaml` to package.json if not present: `npm i js-yaml @types/js-yaml`.

### Player command wiring

**File:** `app/api/chat/route.ts` (or wherever player commands are parsed):

Add a command parser branch for the new tokens: `PRAY`, `DRINK`, `BROTHEL`, `GAMBLE`, `HUNT`, `BATHE`, `DONATE`, `MORTIFY`, `READ`, `REST`. Each routes to `applyActivity` or `readScroll`. When `pendingRiddle` is set, the next command is the riddle answer (route to `answerRiddle`).

### Adventure tier → actionBudget

**File:** `lib/adventures/registry.ts`:

Add to each adventure metadata:
```typescript
tier: "novice" | "moderate" | "deadly"
```

When entering an adventure, set `actionBudget` per the tier table in KARMA_SYSTEM.md §4c:
- novice = 20
- moderate = 25
- deadly = 30

### Standing-from-wealth + Standing-from-gear

**File:** `lib/karma/recompute.ts` — extend `recomputeDerivedStats`:

```typescript
function standingFromWealth(gold: number): number {
  if (gold >= 100000) return 30;
  if (gold >= 25000) return 20;
  if (gold >= 5000) return 10;
  if (gold >= 1000) return 5;
  return 0;
}

function standingFromGear(p: PlayerState): number {
  let total = 0;
  for (const slot of EQUIPPED_SLOTS) {
    const item = p[slot];
    if (!item) continue;
    let bonus = Math.floor(item.goldValue / 100);
    if (item.tags?.includes("jewelry") || item.tags?.includes("flashy")) bonus *= 2;
    total += bonus;
  }
  return Math.min(20, total);
}

// In recomputeDerivedStats:
const standingPassive = standingFromWealth(p.gold) + standingFromGear(p);
const standingEff = Math.min(100, p.picssi.standing + standingPassive);  // passive bonus on top
```

Hmm — passive bonuses on top of the virtue means CHA_eff and shop discounts read `standingEff` not `picssi.standing` directly. The base virtue `picssi.standing` only changes via atom choices and active deeds; passive sources contribute to a *displayed* / *effective* Standing. KARMA_SYSTEM.md §2.8 should be cross-checked on this — but for v1 we treat `picssi.standing` as the persistent stock and compute `standingEffective` similarly to STR/DEX.

### Tests

**File:** `__tests__/karma/activities.test.ts`:

- `applyActivity('pray')` decrements actionBudget, sets stamina to max, +Spirituality.
- Brothel reduces Spirituality, may set `vdActive`.
- Bathhouse costs 2 actions, +Standing, requires `bathhouse` room.
- HEAL spell on VD-active player clears `vdActive`.
- READ + correct answer = +Illumination on first read; +0 on second.
- READ + wrong answer = no Illumination.
- Wealth threshold transitions affect `standingEffective` correctly.

### Verify

- [ ] All tests pass.
- [ ] DB migration applied (vd_active, scrolls_read columns exist).
- [ ] Manual playtest: enter the Pots & Bobbles → DRINK → +Passion. Pray at temple → +Spirituality. READ scroll-of-thoth-1 → reads body + asks riddle → answer → +Illumination.

---

# Sprint 4 — Encounter loader + trigger matcher + choice resolution + NPC affection + flags (~3–4 days)

**Goal:** Wire the encounter library at `scripts/balance/library/*.json` to runtime. Atoms fire on game events, present choices to the player, and apply karma deltas.

**Dependencies:** Sprint 3.

### DB migration

**File:** `supabase/migrations/20260503100000_karma_world_state.sql`

```sql
ALTER TABLE players
  ADD COLUMN npc_affection jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN flags_life    jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN flags_legacy  jsonb NOT NULL DEFAULT '{}';
```

### New modules

**File:** `lib/karma/loader.ts`

```typescript
import fs from "node:fs";
import path from "node:path";
import type { Encounter } from "./atom-types";  // imported from scripts/balance/types.ts

const ATOMS_DIR = path.join(process.cwd(), "scripts", "balance", "library");
let cached: Encounter[] | null = null;

export function loadAtoms(): Encounter[] {
  if (cached) return cached;
  const files = fs.readdirSync(ATOMS_DIR).filter(f => f.endsWith(".json"));
  cached = files.map(f => JSON.parse(fs.readFileSync(path.join(ATOMS_DIR, f), "utf8")));
  return cached;
}
```

**File:** `lib/karma/atom-types.ts` — re-export the types from `scripts/balance/types.ts` (or symlink). For cleanliness, MOVE the type definitions FROM `scripts/balance/types.ts` INTO `lib/karma/atom-types.ts` and have the design-time simulator import from `lib/karma/atom-types.ts`. One source of truth for the schema.

**File:** `lib/karma/triggers.ts`

```typescript
import type { Encounter, TriggerSpec } from "./atom-types";
import type { WorldState } from "../gameState";

export type KarmaEvent =
  | { type: "enter-room"; roomId: string }
  | { type: "talk-to-npc"; npcId: string }
  | { type: "combat-start"; enemyTypes: string[] }
  | { type: "combat-end"; victory: boolean; enemiesKilled: number; alliesAbandoned: number }
  | { type: "command"; verb: string; args: string[] }
  | { type: "tick" };

export function matchTriggers(state: WorldState, event: KarmaEvent, atoms: Encounter[]): Encounter[] {
  return atoms.filter(atom => {
    if (!checkPrerequisites(state, atom)) return false;
    return atom.triggers.some(t => triggerMatches(t, event));
  });
}

function triggerMatches(t: TriggerSpec, event: KarmaEvent): boolean {
  if (t.type !== event.type) return false;
  // ... per-trigger-type matching logic
}

function checkPrerequisites(state: WorldState, atom: Encounter): boolean {
  if (!atom.prerequisites) return true;
  for (const pre of atom.prerequisites) {
    // 'has-item', 'karma-min', 'flag-set', 'hp-min', etc.
    if (!checkPrereq(state, pre)) return false;
  }
  return true;
}
```

**File:** `lib/karma/resolve.ts`

```typescript
import type { Encounter, Choice } from "./atom-types";
import { applyKarma } from "./recompute";

export function applyChoice(state: WorldState, atom: Encounter, choice: Choice): WorldState {
  let newState = { ...state };
  let newP = { ...newState.player };

  // 1. PICSSI deltas
  newP = applyKarma(newP, choice.karma);

  // 2. NPC affection deltas
  if (choice.npcAffection) {
    newP.npcAffection = { ...newP.npcAffection };
    for (const [slug, delta] of Object.entries(choice.npcAffection)) {
      const cur = newP.npcAffection[slug] ?? 0;
      newP.npcAffection[slug] = Math.max(-50, Math.min(100, cur + delta));
    }
  }

  // 3. Flag set (life vs legacy scope)
  if (choice.flagsSet) {
    for (const flag of choice.flagsSet) {
      const target = flag.scope === "legacy" ? newP.flagsLegacy : newP.flagsLife;
      target[flag.key] = true;
    }
  }

  // 4. Gold/HP deltas
  if (choice.goldDelta) newP.gold += choice.goldDelta;
  if (choice.hpDelta)  newP.hp = Math.max(0, Math.min(newP.maxHp, newP.hp + choice.hpDelta));

  // 5. Item gain/loss
  if (choice.itemsGained) for (const item of choice.itemsGained) addItem(newP, item);
  if (choice.itemsLost)   for (const item of choice.itemsLost)   removeItem(newP, item);

  // 6. Affect axes (for vibes/UI; not consumed by engine v1)
  // ...

  return { ...newState, player: newP };
}
```

### Hook into gameEngine

**File:** `lib/gameEngine.ts` — every player command emits a karma event:

```typescript
// At the top of processCommand or equivalent:
const event: KarmaEvent = { type: "command", verb, args };
const triggered = matchTriggers(state, event, loadAtoms());
if (triggered.length > 0) {
  // Present the first matching atom's choices to the player
  // (or queue, with priority)
  return presentAtom(state, triggered[0]);
}
```

Same hook for `enter-room`, `talk-to-npc`, `combat-end`.

### Death — clear life-scope flags + reset PICSSI + reset npc_affection

**File:** `lib/gameEngine.ts` (or wherever death is processed):

```typescript
function onDeath(state: WorldState): WorldState {
  return {
    ...state,
    player: {
      ...state.player,
      picssi: { passion:0, integrity:0, courage:0, standing:0, spirituality:0, illumination:0 },
      flagsLife: {},
      // flagsLegacy preserved
      npcAffection: {},
      vdActive: false,
      scrollsRead: {},  // arguable — could also be legacy. Per-life for v1.
    },
  };
}
```

Decision: scrollsRead is per-life for v1 (the hero forgets all books on rebirth — feels right thematically with the Perpetual Hero arc). Easy to flip to legacy later.

### Tests

**File:** `__tests__/karma/atoms.test.ts`:

- Loader reads all 7 atoms without throwing.
- `matchTriggers` returns atoms whose trigger matches the event.
- `applyChoice` mutates PICSSI, affection, flags correctly.
- Death clears life-scope state but preserves legacy.

### Verify

- [ ] All atom JSONs validate against the schema (loader doesn't throw).
- [ ] At least one atom (e.g., `vivian-notice-board-meet.json`) actually fires in playtest when entering the right room.
- [ ] Choosing an option mutates PICSSI as designed.
- [ ] `scripts/balance/types.ts` is now a re-export of `lib/karma/atom-types.ts` (or moved entirely).

---

# Sprint 5 — Combat-PICSSI generation + per-ally Flee + ordered retreat (~3 days)

**Goal:** Wire the in-combat surface area for PICSSI growth. Combat events emit deltas per the table in KARMA_SYSTEM.md §4c.

**Dependencies:** Sprint 4 (atom resolution path), Sprint 2 (applyKarma).

### New module

**File:** `lib/karma/combat-deltas.ts`

```typescript
import type { KarmaDelta } from "./types";

export interface CombatDeltaContext {
  victory: boolean;
  enemiesKilled: number;
  enemyCount: number;       // count at fight start (for "great odds" detection)
  fled: boolean;
  alliesAtStart: number;
  alliesFledFirst: boolean; // ordered retreat
  alliesAbandoned: number;  // fled + ¬alliesFledFirst
  killedFriendly: boolean;
  killedDarkBeing: boolean; // daemon, undead, sorceror, dark cultist tag
  killedInnocent: boolean;
  defendedAlly: boolean;
  activeIntegrityContract: boolean;
  contractCompleted: boolean;
  playerLost: boolean;       // stand-and-lose
}

export function computeCombatDeltas(ctx: CombatDeltaContext): KarmaDelta[] {
  const out: KarmaDelta[] = [];
  if (ctx.victory && ctx.enemiesKilled > 0) {
    out.push({ passion: ctx.enemiesKilled });  // routine kill +1 each
    if (ctx.enemyCount >= 4) out.push({ standing: 5, courage: 5 });
    else if (ctx.enemyCount >= 2) out.push({ standing: 3 });
  }
  if (ctx.victory && ctx.contractCompleted && ctx.activeIntegrityContract) {
    out.push({ integrity: 3 });
  }
  if (ctx.killedDarkBeing) out.push({ illumination: 3 });
  if (ctx.killedInnocent) out.push({ illumination: -5, standing: -5 });
  if (ctx.killedFriendly) out.push({ integrity: -10, illumination: -10, standing: -10 });
  if (ctx.defendedAlly) out.push({ courage: 1, standing: 1 });

  if (ctx.fled) {
    if (ctx.alliesAbandoned > 0) {
      // Triple penalty
      out.push({ courage: -10, standing: -10, integrity: -5 });
    } else if (ctx.alliesFledFirst || ctx.alliesAtStart === 0) {
      // Solo flee or ordered retreat
      out.push({ courage: -1 });
      if (!ctx.alliesFledFirst) out.push({ standing: -1 });  // solo: also -1 Standing
    } else if (ctx.enemyCount >= 4) {
      out.push({ courage: -3, standing: -3 });
    } else {
      out.push({ courage: -1, standing: -1 });
    }
  }

  if (ctx.playerLost && !ctx.fled) {
    if (ctx.enemyCount >= 4) out.push({ courage: 10, standing: -3 });
    else out.push({ courage: 5, standing: -3 });
  }

  return out;
}
```

### Per-ally Flee command

**File:** `lib/combatTypes.ts` — extend `Ally` interface with `hasFled: boolean` field.

**File:** `lib/combatEngine.ts` — add command handler:
```typescript
function handleFleeAlly(state, allyId): state {
  const ally = state.activeCombat.allies.find(a => a.id === allyId);
  if (!ally) return state;
  ally.hasFled = true;
  return appendNarration(state, `You signal ${ally.name} to flee. They retreat.`);
}
```

UI: each ally entry in the combat panel gets a "Flee" button. Player can click their own Flee button only after deciding to retreat.

### Ordered retreat detection

**File:** `lib/combatEngine.ts:resolvePlayerFlee`:
```typescript
const allies = state.activeCombat.allies;
const allFled = allies.every(a => a.hasFled);
const alliesAbandoned = allies.filter(a => !a.hasFled).length;

const ctx: CombatDeltaContext = {
  // ...
  alliesFledFirst: allFled,
  alliesAbandoned,
  fled: true,
  // ...
};
const deltas = computeCombatDeltas(ctx);
let newP = state.player;
for (const d of deltas) newP = applyKarma(newP, d);
```

### combat-end hook

**File:** `lib/combatEngine.ts:endCombat` — apply combat deltas after victory:
```typescript
const ctx: CombatDeltaContext = buildContext(state, combatLog);
const deltas = computeCombatDeltas(ctx);
let newP = state.player;
for (const d of deltas) newP = applyKarma(newP, d);
```

### Enemy tags (for Illumination)

**File:** `lib/combatTypes.ts` — extend `Enemy` interface:
```typescript
tags?: Array<"dark" | "undead" | "daemon" | "sorceror" | "innocent" | "friendly">;
```

Update enemy data files (anywhere monsters are declared) to add tags. Daemons/undead/sorcerors/dark-cultists get `dark`. Specific named NPCs (Vivian, Aldric, etc.) get `friendly` so accidentally killing them triggers the catastrophic delta.

### Tests

**File:** `__tests__/karma/combat-deltas.test.ts`:

- Routine win: +1 Passion per kill.
- Outnumbered win: +Passion + +Standing.
- Great-odds win: +Passion + +Standing + +Courage.
- Stand-and-lose: +Courage, −Standing.
- Solo flee: −1 Courage, −1 Standing.
- Ordered retreat: −1 Courage, Standing/Integrity spared.
- Ally abandonment: TRIPLE PENALTY.
- Killing a "dark" tagged enemy: +Illumination toward Light.
- Killing a "friendly" tagged enemy: catastrophic deltas.

### Verify

- [ ] All combat-delta tests pass.
- [ ] Manual: enter combat, flee solo → see −Courage in PICSSI panel. Bring Vivian, fight 4 enemies, lose without fleeing → see +Courage, −Standing. Flee leaving Vivian behind → see triple penalty.

---

# Sprint 6 — UI polish (~2 days)

**Goal:** Surface karma state in the UI so the player can see what's happening.

**Dependencies:** Sprint 5.

### Stats panel (lib/components or app/page.tsx)

Add a PICSSI sub-panel:
- 5 progress bars (0..100) for Passion, Integrity, Courage, Standing, Spirituality.
- 1 bipolar bar (-100..+100) for Illumination, with center marker.
- Stamina bar with current/max, fatigue tier indicator.
- ActionBudget pill ("21 / 25").
- VD indicator if `vdActive`.

### Affection panel

New collapsible section showing met NPCs and their affection meter.

### Karma history log

A scrolling log of recent PICSSI deltas with timestamps and source ("via atom: vivian-meet"). Stored in `karma_log` JSONB on players (last 50 entries; trim oldest).

### Riddle modal

When `state.pendingRiddle` is set, show a modal with the riddle prompt + input field. On submit, route to `answerRiddle`.

### Verify

- [ ] All bars render with current values.
- [ ] Bipolar Illumination bar visually distinguishes Light/Dark/midline.
- [ ] Affection panel shows Vivian when met.
- [ ] Reading a scroll opens the riddle modal; correct answer awards Illumination visibly.

---

# Sprint 7 (deferred) — Sorcery + Illumination drain (~5+ days)

**Goal:** Wire INVOKE command, per-circle reagent consumption, per-circle Illumination loss, and the Outer Dark gate (low/negative Illumination → wider patron-response chance).

**Dependencies:** Sprint 6.

This is its own design exercise — see SORCERY.md (canonical) and the v1 Illumination cost table in KARMA_SYSTEM.md §4a + SORCERY.md §7.

Out of scope for the initial karma rollout. Listed here so the roadmap is complete.

---

## Cross-cutting concerns

### Persistence / load order

Every PlayerState load path must:
1. Read row from DB.
2. Parse JSONB columns.
3. Call `recomputeDerivedStats(p)` once.
4. Return the recomputed state.

Save path persists `picssi.*`, `npc_affection`, `flags_*`, `scrolls_read`, etc. to their respective columns. *_effective fields are NOT persisted.

### Migration testing

Each sprint's DB migration must be run against:
- A fresh empty `players` table → defaults applied correctly.
- An existing dev player row → backfilled to safe defaults.
- Rollback test: reverse migration restores prior state.

### Test naming convention

`__tests__/karma/<sprint>-<area>.test.ts`. Run with `npm test`.

### Type safety

`PicssiState`, `KarmaDelta`, `Activity`, `Encounter`, `CombatDeltaContext` are exported from `lib/karma/types.ts` (or `atom-types.ts` for the encounter schema). All karma-touching code imports from there.

### Performance

`recomputeDerivedStats` runs on every load + every karma mutation. It's O(1) per call (six virtues, fixed-cost arithmetic). Don't memoize prematurely.

JSONB fields (`npc_affection`, `flags_*`, `scrolls_read`) are bulk-loaded with the player row. Reads are free; writes update one column per change.

### Risks / open implementation questions

1. **`scripts/balance/types.ts` location:** moving it under `lib/karma/atom-types.ts` (single source of truth). Sprint 4 task. The simulator at `scripts/balance/simulator.ts` then imports from `../../lib/karma/atom-types`.
2. **Atom-trigger priority when multiple atoms match:** v1 picks the first by load order. Add priority field if needed (Sprint 4+).
3. **Riddle UI vs in-band text:** v1 puts the riddle in the chat stream as a `__RIDDLE__` token (player types answer as next command). Sprint 6 may upgrade to a modal.
4. **Wealth recompute trigger:** Standing-from-wealth must recompute on bank deposit/withdrawal AND on combat-end gold pickup AND on shop transaction. Hook all three.
5. **Standing-from-gear recompute:** runs on equip/unequip. Existing equip/unequip code paths need a hook call.

---

## Estimated total scope

| Sprint | Effort | Risk |
|--------|--------|------|
| 0 | ½ day | low |
| 1 | 2–3 days | medium (touches combat math) |
| 2 | 2–3 days | medium-high (DB drop columns + cross-cutting recompute) |
| 3 | 3 days | medium (many new commands; scroll loader) |
| 4 | 3–4 days | medium (encounter loader + storage) |
| 5 | 3 days | low-medium (well-specified deltas) |
| 6 | 2 days | low (UI) |
| 7 | 5+ days | deferred |
| **Total (Sprints 0–6)** | **~16–18 days** | — |

For solo dev pairing with Claude, expect ~3–4 weeks of calendar time.

---

## Approval to begin

This plan is ready for execution starting with Sprint 0. Sprint 1 cannot start until KARMA_SYSTEM.md §6 "Final approval to begin Sprint 1" is checked.

*All design values referenced in this plan live in [KARMA_SYSTEM.md](./KARMA_SYSTEM.md). When updates are needed, update KARMA_SYSTEM.md first; this plan inherits.*
