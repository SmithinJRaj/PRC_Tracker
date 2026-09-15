-- Applied manually via the Supabase Dashboard SQL Editor on 2026-09-16.
-- This file documents what is live in production; it is not meant to be
-- re-run as-is. This ALTER POLICY updates the WITH CHECK clause of the
-- UPDATE policy created in 2026-09-15_leads_scoped_rls.sql, adding a
-- restriction that Juniors cannot reassign a lead's called_by to anyone
-- other than themselves (or leave it null/unchanged).

create or replace function lead_called_by(p_lead_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select called_by from leads where id = p_lead_id;
$$;

alter policy "Leads: update within allowed colleges, juniors can't invalidate" on leads
with check (
  (my_role() = 'admin' or college_id = any(my_allowed_college_ids()))
  and (my_role() != 'junior' or status != 'invalid')
  and (
    my_role() != 'junior'
    or called_by = auth.uid()
    or called_by is null
    or called_by = lead_called_by(id)
  )
);
