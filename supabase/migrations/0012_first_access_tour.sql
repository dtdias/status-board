alter table public.profiles
  add column onboarding_tour_seen_version integer not null default 0,
  add column onboarding_tour_completed_at timestamptz;

-- Existing users already know product; only new profiles enter tour v1.
update public.profiles
set onboarding_tour_seen_version = 1
where onboarding_tour_seen_version = 0;
