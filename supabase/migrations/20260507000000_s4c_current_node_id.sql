-- Sprint S4c — world-map node tracking
-- Persists the hero's current map node across sessions and rebirths.
alter table players
  add column if not exists current_node_id text not null default 'valus';
