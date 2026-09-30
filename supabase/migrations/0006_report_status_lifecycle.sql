create or replace function public.assert_report_editable(target_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  report_status public.weekly_report_status;
begin
  select status into report_status from public.weekly_reports where id = target_report_id;
  if report_status is null then
    raise exception 'report not found';
  end if;
  if report_status not in ('draft', 'ready') then
    raise exception 'report is not editable in status %', report_status;
  end if;
end;
$$;

create or replace function public.enforce_weekly_report_lifecycle()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'archived' then
    raise exception 'archived reports are immutable';
  end if;
  if new.status <> old.status and not (
    (old.status = 'draft' and new.status = 'ready') or
    (old.status = 'ready' and new.status in ('draft', 'generated')) or
    (old.status = 'generated' and new.status in ('ready', 'presented', 'archived')) or
    (old.status = 'presented' and new.status = 'archived')
  ) then
    raise exception 'invalid report status transition from % to %', old.status, new.status;
  end if;
  if old.status in ('generated', 'presented') and (
    new.start_date, new.end_date, new.presentation_date, new.highlight, new.template_version
  ) is distinct from (
    old.start_date, old.end_date, old.presentation_date, old.highlight, old.template_version
  ) then
    raise exception 'report must return to ready before editing';
  end if;
  return new;
end;
$$;

create trigger weekly_reports_enforce_lifecycle
before update on public.weekly_reports
for each row execute function public.enforce_weekly_report_lifecycle();

create or replace function public.enforce_report_content_editable()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_report_id uuid;
begin
  target_report_id := case tg_table_name
    when 'support_routines' then (case when tg_op = 'DELETE' then old.support_front_id else new.support_front_id end)
    else (case when tg_op = 'DELETE' then old.weekly_report_id else new.weekly_report_id end)
  end;
  if tg_table_name = 'support_routines' then
    select weekly_report_id into target_report_id from public.support_fronts where id = target_report_id;
  end if;
  perform public.assert_report_editable(target_report_id);
  return coalesce(new, old);
end;
$$;

create trigger deliveries_enforce_report_editable before insert or update or delete on public.deliveries for each row execute function public.enforce_report_content_editable();
create trigger incidents_enforce_report_editable before insert or update or delete on public.incidents for each row execute function public.enforce_report_content_editable();
create trigger demands_enforce_report_editable before insert or update or delete on public.demands for each row execute function public.enforce_report_content_editable();
create trigger support_fronts_enforce_report_editable before insert or update or delete on public.support_fronts for each row execute function public.enforce_report_content_editable();
create trigger support_routines_enforce_report_editable before insert or update or delete on public.support_routines for each row execute function public.enforce_report_content_editable();
create trigger dependencies_enforce_report_editable before insert or update or delete on public.dependencies for each row execute function public.enforce_report_content_editable();
create trigger next_steps_enforce_report_editable before insert or update or delete on public.next_steps for each row execute function public.enforce_report_content_editable();
