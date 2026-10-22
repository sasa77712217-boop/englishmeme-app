create table if not exists public.legacy_accounts (
  legacy_id bigint primary key,
  name text not null,
  email text not null unique,
  role text not null default 'user' check (role in ('user','admin','owner')),
  is_verified boolean not null default true,
  points integer not null default 0,
  current_streak integer not null default 0,
  last_activity date,
  created_at timestamptz
);

create table if not exists public.legacy_level_progress (
  legacy_user_id bigint not null references public.legacy_accounts(legacy_id) on delete cascade,
  level_name text not null,
  completed boolean not null default false,
  last_score integer not null default 0,
  best_score integer not null default 0,
  attempts integer not null default 0,
  completed_at timestamptz,
  primary key (legacy_user_id, level_name)
);

create table if not exists public.legacy_exercise_results (
  legacy_id bigint primary key,
  legacy_user_id bigint not null references public.legacy_accounts(legacy_id) on delete cascade,
  legacy_card_id bigint not null,
  answer text not null default '',
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.legacy_accounts enable row level security;
alter table public.legacy_level_progress enable row level security;
alter table public.legacy_exercise_results enable row level security;

create policy legacy_accounts_owner_read on public.legacy_accounts for select to authenticated using (private.is_owner());
create policy legacy_level_progress_owner_read on public.legacy_level_progress for select to authenticated using (private.is_owner());
create policy legacy_exercise_results_owner_read on public.legacy_exercise_results for select to authenticated using (private.is_owner());
