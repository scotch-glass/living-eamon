"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { WorldState, createInitialWorldState } from "../lib/gameState";
import { ITEMS, NPCS, type Item } from "../lib/gameData";
import { isTwoHanded } from "../lib/uoData";
import CommandInput, { type CommandInputHandle } from "../components/CommandInput";
import CombatScreen from "../components/CombatScreen";
import { fromSplatterStates, toSplatterStates, type BloodSplatter } from "../lib/bloodSplatterData";
import LootScreen, { type LootEntry } from "../components/LootScreen";
import { SITUATION_BLOCK_LINE } from "../lib/gameEngine";
import { logoutAction } from "./auth/actions";
import { createBrowserSupabase } from "../lib/supabaseAuthClient";
import ScenePanel from "../components/ScenePanel";
import NPCSprite from "../components/NPCSprite";
import ItemDetailPopup from "../components/ItemDetailPopup";
import EquipmentGrid from "../components/EquipmentGrid";
import BackpackPanel from "../components/BackpackPanel";
import ItemActionMenu, { getItemActions, type ItemAction, type ItemContext } from "../components/ItemActionMenu";
import ComparePopup from "../components/ComparePopup";
import BulkSellPopup from "../components/BulkSellPopup";
import { getRoom } from "../lib/adventures/registry";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BARMAID_IDS = ["lira", "mavia", "seraine"] as const;
const BARMAID_NAMES: Record<string, string> = {
  lira: "Lira",
  mavia: "Mavia",
  seraine: "Seraine",
};

function BarmaidPortrait({ barmaidId }: { barmaidId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch(`/api/barmaid-image?id=${encodeURIComponent(barmaidId)}`)
      .then(r => r.json())
      .then((data: { url: string | null }) => {
        setUrl(data.url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [barmaidId]);

  return (
    <div
      style={{
        width: 140,
        height: 187,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "rgba(30,30,40,0.6)",
        border: "1px solid rgba(251,191,36,0.2)",
      }}
    >
      {loading && (
        <div
          style={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(90deg, rgba(30,30,40,0.4) 25%, rgba(50,50,60,0.4) 50%, rgba(30,30,40,0.4) 75%)",
            backgroundSize: "200% 100%",
            animation: "le-shimmer 1.5s infinite",
          }}
        />
      )}
      {!loading && url && (
        <img
          src={url}
          alt={BARMAID_NAMES[barmaidId] ?? barmaidId}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      {!loading && !url && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(148,163,184,0.5)",
            fontSize: 11,
          }}
        >
          {BARMAID_NAMES[barmaidId] ?? "?"}
        </div>
      )}
    </div>
  );
}

const CHAR_DELAY = 12;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"stats" | "gear" | "pack">("stats");
  const [actionMenu, setActionMenu] = useState<{
    item: import("../lib/gameData").Item;
    context: ItemContext;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const [started, setStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [inCombat, setInCombat] = useState(false);
  // Combat narration is isolated from the main message stream so room
  // descriptions, Jane chat, examines, etc. can never leak into it.
  // Only populated by responses to STRIKE / FLEE / ATTACK commands.
  const [combatBoxLog, setCombatBoxLog] = useState<string[]>([]);
  // Tracks the previous activeCombat NPC id so we can detect "combat
  // started fresh" and reset the log even if the player chains fights.
  const prevEnemyIdRef = useRef<string | null>(null);
  // Post-combat loot screen state. Null = not showing.
  const [lootScreen, setLootScreen] = useState<{
    enemyName: string;
    gold: number;
    items: LootEntry[];
  } | null>(null);
  const [conversationNpcId, setConversationNpcId] = useState<string | null>(null);
  const [itemPopupId, setItemPopupId] = useState<string | null>(null);
  const [compareItem, setCompareItem] = useState<{ item: Item; equippedSlot: string } | null>(null);
  const [bulkSellVendor, setBulkSellVendor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<CommandInputHandle>(null);
  const charQueueRef = useRef<string[]>([]);
  const typingRef = useRef(false);
  const displayedRef = useRef("");
  const skipTypingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chatOuterRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  const messageCount = messages.length;
  useEffect(() => {
    if (!userScrolledRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageCount]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      userScrolledRef.current = (scrollHeight - scrollTop - clientHeight) > 100;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isTyping) {
        e.preventDefault();
        skipTypingRef.current = true;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTyping]);

  useEffect(() => {
    if (!started) return;
    inputRef.current?.focus();
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [started]);

  useEffect(() => {
    if (!started || loading || isTyping) return;
    inputRef.current?.focus();
  }, [started, loading, isTyping]);

  useEffect(() => {
    if (!started) return;
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (loading || isTyping) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (active?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
      setInput(prev => prev + e.key);
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [started, loading, isTyping]);

  const drainQueue = useCallback(() => {
    if (typingRef.current) return;
    typingRef.current = true;
    setIsTyping(true);
    const tick = () => {
      if (charQueueRef.current.length === 0) {
        typingRef.current = false;
        setIsTyping(false);
        skipTypingRef.current = false;
        return;
      }
      if (skipTypingRef.current) {
        const remaining = charQueueRef.current.join("");
        charQueueRef.current = [];
        displayedRef.current += remaining;
        const displayed = displayedRef.current;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: displayed };
          }
          return updated;
        });
        typingRef.current = false;
        setIsTyping(false);
        skipTypingRef.current = false;
        return;
      }
      const char = charQueueRef.current.shift()!;
      displayedRef.current += char;
      const displayed = displayedRef.current;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = { ...last, content: displayed };
        }
        return updated;
      });
      setTimeout(tick, CHAR_DELAY);
    };
    tick();
  }, []);

  const streamResponse = async (
    messagesToSend: Message[],
    currentState: WorldState | null,
    playerName?: string,
    pid?: string
  ) => {
    // Only combat-action commands should populate the combat log. Any other
    // response (Jane chat, examine, look, etc.) that happens to come back
    // while activeCombat is set must NOT leak into the combat narration.
    const lastUserCmd = (
      messagesToSend[messagesToSend.length - 1]?.content ?? ""
    ).trim().toUpperCase();
    const isCombatCmd =
      lastUserCmd === "FLEE" ||
      lastUserCmd.startsWith("STRIKE ") ||
      lastUserCmd.startsWith("ATTACK ") ||
      lastUserCmd === "ATTACK" ||
      lastUserCmd.startsWith("CAST ");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messagesToSend,
        worldState: currentState,
        playerId: pid ?? playerId ?? currentState?.player?.id,
        playerName: playerName,
      }),
    });

    if (!res.ok) throw new Error("Stream failed");

    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as {
        response: string;
        worldState: WorldState & { playerId?: string | null };
      };
      const ws = data.worldState as WorldState & { playerId?: string | null; conversationNpcId?: string | null };
      setWorldState(ws);
      if (ws.playerId) setPlayerId(ws.playerId);
      setConversationNpcId(ws.conversationNpcId ?? null);
      // If a finished combat session was persisted to DB, clear it now
      // rather than showing a dead combat screen with disabled buttons.
      if (ws.player?.activeCombat?.finished) {
        ws.player.activeCombat = null;
      }
      const nowInCombat = ws.player?.activeCombat != null;
      setInCombat(nowInCombat);

      // ── Combat narration (isolated from chat messages) ──
      // The combat box reads ONLY this state. Nothing else writes to it.
      // Reset whenever a new fight starts (different enemy id) or when
      // combat ends. Only push the response when the user's command was
      // an explicit combat action.
      const newEnemyId = ws.player?.activeCombat?.enemyNpcId ?? null;
      if (nowInCombat) {
        if (newEnemyId !== prevEnemyIdRef.current) {
          // Fresh fight (or restored from save) — start with a clean log.
          setCombatBoxLog([]);
        }
        if (isCombatCmd) {
          // Strip combat tokens + situation blocks (exits, room items, NPC
          // lists) that may have survived the server-side gate. This is the
          // nuclear fallback — even if appendSituation fails to suppress,
          // the client-side strip prevents room text from ever reaching the
          // combat narration log.
          const raw = data.response
            .replace(/__COMBAT_START__|__COMBAT_END__|__COMBAT_VICTORY__/g, "")
            .trim();
          // Strip anything after a dashed-box situation header (Exits: / ● / 👁)
          const situationIdx = raw.search(/\n\s*(Exits|●|👁)/);
          const clean = situationIdx > 0 ? raw.slice(0, situationIdx).trim() : raw;
          if (clean) setCombatBoxLog(prev => [...prev, clean].slice(-20));
        }

        // Victory: combat screen stays up (activeCombat still set with
        // finished=true). Build loot and show it overlaid on combat.
        if (data.response.includes("__COMBAT_VICTORY__") && isCombatCmd) {
          const defeatedNpcId = ws.player?.activeCombat?.enemyNpcId ?? prevEnemyIdRef.current;
          if (defeatedNpcId) {
            const npc = NPCS[defeatedNpcId];
            if (npc) {
              const lootItems: LootEntry[] = [];
              if (npc.isTrainingDummy) {
                // Dufus drops 1-4 wood shavings
                const shavingCount = 1 + Math.floor(Math.random() * 4);
                const shavingItem = ITEMS["wood_shavings"];
                if (shavingItem) lootItems.push({ item: shavingItem, quantity: shavingCount });
              } else {
                // Real enemies: gold + merchant inventory drops
                const goldDrop = Math.max(1, Math.floor((npc.stats?.hp ?? 20) * 0.5 + Math.random() * 10));
                if (npc.merchant?.inventory) {
                  const pool = npc.merchant.inventory
                    .map((mid: string) => ITEMS[mid])
                    .filter((it): it is NonNullable<typeof it> => it != null && it.isCarryable);
                  const count = Math.min(pool.length, 1 + Math.floor(Math.random() * 2));
                  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
                  shuffled.forEach(it => lootItems.push({ item: it, quantity: 1 }));
                }
                setLootScreen({
                  enemyName: npc.name,
                  gold: goldDrop,
                  items: lootItems,
                });
              }
              // Dufus: show loot with 0 gold
              if (npc.isTrainingDummy) {
                setLootScreen({
                  enemyName: npc.name,
                  gold: 0,
                  items: lootItems,
                });
              }
            }
          }
        }
      } else {
        // Combat ended via death or flee (__COMBAT_END__, activeCombat already null)
        setCombatBoxLog([]);
      }
      prevEnemyIdRef.current = newEnemyId;

      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      return;
    }

    if (!res.body) throw new Error("Stream failed");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let rawBuffer = "";

    displayedRef.current = "";
    charQueueRef.current = [];
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      rawBuffer += decoder.decode(value, { stream: true });

      // Detect __NPC__npcId__ token early to prefetch sprite while text streams
      const npcMatch = rawBuffer.match(/^__NPC__([a-z_]+)__/);
      if (npcMatch && npcMatch[1]) {
        setConversationNpcId(npcMatch[1]);
        rawBuffer = rawBuffer.slice(npcMatch[0].length);
      }

      const stateIdx = rawBuffer.indexOf("__STATE__");
      const visibleText = stateIdx >= 0 ? rawBuffer.slice(0, stateIdx) : rawBuffer;

      const alreadyQueued = displayedRef.current.length + charQueueRef.current.length;
      const newChars = visibleText.slice(alreadyQueued);
      for (const char of newChars) {
        charQueueRef.current.push(char);
      }
      drainQueue();

      if (stateIdx >= 0) {
        const stateJson = rawBuffer.slice(stateIdx + "__STATE__".length);
        try {
          if (stateJson.trim().startsWith("{")) {
            const newState = JSON.parse(stateJson.trim());
            setWorldState(newState);
            if (newState.playerId) setPlayerId(newState.playerId);
            setConversationNpcId(newState.conversationNpcId ?? null);

            // Combat mode: derive from state
            const nowInCombat = newState.player?.activeCombat != null;
            setInCombat(nowInCombat);

            // Combat narration is fully isolated — see the JSON branch above
            // for the full rationale. Same rules apply on the streaming path.
            const newEnemyId = newState.player?.activeCombat?.enemyNpcId ?? null;
            if (nowInCombat) {
              if (newEnemyId !== prevEnemyIdRef.current) {
                setCombatBoxLog([]);
              }
              if (isCombatCmd) {
                const rawText = visibleText
                  .replace(/__COMBAT_START__|__COMBAT_END__|__COMBAT_VICTORY__/g, "")
                  .trim();
                // Strip any situation block that leaked through
                const sitIdx = rawText.search(/\n\s*(Exits|●|👁)/);
                const cleanText = sitIdx > 0 ? rawText.slice(0, sitIdx).trim() : rawText;
                if (cleanText) {
                  setCombatBoxLog(prev => [...prev, cleanText].slice(-20));
                }
              }
            } else {
              setCombatBoxLog([]);
            }
            prevEnemyIdRef.current = newEnemyId;
          }
        } catch { /* keep existing */ }
        break;
      }
    }

    await new Promise<void>(resolve => {
      const check = () => {
        if (charQueueRef.current.length === 0 && !typingRef.current) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const supabase = createBrowserSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch(
          `/api/player?id=${encodeURIComponent(user.id)}`
        );
        if (cancelled) return;

        if (!res.ok) {
          setStarted(true);
          setMessages([
            {
              role: "assistant",
              content:
                "The realm stirs... but your hero could not be found. Try signing in again or completing registration.",
            },
          ]);
          setLoading(false);
          return;
        }

        const data = (await res.json()) as { player?: { id: string; character_name?: string } };
        const row = data.player;
        if (cancelled || !row?.id) {
          setStarted(true);
          setMessages([
            {
              role: "assistant",
              content:
                "The realm stirs... but something is wrong. Refresh and try again.",
            },
          ]);
          setLoading(false);
          return;
        }

        const characterName = row.character_name?.trim() || "Adventurer";
        const initialState = createInitialWorldState(characterName);
        initialState.player.id = row.id;
        setPlayerId(row.id);
        setWorldState(initialState);
        setStarted(true);

        await streamResponse([], initialState, characterName, row.id);
      } catch (err) {
        console.error("Bootstrap error:", err);
        if (!cancelled) {
          setStarted(true);
          setMessages([
            {
              role: "assistant",
              content:
                "The realm stirs... but something is wrong. Refresh and try again.",
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
      inputRef.current?.focus();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only auth bootstrap; streamResponse is stable for this call pattern
  }, []);

  const sendMessage = async (commandOverride?: string) => {
    userScrolledRef.current = false;
    const text = (commandOverride ?? input).trim();
    if (!text || loading || isTyping) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      await streamResponse(newMessages, worldState, undefined, playerId ?? undefined);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "The realm falls silent for a moment..." }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const isJaneDirectVoice = (line: string): boolean => {
    const t = line.trim();
    if (t.length === 0 || t.length >= 120) return false;
    if (t.startsWith("*")) return false;
    if (!/^[a-z]/.test(t)) return false;
    const lower = t.toLowerCase();
    if (lower.startsWith("you ") || lower.startsWith("your ")) return false;
    return true;
  };

  // Renders a __CMD:COMMAND__ token as a clickable amber chip
  const renderCommandChip = (cmd: string, key: string) => (
    <button
      key={key}
      onClick={() => { void sendMessage(cmd); }}
      disabled={loading || isTyping}
      style={{
        display: "inline-block",
        backgroundColor: "rgba(146, 64, 14, 0.25)",
        color: "#fbbf24",
        border: "1px solid rgba(251,191,36,0.4)",
        borderRadius: 4,
        padding: "1px 8px",
        fontSize: 12,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        letterSpacing: "0.08em",
        cursor: loading || isTyping ? "default" : "pointer",
        margin: "0 3px",
        verticalAlign: "middle",
        opacity: loading || isTyping ? 0.5 : 1,
        transition: "background-color 0.15s",
      }}
      onMouseEnter={e => { if (!loading && !isTyping) (e.target as HTMLElement).style.backgroundColor = "rgba(146,64,14,0.45)"; }}
      onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = "rgba(146,64,14,0.25)"; }}
    >
      {cmd}
    </button>
  );

  // Renders a __ITEM:itemId__ token as a "read more" link that opens the alchemical popup
  const renderItemLink = (itemId: string, key: string) => (
    <button
      key={key}
      onClick={() => setItemPopupId(itemId)}
      style={{
        display: "inline-block",
        background: "transparent",
        color: "#a8845c",
        border: "none",
        borderBottom: "1px dotted #a8845c",
        padding: "0 2px",
        fontSize: 11,
        fontFamily: "Georgia, serif",
        fontStyle: "italic",
        cursor: "pointer",
        margin: "0 4px",
        verticalAlign: "middle",
      }}
    >
      📖 read more
    </button>
  );

  // Renders a __YESNO__ token as two YES / NO chips
  const renderYesNoChips = (key: string) => (
    <span key={key} style={{ display: "inline-flex", gap: 8, margin: "12px 0", alignItems: "center" }}>
      {["YES", "NO"].map((label) => (
        <button
          key={label}
          onClick={() => { void sendMessage(label); }}
          disabled={loading || isTyping}
          style={{
            backgroundColor: "rgba(146,64,14,0.25)",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.4)",
            borderRadius: 4,
            padding: "4px 18px",
            fontSize: 13,
            fontFamily: "Georgia, serif",
            letterSpacing: "0.1em",
            cursor: loading || isTyping ? "default" : "pointer",
            opacity: loading || isTyping ? 0.5 : 1,
            transition: "background-color 0.15s",
          }}
          onMouseEnter={e => { if (!loading && !isTyping) (e.target as HTMLElement).style.backgroundColor = "rgba(146,64,14,0.45)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = "rgba(146,64,14,0.25)"; }}
        >
          {label}
        </button>
      ))}
    </span>
  );

  // Renders a __BARMAID_SELECT__ token as three portrait cards with name chips
  const renderBarmaidSelect = (key: string) => (
    <div
      key={key}
      style={{
        display: "flex",
        gap: 16,
        justifyContent: "center",
        margin: "20px 0 12px",
        flexWrap: "wrap",
      }}
    >
      {BARMAID_IDS.map((id) => (
        <div
          key={id}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <BarmaidPortrait barmaidId={id} />
          <button
            onClick={() => { void sendMessage(id.toUpperCase()); }}
            disabled={loading || isTyping}
            style={{
              backgroundColor: "rgba(146,64,14,0.25)",
              color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.4)",
              borderRadius: 4,
              padding: "4px 18px",
              fontSize: 13,
              fontFamily: "Georgia, serif",
              letterSpacing: "0.1em",
              cursor: loading || isTyping ? "default" : "pointer",
              opacity: loading || isTyping ? 0.5 : 1,
              transition: "background-color 0.15s",
            }}
            onMouseEnter={e => { if (!loading && !isTyping) (e.target as HTMLElement).style.backgroundColor = "rgba(146,64,14,0.45)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = "rgba(146,64,14,0.25)"; }}
          >
            {BARMAID_NAMES[id]}
          </button>
        </div>
      ))}
    </div>
  );

  const formatMessage = (text: string, isLast: boolean) => {
    const cleanText = text.split("__STATE__")[0]
      .replace(/__COMBAT_START__|__COMBAT_END__|__COMBAT_VICTORY__/g, "")
      .replace(/__NPC__[a-z_]+__/g, "");
    // Note: __ITEM:__ tokens preserved here — the line parser handles them as chips
    const needle = "\n\n" + SITUATION_BLOCK_LINE + "\n";
    const sitIdx = cleanText.indexOf(needle);
    const narrative = sitIdx === -1 ? cleanText : cleanText.slice(0, sitIdx).trimEnd();
    const situation = sitIdx === -1 ? null : cleanText.slice(sitIdx + 2).trim();

    const lines = narrative.split("\n");
    const body = lines.map((line, i) => {
      if (isJaneDirectVoice(line)) {
        const t = line.trim();
        return (
          <p
            key={i}
            style={{
              marginBottom: 8,
              marginTop: 4,
              paddingLeft: 12,
              borderLeft: "3px solid rgba(251, 191, 36, 0.7)",
              fontStyle: "italic",
              fontSize: 14,
              lineHeight: 1.65,
              color: "#fde68a",
            }}
          >
            <span style={{ opacity: 0.55, marginRight: 6, userSelect: "none" }}>—</span>
            {t}
            {isLast && i === lines.length - 1 && !situation && (
              <span style={{ color: "#f59e0b", marginLeft: 2 }}>▌</span>
            )}
          </p>
        );
      }
      if (line.startsWith("*") && line.endsWith("*")) {
        return <p key={i} style={{ fontStyle: "italic", color: "rgba(251,191,36,0.7)", fontSize: 14, marginTop: 8 }}>{line.slice(1, -1)}</p>;
      }
      if (line.startsWith("—") || line.startsWith("HP:") || line.startsWith("Strength:")) {
        return <p key={i} style={{ fontFamily: "monospace", fontSize: 13, color: "rgba(251,191,36,0.8)", lineHeight: 1.6 }}>{line}</p>;
      }
      if (line.trim() === "") return <br key={i} />;
      // Barmaid select — full-line token
      if (line.trim() === "__BARMAID_SELECT__") {
        return renderBarmaidSelect(`barmaid-${i}`);
      }
      // Parse __CMD:COMMAND__, __YESNO__, and __ITEM:itemId__ tokens within the line
      if (line.includes("__YESNO__") || line.includes("__CMD:") || line.includes("__ITEM:")) {
        const parts: ReactNode[] = [];
        let remaining = line;
        let partIdx = 0;

        while (remaining.length > 0) {
          const yesnoIdx = remaining.indexOf("__YESNO__");
          const cmdIdx = remaining.indexOf("__CMD:");
          const itemIdx = remaining.indexOf("__ITEM:");

          // Find which token comes first
          let nextIdx = -1;
          let tokenType: "yesno" | "cmd" | "item" | null = null;

          const candidates: Array<[number, "yesno" | "cmd" | "item"]> = [];
          if (yesnoIdx !== -1) candidates.push([yesnoIdx, "yesno"]);
          if (cmdIdx !== -1) candidates.push([cmdIdx, "cmd"]);
          if (itemIdx !== -1) candidates.push([itemIdx, "item"]);
          candidates.sort((a, b) => a[0] - b[0]);
          if (candidates.length > 0) {
            nextIdx = candidates[0]![0];
            tokenType = candidates[0]![1];
          }

          if (nextIdx === -1 || tokenType === null) {
            if (remaining) parts.push(<span key={`t-${partIdx++}`}>{remaining}</span>);
            break;
          }

          // Text before the token
          if (nextIdx > 0) {
            parts.push(<span key={`t-${partIdx++}`}>{remaining.slice(0, nextIdx)}</span>);
          }

          if (tokenType === "yesno") {
            parts.push(renderYesNoChips(`yn-${partIdx++}`));
            remaining = remaining.slice(nextIdx + "__YESNO__".length);
          } else if (tokenType === "cmd") {
            const cmdEnd = remaining.indexOf("__", nextIdx + 6);
            if (cmdEnd === -1) {
              parts.push(<span key={`t-${partIdx++}`}>{remaining}</span>);
              break;
            }
            const cmd = remaining.slice(nextIdx + 6, cmdEnd);
            parts.push(renderCommandChip(cmd, `cmd-${partIdx++}`));
            remaining = remaining.slice(cmdEnd + 2);
          } else {
            // item token: __ITEM:itemId__
            const itemEnd = remaining.indexOf("__", nextIdx + 7);
            if (itemEnd === -1) {
              parts.push(<span key={`t-${partIdx++}`}>{remaining}</span>);
              break;
            }
            const itemId = remaining.slice(nextIdx + 7, itemEnd);
            parts.push(renderItemLink(itemId, `item-${partIdx++}`));
            remaining = remaining.slice(itemEnd + 2);
          }
        }

        return (
          <p key={i} style={{ marginBottom: 8, lineHeight: 1.9 }}>
            {parts}
            {isLast && i === lines.length - 1 && !situation && (
              <span style={{ color: "#f59e0b", marginLeft: 2 }}>▌</span>
            )}
          </p>
        );
      }

      return (
        <p key={i} style={{ marginBottom: 8, lineHeight: 1.7 }}>
          {line}
          {isLast && i === lines.length - 1 && !situation && (
            <span style={{ color: "#f59e0b", marginLeft: 2 }}>▌</span>
          )}
        </p>
      );
    });

    return (
      <>
        {body}
        {situation && (
          <pre
            style={{
              marginTop: 14,
              marginBottom: 0,
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.15)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 11,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.85)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {situation}
            {isLast && (
              <span style={{ color: "#f59e0b", marginLeft: 2 }}>▌</span>
            )}
          </pre>
        )}
      </>
    );
  };

  const player = worldState?.player;
  const weaponIsTwoHanded = player?.weapon ? isTwoHanded(player.weapon) : false;
  const topVirtues = player
    ? Object.entries(player.virtues)
        .filter(([, v]) => v !== 0)
        .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
        .slice(0, 5)
    : [];

  // Sync inCombat from worldState on rehydration
  useEffect(() => {
    if (worldState?.player?.activeCombat) {
      setInCombat(true);
    }
  }, [worldState?.player?.activeCombat]);

  const sendCombatCommand = (cmd: string) => {
    sendMessage(cmd);
  };

  // When collapsed: scroll inner container to bottom so latest text is visible
  useEffect(() => {
    if (!chatExpanded) {
      const inner = scrollContainerRef.current;
      if (inner) inner.scrollTop = inner.scrollHeight;
    }
  }, [chatExpanded, messages]);

  // Forward wheel events from outer (overflow:hidden) wrapper to inner scroll container when collapsed
  useEffect(() => {
    const outer = chatOuterRef.current;
    if (!outer) return;
    const handler = (e: WheelEvent) => {
      if (chatExpanded) return;
      const inner = scrollContainerRef.current;
      if (!inner) return;
      inner.scrollTop += e.deltaY;
      e.preventDefault();
    };
    outer.addEventListener("wheel", handler, { passive: false });
    return () => outer.removeEventListener("wheel", handler);
  }, [chatExpanded]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#000000", color: "#e5e7eb", position: "relative" }}>
      {/* NPC conversation sprite */}
      {!inCombat && <NPCSprite npcId={conversationNpcId} />}

      {/* Loot screen (post-combat) */}
      {lootScreen && (
        <LootScreen
          enemyName={lootScreen.enemyName}
          gold={lootScreen.gold}
          items={lootScreen.items}
          onTake={(itemIds, takeGold) => {
            // Give items to player — does NOT dismiss the loot screen.
            // Individual Takes remove from the LootScreen's internal list.
            // Take All calls this with all remaining items then onLeave.
            itemIds.forEach(id => {
              void sendMessage(`TAKE ${ITEMS[id]?.name?.toUpperCase() ?? id}`);
            });
            if (takeGold && lootScreen.gold > 0) {
              setWorldState(prev => prev ? {
                ...prev,
                player: { ...prev.player, gold: prev.player.gold + lootScreen.gold },
              } : prev);
            }
          }}
          onLeave={() => {
            // Dismiss loot screen + end combat + return to room
            setWorldState(prev => prev ? {
              ...prev,
              player: { ...prev.player, activeCombat: null },
            } : prev);
            setInCombat(false);
            setCombatBoxLog([]);
            setLootScreen(null);
          }}
        />
      )}

      {/* Item detail popup (alchemical book page) */}
      <ItemDetailPopup item={itemPopupId ? ITEMS[itemPopupId] ?? null : null} onClose={() => setItemPopupId(null)} />

      {/* Compare popup */}
      {compareItem && (
        <ComparePopup
          itemBeingCompared={compareItem.item}
          equippedItem={
            compareItem.equippedSlot === "weapon"
              ? player?.weapon && player.weapon !== "unarmed"
                ? ITEMS[player.weapon] ?? null
                : null
              : compareItem.equippedSlot === "armor"
                ? compareItem.item.stats?.zoneSlot === "head"
                  ? player?.helmet
                    ? ITEMS[player.helmet] ?? null
                    : null
                  : compareItem.item.stats?.zoneSlot === "neck"
                    ? player?.gorget
                      ? ITEMS[player.gorget] ?? null
                      : null
                    : compareItem.item.stats?.zoneSlot === "torso"
                      ? player?.bodyArmor
                        ? ITEMS[player.bodyArmor] ?? null
                        : null
                      : compareItem.item.stats?.zoneSlot === "limbs"
                        ? player?.limbArmor
                          ? ITEMS[player.limbArmor] ?? null
                          : null
                        : null
                : null
          }
          onClose={() => setCompareItem(null)}
        />
      )}

      {/* Bulk sell popup */}
      {bulkSellVendor && player && (
        <BulkSellPopup
          inventory={player.inventory}
          vendorName={bulkSellVendor}
          onSell={(itemIds) => {
            const itemList = itemIds.join(", ").toUpperCase();
            sendMessage(`SELL ${itemList}`);
          }}
          onClose={() => setBulkSellVendor(null)}
        />
      )}

      {/* Item action menu — contextual right-click style popup */}
      {actionMenu && player && (
        <ItemActionMenu
          item={actionMenu.item}
          actions={getItemActions(
            actionMenu.item,
            actionMenu.context,
            player.currentRoom,
            [
              player.weapon,
              player.shield,
              player.helmet,
              player.gorget,
              player.bodyArmor,
              player.limbArmor,
              player.boots,
              player.ringLeft,
              player.ringRight,
              player.cuffLeft,
              player.cuffRight,
              player.necklace,
            ].filter((id): id is string => id !== null && id !== "unarmed").includes(actionMenu.item.id)
          )}
          anchorRect={actionMenu.rect}
          onAction={(action: ItemAction) => {
            setActionMenu(null);
            if (action.isInspect) {
              setItemPopupId(actionMenu.item.id);
            } else if (action.isCompare) {
              const item = actionMenu.item;
              let equippedItemId: string | null = null;

              if (item.type === "weapon") {
                equippedItemId = player?.weapon === "unarmed" ? null : player?.weapon ?? null;
              } else if (item.type === "armor") {
                const zoneSlot = item.stats?.zoneSlot;
                if (zoneSlot === "head") equippedItemId = player?.helmet ?? null;
                else if (zoneSlot === "neck") equippedItemId = player?.gorget ?? null;
                else if (zoneSlot === "torso") equippedItemId = player?.bodyArmor ?? null;
                else if (zoneSlot === "limbs") equippedItemId = player?.limbArmor ?? null;
              }

              const equippedItem = equippedItemId ? ITEMS[equippedItemId] ?? null : null;
              setCompareItem({ item, equippedSlot: item.type });
            } else if (action.isBulkSell) {
              const room = getRoom(player?.currentRoom ?? "");
              const vendorName = room?.name ?? "Merchant";
              setBulkSellVendor(vendorName);
            } else if (action.command) {
              sendMessage(action.command);
            }
          }}
          onClose={() => setActionMenu(null)}
        />
      )}


      {/* Combat overlay */}
      {inCombat && player?.activeCombat && (
        <CombatScreen
          session={player.activeCombat}
          playerHp={player.hp}
          playerMaxHp={player.maxHp}
          playerMana={player.currentMana ?? 0}
          playerMaxMana={player.maxMana ?? 0}
          playerState={player}
          combatLog={combatBoxLog}
          loading={loading || isTyping}
          onCommand={sendCombatCommand}
          onIconClick={(item, context, rect) => {
            setActionMenu({ item, context, rect });
          }}
          // Render 2 extra Dufus-styled sprites next to the main enemy so we
          // can visualize the 3-enemy layout. Only applies when fighting the
          // training dummy — real fights stay 1v1 for now.
          enemyLayoutPreviewCount={
            player.activeCombat.enemyNpcId === "training_dummy" ? 2 : 0
          }
          heroGoreSplatters={fromSplatterStates(player.goreSplatters ?? [])}
          onHeroGoreChange={(splatters: BloodSplatter[]) => {
            setWorldState(prev => prev ? {
              ...prev,
              player: {
                ...prev.player,
                goreSplatters: toSplatterStates(splatters),
              },
            } : prev);
          }}
        />
      )}
      {player && !inCombat && (
        <div style={{
          width: sidebarOpen ? 256 : 48,
          minWidth: sidebarOpen ? 256 : 48,
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflowY: sidebarOpen ? "auto" : "hidden",
          overflowX: "hidden",
          transition: "width 0.2s ease, min-width 0.2s ease",
          position: "relative",
          zIndex: 10,
        }}>
          {sidebarOpen ? (
            <div style={{ padding: 16, display: "flex", flexDirection: "column", height: "100%", backgroundColor: "transparent" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <button
                  onClick={() => setSidebarOpen(false)}
                  title="Hide panel"
                  style={{ color: "#888888", fontSize: 18, fontWeight: "bold", background: "none", border: "none", cursor: "pointer", padding: "4px 6px", lineHeight: 1, transition: "color 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#cccccc"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#888888"; }}
                >
                  «
                </button>
              </div>
              <h2 style={{ color: "#fbbf24", fontWeight: "600", fontSize: 15, marginBottom: 2, fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{player.name}</h2>
              <p style={{ color: "#aaaaaa", fontSize: 11, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap" }}>Hero of the Realm</p>
              {player.knownAs && <p style={{ color: "#92400e", fontSize: 11, marginBottom: 12, fontStyle: "italic" }}>"{player.knownAs}"</p>}
              {player.bounty > 0 && (
                <p style={{ color: "#ef4444", fontSize: 11, marginBottom: 12, backgroundColor: "#1a0000", padding: "4px 8px", borderRadius: 4 }}>⚠ Bounty: {player.bounty}g</p>
              )}
              {/* HP bar — bronze-framed parchment style */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "#e8d4a0", fontWeight: 600, letterSpacing: "0.08em", fontFamily: "Georgia, serif" }}>♥ HP</span>
                  <span style={{ color: "#ff6b6b", fontWeight: 600, fontFamily: "Georgia, serif" }}>{player.hp} / {player.maxHp}</span>
                </div>
                <div style={{ width: "100%", backgroundColor: "#0a0505", height: 8, borderRadius: 2, border: "1px solid #4a2e15", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)", overflow: "hidden" }}>
                  <div style={{ background: "linear-gradient(180deg, #ef4444 0%, #991b1b 100%)", height: "100%", width: ((player.hp / player.maxHp) * 100) + "%", transition: "width 0.3s", boxShadow: "inset 0 1px 0 rgba(255,180,180,0.3)" }} />
                </div>
              </div>

              {/* Active status effects (bleed, poison, broken_leg, etc.) */}
              {(player.activeEffects?.length ?? 0) > 0 && (
                <div style={{ marginBottom: 12, fontSize: 11, fontFamily: "Georgia, serif" }}>
                  <div style={{ color: "#92400e", fontSize: 9, letterSpacing: "0.1em", marginBottom: 4, fontWeight: 600 }}>STATUS</div>
                  {player.activeEffects.map((e, i) => {
                    const glyph =
                      e.type === "bleed" || e.type === "severed_artery" ? "♦" :
                      e.type === "poison" ? "☠" :
                      e.type === "broken_leg" || e.type === "broken_arm" ? "✕" :
                      e.type === "concussion" || e.type === "damaged_eye" ? "◉" :
                      e.type === "pierced_lung" || e.type === "crushed_windpipe" || e.type === "cracked_ribs" ? "✦" :
                      "•";
                    const color =
                      e.type === "bleed" || e.type === "severed_artery" ? "#dc2626" :
                      e.type === "poison" ? "#65a30d" :
                      "#92400e";
                    const dots = "●".repeat(e.severity) + "○".repeat(Math.max(0, 3 - e.severity));
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2, color: "#cdb78a" }}>
                        <span style={{ color }}>
                          {glyph} {e.type.replace(/_/g, " ")} <span style={{ color: "#5a4a3a", fontSize: 9 }}>({e.zone})</span>
                        </span>
                        <span style={{ color, fontSize: 9, letterSpacing: "0.1em" }}>{dots}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mana bar — bronze-framed parchment style */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "#e8d4a0", fontWeight: 600, letterSpacing: "0.08em", fontFamily: "Georgia, serif" }}>✦ MANA</span>
                  <span style={{ color: "#7dd3fc", fontWeight: 600, fontFamily: "Georgia, serif" }}>{player.currentMana ?? 0} / {player.maxMana ?? 0}</span>
                </div>
                <div style={{ width: "100%", backgroundColor: "#04081a", height: 8, borderRadius: 2, border: "1px solid #1e3a5f", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)", overflow: "hidden" }}>
                  <div style={{ background: "linear-gradient(180deg, #60a5fa 0%, #1e40af 100%)", height: "100%", width: ((player.maxMana ?? 0) > 0 ? ((player.currentMana ?? 0) / (player.maxMana ?? 1)) * 100 : 0) + "%", transition: "width 0.3s", boxShadow: "inset 0 1px 0 rgba(180,210,255,0.3)" }} />
                </div>
              </div>

              {/* Decorative divider — Aquilonian rosette */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "#4a2e15" }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #4a2e15, transparent)" }} />
                <span style={{ fontSize: 10, color: "#92400e" }}>✦</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #4a2e15, transparent)" }} />
              </div>

              {/* Tab strip — STATS / GEAR / PACK */}
              <div style={{ display: "flex", gap: 2, marginBottom: 12, borderBottom: "1px solid #2a1d0e" }}>
                {(["stats", "gear", "pack"] as const).map(tab => {
                  const active = sidebarTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setSidebarTab(tab)}
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        background: active ? "linear-gradient(180deg, #2a1d0e 0%, #1a120a 100%)" : "transparent",
                        border: "none",
                        borderBottom: active ? "2px solid #92400e" : "2px solid transparent",
                        color: active ? "#fbbf24" : "#5a4a3a",
                        fontFamily: "Georgia, serif",
                        fontSize: 10,
                        letterSpacing: "0.15em",
                        fontWeight: 600,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        transition: "color 0.15s, background 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={e => {
                        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#92400e";
                      }}
                      onMouseLeave={e => {
                        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#5a4a3a";
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              {sidebarTab === "stats" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11, marginBottom: 14 }}>
                    {[["STR", player.strength], ["DEX", player.dexterity], ["CHA", player.charisma]].map(([label, val]) => (
                      <div key={label as string} style={{ backgroundColor: "#0d0a06", padding: "6px 4px", borderRadius: 3, border: "1px solid #2a1d0e", textAlign: "center" }}>
                        <div style={{ color: "#92400e", fontSize: 9, letterSpacing: "0.1em", fontFamily: "Georgia, serif", fontWeight: 600 }}>{label}</div>
                        <div style={{ color: "#fbbf24", fontWeight: "600", fontSize: 15, fontFamily: "Georgia, serif" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 14 }}>
                    <div style={{ color: "#92400e", marginBottom: 2, fontSize: 9, letterSpacing: "0.1em", fontFamily: "Georgia, serif", fontWeight: 600, whiteSpace: "nowrap" }}>GOLD · CARRIED / BANKED</div>
                    <div style={{ color: "#facc15", fontWeight: "bold", fontSize: 15, fontFamily: "Georgia, serif" }}>⚜ {player.gold} / {player.bankedGold}</div>
                  </div>
                  {topVirtues.length > 0 && (
                    <div style={{ fontSize: 11, marginBottom: 12 }}>
                      <div style={{ color: "#92400e", marginBottom: 6, fontSize: 9, letterSpacing: "0.1em", fontFamily: "Georgia, serif", fontWeight: 600 }}>VIRTUES</div>
                      {topVirtues.map(([name, val]) => (
                        <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontFamily: "Georgia, serif" }}>
                          <span style={{ color: "#cdb78a" }}>{name}</span>
                          <span style={{ color: (val as number) > 0 ? "#4ade80" : "#f87171" }}>{(val as number) > 0 ? "+" : ""}{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {sidebarTab === "gear" && (
                <EquipmentGrid
                  weaponId={player.weapon}
                  shieldId={player.shield}
                  helmetId={player.helmet}
                  gorgetId={player.gorget}
                  bodyArmorId={player.bodyArmor}
                  limbArmorId={player.limbArmor}
                  bootsId={player.boots}
                  ringLeftId={player.ringLeft}
                  ringRightId={player.ringRight}
                  cuffLeftId={player.cuffLeft}
                  cuffRightId={player.cuffRight}
                  necklaceId={player.necklace}
                  weaponIsTwoHanded={weaponIsTwoHanded}
                  iconSize={56}
                  onItemClick={(item, rect) => setActionMenu({ item, context: "equipped", rect })}
                />
              )}

              {sidebarTab === "pack" && (
                <BackpackPanel
                  inventory={player.inventory}
                  equippedIds={new Set(
                    [
                      player.weapon,
                      player.shield,
                      player.helmet,
                      player.gorget,
                      player.bodyArmor,
                      player.limbArmor,
                      player.boots,
                      player.ringLeft,
                      player.ringRight,
                      player.cuffLeft,
                      player.cuffRight,
                      player.necklace,
                    ].filter((id): id is string => id !== null && id !== "unarmed")
                  )}
                  iconSize={40}
                  onItemClick={(item, rect) => setActionMenu({ item, context: "pack", rect })}
                />
              )}

              {/* Footer — Sign out only */}
              <div
                style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #1e1e1e", display: "flex", justifyContent: "flex-end", alignItems: "center", transition: "border-color 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderTopColor = "#3a3a3a"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderTopColor = "#1e1e1e"; }}
              >
                <form action={logoutAction}>
                  <button type="submit" style={{ color: "#aaaaaa", fontSize: 11, background: "none", border: "none", cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: "0.05em" }}>
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 12, width: "100%", cursor: "pointer" }} onClick={() => setSidebarOpen(true)}>
              <button
                onClick={() => setSidebarOpen(true)}
                title="Show panel"
                style={{ color: "#888888", fontSize: 18, fontWeight: "bold", background: "none", border: "none", cursor: "pointer", padding: "4px 6px", lineHeight: 1, transition: "color 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#cccccc"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#888888"; }}
              >
                »
              </button>
              {player && (
                <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ color: "#ff4444", fontSize: 9, fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 600, lineHeight: 1 }}>{player.hp}</span>
                    <div style={{ width: 4, height: 28, backgroundColor: "#111", borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <div style={{ width: "100%", height: ((player.hp / player.maxHp) * 100) + "%", backgroundColor: "#ef4444", borderRadius: 2, transition: "height 0.3s" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ color: "#60a5fa", fontSize: 9, fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 600, lineHeight: 1 }}>{player.currentMana ?? 0}</span>
                    <div style={{ width: 4, height: 28, backgroundColor: "#111", borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <div style={{ width: "100%", height: ((player.maxMana ?? 0) > 0 ? ((player.currentMana ?? 0) / (player.maxMana ?? 1)) * 100 : 0) + "%", backgroundColor: "#3b82f6", borderRadius: 2, transition: "height 0.3s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", backgroundColor: "transparent" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <ScenePanel
          roomId={worldState?.player?.currentRoom ?? "church_of_perpetual_life"}
          roomState={
            worldState?.rooms?.[worldState?.player?.currentRoom ?? ""]
              ?.currentState ?? "normal"
          }
          tone="auto"
          fullScreen
        />
      </div>
      {!inCombat && (
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", position: "relative", zIndex: 2, order: 0 }}>
        <span style={{ color: "#b45309", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          Living Eamon
        </span>
        {player && (
          <>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>
            <span style={{ color: "rgba(229,231,235,0.5)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Georgia, serif" }}>
              {getRoom(player.currentRoom)?.name ?? player.currentRoom.replace(/_/g, " ")}
            </span>
          </>
        )}
        {player?.isWanted && <span style={{ color: "#ff4444", fontSize: 11, fontWeight: 700, marginLeft: "auto" }}>⚠ WANTED</span>}
      </div>
      )}

        {!inCombat && (
        <div ref={chatOuterRef} style={{ flex: chatExpanded ? "1 1 0" : "0 0 16vh", height: chatExpanded ? undefined : "16vh", marginTop: chatExpanded ? 0 : "auto", overflow: "hidden", padding: chatExpanded ? "20px 24px" : "4px 24px 0", backgroundColor: "transparent", position: "relative", zIndex: 2, transition: "flex-basis 0.3s ease", order: 1 }}>
          <div ref={scrollContainerRef} style={{ maxWidth: 620, margin: "0 auto", height: "100%", backgroundColor: "rgba(0,0,0,0.62)", backdropFilter: "blur(6px)", borderRadius: 16, overflowY: "scroll", scrollbarWidth: "none", display: "flex", flexDirection: "column", padding: chatExpanded ? "14px 20px" : "6px 20px 0", boxSizing: "border-box" }}>
            {messages.map((msg, i) => {
              const isLastMsg = i === messages.length - 1;
              const isStreaming = isLastMsg && isTyping;
              // JSON-delivered (static) messages get a fade-in class on first render.
              // Stream-delivered messages animate character-by-character instead.
              const fadeIn = isLastMsg && !isTyping && msg.role === "assistant";
              return (
                <div key={i} style={{ marginBottom: 16 }} className={fadeIn ? "le-msg-fadein" : undefined}>
                  {msg.role === "user" ? null : (
                    <div style={{
                      color: "#f0f0f0",
                      fontSize: 15,
                      fontFamily: "Georgia, serif",
                      textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                      lineHeight: 1.75,
                    }}>
                      {formatMessage(msg.content, isStreaming)}
                    </div>
                  )}
                </div>
              );
            })}
            {loading && !isTyping && (
              <div style={{ marginBottom: 24, display: "flex", gap: 4 }}>
                {[0, 150, 300].map(d => (
                  <div key={d} style={{ width: 8, height: 8, backgroundColor: "#92400e", borderRadius: "50%" }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
        )}

        {!inCombat && (
        <div style={{ borderTop: "none", padding: "4px 16px 12px", flexShrink: 0, backgroundColor: "transparent", position: "relative", zIndex: 2, order: 2 }}>
          <div style={{ maxWidth: 620, margin: "0 auto 6px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setChatExpanded(e => !e)}
              style={{
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                color: "rgba(255,255,255,0.6)",
                fontSize: 11,
                fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.06em",
                padding: "3px 12px",
                cursor: "pointer",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.65)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.45)"; }}
            >
              {chatExpanded ? "hide text ▲" : "show text ▼"}
            </button>
          </div>
          <div style={{ maxWidth: 620, margin: "0 auto", position: "relative", display: "flex", alignItems: "center" }}>
            <CommandInput
              ref={inputRef}
              worldState={worldState}
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              disabled={loading || isTyping}
              placeholder="What do you do?"
              style={{
                width: "100%",
                backgroundColor: "#0d0d0d",
                border: "1px solid #2a2a2a",
                borderRadius: 9999,
                padding: "12px 52px 12px 20px",
                fontSize: 15,
                fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: "#ececec",
                outline: "none",
                caretColor: "#fbbf24",
              }}
            />
            <button
              onClick={() => void sendMessage()}
              disabled={loading || isTyping || !input.trim()}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 34,
                height: 34,
                borderRadius: "50%",
                backgroundColor: loading || isTyping || !input.trim() ? "#1a1a1a" : "#fbbf24",
                border: "none",
                cursor: loading || isTyping || !input.trim() ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.15s",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={loading || isTyping || !input.trim() ? "#444" : "#000"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}