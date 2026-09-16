-- Flashcards SRS schema.
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run on an existing project: it only adds new tables (prefixed nothing special,
-- but names are specific enough to not collide with anything else you already have).

create extension if not exists "pgcrypto";

-- Folders/decks. A deck can live inside a folder (parent_folder_id) to mirror
-- "Ma liste personnelle", "Vocabulaire des leçons", theme folders, etc.
create table if not exists decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_folder_id uuid references decks(id) on delete cascade,
  name text not null,
  icon text,
  lang_from text not null default 'ko',
  lang_to text not null default 'fr',
  created_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references decks(id) on delete cascade,
  card_type text not null default 'word' check (card_type in ('word', 'phrase')),
  term text not null,
  reading text,
  translation text not null,
  example_sentence text,
  notes text,
  created_at timestamptz not null default now()
);

-- One row per card holding its current FSRS scheduling state.
create table if not exists review_state (
  card_id uuid primary key references cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  due timestamptz not null default now(),
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  state smallint not null default 0,
  last_review timestamptz
);

-- Append-only history of every review, used for stats and for later
-- re-optimizing personal FSRS weights (fsrs-rs / py-fsrs optimizer).
create table if not exists review_logs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 4),
  state smallint not null,
  due timestamptz not null,
  stability double precision not null,
  difficulty double precision not null,
  elapsed_days integer not null,
  last_elapsed_days integer not null,
  scheduled_days integer not null,
  review timestamptz not null default now()
);

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  request_retention double precision not null default 0.9,
  daily_new_limit integer not null default 20,
  daily_review_limit integer not null default 200,
  enable_fuzz boolean not null default true
);

create index if not exists decks_user_idx on decks(user_id);
create index if not exists decks_parent_idx on decks(parent_folder_id);
create index if not exists cards_deck_idx on cards(deck_id);
create index if not exists cards_user_idx on cards(user_id);
create index if not exists review_state_user_due_idx on review_state(user_id, due);
create index if not exists review_logs_card_idx on review_logs(card_id);

alter table decks enable row level security;
alter table cards enable row level security;
alter table review_state enable row level security;
alter table review_logs enable row level security;
alter table user_settings enable row level security;

create policy "own decks" on decks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own cards" on cards for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own review_state" on review_state for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own review_logs" on review_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own user_settings" on user_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
