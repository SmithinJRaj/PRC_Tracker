import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TelecallingCRM from '@/components/TelecallingCRM'
import { getAllowedGroupIds } from '@/utils/getAllowedGroupIds'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, group_id, groups:group_id (type)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const allowedGroupIds = await getAllowedGroupIds(supabase, profile)

  // Fetch base data
  const { data: groups } = await supabase.from('groups').select('id, name')
  const { data: colleges } = await supabase.from('colleges').select('id, name, group_id')

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
