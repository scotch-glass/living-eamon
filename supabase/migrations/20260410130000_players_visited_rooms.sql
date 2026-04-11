-- Track which rooms each player has visited so the situation block
-- can hide destination names for unvisited rooms (fog of war).
alter table public.players
  add column if not exists visited_rooms text[] not null default '{}'::text[];
