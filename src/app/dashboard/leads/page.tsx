import { redirect } from 'next/navigation'
import TelecallingCRM from '@/components/TelecallingCRM'
import { getAllowedGroupIds } from '@/utils/getAllowedGroupIds'
import { getCurrentProfile } from '@/utils/getCurrentProfile'

export default async function LeadsPage() {
  const { supabase, user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  const allowedGroupIds = await getAllowedGroupIds(supabase, profile)

  // Fetch base data
  let groupsQuery = supabase.from('groups').select('id, name')
  if (allowedGroupIds) {
    groupsQuery = groupsQuery.in('id', allowedGroupIds)
  }
  const { data: groups } = await groupsQuery

  let collegesQuery = supabase.from('colleges').select('id, name, group_id')
  if (allowedGroupIds) {
    collegesQuery = collegesQuery.in('group_id', allowedGroupIds)
  }
  const { data: colleges } = await collegesQuery

  let userQuery = supabase.from('users').select('id, full_name').in('role', ['junior', 'senior', 'admin'])
  if (allowedGroupIds) {
    userQuery = userQuery.in('group_id', allowedGroupIds)
  }
  const { data: users } = await userQuery

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Tracking</h1>
        <p className="mt-2 text-gray-600">Upload CSV lists and track telecalling status.</p>
      </div>

      <TelecallingCRM 
        groups={groups || []}
        colleges={colleges || []}
        users={users || []}
        currentUserId={user.id}
        currentUser={profile}
      />
    </div>
  )
}
