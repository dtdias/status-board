alter table public.generated_presentations
  add constraint generated_presentations_report_version_key unique (weekly_report_id, version);

drop policy generated_presentations_owner_all on public.generated_presentations;
create policy generated_presentations_owner_all on public.generated_presentations
for all using (public.owns_report(weekly_report_id))
with check (public.owns_report(weekly_report_id) and generated_by = (select auth.uid()));

create or replace function public.reserve_generated_presentation(target_report_id uuid, target_file_name text)
returns table (id uuid, version integer, storage_path text, file_name text, generated_at timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_version integer;
  new_id uuid;
  new_path text;
  created_at timestamptz;
begin
  if not public.owns_report(target_report_id) then
    raise exception 'report not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target_report_id::text, 0));
  select coalesce(max(generated_presentations.version), 0) + 1 into next_version
  from public.generated_presentations
  where weekly_report_id = target_report_id;

  new_path := auth.uid()::text || '/' || target_report_id::text || '/v' || next_version::text || '.pptx';
  insert into public.generated_presentations (weekly_report_id, version, storage_path, file_name, generated_by)
  values (target_report_id, next_version, new_path, target_file_name, auth.uid())
  returning generated_presentations.id, generated_presentations.generated_at into new_id, created_at;

  return query select new_id, next_version, new_path, target_file_name, created_at;
end;
$$;

grant execute on function public.reserve_generated_presentation(uuid, text) to authenticated;

insert into storage.buckets (id, name, public)
values ('generated-presentations', 'generated-presentations', false)
on conflict (id) do update set public = false;

create policy generated_presentations_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'generated-presentations'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and public.owns_report(((storage.foldername(name))[2])::uuid)
);

create policy generated_presentations_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'generated-presentations'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and public.owns_report(((storage.foldername(name))[2])::uuid)
);

create policy generated_presentations_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'generated-presentations'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and public.owns_report(((storage.foldername(name))[2])::uuid)
);
