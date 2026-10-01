create or replace function public.enforce_report_content_editable()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  source_row jsonb;
  target_report_id uuid;
begin
  if tg_op = 'DELETE' then
    source_row := to_jsonb(old);
  else
    source_row := to_jsonb(new);
  end if;

  if tg_table_name = 'support_routines' then
    select weekly_report_id into target_report_id
    from public.support_fronts
    where id = (source_row ->> 'support_front_id')::uuid;

    -- Parent trigger already checked editability before its cascading delete.
    if target_report_id is null and tg_op = 'DELETE' and pg_trigger_depth() > 1 then
      return old;
    end if;
  else
    target_report_id := (source_row ->> 'weekly_report_id')::uuid;
  end if;

  perform public.assert_report_editable(target_report_id);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
