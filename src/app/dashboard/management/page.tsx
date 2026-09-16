import { redirect } from 'next/navigation'
import UserManagement from '@/components/UserManagement'
import TeamAssignment from '@/components/TeamAssignment'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAllowedGroupIds } from '@/utils/getAllowedGroupIds'
import { getCurrentProfile } from '@/utils/getCurrentProfile'

export default async function ManagementDashboard() {
  const { supabase, user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  if (profile.role !== 'admin' && profile.role !== 'senior') {
    redirect('/dashboard/register')
  }

  const isAdmin = profile?.role === 'admin'

  const allowedGroupIds = await getAllowedGroupIds(supabase, profile)

  // Fetch all users
  let allUsersQuery = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  if (allowedGroupIds) {
    allUsersQuery = allUsersQuery.in('group_id', allowedGroupIds)
  }

  // Find which group the current senior belongs to
  const seniorGroupId = profile.group_id

  async function computeSeniorGroupIds(): Promise<string[]> {
    if (!seniorGroupId) return []
    const groupType = Array.isArray(profile.groups) ? profile.groups[0]?.type : profile.groups?.type
    if (groupType === 'state') {
      const { data: childGroups } = await supabase.from('groups').select('id').eq('parent_group_id', seniorGroupId)
      return [seniorGroupId, ...(childGroups?.map(g => g.id) || [])]
    }
    return [seniorGroupId]
  }

  const [{ data: allUsers }, { data: allGroups }, seniorGroupIds] = await Promise.all([
    allUsersQuery,
    supabase.from('groups').select('*').order('name', { ascending: true }),
    computeSeniorGroupIds(),
  ])

  const members = allUsers || []

  const [teamRegistrationsResult, teamAttendanceResult] = await Promise.all([
    seniorGroupIds.length > 0
      ? supabase
          .from('registrations')
          .select('id, attendee_name, college_name, registered_by, reg_fee, created_at')
          .in('group_id', seniorGroupIds)
      : Promise.resolve({ data: [] }),
    (() => {
      if (seniorGroupIds.length === 0) return Promise.resolve({ data: [] })
      const juniorIds = (allUsers || []).filter(u => u.role === 'junior' && u.group_id && seniorGroupIds.includes(u.group_id)).map(u => u.id)
      if (juniorIds.length === 0) return Promise.resolve({ data: [] })
      return supabase.from('attendance').select('user_id, date').in('user_id', juniorIds)
    })(),
  ])

  const teamRegistrations = teamRegistrationsResult.data || []
  const teamAttendance = teamAttendanceResult.data || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Management</h1>
        <p className="mt-2 text-gray-600">
          {isAdmin ? 'Manage users and team assignments.' : 'Assign juniors to your group.'}
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? "users" : "teams"} className="w-full">
        <TabsList>
          {isAdmin && <TabsTrigger value="users">User Roles</TabsTrigger>}
          <TabsTrigger value="teams">Team Assignment</TabsTrigger>
        </TabsList>
        
        {isAdmin && (
          <TabsContent value="users">
            <UserManagement initialUsers={allUsers || []} />
          </TabsContent>
        )}
        
        <TabsContent value="teams">
          {!isAdmin && seniorGroupIds.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 mt-4">
              You are not assigned to any group yet.
            </div>
          ) : (
            <TeamAssignment 
              members={members} 
              groups={allGroups || []} 
              currentRole={profile.role}
              seniorGroupIds={seniorGroupIds}
              teamRegistrations={teamRegistrations}
              teamAttendance={teamAttendance}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
