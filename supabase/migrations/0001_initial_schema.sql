create extension if not exists pgcrypto;

create type public.weekly_report_status as enum (
  'draft', 'ready', 'generated', 'presented', 'archived'
);

create type public.delivery_status as enum (
  'delivered', 'in_progress', 'waiting_third_party', 'blocked'
);

create type public.incident_status as enum (
  'resolved', 'in_progress', 'waiting_third_party', 'blocked'
);

create type public.demand_phase as enum (
  'request_received', 'feasibility_requirements', 'development', 'validation'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  area text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  presentation_date date,
  highlight text,
  status public.weekly_report_status not null default 'draft',
  template_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_reports_date_order check (end_date >= start_date)
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  weekly_report_id uuid not null references public.weekly_reports(id) on delete cascade,
  title text not null,
  description text not null,
  status public.delivery_status not null,
  icon_key text not null,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  weekly_report_id uuid not null references public.weekly_reports(id) on delete cascade,
  affected_system text not null,
  symptom text not null,
  cause text,
  action_taken text not null,
  support_people text,
  status public.incident_status not null,
  resolved_at date,
  icon_key text not null,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resolved_incident_requires_date check (status <> 'resolved' or resolved_at is not null)
);

create table public.demands (
  id uuid primary key default gen_random_uuid(),
  weekly_report_id uuid not null references public.weekly_reports(id) on delete cascade,
  title text not null,
  requester_name text not null,
  requester_area text not null,
  involved_areas text[] not null default '{}',
  objective text not null,
  status_text text,
  current_phase public.demand_phase not null,
  icon_key text not null default 'demand',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_fronts (
  id uuid primary key default gen_random_uuid(),
  weekly_report_id uuid not null references public.weekly_reports(id) on delete cascade,
  title text not null,
  activity_type text not null,
  icon_key text not null,
  position integer not null default 0 check (position >= 0)
);

create table public.support_routines (
  id uuid primary key default gen_random_uuid(),
  support_front_id uuid not null references public.support_fronts(id) on delete cascade,
  title text not null,
  position integer not null default 0 check (position >= 0)
);

create table public.dependencies (
  id uuid primary key default gen_random_uuid(),
  weekly_report_id uuid not null references public.weekly_reports(id) on delete cascade,
  title text not null,
  description text not null,
  owner text not null,
  waiting_since date not null,
  status text,
  position integer not null default 0 check (position >= 0)
);

create table public.next_steps (
  id uuid primary key default gen_random_uuid(),
  weekly_report_id uuid not null references public.weekly_reports(id) on delete cascade,
  title text not null,
  description text,
  owner text,
  due_date date,
  position integer not null default 0 check (position >= 0)
);

create table public.generated_presentations (
  id uuid primary key default gen_random_uuid(),
  weekly_report_id uuid not null references public.weekly_reports(id) on delete cascade,
  version integer not null check (version > 0),
  storage_path text not null,
  file_name text not null,
  generated_at timestamptz not null default now(),
  generated_by uuid not null references auth.users(id)
);

create index weekly_reports_user_id_idx on public.weekly_reports(user_id);
create index deliveries_report_position_idx on public.deliveries(weekly_report_id, position);
create index incidents_report_position_idx on public.incidents(weekly_report_id, position);
create index demands_report_position_idx on public.demands(weekly_report_id, position);
create index support_fronts_report_position_idx on public.support_fronts(weekly_report_id, position);
create index support_routines_front_position_idx on public.support_routines(support_front_id, position);
create index dependencies_report_position_idx on public.dependencies(weekly_report_id, position);
create index next_steps_report_position_idx on public.next_steps(weekly_report_id, position);
create index generated_presentations_report_version_idx on public.generated_presentations(weekly_report_id, version);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger weekly_reports_set_updated_at
before update on public.weekly_reports
for each row execute function public.set_updated_at();

create trigger deliveries_set_updated_at
before update on public.deliveries
for each row execute function public.set_updated_at();

create trigger incidents_set_updated_at
before update on public.incidents
for each row execute function public.set_updated_at();

create trigger demands_set_updated_at
before update on public.demands
for each row execute function public.set_updated_at();

create or replace function public.owns_report(target_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.weekly_reports
    where id = target_report_id and user_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_report(uuid) from public;
grant execute on function public.owns_report(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.deliveries enable row level security;
alter table public.incidents enable row level security;
alter table public.demands enable row level security;
alter table public.support_fronts enable row level security;
alter table public.support_routines enable row level security;
alter table public.dependencies enable row level security;
alter table public.next_steps enable row level security;
alter table public.generated_presentations enable row level security;

create policy profiles_owner_select on public.profiles
for select using ((select auth.uid()) = id);
create policy profiles_owner_insert on public.profiles
for insert with check ((select auth.uid()) = id);
create policy profiles_owner_update on public.profiles
for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_owner_delete on public.profiles
for delete using ((select auth.uid()) = id);

create policy weekly_reports_owner_all on public.weekly_reports
for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy deliveries_owner_all on public.deliveries
for all using (public.owns_report(weekly_report_id))
with check (public.owns_report(weekly_report_id));

create policy incidents_owner_all on public.incidents
for all using (public.owns_report(weekly_report_id))
with check (public.owns_report(weekly_report_id));

create policy demands_owner_all on public.demands
for all using (public.owns_report(weekly_report_id))
with check (public.owns_report(weekly_report_id));

create policy support_fronts_owner_all on public.support_fronts
for all using (public.owns_report(weekly_report_id))
with check (public.owns_report(weekly_report_id));

create policy support_routines_owner_all on public.support_routines
for all using (
  exists (
    select 1 from public.support_fronts
    where id = support_front_id and public.owns_report(weekly_report_id)
  )
)
with check (
  exists (
    select 1 from public.support_fronts
    where id = support_front_id and public.owns_report(weekly_report_id)
  )
);

create policy dependencies_owner_all on public.dependencies
for all using (public.owns_report(weekly_report_id))
with check (public.owns_report(weekly_report_id));

create policy next_steps_owner_all on public.next_steps
for all using (public.owns_report(weekly_report_id))
with check (public.owns_report(weekly_report_id));

create policy generated_presentations_owner_all on public.generated_presentations
for all using (
  public.owns_report(weekly_report_id)
  and generated_by = (select auth.uid())
)
with check (
  public.owns_report(weekly_report_id)
  and generated_by = (select auth.uid())
);
