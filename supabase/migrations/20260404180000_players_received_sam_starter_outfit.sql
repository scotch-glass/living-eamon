-- Tracks whether Sam has already given the complimentary plain outfit on first purchase.
alter table public.players
  add column if not exists received_sam_starter_outfit boolean not null default false;
