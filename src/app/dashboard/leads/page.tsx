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
    .select('role, group_id, groups:group_id (name, type)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  let allowedGroupIds: string[] = []
  if (profile.role === 'admin') {
    // Admin has no group constraints
  } else if (profile.role === 'senior') {
    const groupId = profile.group_id
    // @ts-ignore
    const groupType = profile.groups?.type
    
    if (groupType === 'state') {
      const { data: childGroups } = await supabase.from('groups').select('id').eq('parent_group_id', groupId)
      allowedGroupIds = [groupId, ...(childGroups?.map(g => g.id) || [])]
    } else if (groupId) {
      allowedGroupIds = [groupId]
    }
  } else if (profile.role === 'junior') {
    if (profile.group_id) {
      allowedGroupIds = [profile.group_id]
    }
  }

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

  // Fetch users for mapping in Team Claims and Assignment Dropdown
  const { data: users } = await supabase.from('users').select('id, full_name, role, group_id')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CRM & Lead Tracking</h1>
        <p className="mt-2 text-gray-600">Track and convert prospective attendees.</p>
      </div>

      <LeadsTable leads={leads || []} userId={user.id} userGroupId={profile.group_id || null} role={profile.role} users={users || []} allowedGroupIds={allowedGroupIds} />
    </div>
  )
}
