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

  // Fetch regions for dropdowns
  const { data: regions } = await supabase
    .from('regions')
    .select('id, name')
    .order('name', { ascending: true })

  // Fetch leads
  let query = supabase
    .from('registrations')
    .select(`
      *,
      groups:group_id (name)
    `)
    .neq('lead_status', 'registered')
    .order('created_at', { ascending: false })

  // Apply group filter if not admin
  if (profile.role !== 'admin') {
    if (profile.group_id) {
      query = supabase
        .from('registrations')
        .select(`
          *,
          groups:group_id (name)
        `)
        .neq('lead_status', 'registered')
        .eq('group_id', profile.group_id)
        .order('created_at', { ascending: false })
    } else {
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

      <LeadsTable leads={leads || []} userId={user.id} userGroupId={profile.group_id || null} role={profile.role} regions={regions || []} />
    </div>
  )
}
