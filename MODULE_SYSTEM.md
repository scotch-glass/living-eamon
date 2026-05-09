---
id: module_system
title: Module System (Ink + GPE)
role: design-canon
canonical_for: [ink-external-functions, gpe-magnitude-bands, combat-picssi-hook-points, runtime-adapter-spec]
visibility: creator
status: draft
last_updated: 2026-04-30
cross_refs: [KARMA_SYSTEM.md, GAME_DESIGN.md, lore/hyborian-pd/MODULE_PLAN.md]
---

# Living Eamon — Module System Specification

*Implementation spec for Claude Code. This document specifies the integration of three systems into Living Eamon: the Ink narrative authoring engine, the PICSSI karma model, and combat–PICSSI feedback. It also defines the Growth Path Equalizer (GPE), an authoring tool that scores each module on per-virtue growth balance.*

**Companion documents (sources of truth — do NOT duplicate their content here, reference them):**
- `KARMA_SYSTEM.md` — PICSSI design specification (locked 2026-04-29)
- `GAME_DESIGN.md` — overall game design including §11 PICSSI canonical definitions
- `SORCERY.md` — Eight Circles spell mechanics + Illumination cost table
- `CLAUDE_CONTEXT.md` — project rehydration doc

**Stack assumed:** Next.js 16, TypeScript, Supabase, Vercel. M4 Max Mac dev environment. Cursor-based editing.

**Status:** Stage I draft. All file paths and signatures in this doc are PROPOSALS until Scotch greenlights them.

---

## 0. Mission

Build a module-authoring system for Living Eamon where:

1. Writers (including non-developers) author choose-your-own-adventure modules in **Ink** (Inkle's narrative scripting language) using the free **Inky** editor.
2. Modules call into Living Eamon's runtime via a **stable EXTERNAL function contract** to mutate PICSSI virtues, NPC affection, flags, gold, HP, combat triggers, and items.
3. **Jane (Claude)** narrates Ink output in Tolkienian-GrimDark voice; Ink defines the structural spine, Jane defines the prose flesh.
4. **Combat** generates PICSSI deltas automatically via hook points in `combatEngine.ts`, applying the magnitude bands and triple-penalty rules from `KARMA_SYSTEM.md` §2.5–§2.10.
5. The **Growth Path Equalizer** statically analyzes each module and produces a per-virtue balance scorecard so authors can see whether their module gives balanced growth across the six PICSSI virtues — or is intentionally archetype-focused.

---

## 1. Architecture overview

```
.ink source files (writers author here)
        │
        │  inkjs/full Compiler — build-time pre-compile (optimization) OR runtime fallthrough
        ▼
.json compiled stories  +  .ink source (both shipped, runtime prefers .json)
        │
        ▼
inkjs Story object
        │
        ├── reads variables  ◄──── PlayerState (sync from Supabase row)
        │
        ├── calls EXTERNALs  ────► lib/karma/* helpers (mutate PlayerState)
        │
        └── emits text + tags ───► Jane prompt → Tolkienian-GrimDark prose

Combat events fire ────────────► lib/karma/combat-deltas.ts ───► applyKarma()

GPE static analyzer (build-time CLI):
    .ink source ──► tag parser ──► per-virtue growth tally ──► balance score
                                                            └─► JSON report + SVG chart
```

The architecture has three layers:

1. **Authoring layer** — `.ink` files written in Inky by humans. Tags and EXTERNAL calls declare PICSSI deltas, flag operations, combat triggers.
2. **Runtime layer** — `lib/karma/*` modules that bind Ink to PlayerState, run combat–PICSSI hooks, and orchestrate per-turn tick logic.
3. **Tooling layer** — the `living-eamon-gpe` CLI that statically analyzes modules at build time and outputs a balance report per module.

---

## 2. Repository layout

```
living-eamon/
├── modules/                              # NEW — authored module sources
│   ├── _shared/                          # shared knots usable by any module
│   │   ├── church-of-perpetual-life.ink
│   │   ├── valus-marketplace.ink
│   │   └── common-npcs.ink
│   ├── solomon-kane-whispering-woods/    # one module = one folder
│   │   ├── main.ink                      # entry point
│   │   ├── atoms/                        # optional, for large modules
│   │   │   ├── opening.ink
│   │   │   └── confrontation.ink
│   │   ├── module.json                   # metadata (see §4.5)
│   │   └── README.md                     # author notes
│   └── mirrors-of-tuzun-thune/
│       └── main.ink
├── public/modules/                       # NEW — compiled output (gitignored if needed)
│   ├── solomon-kane-whispering-woods.json
│   └── mirrors-of-tuzun-thune.json
├── lib/karma/                            # NEW — runtime adapter
│   ├── types.ts
│   ├── applyKarma.ts
│   ├── recompute.ts
│   ├── activities.ts
│   ├── combat-deltas.ts
│   ├── loader.ts
│   └── binding.ts
├── lib/combatEngine.ts                   # EXISTING — add hook points (§6)
├── lib/gameEngine.ts                     # EXISTING — add module dispatch (§5)
├── lib/gameState.ts                      # EXISTING — extend PlayerState (§5.1)
├── tools/gpe/                            # NEW — Growth Path Equalizer CLI
│   ├── index.ts                          # CLI entry
│   ├── parser.ts                         # ink tag parser
│   ├── analyzer.ts                       # balance computation
│   ├── reporter.ts                       # JSON + SVG output
│   └── README.md
├── package.json                          # add scripts: compile-modules, gpe
└── supabase/migrations/                  # NEW migrations per §5.1
    └── 2026XXXX_picssi_columns.sql
```

---

## 3. Build pipeline

### 3.1 Compilation strategy: `inkjs/full` everywhere, hybrid runtime + build-time

**Decision (locked):** Use `inkjs/full` for compilation in all environments — dev, web prod (Vercel), and any future desktop binary distribution (Steam/GOG via Tauri or Electron). Build-time pre-compilation is an **optimization layer**, not a hard requirement.

**Rationale — why `inkjs/full` and not `inklecate`:**

- **Cross-platform desktop ship is on the roadmap.** Living Eamon is a web game on Vercel today, but the long-term path includes a Steam/GOG binary distribution. The wrap-the-web approach via Tauri (preferred — ~10MB binary, system webview) or Electron (fallback — ~120MB, bundled Chromium) is the realistic shipping path; a full Unity/Godot rewrite would mean rebuilding combat, Supabase integration, and the Jane narration pipeline from scratch and is out of scope.
- **`inklecate` is a C# binary.** Cross-platform shipping would require bundling per-platform binaries (Win/Mac/Linux × x64/arm64) or a .NET runtime inside the desktop bundle. Steam Deck (Linux ARM64) is the most likely future-bite. This is a real distribution headache and grows worse with each platform added.
- **`inkjs/full` is pure JavaScript.** Runs identically wherever V8 runs — Vercel functions, browser, Tauri WebView, Electron Chromium. Zero platform-specific binary work, ever.
- **Modding-friendliness is on-brand.** Eamon (1980), Living Eamon's namesake, is one of gaming's most successful modding ecosystems — over 270 fan-authored adventures by 2013. Shipping `.ink` source alongside compiled `.json` (rather than only compiled assets) preserves the option to enable Steam Workshop-style fan modules later. `inkjs/full` is what makes that possible — it can compile community-submitted `.ink` files at runtime without any special build tooling. We do not commit to user-generated modules now, but this approach keeps the option open at zero cost.
- **Bundle size cost is acceptable.** `inkjs/full` adds roughly ~200KB minified vs the runtime-only `inkjs` build. Negligible for a desktop-leaning narrative game; trivial inside a Tauri/Electron bundle where install size is measured in MB or GB anyway.

### 3.2 The hybrid pattern

The same pattern works in all three environments:

| Environment | Compilation | Why |
|-------------|-------------|-----|
| **Dev** | Runtime via `inkjs/full` | Edit `.ink` → save → reload, zero friction. Hot-reload picks it up. |
| **Vercel prod** | Pre-compiled `.json` shipped alongside `.ink` source; runtime falls through to compilation if `.json` is missing or stale | Pre-compiled hits avoid CPU on cold-start serverless functions; source is preserved for modding-option |
| **Desktop (Steam/GOG)** | Pre-compiled `.json` ships inside the Tauri/Electron bundle alongside `.ink` source | Pure-JS execution, no native binaries to ship per platform; pre-compile keeps session startup fast |

**The runtime is the source of truth.** It can compile from `.ink` source at any time. Pre-compiled `.json` is purely an optimization. The loader (§5.6) prefers `.json` if present and recent, falls through to `.ink` source otherwise — silently, without fanfare.

### 3.3 npm scripts and build script

**Add to `package.json`:**

```json
{
  "dependencies": {
    "inkjs": "^2.x"
  },
  "devDependencies": {
    "tsx": "^4.x"
  },
  "scripts": {
    "compile-modules": "tsx scripts/compile-modules.ts",
    "new-module": "tsx scripts/new-module.ts",
    "gpe": "tsx tools/gpe/index.ts",
    "gpe:all": "tsx tools/gpe/index.ts \"modules/**/main.ink\"",
    "validate-modules": "tsx scripts/validate-modules.ts",
    "prebuild": "npm run validate-modules && npm run compile-modules && npm run gpe:all -- --strict"
  }
}
```

**`scripts/compile-modules.ts`** — pre-compile for performance:

```typescript
import { Compiler } from 'inkjs/full';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { glob } from 'glob';
import { dirname, basename } from 'path';

async function compileAll() {
  const sources = await glob('modules/*/main.ink');
  await mkdir('public/modules', { recursive: true });

  let failures = 0;
  for (const source of sources) {
    const moduleId = basename(dirname(source));
    const ink = await readFile(source, 'utf-8');
    try {
      const story = new Compiler(ink).Compile();
      const json = story.ToJson();
      await writeFile(`public/modules/${moduleId}.json`, json, 'utf-8');
      console.log(`✓ ${moduleId}`);
    } catch (err) {
      console.error(`✗ ${moduleId}: ${err.message}`);
      failures += 1;
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} module(s) failed to compile.`);
    process.exit(1);
  }
}

compileAll();
```

**`scripts/validate-modules.ts`** — CI-side validation pass that compiles every module via `inkjs/full` Compiler and fails the build on any compile error, WITHOUT writing the JSON output. Used by CI to catch errors before any deploy. Identical to `compile-modules.ts` minus the `writeFile` call. (In practice, `compile-modules.ts` already does this — keep `validate-modules.ts` as a separate fast-path check that runs first in `prebuild` so failures surface early.)

### 3.4 Optional: shipping `.ink` source alongside `.json`

**Recommendation: do it.** It costs nothing and unlocks future moves:

- **Modding option preserved.** Future Steam Workshop or Itch.io community-uploads pipeline becomes a configuration choice, not an architectural rewrite.
- **Hot-fix capability.** A bad pre-compiled `.json` can be patched live by editing `.ink` source and letting the runtime recompile, without a redeploy. Useful for live-service-style patches.
- **GPE source-of-truth alignment.** The GPE analyzer (§7) parses `.ink` source, not `.json`. Shipping both keeps the GPE meaningful in production for any post-launch authoring tooling.

To ship both: extend `scripts/compile-modules.ts` to also copy each `modules/<id>/main.ink` to `public/modules/<id>.ink`. The loader (§5.6) prefers `.json`; fans never have to know about it.

### 3.5 Runtime loading semantics

The loader (`lib/karma/loader.ts`, §5.6) implements the fall-through:

1. Try to fetch/read `public/modules/<id>.json` (compiled, fast path)
2. If missing or HTTP 404, fetch/read `public/modules/<id>.ink` source
3. Compile via `new Compiler(ink).Compile()` from `inkjs/full`
4. Cache the resulting `Story` instance in-memory for the session

For server-side execution (Next.js Route Handlers), read from disk via `fs.readFile()` instead of `fetch()`. Same fall-through logic.

---

## 4. The Module Contract (author-facing API)

This is the public API surface module authors program against. It is versioned. Breaking changes require a major version bump and a migration path.

**Current contract version:** `1.0.0`

### 4.1 Variables Ink can READ

Sync these from `PlayerState` into `Story.variablesState` on every Ink "Continue" cycle (and especially before any conditional check). Implementation in `lib/karma/binding.ts`.

| Ink variable | Type | Source | Notes |
|--------------|------|--------|-------|
| `passion` | int | `state.picssi.passion` | 0..100 |
| `integrity` | int | `state.picssi.integrity` | 0..100 |
| `courage` | int | `state.picssi.courage` | 0..100 |
| `standing` | int | `state.picssi.standing` | 0..100 |
| `spirituality` | int | `state.picssi.spirituality` | 0..100 |
| `illumination` | int | `state.picssi.illumination` | -100..+100 |
| `hp` | int | `state.currentHp` | current value |
| `max_hp` | int | `state.maxHp` | derived |
| `mana` | int | `state.currentMana` | |
| `max_mana` | int | `state.maxMana` | |
| `stamina` | int | `state.currentStamina` | |
| `max_stamina` | int | `state.maxStamina` | |
| `gold` | int | `state.gold` | |
| `action_budget` | int | `state.actionBudget` | adventure-scoped |
| `str_eff`, `dex_eff`, `cha_eff` | int | derived | for atom-gating |
| `vd_active` | bool | `state.vdActive` | venereal disease flag |
| `ally_count` | int | `state.allies.length` | |
| `current_room` | string | `state.location` | for atom triggers |

### 4.2 Functions Ink can CALL (EXTERNAL bindings)

Bind these in `lib/karma/binding.ts` via `story.BindExternalFunction(name, impl)`. All EXTERNAL functions return `0` unless otherwise noted (Ink quirk: functions used in expressions need a return value).

| Function | Args | Effect |
|----------|------|--------|
| `apply_karma(virtue, delta)` | `string, int` | Mutate PICSSI virtue. `virtue` ∈ `passion`/`integrity`/`courage`/`standing`/`spirituality`/`illumination`. Clamped to virtue range. Triggers `recomputeDerivedStats`. |
| `adjust_affection(npc_id, delta)` | `string, int` | Mutate NPC affection meter. Clamped to per-NPC range (default −50..+100). |
| `set_flag(name, scope)` | `string, string` | `scope` ∈ `life`/`legacy`. |
| `clear_flag(name, scope)` | `string, string` | |
| `has_flag(name, scope)` | `string, string` | Returns `1` if set, `0` otherwise. |
| `modify_gold(delta)` | `int` | |
| `modify_hp(delta)` | `int` | Clamped to 0..maxHp. |
| `modify_mana(delta)` | `int` | |
| `modify_stamina(delta)` | `int` | |
| `start_combat(encounter_id)` | `string` | Triggers combat with named encounter from `lib/encounters/<id>.ts`. |
| `add_item(item_id)` | `string` | |
| `remove_item(item_id)` | `string` | |
| `has_item(item_id)` | `string` | Returns `1`/`0`. |
| `affection(npc_id)` | `string` | Returns the NPC's affection value. |
| `tag_atom(atom_id, tier, virtues)` | `string, string, string` | **GPE instrumentation hook.** No runtime effect on state; emits a structured log line for the GPE static analyzer. See §7. |
| `jane_render(text, mood)` | `string, string` | Pass plain text through Jane for prose enrichment. `mood` ∈ `grim`/`neutral`/`hopeful`/`reverent`/`menacing`. |

### 4.3 Atom declaration syntax (Ink tags)

An **atom** is the fundamental unit of authored content — a knot or stitch that presents a situation, offers choices, and applies state mutations. Each atom MUST declare its metadata using Ink tags so the GPE analyzer can score it.

**Required tags on every atom:**

```ink
=== drink_with_strangers ===
# atom: drink_with_strangers
# tier: notable
# touches: P+, S+
# trigger: location=any_tavern, action_budget>=1

You sit at a long table with rough men in oiled leather...

* [Buy a round for the table]
    ~ apply_karma("passion", 3)
    ~ apply_karma("standing", 5)
    # delta: P+3, S+5
    The men cheer your generosity. The barmaid winks. Crom does not care for such trifles, but Crom does not pay your bar tab.
    -> tavern_morning_after
* [Drink alone, watching]
    ~ apply_karma("passion", 1)
    # delta: P+1
    You drink in silence. The room learns nothing of you, and you learn nothing of the room.
    -> tavern_morning_after
* [Refuse the offered cup]
    ~ apply_karma("integrity", 1)
    ~ apply_karma("passion", -1)
    # delta: I+1, P-1
    "I am here to find a man," you say. "Not to drown one."
    -> tavern_proprietor_responds
```

**Tag reference:**

| Tag | Required | Format | Purpose |
|-----|----------|--------|---------|
| `# atom: <id>` | yes | snake_case identifier | Unique atom key for GPE + telemetry |
| `# tier: <tier>` | yes | `trivial`/`notable`/`major`/`defining` | Maps to ±1/±3/±5/±10 magnitude bands |
| `# touches: <virtues>` | yes | comma-separated `P+`, `I-`, `C±`, etc. | Declares which virtues this atom can affect, with sign hints |
| `# trigger: <expr>` | optional | conditional expression | Used by atom-trigger matcher (§5.x) |
| `# delta: <virtue+delta>` | required on choices | comma-separated `P+3, S+5` | Declares the actual delta applied. The GPE checks that `apply_karma` calls match these declarations. |
| `# scope: <s>` | optional, on `set_flag` lines | `life`/`legacy` | Default `life` |

The `# touches:` tag uses these codes: `P` (Passion), `I` (Integrity), `C` (Courage), `S` (Standing), `Sp` (Spirituality), `Il` (Illumination). Sign codes: `+` (only positive), `-` (only negative), `±` (both possible).

### 4.4 Magnitude bands (canonical, per `KARMA_SYSTEM.md` §2.5)

| Tier | Magnitude | When to use |
|------|-----------|-------------|
| `trivial` | ±1 | Small flavor choices, drink-alone, casual gestures |
| `notable` | ±3 | Most atom choices, short quests, single moral tests |
| `major` | ±5 | Multi-stop quests, public commitments, significant atoms |
| `defining` | ±10 | Campaign moments, sworn vows, ally abandonment, killing innocents |

The GPE analyzer uses tier as a sanity check: the declared delta should match the tier's magnitude. A `tier: notable` atom that applies `delta: P+10` is flagged as inconsistent.

### 4.5 Module metadata (`module.json`)

Every module folder MUST contain a `module.json`:

```json
{
  "id": "solomon-kane-whispering-woods",
  "title": "The Whispering Woods",
  "author": "scotch-glass",
  "contractVersion": "1.0.0",
  "tier": "moderate",
  "actionBudget": 25,
  "archetype": "solomon-kane",
  "intentionallySkewed": ["integrity", "courage", "spirituality"],
  "summary": "Solomon Kane tracks a Puritan-cursed soul into woods where the trees speak in dead languages.",
  "publicDomainSource": "Robert E. Howard, 'Skulls in the Stars' (1929) — US public domain since 2025-01-01",
  "estimatedPlaytime": 45,
  "entryKnot": "opening_at_the_inn"
}
```

Fields:
- `tier` ∈ `novice`/`moderate`/`deadly` — drives `actionBudget` per `KARMA_SYSTEM.md` §4c.
- `archetype` (optional) — when set, the GPE compares the module's growth profile against the archetype's expected profile and judges fit, not balance.
- `intentionallySkewed` (optional) — list of virtues the author admits to focusing on. The GPE will not flag low growth on these as a defect.
- `publicDomainSource` (optional but recommended) — for Howard-derived modules, document the PD provenance.

---

## 5. Runtime adapter (`lib/karma/*`)

### 5.1 `lib/karma/types.ts`

```typescript
export type PicssiVirtue =
  | 'passion'
  | 'integrity'
  | 'courage'
  | 'standing'
  | 'spirituality'
  | 'illumination';

export interface PicssiState {
  passion: number;       // 0..100
  integrity: number;     // 0..100
  courage: number;       // 0..100
  standing: number;      // 0..100
  spirituality: number;  // 0..100
  illumination: number;  // -100..+100
}

export type PicssiTier = 'trivial' | 'notable' | 'major' | 'defining';

export const TIER_MAGNITUDES: Record<PicssiTier, number> = {
  trivial: 1,
  notable: 3,
  major: 5,
  defining: 10,
};

export const PICSSI_BOUNDS: Record<PicssiVirtue, [number, number]> = {
  passion: [0, 100],
  integrity: [0, 100],
  courage: [0, 100],
  standing: [0, 100],
  spirituality: [0, 100],
  illumination: [-100, 100],
};

// PlayerState extension (add to existing PlayerState type in lib/gameState.ts)
export interface PlayerStateExtension {
  picssi: PicssiState;
  npcAffection: Record<string, number>;
  flagsLife: Record<string, true>;
  flagsLegacy: Record<string, true>;
  vdActive: boolean;
  currentStamina: number;
  maxStamina: number;
  fatiguePool: number;
  actionBudget: number;
}
```

### 5.2 `lib/karma/applyKarma.ts`

```typescript
import { PicssiVirtue, PICSSI_BOUNDS } from './types';
import { recomputeDerivedStats } from './recompute';
import type { PlayerState } from '@/lib/gameState';

export function applyKarma(
  state: PlayerState,
  virtue: PicssiVirtue,
  delta: number
): PlayerState {
  const [min, max] = PICSSI_BOUNDS[virtue];
  const current = state.picssi[virtue];
  const next = Math.max(min, Math.min(max, current + delta));

  return recomputeDerivedStats({
    ...state,
    picssi: { ...state.picssi, [virtue]: next },
  });
}
```

### 5.3 `lib/karma/recompute.ts`

```typescript
import type { PlayerState } from '@/lib/gameState';

/**
 * Recomputes all PICSSI-derived stats. Caps raise; current values stay flat
 * (per KARMA_SYSTEM.md §4a "Caps raise, current values stay flat").
 * Called on every karma mutation and every PlayerState load.
 */
export function recomputeDerivedStats(state: PlayerState): PlayerState {
  const { picssi, strBase, dexBase, chaBase } = state;

  const strBonus = Math.min(10, Math.floor(picssi.passion / 10));
  const dexBonus = Math.min(10, Math.floor(picssi.courage / 10));
  const chaBonus = Math.min(10, Math.floor(picssi.standing / 10));

  const strEffective = strBase + strBonus - (state.vdActive ? 2 : 0);
  const dexEffective = dexBase + dexBonus;
  const chaEffective = chaBase + chaBonus;

  const maxHp = 50 + 2 * picssi.integrity;
  const maxMana = 10 + Math.floor(Math.abs(picssi.illumination) / 2);
  const maxStamina = 35 + 2 * strEffective;

  const manaRegen = 1 + Math.floor(picssi.spirituality / 20);
  const healMultiplier = 1 + 0.005 * picssi.spirituality;

  // Caps raise; current values do NOT auto-fill into new headroom.
  return {
    ...state,
    strEffective,
    dexEffective,
    chaEffective,
    maxHp,
    maxMana,
    maxStamina,
    manaRegen,
    healMultiplier,
  };
}
```

### 5.4 `lib/karma/activities.ts`

Activity registry per `KARMA_SYSTEM.md` §2.3. Each activity is a record describing stamina/fatigue/PICSSI effects. Implementation handles the `actionBudget` decrement, applies all deltas atomically, and surfaces narrative cues to Jane.

```typescript
import { PicssiVirtue } from './types';
import { applyKarma } from './applyKarma';

export interface Activity {
  id: string;
  label: string;
  goldCost: number;
  actionBudgetCost: number;
  staminaResult: 'full' | number;       // 'full' = restore to maxStamina
  fatiguePoolDelta: (maxStamina: number) => number;
  picssiDeltas: Array<{ virtue: PicssiVirtue; delta: number }>;
  picssiLosses?: Array<{ virtue: PicssiVirtue; delta: number }>;
  sideEffects?: (state: PlayerState) => PlayerState;  // VD chance, etc.
  available: (state: PlayerState) => boolean;
}

// Example registry entries (full table per KARMA_SYSTEM.md §2.3)
export const ACTIVITIES: Record<string, Activity> = {
  pray_at_temple: {
    id: 'pray_at_temple',
    label: 'Pray at the temple',
    goldCost: 0,
    actionBudgetCost: 1,
    staminaResult: 'full',
    fatiguePoolDelta: (max) => Math.round(max * 0.29),
    picssiDeltas: [{ virtue: 'spirituality', delta: 2 }],
    available: (state) => /* must be in a temple room */ true,
  },
  drink_buy_round: {
    id: 'drink_buy_round',
    label: 'Drink and buy others rounds',
    goldCost: 15,
    actionBudgetCost: 1,
    staminaResult: 'full',
    fatiguePoolDelta: (max) => Math.round(max * 2.0),
    picssiDeltas: [
      { virtue: 'passion', delta: 1 },
      { virtue: 'standing', delta: 3 },
    ],
    available: (state) => state.gold >= 15,
  },
  // ... full table per KARMA_SYSTEM.md §2.3
};
```

### 5.5 `lib/karma/combat-deltas.ts`

Per `KARMA_SYSTEM.md` §4c "Combat-victory PICSSI delta table." This is the ground truth for combat→PICSSI.

```typescript
import { applyKarma } from './applyKarma';
import { PicssiVirtue } from './types';

export interface CombatContext {
  enemyCount: number;
  allyCount: number;
  bossLevel: boolean;
  enemiesKilled: number;
  enemyTags: string[];           // 'dark', 'innocent', 'sorcerer', etc.
  outcome: 'victory' | 'flee' | 'flee_ordered' | 'flee_abandoned' | 'defeat_standing' | 'death';
  alliesAbandonedCount: number;
  vowActive: boolean;            // is there an active integrity-flagged contract?
}

export interface CombatDelta {
  virtue: PicssiVirtue;
  delta: number;
  reason: string;
}

export function computeCombatDeltas(ctx: CombatContext): CombatDelta[] {
  const deltas: CombatDelta[] = [];
  const greatOdds = ctx.enemyCount >= 4 || ctx.bossLevel;

  if (ctx.outcome === 'victory') {
    // Routine kill drip
    deltas.push({ virtue: 'passion', delta: ctx.enemiesKilled, reason: 'battle-thrill drip' });

    if (ctx.enemyCount >= 2) {
      deltas.push({ virtue: 'standing', delta: 3, reason: 'witnessed prowess' });
    }

    if (greatOdds) {
      deltas.push({ virtue: 'standing', delta: 5, reason: 'great-odds win' });
      deltas.push({ virtue: 'courage', delta: 5, reason: 'great-odds win' });
    }

    // Tag-driven Illumination
    const darkKills = ctx.enemyTags.filter(t => ['dark', 'daemon', 'undead', 'sorcerer', 'cultist'].includes(t)).length;
    if (darkKills > 0) {
      deltas.push({ virtue: 'illumination', delta: 3 * darkKills, reason: 'killed dark beings (Light)' });
    }
    const innocentKills = ctx.enemyTags.filter(t => t === 'innocent').length;
    if (innocentKills > 0) {
      deltas.push({ virtue: 'illumination', delta: -5 * innocentKills, reason: 'killed innocent (Dark)' });
      deltas.push({ virtue: 'standing', delta: -5 * innocentKills, reason: 'witnessed atrocity' });
    }

    if (ctx.vowActive) {
      deltas.push({ virtue: 'integrity', delta: 3, reason: 'win in service of vow' });
    }
  }

  if (ctx.outcome === 'defeat_standing') {
    deltas.push({ virtue: 'courage', delta: greatOdds ? 10 : 5, reason: 'stood and fell' });
    deltas.push({ virtue: 'standing', delta: -3, reason: 'visible defeat' });
  }

  if (ctx.outcome === 'flee') {
    const mag = greatOdds ? 3 : 1;
    deltas.push({ virtue: 'courage', delta: -mag, reason: 'fled combat' });
    deltas.push({ virtue: 'standing', delta: -mag, reason: 'fled combat' });
  }

  if (ctx.outcome === 'flee_ordered') {
    deltas.push({ virtue: 'courage', delta: -1, reason: 'ordered retreat — Standing/Integrity spared' });
  }

  if (ctx.outcome === 'flee_abandoned') {
    // The TRIPLE PENALTY per KARMA_SYSTEM.md §2.8
    const n = ctx.alliesAbandonedCount;
    deltas.push({ virtue: 'courage', delta: -10 * n, reason: 'Defining cowardice — abandoned ally' });
    deltas.push({ virtue: 'standing', delta: -10 * n, reason: 'abandoned ally' });
    deltas.push({ virtue: 'integrity', delta: -5 * n, reason: 'broke implicit combat vow' });
  }

  return deltas;
}

export function applyCombatDeltas(state: PlayerState, ctx: CombatContext): { state: PlayerState; deltas: CombatDelta[] } {
  const deltas = computeCombatDeltas(ctx);
  let newState = state;
  for (const d of deltas) {
    newState = applyKarma(newState, d.virtue, d.delta);
  }
  return { state: newState, deltas };
}
```

### 5.6 `lib/karma/loader.ts`

Implements the fall-through described in §3.5: prefer pre-compiled `.json`; compile from `.ink` source at runtime if `.json` is unavailable. Imports `Compiler` from `inkjs/full` (NOT the lighter `inkjs` runtime build) so runtime compilation works without a network round-trip to a build server.

```typescript
import { Story, Compiler } from 'inkjs/full';
import type { PicssiVirtue } from './types';

// In-memory cache: one Story instance per moduleId per session.
const storyCache = new Map<string, Story>();

export async function loadModule(moduleId: string): Promise<Story> {
  if (storyCache.has(moduleId)) {
    return storyCache.get(moduleId)!;
  }

  // Fast path: pre-compiled JSON
  const json = await tryFetch(`/modules/${moduleId}.json`);
  if (json) {
    const story = new Story(json);
    storyCache.set(moduleId, story);
    return story;
  }

  // Fall through: raw .ink source, compile at runtime
  const ink = await tryFetch(`/modules/${moduleId}.ink`);
  if (!ink) {
    throw new Error(`Module not found: ${moduleId} (no .json or .ink source)`);
  }

  const compiled = new Compiler(ink).Compile();
  storyCache.set(moduleId, compiled);
  return compiled;
}

/** Fetch helper that returns text or null on 404. Server-side variant uses fs.readFile. */
async function tryFetch(path: string): Promise<string | null> {
  // In Next.js Route Handlers / server components, replace this with fs.readFile
  // and an existsSync check on the resolved public/ path. The shape stays the same.
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

export interface ModuleMetadata {
  id: string;
  title: string;
  author: string;
  contractVersion: string;
  tier: 'novice' | 'moderate' | 'deadly';
  actionBudget: number;
  archetype?: string;
  intentionallySkewed?: PicssiVirtue[];
  summary: string;
  publicDomainSource?: string;
  estimatedPlaytime: number;
  entryKnot: string;
}

export async function loadModuleMetadata(moduleId: string): Promise<ModuleMetadata> {
  const response = await fetch(`/modules/${moduleId}/module.json`);
  return response.json();
}

/** Drop a module from cache — useful in dev for hot-reloading edited .ink files. */
export function invalidateModule(moduleId: string): void {
  storyCache.delete(moduleId);
}
```

**Server-side variant.** When called from a Next.js Route Handler or server component, swap `fetch(path)` for `fs.readFile()` against the resolved `public/modules/...` path. The fall-through logic is identical. Implementation note: keep the cache process-wide on the server so hot calls don't repeatedly compile the same `.ink` source — Vercel function instances may live for hundreds of requests.

**Dev hot-reload.** During development, the Next.js dev server detects edits to `.ink` files. Wire a file-watcher hook (or a manual `invalidateModule()` call from a dev-only debug endpoint) to clear the cache so the next `loadModule()` call recompiles. In prod, the cache is never invalidated except by process restart.

### 5.7 `lib/karma/binding.ts`

```typescript
import { Story } from 'inkjs';
import { applyKarma } from './applyKarma';
import { PicssiVirtue } from './types';
import type { PlayerState } from '@/lib/gameState';

export interface InkBinding {
  story: Story;
  getState: () => PlayerState;
  setState: (s: PlayerState) => void;
}

export function bindInkExternals({ story, getState, setState }: InkBinding) {
  story.BindExternalFunction('apply_karma', (virtue: string, delta: number) => {
    setState(applyKarma(getState(), virtue as PicssiVirtue, delta));
    return 0;
  });

  story.BindExternalFunction('adjust_affection', (npcId: string, delta: number) => {
    const state = getState();
    const current = state.npcAffection[npcId] ?? 0;
    const next = Math.max(-50, Math.min(100, current + delta));
    setState({ ...state, npcAffection: { ...state.npcAffection, [npcId]: next } });
    return 0;
  });

  story.BindExternalFunction('set_flag', (name: string, scope: string) => {
    const state = getState();
    const key = scope === 'legacy' ? 'flagsLegacy' : 'flagsLife';
    setState({ ...state, [key]: { ...state[key], [name]: true } });
    return 0;
  });

  story.BindExternalFunction('has_flag', (name: string, scope: string) => {
    const state = getState();
    const key = scope === 'legacy' ? 'flagsLegacy' : 'flagsLife';
    return state[key][name] ? 1 : 0;
  });

  story.BindExternalFunction('modify_gold', (delta: number) => {
    setState({ ...getState(), gold: Math.max(0, getState().gold + delta) });
    return 0;
  });

  // ... bind all functions in §4.2 table

  // GPE instrumentation hook — no runtime effect, emits structured log
  story.BindExternalFunction('tag_atom', (atomId: string, tier: string, virtues: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[gpe-trace] atom=${atomId} tier=${tier} virtues=${virtues}`);
    }
    return 0;
  });
}

export function syncInkVariables(story: Story, state: PlayerState) {
  story.variablesState['passion']      = state.picssi.passion;
  story.variablesState['integrity']    = state.picssi.integrity;
  story.variablesState['courage']      = state.picssi.courage;
  story.variablesState['standing']     = state.picssi.standing;
  story.variablesState['spirituality'] = state.picssi.spirituality;
  story.variablesState['illumination'] = state.picssi.illumination;
  story.variablesState['hp']           = state.currentHp;
  story.variablesState['max_hp']       = state.maxHp;
  story.variablesState['mana']         = state.currentMana;
  story.variablesState['max_mana']     = state.maxMana;
  story.variablesState['stamina']      = state.currentStamina;
  story.variablesState['max_stamina']  = state.maxStamina;
  story.variablesState['gold']         = state.gold;
  story.variablesState['action_budget']= state.actionBudget;
  story.variablesState['str_eff']      = state.strEffective;
  story.variablesState['dex_eff']      = state.dexEffective;
  story.variablesState['cha_eff']      = state.chaEffective;
  story.variablesState['vd_active']    = state.vdActive ? 1 : 0;
  story.variablesState['ally_count']   = state.allies.length;
  story.variablesState['current_room'] = state.location;
}

/**
 * Drive the Ink story forward, returning emitted text plus current choices.
 * Caller is responsible for piping the text through Jane.
 */
export function continueStory(story: Story): { text: string; tags: string[]; choices: Array<{ text: string; index: number }> } {
  let text = '';
  const tags: string[] = [];

  while (story.canContinue) {
    text += story.Continue();
    if (story.currentTags) tags.push(...story.currentTags);
  }

  const choices = story.currentChoices.map((c, i) => ({ text: c.text, index: i }));
  return { text, tags, choices };
}
```

---

## 6. Combat integration

Add hook points to `lib/combatEngine.ts` that emit events to `lib/karma/combat-deltas.ts`. The hook points are the contract — do not have combat logic call `applyKarma` directly.

### 6.1 Hook points

```typescript
// In lib/combatEngine.ts — add these emit calls at the existing points:

// onCombatStart — initialize CombatContext
function startCombat(state, encounter) {
  state.combatContext = {
    enemyCount: encounter.enemies.length,
    allyCount: state.allies.length,
    bossLevel: encounter.bossLevel ?? false,
    enemiesKilled: 0,
    enemyTags: [],
    outcome: null,
    alliesAbandonedCount: 0,
    vowActive: state.activeVows?.length > 0,
  };
}

// onEnemyDeath — collect tags, increment kill count
function onEnemyDeath(state, enemy) {
  state.combatContext.enemiesKilled += 1;
  state.combatContext.enemyTags.push(...enemy.tags);
}

// onAllyFlee — mark hasFled
function onAllyFlee(state, allyId) {
  const ally = state.allies.find(a => a.id === allyId);
  if (ally) ally.hasFled = true;
}

// onPlayerFlee — determine outcome category
function onPlayerFlee(state) {
  const allies = state.allies.filter(a => !a.dead);
  const allFled = allies.every(a => a.hasFled);
  const fledWithImmobile = allies.some(a => !a.hasFled && a.cannotFlee);

  if (allies.length === 0) {
    state.combatContext.outcome = 'flee';
  } else if (allFled) {
    state.combatContext.outcome = 'flee_ordered';
  } else {
    state.combatContext.outcome = 'flee_abandoned';
    state.combatContext.alliesAbandonedCount = allies.filter(a => !a.hasFled).length;
  }
}

// endCombat — apply deltas
function endCombat(state) {
  const { state: newState, deltas } = applyCombatDeltas(state, state.combatContext);
  // emit deltas to UI for the post-combat summary
  newState.combatSummary = deltas;
  return newState;
}
```

### 6.2 Ordered-retreat detection

Per `KARMA_SYSTEM.md` §2.8: ordered retreat = player fled AFTER all allies have fled. Implementation must track `allies[].hasFled` per ally and check `allFled` at the moment of player flee.

UI requirement: each ally row in the combat panel needs its own FLEE button per `KARMA_SYSTEM.md` §2.8 group-flee mechanics. Clicking FLEE on an ally rolls a random exit and lands the entire able-bodied group there.

### 6.3 Triple-penalty enforcement

When `outcome === 'flee_abandoned'`, `applyCombatDeltas` applies all three deltas (Courage, Standing, Integrity) scaled by `alliesAbandonedCount`. This is non-negotiable in code; no atom override.

### 6.4 Fatigue tier penalties

Per `KARMA_SYSTEM.md` §4a (body-zone-derived). Add to `combatEngine.ts` damage resolution:

```typescript
function resolveStrike(attacker, defender, state) {
  const fatigueLevel = computeFatigueLevel(state);  // 0..4
  const fatigueModifier = 15 * fatigueLevel;        // +0/+15/+30/+45/+60
  const baseHitChance = computeBaseHitChance(attacker, defender);
  const adjustedHitChance = baseHitChance + (attacker === 'enemy' ? fatigueModifier : 0);

  if (fatigueLevel === 4 && attacker === 'player') {
    return { blocked: true, reason: 'Exhausted — cannot act' };
  }
  // ... rest of strike resolution
}

function computeFatigueLevel(state): 0 | 1 | 2 | 3 | 4 {
  const ratio = state.fatiguePool / state.maxStamina;
  if (ratio <= -4) return 4;
  if (ratio <= -3) return 3;
  if (ratio <= -2) return 2;
  if (ratio <= -1) return 1;
  return 0;
}
```

---

## 7. Growth Path Equalizer (GPE)

The GPE is a **build-time CLI tool** that statically analyzes a module's `.ink` files and produces a per-virtue balance scorecard. Authors run it locally during writing and CI runs it on every module to flag regressions.

### 7.1 Atom tag schema (parsing target)

The parser walks `.ink` files and extracts atom definitions. An atom is identified by the `# atom: <id>` tag. Each atom collects:

- `id` (from `# atom:` tag)
- `tier` (from `# tier:` tag)
- `touches` (from `# touches:` tag)
- `choices`: list of choice objects, each with:
  - `text` (the choice prompt)
  - `deltas`: from the `# delta:` tag
  - `apply_karma_calls`: from `~ apply_karma(...)` lines

The parser MUST validate that every `apply_karma` call has a matching `# delta:` declaration on the same choice. Missing or mismatched deltas emit warnings.

### 7.2 Static analysis algorithm

Pseudocode:

```typescript
type AtomReport = {
  id: string;
  tier: PicssiTier;
  totalGrowthPotential: Record<PicssiVirtue, number>;  // sum of positive deltas across choices
  totalLossPotential: Record<PicssiVirtue, number>;    // sum of negative deltas
  choiceCount: number;
};

function analyzeModule(modulePath: string): ModuleReport {
  const atoms = parseAllAtoms(modulePath);
  const perVirtueGrowth: Record<PicssiVirtue, number> = zeroVirtues();
  const perVirtueLoss: Record<PicssiVirtue, number> = zeroVirtues();
  const perVirtueAtomCount: Record<PicssiVirtue, number> = zeroVirtues();

  for (const atom of atoms) {
    for (const choice of atom.choices) {
      for (const delta of choice.deltas) {
        if (delta.value > 0) perVirtueGrowth[delta.virtue] += delta.value;
        else perVirtueLoss[delta.virtue] += delta.value;
      }
    }
    // Count an atom as "touching" a virtue if any choice has a non-zero delta for it
    const touched = atom.touchesSet();
    for (const v of touched) perVirtueAtomCount[v] += 1;
  }

  return {
    moduleId,
    atomCount: atoms.length,
    perVirtueGrowth,
    perVirtueLoss,
    perVirtueAtomCount,
    balanceScore: computeBalanceScore(perVirtueGrowth),
    verdict: computeVerdict(perVirtueGrowth, moduleMetadata),
    recommendations: computeRecommendations(perVirtueGrowth, moduleMetadata),
  };
}
```

### 7.3 Balance score formula

The score is **min/max ratio scaled to 100**:

```
balanceScore = round( (min(growth) / max(growth)) × 100 )
```

If `max(growth)` is 0 (no atoms grow any virtue — module is pure narration), score is `null` and verdict is `narrative-only`.

If a virtue is in `intentionallySkewed`, exclude it from min/max calculation but still report its growth in the chart. This lets a Solomon Kane module score 80+ on its non-skewed virtues while honestly reporting low growth on Passion/Standing.

**Rationale for min/max over stddev:** more interpretable for non-statistician authors. "The weakest virtue gets X% as much growth as the strongest" reads cleanly. Stddev requires explanation.

### 7.4 Verdict tiers

| Score | Verdict | Meaning |
|-------|---------|---------|
| 80–100 | **balanced** | Broadly playable for any hero archetype |
| 50–79 | **tilted** | Leans toward certain virtues but accessible |
| 20–49 | **skewed** | Strongly favors specific archetypes — confirm intent |
| 0–19 | **single-virtue** | Intentional archetype focus — confirm via `intentionallySkewed` |
| null | **narrative-only** | No PICSSI deltas declared — pure story content |

If `intentionallySkewed` is set in `module.json`, the verdict is suffixed with `(intentional)`.

### 7.5 CLI specification

**Invocation:**

```bash
npx living-eamon-gpe modules/solomon-kane-whispering-woods/main.ink
npx living-eamon-gpe modules/**/main.ink              # all modules
npx living-eamon-gpe modules/**/main.ink --json       # JSON output
npx living-eamon-gpe modules/**/main.ink --strict     # exit 1 on imbalance warnings
```

**Default output (terminal, human-readable):**

```
GPE Report — solomon-kane-whispering-woods
══════════════════════════════════════════
  Atoms: 18 | Choices: 47 | Module tier: moderate

  Growth potential per virtue:

  Passion       ████░░░░░░░░░░░░░░░░  +12
  Integrity     ████████████████░░░░  +48  (peak)
  Courage       ████████████████░░░░  +47
  Standing      ███░░░░░░░░░░░░░░░░░   +9
  Spirituality  ████████████░░░░░░░░  +36
  Illumination  ███████████████░░░░░  +44  (Light: +50, Dark: −6)

  Loss potential per virtue:
  Passion       −2 | Integrity −15 | Courage −8 | Standing −4 | Spirituality 0 | Illumination −12

  Balance score: 19 / 100
  Verdict: skewed (intentional — solomon-kane archetype)

  Recommendations:
    ✓ Passion/Standing low — confirmed intentional via module.json
    ⚠ No prayer atoms despite Spirituality focus — consider adding 1-2 contemplative choices
    ⚠ Integrity has 8 atoms; Standing has 1 atom — add a "buy a round in honor of the dead" atom?
```

**JSON output (`--json` flag):**

```json
{
  "moduleId": "solomon-kane-whispering-woods",
  "atomCount": 18,
  "choiceCount": 47,
  "perVirtueGrowth": {
    "passion": 12, "integrity": 48, "courage": 47,
    "standing": 9, "spirituality": 36, "illumination": 44
  },
  "perVirtueLoss": { /* ... */ },
  "perVirtueAtomCount": {
    "passion": 3, "integrity": 8, "courage": 7,
    "standing": 1, "spirituality": 4, "illumination": 6
  },
  "balanceScore": 19,
  "verdict": "skewed",
  "verdictModifier": "intentional",
  "recommendations": [ /* array of objects */ ]
}
```

**SVG output (`--svg <path>` flag):** Renders a horizontal bar chart suitable for embedding in module READMEs or PR descriptions. Uses the same color scheme as the dashboard widget (blue = balanced, amber = thin, red = very thin).

### 7.6 CI integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run GPE on all modules
  run: npm run gpe:all -- --strict
```

`--strict` mode exits non-zero if:
- Any module has score < 20 without `intentionallySkewed` set
- Any module has a virtue with growth = 0 unless that virtue is in `intentionallySkewed`
- Any choice has `apply_karma` calls that don't match its `# delta:` declaration

This blocks merges of imbalanced modules unless the imbalance is explicitly declared in `module.json`.

---

## 8. Author workflow

The end-to-end flow for a writer producing a module:

1. **Pick an archetype.** Choose a Howard public-domain character or design original. Set `archetype` and `intentionallySkewed` in `module.json`.
2. **Outline atoms.** For each scene, decide tier and which virtues are at stake.
3. **Write in Inky.** Use the `# atom:`, `# tier:`, `# touches:`, `# delta:` tag conventions. Test choices via Inky's play-as-you-write preview.
4. **Run GPE locally.** `npm run gpe modules/my-module/main.ink`. Review the balance scorecard.
5. **Iterate.** If GPE flags imbalance and the author wants balance, add atoms touching the underrepresented virtues. If the imbalance is intentional, declare it in `module.json`.
6. **Commit.** Pre-commit hook runs `gpe --strict`. CI re-runs it on the PR.
7. **Compile + test.** `npm run compile-modules` produces the `.json`. Local Living Eamon dev server loads it. Playtest end-to-end with Jane in the loop.
8. **Ship.** Module deploys to production; GPE report is attached to the release notes.

---

## 9. First module reference: Solomon Kane in the Whispering Woods

Use this as the canonical first module. The PD source is `Skulls in the Stars` (1929, US PD since 2025-01-01). The atom design naturally exercises Integrity (vow to a dying man), Courage (a haunted moor at night), Spirituality (Puritan piety), and +Illumination (slaying a vengeful spirit). Module GPE score should be 15–25 — intentionally skewed toward the Light Path archetype.

**Folder structure:**

```
modules/solomon-kane-whispering-woods/
├── main.ink
├── module.json
└── README.md
```

**`module.json`:**

```json
{
  "id": "solomon-kane-whispering-woods",
  "title": "Solomon Kane in the Whispering Woods",
  "author": "scotch-glass",
  "contractVersion": "1.0.0",
  "tier": "moderate",
  "actionBudget": 25,
  "archetype": "solomon-kane",
  "intentionallySkewed": ["passion", "standing"],
  "summary": "A dying man's final breath becomes a vow. Kane tracks a vengeful spirit through woods where the trees whisper in dead languages.",
  "publicDomainSource": "Robert E. Howard, 'Skulls in the Stars' (Weird Tales, January 1929) — US public domain since 2025-01-01",
  "estimatedPlaytime": 45,
  "entryKnot": "the_dying_man"
}
```

**`main.ink` skeleton (illustrative — the author fills in prose):**

```ink
VAR vow_taken = false
VAR encountered_spirit = false

=== the_dying_man ===
# atom: the_dying_man
# tier: defining
# touches: I+, C±

The peasant's blood paints the moor in widening copper.
[Jane will render this beat in Tolkienian-GrimDark.]

* [Kneel and swear to avenge him]
    ~ apply_karma("integrity", 10)
    ~ vow_taken = true
    ~ set_flag("vowed_to_avenge_blacksmith", "life")
    # delta: I+10
    "By God who watches even this," you say. The vow takes you like a fever.
    -> the_moor_at_dusk
* [Comfort him, but make no promise]
    ~ apply_karma("integrity", 1)
    ~ apply_karma("spirituality", 2)
    # delta: I+1, Sp+2
    You hold his hand until the trembling stops. The moor accepts another silence.
    -> the_moor_at_dusk
* [Rifle his pockets first]
    ~ apply_karma("integrity", -5)
    ~ apply_karma("illumination", -3)
    # delta: I-5, Il-3
    Three coppers and a bone-charm. You leave him in the heather. Something watches.
    -> the_moor_at_dusk

=== the_moor_at_dusk ===
# atom: the_moor_at_dusk
# tier: notable
# touches: C+, Sp+, Il+

[... and so on ...]
```

---

## 10. Implementation order

Map to the existing sprint structure in `KARMA_SYSTEM.md` §5. The Ink + GPE work is **Sprint 4 + new Sprint 4b** in that ordering.

| Sprint | Scope | New work in this spec |
|--------|-------|------------------------|
| **1** | Stamina + fatigue + actionBudget bedrock | (per KARMA_SYSTEM.md §5) |
| **2** | PICSSI bedrock, cold-delete legacy 10-virtue | `lib/karma/types.ts`, `applyKarma.ts`, `recompute.ts` |
| **3** | Activity dispatcher | `lib/karma/activities.ts` |
| **4** | Ink loader + binding + module dispatch | `lib/karma/loader.ts` (with `inkjs/full` fall-through), `binding.ts`; `scripts/compile-modules.ts`; build pipeline |
| **4b** | First module: Solomon Kane Whispering Woods | `modules/solomon-kane-whispering-woods/`; full end-to-end loop with Jane in the loop |
| **5** | Combat-PICSSI generation | `lib/karma/combat-deltas.ts`; combatEngine hook points (§6); ordered-retreat UI |
| **5b** | GPE static analyzer | `tools/gpe/`; `--strict` CI gate |
| **6** | UI polish — PICSSI bars, affection panel, karma history log | (per KARMA_SYSTEM.md §5 Sprint 6) |
| **7** | Sorcery + Illumination drain | (deferred, per KARMA_SYSTEM.md §5 Sprint 7) |

Sprint 4 → 4b → 5 → 5b is the critical path for "writers can produce balanced modules." Get to the end of 5b before opening authoring to anyone else.

---

## 11. Acceptance criteria

The module system ships when ALL of the following are true:

### 11.1 Runtime

- [ ] `lib/karma/types.ts`, `applyKarma.ts`, `recompute.ts` exist and pass unit tests covering: clamping at virtue bounds, derived stat recomputation correctness, illumination bipolar handling, VD STR penalty, caps-raise-currents-flat semantics.
- [ ] DB migration applied: 6 PICSSI columns, npc_affection JSONB, flags_life + flags_legacy JSONB, vd_active boolean, current_stamina + max_stamina + fatigue_pool + action_budget integers. Legacy 10-virtue columns dropped.
- [ ] `bindInkExternals` registers all functions in §4.2; `syncInkVariables` populates all variables in §4.1 from PlayerState; both round-trip-tested via a fixture story.
- [ ] `compile-modules` script compiles all `.ink` files to `.json` in `public/modules/` without error.

### 11.2 Combat

- [ ] All hook points in §6.1 wired in `combatEngine.ts`; emit `CombatContext` events.
- [ ] `applyCombatDeltas` applied at `endCombat`; results visible in post-combat summary UI.
- [ ] Per-ally FLEE buttons present in combat UI (§6.2).
- [ ] Triple-penalty applied correctly when player flees with non-fled allies remaining (test: 1 ally abandoned = -10 Courage, -10 Standing, -5 Integrity; 2 abandoned = doubled).
- [ ] Ordered retreat path verified: all allies fled first, then player → only -1 Courage applied, no Standing or Integrity loss.

### 11.3 GPE

- [ ] `tools/gpe/index.ts` runs against any `.ink` file without error.
- [ ] Output formats: terminal-friendly (default), JSON (`--json`), SVG (`--svg <path>`).
- [ ] `--strict` mode exits non-zero on score < 20 without `intentionallySkewed`, on missing `# delta:` declarations, on declaration/apply_karma mismatches.
- [ ] CI workflow runs `gpe:all --strict` on every PR; failing modules block merge.
- [ ] At least one Howard module (Solomon Kane Whispering Woods) ships end-to-end and passes GPE in `--strict` mode with `intentionallySkewed` declared.

### 11.4 Author experience

- [ ] `modules/_template/` exists with starter `main.ink`, `module.json`, `README.md` — one command bootstraps a new module: `npm run new-module -- my-module-name`.
- [ ] Documentation: `MODULE_AUTHORING_GUIDE.md` walks a writer from "I have an idea" to "my module is in production," covering Inky setup, tag conventions, EXTERNAL functions, GPE workflow, and how Jane handles narration.
- [ ] At least one non-developer (Scotch will arrange) authors a module end-to-end as a usability test before opening contributions externally.

---

## Appendix A: Ink tag reference

```
# atom: <snake_case_id>            # required, unique
# tier: trivial|notable|major|defining   # required
# touches: <V±>, <V±>, ...          # required, e.g. P+, I-, C±
# trigger: <expr>                  # optional, e.g. location=any_tavern
# delta: <V><sign><n>, ...          # required on choices, e.g. I+3, S+5
# scope: life|legacy                # optional on set_flag, default life
# requires_item: <item_id>          # optional, gates atom on inventory
# requires_flag: <flag_name>        # optional, gates atom on flag set
```

## Appendix B: Suggested package additions

```json
{
  "dependencies": {
    "inkjs": "^2.x"
  },
  "devDependencies": {
    "tsx": "^4.x",
    "glob": "^10.x"
  },
  "scripts": {
    "compile-modules": "tsx scripts/compile-modules.ts",
    "new-module": "tsx scripts/new-module.ts",
    "validate-modules": "tsx scripts/validate-modules.ts",
    "gpe": "tsx tools/gpe/index.ts",
    "gpe:all": "tsx tools/gpe/index.ts \"modules/**/main.ink\"",
    "prebuild": "npm run validate-modules && npm run compile-modules && npm run gpe:all -- --strict"
  }
}
```

**Note on imports:** Use `import { Story, Compiler } from 'inkjs/full'` in `lib/karma/loader.ts` and `scripts/compile-modules.ts`. The lighter `import { Story } from 'inkjs'` runtime build does NOT include the Compiler and will fail the runtime fall-through.

## Appendix C: References

- `KARMA_SYSTEM.md` — full PICSSI design (six virtues, magnitudes, activity table, combat deltas, sprints)
- `GAME_DESIGN.md` §11 — canonical PICSSI definitions
- `SORCERY.md` — Eight Circles + Illumination cost table
- Inkle Ink: https://github.com/inkle/ink
- inkjs: https://github.com/y-lohse/inkjs
- Inky editor: https://github.com/inkle/inky
- Howard public domain status: track yearly via Public Domain Day; Solomon Kane (1928–1929 stories) and Kull (1929+) currently US PD; Bran Mak Morn 1930 stories newly PD as of 2026; Conan reaches US PD January 2028.

---

*End of Stage I draft. Awaiting Scotch's approval before Claude Code begins implementation. Open questions, if any, should be logged in this doc's §11 acceptance criteria as failing checkboxes.*
