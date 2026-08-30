import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SummaryView from '@/components/SummaryView'

export default async function SummaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, group_id, groups:group_id (name, type)')
    .eq('id', user.id)
    .single()

  if (!['admin', 'senior'].includes(profile?.role || '')) {
    redirect('/dashboard')
  }

  let allowedGroupIds: string[] | null = null
  let allowedTabs = ['overall', 'state', 'district']

  if (profile?.role === 'senior') {
    const groupId = profile.group_id
    // @ts-ignore
    const groupType = profile.groups?.type
    
    if (groupType === 'state') {
      allowedTabs = ['overall', 'district']
      const { data: childGroups } = await supabase.from('groups').select('id').eq('parent_group_id', groupId)
      allowedGroupIds = [groupId, ...(childGroups?.map(g => g.id) || [])]
    } else {
      allowedTabs = ['overall']
      allowedGroupIds = [groupId]
    }
  }

  // Fetch registrations
  let regQuery = supabase
    .from('registrations')
    .select(`
      id,
      created_at,
      event,
      reg_fee,
      registered_by,
      group_id,
      groups:group_id (name, type)
    `)
    .eq('lead_status', 'registered')

  if (allowedGroupIds) {
    regQuery = regQuery.in('group_id', allowedGroupIds)
  }

  const { data: registrations } = await regQuery

  // Fetch users for active users count
  let userQuery = supabase
    .from('users')
    .select(`
      id, 
      group_id, 
      role,
      groups:group_id (name, type)
    `)

  if (allowedGroupIds) {
    userQuery = userQuery.in('group_id', allowedGroupIds)
  }

  const { data: users } = await userQuery

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Executive Summary</h1>
        <p className="mt-2 text-gray-600">High-level financial tracking and operational analytics.</p>
      </div>

      <SummaryView 
        registrations={registrations as any || []} 
        users={users as any || []} 
        allowedTabs={allowedTabs}
      />
    </div>
  )
}
