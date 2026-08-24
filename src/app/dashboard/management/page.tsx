import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UserManagement from '@/components/UserManagement'
import GroupManagement from '@/components/GroupManagement'
import TeamAssignment from '@/components/TeamAssignment'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ManagementDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'senior') {
    redirect('/dashboard/register')
  }

  const isAdmin = profile?.role === 'admin'

  // Fetch all users
  const { data: allUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true })

  // Fetch all groups
  const { data: allGroups } = await supabase
    .from('groups')
    .select('*')
    .order('name', { ascending: true })

  const seniors = allUsers?.filter(u => u.role === 'senior') || []
  const juniors = allUsers?.filter(u => u.role === 'junior') || []
  
  // Find which group the current senior belongs to (if they are a head)
  const seniorGroup = allGroups?.find(g => g.head_id === profile.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Management</h1>
        <p className="mt-2 text-gray-600">
          {isAdmin ? 'Manage users, groups, and team assignments.' : 'Assign juniors to your group.'}
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? "users" : "teams"} className="w-full">
        <TabsList>
          {isAdmin && <TabsTrigger value="users">User Roles</TabsTrigger>}
          {isAdmin && <TabsTrigger value="groups">Groups</TabsTrigger>}
          <TabsTrigger value="teams">Team Assignment</TabsTrigger>
        </TabsList>
        
        {isAdmin && (
          <>
            <TabsContent value="users">
              <UserManagement initialUsers={allUsers || []} />
            </TabsContent>
            <TabsContent value="groups">
              <GroupManagement initialGroups={allGroups || []} seniors={seniors} />
            </TabsContent>
          </>
        )}
        
        <TabsContent value="teams">
          {!isAdmin && !seniorGroup ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 mt-4">
              You are not assigned as the head of any group yet.
            </div>
          ) : (
            <TeamAssignment 
              juniors={juniors} 
              groups={allGroups || []} 
              currentRole={profile.role}
              seniorGroupId={seniorGroup?.id}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
