create table public.template_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table public.template_admins enable row level security;

-- Users may only verify their own allowlist membership; grants stay database-admin only.
create policy template_admins_self_select on public.template_admins
for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.is_template_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.template_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_template_admin() from public;
grant execute on function public.is_template_admin() to authenticated;

create policy presentation_templates_admin_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'presentation-templates'
  and name ~ '^status-weekly/v[1-9][0-9]*(\.[0-9]+)*/template\.pptx$'
  and public.is_template_admin()
);
