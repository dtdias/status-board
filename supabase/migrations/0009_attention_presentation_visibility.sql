alter table public.dependencies
  add column hide_owner_in_presentation boolean not null default false,
  add column hide_waiting_since_in_presentation boolean not null default false;

alter table public.next_steps
  add column hide_owner_in_presentation boolean not null default false,
  add column hide_due_date_in_presentation boolean not null default false;
