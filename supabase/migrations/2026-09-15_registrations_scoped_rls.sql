-- Applied manually via the Supabase Dashboard SQL Editor on 2026-09-15.
-- This file documents what is live in production; it is not meant to be
-- re-run as-is (CREATE POLICY will fail with "already exists" if executed
-- against a database where it's already applied).

drop policy if exists "Enable read access for all users" on registrations;
drop policy if exists "View registrations policy" on registrations;
drop policy if exists "Users can insert registrations" on registrations;
drop policy if exists "Dynamic update policy" on registrations;
drop policy if exists "Delete registrations policy" on registrations;

create policy "Registrations: select own, own group if senior, or all if admin"
on registrations for select
using (
  auth.uid() = registered_by
  or my_role() = 'admin'
  or (my_role() = 'senior' and group_id = any(my_allowed_group_ids()))
);

create policy "Registrations: insert own row in own group"
on registrations for insert
with check (
  auth.uid() = registered_by
  and (my_role() = 'admin' or group_id = my_group_id())
);

create policy "Registrations: update own, own group if senior, or all if admin"
on registrations for update
using (
  auth.uid() = registered_by
  or my_role() = 'admin'
  or (my_role() = 'senior' and group_id = any(my_allowed_group_ids()))
)
with check (
  auth.uid() = registered_by
  or my_role() = 'admin'
  or (my_role() = 'senior' and group_id = any(my_allowed_group_ids()))
);

create policy "Registrations: delete own group if senior, or all if admin"
on registrations for delete
using (
  my_role() = 'admin'
  or (my_role() = 'senior' and group_id = any(my_allowed_group_ids()))
);
