---
name: Stamina and Fatigue Recovery
description: Out-of-combat stamina + fatiguePool recovery system inspired by HWRR
type: design-canon
visibility: internal
---

# Stamina & Fatigue Recovery — Out-of-Combat Pacing

## Vision

**Living Eamon is about story, not about fighting with an exhausted character.** Stamina recovery is intentionally gentle outside of combat, encouraging players to rest rather than grind through injury.

The system is inspired by *Heads Will Roll Reforged* (HWRR), which uses a per-turn fatigue-pool recovery that scales with player endurance. Living Eamon simplifies this to let players recover naturally between encounters.

## Mechanics

### Stamina Pool (Sprint 1)

- **Current stamina:** 0–maxStamina. Drains per swing in combat; resets to maxStamina at fight end.
- **Max stamina:** `35 + 2·STR_eff`. Recomputed when Passion changes (Sprint 2).
- **Fatigue pool:** Persistent accumulator, always ≤ 0. Drains per swing; recovers slowly out of combat.
- **Fatigue tiers:** 0–4, computed from `fatiguePool ÷ maxStamina`:
  - Tier 0 (fresh): `fatigue_pool > −maxStamina`
  - Tier 1 (winded): `−maxStamina ≥ fatigue_pool > −2·maxStamina`
  - Tier 2 (tired): `−2·maxStamina ≥ fatigue_pool > −3·maxStamina`
  - Tier 3 (flagging): `−3·maxStamina ≥ fatigue_pool > −4·maxStamina`
  - Tier 4 (exhausted): `fatigue_pool ≤ −4·maxStamina` → **player cannot act in combat**

### In-Combat Drain (lib/combat/engine.ts)

Every strike (hit, miss, or evaded) drains stamina by a weapon-specific cost:
- Short sword: 10
- Long sword: 13
- Great sword: 18
- Unarmed: 6

Both `stamina` and `fatiguePool` drain. Stamina resets to max at combat end; fatiguePool does not.

**Tier 4 gate:** If the player reaches tier 4 exhaustion during combat, they cannot act on their next turn. The turn is forfeited; they print *"You are utterly exhausted. You cannot raise your arms."*

### Combat-End Recovery (lib/gameEngine.ts:applyCombatEndRecovery)

After victory:
- Stamina resets to maxStamina
- FatiguePool recovers by `enemiesKilled · maxStamina · 1.5` (or `maxStamina · 0.5` for 0 kills)
- Recovery is clamped at 0 (never goes positive)

### Out-of-Combat Recovery (lib/gameState.ts:tickWorldState)

Every turn outside of combat, if the player has stamina > 0:
- **Recovery per turn:** `ceil(maxStamina · 0.1)`
- **Clamped at 0** (never goes positive)

**Example:** A hero with 55 maxStamina recovers ~5-6 fatiguePool per turn at rest.

This gentle per-turn recovery encourages players to camp, rest, or seek shelter rather than pressing on when injured. It is **not** gated on explicit rest activities — any out-of-combat turn counts. Sprint 3's activity dispatcher (PRAY/DRINK/REST) will add bonuses to this base recovery.

## HWRR Inspiration

*Heads Will Roll Reforged* uses:
```
fatigueRecovery = ceil(stamina_max * 0.1) + ceil(endurance / 4)
if (double_recovery_condition) fatigueRecovery *= 2
if (drank_alcohol) fatigueRecovery += 5
if (prayed) fatigueRecovery += 3
...
fatiguePool += fatigueRecovery (clamped at 0)
```

Living Eamon adopts the per-turn tick + clamp-at-0 semantics but keeps the base calculation simple (no endurance divisor, no blessings in Sprint 1). Sprint 3's activity dispatcher will layer in activity bonuses (PRAY, DRINK, meditation, etc.) without complicating the base.

## Regen Gate

Out-of-combat HP/mana regen is gated on `stamina > 0` per KARMA_SYSTEM.md §2.3. A body with no stamina cannot repair itself. The fatiguePool recovery uses the same gate — if you're too tired to move, you can't heal.

## UI Display (Sprint 6)

The stats panel will surface:
- Stamina: `{current} / {max}`
- Fatigue tier: 0–4 with labels (Fresh, Winded, Tired, Flagging, Exhausted)
- Tier-specific visual feedback (e.g., red tint at tier 3–4)

The combat round narrative shows fatiguePool recovery after a kill: *"Fatigue −12"* (green text).

## Notes

- No activity prevents stamina drain (you *always* pay the weapon cost in combat).
- Tier 4 is a **hard gate**, not a penalty. When you hit it, your turn is forfeit; narrative prints a warning.
- Rest activities (Sprint 3) do NOT reset fatiguePool to 0 — they just add a bonus to the per-turn recovery. Recovering from deep exhaustion takes time.
- The design mirrors HWRR's philosophy: fatigue is a resource management problem, not a grind-more problem.
