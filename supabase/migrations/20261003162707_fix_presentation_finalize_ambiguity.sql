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
  select gp.weekly_report_id into target_report_id
  from public.generated_presentations as gp
  where gp.id = target_presentation_id;

  if target_report_id is null or not public.owns_report(target_report_id) then
    raise exception 'presentation not found';
  end if;

  update public.generated_presentations as gp
  set input_snapshot = target_snapshot,
      template_version = target_template_version,
      cached_until = null,
      storage_deleted_at = null
  where gp.id = target_presentation_id;

  update public.generated_presentations as gp
  set cached_until = coalesce(gp.cached_until, now() + interval '30 days'),
      is_final = false
  where gp.weekly_report_id = target_report_id
    and gp.id <> target_presentation_id
    and gp.is_final = false
    and gp.input_snapshot is not null;

  return query
  select gp.id, gp.version, gp.storage_path, gp.file_name, gp.generated_at
  from public.generated_presentations as gp
  where gp.id = target_presentation_id;
end;
$$;

grant execute on function public.finalize_generated_presentation(uuid, jsonb, text) to authenticated;
