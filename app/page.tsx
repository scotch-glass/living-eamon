"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { WorldState, createInitialWorldState } from "../lib/gameState";
import { ITEMS } from "../lib/gameData";
import { isTwoHanded } from "../lib/uoData";
import CommandInput, { type CommandInputHandle } from "../components/CommandInput";
import CombatScreen from "../components/CombatScreen";
import { SITUATION_BLOCK_LINE } from "../lib/gameEngine";
import { logoutAction } from "./auth/actions";
import { createBrowserSupabase } from "../lib/supabaseAuthClient";
import ScenePanel from "../components/ScenePanel";
import NPCSprite from "../components/NPCSprite";
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
  const [started, setStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [inCombat, setInCombat] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [conversationNpcId, setConversationNpcId] = useState<string | null>(null);
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
      const nowInCombat = ws.player?.activeCombat != null;
      setInCombat(nowInCombat);
      if (nowInCombat) {
        const clean = data.response.replace(/__COMBAT_START__|__COMBAT_END__/g, "").trim();
        if (clean) setCombatLog(prev => [...prev, clean].slice(-20));
      } else {
        setCombatLog([]);
      }
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

            // Update combat log with the visible text (strip tokens)
            const cleanText = visibleText
              .replace(/__COMBAT_START__/g, "")
              .replace(/__COMBAT_END__/g, "")
              .trim();
            if (nowInCombat && cleanText) {
              setCombatLog(prev => [...prev, cleanText].slice(-20));
            }
            if (!nowInCombat) {
              setCombatLog([]);
            }
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
      .replace(/__COMBAT_START__/g, "")
      .replace(/__COMBAT_END__/g, "")
      .replace(/__NPC__[a-z_]+__/g, "");
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
      // Parse __CMD:COMMAND__ and __YESNO__ tokens within the line
      if (line.includes("__YESNO__") || line.includes("__CMD:")) {
        const parts: ReactNode[] = [];
        let remaining = line;
        let partIdx = 0;

        while (remaining.length > 0) {
          const yesnoIdx = remaining.indexOf("__YESNO__");
          const cmdIdx = remaining.indexOf("__CMD:");

          // Find which token comes first
          let nextIdx = -1;
          let tokenType: "yesno" | "cmd" | null = null;

          if (yesnoIdx !== -1 && (cmdIdx === -1 || yesnoIdx < cmdIdx)) {
            nextIdx = yesnoIdx;
            tokenType = "yesno";
          } else if (cmdIdx !== -1) {
            nextIdx = cmdIdx;
            tokenType = "cmd";
          }

          if (nextIdx === -1 || tokenType === null) {
            // No more tokens
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
          } else {
            // cmd token: __CMD:COMMAND TEXT__
            const cmdEnd = remaining.indexOf("__", nextIdx + 6);
            if (cmdEnd === -1) {
              parts.push(<span key={`t-${partIdx++}`}>{remaining}</span>);
              break;
            }
            const cmd = remaining.slice(nextIdx + 6, cmdEnd);
            parts.push(renderCommandChip(cmd, `cmd-${partIdx++}`));
            remaining = remaining.slice(cmdEnd + 2);
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

      {/* Combat overlay */}
      {inCombat && player?.activeCombat && (
        <CombatScreen
          session={player.activeCombat}
          playerHp={player.hp}
          playerMaxHp={player.maxHp}
          combatLog={combatLog}
          loading={loading || isTyping}
          onCommand={sendCombatCommand}
        />
      )}
      {player && (
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
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>HP</span>
                  <span style={{ color: "#ff4444", fontWeight: 600 }}>{player.hp} / {player.maxHp}</span>
                </div>
                <div style={{ width: "100%", backgroundColor: "#111111", height: 6, borderRadius: 3 }}>
                  <div style={{ backgroundColor: "#dc2626", height: 6, borderRadius: 3, width: ((player.hp / player.maxHp) * 100) + "%", transition: "width 0.3s" }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>MANA</span>
                  <span style={{ color: "#60a5fa", fontWeight: 600 }}>— / —</span>
                </div>
                <div style={{ width: "100%", backgroundColor: "#111111", height: 6, borderRadius: 3 }}>
                  <div style={{ backgroundColor: "#3b82f6", height: 6, borderRadius: 3, width: "0%", transition: "width 0.3s" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, marginBottom: 14 }}>
                {[["STR", player.strength], ["DEX", player.dexterity], ["CHA", player.charisma], ["EXP", player.expertise]].map(([label, val]) => (
                  <div key={label as string} style={{ backgroundColor: "#0d0d0d", padding: "6px 8px", borderRadius: 4, border: "1px solid #1a1a1a" }}>
                    <div style={{ color: "#aaaaaa", fontSize: 10, letterSpacing: "0.06em", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{label}</div>
                    <div style={{ color: "#fbbf24", fontWeight: "600", fontSize: 14, fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, marginBottom: 12 }}>
                <div style={{ color: "#aaaaaa", marginBottom: 2, fontSize: 10, letterSpacing: "0.08em", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap" }}>GOLD (carried / banked)</div>
                <div style={{ color: "#facc15", fontWeight: "bold", fontSize: 15 }}>⚜ {player.gold} / {player.bankedGold}</div>
              </div>
              <div style={{ fontSize: 11, marginBottom: 12 }}>
                <div style={{ color: "#aaaaaa", marginBottom: 2, fontSize: 10, letterSpacing: "0.08em", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap" }}>WEAPON</div>
                <div style={{ color: "#ffffff" }}>{ITEMS[player.weapon]?.name ?? player.weapon}</div>
              </div>
              <div style={{ fontSize: 11, marginBottom: 12 }}>
                <div style={{ color: "#aaaaaa", marginBottom: 2, fontSize: 10, letterSpacing: "0.08em", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap" }}>SHIELD</div>
                {weaponIsTwoHanded ? (
                  <div style={{ color: "#aaaaaa", fontStyle: "italic", fontSize: 10 }}>— both hands occupied —</div>
                ) : (
                  <div style={{ color: "#ffffff" }}>
                    {player.shield ? ITEMS[player.shield]?.name ?? player.shield : "none"}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, marginBottom: 12 }}>
                <div style={{ color: "#aaaaaa", marginBottom: 4, fontSize: 10, letterSpacing: "0.08em", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap" }}>ARMOR</div>
                {([
                  ["Head", player.helmet],
                  ["Neck", player.gorget],
                  ["Body", player.bodyArmor],
                  ["Limbs", player.limbArmor],
                ] as [string, string | null][]).map(([label, itemId]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#777777", fontSize: 10 }}>{label}</span>
                    <span style={{ color: itemId ? "#ffffff" : "#444444", fontSize: 10, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{itemId ? (ITEMS[itemId]?.name ?? itemId) : "—"}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, marginBottom: 12 }}>
                <div style={{ color: "#aaaaaa", marginBottom: 2, fontSize: 10, letterSpacing: "0.08em", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap" }}>LOCATION</div>
                <div style={{ color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12 }}>{player.currentRoom.replace(/_/g, " ")}</div>
              </div>
              <div style={{ fontSize: 11, marginBottom: 12 }}>
                <div style={{ color: "#aaaaaa", marginBottom: 2, fontSize: 10, letterSpacing: "0.08em", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap" }}>REPUTATION</div>
                <div style={{ color: player.reputationScore >= 0 ? "#4ade80" : "#f87171", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12 }}>{player.reputationLevel}</div>
              </div>
              {topVirtues.length > 0 && (
                <div style={{ fontSize: 11, marginBottom: 12 }}>
                  <div style={{ color: "#aaaaaa", marginBottom: 6, fontSize: 10, letterSpacing: "0.08em", fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap" }}>VIRTUES</div>
                  {topVirtues.map(([name, val]) => (
                    <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ color: "#cccccc" }}>{name}</span>
                      <span style={{ color: (val as number) > 0 ? "#4ade80" : "#f87171" }}>{(val as number) > 0 ? "+" : ""}{val}</span>
                    </div>
                  ))}
                </div>
              )}
              <div
                style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderTopColor = "#3a3a3a"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderTopColor = "#1e1e1e"; }}
              >
                <p style={{ color: "#888888", fontSize: 11, fontStyle: "italic", margin: 0 }}>she is watching</p>
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
                    <span style={{ color: "#60a5fa", fontSize: 9, fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight: 600, lineHeight: 1 }}>{player.expertise}</span>
                    <div style={{ width: 4, height: 28, backgroundColor: "#111", borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <div style={{ width: "100%", height: "0%", backgroundColor: "#3b82f6", borderRadius: 2, transition: "height 0.3s" }} />
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

        <div ref={chatOuterRef} style={{ flex: chatExpanded ? "1 1 0" : "0 0 16vh", height: chatExpanded ? undefined : "16vh", marginTop: chatExpanded ? 0 : "auto", overflow: "hidden", padding: chatExpanded ? "20px 24px" : "4px 24px 0", backgroundColor: "transparent", position: "relative", zIndex: 2, transition: "flex-basis 0.3s ease", order: 1 }}>
          <div ref={scrollContainerRef} style={{ maxWidth: 620, margin: "0 auto", height: "100%", backgroundColor: "rgba(0,0,0,0.62)", backdropFilter: "blur(6px)", borderRadius: 16, overflowY: "scroll", scrollbarWidth: "none", display: "flex", flexDirection: "column", padding: chatExpanded ? "14px 20px" : "6px 20px 0", boxSizing: "border-box" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                {msg.role === "user" ? null : (
                  <div style={{
                    color: "#f0f0f0",
                    fontSize: 15,
                    fontFamily: "Georgia, serif",
                    textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                    lineHeight: 1.75,
                  }}>
                    {formatMessage(msg.content, i === messages.length - 1 && isTyping)}
                  </div>
                )}
              </div>
            ))}
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
      </div>
    </div>
  );
}