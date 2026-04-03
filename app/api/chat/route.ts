import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { processInput } from "../../../lib/gameEngine";
import { createInitialWorldState, WorldState } from "../../../lib/gameState";
import { NPCS, ITEMS, MAIN_HALL_ROOMS } from "../../../lib/gameData";
import {
  savePlayer,
  loadPlayer,
  createPlayer,
  getWorldObject,
  saveWorldObject,
  checkAndDecrementJaneCalls,
} from "../../../lib/supabase";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
- Always end with 2-3 italicized suggested actions on a new line, formatted like: *You might: [action 1], [action 2], or [something unexpected].*
- These suggestions should feel organic to the moment — not a menu, but a living world hinting at possibilities.`;

// Fallback responses when Jane is unavailable
const JANE_UNAVAILABLE_FREE = "The air grows still. Whatever stirs in the shadows does not speak today. The voices will return at dawn.\n\n*You might: look around, check your inventory, or head in a new direction.*";
const JANE_UNAVAILABLE_PAID = "You have walked far today, hero. The realm grows quiet as evening falls. Rest until dawn, when the voices return.\n\n*You might: look around, check your inventory, or bank your gold.*";
const CONTENT_NOT_YET_KNOWN = "This holds its secrets close. Some things in this realm are not yet fully known.\n\n*You might: look around, try something else, or move on.*";

function buildJaneContext(dynamicContext: string, state: WorldState): string {
  const player = state.player;
  const room = MAIN_HALL_ROOMS[player.currentRoom];
  const roomState = state.rooms[player.currentRoom];

  const npcList = (room?.npcs ?? []).map(function(id) {
    const npcState = state.npcs[id];
    const npcData = NPCS[id];
    const name = npcData ? npcData.name : id;
    const disposition = npcState ? npcState.disposition : "neutral";
    const agenda = npcState && npcState.agenda ? ", agenda: " + npcState.agenda.description : "";
    return name + " (disposition: " + disposition + agenda + ")";
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

  return "WORLD CONTEXT:\n" +
    "Player: " + player.name + " | HP: " + player.hp + "/" + player.maxHp + " | Gold: " + player.gold + " | Weapon: " + weaponName + "\n" +
    "Room: " + roomName + " | State: " + roomStateName + "\n" +
    "NPCs present: " + npcList + "\n" +
    "Bounty: " + bountyText + " | Reputation: " + player.reputationLevel + "\n" +
    "Virtues: " + virtueList + "\n" +
    "Active events: " + eventList + "\n\n" +
    "ENGINE CONTEXT:\n" + dynamicContext;
}

function worldStateToPlayerRecord(state: WorldState): Record<string, unknown> {
  return {
    id: state.player.id,
    name: state.player.name,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    strength: state.player.strength,
    agility: state.player.agility,
    charisma: state.player.charisma,
    expertise: state.player.expertise,
    gold: state.player.gold,
    bankedGold: state.player.bankedGold,
    weapon: state.player.weapon,
    armor: state.player.armor,
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
  };
}

export async function POST(request: NextRequest) {
  try {
    const { messages, worldState, playerId, playerName } = await request.json();
    const encoder = new TextEncoder();

    // Load or create player from Supabase
    let state: WorldState;
    let resolvedPlayerId = playerId;

    if (playerId) {
      const savedPlayer = await loadPlayer(playerId);
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
            agility: savedPlayer.agility,
            charisma: savedPlayer.charisma,
            expertise: savedPlayer.expertise,
            gold: savedPlayer.gold,
            bankedGold: savedPlayer.banked_gold,
            weapon: savedPlayer.weapon,
            armor: savedPlayer.armor,
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
          },
        };
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

    const sendResponse = (text: string, newState: WorldState) => {
      // Save player to Supabase asynchronously
      if (resolvedPlayerId) {
        savePlayer(worldStateToPlayerRecord(newState)).catch(console.error);
      }

      const fullResponse = text + "\n\n__STATE__" + JSON.stringify({
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

    const streamJane = async (context: string, newState: WorldState, history: {role: string; content: string}[]) => {
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

      const stream = await client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: JANE_SYSTEM_PROMPT,
        messages: conversationMessages,
      });

      // Save player to Supabase
      if (resolvedPlayerId) {
        savePlayer(worldStateToPlayerRecord(newState)).catch(console.error);
      }

      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
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
        "Describe the Main Hall vividly using this as your foundation:\n" +
        MAIN_HALL_ROOMS.main_hall.description + "\n" +
        "Address the player by their name: " + state.player.name + "\n" +
        "Introduce Hokas Tokas and Sam Slicker naturally.\n" +
        "End with jane's one-line observation in lowercase.\n" +
        "Then on a new line suggest 2-3 possible actions formatted as: *You might: [action 1], [action 2], or [action 3].*";

      return await streamJane(openingContext, state, [{ role: "user", content: openingContext }]);
    }

    // Get last player message
    const lastMessage = messages[messages.length - 1];
    const playerInput = lastMessage ? lastMessage.content : "";

    // Run through engine
    const engineResult = processInput(playerInput, state);

    // STATIC — no API call
    if (engineResult.responseType === "static" && engineResult.staticResponse) {
      return sendResponse(engineResult.staticResponse, engineResult.newState);
    }

    // Check world object cache for examine actions
    if (engineResult.dynamicContext && engineResult.dynamicContext.includes("examine something specific")) {
      const objectKey = playerInput.toLowerCase()
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

      const stream = await client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: JANE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: janeContext }],
      });

      let fullDescription = "";
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              fullDescription += chunk.delta.text;
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
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
            savePlayer(worldStateToPlayerRecord(engineResult.newState)).catch(console.error);
          }
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

    return await streamJane(janeContext, engineResult.newState, messages);

  } catch (error) {
    console.error("Engine error:", error);
    return NextResponse.json(
      { error: "The realm is momentarily silent. Try again." },
      { status: 500 }
    );
  }
}