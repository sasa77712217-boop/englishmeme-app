create or replace function private.log_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'DELETE' then
      insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, details)
      values (auth.uid(), tg_op, tg_table_name, old.id::text, jsonb_build_object('source', 'admin_trigger'));
      return old;
    else
      insert into public.audit_logs(actor_user_id, action, entity_type, entity_id, details)
      values (auth.uid(), tg_op, tg_table_name, new.id::text, jsonb_build_object('source', 'admin_trigger'));
      return new;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_levels_changes on public.levels;
create trigger audit_levels_changes after insert or update or delete on public.levels for each row execute procedure private.log_admin_change();
drop trigger if exists audit_cards_changes on public.learning_cards;
create trigger audit_cards_changes after insert or update or delete on public.learning_cards for each row execute procedure private.log_admin_change();
drop trigger if exists audit_tutorials_changes on public.tutorials;
create trigger audit_tutorials_changes after insert or update or delete on public.tutorials for each row execute procedure private.log_admin_change();
drop trigger if exists audit_store_items_changes on public.store_items;
create trigger audit_store_items_changes after insert or update or delete on public.store_items for each row execute procedure private.log_admin_change();
