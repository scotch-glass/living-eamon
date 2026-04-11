-- Store the player's barmaid choice from Aldric's drink offer.
alter table public.players
  add column if not exists barmaid_preference text default null;
