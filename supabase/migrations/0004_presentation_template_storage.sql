insert into storage.buckets (id, name, public)
values ('presentation-templates', 'presentation-templates', false)
on conflict (id) do update set public = false;

create policy presentation_templates_authenticated_select on storage.objects
for select to authenticated
using (
  bucket_id = 'presentation-templates'
  and name ~ '^status-weekly/v[1-9][0-9]*(\.[0-9]+)*/template\.pptx$'
);
