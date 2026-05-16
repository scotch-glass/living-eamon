// Sprint C6 — Permanent reset-enabled combat-UI test arena.
//
// This page is the canonical evaluation harness for the production
// CombatScreen component. It is NOT torn down after C6 ships — it
// stays as permanent dev infrastructure for future combat-feature
// tests (spells, death sprites, environmental damage, blood + gore,
// etc.). The Reset button rebuilds the session + characters back to
// start-of-combat so we can iterate on a fight repeatedly.
//
// Local React state only — no Supabase round-trip, no live-game save
// touched. Per `feedback_test_hero_gaius`: hero is always Gaius.
"use client";

import { useCallback, useMemo, useState } from "react";
import CombatScreen from "../../../components/CombatScreen";
import {
  initMultiCombatSession,
  resolveAction,
  runAiTurns,
  type CombatAction,
} from "../../../lib/combat/engine";
import type { ActiveCombatSession, BodyZone } from "../../../lib/combat/types";
import { BODY_ZONES } from "../../../lib/combat/types";
import { createInitialWorldState, type WorldState } from "../../../lib/gameState";
import {
  CANONICAL_PARTY_SPEC,
  ANCIENT_RUIN_BACKGROUND,
} from "../../../lib/combat/sprites";

function buildHeroState(): WorldState {
  const base = createInitialWorldState("Gaius");
  // Test-arena hero: full spell roster (every Circle 1-3 entry in
  // COMBAT_SPELLS so we can exercise UI placement and resolution for
  // every spell), full consumable assortment (every potion + bandage
  // type so every USE path is testable from the hero slot).
  return {
    ...base,
    player: {
      ...base.player,
      hp: 50,
      maxHp: 50,
      currentMana: 40,
      maxMana: 40,
      knownSpells: [
        "HEAL", "BLAST", "POWER", "SPEED",
        "GREATER-HEAL", "FIREBOLT", "HASTE", "WARD", "STEELSKIN",
        "SILENCE", "RESIST", "DAYLIGHT", "CLEANSE",
      ],
      combatHotbar: ["HEAL", "BLAST", "POWER", "SPEED", "FIREBOLT", "WARD"],
      weapon: "great_sword",
      inventory: [
        ...(base.player.inventory ?? []),
        { itemId: "great_sword",            quantity: 1 },
        { itemId: "healing_potion",         quantity: 3 },
        { itemId: "greater_healing_potion", quantity: 1 },
        { itemId: "mana_potion",            quantity: 2 },
        { itemId: "stamina_brew",           quantity: 1 },
        { itemId: "fatigue_brew",           quantity: 1 },
        { itemId: "antidote",               quantity: 1 },
        { itemId: "strong_antidote",        quantity: 1 },
        { itemId: "bandage",                quantity: 4 },
        { itemId: "tourniquet",             quantity: 1 },
      ],
    },
  };
}

function buildFreshSession(state: WorldState): ActiveCombatSession {
  const session = initMultiCombatSession(state, CANONICAL_PARTY_SPEC, {
    backgroundUrl: ANCIENT_RUIN_BACKGROUND,
  });
  if (!session) {
    throw new Error("initMultiCombatSession returned null — check NPC registry");
  }
  return session;
}

// Parse one onCommand string from CombatScreen into a CombatAction.
// Mirrors the ACT/<verb>/<args> grammar in lib/gameEngine.ts:4495.
function parseAct(cmd: string): CombatAction | "ai_turn" | null {
  const tokens = cmd.trim().split(/\s+/);
  const first = tokens[0]?.toUpperCase();
  if (first === "AI_TURN") return "ai_turn";
  if (first !== "ACT") return null;
  const sourceId = (tokens[1] ?? "").toLowerCase();
  const verb = (tokens[2] ?? "").toUpperCase();
  switch (verb) {
    case "STRIKE": {
      const zone = (tokens[3] ?? "").toLowerCase() as BodyZone;
      const targetId = (tokens[4] ?? "").toLowerCase();
      if (!BODY_ZONES.includes(zone) || !targetId) return null;
      return { kind: "strike", sourceId, targetId, zone };
    }
    case "CAST": {
      const spellName = (tokens[3] ?? "").toUpperCase();
      const targetId = (tokens[4] ?? "").toLowerCase();
      if (!spellName || !targetId) return null;
      return { kind: "cast", sourceId, targetId, spellName };
    }
    case "USE":
    case "DRINK": {
      const itemId = (tokens[3] ?? "").toLowerCase();
      const targetId = (tokens[4] ?? sourceId).toLowerCase();
      if (!itemId) return null;
      return { kind: "use", sourceId, targetId, itemId };
    }
    case "FLEE":
      return { kind: "flee", sourceId };
    default:
      return null;
  }
}

export default function CombatTestPage(): React.JSX.Element {
  const heroState = useMemo(() => buildHeroState(), []);
  const [session, setSession] = useState<ActiveCombatSession>(() =>
    buildFreshSession(heroState),
  );
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setSession(buildFreshSession(heroState));
    setCombatLog([]);
    setLoading(false);
  }, [heroState]);

  const handleCommand = useCallback(
    (cmd: string) => {
      const parsed = parseAct(cmd);
      if (parsed === null) {
        setCombatLog((log) => [...log, `[unknown command: ${cmd}]`]);
        return;
      }

      setLoading(true);
      let next = session;
      const newLines: string[] = [];

      if (parsed === "ai_turn") {
        const ai = runAiTurns(next);
        next = ai.session;
        if (ai.narrative) newLines.push(...ai.narrative.split("\n").filter(Boolean));
      } else {
        const result = resolveAction(next, parsed);
        if (result.invalid) {
          newLines.push(`[refused: ${result.invalid}]`);
        } else {
          next = result.session;
          if (result.narrative) newLines.push(...result.narrative.split("\n").filter(Boolean));
          // Auto-advance through any AI turns that follow until a
          // player-controlled non-channeling combatant has the pointer
          // (or combat ends).
          if (!next.finished) {
            const ai = runAiTurns(next);
            next = ai.session;
            if (ai.narrative) newLines.push(...ai.narrative.split("\n").filter(Boolean));
          }
        }
      }

      setSession(next);
      setCombatLog((log) => [...log, ...newLines].slice(-50));
      setLoading(false);
    },
    [session],
  );

  // Pull hero stats off the live combatant so HP/mana bars track damage.
  const hero = session.combatants.find((c) => c.npcId == null) ?? session.playerCombatant;

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0a0805" }}>
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: 100,
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "rgba(20,12,6,0.85)",
          border: "1px solid #92400e",
          borderRadius: 6,
          padding: "6px 10px",
          fontFamily: "Georgia, serif",
          color: "#e8d4a0",
          fontSize: 13,
        }}
      >
        <span style={{ fontWeight: 700 }}>Combat-UI Test Arena</span>
        <button
          onClick={reset}
          style={{
            background: "#7c2d12",
            color: "#fde68a",
            border: "1px solid #b45309",
            borderRadius: 4,
            padding: "4px 10px",
            cursor: "pointer",
            fontFamily: "Georgia, serif",
            fontWeight: 700,
          }}
        >
          ↻ Reset
        </button>
        <span style={{ opacity: 0.7 }}>
          Round {session.roundNumber} · {session.combatants.filter(c => c.hp > 0).length} alive
          {session.finished && (session.playerWon ? " · Victory" : " · Defeat")}
        </span>
      </div>

      <CombatScreen
        session={session}
        playerHp={hero.hp}
        playerMaxHp={hero.maxHp}
        playerMana={hero.mana}
        playerMaxMana={hero.maxMana}
        playerState={heroState.player}
        combatLog={combatLog}
        loading={loading}
        onCommand={handleCommand}
      />
    </div>
  );
}
