-- Applied manually via the Supabase Dashboard SQL Editor on 2026-09-15.
-- This file documents what is live in production; it is not meant to be
-- re-run as-is (CREATE POLICY will fail with "already exists" if executed
-- against a database where it's already applied — see CREATE OR REPLACE
-- POLICY is not supported in Postgres, so a real re-apply would need this
-- policy dropped first, which the script below already does defensively).

create or replace function my_group_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select group_id from users where id = auth.uid();
$$;

create or replace function my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from users where id = auth.uid();
$$;

create or replace function my_allowed_group_ids()
returns uuid[]
language sql
security definer
set search_path = public
stable
as $$
  select case
    when (select type from groups where id = my_group_id()) = 'state'
      then array(
        select id from groups
        where id = my_group_id() or parent_group_id = my_group_id()
      )
    when my_group_id() is not null
      then array[my_group_id()]
    else array[]::uuid[]
  end;
$$;

drop policy if exists "Users are viewable by everyone" on users;

create policy "Users can view own row, their group, or all if admin"
on users for select
using (
  auth.uid() = id
  or my_role() = 'admin'
  or group_id = any(my_allowed_group_ids())
);
