create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  legacy public.legacy_accounts%rowtype;
begin
  select * into legacy from public.legacy_accounts
  where lower(email) = lower(coalesce(new.email, ''))
  limit 1;

  insert into public.profiles (id, name, email, role, legacy_user_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', coalesce(legacy.name, '')),
    coalesce(new.email, ''),
    coalesce(legacy.role, 'user'),
    legacy.legacy_id
  )
  on conflict (id) do update set
    email = excluded.email,
    name = case when profiles.name = '' then excluded.name else profiles.name end,
    role = case when profiles.role = 'owner' then profiles.role else excluded.role end,
    legacy_user_id = coalesce(profiles.legacy_user_id, excluded.legacy_user_id);

  insert into public.user_progress (user_id, points, current_streak, last_activity)
  values (new.id, coalesce(legacy.points, 0), coalesce(legacy.current_streak, 0), legacy.last_activity)
  on conflict (user_id) do update set
    points = greatest(user_progress.points, excluded.points),
    current_streak = greatest(user_progress.current_streak, excluded.current_streak),
    last_activity = coalesce(user_progress.last_activity, excluded.last_activity),
    updated_at = now();

  insert into public.profile_customizations (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
