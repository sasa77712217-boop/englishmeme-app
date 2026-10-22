create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  role text not null default 'user' check (role in ('user', 'admin', 'owner')),
  legacy_user_id bigint unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  legacy_name text unique,
  name text not null unique,
  difficulty_label text not null default 'General',
  description text not null default '',
  sort_order integer not null default 0,
  max_cards integer not null default 35 check (max_cards between 10 and 35),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_cards (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint unique,
  level_id uuid not null references public.levels(id) on delete restrict,
  phrase text not null,
  translation text not null default '',
  explanation text not null default '',
  topic text not null default '',
  image_path text,
  exercise_type text not null default 'multiple_choice',
  correct_answer text not null,
  options text[] not null default '{}',
  is_published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_cards_options_min check (cardinality(options) >= 2)
);

create table if not exists public.level_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  level_id uuid not null references public.levels(id) on delete cascade,
  completed boolean not null default false,
  last_score integer not null default 0 check (last_score >= 0),
  best_score integer not null default 0 check (best_score >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level_id uuid not null references public.levels(id) on delete cascade,
  is_incremental boolean not null default false,
  card_ids uuid[] not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.exercise_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  card_id uuid not null references public.learning_cards(id) on delete cascade,
  answer text not null default '',
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, session_id, card_id)
);

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_activity date,
  updated_at timestamptz not null default now()
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_key text not null,
  reference_id text,
  idempotency_key text not null,
  amount integer not null check (amount <> 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table if not exists public.point_rules (
  key text primary key,
  points integer not null check (points > 0),
  daily_limit integer not null default 0 check (daily_limit >= 0),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  video_url text not null,
  thumbnail_url text,
  category text not null default 'General',
  level_id uuid references public.levels(id) on delete set null,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  item_type text not null default 'banner' check (item_type in ('banner', 'badge', 'frame')),
  price_points integer not null check (price_points > 0),
  asset_url text not null,
  preview_url text,
  rarity text not null default 'common',
  stock integer check (stock is null or stock >= 0),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.store_items(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  first_acquired_at timestamptz not null default now(),
  last_purchased_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.profile_customizations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  equipped_banner_item_id uuid references public.store_items(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated by default as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.point_rules (key, points, daily_limit) values
  ('quiz_correct', 10, 100),
  ('quiz_complete', 25, 50),
  ('tutorial_complete', 5, 25)
on conflict (key) do nothing;

create or replace function private.is_admin()
returns boolean
language sql stable security definer set search_path = public, private
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'owner')
  );
$$;

create or replace function private.is_owner()
returns boolean
language sql stable security definer set search_path = public, private
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email, name = case when profiles.name = '' then excluded.name else profiles.name end;
  insert into public.user_progress (user_id) values (new.id) on conflict do nothing;
  insert into public.profile_customizations (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.award_points(_activity_key text, _reference_id text, _idempotency_key text, _metadata jsonb default '{}'::jsonb)
returns table(points_awarded integer, new_balance integer)
language plpgsql security definer set search_path = public, private
as $$
declare
  uid uuid := auth.uid();
  rule public.point_rules%rowtype;
  current_balance integer;
  already_awarded integer;
  today_total integer;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into rule from public.point_rules where key = _activity_key and is_active = true;
  if not found then return query select 0, coalesce((select points from public.user_progress where user_id = uid), 0); return; end if;
  if exists (select 1 from public.points_ledger where user_id = uid and idempotency_key = _idempotency_key) then
    return query select 0, coalesce((select points from public.user_progress where user_id = uid), 0); return;
  end if;
  if rule.daily_limit > 0 then
    select coalesce(sum(amount), 0) into today_total from public.points_ledger where user_id = uid and activity_key = _activity_key and amount > 0 and created_at >= date_trunc('day', now());
    if today_total >= rule.daily_limit then
      return query select 0, coalesce((select points from public.user_progress where user_id = uid), 0); return;
    end if;
  end if;
  insert into public.user_progress (user_id) values (uid) on conflict do nothing;
  select points into current_balance from public.user_progress where user_id = uid for update;
  already_awarded := least(rule.points, case when rule.daily_limit > 0 then greatest(0, rule.daily_limit - coalesce(today_total, 0)) else rule.points end);
  if already_awarded <= 0 then return query select 0, current_balance; return; end if;
  insert into public.points_ledger (user_id, activity_key, reference_id, idempotency_key, amount, metadata) values (uid, _activity_key, _reference_id, _idempotency_key, already_awarded, coalesce(_metadata, '{}'::jsonb));
  update public.user_progress set points = points + already_awarded, updated_at = now() where user_id = uid returning points into current_balance;
  return query select already_awarded, current_balance;
end;
$$;

create or replace function public.submit_quiz_answer(_session_id uuid, _card_id uuid, _answer text)
returns table(is_correct boolean, points_awarded integer, new_balance integer)
language plpgsql security definer set search_path = public, private
as $$
declare
  uid uuid := auth.uid();
  correct boolean;
  existing public.exercise_results%rowtype;
  awarded integer := 0;
  balance integer := 0;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.quiz_sessions where id = _session_id and user_id = uid) then raise exception 'invalid_quiz_session'; end if;
  select * into existing from public.exercise_results where user_id = uid and session_id = _session_id and card_id = _card_id;
  if found then return query select existing.is_correct, 0, coalesce((select points from public.user_progress where user_id = uid), 0); return; end if;
  select lower(trim(_answer)) = lower(trim(correct_answer)) into correct from public.learning_cards where id = _card_id and is_published = true;
  if correct is null then raise exception 'invalid_card'; end if;
  insert into public.exercise_results (user_id, session_id, card_id, answer, is_correct) values (uid, _session_id, _card_id, left(coalesce(_answer, ''), 500), correct);
  if correct then select p.points_awarded, p.new_balance into awarded, balance from public.award_points('quiz_correct', _card_id::text, 'quiz_correct:' || _session_id::text || ':' || _card_id::text, jsonb_build_object('session_id', _session_id)) p; else select coalesce((select points from public.user_progress where user_id = uid), 0) into balance; end if;
  return query select correct, awarded, balance;
end;
$$;

create or replace function public.purchase_store_item(_item_id uuid, _idempotency_key text)
returns table(success boolean, message text, new_balance integer)
language plpgsql security definer set search_path = public, private
as $$
declare
  uid uuid := auth.uid();
  item public.store_items%rowtype;
  balance integer;
  prior public.points_ledger%rowtype;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into prior from public.points_ledger where user_id = uid and idempotency_key = _idempotency_key and activity_key = 'store_purchase';
  if found then return query select true, 'Compra confirmada', coalesce((select points from public.user_progress where user_id = uid), 0); return; end if;
  select * into item from public.store_items where id = _item_id and is_published = true for update;
  if not found then return query select false, 'Artículo no disponible', coalesce((select points from public.user_progress where user_id = uid), 0); return; end if;
  if item.stock is not null and item.stock <= 0 then return query select false, 'Artículo agotado', coalesce((select points from public.user_progress where user_id = uid), 0); return; end if;
  insert into public.user_progress (user_id) values (uid) on conflict do nothing;
  select points into balance from public.user_progress where user_id = uid for update;
  if balance < item.price_points then return query select false, 'No tienes suficientes puntos', balance; return; end if;
  update public.user_progress set points = points - item.price_points, updated_at = now() where user_id = uid returning points into balance;
  insert into public.points_ledger (user_id, activity_key, reference_id, idempotency_key, amount, metadata) values (uid, 'store_purchase', item.id::text, _idempotency_key, -item.price_points, jsonb_build_object('item_name', item.name));
  insert into public.user_inventory (user_id, item_id) values (uid, item.id) on conflict (user_id, item_id) do update set quantity = user_inventory.quantity + 1, last_purchased_at = now();
  if item.stock is not null then update public.store_items set stock = stock - 1, updated_at = now() where id = item.id; end if;
  return query select true, 'Compra realizada', balance;
end;
$$;

create or replace function public.equip_profile_item(_item_id uuid)
returns boolean
language plpgsql security definer set search_path = public, private
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.user_inventory where user_id = auth.uid() and item_id = _item_id) then return false; end if;
  insert into public.profile_customizations (user_id, equipped_banner_item_id) values (auth.uid(), _item_id) on conflict (user_id) do update set equipped_banner_item_id = excluded.equipped_banner_item_id, updated_at = now();
  return true;
end;
$$;

alter table public.profiles enable row level security;
alter table public.levels enable row level security;
alter table public.learning_cards enable row level security;
alter table public.level_progress enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.exercise_results enable row level security;
alter table public.user_progress enable row level security;
alter table public.points_ledger enable row level security;
alter table public.point_rules enable row level security;
alter table public.tutorials enable row level security;
alter table public.store_items enable row level security;
alter table public.user_inventory enable row level security;
alter table public.profile_customizations enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_self_or_admin on public.profiles for select to authenticated using (id = auth.uid() or private.is_admin());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update to authenticated using (private.is_owner()) with check (private.is_owner());
create policy levels_read_published on public.levels for select to authenticated using (is_active or private.is_admin());
create policy levels_admin_write on public.levels for all to authenticated using (private.is_owner()) with check (private.is_owner());
create policy cards_read_published on public.learning_cards for select to authenticated using (is_published or private.is_admin());
create policy cards_admin_write on public.learning_cards for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy level_progress_self on public.level_progress for select to authenticated using (user_id = auth.uid());
create policy level_progress_admin on public.level_progress for select to authenticated using (private.is_admin());
create policy quiz_sessions_self on public.quiz_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy exercise_results_self on public.exercise_results for select to authenticated using (user_id = auth.uid());
create policy user_progress_self on public.user_progress for select to authenticated using (user_id = auth.uid());
create policy points_ledger_self on public.points_ledger for select to authenticated using (user_id = auth.uid());
create policy rules_owner_read on public.point_rules for select to authenticated using (private.is_owner());
create policy rules_owner_write on public.point_rules for all to authenticated using (private.is_owner()) with check (private.is_owner());
create policy tutorials_published_read on public.tutorials for select to authenticated using (is_published or private.is_admin());
create policy tutorials_admin_write on public.tutorials for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy store_published_read on public.store_items for select to authenticated using (is_published or private.is_admin());
create policy store_admin_write on public.store_items for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy inventory_self on public.user_inventory for select to authenticated using (user_id = auth.uid());
create policy customizations_self on public.profile_customizations for select to authenticated using (user_id = auth.uid());
create policy audit_owner_read on public.audit_logs for select to authenticated using (private.is_owner());

revoke all on function public.award_points(text, text, text, jsonb) from public, anon;
grant execute on function public.award_points(text, text, text, jsonb) to authenticated;
revoke all on function public.submit_quiz_answer(uuid, uuid, text) from public, anon;
grant execute on function public.submit_quiz_answer(uuid, uuid, text) to authenticated;
revoke all on function public.purchase_store_item(uuid, text) from public, anon;
grant execute on function public.purchase_store_item(uuid, text) to authenticated;
revoke all on function public.equip_profile_item(uuid) from public, anon;
grant execute on function public.equip_profile_item(uuid) to authenticated;

create index if not exists learning_cards_level_idx on public.learning_cards(level_id, is_published);
create index if not exists tutorials_listing_idx on public.tutorials(is_published, sort_order);
create index if not exists store_listing_idx on public.store_items(is_published, sort_order);
create index if not exists points_ledger_user_day_idx on public.points_ledger(user_id, activity_key, created_at);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
