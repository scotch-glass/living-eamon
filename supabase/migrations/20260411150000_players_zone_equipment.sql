-- Per-zone equipment slots for HWRR-style combat system.
alter table public.players
  add column if not exists helmet text default null,
  add column if not exists gorget text default null,
  add column if not exists body_armor text default null,
  add column if not exists limb_armor text default null,
  add column if not exists active_combat jsonb default null;
