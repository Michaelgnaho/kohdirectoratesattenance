-- Run this once in your Supabase project's SQL Editor.

create extension if not exists pgcrypto;

create table if not exists directorates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  directorate_id uuid not null references directorates(id) on delete cascade,
  name text not null,
  role text not null default 'Member',
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  directorate_id uuid not null references directorates(id) on delete cascade,
  title text not null,
  date date not null,
  session_code text not null unique,
  checkin_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  present boolean not null default true,
  marked_at timestamptz not null default now(),
  unique (meeting_id, member_id)
);

-- Row Level Security: only logged-in admins can read/write these tables directly.
-- The public check-in page never talks to these tables directly — it only
-- calls the check_in() function below, which runs with elevated rights and
-- never exposes anyone's personal code to the browser.

alter table directorates enable row level security;
alter table members enable row level security;
alter table meetings enable row level security;
alter table attendance enable row level security;

create policy "admins manage directorates" on directorates
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admins manage members" on members
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admins manage meetings" on meetings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admins read and override attendance" on attendance
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Secure self check-in: takes a member's personal code and a meeting's
-- session code, validates both server-side, and records attendance.
-- Grant to anon so the public check-in page can call it without logging in.

create or replace function public.check_in(p_member_code text, p_session_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member members%rowtype;
  v_meeting meetings%rowtype;
begin
  select * into v_member from members where code = p_member_code;
  if not found then
    return json_build_object('ok', false, 'error', 'Personal code not recognized.');
  end if;

  select * into v_meeting from meetings where session_code = upper(p_session_code);
  if not found then
    return json_build_object('ok', false, 'error', 'Meeting code not recognized.');
  end if;

  if v_member.directorate_id <> v_meeting.directorate_id then
    return json_build_object('ok', false, 'error', 'That code belongs to a different directorate.');
  end if;

  if not v_meeting.checkin_open then
    return json_build_object('ok', false, 'error', 'Check-in is closed for this meeting.');
  end if;

  insert into attendance (meeting_id, member_id, present)
  values (v_meeting.id, v_member.id, true)
  on conflict (meeting_id, member_id) do update set present = true, marked_at = now();

  return json_build_object(
    'ok', true,
    'member_name', v_member.name,
    'meeting_title', v_meeting.title
  );
end;
$$;

grant execute on function public.check_in(text, text) to anon, authenticated;

-- Admin accounts: create admins in Supabase Authentication > Users (email/password
-- or magic link). Any authenticated user is treated as an admin by the policies
-- above, so only give login credentials to people who should manage the app.
