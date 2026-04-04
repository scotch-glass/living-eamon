-- Per-weapon and misc. skill tracks; total capped at 700 in game logic.
alter table public.players
  add column if not exists weapon_skills jsonb not null default '{}'::jsonb;
