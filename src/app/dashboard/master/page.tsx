import { redirect } from 'next/navigation'
import MasterTable from '@/components/MasterTable'
import { getAllowedGroupIds } from '@/utils/getAllowedGroupIds'
import { getCurrentProfile } from '@/utils/getCurrentProfile'

export default async function MasterDashboard() {
  const { supabase, user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  if (profile.role !== 'admin' && profile.role !== 'senior') {
    redirect('/dashboard/register')
  }

  const allowedGroupIds = await getAllowedGroupIds(supabase, profile)

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

  if (allowedGroupIds) {
    query = query.in('group_id', allowedGroupIds)
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
