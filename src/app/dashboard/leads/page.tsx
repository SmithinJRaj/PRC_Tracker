import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LeadsTable from '@/components/LeadsTable'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, group_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch leads
  let query = supabase
    .from('registrations')
    .select('*')
    .neq('lead_status', 'registered')
    .order('created_at', { ascending: false })

  // Apply group filter if not admin
  if (profile.role !== 'admin') {
    // If the user has no group_id, they can't see any leads (or maybe they see nothing?)
    // Let's assume if they don't have a group, they can't see leads meant for groups
    if (profile.group_id) {
      // The user clarified: "assume leads are assigned to groups strictly based on the group_id 
      // of the user who claims or creates them. If a row has no registered_by, only Admins should see it in the pool until it is claimed."
      // Actually, wait. The prompt says "Seniors and Juniors should only see leads assigned to their group_id."
      // BUT then says "If a row has no registered_by, only Admins should see it in the pool until it is claimed."
      // So if not admin, we only fetch where registered_by IN (select id from users where group_id = profile.group_id)
      
      // We can use a subquery or join for this in Supabase
      // Actually, since leads belong to users, and users belong to groups.
      query = supabase
        .from('registrations')
        .select(`
          *,
          users!inner ( group_id )
        `)
        .neq('lead_status', 'registered')
        .eq('users.group_id', profile.group_id)
        .order('created_at', { ascending: false })
    } else {
      // No group assigned, fetch nothing for non-admins
      query = supabase.from('registrations').select('*').eq('id', '00000000-0000-0000-0000-000000000000') // impossible condition
    }
  }

  const { data: leads, error } = await query

  if (error) {
    console.error('Error fetching leads:', error)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CRM & Lead Tracking</h1>
        <p className="mt-2 text-gray-600">Track and convert prospective attendees.</p>
      </div>

      <LeadsTable leads={leads || []} userId={user.id} role={profile.role} />
    </div>
  )
}
