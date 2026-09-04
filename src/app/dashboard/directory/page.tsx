import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DirectoryView from '@/components/DirectoryView'

export default async function DirectoryPage() {
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

  let allowedGroupIds: string[] | null = null

  if (profile?.role === 'senior') {
    const groupId = profile.group_id
    // @ts-ignore
    const groupType = profile.groups?.type
    
    if (groupType === 'state') {
      const { data: childGroups } = await supabase.from('groups').select('id').eq('parent_group_id', groupId)
      allowedGroupIds = [groupId, ...(childGroups?.map(g => g.id) || [])]
    } else if (groupId) {
      allowedGroupIds = [groupId]
    } else {
      allowedGroupIds = []
    }
  } else if (profile?.role === 'junior') {
    if (profile.group_id) {
      allowedGroupIds = [profile.group_id]
    } else {
      allowedGroupIds = []
    }
  }

  // Fetch all groups
  const { data: allGroups } = await supabase
    .from('groups')
    .select('*')
    .order('name', { ascending: true })

  // Fetch users 
  let userQuery = supabase
    .from('users')
    .select(`
      id, 
      full_name,
      email,
      role,
      group_id,
      roll_number,
      groups:group_id (name)
    `)
    .order('full_name', { ascending: true })

  if (allowedGroupIds) {
    userQuery = userQuery.in('group_id', allowedGroupIds)
  }

  const { data: users } = await userQuery

  // Fetch registrations for Daily Performance if admin/senior
  let teamRegistrations: any[] = []
  if (profile?.role !== 'junior') {
    let regQuery = supabase
      .from('registrations')
      .select('id, attendee_name, college_name, registered_by, reg_fee, created_at')
    
    if (allowedGroupIds) {
      regQuery = regQuery.in('group_id', allowedGroupIds)
    }
    
    const { data: regs } = await regQuery
    teamRegistrations = regs || []
  }

  // Fetch attendance data for juniors if admin/senior
  let teamAttendance: any[] = []
  if (profile?.role !== 'junior') {
    const juniorIds = (users || []).filter((u: any) => u.role === 'junior').map((u: any) => u.id)
    if (juniorIds.length > 0) {
      let attQuery = supabase.from('attendance').select('user_id, date').in('user_id', juniorIds)
      const { data: att } = await attQuery
      teamAttendance = att || []
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Directory</h1>
        <p className="mt-2 text-gray-600">View team members and contact information.</p>
      </div>

      <DirectoryView 
        users={users as any || []} 
        groups={allGroups as any || []}
        currentRole={profile?.role || 'junior'}
        teamRegistrations={teamRegistrations}
        teamAttendance={teamAttendance}
      />
    </div>
  )
}
