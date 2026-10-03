-- Run ONCE in the Supabase SQL Editor (after schema.sql).
-- Replaces "every logged-in user is an admin" with a real admin list,
-- and adds a super admin who can make / remove admins from the website.

create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now()
);

-- No direct access from the browser: everything goes through the functions below.
alter table admin_users enable row level security;

create or replace function public.my_role()
returns text language sql security definer set search_path = public stable as $$
  select role from admin_users where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- Super admin only: list every admin with their email.
create or replace function public.list_admins()
returns table (user_id uuid, email text, role text)
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(my_role(), '') <> 'super_admin' then
    raise exception 'Only a super admin can do this';
  end if;
  return query
    select a.user_id, u.email::text, a.role
    from admin_users a join auth.users u on u.id = a.user_id
    order by a.role desc, u.email;
end $$;

-- Super admin only: make (p_make = true) or remove (false) an admin by email.
-- The person must already have an account (Supabase > Authentication > Users).
create or replace function public.set_admin(p_email text, p_make boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid;
begin
  if coalesce(my_role(), '') <> 'super_admin' then
    return json_build_object('ok', false, 'error', 'Only a super admin can do this.');
  end if;

  select id into v_uid from auth.users where lower(email) = lower(trim(p_email));
  if v_uid is null then
    return json_build_object('ok', false, 'error', 'No account found with that email. Create the user first in Supabase > Authentication > Users.');
  end if;

  if p_make then
    insert into admin_users (user_id, role) values (v_uid, 'admin')
    on conflict (user_id) do nothing;          -- never downgrades a super admin
  else
    if exists (select 1 from admin_users where user_id = v_uid and role = 'super_admin') then
      return json_build_object('ok', false, 'error', 'A super admin cannot be removed here.');
    end if;
    delete from admin_users where user_id = v_uid;
  end if;

  -- If the blog shares this Supabase project, keep its profiles.role in step.
  if to_regclass('public.profiles') is not null then
    begin
      execute format('update public.profiles set role = %L where id = %L',
                     case when p_make then 'admin' else 'member' end, v_uid);
    exception when others then null;
    end;
  end if;

  return json_build_object('ok', true);
end $$;

grant execute on function public.my_role(), public.is_admin(),
  public.list_admins(), public.set_admin(text, boolean) to authenticated;

-- Data tables: only people in admin_users (not every logged-in user) may touch them.
drop policy if exists "admins manage directorates" on directorates;
drop policy if exists "admins manage members" on members;
drop policy if exists "admins manage meetings" on meetings;
drop policy if exists "admins read and override attendance" on attendance;

create policy "admins manage directorates" on directorates
  for all using (is_admin()) with check (is_admin());
create policy "admins manage members" on members
  for all using (is_admin()) with check (is_admin());
create policy "admins manage meetings" on meetings
  for all using (is_admin()) with check (is_admin());
create policy "admins read and override attendance" on attendance
  for all using (is_admin()) with check (is_admin());

-- ===== MAKE YOURSELF SUPER ADMIN (edit the email, then run) =====
-- insert into admin_users (user_id, role)
-- select id, 'super_admin' from auth.users where lower(email) = lower('YOUR_EMAIL_HERE')
-- on conflict (user_id) do update set role = 'super_admin';
