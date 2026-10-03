alter table public.generated_presentations
  add column input_snapshot jsonb,
  add column template_version text not null default 'v1',
  add column cached_until timestamptz,
  add column storage_deleted_at timestamptz,
  add column is_final boolean not null default false;

create or replace function public.finalize_generated_presentation(
  target_presentation_id uuid,
  target_snapshot jsonb,
  target_template_version text
)
returns table (id uuid, version integer, storage_path text, file_name text, generated_at timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_report_id uuid;
begin
  select weekly_report_id into target_report_id
  from public.generated_presentations
  where generated_presentations.id = target_presentation_id;

  if target_report_id is null or not public.owns_report(target_report_id) then
    raise exception 'presentation not found';
  end if;

  update public.generated_presentations
  set input_snapshot = target_snapshot,
      template_version = target_template_version,
      cached_until = null,
      storage_deleted_at = null
  where generated_presentations.id = target_presentation_id;

  update public.generated_presentations
  set cached_until = coalesce(cached_until, now() + interval '30 days'),
      is_final = false
  where weekly_report_id = target_report_id
    and id <> target_presentation_id
    and is_final = false;

  return query
  select generated_presentations.id, generated_presentations.version,
    generated_presentations.storage_path, generated_presentations.file_name,
    generated_presentations.generated_at
  from public.generated_presentations
  where generated_presentations.id = target_presentation_id;
end;
$$;

create or replace function public.mark_latest_presentation_final(target_report_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.owns_report(target_report_id) then
    raise exception 'report not found';
  end if;

  update public.generated_presentations
  set is_final = true, cached_until = null
  where id = (
    select id from public.generated_presentations
    where weekly_report_id = target_report_id
    order by version desc
    limit 1
  );
end;
$$;

grant execute on function public.finalize_generated_presentation(uuid, jsonb, text) to authenticated;
grant execute on function public.mark_latest_presentation_final(uuid) to authenticated;
