import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceView from '@/components/AttendanceView'

export default async function AttendancePage() {
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

  if (profile?.role !== 'admin' && profile?.role !== 'senior') {
    redirect('/dashboard')
  }

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
  }

  // Fetch juniors in allowed groups
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

  const { data: juniors } = await userQuery

  const todayDateString = new Date().toISOString().split('T')[0]

  // Fetch today's attendance for those juniors
  let attendanceQuery = supabase
    .from('attendance')
    .select('user_id')
    .eq('date', todayDateString)

  const { data: attendanceData } = await attendanceQuery
  
  const presentUserIds = attendanceData?.map(a => a.user_id) || []

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Attendance</h1>
        <p className="mt-2 text-gray-600">Mark your juniors present for {todayDateString}.</p>
      </div>

      <AttendanceView 
        juniors={juniors as any || []} 
        presentUserIds={presentUserIds}
        todayDateString={todayDateString}
      />
    </div>
  )
}
