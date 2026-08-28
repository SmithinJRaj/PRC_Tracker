import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MasterTable from '@/components/MasterTable'

export default async function MasterDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, group_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'senior') {
    redirect('/dashboard/register')
  }

  // Build query
  let query = supabase
    .from('registrations')
    .select(`
      *,
      users:registered_by (full_name, group_id),
      groups:group_id (name)
    `)
    .eq('lead_status', 'registered')
    .order('created_at', { ascending: false })

  if (profile?.role === 'senior' && profile.group_id) {
    query = supabase
      .from('registrations')
      .select(`
        *,
        users:registered_by (full_name, group_id),
        groups:group_id (name)
      `)
      .eq('lead_status', 'registered')
      .eq('group_id', profile.group_id)
      .order('created_at', { ascending: false })
  }

  const { data: registrations } = await query

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Senior Dashboard</h1>
        <p className="mt-2 text-gray-600">Master view of all registrations across the PR committee.</p>
      </div>

      <MasterTable 
        initialData={registrations || []} 
        role={profile.role} 
        currentUserId={user.id} 
      />
    </div>
  )
}
