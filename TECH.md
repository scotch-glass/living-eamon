# Living Eamon — Technical Architecture
*Auto-maintained. Updated when architecture changes.*
*Last updated: April 5, 2026*

For rehydration, also read:
- `CLAUDE_CONTEXT.md` — project state, file map, milestones, session log
- `GAME_DESIGN.md` — game systems and design decisions

Raw URLs for Claude rehydration:
- https://raw.githubusercontent.com/scotch-glass/living-eamon/main/TECH.md
- https://raw.githubusercontent.com/scotch-glass/living-eamon/main/CLAUDE_CONTEXT.md
- https://raw.githubusercontent.com/scotch-glass/living-eamon/main/GAME_DESIGN.md

---

## 1. Stack Overview

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Server components + route handlers |
| Language | TypeScript | Strict mode |
| Styling | Tailwind v4 (dependency) | Primary game UI uses inline styles |
| Database | Supabase (PostgreSQL) | Players, world state, auth |
| Auth | Supabase Auth + `@supabase/ssr` | Email/password + Google SSO; cookie sessions |
| AI Narrator | Anthropic Claude (`claude-sonnet-4-20250514`) | Jane; streaming + buffered |
| AI Fallback | xAI Grok (`grok-3`) | Optional; OpenAI-compatible API |
| Image Gen | xAI (`grok-imagine-image`) | UO-style item art; local scripts only |
| Hosting | Vercel | Auto-deploy from `main` |
| IDE | Cursor | Rules enforce `CLAUDE_CONTEXT.md` updates |

---

## 2. Authentication Architecture

### 2.1 Provider

Supabase Auth. Two flows:
- **Email + password** — signup with optional email confirmation
- **Google SSO** — OAuth 2.0 PKCE via Google Cloud Console

### 2.2 Session Storage

HTTP-only cookies via `@supabase/ssr`. Three client factory patterns:

| Factory | Used in | File |
|---------|---------|------|
| `createBrowserSupabase()` | Client Components | `lib/supabaseAuth.ts` |
| `createServerSupabase()` | Server Components, Route Handlers | `lib/supabaseAuth.ts` |
| `createMiddlewareSupabase()` | `middleware.ts` only | `lib/supabaseAuth.ts` |

Middleware runs on every request, refreshes the session token, and redirects unauthenticated users to `/login`. Auth routes (`/login`, `/register`, `/auth/callback`) are always public.

### 2.3 Auth Flow — Email/Password

```
User fills /register → registerAction() → supabase.auth.signUp()
  → players row inserted (user_id = auth.users.id)
  → email confirmation required → /register?success=check_email
  → OR → redirect to /
```

### 2.4 Auth Flow — Google SSO

```
User clicks "Continue with Google" → googleSignInAction()
  → supabase.auth.signInWithOAuth() → Google OAuth URL
  → redirect to Google → Google redirects to /auth/callback?code=
  → exchange code for session → redirect to /
```

### 2.5 Player–Auth Link

`players.user_id` UUID → FK to `auth.users(id)` ON DELETE CASCADE.

On registration:
```sql
INSERT INTO players (user_id, character_name) VALUES ($auth_user_id, $hero_name)
```

On game load:
```typescript
const { data } = await serviceClient
  .from("players").select("*").eq("user_id", authUser.id).single();
```

### 2.6 Environment Variables

| Variable | Purpose | Where set |
|----------|---------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `.env.local` + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | `.env.local` + Vercel |
| `SUPABASE_SERVICE_KEY` | Service role (server only) | `.env.local` + Vercel |
| `ANTHROPIC_API_KEY` | Claude API | `.env.local` + Vercel |
| `GROK_API_KEY` | Optional Grok fallback | `.env.local` + Vercel |
| `NEXT_PUBLIC_SITE_URL` | Auth redirect base URL | `.env.local` + Vercel |

`NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` in dev; `https://living-eamon.vercel.app` in prod (set in Vercel dashboard).

### 2.7 Google OAuth Setup (manual — one-time)

1. [console.cloud.google.com](https://console.cloud.google.com) → New project
2. Enable Google+ API → OAuth consent screen → Web application credentials
3. Authorized redirect URI: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
4. Supabase dashboard → Authentication → Providers → Google → paste Client ID + Secret

---

## 3. Database Schema

### 3.1 `players` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK (auto) |
| `user_id` | UUID | FK → `auth.users(id)` ON DELETE CASCADE |
| `character_name` | text | Hero name from registration |
| `hp` / `max_hp` | int | |
| `current_mana` | int | Current mana points; max = `expertise` (the mana pool size). Default 10. |
| `strength` / `dexterity` / `charisma` / `expertise` | int | `dexterity` replaces legacy `agility`. `expertise` is the mana pool size (formerly a 4th display stat — dropped from sidebar). |
| `gold` / `banked_gold` | int | |
| `weapon` / `armor` / `shield` | text / nullable | Item ids. Legacy `armor` mapped to `body_armor` on load. |
| `helmet` / `gorget` / `body_armor` / `limb_armor` | text / nullable | Per-zone armor slots (HWRR-style) |
| `inventory` | jsonb | `{ itemId, quantity }[]` |
| `virtues` | jsonb | 10 virtue scores; **Honor** is decremented by charity-barrel takes and gray-robe-worn ticks |
| `active_combat` | jsonb / nullable | `ActiveCombatSession` — non-null while in a fight |
| `active_effects` | jsonb | `ActiveStatusEffect[]` — bleed, poison, broken_leg etc. that persist out of combat. Default `[]`. |
| `barrel_stock` | jsonb | `{ gowns: number, charityClothes: number }` — finite stock for Main Hall charity barrels. Default `{gowns:20, charityClothes:10}`. |
| `reputation_score` / `reputation_level` / `known_as` | | |
| `current_room` / `current_adventure` / `completed_adventures` | | |
| `visited_rooms` | text[] | Fog-of-war exit labels — only revealed for rooms the player has entered |
| `bounty` / `is_wanted` | | |
| `turn_count` / `last_seen` | | |
| `mounted` | bool | Affects armor dex penalties (plate is viable only when mounted) |
| `remembers_own_name` | bool | Set true after first NPC name-revelation (Hokas/Sam/Aldric BEG) |
| `met_zim` | bool | Set true after first visit to Pots & Bobbles (Zim's intro fires once) |
| `barmaid_preference` | text / nullable | Aldric drink offer choice (Lira/Mavia/Seraine) |
| `received_sam_starter_outfit` | bool | Set after Sam's first-purchase outfit bundle; reset on death |
| `received_hokas_unarmed_gift` | bool | Set after Hokas's one-time unarmed pity gift; reset on death |
| `weapon_skills` | jsonb | Per-category skill values (swordsmanship, mace_fighting, etc.). Total capped at SKILL_CAP=700. |
| `jane_calls_today` / `jane_calls_reset_at` | | Jane rate limiting |
| `tier` | text | Subscription tier |
| `known_spells` / `known_deities` | jsonb | Not yet persisted in savePlayer — known gap |

### 3.2 Other tables

- `world_objects` — Jane-generated object descriptions (cached by `roomId:objectKey`)
- `room_states` — persistent room conditions
- `npc_states` — per-player NPC disposition and memory
- `jane_memories` — significant events per player
- `chronicle_log` — event log for the in-world newspaper

### 3.3 Planned tables (Phase 2)

**`player_profiles`** — psychological profile:

| Column | Type |
|--------|------|
| `user_id` | UUID FK |
| `genre_preferences` | jsonb |
| `author_styles` | jsonb |
| `narrative_themes` | jsonb |
| `darkness_tolerance` | int (0–100) |
| `pacing_preference` | text |
| `age_tier` | text |
| `reading_history` | jsonb |
| `goodreads_url` | text nullable |
| `kindle_data_imported` | boolean |
| `profile_version` | int |
| `last_rebuilt` | timestamptz |

**`subscriptions`** — Stripe state:

| Column | Type |
|--------|------|
| `user_id` | UUID FK |
| `stripe_customer_id` | text |
| `stripe_subscription_id` | text |
| `tier` | text |
| `status` | text |
| `current_period_end` | timestamptz |

---

## 4. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | Main game loop — engine + Jane |
| `/api/player` | POST | Create player |
| `/api/player` | GET | Load player by id |
| `/auth/callback` | GET | OAuth + email confirmation handler |

### `/api/chat` response modes

- **Static:** `text/plain`; `__STATE__` sentinel separates narrative from JSON world state
- **Dynamic (main_hall testing):** `application/json` `{ response, worldState }`

**Known issue:** `bufferMainHallDynamic` flag must be removed before production. All rooms should stream.

---

## 5. Subscription Tiers

| Tier | Price | Jane calls/day |
|------|-------|---------------|
| `lone_wanderer` | Free | 10 |
| `adventurer` | $9.99/mo | 100 |
| `worldshaper` | $19.99/mo | Unlimited |
| `eternal_legend` | $49.99/mo | Unlimited |

Enforced in `checkAndDecrementJaneCalls()` (`lib/supabase.ts`). Stripe integration is Phase 2.

---

## 6. Jane Architecture

**Model:** `claude-sonnet-4-20250514` (primary) / `grok-3` (fallback)

**Decision tree:**
```
Input → Static? → Return immediately (zero cost)
     → World object cache hit? → Return cached (zero cost)
     → Dynamic → Call Jane → stream/buffer → save to Supabase
```

**World object cache:** First examine generates via Jane; saved to `world_objects`; all subsequent players get cached version at zero cost.

**Jane system prompt summary:** Ancient intelligence; narrates in modern English; NPCs in Universal Common (light Elizabethan); tracks virtues; moral responses may end with `*[VirtueName +N]*`; does not append italicized “You might” suggestions (command discovery uses `CommandInput` autocomplete); never outputs the situation block; never mentions AI.

**Personalization (Phase 2):** When `player_profiles` exists, Jane receives a READER PROFILE block each session built from the player's psychological profile. See `GAME_DESIGN.md` §20.4.

---

## 7. Roadmap

### Phase 1 — Complete
- [x] Core game engine
- [x] Streaming chat + Supabase persistence
- [x] Jane narrator (Claude + Grok fallback)
- [x] UO weapon data, equip system, Sam shop
- [x] Consequence engine
- [x] Auth: email/password + Google SSO via Supabase Auth

### Phase 2 — Next
- [ ] Player Profile page + Reader's Mirror
- [ ] GoodReads/Kindle import pipeline
- [ ] Jane personalization injection from profile
- [ ] Stripe subscription integration
- [ ] Stamina, hunger/thirst, encumbrance systems
- [ ] Persist `known_spells` / `known_deities`
- [ ] Re-enable Jane streaming in `main_hall` for production
- [ ] Pip static shop
- [ ] Full Beginner's Cave adventure

### Phase 3 — Living World
- [ ] Occult magic (INVOKE, reagents, The Order)
- [ ] Multiplayer (Adventurer tier)
- [ ] Runes and runegates

### Phase 4 — Legend
- [ ] Hundreds of Eamon adventures
- [ ] Player retirement → immortal NPC
- [ ] Jane self-evolution
