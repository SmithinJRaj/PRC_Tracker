import { redirect } from 'next/navigation'
import AttendanceView from '@/components/AttendanceView'
import { getAllowedGroupIds } from '@/utils/getAllowedGroupIds'
import { getCurrentProfile } from '@/utils/getCurrentProfile'

export default async function AttendancePage() {
  const { supabase, user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  if (profile.role !== 'admin' && profile.role !== 'senior') {
    redirect('/dashboard')
  }

  const allowedGroupIds = await getAllowedGroupIds(supabase, profile)

  // Fetch juniors in allowed groups
  const todayDateString = new Date().toISOString().split('T')[0]

  let userQuery = supabase
    .from('users')
    .select(`
      id,
      full_name,
      roll_number,
      group_id
    `)
    .eq('role', 'junior')
    .order('full_name', { ascending: true })

  if (allowedGroupIds) {
    userQuery = userQuery.in('group_id', allowedGroupIds)
  }

  // Fetch today's attendance for those juniors
  let attendanceQuery = supabase
    .from('attendance')
    .select('user_id')
    .eq('date', todayDateString)

  // Fetch all groups to pass down to the view
  let groupsQuery = supabase
    .from('groups')
    .select('id, name, type')
    .order('name', { ascending: true })

  if (allowedGroupIds) {
    groupsQuery = groupsQuery.in('id', allowedGroupIds)
  }

  const [{ data: juniors }, { data: attendanceData }, { data: groups }] = await Promise.all([
    userQuery,
    attendanceQuery,
    groupsQuery,
  ])

  const presentUserIds = attendanceData?.map(a => a.user_id) || []

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Attendance</h1>
        <p className="mt-2 text-gray-600">Mark your juniors present for {todayDateString}.</p>
      </div>

      <AttendanceView
        juniors={juniors as any || []}
        groups={groups as any || []}
        presentUserIds={presentUserIds}
        todayDateString={todayDateString}
        isFilterLocked={allowedGroupIds !== null && allowedGroupIds.length <= 1}
      />
    </div>
  )
}
