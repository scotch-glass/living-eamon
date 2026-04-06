// Run: npm install openai
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
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
import { NPCS, ITEMS, MAIN_HALL_ROOMS } from "../../../lib/gameData";
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
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

const useGrok = !!process.env.GROK_API_KEY;

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
- Death loses carried gold only. The hero always persists.
- Keep responses to 3-5 paragraphs. Vivid but efficient.
- Never output the dashed-line situation summary block (lines of ─) or duplicate that UI; the engine appends it once after your text.`;

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
    receivedSamStarterOutfit: state.player.receivedSamStarterOutfit,
    receivedHokasUnarmedGift: state.player.receivedHokasUnarmedGift,
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
            currentRoom: savedPlayer.current_room ?? "main_hall",
            currentAdventure: savedPlayer.current_adventure,
            completedAdventures: savedPlayer.completed_adventures ?? [],
            bounty: savedPlayer.bounty,
            isWanted: savedPlayer.is_wanted,
            turnCount: savedPlayer.turn_count,
            knownSpells:
              (savedPlayer as { known_spells?: string[] }).known_spells ??
              ["BLAST", "HEAL", "LIGHT", "SPEED"],
            knownDeities:
              (savedPlayer as { known_deities?: string[] }).known_deities ?? [],
            receivedSamStarterOutfit:
              (savedPlayer as { received_sam_starter_outfit?: boolean })
                .received_sam_starter_outfit ?? false,
            receivedHokasUnarmedGift:
              (savedPlayer as { received_hokas_unarmed_gift?: boolean })
                .received_hokas_unarmed_gift ?? false,
            weaponSkills: normalizeWeaponSkills(
              (savedPlayer as { weapon_skills?: Record<string, number> | null })
                .weapon_skills ?? undefined
            ),
          },
        };

        // Client holds the live session; DB load can lag behind async savePlayer. Merge so BUY/inventory persists turn-to-turn.
        if (
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
      // New player — create in Supabase
      const newPlayer = await createPlayer(playerName);
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

    const sendResponse = (text: string, newState: WorldState) => {
      // Save player to Supabase asynchronously
      if (resolvedPlayerId) {
        persistPlayer(newState).catch(console.error);
      }

      const fullResponse = appendSituation(text, newState) + "\n\n__STATE__" + JSON.stringify({
        ...newState,
        playerId: resolvedPlayerId,
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
      asBufferedJson?: boolean
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
          })));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Accel-Buffering": "no" },
      });
    };

    // Opening game
    if (!messages || messages.length === 0) {
      const openingContext = "This is the very start of the game. The player " + state.player.name + " has just arrived at the Main Hall for the first time.\n" +
        "They have no gold, no weapon, and wear only the guild's thin gray robe — a backless humiliation meant for the newly arrived or the recently reborn.\n" +
        "Describe the Main Hall vividly using this as your foundation:\n" +
        MAIN_HALL_ROOMS.main_hall.description + "\n" +
        "Address the player by their name: " + state.player.name + "\n" +
        "Introduce Hokas Tokas and Sam Slicker naturally.\n" +
        "End with jane's one-line observation in lowercase.";

      return await streamJane(openingContext, state, [{ role: "user", content: openingContext }], null);
    }

    // Get last player message
    const lastMessage = messages[messages.length - 1];
    const playerInput = lastMessage ? lastMessage.content : "";

    // Run through engine
    const engineResult = processInput(playerInput, state);

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

      const staticText = engineResult.staticResponse;

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

      return sendResponse(staticText, engineResult.newState);
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
      bufferMainHallDynamic
    );

  } catch (error) {
    console.error("Engine error:", error);
    return NextResponse.json(
      { error: "The realm is momentarily silent. Try again." },
      { status: 500 }
    );
  }
}