-- Living Eamon — Base Schema
-- Creates all tables from scratch. Safe to run on an existing DB (IF NOT EXISTS).

-- ── Players ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  character_name text NOT NULL DEFAULT 'Adventurer',
  hp integer NOT NULL DEFAULT 20,
  max_hp integer NOT NULL DEFAULT 20,
  strength integer NOT NULL DEFAULT 10,
  dexterity integer NOT NULL DEFAULT 10,
  charisma integer NOT NULL DEFAULT 10,
  expertise integer NOT NULL DEFAULT 0,
  gold integer NOT NULL DEFAULT 0,
  banked_gold integer NOT NULL DEFAULT 0,
  weapon text DEFAULT 'unarmed',
  armor text,
  shield text,
  helmet text,
  gorget text,
  body_armor text,
  limb_armor text,
  active_combat jsonb,
  mounted boolean DEFAULT false,
  remembers_own_name boolean DEFAULT false,
  met_zim boolean DEFAULT false,
  inventory jsonb DEFAULT '[]'::jsonb,
  virtues jsonb DEFAULT '{}'::jsonb,
  reputation_score integer DEFAULT 0,
  reputation_level text DEFAULT 'Unknown',
  known_as text,
  current_room text DEFAULT 'church_of_perpetual_life',
  current_adventure text,
  completed_adventures jsonb DEFAULT '[]'::jsonb,
  bounty integer DEFAULT 0,
  is_wanted boolean DEFAULT false,
  turn_count integer DEFAULT 0,
  visited_rooms text[] DEFAULT ARRAY['church_of_perpetual_life'],
  barmaid_preference text,
  received_sam_starter_outfit boolean DEFAULT false,
  received_hokas_unarmed_gift boolean DEFAULT false,
  weapon_skills jsonb DEFAULT '{}'::jsonb,
  last_seen timestamptz DEFAULT now()
);

-- ── World Objects (Jane-generated descriptions, cached) ─────
CREATE TABLE IF NOT EXISTS world_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  object_key text NOT NULL,
  room_state text DEFAULT 'normal',
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, object_key, room_state)
);

-- ── Room States ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL UNIQUE,
  current_state text DEFAULT 'normal',
  updated_at timestamptz DEFAULT now()
);

-- ── NPC States ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS npc_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id text NOT NULL,
  player_id uuid,
  disposition text DEFAULT 'neutral',
  is_alive boolean DEFAULT true,
  location text,
  custom_greeting text,
  combat_hp integer,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(npc_id, player_id)
);

-- ── Jane Memories ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jane_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid,
  memory_type text NOT NULL,
  content text NOT NULL,
  room_id text,
  created_at timestamptz DEFAULT now()
);

-- ── Chronicle Log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chronicle_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid,
  entry text NOT NULL,
  is_significant boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── Scene Image Cache ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS scene_image_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  room_state text DEFAULT 'normal',
  tone text,
  image_url text NOT NULL,
  prompt_used text,
  approved boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ── Grok Imagine Error Log ──────────────────────────────────
CREATE TABLE IF NOT EXISTS grok_imagine_error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text,
  prompt_used text,
  error_message text,
  created_at timestamptz DEFAULT now()
);
