-- Presentation themes: colour/typography variations of the approved template.
-- A report remembers its last chosen theme; every generated presentation records the
-- theme it was built with so cache rebuilds never change a historical file.

alter table public.weekly_reports
  add column template_theme text not null default 'base'
    constraint weekly_reports_template_theme_format check (template_theme ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.generated_presentations
  add column template_theme text not null default 'base'
    constraint generated_presentations_template_theme_format check (template_theme ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

drop function if exists public.finalize_generated_presentation(uuid, jsonb, text);

create or replace function public.finalize_generated_presentation(
  target_presentation_id uuid,
  target_snapshot jsonb,
  target_template_version text,
  target_template_theme text default 'base'
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
      template_theme = target_template_theme,
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

grant execute on function public.finalize_generated_presentation(uuid, jsonb, text, text) to authenticated;

-- Storage: themes live next to the base template at
-- status-weekly/<version>/themes/<theme>.pptx.
drop policy if exists presentation_templates_authenticated_select on storage.objects;
create policy presentation_templates_authenticated_select on storage.objects
for select to authenticated
using (
  bucket_id = 'presentation-templates'
  and name ~ '^status-weekly/v[1-9][0-9]*(\.[0-9]+)*/(template|themes/[a-z0-9]+(-[a-z0-9]+)*)\.pptx$'
);

drop policy if exists presentation_templates_admin_insert on storage.objects;
create policy presentation_templates_admin_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'presentation-templates'
  and name ~ '^status-weekly/v[1-9][0-9]*(\.[0-9]+)*/(template|themes/[a-z0-9]+(-[a-z0-9]+)*)\.pptx$'
  and public.is_template_admin()
);
