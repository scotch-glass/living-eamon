"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WorldState, createInitialWorldState } from "../lib/gameState";
import { ITEMS } from "../lib/gameData";
import { isTwoHanded } from "../lib/uoData";
import CommandInput, { type CommandInputHandle } from "../components/CommandInput";
import { SITUATION_BLOCK_LINE } from "../lib/gameEngine";
import { logoutAction } from "./auth/actions";
import { createBrowserSupabase } from "../lib/supabaseAuthClient";
import ScenePanel from "../components/ScenePanel";

interface Message {
  role: "user" | "assistant";
  content: string;
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<CommandInputHandle>(null);
  const charQueueRef = useRef<string[]>([]);
  const typingRef = useRef(false);
  const displayedRef = useRef("");
  const skipTypingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
      const ws = data.worldState;
      setWorldState(ws);
      if (ws.playerId) setPlayerId(ws.playerId);
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

  const formatMessage = (text: string, isLast: boolean) => {
    const cleanText = text.split("__STATE__")[0];
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
              borderLeft: "3px solid rgba(251, 191, 36, 0.4)",
              fontStyle: "italic",
              fontSize: 14,
              lineHeight: 1.65,
              color: "#fbbf24",
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
              borderTop: "1px solid rgba(55,65,81,0.6)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: 11,
              lineHeight: 1.5,
              color: "rgba(148,163,184,0.95)",
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

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#030712", color: "#e5e7eb" }}>
      {sidebarOpen && player && (
        <div style={{ width: 256, backgroundColor: "#111827", borderRight: "1px solid #1f2937", display: "flex", flexDirection: "column", padding: 16, flexShrink: 0, overflowY: "auto" }}>
          <h2 style={{ color: "#fbbf24", fontWeight: "bold", fontSize: 18, marginBottom: 2, fontFamily: "Georgia, serif" }}>{player.name}</h2>
          <p style={{ color: "#6b7280", fontSize: 11, marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>Hero of the Realm</p>
          {player.knownAs && <p style={{ color: "#92400e", fontSize: 11, marginBottom: 12, fontStyle: "italic" }}>"{player.knownAs}"</p>}
          {player.bounty > 0 && (
            <p style={{ color: "#ef4444", fontSize: 11, marginBottom: 12, backgroundColor: "#450a0a", padding: "4px 8px", borderRadius: 4 }}>⚠ Bounty: {player.bounty}g</p>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "#9ca3af" }}>HP</span>
              <span style={{ color: "#f87171" }}>{player.hp} / {player.maxHp}</span>
            </div>
            <div style={{ width: "100%", backgroundColor: "#1f2937", height: 6, borderRadius: 3 }}>
              <div style={{ backgroundColor: "#dc2626", height: 6, borderRadius: 3, width: ((player.hp / player.maxHp) * 100) + "%", transition: "width 0.3s" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, marginBottom: 14 }}>
            {[["STR", player.strength], ["DEX", player.dexterity], ["CHA", player.charisma], ["EXP", player.expertise]].map(([label, val]) => (
              <div key={label as string} style={{ backgroundColor: "#1f2937", padding: "6px 8px", borderRadius: 4 }}>
                <div style={{ color: "#6b7280" }}>{label}</div>
                <div style={{ color: "#fbbf24", fontWeight: "bold", fontSize: 14 }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, marginBottom: 12 }}>
            <div style={{ color: "#6b7280", marginBottom: 2 }}>GOLD (carried / banked)</div>
            <div style={{ color: "#facc15", fontWeight: "bold", fontSize: 15 }}>⚜ {player.gold} / {player.bankedGold}</div>
          </div>

          <div style={{ fontSize: 11, marginBottom: 12 }}>
            <div style={{ color: "#6b7280", marginBottom: 2 }}>WEAPON</div>
            <div style={{ color: "#d1d5db" }}>{ITEMS[player.weapon]?.name ?? player.weapon}</div>
          </div>

          <div style={{ fontSize: 11, marginBottom: 12 }}>
            <div style={{ color: "#6b7280", marginBottom: 2 }}>SHIELD</div>
            {weaponIsTwoHanded ? (
              <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: 10 }}>— both hands occupied —</div>
            ) : (
              <div style={{ color: "#d1d5db" }}>
                {player.shield ? ITEMS[player.shield]?.name ?? player.shield : "none"}
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, marginBottom: 12 }}>
            <div style={{ color: "#6b7280", marginBottom: 2 }}>LOCATION</div>
            <div style={{ color: "#d1d5db" }}>{player.currentRoom.replace(/_/g, " ")}</div>
          </div>

          <div style={{ fontSize: 11, marginBottom: 12 }}>
            <div style={{ color: "#6b7280", marginBottom: 2 }}>REPUTATION</div>
            <div style={{ color: player.reputationScore >= 0 ? "#4ade80" : "#f87171" }}>{player.reputationLevel}</div>
          </div>

          {topVirtues.length > 0 && (
            <div style={{ fontSize: 11, marginBottom: 12 }}>
              <div style={{ color: "#6b7280", marginBottom: 6 }}>VIRTUES</div>
              {topVirtues.map(([name, val]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ color: "#9ca3af" }}>{name}</span>
                  <span style={{ color: (val as number) > 0 ? "#4ade80" : "#f87171" }}>{(val as number) > 0 ? "+" : ""}{val}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "#374151", fontSize: 11, fontStyle: "italic", margin: 0 }}>she is watching</p>
            <form action={logoutAction}>
              <button type="submit" style={{ color: "#4b5563", fontSize: 11, background: "none", border: "none", cursor: "pointer", fontFamily: "Georgia, serif", letterSpacing: "0.05em" }}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ScenePanel
        roomId={worldState?.player?.currentRoom ?? "main_hall"}
        roomState={(() => {
          const raw = worldState?.rooms?.[worldState?.player?.currentRoom ?? "main_hall"]?.currentState;
          if (!raw || raw === "normal") return "normal";
          if (raw === "burnt") return "ruined";
          return "damaged";
        })()}
        tone={(() => {
          const room = worldState?.player?.currentRoom ?? "main_hall";
          if (room === "church_of_perpetual_life" || room === "pit") return "grimdark";
          return "civilized";
        })()}
      />
      <div style={{ borderBottom: "1px solid #1f2937", padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? "Hide panel" : "Show panel"}
          style={{ color: "#6b7280", fontSize: 13, fontFamily: "ui-monospace, monospace", background: "none", border: "1px solid #374151", borderRadius: 4, cursor: "pointer", padding: "2px 6px", lineHeight: 1, letterSpacing: 0 }}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
        <span style={{ color: "#92400e", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "Georgia, serif" }}>
          Living Eamon
          {player?.currentRoom && (
            <span style={{ color: "#6b7280", fontWeight: "normal" }}>
              {" — "}
              {(player.currentRoom.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))}
            </span>
          )}
        </span>
        {player?.isWanted && <span style={{ color: "#ef4444", fontSize: 11 }}>⚠ WANTED</span>}
      </div>

        <div ref={scrollContainerRef} style={{ flex: 1, overflowY: "scroll", padding: 24, scrollbarWidth: "thin", scrollbarColor: "#4b5563 #111827", height: 0 }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 24, textAlign: msg.role === "user" ? "right" : "left" }}>
                {msg.role === "user" ? (
                  <div style={{ display: "inline-block", backgroundColor: "#1f2937", color: "#e5e7eb", padding: "8px 16px", borderRadius: 8, maxWidth: 480, textAlign: "left", fontFamily: "Georgia, serif" }}>
                    {msg.content}
                  </div>
                ) : (
                  <div style={{ color: "#d1d5db", fontSize: 16, fontFamily: "Georgia, serif" }}>
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

        <div style={{ borderTop: "1px solid #1f2937", padding: 16, flexShrink: 0 }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <CommandInput
              ref={inputRef}
              worldState={worldState}
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              disabled={loading || isTyping}
              placeholder="What do you do?"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={loading || isTyping || !input.trim()}
              style={{ backgroundColor: "#92400e", color: "#fef3c7", padding: "12px 20px", borderRadius: 6, border: "none", cursor: "pointer", opacity: loading || isTyping || !input.trim() ? 0.5 : 1, fontSize: 16 }}
            >
              ➤
            </button>
          </div>
          <p style={{ color: "#374151", fontSize: 11, textAlign: "center", marginTop: 8, fontFamily: "Georgia, serif" }}>
            Press Enter to speak. The realm listens. (Space to skip animation)
          </p>
        </div>
      </div>
    </div>
  );
}