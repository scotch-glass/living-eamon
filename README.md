# Living Eamon

> *One hero. Infinite realms. The universe remembers you.*

iving Eamon is the game no one else has dared to build. Like the Never Ending Story, it knows you. Like Ender's Game, it feels telepathic. One hero. Infinite realms. Is it really a game? Or is it alive? The real danger is you might never want to leave.

Living Eamon is a persistent, AI-driven text adventure — a spiritual successor to the 1980 classic Eamon. One character carries across hundreds of adventures. The world is alive, reactive, and builds itself through play. Like magic, the game writes itself for the player.

---

## What It Is

You type natural language. The world responds.

Every NPC has memory, personality, and goals they pursue independently. Can you even tell who is a PC and who is an NPC? It takes practice. Every moral choice reshapes your reputation, your attributes, and the stories told about you. An ancient intelligence named Jane watches every decision and quietly turns the universe into a mirror of your soul.

The world is **static with state** — pre-written content that changes based on what players do. Burn down the Main Hall and it stays burnt. Hokas Tokas remembers who did it. The Sheriff comes looking. The world trends toward order — but it is vulnerable, buildable, destructible, malleable, mysterious and it never forgets.

---

## Features (v0.1)

- **Pure scrolling chat interface** — type anything in natural language
- **Persistent hero** — your character survives between sessions (Supabase)
- **Character naming** — your hero is yours
- **Static game engine** — movement, inventory, stats, banking, combat math handled locally at zero API cost
- **Jane (AI layer)** — Anthropic Claude powers NPC conversation, moral choices, magic, and unexpected actions
- **10-virtue moral system** — Honesty, Compassion, Valor, Justice, Sacrifice, Honor, Spirituality, Humility, Grace, Mercy
- **Consequence engine** — actions have lasting consequences (burnt rooms, furious NPCs, bounties, Sheriff alerts)
- **NPC agenda system** — NPCs pursue goals, not just react
- **Living World Database** — object descriptions generated once by Jane, saved permanently for all players
- **Smooth character-by-character streaming** — press Space to skip animation
- **Suggested actions** — organic hints at the end of every response

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Backend | Next.js API routes |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude Sonnet |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Supabase account
- Anthropic API key

### Installation

```bash
git clone https://github.com/scotch-glass/living-eamon
cd living-eamon
npm install
```

### Environment Variables

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=your-anthropic-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Database Setup

Run the SQL schema in your Supabase SQL Editor:

```
supabase/schema.sql
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

### Static With State
The world is pre-written and stateful. Jane only generates content when something genuinely novel occurs. Once Jane writes it, it's saved permanently to Supabase and served to every subsequent player for free.

### The Engine Decision Tree
```
Player input
  → Static intent? (movement, inventory, stats, look, banking)
      → Return immediately, zero API cost
  → World object cache hit? (Supabase)
      → Return cached description, zero API cost  
  → Dynamic (conversation, magic, moral choice, unexpected)
      → Call Jane → stream response → save to Supabase
```

### Cost Model
- Movement, inventory, stats: free
- Room descriptions: free
- Cached world objects: free (after first generation)
- NPC conversation, magic, moral choices: ~$0.009 per call
- Typical 30-minute session: ~$0.15

---

## Roadmap

### Phase 1 — Complete
- [x] Core game engine
- [x] Streaming chat interface
- [x] Supabase persistence
- [x] Character creation
- [x] Consequence engine
- [x] Living World Database

### Phase 2 — Next
- [ ] Banking system
- [ ] Henchman hiring
- [ ] Chronicle newspaper
- [ ] Grok API integration

### Phase 3 — Living World
- [ ] Occult magic system
- [ ] Prison adventure
- [ ] Multiple shards
- [ ] Multiplayer (Adventurer tier)

### Phase 4 — Legend
- [ ] Hundreds of classic Eamon adventures
- [ ] Player retirement → immortal NPC
- [ ] Hall of Legends
- [ ] Jane self-evolution

---

## Pricing Tiers

| Tier | Price | Description |
|------|-------|-------------|
| Lone Wanderer | Free | Full solo play, 10 Jane calls/day |
| Adventurer | $9.99/mo | Multiplayer, 100 Jane calls/day |
| Worldshaper | $19.99/mo | Unlimited Jane, pocket realms |
| Eternal Legend | $49.99/mo | Immortal NPC, custom adventures |

No pay-to-win. Virtues, combat, and Jane's moral mirror are identical across all tiers.

---

## Acknowledgements

Inspired by the original Eamon adventure system created by Donald Brown in 1980 for the Apple II. Influenced by the Jane Game in Ender's Game, the NeverEnding Story book (and movie), Star Wars, Tolkien, Narnia, Ancient Aliens, Game of Thrones, Bard's Tale, Zork, Monty Python, Ready Player One and more. Living Eamon is a spiritual descendant from a darkly humorous family tree, not a direct port of anything.

---

*she is watching*