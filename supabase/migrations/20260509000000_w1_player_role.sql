-- W1 — Creator wiki access role
-- Adds the `role` column to `players` for the /library wiki gate.
-- Values:
--   'player'  (default; cannot access wiki)
--   'creator' (Ink module authors; read access to /library)
--   'admin'   (Scotch; full access)
alter table players
  add column if not exists role text not null default 'player'
    check (role in ('player', 'creator', 'admin'));

create index if not exists players_role_idx on players (role);
