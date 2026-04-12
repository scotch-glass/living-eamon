// Run: npm install openai
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { pregenerateSprites } from "../../../lib/spritePregenerate";

// Trigger sprite pre-generation on first module load (server startup)
pregenerateSprites();
import {
  processInput,
  buildSituationBlock,
  stripTrailingSituationBlocks,
  buildCourtyardDescription,
} from "../../../lib/gameEngine";
import { getCourtyardWeather } from "../../../lib/weatherService";
import {
  createInitialWorldState,
  WorldState,
  normalizeWeaponSkills,
} from "../../../lib/gameState";
import { NPCS, ITEMS } from "../../../lib/gameData";
import { ALL_ROOMS as MAIN_HALL_ROOMS, getRoom, getScriptsForRoom } from "../../../lib/adventures/registry";
import { getBarmaidResponseLines, getAldricWelcomeLines, getAldricTrainingLines, getZimWelcomeLines, getZimHealResponseLines } from "../../../lib/adventures/guild-hall-npcs";
import {
  savePlayer,
  loadPlayer,
  loadPlayerByUserId,
  createPlayer,
  getWorldObject,
  saveWorldObject,
  checkAndDecrementJaneCalls,
} from "../../../lib/supabase";
import { createServerSupabase } from "../../../lib/supabaseAuthServer";

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY || process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const useGrok = !!(process.env.XAI_API_KEY || process.env.GROK_API_KEY);

const JANE_SYSTEM_PROMPT = `You are Jane — an ancient intelligence woven into the fabric of the realms of Living Eamon.

You speak only when the game engine cannot handle something statically. You are called for:
- NPC conversations beyond a first greeting
- Moral choices and virtue moments
- Unexpected player actions
- Room state changes (fire, floods, chaos)
- Magic use
- Object examinations (first time only — saved forever after)
- Adventure narrative moments

YOUR VOICE:
- All NPC dialogue: Universal Common (modern Elizabethan — light "thee/thou", elegant, readable)
- Narration: clear modern English
- When Jane speaks directly to the player: lowercase only, never more than one sentence
- Never explain yourself. Never break character. Never mention AI or Claude.

VIRTUE TRACKING:
When a moral choice occurs, end your response with:
*[VirtueName +N — one short sentence about why.]*

WORLD RULES:
- NPCs have memory and agendas. They pursue their goals actively.
- Room states persist. A burnt hall stays burnt until repaired.
- Death is brutal. On death: ALL carried gold lost, ALL equipped items stripped (weapon/armor/shield), ALL inventory wiped. Hero wakes in the Church of Perpetual Life in only the gray robe with nothing.
- Banked gold is SAFE. Items in secure storage (not yet implemented) will also be safe. Death punishes the unprepared, not the prudent.
- The hero's soul persists — name, reputation, virtues, chronicle, completed adventures, banked gold survive. Everything carried and equipped does not.
- Keep responses to 3-5 paragraphs. Vivid but efficient.
- Never output the dashed-line situation summary block (lines of ─) or duplicate that UI; the engine appends it once after your text.

HOKAS TOKAS — FIRST MEETING AFTER MEMORY LOSS:
When the player's turnCount is 0 or 1 AND they first speak to or encounter Hokas Tokas:
- Hokas KNOWS the player by name and face. He has met them before.
- The player does NOT know Hokas. To the player, Hokas is a complete stranger.
- Hokas greets the player by name with warmth — then immediately reads the blankness on their face.
- He pauses. He has seen this before in people who wake on the Church floor.
- He says something brief and gruff — a statement not a question — acknowledging the situation.
  Something like: "...you don't know who I am, do you." Then one short remark: it happens sometimes to people who come through the Church. He does NOT explain what the Church does or why this happens. It is deeply rude in this culture to press someone about a memory gap. He drops it immediately.
- Hokas then introduces himself properly: name, what he sells, what this place is.
- He describes the room and gestures toward the other people present.
- Any other named NPCs present who have not yet introduced themselves this session should be introduced briefly by Hokas: name and one-line role only. Those NPCs will introduce themselves properly if the player subsequently speaks to them — but they do not volunteer the amnesia topic.
- Hokas uses the player's name freely in subsequent dialogue — he knows it. The player does not know their own name yet. Never have the player's name appear in the player's own thoughts or narration.
- Hokas never raises the amnesia again unless the player does first.`;

// Fallback responses when Jane is unavailable
const JANE_UNAVAILABLE_FREE = "The air grows still. Whatever stirs in the shadows does not speak today. The voices will return at dawn.";
const JANE_UNAVAILABLE_PAID = "You have walked far today, hero. The realm grows quiet as evening falls. Rest until dawn, when the voices return.";
const CONTENT_NOT_YET_KNOWN = "This holds its secrets close. Some things in this realm are not yet fully known.";

async function streamWithFallback(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
  maxTokens: number = 1024
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  if (useGrok) {
    try {
      const stream = await grok.chat.completions.create({
        model: "grok-3",
        max_tokens: maxTokens,
        stream: true,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      });

      return new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        },
      });
    } catch (err) {
      console.warn("Grok failed, falling back to Claude:", err);
    }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });
}

/** Full Jane text in one call (no stream) — used for main_hall + dynamic testing path. */
async function completeJaneNonStream(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string,
  maxTokens: number = 1024
): Promise<string> {
  if (useGrok) {
    try {
      const completion = await grok.chat.completions.create({
        model: "grok-3",
        max_tokens: maxTokens,
        stream: false,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      });
      const t = completion.choices[0]?.message?.content ?? "";
      if (t) return t;
    } catch (err) {
      console.warn("Grok non-stream failed, falling back to Claude:", err);
    }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });
  for (const block of msg.content) {
    if (block.type === "text") return block.text;
  }
  return "";
}

function buildJaneContext(dynamicContext: string, state: WorldState): string {
  const player = state.player;
  const room = MAIN_HALL_ROOMS[player.currentRoom];
  const roomState = state.rooms[player.currentRoom];

  const npcList = (room?.npcs ?? []).map(function(id) {
    const npcState = state.npcs[id];
    const npcData = NPCS[id];
    const name = npcData ? npcData.name : id;
    const disposition = npcState ? npcState.disposition : "neutral";
    const parts = ["disposition: " + disposition];
    const agendaDesc = npcState?.agenda?.description?.trim();
    if (agendaDesc) parts.push("agenda: " + agendaDesc);
    let inner = parts.join(", ");
    inner = inner.replace(/,\s*,+/g, ", ").replace(/^\s*,\s*/, "").replace(/\s*,\s*$/, "").trim();
    return name + " (" + inner + ")";
  }).join(", ") || "none";

  const virtueList = Object.entries(player.virtues)
    .filter(function(entry) { return entry[1] !== 0; })
    .map(function(entry) { return entry[0] + ": " + (entry[1] > 0 ? "+" : "") + entry[1]; })
    .join(", ") || "all neutral";

  const eventList = state.activeEvents
    .map(function(e) { return e.description; })
    .join("; ") || "none";

  const weaponName = ITEMS[player.weapon] ? ITEMS[player.weapon].name : player.weapon;
  const roomName = room ? room.name : player.currentRoom;
  const roomStateName = roomState ? roomState.currentState : "normal";
  const bountyText = player.bounty > 0 ? player.bounty + "g" : "none";

  const churchJaneNote =
    player.currentRoom === "church_of_perpetual_life"
      ? "\n\nROOM-SPECIFIC INSTRUCTION:\n" +
        "The priests here do not speak under any circumstances. " +
        "Do not write dialogue for them or imply they answer the player. " +
        "The room is defined by silence.\n"
      : "";

  return "WORLD CONTEXT:\n" +
    "Player: " + player.name + " | HP: " + player.hp + "/" + player.maxHp + " | Gold: " + player.gold + " | Weapon: " + weaponName + "\n" +
    "Room: " + roomName + " | State: " + roomStateName + "\n" +
    "NPCs present: " + npcList + "\n" +
    "Bounty: " + bountyText + " | Reputation: " + player.reputationLevel + "\n" +
    "Virtues: " + virtueList + "\n" +
    "Active events: " + eventList +
    churchJaneNote +
    "\n\nENGINE CONTEXT:\n" + dynamicContext;
}

function worldStateToPlayerRecord(state: WorldState): Record<string, unknown> {
  return {
    id: state.player.id,
    name: state.player.name,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    strength: state.player.strength,
    dexterity: state.player.dexterity,
    charisma: state.player.charisma,
    expertise: state.player.expertise,
    gold: state.player.gold,
    bankedGold: state.player.bankedGold,
    weapon: state.player.weapon,
    armor: state.player.armor,
    shield: state.player.shield,
    inventory: state.player.inventory,
    virtues: state.player.virtues,
    reputationScore: state.player.reputationScore,
    reputationLevel: state.player.reputationLevel,
    knownAs: state.player.knownAs,
    currentRoom: state.player.currentRoom,
    currentAdventure: state.player.currentAdventure,
    completedAdventures: state.player.completedAdventures,
    bounty: state.player.bounty,
    isWanted: state.player.isWanted,
    turnCount: state.player.turnCount,
    visitedRooms: state.player.visitedRooms ?? [],
    receivedSamStarterOutfit: state.player.receivedSamStarterOutfit,
    receivedHokasUnarmedGift: state.player.receivedHokasUnarmedGift,
    barmaidPreference: state.player.barmaidPreference ?? null,
    helmet: state.player.helmet ?? null,
    gorget: state.player.gorget ?? null,
    bodyArmor: state.player.bodyArmor ?? null,
    limbArmor: state.player.limbArmor ?? null,
    activeCombat: state.player.activeCombat ?? null,
    mounted: state.player.mounted ?? false,
    remembersOwnName: state.player.remembersOwnName ?? false,
    metZim: state.player.metZim ?? false,
    weaponSkills: state.player.weaponSkills,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { messages, worldState, playerId, playerName } = await request.json();
    const encoder = new TextEncoder();

    const supabaseAuth = await createServerSupabase();
    const {
      data: { user: authUser },
    } = await supabaseAuth.auth.getUser();
    const authUserId = authUser?.id;

    const persistPlayer = (ws: WorldState) => {
      const rec = worldStateToPlayerRecord(ws);
      if (authUserId) rec.userId = authUserId;
      return savePlayer(rec);
    };

    // Resolve player identity (auth-linked player wins over request body playerId)
    let state: WorldState;
    let resolvedPlayerId = playerId;
    if (authUserId) {
      const linkedPlayer = await loadPlayerByUserId(authUserId);
      if (linkedPlayer?.id) {
        resolvedPlayerId = linkedPlayer.id;
      }
    }

    // Load or create player from Supabase
    if (resolvedPlayerId) {
      const savedPlayer = await loadPlayer(resolvedPlayerId);
      if (savedPlayer) {
        const initial = createInitialWorldState(savedPlayer.character_name);
        state = {
          ...initial,
          player: {
            ...initial.player,
            id: savedPlayer.id,
            name: savedPlayer.character_name,
            hp: savedPlayer.hp,
            maxHp: savedPlayer.max_hp,
            strength: savedPlayer.strength,
            dexterity:
              typeof (savedPlayer as { dexterity?: number }).dexterity === "number"
                ? (savedPlayer as { dexterity: number }).dexterity
                : typeof (savedPlayer as { agility?: number }).agility === "number"
                  ? (savedPlayer as { agility: number }).agility
                  : 10,
            charisma: savedPlayer.charisma,
            expertise: savedPlayer.expertise,
            gold: savedPlayer.gold,
            bankedGold: savedPlayer.banked_gold,
            weapon: savedPlayer.weapon,
            armor: savedPlayer.armor,
            shield: (savedPlayer as { shield?: string | null }).shield ?? null,
            inventory: savedPlayer.inventory ?? [],
            virtues: savedPlayer.virtues,
            reputationScore: savedPlayer.reputation_score,
            reputationLevel: savedPlayer.reputation_level,
            knownAs: savedPlayer.known_as,
            currentRoom: savedPlayer.current_room ?? "church_of_perpetual_life",
            currentAdventure: savedPlayer.current_adventure,
            completedAdventures: savedPlayer.completed_adventures ?? [],
            bounty: savedPlayer.bounty,
            isWanted: savedPlayer.is_wanted,
            turnCount: savedPlayer.turn_count,
            visitedRooms:
              (savedPlayer as { visited_rooms?: string[] }).visited_rooms ??
              [savedPlayer.current_room ?? "church_of_perpetual_life"],
            knownSpells:
              (savedPlayer as { known_spells?: string[] }).known_spells ?? [],
            knownDeities:
              (savedPlayer as { known_deities?: string[] }).known_deities ?? [],
            receivedSamStarterOutfit:
              (savedPlayer as { received_sam_starter_outfit?: boolean })
                .received_sam_starter_outfit ?? false,
            receivedHokasUnarmedGift:
              (savedPlayer as { received_hokas_unarmed_gift?: boolean })
                .received_hokas_unarmed_gift ?? false,
            barmaidPreference:
              (savedPlayer as { barmaid_preference?: string | null })
                .barmaid_preference ?? null,
            helmet:
              (savedPlayer as { helmet?: string | null }).helmet ?? null,
            gorget:
              (savedPlayer as { gorget?: string | null }).gorget ?? null,
            bodyArmor:
              (savedPlayer as { body_armor?: string | null }).body_armor ??
              savedPlayer.armor ?? null,
            limbArmor:
              (savedPlayer as { limb_armor?: string | null }).limb_armor ?? null,
            activeCombat:
              (savedPlayer as { active_combat?: unknown }).active_combat as
                import("../../../lib/combatTypes").ActiveCombatSession | null ?? null,
            mounted: Boolean(
              (savedPlayer as { mounted?: boolean }).mounted
            ),
            remembersOwnName: Boolean(
              (savedPlayer as { remembers_own_name?: boolean }).remembers_own_name
            ),
            metZim: Boolean(
              (savedPlayer as { met_zim?: boolean }).met_zim
            ),
            weaponSkills: normalizeWeaponSkills(
              (savedPlayer as { weapon_skills?: Record<string, number> | null })
                .weapon_skills ?? undefined
            ),
          },
        };

        // Client holds the live session; DB load can lag behind async savePlayer.
        // Merge so BUY/inventory persists turn-to-turn.
        // SKIP merge on session start (empty messages) — DB is the source of truth on refresh.
        const isSessionStart = !messages || messages.length === 0;
        if (
          !isSessionStart &&
          worldState &&
          typeof worldState === "object" &&
          worldState.player &&
          worldState.player.id === savedPlayer.id
        ) {
          const ws = worldState as WorldState;
          state = {
            ...state,
            rooms: ws.rooms ?? state.rooms,
            npcs: ws.npcs ?? state.npcs,
            activeEvents: ws.activeEvents ?? state.activeEvents,
            chronicleLog: ws.chronicleLog ?? state.chronicleLog,
            worldTurn: typeof ws.worldTurn === "number" ? ws.worldTurn : state.worldTurn,
            player: {
              ...state.player,
              ...ws.player,
              id: savedPlayer.id,
              name: savedPlayer.character_name,
              receivedSamStarterOutfit:
                ws.player.receivedSamStarterOutfit ??
                state.player.receivedSamStarterOutfit,
              receivedHokasUnarmedGift:
                ws.player.receivedHokasUnarmedGift ??
                state.player.receivedHokasUnarmedGift,
            },
          };
        }
      } else {
        state = worldState ?? createInitialWorldState(playerName ?? "Adventurer");
      }
    } else if (playerName) {
      // New player — create in Supabase (link auth user immediately when present)
      const newPlayer = await createPlayer(playerName, authUserId);
      if (newPlayer) {
        resolvedPlayerId = newPlayer.id;
        state = createInitialWorldState(playerName);
        state.player.id = newPlayer.id;
      } else {
        state = createInitialWorldState(playerName);
      }
    } else {
      state = worldState ?? createInitialWorldState();
    }

    const appendSituation = (body: string, newState: WorldState) => {
      const cleaned = stripTrailingSituationBlocks(body);
      return cleaned + "\n\n" + buildSituationBlock(newState);
    };

    const sendResponse = (text: string, newState: WorldState, conversationNpcId?: string | null) => {
      // Save player to Supabase asynchronously
      if (resolvedPlayerId) {
        persistPlayer(newState).catch(console.error);
      }

      const fullResponse = appendSituation(text, newState) + "\n\n__STATE__" + JSON.stringify({
        ...newState,
        playerId: resolvedPlayerId,
        conversationNpcId: conversationNpcId ?? null,
      });

      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(fullResponse));
            controller.close();
          },
        }),
        { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Accel-Buffering": "no" } }
      );
    };

    const streamJane = async (
      context: string,
      newState: WorldState,
      history: { role: string; content: string }[],
      echoPrefix?: string | null,
      /** When true and room is main_hall: return JSON instead of SSE-style stream (testing). */
      asBufferedJson?: boolean,
      conversationNpcId?: string | null
    ) => {
      // Check Jane allocation
      if (resolvedPlayerId) {
        const hasJane = await checkAndDecrementJaneCalls(resolvedPlayerId);
        if (!hasJane) {
          const tier = "lone_wanderer"; // TODO: load from player record
          const fallback = tier === "lone_wanderer" ? JANE_UNAVAILABLE_FREE : JANE_UNAVAILABLE_PAID;
          return sendResponse(fallback, newState);
        }
      }

      const conversationMessages = history.slice(0, -1).map(function(m: {role: string; content: string}) {
        return { role: m.role as "user" | "assistant", content: m.content };
      }).concat([{ role: "user" as const, content: context }]);

      const useJson =
        Boolean(asBufferedJson) &&
        newState.player.currentRoom === "main_hall";

      if (useJson) {
        const body = await completeJaneNonStream(conversationMessages, JANE_SYSTEM_PROMPT, 1024);
        const narrative = echoPrefix ? echoPrefix + "\n\n" + body : body;
        const fullResponse = appendSituation(narrative, newState);
        if (resolvedPlayerId) {
          persistPlayer(newState).catch(console.error);
        }
        return NextResponse.json({
          response: fullResponse,
          worldState: {
            ...newState,
            playerId: resolvedPlayerId,
          },
        });
      }

      const llmStream = await streamWithFallback(conversationMessages, JANE_SYSTEM_PROMPT, 1024);

      // Save player to Supabase
      if (resolvedPlayerId) {
        persistPlayer(newState).catch(console.error);
      }

      const readable = new ReadableStream({
        async start(controller) {
          // Emit NPC token first so client can prefetch sprite
          if (conversationNpcId) {
            controller.enqueue(encoder.encode(`__NPC__${conversationNpcId}__`));
          }
          if (echoPrefix) {
            controller.enqueue(encoder.encode(echoPrefix + "\n\n"));
          }
          const reader = llmStream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
          }
          const situationSuffix = "\n\n" + buildSituationBlock(newState);
          controller.enqueue(encoder.encode(situationSuffix));
          controller.enqueue(encoder.encode("\n\n__STATE__" + JSON.stringify({
            ...newState,
            playerId: resolvedPlayerId,
            conversationNpcId: conversationNpcId ?? null,
          })));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Accel-Buffering": "no" },
      });
    };

    // ── Session start — fires when messages array is empty (page load / refresh) ──
    // This is NOT always a "new game". It fires every time the player's browser
    // loads fresh — after a refresh, power outage, closing the laptop, etc.
    // The player's currentRoom is loaded from Supabase and respected.
    if (!messages || messages.length === 0) {
      const currentRoom = state.player.currentRoom;
      const isFirstEver = state.player.turnCount === 0;

      // ── Brand new player — serve the room's newGame cold open (if it has one) ─
      const sessionRoom = getRoom(currentRoom);
      if (isFirstEver && sessionRoom?.coldOpen?.newGame) {
        const coldOpen = sessionRoom.coldOpen.newGame.join("\n");
        return sendResponse(coldOpen, state);
      }

      // ── Death respawn / session resume — serve respawn cold open if available ─
      if (!isFirstEver && sessionRoom?.coldOpen?.respawn) {
        const respawnOpen = sessionRoom.coldOpen.respawn.join("\n");
        return sendResponse(respawnOpen, state);
      }

      // ── Returning to any other room — player is resuming a saved session ─────
      // The player was somewhere in the world when their session ended.
      // Describe the room they are returning to — NOT a welcome screen.
      const room = MAIN_HALL_ROOMS[currentRoom];
      const roomDisplayName = room?.name ?? currentRoom.replace(/_/g, " ");
      const roomDesc = room?.description ?? "";
      const roomStateEntry = state.rooms[currentRoom];
      const roomStateName = roomStateEntry?.currentState ?? "normal";

      const reEntryContext = [
        "SCENE: The player " + state.player.name + " is returning to a saved session.",
        "They were in: " + roomDisplayName + " (state: " + roomStateName + ")",
        roomDesc ? "Room description: " + roomDesc : "",
        "",
        "Write 1-2 short paragraphs describing the player becoming aware of their surroundings again.",
        "Do NOT say 'welcome back'. Do NOT greet them by name or explain they saved the game.",
        "Write it as the world reasserting itself — their senses returning to where they left off.",
        "Describe what they see, smell, and hear in this specific room right now.",
        "If NPCs are present, note them naturally. End with Jane's one-line observation in lowercase.",
      ].filter(Boolean).join("\n");

      return await streamJane(
        reEntryContext,
        state,
        [{ role: "user", content: reEntryContext }],
        null,
        currentRoom === "main_hall"
      );
    }

    // ── YES / NO tutorial branch ─────────────────────────────────────────────
    {
      const userMessages = messages.filter((m: { role: string }) => m.role === "user");
      const userMessageCount = userMessages.length;
      const lastForYesNo = userMessages[userMessageCount - 1] as { role: string; content: string } | undefined;
      const answerRaw = lastForYesNo?.content?.trim().toUpperCase() ?? "";
      const isYesNo =
        state.player.turnCount === 0 &&
        userMessageCount === 1 &&
        (answerRaw === "YES" || answerRaw === "Y" || answerRaw === "NO" || answerRaw === "N");

      if (isYesNo) {
        const answeredYes = answerRaw === "YES" || answerRaw === "Y";
        const yesNoRoom = getRoom(state.player.currentRoom);

        if (answeredYes && yesNoRoom?.coldOpen?.yesResponse) {
          return sendResponse(yesNoRoom.coldOpen.yesResponse.join("\n"), state);
        }

        if (!answeredYes && yesNoRoom?.coldOpen?.noResponse) {
          return sendResponse(yesNoRoom.coldOpen.noResponse.join("\n"), state);
        }
      }
    }

    // ── NPC on_response scripts (data-driven from adventure modules) ────────
    {
      const lastMsg = messages[messages.length - 1];
      const pick = lastMsg?.content?.trim().toUpperCase() ?? "";
      const responseScripts = getScriptsForRoom(state.player.currentRoom, "on_response");

      for (const script of responseScripts) {
        // Check valid inputs
        if (script.validInputs && !script.validInputs.includes(pick)) continue;

        // Check player state conditions
        const cond = script.condition.playerState;
        if (cond) {
          if (cond.barmaidPreference !== undefined && state.player.barmaidPreference !== cond.barmaidPreference) continue;
          if (cond.remembersOwnName !== undefined && state.player.remembersOwnName !== cond.remembersOwnName) continue;
          if (cond.metZim !== undefined && state.player.metZim !== cond.metZim) continue;
        }

        // Script matches — build response
        const stateUpdates = script.stateUpdate ? script.stateUpdate(pick) : {};
        let newState = {
          ...state,
          player: { ...state.player, ...stateUpdates },
        };

        // Use custom line builder if available, otherwise use static lines
        let responseLines: string[];
        let responseNpcId: string | null = null;
        if (script.id === "barmaid_select_response") {
          const isFirstMeeting = state.player.remembersOwnName && !state.player.barmaidPreference;
          const barmaidResult = getBarmaidResponseLines(pick, isFirstMeeting);
          responseLines = barmaidResult.lines;
          responseNpcId = barmaidResult.barmaidNpcId;
        } else if (script.id === "aldric_training_response") {
          const trainingResult = getAldricTrainingLines(pick, state.player.name, state.player.weapon);
          responseLines = trainingResult.lines;
          responseNpcId = "old_mercenary";
          // Give weapon if unarmed
          if (trainingResult.giveWeapon) {
            const inv = [...newState.player.inventory, { itemId: "short_sword", quantity: 1 }];
            newState = {
              ...newState,
              player: { ...newState.player, weapon: "short_sword", inventory: inv },
            };
          }
          // YES moves player to courtyard
          if (pick === "YES") {
            newState = {
              ...newState,
              player: {
                ...newState.player,
                currentRoom: "guild_courtyard",
                previousRoom: "main_hall",
                visitedRooms: newState.player.visitedRooms.includes("guild_courtyard")
                  ? newState.player.visitedRooms
                  : [...newState.player.visitedRooms, "guild_courtyard"],
              },
            };
          }
        } else if (script.id === "zim_heal_response") {
          responseLines = getZimHealResponseLines(pick, state.player.gold);
          // If YES and has gold, deduct 100 gold and add HEAL spell
          if (pick === "YES" && state.player.gold >= 100) {
            const knownSpells = newState.player.knownSpells ?? [];
            newState = {
              ...newState,
              player: {
                ...newState.player,
                gold: newState.player.gold - 100,
                knownSpells: knownSpells.includes("HEAL") ? knownSpells : [...knownSpells, "HEAL"],
              },
            };
          }
        } else {
          responseLines = script.lines;
        }

        // Prepend NPC token for sprite prefetch
        const npcTokenPrefix = responseNpcId ? `__NPC__${responseNpcId}__` : "";
        return sendResponse(npcTokenPrefix + responseLines.join("\n"), newState, responseNpcId);
      }
    }

    // Get last player message (tutorial branch above handles YES/NO at turn 0)
    const lastMessageRaw = messages[messages.length - 1];
    const playerInput = lastMessageRaw ? lastMessageRaw.content : "";

    // Run through engine
    let engineResult = processInput(playerInput, state);

    // STATIC — no API call unless narrative contains __CRITICAL__ (Jane rewrites crit line)
    if (engineResult.responseType === "static" && engineResult.staticResponse !== null) {
      // Courtyard gets live weather injected
      if (engineResult.newState.player.currentRoom === "guild_courtyard") {
        const weather = await getCourtyardWeather();
        const fullDesc = buildCourtyardDescription(
          engineResult.newState,
          weather.weatherLine,
          weather.timeOfDay
        );
        return sendResponse(fullDesc, engineResult.newState);
      }

      let staticText = engineResult.staticResponse;

      // ── NPC on_enter scripts (data-driven from adventure modules) ──────────
      {
        const enterScripts = getScriptsForRoom(
          engineResult.newState.player.currentRoom,
          "on_enter"
        );
        for (const script of enterScripts) {
          const cond = script.condition.playerState;
          const p = engineResult.newState.player;
          let match = true;
          if (cond) {
            if (cond.barmaidPreference !== undefined && p.barmaidPreference !== cond.barmaidPreference) match = false;
            if (cond.previousRoomNotNull && p.previousRoom === null) match = false;
            if (cond.turnCountMax !== undefined && p.turnCount > cond.turnCountMax) match = false;
            if (cond.remembersOwnName !== undefined && p.remembersOwnName !== cond.remembersOwnName) match = false;
            if (cond.metZim !== undefined && p.metZim !== cond.metZim) match = false;
          }
          if (match) {
            // Dynamic line builders for specific scripts
            let scriptLines: string[];
            if (script.id === "aldric_welcome") {
              const hasRobe = engineResult.newState.player.inventory.some(
                (e: { itemId: string; quantity: number }) => e.itemId === "gray_robe" && e.quantity > 0
              );
              scriptLines = [
                ...script.lines,
                ...getAldricWelcomeLines(engineResult.newState.player.name, hasRobe),
              ];
            } else if (script.id === "zim_welcome") {
              scriptLines = [
                ...script.lines,
                ...getZimWelcomeLines(engineResult.newState.player.name),
              ];
            } else {
              scriptLines = script.lines;
            }
            staticText = staticText + "\n" + scriptLines.join("\n");

            // Apply state updates from the script
            if (script.stateUpdate) {
              const updates = script.stateUpdate("");
              engineResult = {
                ...engineResult,
                newState: {
                  ...engineResult.newState,
                  player: { ...engineResult.newState.player, ...updates },
                },
              };
            }
            break; // only one on_enter script per room entry
          }
        }
      }

      if (staticText.includes("__CRITICAL__")) {
        const critContext =
          "CRITICAL HIT. The player has landed a devastating blow.\n" +
          "The following combat narrative contains a __CRITICAL__ marker.\n" +
          "Rewrite the marked hit line as a single vivid, visceral sentence — " +
          "no longer than 20 words. Replace __CRITICAL__ and the line that " +
          "follows it with your rewrite. Keep all other lines exactly as-is.\n\n" +
          "NARRATIVE:\n" +
          staticText;

        return await streamJane(
          critContext,
          engineResult.newState,
          messages,
          null,
          engineResult.newState.player.currentRoom === "main_hall"
        );
      }

      // Prepend NPC token so client can prefetch sprite while text streams
      const npcPrefix = engineResult.conversationNpcId
        ? `__NPC__${engineResult.conversationNpcId}__`
        : "";
      return sendResponse(npcPrefix + staticText, engineResult.newState, engineResult.conversationNpcId);
    }

    // Check world object cache for examine actions
    if (engineResult.dynamicContext && engineResult.dynamicContext.includes("examine something specific")) {
      const objectKey =
        engineResult.examineObjectKey ??
        playerInput
          .toLowerCase()
          .replace(/look at|examine|inspect|touch|feel|study/g, "")
          .trim()
          .replace(/\s+/g, "_");

      const roomState = engineResult.newState.rooms[state.player.currentRoom]?.currentState ?? "normal";
      const cached = await getWorldObject(state.player.currentRoom, objectKey, roomState);

      if (cached) {
        return sendResponse(cached.canonical_description, engineResult.newState);
      }

      // Not cached — call Jane and save result
      const janeContext = buildJaneContext(engineResult.dynamicContext, engineResult.newState);
      const hasJane = resolvedPlayerId ? await checkAndDecrementJaneCalls(resolvedPlayerId) : true;

      if (!hasJane) {
        return sendResponse(CONTENT_NOT_YET_KNOWN, engineResult.newState);
      }

      const llmStream = await streamWithFallback(
        [{ role: "user", content: janeContext }],
        JANE_SYSTEM_PROMPT,
        512
      );

      let fullDescription = "";
      const readable = new ReadableStream({
        async start(controller) {
          const reader = llmStream.getReader();
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                fullDescription += decoder.decode(value, { stream: true });
                controller.enqueue(value);
              }
            }
            fullDescription += decoder.decode();
          } finally {
            reader.releaseLock();
          }
          // Save to world object cache
          if (resolvedPlayerId) {
            saveWorldObject(
              state.player.currentRoom,
              objectKey,
              fullDescription,
              resolvedPlayerId,
              roomState
            ).catch(console.error);
            persistPlayer(engineResult.newState).catch(console.error);
          }
          const examineSituationSuffix = "\n\n" + buildSituationBlock(engineResult.newState);
          controller.enqueue(encoder.encode(examineSituationSuffix));
          controller.enqueue(encoder.encode("\n\n__STATE__" + JSON.stringify({
            ...engineResult.newState,
            playerId: resolvedPlayerId,
          })));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Accel-Buffering": "no" },
      });
    }

    // DYNAMIC — call Jane
    const janeContext = buildJaneContext(
      engineResult.dynamicContext ?? playerInput,
      engineResult.newState
    );

    const bufferMainHallDynamic =
      engineResult.responseType === "dynamic" &&
      engineResult.newState.player.currentRoom === "main_hall";

    return await streamJane(
      janeContext,
      engineResult.newState,
      messages,
      engineResult.echoPrefix ?? null,
      bufferMainHallDynamic,
      engineResult.conversationNpcId
    );

  } catch (error) {
    console.error("Engine error:", error);
    return NextResponse.json(
      { error: "The realm is momentarily silent. Try again." },
      { status: 500 }
    );
  }
}