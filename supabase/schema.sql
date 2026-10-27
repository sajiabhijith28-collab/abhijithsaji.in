create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin
  create type public.user_role as enum ('patient', 'doctor', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  phone text not null default '',
  role public.user_role not null default 'patient',
  is_approved boolean not null default true,
  is_blocked boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.doctor_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  specialization text not null,
  experience_years integer not null check (experience_years between 0 and 80),
  qualification text not null,
  clinic_name text not null,
  consultation_fee numeric(10, 2) not null check (consultation_fee >= 0),
  bio text not null default '',
  photo_url text,
  rating numeric(2, 1) not null default 0,
  review_count integer not null default 0
);

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  duration_minutes integer not null check (duration_minutes in (15, 30, 45)),
  is_booked boolean not null default false,
  constraint slot_time_order check (start_time < end_time),
  constraint unique_doctor_slot unique (doctor_id, date, start_time)
);

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'slots_no_time_overlap'
  ) then
    alter table public.slots
      add constraint slots_no_time_overlap
      exclude using gist (
        doctor_id with =,
        tsrange(date + start_time, date + end_time, '[)') with &&
      );
  end if;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  slot_id uuid not null references public.slots(id) on delete restrict,
  date date not null,
  start_time time not null,
  end_time time not null,
  status public.appointment_status not null default 'pending',
  notes text not null default '',
  platform_fee numeric(10, 2) not null default 0,
  consultation_fee numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);
alter table public.appointments
  add column if not exists platform_fee numeric(10, 2) not null default 0,
  add column if not exists consultation_fee numeric(10, 2) not null default 0;

create unique index if not exists one_active_appointment_per_slot
  on public.appointments(slot_id)
  where status <> 'cancelled';

create table if not exists public.app_settings (
  id integer primary key check (id = 1),
  platform_fee numeric(10, 2) not null default 0 check (platform_fee >= 0)
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-avatars',
  'doctor-avatars',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and is_blocked = false
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_blocked = false
  );
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  assigned_role public.user_role;
  doctor_info jsonb;
begin
  if new.raw_user_meta_data ->> 'role' = 'doctor' then
    assigned_role := 'doctor';
  else
    assigned_role := 'patient';
  end if;

  insert into public.profiles (id, name, email, phone, role, is_approved)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'New User'),
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    assigned_role,
    assigned_role = 'patient'
  );

  if assigned_role = 'doctor' then
    doctor_info := coalesce(new.raw_user_meta_data -> 'doctor_info', '{}'::jsonb);
    insert into public.doctor_details (
      user_id, specialization, experience_years, qualification,
      clinic_name, consultation_fee, bio
    ) values (
      new.id,
      coalesce(nullif(trim(doctor_info ->> 'specialization'), ''), 'General Medicine'),
      case
        when coalesce(doctor_info ->> 'experience_years', '') ~ '^[0-9]{1,2}$'
          then least(80, (doctor_info ->> 'experience_years')::integer)
        else 0
      end,
      coalesce(nullif(trim(doctor_info ->> 'qualification'), ''), 'Unverified'),
      coalesce(nullif(trim(doctor_info ->> 'clinic_name'), ''), 'Hospital'),
      case
        when coalesce(doctor_info ->> 'consultation_fee', '') ~ '^[0-9]{1,8}(\.[0-9]{1,2})?$'
          then (doctor_info ->> 'consultation_fee')::numeric
        else 0
      end,
      coalesce(doctor_info ->> 'bio', '')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create or replace function public.book_appointment(
  requested_slot_id uuid,
  requested_doctor_id uuid,
  appointment_notes text default ''
)
returns public.appointments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_slot public.slots;
  new_appointment public.appointments;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'patient' and not is_blocked
  ) then
    raise exception 'Only active patient accounts can book appointments.';
  end if;

  select * into selected_slot
  from public.slots
  where id = requested_slot_id
    and doctor_id = requested_doctor_id
    and not is_booked
  for update;

  if not found then
    raise exception 'This time slot is no longer available.';
  end if;
  if selected_slot.date < current_date then
    raise exception 'Appointments cannot be booked for a past date.';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = requested_doctor_id and role = 'doctor'
      and is_approved and not is_blocked
  ) then
    raise exception 'This doctor is not currently accepting appointments.';
  end if;

  update public.slots set is_booked = true where id = selected_slot.id;
  insert into public.appointments (
    patient_id, doctor_id, slot_id, date, start_time, end_time, notes,
    platform_fee, consultation_fee
  ) values (
    auth.uid(), requested_doctor_id, selected_slot.id, selected_slot.date,
    selected_slot.start_time, selected_slot.end_time, coalesce(appointment_notes, ''),
    (select platform_fee from public.app_settings where id = 1),
    (select consultation_fee from public.doctor_details where user_id = requested_doctor_id)
  ) returning * into new_appointment;

  return new_appointment;
end;
$$;

create or replace function public.update_appointment_status(
  requested_appointment_id uuid,
  requested_status public.appointment_status
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  existing_appointment public.appointments;
begin
  if not public.is_active_user() then
    raise exception 'An active account is required.';
  end if;

  select * into existing_appointment
  from public.appointments
  where id = requested_appointment_id
  for update;
  if not found then raise exception 'Appointment not found.'; end if;

  if public.is_admin() then
    null;
  elsif auth.uid() = existing_appointment.patient_id then
    if requested_status <> 'cancelled' then
      raise exception 'Patients may only cancel their own appointments.';
    end if;
  elsif auth.uid() = existing_appointment.doctor_id then
    if requested_status not in ('confirmed', 'completed', 'cancelled') then
      raise exception 'Invalid appointment status transition.';
    end if;
  else
    raise exception 'Not authorized to update this appointment.';
  end if;

  if requested_status = 'confirmed' and existing_appointment.status <> 'pending' then
    raise exception 'Only pending appointments can be confirmed.';
  end if;
  if requested_status = 'completed' and existing_appointment.status <> 'confirmed' then
    raise exception 'Only confirmed appointments can be completed.';
  end if;
  if requested_status = 'cancelled' and existing_appointment.status not in ('pending', 'confirmed') then
    raise exception 'Only pending or confirmed appointments can be cancelled.';
  end if;

  update public.appointments
  set status = requested_status
  where id = requested_appointment_id;

  if requested_status = 'cancelled' then
    update public.slots set is_booked = false where id = existing_appointment.slot_id;
  end if;
end;
$$;

create or replace function public.admin_set_doctor_approval(
  requested_doctor_id uuid,
  approved boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;
  update public.profiles
  set is_approved = approved
  where id = requested_doctor_id and role = 'doctor';
  if not found then raise exception 'Doctor account not found.'; end if;
end;
$$;

create or replace function public.admin_set_user_blocked(
  requested_user_id uuid,
  blocked boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;
  if requested_user_id = auth.uid() then raise exception 'You cannot block your own administrator account.'; end if;
  update public.profiles set is_blocked = blocked where id = requested_user_id;
  if not found then raise exception 'User account not found.'; end if;
end;
$$;

create or replace function public.admin_set_platform_fee(new_fee numeric)
returns numeric
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required.'; end if;
  if new_fee < 0 then raise exception 'Platform fee must be non-negative.'; end if;
  update public.app_settings set platform_fee = new_fee where id = 1;
  return new_fee;
end;
$$;

alter table public.profiles enable row level security;
alter table public.doctor_details enable row level security;
alter table public.slots enable row level security;
alter table public.appointments enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Anyone can view doctor avatars" on storage.objects;
drop policy if exists "Doctors upload their own avatar" on storage.objects;
drop policy if exists "Doctors update their own avatar" on storage.objects;
drop policy if exists "Doctors delete their own avatar" on storage.objects;
create policy "Anyone can view doctor avatars"
  on storage.objects for select to public
  using (bucket_id = 'doctor-avatars');
create policy "Doctors upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'doctor-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'doctor' and not p.is_blocked
    )
  );
create policy "Doctors update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'doctor-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_active_user()
  )
  with check (
    bucket_id = 'doctor-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_active_user()
  );
create policy "Doctors delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'doctor-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_active_user()
  );

drop policy if exists "Admins full access profiles" on public.profiles;
drop policy if exists "Read profiles policy" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
drop policy if exists "Profiles visible to account owner, verified doctors, or appointment participants" on public.profiles;
drop policy if exists "Profiles visible to account owner and appointment participants" on public.profiles;
create policy "Profiles visible to account owner and appointment participants"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1 from public.appointments a
      where a.patient_id = profiles.id and a.doctor_id = (select auth.uid())
    )
  );
create policy "Users update safe profile fields"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and public.is_active_user())
  with check (id = (select auth.uid()) and public.is_active_user());

drop policy if exists "Anyone can view approved doctor details" on public.doctor_details;
drop policy if exists "Doctors update own details" on public.doctor_details;
create policy "Visible doctor details"
  on public.doctor_details for select to authenticated
  using (
    public.is_active_user()
    and (
      public.is_admin()
      or user_id = (select auth.uid())
      or exists (
        select 1 from public.profiles p
        where p.id = doctor_details.user_id and p.is_approved and not p.is_blocked
      )
      or exists (
        select 1 from public.appointments a
        where a.doctor_id = doctor_details.user_id
          and (a.patient_id = (select auth.uid()) or a.doctor_id = (select auth.uid()))
      )
    )
  );
create policy "Doctors update their own details"
  on public.doctor_details for update to authenticated
  using (user_id = (select auth.uid()) and public.is_active_user())
  with check (user_id = (select auth.uid()) and public.is_active_user());

drop policy if exists "Patients view available slots" on public.slots;
drop policy if exists "Doctors manage own slots" on public.slots;
create policy "Active users view available slots"
  on public.slots for select to authenticated
  using (
    public.is_active_user()
    and (
      (not is_booked and exists (
        select 1 from public.profiles p
        where p.id = slots.doctor_id and p.is_approved and not p.is_blocked
      ))
      or doctor_id = (select auth.uid())
      or public.is_admin()
    )
  );
create policy "Doctors manage own slots"
  on public.slots for all to authenticated
  using (
    doctor_id = (select auth.uid())
    and public.is_active_user()
    and exists (
      select 1 from public.profiles p where p.id = (select auth.uid())
      and p.role = 'doctor' and not p.is_blocked
    )
  )
  with check (
    doctor_id = (select auth.uid())
    and public.is_active_user()
    and exists (
      select 1 from public.profiles p where p.id = (select auth.uid())
      and p.role = 'doctor' and not p.is_blocked
    )
  );

drop policy if exists "Patients view own appointments" on public.appointments;
drop policy if exists "Patients create appointments" on public.appointments;
drop policy if exists "Doctors and Admins update appointments" on public.appointments;
create policy "Appointment participants read appointments"
  on public.appointments for select to authenticated
  using (
    public.is_active_user()
    and (
      patient_id = (select auth.uid())
      or doctor_id = (select auth.uid())
      or public.is_admin()
    )
  );

drop policy if exists "Authenticated users read hospital settings" on public.app_settings;
create policy "Authenticated users read hospital settings"
  on public.app_settings for select to authenticated
  using (public.is_active_user());

create or replace view public.doctor_directory
with (security_barrier = true)
as
select
  p.id,
  p.name,
  p.avatar_url,
  p.created_at,
  p.is_approved,
  d.user_id,
  d.specialization,
  d.experience_years,
  d.qualification,
  d.clinic_name,
  d.consultation_fee,
  d.bio,
  d.photo_url,
  d.rating,
  d.review_count
from public.profiles p
join public.doctor_details d on d.user_id = p.id
where p.role = 'doctor' and p.is_approved and not p.is_blocked;
revoke all on public.doctor_directory from public, anon;
grant select on public.doctor_directory to authenticated;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, phone, avatar_url) on public.profiles to authenticated;
revoke all on public.doctor_details from anon, authenticated;
grant select on public.doctor_details to authenticated;
grant update (specialization, experience_years, qualification, clinic_name, consultation_fee, bio, photo_url)
  on public.doctor_details to authenticated;
revoke all on public.slots from anon, authenticated;
grant select, insert, delete on public.slots to authenticated;
grant update (date, start_time, end_time, duration_minutes) on public.slots to authenticated;
revoke all on public.appointments from anon, authenticated;
grant select on public.appointments to authenticated;
revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to authenticated;

revoke all on function public.book_appointment(uuid, uuid, text) from public, anon;
revoke all on function public.update_appointment_status(uuid, public.appointment_status) from public, anon;
revoke all on function public.admin_set_doctor_approval(uuid, boolean) from public, anon;
revoke all on function public.admin_set_user_blocked(uuid, boolean) from public, anon;
revoke all on function public.admin_set_platform_fee(numeric) from public, anon;
grant execute on function public.book_appointment(uuid, uuid, text) to authenticated;
grant execute on function public.update_appointment_status(uuid, public.appointment_status) to authenticated;
grant execute on function public.admin_set_doctor_approval(uuid, boolean) to authenticated;
grant execute on function public.admin_set_user_blocked(uuid, boolean) to authenticated;
grant execute on function public.admin_set_platform_fee(numeric) to authenticated;
