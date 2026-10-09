create table public.signup_confirmation_resends (
  email_hash text primary key check (length(email_hash) = 64),
  next_allowed_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.signup_confirmation_resends enable row level security;

create or replace function public.claim_signup_confirmation_resend(target_email_hash text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_next_allowed_at timestamptz;
  cooldown_seconds constant integer := 300;
begin
  if target_email_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid email hash';
  end if;

  insert into public.signup_confirmation_resends (email_hash, next_allowed_at)
  values (target_email_hash, now() + make_interval(secs => cooldown_seconds))
  on conflict (email_hash) do nothing;

  if found then
    return query select true, 0;
  end if;

  select next_allowed_at
  into current_next_allowed_at
  from public.signup_confirmation_resends
  where email_hash = target_email_hash
  for update;

  if current_next_allowed_at > now() then
    return query select false, greatest(1, ceil(extract(epoch from current_next_allowed_at - now()))::integer);
  end if;

  update public.signup_confirmation_resends
  set next_allowed_at = now() + make_interval(secs => cooldown_seconds), updated_at = now()
  where email_hash = target_email_hash;

  return query select true, 0;
end;
$$;

revoke all on function public.claim_signup_confirmation_resend(text) from public;
grant execute on function public.claim_signup_confirmation_resend(text) to anon, authenticated;
