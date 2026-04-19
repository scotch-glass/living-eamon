-- Expanded equipment slots for Pass F: boots, rings, cuffs, necklace
alter table public.players
  add column if not exists boots text default null,
  add column if not exists ring_left text default null,
  add column if not exists ring_right text default null,
  add column if not exists cuff_left text default null,
  add column if not exists cuff_right text default null,
  add column if not exists necklace text default null;
