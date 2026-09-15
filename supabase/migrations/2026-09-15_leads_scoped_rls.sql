-- Applied manually via the Supabase Dashboard SQL Editor on 2026-09-15.
-- This file documents what is live in production; it is not meant to be
-- re-run as-is (CREATE POLICY will fail with "already exists" if executed
-- against a database where it's already applied).

create or replace function my_allowed_college_ids()
returns uuid[]
language sql
security definer
set search_path = public
stable
as $$
  select array(
    select id from colleges
    where group_id = any(my_allowed_group_ids())
  );
$$;

drop policy if exists "Enable all access for authenticated users" on leads;

create policy "Leads: select within allowed colleges or admin"
on leads for select
using (
  my_role() = 'admin'
  or college_id = any(my_allowed_college_ids())
);

create policy "Leads: insert within allowed colleges, not juniors"
on leads for insert
with check (
  my_role() = 'admin'
  or (my_role() = 'senior' and college_id = any(my_allowed_college_ids()))
);

create policy "Leads: update within allowed colleges, juniors can't invalidate"
on leads for update
using (
  my_role() = 'admin'
  or college_id = any(my_allowed_college_ids())
)
with check (
  (my_role() = 'admin' or college_id = any(my_allowed_college_ids()))
  and (my_role() != 'junior' or status != 'invalid')
);
