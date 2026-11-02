-- Durable storage for the My Dr app snapshot (doctors, bookings, profiles...).
-- Accessed only by the server with the service role key (RLS enabled, no policies).
create table if not exists public.app_state (
  id text primary key,
  rev text not null default '',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;
