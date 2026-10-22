-- EnglishMeme: rutas privadas y desbloqueo progresivo validado en servidor.

create or replace function private.level_is_unlocked(_uid uuid, _level_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.levels current_level
    where current_level.id = _level_id
      and current_level.is_active
      and not exists (
        select 1
        from public.levels previous_level
        left join public.level_progress progress
          on progress.user_id = _uid
         and progress.level_id = previous_level.id
        where previous_level.is_active
          and previous_level.sort_order < current_level.sort_order
          and coalesce(progress.completed, false) = false
      )
  );
$$;

create or replace function public.start_quiz_session(_level_id uuid)
returns table(session_id uuid, card_ids uuid[])
language plpgsql
security definer
set search_path = public, private
as $$
declare
  uid uuid := auth.uid();
  selected_cards uuid[];
  new_session uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not private.level_is_unlocked(uid, _level_id) then raise exception 'level_locked'; end if;

  select coalesce(array_agg(cards.id order by cards.legacy_id), '{}'::uuid[])
    into selected_cards
    from public.learning_cards cards
   where cards.level_id = _level_id
     and cards.is_published;

  if cardinality(selected_cards) = 0 then raise exception 'level_empty'; end if;

  insert into public.quiz_sessions (user_id, level_id, card_ids)
  values (uid, _level_id, selected_cards)
  returning id into new_session;

  return query select new_session, selected_cards;
end;
$$;

grant execute on function public.start_quiz_session(uuid) to authenticated;

create or replace function public.finish_quiz_session(_session_id uuid)
returns table(completed boolean, score integer, total integer, next_level_unlocked boolean)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  uid uuid := auth.uid();
  session_row public.quiz_sessions%rowtype;
  total_answers integer;
  correct_answers integer;
  passed boolean;
  next_id uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into session_row from public.quiz_sessions where id = _session_id and user_id = uid;
  if not found then raise exception 'invalid_quiz_session'; end if;

  select count(*), count(*) filter (where is_correct)
    into total_answers, correct_answers
    from public.exercise_results
   where session_id = _session_id and user_id = uid;

  passed := total_answers > 0 and (correct_answers * 100 >= total_answers * 70);

  insert into public.level_progress (user_id, level_id, completed, last_score, best_score, attempts, completed_at)
  values (uid, session_row.level_id, passed, case when total_answers = 0 then 0 else (correct_answers * 100 / total_answers) end,
          case when total_answers = 0 then 0 else (correct_answers * 100 / total_answers) end, 1,
          case when passed then now() else null end)
  on conflict (user_id, level_id) do update set
    completed = public.level_progress.completed or excluded.completed,
    last_score = excluded.last_score,
    best_score = greatest(public.level_progress.best_score, excluded.best_score),
    attempts = public.level_progress.attempts + 1,
    completed_at = case when public.level_progress.completed or excluded.completed then coalesce(public.level_progress.completed_at, now()) else null end,
    updated_at = now();

  update public.quiz_sessions set finished_at = coalesce(finished_at, now()) where id = _session_id;

  select next_level.id into next_id
    from public.levels current_level
    join public.levels next_level on next_level.sort_order = current_level.sort_order + 1 and next_level.is_active
   where current_level.id = session_row.level_id;

  return query select passed, correct_answers, total_answers,
    case when next_id is null then false else private.level_is_unlocked(uid, next_id) end;
end;
$$;

grant execute on function public.finish_quiz_session(uuid) to authenticated;
