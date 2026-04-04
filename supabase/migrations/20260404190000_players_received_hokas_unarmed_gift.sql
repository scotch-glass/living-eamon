-- One-time Hokas pity bundle for unarmed players in the Main Hall.
alter table public.players
  add column if not exists received_hokas_unarmed_gift boolean not null default false;
