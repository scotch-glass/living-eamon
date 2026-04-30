-- ============================================================
-- Wardrobe Engine — Sprint 1 · Day 1
--
-- Paper-doll layering for player-character sprites. Every
-- piece is generated ONCE against a canonical body, cut into
-- a transparent per-slot PNG, stored forever. Runtime composite
-- is sharp-only — zero Grok calls during gameplay.
--
-- See lib/wardrobe/CLAUDE_CONTEXT.md for the full design.
-- ============================================================

-- ── Canonical bare-body reference for a hero × posture ────
--   One row per (hero_master_id, posture, wardrobe_version).
--   Composite path picks the live row (retired_at is null)
--   whose wardrobe_version matches the current checksum.
create table if not exists public.wardrobe_anchors (
  id uuid primary key default gen_random_uuid(),

  hero_master_id uuid not null
    references public.hero_masters(id) on delete cascade,

  -- 'casual' ships in the pilot; 'combat' scaffolded for later.
  posture text not null
    check (posture in ('casual', 'combat')),

  -- Public URL to the transparent-PNG anchor in the
  -- wardrobe-layers storage bucket (pieces/anchors/*).
  png_url text not null,

  -- Verbatim text sent to Grok Imagine Pro at generation.
  -- Stored for forensic comparison when pair-diff degrades.
  prompt_used text not null,

  -- Incremented whenever any CANONICAL_BODY_PROMPT_CHECKSUM
  -- input changes. Composite aborts if the anchor and the
  -- pieces being layered disagree on version.
  wardrobe_version integer not null default 1,

  created_at timestamptz not null default now(),
  retired_at timestamptz,

  unique (hero_master_id, posture, wardrobe_version)
);

create index if not exists wardrobe_anchors_live_idx
  on public.wardrobe_anchors(hero_master_id, posture)
  where retired_at is null;

-- ── Per-slot cutouts ─────────────────────────────────────
--   One row per (item, slot, posture, variant_hash, hero_master_id).
--   hero_master_id null = piece is shared across all heroes
--   (most clothing/armor). hero_master_id set = piece is
--   hero-specific (reserved for e.g. bespoke royal regalia in
--   the future; pilot never sets this).
create table if not exists public.wardrobe_pieces (
  id uuid primary key default gen_random_uuid(),

  -- FK to ITEMS in lib/gameData.ts. Text not uuid — items live
  -- in code, not DB, and are keyed by string ids.
  item_id text not null,

  -- Slot name. Must match the Slot enum in lib/wardrobe/slots.ts.
  -- Enumerated here for DB-level safety against typos.
  slot text not null check (slot in (
    'back_cloak','skirt','legging','footwear','shirt','chest',
    'robe','sleeves','sash','gloves','bracelet','ring','neck',
    'earrings','weapon_sheathed','talisman','head','front_cloak',
    'right_hand','left_hand'
  )),

  posture text not null
    check (posture in ('casual','combat','both')),

  -- Mirror of SLOT_Z_INDEX at generation time. Denormalized
  -- so the composite path doesn't have to reach into code.
  z_index integer not null,

  -- Null = shared piece usable by any hero. Non-null = bespoke
  -- piece for one hero only (reserved; unused in pilot).
  hero_master_id uuid
    references public.hero_masters(id) on delete cascade,

  -- Short hash over the full prompt. Lets multiple prompt
  -- variants for the same item coexist during iteration.
  variant_hash text not null,

  prompt_text text not null,

  -- Public URL to the transparent-PNG cutout in the
  -- wardrobe-layers bucket (pieces/{slot}/...).
  png_url text not null,

  -- For pair-diff pieces: URL to the "naked" A-call PNG so the
  -- diff can be re-inspected in the lab. Null for paint-and-crop
  -- pieces (future small-target fallback).
  parent_pair_naked_url text,

  -- QA-only: bounding box of opaque pixels on the canonical
  -- canvas, as { x, y, w, h }. Useful for the lab viewer.
  bbox jsonb,

  wardrobe_version integer not null default 1,

  -- False = scratch/unreviewed; the runtime composite refuses
  -- to use unapproved pieces. Toggled via scripts/wardrobe/approve.ts.
  approved boolean not null default false,

  created_at timestamptz not null default now(),
  retired_at timestamptz,
  notes text
);

-- Fast lookup of the live approved piece for a given item.
create index if not exists wardrobe_pieces_item_posture_idx
  on public.wardrobe_pieces(item_id, posture, approved)
  where retired_at is null;

-- Bespoke hero-specific pieces (future use).
create index if not exists wardrobe_pieces_hero_idx
  on public.wardrobe_pieces(hero_master_id)
  where hero_master_id is not null and retired_at is null;
