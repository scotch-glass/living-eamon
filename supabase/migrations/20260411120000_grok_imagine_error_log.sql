create table if not exists grok_imagine_error_log (
  id uuid primary key default uuid_generate_v4(),
  room_id text,
  tone text,
  room_state text,
  attempt_number integer,
  error_type text,
  raw_error text,
  prompt_used text,
  created_at timestamptz default now()
);

alter table grok_imagine_error_log enable row level security;

create policy "Service role only"
  on grok_imagine_error_log for all
  using (false);
