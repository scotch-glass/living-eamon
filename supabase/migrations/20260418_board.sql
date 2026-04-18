-- Community bulletin board tables

create table board_categories (
  id bigserial primary key,
  name text not null,
  slug text unique not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table board_threads (
  id bigserial primary key,
  category_id bigint not null references board_categories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hero_name text not null,
  title text not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_pinned boolean default false,
  is_locked boolean default false
);

create table board_posts (
  id bigserial primary key,
  thread_id bigint not null references board_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hero_name text not null,
  body text not null,
  created_at timestamptz default now()
);

-- Row Level Security

alter table board_categories enable row level security;
alter table board_threads enable row level security;
alter table board_posts enable row level security;

-- board_categories: public read, only admins can write (for now, allow any authenticated user)
create policy "Public can read categories" on board_categories for select using (true);
create policy "Authenticated users can create categories" on board_categories for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update own categories" on board_categories for update using (auth.role() = 'authenticated');

-- board_threads: public read, authenticated users can write
create policy "Public can read threads" on board_threads for select using (true);
create policy "Authenticated users can create threads" on board_threads for insert with check (auth.role() = 'authenticated' and user_id = auth.uid());
create policy "Users can update own threads" on board_threads for update using (auth.role() = 'authenticated' and user_id = auth.uid());
create policy "Users can delete own threads" on board_threads for delete using (auth.role() = 'authenticated' and user_id = auth.uid());

-- board_posts: public read, authenticated users can write
create policy "Public can read posts" on board_posts for select using (true);
create policy "Authenticated users can create posts" on board_posts for insert with check (auth.role() = 'authenticated' and user_id = auth.uid());
create policy "Users can delete own posts" on board_posts for delete using (auth.role() = 'authenticated' and user_id = auth.uid());

-- Seed default categories
insert into board_categories (name, slug, description, sort_order) values
  ('Adventurers'' Hall', 'hall', 'General discussion. Heroes, battles, secrets, and tales of the realm.', 1),
  ('The Bug Catcher''s Trap', 'bugs', 'Report errors, broken mechanics, glitches, and unexpected behavior.', 2),
  ('Petitions to Jane', 'petitions', 'Feature ideas and requests. Tell Jane what you wish existed.', 3),
  ('Lore & Theory', 'lore', 'Speculation about the world, Jane''s nature, the Order, and hidden truths.', 4);

-- Indexes for performance
create index idx_board_threads_category on board_threads(category_id);
create index idx_board_threads_user on board_threads(user_id);
create index idx_board_threads_created on board_threads(created_at desc);
create index idx_board_posts_thread on board_posts(thread_id);
create index idx_board_posts_user on board_posts(user_id);
create index idx_board_posts_created on board_posts(created_at desc);
